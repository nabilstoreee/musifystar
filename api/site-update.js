const adminAuth = require('./admin-auth.js');
const storage = require('./storage.js');

const SITE_UPDATE_FILE = '.site_update.json';

const DEFAULT_CONFIG = {
    enabled: false,
    title: 'Pembaruan Website MusifyStar',
    message: 'Website MusifyStar telah berpindah ke alamat tautan (link) baru yang lebih cepat, stabil, dan memiliki fitur terbaru. Silakan klik tombol di bawah untuk membuka dan beralih ke website baru sekarang.',
    targetUrl: '',
    buttonText: 'Buka Link Website Baru',
    badgeText: 'UPDATE WEBSITE RESMI',
    forceLock: true, // Tidak bisa ditutup / dihapus oleh pengguna
    updatedAt: new Date().toISOString()
};

async function getStoredSiteUpdateAsync() {
    try {
        const stored = await storage.readDataAsync(SITE_UPDATE_FILE, DEFAULT_CONFIG);
        if (stored && typeof stored === 'object') {
            return {
                enabled: !!stored.enabled,
                title: typeof stored.title === 'string' && stored.title.trim() ? stored.title.trim() : DEFAULT_CONFIG.title,
                message: typeof stored.message === 'string' && stored.message.trim() ? stored.message.trim() : DEFAULT_CONFIG.message,
                targetUrl: typeof stored.targetUrl === 'string' ? stored.targetUrl.trim() : '',
                buttonText: typeof stored.buttonText === 'string' && stored.buttonText.trim() ? stored.buttonText.trim() : DEFAULT_CONFIG.buttonText,
                badgeText: typeof stored.badgeText === 'string' && stored.badgeText.trim() ? stored.badgeText.trim() : DEFAULT_CONFIG.badgeText,
                forceLock: stored.forceLock !== false,
                updatedAt: stored.updatedAt || new Date().toISOString()
            };
        }
    } catch (e) {
        console.error('[SITE_UPDATE] Read error:', e.message);
    }
    return DEFAULT_CONFIG;
}

module.exports = async function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    const method = req.method.toUpperCase();

    // 1. GET /api/site-update - Public status for client
    if (method === 'GET') {
        const config = await getStoredSiteUpdateAsync();
        return res.json({
            status: true,
            ...config
        });
    }

    // 2. POST /api/site-update - Admin updates configuration
    if (method === 'POST') {
        const token = req.headers['x-admin-token'] || req.query.token;
        if (!adminAuth.isValidToken(token)) {
            return res.status(401).json({
                status: false,
                message: 'Akses ditolak: Token admin tidak valid atau kedaluwarsa'
            });
        }

        const body = req.body || {};
        const enabled = !!body.enabled;
        const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim() : 'Pembaruan Website MusifyStar';
        const message = typeof body.message === 'string' && body.message.trim() ? body.message.trim() : 'Website MusifyStar telah berpindah ke alamat baru. Silakan klik tombol di bawah untuk membuka website baru.';
        let targetUrl = typeof body.targetUrl === 'string' ? body.targetUrl.trim() : '';
        const buttonText = typeof body.buttonText === 'string' && body.buttonText.trim() ? body.buttonText.trim() : 'Buka Link Website Baru';
        const badgeText = typeof body.badgeText === 'string' && body.badgeText.trim() ? body.badgeText.trim().toUpperCase() : 'UPDATE WEBSITE RESMI';
        const forceLock = body.forceLock !== false; // Default true: tidak bisa ditutup oleh user

        if (enabled && !targetUrl) {
            return res.status(400).json({
                status: false,
                message: 'Alamat Link URL Website Baru wajib diisi saat banner update diaktifkan!'
            });
        }

        // Format targetUrl if missing protocol
        if (targetUrl && !/^https?:\/\//i.test(targetUrl)) {
            targetUrl = 'https://' + targetUrl;
        }

        const newConfig = {
            enabled: enabled,
            title: title,
            message: message,
            targetUrl: targetUrl,
            buttonText: buttonText,
            badgeText: badgeText,
            forceLock: forceLock,
            updatedAt: new Date().toISOString()
        };

        const saved = await storage.writeDataAsync(SITE_UPDATE_FILE, newConfig);
        if (!saved) {
            return res.status(500).json({
                status: false,
                message: 'Gagal menyimpan konfigurasi banner update link website'
            });
        }

        return res.json({
            status: true,
            success: true,
            message: enabled 
                ? 'Banner Update Link Website (Tengah Layar) berhasil diaktifkan!' 
                : 'Banner Update Link Website berhasil dinonaktifkan.',
            config: newConfig
        });
    }

    return res.status(405).json({ status: false, message: 'Metode tidak didukung' });
};

module.exports.getStoredSiteUpdateAsync = getStoredSiteUpdateAsync;
