const path = require('path');
const crypto = require('crypto');
const adminAuth = require('./admin-auth.js');
const storage = require('./storage.js');
const messagesApi = require('./messages.js');

const VOUCHERS_FILE = 'vouchers.json';
const USERS_FILE = 'users.json';

const DEFAULT_VOUCHERS = [
    {
        id: 'vch_default_1month',
        code: 'VIP1BULAN',
        name: 'Voucher VIP 1 Bulan (Trial Member)',
        tier: '1month',
        durationDays: 30,
        border: 'border_platinum',
        borderName: 'Platinum',
        borderUrl: '/borders/Platinum.png',
        maxUses: 100,
        usedCount: 0,
        isActive: true,
        createdAt: 1790000000000,
        expiresAt: null,
        note: 'Voucher resmi MusifyStar VIP 1 Bulan',
        redeemedBy: []
    },
    {
        id: 'vch_default_permanent',
        code: 'SULTANVIP',
        name: 'Voucher VIP Sultan Permanen',
        tier: 'permanent',
        durationDays: 0,
        border: 'border_immortal',
        borderName: 'Immortal',
        borderUrl: '/borders/Imortal.png',
        maxUses: 10,
        usedCount: 0,
        isActive: true,
        createdAt: 1790000000000,
        expiresAt: null,
        note: 'Voucher Spesial Sultan Lifetime',
        redeemedBy: []
    }
];

async function readVouchersData() {
    try {
        const data = await storage.readDataAsync(VOUCHERS_FILE, { vouchers: DEFAULT_VOUCHERS });
        if (!data || !Array.isArray(data.vouchers)) {
            return { vouchers: DEFAULT_VOUCHERS };
        }
        return data;
    } catch (e) {
        return { vouchers: DEFAULT_VOUCHERS };
    }
}

async function writeVouchersData(data) {
    try {
        await storage.writeDataAsync(VOUCHERS_FILE, data || { vouchers: [] });
        return true;
    } catch (e) {
        console.error('[VOUCHERS] Gagal menyimpan data vouchers:', e.message);
        return false;
    }
}

function getTierDetails(tier) {
    tier = String(tier || '1month').toLowerCase().trim();
    if (tier === 'trial' || tier === '1week') {
        return { tier: '1month', durationDays: 7, name: 'Trial VIP (7 Hari)', border: 'border_platinum', borderName: 'Platinum', borderUrl: '/borders/Platinum.png', isTrial: true };
    } else if (tier === '2months') {
        return { tier: '2months', durationDays: 60, name: 'VIP 2 Bulan (60 Hari)', border: 'border_master', borderName: 'Master', borderUrl: '/borders/Master.png' };
    } else if (tier === '5months') {
        return { tier: '5months', durationDays: 150, name: 'VIP 5 Bulan (150 Hari)', border: 'border_legend', borderName: 'Legend', borderUrl: '/borders/Legend.png' };
    } else if (tier === 'permanent' || tier === 'lifetime') {
        return { tier: 'permanent', durationDays: 0, name: 'VIP Permanen (Selamanya)', border: 'border_immortal', borderName: 'Immortal', borderUrl: '/borders/Imortal.png' };
    }
    // Default 1 month
    return { tier: '1month', durationDays: 30, name: 'VIP 1 Bulan (30 Hari)', border: 'border_platinum', borderName: 'Platinum', borderUrl: '/borders/Platinum.png' };
}

module.exports = async function handler(req, res) {
    res.setHeader('Content-Type', 'application/json');

    const method = req.method;
    const action = String(req.query.action || req.body?.action || '').trim();
    const body = req.body || {};

    // -------------------------------------------------------------------------
    // 1. PUBLIC / USER ACTION: REDEEM VOUCHER
    // -------------------------------------------------------------------------
    if (action === 'redeem') {
        if (method !== 'POST') {
            return res.status(405).json({ status: false, message: 'Metode harus POST' });
        }

        const rawCode = String(body.code || '').trim().toUpperCase();
        if (!rawCode) {
            return res.status(400).json({ status: false, message: 'Silakan masukkan kode voucher terlebih dahulu!' });
        }

        // Get user identification
        const targetUserId = String(body.userId || body.id || '').trim();
        const targetUsername = String(body.username || '').trim();
        const targetEmail = String(body.email || '').trim().toLowerCase();

        if (!targetUserId && !targetUsername && !targetEmail) {
            return res.status(401).json({ status: false, message: 'Silakan login ke akun Anda terlebih dahulu untuk mengklaim kode voucher!' });
        }

        const vouchersDb = await readVouchersData();
        const voucher = (vouchersDb.vouchers || []).find(v => String(v.code || '').trim().toUpperCase() === rawCode);

        if (!voucher) {
            return res.status(404).json({ status: false, message: `Kode voucher "${rawCode}" tidak ditemukan atau salah. Periksa kembali huruf dan angkanya.` });
        }

        if (!voucher.isActive) {
            return res.status(400).json({ status: false, message: `Kode voucher "${rawCode}" sedang tidak aktif atau sudah dinonaktifkan oleh Admin.` });
        }

        if (voucher.expiresAt && Date.now() > voucher.expiresAt) {
            return res.status(400).json({ status: false, message: `Masa berlaku kode voucher "${rawCode}" sudah kedaluwarsa.` });
        }

        if (voucher.maxUses > 0 && (voucher.usedCount || 0) >= voucher.maxUses) {
            return res.status(400).json({ status: false, message: `Kuota pemakaian kode voucher "${rawCode}" sudah habis terpakai.` });
        }

        // Check if user already redeemed this voucher
        voucher.redeemedBy = Array.isArray(voucher.redeemedBy) ? voucher.redeemedBy : [];
        const alreadyRedeemed = voucher.redeemedBy.some(r => {
            if (targetUserId && String(r.userId) === targetUserId) return true;
            if (targetUsername && r.username && r.username.toLowerCase() === targetUsername.toLowerCase()) return true;
            if (targetEmail && r.email && r.email.toLowerCase() === targetEmail) return true;
            return false;
        });

        if (alreadyRedeemed) {
            return res.status(400).json({ status: false, message: 'Akun Anda sudah pernah mengklaim kode voucher ini sebelumnya!' });
        }

        // Load users database
        const usersDb = await storage.readDataAsync(USERS_FILE, { users: [], sessions: {} });
        let userIndex = -1;

        if (targetUserId) {
            userIndex = usersDb.users.findIndex(u => String(u.id) === targetUserId || (u.id && u.id.toLowerCase() === targetUserId.toLowerCase()));
        }
        if (userIndex === -1 && targetEmail) {
            userIndex = usersDb.users.findIndex(u => (u.email && u.email.toLowerCase() === targetEmail) || (u.rawEmail && u.rawEmail.toLowerCase() === targetEmail));
        }
        if (userIndex === -1 && targetUsername) {
            userIndex = usersDb.users.findIndex(u => u.username && u.username.toLowerCase() === targetUsername.toLowerCase());
        }

        if (userIndex === -1) {
            return res.status(404).json({ status: false, message: 'Akun pengguna tidak ditemukan di sistem. Silakan login ulang.' });
        }

        const user = usersDb.users[userIndex];
        const tierInfo = getTierDetails(voucher.tier);
        const durationDays = voucher.durationDays !== undefined ? voucher.durationDays : tierInfo.durationDays;
        const assignedTier = voucher.tier || tierInfo.tier;

        user.isPremium = true;
        user.is_premium = true;
        user.isVip = true;
        user.is_vip = true;
        user.vipTier = assignedTier;
        user.vipGrantedAt = Date.now();

        if (assignedTier === 'permanent' || durationDays === 0) {
            user.vipExpiresAt = null;
        } else {
            // If already VIP with valid future expiration, add onto existing duration
            const currentExp = (user.vipExpiresAt && user.vipExpiresAt > Date.now()) ? user.vipExpiresAt : Date.now();
            user.vipExpiresAt = currentExp + (durationDays * 24 * 60 * 60 * 1000);
        }

        // Assign border if designated or empty
        const assignedBorder = voucher.border || tierInfo.border;
        const assignedBorderName = voucher.borderName || tierInfo.borderName;
        const assignedBorderUrl = voucher.borderUrl || tierInfo.borderUrl;

        if (!user.border || user.border === 'none' || assignedTier === 'permanent') {
            user.border = assignedBorder;
            user.borderName = assignedBorderName;
            user.borderUrl = assignedBorderUrl;
        }

        usersDb.users[userIndex] = user;
        await storage.writeDataAsync(USERS_FILE, usersDb);

        // Record voucher usage
        voucher.usedCount = (voucher.usedCount || 0) + 1;
        voucher.redeemedBy.push({
            userId: user.id,
            username: user.username,
            email: user.rawEmail || user.email || '',
            redeemedAt: Date.now()
        });

        if (voucher.maxUses > 0 && voucher.usedCount >= voucher.maxUses) {
            voucher.isActive = false; // quota reached
        }

        await writeVouchersData(vouchersDb);

        // Send VIP welcome notification message
        try {
            if (messagesApi && typeof messagesApi.sendVipWelcomeMessage === 'function') {
                await messagesApi.sendVipWelcomeMessage(user.id, user.username, assignedTier);
            }
        } catch (mErr) {
            console.error('[VOUCHERS] Gagal kirim pesan otomatis VIP:', mErr.message);
        }

        const durationText = (assignedTier === 'permanent' || durationDays === 0) ? 'Permanen (Selamanya)' : `${durationDays} Hari`;

        return res.json({
            status: true,
            message: `🎉 Selamat! Voucher "${rawCode}" berhasil diklaim. Akun Anda kini aktif sebagai VIP (${tierInfo.name}) selama ${durationText}!`,
            user: {
                id: user.id,
                username: user.username,
                email: user.rawEmail || user.email,
                isPremium: user.isPremium,
                vipTier: user.vipTier,
                vipExpiresAt: user.vipExpiresAt,
                border: user.border,
                borderName: user.borderName,
                borderUrl: user.borderUrl
            },
            voucher: {
                code: voucher.code,
                name: voucher.name,
                tier: voucher.tier,
                durationText: durationText
            }
        });
    }

    // -------------------------------------------------------------------------
    // 2. ADMIN ACTIONS: CREATE, LIST, DELETE, TOGGLE VOUCHERS
    // -------------------------------------------------------------------------
    const adminToken = req.headers['x-admin-token'] || body.adminToken || req.query.adminToken;
    if (!adminToken || !adminAuth.verifyToken(adminToken)) {
        return res.status(401).json({ status: false, message: 'Akses Ditolak: Token admin tidak valid atau sesi berakhir' });
    }

    const vouchersDb = await readVouchersData();

    // 2.1 LIST ALL VOUCHERS (ADMIN)
    if (action === 'admin_list' || method === 'GET') {
        const list = vouchersDb.vouchers || [];
        return res.json({
            status: true,
            vouchers: list,
            stats: {
                total: list.length,
                active: list.filter(v => v.isActive && (!v.expiresAt || v.expiresAt > Date.now()) && (v.maxUses <= 0 || v.usedCount < v.maxUses)).length,
                totalRedeemed: list.reduce((acc, v) => acc + (v.usedCount || 0), 0)
            }
        });
    }

    // 2.2 CREATE NEW VOUCHER (ADMIN)
    if (action === 'admin_create' || action === 'create') {
        const rawCode = String(body.code || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
        if (!rawCode) {
            return res.status(400).json({ status: false, message: 'Kode voucher tidak boleh kosong (gunakan huruf dan angka).' });
        }

        // Check duplicate code
        const exists = (vouchersDb.vouchers || []).some(v => String(v.code || '').toUpperCase() === rawCode);
        if (exists) {
            return res.status(400).json({ status: false, message: `Kode voucher "${rawCode}" sudah ada di database. Silakan gunakan kode lain.` });
        }

        const isTrial = Boolean(body.isTrial || body.tier === 'trial' || body.tier === '1week');
        const tier = isTrial ? '1month' : String(body.tier || '1month').toLowerCase();
        const tierInfo = getTierDetails(isTrial ? 'trial' : tier);
        
        const customDays = parseInt(body.durationDays, 10);
        let durationDays = tierInfo.durationDays;
        if (!isNaN(customDays) && customDays >= 0) {
            durationDays = customDays;
        }
        if (tier === 'permanent' && !isTrial) {
            durationDays = 0;
        }

        const rawMaxUses = parseInt(body.maxUses, 10);
        const maxUses = (isNaN(rawMaxUses) || rawMaxUses === 0) ? 1 : rawMaxUses; // -1 for unlimited
        const note = String(body.note || '').trim();

        let expiresAt = null;
        if (body.expiresAt) {
            const expTime = new Date(body.expiresAt).getTime();
            if (!isNaN(expTime) && expTime > Date.now()) {
                expiresAt = expTime;
            }
        }

        let voucherName = String(body.name || '').trim();
        if (!voucherName) {
            if (isTrial) {
                voucherName = `Voucher Trial VIP (${durationDays} Hari)`;
            } else if (tier === 'permanent' || durationDays === 0) {
                voucherName = 'Voucher VIP Permanen (Selamanya)';
            } else {
                voucherName = `Voucher ${tierInfo.name}`;
            }
        }

        const newVoucher = {
            id: 'vch_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex'),
            code: rawCode,
            name: voucherName,
            isTrial: isTrial,
            tier: tierInfo.tier,
            durationDays: durationDays,
            border: body.border || tierInfo.border,
            borderName: body.borderName || tierInfo.borderName,
            borderUrl: body.borderUrl || tierInfo.borderUrl,
            maxUses: maxUses,
            usedCount: 0,
            isActive: true,
            createdAt: Date.now(),
            expiresAt: expiresAt,
            note: note,
            createdBy: 'Admin',
            redeemedBy: []
        };

        vouchersDb.vouchers.unshift(newVoucher);
        await writeVouchersData(vouchersDb);

        return res.json({
            status: true,
            message: `Kode voucher "${rawCode}" berhasil dibuat!`,
            voucher: newVoucher
        });
    }

    // 2.3 TOGGLE VOUCHER STATUS (ACTIVE / INACTIVE)
    if (action === 'admin_toggle' || action === 'toggle') {
        const targetId = String(body.id || body.voucherId || '').trim();
        const idx = (vouchersDb.vouchers || []).findIndex(v => v.id === targetId || v.code === targetId);

        if (idx === -1) {
            return res.status(404).json({ status: false, message: 'Voucher tidak ditemukan.' });
        }

        vouchersDb.vouchers[idx].isActive = !vouchersDb.vouchers[idx].isActive;
        await writeVouchersData(vouchersDb);

        const currentStatus = vouchersDb.vouchers[idx].isActive ? 'Diaktifkan' : 'Dinonaktifkan';
        return res.json({
            status: true,
            message: `Status voucher "${vouchersDb.vouchers[idx].code}" berhasil diubah menjadi ${currentStatus}.`,
            voucher: vouchersDb.vouchers[idx]
        });
    }

    // 2.4 DELETE VOUCHER (ADMIN)
    if (action === 'admin_delete' || action === 'delete') {
        const targetId = String(body.id || body.voucherId || '').trim();
        const initialLength = (vouchersDb.vouchers || []).length;

        vouchersDb.vouchers = (vouchersDb.vouchers || []).filter(v => v.id !== targetId && v.code !== targetId);

        if (vouchersDb.vouchers.length === initialLength) {
            return res.status(404).json({ status: false, message: 'Voucher tidak ditemukan.' });
        }

        await writeVouchersData(vouchersDb);
        return res.json({ status: true, message: 'Voucher berhasil dihapus dari sistem.' });
    }

    return res.status(400).json({ status: false, message: 'Aksi voucher tidak dikenali' });
};
