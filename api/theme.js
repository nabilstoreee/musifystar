const fs = require('fs');
const path = require('path');
const adminAuth = require('./admin-auth.js');
const storage = require('./storage.js');

const THEME_FILE = '.seasonal_theme.json';

const THEMES = {
    default: {
        id: 'default',
        name: 'Default Modern Dark',
        description: 'Tampilan standar tema gelap elegan MusifyStar',
        bannerTitle: '',
        bannerSubtitle: '',
        icon: 'sparkles',
        festiveDecorations: 'none'
    },
    ramadhan: {
        id: 'ramadhan',
        name: 'Ramadhan Kareem',
        description: 'Nuansa penuh berkah menyambut dan mengisi bulan suci Ramadhan',
        bannerTitle: 'Marhaban Ya Ramadhan',
        bannerSubtitle: 'Semoga ibadah di bulan suci ini membawa kedamaian, keberkahan, dan ampunan bagi kita semua.',
        icon: 'moon',
        festiveDecorations: 'ramadhan'
    },
    idul_fitri: {
        id: 'idul_fitri',
        name: 'Idul Fitri (Lebaran)',
        description: 'Suasana fitrah dan kemenangan hari raya Idul Fitri',
        bannerTitle: 'Selamat Hari Raya Idul Fitri 1447 H',
        bannerSubtitle: 'Taqabbalallahu Minna Wa Minkum. Minal Aidin Wal Faizin, Mohon Maaf Lahir dan Batin.',
        icon: 'sparkles',
        festiveDecorations: 'idul_fitri'
    },
    isra_miraj: {
        id: 'isra_miraj',
        name: 'Isra Mi\'raj',
        description: 'Peringatan peristiwa agung perjalanan malam Nabi Muhammad SAW',
        bannerTitle: 'Peringatan Isra Mi\'raj Nabi Muhammad SAW',
        bannerSubtitle: 'Mengambil hikmah perjalanan agung menuju ketaatan dan keimanan yang lebih mendalam.',
        icon: 'compass',
        festiveDecorations: 'isra_miraj'
    },
    tahun_baru_islam: {
        id: 'tahun_baru_islam',
        name: 'Tahun Baru Islam (1 Muharram)',
        description: 'Semangat hijrah dan lembaran baru di tahun baru hijriah',
        bannerTitle: 'Selamat Tahun Baru Islam 1 Muharram',
        bannerSubtitle: 'Mari jadikan momentum pergantian tahun untuk bermuhasabah dan meningkatkan kebaikan.',
        icon: 'calendar',
        festiveDecorations: 'tahun_baru_islam'
    },
    maulid_nabi: {
        id: 'maulid_nabi',
        name: 'Maulid Nabi Muhammad SAW',
        description: 'Peringatan hari kelahiran baginda Rasulullah SAW penuh selawat',
        bannerTitle: 'Selamat Memperingati Maulid Nabi Muhammad SAW',
        bannerSubtitle: 'Meneladani akhlak mulia dan kasih sayang Rasulullah sebagai rahmat bagi semesta alam.',
        icon: 'award',
        festiveDecorations: 'maulid_nabi'
    },
    idul_adha: {
        id: 'idul_adha',
        name: 'Idul Adha (Hari Raya Qurban)',
        description: 'Keteladanan keikhlasan dan semangat berbagi qurban',
        bannerTitle: 'Selamat Hari Raya Idul Adha 1447 H',
        bannerSubtitle: 'Semoga semangat pengorbanan dan keikhlasan membawa limpahan berkah, kebersamaan, dan kedamaian.',
        icon: 'heart-handshake',
        festiveDecorations: 'idul_adha'
    }
};

async function getStoredThemeAsync() {
    const defaultData = {
        activeTheme: 'default',
        showBanner: true,
        customGreeting: '',
        updatedAt: new Date().toISOString()
    };

    const stored = await storage.readDataAsync(THEME_FILE, defaultData);
    if (stored && stored.activeTheme && THEMES[stored.activeTheme]) {
        return {
            activeTheme: stored.activeTheme,
            showBanner: stored.showBanner !== false,
            customGreeting: stored.customGreeting || '',
            updatedAt: stored.updatedAt || defaultData.updatedAt
        };
    }
    return defaultData;
}

function getStoredThemeSync() {
    const defaultData = {
        activeTheme: 'default',
        showBanner: true,
        customGreeting: '',
        updatedAt: new Date().toISOString()
    };

    const stored = storage.readData(THEME_FILE, defaultData);
    if (stored && stored.activeTheme && THEMES[stored.activeTheme]) {
        return {
            activeTheme: stored.activeTheme,
            showBanner: stored.showBanner !== false,
            customGreeting: stored.customGreeting || '',
            updatedAt: stored.updatedAt || defaultData.updatedAt
        };
    }
    return defaultData;
}

async function saveThemeAsync(config) {
    return await storage.writeDataAsync(THEME_FILE, config);
}

module.exports = async function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    const method = req.method.toUpperCase();

    // GET /api/theme - Public theme config
    if (method === 'GET') {
        const current = await getStoredThemeAsync();
        const themeInfo = THEMES[current.activeTheme] || THEMES.default;

        return res.json({
            status: true,
            activeTheme: current.activeTheme,
            showBanner: current.showBanner,
            customGreeting: current.customGreeting,
            updatedAt: current.updatedAt,
            themeDetails: themeInfo,
            availableThemes: Object.values(THEMES)
        });
    }

    // POST /api/theme - Admin updates theme
    if (method === 'POST') {
        const token = req.headers['x-admin-token'] || req.query.token;
        if (!adminAuth.isValidToken(token)) {
            return res.status(401).json({ status: false, message: 'Akses ditolak: Membutuhkan token admin' });
        }

        const body = req.body || {};
        const requestedTheme = body.themeId || body.activeTheme || 'default';

        if (!THEMES[requestedTheme]) {
            return res.status(400).json({ status: false, message: 'Tema musiman tidak valid: ' + requestedTheme });
        }

        const newConfig = {
            activeTheme: requestedTheme,
            showBanner: body.showBanner !== false,
            customGreeting: typeof body.customGreeting === 'string' ? body.customGreeting.trim() : '',
            updatedAt: new Date().toISOString()
        };

        const success = await saveThemeAsync(newConfig);
        if (!success) {
            return res.status(500).json({ status: false, message: 'Gagal menyimpan tema musiman' });
        }

        return res.json({
            status: true,
            success: true,
            activeTheme: requestedTheme,
            message: `Tema musiman "${THEMES[requestedTheme].name}" berhasil diaktifkan!`,
            config: newConfig,
            themeDetails: THEMES[requestedTheme]
        });
    }

    return res.status(405).json({ status: false, message: 'Metode tidak didukung' });
};

module.exports.getStoredTheme = getStoredThemeSync;
module.exports.getStoredThemeAsync = getStoredThemeAsync;
module.exports.THEMES = THEMES;
