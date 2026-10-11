const https = require('https');
const API_KEY = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';

function getRunsText(r) { return Array.isArray(r) ? r.map(x=>x.text||'').join('') : ''; }
function removeKeysRecursive(o, k) { if(!o||typeof o!=='object')return; if(Array.isArray(o)){o.forEach(i=>removeKeysRecursive(i,k));return;} for(const key of Object.keys(o)){if(k.includes(key))delete o[key];else if(typeof o[key]==='object')removeKeysRecursive(o[key],k);} }

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
function transformThumbs(thumbs, videoId) {
    if (!Array.isArray(thumbs) || thumbs.length === 0) {
        return videoId ? [{ url: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` }] : [];
    }
    return thumbs.map(t => ({ ...t, url: toHDThumbnail(t.url, videoId) }));
}

function makeRequest(o, p) {
    return new Promise((resolve, reject) => {
        const r = https.request(o, res => { let d=''; res.on('data', c=>d+=c); res.on('end', ()=>{ try{resolve(JSON.parse(d));}catch(e){resolve(d);} }); });
        r.on('error', reject); r.on('timeout', ()=>{ r.destroy(); reject(new Error('Timeout')); });
        if(p) r.write(JSON.stringify(p)); r.end();
    });
}

module.exports = async (req, res) => {
    const sendJson = (code, payload) => {
        if (typeof res.status === 'function') {
            res.status(code).json(payload);
        } else if (typeof res.json === 'function') {
            res.statusCode = code;
            res.json(payload);
        } else {
            res.writeHead(code, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(payload));
        }
    };

    if (req.method === 'OPTIONS') { if (typeof res.status === 'function') res.status(200).end(); else res.end(); return; }
    if (req.method !== 'GET') { sendJson(405, { status: false, message: 'Method not allowed' }); return; }
    const artistId = (req.query?.id || '').trim();
    if (!artistId) { sendJson(400, { status: false, message: 'Parameter id wajib diisi' }); return; }

    try {
        const data = await makeRequest({
            hostname: 'music.youtube.com', path: '/youtubei/v1/browse?key='+API_KEY, method: 'POST',
            headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 Chrome/120.0.0.0', 'Origin': 'https://music.youtube.com' },
            rejectUnauthorized: false, timeout: 15000
        }, { context: { client: { clientName: 'WEB_REMIX', clientVersion: '1.20240101.00.00', hl: 'en', gl: 'ID' } }, browseId: artistId });

        let name='', thumbnails=[];
        const topSongs=[], topAlbums=[], topSingles=[], topVideos=[], featuredOn=[], playlists=[], similarArtists=[];
        try {
            const h = data?.header?.musicImmersiveHeaderRenderer || data?.header?.musicVisualHeaderRenderer || {};
            name = getRunsText(h.title?.runs||[]);
            thumbnails = transformThumbs(h.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || []);
            const tabs = data?.contents?.singleColumnBrowseResultsRenderer?.tabs || [];
            for (const tab of tabs) {
                const contents = tab?.tabRenderer?.content?.sectionListRenderer?.contents || [];
                for (const sec of contents) {
                    if (sec.musicShelfRenderer) {
                        for (const item of sec.musicShelfRenderer.contents || []) {
                            if (item.musicResponsiveListItemRenderer) {
                                const i = item.musicResponsiveListItemRenderer;
                                const videoId = i.playlistItemData?.videoId||'';
                                const rawThumbs = i.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails||[];
                                const thumbnails = transformThumbs(rawThumbs, videoId);
                                topSongs.push({ videoId, title: getRunsText(i.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs||[]), artist: getRunsText(i.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs||[]), thumbnails });
                            }
                        }
                    }
                    if (sec.musicCarouselShelfRenderer) {
                        const car = sec.musicCarouselShelfRenderer;
                        const ht = getRunsText(car.header?.musicCarouselShelfBasicHeaderRenderer?.title?.runs||[]);
                        for (const item of car.contents || []) {
                            if (item.musicTwoRowItemRenderer) {
                                const it = item.musicTwoRowItemRenderer;
                                const rawItemThumbs = it.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails||[];
                                const vId = it.navigationEndpoint?.watchEndpoint?.videoId||'';
                                const parsed = { name: getRunsText(it.title?.runs||[]), artist: getRunsText(it.subtitle?.runs||[]), browseId: it.navigationEndpoint?.browseEndpoint?.browseId || it.title?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId || '', thumbnails: transformThumbs(rawItemThumbs, vId) };
                                if (/album/i.test(ht)) topAlbums.push(parsed);
                                else if (/singles|ep/i.test(ht)) topSingles.push(parsed);
                                else if (/video/i.test(ht)) { parsed.videoId = it.navigationEndpoint?.watchEndpoint?.videoId||''; topVideos.push(parsed); }
                                else if (/playlist/i.test(ht)) playlists.push(parsed);
                                else if (/featured/i.test(ht)) featuredOn.push(parsed);
                                else if (/similar|fans/i.test(ht)) similarArtists.push(parsed);
                            }
                        }
                    }
                }
            }
        } catch(e) {}

        // If browse returned 0 songs, fall back to searching songs by artist name
        if (topSongs.length === 0) {
            const queryName = (req.query.name || name || artistId).trim();
            if (queryName && queryName !== artistId) {
                try {
                    const searchData = await makeRequest({
                        hostname: 'music.youtube.com', path: '/youtubei/v1/search?key='+API_KEY, method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 Chrome/120.0.0.0', 'Origin': 'https://music.youtube.com' },
                        rejectUnauthorized: false, timeout: 10000
                    }, {
                        context: { client: { clientName: 'WEB_REMIX', clientVersion: '1.20240101.00.00', hl: 'id', gl: 'ID' } },
                        query: queryName,
                        params: 'EgWKAQIIAWoSEAQQAxAFEAkQChAVEBAQERAO'
                    });

                    const tabs = searchData?.contents?.tabbedSearchResultsRenderer?.tabs || [];
                    for (const tab of tabs) {
                        const contents = tab?.tabRenderer?.content?.sectionListRenderer?.contents || [];
                        for (const sec of contents) {
                            const items = sec?.musicShelfRenderer?.contents || sec?.itemSectionRenderer?.contents || [];
                            for (const item of items) {
                                const r = item?.musicResponsiveListItemRenderer;
                                if (!r) continue;
                                const videoId = r.playlistItemData?.videoId || r.navigationEndpoint?.watchEndpoint?.videoId || '';
                                if (!videoId) continue;
                                const songTitle = getRunsText(r.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || []);
                                const songArtist = getRunsText(r.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || []);
                                const rawThumbs = r.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
                                const songThumbs = transformThumbs(rawThumbs, videoId);
                                topSongs.push({ videoId, title: songTitle, artist: songArtist || queryName, thumbnails: songThumbs });
                            }
                        }
                    }
                    if (!name) name = queryName;
                    if (thumbnails.length === 0 && topSongs.length > 0 && topSongs[0].thumbnails) {
                        thumbnails = topSongs[0].thumbnails;
                    }
                } catch(searchErr) {}
            }
        }

        const result = { status: true, input: { id: artistId }, result: { artistId, name: name || req.query.name || 'Artist', thumbnails, topSongs, topAlbums, topSingles, topVideos, playlists, featuredOn, similarArtists, creator: 'Nanzz' } };
        removeKeysRecursive(result, ['creator']);
        sendJson(200, result);
    } catch(e) { sendJson(500, { status: false, message: 'Gagal: '+e.message }); }
};