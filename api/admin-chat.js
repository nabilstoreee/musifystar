const crypto = require('crypto');
const storage = require('./storage.js');
const userAuth = require('./user-auth.js');
const adminAuth = require('./admin-auth.js');

const pool = storage.pool;

// Ensure database table exists
async function initAdminChatTable() {
    if (!pool) return;
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS admin_chat_messages (
                id VARCHAR(100) PRIMARY KEY,
                user_id VARCHAR(100) NOT NULL,
                sender_role VARCHAR(20) NOT NULL,
                sender_username VARCHAR(100),
                sender_avatar_url TEXT,
                sender_border_url TEXT,
                sender_border_name VARCHAR(50),
                sender_is_vip BOOLEAN DEFAULT FALSE,
                sender_vip_tier VARCHAR(50),
                message TEXT,
                attachment TEXT,
                read_by_user BOOLEAN DEFAULT FALSE,
                read_by_admin BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_admin_chat_user ON admin_chat_messages(user_id, created_at DESC);
        `);
    } catch (e) {
        console.error('[ADMIN_CHAT] Table check error:', e.message);
    }
}
initAdminChatTable().catch(() => {});

const STORE_FILE = '.admin_chat_messages.json';

async function readStoreData() {
    try {
        const data = await storage.readDataAsync(STORE_FILE, { messages: [] });
        if (data && Array.isArray(data.messages)) return data.messages;
        return [];
    } catch (e) {
        return [];
    }
}

async function writeStoreData(messages) {
    return await storage.writeDataAsync(STORE_FILE, { messages: messages });
}

function resolveUserMetadata(u) {
    if (!u) return { id: '', username: 'Pengguna', email: '', avatarUrl: '/auth-logo.png', borderUrl: '', borderName: '', isVip: false, vipTier: 'none' };

    let avatarUrl = u.avatar || u.avatarUrl || u.avatar_url || '/auth-logo.png';
    let borderUrl = u.borderUrl || u.border_url || '';
    let borderName = u.borderName || u.border_name || '';

    if (!borderUrl && u.border) {
        const b = String(u.border).toLowerCase().trim();
        if (b === 'border_platinum' || b.includes('platinum')) {
            borderUrl = '/borders/Platinum.png';
            borderName = 'Platinum';
        } else if (b === 'border_master' || b.includes('master')) {
            borderUrl = '/borders/Master.png';
            borderName = 'Master';
        } else if (b === 'border_legend' || b.includes('legend')) {
            borderUrl = '/borders/Legend.png';
            borderName = 'Legend';
        } else if (b === 'border_immortal' || b.includes('immortal') || b.includes('imortal')) {
            borderUrl = '/borders/Imortal.png';
            borderName = 'Immortal';
        }
    }

    const isVipExpired = u.vipExpiresAt && Date.now() > u.vipExpiresAt;
    const isTierActive = Boolean(u.vipTier && u.vipTier !== 'none');
    const isVip = Boolean(((u.isVip || u.is_vip || u.isPremium || u.is_premium || isTierActive) && u.vipTier !== 'none') && !isVipExpired);
    const vipTier = isVip ? (u.vipTier || u.vip_tier || 'permanent') : 'none';

    return {
        id: u.id || '',
        username: u.username || 'Pengguna',
        email: u.rawEmail || u.email || '',
        avatarUrl: avatarUrl,
        borderUrl: borderUrl,
        borderName: borderName,
        isVip: isVip,
        vipTier: vipTier
    };
}

async function resolveAdminProfile() {
    let adminAvatar = '/auth-logo.png';
    let adminBorderUrl = '/borders/Imortal.png';
    let adminBorderName = 'Immortal Admin';
    try {
        const registeredUsers = await userAuth.getRegisteredUsers();
        const adminUser = registeredUsers.find(u => 
            (u.email && u.email.toLowerCase() === 'jrnabil570@gmail.com') || 
            (u.rawEmail && u.rawEmail.toLowerCase() === 'jrnabil570@gmail.com') || 
            u.username === 'nabil' || 
            u.id === 'u_1790196636099_622dc736'
        );
        if (adminUser) {
            const meta = resolveUserMetadata(adminUser);
            if (meta.avatarUrl) adminAvatar = meta.avatarUrl;
            if (meta.borderUrl) adminBorderUrl = meta.borderUrl;
            if (meta.borderName) adminBorderName = meta.borderName;
        }
    } catch(e) {}

    return {
        username: 'Admin MusifyStar',
        title: 'Official MusifyStar Support',
        avatarUrl: adminAvatar,
        borderUrl: adminBorderUrl,
        borderName: adminBorderName,
        isVerified: true,
        isOnline: true
    };
}

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token, x-user-id');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const action = req.query.action || 'get_messages';
    const authHeader = req.headers.authorization || '';
    const adminToken = req.headers['x-admin-token'] || authHeader.replace(/^Bearer\s+/i, '');
    const headerUserId = req.headers['x-user-id'] || req.query.userId || (req.body && req.body.userId);

    let isAdmin = adminAuth.verifySessionToken(adminToken);
    let userPayload = null;
    try {
        userPayload = userAuth.verifyUserToken(authHeader || adminToken);
    } catch (e) {}

    // Multi-factor check if request is from Master Admin (jrnabil570@gmail.com / nabil)
    if (!isAdmin) {
        if (userPayload) {
            const uid = String(userPayload.uid || '');
            const uname = String(userPayload.username || '').toLowerCase();
            const role = String(userPayload.role || '');
            if (uid === 'u_1790196636099_622dc736' || uname === 'nabil' || role === 'admin') {
                isAdmin = true;
            } else {
                try {
                    const registeredUsers = await userAuth.getRegisteredUsers();
                    const u = registeredUsers.find(ru => String(ru.id) === uid || String(ru.username).toLowerCase() === uname);
                    if (u) {
                        const email = (u.rawEmail || u.email || '').toLowerCase().trim();
                        if (email === 'jrnabil570@gmail.com' || u.role === 'admin' || u.username === 'nabil' || String(u.id) === 'u_1790196636099_622dc736') {
                            isAdmin = true;
                        }
                    }
                } catch(e) {}
            }
        }
        if (!isAdmin && headerUserId) {
            const hid = String(headerUserId);
            if (hid === 'u_1790196636099_622dc736' || hid.toLowerCase() === 'nabil') {
                isAdmin = true;
            } else {
                try {
                    const registeredUsers = await userAuth.getRegisteredUsers();
                    const u = registeredUsers.find(ru => String(ru.id) === hid || String(ru.username).toLowerCase() === hid.toLowerCase());
                    if (u) {
                        const email = (u.rawEmail || u.email || '').toLowerCase().trim();
                        if (email === 'jrnabil570@gmail.com' || u.role === 'admin' || u.username === 'nabil' || String(u.id) === 'u_1790196636099_622dc736') {
                            isAdmin = true;
                        }
                    }
                } catch(e) {}
            }
        }
    }

    // 1. GET MESSAGES
    if (req.method === 'GET' && action === 'get_messages') {
        let targetUserId = null;
        const headerUserId = req.headers['x-user-id'] || req.query.userId;

        if (isAdmin && req.query.userId) {
            targetUserId = req.query.userId;
        } else if (userPayload && userPayload.uid) {
            targetUserId = userPayload.uid;
        } else if (headerUserId) {
            targetUserId = headerUserId;
        }

        if (!targetUserId) {
            return res.status(400).json({ status: false, message: 'User ID tidak ditemukan. Harap login terlebih dahulu.' });
        }

        let userProfile = { id: targetUserId, username: 'Pengguna', email: '', avatarUrl: '/auth-logo.png', borderUrl: '', borderName: '', isVip: false, vipTier: 'none' };
        try {
            const registeredUsers = await userAuth.getRegisteredUsers();
            const foundUser = registeredUsers.find(u => String(u.id) === String(targetUserId) || String(u.username).toLowerCase() === String(targetUserId).toLowerCase());
            if (foundUser) {
                userProfile = resolveUserMetadata(foundUser);
            }
        } catch (e) {}

        const adminProfile = await resolveAdminProfile();

        let messagesList = [];

        if (pool) {
            try {
                const queryRes = await pool.query(
                    `SELECT id, user_id as "userId", sender_role as "senderRole", sender_username as "senderUsername", 
                            sender_avatar_url as "senderAvatarUrl", sender_border_url as "senderBorderUrl", sender_border_name as "senderBorderName",
                            sender_is_vip as "senderIsVip", sender_vip_tier as "senderVipTier", message, attachment, 
                            read_by_user as "readByUser", read_by_admin as "readByAdmin", created_at as "createdAt"
                     FROM admin_chat_messages 
                     WHERE user_id = $1 
                     ORDER BY created_at ASC`,
                    [targetUserId]
                );
                messagesList = queryRes.rows;
            } catch (e) {
                console.error('[ADMIN_CHAT] DB Fetch error, fallback:', e.message);
                const allMsgs = await readStoreData();
                messagesList = allMsgs.filter(m => String(m.userId) === String(targetUserId));
            }
        } else {
            const allMsgs = await readStoreData();
            messagesList = allMsgs.filter(m => String(m.userId) === String(targetUserId));
        }

        // Update user profile from latest message if foundUser was missing or incomplete
        const lastUserMsg = messagesList.filter(m => m.senderRole === 'user').pop();
        if (lastUserMsg) {
            if (lastUserMsg.senderUsername && lastUserMsg.senderUsername !== 'Pengguna') userProfile.username = lastUserMsg.senderUsername;
            if (lastUserMsg.senderAvatarUrl && lastUserMsg.senderAvatarUrl !== '/auth-logo.png') userProfile.avatarUrl = lastUserMsg.senderAvatarUrl;
            if (lastUserMsg.senderBorderUrl) userProfile.borderUrl = lastUserMsg.senderBorderUrl;
            if (lastUserMsg.senderBorderName) userProfile.borderName = lastUserMsg.senderBorderName;
            if (!foundUser) {
                if (lastUserMsg.senderIsVip) userProfile.isVip = true;
                if (lastUserMsg.senderVipTier && lastUserMsg.senderVipTier !== 'none') userProfile.vipTier = lastUserMsg.senderVipTier;
            }
        }

        // Calculate unread count
        let unreadCount = 0;
        if (isAdmin) {
            unreadCount = messagesList.filter(m => m.senderRole === 'user' && !m.readByAdmin).length;
        } else {
            unreadCount = messagesList.filter(m => m.senderRole === 'admin' && !m.readByUser).length;
        }

        return res.status(200).json({
            status: true,
            userId: targetUserId,
            userProfile: userProfile,
            adminProfile: adminProfile,
            messages: messagesList,
            unreadCount: unreadCount
        });
    }

    // 2. GET THREADS (ADMIN ONLY)
    if (req.method === 'GET' && action === 'get_threads') {
        if (!isAdmin) {
            return res.status(403).json({ status: false, message: 'Akses ditolak: Memerlukan token admin.' });
        }

        let threadsMap = new Map();
        let registeredUsersMap = new Map();

        try {
            const registeredUsers = await userAuth.getRegisteredUsers();
            registeredUsers.forEach(u => {
                registeredUsersMap.set(String(u.id), u);
                registeredUsersMap.set(String(u.username).toLowerCase(), u);
            });
        } catch (e) {}

        let allMsgs = [];
        if (pool) {
            try {
                const queryRes = await pool.query(
                    `SELECT id, user_id as "userId", sender_role as "senderRole", sender_username as "senderUsername", 
                            sender_avatar_url as "senderAvatarUrl", sender_border_url as "senderBorderUrl", sender_border_name as "senderBorderName",
                            sender_is_vip as "senderIsVip", sender_vip_tier as "senderVipTier", message, attachment, 
                            read_by_user as "readByUser", read_by_admin as "readByAdmin", created_at as "createdAt"
                     FROM admin_chat_messages 
                     ORDER BY created_at ASC`
                );
                allMsgs = queryRes.rows;
            } catch (e) {
                allMsgs = await readStoreData();
            }
        } else {
            allMsgs = await readStoreData();
        }

        allMsgs.forEach(m => {
            const uid = String(m.userId);
            if (!threadsMap.has(uid)) {
                const uInfo = registeredUsersMap.get(uid) || registeredUsersMap.get(uid.toLowerCase());
                const meta = uInfo ? resolveUserMetadata(uInfo) : null;

                const finalUsername = (uInfo && uInfo.username) ? uInfo.username : (m.senderUsername || ('User-' + uid.slice(0, 6)));
                const finalAvatar = (meta && meta.avatarUrl && meta.avatarUrl !== '/auth-logo.png') ? meta.avatarUrl : (m.senderAvatarUrl || '/auth-logo.png');
                const finalBorderUrl = (meta && meta.borderUrl) ? meta.borderUrl : (m.senderBorderUrl || '');
                const finalBorderName = (meta && meta.borderName) ? meta.borderName : (m.senderBorderName || '');
                const finalIsVip = meta ? Boolean(meta.isVip) : Boolean(m.senderIsVip);
                const finalVipTier = meta ? (meta.vipTier || 'none') : (m.senderVipTier || 'none');

                threadsMap.set(uid, {
                    userId: uid,
                    username: finalUsername,
                    avatarUrl: finalAvatar,
                    borderUrl: finalBorderUrl,
                    borderName: finalBorderName,
                    isVip: finalIsVip,
                    vipTier: finalVipTier,
                    lastMessage: m.message || (m.attachment ? '📷 Foto / Bukti Transfer' : ''),
                    hasAttachment: Boolean(m.attachment),
                    lastMessageAt: m.createdAt,
                    unreadCountForAdmin: 0,
                    totalMessages: 0
                });
            }
            const thread = threadsMap.get(uid);
            const uInfo = registeredUsersMap.get(uid) || registeredUsersMap.get(uid.toLowerCase());

            if (m.senderRole === 'user') {
                if (m.senderUsername && m.senderUsername !== 'Pengguna') thread.username = m.senderUsername;
                if (m.senderAvatarUrl && m.senderAvatarUrl !== '/auth-logo.png') thread.avatarUrl = m.senderAvatarUrl;
                if (m.senderBorderUrl) thread.borderUrl = m.senderBorderUrl;
                if (m.senderBorderName) thread.borderName = m.senderBorderName;
                if (!uInfo) {
                    if (m.senderIsVip) thread.isVip = true;
                    if (m.senderVipTier && m.senderVipTier !== 'none') thread.vipTier = m.senderVipTier;
                }
            }

            thread.lastMessage = m.message || (m.attachment ? '📷 Foto / Bukti Transfer' : '');
            thread.hasAttachment = Boolean(m.attachment);
            thread.lastMessageAt = m.createdAt;
            thread.totalMessages += 1;
            if (m.senderRole === 'user' && !m.readByAdmin) {
                thread.unreadCountForAdmin += 1;
            }
        });

        const sortedThreads = Array.from(threadsMap.values()).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

        return res.status(200).json({
            status: true,
            threads: sortedThreads
        });
    }

    // 3. SEND MESSAGE
    if (req.method === 'POST' && action === 'send_message') {
        const body = req.body || {};
        const msgText = (body.message || '').trim();
        const attachment = body.attachment || '';

        if (!msgText && !attachment) {
            return res.status(400).json({ status: false, message: 'Pesan atau foto lampiran tidak boleh kosong.' });
        }

        let targetUserId = null;
        let senderRole = 'user';
        const headerUserId = req.headers['x-user-id'] || req.query.userId || body.userId;

        if (isAdmin && body.userId) {
            targetUserId = body.userId;
            senderRole = 'admin';
        } else if (userPayload && userPayload.uid) {
            targetUserId = userPayload.uid;
            senderRole = 'user';
        } else if (headerUserId) {
            targetUserId = headerUserId;
            senderRole = 'user';
        }

        if (!targetUserId) {
            return res.status(400).json({ status: false, message: 'User ID tujuan tidak valid. Harap login terlebih dahulu.' });
        }

        const msgId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);

        let senderUsername = body.senderUsername || (userPayload ? userPayload.u : 'Pengguna');
        let senderAvatarUrl = body.senderAvatarUrl || '/auth-logo.png';
        let senderBorderUrl = body.senderBorderUrl || '';
        let senderBorderName = body.senderBorderName || '';
        let senderIsVip = Boolean(body.senderIsVip);
        let senderVipTier = body.senderVipTier || 'none';

        if (senderRole === 'admin') {
            const adminProf = await resolveAdminProfile();
            senderUsername = 'Admin MusifyStar';
            senderAvatarUrl = adminProf.avatarUrl;
            senderBorderUrl = adminProf.borderUrl;
            senderBorderName = adminProf.borderName;
            senderIsVip = true;
            senderVipTier = 'ADMIN';
        } else {
            // Fetch live user info
            try {
                const registeredUsers = await userAuth.getRegisteredUsers();
                const foundUser = registeredUsers.find(u => String(u.id) === String(targetUserId) || String(u.username).toLowerCase() === String(targetUserId).toLowerCase());
                if (foundUser) {
                    const meta = resolveUserMetadata(foundUser);
                    senderUsername = meta.username;
                    senderAvatarUrl = meta.avatarUrl;
                    senderBorderUrl = meta.borderUrl;
                    senderBorderName = meta.borderName;
                    senderIsVip = meta.isVip;
                    senderVipTier = meta.vipTier;
                } else {
                    if (body.senderAvatarUrl) senderAvatarUrl = body.senderAvatarUrl;
                    if (body.senderBorderUrl) senderBorderUrl = body.senderBorderUrl;
                    if (body.senderBorderName) senderBorderName = body.senderBorderName;
                    if (body.senderIsVip !== undefined) senderIsVip = Boolean(body.senderIsVip);
                    if (body.senderVipTier) senderVipTier = body.senderVipTier;
                }
            } catch (e) {}
        }

        const newMsg = {
            id: msgId,
            userId: String(targetUserId),
            senderRole: senderRole,
            senderUsername: senderUsername,
            senderAvatarUrl: senderAvatarUrl,
            senderBorderUrl: senderBorderUrl,
            senderBorderName: senderBorderName,
            senderIsVip: senderIsVip,
            senderVipTier: senderVipTier,
            message: msgText,
            attachment: attachment,
            readByUser: senderRole === 'user',
            readByAdmin: senderRole === 'admin',
            createdAt: new Date().toISOString()
        };

        if (pool) {
            try {
                await pool.query(
                    `INSERT INTO admin_chat_messages 
                     (id, user_id, sender_role, sender_username, sender_avatar_url, sender_border_url, sender_border_name, sender_is_vip, sender_vip_tier, message, attachment, read_by_user, read_by_admin, created_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
                    [
                        newMsg.id, newMsg.userId, newMsg.senderRole, newMsg.senderUsername,
                        newMsg.senderAvatarUrl, newMsg.senderBorderUrl, newMsg.senderBorderName,
                        newMsg.senderIsVip, newMsg.senderVipTier, newMsg.message, newMsg.attachment,
                        newMsg.readByUser, newMsg.readByAdmin, newMsg.createdAt
                    ]
                );
            } catch (e) {
                console.error('[ADMIN_CHAT] DB insert error, fallback:', e.message);
                const allMsgs = await readStoreData();
                allMsgs.push(newMsg);
                await writeStoreData(allMsgs);
            }
        } else {
            const allMsgs = await readStoreData();
            allMsgs.push(newMsg);
            await writeStoreData(allMsgs);
        }

        return res.status(200).json({
            status: true,
            message: 'Pesan berhasil terkirim.',
            data: newMsg
        });
    }

    // 4. MARK READ
    if (req.method === 'POST' && action === 'mark_read') {
        const body = req.body || {};
        let targetUserId = body.userId;

        if (!isAdmin && userPayload && userPayload.uid) {
            targetUserId = userPayload.uid;
        }

        if (!targetUserId) {
            return res.status(400).json({ status: false, message: 'User ID tidak valid.' });
        }

        if (pool) {
            try {
                if (isAdmin) {
                    await pool.query(
                        `UPDATE admin_chat_messages SET read_by_admin = TRUE WHERE user_id = $1 AND sender_role = 'user'`,
                        [targetUserId]
                    );
                } else {
                    await pool.query(
                        `UPDATE admin_chat_messages SET read_by_user = TRUE WHERE user_id = $1 AND sender_role = 'admin'`,
                        [targetUserId]
                    );
                }
            } catch (e) {
                const allMsgs = await readStoreData();
                allMsgs.forEach(m => {
                    if (String(m.userId) === String(targetUserId)) {
                        if (isAdmin && m.senderRole === 'user') m.readByAdmin = true;
                        if (!isAdmin && m.senderRole === 'admin') m.readByUser = true;
                    }
                });
                await writeStoreData(allMsgs);
            }
        } else {
            const allMsgs = await readStoreData();
            allMsgs.forEach(m => {
                if (String(m.userId) === String(targetUserId)) {
                    if (isAdmin && m.senderRole === 'user') m.readByAdmin = true;
                    if (!isAdmin && m.senderRole === 'admin') m.readByUser = true;
                }
            });
            await writeStoreData(allMsgs);
        }

        return res.status(200).json({ status: true, message: 'Pesan ditandai sudah dibaca.' });
    }

    // 5. DELETE SINGLE MESSAGE
    if ((req.method === 'POST' || req.method === 'DELETE') && action === 'delete_message') {
        const body = req.body || {};
        const messageId = body.messageId || req.query.messageId;

        if (!messageId) {
            return res.status(400).json({ status: false, message: 'Message ID tidak valid.' });
        }

        if (pool) {
            try {
                if (isAdmin) {
                    await pool.query(`DELETE FROM admin_chat_messages WHERE id = $1`, [messageId]);
                } else if (userPayload && userPayload.uid) {
                    await pool.query(`DELETE FROM admin_chat_messages WHERE id = $1 AND user_id = $2`, [messageId, userPayload.uid]);
                } else if (headerUserId) {
                    await pool.query(`DELETE FROM admin_chat_messages WHERE id = $1 AND user_id = $2`, [messageId, headerUserId]);
                }
            } catch (e) {
                let allMsgs = await readStoreData();
                allMsgs = allMsgs.filter(m => String(m.id) !== String(messageId));
                await writeStoreData(allMsgs);
            }
        } else {
            let allMsgs = await readStoreData();
            allMsgs = allMsgs.filter(m => String(m.id) !== String(messageId));
            await writeStoreData(allMsgs);
        }

        return res.status(200).json({ status: true, message: 'Pesan berhasil dihapus.' });
    }

    // 6. DELETE THREAD (ADMIN ONLY)
    if ((req.method === 'POST' || req.method === 'DELETE') && action === 'delete_thread') {
        if (!isAdmin) {
            return res.status(403).json({ status: false, message: 'Akses ditolak: Hanya admin yang dapat menghapus seluruh percakapan.' });
        }

        const body = req.body || {};
        const targetUserId = body.userId || req.query.userId;

        if (!targetUserId) {
            return res.status(400).json({ status: false, message: 'User ID tidak valid.' });
        }

        if (pool) {
            try {
                await pool.query(`DELETE FROM admin_chat_messages WHERE user_id = $1`, [targetUserId]);
            } catch (e) {
                let allMsgs = await readStoreData();
                allMsgs = allMsgs.filter(m => String(m.userId) !== String(targetUserId));
                await writeStoreData(allMsgs);
            }
        } else {
            let allMsgs = await readStoreData();
            allMsgs = allMsgs.filter(m => String(m.userId) !== String(targetUserId));
            await writeStoreData(allMsgs);
        }

        return res.status(200).json({ status: true, message: 'Seluruh percakapan pengguna berhasil dihapus.' });
    }

    return res.status(400).json({ status: false, message: 'Aksi admin chat tidak didukung.' });
};
