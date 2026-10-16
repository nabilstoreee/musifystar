const fs = require('fs');
const path = require('path');
const adminAuth = require('./admin-auth.js');
const storage = require('./storage.js');

const FEEDBACK_FILE = '.user_feedback.json';

async function readFeedbacksAsync() {
    const data = await storage.readDataAsync(FEEDBACK_FILE, []);
    return Array.isArray(data) ? data : [];
}

async function writeFeedbacksAsync(feedbacks) {
    return await storage.writeDataAsync(FEEDBACK_FILE, feedbacks);
}

module.exports = async function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    const method = req.method.toUpperCase();

    // 1. POST: User submits new feedback (Public endpoint)
    if (method === 'POST') {
        const body = req.body || {};
        const name = typeof body.name === 'string' ? body.name.trim() : '';
        const message = typeof body.message === 'string' ? body.message.trim() : '';
        const contact = typeof body.contact === 'string' ? body.contact.trim() : '';

        if (!name) {
            return res.status(400).json({ status: false, message: 'Nama wajib diisi' });
        }
        if (!message) {
            return res.status(400).json({ status: false, message: 'Pesan masukan wajib diisi' });
        }
        if (message.length > 2000) {
            return res.status(400).json({ status: false, message: 'Pesan maksimal 2000 karakter' });
        }

        const feedbacks = await readFeedbacksAsync();
        const userLogged = typeof body.userLogged === 'boolean' ? body.userLogged : false;
        const username = typeof body.username === 'string' ? body.username.trim() : '';
        const email = typeof body.email === 'string' ? body.email.trim() : '';
        const userAvatar = typeof body.userAvatar === 'string' ? body.userAvatar.trim() : '';

        const newEntry = {
            id: 'fb_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            name: name,
            message: message,
            contact: contact || '-',
            createdAt: new Date().toISOString(),
            isRead: false,
            userLogged: userLogged,
            username: username,
            email: email,
            userAvatar: userAvatar
        };

        feedbacks.unshift(newEntry);
        // Limit max feedbacks stored to 500
        if (feedbacks.length > 500) {
            feedbacks.length = 500;
        }

        const saved = await writeFeedbacksAsync(feedbacks);
        if (!saved) {
            return res.status(500).json({ status: false, message: 'Gagal menyimpan pesan masukan' });
        }

        return res.json({
            status: true,
            message: 'Pesan dan masukan berhasil dikirim. Terima kasih!',
            id: newEntry.id
        });
    }

    // Admin authorization check for GET, PATCH, DELETE
    const token = req.headers['x-admin-token'] || req.query.token;
    if (!adminAuth.isValidToken(token)) {
        return res.status(401).json({ status: false, message: 'Akses ditolak: Membutuhkan token admin' });
    }

    // 2. GET: Admin fetches feedbacks
    if (method === 'GET') {
        const feedbacks = await readFeedbacksAsync();
        return res.json({
            status: true,
            feedbacks: feedbacks,
            total: feedbacks.length,
            unreadCount: feedbacks.filter(f => !f.isRead).length
        });
    }

    // 3. PATCH: Admin marks as read/unread
    if (method === 'PATCH') {
        const body = req.body || {};
        const id = body.id;
        const feedbacks = await readFeedbacksAsync();
        const item = feedbacks.find(f => f.id === id);

        if (!item) {
            return res.status(404).json({ status: false, message: 'Pesan tidak ditemukan' });
        }

        item.isRead = typeof body.isRead === 'boolean' ? body.isRead : !item.isRead;
        await writeFeedbacksAsync(feedbacks);

        return res.json({ status: true, item: item });
    }

    // 4. DELETE: Admin deletes a feedback
    if (method === 'DELETE') {
        const id = (req.body && req.body.id) || req.query.id;
        if (!id) {
            return res.status(400).json({ status: false, message: 'ID pesan wajib diisi' });
        }

        let feedbacks = await readFeedbacksAsync();
        const initialLen = feedbacks.length;
        feedbacks = feedbacks.filter(f => f.id !== id);

        if (feedbacks.length === initialLen) {
            return res.status(404).json({ status: false, message: 'Pesan tidak ditemukan' });
        }

        await writeFeedbacksAsync(feedbacks);
        return res.json({ status: true, message: 'Pesan berhasil dihapus' });
    }

    return res.status(405).json({ status: false, message: 'Metode tidak didukung' });
};
