// Runs on Netlify's Edge (Deno) runtime instead of a regular Lambda Function
// because Lambda-based functions buffer the whole response in memory with a
// small payload limit, which breaks playback of longer tracks and Range
// (seek) requests. This streams bytes directly from origin to client.

export default async (request) => {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');
    if (!targetUrl) return new Response('Missing url parameter', { status: 400 });

    let parsed;
    try {
        parsed = new URL(targetUrl);
    } catch (e) {
        return new Response('Invalid url parameter', { status: 400 });
    }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        return new Response('Invalid url protocol', { status: 400 });
    }

    const upstreamHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/149.0.0.0 Safari/537.36'
    };
    const range = request.headers.get('range');
    if (range) upstreamHeaders['Range'] = range;

    let upstream;
    try {
        upstream = await fetch(targetUrl, { headers: upstreamHeaders, redirect: 'follow' });
    } catch (err) {
        return new Response('Proxy error: ' + err.message, { status: 502 });
    }

    const respHeaders = new Headers();
    ['content-type', 'content-length', 'accept-ranges', 'content-range'].forEach((h) => {
        const v = upstream.headers.get(h);
        if (v) respHeaders.set(h, v);
    });
    if (!respHeaders.has('accept-ranges')) respHeaders.set('accept-ranges', 'bytes');

    return new Response(upstream.body, { status: upstream.status, headers: respHeaders });
};

export const config = { path: '/api/proxy-audio' };
