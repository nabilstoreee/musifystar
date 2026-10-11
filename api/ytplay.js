const dns = require('dns');
if (dns.setDefaultResultOrder) {
  try { dns.setDefaultResultOrder('ipv4first'); } catch (e) {}
}
const https = require('https');
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Reusable IPv4 HTTPS Agent to prevent Linux/Cloud Run IPv6 blackhole timeouts
const ipv4Agent = new https.Agent({
  family: 4,
  keepAlive: true,
  maxSockets: 60,
  timeout: 10000
});

// Memory & persistent disk cache for audio stream URLs (valid 12 hours)
const ytCache = new Map();
const inFlightRequests = new Map();
const CACHE_TTL = 12 * 60 * 60 * 1000;

// Disk cache file
const DISK_CACHE_FILE = path.join(__dirname, '..', 'stream_cache.json');
try {
  if (fs.existsSync(DISK_CACHE_FILE)) {
    const raw = fs.readFileSync(DISK_CACHE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    const now = Date.now();
    for (const [k, v] of Object.entries(parsed)) {
      if (v && v.expireAt > now) {
        ytCache.set(k, v);
      }
    }
  }
} catch (e) {}

function persistCache() {
  try {
    const obj = {};
    const now = Date.now();
    for (const [k, v] of ytCache.entries()) {
      if (v && v.expireAt > now) {
        obj[k] = v;
      }
    }
    fs.writeFile(DISK_CACHE_FILE, JSON.stringify(obj), () => {});
  } catch (e) {}
}

// Multi-source fast extractors (SaveTube verified active high-speed MP3 CDNs)
const SAVETUBE_CDNS = [
  "cdn403.savetube.vip",
  "cdn401.savetube.vip",
  "cdn405.savetube.vip",
  "cdn400.savetube.vip",
  "cdn406.savetube.vip"
];

async function resolveToVideoId(query) {
  if (!query) return null;
  const clean = String(query).trim();

  // 1. Direct Regex match for YouTube & YouTube Music URLs or direct 11-char video ID
  const directIdPatterns = [
    /(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/|v\/)|youtu\.be\/|music\.youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/
  ];

  for (const pattern of directIdPatterns) {
    const match = clean.match(pattern);
    if (match && match[1]) return match[1];
  }

  // 2. YouTube Music / Remix Search API
  try {
    const payload = {
      context: { client: { clientName: 'WEB_REMIX', clientVersion: '1.20240101.00.00', hl: 'id', gl: 'ID' } },
      query: clean
    };
    const { data } = await axios.post('https://music.youtube.com/youtubei/v1/search?prettyPrint=false', payload, {
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      httpsAgent: ipv4Agent,
      timeout: 5000
    });
    const jsonStr = JSON.stringify(data);
    const m = jsonStr.match(/\"videoId\":\"([a-zA-Z0-9_-]{11})\"/);
    if (m && m[1]) return m[1];
  } catch(e) {}

  // 3. YouTube HTML Scrape Fallback
  try {
    const res = await axios.get(`https://www.youtube.com/results?search_query=${encodeURIComponent(clean)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      httpsAgent: ipv4Agent,
      timeout: 5000
    });
    const m = res.data.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
    if (m && m[1]) return m[1];
  } catch(e) {}

  return null;
}

async function getDownload(url, title, artist) {
  let idMatch = await resolveToVideoId(url);

  if (!idMatch && (title || url)) {
    idMatch = await resolveToVideoId((title ? title + ' ' + (artist || '') : url));
  }

  if (!idMatch) {
    console.error("[EXTRACT] Invalid URL or could not resolve query to video ID:", url);
    return null;
  }

  // Check cache first (instant 0ms response)
  const cached = ytCache.get(idMatch);
  if (cached && cached.expireAt > Date.now()) {
    return cached.data;
  }

  // Deduplicate in-flight requests for the same video ID
  if (inFlightRequests.has(idMatch)) {
    return await inFlightRequests.get(idMatch);
  }

  const extractionPromise = (async () => {
    try {
      let result = await executeExtraction(idMatch);
      // If primary extraction fails on the specific ID, try searching an alternative video ID
      if (!result && (title || artist)) {
        try {
          const searchQuery = ((title || '') + ' ' + (artist || '')).trim();
          if (searchQuery) {
            const altId = await resolveToVideoId(searchQuery + ' audio');
            if (altId && altId !== idMatch) {
              console.log(`[EXTRACT] Trying alternative track ID for "${searchQuery}": ${altId}`);
              result = await executeExtraction(altId);
            }
          }
        } catch (eAlt) {}
      }
      return result;
    } finally {
      inFlightRequests.delete(idMatch);
    }
  })();

  inFlightRequests.set(idMatch, extractionPromise);
  return await extractionPromise;
}

async function executeExtraction(idMatch) {
  const fullUrl = "https://www.youtube.com/watch?v=" + idMatch;

  // 1. Savetube CDN Extractor with forced IPv4 & connection reuse
  // Timeout 9000ms ensures large 1-2 hour compilations complete without timing out,
  // while short songs return in ~600ms via Promise.any!
  async function trySavetube(cdn, customTimeout = 9000) {
    const api = axios.create({
      headers: {
        "content-type": "application/json",
        "origin": "https://yt.savetube.me",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
      },
      httpsAgent: ipv4Agent,
      timeout: customTimeout
    });

    const infoResponse = await api.post(`https://${cdn}/v2/info`, { url: fullUrl });
    const encryptedData = infoResponse?.data?.data;
    if (!encryptedData) throw new Error(`No data from ${cdn}`);

    const encrypted = Buffer.from(encryptedData, "base64");
    const decipher = crypto.createDecipheriv("aes-128-cbc",
      Buffer.from("C5D58EF67A7584E4A29F6C35BBC4EB12", "hex"),
      encrypted.slice(0, 16)
    );

    const decryptedBuffer = Buffer.concat([
      decipher.update(encrypted.slice(16)),
      decipher.final()
    ]);

    const decrypted = JSON.parse(decryptedBuffer.toString());
    
    // Primary 128kbps (instant download & lowest latency streaming)
    let audioUrl = null;
    for (const q of ["128", "320", "64"]) {
      try {
        const downloadRes = await api.post(`https://${cdn}/download`, {
          id: idMatch,
          downloadType: "audio",
          quality: q,
          key: decrypted.key
        }, {
          timeout: customTimeout
        });
        audioUrl = downloadRes.data?.data?.downloadUrl || downloadRes.data?.downloadUrl;
        if (audioUrl && audioUrl.startsWith("http")) break;
      } catch (errQ) {}
    }

    if (!audioUrl || !audioUrl.startsWith("http")) throw new Error(`No audio URL from ${cdn}`);

    const dur = decrypted.duration || 0;
    let durStr = '';
    if (dur >= 3600) {
      const h = Math.floor(dur / 3600);
      const m = Math.floor((dur % 3600) / 60);
      const s = dur % 60;
      durStr = `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    } else {
      durStr = `${Math.floor(dur / 60)}:${(dur % 60).toString().padStart(2, "0")}`;
    }
    return {
      duration: durStr,
      audio: audioUrl,
      source: `savetube:${cdn}`
    };
  }

  // Race primary CDNs concurrently with 9000ms timeout
  const primaryCDNs = SAVETUBE_CDNS.slice(0, 3);
  const attempts = primaryCDNs.map(cdn => trySavetube(cdn, 9000));

  try {
    const winner = await Promise.any(attempts);
    ytCache.set(idMatch, { data: winner, expireAt: Date.now() + CACHE_TTL });
    persistCache();
    return winner;
  } catch (err) {
    // Fallback race with remaining CDNs
    const fallbackCDNs = SAVETUBE_CDNS.slice(3);
    if (fallbackCDNs.length > 0) {
      try {
        const fallbackWinner = await Promise.any(fallbackCDNs.map(cdn => trySavetube(cdn, 12000)));
        ytCache.set(idMatch, { data: fallbackWinner, expireAt: Date.now() + CACHE_TTL });
        persistCache();
        return fallbackWinner;
      } catch (e2) {}
    }
    console.warn("[EXTRACT] All CDNs failed for ID:", idMatch);
    return null;
  }
}

module.exports = async (req, res) => {
    if (req.method === 'OPTIONS') { res.status(200).end(); return; }
    if (req.method !== 'POST') { res.status(405).json({ status: false, message: 'Method not allowed' }); return; }

    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    body = body || {};

    const url = (body.query || body.url || '').trim();
    const title = (body.title || '').trim();
    const artist = (body.artist || '').trim();

    if (!url && !title) { res.status(400).json({ status: false, message: 'Parameter query wajib diisi' }); return; }

    try {
        let audioData = await getDownload(url, title, artist);

        if (audioData && audioData.audio) {
            return res.status(200).json({
                status: true,
                result: {
                    duration: audioData.duration || null,
                    download: { audio: audioData.audio }
                }
            });
        }

        res.status(503).json({ status: false, error: "Layanan audio sedang padat, silakan coba lagu lain atau ulangi kembali." });
    } catch (err) {
        res.status(500).json({ status: false, error: "Gagal memproses audio stream" });
    }
};
