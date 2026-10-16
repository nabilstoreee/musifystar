// ============================================================
// StarMusify - DYNAMIC OG META INJECTION (Edge Function)
// ============================================================
// Link-preview crawlers (WhatsApp, Telegram, Twitter/X, Facebook, Discord...)
// fetch the raw HTML and do NOT execute JavaScript. Because of that, the
// client-side updateOG()/updateOGForArtist()/updateOGForAlbum() calls in
// player.js/artist.js/album.js never actually affect what shows up in a
// share preview - they only update the tab title/meta tags after the page
// has already loaded in a real browser.
//
// To make the correct artwork show up in previews, we intercept requests to
// /play/*, /artist/*, /album/* here on the edge, fetch the track/artist/album
// metadata using the same APIs the app already uses (by ID only - no need
// for title/artist/cover query params anymore, which is what was making
// share links so long), and rewrite the <title>/og:*/twitter:* tags in the
// HTML before it reaches the requester.
//
// Playlists are intentionally NOT handled here: user playlists live only in
// each device's localStorage, so there is no server-side data to render a
// real preview from. Those links keep the default StarMusify preview.

const FALLBACK_IMAGE = 'https://www.gobox.my.id/file/R0ym4wqfznmp.png';
const FETCH_TIMEOUT_MS = 4000;

function hdCover(url, videoId) {
    if (!url && videoId) return 'https://i.ytimg.com/vi/' + videoId + '/hqdefault.jpg';
    if (!url) return FALLBACK_IMAGE;
    var hd = String(url);
    if (hd.includes('googleusercontent.com') || hd.includes('ggpht.com') || hd.includes('ytimg.com')) {
        if (/=w\d+-h\d+/i.test(hd)) {
            hd = hd.replace(/=w\d+-h\d+[^?#]*/i, '=w800-h800-l90-rj');
        } else if (/=s\d+/i.test(hd)) {
            hd = hd.replace(/=s\d+[^?#]*/i, '=s800-c-k-c0x00ffffff-no-rj');
        } else if (/=w\d+/i.test(hd)) {
            hd = hd.replace(/=w\d+[^?#]*/i, '=w800-h800-l90-rj');
        }
    }
    return hd;
}

function escapeAttr(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function fetchJson(url) {
    const controller = new AbortController();
    const timer = setTimeout(function () { controller.abort(); }, FETCH_TIMEOUT_MS);
    try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        return null;
    } finally {
        clearTimeout(timer);
    }
}

async function getTrackMeta(origin, videoId) {
    const d = await fetchJson(origin + '/api/search?query=' + encodeURIComponent('https://youtube.com/watch?v=' + videoId));
    var title = 'Lagu', artist = 'StarMusify', cover = hdCover(null, videoId);
    if (d && d.status && d.result && d.result.songs && d.result.songs.length > 0) {
        var song = d.result.songs[0];
        title = song.title || title;
        artist = song.artist || artist;
        cover = hdCover(song.thumbnail, videoId);
    }
    return {
        title: title,
        description: 'Dengarkan ' + title + ' - ' + artist + ' di StarMusify',
        image: cover
    };
}

async function getArtistMeta(origin, artistId) {
    const d = await fetchJson(origin + '/api/artist?id=' + encodeURIComponent(artistId));
    var name = 'Artist', image = FALLBACK_IMAGE;
    if (d && d.status && d.result) {
        var a = d.result;
        name = a.name || name;
        if (a.thumbnails && a.thumbnails.length > 0) {
            var last = a.thumbnails[a.thumbnails.length - 1];
            image = (typeof last === 'string' ? last : (last.url || last.src)) || image;
        }
    }
    return {
        title: name + ' (Artist)',
        description: 'Dengarkan lagu & album terbaik dari ' + name + ' di StarMusify',
        image: image
    };
}

async function getAlbumMeta(origin, albumId) {
    const d = await fetchJson(origin + '/api/album?id=' + encodeURIComponent(albumId));
    var title = 'Album', artist = '', image = FALLBACK_IMAGE;
    if (d && d.status && d.result) {
        var a = d.result;
        title = a.title || title;
        if (a.songs && a.songs.length > 0 && a.songs[0].artist) artist = a.songs[0].artist;
        if (a.thumbnails && a.thumbnails.length > 0) {
            var last = a.thumbnails[a.thumbnails.length - 1];
            image = (typeof last === 'string' ? last : (last.url || last.src)) || image;
        } else if (a.songs && a.songs.length > 0 && a.songs[0].thumbnails && a.songs[0].thumbnails.length > 0) {
            var st = a.songs[0].thumbnails[0];
            image = (typeof st === 'string' ? st : (st.url || st.src)) || image;
        }
    }
    var fullTitle = artist ? (title + ' - ' + artist) : title;
    return {
        title: fullTitle + ' (Album)',
        description: 'Dengarkan album ' + fullTitle + ' di StarMusify',
        image: image
    };
}

function replaceMetaContent(html, matchRegex, newContent) {
    return html.replace(matchRegex, function (fullMatch) {
        return fullMatch.replace(/content="[^"]*"/, 'content="' + escapeAttr(newContent) + '"');
    });
}

function injectMeta(html, meta, pageUrl) {
    html = html.replace(/<title>[^<]*<\/title>/, '<title>' + escapeAttr(meta.title) + ' - StarMusify</title>');
    html = replaceMetaContent(html, /<meta property="og:title"[^>]*>/, meta.title + ' | StarMusify');
    html = replaceMetaContent(html, /<meta property="og:description"[^>]*>/, meta.description);
    html = replaceMetaContent(html, /<meta property="og:url"[^>]*>/, pageUrl);
    html = replaceMetaContent(html, /<meta property="og:image"(?!:)[^>]*>/, meta.image);
    html = replaceMetaContent(html, /<meta property="og:image:secure_url"[^>]*>/, meta.image);
    html = replaceMetaContent(html, /<meta name="twitter:title"[^>]*>/, meta.title);
    html = replaceMetaContent(html, /<meta name="twitter:description"[^>]*>/, meta.description);
    html = replaceMetaContent(html, /<meta name="twitter:image"(?!:)[^>]*>/, meta.image);
    html = replaceMetaContent(html, /<meta name="twitter:image:src"[^>]*>/, meta.image);
    return html;
}

export default async (request, context) => {
    const url = new URL(request.url);

    // Let the request continue through its normal redirect (-> /index.html)
    // and just transform whatever HTML comes back.
    const response = await context.next();

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) return response;

    try {
        const parts = url.pathname.split('/').filter(Boolean); // e.g. ['play', 'VIDEOID']
        const type = parts[0];
        const id = decodeURIComponent(parts[1] || '');
        if (!id) return response;

        let meta = null;
        if (type === 'play') meta = await getTrackMeta(url.origin, id);
        else if (type === 'artist') meta = await getArtistMeta(url.origin, id);
        else if (type === 'album') meta = await getAlbumMeta(url.origin, id);

        if (!meta) return response;

        const html = await response.text();
        const newHtml = injectMeta(html, meta, url.href);

        const headers = new Headers(response.headers);
        headers.set('content-length', String(new TextEncoder().encode(newHtml).length));
        headers.set('cache-control', 'public, max-age=300');

        return new Response(newHtml, { status: response.status, headers: headers });
    } catch (e) {
        return response;
    }
};

export const config = { path: ['/play/*', '/artist/*', '/album/*'] };
