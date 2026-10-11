const fs = require('fs');
const path = require('path');
const storage = require('./storage.js');
const userAuth = require('./user-auth.js');
const adminAuth = require('./admin-auth.js');

const BORDERS_LIST = [
    {
        id: 'none',
        name: 'Tanpa Border',
        file: '',
        url: '',
        isVip: false,
        tier: 'Gratis',
        requiredTier: 'none',
        color: '#a1a1aa',
        badge: 'Default',
        desc: 'Tampilan avatar melingkar standar tanpa bingkai tambahan.'
    },
    {
        id: 'border_platinum',
        name: 'Platinum',
        file: 'Platinum.png',
        url: '/borders/Platinum.png',
        isVip: true,
        tier: '1 Bulan+',
        requiredTier: '1month',
        color: '#38bdf8',
        badge: '1 Bulan+',
        desc: 'Bingkai Platinum naga api cyber. Terbuka untuk Paket 1 Bulan, 5 Bulan & Permanen.'
    },
    {
        id: 'border_master',
        name: 'Master',
        file: 'Master.png',
        url: '/borders/Master.png',
        isVip: true,
        tier: '1 Bulan+',
        requiredTier: '1month',
        color: '#f97316',
        badge: '1 Bulan+',
        desc: 'Bingkai Master mahkota emas membara. Terbuka untuk Paket 1 Bulan, 5 Bulan & Permanen.'
    },
    {
        id: 'border_legend',
        name: 'Legend',
        file: 'Legend.png',
        url: '/borders/Legend.png',
        isVip: true,
        tier: '2 Bulan+',
        requiredTier: '2months',
        color: '#eab308',
        badge: '2 Bulan+',
        desc: 'Sayap emas kemegahan kerajaan Legenda. Khusus Paket 2 Bulan, 5 Bulan & Permanen.'
    },
    {
        id: 'border_immortal',
        name: 'Immortal',
        file: 'Imortal.png',
        url: '/borders/Imortal.png',
        isVip: true,
        tier: '5 Bulan+',
        requiredTier: '5months',
        color: '#ec4899',
        badge: '5 Bulan+',
        desc: 'Kasta tertinggi Immortal Mahkota Dewa Musik. Khusus Paket 5 Bulan & Permanen.'
    }
];

// Pastikan file gambar ada di public/borders (aman untuk lingkungan read-only serverless/container)
function ensureBordersOnDisk() {
    try {
        const bordersDir = path.join(__dirname, '..', 'public', 'borders');
        if (!fs.existsSync(bordersDir)) {
            try { fs.mkdirSync(bordersDir, { recursive: true }); } catch (e) {}
        }
        ['Imortal.png', 'Legend.png', 'Master.png', 'Platinum.png'].forEach(f => {
            try {
                const rootFile = path.join(__dirname, '..', f);
                const targetFile = path.join(bordersDir, f);
                if (fs.existsSync(rootFile) && !fs.existsSync(targetFile)) {
                    fs.copyFileSync(rootFile, targetFile);
                }
            } catch (e) {}
        });
        const immTarget = path.join(bordersDir, 'Immortal.png');
        const imTarget = path.join(bordersDir, 'Imortal.png');
        if (fs.existsSync(imTarget) && !fs.existsSync(immTarget)) {
            try { fs.copyFileSync(imTarget, immTarget); } catch (e) {}
        }
    } catch (e) {
        // Read-only filesystem is safely handled
    }
}

ensureBordersOnDisk();

function getCustomBorders() {
    try {
        const custom = storage.readData('custom_borders.json', []);
        return Array.isArray(custom) ? custom : [];
    } catch (e) {
        return [];
    }
}

async function getCustomBordersAsync() {
    try {
        const custom = await storage.readDataAsync('custom_borders.json', []);
        return Array.isArray(custom) ? custom : [];
    } catch (e) {
        return [];
    }
}

async function saveCustomBordersAsync(list) {
    try {
        await storage.writeDataAsync('custom_borders.json', list);
        return true;
    } catch (e) {
        console.error('[BORDERS] Error saving custom borders:', e.message);
        return false;
    }
}

function getAllBorders() {
    const custom = getCustomBorders();
    return [...BORDERS_LIST, ...custom];
}

async function getAllBordersAsync() {
    const custom = await getCustomBordersAsync();
    return [...BORDERS_LIST, ...custom];
}

const TIER_RANKS = {
    'none': 0,
    'free': 0,
    '1month': 1,
    '1': 1,
    'platinum': 1,
    'master': 1,
    '2months': 2,
    '2': 2,
    '3months': 2,
    'legend': 2,
    '5months': 3,
    '5': 3,
    'immortal': 3,
    'imortal': 3,
    'permanent': 4,
    'lifetime': 4,
    'sultan': 4
};

function canUserEquipBorder(user, borderObj, isAdminSession = false) {
    if (!borderObj || borderObj.id === 'none') return true;

    // Admin email (jrnabil570@gmail.com), username (nabil), admin role, or valid admin session always has full access
    const userEmail = (user.rawEmail || user.email || '').toLowerCase().trim();
    const userName = (user.username || '').toLowerCase().trim();
    if (userEmail === 'jrnabil570@gmail.com' || userName === 'nabil' || user.role === 'admin' || isAdminSession) return true;

    const isVip = !!user.isPremium || !!user.is_premium;
    if (!isVip) {
        return borderObj.isVip === false || borderObj.requiredTier === 'none';
    }

    // Check expiration if set
    if (user.vipExpiresAt && Date.now() > user.vipExpiresAt) {
        return false;
    }

    const userTier = String(user.vipTier || 'permanent').toLowerCase();
    const reqTier = String(borderObj.requiredTier || (borderObj.isVip ? '1month' : 'none')).toLowerCase();

    // Specific legacy mapping fallback
    if (userTier === '1month' && (borderObj.id === 'border_platinum' || borderObj.id === 'border_master' || borderObj.category === 'platinum' || borderObj.category === 'master' || reqTier === '1month')) return true;
    if (userTier === '2months' && (borderObj.id === 'border_platinum' || borderObj.id === 'border_master' || borderObj.id === 'border_legend' || borderObj.category === 'legend' || reqTier === '1month' || reqTier === '2months')) return true;
    if (userTier === '5months' && (borderObj.id === 'border_platinum' || borderObj.id === 'border_master' || borderObj.id === 'border_legend' || borderObj.id === 'border_immortal' || borderObj.category === 'immortal' || reqTier === '1month' || reqTier === '2months' || reqTier === '5months')) return true;
    if (userTier === 'permanent' || userTier === 'lifetime' || userTier === 'sultan') return true;

    // Numerical rank comparison
    const userRank = TIER_RANKS[userTier] !== undefined ? TIER_RANKS[userTier] : 4;
    const reqRank = TIER_RANKS[reqTier] !== undefined ? TIER_RANKS[reqTier] : 1;

    return userRank >= reqRank;
}

module.exports = async function handler(req, res) {
    const action = req.query.action || (req.body && req.body.action) || 'list';

    // Serve image endpoint (Safe for read-only / serverless / container environment)
    if (action === 'image' || action === 'raw_image') {
        try {
            const borderId = String(req.query.id || req.query.borderId || '').trim();
            const fileName = String(req.query.file || '').trim();

            const all = await getAllBordersAsync();
            const found = all.find(b => (borderId && b.id === borderId) || (fileName && b.file === fileName));

            if (found) {
                if (found.imageBase64) {
                    let cleanBase64 = found.imageBase64;
                    let mimeType = 'image/png';
                    if (cleanBase64.includes('base64,')) {
                        const parts = cleanBase64.split('base64,');
                        const header = parts[0].toLowerCase();
                        cleanBase64 = parts[1].trim();
                        if (header.includes('jpeg') || header.includes('jpg')) mimeType = 'image/jpeg';
                        else if (header.includes('webp')) mimeType = 'image/webp';
                        else if (header.includes('gif')) mimeType = 'image/gif';
                        else if (header.includes('svg')) mimeType = 'image/svg+xml';
                    }
                    const buffer = Buffer.from(cleanBase64, 'base64');
                    res.setHeader('Content-Type', mimeType);
                    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
                    return res.status(200).send(buffer);
                }

                // Check static file on disk if exists
                if (found.file) {
                    const localPath = path.join(__dirname, '..', 'public', 'borders', found.file);
                    if (fs.existsSync(localPath)) {
                        const ext = path.extname(found.file).toLowerCase().replace('.', '') || 'png';
                        const mime = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
                        res.setHeader('Content-Type', mime);
                        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
                        return res.status(200).send(fs.readFileSync(localPath));
                    }
                }

                if (found.url && found.url.startsWith('data:image')) {
                    const parts = found.url.split('base64,');
                    const buffer = Buffer.from(parts[1], 'base64');
                    res.setHeader('Content-Type', 'image/png');
                    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
                    return res.status(200).send(buffer);
                }
            }
        } catch (imgErr) {
            console.error('[BORDERS] Error serving border image:', imgErr.message);
        }
        return res.status(404).send('Border image not found');
    }

    res.setHeader('Content-Type', 'application/json');

    // GET /api/borders (list borders)
    if (req.method === 'GET' || action === 'list' || action === 'list_all') {
        ensureBordersOnDisk();
        const all = await getAllBordersAsync();
        return res.json({
            status: true,
            borders: all
        });
    }

    // Check admin authorization helper
    const checkAdminAuth = () => {
        const adminToken = req.headers['x-admin-token'] || req.body?.adminToken || req.query.token;
        if (adminToken && adminAuth.isValidToken(adminToken)) return true;
        const userHeader = req.headers.authorization || req.headers['x-user-token'] || '';
        const token = userHeader.replace(/^Bearer\s+/i, '').trim() || req.body?.token;
        if (token) {
            try {
                const db = storage.readData('users.json', { users: [], sessions: {} });
                const uId = userAuth.getUserIdFromToken(token, db);
                const u = (db.users || []).find(x => x.id === uId);
                if (u) {
                    const email = (u.rawEmail || u.email || '').toLowerCase().trim();
                    const uname = (u.username || '').toLowerCase().trim();
                    if (email === 'jrnabil570@gmail.com' || uname === 'nabil' || u.role === 'admin') return true;
                }
            } catch (e) {}
        }
        return false;
    };

    // POST /api/borders?action=add_border (Admin add photo border)
    if (req.method === 'POST' && action === 'add_border') {
        if (!checkAdminAuth()) {
            return res.status(403).json({ status: false, message: 'Akses ditolak: Hanya admin yang dapat menambah border profile.' });
        }

        const body = req.body || {};
        const name = String(body.name || '').trim();
        if (!name) {
            return res.status(400).json({ status: false, message: 'Nama border wajib diisi.' });
        }

        const rawCategory = String(body.category || '').toLowerCase().trim();
        const rawTier = String(body.vipTier || body.requiredTier || rawCategory || '1month').toLowerCase();

        let chosenTier = '1month';
        let chosenCategory = 'platinum';

        if (rawTier === 'immortal' || rawTier === 'imortal' || rawTier === '5months' || rawTier === '5') {
            chosenTier = '5months';
            chosenCategory = 'immortal';
        } else if (rawTier === 'legend' || rawTier === '2months' || rawTier === '2' || rawTier === '3months') {
            chosenTier = '2months';
            chosenCategory = 'legend';
        } else if (rawTier === 'master') {
            chosenTier = '1month';
            chosenCategory = 'master';
        } else if (rawTier === 'permanent' || rawTier === 'lifetime' || rawTier === 'sultan') {
            chosenTier = 'permanent';
            chosenCategory = 'permanent';
        } else {
            chosenTier = '1month';
            chosenCategory = 'platinum';
        }

        if (rawCategory && ['platinum', 'master', 'legend', 'immortal', 'permanent'].includes(rawCategory)) {
            chosenCategory = rawCategory;
        } else if (name.toLowerCase().includes('immortal') || name.toLowerCase().includes('imortal')) {
            chosenCategory = 'immortal';
        } else if (name.toLowerCase().includes('legend')) {
            chosenCategory = 'legend';
        } else if (name.toLowerCase().includes('master')) {
            chosenCategory = 'master';
        } else if (name.toLowerCase().includes('platinum')) {
            chosenCategory = 'platinum';
        }

        const tierMeta = {
            '1month': { 
                label: chosenCategory === 'master' ? 'Master (1 Bulan+)' : 'Platinum (1 Bulan+)', 
                badge: chosenCategory === 'master' ? 'Master' : 'Platinum', 
                color: chosenCategory === 'master' ? '#f97316' : '#38bdf8', 
                desc: 'Terbuka untuk Paket 1 Bulan, 2 Bulan, 5 Bulan & Permanen.' 
            },
            '2months': { 
                label: 'Legend (2 Bulan+)', 
                badge: 'Legend', 
                color: '#eab308', 
                desc: 'Terbuka untuk Paket 2 Bulan, 5 Bulan & Permanen.' 
            },
            '5months': { 
                label: 'Immortal (5 Bulan+)', 
                badge: 'Immortal', 
                color: '#ec4899', 
                desc: 'Terbuka untuk Paket 5 Bulan & Permanen.' 
            },
            'permanent': { 
                label: 'VIP Permanen', 
                badge: 'Permanen', 
                color: '#f59e0b', 
                desc: 'Khusus Member VIP Permanen (Lifetime Sultan).' 
            }
        }[chosenTier] || {
            label: '1 Bulan+', badge: '1 Bulan+', color: '#38bdf8', desc: 'Terbuka untuk VIP'
        };

        const borderId = 'border_custom_' + Date.now();
        let borderUrl = String(body.url || body.imageUrl || '').trim();
        let fileName = '';
        let imageBase64Saved = null;

        // If Base64 image is uploaded
        if (body.imageBase64 && typeof body.imageBase64 === 'string') {
            let ext = 'png';
            let base64Data = body.imageBase64.trim();
            if (base64Data.includes('base64,')) {
                const parts = base64Data.split('base64,');
                const header = parts[0].toLowerCase();
                base64Data = parts[1].trim();
                if (header.includes('jpeg') || header.includes('jpg')) ext = 'jpg';
                else if (header.includes('webp')) ext = 'webp';
                else if (header.includes('gif')) ext = 'gif';
                else if (header.includes('svg')) ext = 'svg';
                else ext = 'png';
            }
            imageBase64Saved = `data:image/${ext};base64,${base64Data}`;
            const safeName = (name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().substring(0, 20)) || 'custom';
            fileName = `border_${safeName}_${Date.now()}.${ext}`;

            // Try saving to disk if writable (local dev or traditional VM)
            let savedToDisk = false;
            try {
                ensureBordersOnDisk();
                const bordersDir = path.join(__dirname, '..', 'public', 'borders');
                if (!fs.existsSync(bordersDir)) {
                    try { fs.mkdirSync(bordersDir, { recursive: true }); } catch (e) {}
                }
                const destPath = path.join(bordersDir, fileName);
                fs.writeFileSync(destPath, Buffer.from(base64Data, 'base64'));
                savedToDisk = true;
                borderUrl = `/borders/${fileName}`;
            } catch (fsErr) {
                console.warn('[BORDERS] Local filesystem is read-only (EROFS). Storing image in database & serving via API endpoint:', fsErr.message);
            }

            // In serverless / read-only environment or fallback, serve image via API route
            if (!savedToDisk) {
                borderUrl = `/api/borders?action=image&id=${borderId}&ext=${ext}`;
            }
        }

        if (!borderUrl) {
            return res.status(400).json({ status: false, message: 'Silakan pilih foto border dari galeri atau masukkan URL gambar.' });
        }

        const newBorder = {
            id: borderId,
            name: name,
            category: chosenCategory,
            file: fileName,
            url: borderUrl,
            imageBase64: imageBase64Saved,
            isVip: true,
            tier: tierMeta.label,
            requiredTier: chosenTier,
            color: body.color || tierMeta.color,
            badge: tierMeta.badge,
            desc: String(body.desc || body.description || `${name} eksklusif. ${tierMeta.desc}`).trim(),
            isCustom: true,
            createdAt: Date.now()
        };

        const customList = await getCustomBordersAsync();
        customList.push(newBorder);
        await saveCustomBordersAsync(customList);

        return res.json({
            status: true,
            message: `Border profile "${name}" berhasil ditambahkan & disimpan otomatis! Pengguna yang membeli ${tierMeta.label} akan otomatis terbuka border ini.`,
            border: newBorder,
            borders: await getAllBordersAsync()
        });
    }

    // POST /api/borders?action=delete_border (Admin delete custom border)
    if (req.method === 'POST' && action === 'delete_border') {
        if (!checkAdminAuth()) {
            return res.status(403).json({ status: false, message: 'Akses ditolak: Hanya admin yang dapat menghapus border profile.' });
        }

        const borderId = String(req.body?.borderId || req.query.borderId || '').trim();
        if (!borderId) {
            return res.status(400).json({ status: false, message: 'ID border tidak valid.' });
        }

        let customList = await getCustomBordersAsync();
        const target = customList.find(b => b.id === borderId);
        if (!target) {
            return res.status(404).json({ status: false, message: 'Border kustom tidak ditemukan atau merupakan border bawaan sistem.' });
        }

        // Clean up file if local
        if (target.file) {
            try {
                const targetPath = path.join(__dirname, '..', 'public', 'borders', target.file);
                if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath);
            } catch (e) {}
        }

        customList = customList.filter(b => b.id !== borderId);
        await saveCustomBordersAsync(customList);

        return res.json({
            status: true,
            message: `Border profile "${target.name}" berhasil dihapus.`,
            borders: await getAllBordersAsync()
        });
    }

    // POST /api/borders?action=equip
    if (req.method === 'POST' && action === 'equip') {
        const authHeader = req.headers.authorization || req.headers['x-user-token'] || '';
        const cleanToken = authHeader.replace(/^Bearer\s+/i, '').trim() || req.body?.token;
        const adminToken = req.headers['x-admin-token'] || req.body?.adminToken;
        const isAdminSession = !!(adminToken && adminAuth.isValidToken(adminToken));

        const borderId = String(req.body?.borderId || '').trim();
        const allBorders = await getAllBordersAsync();
        const found = allBorders.find(b => b.id === borderId);
        if (!found) {
            return res.status(400).json({ status: false, message: 'Border profil tidak valid' });
        }

        try {
            const db = await storage.readDataAsync('users.json', { users: [], sessions: {} });
            
            let userId = null;
            if (cleanToken) {
                userId = userAuth.getUserIdFromToken(cleanToken, db);
            }
            if (!userId && req.body?.userId) {
                userId = req.body.userId;
            }
            if (!userId && req.body?.email) {
                const targetEmail = String(req.body.email).toLowerCase().trim();
                const matched = (db.users || []).find(u => (u.email && u.email.toLowerCase() === targetEmail) || (u.rawEmail && u.rawEmail.toLowerCase() === targetEmail));
                if (matched) userId = matched.id;
            }
            if (!userId && req.body?.username) {
                const targetUsername = String(req.body.username).toLowerCase().trim();
                const matched = (db.users || []).find(u => u.username && u.username.toLowerCase() === targetUsername);
                if (matched) userId = matched.id;
            }

            if (!userId && !isAdminSession) {
                return res.status(401).json({ status: false, message: 'Silakan login terlebih dahulu untuk memasang border profil' });
            }

            let userIndex = (db.users || []).findIndex(u => u.id === userId);
            if (userIndex === -1 && isAdminSession) {
                // If admin session but user id not matched, locate master admin user
                userIndex = (db.users || []).findIndex(u => (u.email && u.email.toLowerCase() === 'jrnabil570@gmail.com') || (u.rawEmail && u.rawEmail.toLowerCase() === 'jrnabil570@gmail.com') || (u.username && u.username.toLowerCase() === 'nabil'));
            }

            if (userIndex === -1) {
                return res.status(404).json({ status: false, message: 'Pengguna tidak ditemukan di database' });
            }

            const user = db.users[userIndex];
            const isMasterAdmin = (user.rawEmail || user.email || '').toLowerCase().trim() === 'jrnabil570@gmail.com' || (user.username || '').toLowerCase().trim() === 'nabil' || user.role === 'admin' || isAdminSession;

            // Check permissions
            if (found.isVip && !isMasterAdmin) {
                const allowed = canUserEquipBorder(user, found, isAdminSession);
                if (!allowed) {
                    const isVip = !!user.isPremium || !!user.is_premium;
                    if (!isVip) {
                        return res.status(403).json({
                            status: false,
                            isLocked: true,
                            message: `Border ${found.name} khusus Member VIP! Buka paket VIP Anda sekarang.`
                        });
                    } else {
                        return res.status(403).json({
                            status: false,
                            isLocked: true,
                            message: `Border ${found.name} memerlukan Paket VIP ${found.tier || found.badge || 'lebih tinggi'}! Paket Anda saat ini belum membukanya.`
                        });
                    }
                }
            }

            // Simpan border yang dipilih
            user.border = found.id === 'none' ? '' : found.id;
            user.borderUrl = found.url || '';
            user.borderName = found.name;
            db.users[userIndex] = user;
            await storage.writeDataAsync('users.json', db);

            // Sync ke userStats di analytics_data.json untuk konsistensi instan
            try {
                const analyticsData = storage.readData('analytics_data.json', {});
                if (analyticsData && analyticsData.userStats) {
                    const uKey = (user.username || '').toLowerCase();
                    if (analyticsData.userStats[uKey]) {
                        analyticsData.userStats[uKey].border = user.border;
                        analyticsData.userStats[uKey].borderUrl = user.borderUrl;
                        analyticsData.userStats[uKey].borderName = user.borderName;
                        await storage.writeDataAsync('analytics_data.json', analyticsData);
                    }
                }
            } catch (e) {}

            return res.json({
                status: true,
                message: found.id === 'none' ? 'Border profil dilepas, menggunakan avatar standar.' : `Border ${found.name} berhasil dipasang ke profil Anda!`,
                border: user.border,
                borderUrl: user.borderUrl,
                borderName: user.borderName,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.rawEmail || user.email,
                    avatar: user.avatar,
                    border: user.border,
                    borderUrl: user.borderUrl,
                    borderName: user.borderName,
                    isPremium: isMasterAdmin || !!user.isPremium || !!user.is_premium,
                    vipTier: user.vipTier || (isMasterAdmin ? 'permanent' : 'none'),
                    vipExpiresAt: user.vipExpiresAt || null
                }
            });
        } catch (e) {
            console.error('[BORDERS] Equip error:', e);
            return res.status(500).json({ status: false, message: 'Gagal memperbarui border profil: ' + e.message });
        }
    }

    return res.status(405).json({ status: false, message: 'Method not allowed' });
};
