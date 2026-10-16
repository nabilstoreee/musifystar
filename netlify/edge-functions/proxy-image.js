// Same-origin image proxy. Needed so the cover artwork can be read with
// canvas.getImageData() for background color extraction — images loaded
// directly from i.ytimg.com/googleusercontent.com are cross-origin and those
// CDNs don't reliably send CORS headers, so the canvas gets "tainted" and
// getImageData() throws, silently breaking color extraction. Fetching through
// our own domain first sidesteps CORS entirely (same-origin request).

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

    let upstream;
    try {
        upstream = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/149.0.0.0 Safari/537.36'
            },
            redirect: 'follow'
        });
    } catch (err) {
        return new Response('Proxy error: ' + err.message, { status: 502 });
    }

    if (!upstream.ok) {
        return new Response('Upstream error', { status: upstream.status });
    }

    const respHeaders = new Headers();
    const contentType = upstream.headers.get('content-type');
    respHeaders.set('content-type', contentType && contentType.startsWith('image/') ? contentType : 'image/jpeg');
    respHeaders.set('cache-control', 'public, max-age=86400');
    respHeaders.set('access-control-allow-origin', '*');

    return new Response(upstream.body, { status: 200, headers: respHeaders });
};

export const config = { path: '/api/proxy-image' };
