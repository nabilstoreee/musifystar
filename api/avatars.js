const fs = require('fs');
const path = require('path');
const storage = require('./storage.js');
const adminAuth = require('./admin-auth.js');

// Default catalog kosong (hanya diisi jika Admin menambahkan avatar)
const DEFAULT_AVATARS = [];

const OLD_DEFAULT_IDS = new Set([
    'av_vip_cewe_sakura', 'av_vip_cewe_aoi', 'av_vip_cewe_hana',
    'av_1791499846347_nbsi', 'av_1791499998616_tj02',
    'av_1791500017306_zlth', 'av_1791499953107_h27l'
]);

async function getAvatarsCatalog() {
    try {
        const data = await storage.readDataAsync('avatars_catalog.json');
        if (data && Array.isArray(data.avatars)) {
            // Clean up any old hardcoded default avatars
            const filtered = data.avatars.filter(a => 
                !OLD_DEFAULT_IDS.has(a.id) && 
                !a.url.includes('unsplash.com/photo-') &&
                !a.url.includes('dicebear.com/7.x/lorelei') &&
                !a.url.includes('/avatars/Avatar-MusifyStar-')
            );
            if (filtered.length !== data.avatars.length) {
                await saveAvatarsCatalog(filtered);
            }
            return filtered;
        }
    } catch (e) {}
    return DEFAULT_AVATARS;
}

async function saveAvatarsCatalog(avatars) {
    await storage.writeDataAsync('avatars_catalog.json', {
        avatars: avatars,
        updatedAt: Date.now()
    });
}

module.exports = async function handler(req, res) {
    const action = req.query.action || (req.body && req.body.action) || 'list';

    // Serve avatar image directly (Safe for read-only serverless / container)
    if (action === 'image' || action === 'raw_image') {
        try {
            const avatarId = String(req.query.id || '').trim();
            const catalog = await getAvatarsCatalog();
            const found = catalog.find(a => a.id === avatarId);
            if (found && (found.imageBase64 || (found.url && found.url.startsWith('data:image')))) {
                const raw = found.imageBase64 || found.url;
                const parts = raw.split('base64,');
                const buffer = Buffer.from(parts[1], 'base64');
                const header = parts[0].toLowerCase();
                let mime = 'image/png';
                if (header.includes('jpeg') || header.includes('jpg')) mime = 'image/jpeg';
                else if (header.includes('webp')) mime = 'image/webp';
                res.setHeader('Content-Type', mime);
                res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
                return res.status(200).send(buffer);
            }
        } catch (e) {}
        return res.status(404).send('Avatar image not found');
    }

    // GET /api/avatars - Ambil katalog avatar
    if (req.method === 'GET' || action === 'list') {
        const avatars = await getAvatarsCatalog();
        return res.json({
            status: true,
            avatars: avatars
        });
    }

    // POST Actions
    if (req.method === 'POST') {
        const token = req.headers['x-admin-token'] || req.headers['authorization'];
        const cleanToken = token ? token.replace(/^Bearer\s+/i, '') : '';
        const isAdmin = adminAuth.isValidToken(cleanToken);

        // Hanya Master Admin / Admin terautentikasi yang bisa kelola
        if (!isAdmin) {
            return res.status(403).json({
                status: false,
                message: 'Akses khusus Administrator. Token tidak valid.'
            });
        }

        const body = req.body || {};

        // Tambah Avatar Baru
        if (action === 'add') {
            let { name, url, fileBase64, isPremium, category, targetTab } = body;

            // Tentukan target category & isPremium berdasarkan targetTab
            // Pilihan: 'gratis' (Campur) | 'cowo' (VIP Cowok) | 'cewe' (VIP Cewek)
            let chosenCategory = 'gratis';
            let chosenPremium = false;

            const tab = targetTab || category;
            if (tab === 'cowo' || tab === 'vip_cowo') {
                chosenCategory = 'cowo';
                chosenPremium = true;
            } else if (tab === 'cewe' || tab === 'vip_cewe') {
                chosenCategory = 'cewe';
                chosenPremium = true;
            } else if (tab === 'vip') {
                chosenCategory = 'cowo';
                chosenPremium = true;
            } else {
                chosenCategory = 'gratis';
                chosenPremium = false;
            }

            const avatarId = 'av_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
            let imageBase64Saved = null;

            // Jika diupload dari galeri HP/PC berupa base64 gambar
            if (fileBase64 && typeof fileBase64 === 'string') {
                const matches = fileBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                const buffer = matches ? Buffer.from(matches[2], 'base64') : Buffer.from(fileBase64, 'base64');
                const ext = matches && matches[1].includes('jpeg') ? 'jpg' : (matches && matches[1].includes('webp') ? 'webp' : 'png');
                imageBase64Saved = fileBase64.startsWith('data:') ? fileBase64 : `data:image/${ext};base64,${fileBase64}`;

                let savedToDisk = false;
                try {
                    const avatarsDir = path.join(__dirname, '..', 'public', 'avatars');
                    if (!fs.existsSync(avatarsDir)) {
                        try { fs.mkdirSync(avatarsDir, { recursive: true }); } catch (e) {}
                    }

                    const fileName = `Avatar-MusifyStar-${Date.now()}.${ext}`;
                    const targetPath = path.join(avatarsDir, fileName);
                    fs.writeFileSync(targetPath, buffer);
                    savedToDisk = true;
                    url = `/avatars/${fileName}?v=${Date.now()}`;
                } catch(err) {
                    console.warn('[AVATARS_API] Local filesystem is read-only (EROFS). Storing image in database & serving via API:', err.message);
                }

                if (!savedToDisk) {
                    url = `/api/avatars?action=image&id=${avatarId}`;
                }
            }

            if (!url || !url.trim()) {
                return res.status(400).json({ status: false, message: 'Foto / Gambar Avatar wajib dipilih dari galeri atau diisi URL' });
            }

            const current = await getAvatarsCatalog();
            const newAvatar = {
                id: avatarId,
                name: (name || (chosenPremium ? (chosenCategory === 'cewe' ? 'VIP Girl ' : 'VIP Boy ') : 'Avatar Gratis ') + (current.length + 1)).trim(),
                url: url.trim(),
                imageBase64: imageBase64Saved,
                isPremium: chosenPremium,
                category: chosenCategory,
                addedAt: Date.now()
            };

            current.unshift(newAvatar);
            await saveAvatarsCatalog(current);

            const tabLabel = !chosenPremium ? 'Avatar Gratis (Campur)' : (chosenCategory === 'cewe' ? 'Avatar VIP (Cewek)' : 'Avatar VIP (Cowok)');

            return res.json({
                status: true,
                message: `Avatar berhasil ditambahkan ke tab ${tabLabel}!`,
                avatar: newAvatar,
                avatars: current
            });
        }

        // Ubah Kategori / Tab Avatar (Gratis, VIP Cowo, VIP Cewe)
        if (action === 'set_category' || action === 'update_category' || action === 'toggle_premium') {
            const { id, category, isPremium } = body;
            if (!id) return res.status(400).json({ status: false, message: 'ID avatar wajib ada' });

            const current = await getAvatarsCatalog();
            const target = current.find(a => a.id === id);
            if (!target) return res.status(404).json({ status: false, message: 'Avatar tidak ditemukan' });

            if (category) {
                if (category === 'gratis') {
                    target.category = 'gratis';
                    target.isPremium = false;
                } else if (category === 'cowo') {
                    target.category = 'cowo';
                    target.isPremium = true;
                } else if (category === 'cewe') {
                    target.category = 'cewe';
                    target.isPremium = true;
                }
            } else if (isPremium !== undefined) {
                target.isPremium = Boolean(isPremium);
                if (!target.isPremium) {
                    target.category = 'gratis';
                } else if (target.category === 'gratis' || !target.category) {
                    target.category = 'cowo';
                }
            }

            await saveAvatarsCatalog(current);

            const tabLabel = !target.isPremium ? 'Avatar Gratis (Campur)' : (target.category === 'cewe' ? 'Avatar VIP (Cewek)' : 'Avatar VIP (Cowok)');

            return res.json({
                status: true,
                message: `Status avatar dipindahkan ke: ${tabLabel}`,
                avatar: target,
                avatars: current
            });
        }

        // Hapus Avatar
        if (action === 'delete') {
            const { id } = body;
            if (!id) return res.status(400).json({ status: false, message: 'ID avatar wajib' });

            let current = await getAvatarsCatalog();
            current = current.filter(a => a.id !== id);
            await saveAvatarsCatalog(current);

            return res.json({
                status: true,
                message: 'Avatar berhasil dihapus',
                avatars: current
            });
        }

        // Reset ke Default
        if (action === 'reset_default') {
            await saveAvatarsCatalog(DEFAULT_AVATARS);
            return res.json({
                status: true,
                message: 'Katalog avatar di-reset ke setelan awal',
                avatars: DEFAULT_AVATARS
            });
        }

        return res.status(400).json({ status: false, message: 'Aksi tidak dikenali' });
    }

    return res.status(405).json({ status: false, message: 'Metode HTTP tidak didukung' });
};
