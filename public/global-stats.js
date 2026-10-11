// MusifyStar - Global Stats & Leaderboard Module
// Menampilkan Papan Peringkat Pendengar Teratas, Pamer Border Profil, & Lagu Terpopuler Global

(function() {
    'use strict';

    var GlobalStats = {
        activeTab: 'leaderboard', // 'leaderboard' | 'songs' | 'community'
        timeframe: 'all',         // 'all' | '30d' | '7d'
        cachedData: {},
        loading: false,
        pollTimer: null,

        getUserDisplayInfo(item, myUser) {
            if (!item) return { username: '', avatar: '', borderUrl: '', borderName: '', isVip: false, equippedBadge: '', equippedBadgeTitle: '', equippedBadgeIcon: '', equippedBadgeColor: '', isMe: false };
            myUser = myUser || ((typeof Auth !== 'undefined' && Auth.currentUser) ? Auth.currentUser : null);
            var isMe = false;
            if (myUser) {
                var myUname = (myUser.username || '').toLowerCase().trim();
                var myEmail = (myUser.email || myUser.rawEmail || '').toLowerCase().trim();
                var myId = String(myUser.id || '').trim();
                var itemUname = (item.username || '').toLowerCase().trim();
                var itemId = String(item.id || '').trim();
                var isMasterAdminUser = (myEmail === 'jrnabil570@gmail.com' || myUname === 'nabil' || myUname === 'musifystar' || myUser.role === 'admin');
                if ((itemId && myId && itemId === myId) || (itemUname && myUname && itemUname === myUname) || (item.isMasterAdmin && isMasterAdminUser)) {
                    isMe = true;
                }
            }

            if (isMe && myUser) {
                var isVipExpired = myUser.vipExpiresAt && Date.now() > myUser.vipExpiresAt;
                var isMasterAdmin = ((myUser.email || myUser.rawEmail || '').toLowerCase().trim() === 'jrnabil570@gmail.com') || (myUser.username === 'nabil') || (myUser.username === 'MusifyStar') || (myUser.role === 'admin');
                var isUserVip = isMasterAdmin || (Boolean(myUser.isPremium || myUser.is_premium || (myUser.vipTier && myUser.vipTier !== 'none')) && !isVipExpired);

                var url = (typeof Auth !== 'undefined' && typeof Auth.getBorderUrl === 'function')
                    ? Auth.getBorderUrl(myUser)
                    : (myUser.borderUrl || '');
                var name = (typeof Auth !== 'undefined' && typeof Auth.getBorderName === 'function')
                    ? Auth.getBorderName(myUser)
                    : (myUser.borderName || '');

                return {
                    username: myUser.username || item.username || '',
                    avatar: myUser.avatar || item.avatar || '/logo.png',
                    borderUrl: url || '',
                    borderName: name || '',
                    isVip: isUserVip,
                    equippedBadge: myUser.equippedBadge || item.equippedBadge || '',
                    equippedBadgeTitle: myUser.equippedBadgeTitle || item.equippedBadgeTitle || '',
                    equippedBadgeIcon: myUser.equippedBadgeIcon || item.equippedBadgeIcon || '',
                    equippedBadgeColor: myUser.equippedBadgeColor || item.equippedBadgeColor || '',
                    isMe: true
                };
            }

            var itemVip = Boolean(item.isVip || item.is_vip || (item.vipTier && item.vipTier !== 'none'));

            return {
                username: item.username || '',
                avatar: item.avatar || '/logo.png',
                borderUrl: item.borderUrl || '',
                borderName: item.borderName || '',
                isVip: itemVip,
                equippedBadge: item.equippedBadge || '',
                equippedBadgeTitle: item.equippedBadgeTitle || '',
                equippedBadgeIcon: item.equippedBadgeIcon || '',
                equippedBadgeColor: item.equippedBadgeColor || '',
                isMe: false
            };
        },

        // Resolve border for any leaderboard user in real-time
        getUserDisplayBorder(item, myUser) {
            var info = this.getUserDisplayInfo(item, myUser);
            return { borderUrl: info.borderUrl, borderName: info.borderName, isMe: info.isMe };
        },

        // Real-time handler called when user profile (name, avatar, badges) changes
        onUserProfileUpdated(user) {
            if (!user) return;
            var myUname = (user.username || '').toLowerCase().trim();
            var myId = String(user.id || '').trim();

            if (this.cachedData && typeof this.cachedData === 'object') {
                var self = this;
                Object.keys(this.cachedData).forEach(function(tf) {
                    var cached = self.cachedData[tf];
                    if (cached && Array.isArray(cached.leaderboard)) {
                        cached.leaderboard.forEach(function(it) {
                            var match = (it.id && myId && String(it.id).trim() === myId) ||
                                        (it.username && (it.username || '').toLowerCase().trim() === myUname);
                            if (match) {
                                it.username = user.username;
                                it.avatar = user.avatar;
                                it.borderUrl = user.borderUrl || '';
                                it.borderName = user.borderName || '';
                                it.isVip = user.isVip;
                                it.equippedBadge = user.equippedBadge || '';
                                it.equippedBadgeTitle = user.equippedBadgeTitle || '';
                                it.equippedBadgeIcon = user.equippedBadgeIcon || '';
                                it.equippedBadgeColor = user.equippedBadgeColor || '';
                            }
                        });
                    }
                });
            }

            if (document.getElementById('global-stats-modal')) {
                this.renderCurrentTab();
            }
        },

        // Real-time handler called when user equips or changes border
        onUserBorderChanged(newBorderUrl, newBorderName) {
            var myUser = (typeof Auth !== 'undefined' && Auth.currentUser) ? Auth.currentUser : null;
            if (!myUser) return;
            this.onUserProfileUpdated(myUser);
        },

        startLivePolling() {
            this.stopLivePolling();
            var self = this;
            this.pollTimer = setInterval(function() {
                var modal = document.getElementById('global-stats-modal');
                if (!modal) {
                    self.stopLivePolling();
                    return;
                }
                // Background silent poll without disrupting scroll or user interaction
                self.fetchData(self.timeframe, true, true).then(function(newData) {
                    if (document.getElementById('global-stats-modal') && newData) {
                        var sig = JSON.stringify(newData.leaderboard || []);
                        if (self.lastLeaderboardSig !== sig) {
                            self.lastLeaderboardSig = sig;
                            self.renderCurrentTab();
                        }
                    }
                });
            }, 12000);
        },

        stopLivePolling() {
            if (this.pollTimer) {
                clearInterval(this.pollTimer);
                this.pollTimer = null;
            }
        },

        async fetchData(timeframe, force, isSilent) {
            timeframe = timeframe || this.timeframe || 'all';
            if (!force && this.cachedData[timeframe]) {
                return this.cachedData[timeframe];
            }

            this.loading = true;
            if (!isSilent) this.updateLoadingState(true);

            try {
                var res = await fetch('/api/global-stats?timeframe=' + encodeURIComponent(timeframe) + '&t=' + Date.now());
                var data = await res.json();
                if (data && data.status) {
                    this.cachedData[timeframe] = data;
                    this.loading = false;
                    if (!isSilent) this.updateLoadingState(false);
                    return data;
                }
            } catch(e) {
                console.error('[GlobalStats] Fetch error:', e);
            }

            this.loading = false;
            if (!isSilent) this.updateLoadingState(false);
            return this.cachedData[timeframe] || null;
        },

        updateLoadingState(isLoading) {
            var refreshBtn = document.getElementById('gs-refresh-btn');
            if (refreshBtn) {
                if (isLoading) refreshBtn.classList.add('animate-spin');
                else refreshBtn.classList.remove('animate-spin');
            }
        },

        openModal(initialTab) {
            if (initialTab) this.activeTab = initialTab;

            var existing = document.getElementById('global-stats-modal');
            if (existing) existing.remove();

            var modal = document.createElement('div');
            modal.id = 'global-stats-modal';
            modal.className = 'fixed inset-0 z-[700] bg-[#07090e] flex flex-col select-none overflow-hidden h-[100dvh] max-h-[100dvh] animate-fade-in';

            modal.innerHTML = `
                <!-- Full Page Sticky Header -->
                <div class="pt-5 sm:pt-6 pb-3.5 px-4 shrink-0 border-b border-white/10 shadow-2xl transition-all flex items-center justify-between" style="background: linear-gradient(180deg, rgba(13, 15, 22, 0.92) 0%, rgba(13, 15, 22, 0.98) 100%), url('/banner.png') center/cover no-repeat; backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);">
                    <div class="flex items-center gap-3">
                        <button type="button" onclick="GlobalStats.closeModal()" class="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center active:scale-95 transition-all cursor-pointer shadow-sm" title="Kembali">
                            <i data-lucide="arrow-left" class="w-5 h-5"></i>
                        </button>
                        <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-black shadow-[0_0_20px_rgba(245,158,11,0.35)] shrink-0">
                            <i data-lucide="trophy" class="w-5 h-5 fill-black stroke-black"></i>
                        </div>
                        <div>
                            <div class="flex items-center gap-2">
                                <h1 class="text-lg sm:text-xl font-black text-white tracking-tight leading-tight">Global Stats & Leaderboard</h1>
                                <span id="gs-live-indicator" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[9.5px] font-mono text-emerald-400">
                                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                    <span id="gs-live-badge-text">Live</span>
                                </span>
                            </div>
                            <p class="text-white/60 text-xs leading-tight mt-0.5">Papan peringkat pendengar & pamer Border profil</p>
                        </div>
                    </div>

                    <div class="flex items-center gap-2">
                        <button id="gs-refresh-btn" onclick="GlobalStats.refreshData()" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-95" title="Segarkan Data">
                            <i data-lucide="rotate-cw" class="w-4 h-4"></i>
                        </button>
                        <button type="button" onclick="GlobalStats.closeModal()" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer">
                            <i data-lucide="x" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>

                <!-- Main Navigation Tabs -->
                <div class="px-4 py-2.5 border-b border-white/5 bg-[#10121d]/80 flex items-center justify-center gap-2 overflow-x-auto hide-scrollbar shrink-0">
                    <div class="max-w-2xl w-full flex items-center gap-2">
                        <button onclick="GlobalStats.switchTab('leaderboard')" id="gs-tab-leaderboard" class="flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm ${this.activeTab === 'leaderboard' ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'}">
                            <i data-lucide="award" class="w-3.5 h-3.5"></i>
                            <span>Papan Peringkat</span>
                        </button>
                        <button onclick="GlobalStats.switchTab('songs')" id="gs-tab-songs" class="flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm ${this.activeTab === 'songs' ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]' : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'}">
                            <i data-lucide="flame" class="w-3.5 h-3.5"></i>
                            <span>Top 20 Lagu Terpopuler</span>
                        </button>
                    </div>
                </div>

                <!-- Full Page Scrollable Body -->
                <div id="gs-scroll-container" class="flex-1 overflow-y-auto overscroll-contain hide-scrollbar p-4 sm:p-6 max-w-2xl mx-auto w-full pb-32">
                    <div id="global-stats-content" class="space-y-4">
                        <div class="py-12 flex flex-col items-center justify-center gap-3 text-white/60">
                            <i data-lucide="loader-2" class="w-7 h-7 text-amber-400 animate-spin"></i>
                            <span class="text-xs font-medium">Memuat statistik global & peringkat...</span>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            if (window.lucide && typeof window.lucide.createIcons === 'function') {
                try { window.lucide.createIcons(); } catch(e){}
            }

            this.cachedData = {};
            this.loadAndRender(true);
            this.startLivePolling();
        },

        closeModal() {
            this.stopLivePolling();
            var modal = document.getElementById('global-stats-modal');
            if (modal) modal.remove();
        },

        switchTab(tab) {
            this.activeTab = (tab === 'songs') ? 'songs' : 'leaderboard';
            var tabs = ['leaderboard', 'songs'];
            var self = this;
            tabs.forEach(function(t) {
                var btn = document.getElementById('gs-tab-' + t);
                if (!btn) return;
                if (t === self.activeTab) {
                    if (t === 'leaderboard') {
                        btn.className = 'flex-1 min-w-[130px] py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]';
                    } else if (t === 'songs') {
                        btn.className = 'flex-1 min-w-[130px] py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]';
                    }
                } else {
                    btn.className = 'flex-1 min-w-[130px] py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10';
                }
            });
            this.renderCurrentTab();
        },

        setTimeframe(tf) {
            this.timeframe = tf;
            this.loadAndRender(true);
        },

        async refreshData() {
            await this.fetchData(this.timeframe, true);
            this.renderCurrentTab();
        },

        async loadAndRender(force) {
            var data = await this.fetchData(this.timeframe, force);
            if (!data) {
                var container = document.getElementById('global-stats-content');
                if (container) {
                    container.innerHTML = `
                        <div class="text-center py-12 text-rose-400 space-y-2">
                            <i data-lucide="alert-circle" class="w-8 h-8 mx-auto"></i>
                            <p class="text-xs font-semibold">Gagal memuat data statistik global. Coba lagi beberapa saat.</p>
                            <button onclick="GlobalStats.refreshData()" class="mt-2 px-4 py-1.5 rounded-xl bg-white/10 text-white text-xs hover:bg-white/20 cursor-pointer">Coba Ulang</button>
                        </div>
                    `;
                    if (window.lucide && typeof window.lucide.createIcons === 'function') {
                        try { window.lucide.createIcons(); } catch(e){}
                    }
                }
                return;
            }

            // Update live listeners counter
            var liveBadge = document.getElementById('gs-live-badge-text');
            if (liveBadge && data.liveActiveCount !== undefined) {
                liveBadge.textContent = data.liveActiveCount > 0 ? (data.liveActiveCount + ' Online') : 'Live';
            }

            this.renderCurrentTab();
        },

        renderCurrentTab() {
            var container = document.getElementById('global-stats-content');
            if (!container) return;

            var data = this.cachedData[this.timeframe];
            if (!data) return;

            var scrollEl = document.getElementById('gs-scroll-container');
            var savedScroll = scrollEl ? scrollEl.scrollTop : 0;

            if (this.activeTab === 'songs') {
                container.innerHTML = this.getTopSongsHTML(data);
            } else {
                container.innerHTML = this.getLeaderboardHTML(data);
            }

            if (scrollEl) {
                scrollEl.scrollTop = savedScroll;
            }

            if (window.lucide && typeof window.lucide.createIcons === 'function') {
                try { window.lucide.createIcons(); } catch(e){}
            }
        },

        // 1. LEADERBOARD HTML RENDERER
        getLeaderboardHTML(data) {
            var lb = data.leaderboard || [];
            var top3 = lb.slice(0, 3);
            var rest = lb.slice(3);

            var tf = this.timeframe;
            var tfButtons = `
                <div class="flex items-center justify-between gap-1 p-1 rounded-2xl bg-black/40 border border-white/10 text-[11px] font-semibold">
                    <button onclick="GlobalStats.setTimeframe('all')" class="flex-1 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${tf === 'all' ? 'bg-amber-400/20 text-amber-300 border border-amber-400/35 font-bold shadow-sm' : 'text-white/60 hover:text-white'}">
                        Sepanjang Waktu
                    </button>
                    <button onclick="GlobalStats.setTimeframe('30d')" class="flex-1 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${tf === '30d' ? 'bg-amber-400/20 text-amber-300 border border-amber-400/35 font-bold shadow-sm' : 'text-white/60 hover:text-white'}">
                        30 Hari Terakhir
                    </button>
                    <button onclick="GlobalStats.setTimeframe('7d')" class="flex-1 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${tf === '7d' ? 'bg-amber-400/20 text-amber-300 border border-amber-400/35 font-bold shadow-sm' : 'text-white/60 hover:text-white'}">
                        7 Hari Terakhir
                    </button>
                </div>
            `;

            // Identify current logged in user's position
            var myUser = (typeof Auth !== 'undefined' && Auth.currentUser) ? Auth.currentUser : null;
            var myRankItem = null;
            if (myUser && myUser.username) {
                var myUname = (myUser.username || '').toLowerCase().trim();
                var myEmail = (myUser.email || myUser.rawEmail || '').toLowerCase().trim();
                var myId = String(myUser.id || '').trim();
                var isMasterAdminUser = (myEmail === 'jrnabil570@gmail.com' || myUname === 'nabil' || myUname === 'musifystar' || myUser.role === 'admin');
                myRankItem = lb.find(function(item) {
                    var itemUname = (item.username || '').toLowerCase().trim();
                    var itemId = String(item.id || '').trim();
                    return (itemId && myId && itemId === myId) || 
                           (itemUname === myUname) ||
                           (item.isMasterAdmin && isMasterAdminUser);
                });
            }

            var myRankCard = '';
            if (myUser) {
                var myRankNum = myRankItem ? ('#' + myRankItem.rank) : '#-';
                var myDuration = myRankItem ? myRankItem.formattedDuration : '0 Menit';
                var myPlays = myRankItem ? myRankItem.totalPlays : 0;
                var myInfo = this.getUserDisplayInfo(myRankItem || myUser, myUser);

                myRankCard = `
                    <div class="p-3.5 rounded-2xl bg-gradient-to-r from-sky-500/15 via-indigo-500/15 to-purple-500/15 border border-sky-400/30 flex items-center justify-between gap-3 shadow-lg">
                        <div class="flex items-center gap-3 min-w-0">
                            <!-- Avatar with Border -->
                            <div class="relative w-12 h-12 flex items-center justify-center shrink-0 mr-1.5">
                                <div class="w-10 h-10 rounded-full overflow-hidden bg-black/80 ring-1 ring-white/20">
                                    <img src="${myInfo.avatar}" class="w-full h-full object-cover rounded-full" onerror="this.src='/logo.png'" />
                                </div>
                                ${myInfo.borderUrl ? `
                                <img src="${myInfo.borderUrl}" class="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[66px] h-[66px] max-w-none object-contain z-10 select-none drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                                ` : ''}
                            </div>
                            <div class="min-w-0 flex-1 relative z-20">
                                <div class="flex items-center gap-1.5 flex-wrap">
                                    <span class="text-[10px] font-mono text-sky-400 uppercase tracking-wider font-bold">Peringkat Kamu</span>
                                    <span class="text-[9px] bg-sky-500/20 text-sky-300 border border-sky-500/30 px-1.5 py-0.2 rounded font-bold">${myRankNum}</span>
                                    ${myInfo.borderName ? `<span class="text-[9px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-1.5 py-0.2 rounded font-bold">${myInfo.borderName}</span>` : ''}
                                </div>
                                <div class="flex items-center gap-1.5 flex-wrap mt-0.5">
                                    <h4 class="text-white font-black text-xs truncate">@${myInfo.username}</h4>
                                    ${myInfo.isVip ? (typeof Auth !== 'undefined' && Auth.getVipBadgeHTML ? Auth.getVipBadgeHTML('text-[8px] px-1.5 py-0.2') : '') : ''}
                                    ${myInfo.equippedBadgeTitle || myInfo.equippedBadge ? (typeof Auth !== 'undefined' && Auth.getRankBadgePillHTML ? Auth.getRankBadgePillHTML(myInfo.equippedBadge, myInfo.equippedBadgeTitle, myInfo.equippedBadgeIcon, myInfo.equippedBadgeColor) : '') : ''}
                                </div>
                                <p class="text-[10px] text-white/60 flex items-center gap-1 mt-0.5">
                                    <i data-lucide="clock" class="w-3 h-3 text-amber-400"></i> ${myDuration} &bull; ${myPlays} lagu
                                </p>
                            </div>
                        </div>
                        <button onclick="if(typeof Auth !== 'undefined') Auth.openUserProfileModal();" class="text-[10.5px] px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold border border-white/20 shrink-0 cursor-pointer active:scale-95 transition-all">
                            Profil
                        </button>
                    </div>
                `;
            } else {
                myRankCard = `
                    <div class="p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-3 text-xs">
                        <div class="flex items-center gap-2.5 min-w-0">
                            <div class="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
                                <i data-lucide="sparkles" class="w-4 h-4"></i>
                            </div>
                            <div class="min-w-0">
                                <p class="text-white font-bold text-xs">Ingin Pamerkan Border Profilmu?</p>
                                <p class="text-[10px] text-white/50">Login akun untuk mencatat durasi musik & border di leaderboard!</p>
                            </div>
                        </div>
                        <button onclick="GlobalStats.closeModal(); if(typeof Auth !== 'undefined') Auth.toggleTopDropdown();" class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-extrabold text-[11px] shrink-0 cursor-pointer active:scale-95 transition-all shadow-sm">
                            Login
                        </button>
                    </div>
                `;
            }

            // Podium Top 3 Render with Real-time Border Sync
            var podiumHTML = '';
            if (top3.length > 0) {
                var first = top3[0] || null;
                var second = top3.length > 1 ? top3[1] : null;
                var third = top3.length > 2 ? top3[2] : null;

                var u1 = first ? this.getUserDisplayInfo(first, myUser) : null;
                var u2 = second ? this.getUserDisplayInfo(second, myUser) : null;
                var u3 = third ? this.getUserDisplayInfo(third, myUser) : null;

                podiumHTML = `
                    <div class="pt-2 pb-1">
                        <div class="flex items-end justify-center gap-2 sm:gap-3">
                            
                            <!-- PODIUM #2: Perak (Silver) -->
                            ${second && u2 ? `
                            <div class="flex-1 flex flex-col items-center max-w-[130px] sm:max-w-[140px] text-center">
                                <div class="relative mb-5 sm:mb-6 pt-2">
                                    <div class="relative w-16 h-16 flex items-center justify-center">
                                        <div class="w-13 h-13 rounded-full overflow-hidden bg-black/80 ring-2 ring-slate-400/60 shadow-lg">
                                            <img src="${u2.avatar}" class="w-full h-full object-cover rounded-full" onerror="this.src='/logo.png'" />
                                        </div>
                                        ${u2.borderUrl ? `
                                        <img src="${u2.borderUrl}" class="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[88px] h-[88px] max-w-none object-contain z-10 select-none drop-shadow-[0_0_10px_rgba(203,213,225,0.6)]" />
                                        ` : ''}
                                    </div>
                                    <span class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-300 text-black font-black text-[10px] flex items-center justify-center shadow-md border border-white">2</span>
                                </div>
                                <div class="relative z-20 flex flex-col items-center w-full px-1">
                                    <h5 class="text-xs font-black text-white truncate w-full text-center">
                                        ${u2.username}
                                    </h5>
                                    ${(u2.isVip || u2.equippedBadgeTitle || u2.equippedBadge) ? `
                                    <div class="mt-1 flex items-center justify-center gap-1 flex-nowrap shrink-0">
                                        ${u2.isVip ? (typeof Auth !== 'undefined' && Auth.getVipBadgeHTML ? Auth.getVipBadgeHTML() : '') : ''}
                                        ${u2.equippedBadgeTitle || u2.equippedBadge ? (typeof Auth !== 'undefined' && Auth.getRankBadgePillHTML ? Auth.getRankBadgePillHTML(u2.equippedBadge, u2.equippedBadgeTitle, u2.equippedBadgeIcon, u2.equippedBadgeColor) : '') : ''}
                                    </div>
                                    ` : ''}
                                    ${u2.borderName ? `<span class="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-400/20 text-slate-200 border border-slate-400/30 text-[9px] font-bold leading-none shadow-sm">Border: ${u2.borderName}</span>` : ''}
                                    <span class="text-[10px] text-slate-300 font-mono mt-1 font-bold">${second.formattedDuration}</span>
                                </div>
                                <div class="w-full h-14 mt-2 rounded-t-2xl bg-gradient-to-t from-slate-800/80 to-slate-700/50 border-t border-slate-400/40 flex items-center justify-center shadow-inner">
                                    <span class="text-[11px] font-black text-slate-300">🥈 #2</span>
                                </div>
                            </div>
                            ` : '<div class="flex-1"></div>'}

                            <!-- PODIUM #1: Emas (Gold) - Elevated -->
                            ${first && u1 ? `
                            <div class="flex-1 flex flex-col items-center max-w-[150px] sm:max-w-[160px] text-center z-10">
                                <div class="relative mb-6 sm:mb-7 pt-3">
                                    <div class="absolute -top-4 left-1/2 -translate-x-1/2 text-amber-400 animate-bounce">
                                        <i data-lucide="crown" class="w-5 h-5 fill-amber-400"></i>
                                    </div>
                                    <div class="relative w-20 h-20 flex items-center justify-center">
                                        <div class="w-16 h-16 rounded-full overflow-hidden bg-black/90 ring-2 ring-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.5)]">
                                            <img src="${u1.avatar}" class="w-full h-full object-cover rounded-full" onerror="this.src='/logo.png'" />
                                        </div>
                                        ${u1.borderUrl ? `
                                        <img src="${u1.borderUrl}" class="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[108px] h-[108px] max-w-none object-contain z-10 select-none drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
                                        ` : ''}
                                    </div>
                                    <span class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-black font-black text-xs flex items-center justify-center shadow-lg border-2 border-amber-200">1</span>
                                </div>
                                <div class="relative z-20 flex flex-col items-center w-full px-1">
                                    <h5 class="text-sm font-black text-white truncate w-full text-center">
                                        ${u1.username}
                                    </h5>
                                    ${(u1.isVip || u1.equippedBadgeTitle || u1.equippedBadge) ? `
                                    <div class="mt-1 flex items-center justify-center gap-1 flex-nowrap shrink-0">
                                        ${u1.isVip ? (typeof Auth !== 'undefined' && Auth.getVipBadgeHTML ? Auth.getVipBadgeHTML() : '') : ''}
                                        ${u1.equippedBadgeTitle || u1.equippedBadge ? (typeof Auth !== 'undefined' && Auth.getRankBadgePillHTML ? Auth.getRankBadgePillHTML(u1.equippedBadge, u1.equippedBadgeTitle, u1.equippedBadgeIcon, u1.equippedBadgeColor) : '') : ''}
                                    </div>
                                    ` : ''}
                                    ${u1.borderName ? `<span class="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[9.5px] font-extrabold leading-none shadow-sm">Border: ${u1.borderName}</span>` : ''}
                                    <span class="text-[11px] text-amber-300 font-mono mt-1 font-black">${first.formattedDuration}</span>
                                </div>
                                <div class="w-full h-20 mt-2 rounded-t-2xl bg-gradient-to-t from-amber-950/80 via-amber-800/40 to-amber-600/40 border-t-2 border-amber-400 flex flex-col items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.2)]">
                                    <span class="text-xs font-black text-amber-300 flex items-center gap-1">🥇 JUARA 1</span>
                                    <span class="text-[9px] text-amber-200/70 font-mono">${first.totalPlays} Lagu Diputar</span>
                                </div>
                            </div>
                            ` : '<div class="flex-1"></div>'}

                            <!-- PODIUM #3: Perunggu (Bronze) -->
                            ${third && u3 ? `
                            <div class="flex-1 flex flex-col items-center max-w-[130px] sm:max-w-[140px] text-center">
                                <div class="relative mb-5 sm:mb-6 pt-2">
                                    <div class="relative w-16 h-16 flex items-center justify-center">
                                        <div class="w-13 h-13 rounded-full overflow-hidden bg-black/80 ring-2 ring-amber-700/60 shadow-lg">
                                            <img src="${u3.avatar}" class="w-full h-full object-cover rounded-full" onerror="this.src='/logo.png'" />
                                        </div>
                                        ${u3.borderUrl ? `
                                        <img src="${u3.borderUrl}" class="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[88px] h-[88px] max-w-none object-contain z-10 select-none drop-shadow-[0_0_10px_rgba(180,83,9,0.5)]" />
                                        ` : ''}
                                    </div>
                                    <span class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-700 text-white font-black text-[10px] flex items-center justify-center shadow-md border border-amber-500">3</span>
                                </div>
                                <div class="relative z-20 flex flex-col items-center w-full px-1">
                                    <h5 class="text-xs font-black text-white truncate w-full text-center">
                                        ${u3.username}
                                    </h5>
                                    ${(u3.isVip || u3.equippedBadgeTitle || u3.equippedBadge) ? `
                                    <div class="mt-1 flex items-center justify-center gap-1 flex-nowrap shrink-0">
                                        ${u3.isVip ? (typeof Auth !== 'undefined' && Auth.getVipBadgeHTML ? Auth.getVipBadgeHTML() : '') : ''}
                                        ${u3.equippedBadgeTitle || u3.equippedBadge ? (typeof Auth !== 'undefined' && Auth.getRankBadgePillHTML ? Auth.getRankBadgePillHTML(u3.equippedBadge, u3.equippedBadgeTitle, u3.equippedBadgeIcon, u3.equippedBadgeColor) : '') : ''}
                                    </div>
                                    ` : ''}
                                    ${u3.borderName ? `<span class="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-700/20 text-amber-300 border border-amber-700/30 text-[9px] font-bold leading-none shadow-sm">Border: ${u3.borderName}</span>` : ''}
                                    <span class="text-[10px] text-amber-400 font-mono mt-1 font-bold">${third.formattedDuration}</span>
                                </div>
                                <div class="w-full h-11 mt-2 rounded-t-2xl bg-gradient-to-t from-stone-900/80 to-amber-900/40 border-t border-amber-700/50 flex items-center justify-center shadow-inner">
                                    <span class="text-[11px] font-black text-amber-400">🥉 #3</span>
                                </div>
                            </div>
                            ` : '<div class="flex-1"></div>'}

                        </div>
                    </div>
                `;
            }

            // List #4 ke bawah
            var restHTML = '';
            if (rest.length > 0) {
                var self = this;
                restHTML = `
                    <div class="space-y-2 pt-2">
                        <div class="flex items-center justify-between text-[11px] font-bold text-white/50 px-2 uppercase tracking-wider">
                            <span>Peringkat 4 - Seterusnya</span>
                            <span>Total Durasi</span>
                        </div>
                        ${rest.map(function(item) {
                            var ui = self.getUserDisplayInfo(item, myUser);
                            return `
                            <div class="p-2.5 rounded-2xl ${ui.isMe ? 'bg-sky-500/10 border-sky-400/40 shadow-md' : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/10'} border flex items-center justify-between gap-3 transition-all">
                                <div class="flex items-center gap-3 min-w-0">
                                    <span class="w-6 text-center text-xs font-black text-white/50 font-mono">#${item.rank}</span>
                                    
                                    <!-- Avatar with Border Frame -->
                                    <div class="relative w-11 h-11 flex items-center justify-center shrink-0 mr-1">
                                        <div class="w-9 h-9 rounded-full overflow-hidden bg-black/80 ring-1 ring-white/15">
                                            <img src="${ui.avatar}" class="w-full h-full object-cover rounded-full" onerror="this.src='/logo.png'" />
                                        </div>
                                        ${ui.borderUrl ? `
                                        <img src="${ui.borderUrl}" class="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60px] h-[60px] max-w-none object-contain z-10 select-none drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                                        ` : ''}
                                    </div>

                                    <div class="min-w-0 flex-1 relative z-20">
                                        <div class="flex items-center gap-1.5 flex-wrap">
                                            <h5 class="text-white font-bold text-xs truncate max-w-[140px]">${ui.username}</h5>
                                            ${ui.isVip ? ((typeof Auth !== 'undefined' && Auth.getVipBadgeHTML) ? Auth.getVipBadgeHTML('text-[8px] px-1.5 py-0.2') : '<span class="text-[8px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-1 py-0.2 rounded font-black font-mono">VIP</span>') : ''}
                                            ${ui.equippedBadgeTitle || ui.equippedBadge ? (typeof Auth !== 'undefined' && Auth.getRankBadgePillHTML ? Auth.getRankBadgePillHTML(ui.equippedBadge, ui.equippedBadgeTitle, ui.equippedBadgeIcon, ui.equippedBadgeColor) : `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold border" style="border-color: ${ui.equippedBadgeColor || '#38bdf8'}; color: ${ui.equippedBadgeColor || '#38bdf8'};">${ui.equippedBadgeTitle}</span>`) : ''}
                                            ${item.isOnline ? '<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Sedang Mendengarkan"></span>' : ''}
                                        </div>
                                        <div class="flex items-center gap-1.5 text-[10px] text-white/50 truncate">
                                            ${ui.borderName ? `<span class="text-amber-300 font-medium">Border: ${ui.borderName}</span> &bull; ` : ''}
                                            <span>${item.totalPlays} lagu</span>
                                        </div>
                                    </div>
                                </div>

                                <div class="text-right shrink-0">
                                    <span class="text-xs font-black text-amber-300 font-mono">${item.formattedDuration}</span>
                                </div>
                            </div>
                            `;
                        }).join('')}
                    </div>
                `;
            }

            return `
                <div class="space-y-4">
                    ${tfButtons}
                    ${myRankCard}
                    ${podiumHTML}
                    ${restHTML}
                </div>
            `;
        },

        // 2. TOP SONGS RENDERER
        getTopSongsHTML(data) {
            var songs = data.topSongs || [];
            if (songs.length === 0) {
                return `
                    <div class="text-center py-12 text-white/50 space-y-2">
                        <i data-lucide="music" class="w-8 h-8 mx-auto text-white/30"></i>
                        <p class="text-xs">Belum ada lagu yang tercatat dalam periode ini.</p>
                    </div>
                `;
            }

            return `
                <div class="space-y-2.5">
                    <div class="p-3 rounded-2xl bg-gradient-to-r from-rose-500/10 via-pink-500/10 to-amber-500/10 border border-rose-500/20 flex items-center justify-between">
                        <div>
                            <h4 class="text-xs font-black text-white">Top 20 Lagu Paling Banyak Diputar</h4>
                            <p class="text-[10px] text-white/50">Diurutkan berdasarkan frekuensi putar seluruh pengguna MusifyStar</p>
                        </div>
                        <span class="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold">Trending</span>
                    </div>

                    <div class="space-y-2">
                        ${songs.map(function(s, idx) {
                            var rankColor = idx === 0 ? 'text-amber-400 font-black' : (idx === 1 ? 'text-slate-300 font-black' : (idx === 2 ? 'text-amber-600 font-black' : 'text-white/40 font-mono'));
                            var cover = s.image || (s.id ? `https://i.ytimg.com/vi/${s.id}/hqdefault.jpg` : '/logo.png');
                            var songObjStr = encodeURIComponent(JSON.stringify(s));

                            return `
                            <div class="p-2.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 flex items-center justify-between gap-3 transition-all group">
                                <div class="flex items-center gap-3 min-w-0 flex-1">
                                    <span class="w-6 text-center text-xs ${rankColor}">#${s.rank || (idx + 1)}</span>
                                    <div class="relative w-11 h-11 rounded-xl overflow-hidden bg-black/60 shrink-0 border border-white/10 shadow-sm">
                                        <img src="${cover}" class="w-full h-full object-cover" onerror="this.src='/logo.png'" />
                                        <button onclick="GlobalStats.playSong('${songObjStr}')" class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer">
                                            <i data-lucide="play" class="w-4 h-4 fill-white"></i>
                                        </button>
                                    </div>
                                    <div class="min-w-0 flex-1">
                                        <h5 class="text-white font-bold text-xs truncate">${s.title}</h5>
                                        <p class="text-[11px] text-white/50 truncate">${s.artist || 'MusifyStar'}</p>
                                    </div>
                                </div>

                                <div class="flex items-center gap-2 shrink-0">
                                    <div class="text-right">
                                        <span class="text-[11px] font-black text-rose-300 font-mono">${s.count}x</span>
                                        <span class="text-[9px] text-white/40 block">diputar</span>
                                    </div>
                                    <button onclick="GlobalStats.playSong('${songObjStr}')" class="w-8 h-8 rounded-full bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/30 flex items-center justify-center transition-all cursor-pointer active:scale-95" title="Putar Lagu Ini">
                                        <i data-lucide="play" class="w-3.5 h-3.5 fill-rose-300"></i>
                                    </button>
                                </div>
                            </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        },

        playSong(encodedSongStr) {
            try {
                var s = JSON.parse(decodeURIComponent(encodedSongStr));
                if (typeof Player !== 'undefined' && Player.playTrack) {
                    Player.playTrack({
                        id: s.id,
                        title: s.title,
                        artist: s.artist,
                        image: s.image,
                        duration: s.duration,
                        album: s.album
                    });
                }
            } catch(e) {
                console.error('[GlobalStats] Play song error:', e);
            }
        },

        // 3. COMMUNITY PLATFORM STATS RENDERER
        getCommunityStatsHTML(data) {
            var liveCount = data.liveActiveCount || 0;
            var totalHours = data.totalCommunityHours || '35.6';
            var totalPlays = data.totalPlays || 480;
            var totalMembers = data.totalMembers || 6;
            var devices = data.devices || {};

            return `
                <div class="space-y-4">
                    <!-- Banner Overview -->
                    <div class="p-4 rounded-3xl bg-gradient-to-r from-sky-500/20 via-indigo-500/20 to-purple-500/20 border border-sky-400/30 shadow-xl space-y-3">
                        <div class="flex items-center justify-between">
                            <span class="text-[10px] font-mono uppercase tracking-wider text-sky-400 font-bold">Ringkasan Komunitas</span>
                            <span class="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1">
                                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Sistem Realtime
                            </span>
                        </div>
                        <h3 class="text-base font-black text-white leading-tight">MusifyStar Music Streaming Community</h3>
                        <p class="text-xs text-white/60 leading-relaxed">Seluruh pemutaran lagu dan durasi mendengarkan diperbarui secara langsung (real-time). Bersainglah di leaderboard dengan mendengarkan musik favoritmu!</p>
                    </div>

                    <!-- 4 Grid Stats Cards -->
                    <div class="grid grid-cols-2 gap-2.5">
                        <div class="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1">
                            <span class="text-[10px] text-white/50 uppercase tracking-wider font-mono">Pendengar Aktif</span>
                            <div class="flex items-baseline gap-1.5">
                                <span class="text-xl font-black text-emerald-400 font-mono">${liveCount}</span>
                                <span class="text-[10px] text-emerald-400/80 font-bold">Online</span>
                            </div>
                            <p class="text-[9.5px] text-white/40">Sedang memutar musik detik ini</p>
                        </div>

                        <div class="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1">
                            <span class="text-[10px] text-white/50 uppercase tracking-wider font-mono">Total Durasi</span>
                            <div class="flex items-baseline gap-1.5">
                                <span class="text-xl font-black text-amber-300 font-mono">${totalHours}</span>
                                <span class="text-[10px] text-amber-300/80 font-bold">Jam</span>
                            </div>
                            <p class="text-[9.5px] text-white/40">Waktu bersama menikmati musik</p>
                        </div>

                        <div class="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1">
                            <span class="text-[10px] text-white/50 uppercase tracking-wider font-mono">Total Pemutaran</span>
                            <div class="flex items-baseline gap-1.5">
                                <span class="text-xl font-black text-rose-400 font-mono">${totalPlays}</span>
                                <span class="text-[10px] text-rose-400/80 font-bold">Plays</span>
                            </div>
                            <p class="text-[9.5px] text-white/40">Lagu berhasil diputar</p>
                        </div>

                        <div class="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1">
                            <span class="text-[10px] text-white/50 uppercase tracking-wider font-mono">Anggota Terdaftar</span>
                            <div class="flex items-baseline gap-1.5">
                                <span class="text-xl font-black text-sky-400 font-mono">${totalMembers}</span>
                                <span class="text-[10px] text-sky-400/80 font-bold">Akun</span>
                            </div>
                            <p class="text-[9.5px] text-white/40">Bergabung di MusifyStar</p>
                        </div>
                    </div>

                    <!-- Perangkat Digunakan -->
                    <div class="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5">
                        <h4 class="text-xs font-bold text-white flex items-center gap-1.5">
                            <i data-lucide="smartphone" class="w-3.5 h-3.5 text-sky-400"></i> Platform & Perangkat Pendengar
                        </h4>
                        <div class="space-y-1.5 text-xs">
                            <div class="flex items-center justify-between text-white/70 text-[11px]">
                                <span>Aplikasi Android (APK)</span>
                                <span class="font-mono text-emerald-400 font-bold">${devices.android_apk || 0}</span>
                            </div>
                            <div class="flex items-center justify-between text-white/70 text-[11px]">
                                <span>PWA Chrome / Mobile Web</span>
                                <span class="font-mono text-amber-400 font-bold">${devices.pwa_chrome || 0}</span>
                            </div>
                            <div class="flex items-center justify-between text-white/70 text-[11px]">
                                <span>Desktop / Browser Web</span>
                                <span class="font-mono text-sky-400 font-bold">${devices.desktop_web || 0}</span>
                            </div>
                            <div class="flex items-center justify-between text-white/70 text-[11px]">
                                <span>Safari iOS</span>
                                <span class="font-mono text-purple-400 font-bold">${devices.safari_ios || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    };

    // Auto-listen to Real-time Profile, Border & User Changes across the app
    window.addEventListener('musifystar:user_profile_updated', function(e) {
        if (typeof GlobalStats !== 'undefined' && typeof GlobalStats.onUserProfileUpdated === 'function') {
            var u = (e && e.detail && e.detail.user) || (typeof Auth !== 'undefined' ? Auth.currentUser : null);
            if (u) GlobalStats.onUserProfileUpdated(u);
        }
    });

    window.addEventListener('musifystar:user_badge_updated', function(e) {
        if (typeof GlobalStats !== 'undefined' && typeof GlobalStats.onUserProfileUpdated === 'function') {
            var u = (e && e.detail && e.detail.user) || (typeof Auth !== 'undefined' ? Auth.currentUser : null);
            if (u) GlobalStats.onUserProfileUpdated(u);
        }
    });

    window.addEventListener('musifystar:user_border_updated', function(e) {
        if (typeof GlobalStats !== 'undefined' && typeof GlobalStats.onUserBorderChanged === 'function') {
            var d = (e && e.detail) || {};
            GlobalStats.onUserBorderChanged(d.borderUrl || '', d.borderName || '');
        }
    });

    window.addEventListener('storage', function(e) {
        if (e.key === 'musifystar_auth_user' && e.newValue) {
            try {
                var u = JSON.parse(e.newValue);
                if (typeof GlobalStats !== 'undefined' && typeof GlobalStats.onUserBorderChanged === 'function') {
                    GlobalStats.onUserBorderChanged(u.borderUrl || '', u.borderName || '');
                }
            } catch(err) {}
        }
    });

    window.GlobalStats = GlobalStats;
})();
