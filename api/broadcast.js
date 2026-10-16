const fs = require('fs');
const path = require('path');
const adminAuth = require('./admin-auth.js');
const storage = require('./storage.js');

const BROADCAST_FILE = '.broadcast_announcement.json';

const PRESETS = [
    {
        id: 'ramadhan',
        name: 'Spesial Ramadhan & Puasa',
        title: 'Marhaban Ya Ramadhan 1446 H',
        badge: 'BULAN SUCI',
        type: 'update',
        icon: 'moon',
        text: 'Selamat menjalankan ibadah puasa di bulan suci Ramadhan. Dengarkan lantunan musik religi dan lagu favorit Anda di MusifyStar!'
    },
    {
        id: 'lebaran',
        name: 'Selamat Hari Raya Idul Fitri',
        title: 'Taqabbalallahu Minna Wa Minkum',
        badge: 'IDUL FITRI (LEBARAN)',
        type: 'update',
        icon: 'sparkles',
        text: 'Selamat Hari Raya Idul Fitri! Minal Aidin Wal Faidzin, mohon maaf lahir dan batin. Rayakan momen berkumpul bersama keluarga diiringi lagu terindah.'
    },
    {
        id: 'maintenance',
        name: 'Info Pemeliharaan Sistem',
        title: 'Pemeliharaan Sistem Server',
        badge: 'MAINTENANCE',
        type: 'maintenance',
        icon: 'wrench',
        text: 'Server akan mengalami pemeliharaan sistem rutin pada pukul 00:00 - 01:00 WIB. Pemutaran lagu di koleksi offline tetap dapat dinikmati secara lancar.'
    },
    {
        id: 'update',
        name: 'Rilis Fitur & Versi Baru',
        title: 'MusifyStar Pembaruan v2.5',
        badge: 'RILIS BARU',
        type: 'update',
        icon: 'sparkles',
        text: 'Fitur Baru: Top 50 Lagu Populer, Seasonal Theme Switcher & Keamanan 2FA telah hadir! Nikmati pemutaran musik lebih cepat dan stabil.'
    },
    {
        id: 'info',
        name: 'Info & Pengumuman Umum',
        title: 'Selamat Datang di MusifyStar',
        badge: 'PENGUMUMAN',
        type: 'info',
        icon: 'megaphone',
        text: 'Nikmati jutaan lagu tanpa gangguan. Pasang aplikasi (PWA) di HP Anda untuk pengalaman mendengarkan musik terbaik di mana saja.'
    },
    {
        id: 'warning',
        name: 'Peringatan Kendala Jaringan',
        title: 'Pemberitahuan Kendala Server',
        badge: 'PERINGATAN',
        type: 'warning',
        icon: 'alert-triangle',
        text: 'Penyedia layanan API musik sedang mengalami lonjakan lalu lintas tinggi. Jika pemutaran lagu lambat, mohon refresh beberapa saat lagi.'
    }
];

async function getStoredBroadcastAsync() {
    const defaultData = {
        enabled: false,
        title: '',
        text: '',
        badge: 'PENGUMUMAN',
        type: 'info',
        speed: 'normal',
        icon: 'megaphone',
        displayMode: 'both',
        closable: true,
        updatedAt: new Date().toISOString()
    };

    const stored = await storage.readDataAsync(BROADCAST_FILE, defaultData);
    if (stored && typeof stored === 'object') {
        return {
            enabled: !!stored.enabled,
            title: typeof stored.title === 'string' ? stored.title : '',
            text: typeof stored.text === 'string' ? stored.text : '',
            badge: typeof stored.badge === 'string' ? stored.badge : 'PENGUMUMAN',
            type: stored.type || 'info',
            speed: stored.speed || 'normal',
            icon: stored.icon || 'megaphone',
            displayMode: stored.displayMode || 'both',
            closable: stored.closable !== false,
            updatedAt: stored.updatedAt || defaultData.updatedAt
        };
    }
    return defaultData;
}

function getStoredBroadcastSync() {
    const defaultData = {
        enabled: false,
        title: '',
        text: '',
        badge: 'PENGUMUMAN',
        type: 'info',
        speed: 'normal',
        icon: 'megaphone',
        displayMode: 'both',
        closable: true,
        updatedAt: new Date().toISOString()
    };

    const stored = storage.readData(BROADCAST_FILE, defaultData);
    if (stored && typeof stored === 'object') {
        return {
            enabled: !!stored.enabled,
            title: typeof stored.title === 'string' ? stored.title : '',
            text: typeof stored.text === 'string' ? stored.text : '',
            badge: typeof stored.badge === 'string' ? stored.badge : 'PENGUMUMAN',
            type: stored.type || 'info',
            speed: stored.speed || 'normal',
            icon: stored.icon || 'megaphone',
            displayMode: stored.displayMode || 'both',
            closable: stored.closable !== false,
            updatedAt: stored.updatedAt || defaultData.updatedAt
        };
    }
    return defaultData;
}

async function saveBroadcastAsync(config) {
    return await storage.writeDataAsync(BROADCAST_FILE, config);
}

module.exports = async function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    const method = req.method.toUpperCase();

    // GET /api/broadcast - Public broadcast state
    if (method === 'GET') {
        const current = await getStoredBroadcastAsync();
        return res.json({
            status: true,
            ...current,
            presets: PRESETS
        });
    }

    // POST /api/broadcast - Admin updates broadcast running text & announcement card
    if (method === 'POST') {
        const token = req.headers['x-admin-token'] || req.query.token;
        if (!adminAuth.isValidToken(token)) {
            return res.status(401).json({ status: false, message: 'Akses ditolak: Membutuhkan token admin' });
        }

        const body = req.body || {};
        const enabled = !!body.enabled;
        const title = typeof body.title === 'string' ? body.title.trim() : '';
        const text = typeof body.text === 'string' ? body.text.trim() : '';
        const badge = typeof body.badge === 'string' && body.badge.trim() ? body.badge.trim().toUpperCase() : 'PENGUMUMAN';
        const type = ['info', 'maintenance', 'warning', 'update', 'custom'].includes(body.type) ? body.type : 'info';
        const speed = ['slow', 'normal', 'fast'].includes(body.speed) ? body.speed : 'normal';
        const icon = typeof body.icon === 'string' && body.icon.trim() ? body.icon.trim() : 'megaphone';
        const displayMode = ['card', 'ticker', 'both'].includes(body.displayMode) ? body.displayMode : 'both';
        const closable = body.closable !== false;

        if (enabled && !text) {
            return res.status(400).json({ status: false, message: 'Isi pengumuman tidak boleh kosong saat broadcast diaktifkan' });
        }

        const newConfig = {
            enabled: enabled,
            title: title,
            text: text,
            badge: badge,
            type: type,
            speed: speed,
            icon: icon,
            displayMode: displayMode,
            closable: closable,
            updatedAt: new Date().toISOString()
        };

        const success = await saveBroadcastAsync(newConfig);
        if (!success) {
            return res.status(500).json({ status: false, message: 'Gagal menyimpan konfigurasi broadcast pengumuman' });
        }

        return res.json({
            status: true,
            success: true,
            message: enabled ? 'Pengumuman Siaran berhasil diaktifkan!' : 'Pengumuman Siaran dinonaktifkan.',
            config: newConfig
        });
    }

    return res.status(405).json({ status: false, message: 'Metode tidak didukung' });
};

module.exports.getStoredBroadcast = getStoredBroadcastSync;
module.exports.getStoredBroadcastAsync = getStoredBroadcastAsync;
