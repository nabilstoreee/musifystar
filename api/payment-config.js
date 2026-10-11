const fs = require('fs');
const path = require('path');
const adminAuth = require('./admin-auth.js');
const storage = require('./storage.js');

const PAYMENT_CONFIG_FILE = '.payment_config.json';

const DEFAULT_VIP_PACKAGES = [
    {
        id: 'pkg_1week',
        name: 'Paket Mingguan',
        duration: '7 Hari',
        price: 7000,
        originalPrice: 10000,
        discount: 'Hemat 30%',
        badge: 'Trial VIP',
        popular: false,
        active: true
    },
    {
        id: 'pkg_1month',
        name: 'Paket 1 Bulan',
        duration: '30 Hari',
        price: 19000,
        originalPrice: 35000,
        discount: 'Diskon 45%',
        badge: 'Platinum & Master',
        popular: true,
        active: true
    },
    {
        id: 'pkg_5months',
        name: 'Paket 5 Bulan',
        duration: '150 Hari',
        price: 69000,
        originalPrice: 150000,
        discount: 'Hemat 55%',
        badge: 'Legend & Immortal',
        popular: false,
        active: true
    },
    {
        id: 'pkg_permanent',
        name: 'Paket Permanen (Lifetime)',
        duration: 'Permanen (Selamanya)',
        price: 99000,
        originalPrice: 250000,
        discount: 'Hemat 60%',
        badge: 'Semua Border VIP',
        popular: false,
        active: true
    }
];

const DEFAULT_VIP_BENEFITS = [
    {
        id: 'ben_borders',
        title: 'Akses Bebas Semua Border Profil',
        desc: 'Gunakan border Master, Legend, Immortal, & Platinum untuk tampil beda.',
        icon: 'shield-check'
    },
    {
        id: 'ben_avatars',
        title: 'Buka Semua Koleksi Avatar VIP',
        desc: 'Bebas pakai avatar eksklusif anime, cewek & cowok tanpa batas.',
        icon: 'sparkles'
    },
    {
        id: 'ben_audio',
        title: 'Audio Musik Ultra HD & Bebas Iklan',
        desc: 'Kualitas suara jernih 320kbps tanpa jeda iklan streaming.',
        icon: 'headphones'
    },
    {
        id: 'ben_crown',
        title: 'Lencana Mahkota VIP Emas Eksklusif',
        desc: 'Lencana kebanggaan di profil, komentar lagu, & obrolan komunitas.',
        icon: 'crown'
    },
    {
        id: 'ben_download',
        title: 'Download Lagu & Dengarkan Offline',
        desc: 'Simpan lagu favorit langsung ke perangkat tanpa boros kuota.',
        icon: 'download'
    },
    {
        id: 'ben_unlimited',
        title: 'Skip Lagu Sepuasnya & Fitur Tercepat',
        desc: 'Bebas loncat lagu tanpa batas & dapatkan update fitur musik terbaru duluan.',
        icon: 'zap'
    }
];

const DEFAULT_PAYMENT_CONFIG = {
    qrisUrl: '/qris.png',
    qrisFilename: 'QRIS-MusifyStar-Nabil.png',
    qrisHolder: 'NABIL (MusifyStar Official)',
    adminWhatsapp: '6281234567890',
    accounts: [
        {
            id: 'acc_seabank',
            bankName: 'SeaBank',
            accountNumber: '9012 3456 7890',
            accountHolder: 'NABIL (MusifyStar)',
            badge: 'Prioritas Bebas Admin',
            icon: 'credit-card'
        },
        {
            id: 'acc_dana',
            bankName: 'DANA / GoPay',
            accountNumber: '0812 3456 7890',
            accountHolder: 'NABIL',
            badge: 'E-Wallet',
            icon: 'smartphone'
        }
    ],
    packages: DEFAULT_VIP_PACKAGES,
    benefits: DEFAULT_VIP_BENEFITS,
    title: 'MusifyStar VIP Membership',
    description: 'Upgrade akun Anda sekarang untuk menikmati akses tak terbatas ke semua avatar, border eksklusif, serta audio Ultra HD bebas iklan.',
    note: 'Pembayaran instan didukung semua aplikasi Bank & E-Wallet (BCA, Mandiri, BRI, BNI, Dana, GoPay, OVO, ShopeePay, LinkAja).',
    updatedAt: new Date().toISOString()
};

async function getPaymentConfig() {
    try {
        const data = await storage.readDataAsync(PAYMENT_CONFIG_FILE, DEFAULT_PAYMENT_CONFIG);
        if (data && typeof data === 'object') {
            return {
                qrisUrl: data.qrisUrl || (data.qrisBase64 ? data.qrisBase64 : '/qris.png'),
                qrisBase64: data.qrisBase64 || null,
                qrisFilename: data.qrisFilename || 'QRIS-MusifyStar-Nabil.png',
                qrisHolder: data.qrisHolder || 'NABIL (MusifyStar Official)',
                adminWhatsapp: data.adminWhatsapp || DEFAULT_PAYMENT_CONFIG.adminWhatsapp || '6281234567890',
                accounts: Array.isArray(data.accounts) && data.accounts.length ? data.accounts : DEFAULT_PAYMENT_CONFIG.accounts,
                packages: Array.isArray(data.packages) && data.packages.length ? data.packages : DEFAULT_VIP_PACKAGES,
                benefits: Array.isArray(data.benefits) && data.benefits.length ? data.benefits : DEFAULT_VIP_BENEFITS,
                title: data.title || DEFAULT_PAYMENT_CONFIG.title,
                description: data.description || DEFAULT_PAYMENT_CONFIG.description,
                note: data.note || DEFAULT_PAYMENT_CONFIG.note,
                updatedAt: data.updatedAt || new Date().toISOString()
            };
        }
    } catch (e) {
        console.error('[PAYMENT_CONFIG] Error reading config:', e.message);
    }
    return DEFAULT_PAYMENT_CONFIG;
}

module.exports = async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const action = req.query.action || (req.body && req.body.action);

    // GET /api/payment-config
    if (req.method === 'GET' || action === 'get') {
        const config = await getPaymentConfig();
        return res.json({ status: true, config });
    }

    // POST /api/payment-config?action=submit_confirmation (User kirim konfirmasi pembayaran VIP)
    if (req.method === 'POST' && action === 'submit_confirmation') {
        const body = req.body || {};
        const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '') || body.token;
        let username = body.username || 'Pengguna MusifyStar';
        let userEmail = body.email || '';
        let userId = body.userId || '';

        try {
            let foundUser = null;
            const usersData = await storage.readDataAsync('users.json', { users: [], sessions: {} });
            
            if (token) {
                // Try to resolve user by session token or JWT
                if (usersData.sessions && usersData.sessions[token]) {
                    const sUid = usersData.sessions[token].userId;
                    foundUser = (usersData.users || []).find(x => x.id === sUid);
                }
            }
            if (!foundUser && userId) {
                foundUser = (usersData.users || []).find(x => x.id === userId || (x.id && x.id.toLowerCase() === userId.toLowerCase()));
            }
            if (!foundUser && username && username !== 'Pengguna MusifyStar') {
                foundUser = (usersData.users || []).find(x => x.username && x.username.toLowerCase() === username.toLowerCase());
            }

            if (foundUser) {
                username = foundUser.username;
                userEmail = foundUser.rawEmail || foundUser.email;
                userId = foundUser.id;
            }

            // Tentukan tier VIP yang dibeli
            let chosenTier = '1month';
            let durationText = '1 Bulan (30 Hari)';
            const pkgId = String(body.packageId || '').toLowerCase();
            const dur = String(body.duration || '').toLowerCase();
            const pName = String(body.packageName || '').toLowerCase();

            if (pkgId.includes('permanent') || dur.includes('permanen') || dur.includes('selamanya') || pName.includes('permanen')) {
                chosenTier = 'permanent';
                durationText = 'Permanen (Selamanya)';
            } else if (pkgId.includes('5month') || dur.includes('150') || dur.includes('5') || pName.includes('5 bulan')) {
                chosenTier = '5months';
                durationText = '5 Bulan (150 Hari)';
            } else if (pkgId.includes('2month') || dur.includes('60') || dur.includes('2') || pName.includes('2 bulan')) {
                chosenTier = '2months';
                durationText = '2 Bulan (60 Hari)';
            } else {
                chosenTier = '1month';
                durationText = '1 Bulan (30 Hari)';
            }

            // Aktifkan VIP pengguna langsung di database
            if (foundUser) {
                foundUser.isPremium = true;
                foundUser.vipTier = chosenTier;
                foundUser.vipGrantedAt = Date.now();
                if (chosenTier === '1month') foundUser.vipExpiresAt = Date.now() + (30 * 24 * 3600 * 1000);
                else if (chosenTier === '2months') foundUser.vipExpiresAt = Date.now() + (60 * 24 * 3600 * 1000);
                else if (chosenTier === '5months') foundUser.vipExpiresAt = Date.now() + (150 * 24 * 3600 * 1000);
                else if (chosenTier === 'permanent') foundUser.vipExpiresAt = null;

                const uIdx = (usersData.users || []).findIndex(x => x.id === foundUser.id);
                if (uIdx !== -1) {
                    usersData.users[uIdx] = foundUser;
                    await storage.writeDataAsync('users.json', usersData);
                }
            }

            const ordersData = await storage.readDataAsync('vip_orders.json', { orders: [] });
            const newOrder = {
                id: 'ord_' + Date.now(),
                userId: userId,
                username: username,
                email: userEmail,
                packageId: body.packageId || 'pkg_1month',
                packageName: body.packageName || 'Paket Bulanan',
                amount: body.amount || 19000,
                duration: durationText,
                vipTier: chosenTier,
                paymentMethod: 'QRIS',
                proofBase64: body.proofBase64 ? body.proofBase64.substring(0, 500000) : null,
                notes: body.notes || '',
                status: 'completed',
                createdAt: new Date().toISOString()
            };

            ordersData.orders = ordersData.orders || [];
            ordersData.orders.unshift(newOrder);
            if (ordersData.orders.length > 100) ordersData.orders = ordersData.orders.slice(0, 100);
            await storage.writeDataAsync('vip_orders.json', ordersData);

            // Kirim pesan resmi otomatis ke Kotak Masuk Pesan Admin pengguna
            try {
                const messagesApi = require('./messages.js');
                if (messagesApi && typeof messagesApi.sendVipWelcomeMessage === 'function') {
                    await messagesApi.sendVipWelcomeMessage(userId, username, chosenTier, durationText);
                }
            } catch (mErr) {
                console.error('[PAYMENT_CONFIG] Error sending VIP welcome message:', mErr.message);
            }

            return res.json({
                status: true,
                message: `Selamat! Keanggotaan VIP Anda telah aktif selama ${durationText} secara otomatis. Pesan konfirmasi resmi telah dikirim ke Kotak Masuk Pesan Admin!`,
                order: newOrder,
                isVipActive: true,
                user: foundUser ? {
                    id: foundUser.id,
                    username: foundUser.username,
                    isPremium: true,
                    vipTier: chosenTier,
                    vipExpiresAt: foundUser.vipExpiresAt
                } : null
            });
        } catch(err) {
            console.error('[PAYMENT_CONFIG] Error saving order:', err.message);
            return res.status(500).json({ status: false, message: 'Gagal mengirim konfirmasi' });
        }
    }

    // POST /api/payment-config (Admin Update Config)
    if (req.method === 'POST') {
        const token = req.headers['x-admin-token'] || req.query.token;
        if (!token || !adminAuth.isValidToken(token)) {
            return res.status(401).json({
                status: false,
                message: 'Akses ditolak: Token admin tidak valid atau kedaluwarsa'
            });
        }

        const body = req.body || {};
        const currentConfig = await getPaymentConfig();

        let updatedQrisUrl = currentConfig.qrisUrl;
        let updatedQrisBase64 = currentConfig.qrisBase64;

        // Reset to default QRIS if requested
        if (body.resetDefault) {
            const customPath = path.join(__dirname, '..', 'public', 'qris_custom.png');
            try {
                if (fs.existsSync(customPath)) fs.unlinkSync(customPath);
            } catch (e) {}
            updatedQrisUrl = '/qris.png';
            updatedQrisBase64 = null;
        } else if (body.qrisBase64 && typeof body.qrisBase64 === 'string') {
            updatedQrisBase64 = body.qrisBase64;
            updatedQrisUrl = body.qrisBase64; // Safe fallback for read-only serverless environment
            try {
                const matches = body.qrisBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                const buffer = matches ? Buffer.from(matches[2], 'base64') : Buffer.from(body.qrisBase64, 'base64');
                const targetPath = path.join(__dirname, '..', 'public', 'qris_custom.png');
                fs.writeFileSync(targetPath, buffer);
                updatedQrisUrl = `/qris_custom.png?v=${Date.now()}`;
            } catch (err) {
                console.warn('[PAYMENT_CONFIG] Local filesystem is read-only (EROFS). Storing QRIS in database via base64:', err.message);
                updatedQrisUrl = body.qrisBase64;
            }
        } else if (body.qrisUrl && typeof body.qrisUrl === 'string') {
            updatedQrisUrl = body.qrisUrl.trim();
        }

        // Parse packages if sent
        let updatedPackages = currentConfig.packages;
        if (Array.isArray(body.packages) && body.packages.length > 0) {
            updatedPackages = body.packages.map((pkg, idx) => ({
                id: pkg.id || `pkg_${Date.now()}_${idx}`,
                name: String(pkg.name || 'Paket VIP').trim(),
                duration: String(pkg.duration || '30 Hari').trim(),
                price: Number(pkg.price) || 19000,
                originalPrice: Number(pkg.originalPrice) || (Number(pkg.price) ? Number(pkg.price) * 1.5 : 35000),
                discount: String(pkg.discount || '').trim(),
                badge: String(pkg.badge || '').trim(),
                popular: !!pkg.popular,
                active: pkg.active !== false
            }));
        }

        // Parse benefits if sent
        let updatedBenefits = currentConfig.benefits;
        if (Array.isArray(body.benefits) && body.benefits.length > 0) {
            updatedBenefits = body.benefits.map((ben, idx) => ({
                id: ben.id || `ben_${Date.now()}_${idx}`,
                title: String(ben.title || 'Keuntungan VIP').trim(),
                desc: String(ben.desc || '').trim(),
                icon: String(ben.icon || 'shield-check').trim()
            }));
        }

        const updatedConfig = {
            qrisUrl: updatedQrisUrl,
            qrisBase64: updatedQrisBase64,
            qrisFilename: (body.qrisFilename && typeof body.qrisFilename === 'string') ? body.qrisFilename.trim() : currentConfig.qrisFilename,
            qrisHolder: (body.qrisHolder && typeof body.qrisHolder === 'string') ? body.qrisHolder.trim() : currentConfig.qrisHolder,
            adminWhatsapp: (body.adminWhatsapp && typeof body.adminWhatsapp === 'string') ? body.adminWhatsapp.trim().replace(/[^0-9]/g, '') : (currentConfig.adminWhatsapp || '6281234567890'),
            accounts: Array.isArray(body.accounts) ? body.accounts.map((acc, idx) => ({
                id: acc.id || `acc_${Date.now()}_${idx}`,
                bankName: String(acc.bankName || 'Bank').trim(),
                accountNumber: String(acc.accountNumber || '').trim(),
                accountHolder: String(acc.accountHolder || '').trim(),
                badge: String(acc.badge || 'Transfer').trim(),
                icon: String(acc.icon || 'credit-card').trim()
            })) : currentConfig.accounts,
            packages: updatedPackages,
            benefits: updatedBenefits,
            title: (body.title && typeof body.title === 'string') ? body.title.trim() : currentConfig.title,
            description: (body.description && typeof body.description === 'string') ? body.description.trim() : currentConfig.description,
            note: (body.note && typeof body.note === 'string') ? body.note.trim() : currentConfig.note,
            updatedAt: new Date().toISOString()
        };

        await storage.writeDataAsync(PAYMENT_CONFIG_FILE, updatedConfig);

        return res.json({
            status: true,
            message: 'Konfigurasi QRIS, Paket VIP, & Keuntungan Member berhasil diperbarui!',
            config: updatedConfig
        });
    }

    return res.status(405).json({ status: false, message: 'Method not allowed' });
};
