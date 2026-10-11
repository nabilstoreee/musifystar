const crypto = require('crypto');
const adminAuth = require('./admin-auth.js');
const storage = require('./storage.js');
const userAuth = require('./user-auth.js');

const USER_JWT_SECRET = process.env.USER_JWT_SECRET || 'musifystar_user_secret_key_v2_sign_98741';

function safeCompare(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
}

function verifyUserTokenFallback(token) {
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

const MESSAGES_FILE = '.user_messages.json';

async function readMessagesData() {
    try {
        const data = await storage.readDataAsync(MESSAGES_FILE, { messages: [], reads: {} });
        const res = (data && typeof data === 'object') ? data : { messages: [], reads: {} };
        if (!Array.isArray(res.messages)) res.messages = [];
        if (!res.reads || typeof res.reads !== 'object') res.reads = {};
        return res;
    } catch (e) {
        return { messages: [], reads: {} };
    }
}

async function writeMessagesData(data) {
    return await storage.writeDataAsync(MESSAGES_FILE, data);
}

async function sendVipWelcomeMessage(userId, username, vipTier, duration) {
    try {
        const tier = String(vipTier || '1month').toLowerCase().trim();
        let tierLabel = 'VIP 1 Bulan';
        let durationText = '1 Bulan (30 Hari)';
        let bordersText = 'Platinum & Master';

        if (tier === '2months' || tier === '2' || tier === '2bulan') {
            tierLabel = 'VIP 2 Bulan';
            durationText = '2 Bulan (60 Hari)';
            bordersText = 'Legend, Platinum & Master';
        } else if (tier === '5months' || tier === '5' || tier === '5bulan') {
            tierLabel = 'VIP 5 Bulan';
            durationText = '5 Bulan (150 Hari)';
            bordersText = 'Immortal, Legend, Master & Platinum';
        } else if (tier === 'permanent' || tier === 'lifetime' || tier === 'sultan' || tier === 'permanen') {
            tierLabel = 'VIP Permanen';
            durationText = 'Permanen (Selamanya)';
            bordersText = 'Semua Koleksi Border VIP (Immortal, Legend, Master, Platinum & Kustom)';
        }

        if (duration && String(duration).trim()) {
            durationText = String(duration).trim();
        }

        const title = `👑 Selamat! Status ${tierLabel} Anda Telah Aktif`;
        const body = `Halo @${username || 'Pengguna'}! 🌟

Selamat, VIP Anda telah aktif selama ${durationText} secara otomatis! Terima kasih telah bergabung ke VIP kami, selamat menikmati fitur-fitur VIP nya.

Fitur eksklusif VIP MusifyStar yang siap Anda nikmati:
✨ Akses Seluruh Border Profil VIP (${bordersText})
🎵 Kualitas Audio Musik Ultra HD (320kbps) & Bebas Iklan
👑 Lencana Mahkota VIP Emas di Profil & Komentar
📥 Download Musik Sepuasnya untuk Diputar Offline
⚡ Bebas Skip Lagu Tanpa Batas & Akses Server Prioritas

Terima kasih atas kepercayaan dan dukungan Anda untuk MusifyStar! Selamat mendengarkan musik favorit Anda. 🎶`;

        const data = await readMessagesData();
        const newMsg = {
            id: 'msg_vip_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex'),
            sender: 'Admin MusifyStar',
            recipientType: 'user',
            recipientId: String(userId || ''),
            recipientName: String(username || 'Pengguna'),
            title: title,
            body: body,
            priority: 'vip',
            actionUrl: '',
            createdAt: new Date().toISOString()
        };

        data.messages.unshift(newMsg);
        if (data.messages.length > 200) data.messages = data.messages.slice(0, 200);
        await writeMessagesData(data);
        console.log(`[MESSAGES] Automated VIP message delivered to @${username} (${userId}) for ${tierLabel}`);
        return newMsg;
    } catch (e) {
        console.error('[MESSAGES] Failed to deliver automated VIP message:', e.message);
        return null;
    }
}

const handler = async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    const action = req.query.action || (req.body && req.body.action) || 'user_inbox';

    // ==========================================
    // 1. ADMIN ACTIONS (Requires x-admin-token)
    // ==========================================
    if (action.startsWith('admin_')) {
        const adminToken = req.headers['x-admin-token'] || req.query.token;
        if (!adminToken || !adminAuth.isValidToken(adminToken)) {
            return res.status(401).json({ status: false, message: 'Akses ditolak: Token admin tidak valid' });
        }

        const data = await readMessagesData();

        // LIST ALL SENT MESSAGES
        if (action === 'admin_list') {
            return res.json({
                status: true,
                messages: data.messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            });
        }

        // SEND A NEW MESSAGE
        if (action === 'admin_send') {
            const { recipientType, recipientId, recipientName, title, body, priority, actionUrl } = req.body || {};
            if (!title || !body) {
                return res.status(400).json({ status: false, message: 'Judul dan isi pesan wajib diisi' });
            }

            const newMsg = {
                id: 'msg_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex'),
                sender: 'Admin MusifyStar',
                recipientType: recipientType === 'user' ? 'user' : 'all',
                recipientId: recipientType === 'user' ? (recipientId || '') : 'ALL_USERS',
                recipientName: recipientType === 'user' ? (recipientName || 'Pengguna') : 'Semua Pengguna',
                title: String(title).trim(),
                body: String(body).trim(),
                priority: ['info', 'important', 'warning', 'vip'].includes(priority) ? priority : 'info',
                actionUrl: (actionUrl && typeof actionUrl === 'string') ? actionUrl.trim() : '',
                createdAt: new Date().toISOString()
            };

            data.messages.unshift(newMsg);
            // Cap at last 200 messages
            if (data.messages.length > 200) data.messages = data.messages.slice(0, 200);

            await writeMessagesData(data);

            return res.json({
                status: true,
                message: recipientType === 'user' 
                    ? `Pesan pribadi berhasil dikirim ke ${recipientName || recipientId}!` 
                    : 'Pesan siaran berhasil dikirim ke semua pengguna!',
                sentMessage: newMsg
            });
        }

        // DELETE A MESSAGE
        if (action === 'admin_delete') {
            const id = (req.body && req.body.id) || req.query.id;
            if (!id) return res.status(400).json({ status: false, message: 'ID pesan diperlukan' });
            data.messages = data.messages.filter(m => String(m.id) !== String(id));
            await writeMessagesData(data);
            return res.json({ status: true, message: 'Pesan berhasil dihapus' });
        }
    }

    // ==========================================
    // 2. USER ACTIONS (Authenticated or Guest)
    // ==========================================
    const userToken = req.headers['authorization'] || req.headers['x-user-token'];
    let verifiedUser = null;
    if (userToken) {
        try {
            if (userAuth && typeof userAuth.verifyUserToken === 'function') {
                verifiedUser = userAuth.verifyUserToken(userToken);
            }
        } catch (e) {
            console.warn('[MESSAGES] User-auth module verification failed, trying fallback:', e.message);
        }
        if (!verifiedUser) {
            try {
                verifiedUser = verifyUserTokenFallback(userToken);
            } catch (err) {}
        }
    }
    const currentUserId = verifiedUser ? (verifiedUser.uid || verifiedUser.id) : (req.headers['x-user-id'] || req.query.userId || 'guest');
    const currentUsername = verifiedUser ? (verifiedUser.u || verifiedUser.username) : (req.headers['x-user-name'] || req.query.username || '');

    const data = await readMessagesData();

    // GET USER INBOX
    if (action === 'user_inbox') {
        // Auto-deliver VIP welcome message for current VIP user if not received yet
        if (currentUserId && currentUserId !== 'guest') {
            try {
                const userDb = await storage.readDataAsync('users.json', { users: [] });
                const myUser = (userDb.users || []).find(u => 
                    (u.id && (String(u.id).toLowerCase() === String(currentUserId).toLowerCase())) ||
                    (currentUsername && u.username && u.username.toLowerCase() === String(currentUsername).toLowerCase()) ||
                    ((u.email || u.rawEmail) && (u.email === currentUserId || u.rawEmail === currentUserId))
                );

                const isMasterAdmin = (currentUsername === 'nabil' || (myUser && (myUser.rawEmail === 'jrnabil570@gmail.com' || myUser.email === 'jrnabil570@gmail.com' || myUser.role === 'admin')));
                const isTierActive = Boolean(myUser && myUser.vipTier && myUser.vipTier !== 'none');
                const isUserVip = myUser ? ((myUser.isPremium || myUser.is_premium || isTierActive || isMasterAdmin) && myUser.vipTier !== 'none') : isMasterAdmin;

                if (isUserVip) {
                    const alreadyHasVipMsg = data.messages.some(m => 
                        m.priority === 'vip' && 
                        ((m.recipientId && String(m.recipientId).toLowerCase() === String(currentUserId).toLowerCase()) || 
                         (m.recipientName && currentUsername && String(m.recipientName).toLowerCase() === String(currentUsername).toLowerCase()))
                    );

                    if (!alreadyHasVipMsg) {
                        const tier = (myUser && myUser.vipTier && myUser.vipTier !== 'none') ? myUser.vipTier : 'permanent';
                        const createdMsg = await sendVipWelcomeMessage(myUser ? myUser.id : currentUserId, myUser ? myUser.username : currentUsername, tier);
                        if (createdMsg) {
                            data.messages.unshift(createdMsg);
                        }
                    }
                }
            } catch (err) {
                console.error('[MESSAGES] Auto VIP message check error:', err.message);
            }
        }

        const userReads = data.reads[currentUserId] || (currentUsername ? data.reads[currentUsername] : null) || {};

        // Filter messages: either 'all' or specifically addressed to this user id or username
        const relevantMessages = data.messages.filter(m => {
            if (m.recipientType === 'all') return true;
            const targetId = String(m.recipientId || '').toLowerCase().trim();
            const targetName = String(m.recipientName || '').toLowerCase().trim();
            const myId = String(currentUserId || '').toLowerCase().trim();
            const myName = String(currentUsername || '').toLowerCase().trim();

            if (myId && (targetId === myId || targetName === myId)) return true;
            if (myName && (targetId === myName || targetName === myName)) return true;
            return false;
        }).map(m => ({
            ...m,
            isRead: !!userReads[m.id]
        })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const unreadCount = relevantMessages.filter(m => !m.isRead).length;

        return res.json({
            status: true,
            messages: relevantMessages,
            unreadCount
        });
    }

    // MARK MESSAGE AS READ
    if (action === 'user_mark_read') {
        const messageId = req.body.messageId || req.query.messageId;
        if (!messageId) return res.status(400).json({ status: false, message: 'Message ID diperlukan' });

        if (!data.reads[currentUserId]) data.reads[currentUserId] = {};
        data.reads[currentUserId][messageId] = new Date().toISOString();

        await writeMessagesData(data);
        return res.json({ status: true, message: 'Pesan ditandai telah dibaca' });
    }

    // MARK ALL AS READ
    if (action === 'user_mark_all_read') {
        if (!data.reads[currentUserId]) data.reads[currentUserId] = {};
        data.messages.forEach(m => {
            data.reads[currentUserId][m.id] = new Date().toISOString();
        });

        await writeMessagesData(data);
        return res.json({ status: true, message: 'Semua pesan ditandai telah dibaca' });
    }

    return res.status(400).json({ status: false, message: 'Aksi tidak dikenali' });
};

handler.sendVipWelcomeMessage = sendVipWelcomeMessage;
module.exports = handler;
