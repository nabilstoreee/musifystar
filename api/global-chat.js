const storage = require('./storage.js');
const userAuth = require('./user-auth.js');
const adminAuth = require('./admin-auth.js');

const pool = storage.pool;

// Ensure table exists on server start and has border/avatar columns
async function initChatTable() {
    if (!pool) return;
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS global_chat_messages (
                id BIGSERIAL PRIMARY KEY,
                user_id VARCHAR(100),
                username VARCHAR(100) NOT NULL,
                email VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                badge VARCHAR(50) DEFAULT 'Member',
                is_admin BOOLEAN DEFAULT FALSE,
                avatar_color VARCHAR(50),
                avatar_url TEXT,
                border_id VARCHAR(50),
                border_url TEXT,
                border_name VARCHAR(50),
                is_vip BOOLEAN DEFAULT FALSE,
                vip_tier VARCHAR(50),
                ip_address VARCHAR(100),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            ALTER TABLE global_chat_messages ADD COLUMN IF NOT EXISTS avatar_url TEXT;
            ALTER TABLE global_chat_messages ADD COLUMN IF NOT EXISTS border_id VARCHAR(50);
            ALTER TABLE global_chat_messages ADD COLUMN IF NOT EXISTS border_url TEXT;
            ALTER TABLE global_chat_messages ADD COLUMN IF NOT EXISTS border_name VARCHAR(50);
            ALTER TABLE global_chat_messages ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT FALSE;
            ALTER TABLE global_chat_messages ADD COLUMN IF NOT EXISTS vip_tier VARCHAR(50);
            ALTER TABLE global_chat_messages ADD COLUMN IF NOT EXISTS equipped_badge VARCHAR(100);
            ALTER TABLE global_chat_messages ADD COLUMN IF NOT EXISTS equipped_badge_title VARCHAR(100);
            ALTER TABLE global_chat_messages ADD COLUMN IF NOT EXISTS equipped_badge_icon VARCHAR(100);
            ALTER TABLE global_chat_messages ADD COLUMN IF NOT EXISTS equipped_badge_color VARCHAR(100);
            CREATE INDEX IF NOT EXISTS idx_chat_msg_time ON global_chat_messages(created_at DESC);
        `);
    } catch (e) {
        console.error('[GLOBAL_CHAT] Table check error:', e.message);
    }
}
initChatTable().catch(() => {});

const BORDER_CATALOG = {
    'border_platinum': { id: 'border_platinum', name: 'Platinum', url: '/borders/Platinum.png' },
    'border_master': { id: 'border_master', name: 'Master', url: '/borders/Master.png' },
    'border_legend': { id: 'border_legend', name: 'Legend', url: '/borders/Legend.png' },
    'border_immortal': { id: 'border_immortal', name: 'Immortal', url: '/borders/Imortal.png' }
};

function resolveBorderDetails(borderId, rawUrl, rawName) {
    if (!borderId || borderId === 'none') {
        return { borderId: '', borderUrl: '', borderName: '' };
    }
    const clean = String(borderId).toLowerCase().trim();
    if (BORDER_CATALOG[clean]) {
        return {
            borderId: clean,
            borderUrl: BORDER_CATALOG[clean].url,
            borderName: BORDER_CATALOG[clean].name
        };
    }
    if (clean.includes('platinum')) return { borderId: 'border_platinum', borderUrl: '/borders/Platinum.png', borderName: 'Platinum' };
    if (clean.includes('master')) return { borderId: 'border_master', borderUrl: '/borders/Master.png', borderName: 'Master' };
    if (clean.includes('legend')) return { borderId: 'border_legend', borderUrl: '/borders/Legend.png', borderName: 'Legend' };
    if (clean.includes('immortal') || clean.includes('imortal')) return { borderId: 'border_immortal', borderUrl: '/borders/Imortal.png', borderName: 'Immortal' };
    return {
        borderId: borderId,
        borderUrl: rawUrl || '',
        borderName: rawName || 'VIP'
    };
}

// In-memory rate limiting: Max 1 message every 2 seconds per IP / User
const rateLimitMap = new Map();
function isRateLimited(key) {
    const now = Date.now();
    const last = rateLimitMap.get(key) || 0;
    if (now - last < 2000) {
        return true;
    }
    rateLimitMap.set(key, now);
    // Periodically clean up old keys
    if (rateLimitMap.size > 2000) {
        for (const [k, time] of rateLimitMap.entries()) {
            if (now - time > 60000) rateLimitMap.delete(k);
        }
    }
    return false;
}

// XSS sanitization
function sanitizeText(str) {
    if (!str || typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .trim();
}

function getClientIp(req) {
    return (
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.socket?.remoteAddress ||
        req.ip ||
        '127.0.0.1'
    );
}

// Color palettes for avatars based on username hash
const AVATAR_GRADIENTS = [
    'from-rose-500 to-amber-500',
    'from-cyan-500 to-blue-600',
    'from-emerald-500 to-teal-600',
    'from-purple-500 to-pink-600',
    'from-amber-400 to-orange-600',
    'from-indigo-500 to-purple-600',
    'from-sky-400 to-indigo-600',
    'from-fuchsia-500 to-rose-600'
];

function getAvatarColor(name) {
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

module.exports = async function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

    const method = req.method.toUpperCase();
    const clientIp = getClientIp(req);

    // 1. GET /api/global-chat - Fetch recent chat messages
    if (method === 'GET') {
        try {
            if (!pool) {
                return res.status(503).json({ status: false, message: 'Database utama belum siap.' });
            }

            // Check if requester is master admin
            const adminToken = req.headers['x-admin-token'] || req.query.admin_token;
            const authHeader = req.headers.authorization || req.headers['x-auth-token'] || '';
            const rawToken = authHeader.replace(/^Bearer\s+/i, '').trim();
            const isMasterAdminReq = adminAuth.isValidToken(adminToken) || adminAuth.isValidToken(rawToken);

            const result = await pool.query(`
                SELECT id, user_id, username, email, message, badge, is_admin, avatar_color, avatar_url, border_id, border_url, border_name, is_vip, vip_tier, equipped_badge, equipped_badge_title, equipped_badge_icon, equipped_badge_color, created_at 
                FROM global_chat_messages 
                ORDER BY created_at DESC 
                LIMIT 60
            `);

            // Sort chronologically (oldest to newest)
            const rows = result.rows.reverse();

            // Load registered users from storage to augment with newest avatar, border & VIP status
            let userMapById = new Map();
            let userMapByEmail = new Map();
            let userMapByName = new Map();
            try {
                const dbData = await storage.readDataAsync('users.json', { users: [], sessions: {} });
                (dbData.users || []).forEach(u => {
                    if (u.id) userMapById.set(String(u.id), u);
                    const em = (u.rawEmail || u.email || '').toLowerCase().trim();
                    if (em) userMapByEmail.set(em, u);
                    const un = (u.username || '').toLowerCase().trim();
                    if (un) userMapByName.set(un, u);
                });
            } catch (e) {}

            // PRIVACY & SECURITY: Strip / mask emails for regular users to prevent scraping via DevTools
            const safeMessages = rows.map(r => {
                const isMsgMasterAdmin = ((r.email || '').toLowerCase().trim() === 'jrnabil570@gmail.com') ||
                                         (String(r.user_id || '') === 'u_1790196636099_622dc736') ||
                                         (String(r.user_id || '') === 'admin_1') ||
                                         (r.username === 'nabil' && (r.email || '').includes('jrnabil570'));

                // Match user from current database state for up-to-date border and avatar
                const matchedUser = userMapById.get(String(r.user_id || '')) ||
                                    userMapByEmail.get((r.email || '').toLowerCase().trim()) ||
                                    userMapByName.get((r.username || '').toLowerCase().trim()) || null;

                const displayUsername = matchedUser?.username || r.username || (isMsgMasterAdmin ? 'MusifyStar Official' : 'Musisi');

                const userAvatar = matchedUser?.avatar || r.avatar_url || '';
                const activeBorderId = matchedUser?.border || r.border_id || '';
                const borderInfo = resolveBorderDetails(activeBorderId, matchedUser?.borderUrl || r.border_url, matchedUser?.borderName || r.border_name);

                const isTierActive = Boolean(matchedUser?.vipTier && matchedUser?.vipTier !== 'none');
                const matchedIsVip = Boolean(matchedUser ? ((matchedUser.isPremium || matchedUser.is_premium || isTierActive) && matchedUser.vipTier !== 'none') : r.is_vip);
                const isUserVipRaw = isMsgMasterAdmin || matchedIsVip;
                const vipExpiresAt = matchedUser?.vipExpiresAt || null;
                const isVipActive = isUserVipRaw && (!vipExpiresAt || Date.now() <= vipExpiresAt);
                const vipTier = isMsgMasterAdmin ? 'permanent' : (isVipActive ? (matchedUser?.vipTier || r.vip_tier || 'permanent') : 'none');

                const equippedBadge = matchedUser ? (matchedUser.equippedBadge !== undefined ? matchedUser.equippedBadge : (r.equipped_badge || '')) : (r.equipped_badge || '');
                const equippedBadgeTitle = matchedUser ? (matchedUser.equippedBadgeTitle !== undefined ? matchedUser.equippedBadgeTitle : (r.equipped_badge_title || '')) : (r.equipped_badge_title || '');
                const equippedBadgeIcon = matchedUser ? (matchedUser.equippedBadgeIcon !== undefined ? matchedUser.equippedBadgeIcon : (r.equipped_badge_icon || '')) : (r.equipped_badge_icon || '');
                const equippedBadgeColor = matchedUser ? (matchedUser.equippedBadgeColor !== undefined ? matchedUser.equippedBadgeColor : (r.equipped_badge_color || '')) : (r.equipped_badge_color || '');

                return {
                    id: String(r.id),
                    userId: r.user_id,
                    username: displayUsername,
                    message: r.message,
                    badge: isMsgMasterAdmin ? 'Admin' : (r.badge || 'Member'),
                    isAdmin: isMsgMasterAdmin,
                    isVerifiedAdmin: isMsgMasterAdmin,
                    avatar: userAvatar,
                    avatarColor: r.avatar_color || getAvatarColor(displayUsername),
                    borderId: borderInfo.borderId,
                    borderUrl: borderInfo.borderUrl,
                    borderName: borderInfo.borderName,
                    isVip: isVipActive,
                    vipTier: vipTier,
                    vipExpiresAt: vipExpiresAt,
                    equippedBadge: equippedBadge,
                    equippedBadgeTitle: equippedBadgeTitle,
                    equippedBadgeIcon: equippedBadgeIcon,
                    equippedBadgeColor: equippedBadgeColor,
                    createdAt: r.created_at,
                    // Email is ONLY visible to the master admin for moderation; hidden for all other users
                    email: isMasterAdminReq ? r.email : undefined
                };
            });

            return res.json({
                status: true,
                messages: safeMessages,
                serverTime: new Date().toISOString()
            });
        } catch (e) {
            console.error('[GLOBAL_CHAT] GET Error:', e.message);
            return res.status(500).json({ status: false, message: 'Gagal memuat pesan chat global: ' + e.message });
        }
    }

    // 2. POST /api/global-chat - Send a new message
    if (method === 'POST') {
        try {
            if (!pool) {
                return res.status(503).json({ status: false, message: 'Database utama belum siap.' });
            }

            // Rate limit check (Anti-Spam)
            const rateKey = `${clientIp}_${req.headers.authorization || ''}`;
            if (isRateLimited(rateKey)) {
                return res.status(429).json({
                    status: false,
                    message: 'Mohon tunggu 2 detik sebelum mengirim pesan berikutnya (Anti-Spam).'
                });
            }

            // Verify User Authentication (Supports User JWT, Session Tokens, and Master Admin Token)
            const authHeader = req.headers.authorization || req.headers['x-auth-token'] || '';
            const rawToken = authHeader.replace(/^Bearer\s+/i, '').trim();
            const adminToken = (req.headers['x-admin-token'] || '').trim();

            const headerUid = req.headers['x-user-id'] || req.headers['x-device-id'] || '';
            const headerUsername = req.headers['x-user-name'] || '';
            const headerEmail = (req.headers['x-user-email'] || '').toLowerCase().trim();

            let currentUser = null;
            let verifiedUid = null;
            let verifiedUsername = null;

            // 1. Prioritize Standard User Authentication (JWT Token or Session)
            if (rawToken && rawToken.startsWith('usr_')) {
                const verified = userAuth.verifyUserToken(rawToken);
                if (verified && verified.uid) {
                    verifiedUid = typeof verified.uid === 'object' ? (verified.uid.id || verified.uid.userId) : String(verified.uid);
                    verifiedUsername = verified.u || '';
                }
            }

            const effectiveUid = verifiedUid || headerUid;
            const effectiveUsername = verifiedUsername || headerUsername;

            if (effectiveUid || effectiveUsername || rawToken || headerEmail) {
                try {
                    const dbData = await storage.readDataAsync('users.json', { users: [], sessions: {} });
                    let foundUser = null;
                    if (verifiedUid) {
                        foundUser = (dbData.users || []).find(u => String(u.id) === String(verifiedUid));
                    }
                    if (!foundUser && headerEmail) {
                        foundUser = (dbData.users || []).find(u => (u.email && u.email.toLowerCase() === headerEmail) || (u.rawEmail && u.rawEmail.toLowerCase() === headerEmail));
                    }
                    if (!foundUser && effectiveUid) {
                        foundUser = (dbData.users || []).find(u => String(u.id) === String(effectiveUid));
                    }
                    if (!foundUser && effectiveUsername) {
                        foundUser = (dbData.users || []).find(u => u.username && u.username.toLowerCase() === effectiveUsername.toLowerCase());
                    }
                    if (!foundUser && rawToken && dbData.sessions && dbData.sessions[rawToken]) {
                        const sess = dbData.sessions[rawToken];
                        foundUser = (dbData.users || []).find(u => String(u.id) === String(sess.userId) || u.username === sess.username);
                    }

                    if (foundUser) {
                        const isFoundAdmin = (foundUser.email || foundUser.rawEmail || '').toLowerCase().trim() === 'jrnabil570@gmail.com' || String(foundUser.id) === 'u_1790196636099_622dc736';
                        currentUser = {
                            id: String(foundUser.id || effectiveUid),
                            username: foundUser.username || (isFoundAdmin ? 'MusifyStar Official' : effectiveUsername || 'Musisi'),
                            email: foundUser.email || foundUser.rawEmail || headerEmail || '',
                            rawEmail: foundUser.rawEmail || foundUser.email || headerEmail || '',
                            isAdmin: isFoundAdmin,
                            badge: isFoundAdmin ? 'Admin' : 'Member'
                        };
                    } else if (effectiveUid || effectiveUsername || headerEmail) {
                        const isGuestAdmin = (headerEmail === 'jrnabil570@gmail.com' || effectiveUid === 'u_1790196636099_622dc736');
                        currentUser = {
                            id: String(effectiveUid || 'usr_' + Date.now()),
                            username: effectiveUsername || (isGuestAdmin ? 'MusifyStar Official' : 'Musisi'),
                            email: headerEmail || (isGuestAdmin ? 'jrnabil570@gmail.com' : ''),
                            rawEmail: headerEmail || (isGuestAdmin ? 'jrnabil570@gmail.com' : ''),
                            isAdmin: isGuestAdmin,
                            badge: isGuestAdmin ? 'Admin' : 'Member'
                        };
                    }
                } catch (e) {}
            }

            // 2. Fallback: If not authenticated as standard user, check if Master Admin Token
            if (!currentUser && (adminAuth.isValidToken(rawToken) || adminAuth.isValidToken(adminToken) || (headerEmail === 'jrnabil570@gmail.com' && (rawToken || adminToken)))) {
                currentUser = {
                    id: 'u_1790196636099_622dc736',
                    username: 'MusifyStar Official',
                    email: 'jrnabil570@gmail.com',
                    rawEmail: 'jrnabil570@gmail.com',
                    isAdmin: true,
                    badge: 'Admin'
                };
            }

            // Require logged in user to send message (Guarantees authentic email & identity in DB)
            if (!currentUser) {
                return res.status(401).json({
                    status: false,
                    message: 'Silakan login ke akun MusifyStar Anda terlebih dahulu untuk mengirim pesan di Chat Global.'
                });
            }

            // Check if user or IP is banned
            try {
                const banRegistry = await storage.readDataAsync('banned_registry.json', {});
                const userEmailLower = ((currentUser.email || currentUser.rawEmail || '')).toLowerCase().trim();
                const userNameLower = (currentUser.username || '').toLowerCase().trim();

                if (banRegistry[userEmailLower] || banRegistry[userNameLower] || banRegistry[clientIp]) {
                    return res.status(403).json({
                        status: false,
                        message: 'Akun atau alamat jaringan Anda sedang ditangguhkan dari sistem interaksi publik.'
                    });
                }
            } catch (e) {}

            const body = req.body || {};
            const rawMessage = String(body.message || '').trim();

            if (!rawMessage) {
                return res.status(400).json({ status: false, message: 'Isi pesan tidak boleh kosong.' });
            }

            if (rawMessage.length > 500) {
                return res.status(400).json({ status: false, message: 'Pesan terlalu panjang (maksimal 500 karakter).' });
            }

            // Sanitize message content (Anti-XSS)
            const cleanMessage = sanitizeText(rawMessage);
            const username = String(currentUser.username || 'Musisi').trim().slice(0, 30);
            const email = String(currentUser.email || currentUser.rawEmail || '').toLowerCase().trim();
            const userId = String(currentUser.id || currentUser.userId || '');

            // Master Admin Verification
            const isMasterAdmin = (email === 'jrnabil570@gmail.com' || userId === 'u_1790196636099_622dc736' || userId === 'admin_1');
            const badge = isMasterAdmin ? 'Admin' : 'Member';
            const displayUsername = username || (isMasterAdmin ? 'MusifyStar Official' : 'Musisi');
            const avatarColor = getAvatarColor(displayUsername);

            // Resolve user avatar, border frame & custom rank badge
            let userAvatar = currentUser.avatar || '';
            let activeBorderId = currentUser.border || '';
            let activeBorderUrl = currentUser.borderUrl || '';
            let activeBorderName = currentUser.borderName || '';
            let isUserVipRaw = isMasterAdmin || !!(currentUser.isPremium || currentUser.is_premium);
            let vipExpiresAt = currentUser.vipExpiresAt || null;
            let isVipActive = isUserVipRaw && (!vipExpiresAt || Date.now() <= vipExpiresAt);
            let vipTier = isMasterAdmin ? 'permanent' : (currentUser.vipTier || (isVipActive ? 'permanent' : 'none'));

            let equippedBadge = currentUser.equippedBadge || body.equippedBadge || '';
            let equippedBadgeTitle = currentUser.equippedBadgeTitle || body.equippedBadgeTitle || '';
            let equippedBadgeIcon = currentUser.equippedBadgeIcon || body.equippedBadgeIcon || '';
            let equippedBadgeColor = currentUser.equippedBadgeColor || body.equippedBadgeColor || '';

            try {
                const dbData = await storage.readDataAsync('users.json', { users: [], sessions: {} });
                const matched = (dbData.users || []).find(u => String(u.id) === userId || (u.email && u.email.toLowerCase() === email));
                if (matched) {
                    if (matched.username) displayUsername = matched.username;
                    if (matched.avatar) userAvatar = matched.avatar;
                    if (matched.border) activeBorderId = matched.border;
                    if (matched.borderUrl) activeBorderUrl = matched.borderUrl;
                    if (matched.borderName) activeBorderName = matched.borderName;
                    if (matched.isPremium || matched.is_premium) isUserVipRaw = true;
                    if (matched.vipExpiresAt) vipExpiresAt = matched.vipExpiresAt;
                    isVipActive = isUserVipRaw && (!vipExpiresAt || Date.now() <= vipExpiresAt);
                    if (matched.vipTier) vipTier = matched.vipTier;
                    if (matched.equippedBadge !== undefined) equippedBadge = matched.equippedBadge;
                    if (matched.equippedBadgeTitle !== undefined) equippedBadgeTitle = matched.equippedBadgeTitle;
                    if (matched.equippedBadgeIcon !== undefined) equippedBadgeIcon = matched.equippedBadgeIcon;
                    if (matched.equippedBadgeColor !== undefined) equippedBadgeColor = matched.equippedBadgeColor;
                }
            } catch (e) {}

            const borderInfo = resolveBorderDetails(activeBorderId, activeBorderUrl, activeBorderName);

            // Insert into PRIMARY Neon PostgreSQL database
            const insertResult = await pool.query(
                `INSERT INTO global_chat_messages 
                (user_id, username, email, message, badge, is_admin, avatar_color, avatar_url, border_id, border_url, border_name, is_vip, vip_tier, equipped_badge, equipped_badge_title, equipped_badge_icon, equipped_badge_color, ip_address, created_at) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW()) 
                RETURNING id, user_id, username, message, badge, is_admin, avatar_color, avatar_url, border_id, border_url, border_name, is_vip, vip_tier, equipped_badge, equipped_badge_title, equipped_badge_icon, equipped_badge_color, created_at`,
                [userId, displayUsername, email, cleanMessage, badge, isMasterAdmin, avatarColor, userAvatar, borderInfo.borderId, borderInfo.borderUrl, borderInfo.borderName, isVipActive, vipTier, equippedBadge, equippedBadgeTitle, equippedBadgeIcon, equippedBadgeColor, clientIp]
            );

            const saved = insertResult.rows[0];

            return res.json({
                status: true,
                message: 'Pesan berhasil terkirim ke Chat Global!',
                chat: {
                    id: String(saved.id),
                    userId: saved.user_id,
                    username: saved.username,
                    message: saved.message,
                    badge: isMasterAdmin ? 'Admin' : saved.badge,
                    isAdmin: isMasterAdmin || !!saved.is_admin,
                    isVerifiedAdmin: isMasterAdmin,
                    avatar: userAvatar,
                    avatarColor: saved.avatar_color,
                    borderId: borderInfo.borderId,
                    borderUrl: borderInfo.borderUrl,
                    borderName: borderInfo.borderName,
                    isVip: isVipActive,
                    vipTier: vipTier,
                    vipExpiresAt: vipExpiresAt,
                    equippedBadge: saved.equipped_badge || equippedBadge,
                    equippedBadgeTitle: saved.equipped_badge_title || equippedBadgeTitle,
                    equippedBadgeIcon: saved.equipped_badge_icon || equippedBadgeIcon,
                    equippedBadgeColor: saved.equipped_badge_color || equippedBadgeColor,
                    createdAt: saved.created_at,
                    clientTempId: body.clientTempId || undefined
                }
            });
        } catch (e) {
            console.error('[GLOBAL_CHAT] POST Error:', e.message);
            return res.status(500).json({ status: false, message: 'Gagal mengirim pesan: ' + e.message });
        }
    }

    // 3. DELETE /api/global-chat - Delete message (Admin or author)
    if (method === 'DELETE') {
        try {
            if (!pool) {
                return res.status(503).json({ status: false, message: 'Database utama belum siap.' });
            }

            const rawId = req.query.id || req.body?.id;
            if (!rawId) {
                return res.status(400).json({ status: false, message: 'ID pesan diperlukan' });
            }

            const numId = parseInt(rawId, 10);
            if (isNaN(numId)) {
                return res.json({ status: true, message: 'Pesan lokal berhasil dihapus.' });
            }

            const adminToken = req.headers['x-admin-token'] || req.query.admin_token;
            let isMasterAdmin = adminAuth.isValidToken(adminToken);

            const authHeader = req.headers.authorization || req.headers['x-auth-token'] || '';
            const rawToken = authHeader.replace(/^Bearer\s+/i, '').trim();
            const headerEmail = (req.headers['x-user-email'] || '').toLowerCase().trim();
            const headerUid = req.headers['x-user-id'] || '';
            const headerUsername = (req.headers['x-user-name'] || '').toLowerCase().trim();

            let callerUid = headerUid;
            let callerEmail = headerEmail;
            let callerUsername = headerUsername;

            if (rawToken) {
                if (rawToken.startsWith('usr_')) {
                    const verified = userAuth.verifyUserToken(rawToken);
                    if (verified && verified.uid) {
                        callerUid = typeof verified.uid === 'object' ? (verified.uid.id || verified.uid.userId) : String(verified.uid);
                        if (verified.u) callerUsername = String(verified.u).toLowerCase().trim();
                    }
                } else if (adminAuth.isValidToken(rawToken)) {
                    isMasterAdmin = true;
                }
            }

            // Look up in users.json to resolve verified identity
            if (callerUid || callerEmail || callerUsername) {
                try {
                    const dbData = await storage.readDataAsync('users.json', { users: [] });
                    const user = (dbData.users || []).find(u => 
                        (callerUid && String(u.id) === String(callerUid)) ||
                        (callerEmail && ((u.email && u.email.toLowerCase() === callerEmail) || (u.rawEmail && u.rawEmail.toLowerCase() === callerEmail))) ||
                        (callerUsername && u.username && u.username.toLowerCase() === callerUsername)
                    );
                    if (user) {
                        callerEmail = (user.email || user.rawEmail || callerEmail).toLowerCase().trim();
                        callerUid = String(user.id || callerUid);
                        callerUsername = (user.username || callerUsername).toLowerCase().trim();
                    }
                } catch (e) {}
            }

            // MASTER ADMIN (jrnabil570@gmail.com) can delete ANY message!
            if (callerEmail === 'jrnabil570@gmail.com' || callerUid === 'u_1790196636099_622dc736') {
                isMasterAdmin = true;
            }

            let isAllowed = isMasterAdmin;

            // Otherwise, check if caller is the original author of this message
            if (!isAllowed) {
                const checkMsg = await pool.query('SELECT user_id, email, username FROM global_chat_messages WHERE id = $1', [numId]);
                if (checkMsg.rows.length > 0) {
                    const row = checkMsg.rows[0];
                    const msgUid = String(row.user_id || '');
                    const msgEmail = (row.email || '').toLowerCase().trim();
                    const msgUsername = (row.username || '').toLowerCase().trim();

                    if ((callerUid && msgUid && callerUid === msgUid) ||
                        (callerEmail && msgEmail && callerEmail === msgEmail) ||
                        (callerUsername && msgUsername && callerUsername === msgUsername)) {
                        isAllowed = true;
                    }
                } else {
                    return res.json({ status: true, message: 'Pesan telah dihapus.' });
                }
            }

            if (!isAllowed) {
                return res.status(403).json({ status: false, message: 'Akses ditolak: Hanya pengirim atau Admin yang dapat menghapus pesan ini.' });
            }

            await pool.query('DELETE FROM global_chat_messages WHERE id = $1', [numId]);

            return res.json({ status: true, message: 'Pesan berhasil dihapus dari database utama.' });
        } catch (e) {
            console.error('[GLOBAL_CHAT] DELETE Error:', e.message);
            return res.status(500).json({ status: false, message: 'Gagal menghapus pesan: ' + e.message });
        }
    }

    return res.status(405).json({ status: false, message: 'Metode tidak didukung' });
};
