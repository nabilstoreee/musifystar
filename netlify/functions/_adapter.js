// Wraps the existing Express-style handlers in api/*.js (which expect
// (req, res) with req.query/req.body and res.status().json()/send()/setHeader())
// so they can run unmodified as Netlify Functions.

function getCorsHeaders(headers = {}) {
    const origin = headers.origin || headers.referer;
    const host = headers['x-forwarded-host'] || headers.host;
    const corsHeaders = {
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Expose-Headers': '*'
    };

    if (origin && host) {
        try {
            const originUrl = new URL(origin);
            if (originUrl.host === host) {
                corsHeaders['Access-Control-Allow-Origin'] = originUrl.origin;
                corsHeaders['Vary'] = 'Origin';
            }
        } catch (e) {}
    } else if (host) {
        corsHeaders['Access-Control-Allow-Origin'] = `https://${host}`;
    }
    return corsHeaders;
}

function buildReqRes(event) {
    const headers = event.headers || {};
    const req = {
        method: event.httpMethod,
        query: event.queryStringParameters || {},
        body: event.body,
        headers: headers
    };

    const res = {
        statusCode: 200,
        _headers: getCorsHeaders(headers),
        _body: '',
        setHeader(key, value) { this._headers[key] = value; return this; },
        header(key, value) { this._headers[key] = value; return this; },
        status(code) { this.statusCode = code; return this; },
        json(obj) {
            this._headers['Content-Type'] = 'application/json';
            this._body = JSON.stringify(obj);
            return this;
        },
        send(data) {
            this._body = typeof data === 'string' ? data : JSON.stringify(data);
            return this;
        },
        sendStatus(code) {
            this.statusCode = code;
            return this;
        },
        end(data) {
            if (data !== undefined) this._body = data;
            return this;
        }
    };

    return { req, res };
}

function wrap(handler) {
    return async (event) => {
        const headers = event.headers || {};
        const origin = headers.origin || headers.referer;
        const host = headers['x-forwarded-host'] || headers.host;

        if (origin && host) {
            try {
                const originUrl = new URL(origin);
                if (originUrl.host !== host) {
                    return {
                        statusCode: 403,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: false, message: 'Access denied: Cross-origin requests from external domains are disabled.' })
                    };
                }
            } catch (e) {}
        }

        if (event.httpMethod === 'OPTIONS') {
            return {
                statusCode: 200,
                headers: getCorsHeaders(headers),
                body: ''
            };
        }
        const { req, res } = buildReqRes(event);
        try {
            await handler(req, res);
        } catch (err) {
            return {
                statusCode: 500,
                headers: {
                    'Content-Type': 'application/json',
                    ...getCorsHeaders(headers)
                },
                body: JSON.stringify({ status: false, message: 'Internal error: ' + err.message })
            };
        }
        return {
            statusCode: res.statusCode || 200,
            headers: res._headers,
            body: res._body || ''
        };
    };
}

module.exports = { wrap };
