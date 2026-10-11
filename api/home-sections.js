const fs = require('fs');
const path = require('path');

let verifiedCache = null;
try {
    verifiedCache = require('../verified_sections.json');
} catch (e) {
    try {
        const verifiedPath = path.join(__dirname, '..', 'verified_sections.json');
        if (fs.existsSync(verifiedPath)) {
            verifiedCache = JSON.parse(fs.readFileSync(verifiedPath, 'utf8'));
        }
    } catch (err) {
        console.warn('[Home Sections] Failed to load verified_sections.json:', err.message);
    }
}

// In-memory sections cache with timestamp
let memorySections = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour cache

const COMMUNITY_PLAYLISTS = [
    {
        id: 'PL_galau_brutal_indo',
        title: 'Galau Brutal Tengah Malam',
        artist: 'Kurasi Komunitas • 15 Lagu',
        creator: 'MusifyStar Komunitas',
        songsCount: 15,
        cover: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&auto=format&fit=crop&q=80',
        badge: 'Trending Playlist'
    },
    {
        id: 'PL_senja_sudirman',
        title: 'Senja di Sudirman & Senopati',
        artist: 'City Pop & Indie Indo • 13 Lagu',
        creator: 'MusifyStar Komunitas',
        songsCount: 13,
        cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
        badge: 'Chill Vibes'
    },
    {
        id: 'PL_nongkrong_warkop',
        title: 'Nongkrong Santai Warkop & Kafe',
        artist: 'Akustik & Pop Santai • 12 Lagu',
        creator: 'MusifyStar Komunitas',
        songsCount: 12,
        cover: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&auto=format&fit=crop&q=80',
        badge: 'Santai'
    },
    {
        id: 'PL_koplo_fyp_ambyar',
        title: 'Dangdut Koplo FYP & Ambyar',
        artist: 'Denny Caknan, Guyon Waton, Gilga • 12 Lagu',
        creator: 'MusifyStar Komunitas',
        songsCount: 12,
        cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
        badge: 'FYP Koplo'
    },
    {
        id: 'PL_indie_lokal_adem',
        title: 'Indie Lokal Paling Adem',
        artist: 'Fourtwnty, Payung Teduh, Danilla • 12 Lagu',
        creator: 'MusifyStar Komunitas',
        songsCount: 12,
        cover: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&auto=format&fit=crop&q=80',
        badge: 'Indie Senja'
    },
    {
        id: 'PL_lofi_focus_belajar',
        title: 'Lofi Healing & Deep Focus',
        artist: 'Beats Santai Belajar & Kerja • 10 Lagu',
        creator: 'MusifyStar Komunitas',
        songsCount: 10,
        cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
        badge: 'Fokus'
    },
    {
        id: 'PL_workout_hype_indo',
        title: 'Workout Hype Gym Indo',
        artist: 'Energy Booster & EDM Indo • 10 Lagu',
        creator: 'MusifyStar Komunitas',
        songsCount: 10,
        cover: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80',
        badge: 'Semangat'
    },
    {
        id: 'PL_nostalgia_warnet',
        title: 'Nostalgia Warnet 2000-an',
        artist: 'Peterpan, Sheila on 7, Radja • 14 Lagu',
        creator: 'MusifyStar Komunitas',
        songsCount: 14,
        cover: 'https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=800&auto=format&fit=crop&q=80',
        badge: 'Klasik'
    }
];

const POPULAR_ARTISTS = [
    {
        name: 'Bernadya',
        id: 'UCUn9Xjvg8fwqpa58-_XO6zw',
        cover: 'https://yt3.googleusercontent.com/kYk-8GC5b74h3MLcEdbqq4iimp66vhcYEkx1iWgkr5C_QVmY45dtYBKr_84TWY6JlcuO_I6cxToCWig=w800-h800-l90-rj',
        badge: 'Trending #1'
    },
    {
        name: 'Sal Priadi',
        id: 'UCs1Iq1CQQDwTUUUtVhXmK6g',
        cover: 'https://yt3.googleusercontent.com/CnRlHvII5qQcoLQ8XW3_0b7qOLpBaDFtrCR-rQaCyKyQxuycqhLUc1PatxRtYFiEpDzZyzWqE1wdO0l9Cw=w800-h800-l90-rj',
        badge: 'Top Artist'
    },
    {
        name: 'Batas Senja',
        id: 'UCuO6wlFQ04dArFZeZdxwtRQ',
        cover: 'https://yt3.googleusercontent.com/fWMqPQ9ebElRuZVQnNC1JzhbFDu66wLcDpKk2juEhGyRNOjcvL-5AuoLclYuM2c54TeAPSGkHkSkUzEZ=w800-h800-l90-rj',
        badge: 'Viral'
    },
    {
        name: 'Hindia',
        id: 'UCzhVLh7xVyH3MpqO_KY6SYg',
        cover: 'https://yt3.googleusercontent.com/pP42VdTGrlRG0oCRZdgwhZ57R6CpfWDtewbZ9Mlg6gNoKWAjY4R59sGt_Le_zdWHh6hpNeRobL8aBVxwVQ=w800-h800-l90-rj',
        badge: 'Indie King'
    },
    {
        name: 'Mahalini',
        id: 'UCa1eYN7cwBQrOFQLt_K8c-Q',
        cover: 'https://yt3.googleusercontent.com/jy82fBd4lcqM2uBziu-ShqaRC3QMVB8GXtRgbGOOM159Pzvju4yU8kTledgcnn3wIEKbRhVgoIwxFPzM=w800-h800-l90-rj',
        badge: 'Top Singer'
    },
    {
        name: 'Tulus',
        id: 'UC_DHlXllTSMB8pTC38_leFg',
        cover: 'https://yt3.googleusercontent.com/xrGDyYO3umAVFdsdyIM2G451xiAxCD6haJkCQel6TQlqE-XsEUCGsj_Q5Er4YjFpjWqv-_Ze-VaPPL0j=w800-h800-l90-rj',
        badge: 'Legendaris'
    },
    {
        name: 'Juicy Luicy',
        id: 'UCYBtTmBP2QgHgalgsv2v5LA',
        cover: 'https://yt3.googleusercontent.com/gOvuaJNqrtaQhy1nLHH-OuP9aC5Td9KQteDQbUvhtUTLZy-SvqSxlwxj45c4TXVKk1nRBd6W8qcW9r8XMw=w800-h800-l90-rj',
        badge: 'Populer'
    },
    {
        name: 'Nadin Amizah',
        id: 'UCZhZaUHxvz-cxWFhYaWKmtw',
        cover: 'https://yt3.googleusercontent.com/v3ku0MqYM2jNGb1JwUVjYyk2Q5oyJJk89q3uk2zL-hKP6nzNPewk2kQO6Gj5mmw34CezkOmT0D_3c2_q=w800-h800-l90-rj',
        badge: 'Poetic'
    },
    {
        name: 'Sheila On 7',
        id: 'UCoy8sTKrImqfSq6TYOSW81A',
        cover: 'https://yt3.googleusercontent.com/h52YQ8oAiGCiZFp5W1RGaj8GQMde1hNmYV7_ad3XgWcygvz7riguymmuvMj2yUoP1qhU2C3zoDJu72w=w800-h800-l90-rj',
        badge: 'Legenda'
    },
    {
        name: 'Dewa 19',
        id: 'UCn0hl0XZ3bFREX2SCBZK3Pw',
        cover: 'https://yt3.googleusercontent.com/e7Q5TF9qRIN8rME4t7aU_gkAcKyCgoD1ywCSfWk5-Xd3RjXFAE5vIRWexZyBR2arDpHaYUru3GSREjhO=w800-h800-l90-rj',
        badge: 'Maestro'
    },
    {
        name: 'Denny Caknan',
        id: 'UCrXRY_7SVVmc6TykwhRGUNQ',
        cover: 'https://yt3.googleusercontent.com/qVb_uk5JJ-FyTIoESoeL080jtUIIvjdN-aQbRtUTREMMsenXd-txpbgtYaoYi5t3G7h_GBwT79zD5ppkEA=w800-h800-l90-rj',
        badge: 'Koplo King'
    },
    {
        name: 'Guyon Waton',
        id: 'UCcESmPhmesrSpajuB2-2Q4Q',
        cover: 'https://yt3.googleusercontent.com/oap5K2iX47gAt7HN3C0xchPEH1ju1t2rJzh21UI3VhkQyRrNS5FGC8j_2yxKRSBEGAEKYT0Ni7bfqn91=w800-h800-l90-rj',
        badge: 'Ambyar'
    },
    {
        name: 'Feby Putri',
        id: 'UCRGM3xlhKdFv_tlOlycBntQ',
        cover: 'https://yt3.googleusercontent.com/GSXXSn4p12v1p9u7GJ1osGYMC12L5Qrp__hu-PyJM1AlO4TWOoJFtb_-Hi7FiBdgTcobVkvvjPJ0cCM=w800-h800-l90-rj',
        badge: 'Akustik'
    },
    {
        name: 'DJ Afthershrock',
        id: 'UC9h9kOkjb-495Ga6Nk6QvwQ',
        cover: 'https://yt3.googleusercontent.com/NBnwmlIyjcT9y9RLuPOncRwdKMuracO2tkhjEF1mE2KsxuYZ1ZQXXkNQ7YDUWoAcfQEYANGefPIz9E-P=w800-h800-l90-rj',
        badge: 'Remix'
    },
    {
        name: 'XXXTENTACION',
        id: 'UCnAcxgRZ065f_eXK1o85c1w',
        cover: 'https://yt3.googleusercontent.com/JL-pqw66BmaGlVp-ALu2ycJ1sYbuS-ln7xTqjzQzZqols1MTgHCP41p_x6DSvQfjPVH95IQTewnhtnX0=w800-h800-l90-rj',
        badge: 'Hip Hop'
    },
    {
        name: 'Juice WRLD',
        id: 'UCbn0GRdgsQtl9hlV-IqxFGg',
        cover: 'https://yt3.googleusercontent.com/lD_dZCseNDPPqZkboCBhIrLy53GoC4mmL5SJyXqWo_xwjjyyCRONuu5ceZaUrcQRpozSxCK32ZcL9tKM=w800-h800-l90-rj',
        badge: 'Global Icon'
    },
    {
        name: 'Lil Peep',
        id: 'UCxcyWcW0kZFGRyetDHr3UuA',
        cover: 'https://yt3.googleusercontent.com/A_o9O67tVxdvReVwPj0tPj45nmr6f-VXf_dZCoNUTvZJVyksX_9lSQEEtzhsgSXDXl2rvfmQviTFZRY=w800-h800-l90-rj',
        badge: 'Emo Rap'
    }
];

function buildFallbackSections() {
    if (verifiedCache) {
        return {
            pilihan_cepat: verifiedCache.pilihan_cepat || [],
            terpopuler_hari_ini: verifiedCache.terpopuler_hari_ini || [],
            viral_tiktok: verifiedCache.viral_tiktok || [],
            trending_sekarang: verifiedCache.trending_sekarang || [],
            rilis_terbaru: verifiedCache.rilis_terbaru || [],
            top_50_indo: verifiedCache.top_50_indo || [],
            santai_akustik: verifiedCache.santai_akustik || [],
            nostalgia_indo: verifiedCache.nostalgia_indo || [],
            playlist_komunitas: COMMUNITY_PLAYLISTS,
            artis_populer: POPULAR_ARTISTS
        };
    }
    return {
        pilihan_cepat: [],
        terpopuler_hari_ini: [],
        viral_tiktok: [],
        trending_sekarang: [],
        rilis_terbaru: [],
        top_50_indo: [],
        santai_akustik: [],
        nostalgia_indo: [],
        playlist_komunitas: COMMUNITY_PLAYLISTS,
        artis_populer: POPULAR_ARTISTS
    };
}

module.exports = async (req, res) => {
    if (req.method === 'OPTIONS') {
        if (res.status) return res.status(200).send('OK');
        return;
    }

    try {
        const now = Date.now();
        // Return memory cached data if valid
        if (memorySections && (now - lastFetchTime < CACHE_TTL_MS)) {
            return res.json({
                status: true,
                cached: true,
                sections: memorySections
            });
        }

        const sections = buildFallbackSections();
        memorySections = sections;
        lastFetchTime = now;

        return res.json({
            status: true,
            cached: false,
            sections: sections
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: 'Gagal memuat home sections: ' + err.message,
            sections: buildFallbackSections()
        });
    }
};
