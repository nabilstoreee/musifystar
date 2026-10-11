const dns = require('dns');
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}
const express = require('express');
const path = require('path');
const https = require('https');
const http = require('http');
const fs = require('fs');

const ipv4HttpsAgent = new https.Agent({ family: 4, keepAlive: true, maxSockets: 50 });
const ipv4HttpAgent = new http.Agent({ family: 4, keepAlive: true, maxSockets: 50 });

const app = express();

// Disable Express fingerprinting header for security
app.disable('x-powered-by');

// Global Security Headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

// Known Scraper / GetWeb / Site Ripper / Vulnerability Prober signatures
const FORBIDDEN_BOT_PATTERNS = [
    /getweb/i,
    /webget/i,
    /httrack/i,
    /teleport/i,
    /offline\s*explorer/i,
    /webcopier/i,
    /site-sucker/i,
    /sitesucker/i,
    /pagegrabber/i,
    /wget/i,
    /python-requests/i,
    /python-urllib/i,
    /aiohttp/i,
    /scrapy/i,
    /sqlmap/i,
    /nikto/i,
    /acunetix/i,
    /masscan/i,
    /dirbuster/i,
    /gobuster/i,
    /nmap/i,
    /zgrab/i,
    /censys/i,
    /burpcollaborator/i,
    /libwww-perl/i
];

// Strict Block: prevent any client/DevTools probe/getweb scraper from reading server files or secrets
app.use((req, res, next) => {
    const rawPath = (req.path || '').toLowerCase();
    const rawUrl = (req.url || '').toLowerCase();
    const ua = (req.headers['user-agent'] || '').toLowerCase();
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';
    const isLocalhost = ip.includes('127.0.0.1') || ip.includes('::1') || ip.includes('localhost');

    // 1. Block Automated Site Downloaders & Scrapers (getweb, httrack, scrapy, python bots, etc.)
    if (ua) {
        for (const pattern of FORBIDDEN_BOT_PATTERNS) {
            if (pattern.test(ua)) {
                return res.status(403).json({
                    status: false,
                    message: 'Akses ditolak: Bot pengunduh situs (scrapers/getweb) dilarang mengakses berkas sistem.'
                });
            }
        }
        // Block external curl requests (allow internal curl for localhost dev tests/health checks)
        if (!isLocalhost && (/^curl\//i.test(ua) || ua.includes('curl/'))) {
            return res.status(403).json({
                status: false,
                message: 'Akses ditolak: Permintaan via curl eksternal dinonaktifkan demi keamanan.'
            });
        }
    }

    // 2. Block Path Traversal and encoded attack payloads
    try {
        const decodedUrl = decodeURIComponent(rawUrl);
        if (decodedUrl.includes('..') || rawUrl.includes('..') || rawUrl.includes('%2e%2e')) {
            return res.status(403).json({
                status: false,
                message: 'Akses ditolak: Upaya path traversal diblokir oleh sistem.'
            });
        }
    } catch(e) {}

    // 3. Strict Block for system files, database dumps, json data files, and internal code
    const isSensitive = 
        rawPath.startsWith('/.') ||
        rawPath.includes('/.env') ||
        rawPath.endsWith('.env') ||
        (rawPath.endsWith('.json') && !rawPath.startsWith('/manifest.json')) ||
        rawPath.includes('community_playlists') ||
        rawPath.includes('verified_sections') ||
        rawPath.includes('stream_cache') ||
        rawPath.includes('package') ||
        rawPath.endsWith('.sql') ||
        rawPath.endsWith('.md') ||
        rawPath.endsWith('.yml') ||
        rawPath.endsWith('.yaml') ||
        rawPath.endsWith('.ts') ||
        rawPath.endsWith('.map') ||
        rawPath.endsWith('.lock') ||
        rawPath.endsWith('.sh') ||
        rawPath.endsWith('.bak') ||
        rawPath.endsWith('.conf') ||
        rawPath.endsWith('.config') ||
        rawPath === '/server.js' ||
        (rawPath.startsWith('/api/') && rawPath.endsWith('.js'));

    if (isSensitive) {
        return res.status(403).json({
            status: false,
            message: 'Akses ditolak: Berkas sistem dan konfigurasi database MusifyStar terproteksi penuh oleh server.'
        });
    }
    next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Function to validate and return allowed origin matching current domain/host
function getAllowedOrigin(req) {
    const origin = req.headers.origin || req.headers.referer;
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    if (origin) {
        try {
            const originUrl = new URL(origin);
            if (host && originUrl.host === host) {
                return originUrl.origin;
            } else {
                return null;
            }
        } catch (e) {
            return null;
        }
    }
    if (host) {
        const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
        return `${proto}://${host}`;
    }
    return null;
}

// Strict CORS middleware: Disable CORS for external domains (same-origin only)
app.use((req, res, next) => {
    const origin = req.headers.origin || req.headers.referer;
    const host = req.headers['x-forwarded-host'] || req.headers.host;

    // Block cross-origin requests to /api/ from external domains
    if (origin && host && req.path.startsWith('/api/')) {
        try {
            const originUrl = new URL(origin);
            if (originUrl.host !== host) {
                if (req.method === 'OPTIONS') {
                    return res.status(403).end();
                }
                return res.status(403).json({
                    status: false,
                    message: 'Access denied: Cross-origin requests from external domains are disabled.'
                });
            }
        } catch (e) {}
    }

    const allowedOrigin = getAllowedOrigin(req);
    if (allowedOrigin) {
        res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
        res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Auth-Token, X-Token, X-User-Id, X-User-Name, X-User-Email');
    res.setHeader('Access-Control-Expose-Headers', '*');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// API Routes
app.all('/api/search', require('./api/search.js'));
app.all('/api/lyrics', require('./api/lyrics.js'));
app.all('/api/lyrics1', require('./api/lyrics1.js'));
app.all('/api/lyrics2', require('./api/lyrics2.js'));
app.all('/api/artist', require('./api/artist.js'));
app.all('/api/album', require('./api/album.js'));
app.all('/api/suggest', require('./api/suggest.js'));
app.all('/api/ytplay', require('./api/ytplay.js'));
app.all('/api/translate', require('./api/translate.js'));
app.all('/api/transcribe', require('./api/transcribe.js'));
app.all('/api/admin-auth', require('./api/admin-auth.js'));
app.all('/api/feedback', require('./api/feedback.js'));
app.all('/api/analytics', require('./api/analytics.js'));
app.all('/api/global-stats', require('./api/analytics.js'));
app.all('/api/theme', require('./api/theme.js'));
app.all('/api/broadcast', require('./api/broadcast.js'));
app.all('/api/version', require('./api/version.js'));
app.all('/api/site-update', require('./api/site-update.js'));
app.all('/api/user-auth', require('./api/user-auth.js'));
app.all('/api/home-sections', require('./api/home-sections.js'));
app.all('/api/payment-config', require('./api/payment-config.js'));
app.all('/api/messages', require('./api/messages.js'));
app.all('/api/global-chat', require('./api/global-chat.js'));
app.all('/api/admin-chat', require('./api/admin-chat.js'));
app.all('/api/avatars', require('./api/avatars.js'));
app.all('/api/borders', require('./api/borders.js'));
app.all('/api/vouchers', require('./api/vouchers.js'));

// Proxy audio needs to stream in node, bypassing edge function
app.get('/api/proxy-audio', (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send('Missing url parameter');
    
    let parsed;
    try {
        parsed = new URL(targetUrl);
    } catch (e) {
        return res.status(400).send('Invalid url parameter');
    }

    const options = {
        agent: parsed.protocol === 'https:' ? ipv4HttpsAgent : ipv4HttpAgent,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/149.0.0.0 Safari/537.36'
        }
    };
    if (req.headers.range) {
        options.headers['Range'] = req.headers.range;
    }

    const client = parsed.protocol === 'https:' ? https : http;
    const proxyReq = client.get(targetUrl, options, (proxyRes) => {
        // Handle potential redirects
        if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
            req.query.url = proxyRes.headers.location;
            return app._router.handle(req, res); // naive redirect following
        }

        res.status(proxyRes.statusCode);
        const allowedOrigin = getAllowedOrigin(req);
        if (allowedOrigin) {
            res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
            res.setHeader('Vary', 'Origin');
        }
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        res.setHeader('Access-Control-Expose-Headers', '*');
        const passthrough = ['content-type', 'content-length', 'accept-ranges', 'content-range'];
        passthrough.forEach(h => {
            if (proxyRes.headers[h]) res.setHeader(h, proxyRes.headers[h]);
        });
        if (!res.getHeader('accept-ranges')) res.setHeader('Accept-Ranges', 'bytes');

        if (req.query.download === '1' || req.query.filename) {
            res.setHeader('Content-Type', 'audio/mpeg');
            let fn = (req.query.filename || 'track.mp3').replace(/[\r\n"']/g, '').replace(/[^a-zA-Z0-9_\-\. ]/g, '_').trim();
            if (!fn.toLowerCase().endsWith('.mp3')) fn += '.mp3';
            res.setHeader('Content-Disposition', `attachment; filename="${fn}"; filename*=UTF-8''${encodeURIComponent(fn)}`);
        }
        
        proxyRes.pipe(res);
    });
    
    proxyReq.on('error', (err) => {
        if (!res.headersSent) {
            res.status(500).send('Proxy error: ' + err.message);
        }
    });
});

// Dedicated QRIS download handler ensuring proper PNG MIME type and attachment headers
app.get(['/api/download-qris', '/download-qris'], (req, res) => {
    const customQris = path.join(__dirname, 'public', 'qris_custom.png');
    const defaultQris = path.join(__dirname, 'public', 'qris.png');
    const qrisPath = fs.existsSync(customQris) ? customQris : defaultQris;
    if (fs.existsSync(qrisPath)) {
        const dlName = (req.query.filename || 'QRIS-MusifyStar.png').replace(/[^a-zA-Z0-9._-]/g, '');
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', `attachment; filename="${dlName}"`);
        return res.sendFile(qrisPath);
    }
    return res.status(404).send('Not found');
});

// Serve /qris.png with image/png and optional download attachment
app.get('/qris.png', (req, res) => {
    const customQris = path.join(__dirname, 'public', 'qris_custom.png');
    const defaultQris = path.join(__dirname, 'public', 'qris.png');
    const qrisPath = fs.existsSync(customQris) ? customQris : defaultQris;
    if (fs.existsSync(qrisPath)) {
        res.setHeader('Content-Type', 'image/png');
        if (req.query.download === '1') {
            const dlName = (req.query.filename || 'QRIS-MusifyStar.png').replace(/[^a-zA-Z0-9._-]/g, '');
            res.setHeader('Content-Disposition', `attachment; filename="${dlName}"`);
        }
        return res.sendFile(qrisPath);
    }
    return res.status(404).send('Not found');
});

// Static files (from public)
app.use(express.static(path.join(__dirname, 'public'), {
    dotfiles: 'deny'
}));

// API Fallback handler (Return JSON for /api/ routes instead of index.html)
app.use((req, res, next) => {
    if (req.path.startsWith('/api/') || req.path === '/api') {
        return res.status(404).json({
            status: false,
            message: `API endpoint '${req.originalUrl}' tidak ditemukan.`
        });
    }
    next();
});

// Fallback for SPA routing
app.use((req, res) => {
    const filePath = path.join(__dirname, 'public', 'index.html');
    
    if (req.path.startsWith('/play/')) {
        const videoId = req.path.split('/play/')[1];
        if (videoId) {
            const cleanVideoId = videoId.split('?')[0].split('/')[0];
            const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
            const qTitle = reqUrl.searchParams.get('title');
            const qArtist = reqUrl.searchParams.get('artist');
            const qCover = reqUrl.searchParams.get('cover') || reqUrl.searchParams.get('thumb');

            const coverUrl = qCover || `https://i.ytimg.com/vi/${cleanVideoId}/hqdefault.jpg`;
            const playTitle = qTitle ? (qArtist ? `${qTitle} - ${qArtist}` : qTitle) : `Dengarkan Musik - MusifyStar`;
            const playDesc = `Dengarkan ${qTitle || 'lagu favoritmu'} di MusifyStar Web Music Player`;

            return fs.readFile(filePath, 'utf8', (err, html) => {
                if (err) return res.sendFile(filePath);
                
                let updatedHtml = html
                    .replace(/<title>.*?<\/title>/gi, `<title>${playTitle}</title>`)
                    .replace(/<meta property="og:title" content=".*?"\s*\/?>/gi, `<meta property="og:title" content="${playTitle}">`)
                    .replace(/<meta property="og:description" content=".*?"\s*\/?>/gi, `<meta property="og:description" content="${playDesc}">`)
                    .replace(/<meta property="og:image" content=".*?"\s*\/?>/gi, `<meta property="og:image" content="${coverUrl}">`)
                    .replace(/<meta property="og:image:secure_url" content=".*?"\s*\/?>/gi, `<meta property="og:image:secure_url" content="${coverUrl}">`)
                    .replace(/<meta property="og:url" content=".*?"\s*\/?>/gi, `<meta property="og:url" content="${req.protocol}://${req.get('host')}${req.originalUrl}">`)
                    .replace(/<meta name="twitter:title" content=".*?"\s*\/?>/gi, `<meta name="twitter:title" content="${playTitle}">`)
                    .replace(/<meta name="twitter:description" content=".*?"\s*\/?>/gi, `<meta name="twitter:description" content="${playDesc}">`)
                    .replace(/<meta name="twitter:image" content=".*?"\s*\/?>/gi, `<meta name="twitter:image" content="${coverUrl}">`)
                    .replace(/<meta name="twitter:image:src" content=".*?"\s*\/?>/gi, `<meta name="twitter:image:src" content="${coverUrl}">`)
                    .replace(/<link rel="icon".*?>/gi, `<link rel="icon" type="image/jpeg" href="${coverUrl}">`)
                    .replace(/<link rel="apple-touch-icon".*?>/gi, `<link rel="apple-touch-icon" href="${coverUrl}">`);

                res.setHeader('Content-Type', 'text/html');
                return res.send(updatedHtml);
            });
        }
    }

    if (req.path.startsWith('/artist/')) {
        const artistId = req.path.split('/artist/')[1];
        if (artistId) {
            const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
            const qName = reqUrl.searchParams.get('name') || reqUrl.searchParams.get('title');
            const qCover = reqUrl.searchParams.get('cover') || reqUrl.searchParams.get('thumb');

            const pageTitle = qName ? `${qName} (Artist) - MusifyStar` : `Artist - MusifyStar`;
            const pageDesc = qName ? `Dengarkan lagu & album terbaik dari ${qName} di MusifyStar` : `Dengarkan lagu & album dari artist favoritmu di MusifyStar`;
            const coverUrl = qCover || `https://www.gobox.my.id/file/R0ym4wqfznmp.png`;

            return fs.readFile(filePath, 'utf8', (err, html) => {
                if (err) return res.sendFile(filePath);
                
                let updatedHtml = html
                    .replace(/<title>.*?<\/title>/gi, `<title>${pageTitle}</title>`)
                    .replace(/<meta property="og:title" content=".*?"\s*\/?>/gi, `<meta property="og:title" content="${pageTitle}">`)
                    .replace(/<meta property="og:description" content=".*?"\s*\/?>/gi, `<meta property="og:description" content="${pageDesc}">`)
                    .replace(/<meta property="og:image" content=".*?"\s*\/?>/gi, `<meta property="og:image" content="${coverUrl}">`)
                    .replace(/<meta property="og:image:secure_url" content=".*?"\s*\/?>/gi, `<meta property="og:image:secure_url" content="${coverUrl}">`)
                    .replace(/<meta property="og:url" content=".*?"\s*\/?>/gi, `<meta property="og:url" content="${req.protocol}://${req.get('host')}${req.originalUrl}">`)
                    .replace(/<meta name="twitter:title" content=".*?"\s*\/?>/gi, `<meta name="twitter:title" content="${pageTitle}">`)
                    .replace(/<meta name="twitter:description" content=".*?"\s*\/?>/gi, `<meta name="twitter:description" content="${pageDesc}">`)
                    .replace(/<meta name="twitter:image" content=".*?"\s*\/?>/gi, `<meta name="twitter:image" content="${coverUrl}">`)
                    .replace(/<meta name="twitter:image:src" content=".*?"\s*\/?>/gi, `<meta name="twitter:image:src" content="${coverUrl}">`)
                    .replace(/<link rel="icon".*?>/gi, `<link rel="icon" type="image/jpeg" href="${coverUrl}">`)
                    .replace(/<link rel="apple-touch-icon".*?>/gi, `<link rel="apple-touch-icon" href="${coverUrl}">`);

                res.setHeader('Content-Type', 'text/html');
                return res.send(updatedHtml);
            });
        }
    }

    if (req.path.startsWith('/album/')) {
        const albumId = req.path.split('/album/')[1];
        if (albumId) {
            const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
            const qTitle = reqUrl.searchParams.get('title');
            const qArtist = reqUrl.searchParams.get('artist');
            const qCover = reqUrl.searchParams.get('cover') || reqUrl.searchParams.get('thumb');

            const pageTitle = qTitle ? (qArtist ? `${qTitle} - ${qArtist} (Album) - MusifyStar` : `${qTitle} (Album) - MusifyStar`) : `Album - MusifyStar`;
            const pageDesc = qTitle ? `Dengarkan album ${qTitle} di MusifyStar` : `Dengarkan album favoritmu di MusifyStar`;
            const coverUrl = qCover || `https://www.gobox.my.id/file/R0ym4wqfznmp.png`;

            return fs.readFile(filePath, 'utf8', (err, html) => {
                if (err) return res.sendFile(filePath);
                
                let updatedHtml = html
                    .replace(/<title>.*?<\/title>/gi, `<title>${pageTitle}</title>`)
                    .replace(/<meta property="og:title" content=".*?"\s*\/?>/gi, `<meta property="og:title" content="${pageTitle}">`)
                    .replace(/<meta property="og:description" content=".*?"\s*\/?>/gi, `<meta property="og:description" content="${pageDesc}">`)
                    .replace(/<meta property="og:image" content=".*?"\s*\/?>/gi, `<meta property="og:image" content="${coverUrl}">`)
                    .replace(/<meta property="og:image:secure_url" content=".*?"\s*\/?>/gi, `<meta property="og:image:secure_url" content="${coverUrl}">`)
                    .replace(/<meta property="og:url" content=".*?"\s*\/?>/gi, `<meta property="og:url" content="${req.protocol}://${req.get('host')}${req.originalUrl}">`)
                    .replace(/<meta name="twitter:title" content=".*?"\s*\/?>/gi, `<meta name="twitter:title" content="${pageTitle}">`)
                    .replace(/<meta name="twitter:description" content=".*?"\s*\/?>/gi, `<meta name="twitter:description" content="${pageDesc}">`)
                    .replace(/<meta name="twitter:image" content=".*?"\s*\/?>/gi, `<meta name="twitter:image" content="${coverUrl}">`)
                    .replace(/<meta name="twitter:image:src" content=".*?"\s*\/?>/gi, `<meta name="twitter:image:src" content="${coverUrl}">`)
                    .replace(/<link rel="icon".*?>/gi, `<link rel="icon" type="image/jpeg" href="${coverUrl}">`)
                    .replace(/<link rel="apple-touch-icon".*?>/gi, `<link rel="apple-touch-icon" href="${coverUrl}">`);

                res.setHeader('Content-Type', 'text/html');
                return res.send(updatedHtml);
            });
        }
    }

    // Default HTML response (uses /logo.png as favicon for home)
    fs.readFile(filePath, 'utf8', (err, html) => {
        if (err) return res.sendFile(filePath);
        res.setHeader('Content-Type', 'text/html');
        return res.send(html);
    });
});

const port = process.env.PORT || 3000;
if (require.main === module || !process.env.VERCEL) {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

module.exports = app;
