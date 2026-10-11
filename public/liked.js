var Liked = {
    selectMode: false,
    selectedIndices: new Set(),

    getDuplicateInfo() {
        var songs = typeof getLikedSongs === 'function' ? getLikedSongs() : [];
        if (!songs || songs.length <= 1) return { count: 0, indices: [], uniqueSongs: songs };
        var seen = new Set();
        var duplicateIndices = [];
        var uniqueSongs = [];
        songs.forEach(function(s, idx) {
            var key = (s.videoId || s.id || (s.title + '---' + s.artist)).toLowerCase().trim();
            if (seen.has(key)) {
                duplicateIndices.push(idx);
            } else {
                seen.add(key);
                uniqueSongs.push(s);
            }
        });
        return {
            count: duplicateIndices.length,
            indices: duplicateIndices,
            uniqueSongs: uniqueSongs
        };
    },

    cleanDuplicates() {
        var info = Liked.getDuplicateInfo();
        if (info.count === 0) {
            if (typeof showToast === 'function') showToast('Tidak ada lagu duplikat di Lagu Disukai');
            return;
        }

        var popup = document.createElement('div');
        popup.className = 'fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in';
        popup.innerHTML = '<div class="w-full max-w-sm sm:max-w-md rounded-3xl p-6 border border-white/15 shadow-2xl relative" style="animation:slideUp 0.3s ease-out forwards; background: #12141c; box-shadow: 0 20px 40px rgba(245,158,11,0.2);">' +
            '<div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/30 mb-4">' +
                '<i data-lucide="sparkles" class="w-6 h-6"></i>' +
            '</div>' +
            '<h3 class="font-black text-white text-lg mb-1 tracking-tight">Bersihkan ' + info.count + ' Lagu Duplikat?</h3>' +
            '<p class="text-white/70 text-xs leading-relaxed mb-5">Ditemukan <strong class="text-amber-300 font-bold">' + info.count + ' lagu duplikat</strong> di Lagu Disukai. Lagu kembar akan dihapus dan menyisakan satu versi asli.</p>' +
            '<div class="flex gap-2.5">' +
                '<button id="confirm-clean-liked-btn" class="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:opacity-95 active:scale-95 text-white font-bold text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5">' +
                    '<i data-lucide="trash-2" class="w-4 h-4"></i>' +
                    '<span>Bersihkan Duplikat</span>' +
                '</button>' +
                '<button onclick="this.closest(\'.fixed\').remove()" class="py-3 px-5 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-white font-semibold text-xs border border-white/10 transition-all cursor-pointer">Batal</button>' +
            '</div>' +
        '</div>';
        document.body.appendChild(popup);
        lucide.createIcons();

        popup.querySelector('#confirm-clean-liked-btn').onclick = function() {
            saveLikedSongs(info.uniqueSongs);
            popup.remove();
            Liked.render();
            if (typeof updateLikeButtons === 'function') updateLikeButtons();
            if (typeof showToast === 'function') showToast('Berhasil membersihkan ' + info.count + ' lagu duplikat!');
        };
    },

    toggleSelectMode() {
        Liked.selectMode = !Liked.selectMode;
        Liked.selectedIndices.clear();
        Liked.render();
    },

    toggleSongSelect(index) {
        if (Liked.selectedIndices.has(index)) {
            Liked.selectedIndices.delete(index);
        } else {
            Liked.selectedIndices.add(index);
        }
        Liked.updateSelectUI();
    },

    selectAllSongs() {
        var songs = typeof getLikedSongs === 'function' ? getLikedSongs() : [];
        if (Liked.selectedIndices.size === songs.length) {
            Liked.selectedIndices.clear();
        } else {
            songs.forEach(function(_, idx) {
                Liked.selectedIndices.add(idx);
            });
        }
        Liked.updateSelectUI();
    },

    updateSelectUI() {
        var count = Liked.selectedIndices.size;
        var songs = typeof getLikedSongs === 'function' ? getLikedSongs() : [];
        var total = songs.length;

        var countText = gid('liked-select-count-text');
        if (countText) countText.innerText = count + ' Dipilih';

        var btnSelectAll = gid('liked-btn-select-all');
        if (btnSelectAll) {
            btnSelectAll.innerText = count === total && total > 0 ? 'Batal Semua' : 'Pilih Semua';
        }

        var btnDelete = gid('liked-btn-delete-selected');
        if (btnDelete) {
            var txt = btnDelete.querySelector('.anim-delete-text');
            if (txt) {
                txt.innerText = 'Hapus (' + count + ')';
            } else {
                btnDelete.innerHTML = '<i data-lucide="trash-2" class="w-3.5 h-3.5"></i> <span>Hapus (' + count + ')</span>';
            }
            if (count === 0) {
                btnDelete.classList.add('opacity-50', 'pointer-events-none');
            } else {
                btnDelete.classList.remove('opacity-50', 'pointer-events-none');
            }
        }

        var container = gid('liked-songs-container');
        if (container) {
            var items = container.querySelectorAll('.liked-song-row');
            items.forEach(function(row) {
                var idx = parseInt(row.getAttribute('data-liked-idx'), 10);
                var isSel = Liked.selectedIndices.has(idx);
                var cb = row.querySelector('.liked-select-checkbox');
                var title = row.querySelector('.liked-song-title');
                if (isSel) {
                    row.className = 'liked-song-row rounded-2xl bg-rose-500/15 border border-rose-500/40 p-2.5 flex items-center gap-3 active:scale-[0.99] transition-all cursor-pointer shadow-lg shadow-black/25';
                    if (cb) {
                        cb.className = 'liked-select-checkbox w-6 h-6 rounded-lg bg-rose-500 border border-rose-400 text-white shadow-md flex items-center justify-center shrink-0 transition-all';
                    }
                    if (title) {
                        title.className = 'liked-song-title font-semibold text-sm text-rose-300 truncate';
                    }
                } else {
                    row.className = 'liked-song-row rounded-2xl bg-[#20222c] border border-white/10 hover:bg-[#282b38] p-2.5 flex items-center gap-3 active:scale-[0.99] transition-all cursor-pointer shadow-lg shadow-black/25';
                    if (cb) {
                        cb.className = 'liked-select-checkbox w-6 h-6 rounded-lg bg-black/40 border border-white/30 text-transparent flex items-center justify-center shrink-0 transition-all';
                    }
                    if (title) {
                        title.className = 'liked-song-title font-semibold text-sm text-white truncate';
                    }
                }
            });
        }
        lucide.createIcons();
    },

    deleteSingleSong(btn, i) {
        var row = btn.closest('.liked-song-row') || btn.closest('.rounded-2xl');
        playDeleteAnimation(btn, function() {
            if (row) row.classList.add('song-row-deleted');
            setTimeout(function() {
                var songs = typeof getLikedSongs === 'function' ? getLikedSongs() : [];
                if (i >= 0 && i < songs.length) {
                    var removed = songs.splice(i, 1);
                    saveLikedSongs(songs);
                    Liked.render();
                    if (typeof updateLikeButtons === 'function') updateLikeButtons();
                    if (typeof showToast === 'function' && removed[0]) {
                        showToast('Dihapus dari Lagu Disukai: ' + (removed[0].title || ''));
                    }
                }
            }, 380);
        });
    },

    clearAll(btn) {
        var songs = typeof getLikedSongs === 'function' ? getLikedSongs() : [];
        if (!songs.length) return;
        playDeleteAnimation(btn, function() {
            var rows = document.querySelectorAll('#liked-songs-container > div');
            rows.forEach(function(r) { r.classList.add('song-row-deleted'); });
            setTimeout(function() {
                saveLikedSongs([]);
                Liked.selectMode = false;
                Liked.selectedIndices.clear();
                Liked.render();
                if (typeof updateLikeButtons === 'function') updateLikeButtons();
                if (typeof showToast === 'function') showToast('Semua lagu disukai berhasil dibersihkan');
            }, 380);
        });
    },

    deleteSelectedSongs(btn) {
        var songs = typeof getLikedSongs === 'function' ? getLikedSongs() : [];
        var count = Liked.selectedIndices.size;
        if (count === 0) {
            if (typeof showToast === 'function') showToast('Pilih setidaknya 1 lagu terlebih dahulu');
            return;
        }

        var targetBtn = btn || gid('liked-btn-delete-selected');
        playDeleteAnimation(targetBtn, function() {
            var container = gid('liked-songs-container');
            if (container) {
                var items = container.querySelectorAll('.liked-song-row');
                items.forEach(function(row) {
                    var idx = parseInt(row.getAttribute('data-liked-idx'), 10);
                    if (Liked.selectedIndices.has(idx)) {
                        row.classList.add('song-row-deleted');
                    }
                });
            }
            setTimeout(function() {
                var updated = songs.filter(function(_, idx) {
                    return !Liked.selectedIndices.has(idx);
                });
                saveLikedSongs(updated);
                Liked.selectMode = false;
                Liked.selectedIndices.clear();
                Liked.render();
                if (typeof updateLikeButtons === 'function') updateLikeButtons();
                if (typeof showToast === 'function') showToast(count + ' lagu dihapus dari Lagu Disukai');
            }, 380);
        });
    },

    render() {
        var el = gid('view-liked');
        if(!el) return;
        var liked = typeof getLikedSongs === 'function' ? getLikedSongs() : [];
        var dupInfo = Liked.getDuplicateInfo();
        var isSelMode = Liked.selectMode;

        var likedHtml = '';
        if(liked.length > 0) {
            likedHtml = liked.map(function(s, i) {
                if (isSelMode) {
                    var isSel = Liked.selectedIndices.has(i);
                    return '<div onclick="Liked.toggleSongSelect('+i+')" data-liked-idx="'+i+'" class="liked-song-row rounded-2xl '+(isSel ? 'bg-rose-500/15 border border-rose-500/40' : 'bg-[#20222c] border border-white/10 hover:bg-[#282b38]')+' p-2.5 flex items-center gap-3 active:scale-[0.99] transition-all cursor-pointer shadow-lg shadow-black/25">'+
                        '<div class="liked-select-checkbox w-6 h-6 rounded-lg '+(isSel ? 'bg-rose-500 border border-rose-400 text-white shadow-md' : 'bg-black/40 border border-white/30 text-transparent')+' flex items-center justify-center shrink-0 transition-all">'+
                            '<i data-lucide="check" class="w-4 h-4 stroke-[3]"></i>'+
                        '</div>'+
                        '<img src="'+s.cover+'" class="w-12 h-12 rounded-xl object-cover shrink-0 shadow-md border border-white/10" onerror="this.src=\''+FI+'\'" />'+
                        '<div class="min-w-0 flex-1">'+
                            '<h3 class="liked-song-title font-semibold text-sm '+(isSel ? 'text-rose-300' : 'text-white')+' truncate">'+es(s.title)+'</h3>'+
                            '<p class="text-xs text-white/60 truncate mt-0.5">'+es(s.artist)+'</p>'+
                        '</div>'+
                    '</div>';
                }

                var isCur = S.ct && (
                    (s.id && (S.ct.id === s.id || S.ct.videoId === s.id)) ||
                    (s.videoId && (S.ct.id === s.videoId || S.ct.videoId === s.videoId)) ||
                    (S.ct.title && s.title && S.ct.title.trim().toLowerCase() === s.title.trim().toLowerCase())
                );
                var isPlay = isCur && S.ip;
                var isLoad = isCur && S.il;

                var playIconHtml = '';
                if (isLoad) {
                    playIconHtml = '<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>';
                } else if (isPlay) {
                    playIconHtml = '<div class="flex items-end justify-center gap-[2px] w-4 h-4 pb-0.5"><span class="w-[2px] bg-white rounded-full animate-eq-1"></span><span class="w-[2px] bg-white rounded-full animate-eq-2"></span><span class="w-[2px] bg-white rounded-full animate-eq-3"></span></div>';
                } else if (isCur) {
                    playIconHtml = '<i data-lucide="pause" class="w-4 h-4 text-white fill-current"></i>';
                } else {
                    playIconHtml = '<i data-lucide="play" class="w-4 h-4 text-white fill-current ml-0.5"></i>';
                }

                var cardBg = isPlay 
                    ? 'bg-white/20 border-white/40 shadow-lg shadow-white/10' 
                    : (isCur ? 'bg-white/15 border-white/30' : 'bg-white/[0.08] hover:bg-white/[0.14] border-white/20 hover:border-white/35 shadow-sm');

                var deleteBtnHtml = window.getAnimDeleteBtnHtml ?
                    getAnimDeleteBtnHtml('', 'anim-delete-mini', 'event.stopPropagation();Liked.deleteSingleSong(this,'+i+')', 'Hapus dari Lagu Disukai') :
                    '<button onclick="event.stopPropagation();Liked.deleteSingleSong(this,'+i+')" class="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0 hover:bg-rose-500/30 active:scale-90 transition-all cursor-pointer" title="Hapus dari Disukai"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>';

                return '<div class="liked-song-row rounded-full border '+cardBg+' p-1.5 pr-3 sm:p-2 sm:pr-4 flex items-center gap-2.5 sm:gap-3 active:scale-95 transition-all duration-200 group backdrop-blur-md select-none">'+
                    '<div onclick="PK(\'liked\','+i+')" class="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0 cursor-pointer">'+
                        '<div class="w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden shrink-0 shadow-sm border border-white/20 bg-black/40 relative">'+
                            '<img src="'+s.cover+'" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onerror="this.src=\''+FI+'\'" />'+
                        '</div>'+
                        '<div class="min-w-0 flex-1">'+
                            '<h3 class="font-bold text-xs sm:text-sm text-white truncate">'+es(s.title)+'</h3>'+
                            '<p class="text-[11px] text-white/60 truncate mt-0.5">'+es(s.artist)+'</p>'+
                        '</div>'+
                    '</div>'+
                    deleteBtnHtml+
                    '<button onclick="PK(\'liked\','+i+')" class="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center shrink-0 hover:bg-white/20 border border-white/15 active:scale-90 transition-all cursor-pointer">'+
                        playIconHtml+
                    '</button>'+
                '</div>';
            }).join('');
        } else {
            likedHtml = '<div class="text-center py-16 rounded-3xl bg-white/[0.04] border border-white/10 px-4"><div class="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-3"><i data-lucide="heart" class="w-8 h-8 text-rose-400"></i></div><h3 class="text-white font-bold text-base mb-1">Belum ada lagu disukai</h3><p class="text-white/60 text-xs max-w-xs mx-auto">Klik ikon hati pada lagu favoritmu untuk menyimpannya di sini.</p></div>';
        }

        var headerHtml = '';
        if (isSelMode) {
            var deleteSelectedBtnHtml = window.getAnimDeleteBtnHtml ?
                getAnimDeleteBtnHtml('Hapus (' + Liked.selectedIndices.size + ')', 'text-xs h-8 min-w-[95px] px-3 font-bold ' + (Liked.selectedIndices.size === 0 ? 'opacity-50 pointer-events-none' : ''), 'Liked.deleteSelectedSongs(this)', 'Hapus Lagu Terpilih', 'liked-btn-delete-selected') :
                `<button id="liked-btn-delete-selected" onclick="Liked.deleteSelectedSongs(this)" class="px-3.5 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-red-500/20 transition-all cursor-pointer ${Liked.selectedIndices.size === 0 ? 'opacity-50 pointer-events-none' : ''}"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i><span>Hapus (${Liked.selectedIndices.size})</span></button>`;

            headerHtml = `
            <div class="pt-6 pb-3.5 px-4 sticky top-0 z-30 border-b border-white/10 shadow-2xl transition-all flex justify-between items-center bg-[#0d0f16]/95 backdrop-blur-xl">
                <div class="flex items-center gap-2">
                    <button onclick="Liked.toggleSelectMode()" class="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white active:scale-90 transition-all cursor-pointer" title="Batal"><i data-lucide="x" class="w-5 h-5"></i></button>
                    <span id="liked-select-count-text" class="text-xs font-bold text-white px-2.5 py-1 rounded-lg bg-rose-500/20 border border-rose-500/30 font-mono tracking-tight">${Liked.selectedIndices.size} Dipilih</span>
                </div>
                <div class="flex items-center gap-2">
                    <button id="liked-btn-select-all" onclick="Liked.selectAllSongs()" class="text-xs font-semibold text-white/80 hover:text-white px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 transition-all cursor-pointer">
                        ${Liked.selectedIndices.size === liked.length && liked.length > 0 ? 'Batal Semua' : 'Pilih Semua'}
                    </button>
                    <div id="liked-btn-delete-selected-wrap" class="inline-flex">
                        ${deleteSelectedBtnHtml}
                    </div>
                </div>
            </div>`;
        } else {
            headerHtml = `
            <div class="pt-8 pb-3.5 px-4 sticky top-0 z-30 border-b border-white/10 shadow-2xl transition-all flex justify-between items-center" style="background: linear-gradient(180deg, rgba(13, 15, 22, 0.88) 0%, rgba(13, 15, 22, 0.97) 100%), url('/banner.png') center/cover no-repeat; backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);">
                <h1 class="text-3xl font-black text-white tracking-tight drop-shadow-md">Liked Songs</h1>
                <div class="w-10 h-10 rounded-2xl bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-rose-400 shadow-lg">
                    <i data-lucide="heart" class="w-5 h-5 fill-current"></i>
                </div>
            </div>`;
        }

        el.innerHTML = headerHtml + `
        <div class="px-4 mt-4 space-y-3">
            ${liked.length > 0 && !isSelMode ? `
                <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span class="text-xs font-semibold text-white/60 uppercase tracking-wider">${liked.length} Lagu Tersimpan</span>
                    <div class="flex items-center gap-2">
                        <button onclick="Liked.cleanDuplicates()" class="text-xs ${dupInfo.count > 0 ? 'text-amber-300 bg-amber-500/20 border-amber-500/30' : 'text-white/80 bg-white/10 border-white/10'} hover:bg-white/20 px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1 transition-all cursor-pointer" title="Cek & Bersihkan Lagu Duplikat">
                            <i data-lucide="sparkles" class="w-3.5 h-3.5 text-amber-400"></i>
                            <span>${dupInfo.count > 0 ? 'Duplikat (' + dupInfo.count + ')' : 'Cek Duplikat'}</span>
                        </button>
                        <button onclick="Liked.toggleSelectMode()" class="text-xs text-rose-300 bg-rose-500/20 border border-rose-500/30 hover:bg-rose-500/30 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer" title="Pilih Banyak Lagu">
                            <i data-lucide="check-square" class="w-3.5 h-3.5"></i>
                            <span>Pilih</span>
                        </button>
                        <button onclick="PK('liked',0)" class="text-xs text-white bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-lg border border-white/15 font-bold flex items-center gap-1 transition-all cursor-pointer">
                            <i data-lucide="play" class="w-3.5 h-3.5 fill-current"></i>
                            <span>Putar</span>
                        </button>
                    </div>
                </div>

                ${dupInfo.count > 0 ? `
                    <div class="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/30 flex items-center justify-between gap-3 shadow-lg">
                        <div class="flex items-center gap-2.5 min-w-0">
                            <div class="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400">
                                <i data-lucide="sparkles" class="w-4 h-4"></i>
                            </div>
                            <div class="min-w-0">
                                <p class="text-xs font-bold text-amber-300">Ada ${dupInfo.count} Lagu Duplikat</p>
                                <p class="text-[10px] text-amber-200/80 truncate">Bersihkan agar daftar favoritmu rapi</p>
                            </div>
                        </div>
                        <button onclick="Liked.cleanDuplicates()" class="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-black text-xs shrink-0 shadow-md transition-all cursor-pointer flex items-center gap-1">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                            <span>Bersihkan</span>
                        </button>
                    </div>
                ` : ''}
            ` : ''}
            <div id="liked-songs-container" class="space-y-2.5">${likedHtml}</div>
        </div>`;
        lucide.createIcons();
    },
    renderActive() {
        if (typeof S === 'undefined' || !S.at || S.at !== 'liked') return;
        var container = gid('liked-songs-container');
        if (!container || Liked.isSelectMode) return;
        Liked.render();
    }
};

