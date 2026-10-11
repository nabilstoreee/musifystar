const path = require('path');
const crypto = require('crypto');
const adminAuth = require('./admin-auth.js');
const storage = require('./storage.js');

const USER_JWT_SECRET = process.env.USER_JWT_SECRET || 'musifystar_user_secret_key_v2_sign_98741';

function safeCompare(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
}

function createSignedUserToken(userId, username) {
    const canonicalUid = typeof userId === 'object' && userId !== null ? (userId.id || userId.userId || String(userId)) : String(userId);
    const canonicalUser = typeof username === 'string' ? username : '';
    const payload = {
        uid: canonicalUid,
        u: canonicalUser,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days
    };
    const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto.createHmac('sha256', USER_JWT_SECRET).update(payloadStr).digest('base64url');
    return `usr_${payloadStr}.${signature}`;
}

function verifyUserToken(token) {
    if (!token || typeof token !== 'string') return null;
    const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
    if (!cleanToken) return null;

    if (cleanToken.startsWith('usr_')) {
        const parts = cleanToken.slice(4).split('.');
        if (parts.length === 2) {
            const [payloadStr, signature] = parts;
            try {
                const expectedSig = crypto.createHmac('sha256', USER_JWT_SECRET).update(payloadStr).digest('base64url');
                if (safeCompare(signature, expectedSig)) {
                    const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf8'));
                    if (payload && payload.uid && payload.exp && Math.floor(Date.now() / 1000) < payload.exp) {
                        return payload;
                    }
                }
            } catch (e) {}
        }
    }
    return null;
}

function getUserIdFromToken(token, db) {
    if (!token || typeof token !== 'string') return null;
    const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
    if (!cleanToken) return null;
    const verified = verifyUserToken(cleanToken);
    if (verified && verified.uid) {
        if (typeof verified.uid === 'object' && verified.uid !== null) {
            return verified.uid.id || verified.uid.userId || String(verified.uid);
        }
        return String(verified.uid);
    }
    if (db && db.sessions && db.sessions[cleanToken]) {
        const sess = db.sessions[cleanToken];
        return typeof sess.userId === 'object' && sess.userId !== null ? (sess.userId.id || sess.userId.userId) : sess.userId;
    }
    return null;
}

function resolveUserVipStatus(user) {
    if (!user) return { isPremium: false, vipTier: 'none', vipExpiresAt: null };
    const email = (user.rawEmail || user.email || '').toLowerCase().trim();
    const username = (user.username || '').toLowerCase().trim();
    const isMaster = (email === 'jrnabil570@gmail.com') || (username === 'nabil');
    if (isMaster) {
        return { isPremium: true, vipTier: 'permanent', vipExpiresAt: null };
    }
    const isVipExpired = user.vipExpiresAt && Date.now() > user.vipExpiresAt;
    const isTierActive = Boolean(user.vipTier && user.vipTier !== 'none');
    const isPremium = Boolean((user.isPremium || user.is_premium || isTierActive) && user.vipTier !== 'none' && !isVipExpired);
    const vipTier = isPremium ? (user.vipTier || 'permanent') : 'none';
    const vipExpiresAt = isPremium ? (user.vipExpiresAt || null) : null;
    return { isPremium, vipTier, vipExpiresAt };
}

// Ban registry async persistence helpers
async function readBanRegistryAsync() {
    try {
        const data = await storage.readDataAsync('.ban_registry.json', {});
        return (data && typeof data === 'object') ? data : {};
    } catch (e) {
        return {};
    }
}

async function writeBanRegistryAsync(registry) {
    try {
        await storage.writeDataAsync('.ban_registry.json', registry || {});
    } catch (e) {
        console.error('Failed to write ban registry to Neon PostgreSQL:', e.message);
    }
}

function readBanRegistrySync() {
    try {
        const data = storage.readData('.ban_registry.json', {});
        return (data && typeof data === 'object') ? data : {};
    } catch (e) {
        return {};
    }
}

// Banned IPs async persistence helpers
async function readBannedIpsAsync() {
    try {
        const data = await storage.readDataAsync('.banned_ips.json', {});
        return (data && typeof data === 'object') ? data : {};
    } catch (e) {
        return {};
    }
}

async function writeBannedIpsAsync(ipsMap) {
    try {
        await storage.writeDataAsync('.banned_ips.json', ipsMap || {});
    } catch (e) {
        console.error('Failed to write banned IPs to Neon PostgreSQL:', e.message);
    }
}

function readBannedIpsSync() {
    try {
        const data = storage.readData('.banned_ips.json', {});
        return (data && typeof data === 'object') ? data : {};
    } catch (e) {
        return {};
    }
}

function getIpBanStatus(ip, bannedMap) {
    if (!ip) return { isIpBanned: false };
    const banned = bannedMap || readBannedIpsSync();
    let cleanIp = String(ip).trim().toLowerCase().replace(/^::ffff:/, '');
    if (cleanIp === '::1' || cleanIp === 'localhost') cleanIp = '127.0.0.1';

    let matchKey = Object.keys(banned).find(k => {
        let cleanK = k.trim().toLowerCase().replace(/^::ffff:/, '');
        if (cleanK === '::1' || cleanK === 'localhost') cleanK = '127.0.0.1';
        if (!cleanK) return false;
        return cleanK === cleanIp || cleanIp.startsWith(cleanK) || cleanK.startsWith(cleanIp);
    });

    if (!matchKey) return { isIpBanned: false };

    const rec = banned[matchKey];
    if (rec.banType === 'temporary' && rec.banExpiresAt) {
        if (new Date(rec.banExpiresAt).getTime() <= Date.now()) {
            delete banned[matchKey];
            writeBannedIpsAsync(banned).catch(() => {});
            return { isIpBanned: false };
        }
    }

    let durText = rec.banDurationDays ? `${rec.banDurationDays} Hari` : '';
    if (rec.banDurationDays === 1) durText = '1 Hari 24 Jam';
    else if (rec.banDurationDays === 365) durText = '1 Tahun 365 Hari';

    return {
        isIpBanned: true,
        ip: rec.ip || ip,
        banType: rec.banType || 'permanent',
        banReason: rec.banReason || 'Alamat IP Anda telah diblokir secara khusus oleh administrator.',
        banExpiresAt: rec.banExpiresAt || null,
        banDurationDays: rec.banDurationDays || null,
        banDurationText: durText,
        createdAt: rec.createdAt
    };
}

// User Ban Status resolution with anti-tamper cross-check
function getUserBanStatus(user, banRegistry) {
    if (!user) {
        return { isBanned: false, isWarning: false, banType: 'none', banReason: '', banExpiresAt: null, banDurationText: '' };
    }

    // Cross-check anti-tamper ban registry
    try {
        const regMap = banRegistry || readBanRegistrySync();
        const emailKey = (user.rawEmail || user.email || '').toLowerCase();
        const reg = (user.id && regMap[user.id]) ||
                    (user.username && regMap[user.username.toLowerCase()]) ||
                    (emailKey && regMap[emailKey]);
        if (reg && reg.banType && reg.banType !== 'none') {
            let isStillActive = true;
            if (reg.banType === 'temporary' && reg.banExpiresAt) {
                if (new Date(reg.banExpiresAt).getTime() <= Date.now()) {
                    isStillActive = false;
                }
            }
            if (isStillActive) {
                user.banType = reg.banType;
                user.banReason = reg.banReason || user.banReason;
                user.banExpiresAt = reg.banExpiresAt || user.banExpiresAt;
                user.banDurationDays = reg.banDurationDays || user.banDurationDays;
            } else {
                user.banType = 'none';
                user.banReason = '';
                user.banExpiresAt = null;
                user.banDurationDays = null;
            }
        }
    } catch(e) {}

    if (!user.banType || user.banType === 'none') {
        return { isBanned: false, isWarning: false, banType: 'none', banReason: '', banExpiresAt: null, banDurationText: '' };
    }

    if (user.banType === 'permanent') {
        return {
            isBanned: true,
            isWarning: false,
            banType: 'permanent',
            banDurationText: 'Permanen',
            banReason: user.banReason || 'Akun Anda telah diblokir secara permanen oleh administrator karena pelanggaran.',
            banExpiresAt: null
        };
    }

    if (user.banType === 'temporary') {
        if (user.banExpiresAt && new Date(user.banExpiresAt).getTime() > Date.now()) {
            let durText = user.banDurationDays ? `${user.banDurationDays} Hari` : '';
            if (user.banDurationDays === 1) durText = '1Hari 24Jam';
            else if (user.banDurationDays === 5) durText = '5Hari';
            else if (user.banDurationDays === 7) durText = '7Hari';
            else if (user.banDurationDays === 10) durText = '10Hari';
            else if (user.banDurationDays === 20) durText = '20Hari';
            else if (user.banDurationDays === 30) durText = '1Bulan 30Hari';
            else if (user.banDurationDays === 60) durText = '2Bulan 60Hari';
            else if (user.banDurationDays === 365) durText = '1Tahun 365Hari';
            else if (user.banDurationDays === 730) durText = '2Tahun 730Hari';
            else if (user.banDurationDays === 1095) durText = '3Tahun 1095Hari';
            else if (user.banDurationDays === 1460) durText = '4Tahun 1460Hari';
            else if (user.banDurationDays === 1825) durText = '5Tahun 1825Hari';
            else if (user.banDurationDays === 3650) durText = '10Tahun 3650Hari';
            else if (user.banDurationDays === 10950) durText = '30Tahun 10950Hari';
            else if (user.banDurationDays === 14600) durText = '40Tahun 14600Hari';
            else if (user.banDurationDays === 18250) durText = '50Tahun 18250Hari';
            else if (user.banDurationDays === 32850) durText = '90Tahun 32850Hari';
            else if (user.banDurationDays === 36500) durText = '100Tahun 36500Hari';

            if (!durText && user.banExpiresAt) {
                const diffMs = new Date(user.banExpiresAt).getTime() - Date.now();
                const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                durText = `${diffDays} Hari`;
            }

            return {
                isBanned: true,
                isWarning: false,
                banType: 'temporary',
                banDurationText: durText || 'Sementara',
                banDurationDays: user.banDurationDays || null,
                banReason: user.banReason || 'Akun Anda sedang diblokir sementara oleh administrator.',
                banExpiresAt: user.banExpiresAt
            };
        } else {
            return { isBanned: false, isWarning: false, banType: 'none', banReason: '', banExpiresAt: null, banDurationText: '' };
        }
    }

    if (user.banType === 'warning') {
        return {
            isBanned: false,
            isWarning: true,
            banType: 'warning',
            banDurationText: 'Peringatan Akun',
            banReason: user.banReason || 'Peringatan Akun dari Administrator.',
            banExpiresAt: user.banExpiresAt || null
        };
    }

    return { isBanned: false, isWarning: false, banType: 'none', banReason: '', banExpiresAt: null, banDurationText: '' };
}

// Direct Database Async Fetcher (Neon PostgreSQL Primary)
async function readDbAsync(banRegistry) {
    try {
        const data = await storage.readDataAsync('users.json', { users: [], sessions: {} });
        const result = (data && typeof data === 'object') ? data : { users: [], sessions: {} };
        if (!Array.isArray(result.users)) result.users = [];
        if (!result.sessions || typeof result.sessions !== 'object') result.sessions = {};

        // Anti-Tamper Ban Registry Verification
        const regMap = banRegistry || await readBanRegistryAsync();
        if (result.users && Array.isArray(result.users)) {
            result.users.forEach(u => {
                if (u && u.id) {
                    if (u.rawEmail) {
                        u.email = u.rawEmail;
                    } else if (u.email && !u.rawEmail && !u.email.includes('***')) {
                        u.rawEmail = u.email;
                    }
                    const emailKey = (u.rawEmail || u.email || '').toLowerCase();
                    const reg = regMap[u.id] ||
                                (u.username && regMap[u.username.toLowerCase()]) ||
                                (emailKey && regMap[emailKey]);
                    if (reg && reg.banType && reg.banType !== 'none') {
                        let isStillBanned = true;
                        if (reg.banType === 'temporary' && reg.banExpiresAt) {
                            if (new Date(reg.banExpiresAt).getTime() <= Date.now()) {
                                isStillBanned = false;
                            }
                        }
                        if (isStillBanned) {
                            u.banType = reg.banType;
                            u.banReason = reg.banReason || u.banReason;
                            u.banExpiresAt = reg.banExpiresAt || u.banExpiresAt;
                            u.banDurationDays = reg.banDurationDays || u.banDurationDays;
                        } else {
                            u.banType = 'none';
                            u.banReason = '';
                            u.banExpiresAt = null;
                            u.banDurationDays = null;
                        }
                    }
                }
            });
        }
        return result;
    } catch (e) {
        console.error('readDbAsync error:', e.message);
        return { users: [], sessions: {} };
    }
}

// Direct Database Async Saver (Neon PostgreSQL Primary)
async function writeDbAsync(data) {
    try {
        await storage.writeDataAsync('users.json', data || { users: [], sessions: {} });
    } catch (e) {
        console.error('writeDbAsync error:', e.message);
    }
}

function hashPassword(password, salt) {
    salt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return { hash, salt };
}

function verifyPassword(password, hash, salt) {
    if (!password || !hash) return false;
    try {
        if (!salt) {
            const legacyHash = crypto.createHash('sha256').update(password).digest('hex');
            return safeCompare(hash, legacyHash);
        }
        const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
        if (safeCompare(hash, verifyHash)) return true;
        // Fallback in case hash was legacy sha256 with salt present
        const fallbackSha = crypto.createHash('sha256').update(password).digest('hex');
        return safeCompare(hash, fallbackSha);
    } catch (e) {
        return false;
    }
}

function maskIp(ip) {
    if (!ip) return '127.0.***.***';
    const parts = ip.split('.');
    if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.***.***`;
    }
    return ip.substring(0, Math.min(ip.length, 6)) + '***';
}

function maskEmail(email) {
    if (!email) return '';
    const atIndex = email.indexOf('@');
    if (atIndex <= 1) return email;
    const name = email.substring(0, atIndex);
    const domain = email.substring(atIndex);
    const maskedName = name[0] + '***' + (name.length > 2 ? name[name.length - 1] : '');
    return maskedName + domain;
}

function maskPassword(pw) {
    return '••••••••';
}

function getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        const list = forwarded.split(',');
        if (list.length > 0 && list[0].trim()) {
            return list[0].trim().replace(/^::ffff:/, '');
        }
    }
    const realIp = req.headers['x-real-ip'];
    if (realIp) return String(realIp).trim().replace(/^::ffff:/, '');
    const sockIp = req.socket && req.socket.remoteAddress;
    if (sockIp) return String(sockIp).trim().replace(/^::ffff:/, '');
    return '127.0.0.1';
}

module.exports = async (req, res) => {
    // Anti-Cache & CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token, x-user-id, x-user-name, x-user-email');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const action = (req.query.action || req.body?.action || '').toLowerCase();
        let body = req.body;
        if (typeof body === 'string') {
            try { body = JSON.parse(body); } catch (e) { body = {}; }
        }
        body = body || {};

        // Always read fresh from Neon PostgreSQL
        const banRegistry = await readBanRegistryAsync();
        const bannedIps = await readBannedIpsAsync();
        const db = await readDbAsync(banRegistry);
        const clientIp = getClientIp(req);

        // ==========================================
        // 1. ADMIN ACTIONS (Requires Admin Token)
        // ==========================================
        if (action.startsWith('admin_')) {
            const adminToken = req.headers['x-admin-token'] || body.adminToken || req.query.adminToken;
            if (!adminToken || !adminAuth.verifyToken(adminToken)) {
                return res.status(401).json({ status: false, message: 'Akses Ditolak: Token admin tidak valid atau sesi berakhir' });
            }

            // GET ALL USERS WITH LOGIN LOGS, IP, PASSWORD SENSOR & BAN STATUS
            if (action === 'admin_get_users' || action === 'admin_list_users') {
                const userList = db.users.map(u => {
                    const banStatus = getUserBanStatus(u, banRegistry);
                    const isMaster = (u.rawEmail || u.email || '').toLowerCase().trim() === 'jrnabil570@gmail.com';
                    const isVipExpired = u.vipExpiresAt && Date.now() > u.vipExpiresAt;
                    const isTierActive = Boolean(u.vipTier && u.vipTier !== 'none');
                    const isUserPremium = isMaster || (Boolean(u.isPremium || u.is_premium || isTierActive) && u.vipTier !== 'none' && !isVipExpired);
                    const userTier = isMaster ? 'permanent' : (isUserPremium ? (u.vipTier || 'permanent') : 'none');
                    return {
                        id: u.id,
                        username: u.username,
                        email: u.rawEmail || u.email,
                        avatar: u.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(u.username)}`,
                        createdAt: u.createdAt,
                        lastLoginAt: u.lastLoginAt || u.createdAt,
                        lastIp: u.rawLastIp || u.lastIp || '127.0.0.1',
                        maskedPassword: '••••••••',
                        isPremium: isUserPremium,
                        vipTier: userTier,
                        vipExpiresAt: isUserPremium ? (u.vipExpiresAt || null) : null,
                        border: isUserPremium ? (u.border || '') : '',
                        borderUrl: isUserPremium ? (u.borderUrl || '') : '',
                        borderName: isUserPremium ? (u.borderName || '') : '',
                        banType: u.banType || 'none',
                        banReason: u.banReason || '',
                        banExpiresAt: u.banExpiresAt || null,
                        banStatus: banStatus,
                        loginLogs: (u.loginLogs || []).map(l => ({
                            ip: l.rawIp || l.ip || '127.0.0.1',
                            timestamp: l.timestamp,
                            userAgent: l.userAgent
                        }))
                    };
                });

                return res.json({ status: true, users: userList });
            }

            // ADMIN SET VIP & BORDER ACCESS FOR ANY USER
            if (action === 'admin_set_vip') {
                const targetId = String(body.targetId || body.userId || body.id || '').trim();
                const targetUsername = String(body.username || '').trim().toLowerCase();
                const targetEmail = String(body.email || '').trim().toLowerCase();
                const vipTier = String(body.vipTier || 'none').toLowerCase(); // '1month', '5months', 'permanent', 'none'
                const isPremium = vipTier !== 'none';

                let userIndex = -1;
                if (targetId) {
                    userIndex = db.users.findIndex(u => u.id === targetId || (u.id && u.id.toLowerCase() === targetId.toLowerCase()));
                }
                if (userIndex === -1 && targetEmail) {
                    userIndex = db.users.findIndex(u =>
                        (u.email && u.email.toLowerCase() === targetEmail) ||
                        (u.rawEmail && u.rawEmail.toLowerCase() === targetEmail)
                    );
                }
                if (userIndex === -1 && targetUsername) {
                    userIndex = db.users.findIndex(u => u.username && u.username.toLowerCase() === targetUsername);
                }

                if (userIndex === -1) {
                    return res.status(404).json({ status: false, message: 'Pengguna tidak ditemukan' });
                }

                const user = db.users[userIndex];
                user.isPremium = isPremium;
                user.is_premium = isPremium;
                user.isVip = isPremium;
                user.is_vip = isPremium;
                user.vipTier = vipTier;
                user.vipGrantedAt = isPremium ? Date.now() : null;

                const customDays = parseInt(body.durationDays, 10);
                if (vipTier === 'permanent' || customDays === 0) {
                    user.vipExpiresAt = null; // Selamanya
                } else if (!isNaN(customDays) && customDays > 0) {
                    user.vipExpiresAt = Date.now() + (customDays * 24 * 60 * 60 * 1000);
                } else if (vipTier === 'trial' || vipTier === '1week') {
                    user.vipExpiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 hari trial
                } else if (vipTier === '1month') {
                    user.vipExpiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 hari
                } else if (vipTier === '2months') {
                    user.vipExpiresAt = Date.now() + (60 * 24 * 60 * 60 * 1000); // 60 hari
                } else if (vipTier === '5months') {
                    user.vipExpiresAt = Date.now() + (150 * 24 * 60 * 60 * 1000); // 150 hari
                } else if (vipTier === 'permanent') {
                    user.vipExpiresAt = null; // Selamanya
                } else {
                    user.isPremium = false;
                    user.is_premium = false;
                    user.isVip = false;
                    user.is_vip = false;
                    user.vipTier = 'none';
                    user.vipExpiresAt = null;
                    user.vipGrantedAt = null;
                    user.border = '';
                    user.borderUrl = '';
                    user.borderName = '';
                }

                // Admin direct border assignment (optional)
                const targetBorder = body.border !== undefined ? body.border : body.borderId;
                if (targetBorder !== undefined) {
                    const borderMap = {
                        'border_platinum': { name: 'Platinum', url: '/borders/Platinum.png' },
                        'border_master': { name: 'Master', url: '/borders/Master.png' },
                        'border_legend': { name: 'Legend', url: '/borders/Legend.png' },
                        'border_immortal': { name: 'Immortal', url: '/borders/Imortal.png' }
                    };
                    if (borderMap[targetBorder]) {
                        user.border = targetBorder;
                        user.borderUrl = borderMap[targetBorder].url;
                        user.borderName = borderMap[targetBorder].name;
                    } else if (targetBorder === 'none' || targetBorder === '') {
                        user.border = '';
                        user.borderUrl = '';
                        user.borderName = '';
                    }
                } else if (vipTier === '1month' && (user.border === 'border_legend' || user.border === 'border_immortal')) {
                    user.border = 'border_platinum';
                    user.borderUrl = '/borders/Platinum.png';
                    user.borderName = 'Platinum';
                } else if (vipTier === '2months' && user.border === 'border_immortal') {
                    user.border = 'border_legend';
                    user.borderUrl = '/borders/Legend.png';
                    user.borderName = 'Legend';
                }

                db.users[userIndex] = user;
                await writeDbAsync(db);

                // Kirim pesan otomatis ke Kotak Masuk Pesan Admin pengguna jika VIP aktif
                if (isPremium) {
                    try {
                        const messagesApi = require('./messages.js');
                        if (messagesApi && typeof messagesApi.sendVipWelcomeMessage === 'function') {
                            await messagesApi.sendVipWelcomeMessage(user.id, user.username, vipTier);
                        }
                    } catch (mErr) {
                        console.error('[AUTH] Gagal mengirim pesan otomatis VIP:', mErr.message);
                    }
                }

                const tierName = vipTier === '1month' 
                    ? 'VIP 1 Bulan (Border Platinum & Master + Semua Fitur)' 
                    : (vipTier === '2months'
                        ? 'VIP 2 Bulan (Border Platinum, Master, Legend + Semua Fitur)'
                        : (vipTier === '5months' 
                            ? 'VIP 5 Bulan (Border Platinum, Master, Legend, Immortal + Semua Fitur)' 
                            : (vipTier === 'permanent' 
                                ? 'VIP Permanen (Semua Border & Fitur Premium)' 
                                : 'Non-VIP (Gratis)')));

                return res.json({
                    status: true,
                    message: isPremium ? `Hak akses ${tierName} berhasil diberikan kepada @${user.username}!` : `Status VIP pengguna @${user.username} telah dinonaktifkan.`,
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.rawEmail || user.email,
                        isPremium: user.isPremium,
                        vipTier: user.vipTier,
                        vipExpiresAt: user.vipExpiresAt,
                        border: user.border,
                        borderUrl: user.borderUrl,
                        borderName: user.borderName
                    }
                });
            }

            // BAN / WARN / UNBAN USER
            if (action === 'admin_ban_user') {
                const targetId = String(body.targetId || body.userId || body.id || '').trim();
                const targetUsername = String(body.username || '').trim().toLowerCase();
                const targetEmail = String(body.email || '').trim().toLowerCase();
                const targetIp = String(body.ip || '').trim().toLowerCase();

                const banType = String(body.banType || 'none').toLowerCase();
                const durationDays = Number(body.durationDays || 0);
                const banReason = String(body.banReason || '').trim();

                let userIndex = -1;

                if (targetId) {
                    userIndex = db.users.findIndex(u => u.id === targetId || u.id.toLowerCase() === targetId.toLowerCase());
                    if (userIndex === -1) {
                        userIndex = db.users.findIndex(u => u.id.toLowerCase().includes(targetId.toLowerCase()));
                    }
                } else if (targetUsername) {
                    userIndex = db.users.findIndex(u => u.username && u.username.toLowerCase() === targetUsername);
                } else if (targetEmail) {
                    userIndex = db.users.findIndex(u =>
                        (u.email && u.email.toLowerCase() === targetEmail) ||
                        (u.rawEmail && u.rawEmail.toLowerCase() === targetEmail)
                    );
                } else if (targetIp) {
                    userIndex = db.users.findIndex(u =>
                        (u.lastIp || '').toLowerCase().includes(targetIp) ||
                        (u.rawLastIp || '').toLowerCase().includes(targetIp) ||
                        (u.loginLogs || []).some(l => (l.ip || '').toLowerCase().includes(targetIp) || (l.rawIp || '').toLowerCase().includes(targetIp))
                    );
                }

                if (userIndex === -1) {
                    const queryInfo = targetId ? `User ID "${targetId}"` : targetUsername ? `Username "@${targetUsername}"` : targetEmail ? `Email "${targetEmail}"` : targetIp ? `IP "${targetIp}"` : 'kriteria tersebut';
                    return res.status(404).json({ status: false, message: `Pengguna dengan ${queryInfo} tidak ditemukan.` });
                }

                const user = db.users[userIndex];
                user.banType = banType;
                if (banType === 'none') {
                    user.banReason = '';
                    user.banExpiresAt = null;
                    user.banDurationDays = null;
                } else {
                    user.banReason = banReason || 'Akun Anda telah diblokir atau diberikan sanksi oleh administrator.';
                }

                if (banType === 'temporary' && durationDays > 0) {
                    const expires = new Date();
                    expires.setDate(expires.getDate() + durationDays);
                    user.banExpiresAt = expires.toISOString();
                    user.banDurationDays = durationDays;
                } else {
                    user.banExpiresAt = null;
                    user.banDurationDays = null;
                }

                // Update Ban Registry for Anti-Tamper Protection
                const userEmail = (user.rawEmail || user.email || '').toLowerCase();
                if (banType === 'none') {
                    delete banRegistry[user.id];
                    if (user.username) delete banRegistry[user.username.toLowerCase()];
                    if (userEmail) delete banRegistry[userEmail];
                } else {
                    const regObj = {
                        userId: user.id,
                        username: user.username,
                        email: userEmail,
                        banType: user.banType,
                        banReason: user.banReason,
                        banExpiresAt: user.banExpiresAt,
                        banDurationDays: user.banDurationDays,
                        updatedAt: new Date().toISOString()
                    };
                    banRegistry[user.id] = regObj;
                    if (user.username) banRegistry[user.username.toLowerCase()] = regObj;
                    if (userEmail) banRegistry[userEmail] = regObj;
                }
                await writeBanRegistryAsync(banRegistry);

                // If user is banned, invalidate their active sessions
                if (banType === 'permanent' || banType === 'temporary') {
                    Object.keys(db.sessions).forEach(tok => {
                        if (db.sessions[tok] && (db.sessions[tok].userId === user.id || db.sessions[tok].userId?.id === user.id)) {
                            db.sessions[tok].banned = true;
                        }
                    });
                }

                db.users[userIndex] = user;
                await writeDbAsync(db);

                const freshBanStatus = getUserBanStatus(user, banRegistry);
                return res.json({
                    status: true,
                    message: banType === 'none' ? 'Sanksi akun berhasil dicabut / di-unban' : `Sanksi berhasil diterapkan (${user.banType})`,
                    banStatus: freshBanStatus,
                    user: {
                        id: user.id,
                        username: user.username,
                        banType: user.banType,
                        banReason: user.banReason,
                        banExpiresAt: user.banExpiresAt
                    }
                });
            }

            // UNBAN USER (Explicit Action)
            if (action === 'admin_unban_user') {
                const targetId = String(body.targetId || body.userId || body.id || '').trim();
                const targetUsername = String(body.username || '').trim().toLowerCase();
                const targetEmail = String(body.email || '').trim().toLowerCase();

                let userIndex = -1;
                if (targetId) {
                    userIndex = db.users.findIndex(u => u.id === targetId || u.id.toLowerCase() === targetId.toLowerCase());
                } else if (targetUsername) {
                    userIndex = db.users.findIndex(u => u.username && u.username.toLowerCase() === targetUsername);
                } else if (targetEmail) {
                    userIndex = db.users.findIndex(u =>
                        (u.email && u.email.toLowerCase() === targetEmail) ||
                        (u.rawEmail && u.rawEmail.toLowerCase() === targetEmail)
                    );
                }

                if (userIndex !== -1) {
                    const user = db.users[userIndex];
                    user.banType = 'none';
                    user.banReason = '';
                    user.banExpiresAt = null;
                    user.banDurationDays = null;
                    db.users[userIndex] = user;

                    const userEmail = (user.rawEmail || user.email || '').toLowerCase();
                    delete banRegistry[user.id];
                    if (user.username) delete banRegistry[user.username.toLowerCase()];
                    if (userEmail) delete banRegistry[userEmail];
                    await writeBanRegistryAsync(banRegistry);
                    await writeDbAsync(db);
                } else {
                    if (targetId) delete banRegistry[targetId];
                    if (targetUsername) delete banRegistry[targetUsername];
                    if (targetEmail) delete banRegistry[targetEmail];
                    await writeBanRegistryAsync(banRegistry);
                }

                return res.json({ status: true, message: 'Akun berhasil di-unban dan dipulihkan sepenuhnya.' });
            }

            // DELETE USER (Admin can delete ANY account directly, whether active or banned)
            if (action === 'admin_delete_user') {
                const targetId = String(body.targetId || body.userId || body.id || '').trim();
                const targetUsername = String(body.username || '').trim().toLowerCase();
                const targetEmail = String(body.email || '').trim().toLowerCase();

                if (!targetId && !targetUsername && !targetEmail) {
                    return res.status(400).json({ status: false, message: 'Identitas target pengguna wajib diisi' });
                }

                let userIndex = -1;
                if (targetId) {
                    userIndex = db.users.findIndex(u => u.id === targetId || (u.id && u.id.toLowerCase() === targetId.toLowerCase()));
                }
                if (userIndex === -1 && targetUsername) {
                    userIndex = db.users.findIndex(u => u.username && u.username.toLowerCase() === targetUsername);
                }
                if (userIndex === -1 && targetEmail) {
                    userIndex = db.users.findIndex(u =>
                        (u.email && u.email.toLowerCase() === targetEmail) ||
                        (u.rawEmail && u.rawEmail.toLowerCase() === targetEmail)
                    );
                }

                let deletedUsername = targetUsername || targetId;

                if (userIndex !== -1) {
                    const deletedUser = db.users[userIndex];
                    deletedUsername = deletedUser.username || deletedUsername;
                    const uId = deletedUser.id;
                    db.users.splice(userIndex, 1);

                    // Clean all sessions
                    Object.keys(db.sessions).forEach(tok => {
                        if (db.sessions[tok] && (db.sessions[tok].userId === uId || db.sessions[tok].userId?.id === uId || db.sessions[tok].userId === targetId)) {
                            delete db.sessions[tok];
                        }
                    });

                    // Clean ban registry
                    if (uId) delete banRegistry[uId];
                    if (deletedUser.username) delete banRegistry[deletedUser.username.toLowerCase()];
                    if (deletedUser.email) delete banRegistry[deletedUser.email.toLowerCase()];
                    if (deletedUser.rawEmail) delete banRegistry[deletedUser.rawEmail.toLowerCase()];
                }

                // Also purge from ban registry directly if was registered under ID / username / email
                if (targetId) delete banRegistry[targetId];
                if (targetUsername) delete banRegistry[targetUsername];
                if (targetEmail) delete banRegistry[targetEmail];

                await writeBanRegistryAsync(banRegistry);
                await writeDbAsync(db);

                return res.json({ status: true, message: `Akun @${deletedUsername} berhasil dihapus permanen dari sistem.` });
            }

            // BAN IP ADDRESS (BLACKLIST)
            if (action === 'admin_ban_ip') {
                const targetIp = String(body.ip || '').trim().replace(/^::ffff:/, '');
                const banType = String(body.banType || 'permanent').toLowerCase();
                const durationDays = Number(body.durationDays || 0);
                const banReason = String(body.banReason || '').trim() || 'Alamat IP ini diblacklist oleh administrator.';

                if (!targetIp) {
                    return res.status(400).json({ status: false, message: 'Alamat IP target wajib diisi' });
                }

                let expiresAt = null;
                if (banType === 'temporary' && durationDays > 0) {
                    const exp = new Date();
                    exp.setDate(exp.getDate() + durationDays);
                    expiresAt = exp.toISOString();
                }

                bannedIps[targetIp] = {
                    ip: targetIp,
                    banType: banType,
                    banReason: banReason,
                    banExpiresAt: expiresAt,
                    banDurationDays: durationDays,
                    createdAt: new Date().toISOString()
                };

                await writeBannedIpsAsync(bannedIps);
                return res.json({ status: true, message: `Alamat IP ${targetIp} berhasil diblokir (${banType})`, record: bannedIps[targetIp] });
            }

            // UNBAN IP ADDRESS
            if (action === 'admin_unban_ip') {
                const targetIp = String(body.ip || '').trim().replace(/^::ffff:/, '');
                if (!targetIp) {
                    return res.status(400).json({ status: false, message: 'Alamat IP target wajib diisi' });
                }

                let deleted = false;
                Object.keys(bannedIps).forEach(k => {
                    if (k === targetIp || k.toLowerCase() === targetIp.toLowerCase()) {
                        delete bannedIps[k];
                        deleted = true;
                    }
                });

                await writeBannedIpsAsync(bannedIps);
                return res.json({ status: true, message: deleted ? `Alamat IP ${targetIp} berhasil di-unban` : 'Alamat IP tidak ditemukan di blacklist' });
            }

            // GET BANNED IPS LIST
            if (action === 'admin_get_banned_ips') {
                return res.json({ status: true, bannedIps: bannedIps });
            }

            return res.status(400).json({ status: false, message: 'Action admin tidak dikenal' });
        }

        // ==========================================
        // 2. USER ACTIONS (GET ME, LOGIN, REGISTER, ETC)
        // ==========================================

        // Check if current client IP is IP-Banned
        const ipBanCheck = getIpBanStatus(clientIp, bannedIps);
        if (ipBanCheck.isIpBanned) {
            return res.json({
                status: false,
                ipBanned: true,
                banned: true,
                ban: {
                    isBanned: true,
                    isIpBanned: true,
                    ip: clientIp,
                    banType: ipBanCheck.banType,
                    banReason: ipBanCheck.banReason,
                    banExpiresAt: ipBanCheck.banExpiresAt,
                    banDurationDays: ipBanCheck.banDurationDays,
                    banDurationText: ipBanCheck.banDurationText
                },
                message: 'ALAMAT IP ANDA DIBLOKIR / DIBANNED KHUSUS OLEH ADMINISTRATOR'
            });
        }

        // GET /api/user-auth?action=check_account_ban
        if (action === 'check_account_ban') {
            const targetUsername = String(req.query.username || body.username || '').trim().toLowerCase();
            const targetEmail = String(req.query.email || body.email || '').trim().toLowerCase();
            const targetUserId = String(req.query.userId || body.userId || '').trim();

            if (ipBanCheck.isIpBanned) {
                return res.json({
                    status: true,
                    banned: true,
                    ipBanned: true,
                    ban: {
                        isBanned: true,
                        isIpBanned: true,
                        ip: clientIp,
                        banType: ipBanCheck.banType,
                        banReason: ipBanCheck.banReason,
                        banExpiresAt: ipBanCheck.banExpiresAt,
                        banDurationDays: ipBanCheck.banDurationDays,
                        banDurationText: ipBanCheck.banDurationText
                    }
                });
            }

            const user = db.users.find(u => {
                if (targetUserId && (u.id === targetUserId || u.id.toLowerCase() === targetUserId.toLowerCase())) return true;
                if (targetUsername && u.username && u.username.toLowerCase() === targetUsername) return true;
                if (targetEmail && ((u.rawEmail && u.rawEmail.toLowerCase() === targetEmail) || (u.email && u.email.toLowerCase() === targetEmail))) return true;
                return false;
            });

            // Direct check against ban registry
            const reg = (targetUserId && banRegistry[targetUserId]) ||
                        (targetUsername && banRegistry[targetUsername]) ||
                        (targetEmail && banRegistry[targetEmail]);
            if (reg && reg.banType && reg.banType !== 'none') {
                let isStillActive = true;
                if (reg.banType === 'temporary' && reg.banExpiresAt && new Date(reg.banExpiresAt).getTime() <= Date.now()) {
                    isStillActive = false;
                }
                if (isStillActive) {
                    const regBanStatus = getUserBanStatus(reg, banRegistry);
                    return res.json({
                        status: true,
                        banned: true,
                        unbanned: false,
                        ban: regBanStatus,
                        user: user ? { id: user.id, username: user.username } : { id: reg.userId || targetUserId, username: reg.username || targetUsername }
                    });
                }
            }

            if (!user) {
                return res.json({ status: false, banned: true, unbanned: false, message: 'Identitas akun tidak ditemukan' });
            }

            const banStatus = getUserBanStatus(user, banRegistry);
            return res.json({
                status: true,
                banned: banStatus.isBanned,
                unbanned: !banStatus.isBanned,
                ban: banStatus,
                user: { id: user.id, username: user.username }
            });
        }

        // GET /api/user-auth?action=me
        if (req.method === 'GET' || action === 'me') {
            const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '') ||
                          req.headers['x-auth-token'] ||
                          req.headers['x-token'] ||
                          req.query.token ||
                          (req.body && req.body.token);
            const fallbackUserId = String(req.headers['x-user-id'] || req.query.userId || '').trim();
            const fallbackUsername = String(req.headers['x-user-name'] || req.query.username || '').trim().toLowerCase();
            const fallbackEmail = String(req.headers['x-user-email'] || req.query.email || '').trim().toLowerCase();

            let targetUserId = getUserIdFromToken(token, db);
            let user = null;

            if (targetUserId) {
                user = db.users.find(u => u.id === targetUserId);
            }

            // Fallback claimed user
            if (!user && (fallbackUserId || fallbackUsername || fallbackEmail)) {
                user = db.users.find(u => {
                    if (fallbackUserId && (u.id === fallbackUserId || u.id.toLowerCase() === fallbackUserId.toLowerCase())) return true;
                    if (fallbackUsername && u.username && u.username.toLowerCase() === fallbackUsername) return true;
                    if (fallbackEmail && ((u.rawEmail && u.rawEmail.toLowerCase() === fallbackEmail) || (u.email && u.email.toLowerCase() === fallbackEmail))) return true;
                    return false;
                });
            }

            if (user) {
                const banStatus = getUserBanStatus(user, banRegistry);
                if (banStatus.isBanned) {
                    return res.json({
                        status: true,
                        authenticated: false,
                        banned: true,
                        ban: banStatus,
                        user: {
                            id: user.id,
                            username: user.username,
                            email: user.rawEmail || user.email,
                            rawEmail: user.rawEmail || user.email,
                            avatar: user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.username)}`,
                            createdAt: user.createdAt
                        },
                        message: banStatus.banReason || 'Akun Anda sedang diblokir oleh administrator.'
                    });
                }

                if (targetUserId) {
                    return res.json({
                        status: true,
                        authenticated: true,
                        banned: false,
                        ban: banStatus,
                        clientIp: clientIp,
                        ip: clientIp,
                        user: {
                            id: user.id,
                            username: user.username,
                            email: user.rawEmail || user.email,
                            rawEmail: user.rawEmail || user.email,
                            avatar: user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.username)}`,
                            border: user.border || '',
                            borderUrl: user.borderUrl || '',
                            borderName: user.borderName || '',
                            equippedBadge: user.equippedBadge || '',
                            equippedBadgeTitle: user.equippedBadgeTitle || '',
                            equippedBadgeIcon: user.equippedBadgeIcon || '',
                            equippedBadgeColor: user.equippedBadgeColor || '',
                            isPremium: resolveUserVipStatus(user).isPremium,
                            vipTier: resolveUserVipStatus(user).vipTier,
                            vipExpiresAt: resolveUserVipStatus(user).vipExpiresAt,
                            role: user.role || (((user.rawEmail || user.email || '').toLowerCase().trim() === 'jrnabil570@gmail.com') ? 'admin' : 'member'),
                            createdAt: user.createdAt,
                            ip: clientIp,
                            lastIp: clientIp
                        }
                    });
                } else {
                    return res.json({
                        status: true,
                        authenticated: false,
                        unverifiedProbe: true,
                        banned: false,
                        ban: banStatus,
                        user: null
                    });
                }
            }

            // Direct ban registry check for claimed identifiers
            const reg = (fallbackUserId && banRegistry[fallbackUserId]) ||
                        (fallbackUsername && banRegistry[fallbackUsername]) ||
                        (fallbackEmail && banRegistry[fallbackEmail]);
            if (reg && reg.banType && reg.banType !== 'none') {
                let isStillActive = true;
                if (reg.banType === 'temporary' && reg.banExpiresAt && new Date(reg.banExpiresAt).getTime() <= Date.now()) {
                    isStillActive = false;
                }
                if (isStillActive) {
                    const regBanStatus = getUserBanStatus(reg, banRegistry);
                    return res.json({
                        status: true,
                        authenticated: false,
                        banned: true,
                        ban: regBanStatus,
                        user: {
                            id: reg.userId || fallbackUserId,
                            username: reg.username || fallbackUsername,
                            email: fallbackEmail
                        },
                        message: reg.banReason || 'Akun Anda sedang diblokir oleh administrator.'
                    });
                }
            }

            return res.json({ status: true, authenticated: false, banned: false, user: null });
        }

        // POST /api/user-auth?action=register
        if (action === 'register') {
            const username = String(body.username || '').trim();
            const email = String(body.email || '').trim().toLowerCase();
            const password = String(body.password || '').trim();

            if (!username) {
                return res.status(400).json({ status: false, message: 'Username wajib diisi' });
            }
            if (username.length < 3) {
                return res.status(400).json({ status: false, message: 'Username minimal 3 karakter' });
            }
            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return res.status(400).json({ status: false, message: 'Format email tidak valid' });
            }
            if (!password || password.length < 6) {
                return res.status(400).json({ status: false, message: 'Password minimal 6 karakter/huruf' });
            }

            // Check if username or email already exists
            const existsUser = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
            if (existsUser) {
                return res.status(400).json({ status: false, message: 'Username sudah digunakan, silakan pilih yang lain' });
            }
            const existsEmail = db.users.find(u => (u.rawEmail && u.rawEmail.toLowerCase() === email.toLowerCase()) || u.email.toLowerCase() === email.toLowerCase());
            if (existsEmail) {
                return res.status(400).json({ status: false, message: 'Email sudah terdaftar, silakan login' });
            }

            const { hash, salt } = hashPassword(password);
            const nowIso = new Date().toISOString();
            const maskedClientIp = maskIp(clientIp);
            const newUser = {
                id: 'u_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex'),
                username: username,
                email: email,
                rawEmail: email,
                passwordHash: hash,
                passwordSalt: salt,
                maskedPassword: '••••••••',
                avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`,
                createdAt: nowIso,
                lastLoginAt: nowIso,
                lastIp: maskedClientIp,
                rawLastIp: clientIp,
                banType: 'none',
                banReason: '',
                banExpiresAt: null,
                loginLogs: [
                    {
                        ip: maskedClientIp,
                        rawIp: clientIp,
                        timestamp: nowIso,
                        userAgent: req.headers['user-agent'] || ''
                    }
                ]
            };

            db.users.push(newUser);

            // Auto login after register
            const token = createSignedUserToken(newUser.id, newUser.username);
            db.sessions = db.sessions || {};
            db.sessions[token] = {
                userId: newUser.id,
                createdAt: Date.now(),
                rememberMe: true
            };

            await writeDbAsync(db);

            return res.json({
                status: true,
                message: 'Pendaftaran berhasil!',
                token: token,
                ban: getUserBanStatus(newUser, banRegistry),
                user: {
                    id: newUser.id,
                    username: newUser.username,
                    email: newUser.rawEmail || newUser.email,
                    avatar: newUser.avatar,
                    createdAt: newUser.createdAt
                }
            });
        }

        // POST /api/user-auth?action=login
        if (action === 'login') {
            const username = String(body.username || '').trim();
            const email = String(body.email || '').trim().toLowerCase();
            const password = String(body.password || '').trim();
            const rememberMe = body.rememberMe !== false;

            if (!username && !email) {
                return res.status(400).json({ status: false, message: 'Username atau Email wajib diisi' });
            }
            if (!password || password.length < 6) {
                return res.status(400).json({ status: false, message: 'Password minimal 6 karakter/huruf' });
            }

            // Find user by username or email
            const user = db.users.find(u => {
                if (username && u.username.toLowerCase() === username.toLowerCase()) return true;
                if (email && ((u.rawEmail && u.rawEmail.toLowerCase() === email.toLowerCase()) || u.email.toLowerCase() === email.toLowerCase() || u.email.toLowerCase() === maskEmail(email).toLowerCase())) return true;
                return false;
            });

            if (!user) {
                return res.status(401).json({ status: false, message: 'Akun tidak ditemukan. Silakan periksa kembali username/email atau daftar baru.' });
            }

            const isMatch = verifyPassword(password, user.passwordHash, user.passwordSalt);
            if (!isMatch) {
                return res.status(401).json({ status: false, message: 'Password salah. Silakan coba lagi.' });
            }

            // Check if user is BANNED
            const banStatus = getUserBanStatus(user, banRegistry);
            if (banStatus.isBanned) {
                return res.json({
                    status: false,
                    banned: true,
                    ban: banStatus,
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.rawEmail || user.email,
                        rawEmail: user.rawEmail || user.email
                    },
                    message: banStatus.banReason || 'Akun Anda sedang diblokir oleh administrator.'
                });
            }

            // Record Login Log & IP
            const nowIso = new Date().toISOString();
            const maskedClientIp = maskIp(clientIp);
            user.lastLoginAt = nowIso;
            user.lastIp = maskedClientIp;
            user.rawLastIp = clientIp;
            user.maskedPassword = '••••••••';
            user.loginLogs = user.loginLogs || [];
            user.loginLogs.unshift({
                ip: maskedClientIp,
                rawIp: clientIp,
                timestamp: nowIso,
                userAgent: req.headers['user-agent'] || ''
            });
            if (user.loginLogs.length > 20) {
                user.loginLogs = user.loginLogs.slice(0, 20);
            }

            const token = createSignedUserToken(user.id, user.username);
            db.sessions = db.sessions || {};
            db.sessions[token] = {
                userId: user.id,
                createdAt: Date.now(),
                rememberMe: rememberMe
            };

            await writeDbAsync(db);

            return res.json({
                status: true,
                message: 'Login berhasil!',
                token: token,
                ban: banStatus,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.rawEmail || user.email,
                    rawEmail: user.rawEmail || user.email,
                    avatar: user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.username)}`,
                    border: user.border || '',
                    borderUrl: user.borderUrl || '',
                    borderName: user.borderName || '',
                    isPremium: resolveUserVipStatus(user).isPremium,
                    vipTier: resolveUserVipStatus(user).vipTier,
                    vipExpiresAt: resolveUserVipStatus(user).vipExpiresAt,
                    role: user.role || (((user.rawEmail || user.email || '').toLowerCase().trim() === 'jrnabil570@gmail.com') ? 'admin' : 'member'),
                    createdAt: user.createdAt
                }
            });
        }

        // POST /api/user-auth?action=google_login
        if (action === 'google_login') {
            const email = String(body.email || '').trim().toLowerCase();
            const name = String(body.name || '').trim();
            const photoUrl = String(body.photoUrl || '').trim();
            const googleId = String(body.googleId || '').trim();

            if (!email || !email.includes('@')) {
                return res.status(400).json({ status: false, message: 'Email akun Google tidak valid' });
            }

            // Find existing user by email
            let user = db.users.find(u => {
                if (u.rawEmail && u.rawEmail.toLowerCase() === email) return true;
                if (u.email && u.email.toLowerCase() === email) return true;
                if (u.email && u.email.toLowerCase() === maskEmail(email).toLowerCase()) return true;
                return false;
            });

            const nowIso = new Date().toISOString();
            const maskedClientIp = maskIp(clientIp);

            if (user) {
                // User already exists, update info if needed
                if (!user.rawEmail) user.rawEmail = email;
                if (photoUrl && (!user.avatar || user.avatar.includes('dicebear'))) {
                    user.avatar = photoUrl;
                }
                if (googleId && !user.googleId) {
                    user.googleId = googleId;
                }
                if (user.provider !== 'google') {
                    user.googleLinked = true;
                }
            } else {
                // Generate a clean username from Google name or email
                let baseUsername = (name || email.split('@')[0])
                    .replace(/[^a-zA-Z0-9_]/g, '')
                    .trim()
                    .slice(0, 20);
                if (baseUsername.length < 3) baseUsername = 'user_' + Math.floor(1000 + Math.random() * 9000);

                let uniqueUsername = baseUsername;
                let counter = 1;
                while (db.users.some(u => u.username.toLowerCase() === uniqueUsername.toLowerCase())) {
                    uniqueUsername = `${baseUsername.slice(0, 15)}_${counter++}`;
                }

                // If email is jrnabil570@gmail.com, ensure proper role/username
                const isMasterAdmin = (email === 'jrnabil570@gmail.com');
                const finalUsername = isMasterAdmin ? 'MusifyStar Official' : uniqueUsername;
                const userId = isMasterAdmin ? 'u_1790196636099_622dc736' : ('u_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex'));

                user = {
                    id: userId,
                    username: finalUsername,
                    email: isMasterAdmin ? 'jrnabil570@gmail.com' : maskEmail(email),
                    rawEmail: email,
                    avatar: photoUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(finalUsername)}`,
                    provider: 'google',
                    googleId: googleId || undefined,
                    role: isMasterAdmin ? 'admin' : 'member',
                    createdAt: nowIso
                };

                db.users.push(user);
            }

            // Check if user is BANNED
            const banStatus = getUserBanStatus(user, banRegistry);
            if (banStatus.isBanned) {
                return res.json({
                    status: false,
                    banned: true,
                    ban: banStatus,
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.rawEmail || user.email,
                        rawEmail: user.rawEmail || user.email
                    },
                    message: banStatus.banReason || 'Akun Anda sedang diblokir oleh administrator.'
                });
            }

            // Record Login Log & IP
            user.lastLoginAt = nowIso;
            user.lastIp = maskedClientIp;
            user.rawLastIp = clientIp;
            user.loginLogs = user.loginLogs || [];
            user.loginLogs.unshift({
                ip: maskedClientIp,
                rawIp: clientIp,
                timestamp: nowIso,
                provider: 'google',
                userAgent: req.headers['user-agent'] || ''
            });
            if (user.loginLogs.length > 20) {
                user.loginLogs = user.loginLogs.slice(0, 20);
            }

            const token = createSignedUserToken(user.id, user.username);
            db.sessions = db.sessions || {};
            db.sessions[token] = {
                userId: user.id,
                createdAt: Date.now(),
                rememberMe: true,
                provider: 'google'
            };

            await writeDbAsync(db);

            return res.json({
                status: true,
                message: 'Login Google berhasil!',
                token: token,
                ban: banStatus,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.rawEmail || user.email,
                    rawEmail: user.rawEmail || user.email,
                    avatar: user.avatar,
                    border: user.border || '',
                    borderUrl: user.borderUrl || '',
                    borderName: user.borderName || '',
                    isPremium: resolveUserVipStatus(user).isPremium,
                    vipTier: resolveUserVipStatus(user).vipTier,
                    vipExpiresAt: resolveUserVipStatus(user).vipExpiresAt,
                    role: user.role || (((user.rawEmail || user.email || '').toLowerCase().trim() === 'jrnabil570@gmail.com') ? 'admin' : 'member'),
                    createdAt: user.createdAt
                }
            });
        }

        // POST /api/user-auth?action=update_profile
        if (action === 'update_profile') {
            const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '') || req.body?.token;
            const targetUserId = getUserIdFromToken(token, db);
            if (!targetUserId) {
                return res.status(401).json({ status: false, message: 'Sesi login tidak valid atau sudah berakhir' });
            }
            const userIndex = db.users.findIndex(u => u.id === targetUserId);
            if (userIndex === -1) {
                return res.status(404).json({ status: false, message: 'Pengguna tidak ditemukan' });
            }

            const user = db.users[userIndex];
            const isMasterAdmin = (user.rawEmail || user.email || '').toLowerCase().trim() === 'jrnabil570@gmail.com' || (user.username || '').toLowerCase().trim() === 'nabil';
            let vipInfo = resolveUserVipStatus(user);
            let isUserVip = vipInfo.isPremium;

            // Update username if provided
            if (body.username !== undefined) {
                const newUsername = String(body.username).trim();
                if (!newUsername || newUsername.length < 3) {
                    return res.status(400).json({ status: false, message: 'Username minimal 3 karakter' });
                }
                const exists = db.users.find(u => u.id !== user.id && u.username.toLowerCase() === newUsername.toLowerCase());
                if (exists) {
                    return res.status(400).json({ status: false, message: 'Username sudah digunakan orang lain' });
                }
                user.username = newUsername;
            }

            // Update email if provided
            if (body.email !== undefined) {
                const newEmail = String(body.email).trim().toLowerCase();
                if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
                    return res.status(400).json({ status: false, message: 'Format email tidak valid' });
                }
                const exists = db.users.find(u => u.id !== user.id && ((u.rawEmail && u.rawEmail.toLowerCase() === newEmail.toLowerCase()) || (u.email && u.email.toLowerCase() === newEmail.toLowerCase())));
                if (exists) {
                    return res.status(400).json({ status: false, message: 'Email sudah digunakan akun lain' });
                }
                user.email = newEmail;
                user.rawEmail = newEmail;
            }

            // Update avatar if provided
            if (body.avatar !== undefined) {
                user.avatar = body.avatar;
            }

            // Update border if provided
            if (body.border !== undefined) {
                const borderId = String(body.border || '').trim();
                let borderMap = {
                    'border_platinum': { name: 'Platinum', url: '/borders/Platinum.png', reqTier: '1month' },
                    'border_master': { name: 'Master', url: '/borders/Master.png', reqTier: '1month' },
                    'border_legend': { name: 'Legend', url: '/borders/Legend.png', reqTier: '2months' },
                    'border_immortal': { name: 'Immortal', url: '/borders/Imortal.png', reqTier: '5months' }
                };

                try {
                    const customBorders = storage.readData('custom_borders.json', []);
                    if (Array.isArray(customBorders)) {
                        customBorders.forEach(cb => {
                            if (cb && cb.id) {
                                borderMap[cb.id] = {
                                    name: cb.name,
                                    url: cb.url,
                                    reqTier: cb.requiredTier || '1month',
                                    badge: cb.badge || cb.tier || 'VIP'
                                };
                            }
                        });
                    }
                } catch(e) {}

                if (borderMap[borderId]) {
                    if (!isUserVip) {
                        return res.status(403).json({ status: false, message: 'Border profil khusus pengguna VIP!' });
                    }
                    if (!isMasterAdmin) {
                        const tierRankMap = { 'none': 0, '1month': 1, '2months': 2, '5months': 3, 'permanent': 4, 'lifetime': 4, 'sultan': 4 };
                        const uRank = tierRankMap[String(user.vipTier || 'permanent').toLowerCase()] !== undefined ? tierRankMap[String(user.vipTier || 'permanent').toLowerCase()] : 4;
                        const reqRank = tierRankMap[String(borderMap[borderId].reqTier || '1month').toLowerCase()] !== undefined ? tierRankMap[String(borderMap[borderId].reqTier || '1month').toLowerCase()] : 1;
                        if (uRank < reqRank) {
                            return res.status(403).json({
                                status: false,
                                message: `Border ${borderMap[borderId].name} memerlukan Paket VIP lebih tinggi (${borderMap[borderId].badge || borderMap[borderId].reqTier})!`
                            });
                        }
                    }
                    user.border = borderId;
                    user.borderUrl = borderMap[borderId].url;
                    user.borderName = borderMap[borderId].name;
                } else {
                    user.border = '';
                    user.borderUrl = '';
                    user.borderName = '';
                }
            }

            // Update equipped custom rank badge if provided
            if (body.equippedBadge !== undefined) {
                user.equippedBadge = String(body.equippedBadge || '').trim();
                user.equippedBadgeTitle = String(body.equippedBadgeTitle || '').trim();
                user.equippedBadgeIcon = String(body.equippedBadgeIcon || '').trim();
                user.equippedBadgeColor = String(body.equippedBadgeColor || '').trim();
            }

            db.users[userIndex] = user;
            await writeDbAsync(db);

            isUserVip = !!user.isPremium || !!user.is_premium || isMasterAdmin;

            return res.json({
                status: true,
                message: 'Profil berhasil diperbarui!',
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.rawEmail || user.email,
                    avatar: user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.username)}`,
                    border: user.border || '',
                    borderUrl: user.borderUrl || '',
                    borderName: user.borderName || '',
                    equippedBadge: user.equippedBadge || '',
                    equippedBadgeTitle: user.equippedBadgeTitle || '',
                    equippedBadgeIcon: user.equippedBadgeIcon || '',
                    equippedBadgeColor: user.equippedBadgeColor || '',
                    isPremium: vipInfo.isPremium,
                    vipTier: vipInfo.vipTier,
                    vipExpiresAt: vipInfo.vipExpiresAt,
                    role: user.role || (isMasterAdmin ? 'admin' : 'member'),
                    createdAt: user.createdAt
                }
            });
        }

        // POST /api/user-auth?action=update_password
        if (action === 'update_password') {
            const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '') || req.body?.token;
            const targetUserId = getUserIdFromToken(token, db);
            if (!targetUserId) {
                return res.status(401).json({ status: false, message: 'Sesi login tidak valid' });
            }
            const user = db.users.find(u => u.id === targetUserId);
            if (!user) {
                return res.status(404).json({ status: false, message: 'Pengguna tidak ditemukan' });
            }

            const oldPassword = String(body.oldPassword || '').trim();
            const newPassword = String(body.newPassword || '').trim();

            if (oldPassword) {
                const isMatch = verifyPassword(oldPassword, user.passwordHash, user.passwordSalt);
                if (!isMatch) {
                    return res.status(400).json({ status: false, message: 'Password saat ini salah' });
                }
            }

            if (!newPassword || newPassword.length < 6) {
                return res.status(400).json({ status: false, message: 'Password baru minimal 6 karakter/huruf' });
            }

            const { hash, salt } = hashPassword(newPassword);
            user.passwordHash = hash;
            user.passwordSalt = salt;
            user.maskedPassword = maskPassword(newPassword);
            await writeDbAsync(db);

            return res.json({
                status: true,
                message: 'Password berhasil diubah!'
            });
        }

        // POST /api/user-auth?action=delete_account
        if (action === 'delete_account') {
            const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '') || req.body?.token;
            const targetUserId = getUserIdFromToken(token, db);
            if (!targetUserId) {
                return res.status(401).json({ status: false, message: 'Sesi login tidak valid atau sudah kedaluwarsa' });
            }
            const userIndex = db.users.findIndex(u => u.id === targetUserId);
            if (userIndex === -1) {
                return res.status(404).json({ status: false, message: 'Pengguna tidak ditemukan' });
            }

            const deletedUser = db.users[userIndex];
            db.users.splice(userIndex, 1);

            // Invalidate all sessions of this user
            db.sessions = db.sessions || {};
            Object.keys(db.sessions).forEach(tok => {
                if (db.sessions[tok] && (db.sessions[tok].userId === targetUserId || db.sessions[tok].userId?.id === targetUserId)) {
                    delete db.sessions[tok];
                }
            });

            // Clean registry
            delete banRegistry[targetUserId];
            if (deletedUser.username) delete banRegistry[deletedUser.username.toLowerCase()];
            if (deletedUser.rawEmail) delete banRegistry[deletedUser.rawEmail.toLowerCase()];
            await writeBanRegistryAsync(banRegistry);
            await writeDbAsync(db);

            return res.json({ status: true, message: 'Akun Anda berhasil dihapus secara permanen.' });
        }

        // POST /api/user-auth?action=logout
        if (action === 'logout') {
            const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '') || req.body?.token;
            db.sessions = db.sessions || {};
            if (token && db.sessions[token]) {
                delete db.sessions[token];
                await writeDbAsync(db);
            }
            return res.json({ status: true, message: 'Logout berhasil' });
        }

        return res.status(400).json({ status: false, message: 'Action tidak dikenal' });
    } catch (err) {
        console.error('User-Auth Handler Error:', err);
        return res.status(500).json({ status: false, message: 'Terjadi kesalahan server internal: ' + err.message });
    }
};

module.exports.verifyUserToken = verifyUserToken;
module.exports.createSignedUserToken = createSignedUserToken;
module.exports.getUserIdFromToken = getUserIdFromToken;
module.exports.getRegisteredUsers = async function() {
    try {
        const db = await readDbAsync();
        return db.users || [];
    } catch (e) {
        return [];
    }
};

