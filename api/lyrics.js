const { getLyrics1 } = require('./lyrics1.js');
const { getLyrics2 } = require('./lyrics2.js');

module.exports = async (req, res) => {
    if (req.method === 'OPTIONS') { res.status(200).end(); return; }
    if (req.method !== 'GET') { res.status(405).json({ status: false, message: 'Method not allowed' }); return; }
    const videoId = (req.query.id || req.body?.id || '').trim();
    const title = (req.query.title || req.body?.title || '').trim();
    const artist = (req.query.artist || req.body?.artist || '').trim();
    if (!videoId) { res.status(400).json({ status: false, message: 'Parameter id wajib diisi' }); return; }

    try {
        // Try LRCLIB (lyrics1) first.
        const data1 = await getLyrics1(videoId, title, artist).catch(() => null);
        if (data1 && data1.lyrics && data1.lyrics.lines && data1.lyrics.lines.length > 0) {
            res.status(200).json({
                status: true,
                input: { id: videoId },
                result: {
                    videoId,
                    title: data1.title || '',
                    artist: data1.artist || '',
                    album: data1.album || '',
                    source: 'lyrics1',
                    lyrics: data1.lyrics
                }
            });
            return;
        }

        // Only run Transcribe (lyrics2) if lyrics1 has nothing, and always fully await it.
        // IMPORTANT: on Netlify Functions the container freezes right after the response
        // is sent, so if this were fired-and-forgotten (as it was before) while lyrics1
        // succeeded, the getTranscribe() call inside lyrics2 -- and therefore its
        // fs.unlinkSync() temp-file cleanup in api/transcribe.js -- would get cut off
        // mid-flight and effectively never run. Awaiting it here guarantees cleanup
        // always completes before this function returns.
        const data2 = await getLyrics2(videoId, data1?.title || title, data1?.artist || artist).catch(() => null);
        if (data2 && data2.lyrics && data2.lyrics.lines && data2.lyrics.lines.length > 0) {
            res.status(200).json({
                status: true,
                input: { id: videoId },
                result: {
                    videoId,
                    title: data2.title || data1?.title || '',
                    artist: data2.artist || data1?.artist || '',
                    album: data1?.album || '',
                    source: 'lyrics2',
                    lyrics: data2.lyrics
                }
            });
            return;
        }

        // Fallback when no lyrics found in both
        res.status(200).json({
            status: true,
            input: { id: videoId },
            result: {
                videoId,
                title: data1?.title || '',
                artist: data1?.artist || '',
                album: data1?.album || '',
                source: 'none',
                lyrics: { type: 'none', lines: [] }
            }
        });
    } catch(e) {
        res.status(500).json({ status: false, message: 'Gagal: ' + e.message });
    }
};

