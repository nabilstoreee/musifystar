const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ASSEMBLYAI_KEY = 'b6d6101e7ded44a6921bc5a8146765a1';
const ytCache = new Map();
const CACHE_TTL = 90 * 60 * 1000;

function timeToSeconds(tStr) {
    if (typeof tStr === 'number') return tStr;
    if (!tStr) return 0;
    const cleanStr = String(tStr).replace('s', '').trim();
    const parts = cleanStr.split(':');
    if (parts.length === 3) {
        return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
    } else if (parts.length === 2) {
        return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
    }
    return parseFloat(cleanStr) || 0;
}

async function getAudioStream(url) {
    const idMatch = url.match(/(?:v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/)?.[1] || (url.length === 11 ? url : null);
    if (!idMatch) return null;

    const cached = ytCache.get(idMatch);
    if (cached && cached.expireAt > Date.now()) return cached.data;

    const fullUrl = `https://www.youtube.com/watch?v=${idMatch}`;
    const cdns = ["cdn405.savetube.vip", "cdn403.savetube.vip", "cdn401.savetube.vip"];

    for (const cdn of cdns) {
        try {
            const api = axios.create({
                headers: {
                    "content-type": "application/json",
                    "origin": "https://yt.savetube.me",
                    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                },
                timeout: 25000
            });

            const infoRes = await api.post(`https://${cdn}/v2/info`, { url: fullUrl });
            const encryptedData = infoRes?.data?.data;
            if (!encryptedData) continue;

            const encrypted = Buffer.from(encryptedData, "base64");
            const decipher = crypto.createDecipheriv("aes-128-cbc", Buffer.from("C5D58EF67A7584E4A29F6C35BBC4EB12", "hex"), encrypted.slice(0, 16));
            const decrypted = JSON.parse(Buffer.concat([decipher.update(encrypted.slice(16)), decipher.final()]).toString());

            const downloadRes = await api.post(`https://${cdn}/download`, {
                id: idMatch,
                downloadType: "audio",
                quality: "128",
                key: decrypted.key
            });

            const audioUrl = downloadRes.data?.data?.downloadUrl || downloadRes.data?.downloadUrl;
            if (audioUrl) {
                const result = { audio: audioUrl, duration: decrypted.duration, title: decrypted.title };
                ytCache.set(idMatch, { data: result, expireAt: Date.now() + CACHE_TTL });
                return result;
            }
        } catch (e) {}
    }
    return null;
}

function parseSubtitles(subData) {
    const synced = [];
    if (!subData) return synced;

    // XML format: <text start="12.34" dur="2.5">Text</text>
    if (subData.includes('<text')) {
        const regex = /<text\s+start="([^"]+)"(?:\s+dur="([^"]+)")?[^>]*>([\s\S]*?)<\/text>/gi;
        let match;
        while ((match = regex.exec(subData)) !== null) {
            const startSec = parseFloat(match[1]) || 0;
            let text = match[3]
                .replace(/&amp;/g, '&')
                .replace(/&#39;/g, "'")
                .replace(/&quot;/g, '"')
                .replace(/<[^>]+>/g, '')
                .replace(/\n/g, ' ')
                .trim();
            if (text) {
                synced.push({
                    time: Math.round(startSec * 100) / 100,
                    start: `${startSec.toFixed(2)}s`,
                    text: text
                });
            }
        }
        if (synced.length > 0) return synced;
    }

    // VTT / SRT format
    const lines = subData
        .replace(/&amp;/g, '&')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const timeMatch = line.match(/(\d+:\d+(?::\d+)?[\.,]\d+)\s*-->\s*(\d+:\d+(?::\d+)?[\.,]\d+)/);
        if (timeMatch) {
            const startStr = timeMatch[1].replace(',', '.');
            const endStr = timeMatch[2].replace(',', '.');
            const startSec = timeToSeconds(startStr);
            const text = (lines[i + 1] || '').replace(/<[^>]+>/g, '').trim();
            if (text && !text.match(/^\d+$/) && !text.includes('-->')) {
                synced.push({
                    time: Math.round(startSec * 100) / 100,
                    start: `${startSec.toFixed(2)}s`,
                    end: `${timeToSeconds(endStr).toFixed(2)}s`,
                    text: text
                });
            }
        }
    }
    return synced;
}

function formatAssemblyAIWords(words) {
    if (!words || !words.length) return [];
    const lines = [];
    let currentWords = [];
    let lineStart = words[0].start;

    for (let i = 0; i < words.length; i++) {
        const w = words[i];
        if (currentWords.length === 0) lineStart = w.start;
        currentWords.push(w.text);

        const isLast = i === words.length - 1;
        const nextW = isLast ? null : words[i + 1];
        const pause = nextW ? (nextW.start - w.end) : 0;

        if (isLast || currentWords.length >= 7 || pause > 800 || /[.?!,]$/.test(w.text)) {
            const startSec = lineStart / 1000;
            const endSec = w.end / 1000;
            lines.push({
                time: Math.round(startSec * 100) / 100,
                start: `${startSec.toFixed(2)}s`,
                end: `${endSec.toFixed(2)}s`,
                text: currentWords.join(' '),
                confidence: w.confidence
            });
            currentWords = [];
        }
    }
    return lines;
}

async function getTranscribe(urlOrVideoId) {
    const videoId = urlOrVideoId.match(/(?:v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/)?.[1] || (urlOrVideoId.length === 11 ? urlOrVideoId : null);
    if (!videoId) throw new Error('URL YouTube tidak valid');

    let title = '';
    try {
        const infoRes = await axios.get(`https://www.youtube.com/oembed?url=https://youtube.com/watch?v=${videoId}&format=json`, { timeout: 8000 });
        title = infoRes.data.title || '';
    } catch (e) {}

    // 1. Coba YouTube subtitle captions
    try {
        const { data } = await axios.get(`https://www.youtube.com/watch?v=${videoId}`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept-Language': 'id-ID,en-US;q=0.9,en;q=0.8' },
            timeout: 10000
        });
        const capMatch = data.match(/"captionTracks"\s*:\s*(\[[^\]]*\])/);
        if (capMatch) {
            const captions = JSON.parse(capMatch[1]);
            const cap = captions.find(c => c.languageCode === 'en' || c.languageCode === 'id') || captions[0];
            if (cap?.baseUrl) {
                const subRes = await axios.get(cap.baseUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 });
                const synced = parseSubtitles(subRes.data);
                if (synced && synced.length > 0) {
                    return {
                        title, videoId, method: 'subtitle',
                        language: cap.languageCode || 'en',
                        text: synced.map(s => s.text).join(' '),
                        synced
                    };
                }
            }
        }
    } catch (e) {}

    // 2. SaveTube + AssemblyAI (with safe error handling and file cleanup)
    let mp3Path = null;
    try {
        const fullUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const audioData = await getAudioStream(fullUrl);
        if (!audioData?.audio) return null;

        const audioRes = await axios.get(audioData.audio, { responseType: 'arraybuffer', timeout: 30000 });
        if (!audioRes.data || audioRes.data.length < 1000) return null;

        mp3Path = path.join(os.tmpdir(), `${videoId}_${Date.now()}.mp3`);
        fs.writeFileSync(mp3Path, Buffer.from(audioRes.data));

        const uploadRes = await axios.post('https://api.assemblyai.com/v2/upload',
            fs.createReadStream(mp3Path),
            { headers: { 'Authorization': ASSEMBLYAI_KEY }, maxBodyLength: Infinity, timeout: 60000 }
        );

        if (!uploadRes.data?.upload_url) return null;

        const transRes = await axios.post('https://api.assemblyai.com/v2/transcript', {
            audio_url: uploadRes.data.upload_url,
            speaker_labels: true
        }, { headers: { 'Authorization': ASSEMBLYAI_KEY, 'Content-Type': 'application/json' }, timeout: 15000 });

        if (!transRes.data?.id) return null;

        let result;
        for (let i = 0; i < 20; i++) {
            await new Promise(r => setTimeout(r, 2000));
            const poll = await axios.get(`https://api.assemblyai.com/v2/transcript/${transRes.data.id}`, {
                headers: { 'Authorization': ASSEMBLYAI_KEY },
                timeout: 10000
            });
            if (poll.data.status === 'completed') { result = poll.data; break; }
            if (poll.data.status === 'error') return null;
        }

        if (!result) return null;

        const synced = formatAssemblyAIWords(result.words || []);

        return {
            title: title || audioData.title || '',
            videoId,
            method: 'savetube+assemblyai',
            language: result.language_code,
            duration: result.audio_duration,
            text: result.text,
            synced
        };
    } catch (err) {
        return null;
    } finally {
        if (mp3Path && fs.existsSync(mp3Path)) {
            try { fs.unlinkSync(mp3Path); } catch (e) {}
        }
    }
}

const handler = async (req, res) => {
    if (req.method === 'OPTIONS') { return res.status(200).end(); }

    let url = String(req.query?.url || req.query?.id || req.body?.url || req.body?.id || '').trim();
    if (!url) return res.status(400).json({ creator: 'Nanzz', status: false, message: 'Parameter url atau id diperlukan' });

    try {
        const result = await getTranscribe(url);
        return res.json({
            creator: 'Nanzz',
            status: true,
            result
        });
    } catch (err) {
        return res.status(500).json({ creator: 'Nanzz', status: false, message: err.message });
    }
};

handler.run = handler;
handler.getTranscribe = getTranscribe;
handler.category = 'Tools';
handler.params = ['url'];
handler.desc = 'YouTube Transcriber with synced lyrics';

module.exports = handler;
