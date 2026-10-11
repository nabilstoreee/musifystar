// SECURITY SHIELD: DevTools & Client Tamper Protection
(function() {
    try {
        if (typeof console !== 'undefined' && console.log) {
            console.log(
                '%c🛡️ MUSIFYSTAR SECURITY SHIELD ACTIVE%c\n' +
                'Kredensial database (DATABASE_URL) dan rahasia sistem diisolasi 100% di server backend.\n' +
                'Tidak ada data sensitif yang dapat diakses atau dimanipulasi melalui browser DevTools.\n' +
                'Jangan menempelkan (paste) skrip asing ke konsol ini (Self-XSS Protection).',
                'color: #00f2fe; font-size: 15px; font-weight: bold; background: #0f172a; padding: 4px 10px; border-radius: 6px;',
                'color: #94a3b8; font-size: 11px; margin-top: 4px;'
            );
        }
    } catch(e) {}
})();

// PWA - INSTALL & OFFLINE MODE HANDLING
var deferredInstallPrompt=null;
var isStandaloneApp=(window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches)||window.navigator.standalone===true;
var isIOSDevice=/iPad|iPhone|iPod/.test(navigator.userAgent)&&!window.MSStream;

// Auto-fix PWA detection for users who have it installed but browser doesn't report standalone
if (isStandaloneApp) {
    try { localStorage.setItem('pwa_installed', 'true'); } catch(e){}
} else if (localStorage.getItem('pwa_installed') === 'true') {
    isStandaloneApp = true;
}

function showToast(msg) {
    var existing = document.getElementById('global-app-toast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.id = 'global-app-toast';
    toast.className = 'fixed top-4 left-1/2 -translate-x-1/2 z-[600] bg-zinc-900/95 text-white text-xs font-semibold px-4 py-2.5 rounded-full border border-white/15 shadow-2xl backdrop-blur-md flex items-center space-x-2 transition-all duration-300 transform -translate-y-4 opacity-0 pointer-events-none';
    toast.innerHTML = '<span>' + (typeof es === 'function' ? es(msg) : String(msg)) + '</span>';
    document.body.appendChild(toast);
    setTimeout(function(){
        toast.classList.remove('-translate-y-4', 'opacity-0', 'pointer-events-none');
        toast.classList.add('translate-y-0', 'opacity-100');
    }, 10);
    setTimeout(function(){
        if(toast && toast.parentElement) {
            toast.classList.remove('translate-y-0', 'opacity-100');
            toast.classList.add('-translate-y-4', 'opacity-0', 'pointer-events-none');
            setTimeout(function(){ if(toast.parentElement) toast.remove(); }, 300);
        }
    }, 3200);
}

function updateOnlineOfflineStatus() {
    var banner = document.getElementById('pwa-offline-banner');
    if (!navigator.onLine) {
        if (banner) banner.classList.remove('hidden');
        showToast('Mode Offline APK Aktif — Memutar lagu & lirik tersimpan');
    } else {
        if (banner) banner.classList.add('hidden');
    }
}

function clearPwaCache() {
    if ('caches' in window) {
        caches.keys().then(function(names) {
            names.forEach(function(name) { caches.delete(name); });
        });
    }
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
            for (var registration of registrations) {
                registration.unregister();
            }
        });
    }
    localStorage.removeItem('pwa_lyrics_cache');
    localStorage.removeItem('pwa_audio_cache');
    if (typeof lyricsCache !== 'undefined') lyricsCache = {};
    if (typeof audioUrlCache !== 'undefined') audioUrlCache = {};
    showToast('Cache offline Apk dibersihkan. Memuat ulang...');
    setTimeout(function() {
        window.location.reload(true);
    }, 700);
}

window.addEventListener('online', function() {
    updateOnlineOfflineStatus();
    showToast('Koneksi internet terhubung kembali (Online)');
    if (typeof S !== 'undefined' && S.at === 'home' && typeof Home !== 'undefined') {
        Home.render();
    }
});
window.addEventListener('offline', function() {
    updateOnlineOfflineStatus();
    if (typeof S !== 'undefined' && S.at === 'home' && typeof Home !== 'undefined') {
        Home.render();
    }
});
document.addEventListener('DOMContentLoaded', updateOnlineOfflineStatus);

window.addEventListener('beforeinstallprompt',function(e){
    e.preventDefault();
    deferredInstallPrompt=e;
    var btn=document.getElementById('pwa-install-btn');
    if(btn&&!isStandaloneApp)btn.classList.remove('hidden');
});
window.addEventListener('appinstalled',function(){
    deferredInstallPrompt=null;
    try { localStorage.setItem('pwa_installed', 'true'); } catch(e){}
    isStandaloneApp = true;
    var btn=document.getElementById('pwa-install-btn');
    if(btn)btn.classList.add('hidden');
    showToast('MusifyStar berhasil diinstall!');
});

function isPwaInstalled() {
    return isStandaloneApp || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true || localStorage.getItem('pwa_installed') === 'true';
}

function showPwaRequiredModal() {
    var existing = document.getElementById('pwa-required-modal');
    if (existing) existing.remove();

    var modal = document.createElement('div');
    modal.id = 'pwa-required-modal';
    modal.className = 'fixed inset-0 z-[700] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in';
    modal.onclick = function(e){ if(e.target === modal) modal.remove(); };
    modal.innerHTML = '<div class="bg-[#121318] border border-white/15 rounded-2xl p-5 max-w-xs w-full text-center space-y-3 shadow-2xl relative" onclick="event.stopPropagation()">'+
        '<div class="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 text-white flex items-center justify-center mx-auto shadow-md">'+
            '<i data-lucide="smartphone" class="w-6 h-6 text-white"></i>'+
        '</div>'+
        '<div class="space-y-1">'+
            '<h3 class="text-white font-bold text-sm">Install Aplikasi Terlebih Dahulu</h3>'+
            '<p class="text-white/60 text-xs leading-relaxed">'+
                'Fitur Mode Offline khusus untuk aplikasi. Silakan install MusifyStar ke layar utama terlebih dahulu.'+
            '</p>'+
        '</div>'+
        '<div class="space-y-2 pt-1">'+
            '<button onclick="document.getElementById(\'pwa-required-modal\').remove(); installPWA();" class="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-gray-200 text-black font-bold text-xs shadow-md active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer">'+
                '<i data-lucide="download" class="w-4 h-4"></i>'+
                '<span>Install Aplikasi</span>'+
            '</button>'+
            '<button onclick="document.getElementById(\'pwa-required-modal\').remove();" class="w-full py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-semibold text-xs active:scale-95 transition cursor-pointer">'+
                'Tutup'+
            '</button>'+
        '</div>'+
    '</div>';
    document.body.appendChild(modal);
    if (window.lucide) lucide.createIcons();
}

function installPWA(){
    if(deferredInstallPrompt){
        deferredInstallPrompt.prompt();
        deferredInstallPrompt.userChoice.then(function(choice){
            if(choice.outcome==='accepted') {
                try { localStorage.setItem('pwa_installed', 'true'); } catch(e){}
                isStandaloneApp = true;
                showToast('Menginstall NanzMusify...');
            }
            deferredInstallPrompt=null;
            var btn=document.getElementById('pwa-install-btn');
            if(btn)btn.classList.add('hidden');
        });
    }else if(isIOSDevice){
        showToast('Tap ikon Bagikan lalu pilih "Add to Home Screen"');
    }else{
        showToast('Petunjuk: Buka menu browser lalu pilih "Tambah ke Layar Utama" / "Install Aplikasi"');
    }
}

// Offline PWA Storage Helper
function getOfflineSongs() {
    try {
        var data = localStorage.getItem('pwa_offline_tracks');
        return data ? JSON.parse(data) : [];
    } catch(e) {
        return [];
    }
}

function isOfflineSong(track) {
    if (!track) return false;
    var vid = track.videoId || track.id;
    var list = getOfflineSongs();
    return list.some(function(s) {
        return (s.videoId === vid || s.id === vid);
    });
}

async function saveTrackForOffline(track) {
    if (!isPwaInstalled()) {
        showPwaRequiredModal();
        return false;
    }
    if (!track) return;
    var vid = track.videoId || track.id;
    if (!vid) return;

    var list = getOfflineSongs();
    var existingIndex = list.findIndex(function(s) { return (s.videoId === vid || s.id === vid); });

    if (existingIndex !== -1) {
        // Remove from offline
        list.splice(existingIndex, 1);
        try { localStorage.setItem('pwa_offline_tracks', JSON.stringify(list)); } catch(e){}
        showToast('Lagu dihapus dari Mode Offline APK');
        updateOfflineButtons();
        if (typeof OfflineView !== 'undefined' && typeof S !== 'undefined' && S.at === 'offline') OfflineView.render();
        return false;
    }

    showToast('Menyimpan lagu ke Mode Offline APK...');

    // 1. Add track metadata to list
    var songObj = {
        id: vid,
        videoId: vid,
        title: track.title || 'Lagu',
        artist: track.artist || 'Unknown Artist',
        cover: track.cover || (typeof toHDCover==='function'?toHDCover('', vid):''),
        artistId: track.artistId || '',
        ytUrl: track.ytUrl || ('https://youtube.com/watch?v=' + vid),
        savedAt: Date.now()
    };
    list.unshift(songObj);
    try { localStorage.setItem('pwa_offline_tracks', JSON.stringify(list)); } catch(e){}

    // 2. Pre-fetch & cache Audio URL
    try {
        if (typeof audioUrlCache !== 'undefined' && !audioUrlCache[vid]) {
            var ytUrl = track.ytUrl || ('https://youtube.com/watch?v=' + vid);
            var r = await fetch(API.ytplay, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: ytUrl,
                    title: track.title || '',
                    artist: track.artist || ''
                })
            });
            var d = await r.json();
            if (d && d.result && d.result.download && d.result.download.audio) {
                audioUrlCache[vid] = d.result.download.audio;
                if (typeof savePwaCaches === 'function') savePwaCaches();
            }
        }
    } catch(e) {}

    // 3. Pre-fetch & cache Lyrics
    try {
        var cachedLyric = (typeof lyricsCache !== 'undefined' && lyricsCache[vid]) ? lyricsCache[vid] : null;
        if (!cachedLyric && typeof S !== 'undefined' && S.ld && S.ld.vid === vid && S.ld.lines && S.ld.lines.length > 0) {
            cachedLyric = S.ld;
        }

        if (!cachedLyric) {
            var tParam = (songObj && songObj.title) ? '&title=' + encodeURIComponent(songObj.title) : '';
            var aParam = (songObj && songObj.artist) ? '&artist=' + encodeURIComponent(songObj.artist) : '';
            var lr = await fetch(API.lyrics + '?id=' + vid + tParam + aParam);
            var ld = await lr.json();
            if (ld && ld.status && ld.result && ld.result.lyrics) {
                cachedLyric = {
                    vid: vid,
                    type: ld.result.lyrics.type || 'none',
                    lines: ld.result.lyrics.lines || []
                };
            }
        }

        if (cachedLyric) {
            if (typeof lyricsCache !== 'undefined') {
                lyricsCache[vid] = cachedLyric;
            }
            songObj.lyrics = cachedLyric;
            if (typeof savePwaCaches === 'function') savePwaCaches();
            try { localStorage.setItem('pwa_offline_tracks', JSON.stringify(list)); } catch(e){}
        }
    } catch(e) {}

    showToast('Lagu "' + track.title + '" tersimpan untuk Mode Offline!');
    updateOfflineButtons();
    if (typeof OfflineView !== 'undefined' && typeof S !== 'undefined' && S.at === 'offline') OfflineView.render();
    return true;
}

function toggleCurrentOffline() {
    if (typeof S === 'undefined' || !S.ct) {
        showToast('Pilih lagu terlebih dahulu');
        return;
    }
    saveTrackForOffline(S.ct);
}

function updateOfflineButtons() {
    if (typeof S === 'undefined') return;
    var isSaved = S.ct ? isOfflineSong(S.ct) : false;
    
    // Update FullPlayer Offline Button
    var fullBtn = gid('full-offline-btn');
    if (fullBtn) {
        if (isSaved) {
            fullBtn.className = 'w-11 h-11 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center active:scale-90 transition-all shrink-0 cursor-pointer shadow-md';
            fullBtn.title = 'Tersimpan di Mode Offline APK (Klik untuk menghapus)';
            fullBtn.innerHTML = '<i data-lucide="check-circle-2" class="w-5 h-5"></i>';
        } else {
            fullBtn.className = 'w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white flex items-center justify-center active:scale-90 transition-all shrink-0 cursor-pointer shadow-md';
            fullBtn.title = 'Simpan ke Mode Offline APK';
            fullBtn.innerHTML = '<i data-lucide="wifi-off" class="w-5 h-5"></i>';
        }
    }

    if (window.lucide) lucide.createIcons();
}

/* ===== Global Animated Delete Button Helpers (Video Interaction) ===== */
window.getAnimDeleteBtnHtml = function(text, extraClass, onClickCode, title, id) {
    var hasText = text && String(text).trim().length > 0;
    var btnClass = 'anim-delete-btn' + (extraClass ? ' ' + extraClass : '') + (!hasText ? ' anim-delete-mini' : '');
    var idAttr = id ? ' id="' + id + '"' : '';
    return '<button type="button"' + idAttr + ' class="' + btnClass + '" onclick="' + onClickCode + '" title="' + (title || 'Hapus') + '" aria-label="' + (title || 'Hapus') + '">' +
        '<div class="anim-trash">' +
            '<svg class="anim-trash-lid" viewBox="0 0 15 5" fill="none">' +
                '<path d="M1 4h13M5.5 1h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />' +
            '</svg>' +
            '<svg class="anim-trash-box" viewBox="0 0 14 14" fill="none">' +
                '<path d="M1.5 1l1 11a1.5 1.5 0 001.5 1.5h6a1.5 1.5 0 001.5-1.5L12.5 1M5 4.5v6M9 4.5v6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />' +
            '</svg>' +
        '</div>' +
        (hasText ? '<span class="anim-delete-text">' + text + '</span>' : '') +
        '<svg class="anim-delete-progress" viewBox="0 0 36 36">' +
            '<circle class="anim-progress-bg" cx="18" cy="18" r="14" />' +
            '<circle class="anim-progress-bar" cx="18" cy="18" r="14" />' +
        '</svg>' +
        '<div class="anim-check-icon">' +
            '<svg viewBox="0 0 16 16" fill="none" class="w-4 h-4">' +
                '<path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />' +
            '</svg>' +
        '</div>' +
    '</button>';
};

window.playDeleteAnimation = function(btn, onComplete) {
    if (!btn || btn.classList.contains('animating')) return;
    btn.classList.add('animating');

    // Phase 1: Open lid & text drops in (0 - 260ms)
    setTimeout(function() {
        btn.classList.add('morph-circle');
    }, 260);

    // Phase 2: Start circular progress ring sweep (320ms)
    setTimeout(function() {
        btn.classList.add('progress-fill');
    }, 320);

    // Phase 3: Checkmark success (1150ms)
    setTimeout(function() {
        btn.classList.add('success');
    }, 1150);

    // Phase 4: Execute onComplete (1550ms)
    setTimeout(function() {
        if (typeof onComplete === 'function') onComplete();
    }, 1550);
};

function isSameOfflineSong(ct, s) {
    if (!ct || !s) return false;
    var ctVid = ct.videoId || ct.id;
    var sVid = s.videoId || s.id;
    if (ctVid && sVid && String(ctVid) === String(sVid)) return true;
    if (ct.title && s.title) {
        var ctTitle = String(ct.title).trim().toLowerCase();
        var sTitle = String(s.title).trim().toLowerCase();
        if (ctTitle === sTitle) {
            if (!ct.artist || !s.artist) return true;
            return String(ct.artist).trim().toLowerCase() === String(s.artist).trim().toLowerCase();
        }
    }
    return false;
}

var OfflineView = {
    selectMode: false,
    selectedIndices: new Set(),

    toggleSelectMode() {
        OfflineView.selectMode = !OfflineView.selectMode;
        OfflineView.selectedIndices.clear();
        OfflineView.render();
    },

    toggleSongSelect(index) {
        if (OfflineView.selectedIndices.has(index)) {
            OfflineView.selectedIndices.delete(index);
        } else {
            OfflineView.selectedIndices.add(index);
        }
        OfflineView.updateSelectUI();
    },

    selectAllSongs() {
        var songs = typeof getOfflineSongs === 'function' ? getOfflineSongs() : [];
        if (OfflineView.selectedIndices.size === songs.length) {
            OfflineView.selectedIndices.clear();
        } else {
            songs.forEach(function(_, idx) {
                OfflineView.selectedIndices.add(idx);
            });
        }
        OfflineView.updateSelectUI();
    },

    updateSelectUI() {
        var count = OfflineView.selectedIndices.size;
        var songs = typeof getOfflineSongs === 'function' ? getOfflineSongs() : [];
        var total = songs.length;

        var countText = gid('offline-select-count-text');
        if (countText) countText.innerText = count + ' Dipilih';

        var btnSelectAll = gid('offline-btn-select-all');
        if (btnSelectAll) {
            btnSelectAll.innerText = count === total && total > 0 ? 'Batal Semua' : 'Pilih Semua';
        }

        var btnDelete = gid('offline-btn-delete-selected');
        if (btnDelete) {
            var txt = btnDelete.querySelector('.anim-delete-text');
            if (txt) {
                txt.innerText = 'Hapus (' + count + ')';
            }
            if (count === 0) {
                btnDelete.classList.add('opacity-50', 'pointer-events-none');
            } else {
                btnDelete.classList.remove('opacity-50', 'pointer-events-none');
            }
        }

        var container = gid('offline-songs-container');
        if (container) {
            var items = container.querySelectorAll('.offline-song-row');
            items.forEach(function(row) {
                var idx = parseInt(row.getAttribute('data-offline-idx'), 10);
                var isSel = OfflineView.selectedIndices.has(idx);
                var cb = row.querySelector('.offline-select-checkbox');
                var title = row.querySelector('.offline-song-title');
                if (isSel) {
                    row.className = 'offline-song-row rounded-2xl bg-purple-500/15 border border-purple-500/40 p-2.5 flex items-center gap-3 active:scale-[0.99] transition-all cursor-pointer shadow-lg shadow-black/25';
                    if (cb) {
                        cb.className = 'offline-select-checkbox w-6 h-6 rounded-lg bg-purple-500 border border-purple-400 text-white shadow-md flex items-center justify-center shrink-0 transition-all';
                    }
                    if (title) {
                        title.className = 'offline-song-title font-semibold text-sm text-purple-300 truncate';
                    }
                } else {
                    row.className = 'offline-song-row rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] p-2.5 flex items-center gap-3 active:scale-[0.99] transition-all cursor-pointer shadow-md';
                    if (cb) {
                        cb.className = 'offline-select-checkbox w-6 h-6 rounded-lg bg-black/40 border border-white/30 text-transparent flex items-center justify-center shrink-0 transition-all';
                    }
                    if (title) {
                        title.className = 'offline-song-title font-semibold text-sm text-white/90 truncate';
                    }
                }
            });
        }
        if (window.lucide) lucide.createIcons();
    },

    deleteSelectedSongs(btn) {
        var songs = typeof getOfflineSongs === 'function' ? getOfflineSongs() : [];
        var count = OfflineView.selectedIndices.size;
        if (count === 0) return;

        var targetBtn = btn || gid('offline-btn-delete-selected');
        playDeleteAnimation(targetBtn, function() {
            var container = gid('offline-songs-container');
            if (container) {
                var items = container.querySelectorAll('.offline-song-row');
                items.forEach(function(row) {
                    var idx = parseInt(row.getAttribute('data-offline-idx'), 10);
                    if (OfflineView.selectedIndices.has(idx)) {
                        row.classList.add('song-row-deleted');
                    }
                });
            }
            setTimeout(function() {
                var remaining = songs.filter(function(_, idx) {
                    return !OfflineView.selectedIndices.has(idx);
                });
                try {
                    localStorage.setItem('pwa_offline_tracks', JSON.stringify(remaining));
                } catch(e) {}
                OfflineView.selectMode = false;
                OfflineView.selectedIndices.clear();
                OfflineView.render();
                if (typeof updateOfflineButtons === 'function') updateOfflineButtons();
                if (typeof showToast === 'function') showToast(count + ' lagu dihapus dari Mode Offline');
            }, 380);
        });
    },

    deleteSong(btn, song, index) {
        var row = btn.closest('.offline-song-row') || btn.closest('.flex');
        playDeleteAnimation(btn, function() {
            if (row) row.classList.add('song-row-deleted');
            setTimeout(function() {
                var list = typeof getOfflineSongs === 'function' ? getOfflineSongs() : [];
                var vid = song.videoId || song.id;
                var idx = list.findIndex(function(s) { return (s.videoId === vid || s.id === vid); });
                if (idx !== -1) {
                    list.splice(idx, 1);
                    try { localStorage.setItem('pwa_offline_tracks', JSON.stringify(list)); } catch(e){}
                }
                if (typeof updateOfflineButtons === 'function') updateOfflineButtons();
                OfflineView.render();
                if (typeof showToast === 'function') {
                    showToast('Lagu dihapus dari Offline: ' + (song.title || ''));
                }
            }, 380);
        });
    },

    clearAll(btn) {
        var offlineSongs = typeof getOfflineSongs === 'function' ? getOfflineSongs() : [];
        if (!offlineSongs.length) return;
        playDeleteAnimation(btn, function() {
            var rows = document.querySelectorAll('.offline-song-row');
            rows.forEach(function(r) { r.classList.add('song-row-deleted'); });
            setTimeout(function() {
                try {
                    localStorage.removeItem('pwa_offline_tracks');
                    if (window.caches) {
                        caches.delete('musifystar-audio-v1').catch(function(){});
                    }
                } catch(e) {}
                OfflineView.render();
                if (typeof updateOfflineButtons === 'function') updateOfflineButtons();
                if (typeof showToast === 'function') showToast('Semua lagu offline berhasil dihapus');
            }, 380);
        });
    },

    renderActive() {
        if (OfflineView.selectMode) return;
        var container = gid('offline-songs-container');
        if (!container) return;
        var offlineSongs = typeof getOfflineSongs === 'function' ? getOfflineSongs() : [];
        if (!offlineSongs.length) return;

        var rows = container.querySelectorAll('.offline-song-row');
        rows.forEach(function(row) {
            var idx = parseInt(row.getAttribute('data-offline-idx'), 10);
            if (isNaN(idx) || !offlineSongs[idx]) return;
            var s = offlineSongs[idx];

            var isCur = isSameOfflineSong(S.ct, s);
            var isPlay = isCur && S.ip;
            var isLoad = isCur && S.il;

            var playIconHtml = '';
            if (isLoad) {
                playIconHtml = '<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>';
            } else if (isPlay) {
                playIconHtml = '<div class="flex items-end justify-center gap-[2px] w-4 h-4 pb-0.5"><span class="w-[2px] bg-white rounded-full animate-eq-1"></span><span class="w-[2px] bg-white rounded-full animate-eq-2"></span><span class="w-[2px] bg-white rounded-full animate-eq-3"></span></div>';
            } else if (isCur) {
                playIconHtml = '<svg class="w-4 h-4 fill-current text-white" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
            } else {
                playIconHtml = '<svg class="w-4 h-4 fill-current text-white ml-0.5" viewBox="0 0 24 24"><polygon points="6 3 20 12 6 21 6 3"/></svg>';
            }

            var cardBg = isPlay 
                ? 'bg-white/20 border-white/40 shadow-lg shadow-white/10' 
                : (isCur ? 'bg-white/15 border-white/30' : 'bg-white/[0.08] hover:bg-white/[0.14] border-white/20 hover:border-white/35 shadow-sm');
            var titleClass = isCur ? 'text-white font-black' : 'text-white/90 font-bold';

            row.className = 'offline-song-row flex items-center gap-2.5 sm:gap-3 p-1.5 pr-3 sm:p-2 sm:pr-4 rounded-full border ' + cardBg + ' active:scale-95 transition-all duration-200 group backdrop-blur-md select-none';
            var titleEl = row.querySelector('.offline-song-title');
            if (titleEl) {
                titleEl.className = 'offline-song-title ' + titleClass + ' text-xs sm:text-sm truncate';
            }
            var btnEl = row.querySelector('.offline-play-btn');
            if (btnEl) {
                btnEl.innerHTML = playIconHtml;
                btnEl.className = 'offline-play-btn w-8 h-8 rounded-full ' + (isCur ? 'bg-white/25 text-white' : 'bg-white/10 text-white') + ' flex items-center justify-center shrink-0 hover:bg-white/20 border border-white/15 active:scale-90 transition-all shadow-sm';
            }
        });
    },

    render() {
        var el = gid('view-offline');
        if (!el) return;

        var offlineSongs = typeof getOfflineSongs === 'function' ? getOfflineSongs() : [];
        var isOnline = navigator.onLine;
        var isSelMode = OfflineView.selectMode;

        var songsHtml = '';
        if (offlineSongs.length > 0) {
            songsHtml = offlineSongs.map(function(s, i) {
                if (isSelMode) {
                    var isSel = OfflineView.selectedIndices.has(i);
                    return '<div onclick="OfflineView.toggleSongSelect('+i+')" data-offline-idx="'+i+'" class="offline-song-row rounded-2xl '+(isSel ? 'bg-purple-500/15 border border-purple-500/40' : 'bg-white/[0.04] border border-white/10 hover:bg-white/[0.08]')+' p-2.5 flex items-center gap-3 active:scale-[0.99] transition-all cursor-pointer shadow-md">'+
                        '<div class="offline-select-checkbox w-6 h-6 rounded-lg '+(isSel ? 'bg-purple-500 border border-purple-400 text-white shadow-md' : 'bg-black/40 border border-white/30 text-transparent')+' flex items-center justify-center shrink-0 transition-all">'+
                            '<i data-lucide="check" class="w-4 h-4 stroke-[3]"></i>'+
                        '</div>'+
                        '<img src="'+(s.cover || FI)+'" class="w-12 h-12 rounded-xl object-cover shrink-0 shadow-md border border-white/10" onerror="this.src=\''+FI+'\'" />'+
                        '<div class="min-w-0 flex-1">'+
                            '<h3 class="offline-song-title font-semibold text-sm '+(isSel ? 'text-purple-300' : 'text-white/90')+' truncate">'+es(s.title)+'</h3>'+
                            '<p class="text-xs text-white/50 truncate mt-0.5">'+es(s.artist)+'</p>'+
                        '</div>'+
                    '</div>';
                }

                var isCur = isSameOfflineSong(S.ct, s);
                var isPlay = isCur && S.ip;
                var isLoad = isCur && S.il;

                var playIconHtml = '';
                if (isLoad) {
                    playIconHtml = '<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>';
                } else if (isPlay) {
                    playIconHtml = '<div class="flex items-end justify-center gap-[2px] w-4 h-4 pb-0.5"><span class="w-[2px] bg-white rounded-full animate-eq-1"></span><span class="w-[2px] bg-white rounded-full animate-eq-2"></span><span class="w-[2px] bg-white rounded-full animate-eq-3"></span></div>';
                } else if (isCur) {
                    playIconHtml = '<svg class="w-4 h-4 fill-current text-white" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
                } else {
                    playIconHtml = '<svg class="w-4 h-4 fill-current text-white ml-0.5" viewBox="0 0 24 24"><polygon points="6 3 20 12 6 21 6 3"/></svg>';
                }

                var cardBg = isPlay 
                    ? 'bg-white/20 border-white/40 shadow-lg shadow-white/10' 
                    : (isCur ? 'bg-white/15 border-white/30' : 'bg-white/[0.08] hover:bg-white/[0.14] border-white/20 hover:border-white/35 shadow-sm');
                var titleClass = isCur ? 'text-white font-black' : 'text-white/90 font-bold';

                var dateStr = s.savedAt ? new Date(s.savedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '';
                var safeSongJson = JSON.stringify(s).replace(/"/g, '&quot;');

                var deleteBtnHtml = window.getAnimDeleteBtnHtml ?
                    getAnimDeleteBtnHtml('', 'anim-delete-mini', 'event.stopPropagation();OfflineView.deleteSong(this,'+safeSongJson+','+i+')', 'Hapus dari Mode Offline') :
                    '<button onclick="event.stopPropagation();OfflineView.deleteSong(this,'+safeSongJson+','+i+');" class="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-white/50 hover:text-red-400 border border-white/10 flex items-center justify-center shrink-0 active:scale-90 transition-all"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>';

                return '<div data-offline-idx="'+i+'" class="offline-song-row flex items-center gap-2.5 sm:gap-3 p-1.5 pr-3 sm:p-2 sm:pr-4 rounded-full border '+cardBg+' active:scale-95 transition-all duration-200 group backdrop-blur-md select-none">'+
                    '<div onclick="PK(\'offline\','+i+')" class="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0 cursor-pointer">'+
                        '<div class="w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden shrink-0 shadow-sm border border-white/20 bg-black/40 relative">'+
                            '<img src="'+(s.cover || FI)+'" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onerror="this.src=\''+FI+'\'" />'+
                        '</div>'+
                        '<div class="min-w-0 flex-1">'+
                            '<h3 class="offline-song-title '+titleClass+' text-xs sm:text-sm truncate">'+es(s.title)+'</h3>'+
                            '<p class="text-[11px] text-white/60 truncate mt-0.5">'+es(s.artist)+(dateStr ? ' • <span class="text-white/40">Offline ('+dateStr+')</span>' : '')+'</p>'+
                        '</div>'+
                    '</div>'+
                    deleteBtnHtml+
                    '<button onclick="PK(\'offline\','+i+')" class="offline-play-btn w-8 h-8 rounded-full '+(isCur ? 'bg-white/25 text-white' : 'bg-white/10 text-white')+' flex items-center justify-center shrink-0 hover:bg-white/20 border border-white/15 active:scale-90 transition-all shadow-sm">'+
                        playIconHtml+
                    '</button>'+
                '</div>';
            }).join('');
        } else {
            songsHtml = `
            <div class="text-center py-14 rounded-2xl bg-white/[0.03] border border-white/10 px-4">
                <div class="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center mx-auto mb-3 text-white">
                    <i data-lucide="wifi-off" class="w-6 h-6"></i>
                </div>
                <h3 class="text-white font-bold text-sm mb-1">Belum Ada Lagu Offline</h3>
                <p class="text-white/60 text-xs max-w-xs mx-auto mb-3">Simpan lagu favoritmu untuk diputar tanpa koneksi internet.</p>
                <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/80 text-xs font-semibold">
                    <i data-lucide="download" class="w-3.5 h-3.5"></i>
                    <span>Klik ikon Download di pemutar lagu</span>
                </div>
            </div>`;
        }

        var headerHtml = '';
        if (isSelMode) {
            var deleteSelectedBtnHtml = window.getAnimDeleteBtnHtml ?
                getAnimDeleteBtnHtml('Hapus (' + OfflineView.selectedIndices.size + ')', 'text-xs h-8 min-w-[95px] px-3 font-bold ' + (OfflineView.selectedIndices.size === 0 ? 'opacity-50 pointer-events-none' : ''), 'OfflineView.deleteSelectedSongs(this)', 'Hapus Lagu Terpilih', 'offline-btn-delete-selected') :
                `<button id="offline-btn-delete-selected" onclick="OfflineView.deleteSelectedSongs(this)" class="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer ${OfflineView.selectedIndices.size === 0 ? 'opacity-50 pointer-events-none' : ''}"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i><span>Hapus (${OfflineView.selectedIndices.size})</span></button>`;

            headerHtml = `
            <div class="pt-6 pb-3.5 px-4 sticky top-0 z-30 border-b border-white/10 shadow-2xl transition-all flex justify-between items-center bg-black/90 backdrop-blur-xl">
                <div class="flex items-center gap-2">
                    <button onclick="OfflineView.toggleSelectMode()" class="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white active:scale-90 transition-all cursor-pointer" title="Batal"><i data-lucide="x" class="w-5 h-5"></i></button>
                    <span id="offline-select-count-text" class="text-xs font-bold text-white px-2.5 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30 font-mono tracking-tight">${OfflineView.selectedIndices.size} Dipilih</span>
                </div>
                <div class="flex items-center gap-2">
                    <button id="offline-btn-select-all" onclick="OfflineView.selectAllSongs()" class="text-xs font-semibold text-white/80 hover:text-white px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 transition-all cursor-pointer">
                        ${OfflineView.selectedIndices.size === offlineSongs.length && offlineSongs.length > 0 ? 'Batal Semua' : 'Pilih Semua'}
                    </button>
                    <div id="offline-btn-delete-selected-wrap" class="inline-flex">
                        ${deleteSelectedBtnHtml}
                    </div>
                </div>
            </div>`;
        } else {
            var clearAllBtnHtml = (offlineSongs.length > 0 && window.getAnimDeleteBtnHtml) ?
                getAnimDeleteBtnHtml('Hapus Semua', 'text-xs h-8 min-w-[105px] px-3 font-bold', 'OfflineView.clearAll(this)', 'Hapus Semua Lagu Offline') :
                '';

            headerHtml = `
            <div class="pt-8 pb-3.5 px-4 sticky top-0 z-30 border-b border-white/10 shadow-2xl transition-all flex justify-between items-center bg-black/80 backdrop-blur-md">
                <div>
                    <div class="flex items-center gap-2">
                        <h1 class="text-2xl font-black text-white tracking-tight drop-shadow-md">Offline Mode</h1>
                        <span class="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${isOnline ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' : 'border-white/20 text-white/60 bg-white/5'}">${isOnline ? 'Online' : 'Offline'}</span>
                    </div>
                    <p class="text-xs text-white/50 mt-0.5">APK Storage & Saved Songs</p>
                </div>
                <div class="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white shadow-md">
                    <i data-lucide="wifi-off" class="w-4 h-4"></i>
                </div>
            </div>`;
        }

        el.innerHTML = headerHtml + `
        <div class="px-4 mt-4 space-y-3">
            ${offlineSongs.length > 0 && !isSelMode ? `
                <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span class="text-xs font-semibold text-white/60 uppercase tracking-wider">${offlineSongs.length} Lagu Tersimpan</span>
                    <div class="flex items-center gap-2">
                        <button onclick="OfflineView.toggleSelectMode()" class="text-xs font-semibold text-white/80 hover:text-white px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm">
                            <i data-lucide="check-square" class="w-3.5 h-3.5"></i> Pilih
                        </button>
                        ${clearAllBtnHtml}
                        <button onclick="PK('offline',0)" class="text-xs text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm">
                            <i data-lucide="play" class="w-3.5 h-3.5 fill-current"></i> Putar Semua
                        </button>
                    </div>
                </div>
            ` : ''}

            <div id="offline-songs-container" class="space-y-2 pb-24">
                ${songsHtml}
            </div>
        </div>`;

        if (window.lucide) lucide.createIcons();
    }
};

var App={
    init(){
        document.documentElement.classList.remove('theme-light');
        localStorage.removeItem('theme');

        gid('nav-container').innerHTML=`
        <div class="fixed bottom-3 left-1/2 -translate-x-1/2 w-[94%] max-w-md z-40 select-none">
            <div id="magic-nav-dock" class="magic-nav-dock">
                <!-- Sliding Fluid Indicator with Centered Active Icon inside Circle and Label Below -->
                <div id="magic-indicator" class="magic-indicator" style="transform: translateX(0%);">
                    <div class="magic-circle">
                        <div id="magic-circle-icon" class="magic-circle-icon">
                            <i data-lucide="home"></i>
                        </div>
                    </div>
                    <span id="magic-indicator-label" class="magic-indicator-label">Home</span>
                </div>

                <!-- Navigation Tabs -->
                <button onclick="App.switch('home')" id="nav-home" class="magic-tab" aria-label="Home" title="Home">
                    <div class="magic-tab-icon"><i data-lucide="home"></i></div>
                </button>
                <button onclick="App.switch('search')" id="nav-search" class="magic-tab" aria-label="Search" title="Search">
                    <div class="magic-tab-icon"><i data-lucide="search"></i></div>
                </button>
                <button onclick="App.switch('library')" id="nav-library" class="magic-tab" aria-label="Library" title="Library">
                    <div class="magic-tab-icon"><i data-lucide="library"></i></div>
                </button>
                <button onclick="App.switch('offline')" id="nav-offline" class="magic-tab" aria-label="Offline" title="Offline">
                    <div class="magic-tab-icon"><i data-lucide="wifi-off"></i></div>
                </button>
                <button onclick="App.switch('liked')" id="nav-liked" class="magic-tab" aria-label="Liked" title="Liked">
                    <div class="magic-tab-icon"><i data-lucide="heart"></i></div>
                </button>
                <button onclick="App.switch('dev')" id="nav-dev" class="magic-tab" aria-label="Dev" title="Dev">
                    <div class="magic-tab-icon"><i data-lucide="code"></i></div>
                </button>
            </div>
        </div>`;
        
        Profile.render();
        
        MP.init();FullPlayer.init();Artist.init();Album.init();Home.render();Search.render();
        if(typeof updateOG==='function') updateOG(null);
        if(window.Auth && typeof Auth.init === 'function') Auth.init();
        App.loadSeasonalTheme();
        App.loadBroadcast();
        App.loadSiteUpdateBanner();
        // Poll broadcast updates periodically every 60s
        setInterval(function() { App.loadBroadcast(); }, 60000);
        // Poll site update banner periodically every 30s
        setInterval(function() { App.loadSiteUpdateBanner(); }, 30000);
        // Poll user inbox badge periodically every 30s
        setInterval(function() {
            if (typeof Profile !== 'undefined' && typeof Profile.checkUserInboxBadge === 'function') {
                Profile.checkUserInboxBadge();
            }
        }, 30000);
        setTimeout(function() {
            if (typeof Profile !== 'undefined' && typeof Profile.checkUserInboxBadge === 'function') {
                Profile.checkUserInboxBadge();
            }
        }, 2000);
        App.switch(!navigator.onLine ? 'offline' : 'home');
        lucide.createIcons();
        setTimeout(function(){ App.checkUrl(); }, 1000);
        window.addEventListener('popstate', function(e) {
            if (typeof Album !== 'undefined' && gid('album-modal') && gid('album-modal').style.display !== 'none') {
                gid('album-modal').style.display = 'none';
                gid('album-content').innerHTML = '';
                Album.currentAlbumId = null;
            }
            if (typeof Artist !== 'undefined' && gid('artist-modal') && gid('artist-modal').style.display !== 'none') {
                gid('artist-modal').style.display = 'none';
                gid('artist-content').innerHTML = '';
                Artist.currentArtistId = null;
            }
            if (typeof MP !== 'undefined' && MP.updatePosition) MP.updatePosition();
        });
    },
    checkUrl(){
        var path = window.location.pathname;
        if(path.startsWith('/search/')){
            var q = path.split('/search/')[1];
            if(q){
                setTimeout(function(){
                    var si=gid('search-input');
                    if(si){
                        si.value=decodeURIComponent(q);
                        gid('search-form').dispatchEvent(new Event('submit'));
                    }
                    App.switch('search');
                },300);
            }
        }
        else if(path.startsWith('/play/')){
            var videoId = path.split('/play/')[1];
            if(videoId) {
                var p = new URLSearchParams(location.search);
                var isShared = p.get('share') === 'true' || p.get('share') === '1';
                var qTitle = p.get('title');
                var qArtist = p.get('artist');
                var qCover = p.get('cover') || p.get('thumb');
                if (qCover && typeof updateOG === 'function') {
                    updateOG(qTitle || 'Lagu', qCover, qArtist || '');
                }
                if(isShared) {
                    App.showSharePopup(videoId);
                } else {
                    App.autoPlayTrack(videoId);
                }
            }
        }
        else if(path.startsWith('/album/')){
            var albumId = path.split('/album/')[1];
            if(albumId) {
                var p = new URLSearchParams(location.search);
                var qTitle = p.get('title');
                var qArtist = p.get('artist');
                var qCover = p.get('cover') || p.get('thumb');
                if (qCover && typeof updateOGForAlbum === 'function') {
                    updateOGForAlbum(qTitle || 'Album', qCover, qArtist || '');
                }
                App.switch('home');
                setTimeout(function(){ Album.open(albumId, qCover); }, 300);
            }
        }
        else if(path.startsWith('/playlist/')){
            var playlistId = path.split('/playlist/')[1];
            if(playlistId){
                App.switch('library');
                setTimeout(function(){
                    if(typeof Library !== 'undefined' && typeof Library.open === 'function'){
                        var pls = typeof getUserPlaylists === 'function' ? getUserPlaylists() : [];
                        var exists = pls.some(function(p){ return p.id === playlistId; });
                        if(exists){
                            Library.open(playlistId);
                        } else if(typeof showToast === 'function'){
                            // Playlists are stored locally on-device, so a shared link only
                            // opens correctly on the device that created it.
                            showToast('Playlist ini tidak ditemukan di perangkat ini');
                        }
                    }
                }, 300);
            }
        }
        else if(path.startsWith('/artist/')){
            var artistId = path.split('/artist/')[1];
            if(artistId) {
                var p = new URLSearchParams(location.search);
                var qName = p.get('name') || p.get('title');
                var qCover = p.get('cover') || p.get('thumb');
                if (qCover && typeof updateOGForArtist === 'function') {
                    updateOGForArtist(qName || 'Artist', qCover);
                }
                App.switch('home');
                setTimeout(function(){ Artist.open(artistId, qName, qCover); }, 300);
            }
        }
        else {
            var p=new URLSearchParams(location.search);
            var play=p.get('play'),search=p.get('search'),isShared=p.get('share')==='1';
            if(play){if(isShared){App.showSharePopup(play);}else{App.autoPlayTrack(play);}}
            else if(search){setTimeout(function(){var si=gid('search-input');if(si){si.value=decodeURIComponent(search);gid('search-form').dispatchEvent(new Event('submit'));}App.switch('search');},300);}
        }
    },
    autoPlayTrack(videoId){
        fetch(API.search+'?query=https://youtube.com/watch?v='+videoId).then(function(r){return r.json();}).then(function(d){
            var title='Lagu',artist='NanzMusify',cover=toHDCover('', videoId),artistId='';
            if(d.status&&d.result.songs&&d.result.songs.length>0){var song=d.result.songs[0];title=cn(song.title);artist=cn(song.artist);cover=toHDCover(song.thumbnail, videoId);artistId=song.artistId||'';}
            S.ct={id:videoId,videoId:videoId,title:title,artist:artist,cover:cover,artistId:artistId,ytUrl:'https://youtube.com/watch?v='+videoId};
            S.ps='direct';S.pl=[S.ct];S.pi=0;UU();MP.show();resetLyricsUI(videoId);
            FullPlayer.open();loadTrack(S.ct);
        }).catch(function(){
            S.ct={id:videoId,videoId:videoId,title:'Lagu',artist:'NanzMusify',cover:toHDCover('', videoId),artistId:'',ytUrl:'https://youtube.com/watch?v='+videoId};
            S.ps='direct';S.pl=[S.ct];S.pi=0;UU();MP.show();resetLyricsUI(videoId);
            FullPlayer.open();loadTrack(S.ct);
        });
    },
    showSharePopup(videoId){
        fetch(API.search+'?query=https://youtube.com/watch?v='+videoId).then(function(r){return r.json();}).then(function(d){
            var title='Lagu',artist='NanzMusify',cover=toHDCover('', videoId);
            if(d.status&&d.result.songs&&d.result.songs.length>0){var song=d.result.songs[0];title=cn(song.title);artist=cn(song.artist);cover=toHDCover(song.thumbnail, videoId);}
            App.renderPopup(videoId,title,artist,cover);
        }).catch(function(){App.renderPopup(videoId,'Lagu','NanzMusify',toHDCover('', videoId));});
    },
    renderPopup(videoId,title,artist,cover){
        if(typeof updateOG==='function') updateOG(title, cover, artist);
        var popup=document.createElement('div');popup.className='fixed inset-0 z-[300] flex items-end justify-center bg-black/60';
        popup.onclick=function(e){if(e.target===popup)popup.remove();};
        popup.innerHTML='<div class="glass-strong w-full max-w-md rounded-t-3xl p-6 border-t border-white/10" style="animation:slideUp 0.4s ease-out forwards;"><div class="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4"></div><div class="flex items-center gap-4 mb-4"><img src="'+cover+'" class="w-16 h-16 rounded-xl object-cover " onerror="this.src=\''+FI+'\'" /><div class="flex-1 truncate"><h3 class="font-bold text-white truncate">'+title+'</h3><p class="text-[#b3b3b3] text-sm truncate">'+artist+'</p></div></div><p class="text-white/70 text-xs mb-4 text-center">Seseorang membagikan lagu ini kepadamu</p><div class="flex gap-3"><button id="popup-play" class="flex-1 btn-chrome font-bold py-3 rounded-full active:scale-95 flex items-center justify-center gap-2"><i data-lucide="play" class="w-4 h-4 fill-current"></i> Putar Sekarang</button><button id="popup-later" class="px-6 py-3 glass glass-hover text-white rounded-full active:scale-95">Nanti</button></div></div>';
        document.body.appendChild(popup);
        popup.querySelector('#popup-play').onclick=function(){popup.remove();S.ct={id:videoId,videoId:videoId,title:title,artist:artist,cover:cover,artistId:'',ytUrl:'https://youtube.com/watch?v='+videoId};S.ps='direct';S.pl=[S.ct];S.pi=0;UU();MP.show();resetLyricsUI(videoId);FullPlayer.open();loadTrack(S.ct);};
        popup.querySelector('#popup-later').onclick=function(){popup.remove();};
    },
    switch(t){
        // Auto-close opened detail modals/tabs when switching bottom navbar
        if(typeof FullPlayer !== 'undefined' && FullPlayer.close) FullPlayer.close();
        if(typeof Album !== 'undefined' && Album.close) Album.close();
        if(typeof Artist !== 'undefined' && Artist.close) Artist.close();
        if(typeof Library !== 'undefined' && Library.closeModalOnly) Library.closeModalOnly();

        // Remove any open popups or dialogs
        document.querySelectorAll('.fixed.z-\\[300\\], .fixed.z-\\[400\\]').forEach(function(el){
            if(el.id !== 'v2-popup' && el.id !== 'mini-player') el.remove();
        });

        var tabs = ['home', 'search', 'library', 'offline', 'liked', 'dev'];
        var prevTab = S.at || 'home';
        var prevIndex = tabs.indexOf(prevTab);
        var nextIndex = tabs.indexOf(t);

        S.at = t;

        // Clean URL pathname if switching away from search or returning home
        try {
            if (t !== 'search' && window.location.pathname.startsWith('/search')) {
                history.replaceState({}, '', '/');
            } else if (t === 'home') {
                history.replaceState({}, '', '/');
            }
        } catch(e) {}

        tabs.forEach(function(id){
            var el = gid('view-' + id);
            if(el) {
                el.style.display = 'none';
                el.classList.remove('animate-slide-right', 'animate-slide-left');
            }
        });

        if(t==='library'){Library.render();}
        if(t==='dev'){Profile.render();}
        if(t==='offline'){
            OfflineView.render();
        }
        if(t==='home'){
            if (prevTab === 'home' && Home.activeCategory) {
                Home.selectCategory('Semua');
            } else {
                Home.render();
            }
        }
        if(t==='search'){Search.onShow();}
        if(t==='liked'){Liked.render();}

        var targetEl = gid('view-' + t);
        if(targetEl) {
            targetEl.style.display = 'block';
            var mainArea = gid('main-area');
            if (mainArea) mainArea.scrollTop = 0;
            if(prevIndex !== -1 && nextIndex !== -1 && prevIndex !== nextIndex) {
                if(nextIndex > prevIndex) {
                    targetEl.classList.add('animate-slide-right');
                } else {
                    targetEl.classList.add('animate-slide-left');
                }
            }
        }

        var navTabs = ['home', 'search', 'library', 'offline', 'liked', 'dev'];
        var tabIcons = {
            home: 'home',
            search: 'search',
            library: 'library',
            offline: 'wifi-off',
            liked: 'heart',
            dev: 'code'
        };
        var activeIdx = navTabs.indexOf(t);
        var indicator = gid('magic-indicator');
        if (indicator && activeIdx !== -1) {
            indicator.style.transform = 'translateX(' + (activeIdx * 100) + '%)';
        }

        var tabNames = {
            home: 'Home',
            search: 'Search',
            library: 'Library',
            offline: 'Offline',
            liked: 'Liked',
            dev: 'Dev'
        };

        var circleIcon = gid('magic-circle-icon');
        if (circleIcon && tabIcons[t]) {
            circleIcon.innerHTML = '<i data-lucide="' + tabIcons[t] + '"></i>';
        }

        var indicatorLabel = gid('magic-indicator-label');
        if (indicatorLabel && tabNames[t]) {
            indicatorLabel.textContent = tabNames[t];
        }

        navTabs.forEach(function(n){
            var b = gid('nav-' + n);
            if(!b) return;
            if(n === t){
                b.classList.add('active');
            } else {
                b.classList.remove('active');
            }
        });

        gid('main-area').scrollTop=0;
        if (typeof MP !== 'undefined' && MP.updatePosition) MP.updatePosition();
        if (window.lucide) lucide.createIcons();
    },
    renderLiked() {
        if (typeof Liked !== 'undefined') Liked.render();
    },
    showV2Popup() {
        if(localStorage.getItem('seen_v2_popup_update')) return;
        var popup = document.createElement('div');
        popup.id = 'v2-popup';
        popup.className = 'fixed inset-0 z-[400] flex items-center justify-center bg-black/80 px-4';
        ;
        popup.innerHTML = `
            <div class="glass-strong w-full max-w-sm rounded-3xl p-6 border border-white/10 text-center relative overflow-hidden" style="animation: slideUp 0.3s ease-out forwards;">
                <!-- Header -->
                <div class="relative w-16 h-16 rounded-full mx-auto mb-4 bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center  ">
                    <i data-lucide="sparkles" class="w-8 h-8 text-white"></i>
                </div>
                
                <h2 class="text-2xl font-black chrome-text mb-1">New Version v2</h2>
                <p class="text-white/70 text-xs mb-5">Berikut adalah fitur dan pembaruan terbaru:</p>
                
                <!-- Features list -->
                <div class="space-y-4 text-left mb-6 max-h-[250px] overflow-y-auto pr-1">
                    <div class="flex items-start gap-3">
                        <div class="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                            <i data-lucide="sliders" class="w-4 h-4 text-rose-400"></i>
                        </div>
                        <div>
                            <h4 class="text-white font-bold text-sm">Equalizer Suara (Web Audio)</h4>
                            <p class="text-[#b3b3b3] text-xs leading-relaxed">Sesuaikan Bass, Mid, Treble, dan gunakan berbagai Preset Keren untuk kualitas audio musik terbaik.</p>
                        </div>
                    </div>
                    
                    <div class="flex items-start gap-3">
                        <div class="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                            <i data-lucide="share-2" class="w-4 h-4 text-rose-400"></i>
                        </div>
                        <div>
                            <h4 class="text-white font-bold text-sm">Share Lagu via Link Audio Langsung</h4>
                            <p class="text-[#b3b3b3] text-xs leading-relaxed">Bagikan lagu favorit Anda menggunakan link audio langsung untuk kemudahan berbagi musik.</p>
                        </div>
                    </div>

                    <div class="flex items-start gap-3">
                        <div class="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                            <i data-lucide="timer" class="w-4 h-4 text-rose-400"></i>
                        </div>
                        <div>
                            <h4 class="text-white font-bold text-sm">Timer Sleep (Pengantar Tidur)</h4>
                            <p class="text-[#b3b3b3] text-xs leading-relaxed">Atur waktu putar musik otomatis sebelum tidur dengan durasi yang dapat ditentukan sendiri.</p>
                        </div>
                    </div>

                    <div class="flex items-start gap-3">
                        <div class="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                            <i data-lucide="shield-check" class="w-4 h-4 text-rose-400"></i>
                        </div>
                        <div>
                            <h4 class="text-white font-bold text-sm">Fitur Pintar: "Hentikan di Akhir Lagu"</h4>
                            <p class="text-[#b3b3b3] text-xs leading-relaxed">Dilengkapi opsi agar lagu aktif Anda tetap berputar sampai selesai sebelum pemutaran otomatis berhenti tanpa memotong lagu di tengah-tengah.</p>
                        </div>
                    </div>

                    <div class="flex items-start gap-3">
                        <div class="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                            <i data-lucide="gauge" class="w-4 h-4 text-rose-400"></i>
                        </div>
                        <div>
                            <h4 class="text-white font-bold text-sm">Kontrol Kecepatan Putar</h4>
                            <p class="text-[#b3b3b3] text-xs leading-relaxed">Memungkinkan Anda mempercepat atau memperlambat musik sesuai kebutuhan (mendukung kecepatan 0.5x, 0.75x, 1.0x (Normal), 1.25x, 1.5x, 1.75x, hingga 2.0x).</p>
                        </div>
                    </div>

                    <div class="flex items-start gap-3">
                        <div class="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                            <i data-lucide="zap" class="w-4 h-4 text-rose-400"></i>
                        </div>
                        <div>
                            <h4 class="text-white font-bold text-sm">Mode "Slowed + Reverb" & "Nightcore"</h4>
                            <p class="text-[#b3b3b3] text-xs leading-relaxed">Kustomisasi getaran audio dengan mengubah kecepatan musik secara instan ke gaya favorit Anda.</p>
                        </div>
                    </div>
                </div>
                
                <!-- Button -->
                <button id="close-v2-popup" class="w-full btn-chrome font-bold py-3.5 rounded-full active:scale-95 transition-all">
                    Keren, Mulai Dengar!
                </button>
            </div>
        `;
        document.body.appendChild(popup);
        lucide.createIcons();
        popup.querySelector('#close-v2-popup').onclick = function() {
            localStorage.setItem('seen_v2_popup_update', 'true');
            popup.remove();
        };
    },
    currentSeasonalTheme: null,
    async loadSeasonalTheme() {
        try {
            var res = await fetch('/api/theme');
            var data = await res.json();
            if (data && data.status) {
                App.applySeasonalTheme(data);
            }
        } catch (e) {}
    },
    applySeasonalTheme(themeData) {
        App.currentSeasonalTheme = themeData;
        var themeId = themeData.activeTheme || 'default';
        var root = document.documentElement;
        
        // Remove all previous seasonal theme classes
        root.classList.remove('theme-seasonal-puasa', 'theme-seasonal-ramadhan', 'theme-seasonal-lebaran', 'theme-seasonal-tahun_baru', 'theme-seasonal-idul_adha');
        
        if (themeId && themeId !== 'default') {
            root.classList.add('theme-seasonal-' + themeId);
        }

        // Render seasonal banner if on home
        App.renderSeasonalBanner();
    },
    renderSeasonalBanner() {
        var bannerSlot = gid('seasonal-theme-banner-slot');
        if (!bannerSlot) return;

        var data = App.currentSeasonalTheme;
        if (!data || !data.activeTheme || data.activeTheme === 'default' || data.showBanner === false) {
            bannerSlot.innerHTML = '';
            return;
        }

        var details = data.themeDetails || {};
        var greeting = data.customGreeting || details.bannerSubtitle || 'Selamat menikmati sajian musik terbaik di MusifyStar.';
        var title = details.bannerTitle || details.name || 'Tema Musiman Aktif';
        var badge = details.badgeText || details.name || 'Spesial';
        var icon = details.icon || 'sparkles';
        var accent = details.accentColor || '#f43f5e';

        bannerSlot.innerHTML = `
        <div class="mb-4 p-4 rounded-2xl border transition-all duration-500 overflow-hidden relative" style="background: radial-gradient(circle at 80% 20%, ${details.glowColor || 'rgba(255,255,255,0.1)'} 0%, rgba(20,22,30,0.85) 80%); border-color: rgba(255,255,255,0.15); box-shadow: 0 10px 30px -10px ${details.glowColor || 'rgba(0,0,0,0.5)'};">
            <div class="flex items-start gap-3.5 relative z-10">
                <div class="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border" style="background: ${details.glowColor || 'rgba(255,255,255,0.1)'}; color: ${accent}; border-color: ${accent}40;">
                    <i data-lucide="${icon}" class="w-5 h-5 animate-pulse"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1 flex-wrap">
                        <span class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border" style="background: ${accent}20; color: ${accent}; border-color: ${accent}40;">
                            ${badge}
                        </span>
                    </div>
                    <h3 class="text-sm sm:text-base font-black text-white tracking-tight">${title}</h3>
                    <p class="text-xs text-white/75 mt-0.5 leading-relaxed font-sans">${greeting}</p>
                </div>
            </div>
        </div>`;
        if (window.lucide) lucide.createIcons();
    },

    // BROADCAST HOME ANNOUNCEMENT BANNER CARD
    currentBroadcast: null,
    async loadBroadcast() {
        try {
            var res = await fetch('/api/broadcast');
            var data = await res.json();
            if (data && data.status) {
                App.applyBroadcast(data);
            }
        } catch (e) {}
    },
    applyBroadcast(data) {
        App.currentBroadcast = data;
        App.renderBroadcastBanner();
    },
    renderBroadcastBanner() {
        var slot = gid('broadcast-announcement-slot');
        if (!slot) return;

        var data = App.currentBroadcast;
        if (!data || !data.enabled || !data.text) {
            slot.innerHTML = '';
            return;
        }

        // Check if user dismissed this version
        var dismissedTime = sessionStorage.getItem('musifystar_dismissed_broadcast');
        if (data.closable && dismissedTime === data.updatedAt) {
            slot.innerHTML = '';
            return;
        }

        var type = data.type || 'info';
        var badge = data.badge || 'PENGUMUMAN';
        var title = data.title || badge;
        var text = (data.text || '').trim();
        var icon = data.icon || 'megaphone';

        // Colors based on type matching aesthetic card themes
        var glowColor = 'rgba(99, 102, 241, 0.25)';
        var accentColor = '#818cf8';
        var borderColor = 'rgba(99, 102, 241, 0.35)';

        if (type === 'maintenance') {
            glowColor = 'rgba(245, 158, 11, 0.25)';
            accentColor = '#f59e0b';
            borderColor = 'rgba(245, 158, 11, 0.4)';
        } else if (type === 'warning') {
            glowColor = 'rgba(244, 63, 94, 0.25)';
            accentColor = '#f43f5e';
            borderColor = 'rgba(244, 63, 94, 0.4)';
        } else if (type === 'update') {
            glowColor = 'rgba(16, 185, 129, 0.25)';
            accentColor = '#10b981';
            borderColor = 'rgba(16, 185, 129, 0.4)';
        } else if (type === 'custom') {
            glowColor = 'rgba(168, 85, 247, 0.25)';
            accentColor = '#c084fc';
            borderColor = 'rgba(168, 85, 247, 0.4)';
        }

        var closeBtn = data.closable ? `
        <button onclick="App.dismissBroadcast('${data.updatedAt}')" class="p-1.5 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-all cursor-pointer shrink-0" title="Tutup pengumuman">
            <i data-lucide="x" class="w-4 h-4"></i>
        </button>` : '';

        slot.innerHTML = `
        <div class="mb-4 p-4 sm:p-5 rounded-2xl border transition-all duration-500 overflow-hidden relative shadow-lg" style="background: radial-gradient(circle at 80% 20%, ${glowColor} 0%, rgba(20, 24, 33, 0.95) 85%); border-color: ${borderColor}; box-shadow: 0 10px 30px -10px ${glowColor};">
            <div class="flex items-start gap-3.5 relative z-10">
                <div class="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 border shadow-md" style="background: ${glowColor}; color: ${accentColor}; border-color: ${borderColor};">
                    <i data-lucide="${icon}" class="w-5 h-5 sm:w-6 sm:h-6 animate-pulse"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between gap-2 mb-1">
                        <span class="text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1" style="background: ${accentColor}20; color: ${accentColor}; border-color: ${accentColor}40;">
                            ${badge}
                        </span>
                        ${closeBtn}
                    </div>
                    <h3 class="text-sm sm:text-base font-black text-white tracking-tight">${title}</h3>
                    <p class="text-xs sm:text-sm text-white/80 mt-1 leading-relaxed font-sans">${text}</p>
                </div>
            </div>
        </div>`;

        if (window.lucide) lucide.createIcons();
    },
    dismissBroadcast(updatedAt) {
        if (updatedAt) {
            sessionStorage.setItem('musifystar_dismissed_broadcast', updatedAt);
        }
        var slot = gid('broadcast-announcement-slot');
        if (slot) {
            slot.innerHTML = '';
        }
    },

    // ==========================================
    // BANNER UPDATE LINK WEBSITE (TENGAH LAYAR - NON-DISMISSIBLE)
    // ==========================================
    currentSiteUpdate: null,
    async loadSiteUpdateBanner() {
        try {
            var res = await fetch('/api/site-update?t=' + Date.now(), { cache: 'no-store' });
            var data = await res.json();
            if (data && data.status) {
                App.currentSiteUpdate = data;
                App.renderSiteUpdateBanner(data, false);
            }
        } catch (e) {
            console.warn('[SITE_UPDATE] Failed to load site update banner:', e.message);
        }
    },

    renderSiteUpdateBanner(data, isPreview) {
        var existingModal = gid('musifystar-site-update-modal');

        if (!isPreview && (!data || !data.enabled || !data.targetUrl)) {
            if (existingModal) {
                existingModal.remove();
                document.body.style.overflow = '';
                document.body.style.touchAction = '';
                document.documentElement.style.overflow = '';
                document.documentElement.style.touchAction = '';
            }
            return;
        }

        // Cek apakah user adalah master admin (jrnabil570@gmail.com)
        var isMasterAdmin = function() {
            if (isPreview) return true;
            var u = (typeof Auth !== 'undefined' && Auth.currentUser) ? Auth.currentUser : null;
            var email = u ? (u.email || u.rawEmail || '').toLowerCase().trim() : '';
            if (email === 'jrnabil570@gmail.com') return true;
            try {
                var stored = JSON.parse(localStorage.getItem('musifystar_user') || sessionStorage.getItem('musifystar_user') || '{}');
                if ((stored.email || stored.rawEmail || '').toLowerCase().trim() === 'jrnabil570@gmail.com') return true;
            } catch (e) {}
            return false;
        };

        var isMaster = isMasterAdmin();

        // Jika master admin sudah menutup banner ini, jangan tampilkan lagi berulang-ulang
        if (!isPreview && isMaster) {
            var dismissed = sessionStorage.getItem('musifystar_admin_dismissed_site_update') || localStorage.getItem('musifystar_admin_dismissed_site_update');
            if (dismissed && (dismissed === 'dismissed' || dismissed === data.updatedAt || dismissed === 'true')) {
                if (existingModal) {
                    existingModal.remove();
                    document.body.style.overflow = '';
                    document.body.style.touchAction = '';
                    document.documentElement.style.overflow = '';
                    document.documentElement.style.touchAction = '';
                }
                return;
            }
        }

        // If modal is already showing with same config and not preview, don't re-render to prevent flicker
        if (existingModal && !isPreview && existingModal.getAttribute('data-updated-at') === data.updatedAt) {
            return;
        }

        if (existingModal) {
            existingModal.remove();
        }

        // Lock page scrolling completely while banner is displayed
        document.body.style.overflow = 'hidden';
        document.body.style.touchAction = 'none';
        document.documentElement.style.overflow = 'hidden';
        document.documentElement.style.touchAction = 'none';

        var title = (data && data.title ? data.title : 'Pembaruan Website MusifyStar').trim();
        var message = (data && data.message ? data.message : 'Website MusifyStar telah berpindah ke alamat tautan (link) baru yang lebih cepat, stabil, dan memiliki fitur terbaru. Silakan klik tombol di bawah untuk membuka dan beralih ke website baru sekarang.').trim();
        var targetUrl = (data && data.targetUrl ? data.targetUrl : (isPreview ? 'https://www.musifystar.web.id' : '')).trim();
        var buttonText = (data && data.buttonText ? data.buttonText : 'Buka Link Website Baru').trim();
        var badgeText = (data && data.badgeText ? data.badgeText : 'UPDATE WEBSITE RESMI').trim();
        var forceLock = isPreview ? false : (data && data.forceLock !== false);

        var modal = document.createElement('div');
        modal.id = 'musifystar-site-update-modal';
        modal.setAttribute('data-updated-at', (data && data.updatedAt) || '');
        modal.className = 'fixed inset-0 z-[9999999] flex items-center justify-center p-4 sm:p-6 bg-black/95 backdrop-blur-2xl animate-fade-in pointer-events-auto select-none overflow-hidden touch-none';
        modal.style.touchAction = 'none';
        modal.style.overscrollBehavior = 'none';

        var previewTag = isPreview ? `
        <div class="mb-3 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-[10px] font-bold inline-flex items-center gap-1.5 mx-auto">
            <i data-lucide="eye" class="w-3.5 h-3.5"></i>
            <span>MODE PRATINJAU UJI ADMIN (Dapat Ditutup)</span>
        </div>` : '';

        var adminCloseBtn = isMaster ? `
        <button type="button" onclick="App.dismissSiteUpdateBannerForAdmin()" class="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer z-20" title="Tutup Banner (Khusus Master Admin: jrnabil570@gmail.com)">
            <i data-lucide="x" class="w-5 h-5"></i>
        </button>` : '';

        modal.innerHTML = `
        <div class="relative w-full max-w-lg bg-gradient-to-b from-[#141824] via-[#0d1017] to-[#08090d] border-2 border-cyan-500/50 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-between shadow-[0_0_80px_rgba(6,182,212,0.35)] text-center overflow-hidden touch-none select-none">
            <!-- Decorative Ambient Glows -->
            <div class="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none"></div>
            <div class="absolute -bottom-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>

            ${adminCloseBtn}

            <div class="relative z-10 flex flex-col items-center w-full">
                ${previewTag}

                <!-- Glowing Animated Header Icon -->
                <div class="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3.5 flex items-center justify-center">
                    <div class="absolute inset-0 rounded-3xl bg-gradient-to-tr from-cyan-500 to-blue-600 animate-pulse opacity-40 blur-md"></div>
                    <div class="relative w-full h-full rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-cyan-400 via-sky-500 to-blue-600 flex items-center justify-center text-black shadow-xl shadow-cyan-500/30 border border-white/30">
                        <i data-lucide="external-link" class="w-8 h-8 sm:w-10 sm:h-10 text-black"></i>
                    </div>
                </div>

                <!-- Badge -->
                <div class="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-mono text-[11px] sm:text-xs font-black uppercase tracking-wider mx-auto mb-2.5">
                    <span class="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                    <span>${es(badgeText)}</span>
                </div>

                <!-- Title -->
                <h2 class="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md mb-3 leading-snug">
                    ${es(title)}
                </h2>

                <!-- Message Box (Pesan Pembaruan) -->
                <div class="w-full p-4 sm:p-5 rounded-2xl bg-white/[0.04] border border-white/10 text-sm sm:text-base text-white/90 leading-relaxed font-sans text-left space-y-2 mb-5">
                    <p class="whitespace-pre-wrap select-none">${es(message)}</p>
                </div>
            </div>

            <!-- Action Button: Open Link Only (Alamat URL disembunyikan) -->
            <div class="relative z-10 w-full pt-1">
                <a href="${targetUrl}" target="_blank" rel="noopener noreferrer" class="w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 active:scale-95 text-black font-black text-base sm:text-lg flex items-center justify-center gap-3 shadow-xl shadow-cyan-500/30 transition-all cursor-pointer">
                    <i data-lucide="external-link" class="w-5 h-5 sm:w-6 sm:h-6 text-black"></i>
                    <span>${es(buttonText)}</span>
                </a>
            </div>
        </div>`;

        // Prevent dragging / pull-to-refresh on mobile screen
        modal.addEventListener('touchmove', function(e) {
            e.preventDefault();
        }, { passive: false });

        modal.addEventListener('wheel', function(e) {
            e.preventDefault();
        }, { passive: false });

        // Prevent clicking outside or closing modal if forceLock is active for non-master visitors
        if (forceLock && !isMaster) {
            modal.onclick = function(e) {
                e.stopPropagation();
            };
            modal.onkeydown = function(e) {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    e.stopPropagation();
                }
            };
        } else {
            modal.onclick = function(e) {
                if (e.target === modal) {
                    App.dismissSiteUpdateBannerForAdmin();
                }
            };
            modal.onkeydown = function(e) {
                if (e.key === 'Escape') {
                    App.dismissSiteUpdateBannerForAdmin();
                }
            };
        }

        document.body.appendChild(modal);
        if (window.lucide) lucide.createIcons();
    },

    dismissSiteUpdateBannerForAdmin() {
        var modal = gid('musifystar-site-update-modal');
        if (modal) modal.remove();
        document.body.style.overflow = '';
        document.body.style.touchAction = '';
        document.documentElement.style.overflow = '';
        document.documentElement.style.touchAction = '';

        // Simpan tanda dismiss agar banner TIDAK pernah muncul lagi berulang-ulang
        var updateTimestamp = (App.currentSiteUpdate && App.currentSiteUpdate.updatedAt) || 'dismissed';
        sessionStorage.setItem('musifystar_admin_dismissed_site_update', updateTimestamp);
        localStorage.setItem('musifystar_admin_dismissed_site_update', updateTimestamp);

        // Otomatis matikan juga di database server jika token admin tersedia
        var token = (typeof Profile !== 'undefined' && typeof Profile.getAdminToken === 'function') ? Profile.getAdminToken() : '';
        if (token && App.currentSiteUpdate && App.currentSiteUpdate.enabled) {
            fetch('/api/site-update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-token': token
                },
                body: JSON.stringify({
                    enabled: false,
                    targetUrl: App.currentSiteUpdate.targetUrl || '',
                    title: App.currentSiteUpdate.title || '',
                    message: App.currentSiteUpdate.message || '',
                    buttonText: App.currentSiteUpdate.buttonText || '',
                    badgeText: App.currentSiteUpdate.badgeText || '',
                    forceLock: App.currentSiteUpdate.forceLock !== false
                })
            }).then(function(res) { return res.json(); }).then(function(data) {
                if (data && data.status) {
                    App.currentSiteUpdate = data.config;
                    if (typeof Profile !== 'undefined' && typeof Profile.renderAdminSiteUpdateTab === 'function' && Profile.adminActiveTab === 'siteupdate') {
                        Profile.renderAdminSiteUpdateTab();
                    }
                }
            }).catch(function(e) {});
        }

        if (typeof showToast === 'function') {
            showToast('Banner pembaruan berhasil ditutup');
        }
    },

    copySiteUpdateLink(url, btnEl) {
        if (!url) return;
        var doneFeedback = function() {
            if (btnEl) {
                var oldHtml = btnEl.innerHTML;
                btnEl.className = 'w-full py-2.5 px-4 rounded-xl bg-emerald-500 text-black font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md';
                btnEl.innerHTML = '<i data-lucide="check" class="w-3.5 h-3.5"></i><span>Tautan Website Berhasil Disalin!</span>';
                if (window.lucide) lucide.createIcons();
                setTimeout(function() {
                    btnEl.className = 'w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95';
                    btnEl.innerHTML = oldHtml;
                    if (window.lucide) lucide.createIcons();
                }, 2500);
            }
            if (typeof showToast === 'function') {
                showToast('Tautan website baru berhasil disalin ke papan klip');
            }
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(doneFeedback).catch(function() {
                prompt('Salin tautan website baru:', url);
            });
        } else {
            prompt('Salin tautan website baru:', url);
        }
    }
};
App.init();Home.fetch();

// SPLASH SCREEN - LOGO BULAT BESAR & RENDER HOME SYNC
var splashStartTime = Date.now();
var splashDismissed = false;

function hideSplashScreen() {
    if (splashDismissed) return;
    var minDuration = 1000;
    var elapsed = Date.now() - splashStartTime;
    if (elapsed < minDuration) {
        setTimeout(hideSplashScreen, minDuration - elapsed);
        return;
    }
    splashDismissed = true;
    var sp = gid('splash-screen');
    if (!sp) return;
    sp.classList.add('hide');
    setTimeout(function() { 
        if (sp && sp.parentNode) sp.parentNode.removeChild(sp); 
        // Trigger V2 Update popup here
        App.showV2Popup();
    }, 400);
}

(function(){
    var sp = gid('splash-screen');
    if (!sp) return;
    var logoWrap = sp.querySelector('.splash-logo-wrap') || sp.querySelector('.logo-wrap');
    if (logoWrap) {
        logoWrap.style.width = '170px';
        logoWrap.style.height = '170px';
        logoWrap.style.borderRadius = '50%';
    }
    var logo = sp.querySelector('.splash-logo-wrap img') || sp.querySelector('.logo');
    if (logo) {
        logo.style.borderRadius = '50%';
        logo.style.objectFit = 'cover';
    }
    // Safety max fallback timer in case network or API is extremely slow
    setTimeout(function(){
        hideSplashScreen();
    }, 4500);
})();

// Library object moved to /library.js

