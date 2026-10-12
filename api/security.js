const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const storage = require('./storage.js');

const VIP_INTEGRITY_SECRET = process.env.VIP_SECRET || 'musifystar_vip_integrity_hmac_secret_2026_super_key';
const BANNED_IPS_FILE = '.banned_ips.json';

// SHA-256 Hashes of Exempt / Immune Administrator IP Addresses and Subnets
// Ensures administrator IPs are NEVER revealed in plain text anywhere in files or code
const IMMUNE_IP_HASHES = new Set([
    '9822b6fd8f7c14e83f3a8a893cb232628c5fb4aeacfec07ca5714407f9e530d8',
    '759fad1ccf96916d1677ea6b0e8c9930c414d4f7a6583a01262b346a9bafec0f',
    '7fe3d135013179b033fd221e811796ff3907c3ac50a7ed34f7b23ec4d210f930',
    '2e01bb988a00d929e551742f0239b7c729cb8bc653dc938528828faaa245a2bb',
    '05d5e60892adb0f6edf0522b0fc83f206200e5b4a8b0aab3651c4b8743f52e5b'
]);

const DYNAMIC_IMMUNE_FILE = '.admin_immune_hashes.json';
const DYNAMIC_IMMUNE_HASHES = new Set();

// Load previously remembered admin immune hashes from storage / disk
try {
    const diskPath = path.join(__dirname, '..', DYNAMIC_IMMUNE_FILE);
    if (fs.existsSync(diskPath)) {
        const raw = fs.readFileSync(diskPath, 'utf8');
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
            list.forEach(h => {
                if (typeof h === 'string' && h.length === 64) DYNAMIC_IMMUNE_HASHES.add(h);
            });
        }
    }
} catch (e) {}

// Also sync with PostgreSQL in background
try {
    storage.readDataAsync(DYNAMIC_IMMUNE_FILE, []).then(list => {
        if (Array.isArray(list)) {
            list.forEach(h => {
                if (typeof h === 'string' && h.length === 64) DYNAMIC_IMMUNE_HASHES.add(h);
            });
        }
    }).catch(() => {});
} catch (e) {}

// Normalize IP address (strips ::ffff:, maps local loopback, cleans whitespace)
function normalizeIp(ip) {
    if (!ip) return '127.0.0.1';
    let clean = String(ip).trim().toLowerCase().replace(/^::ffff:/, '');
    if (clean.includes(',')) {
        clean = clean.split(',')[0].trim().replace(/^::ffff:/, '');
    }
    if (clean === '::1' || clean === 'localhost') clean = '127.0.0.1';
    return clean;
}

// Check if an IP has Anti-Ban Immunity
function isImmuneIp(ip) {
    if (!ip) return false;
    const clean = normalizeIp(ip);
    if (!clean) return false;
    if (clean === '127.0.0.1' || clean === '::1' || clean === 'localhost') return true;

    try {
        const fullHash = crypto.createHash('sha256').update(clean).digest('hex');
        if (IMMUNE_IP_HASHES.has(fullHash) || DYNAMIC_IMMUNE_HASHES.has(fullHash)) return true;

        if (clean.includes(':')) {
            const parts = clean.split(':');
            if (parts.length >= 4) {
                const prefix = parts.slice(0, 4).join(':');
                const prefixHash = crypto.createHash('sha256').update(prefix).digest('hex');
                if (IMMUNE_IP_HASHES.has(prefixHash) || DYNAMIC_IMMUNE_HASHES.has(prefixHash)) return true;
            }
        }
    } catch(e) {}
    return false;
}

// Dynamically whitelist an IP (e.g. when authenticated as Admin) and persist it
function addImmuneIp(ip) {
    if (!ip) return;
    const clean = normalizeIp(ip);
    if (!clean) return;
    let modified = false;
    try {
        const fullHash = crypto.createHash('sha256').update(clean).digest('hex');
        if (!DYNAMIC_IMMUNE_HASHES.has(fullHash)) {
            DYNAMIC_IMMUNE_HASHES.add(fullHash);
            modified = true;
        }
        if (clean.includes(':')) {
            const parts = clean.split(':');
            if (parts.length >= 4) {
                const prefix = parts.slice(0, 4).join(':');
                const prefixHash = crypto.createHash('sha256').update(prefix).digest('hex');
                if (!DYNAMIC_IMMUNE_HASHES.has(prefixHash)) {
                    DYNAMIC_IMMUNE_HASHES.add(prefixHash);
                    modified = true;
                }
            }
        }

        if (modified) {
            const arr = Array.from(DYNAMIC_IMMUNE_HASHES);
            storage.writeDataAsync(DYNAMIC_IMMUNE_FILE, arr).catch(() => {});
            try {
                const diskPath = path.join(__dirname, '..', DYNAMIC_IMMUNE_FILE);
                fs.writeFileSync(diskPath, JSON.stringify(arr, null, 2), 'utf8');
            } catch(e) {}
        }
    } catch(e) {}
}

// Read banned IPs from storage with disk fallback
function readBannedIpsSync() {
    let result = {};
    try {
        const data = storage.readData(BANNED_IPS_FILE, {});
        if (data && typeof data === 'object') result = data;
    } catch (e) {}

    if (Object.keys(result).length === 0) {
        try {
            const diskPath = path.join(__dirname, '..', BANNED_IPS_FILE);
            if (fs.existsSync(diskPath)) {
                const raw = fs.readFileSync(diskPath, 'utf8');
                result = JSON.parse(raw);
            }
        } catch (e) {}
    }

    // Filter out any immune IPs that might have been mistakenly recorded
    let cleaned = false;
    for (const key of Object.keys(result)) {
        if (isImmuneIp(key)) {
            delete result[key];
            cleaned = true;
        }
    }
    if (cleaned) {
        writeBannedIpsAsync(result).catch(() => {});
    }

    return result;
}

async function readBannedIpsAsync() {
    let result = {};
    try {
        const data = await storage.readDataAsync(BANNED_IPS_FILE, {});
        if (data && typeof data === 'object') result = data;
    } catch (e) {}

    if (Object.keys(result).length === 0) {
        result = readBannedIpsSync();
    }

    let cleaned = false;
    for (const key of Object.keys(result)) {
        if (isImmuneIp(key)) {
            delete result[key];
            cleaned = true;
        }
    }
    if (cleaned) {
        await writeBannedIpsAsync(result);
    }

    return result;
}

async function writeBannedIpsAsync(ipsMap) {
    const safeMap = {};
    if (ipsMap && typeof ipsMap === 'object') {
        for (const [k, v] of Object.entries(ipsMap)) {
            if (!isImmuneIp(k)) {
                safeMap[k] = v;
            }
        }
    }

    try {
        await storage.writeDataAsync(BANNED_IPS_FILE, safeMap);
    } catch (e) {
        console.error('[SECURITY] Error saving banned IPs to storage:', e.message);
    }
    try {
        const diskPath = path.join(__dirname, '..', BANNED_IPS_FILE);
        fs.writeFileSync(diskPath, JSON.stringify(safeMap, null, 2), 'utf8');
    } catch (e) {}
}

// Check if IP is banned
function getIpBanStatus(ip, bannedMap) {
    const cleanIp = normalizeIp(ip);
    if (!cleanIp || isImmuneIp(cleanIp)) {
        return { isIpBanned: false, immune: true };
    }

    const map = bannedMap || readBannedIpsSync();
    const matchKey = Object.keys(map).find(k => {
        let cleanK = normalizeIp(k);
        if (!cleanK || isImmuneIp(cleanK)) return false;
        return cleanK === cleanIp || (cleanK.length > 8 && cleanIp === cleanK);
    });

    if (!matchKey) return { isIpBanned: false };

    const rec = map[matchKey] || {};
    // Check if ban is temporary and expired
    if (rec.banType === 'temporary' && rec.banExpiresAt) {
        if (new Date(rec.banExpiresAt).getTime() <= Date.now()) {
            delete map[matchKey];
            writeBannedIpsAsync(map).catch(() => {});
            return { isIpBanned: false };
        }
    }

    return {
        isIpBanned: true,
        ip: rec.ip || cleanIp,
        banType: rec.banType || 'permanent',
        banReason: rec.banReason || 'Alamat IP Anda telah diblokir secara permanen oleh sistem keamanan.',
        banExpiresAt: rec.banExpiresAt || null,
        banDurationDays: rec.banDurationDays || null,
        createdAt: rec.createdAt || new Date().toISOString()
    };
}

// Add IP to permanent ban list
async function banIp(ip, reason, extraDetails = {}) {
    const cleanIp = normalizeIp(ip);
    if (!cleanIp || cleanIp === '127.0.0.1' || cleanIp === 'localhost' || isImmuneIp(cleanIp)) {
        console.warn(`[SECURITY] Skipping immune / loopback IP ban: ${cleanIp}`);
        return { isIpBanned: false, skipped: true, immune: true };
    }

    const currentBanned = await readBannedIpsAsync();
    currentBanned[cleanIp] = {
        ip: cleanIp,
        banType: 'permanent',
        banReason: reason || 'Pelanggaran Keamanan: Percobaan manipulasi status akun VIP via DevTools / Scraper.',
        banExpiresAt: null,
        createdAt: new Date().toISOString(),
        details: extraDetails
    };

    await writeBannedIpsAsync(currentBanned);
    console.warn(`[SECURITY ALERT] IP BANNED PERMANENTLY: ${cleanIp} — Reason: ${reason}`);

    return {
        isIpBanned: true,
        ip: cleanIp,
        banType: 'permanent',
        banReason: currentBanned[cleanIp].banReason
    };
}

// Generate Cryptographic HMAC VIP Signature
function generateVipSignature(userId, vipTier, vipExpiresAt) {
    if (!userId) return '';
    const tier = String(vipTier || 'none').toLowerCase().trim();
    const exp = vipExpiresAt ? Number(vipExpiresAt) : 0;
    const payload = `uid:${userId}|tier:${tier}|exp:${exp}`;
    return crypto.createHmac('sha256', VIP_INTEGRITY_SECRET).update(payload).digest('hex');
}

// Verify Cryptographic HMAC VIP Signature
function verifyVipSignature(userId, vipTier, vipExpiresAt, signature) {
    if (!userId || !signature) return false;
    const expected = generateVipSignature(userId, vipTier, vipExpiresAt);
    try {
        return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    } catch (e) {
        return false;
    }
}

// Forbidden Scraper, Ripper, GetWeb, and Vulnerability Prober signatures
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
    /libwww-perl/i,
    /go-http-client/i,
    /phantomjs/i,
    /headlesschrome/i
];

function isBotOrScraper(userAgent) {
    if (!userAgent) return false;
    const ua = String(userAgent).toLowerCase();
    for (const pattern of FORBIDDEN_BOT_PATTERNS) {
        if (pattern.test(ua)) return true;
    }
    return false;
}

// Serve Corrupted / Hollow Empty Dummy File for Scrapers & Banned IPs
// As requested: "dikasih filee acakkk dalamnya kosong biar ga bisa di otak atik"
function serveCorruptedDummyFile(res) {
    // Generate scrambled headers and empty/corrupted hollow payload
    const dummyLengths = [0, 4, 8];
    const chosenLen = dummyLengths[Math.floor(Math.random() * dummyLengths.length)];
    const dummyBytes = chosenLen === 0 ? Buffer.alloc(0) : Buffer.from([0x00, 0xFF, 0x00, 0x00]);

    res.setHeader('Content-Type', 'application/octet-stream; charset=binary');
    res.setHeader('Content-Disposition', 'attachment; filename="data.bin"');
    res.setHeader('X-Content-Encoded', 'scrambled-zero');
    res.setHeader('X-Security-Checksum', crypto.randomBytes(16).toString('hex'));
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Content-Length', dummyBytes.length);
    res.status(200);
    return res.end(dummyBytes);
}

// Full Screen Locked HTML Page for Banned IP Browsers
function getIpBannedHtmlPage(clientIp, banDetails = {}) {
    const reason = banDetails.banReason || 'Pelanggaran Keamanan: Percobaan manipulasi status akun VIP atau akses ilegal.';
    const dateStr = banDetails.createdAt ? new Date(banDetails.createdAt).toLocaleString('id-ID') : new Date().toLocaleString('id-ID');

    return `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Akses Ditolak - Alamat IP Diblokir</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        body { background: #06070a; color: #fff; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .card { max-width: 520px; width: 100%; background: #0e111a; border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 24px; padding: 32px 24px; text-align: center; box-shadow: 0 0 50px rgba(239, 68, 68, 0.2); }
        .icon { width: 72px; height: 72px; background: rgba(239, 68, 68, 0.15); border: 2px solid rgba(239, 68, 68, 0.4); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; color: #ef4444; font-size: 32px; }
        h1 { font-size: 20px; font-weight: 900; color: #ef4444; letter-spacing: 0.5px; margin-bottom: 8px; text-transform: uppercase; }
        p.desc { font-size: 13px; color: rgba(255, 255, 255, 0.7); line-height: 1.6; margin-bottom: 24px; }
        .info-box { background: rgba(0, 0, 0, 0.6); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 16px; text-align: left; margin-bottom: 24px; font-size: 12px; }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .info-row:last-child { margin-bottom: 0; }
        .info-label { color: rgba(255, 255, 255, 0.4); }
        .info-val { color: #f87171; font-family: monospace; font-weight: bold; }
        .warning-badge { display: inline-block; background: rgba(239, 68, 68, 0.2); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.4); padding: 6px 14px; border-radius: 999px; font-size: 11px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="card">
        <div class="icon">🚫</div>
        <h1>AKSES DITOLAK: IP DIBLOKIR</h1>
        <p class="desc">Sistem keamanan server MusifyStar mendeteksi percobaan manipulasi ilegal status akun VIP (DevTools / Console / Tampering) atau aktivitas unduhan scraper. Alamat IP dan perangkat Anda telah diblokir secara permanen.</p>
        
        <div class="info-box">
            <div class="info-row">
                <span class="info-label">Alamat IP Anda:</span>
                <span class="info-val">${clientIp || 'Terdeteksi'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Status Blokir:</span>
                <span class="info-val">PERMANEN (SELAMANYA)</span>
            </div>
            <div class="info-row">
                <span class="info-label">Waktu Blokir:</span>
                <span class="info-val" style="color:#fff;">${dateStr}</span>
            </div>
            <div class="info-row" style="margin-top: 10px; border-top: 1px dashed rgba(255,255,255,0.1); pt: 8px;">
                <span class="info-label">Alasan:</span>
                <span class="info-val" style="color:#fca5a5; font-size:11px;">${reason}</span>
            </div>
        </div>

        <div class="warning-badge">Proteksi Keamanan Anti-Tamper MusifyStar Aktif</div>
    </div>
</body>
</html>`;
}

// Express API handler for /api/security
async function securityHandler(req, res) {
    const action = req.query.action || req.body?.action;
    const clientIp = normalizeIp(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '');

    // Action: Report Tamper (Called by client-side security guard upon detecting DevTools tampering)
    if (action === 'report_tamper') {
        const body = req.body || {};
        const reason = body.reason || 'Percobaan manipulasi status VIP akun lewat DevTools / Console / Storage';
        const targetUserId = body.userId || '';
        const targetUsername = body.username || '';

        // If IP is immune or user is master/admin, reject ban attempt silently
        if (isImmuneIp(clientIp) || targetUsername === 'abil' || targetUsername === 'nabil' || targetUserId === '2325308719') {
            console.log(`[SECURITY] Tamper report bypassed for immune admin/user: ${targetUsername} (IP: ${clientIp})`);
            return res.json({
                status: true,
                ipBanned: false,
                banned: false,
                message: 'Admin/Immune account verified.'
            });
        }

        console.warn(`[SECURITY TAMPER ALERT] Tampering reported by client from IP ${clientIp}: ${reason} (User: ${targetUsername} / ${targetUserId})`);

        // Instantly ban the IP permanently!
        const banResult = await banIp(clientIp, reason, {
            reportedAt: new Date().toISOString(),
            userId: targetUserId,
            username: targetUsername,
            tamperDetail: body.detail || ''
        });

        if (banResult.immune) {
            return res.json({
                status: true,
                ipBanned: false,
                banned: false,
                message: 'IP memiliki proteksi anti-blokir.'
            });
        }

        return res.status(403).json({
            status: false,
            ipBanned: true,
            banned: true,
            message: 'Alamat IP Anda telah diblokir secara permanen karena pelanggaran keamanan manipulasi status VIP.',
            ban: banResult
        });
    }

    // Action: Check IP Ban status
    if (action === 'check_ip') {
        const banCheck = getIpBanStatus(clientIp);
        return res.json({
            status: true,
            ip: clientIp,
            ipBanned: banCheck.isIpBanned,
            ban: banCheck
        });
    }

    return res.status(400).json({ status: false, message: 'Action tidak dikenal' });
}

module.exports = {
    normalizeIp,
    isImmuneIp,
    addImmuneIp,
    readBannedIpsSync,
    readBannedIpsAsync,
    writeBannedIpsAsync,
    getIpBanStatus,
    banIp,
    generateVipSignature,
    verifyVipSignature,
    isBotOrScraper,
    serveCorruptedDummyFile,
    getIpBannedHtmlPage,
    securityHandler
};
