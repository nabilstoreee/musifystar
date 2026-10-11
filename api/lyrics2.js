const { getTranscribe } = require('./transcribe.js');
const { translateLines } = require('./translate.js');

async function getLyrics2(videoId, initialTitle = '', initialArtist = '') {
    let lyricsData = { type: 'none', lines: [] };
    let title = initialTitle || '', artist = initialArtist || '';

    try {
        const transcribed = await getTranscribe(videoId).catch(() => null);
        if (transcribed) {
            title = transcribed.title || title;
            if (transcribed.synced && transcribed.synced.length > 0) {
                lyricsData = {
                    type: 'synced',
                    lines: transcribed.synced.map(s => ({
                        time: typeof s.time === 'number' ? s.time : (parseFloat(String(s.start).replace('s', '')) || 0),
                        text: s.text || '• • •'
                    }))
                };
            } else if (transcribed.text) {
                lyricsData = {
                    type: 'plain',
                    lines: transcribed.text.split('. ').map(t => ({ time: -1, text: t.trim() })).filter(t => t.text)
                };
            }
        }
    } catch (err) {
        // Silently fallback if transcription is unavailable
    }

    if (lyricsData.lines && lyricsData.lines.length > 0) {
        try {
            lyricsData.lines = await translateLines(lyricsData.lines);
        } catch (e) {}
    }

    return { videoId, title, artist, lyrics: lyricsData };
}

const handler = async (req, res) => {
    if (req.method === 'OPTIONS') { res.status(200).end(); return; }
    const videoId = (req.query.id || req.body?.id || '').trim();
    const title = (req.query.title || req.body?.title || '').trim();
    const artist = (req.query.artist || req.body?.artist || '').trim();
    if (!videoId) { res.status(400).json({ status: false, message: 'Parameter id wajib diisi' }); return; }

    try {
        const result = await getLyrics2(videoId, title, artist);
        res.status(200).json({ status: true, source: 'transcribe', result });
    } catch(e) {
        res.status(500).json({ status: false, message: e.message });
    }
};

handler.getLyrics2 = getLyrics2;
module.exports = handler;
