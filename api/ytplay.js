const dns = require('dns');
if (dns.setDefaultResultOrder) {
  try { dns.setDefaultResultOrder('ipv4first'); } catch (e) {}
}
const https = require('https');
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const storage = require('./storage.js');

// Reusable strict IPv4 HTTPS Agent to prevent Linux/Cloud Run IPv6 blackhole timeouts
const ipv4Agent = new https.Agent({
  family: 4,
  keepAlive: true,
  maxSockets: 80,
  timeout: 10000,
  noDelay: true
});

// Memory & persistent cache for audio stream URLs (valid 12 hours)
const ytCache = new Map();
const inFlightRequests = new Map();
const CACHE_TTL = 12 * 60 * 60 * 1000;

try {
  const parsed = storage.readData('stream_cache.json', {});
  if (parsed && typeof parsed === 'object') {
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
    storage.writeData('stream_cache.json', obj);
  } catch (e) {}
}

// Multi-source fast extractors - Active high-speed SaveTube CDNs ordered by latency
let SAVETUBE_CDNS = [
  "cdn401.savetube.vip",
  "cdn405.savetube.vip",
  "cdn406.savetube.vip",
  "cdn400.savetube.vip",
  "cdn403.savetube.vip"
];

// Dynamically promote winning CDN to top of the list for sub-600ms future requests
function promoteCdn(winnerCdn) {
  if (!winnerCdn) return;
  const idx = SAVETUBE_CDNS.indexOf(winnerCdn);
  if (idx > 0) {
    SAVETUBE_CDNS.splice(idx, 1);
    SAVETUBE_CDNS.unshift(winnerCdn);
  }
}

// Demote failing CDN to the back of the list
function demoteCdn(failingCdn) {
  if (!failingCdn) return;
  const idx = SAVETUBE_CDNS.indexOf(failingCdn);
  if (idx >= 0 && idx < SAVETUBE_CDNS.length - 1) {
    SAVETUBE_CDNS.splice(idx, 1);
    SAVETUBE_CDNS.push(failingCdn);
  }
}

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

      // If primary extraction fails on the specific ID, resolve metadata via oembed or search alternative track
      if (!result) {
        let trackTitle = title;
        let trackArtist = artist;

        if (!trackTitle) {
          try {
            const oembedRes = await axios.get(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${idMatch}&format=json`, {
              timeout: 3000,
              httpsAgent: ipv4Agent
            });
            if (oembedRes.data && oembedRes.data.title) {
              trackTitle = oembedRes.data.title;
              trackArtist = oembedRes.data.author_name || '';
            }
          } catch (eOe) {}
        }

        if (trackTitle || trackArtist) {
          try {
            const searchQuery = ((trackTitle || '') + ' ' + (trackArtist || '')).replace(/[-–|]/g, ' ').trim();
            if (searchQuery) {
              const altId = await resolveToVideoId(searchQuery + ' audio');
              if (altId && altId !== idMatch) {
                console.log(`[EXTRACT] Trying alternative track ID for "${searchQuery}": ${altId}`);
                result = await executeExtraction(altId);
                if (result && result.audio) {
                  // Cache for the original requested video ID as well!
                  ytCache.set(idMatch, { data: result, expireAt: Date.now() + CACHE_TTL });
                  persistCache();
                }
              }
            }
          } catch (eAlt) {}
        }
      }

      if (!result) {
        console.warn("[EXTRACT] All extraction methods failed for ID:", idMatch);
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

  // Single CDN extractor with IPv4 enforcement, key sharing, and multi-quality fallback
  async function trySavetube(cdn, customTimeout = 7000) {
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
    if (!encryptedData) {
      demoteCdn(cdn);
      throw new Error(`No data from ${cdn}`);
    }

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
    
    // Primary 128kbps, fallback 320kbps & 64kbps
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

    // If download failed on this CDN but we have decrypted.key, try download on alternate CDNs immediately!
    if (!audioUrl || !audioUrl.startsWith("http")) {
      const otherCdns = SAVETUBE_CDNS.filter(c => c !== cdn);
      for (const altCdn of otherCdns.slice(0, 2)) {
        try {
          const downloadRes = await axios.post(`https://${altCdn}/download`, {
            id: idMatch,
            downloadType: "audio",
            quality: "128",
            key: decrypted.key
          }, {
            headers: {
              "content-type": "application/json",
              "origin": "https://yt.savetube.me",
              "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            },
            httpsAgent: ipv4Agent,
            timeout: 5000
          });
          audioUrl = downloadRes.data?.data?.downloadUrl || downloadRes.data?.downloadUrl;
          if (audioUrl && audioUrl.startsWith("http")) {
            promoteCdn(altCdn);
            break;
          }
        } catch (eAltDl) {}
      }
    }

    if (!audioUrl || !audioUrl.startsWith("http")) {
      demoteCdn(cdn);
      throw new Error(`No audio URL from ${cdn}`);
    }

    promoteCdn(cdn);

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

  // Concurrent racing across top CDNs with fast early returns
  // Top 3 start immediately, remaining start after 1000ms if not already resolved
  const primaryCDNs = SAVETUBE_CDNS.slice(0, 3);
  const secondaryCDNs = SAVETUBE_CDNS.slice(3);

  const primaryPromises = primaryCDNs.map(cdn => trySavetube(cdn, 7000));

  let delayedSecondary = null;
  if (secondaryCDNs.length > 0) {
    delayedSecondary = new Promise((resolve, reject) => {
      const timer = setTimeout(async () => {
        try {
          const secRes = await Promise.any(secondaryCDNs.map(cdn => trySavetube(cdn, 8000)));
          resolve(secRes);
        } catch (errSec) {
          reject(errSec);
        }
      }, 1000);
      // Clean up timer if already resolved
      primaryPromises.forEach(p => p.then(() => clearTimeout(timer)).catch(() => {}));
    });
  }

  const allAttempts = delayedSecondary ? [...primaryPromises, delayedSecondary] : primaryPromises;

  try {
    const winner = await Promise.any(allAttempts);
    ytCache.set(idMatch, { data: winner, expireAt: Date.now() + CACHE_TTL });
    persistCache();
    return winner;
  } catch (err) {
    // Retry once with remaining/shuffled CDNs after short pause
    try {
      await new Promise(r => setTimeout(r, 400));
      const retryAttempts = SAVETUBE_CDNS.slice(0, 3).map(cdn => trySavetube(cdn, 7000));
      const retryWinner = await Promise.any(retryAttempts);
      ytCache.set(idMatch, { data: retryWinner, expireAt: Date.now() + CACHE_TTL });
      persistCache();
      return retryWinner;
    } catch (eRetry) {}

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
