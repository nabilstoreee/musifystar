// ==========================================
// MUSIFYSTAR GLOBAL CHAT SYSTEM
// MusifyStar Cyber-Dark & Neon Cyan Music Aesthetic
// Integrated with Neon PostgreSQL Primary Database
// Strict Anti-DevTools & Anti-Tampering Security
// ==========================================

(function() {
    'use strict';

    // Anti-DevTools Console Warning Banner
    try {
        console.log(
            '%c[MUSIFYSTAR SECURITY PROTOCOL]%c\nSistem Chat Global terlindungi oleh enkripsi server & verifikasi PostgreSQL primer.\nPeringatan: Dilarang keras manipulasi token, penyalahgunaan console, atau inspeksi injeksi skrip (Self-XSS).',
            'background: #0f172a; color: #38bdf8; font-size: 14px; font-weight: bold; padding: 6px 10px; border-radius: 6px; border: 1px solid #0284c7;',
            'color: #f59e0b; font-size: 11px; font-weight: normal; margin-top: 4px;'
        );
    } catch (e) {}

    // Clean up any stale legacy device cache
    try { localStorage.removeItem('musifystar_sent_chat_ids'); } catch (e) {}

    var GlobalChat = {
        isOpen: false,
        pollInterval: null,
        lastMessageCount: 0,
        messages: [],
        isSending: false,

        // Verified Blue Checkmark + Admin Badge (Exclusively for jrnabil570@gmail.com)
        // Format: Admin first, blue checkmark right beside it on the right (Admin ✅)
        getAdminBlueCheckmarkHTML() {
            var checkmarkSvg = `
            <svg style="width: 12px; height: 12px;" class="shrink-0 inline-block align-middle ml-1" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="#0095F6"/>
                <path fill-rule="evenodd" clip-rule="evenodd" d="M16.707 8.293a1 1 0 0 1 0 1.414l-6 6a1 1 0 0 1-1.414 0l-3-3a1 1 0 1 1 1.414-1.414L10 13.586l5.293-5.293a1 1 0 0 1 1.414 0z" fill="#FFFFFF"/>
            </svg>`;

            return `
            <span class="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700/80 text-slate-200 text-[10px] font-semibold tracking-wide shadow-sm select-none" title="Admin Terverifikasi Resmi">
                <span>Admin</span>
                ${checkmarkSvg}
            </span>`;
        },

        // Helper: Resolve Current User Identity
        getCurrentUser() {
            var u = (typeof Auth !== 'undefined' && Auth.currentUser) ? Auth.currentUser : null;
            if (!u) {
                try {
                    var raw = localStorage.getItem('musifystar_auth_user') || sessionStorage.getItem('musifystar_auth_user');
                    if (raw) u = JSON.parse(raw);
                } catch (e) {}
            }

            // Only mark as Master Admin if user email is strictly jrnabil570@gmail.com
            if (u) {
                var email = (u.email || u.rawEmail || '').toLowerCase().trim();
                var uid = String(u.id || u.userId || '');
                if (email === 'jrnabil570@gmail.com' || uid === 'u_1790196636099_622dc736') {
                    u.isAdmin = true;
                    u.isVerifiedAdmin = true;
                    u.badge = 'Admin';
                    if (!u.username) u.username = 'MusifyStar Official';
                    if (!u.email) u.email = 'jrnabil570@gmail.com';
                } else {
                    u.isAdmin = false;
                    u.isVerifiedAdmin = false;
                    u.badge = 'Member';
                }
            }

            return u;
        },

        // Open Global Chat Modal (Requires Active Login)
        open() {
            var u = GlobalChat.getCurrentUser();
            if (!u) {
                if (typeof showToast === 'function') {
                    showToast('Silakan login terlebih dahulu untuk mengakses Chat Global.');
                }
                if (typeof Auth !== 'undefined' && typeof Auth.openModal === 'function') {
                    Auth.openModal();
                }
                return;
            }

            var existing = document.getElementById('musifystar-global-chat-modal');
            if (existing) existing.remove();

            GlobalChat.isOpen = true;

            var modal = document.createElement('div');
            modal.id = 'musifystar-global-chat-modal';
            modal.className = 'fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none';

            // Anti-DevTools & Anti-Inspection Protections on Chat Interface
            modal.oncontextmenu = function(e) {
                e.preventDefault();
                return false;
            };

            var handleKeyDown = function(e) {
                // Block F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U
                if (
                    e.key === 'F12' || 
                    (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) ||
                    (e.ctrlKey && (e.key === 'u' || e.key === 'U'))
                ) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
                if (e.key === 'Escape' && GlobalChat.isOpen) {
                    GlobalChat.close();
                }
            };
            modal.addEventListener('keydown', handleKeyDown);
            window.addEventListener('keydown', handleKeyDown);
            modal._cleanupKeyDown = handleKeyDown;

            var isMasterAdmin = (u.email || u.rawEmail || '').toLowerCase().trim() === 'jrnabil570@gmail.com';

            modal.innerHTML = `
            <div class="relative w-full max-w-xl h-[92vh] sm:h-[86vh] max-h-[760px] bg-[#0f1217] border border-slate-800/80 rounded-2xl sm:rounded-3xl flex flex-col shadow-2xl shadow-black/80 overflow-hidden">
                <!-- Chat Header (Sleek Dark Obsidian Theme) -->
                <div class="relative z-10 px-4 sm:px-6 py-3.5 bg-[#141720] border-b border-slate-800/80 flex items-center justify-between shrink-0 shadow-sm">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-300 shadow-inner shrink-0">
                            <i data-lucide="message-square" class="w-5 h-5 text-slate-300"></i>
                        </div>
                        <div>
                            <div class="flex items-center gap-2">
                                <h2 class="text-sm sm:text-base font-bold text-slate-100 tracking-tight">Chat Global MusifyStar</h2>
                                <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[9px] font-semibold">
                                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                    <span>LIVE</span>
                                </span>
                            </div>
                            <p class="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                <i data-lucide="shield-check" class="w-3 h-3 text-slate-400"></i>
                                <span>Ruang Obrolan Komunitas Musik &bull; Terenkripsi</span>
                            </p>
                        </div>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <button onclick="GlobalChat.fetchMessages(false)" class="w-8 h-8 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/50 active:scale-95 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer" title="Segarkan Chat">
                            <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                        </button>
                        <button onclick="GlobalChat.close()" class="w-8 h-8 rounded-xl bg-slate-800/60 hover:bg-rose-500/20 hover:border-rose-500/40 border border-slate-700/50 active:scale-95 flex items-center justify-center text-slate-300 hover:text-rose-400 transition-all cursor-pointer" title="Tutup Chat">
                            <i data-lucide="x" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>

                <!-- Chat Messages Stream (Deep Dark Background, Eye-Friendly) -->
                <div id="global-chat-stream" class="relative z-10 flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 hide-scrollbar bg-[#0c0e14]">
                    <div id="global-chat-loading" class="text-center py-20 text-slate-500 space-y-2">
                        <i data-lucide="loader-2" class="w-6 h-6 animate-spin mx-auto text-slate-400"></i>
                        <p class="text-xs font-medium">Memuat pesan obrolan...</p>
                    </div>
                </div>

                <!-- Chat Input Bottom Bar -->
                <div id="global-chat-bottom-bar" class="relative z-10 px-3.5 sm:px-5 py-3 bg-[#141720] border-t border-slate-800/80 shrink-0">
                    ${GlobalChat.renderBottomBar(u, isMasterAdmin)}
                </div>
            </div>`;

            // Click outside backdrop closes modal
            modal.onclick = function(e) {
                if (e.target === modal) {
                    GlobalChat.close();
                }
            };

            document.body.appendChild(modal);
            if (window.lucide) lucide.createIcons();

            // Fetch initial messages immediately
            GlobalChat.fetchMessages(false);

            // Start auto-poll every 2.5 seconds while open
            if (GlobalChat.pollInterval) clearInterval(GlobalChat.pollInterval);
            GlobalChat.pollInterval = setInterval(function() {
                if (GlobalChat.isOpen && document.getElementById('musifystar-global-chat-modal')) {
                    GlobalChat.fetchMessages(true);
                } else {
                    GlobalChat.close();
                }
            }, 2500);

            // Hide unread badge on header
            var badge = document.getElementById('global-chat-badge');
            if (badge) badge.classList.add('hidden');
        },

        // Close Global Chat Modal
        close() {
            GlobalChat.isOpen = false;
            if (GlobalChat.pollInterval) {
                clearInterval(GlobalChat.pollInterval);
                GlobalChat.pollInterval = null;
            }
            var modal = document.getElementById('musifystar-global-chat-modal');
            if (modal) {
                if (modal._cleanupKeyDown) {
                    window.removeEventListener('keydown', modal._cleanupKeyDown);
                }
                modal.remove();
            }
        },

        // Render Badges Sequence for Chat Messages & Inputs
        // Order: [Admin Checkmark (Admin Only)] [VIP Badge (If VIP Active)] [Rank Badge (Equipped / Elite)] [Border/Immortal Badge]
        getUserBadgesHTML(opts) {
            if (!opts) opts = {};
            var isAdmin = !!opts.isAdmin;
            var isVip = !!opts.isVip;
            var borderName = opts.borderName || '';
            var borderUrl = opts.borderUrl || '';
            var equippedBadge = opts.equippedBadge !== undefined ? opts.equippedBadge : '';
            var equippedBadgeTitle = opts.equippedBadgeTitle !== undefined ? opts.equippedBadgeTitle : '';
            var equippedBadgeIcon = opts.equippedBadgeIcon !== undefined ? opts.equippedBadgeIcon : '';
            var equippedBadgeColor = opts.equippedBadgeColor !== undefined ? opts.equippedBadgeColor : '';

            var badges = [];

            // 1. Admin + Centang Biru Badge (Hanya Admin)
            if (isAdmin) {
                badges.push(GlobalChat.getAdminBlueCheckmarkHTML());
            }

            // 2. Logo VIP (Hanya jika VIP Aktif)
            if (isVip) {
                if (typeof Auth !== 'undefined' && typeof Auth.getVipBadgeHTML === 'function') {
                    badges.push(Auth.getVipBadgeHTML('text-[8.5px] px-1.5 py-0.2'));
                } else {
                    badges.push(`
                    <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-black font-extrabold text-[8.5px] shadow-[0_0_8px_rgba(245,158,11,0.35)] border border-amber-300/60 select-none shrink-0 align-middle">
                        <svg class="w-2.5 h-2.5 shrink-0 fill-black text-black" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.3 8.87l5.378-2.689a.5.5 0 0 1 .7.574l-2.002 11.01a1 1 0 0 1-.985.821H5.609a1 1 0 0 1-.985-.821L2.622 6.755a.5.5 0 0 1 .7-.574l5.378 2.689z"/></svg>
                        <span>VIP</span>
                    </span>`);
                }
            }

            // 3. Logo Rank Badge Custom yang Dipasang (atau Fallback Elite)
            if (equippedBadge !== 'badge_none') {
                if (typeof Auth !== 'undefined' && typeof Auth.getRankBadgePillHTML === 'function') {
                    if (equippedBadgeTitle || equippedBadge) {
                        badges.push(Auth.getRankBadgePillHTML(equippedBadge, equippedBadgeTitle, equippedBadgeIcon, equippedBadgeColor));
                    } else {
                        badges.push(Auth.getRankBadgePillHTML('badge_elite', 'Elite'));
                    }
                } else {
                    var displayTitle = equippedBadgeTitle || 'Elite';
                    var displayIcon = equippedBadgeIcon || '⚡';
                    var displayColor = equippedBadgeColor || '#a855f7';
                    badges.push(`
                    <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8.5px] leading-none font-black border shadow-sm select-none shrink-0 align-middle" style="background: rgba(18, 20, 28, 0.95); border-color: ${displayColor}; color: ${displayColor}; box-shadow: 0 0 8px ${displayColor}33;">
                        <span>${displayIcon}</span>
                        <span>${displayTitle}</span>
                    </span>`);
                }
            }

            // 4. Logo Border Frame / Custom Rank Badge (misal Immortal, Legend, Master, Platinum, dsb)
            if (borderName && borderName !== 'none' && borderName !== 'Tanpa Border') {
                var borderPill = GlobalChat.getBorderBadgeHTML(borderName, borderUrl, false);
                if (borderPill) badges.push(borderPill);
            }

            return badges.join(' ');
        },

        // Render Bottom Bar
        renderBottomBar(user, isMasterAdmin) {
            var username = (user && user.username) ? user.username : (isMasterAdmin ? 'MusifyStar Official' : 'Musisi');

            var isVipExpired = user ? (user.vipExpiresAt && Date.now() > user.vipExpiresAt) : false;
            var userIsVip = isMasterAdmin || (user && Boolean(user.isPremium || user.is_premium) && user.vipTier !== 'none' && !isVipExpired);
            var userBorderName = (typeof Auth !== 'undefined' && Auth.getBorderName && user) ? Auth.getBorderName(user) : (user ? (user.borderName || '') : '');
            var userBorderUrl = (typeof Auth !== 'undefined' && Auth.getBorderUrl && user) ? Auth.getBorderUrl(user) : (user ? (user.borderUrl || '') : '');

            var senderBadgesHTML = GlobalChat.getUserBadgesHTML({
                isAdmin: isMasterAdmin,
                isVip: userIsVip,
                borderName: userBorderName,
                borderUrl: userBorderUrl,
                equippedBadge: user ? (user.equippedBadge || '') : '',
                equippedBadgeTitle: user ? (user.equippedBadgeTitle || '') : '',
                equippedBadgeIcon: user ? (user.equippedBadgeIcon || '') : '',
                equippedBadgeColor: user ? (user.equippedBadgeColor || '') : ''
            });

            return `
            <div class="space-y-1.5">
                <div class="flex items-center justify-between text-[11px] text-slate-400 px-1 select-none">
                    <span class="flex items-center gap-1.5 truncate flex-wrap">
                        <span class="text-slate-400">Mengirim sebagai:</span>
                        <b class="text-slate-200 font-semibold truncate">${GlobalChat.escapeHtml(username)}</b>
                        ${senderBadgesHTML}
                    </span>
                    <span id="global-chat-char-count" class="font-mono text-[10px] text-slate-500">0/500</span>
                </div>
                <form onsubmit="event.preventDefault(); GlobalChat.sendMessage();" class="flex items-center gap-2">
                    <div class="relative flex-1">
                        <input 
                            type="text" 
                            id="global-chat-input" 
                            maxlength="500" 
                            autocomplete="off"
                            placeholder="Tulis pesan ke komunitas MusifyStar..." 
                            oninput="GlobalChat.updateCharCount(this)"
                            class="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-[#1a1f29] border border-slate-700/80 focus:border-slate-500 text-slate-100 placeholder-slate-500 text-xs sm:text-sm font-sans focus:outline-none focus:ring-1 focus:ring-slate-500/20 transition-all shadow-inner"
                        />
                    </div>
                    <button 
                        type="submit" 
                        id="global-chat-send-btn" 
                        class="w-11 h-11 rounded-xl bg-slate-700 hover:bg-slate-600 active:scale-95 text-white flex items-center justify-center shrink-0 shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                        title="Kirim pesan"
                    >
                        <i data-lucide="send" class="w-4 h-4 text-white"></i>
                    </button>
                </form>
            </div>`;
        },

        updateCharCount(el) {
            var counter = document.getElementById('global-chat-char-count');
            if (counter && el) {
                var len = el.value.length;
                counter.innerText = len + '/500';
                if (len >= 480) {
                    counter.className = 'font-mono text-[10px] text-rose-400 font-bold';
                } else {
                    counter.className = 'font-mono text-[10px] text-white/40';
                }
            }
        },

        // Fetch Messages from Primary Neon PostgreSQL Database
        async fetchMessages(isBackground) {
            try {
                var headers = {};
                var u = GlobalChat.getCurrentUser();
                var isMasterAdmin = u && ((u.email || u.rawEmail || '').toLowerCase().trim() === 'jrnabil570@gmail.com');
                
                if (isMasterAdmin) {
                    var adminToken = (typeof Profile !== 'undefined' && typeof Profile.getAdminToken === 'function') 
                        ? Profile.getAdminToken() 
                        : (sessionStorage.getItem('musifystar_admin_token') || localStorage.getItem('musifystar_admin_token') || '');
                    if (adminToken) headers['x-admin-token'] = adminToken;
                }

                var userToken = (typeof Auth !== 'undefined' && Auth.token) ? Auth.token : (localStorage.getItem('musifystar_auth_token') || '');
                if (userToken) {
                    headers['Authorization'] = 'Bearer ' + userToken;
                }

                var res = await fetch('/api/global-chat?t=' + Date.now(), {
                    headers: headers,
                    cache: 'no-store'
                });
                var data = await res.json();

                if (data && data.status && Array.isArray(data.messages)) {
                    var isNewMessage = data.messages.length > GlobalChat.lastMessageCount;
                    GlobalChat.messages = data.messages;
                    GlobalChat.lastMessageCount = data.messages.length;

                    GlobalChat.renderMessagesList(data.messages, isBackground ? isNewMessage : true);
                }
            } catch (e) {
                if (!isBackground) {
                    var stream = document.getElementById('global-chat-stream');
                    if (stream) {
                        stream.innerHTML = `
                        <div class="text-center py-20 text-rose-400 space-y-2">
                            <i data-lucide="alert-triangle" class="w-8 h-8 mx-auto"></i>
                            <p class="text-xs font-semibold">Gagal memuat pesan: ${GlobalChat.escapeHtml(e.message)}</p>
                            <button onclick="GlobalChat.fetchMessages(false)" class="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer">Coba Lagi</button>
                        </div>`;
                        if (window.lucide) lucide.createIcons();
                    }
                }
            }
        },

        // Render Messages in Stream (Strict Per-User Ownership)
        renderMessagesList(msgs, shouldScroll) {
            var stream = document.getElementById('global-chat-stream');
            if (!stream) return;

            if (msgs.length === 0) {
                stream.innerHTML = `
                <div class="text-center py-24 text-white/40 space-y-3">
                    <div class="w-14 h-14 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
                        <i data-lucide="message-square" class="w-7 h-7"></i>
                    </div>
                    <div>
                        <p class="text-sm font-bold text-white">Belum Ada Pesan</p>
                        <p class="text-xs text-white/50">Jadilah yang pertama menyapa komunitas musik MusifyStar!</p>
                    </div>
                </div>`;
                if (window.lucide) lucide.createIcons();
                return;
            }

            var u = GlobalChat.getCurrentUser();
            if (!u) return;

            var myId = String(u.id || u.userId || '');
            var myName = String(u.username || '').toLowerCase().trim();
            var myEmail = String(u.email || u.rawEmail || '').toLowerCase().trim();
            var isMasterAdmin = (myEmail === 'jrnabil570@gmail.com');

            var dateDivider = `
            <div class="flex justify-center my-3 select-none">
                <span class="px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700/40 text-[10px] text-slate-400 font-sans tracking-wide">
                    Ruang Chat Global MusifyStar
                </span>
            </div>`;

            var messagesHtml = msgs.map(function(m) {
                var msgUserId = String(m.userId || '');
                var msgUsername = String(m.username || '').toLowerCase().trim();
                var msgEmail = String(m.email || '').toLowerCase().trim();

                // STRICT ACCOUNT OWNERSHIP:
                // A message is 'isMe' IF AND ONLY IF it was created by the currently logged-in account
                var isMe = false;
                if (myId && msgUserId && msgUserId === myId) {
                    isMe = true;
                } else if (isMasterAdmin && (msgUserId === 'u_1790196636099_622dc736' || msgUserId === 'admin_1' || msgEmail === 'jrnabil570@gmail.com')) {
                    isMe = true;
                } else if (myEmail && msgEmail && msgEmail === myEmail) {
                    isMe = true;
                } else if (myName && msgUsername && msgUsername === myName) {
                    isMe = true;
                } else if (m.clientTempId && m.optimisticAuthorId === myId) {
                    isMe = true;
                }

                // Admin Centang Biru Detection:
                // Strictly true if email is jrnabil570@gmail.com, or user_id is u_1790196636099_622dc736, or flagged as verified admin
                var isMsgAdmin = !!m.isVerifiedAdmin || !!m.isAdmin || (msgEmail === 'jrnabil570@gmail.com') || (msgUserId === 'u_1790196636099_622dc736') || (msgUserId === 'admin_1') || (m.badge === 'Admin' && (m.username === 'nabil' || m.username === 'MusifyStar Official' || msgUserId === 'u_1790196636099_622dc736'));
                var displayUsername = (isMe && u && u.username) ? u.username : (m.username || (isMsgAdmin ? 'MusifyStar Official' : 'Musisi'));
                var avatarColor = isMsgAdmin ? 'from-slate-700 to-slate-900 border border-slate-600/60' : (m.avatarColor || 'from-slate-700 to-slate-800');
                var initial = isMsgAdmin ? 'M' : (displayUsername.charAt(0).toUpperCase());
                var timeStr = GlobalChat.formatTime(m.createdAt);

                // Resolve avatar and border (if isMe, also fall back to current logged in user state)
                var userAvatar = m.avatar || m.avatar_url || (isMe ? (u.avatar || '') : '');
                var userBorderUrl = m.borderUrl || m.border_url || (isMe ? ((typeof Auth !== 'undefined' && Auth.getBorderUrl) ? Auth.getBorderUrl(u) : (u.borderUrl || '')) : '');
                var userBorderName = m.borderName || m.border_name || (isMe ? ((typeof Auth !== 'undefined' && Auth.getBorderName) ? Auth.getBorderName(u) : (u.borderName || '')) : '');
                if (!userBorderName && userBorderUrl) {
                    var bLow = userBorderUrl.toLowerCase();
                    if (bLow.includes('immortal') || bLow.includes('imortal')) userBorderName = 'Immortal';
                    else if (bLow.includes('legend')) userBorderName = 'Legend';
                    else if (bLow.includes('master')) userBorderName = 'Master';
                    else if (bLow.includes('platinum')) userBorderName = 'Platinum';
                    else userBorderName = 'VIP';
                }
                var userIsVip = !!m.isVip || !!m.is_vip || isMsgAdmin || (isMe && (!!u.isPremium || !!u.is_premium));
                var userVipTier = m.vipTier || m.vip_tier || (isMe ? (u.vipTier || '') : '');
                var userVipExpires = m.vipExpiresAt || m.vip_expires_at || (isMe ? (u.vipExpiresAt || 0) : 0);

                var eqBadge = isMe ? (u.equippedBadge !== undefined ? u.equippedBadge : (m.equippedBadge || '')) : (m.equippedBadge || '');
                var eqTitle = isMe ? (u.equippedBadgeTitle !== undefined ? u.equippedBadgeTitle : (m.equippedBadgeTitle || '')) : (m.equippedBadgeTitle || '');
                var eqIcon = isMe ? (u.equippedBadgeIcon !== undefined ? u.equippedBadgeIcon : (m.equippedBadgeIcon || '')) : (m.equippedBadgeIcon || '');
                var eqColor = isMe ? (u.equippedBadgeColor !== undefined ? u.equippedBadgeColor : (m.equippedBadgeColor || '')) : (m.equippedBadgeColor || '');

                // Resolve Badges Sequence: [Admin Checkmark (Admin Only)] [VIP Badge (If VIP Active)] [Rank Badge] [Border/Immortal Badge]
                var userBadgesHtml = GlobalChat.getUserBadgesHTML({
                    isAdmin: isMsgAdmin,
                    isVip: userIsVip,
                    borderName: userBorderName,
                    borderUrl: userBorderUrl,
                    equippedBadge: eqBadge,
                    equippedBadgeTitle: eqTitle,
                    equippedBadgeIcon: eqIcon,
                    equippedBadgeColor: eqColor
                });

                // Avatar with border element
                var avatarHtml = GlobalChat.renderAvatarWithBorder({
                    userId: msgUserId,
                    username: displayUsername,
                    avatar: userAvatar,
                    avatarColor: avatarColor,
                    initial: initial,
                    borderUrl: userBorderUrl,
                    borderName: userBorderName,
                    isAdmin: isMsgAdmin,
                    isVip: userIsVip,
                    vipTier: userVipTier,
                    vipExpiresAt: userVipExpires
                });

                // Delete option: Master Admin can delete ANY message, or user can delete their own message
                var deleteBtn = (isMasterAdmin || isMe) ? `
                <button type="button" onclick="GlobalChat.deleteMessage(event, '${m.id}')" class="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-rose-400 active:scale-90 transition-all cursor-pointer inline-flex items-center justify-center shrink-0" title="Hapus pesan ini">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                </button>` : '';

                var openProfileJs = `GlobalChat.showUserProfileModal('${GlobalChat.escapeJs(msgUserId)}', '${GlobalChat.escapeJs(displayUsername)}', '${GlobalChat.escapeJs(userAvatar)}', '${GlobalChat.escapeJs(userBorderUrl)}', '${GlobalChat.escapeJs(userBorderName)}', ${!!isMsgAdmin}, ${!!userIsVip}, '${GlobalChat.escapeJs(userVipTier)}', ${userVipExpires || 0})`;

                // ==========================================
                // 1. PESAN SAYA (AKUN INI SENDIRI: DI KANAN DENGAN AVATAR & BORDER)
                // ==========================================
                if (isMe) {
                    var statusSending = m.isSending ? `
                        <span class="inline-flex text-slate-400" title="Mengirim...">
                            <i data-lucide="loader-2" class="w-3 h-3 animate-spin"></i>
                        </span>
                    ` : '';

                    return `
                    <div class="flex justify-end items-end gap-3.5 sm:gap-4 w-full group my-3 sm:my-3.5 pl-6 sm:pl-14">
                        <!-- Dark Obsidian Outgoing Bubble -->
                        <div class="relative max-w-[85%] sm:max-w-[75%] bg-[#222834] border border-slate-700/70 text-slate-100 rounded-2xl px-4 py-2.5 shadow-md shadow-black/40">
                            <!-- Header Nama & Border Badge (Clickable to view own profile preview) -->
                            <div class="flex items-center justify-between gap-2 mb-1.5 select-none cursor-pointer" onclick="${openProfileJs}" title="Klik untuk lihat tampilan profil & border Anda">
                                <span class="text-xs font-semibold text-slate-200 hover:text-white transition-colors tracking-tight truncate max-w-[130px] sm:max-w-[170px]">${GlobalChat.escapeHtml(displayUsername)}</span>
                                <div class="flex items-center gap-1 shrink-0 flex-nowrap overflow-x-auto hide-scrollbar">
                                    ${userBadgesHtml}
                                </div>
                            </div>

                            <!-- Message text -->
                            <p class="text-[13px] sm:text-[14px] leading-relaxed select-text break-words whitespace-pre-wrap font-sans text-slate-100 font-normal">${GlobalChat.escapeHtml(m.message)}</p>
                            
                            <!-- Meta Time & Delete Action -->
                            <div class="flex items-center justify-end gap-2 mt-1 select-none">
                                ${deleteBtn}
                                <span class="text-[10px] text-slate-400 font-mono">${timeStr}</span>
                                ${statusSending}
                            </div>
                        </div>

                        <!-- Avatar Saya dengan Border Frame Eksklusif (Berjarak Aman & Elegan) -->
                        <div class="shrink-0 mb-0.5 ${userBorderUrl ? 'ml-1 sm:ml-1.5' : ''}">
                            ${avatarHtml}
                        </div>
                    </div>`;
                }

                // ==========================================
                // 2. PESAN ORANG LAIN (DI KIRI DENGAN AVATAR & BORDER)
                // ==========================================
                return `
                <div class="flex justify-start items-start gap-3.5 sm:gap-4 w-full group my-3 sm:my-3.5 pr-6 sm:pr-14">
                    <!-- Avatar Pengirim dengan Border Frame Eksklusif (Berjarak Aman & Elegan) -->
                    <div class="shrink-0 mt-0.5 ${userBorderUrl ? 'mr-1 sm:mr-1.5' : ''}">
                        ${avatarHtml}
                    </div>

                    <!-- Dark Obsidian Incoming Bubble -->
                    <div class="relative max-w-[85%] sm:max-w-[75%] bg-[#161a22] border border-slate-800 text-slate-200 rounded-2xl px-4 py-2.5 shadow-md shadow-black/40">
                        <!-- Header Nama Pengirim & Admin Centang Biru & Border Badge -->
                        <div class="flex items-center justify-between gap-2 mb-1.5 select-none cursor-pointer" onclick="${openProfileJs}" title="Klik untuk lihat profil & border ${GlobalChat.escapeHtml(displayUsername)}">
                            <span class="text-xs font-semibold text-slate-200 hover:text-amber-300 transition-colors tracking-tight truncate max-w-[130px] sm:max-w-[170px]">${GlobalChat.escapeHtml(displayUsername)}</span>
                            <div class="flex items-center gap-1 shrink-0 flex-nowrap overflow-x-auto hide-scrollbar">
                                ${userBadgesHtml}
                            </div>
                        </div>

                        <!-- Isi Pesan -->
                        <p class="text-[13px] sm:text-[14px] leading-relaxed select-text break-words whitespace-pre-wrap font-sans text-slate-200 font-normal">${GlobalChat.escapeHtml(m.message)}</p>

                        <!-- Meta Waktu & Delete Button -->
                        <div class="flex items-center justify-end gap-2 mt-1 select-none">
                            ${deleteBtn}
                            <span class="text-[10px] text-slate-500 font-mono">${timeStr}</span>
                        </div>
                    </div>
                </div>`;
            }).join('');

            stream.innerHTML = dateDivider + messagesHtml;
            if (window.lucide) lucide.createIcons();

            if (shouldScroll) {
                GlobalChat.scrollToBottom();
            }
        },

        scrollToBottom() {
            var stream = document.getElementById('global-chat-stream');
            if (stream) {
                setTimeout(function() {
                    stream.scrollTop = stream.scrollHeight;
                }, 50);
            }
        },

        // Send Message
        async sendMessage() {
            var input = document.getElementById('global-chat-input');
            if (!input) return;

            var text = input.value.trim();
            if (!text) return;

            var u = GlobalChat.getCurrentUser();
            var token = (typeof Auth !== 'undefined' && Auth.token) ? Auth.token : (localStorage.getItem('musifystar_auth_token') || '');

            if (!u || !token) {
                if (typeof showToast === 'function') {
                    showToast('Silakan login terlebih dahulu untuk mengirim pesan.');
                }
                GlobalChat.close();
                if (typeof Auth !== 'undefined') Auth.openModal();
                return;
            }

            var btn = document.getElementById('global-chat-send-btn');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin text-white"></i>';
                if (window.lucide) lucide.createIcons();
            }

            var myId = String(u.id || u.userId || '');
            var myEmail = (u.email || u.rawEmail || '').toLowerCase().trim();
            var isMasterAdmin = (myEmail === 'jrnabil570@gmail.com' || myId === 'u_1790196636099_622dc736');
            var myUsername = u.username || (isMasterAdmin ? 'MusifyStar Official' : 'Musisi');

            // Only pass admin token if user is actually Master Admin
            var adminToken = '';
            if (isMasterAdmin) {
                adminToken = (typeof Profile !== 'undefined' && typeof Profile.getAdminToken === 'function') 
                    ? Profile.getAdminToken() 
                    : (sessionStorage.getItem('musifystar_admin_token') || localStorage.getItem('musifystar_admin_token') || '');
            }

            // OPTIMISTIC UPDATE: Message immediately appears on the RIGHT with sending status
            var tempId = 'temp_' + Date.now();
            var myBorderUrl = (typeof Auth !== 'undefined' && Auth.getBorderUrl) ? Auth.getBorderUrl(u) : (u.borderUrl || '');
            var myBorderName = (typeof Auth !== 'undefined' && Auth.getBorderName) ? Auth.getBorderName(u) : (u.borderName || '');
            var myIsVip = isMasterAdmin || !!u.isPremium || !!u.is_premium;
            var myVipTier = isMasterAdmin ? 'permanent' : (u.vipTier || (myIsVip ? 'permanent' : 'none'));
            var myVipExpires = u.vipExpiresAt || 0;

            var optimisticMessage = {
                id: tempId,
                clientTempId: tempId,
                optimisticAuthorId: myId,
                userId: myId,
                username: myUsername,
                avatar: u.avatar || '',
                borderUrl: myBorderUrl,
                borderName: myBorderName,
                isVip: myIsVip,
                vipTier: myVipTier,
                vipExpiresAt: myVipExpires,
                equippedBadge: u.equippedBadge || '',
                equippedBadgeTitle: u.equippedBadgeTitle || '',
                equippedBadgeIcon: u.equippedBadgeIcon || '',
                equippedBadgeColor: u.equippedBadgeColor || '',
                message: text,
                badge: isMasterAdmin ? 'Admin' : 'Member',
                isAdmin: isMasterAdmin,
                isVerifiedAdmin: isMasterAdmin,
                avatarColor: isMasterAdmin ? 'from-slate-700 to-slate-900 border border-slate-600/60' : 'from-slate-700 to-slate-800',
                createdAt: new Date().toISOString(),
                isSending: true
            };

            GlobalChat.messages.push(optimisticMessage);
            input.value = '';
            GlobalChat.updateCharCount(input);
            GlobalChat.renderMessagesList(GlobalChat.messages, true);

            try {
                var headers = {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token,
                    'X-Auth-Token': token,
                    'X-User-Id': myId,
                    'X-User-Name': myUsername,
                    'X-User-Email': myEmail
                };
                if (adminToken) {
                    headers['X-Admin-Token'] = adminToken;
                }

                var res = await fetch('/api/global-chat', {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify({
                        message: text,
                        clientTempId: tempId
                    })
                });

                var data = await res.json();
                if (data && data.status && data.chat) {
                    // Replace optimistic message with confirmed database record
                    var idx = GlobalChat.messages.findIndex(function(m) {
                        return m.clientTempId === tempId || String(m.id) === String(tempId);
                    });
                    if (idx !== -1) {
                        GlobalChat.messages[idx] = data.chat;
                    } else {
                        GlobalChat.messages.push(data.chat);
                    }
                    GlobalChat.renderMessagesList(GlobalChat.messages, true);
                    GlobalChat.fetchMessages(true);
                } else {
                    // Revert optimistic message if server failed
                    GlobalChat.messages = GlobalChat.messages.filter(function(m) { return m.clientTempId !== tempId; });
                    GlobalChat.renderMessagesList(GlobalChat.messages, false);
                    input.value = text;
                    GlobalChat.updateCharCount(input);
                    if (typeof showToast === 'function') {
                        showToast(data.message || 'Gagal mengirim pesan');
                    }
                }
            } catch (e) {
                GlobalChat.messages = GlobalChat.messages.filter(function(m) { return m.clientTempId !== tempId; });
                GlobalChat.renderMessagesList(GlobalChat.messages, false);
                input.value = text;
                GlobalChat.updateCharCount(input);
                if (typeof showToast === 'function') {
                    showToast('Gagal mengirim: ' + e.message);
                }
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = '<i data-lucide="send" class="w-4 h-4 sm:w-5 sm:h-5 text-white"></i>';
                    if (window.lucide) lucide.createIcons();
                }
            }
        },

        // Delete message (Admin or author) - Fast & Reliable Execution
        async deleteMessage(event, id) {
            if (event) {
                try {
                    event.stopPropagation();
                    event.preventDefault();
                } catch (e) {}
            }
            if (!id) return;

            var u = GlobalChat.getCurrentUser();
            var myEmail = u ? (u.email || u.rawEmail || '').toLowerCase().trim() : '';
            var myId = u ? String(u.id || u.userId || '') : '';
            var myUsername = u ? (u.username || '') : '';
            var isMasterAdmin = (myEmail === 'jrnabil570@gmail.com' || myId === 'u_1790196636099_622dc736');

            var adminToken = '';
            if (isMasterAdmin) {
                adminToken = (typeof Profile !== 'undefined' && typeof Profile.getAdminToken === 'function') 
                    ? Profile.getAdminToken() 
                    : (sessionStorage.getItem('musifystar_admin_token') || localStorage.getItem('musifystar_admin_token') || '');
            }

            var userToken = (typeof Auth !== 'undefined' && Auth.token) 
                ? Auth.token 
                : (localStorage.getItem('musifystar_auth_token') || sessionStorage.getItem('musifystar_auth_token') || '');

            var headers = {
                'X-User-Id': myId,
                'X-User-Email': myEmail,
                'X-User-Name': myUsername
            };
            if (userToken) {
                headers['Authorization'] = 'Bearer ' + userToken;
                headers['X-Auth-Token'] = userToken;
            }
            if (adminToken) {
                headers['x-admin-token'] = adminToken;
            }

            // Optimistic UI removal for instantaneous responsiveness
            var removedMsg = GlobalChat.messages.find(function(m) { return String(m.id) === String(id); });
            GlobalChat.messages = GlobalChat.messages.filter(function(m) { return String(m.id) !== String(id); });
            GlobalChat.renderMessagesList(GlobalChat.messages, false);

            try {
                var res = await fetch('/api/global-chat?id=' + encodeURIComponent(id), {
                    method: 'DELETE',
                    headers: headers
                });
                var data = await res.json();
                if (data && data.status) {
                    if (typeof showToast === 'function') {
                        showToast('Pesan berhasil dihapus.');
                    }
                    GlobalChat.fetchMessages(true);
                } else {
                    // Revert if rejected by server
                    if (removedMsg) {
                        GlobalChat.messages.push(removedMsg);
                        GlobalChat.renderMessagesList(GlobalChat.messages, false);
                    }
                    if (typeof showToast === 'function') {
                        showToast(data.message || 'Gagal menghapus pesan');
                    }
                }
            } catch (e) {
                if (removedMsg) {
                    GlobalChat.messages.push(removedMsg);
                    GlobalChat.renderMessagesList(GlobalChat.messages, false);
                }
                if (typeof showToast === 'function') {
                    showToast('Terjadi kesalahan saat menghapus pesan');
                }
            }
        },

        formatTime(dateStr) {
            if (!dateStr) return '';
            try {
                var d = new Date(dateStr);
                var hours = String(d.getHours()).padStart(2, '0');
                var minutes = String(d.getMinutes()).padStart(2, '0');
                return hours + ':' + minutes;
            } catch (e) {
                return '';
            }
        },

        escapeHtml(str) {
            if (!str) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        },

        escapeJs(t) {
            if (!t) return '';
            return String(t).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, ' ').replace(/\r/g, '');
        },

        renderAvatarWithBorder(data) {
            var avatar = data.avatar || '';
            var borderUrl = data.borderUrl || '';
            var initial = data.initial || 'M';
            var avatarColor = data.avatarColor || 'from-slate-700 to-slate-800';
            var username = data.username || 'Musisi';
            var hasBorder = !!borderUrl;

            // When user has an equipped border, provide a dedicated 44px container footprint
            // so border flourishes, horns, wings, or dragons do not invade or collide with chat bubbles.
            var containerSize = hasBorder ? 44 : 34;
            var innerCircleSize = hasBorder ? 30 : 34;
            var frameSize = 52;

            var borderImg = hasBorder ? `
                <img src="${borderUrl}" 
                     class="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-none object-contain z-10 select-none drop-shadow-[0_0_8px_rgba(245,158,11,0.55)]" 
                     style="width: ${frameSize}px; height: ${frameSize}px;"
                     alt="Border">
            ` : '';

            var innerImg = avatar ? `
                <img src="${avatar}" 
                     class="w-full h-full rounded-full object-cover z-0" 
                     onerror="this.onerror=null; this.src='/logo.png';" 
                     alt="${GlobalChat.escapeHtml(username)}">
            ` : `
                <div class="w-full h-full rounded-full bg-gradient-to-tr ${avatarColor} flex items-center justify-center text-white font-black text-xs z-0 shadow-inner">
                    ${initial}
                </div>
            `;

            var clickAction = `GlobalChat.showUserProfileModal('${GlobalChat.escapeJs(data.userId || '')}', '${GlobalChat.escapeJs(username)}', '${GlobalChat.escapeJs(avatar)}', '${GlobalChat.escapeJs(borderUrl)}', '${GlobalChat.escapeJs(data.borderName || '')}', ${!!data.isAdmin}, ${!!data.isVip}, '${GlobalChat.escapeJs(data.vipTier || '')}', ${data.vipExpiresAt || 0})`;

            return `
            <div class="relative shrink-0 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-transform select-none" 
                 style="width: ${containerSize}px; height: ${containerSize}px;" 
                 onclick="${clickAction}" 
                 title="Lihat Profil & Border ${GlobalChat.escapeHtml(username)}">
                <div class="rounded-full overflow-hidden flex items-center justify-center shadow-md relative z-0 ring-1 ring-white/10"
                     style="width: ${innerCircleSize}px; height: ${innerCircleSize}px;">
                    ${innerImg}
                </div>
                ${borderImg}
            </div>
            `;
        },

        getBorderBadgeHTML(borderName, borderUrl, isVip) {
            if (borderName && borderName !== 'none' && borderName !== 'Tanpa Border') {
                var bLower = borderName.toLowerCase();
                var badgeClass = 'bg-amber-400/15 border-amber-400/30 text-amber-300';
                var icon = 'shield';
                if (bLower.includes('platinum')) {
                    badgeClass = 'bg-cyan-500/15 border-cyan-400/30 text-cyan-300';
                } else if (bLower.includes('master')) {
                    badgeClass = 'bg-orange-500/15 border-orange-400/30 text-orange-300';
                } else if (bLower.includes('legend')) {
                    badgeClass = 'bg-yellow-500/15 border-yellow-400/30 text-yellow-300';
                } else if (bLower.includes('immortal') || bLower.includes('imortal')) {
                    badgeClass = 'bg-pink-500/15 border-pink-400/30 text-pink-300';
                }
                return `
                <span class="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full border text-[9px] font-bold ${badgeClass} shadow-sm select-none" title="Border Frame: ${GlobalChat.escapeHtml(borderName)}">
                    <i data-lucide="${icon}" class="w-2.5 h-2.5"></i>
                    <span>${GlobalChat.escapeHtml(borderName)}</span>
                </span>`;
            } else if (isVip) {
                return (typeof Auth !== 'undefined' && Auth.getVipBadgeHTML) ? Auth.getVipBadgeHTML('text-[8.5px] px-1.5 py-0.2') : `
                <span class="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-black font-extrabold text-[8.5px] shadow-[0_0_8px_rgba(245,158,11,0.4)] border border-amber-300/50 select-none">
                    <svg class="w-2.5 h-2.5 shrink-0 fill-black text-black" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.3 8.87l5.378-2.689a.5.5 0 0 1 .7.574l-2.002 11.01a1 1 0 0 1-.985.821H5.609a1 1 0 0 1-.985-.821L2.622 6.755a.5.5 0 0 1 .7-.574l5.378 2.689z"/></svg>
                    <span>VIP</span>
                </span>`;
            }
            return '';
        },

        showUserProfileModal(userId, username, avatar, borderUrl, borderName, isAdmin, isVip, vipTier, vipExpiresAt) {
            var existing = document.getElementById('chat-user-profile-modal');
            if (existing) existing.remove();

            var me = GlobalChat.getCurrentUser();
            var myId = me ? String(me.id || me.userId || '') : '';
            var myName = me ? String(me.username || '').toLowerCase().trim() : '';
            var targetName = (username || '').toLowerCase().trim();
            var isSelf = (myId && String(userId) === myId) || (myName && targetName === myName);

            var safeName = username || 'Musisi';
            var safeAvatar = avatar || '';
            var safeBorderUrl = borderUrl || '';
            var safeBorderName = borderName || (isVip ? 'VIP Frame' : 'Tanpa Border');

            var isVipActive = Boolean(isVip && (!vipExpiresAt || Date.now() <= Number(vipExpiresAt)) && vipTier !== 'none');
            var tierDesc = 'Member Standar';
            if (isAdmin) tierDesc = 'MusifyStar Official Admin';
            else if (isVipActive && vipTier === '1month') tierDesc = 'Paket VIP 1 Bulan (Platinum & Master)';
            else if (isVipActive && vipTier === '2months') tierDesc = 'Paket VIP 2 Bulan (Platinum, Master & Legend)';
            else if (isVipActive && vipTier === '5months') tierDesc = 'Paket VIP 5 Bulan (Platinum, Master, Legend & Immortal)';
            else if (isVipActive && (vipTier === 'permanent' || vipTier === 'lifetime' || vipTier === 'sultan')) tierDesc = 'Sultan VIP Permanen';
            else if (isVipActive) tierDesc = 'Member VIP Aktif';

            var checkmarkSvg = isAdmin ? GlobalChat.getAdminBlueCheckmarkHTML() : '';

            var expireText = '';
            if (isVipActive && vipExpiresAt && Number(vipExpiresAt) > 0) {
                var expDate = new Date(Number(vipExpiresAt));
                var isExpired = Date.now() > expDate.getTime();
                expireText = isExpired 
                    ? '<span class="text-rose-400 font-bold">Masa VIP telah habis</span>'
                    : `<span class="text-amber-300/90 font-mono font-semibold">${expDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>`;
            } else if (isVipActive || isAdmin) {
                expireText = '<span class="text-amber-300 font-bold">Aktif Selamanya (Permanen)</span>';
            } else {
                expireText = '<span class="text-slate-500 font-medium">Nonaktif</span>';
            }

            var modal = document.createElement('div');
            modal.id = 'chat-user-profile-modal';
            modal.className = 'fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none';
            modal.onclick = function(e) {
                if (e.target === modal) modal.remove();
            };

            modal.innerHTML = `
                <div class="relative w-full max-w-sm bg-[#12151d] border border-slate-700/80 rounded-3xl p-5 shadow-2xl shadow-black/90 space-y-4 overflow-hidden">
                    <!-- Close button -->
                    <button onclick="document.getElementById('chat-user-profile-modal')?.remove()" class="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer z-20" title="Tutup">
                        <i data-lucide="x" class="w-4 h-4"></i>
                    </button>

                    <!-- Decorative glow -->
                    <div class="absolute -top-12 -left-12 w-44 h-44 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>

                    <div class="text-center pt-1 relative z-10">
                        <span class="text-[10px] uppercase tracking-widest text-slate-400 font-mono font-bold block mb-3">Tampilan Profil & Border</span>
                        
                        <!-- Grand Centered Avatar with Frame -->
                        <div class="relative w-28 h-28 mx-auto flex items-center justify-center my-2">
                            <div class="w-20 h-20 rounded-full overflow-hidden bg-black/90 flex items-center justify-center shadow-inner z-0 ring-2 ring-white/10">
                                ${safeAvatar ? `
                                    <img src="${safeAvatar}" class="w-full h-full object-cover" onerror="this.onerror=null; this.src='/logo.png';" alt="${GlobalChat.escapeHtml(safeName)}">
                                ` : `
                                    <div class="w-full h-full bg-gradient-to-tr from-slate-700 to-slate-800 flex items-center justify-center text-white font-black text-2xl">
                                        ${safeName.charAt(0).toUpperCase()}
                                    </div>
                                `}
                            </div>
                            ${safeBorderUrl ? `
                                <img src="${safeBorderUrl}" class="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120px] h-[120px] max-w-none object-contain z-10 select-none drop-shadow-[0_0_18px_rgba(245,158,11,0.65)]" alt="" onerror="this.onerror=null; this.style.display='none';">
                            ` : ''}
                        </div>

                        <!-- Username & Status -->
                        <div class="mt-2">
                            <h3 class="text-base font-black text-white flex items-center justify-center gap-1.5 flex-wrap">
                                <span>${GlobalChat.escapeHtml(safeName)}</span>
                                ${checkmarkSvg}
                            </h3>
                            <p class="text-xs text-slate-400 mt-0.5">${tierDesc}</p>
                        </div>
                    </div>

                    <!-- Border & VIP Details Card -->
                    <div class="p-3.5 rounded-2xl bg-black/50 border border-slate-700/60 space-y-2.5 text-xs">
                        <div class="flex items-center justify-between">
                            <span class="text-slate-400 text-[11px]">Border Profil:</span>
                            <span class="font-bold ${safeBorderUrl ? 'text-amber-300' : 'text-slate-400'} flex items-center gap-1">
                                <i data-lucide="shield" class="w-3.5 h-3.5 text-amber-400"></i>
                                <span>${GlobalChat.escapeHtml(safeBorderName)}</span>
                            </span>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-slate-400 text-[11px]">Status VIP:</span>
                            <span class="font-bold ${isVipActive || isAdmin ? 'text-emerald-400' : 'text-slate-500'}">
                                ${isVipActive || isAdmin ? 'Aktif (Semua Fitur Terbuka)' : 'Non-VIP (Standar)'}
                            </span>
                        </div>
                        ${expireText ? `
                        <div class="flex items-center justify-between pt-1 border-t border-white/5 text-[11px]">
                            <span class="text-slate-400">Masa Berlaku VIP:</span>
                            <span>${expireText}</span>
                        </div>
                        ` : ''}
                    </div>

                    <!-- Action buttons -->
                    <div class="pt-1 space-y-2">
                        ${isSelf ? `
                        <button type="button" onclick="document.getElementById('chat-user-profile-modal')?.remove(); if(typeof Auth !== 'undefined') Auth.openBorderPickerModal();" class="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-500 hover:to-yellow-500 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-md shadow-amber-500/20">
                            <i data-lucide="shield" class="w-4 h-4"></i>
                            <span>Ganti Border Profil Saya</span>
                        </button>
                        ` : `
                        <button type="button" onclick="document.getElementById('chat-user-profile-modal')?.remove(); if(typeof Profile !== 'undefined') Profile.openVipPackagesModal();" class="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-500 hover:to-yellow-500 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-md shadow-amber-500/20">
                            <i data-lucide="crown" class="w-4 h-4 fill-black"></i>
                            <span>Beli VIP & Dapatkan Border Ini</span>
                        </button>
                        `}
                        <button type="button" onclick="document.getElementById('chat-user-profile-modal')?.remove()" class="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all cursor-pointer">
                            Tutup
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            if (window.lucide) lucide.createIcons();
        }
    };

    // Expose GlobalChat
    window.GlobalChat = GlobalChat;

    // Listen for real-time user profile updates (Username, Avatar, Border, Equipped Badges)
    function handleUserProfileChange(e) {
        if (GlobalChat.isOpen) {
            var u = (e && e.detail && e.detail.user) || GlobalChat.getCurrentUser();
            var bottomBar = document.getElementById('global-chat-bottom-bar');
            if (bottomBar && u) {
                var myId = String(u.id || u.userId || '');
                var myEmail = (u.email || u.rawEmail || '').toLowerCase().trim();
                var isMasterAdmin = (myEmail === 'jrnabil570@gmail.com' || myId === 'u_1790196636099_622dc736');
                bottomBar.innerHTML = GlobalChat.renderBottomBar(u, isMasterAdmin);
            }
            // Re-render messages to reflect profile/badge change on own messages
            GlobalChat.renderMessagesList(GlobalChat.messages);
        }
    }

    window.addEventListener('musifystar:user_profile_updated', handleUserProfileChange);
    window.addEventListener('musifystar:user_badge_updated', handleUserProfileChange);
    window.addEventListener('musifystar:user_border_updated', handleUserProfileChange);

    // Periodically poll unread count when window is idle (every 60s)
    setInterval(function() {
        if (!GlobalChat.isOpen) {
            fetch('/api/global-chat?t=' + Date.now(), { cache: 'no-store' })
                .then(function(r) { return r.json(); })
                .then(function(d) {
                    if (d && d.status && Array.isArray(d.messages)) {
                        var badge = document.getElementById('global-chat-badge');
                        if (badge && d.messages.length > GlobalChat.lastMessageCount && GlobalChat.lastMessageCount > 0) {
                            badge.classList.remove('hidden');
                        }
                    }
                })
                .catch(function() {});
        }
    }, 60000);

})();
