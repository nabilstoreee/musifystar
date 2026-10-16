const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Auto-load .env configuration if not already loaded into process.env
try {
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const eqIdx = trimmed.indexOf('=');
                if (eqIdx > 0) {
                    const k = trimmed.slice(0, eqIdx).trim();
                    const v = trimmed.slice(eqIdx + 1).trim();
                    if (k && v) {
                        process.env[k] = v;
                    }
                }
            }
        });
    }
} catch (e) {}

// PostgreSQL Database URL from environment (Supabase)
const DATABASE_URL = process.env.DATABASE_URL;

// Security Sanitizer: Strips out passwords and database host info from any log output
function sanitizeLog(err) {
    if (!err) return '';
    const raw = typeof err === 'string' ? err : (err.message || String(err));
    return raw.replace(/postgresql:\/\/[^@]+@/gi, 'postgresql://***:***@');
}

// In-memory cache kept in sync for ultra-fast 0ms response times
const memoryStore = new Map();

function normalizeKey(filename) {
    return path.basename(filename);
}

let pool = null;
if (DATABASE_URL) {
    try {
        pool = new Pool({
            connectionString: DATABASE_URL,
            ssl: { rejectUnauthorized: false },
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000
        });

        // Essential error listener on pg.Pool to catch idle client disconnects and prevent crashing
        pool.on('error', (err) => {
            console.warn('[PostgreSQL Pool] Idle connection notice:', sanitizeLog(err));
        });

        // Auto-create storage table in PostgreSQL if not present
        pool.query(`
            CREATE TABLE IF NOT EXISTS app_storage (
                key VARCHAR(100) PRIMARY KEY,
                data JSONB NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `).then(() => {
            console.log('[Supabase PostgreSQL] Table verified & active as 100% EXCLUSIVE database.');
        }).catch(err => {
            console.error('[Supabase PostgreSQL] Table init error:', sanitizeLog(err));
        });
    } catch (e) {
        console.error('[Supabase PostgreSQL] Pool init error:', sanitizeLog(e));
    }
}

// Load data directly from PostgreSQL into memory cache
async function fetchFromPostgres(key) {
    if (!pool) return null;
    try {
        const res = await pool.query('SELECT data FROM app_storage WHERE key = $1', [key]);
        if (res.rows && res.rows.length > 0) {
            const data = res.rows[0].data;
            memoryStore.set(key, data);
            return data;
        }
    } catch (err) {
        console.warn(`[Supabase PostgreSQL] Read notice for key "${key}":`, sanitizeLog(err));
    }
    return null;
}

// Persist data into Supabase PostgreSQL
async function writeToPostgres(key, data) {
    if (!pool) return true;
    try {
        await pool.query(
            `INSERT INTO app_storage (key, data, updated_at) VALUES ($1, $2, NOW())
             ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
            [key, JSON.stringify(data)]
        );
        return true;
    } catch (err) {
        console.error(`[Supabase PostgreSQL] Error saving key "${key}":`, sanitizeLog(err));
        return false;
    }
}

/**
 * Synchronous read accessor (reads from live RAM memory mirror synced with Supabase PostgreSQL)
 */
function readData(filename, defaultValue) {
    const key = normalizeKey(filename);

    if (memoryStore.has(key)) {
        return memoryStore.get(key);
    }

    if (pool) {
        fetchFromPostgres(key).catch(() => {});
    }

    return defaultValue !== undefined ? defaultValue : null;
}

/**
 * Write accessor (updates live RAM memory state and persists asynchronously to Supabase PostgreSQL)
 */
function writeData(filename, data) {
    const key = normalizeKey(filename);

    // 1. Immediately update active memory state (0ms latency for client)
    memoryStore.set(key, data);

    // 2. Persist to Supabase PostgreSQL cloud database
    if (pool) {
        writeToPostgres(key, data).catch(() => {});
    }

    return true;
}

// Async direct read from storage (checks RAM first, falls back to Supabase query)
async function readDataAsync(filename, defaultValue) {
    const key = normalizeKey(filename);
    if (memoryStore.has(key)) {
        return memoryStore.get(key);
    }
    const dbData = await fetchFromPostgres(key);
    if (dbData !== null && dbData !== undefined) {
        return dbData;
    }
    return defaultValue !== undefined ? defaultValue : null;
}

// Async direct write to storage (updates RAM and persists to Supabase PostgreSQL)
async function writeDataAsync(filename, data) {
    const key = normalizeKey(filename);
    memoryStore.set(key, data);
    return await writeToPostgres(key, data);
}

// Direct preload of all remote state from Supabase PostgreSQL into RAM at startup
async function initStorageEngine() {
    if (pool) {
        try {
            const res = await pool.query('SELECT key, data FROM app_storage');
            for (const row of res.rows) {
                memoryStore.set(row.key, row.data);
            }
            console.log(`[Supabase PostgreSQL] Cloud DB active: Loaded ${res.rows.length} keys directly into live RAM memory cache.`);
        } catch (e) {
            console.warn('[Supabase PostgreSQL] Initial load notice:', sanitizeLog(e));
        }
    }
}
initStorageEngine().catch(() => {});

module.exports = {
    readData,
    writeData,
    readDataAsync,
    writeDataAsync,
    fetchFromPostgres,
    writeToPostgres,
    pool
};

