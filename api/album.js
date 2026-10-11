const https = require('https');
const fs = require('fs');
const path = require('path');
const API_KEY = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';

let communityPlaylists = null;
try {
    communityPlaylists = require('../community_playlists.json');
} catch(e) {
    try {
        const cpPath = path.join(__dirname, '..', 'community_playlists.json');
        if (fs.existsSync(cpPath)) {
            communityPlaylists = JSON.parse(fs.readFileSync(cpPath, 'utf8'));
        }
    } catch(err) {}
}

function getRunsText(r) { return Array.isArray(r) ? r.map(x=>x.text||'').join('') : ''; }

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

function findAllKeys(obj, keyToFind, results) {
    if (!obj || typeof obj !== 'object') return;
    if (obj.hasOwnProperty(keyToFind)) {
        results.push(obj[keyToFind]);
    }
    for (const key of Object.keys(obj)) {
        if (typeof obj[key] === 'object') {
            findAllKeys(obj[key], keyToFind, results);
        }
    }
}

function makeRequest(o, p) {
    return new Promise((resolve, reject) => {
        const r = https.request(o, res => { let d=''; res.on('data', c=>d+=c); res.on('end', ()=>{ try{resolve(JSON.parse(d));}catch(e){resolve(d);} }); });
        r.on('error', reject);
        if(p) r.write(JSON.stringify(p)); r.end();
    });
}

module.exports = async (req, res) => {
    if (req.method === 'OPTIONS') { res.status(200).end(); return; }
    if (req.method !== 'GET') { res.status(405).json({ status: false, message: 'Method not allowed' }); return; }
    
    const id = (req.query.id || '').trim();
    if (!id) { res.status(400).json({ status: false, message: 'Parameter id wajib diisi' }); return; }
    
    // Instant response for curated community playlists
    if (communityPlaylists && communityPlaylists[id]) {
        const cp = communityPlaylists[id];
        return res.status(200).json({
            status: true,
            creator: 'Nanzz',
            result: {
                id: cp.id,
                title: cp.title,
                artist: cp.artist || cp.creator || 'MusifyStar Komunitas',
                creator: cp.creator || 'MusifyStar Komunitas',
                description: cp.description || '',
                thumbnails: [{ url: cp.cover }],
                songs: (cp.songs || []).map(s => ({
                    videoId: s.videoId,
                    title: s.title,
                    artist: s.artist,
                    duration: s.duration || '3:30',
                    thumbnails: s.thumbnails || [{ url: s.cover }]
                }))
            }
        });
    }

    try {
        let browseId = id;
        if (!browseId.startsWith('VL') && browseId.startsWith('PL')) {
            browseId = 'VL' + browseId;
        }

        const isPlaylist = browseId.startsWith('VL');
        const clientName = isPlaylist ? 'WEB' : 'WEB_REMIX';
        const hostname = isPlaylist ? 'youtubei.googleapis.com' : 'music.youtube.com';

        const data = await makeRequest({
            hostname: hostname, 
            path: '/youtubei/v1/browse?key='+API_KEY, 
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 Chrome/131.0.0.0', 'Origin': 'https://music.youtube.com' }
        }, { context: { client: { clientName: clientName, clientVersion: isPlaylist ? '2.20240726.00.00' : '1.20240101.00.00', hl: 'en', gl: 'ID' } }, browseId });

        let title = 'Unknown';
        let description = '';
        let thumbnails = [];
        const songs = [];

        if (isPlaylist) {
            const sidebars = [];
            findAllKeys(data, 'playlistSidebarPrimaryInfoRenderer', sidebars);
            if (sidebars.length > 0) {
                title = sidebars[0].title?.runs?.[0]?.text || sidebars[0].title?.simpleText || 'Unknown';
                description = getRunsText(sidebars[0].description?.runs || []);
                const thumbs = sidebars[0].thumbnailRenderer?.playlistVideoThumbnailRenderer?.thumbnail?.thumbnails || sidebars[0].thumbnailRenderer?.playlistCustomThumbnailRenderer?.thumbnail?.thumbnails || data?.microformat?.microformatDataRenderer?.thumbnail?.thumbnails || [];
                if (thumbs.length > 0) {
                    thumbnails = [{ url: thumbs[thumbs.length - 1].url.split('?')[0] }];
                }
            }

            const lockups = [];
            findAllKeys(data, 'lockupViewModel', lockups);
            
            for (const lock of lockups) {
                const videoId = lock.contentId || '';
                if (!videoId || songs.find(s => s.videoId === videoId)) continue;
                
                const songTitle = lock.metadata?.lockupMetadataViewModel?.title?.content || 'Unknown';
                
                const rows = lock.metadata?.lockupMetadataViewModel?.metadata?.contentMetadataViewModel?.metadataRows || [];
                let artist = '';
                if (rows[0]?.metadataParts?.[0]?.text?.content) {
                    artist = rows[0].metadataParts[0].text.content;
                }
                
                let duration = '';
                const a11yLabel = lock.rendererContext?.accessibilityContext?.label || '';
                const m = a11yLabel.match(/(\d+\s*(?:detik|menit|jam|\d+:\d+))/);
                if (m) duration = m[1];
                
                if (!duration) {
                    const badges = lock.contentImage?.thumbnailViewModel?.overlays?.[0]?.thumbnailBottomOverlayViewModel?.badges || [];
                    if (badges[0]?.thumbnailBadgeViewModel?.text) {
                        duration = badges[0].thumbnailBadgeViewModel.text;
                    }
                }
                
                const sources = lock.contentImage?.thumbnailViewModel?.image?.sources || [];
                let thumb = transformThumbs(sources.map(s => ({ url: s.url })), videoId);
                
                songs.push({
                    videoId,
                    title: songTitle,
                    artist: artist || 'Unknown',
                    artistId: '',
                    duration: duration,
                    thumbnails: thumb
                });
            }
        } else {
            title = data?.microformat?.microformatDataRenderer?.title || 'Unknown Album';
            description = data?.microformat?.microformatDataRenderer?.description || '';
            thumbnails = data?.microformat?.microformatDataRenderer?.thumbnail?.thumbnails || [];
            
            const h = data?.header?.musicDetailHeaderRenderer || {};
            let headerThumbnails = [];
            if (h.thumbnail?.croppedSquareThumbnailRenderer?.thumbnail?.thumbnails) {
                headerThumbnails = h.thumbnail.croppedSquareThumbnailRenderer.thumbnail.thumbnails;
            } else if (h.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails) {
                headerThumbnails = h.thumbnail.musicThumbnailRenderer.thumbnail.thumbnails;
            }

            if (thumbnails.length === 0 && headerThumbnails.length > 0) {
                thumbnails = headerThumbnails;
            }
            
            let items = data?.contents?.twoColumnBrowseResultsRenderer?.secondaryContents?.sectionListRenderer?.contents?.[0]?.musicPlaylistShelfRenderer?.contents || 
                          data?.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.musicPlaylistShelfRenderer?.contents;
            
            if (!items) {
                items = data?.contents?.twoColumnBrowseResultsRenderer?.secondaryContents?.sectionListRenderer?.contents?.[0]?.musicShelfRenderer?.contents || 
                        data?.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.musicShelfRenderer?.contents || [];
            }
            
            let albumArtist = getRunsText(h.subtitle?.runs || []);
            if (albumArtist.includes(' • ')) {
                albumArtist = albumArtist.split(' • ').find(x => !['Album', 'Single', 'EP', 'Playlist', '2023', '2024', '2022', '2021', '2020'].includes(x.trim())) || albumArtist;
            }
            if (!albumArtist) {
                const mat = title.match(/Album by (.*)$/);
                if (mat) albumArtist = mat[1];
            }
            
            for (const item of items) {
                if (item.musicResponsiveListItemRenderer) {
                    const i = item.musicResponsiveListItemRenderer;
                    const videoId = i.playlistItemData?.videoId || i.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.navigationEndpoint?.watchEndpoint?.videoId || '';
                    if (!videoId) continue;
                    
                    const songTitle = getRunsText(i.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs||[]);
                    const artistRuns = i.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs||[];
                    let artist = getRunsText(artistRuns);
                    if (!artist) artist = albumArtist || 'Unknown Artist';
                    const artistId = artistRuns[0]?.navigationEndpoint?.browseEndpoint?.browseId || '';
                    
                    const duration = getRunsText(i.fixedColumns?.[0]?.musicResponsiveListItemFixedColumnRenderer?.text?.runs||[]);
                    
                    const rawThumb = i.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
                    const thumb = transformThumbs(rawThumb, videoId);
                    
                    songs.push({
                        videoId,
                        title: songTitle,
                        artist,
                        artistId,
                        duration,
                        thumbnails: thumb
                    });
                }
            }
        }

        thumbnails = transformThumbs(thumbnails);
        if (thumbnails.length === 0 && songs.length > 0) {
            thumbnails = songs[0].thumbnails || [];
        }

        // If album/playlist has 0 songs, search for tracks so it never opens empty
        if (songs.length === 0) {
            const queryName = (req.query.title || title || id).replace(/^VL|^PL_?/i, '').replace(/_/g, ' ').trim();
            if (queryName && queryName !== 'Unknown' && queryName !== 'Unknown Album') {
                try {
                    const searchData = await makeRequest({
                        hostname: 'music.youtube.com', path: '/youtubei/v1/search?key='+API_KEY, method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 Chrome/120.0.0.0', 'Origin': 'https://music.youtube.com' },
                        rejectUnauthorized: false, timeout: 8000
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
                                if (!videoId || songs.find(s => s.videoId === videoId)) continue;
                                const songTitle = getRunsText(r.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || []);
                                const songArtist = getRunsText(r.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || []);
                                const rawThumbs = r.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
                                const songThumbs = transformThumbs(rawThumbs, videoId);
                                songs.push({ videoId, title: songTitle, artist: songArtist || 'MusifyStar', duration: '3:30', thumbnails: songThumbs });
                            }
                        }
                    }
                    if (title === 'Unknown' || title === 'Unknown Album') title = queryName;
                    if (thumbnails.length === 0 && songs.length > 0 && songs[0].thumbnails) {
                        thumbnails = songs[0].thumbnails;
                    }
                } catch(searchErr) {}
            }
        }

        res.status(200).json({
            status: true,
            creator: 'Nanzz',
            result: {
                id,
                title: title === 'Unknown' ? (req.query.title || 'Playlist') : title,
                description,
                thumbnails,
                songs
            }
        });
    } catch(e) {
        res.status(500).json({ status: false, message: 'Gagal: '+e.message });
    }
};
