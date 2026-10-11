function deepFreeze(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    try {
        Object.freeze(obj);
        Object.getOwnPropertyNames(obj).forEach(function(prop) {
            if (obj[prop] !== null && (typeof obj[prop] === 'object' || typeof obj[prop] === 'function') && !Object.isFrozen(obj[prop])) {
                deepFreeze(obj[prop]);
            }
        });
    } catch(e) {}
    return obj;
}

var Home = {
    activeCategory: null,
    loadingCategory: false,
    top50Expanded: false,
    sections: {
        pilihan_cepat: [],
        terpopuler_hari_ini: [],
        viral_tiktok: [],
        trending_sekarang: [],
        rilis_terbaru: [],
        top_50_indo: [],
        santai_akustik: [],
        nostalgia_indo: [],
        playlist_komunitas: [],
        artis_populer: []
    },

    categories: [
        { name: 'Semua' },
        { name: 'Developer Profile', icon: 'code' },
        { name: 'Chill', icon: 'coffee' },
        { name: 'Focus', icon: 'brain' },
        { name: 'Commute', icon: 'car' },
        { name: 'Gaming', icon: 'gamepad-2' },
        { name: 'Energize', icon: 'zap' },
        { name: 'Party', icon: 'party-popper' },
        { name: 'Feel good', icon: 'smile' },
        { name: 'Romance', icon: 'heart' },
        { name: 'Workout', icon: 'dumbbell' },
        { name: 'Sleep', icon: 'moon' },
        { name: 'Sad', icon: 'cloud-rain' },
        { name: 'Happy', icon: 'sun' },
        { name: 'Nostalgia', icon: 'disc' },
        { name: 'Acoustic', icon: 'guitar' },
        { name: 'Pop', icon: 'music' },
        { name: 'Rock', icon: 'flame' }
    ],

    // Fallback Curated Data
    defaultArtists: [
        { name: 'Bernadya', id: 'UCUn9Xjvg8fwqpa58-_XO6zw', cover: 'https://yt3.googleusercontent.com/kYk-8GC5b74h3MLcEdbqq4iimp66vhcYEkx1iWgkr5C_QVmY45dtYBKr_84TWY6JlcuO_I6cxToCWig=w800-h800-l90-rj', badge: 'Trending #1' },
        { name: 'Sal Priadi', id: 'UCs1Iq1CQQDwTUUUtVhXmK6g', cover: 'https://yt3.googleusercontent.com/CnRlHvII5qQcoLQ8XW3_0b7qOLpBaDFtrCR-rQaCyKyQxuycqhLUc1PatxRtYFiEpDzZyzWqE1wdO0l9Cw=w800-h800-l90-rj', badge: 'Top Artist' },
        { name: 'Batas Senja', id: 'UCuO6wlFQ04dArFZeZdxwtRQ', cover: 'https://yt3.googleusercontent.com/fWMqPQ9ebElRuZVQnNC1JzhbFDu66wLcDpKk2juEhGyRNOjcvL-5AuoLclYuM2c54TeAPSGkHkSkUzEZ=w800-h800-l90-rj', badge: 'Viral' },
        { name: 'Hindia', id: 'UCzhVLh7xVyH3MpqO_KY6SYg', cover: 'https://yt3.googleusercontent.com/pP42VdTGrlRG0oCRZdgwhZ57R6CpfWDtewbZ9Mlg6gNoKWAjY4R59sGt_Le_zdWHh6hpNeRobL8aBVxwVQ=w800-h800-l90-rj', badge: 'Indie King' },
        { name: 'Mahalini', id: 'UCa1eYN7cwBQrOFQLt_K8c-Q', cover: 'https://yt3.googleusercontent.com/jy82fBd4lcqM2uBziu-ShqaRC3QMVB8GXtRgbGOOM159Pzvju4yU8kTledgcnn3wIEKbRhVgoIwxFPzM=w800-h800-l90-rj', badge: 'Top Singer' },
        { name: 'Tulus', id: 'UC_DHlXllTSMB8pTC38_leFg', cover: 'https://yt3.googleusercontent.com/xrGDyYO3umAVFdsdyIM2G451xiAxCD6haJkCQel6TQlqE-XsEUCGsj_Q5Er4YjFpjWqv-_Ze-VaPPL0j=w800-h800-l90-rj', badge: 'Legendaris' },
        { name: 'Juicy Luicy', id: 'UCYBtTmBP2QgHgalgsv2v5LA', cover: 'https://yt3.googleusercontent.com/gOvuaJNqrtaQhy1nLHH-OuP9aC5Td9KQteDQbUvhtUTLZy-SvqSxlwxj45c4TXVKk1nRBd6W8qcW9r8XMw=w800-h800-l90-rj', badge: 'Populer' },
        { name: 'Nadin Amizah', id: 'UCZhZaUHxvz-cxWFhYaWKmtw', cover: 'https://yt3.googleusercontent.com/v3ku0MqYM2jNGb1JwUVjYyk2Q5oyJJk89q3uk2zL-hKP6nzNPewk2kQO6Gj5mmw34CezkOmT0D_3c2_q=w800-h800-l90-rj', badge: 'Poetic' },
        { name: 'Sheila On 7', id: 'UCoy8sTKrImqfSq6TYOSW81A', cover: 'https://yt3.googleusercontent.com/h52YQ8oAiGCiZFp5W1RGaj8GQMde1hNmYV7_ad3XgWcygvz7riguymmuvMj2yUoP1qhU2C3zoDJu72w=w800-h800-l90-rj', badge: 'Legenda' },
        { name: 'Dewa 19', id: 'UCn0hl0XZ3bFREX2SCBZK3Pw', cover: 'https://yt3.googleusercontent.com/e7Q5TF9qRIN8rME4t7aU_gkAcKyCgoD1ywCSfWk5-Xd3RjXFAE5vIRWexZyBR2arDpHaYUru3GSREjhO=w800-h800-l90-rj', badge: 'Maestro' },
        { name: 'Denny Caknan', id: 'UCrXRY_7SVVmc6TykwhRGUNQ', cover: 'https://yt3.googleusercontent.com/qVb_uk5JJ-FyTIoESoeL080jtUIIvjdN-aQbRtUTREMMsenXd-txpbgtYaoYi5t3G7h_GBwT79zD5ppkEA=w800-h800-l90-rj', badge: 'Koplo King' },
        { name: 'Guyon Waton', id: 'UCcESmPhmesrSpajuB2-2Q4Q', cover: 'https://yt3.googleusercontent.com/oap5K2iX47gAt7HN3C0xchPEH1ju1t2rJzh21UI3VhkQyRrNS5FGC8j_2yxKRSBEGAEKYT0Ni7bfqn91=w800-h800-l90-rj', badge: 'Ambyar' },
        { name: 'Feby Putri', id: 'UCRGM3xlhKdFv_tlOlycBntQ', cover: 'https://yt3.googleusercontent.com/GSXXSn4p12v1p9u7GJ1osGYMC12L5Qrp__hu-PyJM1AlO4TWOoJFtb_-Hi7FiBdgTcobVkvvjPJ0cCM=w800-h800-l90-rj', badge: 'Akustik' },
        { name: 'DJ Afthershrock', id: 'UC9h9kOkjb-495Ga6Nk6QvwQ', cover: 'https://yt3.googleusercontent.com/NBnwmlIyjcT9y9RLuPOncRwdKMuracO2tkhjEF1mE2KsxuYZ1ZQXXkNQ7YDUWoAcfQEYANGefPIz9E-P=w800-h800-l90-rj', badge: 'Remix' },
        { name: 'XXXTENTACION', id: 'UCnAcxgRZ065f_eXK1o85c1w', cover: 'https://yt3.googleusercontent.com/JL-pqw66BmaGlVp-ALu2ycJ1sYbuS-ln7xTqjzQzZqols1MTgHCP41p_x6DSvQfjPVH95IQTewnhtnX0=w800-h800-l90-rj', badge: 'Hip Hop' },
        { name: 'Juice WRLD', id: 'UCbn0GRdgsQtl9hlV-IqxFGg', cover: 'https://yt3.googleusercontent.com/lD_dZCseNDPPqZkboCBhIrLy53GoC4mmL5SJyXqWo_xwjjyyCRONuu5ceZaUrcQRpozSxCK32ZcL9tKM=w800-h800-l90-rj', badge: 'Global Icon' },
        { name: 'Lil Peep', id: 'UCxcyWcW0kZFGRyetDHr3UuA', cover: 'https://yt3.googleusercontent.com/A_o9O67tVxdvReVwPj0tPj45nmr6f-VXf_dZCoNUTvZJVyksX_9lSQEEtzhsgSXDXl2rvfmQviTFZRY=w800-h800-l90-rj', badge: 'Emo Rap' }
    ],

    defaultCommunityPlaylists: [
        { id: 'PL_galau_brutal_indo', title: 'Galau Brutal Tengah Malam', artist: 'Kurasi Komunitas • 15 Lagu', creator: 'MusifyStar Komunitas', songsCount: 15, cover: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&auto=format&fit=crop&q=80', badge: 'Trending Playlist' },
        { id: 'PL_senja_sudirman', title: 'Senja di Sudirman & Senopati', artist: 'City Pop & Indie Indo • 13 Lagu', creator: 'MusifyStar Komunitas', songsCount: 13, cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80', badge: 'Chill Vibes' },
        { id: 'PL_nongkrong_warkop', title: 'Nongkrong Santai Warkop & Kafe', artist: 'Akustik & Pop Santai • 12 Lagu', creator: 'MusifyStar Komunitas', songsCount: 12, cover: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&auto=format&fit=crop&q=80', badge: 'Santai' },
        { id: 'PL_koplo_fyp_ambyar', title: 'Dangdut Koplo FYP & Ambyar', artist: 'Denny Caknan, Guyon Waton, Gilga • 12 Lagu', creator: 'MusifyStar Komunitas', songsCount: 12, cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80', badge: 'FYP Koplo' },
        { id: 'PL_indie_lokal_adem', title: 'Indie Lokal Paling Adem', artist: 'Fourtwnty, Payung Teduh, Danilla • 12 Lagu', creator: 'MusifyStar Komunitas', songsCount: 12, cover: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&auto=format&fit=crop&q=80', badge: 'Indie Senja' },
        { id: 'PL_lofi_focus_belajar', title: 'Lofi Healing & Deep Focus', artist: 'Beats Santai Belajar & Kerja • 10 Lagu', creator: 'MusifyStar Komunitas', songsCount: 10, cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80', badge: 'Fokus' },
        { id: 'PL_workout_hype_indo', title: 'Workout Hype Gym Indo', artist: 'Energy Booster & EDM Indo • 10 Lagu', creator: 'MusifyStar Komunitas', songsCount: 10, cover: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80', badge: 'Semangat' },
        { id: 'PL_nostalgia_warnet', title: 'Nostalgia Warnet 2000-an', artist: 'Peterpan, Sheila on 7, Radja • 14 Lagu', creator: 'MusifyStar Komunitas', songsCount: 14, cover: 'https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=800&auto=format&fit=crop&q=80', badge: 'Klasik' }
    ],

    initCache() {
        try {
            var raw = localStorage.getItem('musifystar_home_sections_cache_v4');
            if (raw) {
                var parsed = JSON.parse(raw);
                if (parsed && typeof parsed === 'object') {
                    Object.keys(parsed).forEach(function(k) {
                        if (Array.isArray(parsed[k]) && parsed[k].length > 0) {
                            Home.sections[k] = parsed[k];
                        }
                    });
                }
            }
        } catch(e) {}

        // Always guarantee the latest verified popular artists and community playlists are used
        Home.sections.artis_populer = Home.defaultArtists;
        Home.sections.playlist_komunitas = Home.defaultCommunityPlaylists;

        // Expose to global S for player compatibility
        if (typeof S !== 'undefined') {
            S.homeSections = Home.sections;
            S.ht = Home.sections.pilihan_cepat || [];
            S.ha = Home.sections.artis_populer || [];
            S.hp = Home.sections.playlist_komunitas || [];
        }
    },

    render() {
        if (!navigator.onLine) {
            var offlineSongs = typeof getOfflineSongs === 'function' ? getOfflineSongs() : [];
            var savedCountText = offlineSongs.length > 0 
                ? `${offlineSongs.length} lagu tersimpan di perangkat Anda dan siap diputar.` 
                : 'Belum ada lagu yang disimpan di penyimpanan offline perangkat.';

            gid('view-home').innerHTML = `
            <div class="pt-8 pb-3.5 px-4 sticky top-0 z-30 border-b border-white/10 shadow-2xl transition-all bg-black/80 backdrop-blur-md">
                <div class="flex justify-between items-center">
                    <div>
                        <h1 class="text-2xl font-black text-white tracking-tight drop-shadow-md">MusifyStar</h1>
                        <span class="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border border-amber-400/40 text-amber-300 bg-amber-500/10">Mode Offline</span>
                    </div>
                    <button onclick="App.switch('offline')" class="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-sm">
                        <i data-lucide="wifi-off" class="w-3.5 h-3.5"></i>
                        <span>Lagu Offline</span>
                    </button>
                </div>
            </div>

            <div class="flex flex-col items-center justify-center min-h-[65vh] text-center px-4 py-12 select-none">
                <div class="relative mb-6">
                    <div class="w-24 h-24 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-2xl backdrop-blur-md">
                        <i data-lucide="wifi-off" class="w-12 h-12 stroke-[1.75]"></i>
                    </div>
                    <div class="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center text-xs font-black shadow-md">!</div>
                </div>

                <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
                    <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                    Sinyal Terputus
                </div>

                <h2 class="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2.5">
                    Sinyal Anda Terputus
                </h2>
                <p class="text-white/80 text-sm max-w-sm leading-relaxed mb-2 font-semibold">
                    Anda tidak bisa putar musik saat mode offline.
                </p>
                <p class="text-white/45 text-xs max-w-xs leading-relaxed mb-8">
                    ${savedCountText}
                </p>

                <div class="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs">
                    <button onclick="App.switch('offline')" class="w-full btn-chrome py-3 px-5 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all cursor-pointer">
                        <i data-lucide="folder-check" class="w-4 h-4"></i>
                        <span>Buka Lagu Offline Tersimpan</span>
                    </button>
                    <button onclick="Home.retryConnection()" class="w-full py-3 px-5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer shadow-md">
                        <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                        <span>Coba Sambungkan Ulang</span>
                    </button>
                </div>
            </div>`;
            if (window.lucide) lucide.createIcons();
            if (typeof hideSplashScreen === 'function') setTimeout(hideSplashScreen, 100);
            return;
        }

        Home.initCache();

        var chipsHtml = Home.categories.map(function(c) {
            var isActive = (Home.activeCategory === c.name) || (!Home.activeCategory && c.name === 'Semua');
            var btnStyle = isActive
                ? 'bg-white text-black font-extrabold shadow-md shadow-white/20 border border-white scale-[1.03]'
                : 'bg-white/[0.08] hover:bg-white/[0.14] active:bg-white/[0.18] text-white/85 hover:text-white border border-white/20 hover:border-white/35 font-medium backdrop-blur-md';
            return '<button onclick="Home.selectCategory(\'' + c.name + '\')" class="home-chip-btn px-4 py-2 rounded-full text-xs whitespace-nowrap transition-all duration-200 ease-out flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ' + btnStyle + '">' +
                (c.icon ? '<i data-lucide="' + c.icon + '" class="w-3.5 h-3.5"></i>' : '') +
                '<span>' + es(c.name) + '</span>' +
            '</button>';
        }).join('');

        var uAvatar = (window.Auth && Auth.currentUser && Auth.currentUser.avatar) ? Auth.currentUser.avatar : '/logo.png';
        var hasUser = !!(window.Auth && Auth.currentUser);
        var uBorder = (window.Auth && typeof Auth.getBorderUrl === 'function') ? Auth.getBorderUrl(Auth.currentUser) : (Auth.currentUser?.borderUrl || '');
        var avatarBtnContent = hasUser
            ? `<div class="relative w-full h-full flex items-center justify-center">
                <img src="${uAvatar}" class="w-full h-full rounded-full object-cover" alt="Avatar" onerror="this.src='/logo.png'">
                ${uBorder ? `<img src="${uBorder}" class="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[155%] h-[155%] max-w-none object-contain z-10 select-none drop-shadow-sm" style="transform: translate(-50%, -50%);" alt="Border">` : ''}
              </div>`
            : '<i data-lucide="user" class="w-5 h-5"></i>';
        var avatarBtnTitle = hasUser
            ? ('Akun: ' + Auth.currentUser.username)
            : 'Login & Akun';

        gid('view-home').innerHTML = `
        <div class="pt-8 pb-3.5 px-4 sticky top-0 z-30 border-b border-white/10 shadow-2xl transition-all" style="background: linear-gradient(180deg, rgba(13, 15, 22, 0.88) 0%, rgba(13, 15, 22, 0.97) 100%), url('/banner.png') center/cover no-repeat; backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);">
            <div class="flex justify-between items-center mb-3">
                <div>
                    <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md">MusifyStar</h1>
                    <p class="text-[10px] text-white/60 tracking-wider font-semibold uppercase">Premium Streaming Musik & Lirik</p>
                </div>
                <div class="flex items-center gap-2 sm:gap-2.5">
                    <button onclick="App.switch('search')" class="w-10 h-10 rounded-2xl bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/90 hover:text-white hover:bg-black/60 active:scale-95 transition-all shadow-lg cursor-pointer" title="Cari Musik">
                        <i data-lucide="search" class="w-5 h-5"></i>
                    </button>
                    <!-- Tombol Chat Global (Hanya Tampil Jika Sudah Login) -->
                    <button id="header-global-chat-btn" onclick="if(typeof GlobalChat !== 'undefined') GlobalChat.open();" class="relative w-10 h-10 rounded-2xl bg-black/40 backdrop-blur-md border border-cyan-500/30 hover:border-cyan-400 flex items-center justify-center text-cyan-400 hover:text-cyan-200 hover:bg-cyan-500/20 active:scale-95 transition-all shadow-lg cursor-pointer group ${hasUser ? '' : 'hidden'}" title="Chat Global MusifyStar">
                        <i data-lucide="message-circle" class="w-5 h-5 transition-transform group-hover:scale-110"></i>
                        <span id="global-chat-badge" class="hidden absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-black animate-pulse"></span>
                    </button>
                    <button onclick="Auth.toggleTopDropdown(this)" class="header-profile-btn relative w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/90 hover:text-white hover:bg-black/60 active:scale-95 transition-all shadow-lg overflow-visible cursor-pointer" title="${avatarBtnTitle}">
                        ${avatarBtnContent}
                    </button>
                </div>
            </div>
            <!-- Category Slider (Kategori Geser) -->
            <div id="home-category-bar" class="flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4 py-1 scroll-smooth">
                ${chipsHtml}
            </div>
        </div>
        <div class="px-3.5 sm:px-4 mt-4 pb-12" id="home-main-content">
            <div id="broadcast-announcement-slot"></div>
            <div id="seasonal-theme-banner-slot"></div>
            
            <!-- Default Multi-Section Home View (10 Requested Rich Sections) -->
            <div id="home-default-view">
                <div class="space-y-8">
                    <!-- 1. Pilihan Cepat Untukmu -->
                    <section id="section-wrap-pilihan-cepat">
                        <div class="flex items-center justify-between mb-3 px-1">
                            <div>
                                <h2 class="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                                    <span class="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
                                    <i data-lucide="zap" class="w-5 h-5 text-amber-400 fill-amber-400/20"></i>
                                    <span>Pilihan Cepat Untukmu</span>
                                </h2>
                                <p class="text-xs text-white/55 mt-0.5 ml-4.5">Musik yang pas menemani harimu</p>
                            </div>
                            <button onclick="Home.playSection('pilihan_cepat', 0)" class="text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 px-3 py-1.5 rounded-full flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer">
                                <i data-lucide="play" class="w-3.5 h-3.5 fill-current"></i>
                                <span>Putar Cepat</span>
                            </button>
                        </div>
                        <div id="home-section-pilihan-cepat" class="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3"></div>
                    </section>

                    <!-- 2. Pilihan Terpopuler Hari Ini -->
                    <section id="section-wrap-terpopuler">
                        <div class="flex items-center justify-between mb-3 px-1">
                            <div>
                                <h2 class="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                                    <i data-lucide="flame" class="w-5 h-5 text-orange-400 fill-orange-400/20"></i>
                                    <span>Pilihan Terpopuler Hari Ini</span>
                                </h2>
                                <p class="text-xs text-white/55 mt-0.5 ml-4.5">Paling sering diputar & favorit pendengar</p>
                            </div>
                            <button onclick="Home.playSection('terpopuler_hari_ini', 0)" class="text-xs font-bold text-orange-400 hover:text-orange-300 bg-orange-400/10 hover:bg-orange-400/20 border border-orange-400/30 px-3 py-1.5 rounded-full flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer">
                                <i data-lucide="play" class="w-3.5 h-3.5 fill-current"></i>
                                <span>Putar Semua</span>
                            </button>
                        </div>
                        <div id="home-section-terpopuler" class="flex gap-3.5 overflow-x-auto hide-scrollbar pb-2 scroll-smooth snap-x"></div>
                    </section>

                    <!-- 3. Viral di TikTok -->
                    <section id="section-wrap-viral-tiktok">
                        <div class="flex items-center justify-between mb-3 px-1">
                            <div>
                                <h2 class="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                                    <span class="inline-flex items-center justify-center w-5 h-5 rounded-md bg-gradient-to-tr from-[#00f2fe] via-[#ff0050] to-[#00f2fe] p-0.5 text-white">
                                        <i data-lucide="music-2" class="w-3.5 h-3.5 text-white"></i>
                                    </span>
                                    <span>Viral di TikTok</span>
                                </h2>
                                <p class="text-xs text-white/55 mt-0.5 ml-4.5">Sound FYP & lagu viral yang lagi rame</p>
                            </div>
                            <button onclick="Home.playSection('viral_tiktok', 0)" class="text-xs font-bold text-pink-400 hover:text-pink-300 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 px-3 py-1.5 rounded-full flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer">
                                <i data-lucide="play" class="w-3.5 h-3.5 fill-current"></i>
                                <span>Putar Semua</span>
                            </button>
                        </div>
                        <div id="home-section-viral-tiktok" class="flex gap-3.5 overflow-x-auto hide-scrollbar pb-2 scroll-smooth snap-x"></div>
                    </section>

                    <!-- 4. Trending Sekarang -->
                    <section id="section-wrap-trending">
                        <div class="flex items-center justify-between mb-3 px-1">
                            <div>
                                <h2 class="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                                    <i data-lucide="trending-up" class="w-5 h-5 text-emerald-400"></i>
                                    <span>Trending Sekarang</span>
                                </h2>
                                <p class="text-xs text-white/55 mt-0.5 ml-4.5">Lonjakan pencarian tertinggi pekan ini</p>
                            </div>
                            <button onclick="Home.playSection('trending_sekarang', 0)" class="text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-400/10 hover:bg-emerald-400/20 border border-emerald-400/30 px-3 py-1.5 rounded-full flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer">
                                <i data-lucide="play" class="w-3.5 h-3.5 fill-current"></i>
                                <span>Putar Semua</span>
                            </button>
                        </div>
                        <div id="home-section-trending" class="flex gap-3.5 overflow-x-auto hide-scrollbar pb-2 scroll-smooth snap-x"></div>
                    </section>

                    <!-- 5. Rilis Terbaru & Populer -->
                    <section id="section-wrap-rilis-terbaru">
                        <div class="flex items-center justify-between mb-3 px-1">
                            <div>
                                <h2 class="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                                    <i data-lucide="sparkles" class="w-5 h-5 text-cyan-400"></i>
                                    <span>Rilis Terbaru & Populer</span>
                                </h2>
                                <p class="text-xs text-white/55 mt-0.5 ml-4.5">Karya musik segar dari musisi kesayangan</p>
                            </div>
                            <button onclick="Home.playSection('rilis_terbaru', 0)" class="text-xs font-bold text-cyan-400 hover:text-cyan-300 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/30 px-3 py-1.5 rounded-full flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer">
                                <i data-lucide="play" class="w-3.5 h-3.5 fill-current"></i>
                                <span>Putar Semua</span>
                            </button>
                        </div>
                        <div id="home-section-rilis-terbaru" class="flex gap-3.5 overflow-x-auto hide-scrollbar pb-2 scroll-smooth snap-x"></div>
                    </section>

                    <!-- 6. Top 50 Indonesia (Tangga Lagu Bergengsi) -->
                    <section id="section-wrap-top50" class="glass-card rounded-2xl p-3 sm:p-4 border border-yellow-500/20 bg-gradient-to-b from-yellow-500/[0.04] via-transparent to-black/40">
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
                            <div>
                                <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 text-[10px] font-extrabold uppercase tracking-wider mb-1">
                                    <i data-lucide="trophy" class="w-3 h-3"></i> Tangga Lagu Resmi
                                </div>
                                <h2 class="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                                    <span>Top 50 Indonesia</span>
                                </h2>
                                <p class="text-[11px] text-white/60">50 lagu paling populer dan merajai tangga musik tanah air</p>
                            </div>
                            <button onclick="Home.playSection('top_50_indo', 0)" class="btn-chrome px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer self-start sm:self-auto">
                                <i data-lucide="play" class="w-3.5 h-3.5 fill-current"></i>
                                <span>Putar Seluruh Top 50</span>
                            </button>
                        </div>
                        <div id="home-section-top50-podium" class="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3"></div>
                        <div id="home-section-top50-list" class="space-y-1"></div>
                        <div class="mt-3 text-center">
                            <button id="btn-toggle-top50-expand" onclick="Home.toggleTop50Expand()" class="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white transition-all active:scale-95 cursor-pointer inline-flex items-center gap-1.5">
                                <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>
                                <span>Lihat Seluruh Tangga Lagu (Top 50)</span>
                            </button>
                        </div>
                    </section>

                    <!-- 7. Santai & Akustik -->
                    <section id="section-wrap-santai-akustik">
                        <div class="flex items-center justify-between mb-3 px-1">
                            <div>
                                <h2 class="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                                    <i data-lucide="coffee" class="w-5 h-5 text-amber-500"></i>
                                    <span>Santai & Akustik</span>
                                </h2>
                                <p class="text-xs text-white/55 mt-0.5 ml-4.5">Petikan gitar akustik, indie syahdu, & kopi senja</p>
                            </div>
                            <button onclick="Home.playSection('santai_akustik', 0)" class="text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 rounded-full flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer">
                                <i data-lucide="play" class="w-3.5 h-3.5 fill-current"></i>
                                <span>Putar Semua</span>
                            </button>
                        </div>
                        <div id="home-section-santai-akustik" class="flex gap-3.5 overflow-x-auto hide-scrollbar pb-2 scroll-smooth snap-x"></div>
                    </section>

                    <!-- 8. Nostalgia Indonesia -->
                    <section id="section-wrap-nostalgia-indo">
                        <div class="flex items-center justify-between mb-3 px-1">
                            <div>
                                <h2 class="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                                    <i data-lucide="disc" class="w-5 h-5 text-indigo-400"></i>
                                    <span>Nostalgia Indonesia</span>
                                </h2>
                                <p class="text-xs text-white/55 mt-0.5 ml-4.5">Lagu legendaris & kenangan emas era 90-an & 2000-an</p>
                            </div>
                            <button onclick="Home.playSection('nostalgia_indo', 0)" class="text-xs font-bold text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 px-3 py-1.5 rounded-full flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer">
                                <i data-lucide="play" class="w-3.5 h-3.5 fill-current"></i>
                                <span>Putar Semua</span>
                            </button>
                        </div>
                        <div id="home-section-nostalgia-indo" class="flex gap-3.5 overflow-x-auto hide-scrollbar pb-2 scroll-smooth snap-x"></div>
                    </section>

                    <!-- 9. Playlist Komunitas -->
                    <section id="section-wrap-playlist-komunitas">
                        <div class="flex items-center justify-between mb-3 px-1">
                            <div>
                                <h2 class="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                                    <i data-lucide="folder-heart" class="w-5 h-5 text-rose-400"></i>
                                    <span>Playlist Komunitas</span>
                                </h2>
                                <p class="text-xs text-white/55 mt-0.5 ml-4.5">Koleksi kurasi pendengar & playlist buatanmu</p>
                            </div>
                            <button onclick="if(typeof Library !== 'undefined') Library.createNew()" class="text-xs font-bold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 px-3 py-1.5 rounded-full flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer">
                                <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                                <span>Buat Playlist</span>
                            </button>
                        </div>
                        <div id="home-section-playlist-komunitas" class="flex gap-4 overflow-x-auto hide-scrollbar pb-3 scroll-smooth snap-x"></div>
                    </section>

                    <!-- 10. Artis Populer -->
                    <section id="section-wrap-artis-populer">
                        <div class="flex items-center justify-between mb-3 px-1">
                            <div>
                                <h2 class="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                                    <i data-lucide="users" class="w-5 h-5 text-purple-400"></i>
                                    <span>Artis Populer</span>
                                </h2>
                                <p class="text-xs text-white/55 mt-0.5 ml-4.5">Musisi & band paling banyak didengarkan</p>
                            </div>
                        </div>
                        <div id="home-section-artis-populer" class="flex gap-4 overflow-x-auto hide-scrollbar pb-3 scroll-smooth snap-x"></div>
                    </section>
                </div>
            </div>

            <!-- Category Specific View (When Category Chip Selected) -->
            <div id="home-category-view" style="display:none;"></div>
        </div>`;

        lucide.createIcons();
        if (window.App && typeof App.renderSeasonalBanner === 'function') App.renderSeasonalBanner();
        if (window.App && typeof App.renderBroadcastBanner === 'function') App.renderBroadcastBanner();
        if (window.Maintenance && typeof Maintenance.updateUI === 'function') Maintenance.updateUI(Maintenance.isActive);
        if (window.Auth && typeof Auth.updateHeaderUI === 'function') Auth.updateHeaderUI();

        if (Home.activeCategory && Home.activeCategory !== 'Semua') {
            if (Home.activeCategory === 'Developer Profile') {
                Home.renderDeveloperProfileView();
            } else {
                Home.displayCategoryView();
            }
        } else {
            var defView = gid('home-default-view'), catView = gid('home-category-view');
            if (defView) defView.style.display = 'block';
            if (catView) catView.style.display = 'none';

            // Show immediate cached/default data without delay
            Home.show();
            // Fetch fresh updates in the background
            Home.fetch();
        }
    },

    selectCategory(catName) {
        if (Home.activeCategory === catName && catName !== 'Semua') {
            catName = 'Semua';
        }

        if (!catName || catName === 'Semua') {
            Home.activeCategory = null;
            var bar = gid('home-category-bar');
            if (bar) {
                bar.querySelectorAll('.home-chip-btn').forEach(function(btn, i) {
                    var c = Home.categories[i];
                    var isAct = (c && c.name === 'Semua');
                    btn.className = 'home-chip-btn px-4 py-2 rounded-full text-xs whitespace-nowrap transition-all duration-200 ease-out flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ' + (isAct
                        ? 'bg-white text-black font-extrabold shadow-md shadow-white/20 border border-white scale-[1.03]'
                        : 'bg-white/[0.08] hover:bg-white/[0.14] active:bg-white/[0.18] text-white/85 hover:text-white border border-white/20 hover:border-white/35 font-medium backdrop-blur-md');
                });
            }
            var defView = gid('home-default-view'), catView = gid('home-category-view');
            if (defView) defView.style.display = 'block';
            if (catView) catView.style.display = 'none';
            Home.show();
            return;
        }

        Home.activeCategory = catName;
        var bar = gid('home-category-bar');
        if (bar) {
            bar.querySelectorAll('.home-chip-btn').forEach(function(btn, i) {
                var c = Home.categories[i];
                var isAct = (c && c.name === catName);
                btn.className = 'home-chip-btn px-4 py-2 rounded-full text-xs whitespace-nowrap transition-all duration-200 ease-out flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ' + (isAct
                    ? 'bg-white text-black font-extrabold shadow-md shadow-white/20 border border-white scale-[1.03]'
                    : 'bg-white/[0.08] hover:bg-white/[0.14] active:bg-white/[0.18] text-white/85 hover:text-white border border-white/20 hover:border-white/35 font-medium backdrop-blur-md');
            });
        }

        Home.fetchCategoryData(catName);
    },

    playSection(sectionKey, startIndex) {
        var list = Home.sections[sectionKey] || [];
        if (!list || list.length === 0) return;
        PK(sectionKey, startIndex || 0);
    },

    toggleTop50Expand() {
        Home.top50Expanded = !Home.top50Expanded;
        var btn = gid('btn-toggle-top50-expand');
        if (btn) {
            btn.innerHTML = Home.top50Expanded
                ? '<i data-lucide="chevron-up" class="w-4 h-4"></i><span>Tutup Tangga Lagu</span>'
                : '<i data-lucide="chevron-down" class="w-4 h-4"></i><span>Lihat Seluruh Tangga Lagu (Top 50)</span>';
        }
        Home.renderTop50List();
        lucide.createIcons();
    },

    async fetch() {
        if (!navigator.onLine) return;
        try {
            var res = await fetch(API.homeSections || '/api/home-sections');
            var data = await res.json();
            if (data && data.status && data.sections) {
                Object.keys(data.sections).forEach(function(k) {
                    if (Array.isArray(data.sections[k]) && data.sections[k].length > 0) {
                        Home.sections[k] = deepFreeze(data.sections[k]);
                    }
                });

                if (typeof S !== 'undefined') {
                    S.homeSections = Home.sections;
                    S.ht = Home.sections.pilihan_cepat || [];
                    S.ha = Home.sections.artis_populer || [];
                    S.hp = Home.sections.playlist_komunitas || [];
                    try {
                        deepFreeze(S.homeSections);
                        deepFreeze(S.ht);
                        deepFreeze(S.ha);
                        deepFreeze(S.hp);
                    } catch(e) {}
                }

                try {
                    localStorage.setItem('musifystar_home_sections_cache_v4', JSON.stringify(Home.sections));
                } catch(e) {}

                Home.show();
            }
        } catch (e) {
            console.warn('[Home] Background sync failed:', e.message);
        }
    },

    // Renders all 10 requested sections into the DOM
    show() {
        if (Home.activeCategory && Home.activeCategory !== 'Semua') {
            if (Home.activeCategory === 'Developer Profile') {
                Home.renderDeveloperProfileView();
            } else {
                Home.displayCategoryView();
            }
            return;
        }

        var defView = gid('home-default-view');
        if (!defView) return;

        // 1. Pilihan Cepat Untukmu (Grid 2-col on mobile / 4-col on desktop)
        var elPilihanCepat = gid('home-section-pilihan-cepat');
        if (elPilihanCepat) {
            var items1 = (Home.sections.pilihan_cepat || []).slice(0, 8);
            if (items1.length > 0) {
                elPilihanCepat.innerHTML = items1.map(function(t, i) {
                    return Home.buildCardHtml('pilihan_cepat', t, i, 'grid');
                }).join('');
            } else {
                elPilihanCepat.innerHTML = '<p class="text-white/50 text-xs py-4 col-span-2">Memuat lagu pilihan...</p>';
            }
        }

        // 2. Pilihan Terpopuler Hari Ini (Horizontal scroll)
        var elTerpopuler = gid('home-section-terpopuler');
        if (elTerpopuler) {
            var items2 = (Home.sections.terpopuler_hari_ini || []).slice(0, 10);
            elTerpopuler.innerHTML = items2.map(function(t, i) {
                return Home.buildCardHtml('terpopuler_hari_ini', t, i, 'card', { 
                    badgeHtml: '<span class="inline-flex items-center gap-1"><span class="w-1 h-1 rounded-full bg-orange-400"></span><span class="font-bold text-[8px] tracking-wide text-white/90">#' + (i + 1) + '</span></span>' 
                });
            }).join('');
        }

        // 3. Viral di TikTok
        var elViral = gid('home-section-viral-tiktok');
        if (elViral) {
            var items3 = (Home.sections.viral_tiktok || []).slice(0, 10);
            elViral.innerHTML = items3.map(function(t, i) {
                return Home.buildCardHtml('viral_tiktok', t, i, 'card', { 
                    badgeHtml: '<span class="inline-flex items-center gap-1"><span class="w-1 h-1 rounded-full bg-pink-500"></span><span class="font-bold text-[8px] tracking-wide text-pink-200">FYP</span></span>' 
                });
            }).join('');
        }

        // 4. Trending Sekarang
        var elTrending = gid('home-section-trending');
        if (elTrending) {
            var items4 = (Home.sections.trending_sekarang || []).slice(0, 10);
            elTrending.innerHTML = items4.map(function(t, i) {
                return Home.buildCardHtml('trending_sekarang', t, i, 'card', { 
                    badgeHtml: '<span class="inline-flex items-center gap-1"><span class="w-1 h-1 rounded-full bg-emerald-400"></span><span class="font-bold text-[8px] tracking-wide text-emerald-200">TRENDING</span></span>' 
                });
            }).join('');
        }

        // 5. Rilis Terbaru & Populer
        var elRilis = gid('home-section-rilis-terbaru');
        if (elRilis) {
            var items5 = (Home.sections.rilis_terbaru || []).slice(0, 10);
            elRilis.innerHTML = items5.map(function(t, i) {
                return Home.buildCardHtml('rilis_terbaru', t, i, 'card', { 
                    badgeHtml: '<span class="inline-flex items-center gap-1"><span class="w-1 h-1 rounded-full bg-cyan-400"></span><span class="font-bold text-[8px] tracking-wide text-cyan-200">BARU</span></span>' 
                });
            }).join('');
        }

        // 6. Top 50 Indonesia (Podium + Numbered List)
        Home.renderTop50Podium();
        Home.renderTop50List();

        // 7. Santai & Akustik
        var elSantai = gid('home-section-santai-akustik');
        if (elSantai) {
            var items7 = (Home.sections.santai_akustik || []).slice(0, 10);
            elSantai.innerHTML = items7.map(function(t, i) {
                return Home.buildCardHtml('santai_akustik', t, i, 'card', { 
                    badgeHtml: '<span class="inline-flex items-center gap-1"><span class="w-1 h-1 rounded-full bg-amber-400"></span><span class="font-bold text-[8px] tracking-wide text-amber-200">AKUSTIK</span></span>' 
                });
            }).join('');
        }

        // 8. Nostalgia Indonesia
        var elNostalgia = gid('home-section-nostalgia-indo');
        if (elNostalgia) {
            var items8 = (Home.sections.nostalgia_indo || []).slice(0, 10);
            elNostalgia.innerHTML = items8.map(function(t, i) {
                return Home.buildCardHtml('nostalgia_indo', t, i, 'card', { 
                    badgeHtml: '<span class="inline-flex items-center gap-1"><span class="w-1 h-1 rounded-full bg-indigo-400"></span><span class="font-bold text-[8px] tracking-wide text-indigo-200">KLASIK</span></span>' 
                });
            }).join('');
        }

        // 9. Playlist Komunitas
        Home.renderCommunityPlaylists();

        // 10. Artis Populer
        Home.renderPopularArtists();

        lucide.createIcons();
        Home.renderActive();
        if (typeof hideSplashScreen === 'function') {
            setTimeout(hideSplashScreen, 100);
        }
        setTimeout(function() {
            if (typeof Home.prefetchTopTracks === 'function') {
                Home.prefetchTopTracks();
            }
        }, 1200);
    },

    prefetchTopTracks() {
        try {
            if (typeof prefetchTrackAudio !== 'function') return;
            var list = (Home.sections && Home.sections.pilihan_cepat) || [];
            if (!list.length) list = (Home.sections && Home.sections.terpopuler_hari_ini) || [];
            var toPrefetch = list.slice(0, 4);
            toPrefetch.forEach(function(item, idx) {
                setTimeout(function() {
                    if (typeof prefetchTrackAudio === 'function') {
                        prefetchTrackAudio(item);
                    }
                }, 1000 + (idx * 1500));
            });
        } catch (e) {}
    },

    retryConnection() {
        if (navigator.onLine) {
            showToast('Koneksi internet terhubung kembali! Memuat beranda...');
            Home.render();
            if (typeof App !== 'undefined') App.loadBroadcast();
        } else {
            showToast('Sinyal masih terputus. Pastikan WiFi atau data seluler Anda aktif.');
        }
    },

    renderTop50Podium() {
        var el = gid('home-section-top50-podium');
        if (!el) return;
        var top3 = (Home.sections.top_50_indo || []).slice(0, 3);
        if (top3.length === 0) {
            el.innerHTML = '';
            return;
        }

        var medals = [
            { rank: 1, label: 'JUARA 1', color: 'from-amber-400 to-yellow-500', text: 'text-amber-300', border: 'border-yellow-400/50', icon: 'crown' },
            { rank: 2, label: 'JUARA 2', color: 'from-slate-200 to-zinc-400', text: 'text-slate-200', border: 'border-slate-300/40', icon: 'medal' },
            { rank: 3, label: 'JUARA 3', color: 'from-amber-600 to-amber-700', text: 'text-amber-400', border: 'border-amber-600/40', icon: 'award' }
        ];

        el.innerHTML = top3.map(function(t, idx) {
            var m = medals[idx] || medals[0];
            var isCur = S.ct && (S.ct.id === t.id || S.ct.videoId === t.id || (S.ct.title === t.title && S.ct.artist === t.artist));
            var isPlay = isCur && S.ip;
            var isLoad = isCur && S.il;

            var playIconHtml = '';
            if (isLoad) {
                playIconHtml = '<div class="w-7 h-7 rounded-full btn-chrome flex items-center justify-center shrink-0 shadow-md"><div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>';
            } else if (isPlay) {
                playIconHtml = '<div class="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center shrink-0 shadow-md ring-1 ring-white scale-105"><div class="flex items-end justify-center gap-[1.5px] w-3 h-3 pb-0.5"><span class="w-[2px] bg-black rounded-full animate-eq-1"></span><span class="w-[2px] bg-black rounded-full animate-eq-2"></span><span class="w-[2px] bg-black rounded-full animate-eq-3"></span></div></div>';
            } else if (isCur) {
                playIconHtml = '<div class="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center shrink-0 shadow-md border border-white"><svg class="w-3.5 h-3.5 fill-current ml-0.5" viewBox="0 0 24 24"><polygon points="6 3 20 12 6 21 6 3"/></svg></div>';
            } else {
                playIconHtml = '<div class="w-7 h-7 rounded-full bg-white/10 group-hover:bg-white/30 flex items-center justify-center shrink-0 text-white transition-all shadow-sm border border-white/10"><svg class="w-3.5 h-3.5 fill-current ml-0.5" viewBox="0 0 24 24"><polygon points="6 3 20 12 6 21 6 3"/></svg></div>';
            }

            var cardBg = isPlay 
                ? 'bg-white/20 border-yellow-400 shadow-lg shadow-yellow-500/20' 
                : (isCur ? 'bg-white/15 border-white/30' : 'bg-white/[0.08] hover:bg-white/[0.14] border-white/20 hover:border-white/35 shadow-sm');

            var vid = t.videoId || t.id || '';
            return '<div onclick="PK(\'top_50_indo\','+idx+')" onpointerdown="if(typeof prefetchTrackAudio===\'function\')prefetchTrackAudio(\''+vid+'\')" onpointerenter="if(typeof prefetchTrackAudio===\'function\')prefetchTrackAudio(\''+vid+'\')" data-section="top_50_indo" data-idx="'+idx+'" class="home-section-card group relative p-1.5 pr-3.5 sm:p-2 sm:pr-4 rounded-full '+ cardBg +' border backdrop-blur-md transition-all duration-200 cursor-pointer flex items-center gap-3 active:scale-95 select-none">' +
                '<div class="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden shadow-sm shrink-0 border border-white/20 bg-black/40">' +
                    '<img src="'+toWebp(t.cover||FI)+'" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onerror="handleImgError(this)" />' +
                    '<div class="absolute bottom-0 inset-x-0 bg-black/75 backdrop-blur-md text-[8.5px] font-black '+m.text+' flex items-center justify-center gap-0.5 border-t border-white/20 py-0.5 leading-none">' +
                        '#' + (idx + 1) +
                    '</div>' +
                '</div>' +
                '<div class="min-w-0 flex-1">' +
                    '<span class="text-[9px] font-black uppercase tracking-wider '+m.text+' block mb-0.5 leading-none">' + m.label + '</span>' +
                    '<h3 class="font-bold text-xs sm:text-sm truncate '+(isCur?'text-white font-black':'text-white/90')+'">' + es(t.title) + '</h3>' +
                    '<p class="text-[11px] text-white/60 truncate mt-0.5">' + es(t.artist) + '</p>' +
                '</div>' +
                '<div class="home-card-icon shrink-0">' + playIconHtml + '</div>' +
            '</div>';
        }).join('');
        lucide.createIcons();
    },

    renderTop50List() {
        var el = gid('home-section-top50-list');
        if (!el) return;
        var allTracks = Home.sections.top_50_indo || [];
        var sliceEnd = Home.top50Expanded ? 50 : 10;
        var listTracks = allTracks.slice(3, sliceEnd);

        if (listTracks.length === 0) {
            el.innerHTML = '';
            return;
        }

        el.innerHTML = listTracks.map(function(t, i) {
            var actualIndex = i + 3;
            var rankNum = actualIndex + 1;
            var isCur = S.ct && (S.ct.id === t.id || S.ct.videoId === t.id || (S.ct.title === t.title && S.ct.artist === t.artist));
            var isPlay = isCur && S.ip;
            var isLoad = isCur && S.il;

            var playIconHtml = '';
            if (isLoad) {
                playIconHtml = '<div class="w-7 h-7 rounded-full btn-chrome flex items-center justify-center shrink-0"><div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>';
            } else if (isPlay) {
                playIconHtml = '<div class="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center shrink-0 shadow-sm ring-1 ring-white"><div class="flex items-end justify-center gap-[1px] w-3 h-3 pb-0.5"><span class="w-[1.5px] bg-black rounded-full animate-eq-1"></span><span class="w-[1.5px] bg-black rounded-full animate-eq-2"></span><span class="w-[1.5px] bg-black rounded-full animate-eq-3"></span></div></div>';
            } else if (isCur) {
                playIconHtml = '<div class="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center shrink-0 border border-white"><svg class="w-3 h-3 fill-current ml-0.5" viewBox="0 0 24 24"><polygon points="6 3 20 12 6 21 6 3"/></svg></div>';
            } else {
                playIconHtml = '<div class="w-7 h-7 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center shrink-0 text-white/80 group-hover:text-white transition-all border border-white/10"><svg class="w-3 h-3 fill-current ml-0.5" viewBox="0 0 24 24"><polygon points="6 3 20 12 6 21 6 3"/></svg></div>';
            }

            var cardBg = isPlay 
                ? 'bg-white/20 border-white/40 shadow-lg shadow-white/10' 
                : (isCur ? 'bg-white/15 border-white/30' : 'bg-white/[0.08] hover:bg-white/[0.14] border-white/20 hover:border-white/35 shadow-sm');

            var vid = t.videoId || t.id || '';
            return '<div onclick="PK(\'top_50_indo\','+actualIndex+')" onpointerdown="if(typeof prefetchTrackAudio===\'function\')prefetchTrackAudio(\''+vid+'\')" onpointerenter="if(typeof prefetchTrackAudio===\'function\')prefetchTrackAudio(\''+vid+'\')" data-section="top_50_indo" data-idx="'+actualIndex+'" class="home-section-card group rounded-full p-1.5 pr-3.5 sm:p-2 sm:pr-4 flex items-center gap-2.5 sm:gap-3 cursor-pointer '+ cardBg +' border backdrop-blur-md transition-all duration-200 active:scale-95 select-none my-1">' +
                '<span class="w-6 text-center text-xs font-black text-white/50 group-hover:text-white shrink-0 font-mono">' + rankNum + '</span>' +
                '<div class="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden shrink-0 shadow-sm border border-white/20 bg-black/40 relative">' +
                    '<img src="'+toWebp(t.cover||FI)+'" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onerror="handleImgError(this)" />' +
                '</div>' +
                '<div class="min-w-0 flex-1">' +
                    '<h4 class="text-xs sm:text-sm font-bold truncate '+(isCur?'text-white font-black':'text-white/90')+'">' + es(t.title) + '</h4>' +
                    '<p class="text-[11px] text-white/60 truncate mt-0.5">' + es(t.artist) + '</p>' +
                '</div>' +
                (t.duration ? '<span class="text-[11px] text-white/50 hidden sm:inline-block shrink-0 px-2 font-mono font-medium">' + es(String(t.duration).replace('.', ':')) + '</span>' : '') +
                '<div class="home-card-icon shrink-0">' + playIconHtml + '</div>' +
            '</div>';
        }).join('');
        lucide.createIcons();
    },

    renderCommunityPlaylists() {
        var el = gid('home-section-playlist-komunitas');
        if (!el) return;

        var userPls = typeof getUserPlaylists === 'function' ? getUserPlaylists() : [];
        var curPls = Home.sections.playlist_komunitas || Home.defaultCommunityPlaylists;

        var html = '';

        // Action: Buat Playlist Baru
        html += '<div onclick="if(typeof Library !== \'undefined\') Library.createNew()" class="flex-shrink-0 w-36 sm:w-44 cursor-pointer active:scale-95 transition-all group snap-start">' +
            '<div class="p-3 rounded-2xl bg-white/[0.03] border border-dashed border-white/20 shadow-xl group-hover:border-white/50 group-hover:bg-white/[0.07] transition-all flex flex-col items-center justify-center aspect-square mb-2">' +
                '<div class="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white group-hover:scale-110 transition-transform mb-2">' +
                    '<i data-lucide="plus" class="w-6 h-6"></i>' +
                '</div>' +
                '<span class="text-xs font-bold text-white text-center">Buat Playlist</span>' +
                '<span class="text-[10px] text-white/50 text-center mt-0.5">Koleksi pribadimu</span>' +
            '</div>' +
        '</div>';

        // User Playlists
        userPls.forEach(function(p) {
            var coverImg = p.image || (p.songs && p.songs.length > 0 ? p.songs[0].cover : FI);
            html += '<div onclick="Library.open(\''+p.id+'\')" class="flex-shrink-0 w-36 sm:w-44 cursor-pointer active:scale-95 transition-all group snap-start select-none">' +
                '<div class="p-2.5 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/20 hover:border-white/35 backdrop-blur-xl shadow-sm transition-all flex flex-col">' +
                    '<div class="w-full aspect-square rounded-xl overflow-hidden relative shadow-md mb-2 border border-white/10 bg-black/40">' +
                        '<img src="'+coverImg+'" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onerror="this.src=\''+FI+'\'" />' +
                        '<div class="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-rose-500/80 backdrop-blur-md text-[9px] font-black text-white uppercase tracking-wider">Playlist Kamu</div>' +
                    '</div>' +
                    '<h3 class="font-bold text-xs sm:text-sm text-white truncate px-0.5">' + es(p.name) + '</h3>' +
                    '<p class="text-[11px] text-white/60 truncate mt-0.5 px-0.5">' + (p.songs ? p.songs.length : 0) + ' lagu</p>' +
                '</div>' +
            '</div>';
        });

        // Curated Community Playlists
        curPls.forEach(function(p) {
            html += '<div onclick="Album.open(\''+p.id+'\', \''+(p.cover||FI)+'\', \''+esJs(p.title)+'\')" class="flex-shrink-0 w-36 sm:w-44 cursor-pointer active:scale-95 transition-all group snap-start select-none">' +
                '<div class="p-2.5 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/20 hover:border-white/35 backdrop-blur-xl shadow-sm transition-all flex flex-col">' +
                    '<div class="w-full aspect-square rounded-xl overflow-hidden relative shadow-md mb-2 border border-white/10 bg-black/40">' +
                        '<img src="'+(p.cover||FI)+'" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onerror="handleImgError(this)" />' +
                        (p.badge ? '<div class="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[9px] font-bold text-white border border-white/20">' + es(p.badge) + '</div>' : '') +
                        '<div class="absolute bottom-2 right-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all shadow-black/40">' +
                            '<i data-lucide="play" class="w-4 h-4 text-white fill-current ml-0.5"></i>' +
                        '</div>' +
                    '</div>' +
                    '<h3 class="font-bold text-xs sm:text-sm text-white truncate px-0.5">' + es(p.title) + '</h3>' +
                    '<p class="text-[11px] text-white/60 truncate mt-0.5 px-0.5">' + es(p.artist || p.creator || 'Komunitas') + '</p>' +
                '</div>' +
            '</div>';
        });

        el.innerHTML = html;
    },

    renderPopularArtists() {
        var el = gid('home-section-artis-populer');
        if (!el) return;
        var artists = Home.sections.artis_populer || Home.defaultArtists;
        if (artists.length === 0) {
            el.innerHTML = '';
            return;
        }

        el.innerHTML = artists.map(function(p) {
            var imgUrl = toWebp(p.cover) || (typeof FA !== 'undefined' ? FA : FI);
            return '<div onclick="Artist.open(\''+p.id+'\', \''+esJs(p.name||p.title)+'\', \''+(p.cover||'')+'\')" class="flex-shrink-0 w-28 sm:w-32 cursor-pointer active:scale-95 transition-all group snap-start select-none">' +
                '<div class="p-2.5 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/20 hover:border-white/35 backdrop-blur-xl shadow-sm transition-all flex flex-col items-center">' +
                    '<div class="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden relative shadow-md mb-2 border-2 border-white/20 bg-black/40 group-hover:border-purple-400 group-hover:scale-105 transition-all duration-300">' +
                        '<img src="'+imgUrl+'" class="artist-photo w-full h-full object-cover" referrerpolicy="no-referrer" loading="lazy" onerror="handleImgError(this)" />' +
                    '</div>' +
                    '<h3 class="font-bold text-center text-xs text-white truncate w-full px-0.5">' + es(p.name||p.title) + '</h3>' +
                    '<span class="text-[10px] text-purple-300 font-semibold mt-0.5 uppercase tracking-wider flex items-center gap-1">' +
                        '<i data-lucide="check-circle-2" class="w-2.5 h-2.5"></i> ' + es(p.badge || 'Artist') +
                    '</span>' +
                '</div>' +
            '</div>';
        }).join('');
    },

    // Generates a standardized card HTML for songs
    buildCardHtml(sectionKey, t, i, mode, opts) {
        opts = opts || {};
        var isCur = S.ct && (
            S.ct.id === t.id ||
            S.ct.videoId === t.id ||
            (S.ct.id && t.videoId && S.ct.id === t.videoId) ||
            (S.ct.videoId && t.id && S.ct.videoId === t.id) ||
            (S.ct.title === t.title && S.ct.artist === t.artist)
        );
        var isPlay = isCur && S.ip;
        var isLoad = isCur && S.il;

        var playIconHtml = '';
        if (isLoad) {
            playIconHtml = '<div class="w-7 h-7 rounded-full btn-chrome flex items-center justify-center shrink-0 ml-auto"><div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>';
        } else if (isPlay) {
            playIconHtml = '<div class="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center shrink-0 ml-auto shadow-white/30 ring-2 ring-white scale-105"><div class="flex items-end justify-center gap-[2px] w-3.5 h-3.5 pb-0.5"><span class="w-[2px] bg-black rounded-full animate-eq-1"></span><span class="w-[2px] bg-black rounded-full animate-eq-2"></span><span class="w-[2px] bg-black rounded-full animate-eq-3"></span></div></div>';
        } else if (isCur) {
            playIconHtml = '<div class="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center shrink-0 ml-auto border border-white"><svg class="w-3.5 h-3.5 fill-current ml-0.5" viewBox="0 0 24 24"><polygon points="6 3 20 12 6 21 6 3"/></svg></div>';
        } else {
            playIconHtml = '<div class="w-7 h-7 rounded-full bg-white/5 group-hover:bg-white/20 flex items-center justify-center shrink-0 ml-auto text-white transition-all"><svg class="w-3.5 h-3.5 fill-current ml-0.5" viewBox="0 0 24 24"><polygon points="6 3 20 12 6 21 6 3"/></svg></div>';
        }

        var cardBg = isPlay 
            ? 'bg-white/20 border-white/40 shadow-lg shadow-white/10' 
            : (isCur ? 'bg-white/15 border-white/30' : 'bg-white/[0.08] hover:bg-white/[0.14] border-white/20 hover:border-white/35 shadow-sm');

        var cardVid = t.videoId || t.id || '';
        var prefetchAttr = cardVid ? ' onpointerdown="if(typeof prefetchTrackAudio===\'function\')prefetchTrackAudio(\''+cardVid+'\')" onpointerenter="if(typeof prefetchTrackAudio===\'function\')prefetchTrackAudio(\''+cardVid+'\')"' : '';

        if (mode === 'grid') {
            return '<div onclick="PK(\''+sectionKey+'\','+i+')"' + prefetchAttr + ' data-section="'+sectionKey+'" data-idx="'+i+'" class="home-section-card '+cardBg+' border rounded-full p-1.5 pr-3.5 sm:p-2 sm:pr-4 flex items-center gap-3 cursor-pointer active:scale-95 transition-all duration-200 group backdrop-blur-md select-none">' +
                '<div class="w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden shrink-0 shadow-sm border border-white/20 bg-black/40 relative">' +
                    '<img src="'+(t.cover||FI)+'" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onerror="this.src=\''+FI+'\'" />' +
                '</div>' +
                '<div class="min-w-0 flex-1">' +
                    '<h3 class="home-card-title font-bold text-xs sm:text-sm truncate '+(isCur?'text-white font-black':'text-white/90')+'">'+es(t.title)+'</h3>' +
                    '<p class="text-[11px] text-white/60 truncate mt-0.5">'+es(t.artist)+'</p>' +
                '</div>' +
                '<div class="home-card-icon shrink-0">'+playIconHtml+'</div>' +
            '</div>';
        }

        // Horizontal Card
        var badgeRender = '';
        if (opts.badgeHtml) {
            badgeRender = '<div class="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-[6px] bg-black/75 backdrop-blur-md border border-white/15 text-[8px] font-bold text-white shadow-sm flex items-center leading-none">' + opts.badgeHtml + '</div>';
        } else if (opts.badge) {
            badgeRender = '<div class="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-[6px] bg-black/75 backdrop-blur-md border border-white/15 text-[8px] font-bold text-white shadow-sm flex items-center leading-none">' + es(opts.badge) + '</div>';
        }

        return '<div onclick="PK(\''+sectionKey+'\','+i+')"' + prefetchAttr + ' data-section="'+sectionKey+'" data-idx="'+i+'" class="home-section-card flex-shrink-0 w-36 sm:w-40 cursor-pointer active:scale-95 transition-all group snap-start select-none">' +
            '<div class="p-2.5 rounded-2xl '+cardBg+' border backdrop-blur-xl shadow-sm transition-all flex flex-col">' +
                '<div class="w-full aspect-square rounded-xl overflow-hidden relative shadow-md mb-2 border border-white/10 bg-black/40">' +
                    '<img src="'+(t.cover||FI)+'" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onerror="this.src=\''+FI+'\'" />' +
                    badgeRender +
                    '<div class="absolute bottom-1.5 right-1.5 home-card-icon">' + playIconHtml + '</div>' +
                '</div>' +
                '<h3 class="home-card-title font-bold text-xs sm:text-sm truncate px-0.5 '+(isCur?'text-white font-black':'text-white/90')+'">'+es(t.title)+'</h3>' +
                '<p class="text-[11px] text-white/60 truncate mt-0.5 px-0.5">'+es(t.artist)+'</p>' +
            '</div>' +
        '</div>';
    },

    // Updates play/pause icons & glowing states across all section cards
    renderActive() {
        if (Home.activeCategory && Home.activeCategory !== 'Semua') {
            Home.renderActiveCategory();
            return;
        }

        var cards = document.querySelectorAll('.home-section-card');
        cards.forEach(function(el) {
            var sKey = el.getAttribute('data-section');
            var sIdx = parseInt(el.getAttribute('data-idx'), 10);
            if (!sKey || isNaN(sIdx)) return;

            var list = Home.sections[sKey];
            if (!list || !list[sIdx]) return;
            var t = list[sIdx];

            var isCur = S.ct && (
                S.ct.id === t.id ||
                S.ct.videoId === t.id ||
                (S.ct.id && t.videoId && S.ct.id === t.videoId) ||
                (S.ct.videoId && t.id && S.ct.videoId === t.id) ||
                (S.ct.title === t.title && S.ct.artist === t.artist)
            );
            var isPlay = isCur && S.ip;
            var isLoad = isCur && S.il;

            if (sKey === 'top_50_indo') {
                var isPodium = sIdx < 3;
                var iconSize = isPodium ? 'w-7 h-7' : 'w-5 h-5';
                var iconInner = isPodium ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5';
                var topPlayIconHtml = '';
                if (isLoad) {
                    topPlayIconHtml = '<div class="'+iconSize+' rounded-full btn-chrome flex items-center justify-center shrink-0 shadow-lg"><div class="'+iconInner+' border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>';
                } else if (isPlay) {
                    topPlayIconHtml = '<div class="'+iconSize+' rounded-full bg-white text-black flex items-center justify-center shrink-0 shadow-lg ring-2 ring-white scale-105"><div class="flex items-end justify-center gap-[2px] '+iconInner+' pb-0.5"><span class="w-[2px] bg-black rounded-full animate-eq-1"></span><span class="w-[2px] bg-black rounded-full animate-eq-2"></span><span class="w-[2px] bg-black rounded-full animate-eq-3"></span></div></div>';
                } else if (isCur) {
                    topPlayIconHtml = '<div class="'+iconSize+' rounded-full bg-white text-black flex items-center justify-center shrink-0 shadow-lg border border-white"><svg class="'+iconInner+' fill-current ml-0.5" viewBox="0 0 24 24"><polygon points="6 3 20 12 6 21 6 3"/></svg></div>';
                } else {
                    topPlayIconHtml = '<div class="'+iconSize+' rounded-full '+(isPodium?'bg-white/10 group-hover:bg-white/30':'bg-white/5 group-hover:bg-white/20')+' flex items-center justify-center shrink-0 text-white transition-all shadow-md"><svg class="'+iconInner+' fill-current ml-0.5" viewBox="0 0 24 24"><polygon points="6 3 20 12 6 21 6 3"/></svg></div>';
                }

                var topIconWrap = el.querySelector('.home-card-icon');
                if (topIconWrap) topIconWrap.innerHTML = topPlayIconHtml;

                var titleH = el.querySelector('h3, h4');
                if (titleH) {
                    if (isCur) {
                        titleH.classList.add('text-yellow-300', 'font-black');
                        titleH.classList.remove('text-white');
                    } else {
                        titleH.classList.remove('text-yellow-300', 'font-black');
                        titleH.classList.add('text-white');
                    }
                }

                if (isPodium) {
                    if (isPlay) {
                        el.classList.add('border-yellow-400', 'shadow-xl', 'shadow-yellow-500/20');
                    } else if (isCur) {
                        el.classList.add('border-white/40');
                        el.classList.remove('border-yellow-400', 'shadow-xl', 'shadow-yellow-500/20');
                    } else {
                        el.classList.remove('border-yellow-400', 'shadow-xl', 'shadow-yellow-500/20', 'border-white/40');
                    }
                } else {
                    if (isPlay) {
                        el.classList.add('bg-[#343a4e]', 'border-white/40', 'shadow-lg');
                        el.classList.remove('bg-white/[0.03]', 'bg-[#2e3344]', 'border-white/5', 'border-white/30');
                    } else if (isCur) {
                        el.classList.add('bg-[#2e3344]', 'border-white/30');
                        el.classList.remove('bg-white/[0.03]', 'bg-[#343a4e]', 'border-white/5', 'border-white/40', 'shadow-lg');
                    } else {
                        el.classList.add('bg-white/[0.03]', 'border-white/5');
                        el.classList.remove('bg-[#343a4e]', 'bg-[#2e3344]', 'border-white/40', 'border-white/30', 'shadow-lg');
                    }
                }
                return;
            }

            var playIconHtml = '';
            if (isLoad) {
                playIconHtml = '<div class="w-7 h-7 rounded-full btn-chrome flex items-center justify-center shrink-0 ml-auto"><div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>';
            } else if (isPlay) {
                playIconHtml = '<div class="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center shrink-0 ml-auto shadow-white/30 ring-2 ring-white scale-105"><div class="flex items-end justify-center gap-[2px] w-3.5 h-3.5 pb-0.5"><span class="w-[2px] bg-black rounded-full animate-eq-1"></span><span class="w-[2px] bg-black rounded-full animate-eq-2"></span><span class="w-[2px] bg-black rounded-full animate-eq-3"></span></div></div>';
            } else if (isCur) {
                playIconHtml = '<div class="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center shrink-0 ml-auto border border-white"><svg class="w-3.5 h-3.5 fill-current ml-0.5" viewBox="0 0 24 24"><polygon points="6 3 20 12 6 21 6 3"/></svg></div>';
            } else {
                playIconHtml = '<div class="w-7 h-7 rounded-full bg-white/5 group-hover:bg-white/20 flex items-center justify-center shrink-0 ml-auto text-white transition-all"><svg class="w-3.5 h-3.5 fill-current ml-0.5" viewBox="0 0 24 24"><polygon points="6 3 20 12 6 21 6 3"/></svg></div>';
            }

            var iconWrap = el.querySelector('.home-card-icon');
            if (iconWrap) iconWrap.innerHTML = playIconHtml;

            var titleEl = el.querySelector('.home-card-title');
            if (titleEl) {
                titleEl.className = 'home-card-title font-bold text-xs sm:text-[13px] truncate ' + (isCur ? 'text-white font-black' : 'text-white/95');
            }

            // Update card border / background
            if (isPlay) {
                el.classList.add('bg-[#282b3a]', 'border-white/35', 'shadow-xl');
                el.classList.remove('bg-[#181920]', 'bg-[#202330]', 'border-white/[0.08]');
            } else if (isCur) {
                el.classList.add('bg-[#202330]', 'border-white/25');
                el.classList.remove('bg-[#181920]', 'bg-[#282b3a]', 'border-white/[0.08]');
            } else {
                el.classList.add('bg-[#181920]', 'border-white/[0.08]');
                el.classList.remove('bg-[#282b3a]', 'bg-[#202330]', 'border-white/35', 'border-white/25');
            }
        });
    },

    // Category Handling (Chill, Focus, Pop, Developer Profile, etc.)
    async fetchCategoryData(catName) {
        var defView = gid('home-default-view'), catView = gid('home-category-view');
        if (defView) defView.style.display = 'none';
        if (catView) {
            catView.style.display = 'block';
            catView.innerHTML = `
            <div class="mb-4 flex justify-between items-center bg-white/5 p-3.5 rounded-2xl border border-white/10 animate-pulse">
                <div class="flex items-center gap-2">
                    <span class="text-xs text-[#a0a5b0]">Kategori:</span>
                    <span class="font-bold text-sm text-white">${es(catName)}</span>
                </div>
                <button onclick="Home.selectCategory('Semua')" class="text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[#b3b3b3] hover:text-white transition-all flex items-center gap-1 cursor-pointer">
                    <i data-lucide="x" class="w-3.5 h-3.5"></i> Reset
                </button>
            </div>
            <div class="text-center py-12">
                <div class="w-10 h-10 border-3 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p class="text-xs text-[#a0a5b0] animate-pulse">Memuat musik ${es(catName)}...</p>
            </div>`;
            lucide.createIcons();
        }

        if (catName === 'Developer Profile') {
            try {
                var r = await fetch(API.search + '?query=' + encodeURIComponent('Dj Afthershock') + '&type=all');
                var d = await r.json();
                if (d.status && d.result) {
                    S.hc = d.result.songs ? d.result.songs.map(function(s) {
                        return {
                            id: s.videoId,
                            videoId: s.videoId,
                            title: cn(s.title),
                            artist: cn(s.artist),
                            artistId: s.artistId || '',
                            cover: toHDCover(s.thumbnail, s.videoId),
                            ytUrl: s.url
                        };
                    }) : [];
                    S.hcp = [].concat(d.result.albums || []).concat(d.result.playlists || []);
                } else { S.hc = []; S.hcp = []; }
            } catch(e) { S.hc = []; S.hcp = []; }

            Home.renderDeveloperProfileView();
            return;
        }

        var query = catName + ' Music';
        if (catName === 'Acoustic') query = 'Acoustic Songs Hits';
        else if (catName === 'Chill') query = 'Chill Vibes Lofi Songs';
        else if (catName === 'Focus') query = 'Focus Deep Work Music';
        else if (catName === 'Commute') query = 'Driving Roadtrip Music';
        else if (catName === 'Gaming') query = 'Gaming EDM Hype Songs';
        else if (catName === 'Energize') query = 'Energetic Workout Beats';
        else if (catName === 'Party') query = 'Party Dance Hits';
        else if (catName === 'Feel good') query = 'Feel Good Happy Songs';
        else if (catName === 'Romance') query = 'Romantic Love Songs';
        else if (catName === 'Workout') query = 'Gym Workout Motivation Music';
        else if (catName === 'Sleep') query = 'Sleeping Calming Relaxation Music';
        else if (catName === 'Sad') query = 'Sad Melancholic Songs';
        else if (catName === 'Happy') query = 'Upbeat Happy Songs';
        else if (catName === 'Nostalgia') query = '2000s Hits Nostalgia Songs';

        try {
            var r = await fetch(API.search + '?query=' + encodeURIComponent(query) + '&type=all');
            var d = await r.json();
            if (d.status) {
                S.hc = d.result.songs ? d.result.songs.map(function(s) {
                    return {
                        id: s.videoId,
                        videoId: s.videoId,
                        title: cn(s.title),
                        artist: cn(s.artist),
                        artistId: s.artistId || '',
                        cover: toHDCover(s.thumbnail, s.videoId),
                        ytUrl: s.url
                    };
                }) : [];
                S.hcp = [].concat(d.result.playlists || []).concat(d.result.albums || []);
                S.hca = d.result.artists || [];
            }
        } catch(e) { S.hc = []; S.hcp = []; S.hca = []; }

        Home.displayCategoryView();
    },

    displayCategoryView() {
        var defView = gid('home-default-view'), catView = gid('home-category-view');
        if (defView) defView.style.display = 'none';
        if (catView) catView.style.display = 'block';
        if (!catView) return;

        var catName = Home.activeCategory || 'Kategori';

        var songsHtml = '';
        if (S.hc && S.hc.length > 0) {
            songsHtml = S.hc.map(function(t, i) {
                var isCur = S.ct && (
                    S.ct.id === t.id ||
                    S.ct.videoId === t.id ||
                    (S.ct.id && t.videoId && S.ct.id === t.videoId) ||
                    (S.ct.videoId && t.id && S.ct.videoId === t.id) ||
                    (S.ct.title === t.title && S.ct.artist === t.artist)
                );
                var isPlay = isCur && S.ip;
                var isLoad = isCur && S.il;

                var playIconHtml = '';
                if (isLoad) {
                    playIconHtml = '<div class="w-7 h-7 rounded-full btn-chrome flex items-center justify-center shrink-0 ml-auto"><div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>';
                } else if (isPlay) {
                    playIconHtml = '<div class="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center shrink-0 ml-auto ring-2 ring-white scale-105"><div class="flex items-end justify-center gap-[2px] w-3.5 h-3.5 pb-0.5"><span class="w-[2px] bg-black rounded-full animate-eq-1"></span><span class="w-[2px] bg-black rounded-full animate-eq-2"></span><span class="w-[2px] bg-black rounded-full animate-eq-3"></span></div></div>';
                } else if (isCur) {
                    playIconHtml = '<div class="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center shrink-0 ml-auto border border-white"><i data-lucide="pause" class="w-3.5 h-3.5 fill-current"></i></div>';
                } else {
                    playIconHtml = '<div class="w-7 h-7 rounded-full bg-white/5 group-hover:bg-white/20 flex items-center justify-center shrink-0 ml-auto text-white transition-all"><i data-lucide="play" class="w-3.5 h-3.5 fill-current ml-0.5"></i></div>';
                }

                var cardBg = isPlay 
                    ? 'bg-white/20 border-white/40 shadow-lg shadow-white/10' 
                    : (isCur ? 'bg-white/15 border-white/30' : 'bg-white/[0.08] hover:bg-white/[0.14] border-white/20 hover:border-white/35 shadow-sm');

                var catVid = t.videoId || t.id || '';
                return '<div onclick="PK(\'homecat\','+i+')" onpointerdown="if(typeof prefetchTrackAudio===\'function\')prefetchTrackAudio(\''+catVid+'\')" onpointerenter="if(typeof prefetchTrackAudio===\'function\')prefetchTrackAudio(\''+catVid+'\')" class="home-cat-card group '+ cardBg +' border rounded-full flex items-center gap-3 p-1.5 pr-3.5 sm:p-2 sm:pr-4 cursor-pointer active:scale-95 transition-all duration-200 backdrop-blur-md select-none">'+
                    '<div class="w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden shrink-0 shadow-sm border border-white/20 bg-black/40 relative">'+
                        '<img src="'+t.cover+'" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onerror="this.src=\''+FI+'\'" />'+
                    '</div>'+
                    '<div class="truncate flex-1 min-w-0"><h3 class="font-bold text-xs sm:text-sm truncate '+(isCur?'text-white font-black':'text-white/90')+'">'+es(t.title)+'</h3><p class="text-white/60 text-[11px] truncate mt-0.5">'+es(t.artist)+'</p></div>'+
                    '<div class="home-cat-icon ml-auto">'+playIconHtml+'</div>'+
                '</div>';
            }).join('');
        } else {
            songsHtml = '<p class="text-center text-white/70 text-sm py-8 col-span-2">Tidak ada lagu ditemukan untuk kategori ini</p>';
        }

        var plistHtml = '';
        if (S.hcp && S.hcp.length > 0) {
            plistHtml = S.hcp.slice(0, 10).map(function(p, i) {
                return '<div onclick="Album.open(\''+p.id+'\', \''+(p.cover||FI)+'\', \''+esJs(p.title)+'\')" class="flex-shrink-0 w-36 cursor-pointer active:scale-95 group p-2.5 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/20 hover:border-white/35 backdrop-blur-md shadow-sm transition-all flex flex-col select-none"><div class="w-full aspect-square mb-2 relative rounded-xl overflow-hidden shadow-md bg-black/40"><img src="'+(p.cover||FI)+'" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onerror="handleImgError(this)" /></div><h3 class="font-bold text-xs truncate text-white px-0.5">'+es(p.title)+'</h3><p class="text-white/60 text-[10px] truncate mt-0.5 px-0.5">'+es(p.artist)+'</p></div>';
            }).join('');
        }

        catView.innerHTML = `
        <div class="space-y-6 pb-6">
            <div class="flex justify-between items-center bg-white/[0.08] p-3 rounded-full border border-white/20 backdrop-blur-md shadow-sm px-4">
                <div class="flex items-center gap-2">
                    <span class="text-xs text-white/60">Kategori:</span>
                    <span class="font-extrabold text-xs text-white bg-white/15 px-3 py-1 rounded-full border border-white/25">${es(catName)}</span>
                </div>
                <button onclick="Home.selectCategory('Semua')" class="text-xs px-3.5 py-1.5 rounded-full bg-white text-black font-extrabold shadow-md shadow-white/20 hover:bg-white/90 transition-all flex items-center gap-1 active:scale-95 cursor-pointer">
                    <i data-lucide="x" class="w-3.5 h-3.5"></i> Reset
                </button>
            </div>

            <div>
                <h2 class="text-base font-bold mb-3 flex items-center gap-2 text-white">
                    <i data-lucide="music" class="w-4 h-4 text-emerald-400"></i>
                    <span>Lagu Populer - ${es(catName)}</span>
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">${songsHtml}</div>
            </div>

            ${plistHtml ? `<div>
                <h2 class="text-base font-bold mb-3 flex items-center gap-2 text-white">
                    <i data-lucide="disc" class="w-4 h-4 text-purple-400"></i>
                    <span>Playlist & Album ${es(catName)}</span>
                </h2>
                <div class="flex gap-3 overflow-x-auto hide-scrollbar pb-3">${plistHtml}</div>
            </div>` : ''}
        </div>`;

        lucide.createIcons();
        Home.renderActiveCategory();
    },

    renderActiveCategory() {
        var catView = gid('home-category-view');
        if (!catView || !S.hc) return;

        var cards = catView.querySelectorAll('.home-cat-card');
        cards.forEach(function(el, i) {
            var t = S.hc[i];
            if (!t) return;

            var isCur = S.ct && (
                S.ct.id === t.id ||
                S.ct.videoId === t.id ||
                (S.ct.id && t.videoId && S.ct.id === t.videoId) ||
                (S.ct.videoId && t.id && S.ct.videoId === t.id) ||
                (S.ct.title === t.title && S.ct.artist === t.artist)
            );
            var isPlay = isCur && S.ip;
            var isLoad = isCur && S.il;

            var playIconHtml = '';
            if (isLoad) {
                playIconHtml = '<div class="w-6 h-6 sm:w-7 sm:h-7 rounded-full btn-chrome flex items-center justify-center shrink-0 ml-auto"><div class="w-3 h-3 sm:w-3.5 sm:h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>';
            } else if (isPlay) {
                playIconHtml = '<div class="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white text-black flex items-center justify-center shrink-0 ml-auto ring-1 sm:ring-2 ring-white scale-105"><div class="flex items-end justify-center gap-[2px] w-3 sm:w-3.5 h-3 sm:h-3.5 pb-0.5"><span class="w-[2px] bg-black rounded-full animate-eq-1"></span><span class="w-[2px] bg-black rounded-full animate-eq-2"></span><span class="w-[2px] bg-black rounded-full animate-eq-3"></span></div></div>';
            } else if (isCur) {
                playIconHtml = '<div class="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white text-black flex items-center justify-center shrink-0 ml-auto border border-white"><svg class="w-3 sm:w-3.5 h-3 sm:h-3.5 fill-current" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg></div>';
            } else {
                playIconHtml = '<div class="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/5 group-hover:bg-white/20 flex items-center justify-center shrink-0 ml-auto text-white transition-all"><svg class="w-3 sm:w-3.5 h-3 sm:h-3.5 fill-current ml-0.5" viewBox="0 0 24 24"><polygon points="6 3 20 12 6 21 6 3"/></svg></div>';
            }

            var cardBg = isPlay ? 'bg-[#343a4e] border border-white/40 shadow-xl' : (isCur ? 'bg-[#2e3344] border border-white/30' : 'bg-[#20222c] border border-white/10 hover:bg-[#282b38]');
            el.className = 'home-cat-card group ' + cardBg + ' rounded-2xl flex items-center gap-3 p-2.5 cursor-pointer active:scale-95 transition-all shadow-lg shadow-black/20';

            var titleEl = el.querySelector('h3');
            if (titleEl) {
                titleEl.className = 'font-semibold text-xs sm:text-sm truncate ' + (isCur ? 'text-white font-black' : 'text-white/90');
            }
            var iconWrap = el.querySelector('.home-cat-icon') || el.children[el.children.length - 1];
            if (iconWrap) {
                iconWrap.innerHTML = playIconHtml;
            }
        });
    },

    renderDeveloperProfileView() {
        var defView = gid('home-default-view'), catView = gid('home-category-view');
        if (defView) defView.style.display = 'none';
        if (catView) catView.style.display = 'block';
        if (!catView) return;

        var songsHtml = '';
        if (S.hc && S.hc.length > 0) {
            songsHtml = S.hc.map(function(t, i) {
                var isCur = S.ct && (
                    S.ct.id === t.id ||
                    S.ct.videoId === t.id ||
                    (S.ct.id && t.videoId && S.ct.id === t.videoId) ||
                    (S.ct.videoId && t.id && S.ct.videoId === t.id) ||
                    (S.ct.title === t.title && S.ct.artist === t.artist)
                );
                var isPlay = isCur && S.ip;
                var isLoad = isCur && S.il;

                var playIconHtml = '';
                if (isLoad) {
                    playIconHtml = '<div class="w-6 h-6 rounded-full btn-chrome flex items-center justify-center shrink-0 ml-auto"><div class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>';
                } else if (isPlay) {
                    playIconHtml = '<div class="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center shrink-0 ml-auto shadow-md ring-1 ring-white scale-105"><div class="flex items-end justify-center gap-[2px] w-3 h-3 pb-0.5"><span class="w-[2px] bg-black rounded-full animate-eq-1"></span><span class="w-[2px] bg-black rounded-full animate-eq-2"></span><span class="w-[2px] bg-black rounded-full animate-eq-3"></span></div></div>';
                } else if (isCur) {
                    playIconHtml = '<div class="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center shrink-0 ml-auto border border-white"><i data-lucide="pause" class="w-3 h-3 fill-current"></i></div>';
                } else {
                    playIconHtml = '<div class="w-6 h-6 rounded-full bg-white/5 group-hover:bg-white/20 flex items-center justify-center shrink-0 ml-auto text-white transition-all"><i data-lucide="play" class="w-3 h-3 fill-current ml-0.5"></i></div>';
                }

                var cardBg = isPlay 
                    ? 'bg-white/20 border-white/40 shadow-lg shadow-white/10' 
                    : (isCur ? 'bg-white/15 border-white/30' : 'bg-white/[0.08] hover:bg-white/[0.14] border-white/20 hover:border-white/35 shadow-sm');

                var devVid = t.videoId || t.id || '';
                return '<div onclick="PK(\'homecat\','+i+')" onpointerdown="if(typeof prefetchTrackAudio===\'function\')prefetchTrackAudio(\''+devVid+'\')" onpointerenter="if(typeof prefetchTrackAudio===\'function\')prefetchTrackAudio(\''+devVid+'\')" class="home-cat-card group '+ cardBg +' border rounded-full flex items-center gap-3 p-1.5 pr-3.5 sm:p-2 sm:pr-4 cursor-pointer active:scale-95 transition-all duration-200 backdrop-blur-md select-none">'+
                    '<div class="w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden shrink-0 shadow-sm border border-white/20 bg-black/40 relative">'+
                        '<img src="'+t.cover+'" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onerror="this.src=\''+FI+'\'" />'+
                    '</div>'+
                    '<div class="truncate flex-1 min-w-0"><h3 class="font-bold text-xs sm:text-sm truncate '+(isCur?'text-white font-black':'text-white/90')+'">'+es(t.title)+'</h3><p class="text-white/60 text-[11px] truncate mt-0.5">'+es(t.artist)+'</p></div>'+
                    '<div class="home-cat-icon ml-auto shrink-0">'+playIconHtml+'</div>'+
                '</div>';
            }).join('');
        } else {
            songsHtml = '<p class="text-white/60 text-sm py-4 col-span-2">Memuat lagu DJ Afthershock...</p>';
        }

        catView.innerHTML = `
        <div class="space-y-6 pb-6">
            <div class="rounded-3xl p-5 border border-white/20 bg-white/[0.08] backdrop-blur-xl relative overflow-hidden shadow-lg">
                <div class="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left relative z-10">
                    <div class="relative w-20 h-20 rounded-full overflow-hidden border-2 border-white/25 shrink-0 bg-black/50 shadow-md">
                        <img src="/logo.png" class="w-full h-full object-cover" onerror="this.src='${FI}'" />
                    </div>
                    <div class="flex-1">
                        <div class="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-white text-[10px] font-extrabold uppercase tracking-wider mb-2 backdrop-blur-md">
                            <i data-lucide="code" class="w-3.5 h-3.5"></i> Developer Profile
                        </div>
                        <h2 class="text-2xl font-black text-white">MusifyStar StudioMusik</h2>
                        <p class="text-xs text-white/70 mt-1 leading-relaxed">Pengembang & Pembuat MusifyStar. Selamat menikmati streaming musik favorit tanpa batas!</p>
                        <div class="flex flex-wrap items-center gap-2 mt-3.5 justify-center sm:justify-start">
                            <a href="https://whatsapp.com/channel/0029VbDRf3P9WtC9ZjQ3gq3B" target="_blank" class="px-4 py-2 rounded-full bg-white text-black text-xs font-black flex items-center gap-1.5 shadow-md shadow-white/20 active:scale-95 transition-all">
                                <i data-lucide="message-square" class="w-3.5 h-3.5"></i> Channel WA
                            </a>
                            <button onclick="App.switch('dev')" class="px-4 py-2 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-xs font-bold text-white border border-white/20 hover:border-white/35 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer backdrop-blur-md">
                                <i data-lucide="info" class="w-3.5 h-3.5"></i> Detail Info
                            </button>
                            <button onclick="Home.selectCategory('Semua')" class="px-3.5 py-2 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-xs font-semibold text-white/80 hover:text-white border border-white/20 flex items-center gap-1 active:scale-95 transition-all cursor-pointer backdrop-blur-md">
                                <i data-lucide="x" class="w-3.5 h-3.5"></i> Reset
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <div class="mb-3">
                    <h2 class="text-base font-bold flex items-center gap-2 text-white">
                        <i data-lucide="disc" class="w-4 h-4 text-amber-400"></i>
                        <span>Koleksi DJ Afthershock & Remix</span>
                    </h2>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    ${songsHtml}
                </div>
            </div>
        </div>`;

        lucide.createIcons();
        Home.renderActiveCategory();
    },

    refresh() {
        if (Home.activeCategory && Home.activeCategory !== 'Semua') {
            Home.fetchCategoryData(Home.activeCategory);
        } else {
            Home.fetch();
        }
        var m = gid('main-area');
        if (m) m.scrollTop = 0;
    }
};
