const fs = require('fs');
const path = require('path');
const adminAuth = require('./admin-auth.js');
const storage = require('./storage.js');

const VERSION_FILE = '.app_version.json';
const SW_FILE_PATH = path.join(__dirname, '..', 'public', 'sw.js');

const DEFAULT_CONFIG = {
    version: 'v1.0.0',
    releaseName: 'MusifyStar Official',
    description: 'Nikmati Streaming Musik Dengan Lirik',
    releaseNotes: 'Pembaruan stabilitas dan peningkatan performa.',
    forceReload: false,
    buildTimestamp: Date.now(),
    updatedAt: new Date().toISOString()
};

function parseVersionNumbers(v) {
    const clean = String(v).replace(/^v/i, '').trim();
    const parts = clean.split('.').map(p => parseInt(p, 10) || 0);
    while (parts.length < 3) parts.push(0);
    return {
        major: parts[0] || 1,
        minor: parts[1] || 0,
        patch: parts[2] || 0
    };
}

function computeBumpedVersion(currentVersion, bumpType) {
    const { major, minor, patch } = parseVersionNumbers(currentVersion);
    if (bumpType === 'major') {
        return `v${major + 1}.0.0`;
    }
    if (bumpType === 'minor') {
        return `v${major}.${minor + 1}.0`;
    }
    // Default to patch
    return `v${major}.${minor}.${patch + 1}`;
}

async function getStoredVersionAsync() {
    const parsed = await storage.readDataAsync(VERSION_FILE, DEFAULT_CONFIG);
    if (parsed && parsed.version) {
        return {
            version: String(parsed.version).trim(),
            releaseName: parsed.releaseName || 'MusifyStar Official',
            description: parsed.description || 'Nikmati Streaming Musik Dengan Lirik',
            releaseNotes: parsed.releaseNotes || 'Pembaruan stabilitas dan performa pemutar.',
            forceReload: !!parsed.forceReload,
            buildTimestamp: parsed.buildTimestamp || Date.now(),
            updatedAt: parsed.updatedAt || new Date().toISOString()
        };
    }
    return DEFAULT_CONFIG;
}

function updateServiceWorkerCacheVersion(versionString) {
    try {
        if (!fs.existsSync(SW_FILE_PATH)) return false;
        let content = fs.readFileSync(SW_FILE_PATH, 'utf8');
        const safeVer = String(versionString).replace(/[^a-zA-Z0-9_\-]/g, '_');
        const newCacheName = `MusifyStar-static-${safeVer}_${Date.now()}`;
        content = content.replace(/const CACHE_STATIC_NAME = ['"][^'"]+['"];/, `const CACHE_STATIC_NAME = '${newCacheName}';`);
        fs.writeFileSync(SW_FILE_PATH, content, 'utf8');
        return true;
    } catch (e) {
        console.error('[VERSION_BUMPER] Failed to update ServiceWorker cache string:', e.message);
        return false;
    }
}

module.exports = async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    // GET /api/version - Public version info
    if (req.method === 'GET') {
        const config = await getStoredVersionAsync();
        return res.json({
            status: true,
            version: config.version,
            releaseName: config.releaseName,
            description: config.description,
            releaseNotes: config.releaseNotes,
            forceReload: config.forceReload,
            buildTimestamp: config.buildTimestamp,
            updatedAt: config.updatedAt
        });
    }

    // POST /api/version - Admin Version Bump & Save
    if (req.method === 'POST') {
        const token = req.headers['x-admin-token'] || req.query.token;
        if (!token || !adminAuth.isValidToken(token)) {
            return res.status(401).json({
                status: false,
                message: 'Akses ditolak: Token admin tidak valid atau kedaluwarsa'
            });
        }

        const body = req.body || {};
        const currentConfig = await getStoredVersionAsync();

        let targetVersion = currentConfig.version;

        if (body.bumpType && ['patch', 'minor', 'major'].includes(body.bumpType)) {
            targetVersion = computeBumpedVersion(currentConfig.version, body.bumpType);
        } else if (body.version && typeof body.version === 'string' && body.version.trim()) {
            targetVersion = body.version.trim();
            if (!targetVersion.startsWith('v') && !targetVersion.startsWith('V')) {
                targetVersion = 'v' + targetVersion;
            }
        }

        const forceReload = body.forceReload === true || body.forceReload === 'true';
        const buildTimestamp = Date.now();

        const newConfig = {
            version: targetVersion,
            releaseName: (body.releaseName && typeof body.releaseName === 'string') ? body.releaseName.trim() : currentConfig.releaseName,
            description: (body.description && typeof body.description === 'string') ? body.description.trim() : currentConfig.description,
            releaseNotes: (body.releaseNotes && typeof body.releaseNotes === 'string') ? body.releaseNotes.trim() : currentConfig.releaseNotes,
            forceReload: forceReload,
            buildTimestamp: buildTimestamp,
            updatedAt: new Date().toISOString()
        };

        // 1. Save configuration
        await storage.writeDataAsync(VERSION_FILE, newConfig);

        // 2. Automagically update service worker static cache name in public/sw.js
        updateServiceWorkerCacheVersion(newConfig.version);

        return res.json({
            status: true,
            message: `Versi PWA berhasil dinaikkan ke ${newConfig.version}! Semua perangkat pengguna akan memperbarui cache secara otomatis.`,
            version: newConfig.version,
            releaseName: newConfig.releaseName,
            description: newConfig.description,
            releaseNotes: newConfig.releaseNotes,
            forceReload: newConfig.forceReload,
            buildTimestamp: newConfig.buildTimestamp,
            updatedAt: newConfig.updatedAt
        });
    }

    return res.status(405).json({ status: false, message: 'Method Not Allowed' });
};

module.exports.getStoredVersionAsync = getStoredVersionAsync;
