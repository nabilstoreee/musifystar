var Auth = {
    currentUser: null,
    token: null,
    mode: 'login', // 'login' | 'register'
    isPasswordVisible: false,

    saveUser(user) {
        if (!user) return;
        Auth.currentUser = user;
        try {
            if (localStorage.getItem('musifystar_auth_token')) {
                localStorage.setItem('musifystar_auth_user', JSON.stringify(user));
            } else {
                sessionStorage.setItem('musifystar_auth_user', JSON.stringify(user));
            }
            window.dispatchEvent(new CustomEvent('musifystar:user_profile_updated', {
                detail: { user: user }
            }));
        } catch(e) {}
    },

    init() {
        var savedToken = localStorage.getItem('musifystar_auth_token') || sessionStorage.getItem('musifystar_auth_token');
        var savedUser = localStorage.getItem('musifystar_auth_user') || sessionStorage.getItem('musifystar_auth_user');

        // Check persistent local ban first
        try {
            var savedBanRaw = localStorage.getItem('musifystar_active_ban');
            if (savedBanRaw) {
                var savedBan = JSON.parse(savedBanRaw);
                if (savedBan && savedBan.ban) {
                    var isExpired = false;
                    if (savedBan.ban.banType === 'temporary' && savedBan.ban.banExpiresAt) {
                        if (new Date(savedBan.ban.banExpiresAt).getTime() <= Date.now()) {
                            isExpired = true;
                        }
                    }
                    if (!isExpired) {
                        Auth.activeBannedUser = savedBan.user || null;
                        setTimeout(function() {
                            Auth.showBanModal(savedBan.ban);
                        }, 80);
                    } else {
                        localStorage.removeItem('musifystar_active_ban');
                    }
                }
            }
        } catch(e) {}

        if (savedToken) {
            Auth.token = savedToken;
            if (savedUser) {
                try { Auth.currentUser = JSON.parse(savedUser); } catch(e) {}
            }
        }
        Auth.initGoogleAuth();
        Auth.checkSession();
        Auth.startRealtimeBanMonitor();

        // Check ban immediately when switching back to browser tab
        document.addEventListener('visibilitychange', function() {
            if (!document.hidden) {
                Auth.checkSession();
            }
        });
    },

    startRealtimeBanMonitor() {
        if (window._realtimeBanMonitorTimer) clearInterval(window._realtimeBanMonitorTimer);
        // Poll every 30 seconds for background safety & ban sync
        window._realtimeBanMonitorTimer = setInterval(function() {
            Auth.checkSession();
        }, 30000);
    },

    async checkSession() {
        try {
            var headers = {};
            var url = '/api/user-auth?action=me';
            if (Auth.token) {
                headers['Authorization'] = 'Bearer ' + Auth.token;
                headers['X-Auth-Token'] = Auth.token;
                url += '&token=' + encodeURIComponent(Auth.token);
            }
            if (Auth.currentUser) {
                if (Auth.currentUser.id) headers['X-User-Id'] = Auth.currentUser.id;
                if (Auth.currentUser.username) headers['X-User-Name'] = Auth.currentUser.username;
                var em = Auth.currentUser.rawEmail || Auth.currentUser.email;
                if (em) headers['X-User-Email'] = em;
                url += '&userId=' + encodeURIComponent(Auth.currentUser.id || '') +
                       '&username=' + encodeURIComponent(Auth.currentUser.username || '') +
                       '&email=' + encodeURIComponent(em || '');
            } else if (Auth.activeBannedUser) {
                if (Auth.activeBannedUser.userId) headers['X-User-Id'] = Auth.activeBannedUser.userId;
                if (Auth.activeBannedUser.username) headers['X-User-Name'] = Auth.activeBannedUser.username;
                var em = Auth.activeBannedUser.rawEmail || Auth.activeBannedUser.email;
                if (em) headers['X-User-Email'] = em;
                url += '&userId=' + encodeURIComponent(Auth.activeBannedUser.userId || '') +
                       '&username=' + encodeURIComponent(Auth.activeBannedUser.username || '') +
                       '&email=' + encodeURIComponent(em || '');
            }

            var res = await fetch(url, {
                headers: headers,
                cache: 'no-store'
            });
            var data = await res.json();

            // First check if IP or Account is Banned or Warned
            if (data && (data.ipBanned || data.banned || (data.ban && (data.ban.isBanned || data.ban.isIpBanned || data.ban.isWarning)))) {
                // Pause audio playback if playing
                if (window.MusicPlayer) {
                    try {
                        if (typeof MusicPlayer.pause === 'function') MusicPlayer.pause();
                        if (MusicPlayer.sound && typeof MusicPlayer.sound.pause === 'function') MusicPlayer.sound.pause();
                    } catch(e){}
                }
                gid('header-auth-dropdown-wrapper')?.remove();
                gid('user-profile-modal')?.remove();
                gid('auth-modal-overlay')?.remove();
                if (data.user) {
                    Auth.activeBannedUser = {
                        username: data.user.username,
                        userId: data.user.id,
                        email: data.user.rawEmail || data.user.email
                    };
                } else if (Auth.currentUser) {
                    Auth.activeBannedUser = {
                        username: Auth.currentUser.username,
                        userId: Auth.currentUser.id,
                        email: Auth.currentUser.rawEmail || Auth.currentUser.email
                    };
                }
                try {
                    localStorage.setItem('musifystar_active_ban', JSON.stringify({
                        ban: data.ban,
                        user: Auth.activeBannedUser
                    }));
                } catch(e){}
                Auth.currentUser = null;
                localStorage.removeItem('musifystar_auth_user');
                sessionStorage.removeItem('musifystar_auth_user');
                Auth.updateHeaderUI();
                Auth.showBanModal(data.ban || { isBanned: true, isIpBanned: !!data.ipBanned, banReason: data.message });
                return;
            }

            // Remove existing ban modal ONLY when confirmed safe
            var existingModal = gid('user-banned-banner-modal');
            if (existingModal) {
                var modalCategory = existingModal.dataset.banCategory;
                // If modal was for IP ban, remove only if server confirms IP is not banned
                if (modalCategory === 'ip' && data && !data.ipBanned && (!data.ban || !data.ban.isIpBanned)) {
                    existingModal.remove();
                }
                // If modal was for Account ban, remove if server confirms account is not banned
                else if (modalCategory === 'account' && data && !data.banned && (!data.ban || !data.ban.isBanned)) {
                    existingModal.remove();
                    try { localStorage.removeItem('musifystar_active_ban'); } catch(e) {}
                }
            }

            if (data && data.authenticated && data.user) {
                Auth._failedSessionChecks = 0;
                Auth.currentUser = data.user;
                if (data.newToken) {
                    Auth.token = data.newToken;
                    if (localStorage.getItem('musifystar_auth_token')) {
                        localStorage.setItem('musifystar_auth_token', data.newToken);
                    } else {
                        sessionStorage.setItem('musifystar_auth_token', data.newToken);
                    }
                }
                if (localStorage.getItem('musifystar_auth_token')) {
                    localStorage.setItem('musifystar_auth_user', JSON.stringify(data.user));
                } else {
                    sessionStorage.setItem('musifystar_auth_user', JSON.stringify(data.user));
                }
                Auth.updateHeaderUI();
            } else if (res.status === 401 || (data && data.tokenInvalid === true)) {
                // Only clear session if server explicitly returned 401 or tokenInvalid on consecutive checks
                Auth._failedSessionChecks = (Auth._failedSessionChecks || 0) + 1;
                if (Auth._failedSessionChecks >= 3) {
                    Auth.token = null;
                    Auth.currentUser = null;
                    localStorage.removeItem('musifystar_auth_token');
                    localStorage.removeItem('musifystar_auth_user');
                    sessionStorage.removeItem('musifystar_auth_token');
                    sessionStorage.removeItem('musifystar_auth_user');
                    Auth.updateHeaderUI();
                }
            }
        } catch (e) {
            console.warn('Check session error:', e);
        }
    },

    getBorderUrl(u) {
        if (!u) return '';
        if (u.borderUrl) return u.borderUrl;
        var b = String(u.border || '').toLowerCase().trim();
        if (b === 'border_platinum' || b.includes('platinum')) return '/borders/Platinum.png';
        if (b === 'border_master' || b.includes('master')) return '/borders/Master.png';
        if (b === 'border_legend' || b.includes('legend')) return '/borders/Legend.png';
        if (b === 'border_immortal' || b.includes('immortal') || b.includes('imortal')) return '/borders/Imortal.png';
        return '';
    },

    getBorderName(u) {
        if (!u) return '';
        if (u.borderName) return u.borderName;
        var b = String(u.border || '').toLowerCase().trim();
        if (b === 'border_platinum' || b.includes('platinum')) return 'Platinum';
        if (b === 'border_master' || b.includes('master')) return 'Master';
        if (b === 'border_legend' || b.includes('legend')) return 'Legend';
        if (b === 'border_immortal' || b.includes('immortal') || b.includes('imortal')) return 'Immortal';
        return '';
    },

    updateHeaderUI() {
        var profileBtns = document.querySelectorAll('.header-profile-btn');
        profileBtns.forEach(function(btn) {
            if (Auth.currentUser) {
                var u = Auth.currentUser;
                var bUrl = Auth.getBorderUrl(u);
                btn.innerHTML = `
                    <div class="relative w-full h-full flex items-center justify-center">
                        <img src="${u.avatar || '/logo.png'}" class="w-full h-full rounded-full object-cover" alt="Avatar" onerror="this.src='/logo.png'">
                        ${bUrl ? `<img src="${bUrl}" class="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[155%] h-[155%] max-w-none object-contain z-10 select-none drop-shadow-sm" alt="Border">` : ''}
                    </div>
                `;
                btn.setAttribute('title', 'Akun: ' + u.username);
            } else {
                btn.innerHTML = '<i data-lucide="user" class="w-5 h-5"></i>';
                btn.setAttribute('title', 'Login / Profil');
            }
        });

        // Toggle Global Chat Button (Only available when logged in)
        var chatBtn = gid('header-global-chat-btn');
        if (chatBtn) {
            if (Auth.currentUser) {
                chatBtn.classList.remove('hidden');
            } else {
                chatBtn.classList.add('hidden');
            }
        }

        // Ensure bottom navigation dev tab retains code icon
        var navDev = gid('nav-dev');
        if (navDev) {
            var iconWrap = navDev.querySelector('.magic-tab-icon');
            if (iconWrap) {
                iconWrap.innerHTML = '<i data-lucide="code"></i>';
            }
        }

        // Re-render Profile page if it is currently displayed
        if (typeof Profile !== 'undefined' && typeof Profile.render === 'function' && typeof S !== 'undefined' && S.at === 'dev') {
            Profile.render();
        }

        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            try { window.lucide.createIcons(); } catch(e){}
        }
    },

    toggleTopDropdown(triggerEl) {
        var existing = gid('header-auth-dropdown-wrapper');
        if (existing) {
            existing.remove();
            return;
        }

        var wrapper = document.createElement('div');
        wrapper.id = 'header-auth-dropdown-wrapper';

        // When user is not logged in: present the exact Hover Expanding Neon Conic Gradient Modal from the video
        if (!Auth.currentUser) {
            wrapper.className = 'fixed inset-0 z-[700] flex items-center justify-center p-4 animate-fadeIn pointer-events-auto';
            wrapper.innerHTML = `
                <!-- Backdrop click to dismiss -->
                <div onclick="gid('header-auth-dropdown-wrapper')?.remove()" class="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"></div>

                <!-- Floating Close Button at top right of screen -->
                <button onclick="gid('header-auth-dropdown-wrapper')?.remove()" class="fixed top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white/70 hover:text-white transition active:scale-95 cursor-pointer z-40" title="">
                    <i data-lucide="x" class="w-4 h-4"></i>
                </button>

                <!-- Centered Hover Expanding Card -->
                <div class="relative z-10 flex flex-col items-center">
                    <div id="neon-login-box" class="neon-box-card ${Auth.mode === 'register' ? 'mode-register' : ''}" onclick="Auth.toggleCardExpand(event)">
                        <!-- Inner dark box -->
                        <div class="neon-box-card-inner">
                            <div id="header-auth-content" class="w-full h-full flex flex-col">
                                ${Auth.getFormHTML('header-')}
                            </div>
                        </div>
                    </div>

                    <!-- Hint below card -->
                    <p class="text-white/40 text-[11px] mt-4 font-medium select-none pointer-events-none transition-opacity duration-300">
                        KLIK BAGIAN LOGIN UNTUK BUAT AKUN
                    </p>
                </div>
            `;
        } else {
            // When user is already logged in: present the top-right anchored profile dropdown
            wrapper.className = 'fixed inset-0 z-50 flex justify-end items-start pt-16 pr-4 sm:pr-8 animate-fadeIn pointer-events-auto';
            wrapper.innerHTML = `
                <!-- Backdrop click to dismiss -->
                <div onclick="gid('header-auth-dropdown-wrapper')?.remove()" class="fixed inset-0 bg-black/40 backdrop-blur-[2px]"></div>

                <!-- Floating Card Anchored Under Profile Button -->
                <div class="relative z-10 w-[92vw] max-w-[340px] bg-[#12141c]/95 backdrop-blur-2xl border border-white/20 rounded-3xl p-5 shadow-2xl shadow-black/80 text-left transition-all duration-300 transform scale-100 origin-top-right">
                    <!-- Close Button -->
                    <button onclick="gid('header-auth-dropdown-wrapper')?.remove()" class="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition active:scale-95 cursor-pointer">
                        <i data-lucide="x" class="w-4 h-4"></i>
                    </button>

                    <div id="header-auth-content">
                        ${Auth.getLoggedInDropdownHTML()}
                    </div>
                </div>
            `;
        }

        document.body.appendChild(wrapper);
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            try { window.lucide.createIcons(); } catch(e){}
        }
    },

    toggleCardExpand(e) {
        if (e && e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.closest('button') || e.target.closest('input') || e.target.closest('form'))) {
            return;
        }
        var box = gid('neon-login-box');
        if (box) {
            box.classList.toggle('expanded');
        }
    },

    openLoginModal(mode) {
        if (mode) Auth.mode = mode;
        if (Auth.currentUser) {
            Auth.openUserProfileModal();
            return;
        }
        var existing = gid('header-auth-dropdown-wrapper');
        if (existing) existing.remove();
        Auth.toggleTopDropdown();
    },

    setMode(mode, prefix) {
        Auth.mode = mode;
        Auth.isPasswordVisible = false;
        var p = prefix || 'header-';
        var box = gid('neon-login-box');
        if (box) {
            if (mode === 'register') {
                box.classList.add('mode-register');
            } else {
                box.classList.remove('mode-register');
            }
            box.classList.add('expanded');
        }
        var container = gid('header-auth-content');
        if (container) {
            container.innerHTML = Auth.getFormHTML(p);
            if (window.lucide && typeof window.lucide.createIcons === 'function') {
                try { window.lucide.createIcons(); } catch(e){}
            }
        }
    },

    togglePassword(inputFieldId, iconId) {
        var input = gid(inputFieldId);
        var icon = gid(iconId);
        if (!input) return;
        if (input.type === 'password') {
            input.type = 'text';
            if (icon) icon.setAttribute('data-lucide', 'eye-off');
        } else {
            input.type = 'password';
            if (icon) icon.setAttribute('data-lucide', 'eye');
        }
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            try { window.lucide.createIcons(); } catch(e){}
        }
    },

    getFormHTML(prefix) {
        prefix = prefix || 'header-';
        if (Auth.mode === 'login') {
            return `
            <!-- Header (Visible in compact pill, centered) -->
            <div class="neon-header-row select-none justify-center gap-2" title="Klik untuk buka / tutup">
                <span class="font-black text-sm tracking-widest text-white uppercase">LOGIN</span>
                <span class="text-[#35eaff] flex items-center shrink-0">
                    <i data-lucide="lock" class="w-4 h-4"></i>
                </span>
            </div>

            <!-- Expanding Content (fades in on hover / open) -->
            <div class="neon-body-content">
                <form onsubmit="Auth.handleLogin(event, '${prefix}')" class="w-full space-y-2.5 pt-1">
                    <!-- Username field -->
                    <div>
                        <input type="text" id="${prefix}auth-login-username" required placeholder="Username atau Email" autocomplete="username" class="neon-v-input">
                    </div>

                    <!-- Password field with eye toggle -->
                    <div class="relative flex items-center">
                        <input type="password" id="${prefix}auth-login-password" minlength="6" required placeholder="Password" autocomplete="current-password" class="neon-v-input pr-10">
                        <button type="button" onclick="Auth.togglePassword('${prefix}auth-login-password', '${prefix}auth-login-eye-icon')" class="absolute right-3.5 text-white/40 hover:text-[#35eaff] active:scale-95 transition cursor-pointer" title="Lihat/Sembunyikan Password">
                            <i id="${prefix}auth-login-eye-icon" data-lucide="eye" class="w-4 h-4"></i>
                        </button>
                    </div>

                    <!-- Sign in Button (Vivid Cyan pill button) -->
                    <div class="pt-0.5">
                        <button type="submit" id="${prefix}auth-login-btn" class="neon-v-btn">
                            <span>LOGIN AKUN</span>
                        </button>
                    </div>

                    <!-- Divider OR -->
                    <div class="relative flex items-center justify-center py-0.5 select-none">
                        <div class="border-t border-white/10 w-full"></div>
                        <span class="bg-[#141720] px-2 text-[9px] text-white/40 uppercase tracking-wider font-mono">atau</span>
                    </div>

                    <!-- Google Sign-In Button (Official standard design) -->
                    <div>
                        <button type="button" onclick="Auth.handleGoogleLogin('${prefix}')" id="${prefix}auth-google-btn" class="w-full flex items-center justify-center gap-2.5 py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs transition-all active:scale-[0.98] shadow-md border border-slate-200 cursor-pointer" title="Masuk cepat dengan Akun Google Anda">
                            <svg class="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                            </svg>
                            <span>Lanjutkan dengan Google</span>
                        </button>
                    </div>

                    <!-- Footer Links: Forgot Password & Sign up -->
                    <div class="flex items-center justify-between text-xs px-1 pt-0.5 select-none">
                        <span class="text-white/60 hover:text-white hover:underline cursor-pointer transition">belum ada akun?</span>
                        <button type="button" onclick="Auth.setMode('register', '${prefix}')" class="text-[#ff10de] hover:text-[#ff3aeb] font-bold cursor-pointer transition">
                            daftar disini
                        </button>
                    </div>
                </form>
            </div>
            `;
        } else {
            return `
            <!-- Header (Visible in compact pill, centered) -->
            <div class="neon-header-row select-none" title="Klik untuk buka / tutup">
                <span class="text-[#35eaff] flex items-center shrink-0">
                    <i data-lucide="user-plus" class="w-4 h-4"></i>
                </span>
                <span class="font-black text-sm tracking-widest text-white uppercase">REGISTER</span>
                <span class="text-[#ff10de] flex items-center shrink-0">
                    <i data-lucide="lock" class="w-4 h-4"></i>
                </span>
            </div>

            <!-- Expanding Content (fades in on hover / open) -->
            <div class="neon-body-content">
                <form onsubmit="Auth.handleRegister(event, '${prefix}')" class="w-full space-y-2.5 pt-1">
                    <!-- Username field -->
                    <div>
                        <input type="text" id="${prefix}auth-reg-username" required placeholder="Username" autocomplete="username" class="neon-v-input">
                    </div>

                    <!-- Email field -->
                    <div>
                        <input type="email" id="${prefix}auth-reg-email" required placeholder="Email Address" autocomplete="email" class="neon-v-input">
                    </div>

                    <!-- Password field with eye toggle -->
                    <div class="relative flex items-center">
                        <input type="password" id="${prefix}auth-reg-password" minlength="6" required placeholder="Password" autocomplete="new-password" class="neon-v-input pr-10">
                        <button type="button" onclick="Auth.togglePassword('${prefix}auth-reg-password', '${prefix}auth-reg-eye-icon')" class="absolute right-3.5 text-white/40 hover:text-[#ff10de] active:scale-95 transition cursor-pointer" title="Lihat/Sembunyikan Password">
                            <i id="${prefix}auth-reg-eye-icon" data-lucide="eye" class="w-4 h-4"></i>
                        </button>
                    </div>

                    <!-- Sign up Button (Vivid Magenta pill button) -->
                    <div class="pt-0.5">
                        <button type="submit" id="${prefix}auth-reg-btn" class="neon-v-btn neon-v-btn-reg">
                            <span>DAFTARKAN AKUN</span>
                        </button>
                    </div>

                    <!-- Divider OR -->
                    <div class="relative flex items-center justify-center py-0.5 select-none">
                        <div class="border-t border-white/10 w-full"></div>
                        <span class="bg-[#141720] px-2 text-[9px] text-white/40 uppercase tracking-wider font-mono">atau</span>
                    </div>

                    <!-- Google Sign-In Button (Official standard design) -->
                    <div>
                        <button type="button" onclick="Auth.handleGoogleLogin('${prefix}')" id="${prefix}auth-google-reg-btn" class="w-full flex items-center justify-center gap-2.5 py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs transition-all active:scale-[0.98] shadow-md border border-slate-200 cursor-pointer" title="Daftar cepat dengan Akun Google Anda">
                            <svg class="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                            </svg>
                            <span>Daftar dengan Google</span>
                        </button>
                    </div>

                    <!-- Footer Links: Back to Sign in -->
                    <div class="flex items-center justify-between text-xs px-1 pt-0.5 select-none">
                        <span class="text-white/60">Sudah punya akun?</span>
                        <button type="button" onclick="Auth.setMode('login', '${prefix}')" class="text-[#35eaff] hover:text-[#56efff] font-bold cursor-pointer transition">
                            login disini
                        </button>
                    </div>
                </form>
            </div>
            `;
        }
    },

    getBadgeSettings() {
        var saved = localStorage.getItem('musify_badge_settings');
        if (saved) {
            try {
                var parsed = JSON.parse(saved);
                if (parsed && typeof parsed.offsetY === 'number') {
                    if (!localStorage.getItem('musify_badge_offset_fixed_v4')) {
                        parsed.offsetY = -3;
                        localStorage.setItem('musify_badge_offset_fixed_v4', 'true');
                        localStorage.setItem('musify_badge_settings', JSON.stringify(parsed));
                    }
                }
                return parsed;
            } catch(e){}
        }
        return { margin: 2, size: 15, offsetY: -3, color: '#0095F6' };
    },

    saveBadgeSettings(s) {
        localStorage.setItem('musify_badge_settings', JSON.stringify(s));
    },

    getVerifiedBadgeHTML(customSettings) {
        var s = customSettings || Auth.getBadgeSettings();
        var margin = typeof s.margin === 'number' ? s.margin : 2;
        var size = typeof s.size === 'number' ? s.size : 15;
        var offsetY = typeof s.offsetY === 'number' ? s.offsetY : -3;
        var color = s.color || '#0095F6';
        var checkColor = (color.toLowerCase() === '#ffffff') ? '#000000' : '#FFFFFF';

        return `
        <span class="inline-flex items-center shrink-0 self-center" style="margin-left: ${margin}px; transform: translateY(${offsetY}px);" title="Akun Terverifikasi">
            <svg style="width: ${size}px; height: ${size}px;" class="shrink-0 inline-block align-middle" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="${color}" ${color.toLowerCase() === '#ffffff' ? 'stroke="#d4d4d8" stroke-width="1"' : ''}/>
                <path fill-rule="evenodd" clip-rule="evenodd" d="M16.707 8.293a1 1 0 0 1 0 1.414l-6 6a1 1 0 0 1-1.414 0l-3-3a1 1 0 1 1 1.414-1.414L10 13.586l5.293-5.293a1 1 0 0 1 1.414 0z" fill="${checkColor}"/>
            </svg>
        </span>`;
    },

    getVipBadgeHTML(extraClasses) {
        return `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-black font-extrabold text-[8.5px] leading-none shadow-[0_0_8px_rgba(245,158,11,0.35)] border border-amber-300/60 shrink-0 align-middle ${extraClasses || ''}"><svg class="w-2.5 h-2.5 shrink-0 fill-black text-black" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.3 8.87l5.378-2.689a.5.5 0 0 1 .7.574l-2.002 11.01a1 1 0 0 1-.985.821H5.609a1 1 0 0 1-.985-.821L2.622 6.755a.5.5 0 0 1 .7-.574l5.378 2.689z"/></svg><span>VIP</span></span>`;
    },

    getRankBadgePillHTML(equippedBadge, title, icon, colorHex) {
        if (!equippedBadge && !title) return '';
        var badgeKey = (equippedBadge || '').toLowerCase();
        
        var map = {
            'badge_echo': { name: 'Echo', icon: 'disc', color: '#06b6d4', svg: `<svg class="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>` },
            'badge_pulse': { name: 'Pulse', icon: 'activity', color: '#10b981', svg: `<svg class="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>` },
            'badge_bronze': { name: 'Bronze', icon: 'shield', color: '#b45309', svg: `<svg class="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.8 17 5 19 5a1 1 0 0 1 1 1z"/></svg>` },
            'badge_silver': { name: 'Silver', icon: 'shield-check', color: '#cbd5e1', svg: `<svg class="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.8 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>` },
            'badge_gold': { name: 'Gold', icon: 'star', color: '#eab308', svg: `<svg class="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 fill-current" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>` },
            'badge_platinum': { name: 'Platinum', icon: 'box', color: '#6366f1', svg: `<svg class="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>` },
            'badge_diamond': { name: 'Diamond', icon: 'gem', color: '#0284c7', svg: `<svg class="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l4 6-10 12L2 9z"/><path d="M11 3 8 9l4 12 4-12-3-6"/><path d="M2 9h20"/></svg>` },
            'badge_elite': { name: 'Elite', icon: 'crown', color: '#a855f7', svg: `<svg class="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 fill-current" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.3 8.87l5.378-2.689a.5.5 0 0 1 .7.574l-2.002 11.01a1 1 0 0 1-.985.821H5.609a1 1 0 0 1-.985-.821L2.622 6.755a.5.5 0 0 1 .7-.574l5.378 2.689z"/></svg>` },
            'badge_master': { name: 'Master', icon: 'target', color: '#f43f5e', svg: `<svg class="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>` },
            'badge_vip': { name: 'VIP', icon: 'crown', color: '#f59e0b', svg: `<svg class="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 fill-current text-amber-400" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.3 8.87l5.378-2.689a.5.5 0 0 1 .7.574l-2.002 11.01a1 1 0 0 1-.985.821H5.609a1 1 0 0 1-.985-.821L2.622 6.755a.5.5 0 0 1 .7-.574l5.378 2.689z"/></svg>` }
        };

        var info = map[badgeKey];
        if (!info && title) {
            var tLow = title.toLowerCase();
            if (tLow.includes('echo')) info = map['badge_echo'];
            else if (tLow.includes('pulse')) info = map['badge_pulse'];
            else if (tLow.includes('bronze')) info = map['badge_bronze'];
            else if (tLow.includes('silver')) info = map['badge_silver'];
            else if (tLow.includes('gold')) info = map['badge_gold'];
            else if (tLow.includes('platinum')) info = map['badge_platinum'];
            else if (tLow.includes('diamond')) info = map['badge_diamond'];
            else if (tLow.includes('elite')) info = map['badge_elite'];
            else if (tLow.includes('master')) info = map['badge_master'];
            else if (tLow.includes('vip')) info = map['badge_vip'];
        }

        var badgeName = title || (info ? info.name : '');
        var badgeColor = colorHex || (info ? info.color : '#38bdf8');
        var svgContent = info ? info.svg : `<svg class="w-2.5 h-2.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="2"/></svg>`;

        if (!badgeName) return '';

        return `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8.5px] leading-none font-black border shadow-sm select-none shrink-0 align-middle" style="background: rgba(18, 20, 28, 0.95); border-color: ${badgeColor}; color: ${badgeColor}; box-shadow: 0 0 8px ${badgeColor}33;">${svgContent}<span>${typeof Profile !== 'undefined' && Profile.escapeHtml ? Profile.escapeHtml(badgeName) : badgeName}</span></span>`;
    },

    toggleVipMembershipPanel() {
        var content = gid('vip-membership-content');
        var chevron = gid('vip-panel-chevron');
        if (!content) return;
        if (content.classList.contains('hidden')) {
            content.classList.remove('hidden');
            if (chevron) chevron.style.transform = 'rotate(180deg)';
        } else {
            content.classList.add('hidden');
            if (chevron) chevron.style.transform = 'rotate(0deg)';
        }
    },

    toggleBadgeSettingsPanel() {
        var content = gid('badge-settings-content');
        var chevron = gid('badge-panel-chevron');
        if (!content) return;
        if (content.classList.contains('hidden')) {
            content.classList.remove('hidden');
            if (chevron) chevron.style.transform = 'rotate(180deg)';
        } else {
            content.classList.add('hidden');
            if (chevron) chevron.style.transform = 'rotate(0deg)';
        }
    },

    toggleRankBadgePanel(forceOpen) {
        var content = gid('rank-badge-content');
        var chevron = gid('rank-badge-chevron');
        if (!content) return;
        if (forceOpen || content.classList.contains('hidden')) {
            content.classList.remove('hidden');
            if (chevron) chevron.style.transform = 'rotate(180deg)';
            setTimeout(function() {
                content.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        } else {
            content.classList.add('hidden');
            if (chevron) chevron.style.transform = 'rotate(0deg)';
        }
    },

    toggleNetworkInfoPanel() {
        var content = gid('network-info-content');
        var chevron = gid('network-info-chevron');
        if (!content) return;
        if (content.classList.contains('hidden')) {
            content.classList.remove('hidden');
            if (chevron) chevron.style.transform = 'rotate(180deg)';
        } else {
            content.classList.add('hidden');
            if (chevron) chevron.style.transform = 'rotate(0deg)';
        }
    },

    toggleCredentialsPanel() {
        var content = gid('credentials-content');
        var chevron = gid('credentials-chevron');
        if (!content) return;
        if (content.classList.contains('hidden')) {
            content.classList.remove('hidden');
            if (chevron) chevron.style.transform = 'rotate(180deg)';
        } else {
            content.classList.add('hidden');
            if (chevron) chevron.style.transform = 'rotate(0deg)';
        }
    },

    toggleIslamicCountdownPanel() {
        var content = gid('islamic-countdown-content');
        var chevron = gid('islamic-panel-chevron');
        if (!content) return;
        if (content.classList.contains('hidden')) {
            content.classList.remove('hidden');
            if (chevron) chevron.style.transform = 'rotate(180deg)';
            if (typeof IslamicClock !== 'undefined') {
                IslamicClock.updateCountdownDOMForProfileCard();
            }
        } else {
            content.classList.add('hidden');
            if (chevron) chevron.style.transform = 'rotate(0deg)';
        }
    },

    copyText(text, msg) {
        if (!text) return;
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text);
            } else {
                var ta = document.createElement('textarea');
                ta.value = text;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                ta.remove();
            }
            if (typeof showToast === 'function') {
                showToast(msg || 'Berhasil disalin!');
            }
        } catch(e) {
            if (typeof showToast === 'function') {
                showToast(msg || 'Berhasil disalin!');
            }
        }
    },

    updateBadgeControl(field, value) {
        var s = Auth.getBadgeSettings();
        if (field === 'margin' || field === 'size' || field === 'offsetY') {
            s[field] = parseInt(value, 10);
        } else if (field === 'color') {
            s[field] = value;
        }
        Auth.saveBadgeSettings(s);

        var modalBadgeWrapper = gid('modal-badge-wrapper');
        if (modalBadgeWrapper) {
            modalBadgeWrapper.innerHTML = Auth.getVerifiedBadgeHTML(s);
        }
        var dropdownBadgeWrapper = gid('dropdown-badge-wrapper');
        if (dropdownBadgeWrapper) {
            dropdownBadgeWrapper.innerHTML = Auth.getVerifiedBadgeHTML(s);
        }
        document.querySelectorAll('.global-verified-badge-container').forEach(function(el) {
            el.innerHTML = Auth.getVerifiedBadgeHTML(s);
        });

        var lblMargin = gid('lbl-badge-margin');
        if (lblMargin) lblMargin.innerText = s.margin + 'px';
        var lblSize = gid('lbl-badge-size');
        if (lblSize) lblSize.innerText = s.size + 'px';
        var lblOffsetY = gid('lbl-badge-offsetY');
        if (lblOffsetY) lblOffsetY.innerText = (s.offsetY > 0 ? '+' : '') + s.offsetY + 'px';
    },

    resetBadgeSettings() {
        var defaultSettings = { margin: 2, size: 15, offsetY: -3, color: '#0095F6' };
        Auth.saveBadgeSettings(defaultSettings);

        var inpMargin = gid('inp-badge-margin');
        if (inpMargin) inpMargin.value = 2;
        var inpSize = gid('inp-badge-size');
        if (inpSize) inpSize.value = 15;
        var inpOffsetY = gid('inp-badge-offsetY');
        if (inpOffsetY) inpOffsetY.value = -3;

        Auth.updateBadgeControl('color', '#0095F6');
    },

    getLoggedInDropdownHTML() {
        var u = Auth.currentUser;
        if (!u) return '';
        var joinDate = u.createdAt ? new Date(u.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Baru saja';
        var isMasterAdmin = ((u.email || u.rawEmail || '').toLowerCase().trim() === 'jrnabil570@gmail.com');
        var bUrl = Auth.getBorderUrl(u);
        var bName = Auth.getBorderName(u);
        var isVipExpired = u.vipExpiresAt && Date.now() > u.vipExpiresAt;
        var isTierActive = Boolean(u.vipTier && u.vipTier !== 'none');
        var isUserVip = (isMasterAdmin || ((Boolean(u.isPremium || u.is_premium || isTierActive)) && u.vipTier !== 'none')) && !isVipExpired;

        return `
        <div>
            <!-- Header Profil: Avatar dengan Border Frame Eksklusif & Info Akun -->
            <div class="flex items-center gap-3.5 pb-3 border-b border-white/10 pr-6">
                <!-- Avatar Container dengan Ruang Khusus Border Frame -->
                <div class="relative w-12 h-12 flex items-center justify-center shrink-0">
                    <div class="w-10 h-10 rounded-full overflow-hidden bg-black/80 flex items-center justify-center ring-1 ring-white/15 shadow-md z-0">
                        <img src="${u.avatar || '/logo.png'}" class="w-full h-full object-cover rounded-full" alt="Avatar" onerror="this.src='/logo.png'" />
                    </div>
                    ${bUrl ? `
                    <img src="${bUrl}" class="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[66px] h-[66px] max-w-none object-contain z-10 select-none drop-shadow-[0_0_10px_rgba(245,158,11,0.55)]" alt="" onerror="this.onerror=null; this.style.display='none';">
                    ` : ''}
                </div>
                <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-1.5 flex-wrap">
                        <h3 class="text-white font-bold text-sm leading-tight truncate max-w-[155px]">${es(u.username)}</h3>
                        ${isMasterAdmin ? `
                        <span id="dropdown-badge-wrapper" class="global-verified-badge-container">${Auth.getVerifiedBadgeHTML()}</span>` : ''}
                        ${isUserVip ? Auth.getVipBadgeHTML('text-[8px] px-1.5 py-0.2') : ''}
                    </div>
                    <p class="text-white/60 text-[11px] truncate max-w-[170px]">${es(u.email)}</p>
                    ${bName ? `
                    <div class="mt-0.5 flex items-center gap-1">
                        <span class="text-[9.5px] font-bold text-amber-300 bg-amber-400/15 border border-amber-400/30 px-1.5 py-0.2 rounded-full inline-flex items-center gap-1 shadow-sm">
                            <i data-lucide="shield" class="w-2.5 h-2.5 text-amber-400"></i> Border: ${es(bName)}
                        </span>
                    </div>` : ''}
                </div>
            </div>

            <div class="py-2.5 space-y-1 text-[11px]">
                <div class="flex justify-between items-center text-white/70">
                    <span>Status Akun</span>
                    <span class="text-emerald-400 font-semibold flex items-center gap-1">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> ${isMasterAdmin ? 'Administrator' : (isUserVip ? 'VIP Member' : 'Member Aktif')}
                    </span>
                </div>
                ${bName ? `
                <div class="flex justify-between items-center text-white/70">
                    <span>Border Terpasang</span>
                    <span class="text-amber-300 font-semibold flex items-center gap-1">
                        <i data-lucide="shield" class="w-3 h-3 text-amber-400"></i> ${es(bName)}
                    </span>
                </div>` : ''}
                <div class="flex justify-between items-center text-white/70">
                    <span>Bergabung</span>
                    <span class="text-white/90">${joinDate}</span>
                </div>
            </div>

            <div class="pt-2.5 border-t border-white/10 space-y-2">
                <button onclick="gid('header-auth-dropdown-wrapper')?.remove(); Auth.openUserProfileModal();" class="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-sky-500/20 to-indigo-500/20 hover:from-sky-500/30 hover:to-indigo-500/30 border border-sky-500/30 text-white font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-sm">
                    <i data-lucide="user-pen" class="w-3.5 h-3.5 text-sky-400"></i>
                    <span>Buka Halaman Profil</span>
                </button>
                <button onclick="gid('header-auth-dropdown-wrapper')?.remove(); if(window.GlobalStats) GlobalStats.openModal();" class="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/35 text-amber-200 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-sm">
                    <i data-lucide="trophy" class="w-3.5 h-3.5 text-amber-400"></i>
                    <span>Global Stats & Leaderboard</span>
                </button>
                ${isMasterAdmin ? `
                <button onclick="gid('header-auth-dropdown-wrapper')?.remove(); if(typeof Profile !== 'undefined') Profile.openAdminModal();" class="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-purple-600/30 via-rose-600/30 to-purple-600/30 hover:from-purple-600/40 hover:to-rose-600/40 border border-purple-500/50 text-purple-200 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-md">
                    <i data-lucide="shield-check" class="w-3.5 h-3.5 text-purple-400"></i>
                    <span>Panel Admin (Master)</span>
                </button>` : ''}
                <button onclick="Auth.logout()" class="w-full py-2 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer">
                    <i data-lucide="log-out" class="w-3.5 h-3.5"></i>
                    <span>Keluar Akun</span>
                </button>
            </div>
        </div>
        `;
    },

    openUserProfileModal() {
        var u = Auth.currentUser;
        if (!u) {
            Auth.toggleTopDropdown();
            return;
        }

        var existing = gid('user-profile-modal');
        if (existing) existing.remove();

        var avatarUrl = u.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(u.username)}`;
        var joinDate = u.createdAt ? new Date(u.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '23 Sep 2026';
        var isVerified = ((u.email || '').toLowerCase().trim() === 'jrnabil570@gmail.com');
        var isMasterAdmin = ((u.email || '').toLowerCase().trim() === 'jrnabil570@gmail.com') || (u.username === 'nabil');
        var isVipExpired = u.vipExpiresAt && Date.now() > u.vipExpiresAt;
        var isTierActive = Boolean(u.vipTier && u.vipTier !== 'none');
        var isUserVip = (isMasterAdmin || ((Boolean(u.isPremium || u.is_premium || isTierActive)) && u.vipTier !== 'none')) && !isVipExpired;
        var badgeS = Auth.getBadgeSettings();
        var userIdVal = u.id || u.userId || u._id || 'usr_' + Date.now();
        var userIp = u.ip || u.lastIp || Auth.clientIp || '114.122.45.10';

        var rawTier = String(u.vipTier || '').toLowerCase();
        var vipTierDisplay = 'VIP Member';
        if (rawTier === '1month') vipTierDisplay = 'Paket 1 Bulan (Platinum & Master)';
        else if (rawTier === '2months') vipTierDisplay = 'Paket 2 Bulan (+ Legend)';
        else if (rawTier === '5months') vipTierDisplay = 'Paket 5 Bulan (+ Immortal)';
        else if (rawTier === 'permanent' || rawTier === 'lifetime' || rawTier === 'sultan' || isMasterAdmin) vipTierDisplay = 'Paket Permanen';
        else if (isUserVip) vipTierDisplay = 'Paket VIP Aktif';

        var borderMap = {
            'border_platinum': { name: 'Platinum', url: '/borders/Platinum.png' },
            'border_master': { name: 'Master', url: '/borders/Master.png' },
            'border_legend': { name: 'Legend', url: '/borders/Legend.png' },
            'border_immortal': { name: 'Immortal', url: '/borders/Imortal.png' }
        };
        var currentBorderId = u.border || '';
        var activeBorderObj = borderMap[currentBorderId] || (u.borderUrl ? { name: u.borderName || 'VIP', url: u.borderUrl } : null);
        var activeBorderUrl = activeBorderObj ? activeBorderObj.url : '';
        var activeBorderName = activeBorderObj ? activeBorderObj.name : '';

        // Clear any prior VIP countdown timer
        if (Auth._vipCountdownInterval) {
            clearInterval(Auth._vipCountdownInterval);
            Auth._vipCountdownInterval = null;
        }

        var userSecs = Number(u.listeningSeconds || u.listening_seconds || 0);

        var cardRanks = [
            { levelNum: 1, id: 'badge_echo', name: 'Echo', reqHours: 1, reqSec: 3600, label: '1 Jam Mendengarkan', icon: 'disc', iconEmoji: '💽', colorClass: 'cyan', colorHex: '#06b6d4', bgClass: 'bg-cyan-500/10 border-cyan-400/40 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]' },
            { levelNum: 2, id: 'badge_pulse', name: 'Pulse', reqHours: 5, reqSec: 18000, label: '5 Jam Mendengarkan', icon: 'activity', iconEmoji: '📈', colorClass: 'emerald', colorHex: '#10b981', bgClass: 'bg-emerald-500/10 border-emerald-400/40 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.25)]' },
            { levelNum: 3, id: 'badge_bronze', name: 'Bronze', reqHours: 10, reqSec: 36000, label: '10 Jam Mendengarkan', icon: 'shield', iconEmoji: '🛡️', colorClass: 'amber', colorHex: '#b45309', bgClass: 'bg-amber-700/10 border-amber-600/40 text-amber-500 shadow-[0_0_12px_rgba(180,83,9,0.25)]' },
            { levelNum: 4, id: 'badge_silver', name: 'Silver', reqHours: 20, reqSec: 72000, label: '20 Jam Mendengarkan', icon: 'shield-check', iconEmoji: '⚔️', colorClass: 'slate', colorHex: '#cbd5e1', bgClass: 'bg-slate-400/10 border-slate-300/40 text-slate-300 shadow-[0_0_12px_rgba(203,213,225,0.25)]' },
            { levelNum: 5, id: 'badge_gold', name: 'Gold', reqHours: 35, reqSec: 126000, label: '35 Jam Mendengarkan', icon: 'star', iconEmoji: '⭐', colorClass: 'yellow', colorHex: '#eab308', bgClass: 'bg-yellow-500/10 border-yellow-400/40 text-yellow-400 shadow-[0_0_12px_rgba(234,179,8,0.25)]' },
            { levelNum: 6, id: 'badge_platinum', name: 'Platinum', reqHours: 50, reqSec: 180000, label: '50 Jam (2 Hari)', icon: 'box', iconEmoji: '📦', colorClass: 'indigo', colorHex: '#6366f1', bgClass: 'bg-indigo-500/10 border-indigo-400/40 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.25)]' },
            { levelNum: 7, id: 'badge_diamond', name: 'Diamond', reqHours: 75, reqSec: 270000, label: '75 Jam (3 Hari)', icon: 'gem', iconEmoji: '💎', colorClass: 'sky', colorHex: '#0284c7', bgClass: 'bg-sky-500/10 border-sky-400/40 text-sky-400 shadow-[0_0_12px_rgba(2,132,199,0.25)]' },
            { levelNum: 8, id: 'badge_elite', name: 'Elite', reqHours: 100, reqSec: 360000, label: '100 Jam (4 Hari)', icon: 'crown', iconEmoji: '👑', colorClass: 'purple', colorHex: '#a855f7', bgClass: 'bg-purple-500/10 border-purple-400/40 text-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.25)]' },
            { levelNum: 9, id: 'badge_master', name: 'Master', reqHours: 150, reqSec: 540000, label: '150 Jam (6 Hari)', icon: 'target', iconEmoji: '🎯', colorClass: 'rose', colorHex: '#f43f5e', bgClass: 'bg-rose-500/10 border-rose-400/40 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.25)]' }
        ];

        var topUnlockedRank = null;
        for (var rIdx = cardRanks.length - 1; rIdx >= 0; rIdx--) {
            if (userSecs >= cardRanks[rIdx].reqSec || isMasterAdmin) {
                topUnlockedRank = cardRanks[rIdx];
                break;
            }
        }

        var equippedRank = cardRanks.find(function(r) { return r.id === u.equippedBadge; }) || cardRanks[0];
        var formattedListeningTimeText = (function(secs) {
            if (!secs || secs < 60) return '0 Jam Mendengarkan';
            var days = Math.floor(secs / 86400);
            var hours = Math.floor(secs / 3600);
            if (days >= 1) return days + ' Hari Mendengarkan';
            return hours + ' Jam Mendengarkan';
        })(userSecs);

        var currentAutoShowText = topUnlockedRank ? ('Current: ' + topUnlockedRank.name + ' (' + topUnlockedRank.reqHours + 'h)') : 'Current: No rank unlocked (needs 1h)';

        var modal = document.createElement('div');
        modal.id = 'user-profile-modal';
        modal.className = 'fixed inset-0 z-[650] bg-[#07090e] flex flex-col select-none overflow-hidden h-[100dvh] max-h-[100dvh]';
        modal.style.animation = 'fadeIn 0.2s ease-out';
        modal.innerHTML = `
            <!-- Hidden Gallery File Picker (NO capture attribute: strictly phone/PC gallery only) -->
            <input type="file" id="auth-gallery-file-input" accept="image/png, image/jpeg, image/webp, image/gif" style="display:none;" onchange="Auth.uploadAvatarFromGallery(event)">

            <!-- Full Page Sticky Header -->
            <div class="pt-6 sm:pt-7 pb-3.5 px-4 shrink-0 border-b border-white/10 shadow-2xl transition-all flex items-center justify-between" style="background: linear-gradient(180deg, rgba(13, 15, 22, 0.88) 0%, rgba(13, 15, 22, 0.97) 100%), url('/banner.png') center/cover no-repeat; backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);">
                <div class="flex items-center gap-3">
                    <button onclick="Auth.closeUserProfileModal()" class="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center active:scale-95 transition-all cursor-pointer shadow-sm" title="Kembali">
                        <i data-lucide="arrow-left" class="w-5 h-5"></i>
                    </button>
                    <div>
                        <h1 class="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md leading-tight">Halaman Profil</h1>
                        <p class="text-white/50 text-[11px] leading-tight mt-0.5">Kelola akun & data profil Anda</p>
                    </div>
                </div>
                <button onclick="Auth.closeUserProfileModal(); Auth.logout();" class="text-xs px-3.5 py-1.5 rounded-full bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-sm" title="Keluar Akun">
                    <i data-lucide="log-out" class="w-3.5 h-3.5"></i>
                    <span>Keluar</span>
                </button>
            </div>

            <!-- Full Page Scrollable Body -->
            <div class="flex-1 overflow-y-auto overscroll-contain hide-scrollbar p-4 sm:p-6 max-w-2xl mx-auto w-full pb-32 space-y-4">
                
                <!-- CARD 1: AVATAR SELECTION (Sesuai Desain Screenshot) -->
                <div class="p-5 rounded-3xl bg-[#12141c]/90 border border-white/10 backdrop-blur-xl shadow-xl space-y-5">
                    <div class="flex items-center justify-between">
                        <h3 class="text-sm font-bold text-white tracking-wide">Avatar Selection</h3>
                        <span class="text-[10px] text-white/40 font-mono">Profile Picture</span>
                    </div>

                    <!-- Center Preview Avatar dengan Border Overlay Frame -->
                    <div class="flex flex-col items-center justify-center pt-1 pb-2">
                        <div class="relative w-32 h-32 flex items-center justify-center">
                            <!-- Inner Circular Avatar -->
                            <div class="w-20 h-20 rounded-full overflow-hidden bg-black/90 flex items-center justify-center shadow-inner z-0">
                                <img id="modal-user-avatar-img" src="${avatarUrl}" class="w-full h-full object-cover rounded-full" alt="Foto Profil" onerror="this.src='/logo.png'">
                            </div>
                            <!-- Border Frame Overlay (Centered mathematically on avatar circle) -->
                            <img id="modal-user-border-img" src="${activeBorderUrl}" class="${activeBorderUrl ? '' : 'hidden'} pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[124px] h-[124px] max-w-none object-contain z-10 select-none drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" alt="" onerror="this.onerror=null; this.style.display='none';">
                        </div>
                        <div class="mt-2 text-center">
                            <p class="text-white font-black text-sm truncate flex items-center justify-center gap-1">
                                <span>${es(u.username)}</span>${isVerified ? `
                                <span id="modal-badge-wrapper" class="global-verified-badge-container">${Auth.getVerifiedBadgeHTML(badgeS)}</span>` : ''}
                            </p>
                            ${(isUserVip || u.equippedBadgeTitle || u.equippedBadge) ? `
                            <div class="mt-1 flex items-center justify-center gap-1.5 flex-nowrap shrink-0">
                                ${isUserVip ? Auth.getVipBadgeHTML() : ''}
                                ${u.equippedBadgeTitle || u.equippedBadge ? Auth.getRankBadgePillHTML(u.equippedBadge, u.equippedBadgeTitle, u.equippedBadgeIcon, u.equippedBadgeColor) : ''}
                            </div>
                            ` : ''}
                            <p class="text-white/50 text-[11px] truncate mt-1">${es(u.email)}</p>
                            <div id="modal-current-border-badge" class="${activeBorderName ? '' : 'hidden'} mt-1 flex items-center justify-center">
                                <span class="text-[10px] font-bold text-amber-300 bg-amber-400/15 border border-amber-400/30 px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-sm">
                                    <i data-lucide="shield" class="w-3 h-3 text-amber-400"></i> Border: <span id="modal-border-name-text">${es(activeBorderName)}</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Action Buttons (+ Custom, Avatars, Border VIP, & Badge Rank) -->
                    <div class="grid grid-cols-4 gap-2 pt-1">
                        <button type="button" onclick="Auth.triggerGalleryUpload()" class="py-2.5 px-1.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white font-bold text-[11px] flex flex-col items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer shadow-sm">
                            <i data-lucide="plus" class="w-4 h-4 text-white/80"></i>
                            <span>Custom</span>
                        </button>
                        <button type="button" onclick="Auth.openAvatarPickerModal()" class="py-2.5 px-1.5 rounded-2xl bg-[#ccff00] hover:bg-[#b8e600] text-black font-extrabold text-[11px] flex flex-col items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer shadow-[0_0_20px_rgba(204,255,0,0.4)]">
                            <i data-lucide="palette" class="w-4 h-4 fill-black text-black"></i>
                            <span>Avatars</span>
                        </button>
                        <button type="button" onclick="Auth.openBorderPickerModal()" class="py-2.5 px-1.5 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-yellow-500/25 to-amber-400/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-400/50 text-amber-300 font-extrabold text-[11px] flex flex-col items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.25)]">
                            <i data-lucide="shield" class="w-4 h-4 text-amber-300"></i>
                            <span class="truncate">Border VIP</span>
                        </button>
                        <button type="button" onclick="Auth.toggleRankBadgePanel(true)" class="py-2.5 px-1.5 rounded-2xl bg-gradient-to-tr from-sky-500/20 via-blue-500/25 to-indigo-500/20 hover:from-sky-500/30 hover:to-indigo-500/30 border border-sky-400/50 text-sky-300 font-extrabold text-[11px] flex flex-col items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer shadow-[0_0_20px_rgba(56,189,248,0.25)]">
                            <i data-lucide="award" class="w-4 h-4 text-sky-300"></i>
                            <span class="truncate">Badge Rank</span>
                        </button>
                    </div>

                    <!-- Shortcut ke Papan Peringkat & Global Stats -->
                    <button type="button" onclick="if(window.GlobalStats) GlobalStats.openModal();" class="w-full p-2.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 hover:from-amber-500/25 hover:to-orange-500/25 border border-amber-400/35 flex items-center justify-between text-left active:scale-[0.99] transition-all cursor-pointer shadow-sm group">
                        <div class="flex items-center gap-2.5">
                            <div class="w-7 h-7 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
                                <i data-lucide="trophy" class="w-4 h-4 text-amber-400"></i>
                            </div>
                            <div>
                                <h4 class="text-xs font-black text-white group-hover:text-amber-300 transition-colors">Global Stats & Leaderboard</h4>
                                <p class="text-[9.5px] text-white/50 leading-tight">Lihat posisi peringkatmu & pamer Border profil</p>
                            </div>
                        </div>
                        <i data-lucide="chevron-right" class="w-4 h-4 text-amber-400 shrink-0"></i>
                    </button>
                </div>

                <!-- CARD VIP MEMBERSHIP & WAKTU MUNDUR EXPIRED (Accordion Buka/Tutup) -->
                <div class="rounded-2xl ${isUserVip ? 'bg-gradient-to-b from-[#1c1810]/95 via-[#13141d]/95 to-[#0e1017]/95 border-amber-400/35 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : (isVipExpired ? 'bg-gradient-to-b from-rose-950/30 via-[#13141d]/95 to-[#0e1017]/95 border-rose-500/35' : 'bg-[#12141c]/90 border-white/10')} border backdrop-blur-xl shadow-lg overflow-hidden transition-all">
                    <!-- Accordion Toggle Header -->
                    <button type="button" onclick="Auth.toggleVipMembershipPanel()" class="w-full p-3 sm:p-3.5 flex items-center justify-between text-left cursor-pointer hover:bg-white/5 transition-all select-none active:scale-[0.99]">
                        <div class="flex items-center gap-2 min-w-0 flex-1 pr-2">
                            <div class="w-6 h-6 rounded-lg ${isUserVip ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-black shadow-sm' : (isVipExpired ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-white/10 text-white/60')} flex items-center justify-center font-bold shrink-0">
                                <i data-lucide="crown" class="w-3.5 h-3.5 ${isUserVip ? 'fill-black' : ''}"></i>
                            </div>
                            <div class="min-w-0">
                                <h3 class="text-xs font-bold text-white tracking-wide leading-tight truncate">Status Membership VIP</h3>
                                <p class="text-[9.5px] text-white/50 leading-tight truncate mt-0.5">${isUserVip ? 'Akses Fitur Premium & Border Aktif' : (isVipExpired ? 'Masa Berlangganan Telah Habis' : 'Akun Standar Gratis')}</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2 shrink-0">
                            <i id="vip-panel-chevron" data-lucide="chevron-down" class="w-4 h-4 text-amber-400 transition-transform duration-300"></i>
                        </div>
                    </button>

                    <!-- Collapsible Panel Content -->
                    <div id="vip-membership-content" class="hidden p-3 sm:p-3.5 pt-0.5 space-y-2.5 border-t border-white/10">
                        ${isUserVip ? `
                        <!-- Detail Langganan & Live Waktu Mundur -->
                        <div class="p-2.5 rounded-xl bg-black/50 border border-amber-400/20 space-y-2">
                            <div class="flex items-center justify-between text-[10px]">
                                <span class="font-medium text-white/60 uppercase tracking-wider text-[9px]">Paket Langganan:</span>
                                <span class="text-[10.5px] font-bold text-amber-300 bg-amber-400/15 border border-amber-400/30 px-2 py-0.5 rounded-md">
                                    ${vipTierDisplay}
                                </span>
                            </div>

                            <!-- LIVE COUNTDOWN TIMER (WAKTU MUNDUR) -->
                            <div class="p-2 rounded-lg bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-amber-500/10 border border-amber-400/30 text-center shadow-inner">
                                <span class="text-[9px] font-bold text-amber-300/90 uppercase tracking-wider flex items-center justify-center gap-1">
                                    <i data-lucide="timer" class="w-3 h-3 text-amber-400 animate-pulse"></i> Sisa Masa Aktif VIP
                                </span>
                                <div id="modal-vip-live-countdown" class="font-mono text-xs sm:text-sm font-bold text-white tracking-wider my-0.5 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]">
                                    ${u.vipExpiresAt ? 'Menghitung sisa waktu...' : '<span class="text-amber-300 font-bold">Status Vip : Permanen</span>'}
                                </div>
                                ${u.vipExpiresAt ? `
                                <p class="text-[9px] text-white/45 font-mono">
                                    Berakhir pada: <span class="text-amber-300/80 font-medium">${new Date(u.vipExpiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} ${new Date(u.vipExpiresAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
                                </p>
                                ` : `
                                <p class="text-[9px] text-amber-400/70">Status Permanen : Tidak ada batasan tanggal kedaluwarsa.</p>
                                `}
                            </div>

                            <!-- Border Aktif & Fitur Terbuka -->
                            <div class="pt-1 border-t border-white/10 space-y-1.5">
                                <div class="flex items-center justify-between text-[10.5px]">
                                    <span class="text-white/60 text-[10px]">Kentungan Member VIP</span>
                                    <div class="flex items-center gap-1.5">
                                        <span class="font-bold text-amber-300 text-[10.5px]">${activeBorderName ? activeBorderName : 'Belum Dipasang'}</span>
                                        <button type="button" onclick="Auth.openBorderPickerModal()" class="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/35 font-bold cursor-pointer transition-all">Ganti Border</button>
                                    </div>
                                </div>
                                <div class="flex flex-wrap gap-1 pt-0.5">
                                    <span class="text-[8.5px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-emerald-400">Kualitas Audio Tinggi VIP✓</span>
                                    <span class="text-[8.5px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-emerald-400">Layar Tetap Menyala VIP✓</span>
                                    <span class="text-[8.5px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-emerald-400">Gestur Usap Layar VIP✓</span>
                                    <span class="text-[8.5px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-emerald-400">Putar Latar Belakang VIP✓</span>
                                    <span class="text-[8.5px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-emerald-400">Border keren Profile VIP✓</span>
                                    <span class="text-[8.5px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-emerald-400">Avatar Profile VIP✓</span>
                                </div>
                            </div>
                        </div>

                        <!-- Tombol Perpanjang VIP -->
                        <button type="button" onclick="if(typeof Profile !== 'undefined') Profile.openVipPackagesModal();" class="w-full py-2 px-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-500 hover:to-yellow-500 text-black font-extrabold text-[11px] flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer shadow-sm">
                            <i data-lucide="sparkles" class="w-3.5 h-3.5 fill-black"></i>
                            <span>Perpanjang / Upgrade Paket VIP</span>
                        </button>
                        ` : (isVipExpired ? `
                        <!-- Peringatan VIP Expired -->
                        <div class="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-center space-y-1.5">
                            <p class="text-[11px] font-bold text-rose-300 flex items-center justify-center gap-1">
                                <i data-lucide="alert-circle" class="w-3.5 h-3.5 text-rose-400"></i> Masa aktif VIP Anda telah berakhir
                            </p>
                            <p class="text-[9.5px] text-white/50 leading-tight">Perpanjang sekarang untuk mengaktifkan kembali border profil eksklusif dan seluruh fitur pemutar premium.</p>
                            <button type="button" onclick="if(typeof Profile !== 'undefined') Profile.openVipPackagesModal();" class="w-full py-1.5 px-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-extrabold text-[11px] flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer shadow-sm mt-0.5">
                                <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
                                <span>Beli & Aktifkan Kembali VIP</span>
                            </button>
                        </div>
                        ` : `
                        <!-- Non-VIP Call to Action -->
                        <div class="p-2.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
                            <p class="text-[10px] text-white/70 leading-snug">Tingkatkan akun Anda ke VIP untuk membuka <strong>Border Profil Eksklusif</strong>, Kualitas Audio Tinggi, Layar Tetap Menyala, Gestur Usap, dan Putar Latar Belakang!</p>
                            <button type="button" onclick="if(typeof Profile !== 'undefined') Profile.openVipPackagesModal();" class="w-full py-2 px-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-500 hover:to-yellow-500 text-black font-extrabold text-[11px] flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer shadow-sm">
                                <i data-lucide="crown" class="w-3.5 h-3.5 fill-black"></i>
                                <span>Beli Paket VIP Sekarang</span>
                            </button>
                        </div>
                        `)}
                    </div>
                </div>

                <!-- CARD 2: RANK BADGE CUSTOMISATION (Accordion Buka/Tutup) -->
                <div>
                    <button type="button" onclick="Auth.toggleRankBadgePanel()" class="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/20 hover:border-lime-400/40 text-white transition-all cursor-pointer backdrop-blur-xl shadow-sm select-none active:scale-[0.99]">
                        <div class="flex items-center gap-2.5">
                            <div class="w-7 h-7 rounded-lg bg-lime-400/20 border border-lime-400/30 flex items-center justify-center text-lime-400">
                                <i data-lucide="award" class="w-4 h-4"></i>
                            </div>
                            <div class="text-left">
                                <span class="text-xs font-bold text-white block leading-tight">Rank Badge Customisation</span>
                                <span class="text-[10px] text-white/50 leading-tight">Showcase badge di samping nama akun</span>
                            </div>
                        </div>
                        <div class="flex items-center gap-1.5">
                            <i id="rank-badge-chevron" data-lucide="chevron-down" class="w-4 h-4 text-lime-400 transition-transform duration-200"></i>
                        </div>
                    </button>

                    <div id="rank-badge-content" class="hidden p-4 mt-2 rounded-2xl bg-[#12141c]/90 border border-lime-400/25 space-y-3.5 backdrop-blur-xl shadow-xl transition-all duration-300">
                        <div>
                            <p class="text-[11px] text-white/50 leading-relaxed">Showcase any of your unlocked badges next to your name. Changing this badge does not affect your actual stats ranking.</p>
                        </div>

                        <!-- Featured Active Tier Card (Sesuai Foto IMG_20261011_035045.png) -->
                        <div class="p-3.5 rounded-2xl bg-[#181c24] border border-lime-400/40 relative flex items-center justify-between gap-3 shadow-[0_0_20px_rgba(163,230,53,0.12)]">
                            <div class="flex items-center gap-3 min-w-0">
                                <div class="w-12 h-12 rounded-full border flex items-center justify-center shrink-0 ${equippedRank.bgClass}">
                                    <i data-lucide="${equippedRank.icon}" class="w-6 h-6"></i>
                                </div>
                                <div class="min-w-0">
                                    <h3 class="text-xs sm:text-sm font-black text-white leading-tight">Tier: ${Profile.escapeHtml(equippedRank.name)}</h3>
                                    <p class="text-[11px] font-bold text-lime-300 mt-1">${formattedListeningTimeText}</p>
                                </div>
                            </div>
                            <div class="px-2.5 py-1 rounded-full bg-lime-500/20 border border-lime-400/40 text-lime-400 text-[10px] font-black uppercase tracking-wider shrink-0">
                                #LEVEL ${equippedRank.levelNum}
                            </div>
                        </div>

                        <!-- Auto-Show Highest Rank Toggle Box -->
                        <div onclick="${topUnlockedRank ? `Auth.equipRankBadge('${topUnlockedRank.id}', '${topUnlockedRank.name}', '${topUnlockedRank.iconEmoji}', '${topUnlockedRank.colorHex}')` : `if(typeof showToast==='function') showToast('Belum ada rank yang terbuka. Dengarkan musik minimal 1 jam!')`}"
                             class="p-3.5 rounded-2xl bg-[#181c24] border border-lime-400/50 flex items-center justify-between gap-3 shadow-[0_0_15px_rgba(163,230,53,0.15)] cursor-pointer active:scale-[0.99] transition-all">
                            <div class="flex items-center gap-3 min-w-0">
                                <div class="w-9 h-9 rounded-xl bg-lime-400/15 border border-lime-400/30 flex items-center justify-center text-lime-400 shrink-0">
                                    <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                                </div>
                                <div class="min-w-0">
                                    <h4 class="text-xs font-bold text-white">Auto-Show Highest Rank</h4>
                                    <p class="text-[10px] text-lime-300 font-semibold truncate mt-0.5">${currentAutoShowText}</p>
                                </div>
                            </div>
                            <div class="w-6 h-6 rounded-full bg-lime-400/20 text-lime-400 flex items-center justify-center shrink-0">
                                <i data-lucide="check" class="w-3.5 h-3.5"></i>
                            </div>
                        </div>

                        <!-- All Ranks Title & Grid (Sesuai Foto Screenshot_20261011-035124.png) -->
                        <div class="pt-1">
                            <h4 class="text-xs font-bold text-white/80 mb-2.5">All Ranks</h4>
                            <div class="grid grid-cols-3 gap-2.5">
                                ${cardRanks.map(function(r) {
                                    var isUnlocked = (userSecs >= r.reqSec) || isMasterAdmin;
                                    var isEquipped = (u.equippedBadge === r.id);
                                    return `
                                    <div onclick="${isUnlocked ? `Auth.equipRankBadge('${r.id}', '${r.name}', '${r.iconEmoji}', '${r.colorHex}')` : `if(typeof showToast==='function') showToast('Rank ${r.name} terkunci! Butuh ${r.label} memutar musik.')`}"
                                         class="p-2.5 rounded-2xl border transition-all flex flex-col items-center justify-center text-center relative group ${isUnlocked ? 'cursor-pointer hover:border-lime-400/60 active:scale-95' : 'opacity-40 select-none'} ${isEquipped ? 'bg-lime-400/15 border-lime-400 shadow-[0_0_15px_rgba(163,230,53,0.3)]' : 'bg-white/[0.03] border-white/5'}">
                                        
                                        <!-- Header Item: #LEVEL tag & Check/Lock icon -->
                                        <div class="w-full flex items-center justify-between gap-1 mb-1">
                                            <span class="text-[8px] sm:text-[9px] font-black px-1.5 py-0.2 rounded bg-lime-400/15 text-lime-400 border border-lime-400/30">#LEVEL ${r.levelNum}</span>
                                            ${isUnlocked ? (isEquipped ? `<span class="w-4 h-4 rounded-full bg-lime-400 text-black flex items-center justify-center text-[9px] font-black shrink-0"><i data-lucide="check" class="w-2.5 h-2.5 stroke-[3]"></i></span>` : '') : `<i data-lucide="lock" class="w-3 h-3 text-white/40 shrink-0"></i>`}
                                        </div>

                                        <div class="w-10 h-10 rounded-full border flex items-center justify-center my-1 ${r.bgClass}">
                                            <i data-lucide="${r.icon}" class="w-5 h-5"></i>
                                        </div>
                                        <span class="text-[11px] font-black text-white/90 mt-0.5 truncate max-w-full">${Profile.escapeHtml(r.name)}</span>
                                        <span class="text-[8.5px] sm:text-[9px] ${isUnlocked ? (isEquipped ? 'text-lime-300 font-black' : 'text-white/70 font-bold') : 'text-white/40'} leading-tight mt-0.5">${r.label}</span>
                                    </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    </div>
                </div>

                ${isVerified ? `
                <!-- Pengaturan Lencana Centang Biru (Accordion Toggle Buka/Tutup) -->
                <div>
                    <button type="button" onclick="Auth.toggleBadgeSettingsPanel()" class="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.08] hover:bg-white/[0.12] border border-sky-500/35 text-white transition-all cursor-pointer backdrop-blur-xl shadow-sm">
                        <div class="flex items-center gap-2.5">
                            <i data-lucide="sliders" class="w-4 h-4 text-sky-400"></i>
                            <span class="text-xs font-bold text-white">Atur Lencana Centang Biru</span>
                        </div>
                        <div class="flex items-center gap-1.5">
                            <span class="text-[11px] text-sky-300 font-medium"></span>
                            <i id="badge-panel-chevron" data-lucide="chevron-down" class="w-4 h-4 text-sky-400 transition-transform duration-200"></i>
                        </div>
                    </button>

                    <div id="badge-settings-content" class="hidden p-4 mt-2 rounded-2xl bg-black/50 border border-sky-500/30 space-y-3.5 backdrop-blur-xl shadow-sm">
                        <div class="flex items-center justify-between pb-2 border-b border-white/10">
                            <span class="text-[11px] text-white/60 font-medium">Kustomisasi Posisi & Warna</span>
                            <button type="button" onclick="Auth.resetBadgeSettings()" class="text-[11px] text-sky-400 hover:text-sky-300 font-bold underline cursor-pointer">
                                Reset Default
                            </button>
                        </div>

                        <div class="space-y-3 text-xs text-white/80">
                            <!-- 1. Jarak Geser Samping -->
                            <div>
                                <div class="flex justify-between items-center mb-1 text-[11px]">
                                    <span class="text-white/70">Jarak Ke Samping (Kiri/Kanan):</span>
                                    <span id="lbl-badge-margin" class="font-mono text-sky-400 font-bold">${badgeS.margin}px</span>
                                </div>
                                <input type="range" id="inp-badge-margin" min="-4" max="24" value="${badgeS.margin}" step="1"
                                    oninput="Auth.updateBadgeControl('margin', this.value)"
                                    class="w-full accent-sky-400 cursor-pointer h-1.5 bg-black/50 rounded-lg">
                            </div>

                            <!-- 2. Ukuran Lencana -->
                            <div>
                                <div class="flex justify-between items-center mb-1 text-[11px]">
                                    <span class="text-white/70">Ukuran Lencana:</span>
                                    <span id="lbl-badge-size" class="font-mono text-sky-400 font-bold">${badgeS.size}px</span>
                                </div>
                                <input type="range" id="inp-badge-size" min="10" max="28" value="${badgeS.size}" step="1"
                                    oninput="Auth.updateBadgeControl('size', this.value)"
                                    class="w-full accent-sky-400 cursor-pointer h-1.5 bg-black/50 rounded-lg">
                            </div>

                            <!-- 3. Posisi Atas - Bawah -->
                            <div>
                                <div class="flex justify-between items-center mb-1 text-[11px]">
                                    <span class="text-white/70">Posisi Vertikal (Atas/Bawah):</span>
                                    <span id="lbl-badge-offsetY" class="font-mono text-sky-400 font-bold">${badgeS.offsetY > 0 ? '+' : ''}${badgeS.offsetY}px</span>
                                </div>
                                <input type="range" id="inp-badge-offsetY" min="-6" max="6" value="${badgeS.offsetY}" step="1"
                                    oninput="Auth.updateBadgeControl('offsetY', this.value)"
                                    class="w-full accent-sky-400 cursor-pointer h-1.5 bg-black/50 rounded-lg">
                            </div>

                            <!-- 4. Pilihan Warna -->
                            <div>
                                <span class="text-[11px] text-white/70 block mb-1.5">Warna Lencana:</span>
                                <div class="flex items-center gap-3">
                                    <button type="button" onclick="Auth.updateBadgeControl('color', '#0095F6')" class="w-7 h-7 rounded-full bg-[#0095F6] border-2 border-white/40 hover:scale-110 active:scale-95 transition cursor-pointer shadow-sm" title="Biru"></button>
                                    <button type="button" onclick="Auth.updateBadgeControl('color', '#10b981')" class="w-7 h-7 rounded-full bg-[#10b981] border-2 border-white/40 hover:scale-110 active:scale-95 transition cursor-pointer shadow-sm" title="Hijau"></button>
                                    <button type="button" onclick="Auth.updateBadgeControl('color', '#18181b')" class="w-7 h-7 rounded-full bg-[#18181b] border-2 border-white/40 hover:scale-110 active:scale-95 transition cursor-pointer shadow-sm" title="Hitam"></button>
                                    <button type="button" onclick="Auth.updateBadgeControl('color', '#ffffff')" class="w-7 h-7 rounded-full bg-[#ffffff] border-2 border-white/40 hover:scale-110 active:scale-95 transition cursor-pointer shadow-sm" title="Putih"></button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>` : ''}

                <!-- SECTION 3: INFORMASI AKUN & JARINGAN (Accordion Buka/Tutup) -->
                <div>
                    <button type="button" onclick="Auth.toggleNetworkInfoPanel()" class="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/20 hover:border-cyan-500/40 text-white transition-all cursor-pointer backdrop-blur-xl shadow-sm select-none active:scale-[0.99]">
                        <div class="flex items-center gap-2.5">
                            <div class="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                                <i data-lucide="shield-check" class="w-4 h-4"></i>
                            </div>
                            <div class="text-left">
                                <span class="text-xs font-bold text-white block leading-tight">Informasi Akun & Jaringan</span>
                                <span class="text-[10px] text-white/50 leading-tight">Alamat IP & User ID Pengguna</span>
                            </div>
                        </div>
                        <div class="flex items-center gap-1.5">
                            <i id="network-info-chevron" data-lucide="chevron-down" class="w-4 h-4 text-cyan-400 transition-transform duration-200"></i>
                        </div>
                    </button>

                    <div id="network-info-content" class="hidden p-4 mt-2 rounded-2xl bg-[#12141c]/90 border border-cyan-500/25 space-y-3.5 backdrop-blur-xl shadow-xl transition-all duration-300">
                        <!-- Alamat IP Anda -->
                        <div class="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between gap-3">
                            <div class="min-w-0">
                                <span class="text-[10px] font-bold uppercase tracking-wider text-white/50 block">Alamat IP Anda</span>
                                <p id="prof-card-user-ip" class="text-xs sm:text-sm font-black text-white font-mono tracking-wide truncate mt-0.5 select-all">${es(userIp)}</p>
                            </div>
                            <button onclick="Auth.copyText('${esJs(userIp)}', 'Alamat IP berhasil disalin!')" class="shrink-0 text-[11px] font-bold text-cyan-300 hover:text-white bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-sm" title="Salin IP">
                                <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                                <span>Salin</span>
                            </button>
                        </div>

                        <!-- User ID Anda -->
                        <div class="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between gap-3">
                            <div class="min-w-0">
                                <span class="text-[10px] font-bold uppercase tracking-wider text-white/50 block">ID Anda (User ID)</span>
                                <p id="prof-card-user-id" class="text-xs sm:text-sm font-black text-purple-300 font-mono tracking-wide truncate mt-0.5 select-all">${es(userIdVal)}</p>
                            </div>
                            <button onclick="Auth.copyText('${esJs(userIdVal)}', 'User ID berhasil disalin!')" class="shrink-0 text-[11px] font-bold text-purple-300 hover:text-white bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-sm" title="Salin ID">
                                <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                                <span>Salin</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- SECTION 4: DATA PROFIL PENGGUNA (Accordion Buka/Tutup) -->
                <div>
                    <button type="button" onclick="Auth.toggleCredentialsPanel()" class="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/20 hover:border-sky-500/40 text-white transition-all cursor-pointer backdrop-blur-xl shadow-sm select-none active:scale-[0.99]">
                        <div class="flex items-center gap-2.5">
                            <div class="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
                                <i data-lucide="user-check" class="w-4 h-4"></i>
                            </div>
                            <div class="text-left">
                                <span class="text-xs font-bold text-white block leading-tight">Kredensial Profil</span>
                                <span class="text-[10px] text-white/50 leading-tight">Username, Email, & Password Akun</span>
                            </div>
                        </div>
                        <div class="flex items-center gap-1.5">
                            <i id="credentials-chevron" data-lucide="chevron-down" class="w-4 h-4 text-sky-400 transition-transform duration-200"></i>
                        </div>
                    </button>

                    <div id="credentials-content" class="hidden p-4 mt-2 rounded-2xl bg-[#12141c]/90 border border-sky-500/25 space-y-3.5 backdrop-blur-xl shadow-xl transition-all duration-300">
                        <!-- Username -->
                        <div class="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                            <div class="flex items-center justify-between">
                                <span class="text-[10px] font-bold uppercase tracking-wider text-white/50">Username</span>
                                <button onclick="Auth.toggleEditField('username')" class="w-7 h-7 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/30 text-sky-300 flex items-center justify-center active:scale-95 transition cursor-pointer" title="Ubah Username">
                                    <i data-lucide="pen-line" class="w-3.5 h-3.5"></i>
                                </button>
                            </div>
                            <div id="display-field-username" class="flex items-center justify-between">
                                <p class="text-sm font-black text-white truncate">${es(u.username)}</p>
                                <span class="text-[10px] text-white/40">Klik pulpen untuk ubah</span>
                            </div>
                            <form id="edit-form-username" onsubmit="Auth.saveEditedUsername(event)" class="hidden space-y-2 pt-1">
                                <input type="text" id="input-edit-username" required minlength="3" value="${es(u.username)}" class="w-full bg-black/60 border border-sky-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none">
                                <div class="flex justify-end gap-1.5">
                                    <button type="button" onclick="Auth.toggleEditField('username')" class="px-3 py-1.5 rounded-lg bg-white/10 text-white/70 text-[10px] font-bold cursor-pointer">Batal</button>
                                    <button type="submit" id="btn-save-username" class="px-3.5 py-1.5 rounded-lg bg-sky-500 text-white text-[10px] font-black flex items-center gap-1 cursor-pointer">
                                        <i data-lucide="check" class="w-3 h-3"></i> Simpan
                                    </button>
                                </div>
                            </form>
                        </div>

                        <!-- Email -->
                        <div class="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                            <div class="flex items-center justify-between">
                                <span class="text-[10px] font-bold uppercase tracking-wider text-white/50">Email Akun</span>
                                <button onclick="Auth.toggleEditField('email')" class="w-7 h-7 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 flex items-center justify-center active:scale-95 transition cursor-pointer" title="Ubah Email">
                                    <i data-lucide="pen-line" class="w-3.5 h-3.5"></i>
                                </button>
                            </div>
                            <div id="display-field-email" class="flex items-center justify-between">
                                <p class="text-sm font-bold text-white truncate">${es(u.email)}</p>
                                <span class="text-[10px] text-white/40">Klik pulpen untuk ubah</span>
                            </div>
                            <form id="edit-form-email" onsubmit="Auth.saveEditedEmail(event)" class="hidden space-y-2 pt-1">
                                <input type="email" id="input-edit-email" required value="${es(u.email)}" class="w-full bg-black/60 border border-emerald-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none">
                                <div class="flex justify-end gap-1.5">
                                    <button type="button" onclick="Auth.toggleEditField('email')" class="px-3 py-1.5 rounded-lg bg-white/10 text-white/70 text-[10px] font-bold cursor-pointer">Batal</button>
                                    <button type="submit" id="btn-save-email" class="px-3.5 py-1.5 rounded-lg bg-emerald-500 text-white text-[10px] font-black flex items-center gap-1 cursor-pointer">
                                        <i data-lucide="check" class="w-3 h-3"></i> Simpan
                                    </button>
                                </div>
                            </form>
                        </div>

                        <!-- Password -->
                        <div class="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                            <div class="flex items-center justify-between">
                                <span class="text-[10px] font-bold uppercase tracking-wider text-white/50">Password Akun</span>
                                <button type="button" onclick="Auth.toggleEditField('password')" class="w-7 h-7 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 flex items-center justify-center active:scale-95 transition cursor-pointer" title="Ubah Password">
                                    <i data-lucide="pen-line" class="w-3.5 h-3.5"></i>
                                </button>
                            </div>
                            <div id="display-field-password" class="flex items-center justify-between">
                                <p class="text-sm font-bold text-white tracking-widest font-mono">••••••••</p>
                                <span class="text-[10px] text-white/40">Klik pulpen untuk ubah</span>
                            </div>
                            <form id="edit-form-password" onsubmit="Auth.saveEditedPassword(event)" class="hidden space-y-2.5 pt-1">
                                <div>
                                    <label class="block text-[10px] font-bold text-white/70 mb-1">Password Baru (min 6 huruf)</label>
                                    <input type="password" id="modal-auth-pw-new" minlength="6" required placeholder="Masukkan password baru" class="w-full bg-black/60 border border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none">
                                </div>
                                <div>
                                    <label class="block text-[10px] font-bold text-white/70 mb-1">Konfirmasi Password Baru</label>
                                    <input type="password" id="modal-auth-pw-confirm" minlength="6" required placeholder="Ulangi password baru" class="w-full bg-black/60 border border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none">
                                </div>
                                <div class="flex justify-end gap-1.5 pt-1">
                                    <button type="button" onclick="Auth.toggleEditField('password')" class="px-3 py-1.5 rounded-lg bg-white/10 text-white/70 text-[10px] font-bold cursor-pointer">Batal</button>
                                    <button type="submit" id="btn-save-password" class="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black flex items-center gap-1 cursor-pointer">
                                        <i data-lucide="check" class="w-3 h-3"></i> Simpan Password
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                <!-- SECTION 5: WAKTU & KALENDER REAL-TIME -->
                <div class="p-5 rounded-3xl bg-[#12141c]/90 border border-white/10 backdrop-blur-xl shadow-xl space-y-3.5">
                    <div class="grid grid-cols-2 gap-3">
                        <!-- Kalender -->
                        <div class="p-3 rounded-2xl bg-black/40 border border-white/10">
                            <span class="text-[10px] font-bold uppercase tracking-wider text-white/50 block mb-1 flex items-center gap-1">
                                <i data-lucide="calendar" class="w-3 h-3 text-cyan-400"></i> Kalender
                            </span>
                            <p id="prof-card-live-date" class="text-xs sm:text-sm font-black text-white leading-tight">Memuat tanggal...</p>
                        </div>
                        <!-- Jam Real-Time -->
                        <div class="p-3 rounded-2xl bg-black/40 border border-white/10">
                            <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1 flex items-center gap-1">
                                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Jam HP LIVE
                            </span>
                            <p id="prof-card-live-time" class="text-xs sm:text-sm font-black text-white font-mono tracking-wider">00:00:00</p>
                        </div>
                    </div>
                </div>

                <!-- 7. Waktu Mundur Islami (Accordion Buka/Tutup) -->
                <div>
                    <button type="button" onclick="Auth.toggleIslamicCountdownPanel()" class="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/20 hover:border-emerald-500/40 text-white transition-all cursor-pointer backdrop-blur-xl shadow-sm select-none active:scale-[0.99]">
                        <div class="flex items-center gap-2.5">
                            <div class="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                                <i data-lucide="moon" class="w-4 h-4"></i>
                            </div>
                            <div class="text-left">
                                <span class="text-xs font-bold text-white block leading-tight">Waktu Mundur Islami</span>
                                <span class="text-[10px] text-white/50 leading-tight">Ramadhan, Idul Fitri, & Idul Adha</span>
                            </div>
                        </div>
                        <div class="flex items-center gap-1.5">
                            <span class="text-[11px] text-emerald-300 font-bold"></span>
                            <i id="islamic-panel-chevron" data-lucide="chevron-down" class="w-4 h-4 text-emerald-400 transition-transform duration-200"></i>
                        </div>
                    </button>

                    <div id="islamic-countdown-content" class="hidden p-3.5 mt-2 rounded-2xl bg-black/40 border border-emerald-500/25 space-y-3 backdrop-blur-xl shadow-sm transition-all duration-300">
                        <!-- Filter Chips Tabs -->
                        <div class="flex items-center gap-1.5 overflow-x-auto hide-scrollbar py-0.5 -mx-1 px-1">
                            <button onclick="IslamicClock.setTab('ramadhan')" class="prof-islamic-tab-btn px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 bg-white text-black shadow-md border border-white">
                                <i data-lucide="moon" class="w-3.5 h-3.5"></i>
                                <span>Ramadhan</span>
                            </button>
                            <button onclick="IslamicClock.setTab('idul_fitri')" class="prof-islamic-tab-btn px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 bg-white/[0.08] hover:bg-white/[0.14] text-white/80 border border-white/20">
                                <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
                                <span>Idul Fitri</span>
                            </button>
                            <button onclick="IslamicClock.setTab('idul_adha')" class="prof-islamic-tab-btn px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 bg-white/[0.08] hover:bg-white/[0.14] text-white/80 border border-white/20">
                                <i data-lucide="heart-handshake" class="w-3.5 h-3.5"></i>
                                <span>Idul Adha</span>
                            </button>
                        </div>

                        <!-- Countdown Area in Profile Card -->
                        <div id="prof-islamic-countdown-area" class="space-y-2 pt-1"></div>
                    </div>
                </div>

                <!-- Tombol Pengaturan Aplikasi & Akun -->
                <button type="button" onclick="if(typeof Profile !== 'undefined') Profile.openSettingsModal();" class="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/20 text-white transition-all cursor-pointer backdrop-blur-xl shadow-sm active:scale-[0.99]" title="Buka Pengaturan">
                    <div class="flex items-center gap-2.5">
                        <div class="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
                            <i data-lucide="settings" class="w-4 h-4"></i>
                        </div>
                        <div class="text-left">
                            <span class="text-xs font-bold text-white block">Pengaturan</span>
                            <span class="text-[10px] text-white/50 block">Preferensi & setelan aplikasi</span>
                        </div>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <i data-lucide="chevron-right" class="w-4 h-4 text-white/40"></i>
                    </div>
                </button>

                <!-- Footer: Bergabung Info + Tombol Hapus Akun & Keluar Akun -->
                <div class="pt-3 border-t border-white/10 space-y-3">
                    <div class="flex items-center justify-between text-xs text-white/50 px-1">
                        <span>Bergabung: ${joinDate}</span>
                        ${isVerified ? `<span class="text-purple-400 font-black text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30"></span>` : ''}
                    </div>
                    <div class="flex items-center justify-between gap-3 pt-1">
                        <button type="button" onclick="Auth.confirmDeleteAccount()" class="text-xs px-4 py-2.5 rounded-full bg-red-600/15 hover:bg-red-600/25 border border-red-500/35 text-red-400 hover:text-red-300 font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-sm" title="Hapus Akun Permanen">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5 text-red-400"></i>
                            <span>Hapus Akun</span>
                        </button>
                        <button type="button" onclick="Auth.closeUserProfileModal(); Auth.logout();" class="text-xs px-4 py-2.5 rounded-full bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-black flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-sm" title="Keluar Akun">
                            <i data-lucide="log-out" class="w-3.5 h-3.5"></i>
                            <span>Keluar Akun</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Start VIP Live Countdown if active and has expiration
        if (isUserVip && u.vipExpiresAt) {
            Auth.startVipCountdown(u.vipExpiresAt);
        }

        if (typeof IslamicClock !== 'undefined' && IslamicClock.init) {
            IslamicClock.init();
        }
        if (window.lucide) lucide.createIcons();

        // Async detect real client IP for profile card
        fetch('/api/user-auth?action=me', { cache: 'no-store' })
            .then(function(r){ return r.json(); })
            .then(function(d){
                if (d && (d.clientIp || d.ip || (d.user && d.user.ip))) {
                    var detectedIp = d.clientIp || d.ip || d.user.ip;
                    Auth.clientIp = detectedIp;
                    var ipEl = gid('prof-card-user-ip');
                    if (ipEl && ipEl.innerText !== detectedIp) {
                        ipEl.innerText = detectedIp;
                    }
                }
            })
            .catch(function(){});
    },

    closeUserProfileModal() {
        if (Auth._vipCountdownInterval) {
            clearInterval(Auth._vipCountdownInterval);
            Auth._vipCountdownInterval = null;
        }
        var m = gid('user-profile-modal');
        if (m) m.remove();
    },

    startVipCountdown(expiresAt) {
        if (Auth._vipCountdownInterval) {
            clearInterval(Auth._vipCountdownInterval);
            Auth._vipCountdownInterval = null;
        }
        var timerEl = gid('modal-vip-live-countdown');
        var badgeEl = gid('modal-vip-status-badge');
        if (!timerEl) return;

        if (!expiresAt) {
            timerEl.innerHTML = '<span class="text-amber-300 font-bold">Aktif Selamanya (Permanen)</span>';
            return;
        }

        var updateTimer = function() {
            var now = Date.now();
            var diff = expiresAt - now;

            if (diff <= 0) {
                timerEl.innerHTML = '<span class="text-rose-400 font-bold">Masa Aktif VIP Telah Habis</span>';
                if (badgeEl) {
                    badgeEl.innerText = 'KEDALUWARSA';
                    badgeEl.className = 'text-[9px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono';
                }
                if (Auth._vipCountdownInterval) {
                    clearInterval(Auth._vipCountdownInterval);
                    Auth._vipCountdownInterval = null;
                }
                return;
            }

            var totalSeconds = Math.floor(diff / 1000);
            var days = Math.floor(totalSeconds / 86400);
            var hours = Math.floor((totalSeconds % 86400) / 3600);
            var minutes = Math.floor((totalSeconds % 3600) / 60);
            var seconds = totalSeconds % 60;

            var parts = [];
            if (days > 0) parts.push(`<span class="text-amber-300 font-black text-base">${days}</span><span class="text-amber-400/80 text-xs font-semibold mr-1.5"> Hari</span>`);
            parts.push(`<span class="text-white font-black text-base">${String(hours).padStart(2, '0')}</span><span class="text-white/60 text-xs font-semibold mr-1.5"> Jam</span>`);
            parts.push(`<span class="text-white font-black text-base">${String(minutes).padStart(2, '0')}</span><span class="text-white/60 text-xs font-semibold mr-1.5"> Mnt</span>`);
            parts.push(`<span class="text-white font-black text-base">${String(seconds).padStart(2, '0')}</span><span class="text-white/60 text-xs font-semibold"> Dtk</span>`);

            timerEl.innerHTML = parts.join(' ');
        };

        updateTimer();
        Auth._vipCountdownInterval = setInterval(updateTimer, 1000);
    },

    confirmDeleteAccount() {
        var existing = gid('confirm-delete-account-modal');
        if (existing) existing.remove();

        var modal = document.createElement('div');
        modal.id = 'confirm-delete-account-modal';
        modal.className = 'fixed inset-0 z-[700] flex items-center justify-center p-4 animate-fadeIn';
        modal.innerHTML = `
            <div onclick="gid('confirm-delete-account-modal')?.remove()" class="fixed inset-0 bg-black/85 backdrop-blur-md"></div>
            <div class="relative z-10 w-full max-w-sm bg-[#141620] border border-red-500/40 rounded-3xl p-6 shadow-2xl shadow-red-950/50 text-center space-y-4">
                <div class="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
                    <i data-lucide="alert-triangle" class="w-7 h-7 text-red-400"></i>
                </div>
                <div>
                    <h3 class="text-white font-black text-lg">Hapus Akun Permanen?</h3>
                    <p class="text-white/70 text-xs mt-1 leading-relaxed">
                        Tindakan ini <strong class="text-red-400">tidak dapat dibatalkan</strong>. Semua data akun, username, dan sesi Anda akan dihapus permanen dari sistem.
                    </p>
                </div>
                <div class="flex gap-2.5 pt-2">
                    <button type="button" onclick="gid('confirm-delete-account-modal')?.remove()" class="flex-1 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs active:scale-95 transition cursor-pointer">
                        Batal
                    </button>
                    <button type="button" id="btn-do-delete-account" onclick="Auth.deleteAccount()" class="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition shadow-lg shadow-red-600/30 cursor-pointer">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                        <span>Ya, Hapus</span>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            try { window.lucide.createIcons(); } catch(e){}
        }
    },

    async deleteAccount() {
        var btn = gid('btn-do-delete-account');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>Menghapus...</span>';
        }

        try {
            var token = Auth.token || localStorage.getItem('musifystar_auth_token') || sessionStorage.getItem('musifystar_auth_token');
            var res = await fetch('/api/user-auth?action=delete_account', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                }
            });
            var data = await res.json();
            if (data && data.status) {
                gid('confirm-delete-account-modal')?.remove();
                gid('user-profile-modal')?.remove();
                await Auth.logout(false);
                showToast('Akun Anda berhasil dihapus permanen.');
                setTimeout(function() {
                    if (typeof Profile !== 'undefined' && Profile.render) Profile.render();
                }, 100);
            } else {
                showToast(data?.message || 'Gagal menghapus akun');
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = '<i data-lucide="trash-2" class="w-4 h-4"></i><span>Ya, Hapus</span>';
                    if (window.lucide) lucide.createIcons();
                }
            }
        } catch(e) {
            showToast('Terjadi kesalahan jaringan saat menghapus akun');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i data-lucide="trash-2" class="w-4 h-4"></i><span>Ya, Hapus</span>';
                if (window.lucide) lucide.createIcons();
            }
        }
    },

    toggleEditField(fieldName) {
        var credContent = gid('credentials-content');
        if (credContent && credContent.classList.contains('hidden')) {
            Auth.toggleCredentialsPanel();
        }
        var displayEl = gid('display-field-' + fieldName);
        var formEl = gid('edit-form-' + fieldName);
        if (!displayEl || !formEl) return;
        if (formEl.classList.contains('hidden')) {
            formEl.classList.remove('hidden');
            displayEl.classList.add('hidden');
            var input = formEl.querySelector('input');
            if (input) input.focus();
        } else {
            formEl.classList.add('hidden');
            displayEl.classList.remove('hidden');
        }
    },

    triggerGalleryUpload() {
        var input = gid('auth-gallery-file-input');
        if (input) {
            input.value = '';
            input.click();
        }
    },

    uploadAvatarFromGallery(event) {
        var file = event.target.files && event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showToast('Hanya file gambar dari galeri yang didukung');
            return;
        }

        var reader = new FileReader();
        reader.onload = function(e) {
            var img = new Image();
            img.onload = function() {
                var canvas = document.createElement('canvas');
                var size = 300;
                canvas.width = size;
                canvas.height = size;
                var ctx = canvas.getContext('2d');

                var minDim = Math.min(img.width, img.height);
                var sx = (img.width - minDim) / 2;
                var sy = (img.height - minDim) / 2;
                ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

                var base64Data = canvas.toDataURL('image/jpeg', 0.85);
                Auth.saveAvatar(base64Data);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    },

    async saveAvatar(base64Data) {
        if (!Auth.token) {
            showToast('Silakan login terlebih dahulu');
            return;
        }
        showToast('Menyimpan foto profil dari galeri...');
        try {
            var res = await fetch('/api/user-auth?action=update_profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + Auth.token
                },
                body: JSON.stringify({ avatar: base64Data })
            });
            var data = await res.json();
            if (data && data.status && data.user) {
                Auth.saveUser(data.user);
                showToast('Foto profil berhasil diubah!');
                Auth.updateHeaderUI();
                var avImg = gid('modal-user-avatar-img');
                if (avImg && data.user && data.user.avatar) {
                    avImg.src = data.user.avatar;
                } else if (!gid('user-profile-modal')) {
                    Auth.openUserProfileModal();
                }
            } else {
                showToast(data?.message || 'Gagal mengubah foto');
            }
        } catch(e) {
            showToast('Koneksi bermasalah saat upload');
        }
    },

    // Modal Katalog Avatars (Neon / Game / Anime dengan Tab Filter: Gratis vs VIP, Cowo vs Cewe)
    avatarActiveTab: 'all',     // 'all' | 'gratis' | 'vip'
    avatarSubFilter: 'all',     // 'all' | 'cowo' | 'cewe'

    async openAvatarPickerModal() {
        var existing = gid('avatar-picker-modal');
        if (existing) existing.remove();

        Auth.avatarActiveTab = 'gratis'; // Default ke tab Avatar Gratis
        Auth.avatarSubFilter = 'all';    // 'all' | 'cewe' | 'cowo'

        var modal = document.createElement('div');
        modal.id = 'avatar-picker-modal';
        modal.className = 'fixed inset-0 z-[700] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none';
        modal.innerHTML = `
            <div class="w-full max-w-md bg-[#13151f] border border-white/15 rounded-3xl shadow-2xl overflow-hidden relative flex flex-col max-h-[88vh]">
                <!-- Header -->
                <div class="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                    <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-2xl bg-[#ccff00]/15 border border-[#ccff00]/30 flex items-center justify-center text-[#ccff00] shrink-0">
                            <i data-lucide="palette" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <h2 class="text-base font-extrabold text-white tracking-tight leading-tight">Koleksi Avatar</h2>
                            <p class="text-[11px] text-white/50 leading-tight mt-0.5">Pilih avatar keren untuk profil Anda</p>
                        </div>
                    </div>
                    <button onclick="gid('avatar-picker-modal')?.remove()" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer">
                        <i data-lucide="x" class="w-4 h-4"></i>
                    </button>
                </div>

                <!-- DUA TAB UTAMA: AVATAR GRATIS VS AVATAR VIP -->
                <div class="px-4 pt-3 pb-2.5 bg-black/40 border-b border-white/10 space-y-2.5">
                    <div class="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-white/[0.04] border border-white/10 text-xs">
                        <button type="button" id="avtab-btn-gratis" onclick="Auth.setAvatarPickerTab('gratis')" 
                                class="py-2.5 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-sm">
                            <i data-lucide="sparkles" class="w-4 h-4 text-emerald-400"></i>
                            <span class="tracking-wide">Avatar Gratis</span>
                            <span class="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 font-semibold">Campur</span>
                        </button>
                        <button type="button" id="avtab-btn-vip" onclick="Auth.setAvatarPickerTab('vip')" 
                                class="py-2.5 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer text-white/60 hover:text-white hover:bg-white/5">
                            <i data-lucide="crown" class="w-4 h-4 text-amber-400"></i>
                            <span class="tracking-wide">Avatar VIP</span>
                            <span class="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-semibold">Cewe & Cowo</span>
                        </button>
                    </div>

                    <!-- SUB-FILTER KHUSUS TAB VIP (CEWEK VS COWOK) -->
                    <div id="av-subfilter-container" class="hidden flex items-center justify-between pt-0.5 px-1 animate-fade-in">
                        <span class="text-[10px] font-bold text-amber-300/80 uppercase tracking-wider flex items-center gap-1">
                            <i data-lucide="sparkle" class="w-3 h-3 text-amber-400"></i>
                            <span>Filter VIP:</span>
                        </span>
                        <div class="flex items-center gap-1.5 text-[11px]">
                            <button type="button" id="avsub-btn-all" onclick="Auth.setAvatarPickerSubFilter('all')" 
                                    class="py-1 px-3 rounded-full font-bold transition-all border border-amber-400/40 bg-amber-400/15 text-amber-300 cursor-pointer">
                                Semua
                            </button>
                            <button type="button" id="avsub-btn-cewe" onclick="Auth.setAvatarPickerSubFilter('cewe')" 
                                    class="py-1 px-3 rounded-full font-bold transition-all border border-white/10 bg-white/5 text-pink-300 hover:bg-pink-500/15 hover:border-pink-500/30 cursor-pointer flex items-center gap-1">
                                <span>Cewek</span>
                            </button>
                            <button type="button" id="avsub-btn-cowo" onclick="Auth.setAvatarPickerSubFilter('cowo')" 
                                    class="py-1 px-3 rounded-full font-bold transition-all border border-white/10 bg-white/5 text-sky-300 hover:bg-sky-500/15 hover:border-sky-500/30 cursor-pointer flex items-center gap-1">
                                <span>Cowok</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Body (List Avatars Grid) -->
                <div class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 hide-scrollbar">
                    <div id="avatar-catalog-grid" class="grid grid-cols-3 gap-3">
                        <div class="col-span-3 text-center py-8 text-white/40">
                            <i data-lucide="loader-2" class="w-6 h-6 animate-spin mx-auto text-[#ccff00] mb-2"></i>
                            <p class="text-xs">Memuat katalog avatar...</p>
                        </div>
                    </div>
                </div>

                <!-- Footer Action -->
                <div class="p-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-xs">
                    <span class="text-white/40 text-[11px]">Foto kustom? Gunakan tombol Custom</span>
                    <button type="button" onclick="gid('avatar-picker-modal')?.remove(); Auth.triggerGalleryUpload();" class="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white font-bold active:scale-95 transition-all cursor-pointer">
                        Upload Sendiri
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        if (window.lucide) lucide.createIcons();

        Auth.fetchAndRenderAvatarPicker();
    },

    async fetchAndRenderAvatarPicker() {
        var grid = gid('avatar-catalog-grid');
        if (!grid) return;

        try {
            var res = await fetch('/api/avatars');
            var data = await res.json();

            if (data && data.status && Array.isArray(data.avatars)) {
                Auth.cachedAvatarsList = data.avatars;
                Auth.renderFilteredAvatarGrid();
            } else {
                grid.innerHTML = '<div class="col-span-3 text-center py-6 text-white/40 text-xs">Belum ada koleksi avatar.</div>';
            }
        } catch(e) {
            if (grid) grid.innerHTML = '<div class="col-span-3 text-center py-6 text-red-400 text-xs">Gagal memuat katalog avatar.</div>';
        }
    },

    setAvatarPickerTab(tab) {
        Auth.avatarActiveTab = tab;
        var btnGratis = gid('avtab-btn-gratis');
        var btnVip = gid('avtab-btn-vip');
        var subContainer = gid('av-subfilter-container');

        var activeGratis = 'py-2.5 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-sm';
        var activeVip = 'py-2.5 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/50 text-amber-300 shadow-sm';
        var inactive = 'py-2.5 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer text-white/60 hover:text-white hover:bg-white/5';

        if (btnGratis) btnGratis.className = tab === 'gratis' ? activeGratis : inactive;
        if (btnVip) btnVip.className = tab === 'vip' ? activeVip : inactive;

        // Sub-filter Cewek vs Cowok hanya muncul saat tab VIP aktif
        if (subContainer) {
            if (tab === 'vip') {
                subContainer.classList.remove('hidden');
            } else {
                subContainer.classList.add('hidden');
            }
        }

        Auth.renderFilteredAvatarGrid();
    },

    setAvatarPickerSubFilter(sub) {
        Auth.avatarSubFilter = sub;
        var btnAll = gid('avsub-btn-all');
        var btnCewe = gid('avsub-btn-cewe');
        var btnCowo = gid('avsub-btn-cowo');

        var defClass = 'py-1 px-3 rounded-full font-bold transition-all border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 cursor-pointer';

        if (btnAll) btnAll.className = sub === 'all' ? 'py-1 px-3 rounded-full font-bold transition-all border border-amber-400/40 bg-amber-400/15 text-amber-300 cursor-pointer' : defClass;
        if (btnCewe) btnCewe.className = sub === 'cewe' ? 'py-1 px-3 rounded-full font-bold transition-all border border-pink-500/50 bg-pink-500/20 text-pink-300 cursor-pointer shadow-sm' : defClass;
        if (btnCowo) btnCowo.className = sub === 'cowo' ? 'py-1 px-3 rounded-full font-bold transition-all border border-sky-500/50 bg-sky-500/20 text-sky-300 cursor-pointer shadow-sm' : defClass;

        Auth.renderFilteredAvatarGrid();
    },

    renderFilteredAvatarGrid() {
        var grid = gid('avatar-catalog-grid');
        if (!grid) return;

        var list = Auth.cachedAvatarsList || [];
        var tab = Auth.avatarActiveTab || 'gratis';
        var sub = Auth.avatarSubFilter || 'all';

        // Filter 1: Gratis (Campur) vs VIP
        var filtered = list.filter(function(av) {
            if (tab === 'gratis') {
                return !av.isPremium || av.category === 'gratis';
            }
            if (tab === 'vip') {
                return !!av.isPremium || av.category === 'cowo' || av.category === 'cewe';
            }
            return true;
        });

        // Filter 2: Sub-filter Cewek vs Cowok (Hanya saat di Tab VIP)
        if (tab === 'vip' && sub !== 'all') {
            filtered = filtered.filter(function(av) {
                var cat = (av.category || '').toLowerCase().trim();
                if (sub === 'cewe') {
                    return cat === 'cewe';
                }
                if (sub === 'cowo') {
                    return cat === 'cowo';
                }
                return true;
            });
        }

        if (filtered.length === 0) {
            grid.innerHTML = `
            <div class="col-span-3 text-center py-10 px-4 space-y-2 text-white/40">
                <div class="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-white/30">
                    <i data-lucide="image-off" class="w-5 h-5"></i>
                </div>
                <p class="text-xs font-bold text-white/70">Koleksi Avatar Masih Kosong</p>
                <p class="text-[10.5px] text-white/40 max-w-xs mx-auto leading-relaxed">Admin belum menambahkan avatar ke kategori ini. Gunakan tombol 'Upload Sendiri' di bawah untuk memakai foto kustom Anda.</p>
            </div>`;
            if (window.lucide) lucide.createIcons();
            return;
        }

        var u = Auth.currentUser || {};
        var isTierActive = Boolean(u.vipTier && u.vipTier !== 'none');
        var isVipExpired = u.vipExpiresAt && Date.now() > u.vipExpiresAt;
        var isUserPremium = ((u.email || '').toLowerCase().trim() === 'jrnabil570@gmail.com') || (Boolean(u.isPremium || u.is_premium || isTierActive) && u.vipTier !== 'none' && !isVipExpired);
        var currentAvatar = u.avatar || '';

        grid.innerHTML = filtered.map(function(av) {
            var isSelected = currentAvatar === av.url;
            var locked = av.isPremium && !isUserPremium;

            return `
                <div onclick="Auth.selectAvatar('${encodeURIComponent(av.url)}', ${av.isPremium ? 'true' : 'false'}, '${av.id}')" 
                     class="group relative aspect-square rounded-2xl overflow-hidden border-2 cursor-pointer transition-all active:scale-95 flex flex-col items-center justify-center p-1 ${isSelected ? 'border-[#ccff00] bg-[#ccff00]/10 shadow-[0_0_15px_rgba(204,255,0,0.3)]' : 'border-white/10 hover:border-white/30 bg-white/[0.03]'}">
                    
                    <img src="${av.url}" class="w-full h-full object-cover rounded-xl bg-black/40 ${locked ? 'filter grayscale brightness-50' : ''}" alt="${av.name}" onerror="this.src='/logo.png'">
                    
                    ${av.isPremium ? `
                        <div class="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-amber-500/90 text-black font-extrabold text-[9px] flex items-center gap-0.5 shadow-md">
                            <i data-lucide="crown" class="w-2.5 h-2.5 fill-black"></i>
                            <span>VIP</span>
                        </div>
                    ` : ''}

                    ${av.category ? `
                        <div class="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold ${av.category === 'cewe' ? 'bg-pink-500/85 text-white' : (av.category === 'cowo' ? 'bg-sky-500/85 text-white' : 'bg-emerald-500/85 text-white')} shadow-sm">
                            ${av.category === 'cewe' ? 'Cewe' : (av.category === 'cowo' ? 'Cowo' : 'Gratis')}
                        </div>
                    ` : ''}

                    ${locked ? `
                        <div class="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-xl backdrop-blur-[1px]">
                            <div class="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 mb-1">
                                <i data-lucide="lock" class="w-4 h-4"></i>
                            </div>
                            <span class="text-[9px] font-bold text-red-300">Khusus VIP</span>
                        </div>
                    ` : ''}

                    ${isSelected ? `
                        <div class="absolute bottom-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-[#ccff00] text-black font-extrabold text-[9px] shadow-md flex items-center gap-1">
                            <i data-lucide="check" class="w-2.5 h-2.5"></i> Aktif
                        </div>
                    ` : `
                        <div class="absolute inset-x-0 bottom-0 p-1 bg-gradient-to-t from-black/80 to-transparent text-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span class="text-[9px] font-bold text-white truncate block">${av.name}</span>
                        </div>
                    `}
                </div>
            `;
        }).join('');
        if (window.lucide) lucide.createIcons();
    },

    async selectAvatar(encodedUrl, isPremium, avatarId) {
        var url = decodeURIComponent(encodedUrl);
        var u = Auth.currentUser || {};
        var isTierActive = Boolean(u.vipTier && u.vipTier !== 'none');
        var isVipExpired = u.vipExpiresAt && Date.now() > u.vipExpiresAt;
        var isUserPremium = ((u.email || '').toLowerCase().trim() === 'jrnabil570@gmail.com') || (Boolean(u.isPremium || u.is_premium || isTierActive) && u.vipTier !== 'none' && !isVipExpired);

        if (isPremium && !isUserPremium) {
            showToast('Avatar ini terkunci khusus pengguna Premium / VIP!');
            if (typeof Profile !== 'undefined' && Profile.openPaymentModal) {
                setTimeout(function() { Profile.openPaymentModal(); }, 1200);
            }
            return;
        }

        if (!Auth.token) {
            showToast('Silakan login terlebih dahulu');
            return;
        }

        showToast('Memasang avatar...');
        try {
            var res = await fetch('/api/user-auth?action=update_profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + Auth.token
                },
                body: JSON.stringify({ avatar: url })
            });
            var data = await res.json();
            if (data && data.status && data.user) {
                Auth.currentUser = data.user;
                if (localStorage.getItem('musifystar_auth_token')) {
                    localStorage.setItem('musifystar_auth_user', JSON.stringify(data.user));
                } else {
                    sessionStorage.setItem('musifystar_auth_user', JSON.stringify(data.user));
                }
                showToast('Avatar berhasil dipasang!');
                Auth.updateHeaderUI();
                var avImg = gid('modal-user-avatar-img');
                if (avImg && data.user && data.user.avatar) {
                    avImg.src = data.user.avatar;
                } else if (!gid('user-profile-modal')) {
                    Auth.openUserProfileModal();
                }
                var p = gid('avatar-picker-modal');
                if (p) p.remove();

                // Real-time broadcast to GlobalStats & GlobalChat
                try {
                    window.dispatchEvent(new CustomEvent('musifystar:user_border_updated', {
                        detail: {
                            border: Auth.currentUser.border,
                            borderUrl: Auth.currentUser.borderUrl,
                            borderName: Auth.currentUser.borderName,
                            user: Auth.currentUser
                        }
                    }));
                } catch(e) {}
                if (typeof GlobalStats !== 'undefined' && typeof GlobalStats.onUserBorderChanged === 'function') {
                    GlobalStats.onUserBorderChanged(Auth.currentUser.borderUrl, Auth.currentUser.borderName);
                }
                if (typeof GlobalChat !== 'undefined' && typeof GlobalChat.renderMessages === 'function') {
                    GlobalChat.renderMessages();
                }
            } else {
                showToast(data?.message || 'Gagal mengubah avatar');
            }
        } catch(e) {
            showToast('Koneksi bermasalah');
        }
    },

    // ==========================================
    // BORDER PROFIL PREMIUM PICKER MODAL (FOTO 2)
    // ==========================================
    borderActiveFilterTab: 'all',

    async openBorderPickerModal(defaultTab) {
        var u = Auth.currentUser || {};
        var adminTok = (typeof Profile !== 'undefined' && Profile.getAdminToken) ? Profile.getAdminToken() : (sessionStorage.getItem('musifystar_admin_token') || localStorage.getItem('musifystar_admin_token') || '');
        var myEmail = String(u.email || u.rawEmail || '').toLowerCase().trim();
        var myUsername = String(u.username || '').toLowerCase().trim();
        var isMasterAdmin = (myEmail === 'jrnabil570@gmail.com') || (myUsername === 'nabil');
        var isVipExpired = u.vipExpiresAt && Date.now() > u.vipExpiresAt;
        var isTierActive = Boolean(u.vipTier && u.vipTier !== 'none');
        var isUserVip = isMasterAdmin || ((Boolean(u.isPremium || u.is_premium || isTierActive)) && u.vipTier !== 'none' && !isVipExpired);
        var userVipTier = isMasterAdmin ? 'permanent' : (isUserVip ? (u.vipTier || 'permanent') : 'none');
        var avatarUrl = u.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(u.username || 'user')}`;
        var currentBorder = u.border || 'none';

        var existing = gid('border-picker-modal');
        if (existing) existing.remove();

        var borders = [
            {
                id: 'none',
                name: 'Tanpa Border',
                file: '',
                url: '',
                isVip: false,
                tier: 'Gratis',
                requiredTier: 'none',
                badge: 'Default',
                desc: 'Avatar standar polos melingkar tanpa bingkai tambahan.'
            },
            {
                id: 'border_platinum',
                name: 'Platinum',
                file: 'Platinum.png',
                url: '/borders/Platinum.png',
                isVip: true,
                tier: '1 Bulan+',
                requiredTier: '1month',
                badge: '1 Bulan+',
                desc: 'Bingkai Platinum naga api cyber. Terbuka untuk Paket 1 Bulan, 2 Bulan, 5 Bulan & Permanen.'
            },
            {
                id: 'border_master',
                name: 'Master',
                file: 'Master.png',
                url: '/borders/Master.png',
                isVip: true,
                tier: '1 Bulan+',
                requiredTier: '1month',
                badge: '1 Bulan+',
                desc: 'Bingkai Master mahkota emas membara. Terbuka untuk Paket 1 Bulan, 2 Bulan, 5 Bulan & Permanen.'
            },
            {
                id: 'border_legend',
                name: 'Legend',
                file: 'Legend.png',
                url: '/borders/Legend.png',
                isVip: true,
                tier: '2 Bulan+',
                requiredTier: '2months',
                badge: '2 Bulan+',
                desc: 'Sayap emas kemegahan kerajaan Legenda. Khusus Paket 2 Bulan, 5 Bulan & Permanen.'
            },
            {
                id: 'border_immortal',
                name: 'Immortal',
                file: 'Imortal.png',
                url: '/borders/Imortal.png',
                isVip: true,
                tier: '5 Bulan+',
                requiredTier: '5months',
                badge: '5 Bulan+',
                desc: 'Kasta tertinggi Immortal Mahkota Dewa Musik. Khusus Paket 5 Bulan & Permanen.'
            }
        ];

        // Fetch dynamic list of borders (default + newly added custom borders by Admin)
        try {
            var res = await fetch('/api/borders?t=' + Date.now());
            var data = await res.json();
            if (data && data.status && Array.isArray(data.borders) && data.borders.length > 0) {
                borders = data.borders;
            }
        } catch(e) {}
        Auth.availableBorders = borders;

        var selectedBorderObj = borders.find(function(b){ return b.id === currentBorder; }) || borders[0];

        var tierRankMap = { 'none': 0, '1month': 1, '2months': 2, '5months': 3, 'permanent': 4, 'lifetime': 4, 'sultan': 4 };
        var userRank = isMasterAdmin ? 4 : (tierRankMap[userVipTier] !== undefined ? tierRankMap[userVipTier] : (isUserVip ? 4 : 0));

        // Default tab: if user requested specific tab, or if user VIP is active and opened via VIP shortcut, or 'unlocked' / 'all'
        var initialTab = defaultTab || (isUserVip ? 'unlocked' : 'all');
        Auth.borderActiveFilterTab = initialTab;

        var modal = document.createElement('div');
        modal.id = 'border-picker-modal';
        modal.className = 'fixed inset-0 z-[700] flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-fade-in select-none';
        modal.innerHTML = `
            <div class="w-full max-w-md bg-[#13151f] border border-amber-400/40 rounded-3xl shadow-2xl overflow-hidden relative flex flex-col max-h-[92vh]">
                <!-- Header -->
                <div class="p-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-transparent shrink-0">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-black font-black shadow-md shadow-amber-500/30 shrink-0">
                            <i data-lucide="shield" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <div class="flex items-center gap-2">
                                <h2 class="text-base font-extrabold text-white tracking-tight leading-tight">Border Profil Premium</h2>
                                <span class="text-[9px] font-black px-2 py-0.5 rounded-full ${isUserVip ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black' : 'bg-white/10 text-white/50'} flex items-center gap-0.5">
                                    <i data-lucide="crown" class="w-2.5 h-2.5 ${isUserVip ? 'fill-black' : ''}"></i> ${isUserVip ? 'VIP AKTIF' : 'NON-VIP'}
                                </span>
                            </div>
                            <p class="text-[11px] text-white/50 leading-tight mt-0.5">Pilih kategori border profil eksklusif sesuai tingkatan VIP</p>
                        </div>
                    </div>
                    <button onclick="gid('border-picker-modal')?.remove()" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer">
                        <i data-lucide="x" class="w-4 h-4"></i>
                    </button>
                </div>

                <!-- Live Preview Section (Centered Avatar & Concentric Frame) -->
                <div class="p-3.5 bg-black/50 border-b border-white/10 flex flex-col items-center justify-center relative overflow-hidden shrink-0">
                    <div class="absolute inset-0 bg-radial from-amber-500/10 via-transparent to-transparent pointer-events-none"></div>
                    <div class="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center my-1">
                        <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-black/90 flex items-center justify-center shadow-inner z-0">
                            <img src="${avatarUrl}" class="w-full h-full object-cover rounded-full" alt="Preview Foto" onerror="this.src='/logo.png'">
                        </div>
                        <img id="border-picker-live-frame" src="${selectedBorderObj.url || ''}" class="${selectedBorderObj.url ? '' : 'hidden'} pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100px] h-[100px] sm:w-[124px] sm:h-[124px] max-w-none object-contain z-10 select-none drop-shadow-[0_0_18px_rgba(245,158,11,0.65)]" alt="Frame">
                    </div>
                    <div class="text-center mt-0.5">
                        <p id="border-picker-live-title" class="text-xs font-black text-white flex items-center justify-center gap-1.5">
                            <span>Border: ${selectedBorderObj.name}</span>
                            <span class="text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">${selectedBorderObj.badge || selectedBorderObj.tier}</span>
                        </p>
                        <p id="border-picker-live-desc" class="text-[10px] text-white/50 mt-0.5 max-w-xs truncate">${selectedBorderObj.desc}</p>
                    </div>
                </div>

                <!-- TAB PILIHAN SENDIRI: Border VIP Kebuka, Platinum, Master, Legend, Immortal, Semua -->
                <div class="px-3 pt-2.5 pb-2 bg-[#10121a] border-b border-white/10 shrink-0">
                    <div class="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-1 text-xs">
                        ${isUserVip ? `
                        <!-- TAB KHUSUS: BORDER VIP KEBUKA (Hanya muncul jika VIP aktif) -->
                        <button type="button" onclick="Auth.switchBorderCategoryTab('unlocked')" id="border-cat-tab-unlocked" class="px-3 py-1.5 rounded-xl font-extrabold text-[11px] whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${Auth.borderActiveFilterTab === 'unlocked' ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-amber-500/25' : 'bg-amber-400/10 text-amber-300 hover:bg-amber-400/20 border border-amber-400/30'}">
                            <i data-lucide="unlock" class="w-3.5 h-3.5"></i>
                            <span>Border VIP Kebuka</span>
                            <span class="text-[9px] px-1.5 py-0.2 rounded-full ${Auth.borderActiveFilterTab === 'unlocked' ? 'bg-black text-amber-300' : 'bg-amber-400 text-black'} font-black" id="badge-count-unlocked">0</span>
                        </button>
                        ` : ''}

                        <button type="button" onclick="Auth.switchBorderCategoryTab('all')" id="border-cat-tab-all" class="px-2.5 py-1.5 rounded-xl font-bold text-[11px] whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${Auth.borderActiveFilterTab === 'all' ? 'bg-white text-black font-extrabold' : 'bg-white/5 text-white/70 hover:bg-white/10'}">
                            <i data-lucide="layers" class="w-3 h-3"></i>
                            <span>Semua</span>
                        </button>

                        <button type="button" onclick="Auth.switchBorderCategoryTab('platinum')" id="border-cat-tab-platinum" class="px-2.5 py-1.5 rounded-xl font-bold text-[11px] whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${Auth.borderActiveFilterTab === 'platinum' ? 'bg-sky-400 text-black font-extrabold' : 'bg-sky-400/10 text-sky-300 hover:bg-sky-400/20 border border-sky-400/20'}">
                            <span class="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                            <span>Platinum</span>
                        </button>

                        <button type="button" onclick="Auth.switchBorderCategoryTab('master')" id="border-cat-tab-master" class="px-2.5 py-1.5 rounded-xl font-bold text-[11px] whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${Auth.borderActiveFilterTab === 'master' ? 'bg-orange-400 text-black font-extrabold' : 'bg-orange-400/10 text-orange-300 hover:bg-orange-400/20 border border-orange-400/20'}">
                            <span class="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                            <span>Master</span>
                        </button>

                        <button type="button" onclick="Auth.switchBorderCategoryTab('legend')" id="border-cat-tab-legend" class="px-2.5 py-1.5 rounded-xl font-bold text-[11px] whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${Auth.borderActiveFilterTab === 'legend' ? 'bg-yellow-400 text-black font-extrabold' : 'bg-yellow-400/10 text-yellow-300 hover:bg-yellow-400/20 border border-yellow-400/20'}">
                            <span class="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                            <span>Legend</span>
                        </button>

                        <button type="button" onclick="Auth.switchBorderCategoryTab('immortal')" id="border-cat-tab-immortal" class="px-2.5 py-1.5 rounded-xl font-bold text-[11px] whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${Auth.borderActiveFilterTab === 'immortal' ? 'bg-pink-400 text-black font-extrabold' : 'bg-pink-400/10 text-pink-300 hover:bg-pink-400/20 border border-pink-400/20'}">
                            <span class="w-1.5 h-1.5 rounded-full bg-pink-400"></span>
                            <span>Immortal</span>
                        </button>
                    </div>
                </div>

                <!-- Scrollable Border List Cards Container (Dynamically Populated) -->
                <div id="border-picker-cards-container" class="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-2.5 hide-scrollbar">
                    <!-- Cards will be rendered by Auth.renderBorderCardsList() -->
                </div>

                <!-- Footer Call to Action (Beli VIP) -->
                <div class="p-3.5 sm:p-4 border-t border-white/10 bg-gradient-to-t from-black via-black/80 to-transparent flex items-center justify-between gap-3 shrink-0">
                    <div class="min-w-0">
                        <span class="text-xs font-black text-amber-300 block truncate flex items-center gap-1">
                            <i data-lucide="crown" class="w-3.5 h-3.5 text-amber-400"></i> ${isUserVip ? 'Status: VIP Aktif' : 'Upgrade Membership VIP'}
                        </span>
                        <span class="text-[10px] text-white/50 block truncate">1 Bln: Platinum & Master • 2 Bln: + Legend • 5 Bln: + Immortal • Permanen: Bebas Semua</span>
                    </div>
                    <button type="button" onclick="gid('border-picker-modal')?.remove(); if (typeof Profile !== 'undefined') Profile.openVipPackagesModal();" class="shrink-0 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-500 hover:to-yellow-500 text-black font-extrabold text-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                        <i data-lucide="${isUserVip ? 'sparkles' : 'crown'}" class="w-3.5 h-3.5 fill-black"></i>
                        <span>${isUserVip ? 'Kelola VIP' : 'Beli VIP'}</span>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        Auth.renderBorderCardsList();
        if (window.lucide) lucide.createIcons();
    },

    switchBorderCategoryTab(tab) {
        Auth.borderActiveFilterTab = tab;
        var u = Auth.currentUser || {};
        var adminTok = (typeof Profile !== 'undefined' && Profile.getAdminToken) ? Profile.getAdminToken() : (sessionStorage.getItem('musifystar_admin_token') || localStorage.getItem('musifystar_admin_token') || '');
        var myEmail = String(u.email || u.rawEmail || '').toLowerCase().trim();
        var myUsername = String(u.username || '').toLowerCase().trim();
        var isMasterAdmin = (myEmail === 'jrnabil570@gmail.com') || (myUsername === 'nabil');
        var isVipExpired = u.vipExpiresAt && Date.now() > u.vipExpiresAt;
        var isTierActive = Boolean(u.vipTier && u.vipTier !== 'none');
        var isUserVip = isMasterAdmin || ((Boolean(u.isPremium || u.is_premium || isTierActive)) && u.vipTier !== 'none' && !isVipExpired);

        var allTabs = ['unlocked', 'all', 'platinum', 'master', 'legend', 'immortal'];
        allTabs.forEach(function(t) {
            var btn = gid('border-cat-tab-' + t);
            if (!btn) return;
            var isCurrent = (t === tab);
            if (t === 'unlocked') {
                btn.className = `px-3 py-1.5 rounded-xl font-extrabold text-[11px] whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${isCurrent ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-amber-500/25' : 'bg-amber-400/10 text-amber-300 hover:bg-amber-400/20 border border-amber-400/30'}`;
                var badge = gid('badge-count-unlocked');
                if (badge) {
                    badge.className = `text-[9px] px-1.5 py-0.2 rounded-full ${isCurrent ? 'bg-black text-amber-300' : 'bg-amber-400 text-black'} font-black`;
                }
            } else if (t === 'all') {
                btn.className = `px-2.5 py-1.5 rounded-xl font-bold text-[11px] whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${isCurrent ? 'bg-white text-black font-extrabold' : 'bg-white/5 text-white/70 hover:bg-white/10'}`;
            } else if (t === 'platinum') {
                btn.className = `px-2.5 py-1.5 rounded-xl font-bold text-[11px] whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${isCurrent ? 'bg-sky-400 text-black font-extrabold' : 'bg-sky-400/10 text-sky-300 hover:bg-sky-400/20 border border-sky-400/20'}`;
            } else if (t === 'master') {
                btn.className = `px-2.5 py-1.5 rounded-xl font-bold text-[11px] whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${isCurrent ? 'bg-orange-400 text-black font-extrabold' : 'bg-orange-400/10 text-orange-300 hover:bg-orange-400/20 border border-orange-400/20'}`;
            } else if (t === 'legend') {
                btn.className = `px-2.5 py-1.5 rounded-xl font-bold text-[11px] whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${isCurrent ? 'bg-yellow-400 text-black font-extrabold' : 'bg-yellow-400/10 text-yellow-300 hover:bg-yellow-400/20 border border-yellow-400/20'}`;
            } else if (t === 'immortal') {
                btn.className = `px-2.5 py-1.5 rounded-xl font-bold text-[11px] whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${isCurrent ? 'bg-pink-400 text-black font-extrabold' : 'bg-pink-400/10 text-pink-300 hover:bg-pink-400/20 border border-pink-400/20'}`;
            }
        });

        Auth.renderBorderCardsList();
    },

    renderBorderCardsList() {
        var container = gid('border-picker-cards-container');
        if (!container) return;

        var u = Auth.currentUser || {};
        var adminTok = (typeof Profile !== 'undefined' && Profile.getAdminToken) ? Profile.getAdminToken() : (sessionStorage.getItem('musifystar_admin_token') || localStorage.getItem('musifystar_admin_token') || '');
        var myEmail = String(u.email || u.rawEmail || '').toLowerCase().trim();
        var myUsername = String(u.username || '').toLowerCase().trim();
        var isMasterAdmin = (myEmail === 'jrnabil570@gmail.com') || (myUsername === 'nabil');
        var isVipExpired = u.vipExpiresAt && Date.now() > u.vipExpiresAt;
        var isTierActive = Boolean(u.vipTier && u.vipTier !== 'none');
        var isUserVip = isMasterAdmin || ((Boolean(u.isPremium || u.is_premium || isTierActive)) && u.vipTier !== 'none' && !isVipExpired);
        var userVipTier = isMasterAdmin ? 'permanent' : (isUserVip ? (u.vipTier || 'permanent') : 'none');
        var avatarUrl = u.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(u.username || 'user')}`;
        var currentBorder = u.border || 'none';

        var tierRankMap = { 'none': 0, '1month': 1, '2months': 2, '5months': 3, 'permanent': 4, 'lifetime': 4, 'sultan': 4 };
        var userRank = isMasterAdmin ? 4 : (tierRankMap[userVipTier] !== undefined ? tierRankMap[userVipTier] : (isUserVip ? 4 : 0));

        var borders = Auth.availableBorders || [];
        var tab = Auth.borderActiveFilterTab || (isUserVip ? 'unlocked' : 'all');

        // Helper check whether a border is unlocked for the current user
        var isBorderUnlocked = function(b) {
            if (!b.isVip) return true; // gratis/none
            if (isMasterAdmin) return true;
            if (!isUserVip) return false;
            var reqRank = tierRankMap[b.requiredTier] !== undefined ? tierRankMap[b.requiredTier] : 1;
            return userRank >= reqRank;
        };

        // Update count badge for unlocked borders
        var unlockedCount = borders.filter(function(b) { return b.isVip && isBorderUnlocked(b); }).length;
        var unlockedBadge = gid('badge-count-unlocked');
        if (unlockedBadge) unlockedBadge.innerText = unlockedCount;

        // Filter borders based on active tab
        var filtered = borders.filter(function(b) {
            if (tab === 'unlocked') {
                return isBorderUnlocked(b);
            }
            if (tab === 'platinum') {
                var bName = String(b.name || '').toLowerCase();
                var bId = String(b.id || '').toLowerCase();
                var bCat = String(b.category || '').toLowerCase();
                return bCat === 'platinum' || bId.includes('platinum') || bName.includes('platinum');
            }
            if (tab === 'master') {
                var bName = String(b.name || '').toLowerCase();
                var bId = String(b.id || '').toLowerCase();
                var bCat = String(b.category || '').toLowerCase();
                return bCat === 'master' || bId.includes('master') || bName.includes('master');
            }
            if (tab === 'legend') {
                var bName = String(b.name || '').toLowerCase();
                var bId = String(b.id || '').toLowerCase();
                var bCat = String(b.category || '').toLowerCase();
                return bCat === 'legend' || bId.includes('legend') || bName.includes('legend') || b.requiredTier === '2months';
            }
            if (tab === 'immortal') {
                var bName = String(b.name || '').toLowerCase();
                var bId = String(b.id || '').toLowerCase();
                var bCat = String(b.category || '').toLowerCase();
                return bCat === 'immortal' || bId.includes('immortal') || bId.includes('imortal') || bName.includes('immortal') || b.requiredTier === '5months';
            }
            return true; // 'all'
        });

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12 px-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                    <div class="w-12 h-12 rounded-2xl bg-white/5 mx-auto flex items-center justify-center text-white/40">
                        <i data-lucide="shield-off" class="w-6 h-6"></i>
                    </div>
                    <p class="text-xs font-bold text-white/70">Tidak ada border profil di tab ini</p>
                    <p class="text-[10px] text-white/40">Coba pilih tab kategori lain atau tambah border baru dari menu Admin.</p>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
            return;
        }

        container.innerHTML = filtered.map(function(b) {
            var isSelected = currentBorder === b.id;
            var isLocked = false;
            var reqRank = tierRankMap[b.requiredTier] !== undefined ? tierRankMap[b.requiredTier] : 1;
            var lockBadge = b.badge || 'VIP';

            if (b.isVip && !isMasterAdmin) {
                if (!isUserVip) {
                    isLocked = true;
                    lockBadge = 'Khusus VIP';
                } else if (userRank < reqRank) {
                    isLocked = true;
                    lockBadge = b.badge || (b.requiredTier === '5months' ? '5 Bulan+' : (b.requiredTier === '2months' ? '2 Bulan+' : 'Permanen'));
                }
            }

            return `
            <div onclick="Auth.previewOrEquipBorder('${b.id}')" 
                 class="p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 group active:scale-[0.98] ${isSelected ? 'bg-amber-500/15 border-amber-400/60 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/10 hover:border-white/25'}">
                <div class="flex items-center gap-3 min-w-0">
                    <!-- Border Thumbnail with centered overlay -->
                    <div class="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0 flex items-center justify-center">
                        <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/70 overflow-hidden z-0">
                            <img src="${avatarUrl}" class="w-full h-full object-cover ${isLocked ? 'filter grayscale brightness-50' : ''}" onerror="this.src='/logo.png'">
                        </div>
                        ${b.url ? `
                            <img src="${b.url}" class="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[56px] h-[56px] sm:w-[62px] sm:h-[62px] max-w-none object-contain z-10 select-none ${isLocked ? 'filter grayscale brightness-75' : ''}">
                        ` : ''}
                    </div>
                    <div class="min-w-0">
                        <div class="flex items-center gap-1.5 flex-wrap">
                            <h4 class="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">${b.name}</h4>
                            <span class="text-[9px] font-extrabold px-1.5 py-0.2 rounded-md ${b.isVip ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'bg-white/10 text-white/60'} font-mono">${b.badge || b.tier}</span>
                            ${b.isCustom ? `<span class="text-[8px] font-bold px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">Baru</span>` : ''}
                            ${!isLocked && b.isVip ? `<span class="text-[8px] font-black px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono flex items-center gap-0.5"><i data-lucide="unlock" class="w-2.5 h-2.5"></i> Terbuka</span>` : ''}
                        </div>
                        <p class="text-[10px] text-white/50 truncate mt-0.5">${b.desc}</p>
                    </div>
                </div>

                <div class="shrink-0 flex items-center gap-2">
                    ${isLocked ? `
                        <button type="button" onclick="event.stopPropagation(); Auth.previewOrEquipBorder('${b.id}')" class="px-2.5 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer shadow-sm">
                            <i data-lucide="lock" class="w-3 h-3 text-red-400"></i>
                            <span>${lockBadge}</span>
                        </button>
                    ` : (isSelected ? `
                        <span class="px-2.5 py-1.5 rounded-xl bg-amber-400 text-black text-[10px] font-black flex items-center gap-1 shadow-md shadow-amber-400/30">
                            <i data-lucide="check" class="w-3 h-3 stroke-[3]"></i> Aktif
                        </span>
                    ` : `
                        <button type="button" onclick="event.stopPropagation(); Auth.previewOrEquipBorder('${b.id}')" class="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-amber-400 hover:text-black border border-white/20 hover:border-amber-400 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm">
                            <span>Gunakan</span>
                        </button>
                    `)}
                </div>
            </div>
            `;
        }).join('');

        if (window.lucide) lucide.createIcons();
    },

    async previewOrEquipBorder(borderId) {
        var u = Auth.currentUser || {};
        var adminTok = (typeof Profile !== 'undefined' && Profile.getAdminToken) ? Profile.getAdminToken() : (sessionStorage.getItem('musifystar_admin_token') || localStorage.getItem('musifystar_admin_token') || '');
        var myEmail = String(u.email || u.rawEmail || '').toLowerCase().trim();
        var myUsername = String(u.username || '').toLowerCase().trim();
        var isMasterAdmin = (myEmail === 'jrnabil570@gmail.com') || (myUsername === 'nabil');
        var isVipExpired = u.vipExpiresAt && Date.now() > u.vipExpiresAt;
        var isTierActive = Boolean(u.vipTier && u.vipTier !== 'none');
        var isUserVip = isMasterAdmin || ((Boolean(u.isPremium || u.is_premium || isTierActive)) && u.vipTier !== 'none' && !isVipExpired);
        var userVipTier = isMasterAdmin ? 'permanent' : (isUserVip ? (u.vipTier || 'permanent') : 'none');

        var allBorders = Auth.availableBorders || [];
        var target = allBorders.find(function(b) { return b.id === borderId; });
        if (!target) {
            var bordersDict = {
                'none': { name: 'Tanpa Border', url: '', isVip: false, requiredTier: 'none', tier: 'Gratis', badge: 'Default', desc: 'Avatar standar polos melingkar' },
                'border_platinum': { name: 'Platinum', url: '/borders/Platinum.png', isVip: true, requiredTier: '1month', tier: '1 Bulan+', badge: '1 Bulan+', desc: 'Frame Platinum naga api cyber' },
                'border_master': { name: 'Master', url: '/borders/Master.png', isVip: true, requiredTier: '1month', tier: '1 Bulan+', badge: '1 Bulan+', desc: 'Frame Master mahkota emas membara' },
                'border_legend': { name: 'Legend', url: '/borders/Legend.png', isVip: true, requiredTier: '2months', tier: '2 Bulan+', badge: '2 Bulan+', desc: 'Sayap emas kemegahan Legenda' },
                'border_immortal': { name: 'Immortal', url: '/borders/Imortal.png', isVip: true, requiredTier: '5months', tier: '5 Bulan+', badge: '5 Bulan+', desc: 'Kasta tertinggi Immortal Mahkota Dewa' }
            };
            target = bordersDict[borderId] || bordersDict['none'];
        }

        // Update live preview in modal
        var liveFrame = gid('border-picker-live-frame');
        var liveTitle = gid('border-picker-live-title');
        var liveDesc = gid('border-picker-live-desc');
        if (liveFrame) {
            if (target.url) {
                liveFrame.src = target.url;
                liveFrame.classList.remove('hidden');
            } else {
                liveFrame.src = '';
                liveFrame.classList.add('hidden');
            }
        }
        if (liveTitle) {
            liveTitle.innerHTML = `<span>Border: ${target.name}</span><span class="text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">${target.badge || target.tier}</span>`;
        }
        if (liveDesc) {
            liveDesc.innerText = target.desc;
        }

        // Cek jika butuh VIP dan user belum memenuhi tingkatan
        var tierRankMap = { 'none': 0, '1month': 1, '2months': 2, '5months': 3, 'permanent': 4, 'lifetime': 4, 'sultan': 4 };
        var userRank = isMasterAdmin ? 4 : (tierRankMap[userVipTier] !== undefined ? tierRankMap[userVipTier] : (isUserVip ? 4 : 0));
        var reqRank = tierRankMap[target.requiredTier] !== undefined ? tierRankMap[target.requiredTier] : 1;

        if (target.isVip && !isMasterAdmin) {
            if (!isUserVip) {
                if (typeof showToast === 'function') {
                    showToast(`Border ${target.name} khusus Member VIP! Buka paket VIP Anda sekarang.`);
                }
                if (typeof Profile !== 'undefined' && Profile.openVipPackagesModal) {
                    setTimeout(function() {
                        gid('border-picker-modal')?.remove();
                        Profile.openVipPackagesModal();
                    }, 400);
                }
                return;
            } else if (userRank < reqRank) {
                if (typeof showToast === 'function') {
                    showToast(`Border ${target.name} memerlukan Paket VIP ${target.tier || target.badge || 'lebih tinggi'}!`);
                }
                if (typeof Profile !== 'undefined' && Profile.openVipPackagesModal) {
                    var targetPkg = target.requiredTier === '5months' ? 'pkg_5months' : (target.requiredTier === '2months' ? 'pkg_2months' : 'pkg_permanent');
                    setTimeout(function() {
                        gid('border-picker-modal')?.remove();
                        Profile.openVipPackagesModal(targetPkg);
                    }, 400);
                }
                return;
            }
        }

        if (typeof showToast === 'function') showToast(`Memasang border ${target.name}...`);

        var success = false;
        var updatedData = null;

        // Try primary /api/borders?action=equip
        try {
            var headers = {
                'Content-Type': 'application/json'
            };
            if (Auth.token) headers['Authorization'] = 'Bearer ' + Auth.token;
            if (adminTok) headers['x-admin-token'] = adminTok;

            var res = await fetch('/api/borders?action=equip', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    borderId: borderId,
                    userId: u.id,
                    username: u.username,
                    email: u.email || u.rawEmail,
                    adminToken: adminTok
                })
            });
            var data = await res.json();
            if (data && data.status) {
                success = true;
                updatedData = data;
            }
        } catch(e) {}

        // Fallback: If not equipped yet, use update_profile
        if (!success) {
            try {
                var res2 = await fetch('/api/user-auth?action=update_profile', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + (Auth.token || '')
                    },
                    body: JSON.stringify({ border: borderId })
                });
                var data2 = await res2.json();
                if (data2 && data2.status) {
                    success = true;
                    updatedData = data2;
                }
            } catch(e) {}
        }

        // Apply changes
        if (success) {
            Auth.currentUser.border = borderId === 'none' ? '' : borderId;
            Auth.currentUser.borderUrl = target.url || '';
            Auth.currentUser.borderName = target.name || '';
            if (typeof Auth.saveUser === 'function') {
                Auth.saveUser(Auth.currentUser);
            } else {
                try {
                    if (localStorage.getItem('musifystar_auth_token')) {
                        localStorage.setItem('musifystar_auth_user', JSON.stringify(Auth.currentUser));
                    } else {
                        sessionStorage.setItem('musifystar_auth_user', JSON.stringify(Auth.currentUser));
                    }
                } catch(e) {}
            }
            Auth.updateHeaderUI();

            // Update UI di User Profile Modal secara langsung tanpa scroll reset
            var borderImg = gid('modal-user-border-img');
            if (borderImg) {
                if (target.url) {
                    borderImg.src = target.url;
                    borderImg.classList.remove('hidden');
                } else {
                    borderImg.src = '';
                    borderImg.classList.add('hidden');
                }
            }
            var badgeWrapper = gid('modal-current-border-badge');
            var nameTxt = gid('modal-border-name-text');
            if (badgeWrapper && nameTxt) {
                if (target.url) {
                    nameTxt.innerText = target.name;
                    badgeWrapper.classList.remove('hidden');
                } else {
                    badgeWrapper.classList.add('hidden');
                }
            }

            if (typeof showToast === 'function') {
                showToast(target.id === 'none' ? 'Border profil dilepas, menggunakan avatar standar.' : `Border ${target.name} berhasil dipasang ke profil Anda!`);
            }
            gid('border-picker-modal')?.remove();

            // Real-time Event Broadcast: Notify GlobalStats & GlobalChat
            try {
                window.dispatchEvent(new CustomEvent('musifystar:user_border_updated', {
                    detail: {
                        border: Auth.currentUser.border,
                        borderUrl: Auth.currentUser.borderUrl,
                        borderName: Auth.currentUser.borderName,
                        user: Auth.currentUser
                    }
                }));
            } catch(e) {}
            if (typeof GlobalStats !== 'undefined' && typeof GlobalStats.onUserBorderChanged === 'function') {
                GlobalStats.onUserBorderChanged(Auth.currentUser.borderUrl, Auth.currentUser.borderName);
            }
            if (typeof GlobalChat !== 'undefined' && typeof GlobalChat.renderMessages === 'function') {
                GlobalChat.renderMessages();
            }
        } else {
            // Even if offline/network error, for admin enable optimistic equip
            if (isMasterAdmin) {
                Auth.currentUser.border = borderId === 'none' ? '' : borderId;
                Auth.currentUser.borderUrl = target.url || '';
                Auth.currentUser.borderName = target.name || '';
                if (typeof Auth.saveUser === 'function') {
                    Auth.saveUser(Auth.currentUser);
                } else {
                    try {
                        if (localStorage.getItem('musifystar_auth_token')) {
                            localStorage.setItem('musifystar_auth_user', JSON.stringify(Auth.currentUser));
                        } else {
                            sessionStorage.setItem('musifystar_auth_user', JSON.stringify(Auth.currentUser));
                        }
                    } catch(e) {}
                }
                Auth.updateHeaderUI();
                var borderImg2 = gid('modal-user-border-img');
                if (borderImg2) {
                    if (target.url) { borderImg2.src = target.url; borderImg2.classList.remove('hidden'); }
                    else { borderImg2.src = ''; borderImg2.classList.add('hidden'); }
                }
                if (typeof showToast === 'function') showToast(`Border ${target.name} berhasil dipasang (Mode Admin)!`);
                gid('border-picker-modal')?.remove();

                // Real-time Event Broadcast (Admin Mode)
                try {
                    window.dispatchEvent(new CustomEvent('musifystar:user_border_updated', {
                        detail: {
                            border: Auth.currentUser.border,
                            borderUrl: Auth.currentUser.borderUrl,
                            borderName: Auth.currentUser.borderName,
                            user: Auth.currentUser
                        }
                    }));
                } catch(e) {}
                if (typeof GlobalStats !== 'undefined' && typeof GlobalStats.onUserBorderChanged === 'function') {
                    GlobalStats.onUserBorderChanged(Auth.currentUser.borderUrl, Auth.currentUser.borderName);
                }
                if (typeof GlobalChat !== 'undefined' && typeof GlobalChat.renderMessages === 'function') {
                    GlobalChat.renderMessages();
                }
            } else {
                if (typeof showToast === 'function') showToast('Gagal memasang border. Pastikan Anda sudah login.');
            }
        }
    },

    // ==============================================================
    // RANK BADGE CUSTOMISATION MODAL & SELECTION SYSTEM
    // ==============================================================
    async openRankBadgeCustomizationModal() {
        var u = Auth.currentUser || {};
        var myEmail = String(u.email || u.rawEmail || '').toLowerCase().trim();
        var myUsername = String(u.username || '').toLowerCase().trim();
        var isMasterAdmin = (myEmail === 'jrnabil570@gmail.com') || (myUsername === 'nabil');
        var isVipExpired = u.vipExpiresAt && Date.now() > u.vipExpiresAt;
        var isTierActive = Boolean(u.vipTier && u.vipTier !== 'none');
        var isUserVip = isMasterAdmin || ((Boolean(u.isPremium || u.is_premium || isTierActive)) && u.vipTier !== 'none' && !isVipExpired);

        // Fetch listening duration & rank from global stats / analytics
        var listeningSeconds = 0;
        var myRank = 999;
        try {
            var res = await fetch('/api/global-stats?timeframe=all&t=' + Date.now());
            var data = await res.json();
            if (data && Array.isArray(data.leaderboard)) {
                var found = data.leaderboard.find(function(item) {
                    return (item.id && String(item.id) === String(u.id)) ||
                           (item.username && item.username.toLowerCase() === myUsername);
                });
                if (found) {
                    listeningSeconds = found.listeningSeconds || 0;
                    myRank = found.rank || 999;
                }
            }
        } catch(e) {}

        var listeningHours = (listeningSeconds / 3600).toFixed(1);

        // Helper format durasi bersih: Jika >= 1 Hari, tampilkan "X Hari" saja
        function formatBadgeDurationLabel(secs) {
            var days = Math.floor(secs / 86400);
            var hours = Math.floor(secs / 3600);
            if (days >= 1) {
                return days === 1 ? '1 Hari' : (secs % 86400 === 0 ? days + ' Hari' : (hours / 24).toFixed(1) + ' Hari');
            }
            return hours + ' Jam';
        }

        // Define Progressive Rank Badges (Locked/Unlocked based on Listening Duration)
        var badgeList = [
            {
                id: 'badge_none',
                title: 'Tanpa Badge',
                icon: '🚫',
                color: '#94a3b8',
                reqHours: 0,
                reqLabel: 'Default',
                desc: 'Tidak menampilkan badge lencana di samping nama.',
                unlocked: true
            },
            {
                id: 'badge_bronze',
                title: 'Bronze Listener',
                icon: '🥉',
                color: '#cd7f32',
                reqHours: 1,
                reqSeconds: 3600,
                reqLabel: '1 Jam',
                desc: 'Mencapai 1 Jam total memutar musik di MusifyStar.',
                unlocked: listeningSeconds >= 3600
            },
            {
                id: 'badge_silver',
                title: 'Silver Listener',
                icon: '🥈',
                color: '#cbd5e1',
                reqHours: 5,
                reqSeconds: 18000,
                reqLabel: '5 Jam',
                desc: 'Mencapai 5 Jam total memutar musik.',
                unlocked: listeningSeconds >= 18000
            },
            {
                id: 'badge_gold',
                title: 'Gold Listener',
                icon: '🥇',
                color: '#eab308',
                reqHours: 15,
                reqSeconds: 54000,
                reqLabel: '15 Jam',
                desc: 'Mencapai 15 Jam total memutar musik.',
                unlocked: listeningSeconds >= 54000
            },
            {
                id: 'badge_platinum',
                title: 'Platinum Listener',
                icon: '🌟',
                color: '#38bdf8',
                reqHours: 24,
                reqSeconds: 86400,
                reqLabel: '1 Hari',
                desc: 'Mencapai 1 Hari (24 Jam) total memutar musik.',
                unlocked: listeningSeconds >= 86400
            },
            {
                id: 'badge_master',
                title: 'Master Listener',
                icon: '👑',
                color: '#f59e0b',
                reqHours: 60,
                reqSeconds: 216000,
                reqLabel: '2.5 Hari',
                desc: 'Mencapai 2.5 Hari (60 Jam) total memutar musik.',
                unlocked: listeningSeconds >= 216000
            },
            {
                id: 'badge_legend',
                title: 'Legend Listener',
                icon: '⚡',
                color: '#a855f7',
                reqHours: 120,
                reqSeconds: 432000,
                reqLabel: '5 Hari',
                desc: 'Mencapai 5 Hari (120 Jam) total memutar musik.',
                unlocked: listeningSeconds >= 432000
            },
            {
                id: 'badge_immortal',
                title: 'Immortal Listener',
                icon: '💎',
                color: '#ec4899',
                reqHours: 240,
                reqSeconds: 864000,
                reqLabel: '10 Hari',
                desc: 'Mencapai 10 Hari (240 Jam) total memutar musik.',
                unlocked: listeningSeconds >= 864000
            },
            {
                id: 'badge_mythic',
                title: 'Mythic Cosmic',
                icon: '🌌',
                color: '#3b82f6',
                reqHours: 480,
                reqSeconds: 1728000,
                reqLabel: '20 Hari',
                desc: 'Mencapai 20 Hari (480 Jam) total memutar musik!',
                unlocked: listeningSeconds >= 1728000
            },
            {
                id: 'badge_vip_sultan',
                title: 'VIP Sultan Member',
                icon: '👑 VIP',
                color: '#facc15',
                reqHours: 0,
                reqLabel: 'VIP Active',
                specialReq: 'Memerlukan Akun VIP Aktif',
                desc: 'Lencana Mahkota Emas Sultan khusus Pengguna VIP.',
                unlocked: isUserVip
            },
            {
                id: 'badge_top_champion',
                title: '#1 Global Champion',
                icon: '🥇 #1',
                color: '#ffd700',
                reqHours: 0,
                reqLabel: '#1 Global',
                specialReq: 'Mencapai Juara 1 Global Stats',
                desc: 'Lencana Mahkota Mahakarya Juara 1 Global Stats.',
                unlocked: myRank === 1 || isMasterAdmin
            },
            {
                id: 'badge_verified',
                title: 'Verified Official',
                icon: '✓ Verified',
                color: '#38bdf8',
                reqHours: 0,
                reqLabel: 'Verified',
                specialReq: 'Akun Pengembang Resmi',
                desc: 'Lencana verifikasi resmi MusifyStar Developer.',
                unlocked: isMasterAdmin
            }
        ];

        // Find next locked tier threshold for progress bar
        var nextLocked = badgeList.find(function(b) { return !b.unlocked && b.reqSeconds > 0; });
        var targetSec = nextLocked ? nextLocked.reqSeconds : 1800000;
        var progressPct = Math.min(100, Math.round((listeningSeconds / targetSec) * 100));

        var currentEquipped = u.equippedBadge || 'badge_none';

        var existing = gid('rank-badge-modal');
        if (existing) existing.remove();

        var modal = document.createElement('div');
        modal.id = 'rank-badge-modal';
        modal.className = 'fixed inset-0 z-[750] flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-fade-in select-none';
        modal.innerHTML = `
            <div class="w-full max-w-md bg-[#13151f] border border-sky-400/40 rounded-3xl shadow-2xl overflow-hidden relative flex flex-col max-h-[92vh]">
                <!-- Header (Exact match with user screenshot) -->
                <div class="p-4 border-b border-white/10 bg-gradient-to-r from-sky-500/15 via-blue-500/10 to-transparent flex items-center justify-between shrink-0">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center text-white font-black shadow-md shadow-sky-500/30 shrink-0">
                            <i data-lucide="award" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <h2 class="text-base font-extrabold text-white tracking-tight leading-tight">Rank Badge Customisation</h2>
                            <p class="text-[11px] text-white/50 leading-tight mt-0.5">Showcase an unlocked badge on your profile</p>
                        </div>
                    </div>
                    <button onclick="gid('rank-badge-modal')?.remove()" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer">
                        <i data-lucide="x" class="w-4 h-4"></i>
                    </button>
                </div>

                <!-- Banner Explanation Notice -->
                <div class="p-3 bg-sky-500/10 border-b border-sky-500/20 px-4 text-[11px] text-sky-200 leading-relaxed shrink-0 flex items-start gap-2">
                    <i data-lucide="info" class="w-4 h-4 text-sky-400 shrink-0 mt-0.5"></i>
                    <span>Selecting a badge only displays it next to your name and does not change your rank or stats. Badges unlock automatically as your listening time increases!</span>
                </div>

                <!-- User Listening Time & Progress Bar -->
                <div class="p-3.5 bg-black/40 border-b border-white/10 space-y-2 shrink-0">
                    <div class="flex items-center justify-between text-xs font-bold">
                        <span class="text-white/70 flex items-center gap-1">
                            <i data-lucide="clock" class="w-3.5 h-3.5 text-sky-400"></i> Total Durasi Mendengarkan:
                        </span>
                        <span class="text-sky-300 font-mono">${formatBadgeDurationLabel(listeningSeconds)} (${Number(listeningSeconds).toLocaleString('id-ID')} Detik)</span>
                    </div>
                    ${nextLocked ? `
                    <div>
                        <div class="flex justify-between text-[10px] text-white/50 mb-1">
                            <span>Target berikutnya: <strong class="text-white">${nextLocked.title} (${nextLocked.reqLabel || (nextLocked.reqHours + ' Jam')})</strong></span>
                            <span>${progressPct}% (${formatBadgeDurationLabel(listeningSeconds)} / ${nextLocked.reqLabel || (nextLocked.reqHours + ' Jam')})</span>
                        </div>
                        <div class="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                            <div class="h-full bg-gradient-to-r from-sky-400 to-blue-500 transition-all duration-500" style="width: ${progressPct}%"></div>
                        </div>
                    </div>
                    ` : `
                    <div class="text-[11px] text-amber-300 font-bold flex items-center gap-1">
                        <i data-lucide="sparkles" class="w-3.5 h-3.5"></i> Selamat! Anda telah membuka SEMUA tingkat lencana durasi listening!
                    </div>
                    `}
                </div>

                <!-- Scrollable Badge List -->
                <div class="flex-1 overflow-y-auto p-4 space-y-2.5 hide-scrollbar">
                    ${badgeList.map(function(badge) {
                        var isSelected = (currentEquipped === badge.id);
                        return `
                        <div onclick="${badge.unlocked ? `Auth.equipRankBadge('${badge.id}', '${badge.title}', '${badge.icon}', '${badge.color}')` : ''}"
                             class="p-3.5 rounded-2xl border transition-all flex items-center justify-between ${badge.unlocked ? 'cursor-pointer hover:border-sky-400/50 active:scale-[0.99]' : 'opacity-60 bg-white/[0.02] border-white/5 select-none'} ${isSelected ? 'bg-sky-500/15 border-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.2)]' : 'bg-[#181a24] border-white/10'}">
                            
                            <div class="flex items-center gap-3 min-w-0 pr-2">
                                <div class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 border" style="background: rgba(255,255,255,0.05); border-color: ${badge.color}; color: ${badge.color}">
                                    ${badge.icon}
                                </div>
                                <div class="min-w-0">
                                    <div class="flex items-center gap-2 flex-wrap">
                                        <h4 class="text-xs sm:text-sm font-black text-white leading-tight">${Profile.escapeHtml(badge.title)}</h4>
                                        ${badge.reqLabel ? `<span class="text-[9.5px] px-1.5 py-0.2 rounded font-mono font-bold bg-white/10 text-white/70">${badge.reqLabel}</span>` : ''}
                                        ${isSelected ? `<span class="text-[9px] px-2 py-0.5 rounded-full font-black bg-sky-400 text-black">TERPASANG</span>` : ''}
                                    </div>
                                    <p class="text-[11px] text-white/50 mt-0.5 leading-tight">${Profile.escapeHtml(badge.desc)}</p>
                                    ${!badge.unlocked ? `
                                    <p class="text-[10px] text-amber-400 font-semibold mt-1 flex items-center gap-1">
                                        <i data-lucide="lock" class="w-3 h-3"></i> Terkunci • ${badge.specialReq || `Butuh ${badge.reqLabel} mendengarkan musik`}
                                    </p>
                                    ` : ''}
                                </div>
                            </div>

                            <div class="shrink-0">
                                ${badge.unlocked ? `
                                <button type="button" class="px-3 py-1.5 rounded-xl ${isSelected ? 'bg-sky-400 text-black' : 'bg-white/10 text-white hover:bg-sky-400 hover:text-black'} text-xs font-bold transition-all shadow-sm">
                                    ${isSelected ? 'Dipakai' : 'Gunakan'}
                                </button>
                                ` : `
                                <i data-lucide="lock" class="w-4 h-4 text-white/30"></i>
                                `}
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        if (window.lucide) lucide.createIcons();
    },

    async equipRankBadge(badgeId, title, icon, color) {
        if (!Auth.token) {
            if (typeof showToast === 'function') showToast('Silakan login terlebih dahulu');
            return;
        }

        if (typeof showToast === 'function') showToast('Memasang lencana...');
        try {
            var res = await fetch('/api/user-auth?action=update_profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + Auth.token
                },
                body: JSON.stringify({
                    equippedBadge: badgeId === 'badge_none' ? '' : badgeId,
                    equippedBadgeTitle: badgeId === 'badge_none' ? '' : title,
                    equippedBadgeIcon: badgeId === 'badge_none' ? '' : icon,
                    equippedBadgeColor: badgeId === 'badge_none' ? '' : color
                })
            });
            var data = await res.json();
            if (data && data.status && data.user) {
                Auth.currentUser = data.user;
                if (typeof Auth.saveUser === 'function') Auth.saveUser(data.user);
                if (typeof showToast === 'function') {
                    showToast(badgeId === 'badge_none' ? 'Lencana dilepas.' : `Lencana ${title} berhasil dipasang!`);
                }
                gid('rank-badge-modal')?.remove();
                Auth.updateHeaderUI();
                if (gid('user-profile-modal')) Auth.openUserProfileModal();

                // Broadcast event to GlobalStats and GlobalChat
                try {
                    window.dispatchEvent(new CustomEvent('musifystar:user_badge_updated', {
                        detail: { user: Auth.currentUser }
                    }));
                    window.dispatchEvent(new CustomEvent('musifystar:user_profile_updated', {
                        detail: { user: Auth.currentUser }
                    }));
                } catch(e) {}
                if (typeof GlobalStats !== 'undefined') {
                    if (typeof GlobalStats.onUserProfileUpdated === 'function') GlobalStats.onUserProfileUpdated(Auth.currentUser);
                    if (typeof GlobalStats.renderCurrentTab === 'function') GlobalStats.renderCurrentTab();
                }
            } else {
                if (typeof showToast === 'function') showToast(data?.message || 'Gagal mengubah lencana');
            }
        } catch(e) {
            if (typeof showToast === 'function') showToast('Koneksi bermasalah');
        }
    },

    async saveEditedUsername(e) {
        if (e && e.preventDefault) e.preventDefault();
        var newUsername = (gid('input-edit-username')?.value || '').trim();
        if (!newUsername || newUsername.length < 3) {
            showToast('Username minimal 3 karakter');
            return;
        }

        var btn = gid('btn-save-username');
        if (btn) btn.disabled = true;

        try {
            var res = await fetch('/api/user-auth?action=update_profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + Auth.token
                },
                body: JSON.stringify({ username: newUsername })
            });
            var data = await res.json();
            if (data && data.status && data.user) {
                Auth.saveUser(data.user);
                showToast('Username berhasil diperbarui!');
                Auth.updateHeaderUI();
                Auth.openUserProfileModal();

                // Dispatch real-time broadcast to GlobalStats & GlobalChat
                try {
                    window.dispatchEvent(new CustomEvent('musifystar:user_profile_updated', {
                        detail: { user: Auth.currentUser }
                    }));
                } catch(e) {}
                if (typeof GlobalStats !== 'undefined' && typeof GlobalStats.onUserProfileUpdated === 'function') {
                    GlobalStats.onUserProfileUpdated(Auth.currentUser);
                }
            } else {
                showToast(data?.message || 'Gagal mengubah username');
            }
        } catch(err) {
            showToast('Koneksi bermasalah');
        }
    },

    async saveEditedEmail(e) {
        if (e && e.preventDefault) e.preventDefault();
        var newEmail = (gid('input-edit-email')?.value || '').trim();
        if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
            showToast('Format email tidak valid');
            return;
        }

        var btn = gid('btn-save-email');
        if (btn) btn.disabled = true;

        try {
            var res = await fetch('/api/user-auth?action=update_profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + Auth.token
                },
                body: JSON.stringify({ email: newEmail })
            });
            var data = await res.json();
            if (data && data.status && data.user) {
                Auth.currentUser = data.user;
                if (localStorage.getItem('musifystar_auth_token')) {
                    localStorage.setItem('musifystar_auth_user', JSON.stringify(data.user));
                } else {
                    sessionStorage.setItem('musifystar_auth_user', JSON.stringify(data.user));
                }
                showToast('Email berhasil diperbarui!');
                Auth.updateHeaderUI();
                Auth.openUserProfileModal();

                try {
                    window.dispatchEvent(new CustomEvent('musifystar:user_profile_updated', {
                        detail: { user: Auth.currentUser }
                    }));
                } catch(e) {}
            } else {
                showToast(data?.message || 'Gagal mengubah email');
            }
        } catch(err) {
            showToast('Koneksi bermasalah');
        }
    },

    async saveEditedPassword(e) {
        if (e && e.preventDefault) e.preventDefault();
        var newPw = (gid('modal-auth-pw-new')?.value || '').trim();
        var confirmPw = (gid('modal-auth-pw-confirm')?.value || '').trim();

        if (newPw.length < 6) {
            showToast('Password minimal 6 karakter');
            return;
        }
        if (newPw !== confirmPw) {
            showToast('Konfirmasi password tidak cocok');
            return;
        }

        var btn = gid('btn-save-password');
        if (btn) btn.disabled = true;

        try {
            var res = await fetch('/api/user-auth?action=update_password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + Auth.token
                },
                body: JSON.stringify({ newPassword: newPw })
            });
            var data = await res.json();
            if (data && data.status) {
                showToast('Password berhasil diubah!');
                Auth.toggleEditField('password');
            } else {
                showToast(data?.message || 'Gagal mengubah password');
            }
        } catch(err) {
            showToast('Koneksi bermasalah');
        }
    },

    async handleLogin(e, prefix) {
        if (e && e.preventDefault) e.preventDefault();
        prefix = prefix || 'header-';
        var userInput = (gid(prefix + 'auth-login-username')?.value || '').trim();
        var email = (gid(prefix + 'auth-login-email')?.value || '').trim();
        var username = userInput;
        if (!email && userInput.includes('@')) {
            email = userInput;
        }
        var password = (gid(prefix + 'auth-login-password')?.value || '').trim();
        var remember = true;

        var btn = gid(prefix + 'auth-login-btn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Signing in...</span>';
            if (window.lucide && typeof window.lucide.createIcons === 'function') try{ window.lucide.createIcons(); }catch(err){}
        }

        try {
            var res = await fetch('/api/user-auth?action=login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username, email: email, password: password, rememberMe: remember })
            });
            var data = {};
            try {
                data = await res.json();
            } catch(e) {}

            if (data && (data.banned || (data.ban && data.ban.isBanned))) {
                var canonicalUsername = data.user?.username || username;
                var canonicalEmail = data.user?.rawEmail || data.user?.email || email;
                var canonicalUserId = data.user?.id || '';
                Auth.activeBannedUser = { username: canonicalUsername, email: canonicalEmail, userId: canonicalUserId };
                try {
                    localStorage.setItem('musifystar_active_ban', JSON.stringify({
                        ban: data.ban,
                        user: Auth.activeBannedUser,
                        timestamp: Date.now()
                    }));
                } catch(e) {}
                gid('header-auth-dropdown-wrapper')?.remove();
                Auth.showBanModal(data.ban);
            } else if (data && data.status && data.token) {
                try { localStorage.removeItem('musifystar_active_ban'); } catch(e) {}
                Auth.token = data.token;
                Auth.currentUser = data.user;
                if (remember) {
                    localStorage.setItem('musifystar_auth_token', data.token);
                    localStorage.setItem('musifystar_auth_user', JSON.stringify(data.user));
                    sessionStorage.removeItem('musifystar_auth_token');
                    sessionStorage.removeItem('musifystar_auth_user');
                } else {
                    sessionStorage.setItem('musifystar_auth_token', data.token);
                    sessionStorage.setItem('musifystar_auth_user', JSON.stringify(data.user));
                    localStorage.removeItem('musifystar_auth_token');
                    localStorage.removeItem('musifystar_auth_user');
                }
                showToast('Selamat datang, ' + data.user.username + '!');
                gid('header-auth-dropdown-wrapper')?.remove();
                Auth.updateHeaderUI();

                if (data.ban && (data.ban.isBanned || data.ban.isWarning)) {
                    Auth.showBanModal(data.ban);
                }
            } else {
                showToast(data?.message || 'Login gagal, periksa data Anda');
            }
        } catch (err) {
            showToast('Terjadi kesalahan jaringan');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<span>Sign in</span>';
                if (window.lucide && typeof window.lucide.createIcons === 'function') try{ window.lucide.createIcons(); }catch(err){}
            }
        }
    },

    async handleRegister(e, prefix) {
        if (e && e.preventDefault) e.preventDefault();
        prefix = prefix || 'header-';
        var username = (gid(prefix + 'auth-reg-username')?.value || '').trim();
        var email = (gid(prefix + 'auth-reg-email')?.value || '').trim();
        var password = (gid(prefix + 'auth-reg-password')?.value || '').trim();

        if (password.length < 6) {
            showToast('Password minimal 6 karakter/huruf');
            return;
        }

        var btn = gid(prefix + 'auth-reg-btn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Signing up...</span>';
            if (window.lucide && typeof window.lucide.createIcons === 'function') try{ window.lucide.createIcons(); }catch(err){}
        }

        try {
            var res = await fetch('/api/user-auth?action=register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username, email: email, password: password })
            });
            var data = await res.json();
            if (data && data.status && data.token) {
                Auth.token = data.token;
                Auth.currentUser = data.user;
                localStorage.setItem('musifystar_auth_token', data.token);
                localStorage.setItem('musifystar_auth_user', JSON.stringify(data.user));
                showToast('Pendaftaran berhasil! Selamat datang, ' + data.user.username);
                gid('header-auth-dropdown-wrapper')?.remove();
                Auth.updateHeaderUI();
            } else {
                showToast(data?.message || 'Pendaftaran gagal');
            }
        } catch (err) {
            showToast('Terjadi kesalahan koneksi');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<span>Sign up</span>';
                if (window.lucide && typeof window.lucide.createIcons === 'function') try{ window.lucide.createIcons(); }catch(err){}
            }
        }
    },

    initGoogleAuth() {
        if (typeof firebase !== 'undefined' && firebase.auth && !Auth.firebaseInitialized) {
            try {
                var config = {
                    apiKey: "AIzaSyCQdT8NJQPDxuatW7OZXiJz_qwwSPrr19E",
                    authDomain: "gen-lang-client-0523314981.firebaseapp.com",
                    projectId: "gen-lang-client-0523314981",
                    storageBucket: "gen-lang-client-0523314981.firebasestorage.app",
                    messagingSenderId: "82338615901",
                    appId: "1:82338615901:web:bc5eca9f4b9df83faa73b4"
                };
                if (!firebase.apps || !firebase.apps.length) {
                    firebase.initializeApp(config);
                }
                Auth.firebaseInitialized = true;
            } catch(e) {
                console.warn('Firebase init error:', e);
            }
        }
    },

    async handleGoogleLogin(prefix) {
        prefix = prefix || 'header-';
        window.musifyAuthInProgress = true;
        var btn = gid(prefix + 'auth-google-btn') || gid(prefix + 'auth-google-reg-btn');
        var oldHtml = btn ? btn.innerHTML : '';
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin text-slate-800"></i><span class="text-slate-800 font-bold">Menghubungkan ke Google...</span>';
            if (window.lucide && typeof window.lucide.createIcons === 'function') try{ window.lucide.createIcons(); }catch(e){}
        }

        try {
            var googleUser = null;

            // 1. Direct Google Identity Services (GIS) - Displays official "MusifyStar" branding
            if (typeof google !== 'undefined' && google.accounts && google.accounts.oauth2) {
                try {
                    googleUser = await new Promise(function(resolve, reject) {
                        var isResolved = false;
                        var tokenClient = google.accounts.oauth2.initTokenClient({
                            client_id: '82338615901-vejnqbindf7kni8fug8h69vkq883drj8.apps.googleusercontent.com',
                            scope: 'email profile openid',
                            callback: async function(tokenResponse) {
                                if (tokenResponse && tokenResponse.access_token) {
                                    isResolved = true;
                                    try {
                                        var infoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                                            headers: { Authorization: 'Bearer ' + tokenResponse.access_token }
                                        });
                                        var info = await infoRes.json();
                                        resolve({
                                            email: info.email,
                                            name: info.name,
                                            photoUrl: info.picture,
                                            googleId: info.sub,
                                            accessToken: tokenResponse.access_token
                                        });
                                    } catch(fetchErr) {
                                        reject(fetchErr);
                                    }
                                } else if (tokenResponse && tokenResponse.error) {
                                    isResolved = true;
                                    if (tokenResponse.error === 'popup_closed_by_user') {
                                        resolve(null);
                                    } else {
                                        reject(new Error(tokenResponse.error));
                                    }
                                }
                            },
                            error_callback: function(err) {
                                isResolved = true;
                                reject(err);
                            }
                        });
                        tokenClient.requestAccessToken({ prompt: 'select_account' });
                    });
                } catch(gisErr) {
                    console.warn('GIS Token client fallback to Firebase:', gisErr.message);
                }
            }

            // 2. Firebase Auth popup fallback
            if (!googleUser && typeof firebase !== 'undefined' && firebase.auth) {
                try {
                    Auth.initGoogleAuth();
                    var provider = new firebase.auth.GoogleAuthProvider();
                    provider.addScope('email');
                    provider.addScope('profile');
                    var result = await firebase.auth().signInWithPopup(provider);
                    if (result && result.user) {
                        var idToken = await result.user.getIdToken();
                        googleUser = {
                            email: result.user.email,
                            name: result.user.displayName,
                            photoUrl: result.user.photoURL,
                            googleId: result.user.uid,
                            idToken: idToken
                        };
                    }
                } catch(fbErr) {
                    console.warn('Firebase Auth popup error:', fbErr.message);
                    if (fbErr.code === 'auth/popup-closed-by-user' || fbErr.code === 'auth/cancelled-popup-request') {
                        if (btn) { btn.disabled = false; btn.innerHTML = oldHtml; }
                        return;
                    }
                }
            }

            if (!googleUser) {
                if (btn) { btn.disabled = false; btn.innerHTML = oldHtml; }
                return;
            }

            if (!googleUser.email) {
                throw new Error('Gagal mengambil informasi akun Google.');
            }

            // Send Google user details to backend to issue MusifyStar token
            var res = await fetch('/api/user-auth?action=google_login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(googleUser)
            });

            var data = await res.json();
            if (data && (data.banned || (data.ban && data.ban.isBanned))) {
                gid('header-auth-dropdown-wrapper')?.remove();
                Auth.showBanModal(data.ban);
            } else if (data && data.status && data.token) {
                try { localStorage.removeItem('musifystar_active_ban'); } catch(e) {}
                Auth.token = data.token;
                Auth.currentUser = data.user;
                localStorage.setItem('musifystar_auth_token', data.token);
                localStorage.setItem('musifystar_auth_user', JSON.stringify(data.user));
                sessionStorage.removeItem('musifystar_auth_token');
                sessionStorage.removeItem('musifystar_auth_user');

                showToast('Selamat datang, ' + data.user.username + '! (Login Google)');
                gid('header-auth-dropdown-wrapper')?.remove();
                Auth.updateHeaderUI();

                if (data.ban && (data.ban.isBanned || data.ban.isWarning)) {
                    Auth.showBanModal(data.ban);
                }
            } else {
                showToast(data?.message || 'Login dengan Google gagal');
            }
        } catch(err) {
            console.error('Google login error:', err);
            showToast(err.message || 'Terjadi kesalahan saat login Google');
        } finally {
            window.musifyAuthInProgress = false;
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = oldHtml;
                if (window.lucide && typeof window.lucide.createIcons === 'function') try{ window.lucide.createIcons(); }catch(err){}
            }
        }
    },

    async logout(notify = true) {
        if (Auth.token) {
            try {
                fetch('/api/user-auth?action=logout', {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + Auth.token }
                });
            } catch(e) {}
        }
        Auth.token = null;
        Auth.currentUser = null;
        localStorage.removeItem('musifystar_auth_token');
        localStorage.removeItem('musifystar_auth_user');
        sessionStorage.removeItem('musifystar_auth_token');
        sessionStorage.removeItem('musifystar_auth_user');
        try {
            sessionStorage.removeItem('musifystar_admin_token');
            localStorage.removeItem('musifystar_admin_token');
            localStorage.removeItem('musifystar_sent_chat_ids');
        } catch(e) {}
        if (typeof GlobalChat !== 'undefined' && typeof GlobalChat.close === 'function') {
            GlobalChat.close();
        }
        gid('header-auth-dropdown-wrapper')?.remove();
        Auth.updateHeaderUI();
        if (notify) showToast('Anda telah keluar dari akun');
    },

    showBanModal(ban) {
        if (!ban) return;
        var existing = gid('user-banned-banner-modal');
        if (existing) existing.remove();

        var isIpBanned = !!(ban.isIpBanned || ban.ipBanned);
        var isBanned = !!(ban.isBanned || isIpBanned);

        var titleText = isIpBanned ? 'ALAMAT IP DIBANNED' : (isBanned ? 'AKUN ANDA DIBANNED' : 'PERINGATAN DARI ADMIN');
        var iconClass = isIpBanned ? 'text-red-500 animate-pulse' : (isBanned ? 'text-rose-500 animate-pulse' : 'text-amber-400 animate-bounce');
        var iconName = isIpBanned ? 'wifi-off' : (isBanned ? 'shield-alert' : 'alert-triangle');
        var borderClass = isIpBanned ? 'border-red-600/70 shadow-red-600/40' : (isBanned ? 'border-rose-500/50 shadow-rose-500/30' : 'border-amber-500/50 shadow-amber-500/30');
        var badgeClass = isIpBanned ? 'bg-red-600/30 text-red-200 border-red-500/60' : (isBanned ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40');

        var banTypeLabel = isIpBanned ? 'BANNED IP ADDRESS (BLACKLIST)' : 'dibanned permanen';
        if (!isIpBanned) {
            if (ban.banType === 'temporary') {
                banTypeLabel = 'dibanned sementara';
            } else if (ban.banType === 'warning') {
                banTypeLabel = 'peringatan';
            }
        } else {
            if (ban.banType === 'temporary') {
                banTypeLabel = 'IP DIBANNED SEMENTARA';
            }
        }

        var durationInfo = '';
        if (ban.banDurationText) {
            durationInfo = `<p class="text-xs sm:text-sm font-bold text-amber-300 tracking-wide mt-1">DURASI DIBANNED : ${ban.banDurationText}</p>`;
        } else if (ban.banType === 'permanent' || isIpBanned) {
            durationInfo = `<p class="text-xs sm:text-sm font-bold text-rose-400 tracking-wide mt-1">DURASI DIBANNED : Permanen</p>`;
        }

        var expiresInfo = '';
        if (ban.banExpiresAt) {
            try {
                var expDate = new Date(ban.banExpiresAt);
                var dateStr = expDate.toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).replace(/\./g, ':');
                expiresInfo = `<p class="text-[11px] font-semibold text-white/70 mt-0.5">Berlaku ${dateStr} WIB</p>`;
            } catch(e){}
        }

        var ipNotice = isIpBanned && ban.ip ? `<p class="text-xs font-mono text-red-300 bg-black/50 py-1.5 px-3 rounded-lg border border-red-500/30 inline-block">🌐 Target IP: ${ban.ip}</p>` : '';

        var modal = document.createElement('div');
        modal.id = 'user-banned-banner-modal';
        modal.dataset.banCategory = isIpBanned ? 'ip' : 'account';
        modal.className = 'fixed inset-0 z-[999999] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 select-none pointer-events-auto';
        modal.innerHTML = `
            <div class="relative w-full max-w-md bg-[#12141c] border ${borderClass} rounded-3xl p-6 shadow-2xl text-center space-y-5 animate-scaleIn">
                <!-- Icon Glow -->
                <div class="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto shadow-inner">
                    <i data-lucide="${iconName}" class="w-9 h-9 ${iconClass}"></i>
                </div>

                <!-- Title & Status Badge -->
                <div class="space-y-2">
                    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border ${badgeClass}">
                        <span class="w-2 h-2 rounded-full ${isBanned ? 'bg-rose-500' : 'bg-amber-400'} animate-ping"></span>
                        <span>${banTypeLabel}</span>
                    </div>
                    <h2 class="text-xl sm:text-2xl font-black text-white tracking-tight">${titleText}</h2>
                    ${ipNotice}
                    ${durationInfo}
                    ${expiresInfo}
                </div>

                <!-- Message Card in Middle -->
                <div class="p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-left space-y-1.5 shadow-inner">
                    <span class="text-[10px] font-bold text-white/50 uppercase tracking-wider block">ALASAN DIBAN</span>
                    <p class="text-xs sm:text-sm text-white/90 leading-relaxed font-medium whitespace-pre-wrap">${ban.banReason || 'Jaringan / IP Address Anda telah dimasukkan ke dalam daftar hitam (blacklist) oleh admin.'}</p>
                </div>

                <div class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-300/80 leading-snug">
                    ${isIpBanned ? 'Akses jaringan dari IP Address ini diblokir total oleh server. Hubungi administrator jika Anda merasa ini kekeliruan.' : 'Akun ini dibanned oleh sistem dan tidak dapat dipulihkan, silahkan anda keluar dari akun ini thankyou'}
                </div>

                <!-- Action Buttons: Cek Status & Keluar Akun -->
                <div class="space-y-2">
                    <button onclick="Auth.checkBanStatusNow()" class="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-600 hover:to-sky-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer">
                        <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                        <span>${isIpBanned ? 'Cek Status IP' : 'Cek Status Akun'}</span>
                    </button>
                    ${!isIpBanned ? `<button onclick="Auth.logoutAndReload()" class="w-full py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/10 active:scale-95 transition-all cursor-pointer">
                        <i data-lucide="log-out" class="w-3.5 h-3.5"></i>
                        <span>LOGOUT AKUN</span>
                    </button>` : ''}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            try { window.lucide.createIcons(); } catch(e){}
        }

        // Auto polling check every 5 seconds while banner is visible
        if (window._banModalPollTimer) clearInterval(window._banModalPollTimer);
        window._banModalPollTimer = setInterval(function() {
            if (!gid('user-banned-banner-modal')) {
                clearInterval(window._banModalPollTimer);
                return;
            }
            Auth.checkBanStatusNow(true);
        }, 5000);
    },

    async checkBanStatusNow(silent = false) {
        try {
            var isExplicitlyUnbanned = false;
            var modal = gid('user-banned-banner-modal');
            var isIpBan = modal ? modal.dataset.banCategory === 'ip' : false;

            if (isIpBan) {
                // IP Ban check: query server to see if IP blacklist has been lifted
                var resIp = await fetch('/api/user-auth?action=me', { cache: 'no-store' });
                var dataIp = await resIp.json();
                if (dataIp && dataIp.status && !dataIp.ipBanned && (!dataIp.ban || !dataIp.ban.isIpBanned)) {
                    isExplicitlyUnbanned = true;
                }
            } else {
                // Account Ban check: ONLY check the account!
                var target = Auth.activeBannedUser || Auth.currentUser;
                var url = '/api/user-auth?action=check_account_ban';
                if (target) {
                    url += '&username=' + encodeURIComponent(target.username || '') +
                           '&userId=' + encodeURIComponent(target.userId || target.id || '') +
                           '&email=' + encodeURIComponent(target.rawEmail || target.email || '');
                }
                var headers = {};
                if (Auth.token) headers['Authorization'] = 'Bearer ' + Auth.token;
                var resBan = await fetch(url, { headers: headers, cache: 'no-store' });
                var dataBan = await resBan.json();
                if (dataBan && dataBan.status && dataBan.banned === false && dataBan.unbanned === true) {
                    isExplicitlyUnbanned = true;
                }
            }

            if (isExplicitlyUnbanned) {
                if (window._banModalPollTimer) clearInterval(window._banModalPollTimer);
                Auth.activeBannedUser = null;
                try { localStorage.removeItem('musifystar_active_ban'); } catch(e) {}
                if (modal) modal.remove();
                if (typeof showToast === 'function') {
                    showToast('Selamat! Blokir / Banned akun Anda telah dibuka oleh administrator.');
                }
                setTimeout(function() { window.location.reload(); }, 600);
            } else if (!silent) {
                if (typeof showToast === 'function') {
                    showToast('Status Anda masih dalam sanksi dibanned / blacklist.');
                }
            }
        } catch(e) {
            if (!silent && typeof showToast === 'function') {
                showToast('Gagal terhubung ke server');
            }
        }
    },

    logoutAndReload() {
        if (window._banModalPollTimer) clearInterval(window._banModalPollTimer);
        if (window._realtimeBanMonitorTimer) clearInterval(window._realtimeBanMonitorTimer);
        Auth.activeBannedUser = null;
        Auth.currentUser = null;
        Auth.token = null;
        try {
            localStorage.removeItem('musifystar_auth_token');
            localStorage.removeItem('musifystar_auth_user');
            sessionStorage.removeItem('musifystar_auth_token');
            sessionStorage.removeItem('musifystar_auth_user');
            localStorage.removeItem('musifystar_active_ban');
        } catch(e) {}
        var modal = gid('user-banned-banner-modal');
        if (modal) modal.remove();
        setTimeout(function() {
            window.location.reload();
        }, 50);
    }
};

window.Auth = Auth;
