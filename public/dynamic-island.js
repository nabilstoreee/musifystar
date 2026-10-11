// ==========================================
// MUSIFYSTAR DYNAMIC ISLAND MINI PLAYER
// iOS-Inspired Ultra-Fast Top Pill Mini Player (VIP Feature)
// ==========================================

var DynamicIsland = {
    isExpanded: false,
    autoCollapseTimer: null,
    lastLikedState: null,

    init() {
        var existing = document.getElementById('musifystar-dynamic-island');
        if (existing) return;

        // Custom keyframe styles for Dynamic Island sound visualizer wave & performance optimization
        if (!document.getElementById('dynamic-island-styles')) {
            var styleEl = document.createElement('style');
            styleEl.id = 'dynamic-island-styles';
            styleEl.innerHTML = `
            @keyframes islandWave {
                0%, 100% { height: 4px; }
                50% { height: 14px; }
            }
            .island-wave-bar {
                animation: islandWave 1.2s ease-in-out infinite;
                will-change: height;
            }
            #dynamic-island-pill {
                touch-action: manipulation;
                will-change: width, height, transform, opacity;
            }
            `;
            document.head.appendChild(styleEl);
        }

        var el = document.createElement('div');
        el.id = 'musifystar-dynamic-island';
        el.className = 'fixed top-3 left-1/2 -translate-x-1/2 z-[999999999] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] opacity-0 pointer-events-none scale-90 translate-y-[-20px] select-none transform-gpu';

        // Pre-baked SVG icons (0ms Lucide DOM scan delay)
        var svgChevronUp = `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>`;
        var svgHeartOutline = `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`;
        var svgSkipBack = `<svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" x2="5" y1="19" y2="5" stroke="currentColor" stroke-width="2"/></svg>`;
        var svgSkipForward = `<svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" x2="19" y1="5" y2="19" stroke="currentColor" stroke-width="2"/></svg>`;
        var svgMaximize = `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" x2="14" y1="3" y2="10"/><line x1="3" x2="10" y1="21" y2="14"/></svg>`;

        el.innerHTML = `
        <div id="dynamic-island-pill" class="relative overflow-hidden bg-black/90 backdrop-blur-2xl border border-white/20 shadow-[0_12px_36px_rgba(0,0,0,0.85)] rounded-[24px] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer group active:scale-[0.98] transform-gpu">
            
            <!-- Compact View (Mini Top Pill) -->
            <div id="island-compact-view" class="flex items-center justify-between gap-2 px-2.5 py-1 w-[210px] sm:w-[240px] h-[34px] transition-all duration-200" onclick="DynamicIsland.toggleExpand(event)">
                <!-- Left: Spin Cover Thumbnail -->
                <div class="relative w-5 h-5 shrink-0 rounded-full overflow-hidden border border-white/25 bg-black/50 shadow-inner">
                    <img id="island-compact-cover" src="/logo.png" class="w-full h-full object-cover rounded-full spin-record" style="animation-play-state: paused;" />
                </div>

                <!-- Center: Track & Artist Info -->
                <div class="flex-1 min-w-0 flex flex-col justify-center">
                    <div id="island-compact-title" class="text-[10px] font-extrabold text-white truncate leading-tight drop-shadow-sm">MusifyStar</div>
                    <div id="island-compact-artist" class="text-[8.5px] text-white/60 truncate leading-tight mt-0.5">VIP Mini Player</div>
                </div>

                <!-- Right: Audio Wave Visualizer Bars -->
                <div class="flex items-end justify-center gap-0.5 h-3 px-0.5 shrink-0">
                    <span class="island-wave-bar w-0.5 bg-rose-500 rounded-full h-2"></span>
                    <span class="island-wave-bar w-0.5 bg-amber-400 rounded-full h-3" style="animation-delay: 0.15s;"></span>
                    <span class="island-wave-bar w-0.5 bg-emerald-400 rounded-full h-2.5" style="animation-delay: 0.3s;"></span>
                    <span class="island-wave-bar w-0.5 bg-sky-400 rounded-full h-2.5" style="animation-delay: 0.45s;"></span>
                </div>
            </div>

            <!-- Expanded View (Interactive Floating Panel) -->
            <div id="island-expanded-view" class="hidden opacity-0 scale-95 flex-col p-2.5 sm:p-3 w-[275px] sm:w-[305px] transition-all duration-200 ease-out space-y-2">
                <!-- Top Row: Cover, Info & Badges -->
                <div class="flex items-center gap-2.5">
                    <div onclick="if(typeof FullPlayer !== 'undefined') FullPlayer.open(); DynamicIsland.collapse(); if(event) event.stopPropagation();" class="relative w-9 h-9 shrink-0 rounded-xl overflow-hidden border border-white/20 bg-black/60 shadow-md group-hover:scale-105 transition-transform cursor-pointer">
                        <img id="island-expanded-cover" src="/logo.png" class="w-full h-full object-cover rounded-xl" />
                    </div>
                    <div class="flex-1 min-w-0" onclick="if(typeof FullPlayer !== 'undefined') FullPlayer.open(); DynamicIsland.collapse(); if(event) event.stopPropagation();">
                        <div class="flex items-center gap-1">
                            <div id="island-expanded-title" class="text-xs font-black text-white truncate leading-tight">MusifyStar</div>
                            <span class="text-[7.5px] font-black px-1 py-0.2 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 shrink-0">VIP</span>
                        </div>
                        <div id="island-expanded-artist" class="text-[9.5px] text-white/70 truncate leading-tight mt-0.5">Artis MusifyStar</div>
                    </div>
                    <!-- Collapse Button -->
                    <button onclick="DynamicIsland.collapse(); if(event) event.stopPropagation();" class="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-white/10 active:scale-90">
                        ${svgChevronUp}
                    </button>
                </div>

                <!-- Progress Bar -->
                <div class="space-y-0.5">
                    <div class="w-full h-1 bg-white/15 rounded-full overflow-hidden cursor-pointer" onclick="DynamicIsland.seekTrack(event)">
                        <div id="island-progress-bar" class="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-sky-400 rounded-full transition-all duration-150" style="width: 0%;"></div>
                    </div>
                    <div class="flex items-center justify-between text-[8.5px] font-mono text-white/50 px-0.5">
                        <span id="island-time-current">0:00</span>
                        <span id="island-time-duration">0:00</span>
                    </div>
                </div>

                <!-- Player Controls Row -->
                <div class="flex items-center justify-between px-1 pt-0.5">
                    <button onclick="if(typeof toggleCurrentLike === 'function') toggleCurrentLike(); if(event) event.stopPropagation();" id="island-like-btn" class="text-white/60 hover:text-rose-400 active:scale-90 p-1 transition-colors cursor-pointer" title="Sukai Lagu">
                        ${svgHeartOutline}
                    </button>

                    <div class="flex items-center gap-3">
                        <button onclick="if(typeof NX === 'function') NX(-1); if(event) event.stopPropagation();" class="text-white/80 hover:text-white active:scale-90 p-0.5 cursor-pointer transition-colors" title="Sebelumnya">
                            ${svgSkipBack}
                        </button>
                        
                        <button onclick="if(typeof TP === 'function') TP(); if(event) event.stopPropagation();" class="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer" title="Putar / Jeda">
                            <div id="island-play-icon">
                                <svg class="w-3.5 h-3.5 fill-current ml-0.5" viewBox="0 0 24 24"><polygon points="6 3 20 12 6 21 6 3"/></svg>
                            </div>
                        </button>

                        <button onclick="if(typeof NX === 'function') NX(1); if(event) event.stopPropagation();" class="text-white/80 hover:text-white active:scale-90 p-0.5 cursor-pointer transition-colors" title="Selanjutnya">
                            ${svgSkipForward}
                        </button>
                    </div>

                    <button onclick="if(typeof FullPlayer !== 'undefined') FullPlayer.open(); DynamicIsland.collapse(); if(event) event.stopPropagation();" class="text-white/60 hover:text-sky-400 active:scale-90 p-1 transition-colors cursor-pointer" title="Buka Layar Penuh">
                        ${svgMaximize}
                    </button>
                </div>
            </div>
        </div>`;

        document.body.appendChild(el);

        // Click outside collapses expanded island
        document.addEventListener('click', function(e) {
            if (DynamicIsland.isExpanded) {
                var isIsland = el.contains(e.target);
                if (!isIsland) DynamicIsland.collapse();
            }
        });
    },

    updateState() {
        var el = document.getElementById('musifystar-dynamic-island');
        if (!el) {
            DynamicIsland.init();
            el = document.getElementById('musifystar-dynamic-island');
        }
        if (!el) return;

        // Ensure element is directly attached to body for top-level fixed z-index stacking
        if (el.parentNode !== document.body) {
            document.body.appendChild(el);
        }

        // Check if Dynamic Island setting is enabled and user is eligible
        var u = (typeof Auth !== 'undefined' && Auth.currentUser) ? Auth.currentUser : null;
        var isVipActive = (typeof Profile !== 'undefined' && typeof Profile.isCurrentUserVip === 'function') ? Profile.isCurrentUserVip() : false;
        
        // Fallback checks for user accounts
        if (!isVipActive) {
            if (u) {
                var email = String(u.email || u.rawEmail || '').toLowerCase().trim();
                var username = String(u.username || '').toLowerCase().trim();
                if (email === 'jrnabil570@gmail.com' || username === 'nabil' || u.isPremium || u.is_premium || (u.vipTier && u.vipTier !== 'none') || u.uid) {
                    isVipActive = true;
                }
            } else {
                // If Auth isn't fully loaded yet, allow based on settings
                isVipActive = true;
            }
        }

        var appSettings = (typeof Profile !== 'undefined' && typeof Profile.getSettings === 'function') ? Profile.getSettings() : null;
        var isSettingEnabled = appSettings ? (appSettings.dynamicIsland !== false) : (window._musifyDynamicIsland !== false);
        var hasTrack = Boolean(typeof S !== 'undefined' && S && S.ct && (S.ct.title || S.ct.id || S.ct.name || S.ct.cover));

        if (!isVipActive || !isSettingEnabled || !hasTrack) {
            // Hide Dynamic Island smoothly
            el.classList.add('opacity-0', 'pointer-events-none', 'scale-90', 'translate-y-[-20px]');
            el.classList.remove('opacity-100', 'pointer-events-auto', 'scale-100', 'translate-y-0');
            DynamicIsland.collapse();
            return;
        }

        // Show Dynamic Island
        el.classList.remove('opacity-0', 'pointer-events-none', 'scale-90', 'translate-y-[-20px]');
        el.classList.add('opacity-100', 'pointer-events-auto', 'scale-100', 'translate-y-0');

        // Update Track Meta Info
        var tr = S.ct;
        var title = tr.title || 'Pilih Lagu';
        var artist = tr.artist || 'MusifyStar';
        var cover = tr.cover || '/logo.png';

        var compactTitle = document.getElementById('island-compact-title');
        var compactArtist = document.getElementById('island-compact-artist');
        var compactCover = document.getElementById('island-compact-cover');

        var expandedTitle = document.getElementById('island-expanded-title');
        var expandedArtist = document.getElementById('island-expanded-artist');
        var expandedCover = document.getElementById('island-expanded-cover');

        if (compactTitle && compactTitle.innerText !== title) compactTitle.innerText = title;
        if (compactArtist && compactArtist.innerText !== artist) compactArtist.innerText = artist;
        if (compactCover) {
            if (compactCover.src !== cover) compactCover.src = cover;
            compactCover.style.animationPlayState = S.ip ? 'running' : 'paused';
        }

        if (expandedTitle && expandedTitle.innerText !== title) expandedTitle.innerText = title;
        if (expandedArtist && expandedArtist.innerText !== artist) expandedArtist.innerText = artist;
        if (expandedCover && expandedCover.src !== cover) expandedCover.src = cover;

        // Play/Pause State without DOM thrashing
        var playIcon = document.getElementById('island-play-icon');
        if (playIcon) {
            var playStateKey = S.il ? 'loading' : (S.ip ? 'playing' : 'paused');
            if (playIcon.getAttribute('data-state') !== playStateKey) {
                playIcon.setAttribute('data-state', playStateKey);
                if (S.il) {
                    playIcon.innerHTML = '<div class="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>';
                } else if (S.ip) {
                    playIcon.innerHTML = '<svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
                } else {
                    playIcon.innerHTML = '<svg class="w-4 h-4 fill-current ml-0.5" viewBox="0 0 24 24"><polygon points="6 3 20 12 6 21 6 3"/></svg>';
                }
            }
        }

        // Audio Wave bars animation state
        var waveBars = document.querySelectorAll('.island-wave-bar');
        waveBars.forEach(function(bar) {
            if (S.ip) {
                bar.style.animationPlayState = 'running';
                bar.style.opacity = '1';
            } else {
                bar.style.animationPlayState = 'paused';
                bar.style.opacity = '0.4';
            }
        });

        // Time & Progress Update
        if (typeof AU !== 'undefined' && AU && AU.duration) {
            var cur = AU.currentTime || 0;
            var dur = AU.duration || 1;
            var pct = Math.min(100, Math.max(0, (cur / dur) * 100));

            var pBar = document.getElementById('island-progress-bar');
            if (pBar) pBar.style.width = pct + '%';

            var tCur = document.getElementById('island-time-current');
            var tDur = document.getElementById('island-time-duration');
            if (tCur && typeof fm === 'function') tCur.innerText = fm(cur);
            if (tDur && typeof fm === 'function') tDur.innerText = fm(dur);
        }

        // Heart/Like button state without full DOM rescan
        var likeBtn = document.getElementById('island-like-btn');
        if (likeBtn && tr.id) {
            var isLiked = (typeof isTrackLiked === 'function') ? isTrackLiked(tr.id) : false;
            var stateKey = tr.id + '_' + isLiked;
            if (DynamicIsland.lastLikedState !== stateKey) {
                DynamicIsland.lastLikedState = stateKey;
                if (isLiked) {
                    likeBtn.className = 'text-rose-500 hover:text-rose-400 active:scale-90 p-1 transition-colors cursor-pointer';
                    likeBtn.innerHTML = '<svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
                } else {
                    likeBtn.className = 'text-white/60 hover:text-rose-400 active:scale-90 p-1 transition-colors cursor-pointer';
                    likeBtn.innerHTML = '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>';
                }
            }
        }
    },

    toggleExpand(e) {
        if (e && e.stopPropagation) e.stopPropagation();
        if (DynamicIsland.isExpanded) {
            DynamicIsland.collapse();
        } else {
            DynamicIsland.expand();
        }
    },

    expand() {
        DynamicIsland.isExpanded = true;
        var compact = document.getElementById('island-compact-view');
        var expanded = document.getElementById('island-expanded-view');

        if (compact) {
            compact.classList.add('hidden');
        }
        if (expanded) {
            expanded.classList.remove('hidden');
            void expanded.offsetWidth;
            expanded.classList.remove('opacity-0', 'scale-95');
            expanded.classList.add('opacity-100', 'scale-100');
        }

        DynamicIsland.updateState();

        if (DynamicIsland.autoCollapseTimer) clearTimeout(DynamicIsland.autoCollapseTimer);
        DynamicIsland.autoCollapseTimer = setTimeout(function() {
            DynamicIsland.collapse();
        }, 5000);
    },

    collapse() {
        DynamicIsland.isExpanded = false;
        var compact = document.getElementById('island-compact-view');
        var expanded = document.getElementById('island-expanded-view');

        if (expanded) {
            expanded.classList.add('opacity-0', 'scale-95');
            expanded.classList.remove('opacity-100', 'scale-100');
            setTimeout(function() {
                if (!DynamicIsland.isExpanded) expanded.classList.add('hidden');
            }, 180);
        }
        if (compact) {
            compact.classList.remove('hidden');
        }

        if (DynamicIsland.autoCollapseTimer) {
            clearTimeout(DynamicIsland.autoCollapseTimer);
            DynamicIsland.autoCollapseTimer = null;
        }
    },

    seekTrack(e) {
        if (e && e.stopPropagation) e.stopPropagation();
        if (typeof AU === 'undefined' || !AU || !AU.duration) return;
        var rect = e.currentTarget.getBoundingClientRect();
        var clickX = e.clientX - rect.left;
        var pct = Math.min(1, Math.max(0, clickX / rect.width));
        AU.currentTime = pct * AU.duration;
        DynamicIsland.updateState();
    }
};

// Initialize DynamicIsland on DOMReady or immediate load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { DynamicIsland.init(); });
} else {
    DynamicIsland.init();
}
