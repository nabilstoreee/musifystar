const path = require('path');
const crypto = require('crypto');
const storage = require('./storage.js');

const CRED_FILE = '.admin_credentials.json';

// In-memory active tokens cache
const activeTokens = new Set();
// In-memory pending 2FA login sessions: tempToken -> { username, expiresAt }
const pending2FASessions = new Map();
// In-memory pending 2FA setups: adminToken -> { secret, createdAt }
const pending2FASetups = new Map();

// Base32 Alphabet for TOTP (RFC 4648)
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'musifystar_admin_secret_key_v2_sign_98741';

function createSignedSessionToken(username) {
    const payload = {
        u: username || 'admin',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days
    };
    const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto.createHmac('sha256', JWT_SECRET).update(payloadStr).digest('base64url');
    const token = `mst_${payloadStr}.${signature}`;
    activeTokens.add(token);
    return token;
}

function verifySessionToken(token) {
    if (!token || typeof token !== 'string') return false;
    const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
    if (!cleanToken) return false;

    // 1. In-memory check (for backward compatibility)
    if (activeTokens.has(cleanToken)) return true;

    // 2. Stateless HMAC token check (for serverless Vercel / Netlify / Multi-instance)
    if (cleanToken.startsWith('mst_')) {
        const parts = cleanToken.slice(4).split('.');
        if (parts.length === 2) {
            const [payloadStr, signature] = parts;
            try {
                const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(payloadStr).digest('base64url');
                if (safeCompare(signature, expectedSig)) {
                    const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf8'));
                    if (payload && payload.exp && Math.floor(Date.now() / 1000) < payload.exp) {
                        return true;
                    }
                }
            } catch (e) {}
        }
    }
    return false;
}

function createSignedTempToken(username) {
    const payload = {
        u: username || 'admin',
        t: 'temp_2fa',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 300 // 5 minutes
    };
    const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto.createHmac('sha256', JWT_SECRET).update(payloadStr).digest('base64url');
    const token = `tmp_${payloadStr}.${signature}`;
    pending2FASessions.set(token, {
        username: username,
        expiresAt: Date.now() + (5 * 60 * 1000)
    });
    return token;
}

function verifyTempToken(token) {
    if (!token || typeof token !== 'string') return null;
    const clean = token.trim();

    // Check memory first
    const mem = pending2FASessions.get(clean);
    if (mem && Date.now() <= mem.expiresAt) {
        return mem;
    }

    // Check signed token
    if (clean.startsWith('tmp_')) {
        const parts = clean.slice(4).split('.');
        if (parts.length === 2) {
            const [payloadStr, signature] = parts;
            try {
                const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(payloadStr).digest('base64url');
                if (safeCompare(signature, expectedSig)) {
                    const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf8'));
                    if (payload && payload.t === 'temp_2fa' && payload.exp && Math.floor(Date.now() / 1000) < payload.exp) {
                        return { username: payload.u, expiresAt: payload.exp * 1000 };
                    }
                }
            } catch (e) {}
        }
    }
    return null;
}

function generateRandomBase32Secret(length = 16) {
    let secret = '';
    const randomBytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
        secret += BASE32_ALPHABET[randomBytes[i] % 32];
    }
    return secret;
}

function base32Decode(base32Str) {
    let clean = (base32Str || '').toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
    let bits = '';
    for (let i = 0; i < clean.length; i++) {
        const val = BASE32_ALPHABET.indexOf(clean[i]);
        if (val === -1) continue;
        bits += val.toString(2).padStart(5, '0');
    }
    const bytes = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) {
        bytes.push(parseInt(bits.substr(i, 8), 2));
    }
    return Buffer.from(bytes);
}

function generateTOTP(secret, timeStepOffset = 0) {
    try {
        const key = base32Decode(secret);
        const timeStep = Math.floor(Date.now() / 1000 / 30) + timeStepOffset;
        const timeBuffer = Buffer.alloc(8);
        timeBuffer.writeBigInt64BE(BigInt(timeStep));

        const hmac = crypto.createHmac('sha1', key).update(timeBuffer).digest();
        const offset = hmac[hmac.length - 1] & 0x0f;
        const codeInt = ((hmac[offset] & 0x7f) << 24) |
                        ((hmac[offset + 1] & 0xff) << 16) |
                        ((hmac[offset + 2] & 0xff) << 8) |
                        (hmac[offset + 3] & 0xff);
        const code = (codeInt % 1000000).toString().padStart(6, '0');
        return code;
    } catch (e) {
        return null;
    }
}

function verifyTOTP(secret, inputCode) {
    if (!secret || !inputCode) return false;
    const cleanCode = String(inputCode).replace(/\s+/g, '').trim();
    if (cleanCode.length !== 6) return false;

    // Check current time step and adjacent +/- 1 window (30s drift tolerance)
    for (let offset = -1; offset <= 1; offset++) {
        const expected = generateTOTP(secret, offset);
        if (expected && safeCompare(expected, cleanCode)) {
            return true;
        }
    }
    return false;
}

function computeHash(password, salt) {
    if (!password || !salt) return '';
    return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

function hashPassword(password, salt) {
    const s = salt || crypto.randomBytes(16).toString('hex');
    const h = computeHash(password, s);
    return { hash: h, salt: s };
}

function safeCompare(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
}

async function getStoredCredentialsAsync() {
    // 1. Direct fetch from Neon PostgreSQL (with memory & disk backup)
    const data = await storage.readDataAsync(CRED_FILE, null);
    if (data && data.username && (data.hash || (data.password && typeof data.password === 'string'))) {
        const hashStr = typeof data.hash === 'object' && data.hash !== null ? (data.hash.hash || '') : (data.hash || data.password);
        const saltStr = typeof data.hash === 'object' && data.hash !== null ? (data.hash.salt || data.salt) : data.salt;
        return {
            type: 'file',
            username: data.username,
            hash: hashStr,
            salt: saltStr,
            twoFactorEnabled: Boolean(data.twoFactorEnabled),
            twoFactorSecret: data.twoFactorSecret || null,
            twoFactorEnabledAt: data.twoFactorEnabledAt || null
        };
    }

    // 2. Fallback to environment variables if no credential file
    const envUser = process.env.ADMIN_USERNAME;
    const envPass = process.env.ADMIN_PASSWORD;

    if (envUser && envPass) {
        return {
            type: 'env',
            username: envUser.trim(),
            password: envPass.trim(),
            twoFactorEnabled: false,
            twoFactorSecret: null
        };
    }

    return null;
}

function getStoredCredentialsSync() {
    const data = storage.readData(CRED_FILE, null);
    if (data && data.username && (data.hash || (data.password && typeof data.password === 'string'))) {
        const hashStr = typeof data.hash === 'object' && data.hash !== null ? (data.hash.hash || '') : (data.hash || data.password);
        const saltStr = typeof data.hash === 'object' && data.hash !== null ? (data.hash.salt || data.salt) : data.salt;
        return {
            type: 'file',
            username: data.username,
            hash: hashStr,
            salt: saltStr,
            twoFactorEnabled: Boolean(data.twoFactorEnabled),
            twoFactorSecret: data.twoFactorSecret || null,
            twoFactorEnabledAt: data.twoFactorEnabledAt || null
        };
    }

    const envUser = process.env.ADMIN_USERNAME;
    const envPass = process.env.ADMIN_PASSWORD;
    if (envUser && envPass) {
        return {
            type: 'env',
            username: envUser.trim(),
            password: envPass.trim(),
            twoFactorEnabled: false,
            twoFactorSecret: null
        };
    }
    return null;
}

module.exports = async function (req, res) {
    res.setHeader('Content-Type', 'application/json');

    const method = req.method.toUpperCase();

    if (method === 'GET') {
        const token = req.headers['x-admin-token'] || req.query.token;
        const creds = await getStoredCredentialsAsync();
        const isAuthenticated = Boolean(token && verifySessionToken(token));

        return res.json({
            status: true,
            hasCredentials: Boolean(creds),
            authenticated: isAuthenticated,
            twoFactorEnabled: creds ? Boolean(creds.twoFactorEnabled) : false
        });
    }

    if (method === 'POST') {
        const body = req.body || {};
        const action = body.action || (body.username || body.password ? 'login' : '');
        const username = typeof body.username === 'string' ? body.username.trim() : '';
        const password = typeof body.password === 'string' ? body.password : '';
        const token = body.token || req.headers['x-admin-token'] || (req.headers['authorization'] ? req.headers['authorization'].replace(/^Bearer\s+/i, '') : '');

        // Clean up expired 2FA login temp tokens
        const now = Date.now();
        for (const [tToken, info] of pending2FASessions.entries()) {
            if (now > info.expiresAt) {
                pending2FASessions.delete(tToken);
            }
        }

        if (action === 'logout') {
            if (token) activeTokens.delete(token);
            return res.json({ status: true, message: 'Berhasil logout' });
        }

        const creds = await getStoredCredentialsAsync();

        // If no credentials configured yet, allow initial first-time setup
        if (!creds) {
            if (action === 'setup') {
                if (!username || username.length < 3) {
                    return res.status(400).json({ status: false, message: 'Username minimal 3 karakter' });
                }
                if (!password || password.length < 4) {
                    return res.status(400).json({ status: false, message: 'Password minimal 4 karakter' });
                }

                const { hash, salt } = hashPassword(password);

                try {
                    await storage.writeDataAsync(CRED_FILE, {
                        username: username,
                        hash: hash,
                        salt: salt,
                        twoFactorEnabled: false,
                        twoFactorSecret: null,
                        createdAt: new Date().toISOString()
                    });

                    const sessionToken = createSignedSessionToken(username);

                    return res.json({
                        status: true,
                        success: true,
                        token: sessionToken,
                        message: 'Kredensial admin berhasil dibuat'
                    });
                } catch (err) {
                    return res.status(500).json({ status: false, message: 'Gagal menyimpan kredensial' });
                }
            }

            return res.json({
                status: true,
                needsSetup: true,
                message: 'Admin belum disetel. Silakan buat Username & Password baru.'
            });
        }

        // ==========================================
        // ACTION: VERIFY 2FA (Step 2 of 2FA Login)
        // ==========================================
        if (action === 'verify_2fa') {
            const tempToken = body.tempToken;
            const otpCode = body.otp || body.code;
            const sessionInfo = verifyTempToken(tempToken);

            if (!tempToken || !sessionInfo) {
                return res.status(401).json({
                    status: false,
                    message: 'Sesi verifikasi 2FA kedaluwarsa atau tidak valid. Silakan login ulang.'
                });
            }

            if (!otpCode || String(otpCode).trim().length !== 6) {
                return res.status(400).json({
                    status: false,
                    message: 'Kode OTP 6 digit wajib diisi'
                });
            }

            if (!creds.twoFactorSecret) {
                return res.status(500).json({
                    status: false,
                    message: 'Secret 2FA tidak ditemukan pada konfigurasi sistem.'
                });
            }

            const isValid = verifyTOTP(creds.twoFactorSecret, otpCode);
            if (!isValid) {
                return res.status(401).json({
                    status: false,
                    message: 'Kode 2FA salah atau kedaluwarsa. Periksa aplikasi Authenticator Anda.'
                });
            }

            // Success: Clean up temp token & issue permanent session token
            pending2FASessions.delete(tempToken);
            const sessionToken = createSignedSessionToken(creds.username);

            return res.json({
                status: true,
                success: true,
                token: sessionToken,
                message: 'Verifikasi 2FA berhasil! Selamat datang kembali.'
            });
        }

        // ==========================================
        // ACTION: 2FA SETUP INIT (Generate secret & URI)
        // ==========================================
        if (action === '2fa_init' || action === '2fa_setup') {
            if (!token || !verifySessionToken(token)) {
                return res.status(401).json({ status: false, message: 'Akses ditolak: Membutuhkan token admin aktif' });
            }

            const secret = generateRandomBase32Secret(16);
            const issuer = 'MusifyStar Admin';
            const account = creds.username || 'admin';
            const otpauthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`;

            pending2FASetups.set(token, { secret: secret, createdAt: Date.now() });

            return res.json({
                status: true,
                secret: secret,
                otpauthUrl: otpauthUrl,
                qrUrl: qrUrl,
                username: account,
                issuer: issuer
            });
        }

        // ==========================================
        // ACTION: 2FA ENABLE (Verify OTP & Save Secret)
        // ==========================================
        if (action === '2fa_enable') {
            if (!token || !verifySessionToken(token)) {
                return res.status(401).json({ status: false, message: 'Akses ditolak: Membutuhkan token admin aktif' });
            }

            const otpCode = body.otp || body.code;
            const secret = body.secret || (pending2FASetups.get(token) && pending2FASetups.get(token).secret);

            if (!secret) {
                return res.status(400).json({ status: false, message: 'Secret 2FA tidak ditemukan. Silakan mulai ulang setup 2FA.' });
            }

            const isValid = verifyTOTP(secret, String(otpCode || ''));
            if (!isValid) {
                return res.status(400).json({ status: false, message: 'Kode OTP yang dimasukkan tidak valid. Pastikan jam perangkat Anda akurat.' });
            }

            try {
                let currentFileCreds = await storage.readDataAsync(CRED_FILE, null);
                if (!currentFileCreds) {
                    if (creds.type === 'env') {
                        const { hash, salt } = hashPassword(creds.password);
                        currentFileCreds = { username: creds.username, hash, salt };
                    } else {
                        currentFileCreds = {};
                    }
                }

                currentFileCreds.twoFactorEnabled = true;
                currentFileCreds.twoFactorSecret = secret;
                currentFileCreds.twoFactorEnabledAt = new Date().toISOString();

                await storage.writeDataAsync(CRED_FILE, currentFileCreds);
                pending2FASetups.delete(token);

                return res.json({
                    status: true,
                    success: true,
                    message: 'Two-Factor Authentication (2FA) berhasil diaktifkan!'
                });
            } catch (err) {
                return res.status(500).json({ status: false, message: 'Gagal menyimpan pengaturan 2FA: ' + err.message });
            }
        }

        // ==========================================
        // ACTION: 2FA DISABLE (Turn off 2FA)
        // ==========================================
        if (action === '2fa_disable') {
            if (!token || !verifySessionToken(token)) {
                return res.status(401).json({ status: false, message: 'Akses ditolak: Membutuhkan token admin aktif' });
            }

            const verifyPassword = body.password;
            if (verifyPassword) {
                let isPassMatch = false;
                if (creds.type === 'env') {
                    isPassMatch = safeCompare(verifyPassword, creds.password);
                } else if (creds.type === 'file') {
                    const calculatedHash = computeHash(verifyPassword, creds.salt);
                    isPassMatch = safeCompare(calculatedHash, creds.hash);
                }
                if (!isPassMatch) {
                    return res.status(400).json({ status: false, message: 'Password konfirmasi salah' });
                }
            }

            try {
                let currentFileCreds = await storage.readDataAsync(CRED_FILE, {});

                currentFileCreds.twoFactorEnabled = false;
                currentFileCreds.twoFactorSecret = null;
                currentFileCreds.twoFactorDisabledAt = new Date().toISOString();

                await storage.writeDataAsync(CRED_FILE, currentFileCreds);

                return res.json({
                    status: true,
                    success: true,
                    message: 'Two-Factor Authentication (2FA) berhasil dinonaktifkan'
                });
            } catch (err) {
                return res.status(500).json({ status: false, message: 'Gagal menonaktifkan 2FA: ' + err.message });
            }
        }

        // ==========================================
        // ACTION: CHANGE ADMIN PASSWORD
        // ==========================================
        if (action === 'change_password') {
            const oldPassword = typeof body.oldPassword === 'string' ? body.oldPassword : '';
            const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

            // Verify authentication (either valid token or old password)
            const isAuthByToken = Boolean(token && verifySessionToken(token));
            let isOldPassValid = false;

            if (creds.type === 'env') {
                isOldPassValid = safeCompare(oldPassword, creds.password);
            } else if (creds.type === 'file') {
                const calculatedOldHash = computeHash(oldPassword, creds.salt);
                isOldPassValid = safeCompare(calculatedOldHash, creds.hash);
            }

            if (!isAuthByToken && !isOldPassValid) {
                return res.status(401).json({ status: false, message: 'Password lama tidak valid atau sesi berakhir' });
            }

            if (oldPassword && !isOldPassValid) {
                return res.status(400).json({ status: false, message: 'Password lama yang Anda masukkan salah' });
            }

            if (!newPassword || newPassword.length < 4) {
                return res.status(400).json({ status: false, message: 'Password baru minimal 4 karakter' });
            }

            const { hash: newHash, salt: newSalt } = hashPassword(newPassword);
            const targetUsername = creds.username || username || 'musikstar';

            try {
                let currentFileCreds = await storage.readDataAsync(CRED_FILE, {});

                currentFileCreds.username = targetUsername;
                currentFileCreds.hash = newHash;
                currentFileCreds.salt = newSalt;
                currentFileCreds.updatedAt = new Date().toISOString();

                await storage.writeDataAsync(CRED_FILE, currentFileCreds);

                return res.json({
                    status: true,
                    success: true,
                    message: 'Password admin berhasil diperbarui secara aman!'
                });
            } catch (err) {
                return res.status(500).json({ status: false, message: 'Gagal menyimpan password baru: ' + err.message });
            }
        }

        // ==========================================
        // ACTION: LOGIN (Step 1)
        // ==========================================
        if (action === 'login') {
            if (!username || !password) {
                return res.status(400).json({ status: false, message: 'Username dan password wajib diisi' });
            }

            let isMatch = false;

            const inputUser = username.trim().toLowerCase();
            const storedUser = (creds.username || '').trim().toLowerCase();
            const isUserMatch = (inputUser === storedUser) || (inputUser === 'admin') || (storedUser === 'admin');

            if (creds.type === 'env') {
                const passMatch = safeCompare(password, creds.password);
                isMatch = isUserMatch && passMatch;
            } else if (creds.type === 'file') {
                if (isUserMatch) {
                    const calculatedHash = computeHash(password, creds.salt);
                    isMatch = safeCompare(calculatedHash, creds.hash);
                }
            }

            if (!isMatch) {
                return res.status(401).json({ status: false, message: 'Username atau password salah' });
            }

            // If 2FA is active, require OTP verification before giving full token
            if (creds.twoFactorEnabled && creds.twoFactorSecret) {
                const tempToken = createSignedTempToken(creds.username);

                return res.json({
                    status: true,
                    require2FA: true,
                    tempToken: tempToken,
                    message: 'Verifikasi 2FA diperlukan. Masukkan kode 6 digit OTP.'
                });
            }

            // Direct Login without 2FA
            const sessionToken = createSignedSessionToken(creds.username);

            return res.json({
                status: true,
                success: true,
                token: sessionToken,
                message: 'Login admin berhasil'
            });
        }

        return res.status(400).json({ status: false, message: 'Aksi admin tidak valid atau tidak didukung' });
    }

    return res.status(405).json({ status: false, message: 'Metode tidak didukung' });
};

module.exports.isValidToken = function (token) {
    return verifySessionToken(token);
};

module.exports.verifyToken = function (token) {
    return verifySessionToken(token);
};

module.exports.verifySessionToken = function (token) {
    return verifySessionToken(token);
};
module.exports.createSignedSessionToken = createSignedSessionToken;
module.exports.getStoredCredentials = getStoredCredentialsSync;
module.exports.getStoredCredentialsAsync = getStoredCredentialsAsync;
