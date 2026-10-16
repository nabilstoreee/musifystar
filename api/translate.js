const https = require('https');
const http = require('http');

// In-memory cache for translated lines
const cache = new Map();

function detectSourceLang(text) {
    if (!text) return 'en';
    if (/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(text)) return 'ja';
    if (/[\uac00-\ud7af\u1100-\u11ff]/.test(text)) return 'ko';
    if (/[\u0600-\u06ff]/.test(text)) return 'ar';
    if (/[\u0400-\u04ff]/.test(text)) return 'ru';
    if (/[\u0e00-\u0e7f]/.test(text)) return 'th';
    return 'en';
}

function httpGetJson(url, timeoutMs = 3500) {
    return new Promise((resolve) => {
        const client = url.startsWith('https') ? https : http;
        const req = client.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: timeoutMs
        }, (res) => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(d));
                } catch (e) {
                    resolve(null);
                }
            });
        });
        req.on('error', () => resolve(null));
        req.on('timeout', () => { req.destroy(); resolve(null); });
    });
}

async function translateText(text, targetLang = 'id') {
    if (!text || !text.trim()) return '';
    const clean = text.trim();
    if (clean === '• • •' || clean === '...') return '';

    const cacheKey = `${clean}_${targetLang}`;
    if (cache.has(cacheKey)) {
        return cache.get(cacheKey);
    }

    const srcLang = detectSourceLang(clean);

    // 1. Primary: Google Translate GTX API
    try {
        const gtxUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(clean)}`;
        const data = await httpGetJson(gtxUrl, 3000);
        if (data && Array.isArray(data[0])) {
            const trans = data[0].map(x => x[0]).filter(Boolean).join('');
            if (trans && trans.trim()) {
                const result = trans.trim();
                cache.set(cacheKey, result);
                return result;
            }
        }
    } catch (e) {}

    // 2. Fallback: MyMemory API
    try {
        const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(clean)}&langpair=${srcLang}|${targetLang}`;
        const data = await httpGetJson(myMemoryUrl, 3500);
        if (data && data.responseData && data.responseData.translatedText) {
            let trans = data.responseData.translatedText.trim();
            if (trans && !trans.includes('INVALID SOURCE LANGUAGE') && !trans.includes('MYMEMORY WARNING') && trans.toLowerCase() !== clean.toLowerCase()) {
                trans = trans.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
                cache.set(cacheKey, trans);
                return trans;
            }
        }
    } catch (e) {}

    // 3. Fallback: Lingva Translate mirror
    try {
        const lingvaUrl = `https://lingva.ml/api/v1/${srcLang}/${targetLang}/${encodeURIComponent(clean)}`;
        const data = await httpGetJson(lingvaUrl, 3000);
        if (data && data.translation) {
            const trans = data.translation.trim();
            if (trans && trans.toLowerCase() !== clean.toLowerCase()) {
                cache.set(cacheKey, trans);
                return trans;
            }
        }
    } catch (e) {}

    return '';
}

async function translateBatchGTX(texts, targetLang = 'id') {
    if (!texts || texts.length === 0) return [];
    const joined = texts.join('\n');
    try {
        const gtxUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(joined)}`;
        const data = await httpGetJson(gtxUrl, 5000);
        if (data && Array.isArray(data[0])) {
            const fullTranslated = data[0].map(x => x[0]).filter(Boolean).join('');
            const split = fullTranslated.split('\n');
            if (split.length === texts.length) {
                return split.map(s => s.trim());
            }
        }
    } catch (e) {}
    return null;
}

async function translateLines(lines, targetLang = 'id') {
    if (!lines || !Array.isArray(lines) || lines.length === 0) return lines || [];

    const rawTexts = lines.map(line => typeof line === 'string' ? line : (line.text || ''));

    // Try batch translation using GTX for fast speed
    const BATCH_SIZE = 25;
    const allTranslations = [];
    let batchFailed = false;

    for (let i = 0; i < rawTexts.length; i += BATCH_SIZE) {
        const batchTexts = rawTexts.slice(i, i + BATCH_SIZE);
        const batchRes = await translateBatchGTX(batchTexts, targetLang);
        if (batchRes && batchRes.length === batchTexts.length) {
            allTranslations.push(...batchRes);
        } else {
            batchFailed = true;
            break;
        }
    }

    if (!batchFailed && allTranslations.length === lines.length) {
        return lines.map((line, idx) => {
            const orig = typeof line === 'string' ? line : (line.text || '');
            let trans = allTranslations[idx] || '';
            if (trans.toLowerCase() === orig.trim().toLowerCase()) trans = '';
            if (typeof line === 'string') {
                return { text: line, translation: trans };
            }
            return { ...line, translation: trans };
        });
    }

    // Fallback: line-by-line concurrently in chunks
    const PARALLEL_SIZE = 6;
    const result = [];
    for (let i = 0; i < lines.length; i += PARALLEL_SIZE) {
        const batch = lines.slice(i, i + PARALLEL_SIZE);
        const translatedBatch = await Promise.all(batch.map(async (line) => {
            const originalText = typeof line === 'string' ? line : (line.text || '');
            let translation = '';
            if (originalText && originalText.trim() && originalText.trim() !== '• • •') {
                translation = await translateText(originalText, targetLang);
            }
            if (typeof line === 'string') {
                return { text: line, translation };
            }
            return { ...line, translation };
        }));
        result.push(...translatedBatch);
    }

    return result;
}

const handler = async (req, res) => {
    if (req.method === 'OPTIONS') { res.status(200).end(); return; }

    const query = req.query || {};
    const body = req.body || {};

    const targetLang = query.tl || body.targetLang || 'id';
    let text = query.text || query.q || body.text;
    let lines = body.lines;

    if (!text && !lines) {
        return res.status(400).json({ status: false, message: 'Parameter text, q, atau lines wajib diisi' });
    }

    try {
        if (lines && Array.isArray(lines)) {
            const translatedLines = await translateLines(lines, targetLang);
            return res.status(200).json({ status: true, result: { lines: translatedLines, creator: 'Nanzz' } });
        } else if (text) {
            const translatedText = await translateText(text, targetLang);
            return res.status(200).json({ status: true, result: { original: text, translated: translatedText, targetLang, creator: 'Nanzz' } });
        }
    } catch(e) {
        return res.status(500).json({ status: false, message: 'Gagal menerjemahkan: ' + e.message });
    }
};

handler.translateText = translateText;
handler.translateLines = translateLines;

module.exports = handler;

