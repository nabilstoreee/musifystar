var Search = {
    currentFilter: 'all', // 'all', 'songs', 'videos', 'albums', 'artists', 'playlists'
    categories: [
        { id: 'all', label: 'Semua', icon: 'sparkles' },
        { id: 'songs', label: 'Lagu', icon: 'music' },
        { id: 'videos', label: 'Video', icon: 'video' },
        { id: 'albums', label: 'Album', icon: 'disc' },
        { id: 'artists', label: 'Artis', icon: 'mic-2' },
        { id: 'playlists', label: 'Daftar Putar', icon: 'list-music' }
    ],

    getHistory() {
        try {
            var raw = localStorage.getItem('musifystar_search_history');
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    },

    saveHistory(list) {
        try {
            localStorage.setItem('musifystar_search_history', JSON.stringify(list.slice(0, 20)));
        } catch (e) {}
    },

    addHistory(q) {
        if (!q || !q.trim()) return;
        var query = q.trim();
        var list = Search.getHistory().filter(function(item) {
            return item.toLowerCase() !== query.toLowerCase();
        });
        list.unshift(query);
        Search.saveHistory(list);
    },

    deleteHistory(q, e) {
        if (e) e.stopPropagation();
        var list = Search.getHistory().filter(function(item) {
            return item.toLowerCase() !== q.toLowerCase();
        });
        Search.saveHistory(list);
        Search.renderHistoryOrSuggestions();
    },

    clearAllHistory(e) {
        if (e) e.stopPropagation();
        Search.saveHistory([]);
        Search.renderHistoryOrSuggestions();
    },

    fillInput(q, e) {
        if (e) e.stopPropagation();
        var si = gid('search-input');
        if (si) {
            si.value = q;
            si.focus();
            Search.onInputChange();
        }
    },

    render() {
        var chipsHtml = Search.categories.map(function(cat) {
            var isActive = (Search.currentFilter === cat.id);
            var btnClass = isActive
                ? 'bg-white text-black font-extrabold shadow-md shadow-white/20 border border-white scale-[1.03]'
                : 'bg-white/[0.08] hover:bg-white/[0.14] active:bg-white/[0.18] text-white/85 hover:text-white border border-white/20 hover:border-white/35 font-medium backdrop-blur-md';
            return '<button onclick="Search.setFilter(\'' + cat.id + '\')" data-filter="' + cat.id + '" class="search-cat-chip px-4 py-2 rounded-full text-xs whitespace-nowrap transition-all duration-200 ease-out cursor-pointer shrink-0 inline-flex items-center gap-1.5 active:scale-95 ' + btnClass + '">' +
                (cat.icon ? '<i data-lucide="' + cat.icon + '" class="w-3.5 h-3.5"></i>' : '') +
                '<span>' + es(cat.label) + '</span>' +
            '</button>';
        }).join('');

        gid('view-search').innerHTML = `
        <div class="search-page pb-36 min-h-screen">
            <!-- Top Sticky Header -->
            <div class="pt-6 pb-3 px-4 sticky top-0 z-30 border-b border-white/10 bg-[#050507]/95 backdrop-blur-2xl">
                <form id="search-form" class="relative mb-3" autocomplete="off">
                    <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                        <i data-lucide="search" class="w-4 h-4"></i>
                    </div>
                    <input type="text" id="search-input" class="w-full bg-[#161820] border border-white/10 text-white font-medium rounded-full pl-10 pr-20 py-2.5 text-sm focus:outline-none focus:border-white/30 placeholder:text-white/40 transition-all" placeholder="Cari lagu, album, atau artis" autocomplete="off" />
                    <div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button type="button" id="search-clear-btn" class="hidden text-white/40 hover:text-white p-1 rounded-full transition-colors cursor-pointer" title="Hapus"><i data-lucide="x" class="w-4 h-4"></i></button>
                        <button type="submit" class="bg-white text-black font-bold text-xs px-3 py-1.5 rounded-full active:scale-95 shadow-sm transition-all cursor-pointer">Cari</button>
                    </div>
                </form>

                <!-- Chips Bar (Semua, Lagu, Video, Album, Artis, Daftar Putar) -->
                <div id="search-category-chips" class="flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4 py-1.5 scroll-smooth" style="-webkit-overflow-scrolling: touch;">
                    ${chipsHtml}
                </div>
            </div>

            <!-- Search History & Live Autocomplete List (Foto 2) -->
            <div id="search-suggestions-container" class="px-3 pt-2"></div>

            <!-- Empty Initial State (Foto 1) -->
            <div id="search-empty-state" class="flex flex-col items-center justify-center py-24 px-4 text-center">
                <div class="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 shadow-xl">
                    <i data-lucide="search" class="w-9 h-9 text-white/30"></i>
                </div>
                <p class="text-sm font-medium text-white/50">Cari lagu, album, atau artis</p>
            </div>

            <!-- Results Container -->
            <div id="search-results" class="px-4 pt-3 hidden space-y-6"></div>
        </div>`;

        lucide.createIcons();
        Search.events();
        Search.renderHistoryOrSuggestions();
    },

    setFilter(filterId) {
        Search.currentFilter = filterId;
        // Update chip active classes cleanly without overflow-clipping scale transform
        document.querySelectorAll('.search-cat-chip').forEach(function(el) {
            var f = el.getAttribute('data-filter');
            if (f === filterId) {
                el.className = 'search-cat-chip px-4 py-2 rounded-full text-xs whitespace-nowrap transition-all duration-200 ease-out cursor-pointer shrink-0 inline-flex items-center gap-1.5 active:scale-95 bg-white text-black font-extrabold shadow-md shadow-white/20 border border-white scale-[1.03]';
                try { el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); } catch(e){}
            } else {
                el.className = 'search-cat-chip px-4 py-2 rounded-full text-xs whitespace-nowrap transition-all duration-200 ease-out cursor-pointer shrink-0 inline-flex items-center gap-1.5 active:scale-95 bg-white/[0.08] hover:bg-white/[0.14] active:bg-white/[0.18] text-white/85 hover:text-white border border-white/20 hover:border-white/35 font-medium backdrop-blur-md';
            }
        });

        // If a query is active, re-render results or fetch category
        if (S.sq) {
            Search.executeSearch(S.sq);
        }
    },

    query(q) {
        App.switch('search');
        var si = gid('search-input');
        if (si) {
            si.value = q;
            var sf = gid('search-form');
            if (sf) sf.dispatchEvent(new Event('submit'));
        }
    },

    onShow() {
        var si = gid('search-input');
        if (!S.sq) {
            if (si) si.value = '';
            Search.renderHistoryOrSuggestions();
        }
    },

    events() {
        var sf = gid('search-form');
        var si = gid('search-input');
        var clrBtn = gid('search-clear-btn');
        if (!sf || !si) return;

        sf.addEventListener('submit', function(e) {
            e.preventDefault();
            var q = si.value.trim();
            if (!q) {
                S.sq = '';
                Search.renderHistoryOrSuggestions();
                return;
            }
            Search.addHistory(q);
            Search.executeSearch(q);
        });

        si.addEventListener('input', function() {
            Search.onInputChange();
        });

        si.addEventListener('focus', function() {
            Search.onInputChange();
        });

        if (clrBtn) {
            clrBtn.addEventListener('click', function() {
                si.value = '';
                clrBtn.classList.add('hidden');
                S.sq = '';
                Search.renderHistoryOrSuggestions();
                si.focus();
            });
        }
    },

    onInputChange() {
        var si = gid('search-input');
        var clrBtn = gid('search-clear-btn');
        if (!si) return;
        var q = si.value.trim();

        if (clrBtn) {
            if (q) clrBtn.classList.remove('hidden');
            else clrBtn.classList.add('hidden');
        }

        Search.renderHistoryOrSuggestions(q);
    },

    suggestDebounceTimer: null,
    renderHistoryOrSuggestions(queryText) {
        var container = gid('search-suggestions-container');
        var emptyState = gid('search-empty-state');
        var resultsContainer = gid('search-results');
        if (!container) return;

        var q = (queryText !== undefined) ? queryText : (gid('search-input') ? gid('search-input').value.trim() : '');

        // If we are currently displaying full search results and user hasn't typed a new query
        if (S.sq && S.sq === q && S.searchData) {
            container.innerHTML = '';
            container.classList.add('hidden');
            if (emptyState) emptyState.classList.add('hidden');
            if (resultsContainer) resultsContainer.classList.remove('hidden');
            return;
        }

        // Hide search results when user is actively searching/typing
        if (resultsContainer) resultsContainer.classList.add('hidden');

        if (!q) {
            // Show recent history (Foto 2 style)
            var history = Search.getHistory();
            if (history.length === 0) {
                container.innerHTML = '';
                container.classList.add('hidden');
                if (emptyState) emptyState.classList.remove('hidden');
                return;
            }

            if (emptyState) emptyState.classList.add('hidden');
            container.classList.remove('hidden');

            var historyItemsHtml = history.map(function(item) {
                return `
                <div onclick="Search.executeSearch('${esJs(item)}')" class="group flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-white/5 cursor-pointer active:bg-white/10 transition-colors">
                    <div class="flex items-center gap-3.5 min-w-0 flex-1">
                        <i data-lucide="history" class="w-4 h-4 text-white/40 group-hover:text-white/70 shrink-0"></i>
                        <span class="text-sm font-medium text-white/90 group-hover:text-white truncate">${es(item)}</span>
                    </div>
                    <div class="flex items-center gap-1 shrink-0 ml-2">
                        <button onclick="Search.deleteHistory('${esJs(item)}', event)" class="p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/10 transition-colors" title="Hapus dari riwayat">
                            <i data-lucide="x" class="w-4 h-4"></i>
                        </button>
                        <button onclick="Search.fillInput('${esJs(item)}', event)" class="p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/10 transition-colors" title="Salin ke kotak pencarian">
                            <i data-lucide="arrow-up-left" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>`;
            }).join('');

            container.innerHTML = `
            <div class="flex items-center justify-between px-3 py-1 mb-1">
                <span class="text-[11px] font-bold text-white/40 uppercase tracking-wider">Pencarian Terakhir</span>
                <button onclick="Search.clearAllHistory(event)" class="text-[11px] font-medium text-white/40 hover:text-white/80 transition-colors">Hapus Semua</button>
            </div>
            <div class="space-y-0.5">
                ${historyItemsHtml}
            </div>`;

            lucide.createIcons();
            return;
        }

        // When query is typed: fetch live suggestions
        if (emptyState) emptyState.classList.add('hidden');
        container.classList.remove('hidden');

        if (Search.suggestDebounceTimer) clearTimeout(Search.suggestDebounceTimer);
        Search.suggestDebounceTimer = setTimeout(function() {
            fetch(API.suggest + '?q=' + encodeURIComponent(q))
                .then(function(r) { return r.json(); })
                .then(function(suggestions) {
                    if (!Array.isArray(suggestions) || suggestions.length === 0) {
                        suggestions = [q];
                    }
                    var history = Search.getHistory();
                    var itemsHtml = suggestions.map(function(sug) {
                        var isHist = history.some(function(h) { return h.toLowerCase() === sug.toLowerCase(); });
                        var icon = isHist ? 'history' : 'search';
                        return `
                        <div onclick="Search.executeSearch('${esJs(sug)}')" class="group flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-white/5 cursor-pointer active:bg-white/10 transition-colors">
                            <div class="flex items-center gap-3.5 min-w-0 flex-1">
                                <i data-lucide="${icon}" class="w-4 h-4 text-white/40 group-hover:text-white/70 shrink-0"></i>
                                <span class="text-sm font-medium text-white/90 group-hover:text-white truncate">${es(sug)}</span>
                            </div>
                            <div class="flex items-center gap-1 shrink-0 ml-2">
                                ${isHist ? `<button onclick="Search.deleteHistory('${esJs(sug)}', event)" class="p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/10 transition-colors" title="Hapus"><i data-lucide="x" class="w-4 h-4"></i></button>` : ''}
                                <button onclick="Search.fillInput('${esJs(sug)}', event)" class="p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/10 transition-colors" title="Salin">
                                    <i data-lucide="arrow-up-left" class="w-4 h-4"></i>
                                </button>
                            </div>
                        </div>`;
                    }).join('');

                    container.innerHTML = `<div class="space-y-0.5">${itemsHtml}</div>`;
                    lucide.createIcons();
                }).catch(function() {});
        }, 150);
    },

    async executeSearch(query) {
        var q = (query || '').trim();
        if (!q) return;

        S.sq = q;
        var si = gid('search-input');
        if (si) si.value = q;

        var clrBtn = gid('search-clear-btn');
        if (clrBtn) clrBtn.classList.remove('hidden');

        var container = gid('search-suggestions-container');
        if (container) {
            container.innerHTML = '';
            container.classList.add('hidden');
        }

        var emptyState = gid('search-empty-state');
        if (emptyState) emptyState.classList.add('hidden');

        var resultsContainer = gid('search-results');
        if (!resultsContainer) return;

        resultsContainer.classList.remove('hidden');
        resultsContainer.innerHTML = `
        <div class="flex flex-col items-center justify-center py-20">
            <div class="w-8 h-8 border-3 border-purple-400 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p class="text-xs text-white/50">Mencari "${es(q)}"...</p>
        </div>`;

        var url = location.origin + '/search/' + encodeURIComponent(q);
        history.pushState({}, '', url);

        // Record search
        try {
            fetch('/api/analytics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'search', query: q })
            }).catch(function() {});
        } catch(e) {}

        try {
            var fetchType = (Search.currentFilter === 'all') ? 'all' : Search.currentFilter;
            var res = await fetch(API.search + '?query=' + encodeURIComponent(q) + '&type=' + fetchType + '&userSearch=1');
            var data = await res.json();

            if (!data || !data.status || !data.result) {
                resultsContainer.innerHTML = '<p class="text-center text-white/60 py-20 text-sm">Tidak ada hasil ditemukan untuk "' + es(q) + '"</p>';
                return;
            }

            S.searchData = data.result;
            S.ar = data.result.songs || [];
            S.videos = data.result.videos || [];
            S.albums = data.result.albums || [];
            S.artists = data.result.artists || [];
            S.playlists = data.result.playlists || [];

            // Expose for player playback
            S.sr = S.ar;

            Search.renderResultsView();
        } catch (err) {
            resultsContainer.innerHTML = '<p class="text-center text-red-400 py-20 text-sm">Gagal memuat hasil: ' + es(err.message) + '</p>';
        }
    },

    renderResultsView() {
        var c = gid('search-results');
        if (!c || !S.searchData) return;

        var d = S.searchData;
        var f = Search.currentFilter;
        var songs = d.songs || [];
        var videos = d.videos || [];
        var albums = d.albums || [];
        var artists = d.artists || [];
        var playlists = d.playlists || [];

        var html = '';

        if (f === 'songs') {
            if (songs.length === 0) {
                html = '<p class="text-center text-white/60 py-20 text-sm">Tidak ada lagu ditemukan</p>';
            } else {
                html = '<div class="space-y-1.5 pb-8">' + songs.map(function(t, i) {
                    return Search.renderSongItem(t, i, 'search_songs');
                }).join('') + '</div>';
            }
        } else if (f === 'videos') {
            if (videos.length === 0) {
                html = '<p class="text-center text-white/60 py-20 text-sm">Tidak ada video ditemukan</p>';
            } else {
                html = '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pb-8">' + videos.map(function(v, i) {
                    return Search.renderVideoItem(v, i);
                }).join('') + '</div>';
            }
        } else if (f === 'albums') {
            if (albums.length === 0) {
                html = '<p class="text-center text-white/60 py-20 text-sm">Tidak ada album ditemukan</p>';
            } else {
                html = '<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pb-8">' + albums.map(function(a) {
                    return Search.renderAlbumItem(a);
                }).join('') + '</div>';
            }
        } else if (f === 'artists') {
            if (artists.length === 0) {
                html = '<p class="text-center text-white/60 py-20 text-sm">Tidak ada artis ditemukan</p>';
            } else {
                html = '<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pb-8">' + artists.map(function(art) {
                    return Search.renderArtistItem(art);
                }).join('') + '</div>';
            }
        } else if (f === 'playlists') {
            if (playlists.length === 0) {
                html = '<p class="text-center text-white/60 py-20 text-sm">Tidak ada playlist ditemukan</p>';
            } else {
                html = '<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pb-8">' + playlists.map(function(pl) {
                    return Search.renderPlaylistItem(pl);
                }).join('') + '</div>';
            }
        } else {
            // 'all' view: Blended sections
            var hasAny = (songs.length > 0 || videos.length > 0 || albums.length > 0 || artists.length > 0 || playlists.length > 0);
            if (!hasAny) {
                html = '<p class="text-center text-white/60 py-20 text-sm">Tidak ada hasil ditemukan</p>';
            } else {
                // 1. Top Songs Section
                if (songs.length > 0) {
                    html += `
                    <div class="search-section mb-6">
                        <div class="flex items-center justify-between mb-3">
                            <h2 class="text-base font-bold text-white flex items-center gap-2">
                                <span class="w-1.5 h-4 bg-white/90 rounded-full inline-block"></span>
                                <span>Lagu</span>
                            </h2>
                            <button onclick="Search.setFilter('songs')" class="text-xs font-semibold text-white/60 hover:text-white transition-colors">Lihat Semua</button>
                        </div>
                        <div class="space-y-1.5">
                            ${songs.slice(0, 5).map(function(t, i) { return Search.renderSongItem(t, i, 'search_songs'); }).join('')}
                        </div>
                    </div>`;
                }

                // 2. Videos Section
                if (videos.length > 0) {
                    html += `
                    <div class="search-section mb-6">
                        <div class="flex items-center justify-between mb-3">
                            <h2 class="text-base font-bold text-white flex items-center gap-2">
                                <span class="w-1.5 h-4 bg-red-400 rounded-full inline-block"></span>
                                <span>Video</span>
                            </h2>
                            <button onclick="Search.setFilter('videos')" class="text-xs font-semibold text-white/60 hover:text-white transition-colors">Lihat Semua</button>
                        </div>
                        <div class="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
                            ${videos.slice(0, 6).map(function(v, i) { return Search.renderVideoCard(v, i); }).join('')}
                        </div>
                    </div>`;
                }

                // 3. Artists Section
                if (artists.length > 0) {
                    html += `
                    <div class="search-section mb-6">
                        <div class="flex items-center justify-between mb-3">
                            <h2 class="text-base font-bold text-white flex items-center gap-2">
                                <span class="w-1.5 h-4 bg-yellow-400 rounded-full inline-block"></span>
                                <span>Artis</span>
                            </h2>
                            <button onclick="Search.setFilter('artists')" class="text-xs font-semibold text-white/60 hover:text-white transition-colors">Lihat Semua</button>
                        </div>
                        <div class="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
                            ${artists.slice(0, 6).map(function(art) { return Search.renderArtistCard(art); }).join('')}
                        </div>
                    </div>`;
                }

                // 4. Albums Section
                if (albums.length > 0) {
                    html += `
                    <div class="search-section mb-6">
                        <div class="flex items-center justify-between mb-3">
                            <h2 class="text-base font-bold text-white flex items-center gap-2">
                                <span class="w-1.5 h-4 bg-blue-400 rounded-full inline-block"></span>
                                <span>Album</span>
                            </h2>
                            <button onclick="Search.setFilter('albums')" class="text-xs font-semibold text-white/60 hover:text-white transition-colors">Lihat Semua</button>
                        </div>
                        <div class="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
                            ${albums.slice(0, 6).map(function(a) { return Search.renderAlbumCard(a); }).join('')}
                        </div>
                    </div>`;
                }

                // 5. Playlists Section
                if (playlists.length > 0) {
                    html += `
                    <div class="search-section mb-6">
                        <div class="flex items-center justify-between mb-3">
                            <h2 class="text-base font-bold text-white flex items-center gap-2">
                                <span class="w-1.5 h-4 bg-emerald-400 rounded-full inline-block"></span>
                                <span>Daftar Putar</span>
                            </h2>
                            <button onclick="Search.setFilter('playlists')" class="text-xs font-semibold text-white/60 hover:text-white transition-colors">Lihat Semua</button>
                        </div>
                        <div class="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
                            ${playlists.slice(0, 6).map(function(pl) { return Search.renderPlaylistCard(pl); }).join('')}
                        </div>
                    </div>`;
                }
            }
        }

        c.innerHTML = html;
        lucide.createIcons();

        // Warm up / prefetch audio streams for the top visible search results
        setTimeout(function() {
            if (typeof prefetchTrackAudio === 'function') {
                var itemsToWarm = (f === 'videos' ? videos : (songs.length > 0 ? songs : videos)).slice(0, 4);
                itemsToWarm.forEach(function(item) {
                    prefetchTrackAudio(item);
                });
            }
        }, 120);
    },

    renderSongItem(t, idx, sourceKey) {
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
            playIconHtml = '<div class="w-7 h-7 rounded-full btn-chrome flex items-center justify-center shrink-0"><div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>';
        } else if (isPlay) {
            playIconHtml = '<div class="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center shrink-0 shadow-md ring-1 ring-white"><div class="flex items-end justify-center gap-[2px] w-3.5 h-3.5 pb-0.5"><span class="w-[2px] bg-black rounded-full animate-eq-1"></span><span class="w-[2px] bg-black rounded-full animate-eq-2"></span><span class="w-[2px] bg-black rounded-full animate-eq-3"></span></div></div>';
        } else if (isCur) {
            playIconHtml = '<div class="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center shrink-0 border border-white"><svg class="w-3.5 h-3.5 fill-current ml-0.5" viewBox="0 0 24 24"><polygon points="6 3 20 12 6 21 6 3"/></svg></div>';
        } else {
            playIconHtml = '<div class="w-7 h-7 rounded-full bg-white/5 group-hover:bg-white/20 flex items-center justify-center shrink-0 text-white/80 group-hover:text-white transition-all"><svg class="w-3.5 h-3.5 fill-current ml-0.5" viewBox="0 0 24 24"><polygon points="6 3 20 12 6 21 6 3"/></svg></div>';
        }

        var rowBg = isPlay 
            ? 'bg-white/20 border-white/40 shadow-lg shadow-white/10' 
            : (isCur ? 'bg-white/15 border-white/30' : 'bg-white/[0.08] hover:bg-white/[0.14] border-white/20 hover:border-white/35 shadow-sm');
        var titleColor = isCur ? 'text-white font-black' : 'text-white/90 font-bold';
        var vid = t.videoId || t.id;

        return `
        <div onclick="Search.playSong(${idx})" onpointerdown="if(typeof prefetchTrackAudio==='function')prefetchTrackAudio('${vid}')" onpointerenter="if(typeof prefetchTrackAudio==='function')prefetchTrackAudio('${vid}')" data-idx="${idx}" class="search-song-row group flex items-center gap-3 p-1.5 pr-3.5 sm:p-2 sm:pr-4 rounded-full border ${rowBg} cursor-pointer active:scale-95 transition-all duration-200 backdrop-blur-md select-none">
            <div class="w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden shrink-0 shadow-sm border border-white/20 bg-black/40 relative">
                <img src="${toWebp(t.cover || t.thumbnail || FI)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onerror="handleImgError(this)" />
            </div>
            <div class="min-w-0 flex-1">
                <h4 class="search-song-title text-xs sm:text-sm truncate ${titleColor}">${es(t.title)}</h4>
                <p class="text-[11px] text-white/60 truncate mt-0.5">${es(t.artist)}</p>
            </div>
            ${t.duration ? `<span class="text-[11px] text-white/50 hidden sm:inline-block shrink-0 px-2 font-mono font-medium">${es(String(t.duration).replace('.', ':'))}</span>` : ''}
            <div class="search-song-icon shrink-0">${playIconHtml}</div>
        </div>`;
    },

    playSong(idx) {
        var list = S.searchData?.songs || S.ar || [];
        if (!list || !list[idx]) return;
        S.pl = list.map(function(s) {
            return {
                id: s.videoId || s.id,
                videoId: s.videoId || s.id,
                title: s.title,
                artist: s.artist,
                artistId: s.artistId || '',
                cover: toHDCover(s.thumbnail || s.cover, s.videoId || s.id),
                ytUrl: s.url || ('https://youtube.com/watch?v=' + (s.videoId || s.id)),
                duration: s.duration
            };
        });
        S.pi = idx;
        S.ps = 'search';
        S.ct = S.pl[S.pi];
        S.il = true;
        S.ip = false;
        UU();
        MP.show();
        UB();
        resetLyricsUI(S.ct.videoId);
        loadTrack(S.ct);
    },

    playVideo(idx) {
        var list = S.searchData?.videos || S.videos || [];
        if (!list || !list[idx]) return;
        S.pl = list.map(function(s) {
            return {
                id: s.videoId || s.id,
                videoId: s.videoId || s.id,
                title: s.title,
                artist: s.artist,
                cover: toHDCover(s.thumbnail || s.cover, s.videoId || s.id),
                ytUrl: s.url || ('https://youtube.com/watch?v=' + (s.videoId || s.id)),
                duration: s.duration
            };
        });
        S.pi = idx;
        S.ps = 'search_videos';
        S.ct = S.pl[S.pi];
        S.il = true;
        S.ip = false;
        UU();
        MP.show();
        UB();
        resetLyricsUI(S.ct.videoId);
        loadTrack(S.ct);
    },

    renderVideoItem(v, idx) {
        var isCur = S.ct && (
            S.ct.id === v.id ||
            S.ct.videoId === v.id ||
            (S.ct.id && v.videoId && S.ct.id === v.videoId) ||
            (S.ct.videoId && v.id && S.ct.videoId === v.id) ||
            (S.ct.title === v.title && S.ct.artist === v.artist)
        );
        var isPlay = isCur && S.ip;
        var isLoad = isCur && S.il;

        var playIconHtml = '';
        if (isLoad) {
            playIconHtml = '<div class="w-10 h-10 rounded-full btn-chrome flex items-center justify-center shadow-lg"><div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>';
        } else if (isPlay) {
            playIconHtml = '<div class="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-xl ring-2 ring-white scale-105"><div class="flex items-end justify-center gap-[2px] w-4 h-4 pb-0.5"><span class="w-[2px] bg-black rounded-full animate-eq-1"></span><span class="w-[2px] bg-black rounded-full animate-eq-2"></span><span class="w-[2px] bg-black rounded-full animate-eq-3"></span></div></div>';
        } else if (isCur) {
            playIconHtml = '<div class="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-xl border border-white"><svg class="w-4 h-4 fill-current ml-0.5" viewBox="0 0 24 24"><polygon points="6 3 20 12 6 21 6 3"/></svg></div>';
        } else {
            playIconHtml = '<div class="w-10 h-10 rounded-full bg-black/60 group-hover:bg-white/90 group-hover:text-black text-white flex items-center justify-center transition-all shadow-md backdrop-blur-sm"><svg class="w-4 h-4 fill-current ml-0.5" viewBox="0 0 24 24"><polygon points="6 3 20 12 6 21 6 3"/></svg></div>';
        }

        var rowBg = isPlay ? 'bg-[#343a4e] border-white/40 shadow-lg' : (isCur ? 'bg-[#2e3344] border-white/30' : 'bg-[#1a1c24] border-white/10 hover:bg-[#242834]');
        var titleColor = isCur ? 'text-yellow-300 font-bold' : 'text-white font-semibold';
        var vid = v.videoId || v.id;

        return `
        <div onclick="Search.playVideo(${idx})" onpointerdown="if(typeof prefetchTrackAudio==='function')prefetchTrackAudio('${vid}')" onpointerenter="if(typeof prefetchTrackAudio==='function')prefetchTrackAudio('${vid}')" data-idx="${idx}" class="search-video-row group flex items-center gap-3 p-2.5 rounded-2xl border ${rowBg} cursor-pointer active:scale-[0.98] transition-all">
            <div class="relative w-28 aspect-video rounded-xl overflow-hidden shrink-0 shadow-md">
                <img src="${toWebp(v.cover || v.thumbnail || FI)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onerror="handleImgError(this)" />
                <span class="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white/90">${es(String(v.duration || 'Video').replace('.', ':'))}</span>
                <div class="search-video-icon absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity ${isCur ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}">
                    ${playIconHtml}
                </div>
            </div>
            <div class="min-w-0 flex-1">
                <h4 class="search-video-title text-xs sm:text-sm line-clamp-2 leading-snug ${titleColor}">${es(v.title)}</h4>
                <p class="text-xs text-white/60 truncate mt-1">${es(v.artist)}</p>
            </div>
        </div>`;
    },

    renderVideoCard(v, idx) {
        var isCur = S.ct && (
            S.ct.id === v.id ||
            S.ct.videoId === v.id ||
            (S.ct.id && v.videoId && S.ct.id === v.videoId) ||
            (S.ct.videoId && v.id && S.ct.videoId === v.id) ||
            (S.ct.title === v.title && S.ct.artist === v.artist)
        );
        var isPlay = isCur && S.ip;
        var isLoad = isCur && S.il;

        var playIconHtml = '';
        if (isLoad) {
            playIconHtml = '<div class="w-9 h-9 rounded-full btn-chrome flex items-center justify-center shadow-md"><div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>';
        } else if (isPlay) {
            playIconHtml = '<div class="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-lg ring-2 ring-white scale-105"><div class="flex items-end justify-center gap-[2px] w-3.5 h-3.5 pb-0.5"><span class="w-[2px] bg-black rounded-full animate-eq-1"></span><span class="w-[2px] bg-black rounded-full animate-eq-2"></span><span class="w-[2px] bg-black rounded-full animate-eq-3"></span></div></div>';
        } else if (isCur) {
            playIconHtml = '<div class="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-lg border border-white"><svg class="w-3.5 h-3.5 fill-current ml-0.5" viewBox="0 0 24 24"><polygon points="6 3 20 12 6 21 6 3"/></svg></div>';
        } else {
            playIconHtml = '<div class="w-9 h-9 rounded-full bg-black/60 group-hover:bg-white/90 group-hover:text-black text-white flex items-center justify-center transition-all shadow-md backdrop-blur-sm"><svg class="w-3.5 h-3.5 fill-current ml-0.5" viewBox="0 0 24 24"><polygon points="6 3 20 12 6 21 6 3"/></svg></div>';
        }

        var cardBg = isPlay ? 'bg-[#343a4e] border-white/40 shadow-lg' : (isCur ? 'bg-[#2e3344] border-white/30' : 'bg-[#1a1c24] border-white/10 hover:bg-[#242834]');
        var titleColor = isCur ? 'text-yellow-300 font-bold' : 'text-white font-semibold';

        return `
        <div onclick="Search.playVideo(${idx})" data-idx="${idx}" class="search-video-card flex-shrink-0 w-48 group p-2.5 rounded-2xl border ${cardBg} cursor-pointer active:scale-95 transition-all flex flex-col">
            <div class="relative w-full aspect-video rounded-xl overflow-hidden mb-2 shadow-md">
                <img src="${toWebp(v.cover || v.thumbnail || FI)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onerror="handleImgError(this)" />
                <span class="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white/90">${es(String(v.duration || 'Video').replace('.', ':'))}</span>
                <div class="search-video-icon absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity ${isCur ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}">
                    ${playIconHtml}
                </div>
            </div>
            <h4 class="search-video-title text-xs line-clamp-2 leading-snug ${titleColor}">${es(v.title)}</h4>
            <p class="text-[11px] text-white/60 truncate mt-0.5">${es(v.artist)}</p>
        </div>`;
    },

    renderAlbumItem(a) {
        return `
        <div onclick="Album.open('${a.id}', '${esJs(a.cover || FI)}', '${esJs(a.title)}')" class="p-2.5 rounded-2xl bg-[#1a1c24] border border-white/10 hover:bg-[#242834] cursor-pointer active:scale-95 transition-all group flex flex-col">
            <div class="w-full aspect-square mb-2.5 rounded-xl overflow-hidden shadow-md">
                <img src="${toWebp(a.cover || FI)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onerror="handleImgError(this)" />
            </div>
            <h4 class="font-semibold text-xs sm:text-sm truncate text-white">${es(a.title)}</h4>
            <p class="text-[11px] text-white/60 truncate mt-0.5">${es(a.artist)}</p>
        </div>`;
    },

    renderAlbumCard(a) {
        return `
        <div onclick="Album.open('${a.id}', '${esJs(a.cover || FI)}', '${esJs(a.title)}')" class="flex-shrink-0 w-36 group p-2.5 rounded-2xl bg-[#1a1c24] border border-white/10 hover:bg-[#242834] cursor-pointer active:scale-95 transition-all flex flex-col">
            <div class="w-full aspect-square mb-2 rounded-xl overflow-hidden shadow-md">
                <img src="${toWebp(a.cover || FI)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onerror="handleImgError(this)" />
            </div>
            <h4 class="font-semibold text-xs truncate text-white">${es(a.title)}</h4>
            <p class="text-[11px] text-white/60 truncate mt-0.5">${es(a.artist)}</p>
        </div>`;
    },

    renderArtistItem(art) {
        return `
        <div onclick="Artist.open('${art.id}', '${esJs(art.title)}')" class="p-3 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/20 hover:border-white/35 backdrop-blur-md cursor-pointer active:scale-95 transition-all text-center flex flex-col items-center justify-center group shadow-sm select-none">
            <div class="relative w-20 h-20 mb-2 rounded-full overflow-hidden border-2 border-white/20 shadow-md group-hover:scale-105 transition-transform duration-300 bg-black/40">
                <img src="${toWebp(art.cover || FI)}" class="w-full h-full object-cover" onerror="handleImgError(this)" />
            </div>
            <h4 class="font-bold text-xs sm:text-sm truncate text-white w-full px-1">${es(art.title)}</h4>
            <p class="text-white/50 text-[9px] font-medium tracking-tight truncate max-w-full mt-0.5 leading-tight">${es(art.artist || 'Artis')}</p>
        </div>`;
    },

    renderArtistCard(art) {
        return `
        <div onclick="Artist.open('${art.id}', '${esJs(art.title)}')" class="flex-shrink-0 w-32 group p-2.5 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/20 hover:border-white/35 backdrop-blur-md cursor-pointer active:scale-95 transition-all flex flex-col items-center text-center shadow-sm select-none">
            <div class="relative w-16 h-16 mb-2 rounded-full overflow-hidden border-2 border-white/20 shadow-md group-hover:scale-105 transition-transform duration-300 bg-black/40">
                <img src="${toWebp(art.cover || FI)}" class="w-full h-full object-cover" onerror="handleImgError(this)" />
            </div>
            <h4 class="font-bold text-xs truncate text-white w-full px-0.5">${es(art.title)}</h4>
            <p class="text-white/50 text-[8.5px] font-medium tracking-tight truncate max-w-full mt-0.5 leading-tight px-0.5">${es(art.artist || 'Artis')}</p>
        </div>`;
    },

    renderPlaylistItem(pl) {
        return `
        <div onclick="Album.open('${pl.id}', '${esJs(pl.cover || FI)}', '${esJs(pl.title)}')" class="p-2.5 rounded-2xl bg-[#1a1c24] border border-white/10 hover:bg-[#242834] cursor-pointer active:scale-95 transition-all group flex flex-col">
            <div class="w-full aspect-square mb-2.5 rounded-xl overflow-hidden shadow-md">
                <img src="${toWebp(pl.cover || FI)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onerror="handleImgError(this)" />
            </div>
            <h4 class="font-semibold text-xs sm:text-sm truncate text-white">${es(pl.title)}</h4>
            <p class="text-[11px] text-white/60 truncate mt-0.5">${es(pl.artist || 'Daftar Putar')}</p>
        </div>`;
    },

    renderPlaylistCard(pl) {
        return `
        <div onclick="Album.open('${pl.id}', '${esJs(pl.cover || FI)}', '${esJs(pl.title)}')" class="flex-shrink-0 w-36 group p-2.5 rounded-2xl bg-[#1a1c24] border border-white/10 hover:bg-[#242834] cursor-pointer active:scale-95 transition-all flex flex-col">
            <div class="w-full aspect-square mb-2 rounded-xl overflow-hidden shadow-md">
                <img src="${toWebp(pl.cover || FI)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onerror="handleImgError(this)" />
            </div>
            <h4 class="font-semibold text-xs truncate text-white">${es(pl.title)}</h4>
            <p class="text-[11px] text-white/60 truncate mt-0.5">${es(pl.artist || 'Daftar Putar')}</p>
        </div>`;
    },

    renderActive() {
        // 1. Sync Song Rows
        var songRows = document.querySelectorAll('.search-song-row');
        var songList = S.searchData?.songs || [];
        if (songRows.length > 0 && songList.length > 0) {
            songRows.forEach(function(el) {
                var idx = parseInt(el.getAttribute('data-idx'), 10);
                if (isNaN(idx) || !songList[idx]) return;
                var t = songList[idx];

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
                    playIconHtml = '<div class="w-7 h-7 rounded-full btn-chrome flex items-center justify-center shrink-0"><div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>';
                } else if (isPlay) {
                    playIconHtml = '<div class="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center shrink-0 shadow-md ring-1 ring-white"><div class="flex items-end justify-center gap-[2px] w-3.5 h-3.5 pb-0.5"><span class="w-[2px] bg-black rounded-full animate-eq-1"></span><span class="w-[2px] bg-black rounded-full animate-eq-2"></span><span class="w-[2px] bg-black rounded-full animate-eq-3"></span></div></div>';
                } else if (isCur) {
                    playIconHtml = '<div class="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center shrink-0 border border-white"><svg class="w-3.5 h-3.5 fill-current ml-0.5" viewBox="0 0 24 24"><polygon points="6 3 20 12 6 21 6 3"/></svg></div>';
                } else {
                    playIconHtml = '<div class="w-7 h-7 rounded-full bg-white/5 group-hover:bg-white/20 flex items-center justify-center shrink-0 text-white/80 group-hover:text-white transition-all"><svg class="w-3.5 h-3.5 fill-current ml-0.5" viewBox="0 0 24 24"><polygon points="6 3 20 12 6 21 6 3"/></svg></div>';
                }

                var iconWrap = el.querySelector('.search-song-icon');
                if (iconWrap) iconWrap.innerHTML = playIconHtml;

                var titleEl = el.querySelector('.search-song-title');
                if (titleEl) {
                    if (isCur) {
                        titleEl.className = 'search-song-title text-sm truncate text-yellow-300 font-bold';
                    } else {
                        titleEl.className = 'search-song-title text-sm truncate text-white font-medium';
                    }
                }

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
            });
        }

        // 2. Sync Video Rows and Cards
        var videoElements = document.querySelectorAll('.search-video-row, .search-video-card');
        var videoList = S.searchData?.videos || [];
        if (videoElements.length > 0 && videoList.length > 0) {
            videoElements.forEach(function(el) {
                var idx = parseInt(el.getAttribute('data-idx'), 10);
                if (isNaN(idx) || !videoList[idx]) return;
                var v = videoList[idx];

                var isCur = S.ct && (
                    S.ct.id === v.id ||
                    S.ct.videoId === v.id ||
                    (S.ct.id && v.videoId && S.ct.id === v.videoId) ||
                    (S.ct.videoId && v.id && S.ct.videoId === v.id) ||
                    (S.ct.title === v.title && S.ct.artist === v.artist)
                );
                var isPlay = isCur && S.ip;
                var isLoad = isCur && S.il;

                var playIconHtml = '';
                var isCard = el.classList.contains('search-video-card');
                var sz = isCard ? 'w-9 h-9' : 'w-10 h-10';
                var iconInner = isCard ? 'w-3.5 h-3.5' : 'w-4 h-4';

                if (isLoad) {
                    playIconHtml = '<div class="'+sz+' rounded-full btn-chrome flex items-center justify-center shadow-lg"><div class="'+iconInner+' border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>';
                } else if (isPlay) {
                    playIconHtml = '<div class="'+sz+' rounded-full bg-white text-black flex items-center justify-center shadow-xl ring-2 ring-white scale-105"><div class="flex items-end justify-center gap-[2px] '+iconInner+' pb-0.5"><span class="w-[2px] bg-black rounded-full animate-eq-1"></span><span class="w-[2px] bg-black rounded-full animate-eq-2"></span><span class="w-[2px] bg-black rounded-full animate-eq-3"></span></div></div>';
                } else if (isCur) {
                    playIconHtml = '<div class="'+sz+' rounded-full bg-white text-black flex items-center justify-center shadow-xl border border-white"><svg class="'+iconInner+' fill-current ml-0.5" viewBox="0 0 24 24"><polygon points="6 3 20 12 6 21 6 3"/></svg></div>';
                } else {
                    playIconHtml = '<div class="'+sz+' rounded-full bg-black/60 group-hover:bg-white/90 group-hover:text-black text-white flex items-center justify-center transition-all shadow-md backdrop-blur-sm"><svg class="'+iconInner+' fill-current ml-0.5" viewBox="0 0 24 24"><polygon points="6 3 20 12 6 21 6 3"/></svg></div>';
                }

                var iconWrap = el.querySelector('.search-video-icon');
                if (iconWrap) {
                    iconWrap.innerHTML = playIconHtml;
                    if (isCur) {
                        iconWrap.classList.remove('opacity-0');
                        iconWrap.classList.add('opacity-100');
                    } else {
                        iconWrap.classList.remove('opacity-100');
                        iconWrap.classList.add('opacity-0');
                    }
                }

                var titleEl = el.querySelector('.search-video-title');
                if (titleEl) {
                    if (isCur) {
                        titleEl.classList.add('text-yellow-300', 'font-bold');
                        titleEl.classList.remove('text-white');
                    } else {
                        titleEl.classList.remove('text-yellow-300', 'font-bold');
                        titleEl.classList.add('text-white');
                    }
                }

                if (isPlay) {
                    el.classList.add('bg-[#343a4e]', 'border-white/40', 'shadow-lg');
                    el.classList.remove('bg-[#1a1c24]', 'bg-[#2e3344]', 'border-white/10', 'border-white/30');
                } else if (isCur) {
                    el.classList.add('bg-[#2e3344]', 'border-white/30');
                    el.classList.remove('bg-[#1a1c24]', 'bg-[#343a4e]', 'border-white/10', 'border-white/40', 'shadow-lg');
                } else {
                    el.classList.add('bg-[#1a1c24]', 'border-white/10');
                    el.classList.remove('bg-[#343a4e]', 'bg-[#2e3344]', 'border-white/40', 'border-white/30', 'shadow-lg');
                }
            });
        }
    }
};

// Global backward compatibility helpers
function selectSuggestion(t) {
    Search.executeSearch(t);
}
function setFilter(f) {
    Search.setFilter(f);
}
