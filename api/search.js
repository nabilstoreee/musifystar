const axios = require('axios');
const analytics = require('./analytics.js');

function parseYTDuration(subRuns, accLabel, fixedCols) {
    const fixedText = fixedCols?.[0]?.musicResponsiveListItemFixedColumnRenderer?.text?.runs?.[0]?.text;
    if (fixedText && /^(\d+[:\.])+\d+$/.test(fixedText.trim())) {
        return fixedText.trim().replace(/\./g, ':');
    }

    if (Array.isArray(subRuns)) {
        for (let i = subRuns.length - 1; i >= 0; i--) {
            const txt = (subRuns[i]?.text || '').trim();
            if (/^(\d{1,2}[\.:])+\d{2}$/.test(txt)) {
                return txt.replace(/\./g, ':');
            }
        }
    }

    if (accLabel) {
        let hours = 0, mins = 0, secs = 0;
        const hMatch = accLabel.match(/(\d+)\s*(?:jam|hours?|hrs?|h)/i);
        const mMatch = accLabel.match(/(\d+)\s*(?:menit|minutes?|mins?|m)/i);
        const sMatch = accLabel.match(/(\d+)\s*(?:detik|seconds?|secs?|s)/i);
        if (hMatch) hours = parseInt(hMatch[1], 10);
        if (mMatch) mins = parseInt(mMatch[1], 10);
        if (sMatch) secs = parseInt(sMatch[1], 10);

        if (hours > 0 || mins > 0 || secs > 0) {
            if (hours > 0) {
                return hours + ':' + String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
            } else {
                return mins + ':' + String(secs).padStart(2, '0');
            }
        }
    }

    return '';
}

function findAllKeys(arr, key, results) {
    if (arr === null || typeof arr !== 'object') return;
    if (arr[key] !== undefined) results.push(arr[key]);
    Object.values(arr).forEach(v => findAllKeys(v, key, results));
}

function toHDThumbnail(url, videoId) {
    if (!url && videoId) return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    if (!url) return '';
    let hd = String(url);
    if (hd.includes('googleusercontent.com') || hd.includes('ggpht.com') || hd.includes('ytimg.com')) {
        if (/=w\d+-h\d+/i.test(hd)) {
            hd = hd.replace(/=w\d+-h\d+[^?#]*/i, '=w800-h800-l90-rj');
        } else if (/=s\d+/i.test(hd)) {
            hd = hd.replace(/=s\d+[^?#]*/i, '=s800-c-k-c0x00ffffff-no-rj');
        } else if (/=w\d+/i.test(hd)) {
            hd = hd.replace(/=w\d+[^?#]*/i, '=w800-h800-l90-rj');
        }
    }
    if (hd.includes('i.ytimg.com/vi/') || hd.includes('img.youtube.com/vi/')) {
        hd = hd.split('?')[0];
        hd = hd.replace(/(hqdefault|mqdefault|sddefault|default)\.jpg/i, 'hqdefault.jpg');
    }
    return hd;
}

async function fetchYoutube(query, type) {
    const payload = {
        context: {
            client: { clientName: 'WEB_REMIX', clientVersion: '1.20240101.00.00', hl: 'id', gl: 'ID' }
        },
        query: query
    };

    if (type === 'songs') {
        payload.params = 'EgWKAQIIAWoSEAQQAxAFEAkQChAVEBAQERAO';
    } else if (type === 'videos') {
        payload.params = 'EgWKAQIQAWoSEAQQAxAFEAkQChAVEBAQERAO';
    } else if (type === 'albums') {
        payload.params = 'EgWKAQIYAWoSEAQQAxAFEAkQChAVEBAQERAO';
    } else if (type === 'artists') {
        payload.params = 'EgWKAQIgAWoKEAoQCRADEAA=';
    } else if (type === 'playlists') {
        payload.params = 'EgWKAQIoAWoSEAQQAxAFEAkQChAVEBAQERAO';
    }

    const { data } = await axios.post('https://music.youtube.com/youtubei/v1/search?prettyPrint=false', payload, {
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Origin': 'https://music.youtube.com'
        },
        timeout: 15000
    });

    return data;
}

module.exports = async (req, res) => {
    if (req.method === 'OPTIONS') {
        if (res.status) return res.status(200).send('OK');
        return;
    }

    const query = String(req.query.query || '').trim();
    const type = String(req.query.type || 'all').trim(); // all, songs, playlists

    if (!query) return res.status(400).json({ status: false, creator: 'Nanzz', message: 'Parameter query diperlukan' });

    // Only record search if explicitly flagged as real user search from search bar
    if (req.query?.userSearch === '1' || req.query?.isUserSearch === '1' || req.headers?.['x-user-search'] === '1') {
        try { analytics.recordSearch(query); } catch (e) {}
    }

    let urlVid = '';
    if (query.includes('youtube.com/') || query.includes('youtu.be/')) {
        urlVid = query.match(/[?&]v=([^&]+)/)?.[1] || query.match(/youtu\.be\/([^?]+)/)?.[1] || '';
    }

    if (urlVid && (type === 'all' || type === 'songs')) {
        try {
            const p = {
                context: { client: { clientName: 'WEB_REMIX', clientVersion: '1.20240101.00.00', hl: 'id', gl: 'ID' } },
                videoId: urlVid
            };
            const r = await axios.post('https://music.youtube.com/youtubei/v1/next?prettyPrint=false', p, { timeout: 15000 });
            const item = r.data?.contents?.singleColumnMusicWatchNextResultsRenderer?.tabbedRenderer?.watchNextTabbedResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.musicQueueRenderer?.content?.playlistPanelRenderer?.contents?.[0]?.playlistPanelVideoRenderer;
            
            if (item && item.videoId === urlVid) {
                const title = (item.title?.runs || []).map(r => r.text).join('');
                const artist = (item.longBylineText?.runs || []).map(r => r.text).join('');
                const durationText = (item.lengthText?.runs || []).map(r => r.text).join('');
                const thumbs = item.thumbnail?.thumbnails || [];
                const rawThumb = thumbs.length ? thumbs[thumbs.length - 1].url : '';
                const thumbnail = toHDThumbnail(rawThumb, urlVid);
                
                let duration = '';
                const durMatch = durationText.match(/(\d+):(\d+)/);
                if (durMatch) duration = durMatch[1] + ':' + durMatch[2];
                else if (durationText) duration = durationText.replace('.', ':');

                return res.json({
                    status: true,
                    creator: 'Nanzz',
                    result: {
                        query,
                        totalSongs: 1,
                        songs: [{ title, videoId: urlVid, thumbnail, url: `https://music.youtube.com/watch?v=${urlVid}`, artist: artist, artistId: '', album: '', albumId: '', duration }],
                        albums: [], playlists: [], artists: []
                    }
                });
            }
        } catch (e) {
            console.error('Error fetching single url:', e.message);
        }
    }

    try {
        let songs = [];
        let videos = [];
        let albums = [];
        let playlists = [];
        let artists = [];

        const tasks = [];
        if (type === 'all' || type === 'songs') tasks.push(fetchYoutube(query, 'songs').then(data => ({ type: 'songs', data })).catch(() => ({ type: 'songs', data: null })));
        if (type === 'all' || type === 'videos') tasks.push(fetchYoutube(query, 'videos').then(data => ({ type: 'videos', data })).catch(() => ({ type: 'videos', data: null })));
        if (type === 'all' || type === 'albums') tasks.push(fetchYoutube(query, 'albums').then(data => ({ type: 'albums', data })).catch(() => ({ type: 'albums', data: null })));
        if (type === 'all' || type === 'playlists') tasks.push(fetchYoutube(query, 'playlists').then(data => ({ type: 'playlists', data })).catch(() => ({ type: 'playlists', data: null })));
        if (type === 'all' || type === 'artists') tasks.push(fetchYoutube(query, 'artists').then(data => ({ type: 'artists', data })).catch(() => ({ type: 'artists', data: null })));

        const results = await Promise.all(tasks);

        for (const resObj of results) {
            const data = resObj.data;
            if (!data) continue;

            if (resObj.type === 'videos') {
                const tabs = data?.contents?.tabbedSearchResultsRenderer?.tabs || [];
                for (const tab of tabs) {
                    const sections = tab?.tabRenderer?.content?.sectionListRenderer?.contents || [];
                    for (const section of sections) {
                        const shelf = section?.musicShelfRenderer;
                        const items = shelf?.contents || section?.itemSectionRenderer?.contents || [];
                        for (const item of items) {
                            const r = item?.musicResponsiveListItemRenderer;
                            if (!r) continue;
                            const cols = r.flexColumns || [];
                            const titleRuns = cols[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
                            const title = titleRuns.map(x => x.text).join('');
                            const subRuns = cols[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
                            let artist = '', duration = '';
                            for (const run of subRuns) {
                                const text = run.text || '';
                                if (!artist) artist = text;
                            }
                            const accLabel = cols[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.accessibility?.accessibilityData?.label || '';
                            const fixedCols = r.fixedColumns || [];
                            duration = parseYTDuration(subRuns, accLabel, fixedCols);
                            const videoId = r?.playlistItemData?.videoId || '';
                            if (!videoId) continue;
                            const thumbs = r?.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
                            const rawThumb = thumbs.length ? thumbs[thumbs.length - 1].url : '';
                            const thumbnail = toHDThumbnail(rawThumb, videoId);
                            videos.push({
                                id: videoId,
                                videoId,
                                title,
                                artist: artist || 'YouTube Music',
                                duration: duration || '3:30',
                                thumbnail,
                                cover: thumbnail,
                                url: `https://youtube.com/watch?v=${videoId}`
                            });
                        }
                    }
                }
            } else if (resObj.type === 'albums') {
                const items = [];
                findAllKeys(data, 'musicResponsiveListItemRenderer', items);
                findAllKeys(data, 'musicTwoRowItemRenderer', items);
                findAllKeys(data, 'musicCardShelfRenderer', items);
                const seen = {};
                for (const item of items) {
                    const browseId = item?.navigationEndpoint?.browseEndpoint?.browseId || item?.title?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId || '';
                    if (!browseId || seen[browseId]) continue;
                    seen[browseId] = true;
                    let title = '', subtitle = '', thumbs = [];
                    if (item.flexColumns) {
                        title = (item.flexColumns[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || []).map(r => r.text).join('');
                        subtitle = (item.flexColumns[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || []).map(r => r.text).join('');
                        thumbs = item.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
                    } else if (item.title?.runs) {
                        title = item.title.runs.map(r => r.text).join('');
                        subtitle = (item.subtitle?.runs || []).map(r => r.text).join('');
                        thumbs = item.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails || item.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
                    } else continue;
                    const rawThumb = thumbs.length ? thumbs[thumbs.length - 1].url : '';
                    const thumb = toHDThumbnail(rawThumb);
                    let artist = subtitle;
                    const m = subtitle.match(/^(Album|Single|EP)\s*[•]\s*(.+?)(?:\s*[•]\s*(\d{4}))?$/i);
                    if (m) artist = m[2].trim();
                    albums.push({ id: browseId, title, artist: artist || 'Album', cover: thumb });
                }
            } else if (resObj.type === 'playlists') {
                const items = [];
                findAllKeys(data, 'musicResponsiveListItemRenderer', items);
                findAllKeys(data, 'musicTwoRowItemRenderer', items);
                findAllKeys(data, 'musicCardShelfRenderer', items);

                const seen = {};
                for (const item of items) {
                    const browseId = item?.navigationEndpoint?.browseEndpoint?.browseId || item?.title?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId || item?.title?.runs?.[0]?.navigationEndpoint?.watchEndpoint?.videoId || '';
                    if (!browseId || seen[browseId]) continue;
                    seen[browseId] = true;

                    let title = '', subtitle = '', thumbs = [];

                    if (item.flexColumns) {
                        title = (item.flexColumns[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || []).map(r => r.text).join('');
                        subtitle = (item.flexColumns[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || []).map(r => r.text).join('');
                        thumbs = item.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
                    } else if (item.title?.runs) {
                        title = item.title.runs.map(r => r.text).join('');
                        subtitle = (item.subtitle?.runs || []).map(r => r.text).join('');
                        thumbs = item.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails || item.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
                    } else continue;

                    const rawThumb = thumbs.length ? thumbs[thumbs.length - 1].url : '';
                    const thumb = toHDThumbnail(rawThumb);

                    const m = subtitle.match(/^(Album|Single|EP)\s*[•]\s*(.+?)\s*[•]\s*(\d{4})/i);
                    if (m) {
                        albums.push({ id: browseId, title, artist: m[2].trim(), albumType: m[1], year: m[3], cover: thumb });
                    } else {
                        playlists.push({ id: browseId, title, artist: subtitle || 'Playlist', cover: thumb });
                    }
                }
            } else if (resObj.type === 'artists') {
                const items = [];
                findAllKeys(data, 'musicResponsiveListItemRenderer', items);
                findAllKeys(data, 'musicTwoRowItemRenderer', items);
                findAllKeys(data, 'musicCardShelfRenderer', items);
                const seen = {};
                for (const item of items) {
                    const browseId = item?.navigationEndpoint?.browseEndpoint?.browseId || item?.title?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId || item?.title?.runs?.[0]?.navigationEndpoint?.watchEndpoint?.videoId || '';
                    if (!browseId || seen[browseId]) continue;
                    seen[browseId] = true;
                    let title = '', subtitle = '', thumbs = [];
                    if (item.flexColumns) {
                        title = (item.flexColumns[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || []).map(r => r.text).join('');
                        subtitle = (item.flexColumns[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || []).map(r => r.text).join('');
                        thumbs = item.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
                    } else if (item.title?.runs) {
                        title = item.title.runs.map(r => r.text).join('');
                        subtitle = (item.subtitle?.runs || []).map(r => r.text).join('');
                        thumbs = item.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails || item.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
                    } else continue;
                    const rawArtistThumb = thumbs.length ? thumbs[thumbs.length - 1].url : '';
                    const thumb = toHDThumbnail(rawArtistThumb);
                    if (subtitle.toLowerCase().includes('artist') || subtitle.toLowerCase().includes('monthly audience') || subtitle.toLowerCase().includes('pendengar') || subtitle.toLowerCase().includes('audiens') || subtitle.toLowerCase().includes('subscriber')) {
                        artists.push({ id: browseId, title: title, artist: subtitle, cover: thumb });
                    }
                }
                artists.sort((a, b) => {
                    const qLower = query.toLowerCase().trim();
                    const aIsMain = a.title.toLowerCase().trim() === qLower;
                    const bIsMain = b.title.toLowerCase().trim() === qLower;
                    const aAud = a.artist.includes('audiens') || a.artist.includes('jt');
                    const bAud = b.artist.includes('audiens') || b.artist.includes('jt');
                    if (aIsMain && aAud && (!bIsMain || !bAud)) return -1;
                    if (bIsMain && bAud && (!aIsMain || !aAud)) return 1;
                    if (aIsMain && !bIsMain) return -1;
                    if (bIsMain && !aIsMain) return 1;
                    if (aAud && !bAud) return -1;
                    if (bAud && !aAud) return 1;
                    return 0;
                });
            } else if (resObj.type === 'songs') {
                const tabs = data?.contents?.tabbedSearchResultsRenderer?.tabs || [];
                for (const tab of tabs) {
                    const sections = tab?.tabRenderer?.content?.sectionListRenderer?.contents || [];
                    for (const section of sections) {
                        const shelf = section?.musicShelfRenderer;
                        const items = shelf?.contents || section?.itemSectionRenderer?.contents || [];
                        for (const item of items) {
                            const r = item?.musicResponsiveListItemRenderer;
                            if (!r) continue;
                            const cols = r.flexColumns || [];
                            const titleRuns = cols[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
                            const title = titleRuns.map(x => x.text).join('');
                            
                            const subRuns = cols[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
                            let artist = '', artistId = '', album = '', albumId = '', duration = '';
                            for (const run of subRuns) {
                                const text = run.text || '';
                                const browseId = run?.navigationEndpoint?.browseEndpoint?.browseId || '';
                                if (browseId.startsWith('UC')) { artist = text; artistId = browseId; }
                                else if (browseId.startsWith('MPRE')) { album = text; albumId = browseId; }
                            }

                            const accLabel = cols[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.accessibility?.accessibilityData?.label || '';
                            const fixedCols = r.fixedColumns || [];
                            duration = parseYTDuration(subRuns, accLabel, fixedCols);

                            const t = subRuns[0]?.text || '';
                            if (t === 'Video') continue;

                            const videoId = r?.playlistItemData?.videoId || '';
                            const thumbs = r?.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
                            const rawSongThumb = thumbs.length ? thumbs[thumbs.length - 1].url : '';
                            const thumbnail = toHDThumbnail(rawSongThumb, videoId);
                            if (!videoId) continue;
                            
                            songs.push({ title, videoId, thumbnail, url: `https://music.youtube.com/watch?v=${videoId}`, artist: artist || (subRuns[1]?.text || ''), artistId, album: album || '', albumId, duration });
                        }
                    }
                }
            }
        }

        return res.json({
            status: true,
            creator: 'Nanzz',
            result: { query, totalSongs: songs.length, songs, videos, albums, playlists, artists }
        });

    } catch (err) {
        return res.status(500).json({ status: false, creator: 'Nanzz', message: err.message });
    }
};
