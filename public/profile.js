// Global safe escape helpers
function esHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
if (typeof window !== 'undefined') window.esHtml = esHtml;

function esJs(t) {
    if (!t) return '';
    return String(t).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, ' ').replace(/\r/g, '');
}
if (typeof window !== 'undefined') window.esJs = esJs;

var Profile = {
    appVersion: 'v1.0.0',
    appReleaseName: 'MusifyStar Official',

    escapeHtml(str) {
        return esHtml(str);
    },
    escapeJs(t) {
        return esJs(t);
    },
    escapeAttr(str) {
        return esHtml(str);
    },

    async fetchAppVersion() {
        try {
            var res = await fetch('/api/version');
            var data = await res.json();
            if (data && data.status && data.version) {
                Profile.appVersion = data.version;
                Profile.appReleaseName = data.releaseName || 'MusifyStar Official';
                var vEl = gid('profile-app-version');
                if (vEl) vEl.innerText = data.version;
                var vBadge = gid('admin-version-tab-badge');
                if (vBadge) vBadge.innerText = data.version;
            }
        } catch (e) {}
    },

    render() {
        var el = gid('view-dev');
        if (!el) return;
        Profile.fetchAppVersion();

        var uAvatar = (window.Auth && Auth.currentUser && Auth.currentUser.avatar) ? Auth.currentUser.avatar : '/logo.png';
        var hasUser = !!(window.Auth && Auth.currentUser);
        var uBorderUrl = (window.Auth && typeof Auth.getBorderUrl === 'function') ? Auth.getBorderUrl(Auth.currentUser) : (Auth.currentUser?.borderUrl || '');
        var uIsVip = !!(Auth.currentUser?.isPremium || Auth.currentUser?.is_premium || ((Auth.currentUser?.email || '').toLowerCase().trim() === 'jrnabil570@gmail.com'));
        if (Auth.currentUser?.vipExpiresAt && Date.now() > Auth.currentUser.vipExpiresAt) uIsVip = false;

        el.innerHTML = `
        <div class="pt-8 pb-3.5 px-4 sticky top-0 z-30 border-b border-white/10 shadow-2xl transition-all" style="background: linear-gradient(180deg, rgba(13, 15, 22, 0.88) 0%, rgba(13, 15, 22, 0.97) 100%), url('/banner.png') center/cover no-repeat; backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);">
            <div class="flex items-center">
                <h1 class="text-3xl font-black text-white tracking-tight drop-shadow-md">Developer</h1>
            </div>
        </div>
        <div class="pt-6 px-4 text-center">
            <div class="relative w-20 h-20 rounded-full mx-auto mb-3 glass-strong shine-sweep flex items-center justify-center overflow-hidden shadow-black/50">
                <i data-lucide="music" class="w-10 h-10 text-white/60 absolute"></i>
                <img src="/logo.png" class="absolute inset-0 w-full h-full object-cover" onerror="this.style.display='none'" />
            </div>
            <div class="flex items-center justify-center gap-2 mb-1">
                <h2 class="text-2xl font-black chrome-text tracking-tight">MusifyStar</h2>
                <span class="inline-flex items-center justify-center shrink-0 cursor-default select-none" title="Akun & Aplikasi Terverifikasi Resmi">
                    <svg class="w-5 h-5 drop-shadow-[0_2px_8px_rgba(56,189,248,0.55)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" fill="url(#musify_verified_blue_grad)"/>
                        <path d="M7.8 12.2L10.8 15.2L16.2 9.2" stroke="white" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>
                        <defs>
                            <linearGradient id="musify_verified_blue_grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                                <stop stop-color="#38bdf8"/>
                                <stop offset="1" stop-color="#0284c7"/>
                            </linearGradient>
                        </defs>
                    </svg>
                </span>
            </div>
            <p class="text-[#b3b3b3] text-xs mb-6">Nikmati Streaming Musik Dengan Lirik</p>

            <div class="glass rounded-2xl p-5 max-w-sm mx-auto space-y-3 text-left mb-6">
                <h3 class="text-white font-bold text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
                    <i data-lucide="smartphone" class="w-4 h-4 text-rose-400"></i> Informasi & Aplikasi MusifyStar
                </h3>
                <div class="flex justify-between"><span class="text-white/70 text-sm">Nama</span><span class="text-white font-medium text-sm">MusifyStar</span></div>
                <div class="flex justify-between"><span class="text-white/70 text-sm">Versi</span><span id="profile-app-version" class="text-white font-medium text-sm">${Profile.appVersion || 'v1.0.0'}</span></div>
                <div class="flex justify-between"><span class="text-white/70 text-sm">Mode Offline APK</span><span class="text-emerald-400 font-bold text-sm flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Aktif</span></div>
                <div class="flex justify-between"><span class="text-white/70 text-sm">Service Worker</span><span class="text-white font-medium text-sm">${'serviceWorker' in navigator ? 'Terdaftar' : 'Tidak didukung'}</span></div>
                <div class="pt-2 border-t border-white/10 flex items-center justify-between">
                    <span class="text-white/70 text-xs">Cache APK tersimpan</span>
                    <button onclick="if(typeof clearPwaCache==='function') clearPwaCache();" class="text-xs text-rose-400 hover:text-rose-300 font-semibold underline active:scale-95">Bersihkan Cache</button>
                </div>
            </div>

            <div class="glass rounded-2xl p-5 max-w-sm mx-auto space-y-4 text-left mb-6">
                <h3 class="text-white font-bold text-sm uppercase tracking-wider mb-2 border-b border-white/10 pb-2 flex items-center gap-2">
                    <i data-lucide="code" class="w-4 h-4 text-rose-400"></i> Developer Profile
                </h3>
                <div onclick="Profile.openAdminModal()" class="flex justify-between items-center cursor-pointer active:opacity-75 transition-opacity" title="Developed by MusifyStar StudioMusik">
                    <span class="text-white/70 text-sm font-medium">Developed by</span>
                    <div class="flex items-center gap-2">
                        <img src="/dev.png" class="w-6 h-6 rounded-full object-cover border border-white/10" referrerPolicy="no-referrer" onerror="this.src='/logo.png'" />
                        <span class="text-white font-bold text-sm">MusifyStar StudioMusik</span>
                    </div>
                </div>

                <div class="pt-1">
                    <div class="text-xs font-semibold text-white/60 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                        <i data-lucide="heart" class="w-3.5 h-3.5 text-red-400 fill-current"></i> Lagu Yang Disukai
                    </div>
                    <p class="text-sm font-medium text-white/90 bg-white/5 p-2.5 rounded-xl border border-white/5">Bawa Dia Kembali | MAHALINI</p>
                </div>

                <div>
                    <div class="text-xs font-semibold text-white/60 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                        <i data-lucide="disc" class="w-3.5 h-3.5 text-purple-400"></i> Playlist Yang Disukai
                    </div>
                    <p class="text-sm font-medium text-white/90 bg-white/5 p-2.5 rounded-xl border border-white/5">Semua album Piche Kota</p>
                </div>

                <div>
                    <div class="text-xs font-semibold text-white/60 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                        <i data-lucide="user" class="w-3.5 h-3.5 text-sky-400"></i> Developer Pembuat
                    </div>
                    <p class="text-sm font-medium text-white/90 bg-white/5 p-2.5 rounded-xl border border-white/5">Nabil Assihidiqi</p>
                </div>

                <!-- Fitur Import Playlist Spotify & YouTube -->
                <div class="pt-2 border-t border-white/10 space-y-2">
                    <button type="button" onclick="Profile.openSpotifyImportModal()" class="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500/15 via-emerald-600/10 to-transparent hover:from-emerald-500/25 border border-emerald-500/30 text-white font-semibold text-xs flex items-center justify-between group active:scale-95 transition-all shadow-md cursor-pointer" title="Import Playlist dari Spotify">
                        <span class="flex items-center gap-2">
                            <svg class="w-4 h-4 text-emerald-400 fill-current shrink-0" viewBox="0 0 24 24">
                                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.503 17.31c-.22.358-.688.473-1.047.253-2.868-1.753-6.48-2.15-10.732-1.178-.403.092-.812-.162-.904-.565-.092-.403.162-.812.565-.904 4.655-1.064 8.63-.615 11.865 1.347.359.22.474.689.253 1.047zm1.467-3.268c-.276.448-.865.592-1.313.316-3.282-2.017-8.286-2.602-12.169-1.423-.506.154-1.04-.132-1.194-.638-.154-.506.132-1.04.638-1.194 4.433-1.346 9.957-.7 13.722 1.614.448.277.592.866.316 1.325zm.126-3.41c-3.937-2.338-10.435-2.553-14.217-1.405-.62.188-1.272-.166-1.46-.786-.188-.62.166-1.272.786-1.46 4.337-1.316 11.51-1.065 16.03 1.618.558.332.742 1.05.41 1.608-.332.558-1.05.742-1.608.41z"/>
                            </svg>
                            <span>Import from Spotify</span>
                        </span>
                        <i data-lucide="chevron-right" class="w-4 h-4 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all"></i>
                    </button>

                    <button type="button" onclick="Profile.openYoutubeImportModal()" class="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-red-500/15 via-rose-600/10 to-transparent hover:from-red-500/25 border border-red-500/30 text-white font-semibold text-xs flex items-center justify-between group active:scale-95 transition-all shadow-md cursor-pointer" title="Import Playlist dari YouTube">
                        <span class="flex items-center gap-2">
                            <svg class="w-4 h-4 text-red-500 fill-current shrink-0" viewBox="0 0 24 24">
                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                            </svg>
                            <span>Import YouTube Playlist</span>
                        </span>
                        <i data-lucide="chevron-right" class="w-4 h-4 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all"></i>
                    </button>
                </div>

                <!-- Tombol User Feedback & Donasi QRIS di luar di bawah Nabil Assihidiqi -->
                <div class="pt-2 border-t border-white/10 space-y-2">
                    <button onclick="Profile.openFeedbackModal()" class="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-500/15 via-purple-500/15 to-transparent hover:from-rose-500/25 hover:to-purple-500/25 border border-rose-500/30 text-white font-semibold text-xs flex items-center justify-between group active:scale-95 transition-all shadow-md cursor-pointer" title="Kirim masukan atau pesan ke pengembang">
                        <span class="flex items-center gap-2">
                            <i data-lucide="message-square-plus" class="w-4 h-4 text-rose-400"></i>
                            <span>Kirim Pesan & Masukan Pengguna</span>
                        </span>
                        <i data-lucide="chevron-right" class="w-4 h-4 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all"></i>
                    </button>

                    <!-- Tombol Fitur Donasi Gambar QRIS -->
                    <button onclick="Profile.openDonationModal()" class="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-transparent hover:from-amber-500/25 hover:to-emerald-500/25 border border-amber-500/30 text-white font-semibold text-xs flex items-center justify-between group active:scale-95 transition-all shadow-md cursor-pointer" title="Donasi & Dukung Pengembang MusifyStar">
                        <span class="flex items-center gap-2">
                            <i data-lucide="heart-handshake" class="w-4 h-4 text-amber-400"></i>
                            <span>Donasi Pengembang (QRIS)</span>
                        </span>
                        <div class="flex items-center gap-1.5">
                            <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">QRIS</span>
                            <i data-lucide="chevron-right" class="w-4 h-4 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all"></i>
                        </div>
                    </button>

                    <!-- Tombol Hubungi Admin via WhatsApp -->
                    <button onclick="Profile.openWhatsAppSupport()" class="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-transparent hover:from-emerald-500/25 hover:to-teal-500/25 border border-emerald-500/30 text-white font-semibold text-xs flex items-center justify-between group active:scale-95 transition-all shadow-md cursor-pointer" title="Hubungi Admin via WhatsApp">
                        <span class="flex items-center gap-2">
                            <i data-lucide="message-circle" class="w-4 h-4 text-emerald-400"></i>
                            <span>Hubungi Admin via WhatsApp</span>
                        </span>
                        <div class="flex items-center gap-1.5">
                            <span class="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">WA ONLINE</span>
                            <i data-lucide="chevron-right" class="w-4 h-4 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all"></i>
                        </div>
                    </button>

                    <!-- Tombol Pengaturan (Settings) -->
                    <button onclick="Profile.openSettingsModal()" class="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-slate-500/15 via-indigo-500/15 to-transparent hover:from-slate-500/25 hover:to-indigo-500/25 border border-white/15 text-white font-semibold text-xs flex items-center justify-between group active:scale-95 transition-all shadow-md cursor-pointer" title="Pengaturan Aplikasi & Preferensi">
                        <span class="flex items-center gap-2">
                            <i data-lucide="settings" class="w-4 h-4 text-indigo-300"></i>
                            <span>Pengaturan</span>
                        </span>
                        <i data-lucide="chevron-right" class="w-4 h-4 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all"></i>
                    </button>

                    <!-- Tombol Buka Formulir Login / Daftar (atau Edit Profil jika sudah login) di bawah Donasi -->
                    ${hasUser ? `
                    <button onclick="Auth.openUserProfileModal()" class="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-transparent hover:from-amber-500/25 hover:via-emerald-500/20 border border-amber-400/30 text-white font-semibold text-xs flex items-center justify-between group active:scale-95 transition-all shadow-md cursor-pointer" title="Profil Akun Anda">
                        <span class="flex items-center gap-2.5 min-w-0">
                            <span class="relative w-6 h-6 shrink-0 flex items-center justify-center">
                                <img src="${uAvatar}" class="w-full h-full rounded-full object-cover border border-white/20 z-0" onerror="this.src='/logo.png'">
                                ${uBorderUrl ? `<img src="${uBorderUrl}" class="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160%] h-[160%] max-w-none object-contain z-10 select-none drop-shadow-sm" alt="Border">` : ''}
                            </span>
                            <span class="truncate max-w-[190px] text-left">
                                <span class="block text-white font-bold truncate">Akun: ${es(Auth.currentUser.username)}</span>
                                <span class="block text-[10px] text-white/50 truncate">${uIsVip ? '👑 VIP Aktif • Edit Profil & Border' : 'Edit Profil Akun'}</span>
                            </span>
                        </span>
                        <div class="flex items-center gap-1.5 shrink-0">
                            ${uIsVip ? `<span class="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30 font-mono">VIP</span>` : ''}
                            <i data-lucide="chevron-right" class="w-4 h-4 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all"></i>
                        </div>
                    </button>` : `
                    <button onclick="Auth.toggleTopDropdown(this)" class="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#35eaff]/15 via-[#ff10de]/15 to-transparent hover:from-[#35eaff]/25 hover:to-[#ff10de]/25 border border-[#35eaff]/30 text-white font-bold text-xs flex items-center justify-between group active:scale-95 transition-all shadow-md cursor-pointer" title="Buka Formulir Login / Daftar">
                        <span class="flex items-center gap-2">
                            <i data-lucide="log-in" class="w-4 h-4 text-[#35eaff]"></i>
                            <span>Buka Formulir Login / Daftar</span>
                        </span>
                        <i data-lucide="chevron-right" class="w-4 h-4 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all"></i>
                    </button>`}
                </div>
            </div>
            
            <button id="pwa-install-btn" onclick="installPWA()" class="${typeof isStandaloneApp !== 'undefined' && isStandaloneApp ? 'hidden ' : ''}w-full max-w-sm mx-auto btn-chrome font-bold py-4 rounded-full active:scale-95 transition-all text-center flex items-center justify-center gap-2 mb-3">
                <i data-lucide="download" class="w-5 h-5"></i> Install Aplikasi
            </button>

            <a href="https://whatsapp.com/channel/0029VbDRf3P9WtC9ZjQ3gq3B" target="_blank" class="block w-full max-w-sm mx-auto btn-chrome font-bold py-4 rounded-full active:scale-95 transition-all text-center flex items-center justify-center gap-2">
                <i data-lucide="message-circle" class="w-5 h-5"></i> Gabung Channel WhatsApp
            </a>
        </div>`;
        lucide.createIcons();
        Profile.checkUserInboxBadge();
    },

    // Helper Sensored / Masked Email
    maskEmail(email) {
        if (!email || typeof email !== 'string' || !email.includes('@')) return email || '';
        var parts = email.split('@');
        var local = parts[0];
        var domain = parts[1];
        if (local.length <= 2) {
            return local.charAt(0) + '*@' + domain;
        } else if (local.length <= 4) {
            return local.charAt(0) + '**' + local.charAt(local.length - 1) + '@' + domain;
        } else {
            var start = local.substring(0, 2);
            var end = local.substring(local.length - 2);
            var stars = '*'.repeat(Math.min(6, local.length - 4));
            return start + stars + end + '@' + domain;
        }
    },

    // MODAL KIRIM MASUKAN (USER FEEDBACK FORM)
    openFeedbackModal() {
        var existing = gid('musifystar-feedback-modal');
        if (existing) existing.remove();

        var u = (typeof Auth !== 'undefined' && Auth.currentUser) ? Auth.currentUser : null;
        var defaultName = u ? (u.username || '') : '';
        var defaultContact = u ? (u.email || '') : '';

        var modal = document.createElement('div');
        modal.id = 'musifystar-feedback-modal';
        modal.className = 'fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in';
        modal.innerHTML = `
        <div class="w-full max-w-md bg-[#11131a] border border-white/20 rounded-3xl shadow-2xl overflow-hidden relative p-6 sm:p-7" style="box-shadow: 0 25px 50px -12px rgba(244,63,94,0.25);">
            
            <!-- Close Button -->
            <button onclick="Profile.closeFeedbackModal()" class="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer">
                <i data-lucide="x" class="w-4 h-4"></i>
            </button>

            <!-- Icon & Header -->
            <div class="text-center mb-4 pt-1">
                <div class="w-12 h-12 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-rose-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/30">
                    <i data-lucide="message-square" class="w-6 h-6"></i>
                </div>
                <h2 class="text-lg font-black text-white tracking-tight">Kirim Pesan & Masukan</h2>
                <p class="text-xs text-white/60 mt-1">Sampaikan saran, kritik, atau pesan untuk pengembang MusifyStar.</p>
                ${u ? `<div class="mt-2 text-[11px] text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2.5 py-1 rounded-xl inline-flex items-center gap-1.5 font-medium">
                    <i data-lucide="user-check" class="w-3.5 h-3.5"></i> Terautentikasi sebagai <strong>${u.username}</strong>
                </div>` : ''}
            </div>

            <!-- Error/Status Banner -->
            <div id="fb-status-box" class="hidden mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <i data-lucide="alert-circle" class="w-4 h-4 shrink-0"></i>
                <span id="fb-status-msg"></span>
            </div>

            <!-- Form -->
            <form onsubmit="Profile.submitFeedback(event)" class="space-y-3.5">
                <div>
                    <label class="block text-xs font-semibold text-white/70 mb-1">Nama <span class="text-rose-400"></span></label>
                    <input type="text" id="fb-name" required value="${defaultName}" placeholder="Tuliskan nama Anda" class="w-full px-3.5 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-rose-500 transition-colors" />
                </div>

                <div>
                    <label class="block text-xs font-semibold text-white/70 mb-1">Masukkan Pesan <span class="text-rose-400"></span></label>
                    <textarea id="fb-message" required rows="4" placeholder="Tuliskan saran, kritik, atau pesan yang ingin disampaikan..." class="w-full px-3.5 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-rose-500 transition-colors resize-none"></textarea>
                </div>

                <div>
                    <label class="block text-xs font-semibold text-white/70 mb-1">Email / Nomer Jika Ingin Dibalas <span class="text-white/40 text-[11px]">(Opsional)</span></label>
                    <input type="text" id="fb-contact" value="${defaultContact}" placeholder="+62 atau email@gmail.com" class="w-full px-3.5 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-rose-500 transition-colors" />
                </div>

                <button type="submit" id="fb-submit-btn" class="w-full btn-chrome font-bold py-3.5 rounded-xl active:scale-95 transition-all text-center flex items-center justify-center gap-2 mt-2 shadow-lg cursor-pointer">
                    <i data-lucide="send" class="w-4 h-4"></i>
                    <span>Kirim Pesan</span>
                </button>
            </form>
        </div>`;

        document.body.appendChild(modal);
        lucide.createIcons();
    },

    closeFeedbackModal() {
        var modal = gid('musifystar-feedback-modal');
        if (modal) modal.remove();
    },

    openPaymentModal(pkgId) {
        Profile.openVipPackagesModal(pkgId);
    },

    // ==============================================================
    // FOTO 3: MODAL PAKET VIP MUSIFYSTAR & KEUNTUNGAN MEMBER
    // ==============================================================
    selectedVipPackage: null,

    async openVipPackagesModal(preselectedPkgId) {
        var existing = gid('musifystar-vip-packages-modal');
        if (existing) existing.remove();

        var config = Profile.cachedPaymentConfig;
        try {
            var res = await fetch('/api/payment-config?t=' + Date.now());
            var data = await res.json();
            if (data && data.status && data.config) {
                config = data.config;
                Profile.cachedPaymentConfig = config;
            }
        } catch(e) {}

        var packages = (config && Array.isArray(config.packages) && config.packages.length > 0) ? config.packages.filter(function(p){ return p.active !== false; }) : [
            { id: 'pkg_1week', name: 'Paket Mingguan', duration: '7 Hari', price: 7000, originalPrice: 10000, discount: 'Hemat 30%', badge: 'Trial VIP', popular: false },
            { id: 'pkg_1month', name: 'Paket 1 Bulan', duration: '30 Hari', price: 19000, originalPrice: 35000, discount: 'Diskon 45%', badge: 'Platinum & Master', popular: true },
            { id: 'pkg_5months', name: 'Paket 5 Bulan', duration: '150 Hari', price: 69000, originalPrice: 150000, discount: 'Hemat 55%', badge: 'Legend & Immortal', popular: false },
            { id: 'pkg_permanent', name: 'Paket Permanen (Lifetime)', duration: 'Permanen (Selamanya)', price: 99000, originalPrice: 250000, discount: 'Hemat 60%', badge: 'Semua Border VIP', popular: false }
        ];

        var benefits = (config && Array.isArray(config.benefits) && config.benefits.length > 0) ? config.benefits : [
            { id: 'ben_borders', title: 'Akses Bebas Semua Border Profil', desc: 'Gunakan border Master, Legend, Immortal, & Platinum sesuka Anda.', icon: 'shield-check' },
            { id: 'ben_avatars', title: 'Buka Semua Koleksi Avatar VIP', desc: 'Bebas pakai avatar eksklusif anime, cewek & cowok tanpa batas.', icon: 'sparkles' },
            { id: 'ben_audio', title: 'Audio Musik Ultra HD & Bebas Iklan', desc: 'Kualitas suara jernih 320kbps tanpa jeda iklan streaming.', icon: 'headphones' },
            { id: 'ben_crown', title: 'Lencana Mahkota VIP Emas Eksklusif', desc: 'Lencana kebanggaan di profil, komentar lagu, & obrolan komunitas.', icon: 'crown' },
            { id: 'ben_download', title: 'Download Lagu & Dengarkan Offline', desc: 'Simpan lagu favorit langsung ke perangkat tanpa boros kuota.', icon: 'download' },
            { id: 'ben_unlimited', title: 'Skip Lagu Sepuasnya & Fitur Tercepat', desc: 'Bebas loncat lagu tanpa batas & dapatkan update fitur musik terbaru duluan.', icon: 'zap' }
        ];

        // Pilih paket awal (bulanan atau yang populer atau preselected)
        var defaultPkg = packages.find(function(p){ return p.id === preselectedPkgId; }) ||
                         packages.find(function(p){ return p.popular; }) ||
                         packages[0];
        Profile.selectedVipPackage = defaultPkg;

        var modal = document.createElement('div');
        modal.id = 'musifystar-vip-packages-modal';
        modal.className = 'fixed inset-0 z-[750] bg-[#07090e] flex flex-col select-none overflow-hidden h-[100dvh] max-h-[100dvh] animate-fade-in';
        modal.innerHTML = `
        <!-- Full Page Sticky Header -->
        <div class="pt-5 sm:pt-6 pb-3.5 px-4 shrink-0 border-b border-white/10 shadow-2xl transition-all flex items-center justify-between" style="background: linear-gradient(180deg, rgba(13, 15, 22, 0.92) 0%, rgba(13, 15, 22, 0.98) 100%), url('/banner.png') center/cover no-repeat; backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);">
            <div class="flex items-center gap-3">
                <button onclick="gid('musifystar-vip-packages-modal')?.remove()" class="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center active:scale-95 transition-all cursor-pointer shadow-sm" title="Kembali">
                    <i data-lucide="arrow-left" class="w-5 h-5"></i>
                </button>
                <div>
                    <h1 class="text-lg sm:text-xl font-black text-amber-400 tracking-tight drop-shadow-md leading-tight flex items-center gap-1.5">
                        <span>MusifyStar VIP Member</span>
                        <i data-lucide="crown" class="w-4 h-4 fill-amber-400 text-amber-400"></i>
                    </h1>
                    <p class="text-white/60 text-xs leading-tight mt-0.5">Buka semua fitur VIP eksklusif, audio HD & border spesial</p>
                </div>
            </div>
            <button onclick="gid('musifystar-vip-packages-modal')?.remove()" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer">
                <i data-lucide="x" class="w-4 h-4"></i>
            </button>
        </div>

        <!-- Full Page Scrollable Body -->
        <div class="flex-1 overflow-y-auto overscroll-contain hide-scrollbar p-4 sm:p-6 max-w-2xl mx-auto w-full pb-32 space-y-4">
            
            <!-- Hero Banner Card VIP -->
            <div class="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 border border-amber-400/30 flex items-center gap-3.5 shadow-md">
                <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-black shrink-0 shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                    <i data-lucide="crown" class="w-6 h-6 fill-black stroke-black"></i>
                </div>
                <div>
                    <h2 class="text-base sm:text-lg font-black text-white leading-tight">Langganan VIP MusifyStar</h2>
                    <p class="text-xs text-white/70 mt-0.5 leading-relaxed">Nikmati musik kualitas Ultra HD 320kbps, bebas border profil animasi, dan pengalaman tanpa iklan!</p>
                </div>
            </div>

            <!-- BAGIAN 1: PILIH PAKET LANGGANAN -->
            <div class="space-y-2">
                <div class="text-xs font-black uppercase tracking-wider text-amber-400 px-0.5 flex items-center gap-1.5">
                    <i data-lucide="sparkles" class="w-3.5 h-3.5 text-amber-400"></i>
                    <span>PILIH PAKET LANGGANAN</span>
                </div>

                <div class="space-y-2">
                    ${packages.map(function(pkg) {
                        var isSel = (Profile.selectedVipPackage && Profile.selectedVipPackage.id === pkg.id);
                        var priceFmt = Number(pkg.price).toLocaleString('id-ID');
                        return `
                        <div onclick="Profile.selectVipPackageItem('${pkg.id}')" 
                             id="vip-pkg-card-${pkg.id}"
                             class="p-3.5 px-4 rounded-2xl border transition-all cursor-pointer relative flex items-center justify-between group active:scale-[0.99] ${isSel ? 'bg-[#181a24] border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.2)]' : 'bg-[#11131a] border-white/10 hover:border-white/20'}">
                            
                            <div class="min-w-0 pr-3">
                                <div class="flex items-center gap-2 flex-wrap">
                                    <h4 class="text-sm font-black ${isSel ? 'text-white' : 'text-white/90'} leading-tight">${Profile.escapeHtml(pkg.name)}</h4>
                                    ${pkg.badge ? `
                                    <span class="px-2 py-0.5 rounded-md text-[10px] font-extrabold ${pkg.popular ? 'bg-amber-400 text-black' : (pkg.badge.includes('Hemat') ? 'bg-rose-500 text-white' : 'bg-white/15 text-amber-300')} leading-none">
                                        ${Profile.escapeHtml(pkg.badge)}
                                    </span>
                                    ` : ''}
                                </div>
                                <p class="text-xs text-white/50 mt-1 leading-tight">
                                    ${Profile.escapeHtml(pkg.duration)} ${pkg.discount ? `• <span class="text-amber-300 font-medium">${Profile.escapeHtml(pkg.discount)}</span>` : ''}
                                </p>
                            </div>

                            <div class="shrink-0 flex items-center gap-3">
                                <div class="text-right">
                                    <span class="text-sm sm:text-base font-black ${isSel ? 'text-yellow-400' : 'text-white'}">Rp ${priceFmt}</span>
                                </div>
                                <!-- Radio Selection Icon -->
                                <div id="vip-pkg-check-${pkg.id}" class="w-5 h-5 rounded-full flex items-center justify-center transition-all ${isSel ? 'border-2 border-yellow-400' : 'border border-white/30'}">
                                    <div class="w-2.5 h-2.5 rounded-full ${isSel ? 'bg-yellow-400' : 'bg-transparent'}"></div>
                                </div>
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- TOMBOL CTA UTAMA -->
            <div class="pt-1">
                <button type="button" 
                        id="vip-main-buy-btn"
                        onclick="Profile.proceedToQrisPayment()" 
                        class="w-full py-3.5 px-5 rounded-2xl bg-[#ffd700] hover:bg-[#ffdf33] active:scale-95 text-black font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(255,215,0,0.35)] transition-all cursor-pointer">
                    <i data-lucide="hand-coins" class="w-5 h-5 stroke-[2.5]"></i>
                    <span id="vip-main-buy-btn-text">
                        Beli ${Profile.selectedVipPackage ? Profile.selectedVipPackage.name : 'Paket'} (Rp ${Profile.selectedVipPackage ? Number(Profile.selectedVipPackage.price).toLocaleString('id-ID') : '0'})
                    </span>
                </button>
            </div>

            <!-- BAGIAN 2: KEUNTUNGAN MEMBER VIP -->
            <div class="p-4 rounded-2xl bg-[#11131a] border border-white/10 space-y-3">
                <div class="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <i data-lucide="shield-check" class="w-4 h-4 text-amber-400"></i>
                    <span>KEUNTUNGAN MEMBER VIP</span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    ${benefits.map(function(ben) {
                        return `
                        <div class="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                            <div class="w-7 h-7 rounded-lg bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0 mt-0.5">
                                <i data-lucide="${ben.icon || 'check-circle'}" class="w-4 h-4"></i>
                            </div>
                            <div class="min-w-0">
                                <h4 class="text-xs font-bold text-white leading-tight">${Profile.escapeHtml(ben.title)}</h4>
                                <p class="text-[11px] text-white/50 leading-relaxed mt-0.5">${Profile.escapeHtml(ben.desc)}</p>
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- BAGIAN KLAIM KODE VOUCHER VIP -->
            <div class="p-4 rounded-2xl bg-[#11131a] border border-white/10 flex flex-col items-center text-center space-y-2">
                <button type="button" onclick="Profile.toggleVoucherClaimInput()" id="btn-toggle-voucher" class="text-amber-400 hover:text-amber-300 font-bold text-xs inline-flex items-center gap-2 cursor-pointer transition-all active:scale-95">
                    <i id="toggle-voucher-icon" data-lucide="package" class="w-4 h-4 text-amber-400"></i>
                    <span id="toggle-voucher-text">Punya Kode Voucher VIP? Klaim di Sini</span>
                </button>
                <div id="voucher-claim-container" class="hidden w-full mt-2">
                    <div id="voucher-status-msg" class="hidden mb-2.5 p-2.5 px-3.5 rounded-xl text-xs font-bold text-center transition-all shadow-md"></div>
                    <div class="flex items-center gap-2 max-w-md mx-auto">
                        <input type="text" id="voucher-code-input" placeholder="Contoh: VIP1BULAN" oninput="var msg=gid('voucher-status-msg'); if(msg && !this.value.trim()){ msg.className='hidden mb-2.5 p-2.5 px-3.5 rounded-xl text-xs font-bold text-center transition-all shadow-md'; }" onkeydown="if(event.key==='Enter') Profile.redeemVoucherCode()" class="flex-1 bg-black/60 border border-white/20 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/40 uppercase font-mono tracking-wider outline-none transition-all shadow-inner">
                        <button type="button" id="btn-redeem-voucher" onclick="Profile.redeemVoucherCode()" class="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-amber-400 hover:text-black active:scale-95 text-white/90 font-bold text-xs transition-all cursor-pointer shrink-0 border border-white/10 shadow-md">
                            Klaim
                        </button>
                    </div>
                </div>
            </div>

            <!-- Tombol Bantuan Admin via WhatsApp -->
            <div class="pt-1 pb-4 text-center">
                <button type="button" onclick="Profile.openWhatsAppSupport('Halo Admin MusifyStar, saya ingin konsultasi atau membeli paket VIP.')" class="text-xs text-white/50 hover:text-amber-300 font-medium inline-flex items-center gap-1.5 hover:underline cursor-pointer transition-all">
                    <i data-lucide="help-circle" class="w-3.5 h-3.5"></i>
                    <span>Butuh bantuan pembayaran? Hubungi Admin via WhatsApp</span>
                </button>
            </div>
        </div>
        `;

        document.body.appendChild(modal);
        if (window.lucide) lucide.createIcons();
    },

    selectVipPackageItem(pkgId) {
        var config = Profile.cachedPaymentConfig;
        var packages = (config && config.packages) || [
            { id: 'pkg_1week', name: 'Paket Mingguan', duration: '7 Hari', price: 7000 },
            { id: 'pkg_1month', name: 'Paket 1 Bulan', duration: '30 Hari', price: 19000, popular: true },
            { id: 'pkg_5months', name: 'Paket 5 Bulan', duration: '150 Hari', price: 69000 },
            { id: 'pkg_permanent', name: 'Paket Permanen (Lifetime)', duration: 'Permanen (Selamanya)', price: 99000 }
        ];
        var found = packages.find(function(p){ return p.id === pkgId; });
        if (!found) return;

        Profile.selectedVipPackage = found;

        // Update visuals of cards
        packages.forEach(function(pkg) {
            var card = gid(`vip-pkg-card-${pkg.id}`);
            var check = gid(`vip-pkg-check-${pkg.id}`);
            if (!card) return;

            if (pkg.id === pkgId) {
                card.className = 'p-3.5 px-4 rounded-2xl border transition-all cursor-pointer relative flex items-center justify-between group active:scale-[0.99] bg-[#181a24] border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.2)]';
                if (check) {
                    check.className = 'w-5 h-5 rounded-full flex items-center justify-center transition-all border-2 border-yellow-400';
                    check.innerHTML = '<div class="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>';
                }
            } else {
                card.className = 'p-3.5 px-4 rounded-2xl border transition-all cursor-pointer relative flex items-center justify-between group active:scale-[0.99] bg-[#11131a] border-white/10 hover:border-white/20';
                if (check) {
                    check.className = 'w-5 h-5 rounded-full flex items-center justify-center transition-all border border-white/30';
                    check.innerHTML = '<div class="w-2.5 h-2.5 rounded-full bg-transparent"></div>';
                }
            }
        });

        // Update Text Tombol Beli Utama
        var buyBtnText = gid('vip-main-buy-btn-text');
        if (buyBtnText) {
            buyBtnText.innerText = `Beli ${found.name} (Rp ${Number(found.price).toLocaleString('id-ID')})`;
        }

        var summary = gid('vip-selected-pkg-summary');
        if (summary) {
            summary.innerText = `${found.name} • Rp ${Number(found.price).toLocaleString('id-ID')}`;
        }
        if (window.lucide) lucide.createIcons();
    },

    proceedToQrisPayment() {
        if (!Profile.selectedVipPackage) {
            if (typeof showToast === 'function') showToast('Pilih salah satu paket VIP terlebih dahulu');
            return;
        }
        gid('musifystar-vip-packages-modal')?.remove();
        Profile.openQrisPaymentModal(Profile.selectedVipPackage);
    },

    async openWhatsAppSupport(customMessage) {
        var config = Profile.cachedPaymentConfig;
        var adminWa = (config && config.adminWhatsapp) ? config.adminWhatsapp : '6281234567890';
        try {
            var res = await fetch('/api/payment-config?t=' + Date.now());
            var data = await res.json();
            if (data && data.status && data.config && data.config.adminWhatsapp) {
                adminWa = data.config.adminWhatsapp;
                Profile.cachedPaymentConfig = data.config;
            }
        } catch(e) {}

        var cleanNum = String(adminWa).replace(/[^0-9]/g, '');
        if (!cleanNum) cleanNum = '6281234567890';
        if (cleanNum.startsWith('0')) cleanNum = '62' + cleanNum.substring(1);

        var u = (typeof Auth !== 'undefined' && Auth.currentUser) ? Auth.currentUser : {};
        var defaultMsg = customMessage || `Halo Admin MusifyStar, saya @${u.username || 'Pengguna'} butuh bantuan mengenai aplikasi.`;
        var url = `https://wa.me/${cleanNum}?text=${encodeURIComponent(defaultMsg)}`;
        window.open(url, '_blank');
    },

    // ==============================================================
    // FOTO 5: HALAMAN PEMBAYARAN QRIS (ADMIN BISA UBAH GAMBAR QRIS)
    // ==============================================================
    async openQrisPaymentModal(selectedPackage) {
        var existing = gid('musifystar-qris-payment-modal');
        if (existing) existing.remove();

        var config = Profile.cachedPaymentConfig;
        try {
            var res = await fetch('/api/payment-config?t=' + Date.now());
            var data = await res.json();
            if (data && data.status && data.config) {
                config = data.config;
                Profile.cachedPaymentConfig = config;
            }
        } catch(e) {}

        var rawQris = (config && config.qrisUrl) ? config.qrisUrl : '/qris.png';
        if (!rawQris || rawQris.includes('placeholder')) rawQris = '/qris.png';
        var qrisUrl = rawQris;
        var qrisHolder = (config && config.qrisHolder) || 'NABIL (MusifyStar Official)';
        var pkg = selectedPackage || { name: 'Paket Bulanan VIP', duration: '30 Hari', price: 19000 };
        var priceFmt = Number(pkg.price).toLocaleString('id-ID');

        var modal = document.createElement('div');
        modal.id = 'musifystar-qris-payment-modal';
        modal.className = 'fixed inset-0 z-[800] bg-[#07090e] flex flex-col select-none overflow-hidden h-[100dvh] max-h-[100dvh] animate-fade-in';
        modal.innerHTML = `
        <!-- Full Page Sticky Header -->
        <div class="pt-5 sm:pt-6 pb-3.5 px-4 shrink-0 border-b border-white/10 shadow-2xl transition-all flex items-center justify-between" style="background: linear-gradient(180deg, rgba(13, 15, 22, 0.92) 0%, rgba(13, 15, 22, 0.98) 100%), url('/banner.png') center/cover no-repeat; backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);">
            <div class="flex items-center gap-3">
                <button type="button" onclick="gid('musifystar-qris-payment-modal')?.remove(); Profile.openVipPackagesModal('${pkg.id || ''}');" class="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center active:scale-95 transition-all cursor-pointer shadow-sm" title="Kembali ke Paket">
                    <i data-lucide="arrow-left" class="w-5 h-5"></i>
                </button>
                <div>
                    <h1 class="text-lg sm:text-xl font-black text-white tracking-tight drop-shadow-md leading-tight">Pembayaran QRIS</h1>
                    <p class="text-white/60 text-xs leading-tight mt-0.5">Scan kode di bawah dengan m-Banking atau E-Wallet</p>
                </div>
            </div>
            <button type="button" onclick="gid('musifystar-qris-payment-modal')?.remove()" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer">
                <i data-lucide="x" class="w-4 h-4"></i>
            </button>
        </div>

        <!-- Full Page Scrollable Body -->
        <div class="flex-1 overflow-y-auto overscroll-contain hide-scrollbar p-4 sm:p-6 max-w-2xl mx-auto w-full pb-32 space-y-4">
            
            <!-- Package Summary Tagihan -->
            <div class="p-4 rounded-2xl bg-white/[0.04] border border-amber-400/30 flex items-center justify-between gap-3">
                <div class="min-w-0">
                    <span class="text-xs text-amber-300 font-mono font-bold uppercase tracking-wider block">${Profile.escapeHtml(pkg.name)} (${Profile.escapeHtml(pkg.duration)})</span>
                    <span class="text-lg sm:text-xl font-black text-white block mt-0.5">Total: Rp ${priceFmt}</span>
                </div>
                <span class="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-extrabold font-mono flex items-center gap-1.5 shrink-0">
                    <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> MENUNGGU
                </span>
            </div>

            <!-- Foto QRIS Penuh -->
            <div class="flex flex-col items-center justify-center w-full my-1">
                <div class="w-full max-w-md flex items-center justify-center overflow-hidden rounded-2xl bg-black/40 border border-white/10 shadow-2xl relative p-2">
                    <img id="qris-payment-image" src="${qrisUrl}" class="w-full h-auto max-h-[520px] object-contain select-none rounded-2xl block" alt="Barcode QRIS MusifyStar" onerror="if(this.src && !this.src.endsWith('/qris.png')){this.src='/qris.png';}else{this.onerror=null;this.parentElement.innerHTML='<p class=\\'text-xs text-rose-400 p-4 text-center\\'>Gagal memuat barcode QRIS</p>';}">
                </div>
            </div>

            <!-- Tombol Unduh Barcode QRIS -->
            <div>
                <button type="button" id="btn-download-qris-modal" onclick="Profile.downloadQRIS('${qrisUrl}', 'QRIS-MusifyStar.png')" class="w-full py-3.5 px-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer shadow-md">
                    <i data-lucide="download" class="w-4 h-4 text-amber-300"></i>
                    <span>Unduh Barcode QRIS</span>
                </button>
            </div>

            <!-- Panduan Langkah Cepat -->
            <div class="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2 text-xs text-white/70">
                <span class="text-xs font-bold text-white/40 uppercase tracking-wider block mb-1">Langkah Pembayaran:</span>
                <p class="text-xs">1. Buka aplikasi M-Banking atau E-Wallet di HP Anda</p>
                <p class="text-xs">2. Pilih menu <strong>Scan / Bayar QRIS</strong> dan scan barcode di atas</p>
                <p class="text-xs">3. Masukkan nominal tepat <strong>Rp ${priceFmt}</strong> dan selesaikan pembayaran</p>
                <p class="text-xs">4. Klik tombol konfirmasi di bawah untuk aktivasi akun VIP Anda</p>
            </div>

            <!-- Footer Action: Konfirmasi Pembayaran -->
            <div class="pt-2">
                <button type="button" onclick="Profile.openPaymentConfirmDialog('${pkg.id || ''}', '${Profile.escapeHtml(pkg.name)}', ${pkg.price}, '${Profile.escapeHtml(pkg.duration)}')" class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 text-black font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.35)]">
                    <i data-lucide="check-circle-2" class="w-5 h-5 text-black"></i>
                    <span>Saya Sudah Bayar (Konfirmasi VIP)</span>
                </button>
            </div>
        </div>
        `;

        document.body.appendChild(modal);
        if (window.lucide) lucide.createIcons();
    },

    openPaymentConfirmDialog(packageId, packageName, amount, duration) {
        var u = (typeof Auth !== 'undefined' && Auth.currentUser) ? Auth.currentUser : {};
        var username = u.username || 'Pengguna MusifyStar';
        var userId = u.id || u.userId || 'usr_' + Date.now();

        var existing = gid('musifystar-confirm-dialog');
        if (existing) existing.remove();

        var adminWa = (Profile.cachedPaymentConfig && Profile.cachedPaymentConfig.adminWhatsapp) ? Profile.cachedPaymentConfig.adminWhatsapp : '6281234567890';
        adminWa = String(adminWa).replace(/[^0-9]/g, '');
        if (adminWa.startsWith('0')) adminWa = '62' + adminWa.slice(1);
        if (!adminWa) adminWa = '6281234567890';

        var waText = encodeURIComponent(`Halo Admin MusifyStar! Saya telah melakukan transfer QRIS untuk ${packageName} seharga Rp ${Number(amount).toLocaleString('id-ID')} (${duration}).\n\nUsername: ${username}\nUser ID: ${userId}\n\nMohon bantu verifikasi dan aktivasi VIP akun saya. Terima kasih!`);
        var waUrl = `https://wa.me/${adminWa}?text=${waText}`;

        var diag = document.createElement('div');
        diag.id = 'musifystar-confirm-dialog';
        diag.className = 'fixed inset-0 z-[850] flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-xl animate-fade-in select-none';
        diag.innerHTML = `
        <div class="w-full max-w-sm bg-[#13151f] border border-emerald-500/40 rounded-3xl shadow-2xl p-5 space-y-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <i data-lucide="message-circle" class="w-4 h-4"></i>
                    </div>
                    <h3 class="text-sm font-black text-white">Konfirmasi Pembayaran</h3>
                </div>
                <button onclick="gid('musifystar-confirm-dialog')?.remove()" class="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white/70 flex items-center justify-center cursor-pointer">
                    <i data-lucide="x" class="w-3.5 h-3.5"></i>
                </button>
            </div>

            <p class="text-xs text-white/70 leading-relaxed">
                Kirimkan konfirmasi pembayaran agar Admin dapat langsung memproses status VIP akun Anda:
            </p>

            <div class="space-y-2">
                <!-- WhatsApp Confirmation Option -->
                <a href="${waUrl}" target="_blank" onclick="gid('musifystar-confirm-dialog')?.remove(); gid('musifystar-qris-payment-modal')?.remove();" class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-emerald-500/20 no-underline">
                    <i data-lucide="message-circle" class="w-4 h-4 fill-black"></i>
                    <span>Konfirmasi via WhatsApp (Kirim Bukti TF)</span>
                </a>

                <!-- In-app Automatic Option -->
                <button type="button" onclick="Profile.submitInAppPaymentConfirmation('${packageId}', '${packageName}', ${amount}, '${duration}')" class="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer">
                    <i data-lucide="send" class="w-4 h-4 text-emerald-300"></i>
                    <span>Kirim Konfirmasi Otomatis ke Sistem</span>
                </button>
            </div>
        </div>
        `;
        document.body.appendChild(diag);
        if (window.lucide) lucide.createIcons();
    },

    async submitInAppPaymentConfirmation(packageId, packageName, amount, duration) {
        var token = (typeof Auth !== 'undefined' && Auth.token) ? Auth.token : '';
        if (typeof showToast === 'function') showToast('Mengirim konfirmasi pembayaran...');
        try {
            var res = await fetch('/api/payment-config?action=submit_confirmation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? ('Bearer ' + token) : ''
                },
                body: JSON.stringify({
                    packageId: packageId,
                    packageName: packageName,
                    amount: amount,
                    duration: duration,
                    notes: 'Konfirmasi QRIS dari web'
                })
            });
            var data = await res.json();
            if (data && data.status) {
                gid('musifystar-confirm-dialog')?.remove();
                gid('musifystar-qris-payment-modal')?.remove();

                if (data.user && typeof Auth !== 'undefined' && Auth.currentUser) {
                    Auth.currentUser.isPremium = true;
                    Auth.currentUser.vipTier = data.user.vipTier || '1month';
                    if (data.user.vipExpiresAt) Auth.currentUser.vipExpiresAt = data.user.vipExpiresAt;
                    if (typeof Auth.saveUser === 'function') Auth.saveUser(Auth.currentUser);
                }

                if (typeof Profile.checkUserInboxBadge === 'function') {
                    Profile.checkUserInboxBadge();
                }

                if (typeof showToast === 'function') {
                    showToast(data.message || '🎉 Selamat! VIP Anda aktif. Pesan otomatis telah masuk ke Kotak Masuk Pesan Admin!');
                }
            } else {
                if (typeof showToast === 'function') showToast(data?.message || 'Gagal mengirim konfirmasi');
            }
        } catch(e) {
            if (typeof showToast === 'function') showToast('Koneksi bermasalah');
        }
    },

    // MODAL DONASI QRIS & REKENING PENGEMBANG (DYNAMIC)
    async openDonationModal() {
        var existing = gid('musifystar-donation-modal');
        if (existing) existing.remove();

        // Ambil konfigurasi dinamis dari server
        var config = Profile.cachedPaymentConfig;
        try {
            var res = await fetch('/api/payment-config?t=' + Date.now());
            var data = await res.json();
            if (data && data.status && data.config) {
                config = data.config;
                Profile.cachedPaymentConfig = config;
            }
        } catch(e) {}

        if (!config) {
            config = {
                qrisUrl: '/qris.png',
                qrisFilename: 'QRIS-MusifyStar-Nabil.png',
                accounts: [
                    { bankName: 'SeaBank', accountNumber: '9012 3456 7890', accountHolder: 'NABIL (MusifyStar)', badge: 'Prioritas Bebas Admin', icon: 'credit-card' },
                    { bankName: 'DANA / GoPay', accountNumber: '0812 3456 7890', accountHolder: 'NABIL', badge: 'E-Wallet', icon: 'smartphone' }
                ],
                title: 'Dukung Pengembang MusifyStar',
                description: 'Donasi sukarela Anda sangat berharga untuk biaya sewa server & pengembangan aplikasi MusifyStar.',
                note: 'Semua dana donasi digunakan untuk perawatan server & penambahan fitur baru agar aplikasi tetap gratis tanpa iklan.'
            };
        }

        var accountsListHtml = '';
        if (Array.isArray(config.accounts) && config.accounts.length > 0) {
            accountsListHtml = config.accounts.map(function(acc, idx) {
                var safeNum = String(acc.accountNumber || '').trim();
                var safeBank = String(acc.bankName || 'Bank').trim();
                var safeHolder = String(acc.accountHolder || '').trim();
                var safeBadge = String(acc.badge || 'Transfer').trim();
                return `
                <div class="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-amber-500/40 transition-all flex items-center justify-between gap-3 group">
                    <div class="space-y-1 min-w-0">
                        <div class="flex items-center gap-2">
                            <span class="text-xs font-bold text-white tracking-wide">${safeBank}</span>
                            <span class="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">${safeBadge}</span>
                        </div>
                        <div class="font-mono text-sm sm:text-base font-black text-amber-400 tracking-wider truncate select-all">
                            ${safeNum}
                        </div>
                        <p class="text-[11px] text-white/50 truncate">a.n. <strong class="text-white/80">${safeHolder}</strong></p>
                    </div>
                    <button type="button" onclick="Profile.copyAccountNumber('${safeNum}', this)" class="shrink-0 py-2 px-3 rounded-xl bg-white/10 hover:bg-amber-500 hover:text-black text-white text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm">
                        <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                        <span>Salin</span>
                    </button>
                </div>`;
            }).join('');
        } else {
            accountsListHtml = '<p class="text-xs text-white/50 text-center py-6">Belum ada nomor rekening yang ditambahkan oleh admin.</p>';
        }

        var modal = document.createElement('div');
        modal.id = 'musifystar-donation-modal';
        modal.className = 'fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-fade-in';
        modal.innerHTML = `
        <div class="w-full max-w-sm sm:max-w-md bg-[#11131a] border border-white/20 rounded-3xl shadow-2xl overflow-hidden relative flex flex-col max-h-[92vh]" style="box-shadow: 0 25px 50px -12px rgba(245,158,11,0.25);">
            <!-- Close Button -->
            <button onclick="Profile.closeDonationModal()" class="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer z-10">
                <i data-lucide="x" class="w-4 h-4"></i>
            </button>

            <!-- Header -->
            <div class="text-center p-5 pb-3 shrink-0">
                <div class="w-11 h-11 mx-auto mb-2 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
                    <i data-lucide="heart-handshake" class="w-5 h-5"></i>
                </div>
                <h2 class="text-base sm:text-lg font-black text-white tracking-tight">${config.title || 'Dukung Pengembang MusifyStar'}</h2>
                <p class="text-xs text-white/60 mt-1 max-w-xs mx-auto leading-relaxed">${config.description || 'Donasi sukarela Anda sangat berharga untuk biaya sewa server & pengembangan aplikasi MusifyStar.'}</p>
            </div>

            <!-- Subtab Switcher: QRIS vs Rekening Transfer -->
            <div class="px-5 mb-3 shrink-0">
                <div class="grid grid-cols-2 p-1 bg-white/5 border border-white/10 rounded-2xl gap-1">
                    <button id="don-tab-btn-qris" onclick="Profile.setDonationSubTab('qris')" class="py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-gradient-to-r from-amber-500 to-emerald-500 text-black shadow-md">
                        <i data-lucide="qr-code" class="w-3.5 h-3.5"></i>
                        <span>Barcode QRIS</span>
                    </button>
                    <button id="don-tab-btn-accounts" onclick="Profile.setDonationSubTab('accounts')" class="py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-white/70 hover:text-white hover:bg-white/5">
                        <i data-lucide="credit-card" class="w-3.5 h-3.5"></i>
                        <span>Rekening & E-Wallet</span>
                    </button>
                </div>
            </div>

            <!-- Scrollable Body Content -->
            <div class="flex-1 overflow-y-auto px-5 pb-5 space-y-3.5 hide-scrollbar">
                <!-- PANEL 1: QRIS VIEW -->
                <div id="don-view-qris" class="space-y-3">
                    <div class="w-full flex items-center justify-center overflow-hidden rounded-2xl select-none bg-white/5 p-2 border border-white/10" 
                         style="-webkit-touch-callout:none;-webkit-user-select:none;user-select:none;"
                         oncontextmenu="return false;">
                        <img id="qris-img-display" 
                             src="${config.qrisUrl || '/qris.png'}" 
                             alt="QRIS MusifyStar" 
                             draggable="false"
                             oncontextmenu="return false;"
                             class="w-full h-auto max-h-[46vh] object-contain rounded-xl shadow-2xl pointer-events-none select-none" 
                             style="-webkit-touch-callout:none;-webkit-user-select:none;user-select:none;pointer-events:none;"
                             onerror="if(this.src && !this.src.endsWith('/qris.png')){this.src='/qris.png';}else{this.onerror=null;this.parentElement.innerHTML='<p class=\\'text-xs text-rose-400 p-4 text-center\\'>Gagal memuat QRIS</p>';}" />
                    </div>
                    <p class="text-[11px] text-white/50 text-center leading-relaxed">
                        Scan dengan GoPay, OVO, DANA, BCA, BRI, Mandiri, BNI, ShopeePay & semua bank / mobile banking di Indonesia.
                    </p>
                    <div class="grid grid-cols-2 gap-2 pt-1">
                        <button id="btn-save-qris" onclick="Profile.downloadQRIS('${config.qrisUrl || '/qris.png'}', '${config.qrisFilename || 'QRIS-MusifyStar-Nabil.png'}')" class="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:opacity-95 active:scale-95 text-black text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-amber-500/20 cursor-pointer text-center">
                            <i data-lucide="download" class="w-4 h-4"></i>
                            <span>Simpan QRIS</span>
                        </button>
                        <button onclick="Profile.closeDonationModal()" class="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border border-white/10 cursor-pointer text-center">
                            <i data-lucide="x" class="w-4 h-4"></i>
                            <span>Tutup</span>
                        </button>
                    </div>
                </div>

                <!-- PANEL 2: REKENING & E-WALLET VIEW -->
                <div id="don-view-accounts" class="hidden space-y-2.5">
                    ${accountsListHtml}
                    ${config.note ? `
                    <div class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200/80 text-[11px] leading-relaxed flex items-start gap-2">
                        <i data-lucide="info" class="w-4 h-4 text-amber-400 shrink-0 mt-0.5"></i>
                        <span>${config.note}</span>
                    </div>` : ''}
                    <div class="pt-2">
                        <button onclick="Profile.closeDonationModal()" class="w-full py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border border-white/10 cursor-pointer text-center">
                            <i data-lucide="check" class="w-4 h-4 text-emerald-400"></i>
                            <span>Selesai</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>`;

        modal.onclick = function(e) {
            if (e.target === modal) Profile.closeDonationModal();
        };

        document.body.appendChild(modal);
        lucide.createIcons();
    },

    setDonationSubTab(tab) {
        var btnQris = gid('don-tab-btn-qris');
        var btnAcc = gid('don-tab-btn-accounts');
        var viewQris = gid('don-view-qris');
        var viewAcc = gid('don-view-accounts');

        var activeClass = 'py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-gradient-to-r from-amber-500 to-emerald-500 text-black shadow-md';
        var inactiveClass = 'py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-white/70 hover:text-white hover:bg-white/5';

        if (btnQris) btnQris.className = tab === 'qris' ? activeClass : inactiveClass;
        if (btnAcc) btnAcc.className = tab === 'accounts' ? activeClass : inactiveClass;
        if (viewQris) viewQris.classList.toggle('hidden', tab !== 'qris');
        if (viewAcc) viewAcc.classList.toggle('hidden', tab !== 'accounts');
    },

    copyAccountNumber(accNumber, btnEl) {
        if (!accNumber) return;
        var clean = String(accNumber).replace(/\s+/g, '');
        var doFeedback = function() {
            if (btnEl) {
                var originalHtml = btnEl.innerHTML;
                btnEl.className = 'shrink-0 py-2 px-3 rounded-xl bg-emerald-500 text-black text-xs font-bold flex items-center gap-1.5 transition-all shadow-md';
                btnEl.innerHTML = '<i data-lucide="check" class="w-3.5 h-3.5"></i><span>Tersalin!</span>';
                if (typeof lucide !== 'undefined') lucide.createIcons();
                setTimeout(function() {
                    btnEl.className = 'shrink-0 py-2 px-3 rounded-xl bg-white/10 hover:bg-amber-500 hover:text-black text-white text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm';
                    btnEl.innerHTML = originalHtml;
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                }, 2200);
            }
            if (typeof showToast === 'function') {
                showToast('Nomor rekening ' + clean + ' disalin ke clipboard');
            }
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(clean).then(doFeedback).catch(function() {
                prompt('Salin nomor rekening:', clean);
            });
        } else {
            prompt('Salin nomor rekening:', clean);
        }
    },

    closeDonationModal() {
        var modal = gid('musifystar-donation-modal');
        if (modal) modal.remove();
    },

    downloadQRIS(targetUrl, targetFilename) {
        var btn = gid('btn-download-qris-modal') || gid('btn-save-qris');
        var originalBtnHtml = btn ? btn.innerHTML : '';
        if (btn) {
            btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin text-amber-300"></i><span>Mengunduh Barcode...</span>';
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }

        var fetchUrl = targetUrl || (Profile.cachedPaymentConfig && Profile.cachedPaymentConfig.qrisUrl) || '/qris.png';
        var filename = targetFilename || 'QRIS-MusifyStar.png';
        if (!filename.toLowerCase().endsWith('.png')) filename += '.png';

        var restoreBtn = function() {
            if (!btn) return;
            btn.innerHTML = '<i data-lucide="check" class="w-4 h-4 text-emerald-400"></i><span>Berhasil Diunduh!</span>';
            if (typeof lucide !== 'undefined') lucide.createIcons();
            setTimeout(function() {
                if (btn) {
                    if (btn.id === 'btn-download-qris-modal') {
                        btn.innerHTML = '<i data-lucide="download" class="w-4 h-4 text-amber-300"></i><span>Unduh Barcode QRIS</span>';
                    } else {
                        btn.innerHTML = originalBtnHtml || '<i data-lucide="download" class="w-4 h-4"></i><span>Simpan QRIS</span>';
                    }
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                }
            }, 2500);
        };

        // 1. Ambil data murni binary gambar PNG via fetch & Blob
        fetch(fetchUrl, { cache: 'no-cache' })
            .then(function(res) {
                if (!res.ok) throw new Error('Network error: ' + res.status);
                return res.blob();
            })
            .then(function(blob) {
                var pngBlob = new Blob([blob], { type: 'image/png' });
                var blobUrl = URL.createObjectURL(pngBlob);
                var tempLink = document.createElement('a');
                tempLink.style.display = 'none';
                tempLink.href = blobUrl;
                tempLink.download = filename;
                document.body.appendChild(tempLink);
                tempLink.click();

                setTimeout(function() {
                    if (tempLink.parentNode) tempLink.parentNode.removeChild(tempLink);
                    URL.revokeObjectURL(blobUrl);
                    restoreBtn();
                    if (typeof showToast === 'function') {
                        showToast('Barcode QRIS (PNG) berhasil disimpan');
                    }
                }, 300);
            })
            .catch(function(err) {
                console.warn('Fallback canvas/direct download QRIS:', err);
                // Fallback 1: Canvas export to pure dataURL / blob
                try {
                    var img = new Image();
                    img.crossOrigin = 'anonymous';
                    img.onload = function() {
                        try {
                            var canvas = document.createElement('canvas');
                            canvas.width = img.naturalWidth || img.width || 1080;
                            canvas.height = img.naturalHeight || img.height || 1350;
                            var ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0);
                            canvas.toBlob(function(b) {
                                if (b) {
                                    var url = URL.createObjectURL(b);
                                    var a = document.createElement('a');
                                    a.style.display = 'none';
                                    a.href = url;
                                    a.download = filename;
                                    document.body.appendChild(a);
                                    a.click();
                                    setTimeout(function() {
                                        if (a.parentNode) a.parentNode.removeChild(a);
                                        URL.revokeObjectURL(url);
                                    }, 500);
                                    restoreBtn();
                                    if (typeof showToast === 'function') showToast('Barcode QRIS berhasil disimpan');
                                } else {
                                    var dlA = document.createElement('a');
                                    dlA.href = '/api/download-qris?filename=' + encodeURIComponent(filename);
                                    dlA.download = filename;
                                    document.body.appendChild(dlA);
                                    dlA.click();
                                    setTimeout(function() { if (dlA.parentNode) dlA.parentNode.removeChild(dlA); }, 500);
                                    restoreBtn();
                                }
                            }, 'image/png');
                        } catch(cErr) {
                            var dlA = document.createElement('a');
                            dlA.href = '/api/download-qris?filename=' + encodeURIComponent(filename);
                            dlA.download = filename;
                            document.body.appendChild(dlA);
                            dlA.click();
                            setTimeout(function() { if (dlA.parentNode) dlA.parentNode.removeChild(dlA); }, 500);
                            restoreBtn();
                        }
                    };
                    img.onerror = function() {
                        var dlA = document.createElement('a');
                        dlA.href = '/api/download-qris?filename=' + encodeURIComponent(filename);
                        dlA.download = filename;
                        document.body.appendChild(dlA);
                        dlA.click();
                        setTimeout(function() { if (dlA.parentNode) dlA.parentNode.removeChild(dlA); }, 500);
                        restoreBtn();
                    };
                    img.src = fetchUrl;
                } catch (e) {
                    var dlA = document.createElement('a');
                    dlA.href = '/api/download-qris?filename=' + encodeURIComponent(filename);
                    dlA.download = filename;
                    document.body.appendChild(dlA);
                    dlA.click();
                    setTimeout(function() { if (dlA.parentNode) dlA.parentNode.removeChild(dlA); }, 500);
                    restoreBtn();
                }
            });
    },

    copyDonationInfo() {
        var text = "Dukungan Donasi QRIS MusifyStar\\nPengembang: Nabil Assihidiqi\\nDapat di-scan melalui aplikasi GoPay, OVO, DANA, ShopeePay, BCA, Mandiri, BRI, BNI, dan semua e-Wallet / Mobile Banking di Indonesia.";
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function() {
                var btnText = gid('copy-donation-btn-text');
                if (btnText) {
                    btnText.innerText = 'Tersalin!';
                    setTimeout(function() {
                        if (btnText) btnText.innerText = 'Salin Info';
                    }, 2500);
                }
            }).catch(function() {
                alert('Info donasi: Scan QRIS atas nama Nabil Assihidiqi di aplikasi pembayaran Anda.');
            });
        } else {
            alert('Info donasi: Scan QRIS atas nama Nabil Assihidiqi di aplikasi pembayaran Anda.');
        }
    },

    // === SISTEM PENGATURAN MUSIFYSTAR ===
    getSettings() {
        var defaults = {
            autoplay: true,
            backgroundPlay: true,
            keepScreenAwake: false,
            ecoMode: false,
            swipeGestures: true,
            audioQuality: 'auto'
        };
        try {
            var raw = localStorage.getItem('musifystar_app_settings');
            if (raw) {
                var parsed = JSON.parse(raw);
                return Object.assign({}, defaults, parsed);
            }
        } catch(e) {}
        return defaults;
    },

    isCurrentUserVip() {
        var u = (typeof Auth !== 'undefined' && Auth.currentUser) ? Auth.currentUser : null;
        if (!u) return false;
        var email = String(u.email || u.rawEmail || '').toLowerCase().trim();
        var username = String(u.username || '').toLowerCase().trim();
        if (email === 'jrnabil570@gmail.com' || username === 'nabil') return true;
        if (u.vipTier === 'none') return false;
        var isTierActive = Boolean(u.vipTier && u.vipTier !== 'none');
        if (u.isPremium || u.is_premium || isTierActive) {
            if (u.vipExpiresAt && Date.now() > u.vipExpiresAt) return false;
            return true;
        }
        return false;
    },

    saveSettings(settings) {
        try {
            localStorage.setItem('musifystar_app_settings', JSON.stringify(settings));
        } catch(e) {}
        Profile.applySettings(settings);
    },

    applySettings(settings) {
        settings = settings || Profile.getSettings();
        var isVip = Profile.isCurrentUserVip();

        // 1. Putar Otomatis (Autoplay)
        if (typeof S !== 'undefined') {
            S.autoNext = !!settings.autoplay;
            try { localStorage.setItem('nanzz_auto_next', String(S.autoNext)); } catch(e){}
        }

        // 2. Putar di Latar Belakang (Keep Playing in Background)
        // Default aktif untuk semua pengguna (dan bisa dimatikan manual via pengaturan jika diinginkan)
        window._musifyBackgroundPlay = (settings.backgroundPlay !== false);

        // 3. Layar Tetap Menyala (Keep Screen Awake) - Khusus VIP
        window._musifyKeepScreenAwake = isVip ? (!!settings.keepScreenAwake) : false;
        if (window._musifyKeepScreenAwake) {
            if (typeof window.requestMusifyScreenWakeLock === 'function') window.requestMusifyScreenWakeLock();
        } else {
            if (typeof window.releaseMusifyScreenWakeLock === 'function') window.releaseMusifyScreenWakeLock();
        }

        // 4. Mode Hemat Baterai (Eco Mode)
        if (settings.ecoMode) {
            document.documentElement.classList.add('eco-mode');
            document.body.classList.add('eco-mode');
        } else {
            document.documentElement.classList.remove('eco-mode');
            document.body.classList.remove('eco-mode');
        }

        // 5. Gestur Usap Layar (Swipe Gestures) - Khusus VIP
        window._musifySwipeGestures = isVip ? (settings.swipeGestures !== false) : false;

        // 6. Kualitas Audio Streaming - Khusus VIP (Non-VIP default ke standard 128kbps)
        window._musifyAudioQuality = isVip ? (settings.audioQuality || 'auto') : 'standard';
    },

    toggleSetting(key) {
        var isVipRequired = (key === 'backgroundPlay' || key === 'keepScreenAwake' || key === 'swipeGestures');
        if (isVipRequired && !Profile.isCurrentUserVip()) {
            var featureNames = {
                backgroundPlay: 'Putar di Latar Belakang',
                keepScreenAwake: 'Layar Tetap Menyala',
                swipeGestures: 'Gestur Usap Layar'
            };
            if (typeof showToast === 'function') {
                showToast(`Fitur "${featureNames[key]}" terkunci! Khusus member VIP (1 Bulan, 2 Bulan, 5 Bulan, atau Permanen).`);
            }
            if (typeof Profile.openVipPackagesModal === 'function') {
                setTimeout(function() {
                    Profile.openVipPackagesModal();
                }, 400);
            }
            return;
        }

        var s = Profile.getSettings();
        s[key] = !s[key];
        Profile.saveSettings(s);

        // Update UI switch di modal secara realtime jika modal terbuka
        var switchTrack = gid('setting-switch-track-' + key);
        var switchKnob = gid('setting-switch-knob-' + key);
        if (switchTrack && switchKnob) {
            if (s[key]) {
                switchTrack.className = 'w-11 h-6 rounded-full p-0.5 flex items-center bg-indigo-600 cursor-pointer transition-colors duration-200';
                switchKnob.style.transform = 'translate3d(20px, 0, 0)';
                switchKnob.className = 'w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200';
            } else {
                switchTrack.className = 'w-11 h-6 rounded-full p-0.5 flex items-center bg-white/10 border border-white/15 cursor-pointer transition-colors duration-200';
                switchKnob.style.transform = 'translate3d(0px, 0, 0)';
                switchKnob.className = 'w-5 h-5 rounded-full bg-white/70 shadow-md transition-transform duration-200';
            }
        }

        var names = {
            autoplay: 'Putar Otomatis',
            backgroundPlay: 'Putar di Latar Belakang',
            keepScreenAwake: 'Layar Tetap Menyala',
            ecoMode: 'Mode Hemat Baterai',
            swipeGestures: 'Gestur Usap Layar'
        };
        if (typeof showToast === 'function') {
            showToast((names[key] || 'Pengaturan') + ': ' + (s[key] ? 'Aktif' : 'Nonaktif'));
        }
    },

    promptVipFeature(name) {
        if (typeof showToast === 'function') {
            showToast(`Fitur "${name}" terkunci! Khusus member VIP (1 Bulan, 2 Bulan, 5 Bulan, atau Permanen).`);
        }
        if (typeof Profile.openVipPackagesModal === 'function') {
            setTimeout(function() {
                Profile.openVipPackagesModal();
            }, 300);
        }
    },

    changeAudioQuality(newVal, selectEl) {
        if ((newVal === 'high' || newVal === 'auto') && !Profile.isCurrentUserVip()) {
            if (typeof showToast === 'function') {
                showToast('Kualitas Audio ' + (newVal === 'high' ? 'Tinggi (256 - 320 kbps)' : 'Adaptif') + ' terkunci! Khusus member VIP (1 Bulan, 2 Bulan, 5 Bulan, atau Permanen).');
            }
            if (selectEl) selectEl.value = 'standard';
            var s0 = Profile.getSettings();
            s0.audioQuality = 'standard';
            Profile.saveSettings(s0);
            if (typeof Profile.openVipPackagesModal === 'function') {
                setTimeout(function() {
                    Profile.openVipPackagesModal();
                }, 350);
            }
            return;
        }

        var s = Profile.getSettings();
        s.audioQuality = newVal;
        Profile.saveSettings(s);

        var names = {
            auto: 'Otomatis',
            high: 'Kualitas Tinggi (256 - 320 kbps)',
            standard: 'Standar (128 kbps)',
            saver: 'Hemat Kuota (64 kbps)'
        };
        if (typeof showToast === 'function') {
            showToast('Kualitas Audio: ' + (names[newVal] || newVal));
        }
    },

    async calculateCacheSize() {
        var sizeTextEl = gid('setting-cache-size-text');
        var bytes = 0;
        try {
            if (navigator.storage && navigator.storage.estimate) {
                var estimate = await navigator.storage.estimate();
                bytes = estimate.usage || 0;
            }
        } catch(e) {}

        try {
            var localAudio = localStorage.getItem('pwa_audio_cache') || '';
            var localLyrics = localStorage.getItem('pwa_lyrics_cache') || '';
            bytes = Math.max(bytes, (localAudio.length + localLyrics.length) * 2);
        } catch(e) {}

        var mb = (bytes / (1024 * 1024)).toFixed(1);
        if (sizeTextEl) {
            sizeTextEl.innerText = (parseFloat(mb) > 0 ? mb + ' MB' : '< 1 MB');
        }
        return mb;
    },

    async clearAppCache() {
        var btn = gid('setting-clear-cache-btn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i><span>Membersihkan...</span>';
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }

        try {
            if (window.caches) {
                var keys = await window.caches.keys();
                await Promise.all(keys.map(function(k) { return window.caches.delete(k); }));
            }
            var cacheKeysToRemove = [
                'pwa_audio_cache',
                'pwa_lyrics_cache',
                'musifystar_home_sections_cache_v4',
                'musifystar_search_history',
                'musify_stream_cache'
            ];
            cacheKeysToRemove.forEach(function(k) {
                try { localStorage.removeItem(k); } catch(e) {}
            });
            try { sessionStorage.clear(); } catch(e) {}
        } catch(e) {
            console.error('Clear cache error:', e);
        }

        setTimeout(async function() {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i data-lucide="check" class="w-3.5 h-3.5 text-emerald-400"></i><span>Bersih</span>';
                if (typeof lucide !== 'undefined') lucide.createIcons();
                setTimeout(function() {
                    if (btn) btn.innerHTML = '<span>Bersihkan</span>';
                }, 2000);
            }
            var sizeTextEl = gid('setting-cache-size-text');
            if (sizeTextEl) sizeTextEl.innerText = '< 1 MB';
            if (typeof showToast === 'function') {
                showToast('Cache memori berhasil dibersihkan! 🧹');
            }
        }, 500);
    },

    // MODAL PENGATURAN (SETTINGS) - Tampilan Bersih & Minimalis
    openSettingsModal() {
        var existing = gid('musifystar-settings-modal');
        if (existing) existing.remove();

        var s = Profile.getSettings();
        var isVip = Profile.isCurrentUserVip();

        // Status Sleep Timer
        var sleepStatusText = 'Hentikan musik otomatis saat tidur';
        var sleepActionText = 'Atur';
        if (typeof S !== 'undefined') {
            if (S.sleepSecondsLeft > 0) {
                sleepStatusText = 'Sedang berjalan: ' + (typeof fm === 'function' ? fm(S.sleepSecondsLeft) : S.sleepSecondsLeft + 's');
                sleepActionText = 'Kelola';
            } else if (S.sleepEndWithTrack) {
                sleepStatusText = 'Aktif: Berhenti di akhir lagu';
                sleepActionText = 'Kelola';
            }
        }

        var modal = document.createElement('div');
        modal.id = 'musifystar-settings-modal';
        modal.className = 'fixed inset-0 z-[650] bg-[#07090e] flex flex-col select-none overflow-hidden h-[100dvh] max-h-[100dvh] animate-fade-in';
        modal.innerHTML = `
        <!-- Full Page Sticky Header -->
        <div class="pt-6 sm:pt-7 pb-3.5 px-4 shrink-0 border-b border-white/10 shadow-2xl transition-all flex items-center justify-between" style="background: linear-gradient(180deg, rgba(13, 15, 22, 0.88) 0%, rgba(13, 15, 22, 0.97) 100%), url('/banner.png') center/cover no-repeat; backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);">
            <div class="flex items-center gap-3">
                <button onclick="Profile.closeSettingsModal()" class="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center active:scale-95 transition-all cursor-pointer shadow-sm" title="Kembali">
                    <i data-lucide="arrow-left" class="w-5 h-5"></i>
                </button>
                <div>
                    <h1 class="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md leading-tight">Pengaturan</h1>
                    <p class="text-white/50 text-[11px] leading-tight mt-0.5">Preferensi & pemutar musik MusifyStar</p>
                </div>
            </div>
        </div>

        <!-- Full Page Scrollable Body -->
        <div class="flex-1 overflow-y-auto overscroll-contain hide-scrollbar p-4 sm:p-6 max-w-2xl mx-auto w-full pb-36 space-y-4">
                
                <!-- VIP Membership Status Banner -->
                ${!isVip ? `
                <div onclick="Profile.openVipPackagesModal()" class="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-amber-500/20 border border-amber-400/40 flex items-center justify-between gap-2.5 cursor-pointer group hover:border-amber-400/60 transition-all shadow-sm">
                    <div class="flex items-center gap-2">
                        <div class="w-6 h-6 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-400/30">
                            <i data-lucide="crown" class="w-3.5 h-3.5 text-amber-400"></i>
                        </div>
                        <div>
                            <h4 class="text-[11px] font-black text-amber-300 flex items-center gap-1">
                                <span>Buka Fitur VIP</span>
                                <i data-lucide="sparkles" class="w-2.5 h-2.5 text-yellow-400"></i>
                            </h4>
                            <p class="text-[9px] text-white/70 mt-0.5">Kualitas Audio HD, Layar Menyala, Gestur Usap & Putar Latar Belakang</p>
                        </div>
                    </div>
                    <span class="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-500 text-black flex items-center gap-1 shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                        Beli VIP
                    </span>
                </div>
                ` : `
                <div class="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-2">
                    <div class="flex items-center gap-1.5">
                        <i data-lucide="crown" class="w-3.5 h-3.5 text-amber-400"></i>
                        <span class="text-[11px] font-semibold text-white">Status Membership <strong class="text-amber-300 font-bold">VIP Aktif</strong></span>
                    </div>
                    <span class="text-[8.5px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">Semua Fitur Terbuka</span>
                </div>
                `}

                <!-- Kelompok 1: Pemutar & Audio -->
                <div class="space-y-2">
                    <div class="text-[11px] font-bold uppercase tracking-wider text-white/40 px-1">
                        Pemutar & Audio
                    </div>

                    <!-- 1. Putar Otomatis (Autoplay) -->
                    <div onclick="Profile.toggleSetting('autoplay')" class="p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.99]">
                        <div class="flex items-center gap-3 min-w-0">
                            <div class="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/70 shrink-0">
                                <i data-lucide="disc-3" class="w-4 h-4"></i>
                            </div>
                            <div class="min-w-0">
                                <h4 class="text-xs font-semibold text-white">Putar Otomatis (Autoplay)</h4>
                                <p class="text-[11px] text-white/50 leading-snug mt-0.5">Lanjut ke lagu rekomendasi saat antrean selesai</p>
                            </div>
                        </div>
                        <div class="shrink-0 pl-1">
                            <div id="setting-switch-track-autoplay" class="w-11 h-6 rounded-full p-0.5 flex items-center ${s.autoplay ? 'bg-indigo-600' : 'bg-white/10 border border-white/15'} cursor-pointer transition-colors duration-200">
                                <div id="setting-switch-knob-autoplay" class="w-5 h-5 rounded-full ${s.autoplay ? 'bg-white' : 'bg-white/70'} shadow-md transition-transform duration-200" style="transform: translate3d(${s.autoplay ? '20px' : '0px'}, 0, 0);"></div>
                            </div>
                        </div>
                    </div>

                    <!-- 2. Putar di Latar Belakang (KHUSUS VIP) -->
                    <div onclick="Profile.toggleSetting('backgroundPlay')" class="p-3.5 rounded-xl ${isVip ? 'bg-white/[0.03] hover:bg-white/[0.06]' : 'bg-amber-500/[0.03] hover:bg-amber-500/[0.07] border-amber-500/20'} border border-white/10 flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.99]">
                        <div class="flex items-center gap-3 min-w-0">
                            <div class="w-8 h-8 rounded-lg ${isVip ? 'bg-white/5 border-white/10 text-white/70' : 'bg-amber-400/10 border-amber-400/20 text-amber-300'} border flex items-center justify-center shrink-0">
                                <i data-lucide="layers" class="w-4 h-4"></i>
                            </div>
                            <div class="min-w-0">
                                <div class="flex items-center gap-1.5 flex-wrap">
                                    <h4 class="text-xs font-semibold text-white">Putar di Latar Belakang</h4>
                                    ${isVip ? '<span class="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-0.5"><i data-lucide="check" class="w-2.5 h-2.5"></i> VIP</span>' : '<span class="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-0.5"><i data-lucide="lock" class="w-2.5 h-2.5"></i> VIP</span>'}
                                </div>
                                <p class="text-[11px] text-white/50 leading-snug mt-0.5">Musik tetap berputar saat aplikasi diminimalkan atau layar mati</p>
                            </div>
                        </div>
                        <div class="shrink-0 pl-1">
                            <div id="setting-switch-track-backgroundPlay" class="w-11 h-6 rounded-full p-0.5 flex items-center ${(s.backgroundPlay && isVip) ? 'bg-indigo-600' : 'bg-white/10 border border-white/15'} cursor-pointer transition-colors duration-200">
                                <div id="setting-switch-knob-backgroundPlay" class="w-5 h-5 rounded-full ${(s.backgroundPlay && isVip) ? 'bg-white' : 'bg-white/70'} shadow-md transition-transform duration-200" style="transform: translate3d(${(s.backgroundPlay && isVip) ? '20px' : '0px'}, 0, 0);"></div>
                            </div>
                        </div>
                    </div>

                    <!-- 3. Timer Tidur (Sleep Timer) -->
                    <div onclick="Profile.openSleepTimerModal()" class="p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.99]">
                        <div class="flex items-center gap-3 min-w-0">
                            <div class="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/70 shrink-0">
                                <i data-lucide="clock" class="w-4 h-4"></i>
                            </div>
                            <div class="min-w-0">
                                <h4 class="text-xs font-semibold text-white">Timer Tidur (Sleep Timer)</h4>
                                <p class="text-[11px] text-white/50 leading-snug mt-0.5">${sleepStatusText}</p>
                            </div>
                        </div>
                        <div class="shrink-0 flex items-center gap-1.5 text-xs text-indigo-400 font-semibold">
                            <span>${sleepActionText}</span>
                            <i data-lucide="chevron-right" class="w-3.5 h-3.5 text-white/40"></i>
                        </div>
                    </div>

                    <!-- 4. Kualitas Audio Streaming (KHUSUS VIP) -->
                    <div class="p-3.5 rounded-xl ${isVip ? 'bg-white/[0.03]' : 'bg-amber-500/[0.03] border-amber-500/20'} border border-white/10 space-y-2">
                        <div class="flex items-center gap-3 min-w-0 ${!isVip ? 'cursor-pointer' : ''}" ${!isVip ? 'onclick="Profile.promptVipFeature(\'Kualitas Audio Streaming HD\')"' : ''}>
                            <div class="w-8 h-8 rounded-lg ${isVip ? 'bg-white/5 border-white/10 text-white/70' : 'bg-amber-400/10 border-amber-400/20 text-amber-300'} border flex items-center justify-center shrink-0">
                                <i data-lucide="sliders" class="w-4 h-4"></i>
                            </div>
                            <div class="min-w-0 flex-1">
                                <div class="flex items-center gap-1.5 flex-wrap">
                                    <h4 class="text-xs font-semibold text-white">Kualitas Audio Streaming</h4>
                                    ${isVip ? '<span class="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-0.5"><i data-lucide="check" class="w-2.5 h-2.5"></i> VIP</span>' : '<span class="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-0.5"><i data-lucide="lock" class="w-2.5 h-2.5"></i> VIP</span>'}
                                </div>
                                <p class="text-[11px] text-white/50 leading-snug mt-0.5">Atur bitrate pemutaran audio (256 - 320 kbps HD khusus VIP)</p>
                            </div>
                        </div>
                        <div class="relative">
                            <select onchange="Profile.changeAudioQuality(this.value, this)" class="w-full py-2 px-3 pr-8 rounded-lg bg-black/40 border border-white/20 text-xs font-medium text-white appearance-none focus:outline-none focus:border-indigo-500 cursor-pointer transition-all">
                                <option value="auto" ${s.audioQuality === 'auto' && isVip ? 'selected' : ''} class="bg-[#161922] text-white">Otomatis (Adaptif Jaringan) ${!isVip ? '🔒 (Khusus VIP)' : ''}</option>
                                <option value="high" ${s.audioQuality === 'high' && isVip ? 'selected' : ''} class="bg-[#161922] text-white">Kualitas Tinggi (256 - 320 kbps) ${!isVip ? '🔒 (Khusus VIP)' : ''}</option>
                                <option value="standard" ${(s.audioQuality === 'standard' || !isVip) ? 'selected' : ''} class="bg-[#161922] text-white">Standar (128 kbps)</option>
                                <option value="saver" ${s.audioQuality === 'saver' ? 'selected' : ''} class="bg-[#161922] text-white">Hemat Kuota (64 kbps)</option>
                            </select>
                            <div class="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/60">
                                <i data-lucide="chevron-down" class="w-4 h-4"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Kelompok 2: Layar & Performa -->
                <div class="space-y-2 pt-1">
                    <div class="text-[11px] font-bold uppercase tracking-wider text-white/40 px-1">
                        Layar & Performa
                    </div>

                    <!-- 5. Layar Tetap Menyala (Keep Screen Awake - KHUSUS VIP) -->
                    <div onclick="Profile.toggleSetting('keepScreenAwake')" class="p-3.5 rounded-xl ${isVip ? 'bg-white/[0.03] hover:bg-white/[0.06]' : 'bg-amber-500/[0.03] hover:bg-amber-500/[0.07] border-amber-500/20'} border border-white/10 flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.99]">
                        <div class="flex items-center gap-3 min-w-0">
                            <div class="w-8 h-8 rounded-lg ${isVip ? 'bg-white/5 border-white/10 text-white/70' : 'bg-amber-400/10 border-amber-400/20 text-amber-300'} border flex items-center justify-center shrink-0">
                                <i data-lucide="sun" class="w-4 h-4"></i>
                            </div>
                            <div class="min-w-0">
                                <div class="flex items-center gap-1.5 flex-wrap">
                                    <h4 class="text-xs font-semibold text-white">Layar Tetap Menyala (Keep Screen Awake)</h4>
                                    ${isVip ? '<span class="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-0.5"><i data-lucide="check" class="w-2.5 h-2.5"></i> VIP</span>' : '<span class="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-0.5"><i data-lucide="lock" class="w-2.5 h-2.5"></i> VIP</span>'}
                                </div>
                                <p class="text-[11px] text-white/50 leading-snug mt-0.5">Mencegah layar HP mati/terkunci saat memutar lagu</p>
                            </div>
                        </div>
                        <div class="shrink-0 pl-1">
                            <div id="setting-switch-track-keepScreenAwake" class="w-11 h-6 rounded-full p-0.5 flex items-center ${(s.keepScreenAwake && isVip) ? 'bg-indigo-600' : 'bg-white/10 border border-white/15'} cursor-pointer transition-colors duration-200">
                                <div id="setting-switch-knob-keepScreenAwake" class="w-5 h-5 rounded-full ${(s.keepScreenAwake && isVip) ? 'bg-white' : 'bg-white/70'} shadow-md transition-transform duration-200" style="transform: translate3d(${(s.keepScreenAwake && isVip) ? '20px' : '0px'}, 0, 0);"></div>
                            </div>
                        </div>
                    </div>

                    <!-- 6. Mode Hemat Baterai (Eco Mode) -->
                    <div onclick="Profile.toggleSetting('ecoMode')" class="p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.99]">
                        <div class="flex items-center gap-3 min-w-0">
                            <div class="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/70 shrink-0">
                                <i data-lucide="zap" class="w-4 h-4"></i>
                            </div>
                            <div class="min-w-0">
                                <h4 class="text-xs font-semibold text-white">Mode Hemat Baterai (Eco Mode)</h4>
                                <p class="text-[11px] text-white/50 leading-snug mt-0.5">Nonaktifkan blur dan animasi berat untuk menghemat daya</p>
                            </div>
                        </div>
                        <div class="shrink-0 pl-1">
                            <div id="setting-switch-track-ecoMode" class="w-11 h-6 rounded-full p-0.5 flex items-center ${s.ecoMode ? 'bg-indigo-600' : 'bg-white/10 border border-white/15'} cursor-pointer transition-colors duration-200">
                                <div id="setting-switch-knob-ecoMode" class="w-5 h-5 rounded-full ${s.ecoMode ? 'bg-white' : 'bg-white/70'} shadow-md transition-transform duration-200" style="transform: translate3d(${s.ecoMode ? '20px' : '0px'}, 0, 0);"></div>
                            </div>
                        </div>
                    </div>

                    <!-- 7. Gestur Usap Layar (Swipe Gestures - KHUSUS VIP) -->
                    <div onclick="Profile.toggleSetting('swipeGestures')" class="p-3.5 rounded-xl ${isVip ? 'bg-white/[0.03] hover:bg-white/[0.06]' : 'bg-amber-500/[0.03] hover:bg-amber-500/[0.07] border-amber-500/20'} border border-white/10 flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.99]">
                        <div class="flex items-center gap-3 min-w-0">
                            <div class="w-8 h-8 rounded-lg ${isVip ? 'bg-white/5 border-white/10 text-white/70' : 'bg-amber-400/10 border-amber-400/20 text-amber-300'} border flex items-center justify-center shrink-0">
                                <i data-lucide="move-horizontal" class="w-4 h-4"></i>
                            </div>
                            <div class="min-w-0">
                                <div class="flex items-center gap-1.5 flex-wrap">
                                    <h4 class="text-xs font-semibold text-white">Gestur Usap Layar (Swipe Gestures)</h4>
                                    ${isVip ? '<span class="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-0.5"><i data-lucide="check" class="w-2.5 h-2.5"></i> VIP</span>' : '<span class="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-0.5"><i data-lucide="lock" class="w-2.5 h-2.5"></i> VIP</span>'}
                                </div>
                                <p class="text-[11px] text-white/50 leading-snug mt-0.5">Usap cover player untuk ganti lagu atau tutup player</p>
                            </div>
                        </div>
                        <div class="shrink-0 pl-1">
                            <div id="setting-switch-track-swipeGestures" class="w-11 h-6 rounded-full p-0.5 flex items-center ${(s.swipeGestures && isVip) ? 'bg-indigo-600' : 'bg-white/10 border border-white/15'} cursor-pointer transition-colors duration-200">
                                <div id="setting-switch-knob-swipeGestures" class="w-5 h-5 rounded-full ${(s.swipeGestures && isVip) ? 'bg-white' : 'bg-white/70'} shadow-md transition-transform duration-200" style="transform: translate3d(${(s.swipeGestures && isVip) ? '20px' : '0px'}, 0, 0);"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Kelompok 3: Penyimpanan & Cache -->
                <div class="space-y-2 pt-1">
                    <div class="text-[11px] font-bold uppercase tracking-wider text-white/40 px-1">
                        Penyimpanan & Memori
                    </div>

                    <!-- 8. Pembersih Cache & Memori (Storage Manager) -->
                    <div class="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-3">
                        <div class="flex items-center gap-3 min-w-0">
                            <div class="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/70 shrink-0">
                                <i data-lucide="hard-drive" class="w-4 h-4"></i>
                            </div>
                            <div class="min-w-0">
                                <h4 class="text-xs font-semibold text-white">Pembersih Cache & Memori</h4>
                                <p class="text-[11px] text-white/50 leading-snug mt-0.5">
                                    Ukuran cache: <span id="setting-cache-size-text" class="text-white/80 font-mono font-medium">Menghitung...</span>
                                </p>
                            </div>
                        </div>
                        <div class="shrink-0">
                            <button id="setting-clear-cache-btn" onclick="Profile.clearAppCache()" class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 text-xs text-white font-medium border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer">
                                <span>Bersihkan</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;

        modal.onclick = function(e) {
            if (e.target === modal) Profile.closeSettingsModal();
        };

        document.body.appendChild(modal);
        if (typeof lucide !== 'undefined') lucide.createIcons();
        Profile.calculateCacheSize();
    },

    closeSettingsModal() {
        var modal = gid('musifystar-settings-modal');
        if (modal) modal.remove();
    },

    openSleepTimerModal() {
        Profile.closeSettingsModal();
        if (typeof openSleepTimer === 'function') {
            openSleepTimer();
        } else if (typeof window.openSleepTimer === 'function') {
            window.openSleepTimer();
        }
    },

    // Submit Feedback ke Server
    async submitFeedback(event) {
        event.preventDefault();

        var nameEl = gid('fb-name');
        var msgEl = gid('fb-message');
        var contactEl = gid('fb-contact');
        var statusBox = gid('fb-status-box');
        var statusMsg = gid('fb-status-msg');
        var submitBtn = gid('fb-submit-btn');

        var name = (nameEl ? nameEl.value : '').trim();
        var message = (msgEl ? msgEl.value : '').trim();
        var contact = (contactEl ? contactEl.value : '').trim();

        if (!name || !message) return;

        if (statusBox) statusBox.classList.add('hidden');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.classList.add('opacity-70');
            submitBtn.innerHTML = `<span>Mengirim...</span>`;
        }

        try {
            var u = (typeof Auth !== 'undefined' && Auth.currentUser) ? Auth.currentUser : null;
            var userLogged = !!u;
            var username = u ? (u.username || '') : '';
            var email = u ? (u.email || '') : '';
            var userAvatar = u ? (u.avatar || '') : '';

            var res = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name,
                    message: message,
                    contact: contact,
                    userLogged: userLogged,
                    username: username,
                    email: email,
                    userAvatar: userAvatar
                })
            });
            var data = await res.json();

            if (data.status) {
                Profile.closeFeedbackModal();
                if (typeof showToast === 'function') {
                    showToast('Pesan dan masukan Anda berhasil terkirim. Terima kasih!');
                }
            } else {
                if (statusBox && statusMsg) {
                    statusMsg.innerText = data.message || 'Gagal mengirim pesan';
                    statusBox.classList.remove('hidden');
                }
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.classList.remove('opacity-70');
                    submitBtn.innerHTML = `<i data-lucide="send" class="w-4 h-4"></i> <span>Kirim Pesan</span>`;
                    lucide.createIcons();
                }
            }
        } catch (err) {
            if (statusBox && statusMsg) {
                statusMsg.innerText = 'Koneksi bermasalah saat mengirim pesan';
                statusBox.classList.remove('hidden');
            }
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.classList.remove('opacity-70');
                submitBtn.innerHTML = `<i data-lucide="send" class="w-4 h-4"></i> <span>Kirim Pesan</span>`;
                lucide.createIcons();
            }
        }
    },

    getAdminToken() {
        return sessionStorage.getItem('musifystar_admin_token') || localStorage.getItem('musifystar_admin_token') || '';
    },

    setAdminToken(token) {
        if (token) {
            try { sessionStorage.setItem('musifystar_admin_token', token); } catch(e){}
            try { localStorage.setItem('musifystar_admin_token', token); } catch(e){}
        } else {
            try { sessionStorage.removeItem('musifystar_admin_token'); } catch(e){}
            try { localStorage.removeItem('musifystar_admin_token'); } catch(e){}
        }
    },

    // Buka dialog Akses Admin
    async openAdminModal() {
        var u = (typeof Auth !== 'undefined' && Auth.currentUser) ? Auth.currentUser : null;
        var isMasterAdmin = u && ((u.email || u.rawEmail || '').toLowerCase().trim() === 'jrnabil570@gmail.com');
        if (!isMasterAdmin) {
            if (typeof showToast === 'function') {
                showToast('Akses Ditolak Hanya Admin Yang Bisa Akses');
            }
            return;
        }

        var token = Profile.getAdminToken();
        if (token) {
            try {
                var res = await fetch('/api/admin-auth', {
                    headers: { 'x-admin-token': token }
                });
                var data = await res.json();
                if (data.authenticated) {
                    Profile.renderAdminDashboard();
                    return;
                }
            } catch (e) {}
            Profile.setAdminToken(null);
        }

        // Tampilkan layar Login / Verifikasi Kredensial
        Profile.renderAdminLogin();
    },

    closeAdminModal() {
        if (Profile.adminRefreshInterval) {
            clearInterval(Profile.adminRefreshInterval);
            Profile.adminRefreshInterval = null;
        }
        var modal = gid('musifystar-admin-modal');
        if (modal) modal.remove();
    },

    // Tampilan Formulir Login Admin (Username & Password)
    async renderAdminLogin() {
        var existing = gid('musifystar-admin-modal');
        if (existing) existing.remove();

        var isSetup = false;
        try {
            var statusRes = await fetch('/api/admin-auth');
            var statusData = await statusRes.json();
            if (statusData && !statusData.hasCredentials) {
                isSetup = true;
            }
        } catch (e) {}

        var modal = document.createElement('div');
        modal.id = 'musifystar-admin-modal';
        modal.className = 'fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in';
        modal.innerHTML = `
        <div class="w-full max-w-md bg-[#11131a] border border-white/20 rounded-3xl shadow-2xl overflow-hidden relative p-6 sm:p-7" style="box-shadow: 0 25px 50px -12px rgba(244,63,94,0.25);">
            
            <!-- Close Button -->
            <button onclick="Profile.closeAdminModal()" class="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer">
                <i data-lucide="x" class="w-4 h-4"></i>
            </button>

            <!-- Icon & Header -->
            <div class="text-center mb-6 pt-2">
                <div class="w-14 h-14 mx-auto mb-3.5 rounded-2xl bg-gradient-to-tr from-rose-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/30">
                    <i data-lucide="lock" class="w-7 h-7"></i>
                </div>
                <h2 class="text-xl font-black text-white tracking-tight">Akses Administrator</h2>
                <p class="text-xs text-white/60 mt-1">
                    ${isSetup ? 'Pengaturan Awal: Buat Username & Password admin baru' : 'Masukkan kredensial Anda untuk melanjutkan'}
                </p>
            </div>

            <!-- Error Banner -->
            <div id="admin-login-error" class="hidden mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <i data-lucide="alert-circle" class="w-4 h-4 shrink-0"></i>
                <span id="admin-login-error-msg"></span>
            </div>

            <!-- Form -->
            <form onsubmit="Profile.handleAdminAuth(event, ${isSetup})" class="space-y-4">
                <div>
                    <label class="block text-xs font-semibold text-white/70 mb-1.5 uppercase tracking-wider">Username</label>
                    <div class="relative">
                        <i data-lucide="user" class="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                        <input type="text" id="admin-input-user" required autocomplete="off" placeholder="Masukkan username" class="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-rose-500 transition-colors" />
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-semibold text-white/70 mb-1.5 uppercase tracking-wider">Password</label>
                    <div class="relative">
                        <i data-lucide="key" class="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                        <input type="password" id="admin-input-pass" required autocomplete="current-password" placeholder="Masukkan password" class="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-rose-500 transition-colors" />
                    </div>
                </div>

                <button type="submit" id="admin-submit-btn" class="w-full btn-chrome font-bold py-3.5 rounded-xl active:scale-95 transition-all text-center flex items-center justify-center gap-2 mt-2 shadow-lg">
                    <i data-lucide="log-in" class="w-4 h-4"></i>
                    <span>${isSetup ? 'Simpan & Masuk' : 'Masuk Admin'}</span>
                </button>
            </form>
        </div>`;

        document.body.appendChild(modal);
        lucide.createIcons();
    },

    // Handle verifikasi Login / Setup
    async handleAdminAuth(event, isSetup) {
        event.preventDefault();

        var userInput = gid('admin-input-user');
        var passInput = gid('admin-input-pass');
        var errorBox = gid('admin-login-error');
        var errorMsg = gid('admin-login-error-msg');
        var submitBtn = gid('admin-submit-btn');

        var username = (userInput ? userInput.value : '').trim();
        var password = (passInput ? passInput.value : '');

        if (!username || !password) return;

        if (errorBox) errorBox.classList.add('hidden');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.classList.add('opacity-70');
            submitBtn.innerText = 'Memverifikasi...';
        }

        try {
            var res = await fetch('/api/admin-auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: isSetup ? 'setup' : 'login',
                    username: username,
                    password: password
                })
            });
            var data = await res.json();

            if (data.require2FA && data.tempToken) {
                Profile.render2FALoginStep(data.tempToken);
            } else if (data.success && data.token) {
                Profile.setAdminToken(data.token);
                if (typeof showToast === 'function') {
                    showToast(isSetup ? 'Kredensial berhasil dibuat! Masuk admin.' : 'Login admin berhasil!');
                }
                Profile.renderAdminDashboard();
            } else {
                if (errorBox && errorMsg) {
                    errorMsg.innerText = data.message || 'Username atau password salah';
                    errorBox.classList.remove('hidden');
                }
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.classList.remove('opacity-70');
                    submitBtn.innerHTML = `<i data-lucide="log-in" class="w-4 h-4"></i> <span>${isSetup ? 'Simpan & Masuk' : 'Masuk Admin'}</span>`;
                    lucide.createIcons();
                }
            }
        } catch (err) {
            if (errorBox && errorMsg) {
                errorMsg.innerText = 'Gagal menghubungi server autentikasi';
                errorBox.classList.remove('hidden');
            }
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.classList.remove('opacity-70');
                submitBtn.innerHTML = `<i data-lucide="log-in" class="w-4 h-4"></i> <span>${isSetup ? 'Simpan & Masuk' : 'Masuk Admin'}</span>`;
                lucide.createIcons();
            }
        }
    },

    render2FALoginStep(tempToken) {
        var modal = gid('musifystar-admin-modal');
        if (!modal) {
            Profile.renderAdminLogin();
            modal = gid('musifystar-admin-modal');
        }
        if (!modal) return;

        modal.innerHTML = `
        <div class="w-full max-w-md bg-[#11131a] border border-emerald-500/30 rounded-3xl shadow-2xl overflow-hidden relative p-6 sm:p-7" style="box-shadow: 0 25px 50px -12px rgba(16,185,129,0.25);">
            
            <!-- Close Button -->
            <button onclick="Profile.closeAdminModal()" class="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer">
                <i data-lucide="x" class="w-4 h-4"></i>
            </button>

            <!-- Icon & Header -->
            <div class="text-center mb-6 pt-2">
                <div class="w-14 h-14 mx-auto mb-3.5 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                    <i data-lucide="shield-check" class="w-7 h-7"></i>
                </div>
                <h2 class="text-xl font-black text-white tracking-tight">Verifikasi</h2>
                <p class="text-xs text-white/60 mt-1">
                    Masukkan 6 digit kode OTP dari Authenticator
                </p>
            </div>

            <!-- Error Banner -->
            <div id="admin-2fa-error" class="hidden mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <i data-lucide="alert-circle" class="w-4 h-4 shrink-0"></i>
                <span id="admin-2fa-error-msg"></span>
            </div>

            <!-- Form -->
            <form onsubmit="Profile.handleVerify2FALogin(event, '${tempToken}')" class="space-y-4">
                <div>
                    <label class="block text-xs font-semibold text-white/70 mb-1.5 uppercase tracking-wider text-center">Kode OTP (6 Digit)</label>
                    <input type="text" id="admin-otp-input" required maxlength="6" pattern="[0-9]{6}" inputmode="numeric" autocomplete="one-time-code" placeholder="000000" class="w-full text-center text-2xl font-mono tracking-[0.4em] py-3 bg-black/50 border border-white/20 rounded-xl text-emerald-400 placeholder:text-white/20 focus:outline-none focus:border-emerald-500 transition-colors" autofocus />
                </div>

                <button type="submit" id="admin-otp-submit-btn" class="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer">
                    <i data-lucide="check-circle" class="w-4 h-4"></i>
                    <span>Verifikasi & Masuk</span>
                </button>

                <div class="text-center pt-1">
                    <button type="button" onclick="Profile.renderAdminLogin()" class="text-xs text-white/50 hover:text-white transition-all underline cursor-pointer">
                        Kembali ke Login Username & Password
                    </button>
                </div>
            </form>
        </div>`;

        lucide.createIcons();
        setTimeout(function() {
            var inp = gid('admin-otp-input');
            if (inp) inp.focus();
        }, 100);
    },

    async handleVerify2FALogin(event, tempToken) {
        if (event && event.preventDefault) event.preventDefault();
        var otpInput = gid('admin-otp-input');
        var errorBox = gid('admin-2fa-error');
        var errorMsg = gid('admin-2fa-error-msg');
        var submitBtn = gid('admin-otp-submit-btn');

        var otp = otpInput ? otpInput.value.trim() : '';
        if (!otp || otp.length !== 6) return;

        if (errorBox) errorBox.classList.add('hidden');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> <span>Memverifikasi OTP...</span>';
            lucide.createIcons();
        }

        try {
            var res = await fetch('/api/admin-auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'verify_2fa',
                    tempToken: tempToken,
                    otp: otp
                })
            });
            var data = await res.json();

            if (data.success && data.token) {
                Profile.setAdminToken(data.token);
                if (typeof showToast === 'function') {
                    showToast('Verifikasi 2FA berhasil! Selamat datang Admin.');
                }
                Profile.renderAdminDashboard();
            } else {
                if (errorBox && errorMsg) {
                    errorMsg.innerText = data.message || 'Kode OTP salah atau kedaluwarsa';
                    errorBox.classList.remove('hidden');
                }
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i data-lucide="check-circle" class="w-4 h-4"></i> <span>Verifikasi & Masuk</span>';
                    lucide.createIcons();
                }
            }
        } catch (e) {
            if (errorBox && errorMsg) {
                errorMsg.innerText = 'Gagal memverifikasi OTP dengan server';
                errorBox.classList.remove('hidden');
            }
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i data-lucide="check-circle" class="w-4 h-4"></i> <span>Verifikasi & Masuk</span>';
                lucide.createIcons();
            }
        }
    },

    // State Tab Admin
    adminActiveTab: 'analytics',
    adminRefreshInterval: null,

    // Tampilan Area Admin: User Feedback Inbox & Analytics
    async renderAdminDashboard() {
        var existing = gid('musifystar-admin-modal');
        if (existing) existing.remove();

        var token = Profile.getAdminToken();

        var modal = document.createElement('div');
        modal.id = 'musifystar-admin-modal';
        modal.className = 'fixed inset-0 z-[250] flex items-center justify-center p-2.5 sm:p-5 bg-black/85 backdrop-blur-xl animate-fade-in';
        modal.innerHTML = `
        <div class="w-full max-w-4xl h-[90vh] max-h-[850px] bg-[#11131a] border border-white/20 rounded-3xl shadow-2xl overflow-hidden relative flex flex-col" style="box-shadow: 0 25px 60px -15px rgba(244,63,94,0.25);">
            
            <!-- Modal Header -->
            <div class="px-5 py-3.5 border-b border-white/10 bg-white/[0.04] backdrop-blur-md flex items-center justify-between shrink-0">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20 shrink-0">
                        <i data-lucide="shield-check" class="w-5 h-5"></i>
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <h2 class="text-base sm:text-lg font-black text-white tracking-tight">Panel Administrator</h2>
                            <span class="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Terautentikasi
                            </span>
                        </div>
                        <p class="text-xs text-white/60">MusifyStar StudioMusik &bull; Sesi Aktif</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="Profile.refreshAdminData()" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer" title="Perbarui Data">
                        <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                    </button>
                    <button onclick="Profile.closeAdminModal()" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer" title="Tutup">
                        <i data-lucide="x" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>

            <!-- Tab Switcher Navigation -->
            <div class="px-5 py-2.5 bg-black/40 border-b border-white/10 flex items-center justify-between gap-3 text-xs shrink-0 overflow-x-auto hide-scrollbar">
                <div class="flex items-center gap-2">
                    <button id="admin-tab-btn-analytics" onclick="Profile.setAdminTab('analytics')" class="px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-md shadow-rose-500/20 whitespace-nowrap">
                        <i data-lucide="activity" class="w-4 h-4"></i>
                        <span>Analitik Live</span>
                    </button>
                    <button id="admin-tab-btn-globalstats" onclick="Profile.setAdminTab('globalstats')" class="px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-400/40 hover:text-white whitespace-nowrap shadow-sm shadow-amber-500/20">
                        <i data-lucide="trophy" class="w-4 h-4 text-amber-400"></i>
                        <span>Leaderboard & Durasi</span>
                        <span id="admin-lb-count-badge" class="hidden text-[10px] bg-amber-400 text-black px-1.5 py-0.2 rounded-full font-black">0</span>
                    </button>
                    <button id="admin-tab-btn-theme" onclick="Profile.setAdminTab('theme')" class="px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-white/5 hover:bg-white/10 text-white/70 hover:text-white whitespace-nowrap">
                        <i data-lucide="palette" class="w-4 h-4"></i>
                        <span>Tema Musiman</span>
                    </button>
                    <button id="admin-tab-btn-broadcast" onclick="Profile.setAdminTab('broadcast')" class="px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-white/5 hover:bg-white/10 text-white/70 hover:text-white whitespace-nowrap">
                        <i data-lucide="megaphone" class="w-4 h-4 text-amber-400"></i>
                        <span>Pengumuman Beranda</span>
                        <span id="admin-broadcast-status-badge" class="hidden text-[9px] bg-emerald-500 text-black px-2 py-0.5 rounded-full font-black uppercase tracking-wider animate-pulse shadow-sm shadow-emerald-500/50">LIVE</span>
                    </button>
                    <button id="admin-tab-btn-version" onclick="Profile.setAdminTab('version')" class="px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-white/5 hover:bg-white/10 text-white/70 hover:text-white whitespace-nowrap">
                        <i data-lucide="tag" class="w-4 h-4 text-sky-400"></i>
                        <span>Versi Aplikasi</span>
                        <span id="admin-version-tab-badge" class="text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/30 px-1.5 py-0.2 rounded-full font-mono font-bold">${Profile.appVersion || 'v1.0.0'}</span>
                    </button>
                    <button id="admin-tab-btn-feedback" onclick="Profile.setAdminTab('feedback')" class="px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-white/5 hover:bg-white/10 text-white/70 hover:text-white whitespace-nowrap">
                        <i data-lucide="inbox" class="w-4 h-4"></i>
                        <span>Pesan Pengguna</span>
                        <span id="admin-feedback-badge" class="hidden text-[10px] bg-rose-500 text-white px-1.5 py-0.2 rounded-full font-bold">0</span>
                    </button>
                    <button id="admin-tab-btn-security" onclick="Profile.setAdminTab('security')" class="px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-white/5 hover:bg-white/10 text-white/70 hover:text-white whitespace-nowrap">
                        <i data-lucide="shield-check" class="w-4 h-4"></i>
                        <span>Keamanan & 2FA</span>
                    </button>
                    <button id="admin-tab-btn-users" onclick="Profile.setAdminTab('users')" class="px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-white/5 hover:bg-white/10 text-white/70 hover:text-white whitespace-nowrap">
                        <i data-lucide="history" class="w-4 h-4 text-sky-400"></i>
                        <span>Log Login Pengguna</span>
                    </button>
                    <button id="admin-tab-btn-vip" onclick="Profile.setAdminTab('vip')" class="px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-400/40 hover:text-white whitespace-nowrap shadow-sm shadow-amber-500/20">
                        <i data-lucide="crown" class="w-4 h-4 text-amber-400"></i>
                        <span>Berikan Akses VIP</span>
                        <span id="admin-vip-count-badge" class="hidden text-[10px] bg-amber-400 text-black px-1.5 py-0.2 rounded-full font-black">0</span>
                    </button>
                    <button id="admin-tab-btn-vouchers" onclick="Profile.setAdminTab('vouchers')" class="px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-400/40 hover:text-white whitespace-nowrap shadow-sm shadow-amber-500/20">
                        <i data-lucide="ticket" class="w-4 h-4 text-amber-400"></i>
                        <span>Kelola Kode Voucher VIP</span>
                        <span id="admin-vouchers-count-badge" class="hidden text-[10px] bg-amber-400 text-black px-1.5 py-0.2 rounded-full font-black">0</span>
                    </button>
                    <button id="admin-tab-btn-bans" onclick="Profile.setAdminTab('bans')" class="px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-white/5 hover:bg-white/10 text-white/70 hover:text-white whitespace-nowrap">
                        <i data-lucide="shield-alert" class="w-4 h-4 text-rose-400"></i>
                        <span>Atur Sanksi & Ban</span>
                        <span id="admin-banned-count-badge" class="hidden text-[10px] bg-rose-500 text-white px-1.5 py-0.2 rounded-full font-bold">0</span>
                    </button>
                    <button id="admin-tab-btn-payment" onclick="Profile.setAdminTab('payment')" class="px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-white/5 hover:bg-white/10 text-white/70 hover:text-white whitespace-nowrap">
                        <i data-lucide="qr-code" class="w-4 h-4 text-amber-400"></i>
                        <span>QRIS & Pembayaran</span>
                    </button>
                    <button id="admin-tab-btn-messages" onclick="Profile.setAdminTab('messages')" class="px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-white/5 hover:bg-white/10 text-white/70 hover:text-white whitespace-nowrap">
                        <i data-lucide="send" class="w-4 h-4 text-emerald-400"></i>
                        <span>Pesan Pengguna (Direct)</span>
                    </button>
                    <button id="admin-tab-btn-avatars" onclick="Profile.setAdminTab('avatars')" class="px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-white/5 hover:bg-white/10 text-white/70 hover:text-white whitespace-nowrap">
                        <i data-lucide="palette" class="w-4 h-4 text-[#ccff00]"></i>
                        <span>Koleksi Avatar (VIP/Kunci)</span>
                    </button>
                    <button id="admin-tab-btn-borders" onclick="Profile.setAdminTab('borders')" class="px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-400/40 hover:text-white whitespace-nowrap shadow-sm shadow-amber-500/20">
                        <i data-lucide="shield" class="w-4 h-4 text-amber-400"></i>
                        <span>Tambah Border Profile</span>
                        <span class="text-[9px] bg-amber-400 text-black px-1.5 py-0.2 rounded-full font-black uppercase tracking-wider">VIP</span>
                    </button>
                    <button id="admin-tab-btn-siteupdate" onclick="Profile.setAdminTab('siteupdate')" class="px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-white/5 hover:bg-white/10 text-white/70 hover:text-white whitespace-nowrap">
                        <i data-lucide="external-link" class="w-4 h-4 text-cyan-400"></i>
                        <span>Banner Update Link (Tengah Layar)</span>
                        <span id="admin-siteupdate-status-badge" class="hidden text-[9px] bg-cyan-400 text-black px-2 py-0.5 rounded-full font-black uppercase tracking-wider animate-pulse shadow-sm shadow-cyan-400/50">LIVE</span>
                    </button>
                </div>

                <div id="admin-live-ticker" class="hidden sm:flex items-center gap-2 text-[11px] text-white/50 shrink-0">
                    <span class="relative flex h-2 w-2">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span>Monitoring Real-Time Aktif</span>
                </div>
            </div>

            <!-- Views Container -->
            <div class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 hide-scrollbar">
                <!-- TAB 1: ANALYTICS VIEW -->
                <div id="admin-view-analytics" class="space-y-4">
                    <div class="text-center py-12 text-white/50 space-y-2">
                        <i data-lucide="loader-2" class="w-8 h-8 animate-spin mx-auto text-rose-400"></i>
                        <p class="text-xs">Memuat metrik analitik real-time...</p>
                    </div>
                </div>

                <!-- TAB 2: SEASONAL THEME SWITCHER -->
                <div id="admin-view-theme" class="hidden space-y-4">
                    <div id="admin-theme-container">
                        <!-- Populated by renderAdminThemeTab -->
                    </div>
                </div>

                <!-- TAB 3: BROADCAST NOTIFICATION / RUNNING TEXT -->
                <div id="admin-view-broadcast" class="hidden space-y-4">
                    <div id="admin-broadcast-container">
                        <!-- Populated by renderAdminBroadcastTab -->
                    </div>
                </div>

                <!-- TAB 4: APP VERSION MANAGEMENT -->
                <div id="admin-view-version" class="hidden space-y-4">
                    <div id="admin-version-container">
                        <!-- Populated by renderAdminVersionTab -->
                    </div>
                </div>

                <!-- TAB 5: FEEDBACK INBOX VIEW -->
                <div id="admin-view-feedback" class="hidden space-y-3">
                    <div id="admin-feedbacks-container" class="space-y-3">
                        <div class="text-center py-12 text-white/50 space-y-2">
                            <i data-lucide="loader-2" class="w-8 h-8 animate-spin mx-auto text-rose-400"></i>
                            <p class="text-xs">Mengambil data pesan masukan...</p>
                        </div>
                    </div>
                </div>

                <!-- TAB 6: SECURITY & 2FA VIEW -->
                <div id="admin-view-security" class="hidden space-y-4">
                    <div id="admin-security-container">
                        <!-- Populated by renderAdminSecurityTab -->
                    </div>
                </div>

                <!-- TAB 7: LOG LOGIN PENGGUNA VIEW -->
                <div id="admin-view-users" class="hidden space-y-4">
                    <div id="admin-users-container">
                        <!-- Populated by loadAdminUsersList -->
                    </div>
                </div>

                <!-- TAB VIP: BERIKAN AKSES VIP & KELOLA BORDER VIEW -->
                <div id="admin-view-vip" class="hidden space-y-4">
                    <div id="admin-vip-container">
                        <!-- Populated by loadAdminVipTab -->
                    </div>
                </div>

                <!-- TAB 8: ATUR SANKSI & BLOKIR VIEW -->
                <div id="admin-view-bans" class="hidden space-y-4">
                    <div id="admin-bans-container">
                        <!-- Populated by loadAdminBansList -->
                    </div>
                </div>

                <!-- TAB 9: DYNAMIC QRIS & PAYMENT CONFIGURATOR -->
                <div id="admin-view-payment" class="hidden space-y-4">
                    <div id="admin-payment-container">
                        <!-- Populated by renderAdminPaymentTab -->
                    </div>
                </div>

                <!-- TAB 10: DIRECT USER MESSAGING (ADMIN TO USER) -->
                <div id="admin-view-messages" class="hidden space-y-4">
                    <div id="admin-messages-container">
                        <!-- Populated by renderAdminMessagesTab -->
                    </div>
                </div>

                <!-- TAB 11: SITE UPDATE LINK BANNER (TENGAH LAYAR) -->
                <div id="admin-view-siteupdate" class="hidden space-y-4">
                    <div id="admin-siteupdate-container">
                        <!-- Populated by renderAdminSiteUpdateTab -->
                    </div>
                </div>

                <!-- TAB 12: AVATAR MANAGEMENT (VIP / KUNCI / TAMBAH) -->
                <div id="admin-view-avatars" class="hidden space-y-4">
                    <div id="admin-avatars-container">
                        <!-- Populated by renderAdminAvatarsTab -->
                    </div>
                </div>

                <!-- TAB 13: LEADERBOARD & GLOBAL STATS MANAGEMENT -->
                <div id="admin-view-globalstats" class="hidden space-y-4">
                    <div id="admin-globalstats-container" class="space-y-4">
                        <div class="text-center py-12 text-white/50 space-y-2">
                            <i data-lucide="loader-2" class="w-8 h-8 animate-spin mx-auto text-amber-400"></i>
                            <p class="text-xs">Memuat data peringkat & kontrol leaderboard...</p>
                        </div>
                    </div>
                </div>

                <!-- TAB 14: BORDER PROFILE MANAGEMENT (TAMBAH BORDER & VIP TIER) -->
                <div id="admin-view-borders" class="hidden space-y-4">
                    <div id="admin-borders-container" class="space-y-4">
                        <div class="text-center py-12 text-white/50 space-y-2">
                            <i data-lucide="loader-2" class="w-8 h-8 animate-spin mx-auto text-amber-400"></i>
                            <p class="text-xs">Memuat data koleksi border profile VIP...</p>
                        </div>
                    </div>
                </div>

                <!-- TAB 15: VOUCHER MANAGEMENT (ISI & KELOLA KODE VOUCHER VIP) -->
                <div id="admin-view-vouchers" class="hidden space-y-4">
                    <div id="admin-vouchers-container" class="space-y-4">
                        <div class="text-center py-12 text-white/50 space-y-2">
                            <i data-lucide="loader-2" class="w-8 h-8 animate-spin mx-auto text-amber-400"></i>
                            <p class="text-xs">Memuat data kode voucher VIP...</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer with Logout -->
            <div class="px-5 py-3 bg-black/40 border-t border-white/10 flex items-center justify-between text-xs shrink-0">
                <span class="text-white/40 text-[11px]">MusifyStar StudioMusik &bull; Server Engine v2.0</span>
                <button onclick="Profile.adminLogout()" class="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-rose-500/10 active:scale-95 transition-all cursor-pointer">
                    <i data-lucide="log-out" class="w-3.5 h-3.5"></i> Keluar (Logout)
                </button>
            </div>
        </div>`;

        document.body.appendChild(modal);
        lucide.createIcons();

        // Setup auto-refresh ticker for global counters
        if (Profile.adminRefreshInterval) clearInterval(Profile.adminRefreshInterval);
        Profile.adminRefreshInterval = setInterval(function() {
            if (gid('musifystar-admin-modal')) {
                // Jangan refresh otomatis jika user sedang mengetik atau di tab form (vouchers, dsb) agar tidak hilang sendiri saat didiamkan
                var activeEl = document.activeElement;
                var isTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT');
                if (!isTyping && Profile.adminActiveTab !== 'vouchers') {
                    Profile.refreshAdminData(true);
                }
            } else {
                clearInterval(Profile.adminRefreshInterval);
            }
        }, 30000);

        // Load active tab
        Profile.setAdminTab(Profile.adminActiveTab || 'analytics');
    },

    setAdminTab(tab) {
        Profile.adminActiveTab = tab;
        var btnAnalytics = gid('admin-tab-btn-analytics');
        var btnGlobalStats = gid('admin-tab-btn-globalstats');
        var btnTheme = gid('admin-tab-btn-theme');
        var btnBroadcast = gid('admin-tab-btn-broadcast');
        var btnVersion = gid('admin-tab-btn-version');
        var btnFeedback = gid('admin-tab-btn-feedback');
        var btnSecurity = gid('admin-tab-btn-security');
        var btnUsers = gid('admin-tab-btn-users');
        var btnVip = gid('admin-tab-btn-vip');
        var btnVouchers = gid('admin-tab-btn-vouchers');
        var btnBans = gid('admin-tab-btn-bans');
        var btnPayment = gid('admin-tab-btn-payment');
        var btnMessages = gid('admin-tab-btn-messages');
        var btnAvatars = gid('admin-tab-btn-avatars');
        var btnBorders = gid('admin-tab-btn-borders');
        var btnSiteUpdate = gid('admin-tab-btn-siteupdate');
        var viewAnalytics = gid('admin-view-analytics');
        var viewGlobalStats = gid('admin-view-globalstats');
        var viewTheme = gid('admin-view-theme');
        var viewBroadcast = gid('admin-view-broadcast');
        var viewVersion = gid('admin-view-version');
        var viewFeedback = gid('admin-view-feedback');
        var viewSecurity = gid('admin-view-security');
        var viewUsers = gid('admin-view-users');
        var viewVip = gid('admin-view-vip');
        var viewVouchers = gid('admin-view-vouchers');
        var viewBans = gid('admin-view-bans');
        var viewPayment = gid('admin-view-payment');
        var viewMessages = gid('admin-view-messages');
        var viewAvatars = gid('admin-view-avatars');
        var viewBorders = gid('admin-view-borders');
        var viewSiteUpdate = gid('admin-view-siteupdate');

        var activeBtnClass = 'px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-md shadow-rose-500/20 whitespace-nowrap';
        var activeVipBtnClass = 'px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-lg shadow-amber-500/30 whitespace-nowrap';
        var inactiveBtnClass = 'px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-white/5 hover:bg-white/10 text-white/70 hover:text-white whitespace-nowrap';
        var inactiveVipBtnClass = 'px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-400/40 hover:text-white whitespace-nowrap shadow-sm shadow-amber-500/20';

        if (btnAnalytics) btnAnalytics.className = tab === 'analytics' ? activeBtnClass : inactiveBtnClass;
        if (btnGlobalStats) btnGlobalStats.className = tab === 'globalstats' ? activeBtnClass : inactiveBtnClass;
        if (btnTheme) btnTheme.className = tab === 'theme' ? activeBtnClass : inactiveBtnClass;
        if (btnBroadcast) btnBroadcast.className = tab === 'broadcast' ? activeBtnClass : inactiveBtnClass;
        if (btnVersion) btnVersion.className = tab === 'version' ? activeBtnClass : inactiveBtnClass;
        if (btnFeedback) btnFeedback.className = tab === 'feedback' ? activeBtnClass : inactiveBtnClass;
        if (btnSecurity) btnSecurity.className = tab === 'security' ? activeBtnClass : inactiveBtnClass;
        if (btnUsers) btnUsers.className = tab === 'users' ? activeBtnClass : inactiveBtnClass;
        if (btnVip) btnVip.className = tab === 'vip' ? activeVipBtnClass : inactiveVipBtnClass;
        if (btnVouchers) btnVouchers.className = tab === 'vouchers' ? activeVipBtnClass : inactiveVipBtnClass;
        if (btnBans) btnBans.className = tab === 'bans' ? activeBtnClass : inactiveBtnClass;
        if (btnPayment) btnPayment.className = tab === 'payment' ? activeBtnClass : inactiveBtnClass;
        if (btnMessages) btnMessages.className = tab === 'messages' ? activeBtnClass : inactiveBtnClass;
        if (btnAvatars) btnAvatars.className = tab === 'avatars' ? activeBtnClass : inactiveBtnClass;
        if (btnBorders) btnBorders.className = tab === 'borders' ? activeVipBtnClass : inactiveVipBtnClass;
        if (btnSiteUpdate) btnSiteUpdate.className = tab === 'siteupdate' ? activeBtnClass : inactiveBtnClass;

        if (viewAnalytics) viewAnalytics.classList.toggle('hidden', tab !== 'analytics');
        if (viewGlobalStats) viewGlobalStats.classList.toggle('hidden', tab !== 'globalstats');
        if (viewTheme) viewTheme.classList.toggle('hidden', tab !== 'theme');
        if (viewBroadcast) viewBroadcast.classList.toggle('hidden', tab !== 'broadcast');
        if (viewVersion) viewVersion.classList.toggle('hidden', tab !== 'version');
        if (viewFeedback) viewFeedback.classList.toggle('hidden', tab !== 'feedback');
        if (viewSecurity) viewSecurity.classList.toggle('hidden', tab !== 'security');
        if (viewUsers) viewUsers.classList.toggle('hidden', tab !== 'users');
        if (viewVip) viewVip.classList.toggle('hidden', tab !== 'vip');
        if (viewVouchers) viewVouchers.classList.toggle('hidden', tab !== 'vouchers');
        if (viewBans) viewBans.classList.toggle('hidden', tab !== 'bans');
        if (viewPayment) viewPayment.classList.toggle('hidden', tab !== 'payment');
        if (viewMessages) viewMessages.classList.toggle('hidden', tab !== 'messages');
        if (viewAvatars) viewAvatars.classList.toggle('hidden', tab !== 'avatars');
        if (viewBorders) viewBorders.classList.toggle('hidden', tab !== 'borders');
        if (viewSiteUpdate) viewSiteUpdate.classList.toggle('hidden', tab !== 'siteupdate');

        if (tab === 'analytics') {
            Profile.loadAdminAnalytics();
        } else if (tab === 'globalstats') {
            Profile.loadAdminGlobalStats();
        } else if (tab === 'theme') {
            Profile.renderAdminThemeTab();
        } else if (tab === 'broadcast') {
            Profile.renderAdminBroadcastTab();
        } else if (tab === 'version') {
            Profile.renderAdminVersionTab();
        } else if (tab === 'feedback') {
            Profile.loadAdminFeedbacks();
        } else if (tab === 'security') {
            Profile.renderAdminSecurityTab();
        } else if (tab === 'users') {
            Profile.loadAdminUsersList();
        } else if (tab === 'vip') {
            Profile.loadAdminVipTab();
        } else if (tab === 'vouchers') {
            Profile.loadAdminVouchersTab();
        } else if (tab === 'bans') {
            Profile.loadAdminBansList();
        } else if (tab === 'payment') {
            Profile.renderAdminPaymentTab();
        } else if (tab === 'messages') {
            Profile.renderAdminMessagesTab();
        } else if (tab === 'avatars') {
            Profile.renderAdminAvatarsTab();
        } else if (tab === 'borders') {
            Profile.renderAdminBordersTab();
        } else if (tab === 'siteupdate') {
            Profile.renderAdminSiteUpdateTab();
        }
    },

    refreshAdminData(silent) {
        // Auto-refresh interval (silent) only updates live counters & badges without touching forms
        if (silent) {
            if (Profile.adminActiveTab === 'analytics') {
                Profile.loadAdminAnalytics(true);
            } else if (Profile.adminActiveTab === 'globalstats') {
                Profile.loadAdminGlobalStats(true);
            } else if (Profile.adminActiveTab === 'borders') {
                Profile.loadAdminBordersList(true);
            }
            // Vouchers tab TIDAK di-refresh saat silent background ticker agar form ketikan/pilihan tidak terganggu atau hilang saat didiamkan
            Profile.checkFeedbackBadgeQuietly();
            if (typeof Profile.checkSiteUpdateBadgeQuietly === 'function') {
                Profile.checkSiteUpdateBadgeQuietly();
            }
            return;
        }

        // Manual user refresh button click
        if (Profile.adminActiveTab === 'globalstats') {
            Profile.loadAdminGlobalStats();
        } else if (Profile.adminActiveTab === 'borders') {
            Profile.loadAdminBordersList(false);
        } else if (Profile.adminActiveTab === 'feedback') {
            Profile.loadAdminFeedbacks();
        } else if (Profile.adminActiveTab === 'theme') {
            Profile.renderAdminThemeTab();
        } else if (Profile.adminActiveTab === 'broadcast') {
            Profile.renderAdminBroadcastTab();
        } else if (Profile.adminActiveTab === 'version') {
            Profile.renderAdminVersionTab();
        } else if (Profile.adminActiveTab === 'security') {
            Profile.renderAdminSecurityTab();
        } else if (Profile.adminActiveTab === 'users') {
            Profile.loadAdminUsersList();
        } else if (Profile.adminActiveTab === 'vip') {
            Profile.loadAdminVipTab();
        } else if (Profile.adminActiveTab === 'vouchers') {
            Profile.loadAdminVouchersTab();
        } else if (Profile.adminActiveTab === 'bans') {
            Profile.loadAdminBansList();
        } else if (Profile.adminActiveTab === 'payment') {
            Profile.renderAdminPaymentTab();
        } else if (Profile.adminActiveTab === 'messages') {
            Profile.renderAdminMessagesTab();
        } else if (Profile.adminActiveTab === 'siteupdate') {
            Profile.renderAdminSiteUpdateTab();
        } else {
            Profile.loadAdminAnalytics(false);
        }
    },

    async checkFeedbackBadgeQuietly() {
        var token = Profile.getAdminToken();
        if (!token) return;
        try {
            var res = await fetch('/api/feedback', {
                headers: { 'x-admin-token': token }
            });
            var data = await res.json();
            if (data.status && Array.isArray(data.feedbacks)) {
                var badgeEl = gid('admin-feedback-badge');
                var unread = data.feedbacks.filter(function(f){ return !f.isRead; }).length;
                if (badgeEl) {
                    if (unread > 0) {
                        badgeEl.innerText = unread;
                        badgeEl.classList.remove('hidden');
                    } else {
                        badgeEl.classList.add('hidden');
                    }
                }
            }
        } catch(e) {}
    },

    // 1. ANALYTICS LOADER & RENDERER
    async loadAdminAnalytics(silent) {
        var container = gid('admin-view-analytics');
        var token = Profile.getAdminToken();
        if (!token) return;

        if (!silent && container && container.innerHTML.includes('loader-2')) {
            // keep loading state
        }

        try {
            var res = await fetch('/api/analytics', {
                headers: { 'x-admin-token': token }
            });
            var data = await res.json();

            if (!data.status) {
                if (container) {
                    var isAuthError = res.status === 401 || (data.message && data.message.toLowerCase().includes('token'));
                    if (isAuthError) {
                        sessionStorage.removeItem('musifystar_admin_token');
                        container.innerHTML = `
                        <div class="text-center py-10 px-4 text-white/80 space-y-4 max-w-sm mx-auto">
                            <div class="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                                <i data-lucide="shield-alert" class="w-6 h-6"></i>
                            </div>
                            <div class="space-y-1">
                                <h4 class="text-sm font-bold text-white">Sesi Login Admin Telah Berakhir</h4>
                                <p class="text-xs text-white/50 leading-relaxed">Sesi login Anda telah kedaluwarsa atau token tidak valid di server. Silakan masuk kembali menggunakan akun admin Anda.</p>
                            </div>
                            <button onclick="Profile.renderAdminLogin()" class="w-full py-2.5 bg-gradient-to-r from-rose-500 to-amber-500 text-white text-xs font-semibold rounded-xl hover:opacity-95 active:scale-95 transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2">
                                <i data-lucide="log-in" class="w-4 h-4"></i> Masuk / Login Admin Ulang
                            </button>
                        </div>`;
                    } else {
                        container.innerHTML = `
                        <div class="text-center py-12 text-red-400 space-y-2">
                            <i data-lucide="alert-triangle" class="w-8 h-8 mx-auto"></i>
                            <p class="text-xs font-semibold">${data.message || 'Gagal mengambil analitik'}</p>
                        </div>`;
                    }
                    lucide.createIcons();
                }
                return;
            }

            var listeners = data.activeListeners || { count: 0, sessions: [] };
            var duration = data.listeningDuration || { totalSeconds: 0, totalMinutes: 0, totalHours: '0', totalSessions: 0, avgMinutesFormatted: '0 Menit', distribution: [] };
            var devices = data.deviceBreakdown || { totalDevices: 0, items: [] };
            var searches = data.searchAnalytics || { totalSearches: 0, topQueries: [] };
            var heatmap = data.listeningHeatmap || { totalPlays: 0, peakHour: '00:00', peakCount: 0, peakSegment: '-', hourly: [], segments: {} };

            // Render live currently playing track items
            var sessionsHtml = '';
            if (listeners.sessions && listeners.sessions.length > 0) {
                sessionsHtml = listeners.sessions.map(function(s) {
                    var devBadge = '';
                    if (s.device === 'android_apk') devBadge = '<span class="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono">Aplikasi Android</span>';
                    else if (s.device === 'pwa_chrome') devBadge = '<span class="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono">Aplikasi PWA</span>';
                    else if (s.device === 'safari_ios') devBadge = '<span class="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded font-mono">Safari iOS</span>';
                    else devBadge = '<span class="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded font-mono">Desktop Web</span>';

                    var u = s.user || {};
                    var isUserLoggedIn = Boolean(u.isLoggedIn && u.username && u.username !== 'Tamu (Belum Login)');
                    var displayUsername = isUserLoggedIn ? ('@' + u.username) : 'Pengguna Tamu';
                    var displayEmail = u.email ? `<span class="text-[10px] text-white/40 truncate block">${u.email}</span>` : '';
                    var userBadge = isUserLoggedIn 
                        ? '<span class="text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.2 rounded font-semibold shrink-0">Member</span>' 
                        : '<span class="text-[9px] bg-white/10 text-white/50 border border-white/15 px-1.5 py-0.2 rounded shrink-0">Tamu</span>';

                    var avatarUrl = u.avatar || (isUserLoggedIn 
                        ? `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(u.username)}` 
                        : '/logo.png');

                    var trackCover = s.image || (s.id ? `https://i.ytimg.com/vi/${s.id}/hqdefault.jpg` : '/logo.png');
                    var listenDur = s.listeningSeconds ? (Math.floor(s.listeningSeconds / 60) + 'm ' + (s.listeningSeconds % 60) + 'd') : 'Baru saja';

                    return `
                    <div class="p-3 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
                        <!-- User Profile Information -->
                        <div class="flex items-center gap-3 min-w-0 sm:w-1/2">
                            <div class="relative shrink-0">
                                <img src="${avatarUrl}" class="w-10 h-10 rounded-full object-cover bg-black/40 border border-white/15 shadow-sm" onerror="this.src='/logo.png'" />
                                <span class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#12141e] shadow-sm"></span>
                            </div>
                            <div class="min-w-0 flex-1">
                                <div class="flex items-center gap-1.5 flex-wrap">
                                    <h4 class="font-extrabold text-white text-xs truncate max-w-[160px]">${displayUsername}</h4>
                                    ${userBadge}
                                </div>
                                ${displayEmail}
                                <span class="text-[10px] text-white/50 flex items-center gap-1 mt-0.5">
                                    <i data-lucide="clock" class="w-3 h-3 text-sky-400"></i> Durasi dengar: <strong class="text-white/80">${listenDur}</strong>
                                </span>
                            </div>
                        </div>

                        <!-- Song & Device Information -->
                        <div class="flex items-center justify-between sm:justify-end gap-3 min-w-0 sm:w-1/2 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                            <div class="flex items-center gap-2.5 min-w-0 flex-1">
                                <img src="${trackCover}" class="w-10 h-10 rounded-xl object-cover bg-black/40 border border-white/10 shrink-0 shadow-sm" onerror="this.src='/logo.png'" />
                                <div class="min-w-0 flex-1">
                                    <p class="text-white font-bold text-xs truncate max-w-[200px]">${s.title || 'Sedang Mendengarkan'}</p>
                                    <div class="text-[11px] text-white/50 truncate flex items-center gap-1.5 mt-0.5">
                                        <span class="truncate">${s.artist || 'MusifyStar'}</span>
                                        ${devBadge}
                                    </div>
                                </div>
                            </div>

                            <span class="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded-full flex items-center gap-1.5 shrink-0 ml-1">
                                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                <span>Live</span>
                            </span>
                        </div>
                    </div>`;
                }).join('');
            } else {
                sessionsHtml = `
                <div class="p-5 rounded-2xl bg-white/[0.02] border border-white/5 text-xs text-white/50 text-center space-y-1.5">
                    <div class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mx-auto text-white/40">
                        <i data-lucide="headphones" class="w-5 h-5"></i>
                    </div>
                    <p class="font-bold text-white/70">Tidak ada lagu yang sedang diputar saat ini.</p>
                    <p class="text-[11px] text-white/40 max-w-md mx-auto">Saat Anda atau pengguna lain sedang memutar musik di aplikasi, profil username, foto, judul lagu, dan perangkatnya akan otomatis muncul di sini secara real-time.</p>
                </div>`;
            }

            // Render Duration Distribution Bars
            var durationBarsHtml = (duration.distribution || []).map(function(dist) {
                return `
                <div class="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex-1 min-w-[100px] flex flex-col justify-between">
                    <div class="flex items-center justify-between text-[11px] mb-1.5">
                        <span class="text-white/60 font-medium">${dist.label}</span>
                        <span class="text-white font-bold">${dist.count} sesi</span>
                    </div>
                    <div class="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mb-1">
                        <div class="h-full bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full transition-all duration-500" style="width: ${Math.max(4, dist.pct)}%;"></div>
                    </div>
                    <span class="text-[9px] text-white/40 truncate">${dist.desc}</span>
                </div>`;
            }).join('');

            // Render Device Breakdown Cards & Combined Bar
            var deviceCardsHtml = (devices.items || []).map(function(devItem) {
                return `
                <div class="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition-all flex items-center justify-between">
                    <div class="flex items-center gap-2.5">
                        <div class="w-8 h-8 rounded-xl ${devItem.bg} flex items-center justify-center shrink-0">
                            <i data-lucide="${devItem.icon}" class="w-4 h-4"></i>
                        </div>
                        <div>
                            <p class="text-xs font-bold text-white">${devItem.label}</p>
                            <p class="text-[11px] text-white/50">${devItem.count} sesi pengguna</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="text-xs font-black text-white">${devItem.pct}%</span>
                    </div>
                </div>`;
            }).join('');

            // Proportional combined bar
            var deviceCombinedBarHtml = (devices.items || []).map(function(devItem) {
                var colors = {
                    android_apk: 'bg-emerald-500',
                    pwa_chrome: 'bg-amber-400',
                    safari_ios: 'bg-indigo-400',
                    desktop_web: 'bg-purple-500'
                };
                var w = devices.totalDevices > 0 ? devItem.pct : 25;
                return `<div class="${colors[devItem.key] || 'bg-white/20'} h-full transition-all duration-500" style="width: ${w}%;" title="${devItem.label}: ${devItem.pct}% (${devItem.count} sesi)"></div>`;
            }).join('');

            // Render 24-Hour Heatmap Bars
            var hourlyBarsHtml = '';
            var hasPlays = heatmap.totalPlays > 0;
            (heatmap.hourly || []).forEach(function(h) {
                var barHeight = hasPlays ? Math.max(4, h.pct) : 4;
                var isPeak = hasPlays && h.isPeak;
                var barGradient = isPeak 
                    ? 'bg-gradient-to-t from-rose-500 via-amber-400 to-yellow-300 shadow-lg shadow-rose-500/40 border border-amber-300/60'
                    : (hasPlays && h.pct > 65 
                        ? 'bg-gradient-to-t from-rose-600 to-purple-500 hover:brightness-125' 
                        : (hasPlays && h.pct > 30 
                            ? 'bg-gradient-to-t from-purple-700 to-indigo-500 hover:brightness-125' 
                            : 'bg-white/10 hover:bg-white/20'));

                hourlyBarsHtml += `
                <div class="flex-1 flex flex-col items-center gap-1 group relative cursor-pointer" title="Jam ${h.label}: ${h.count} pemutaran (${hasPlays ? h.pct + '% dari puncak' : '0%'})">
                    <div class="absolute -top-10 scale-0 group-hover:scale-100 transition-all z-20 pointer-events-none bg-black/90 border border-white/20 text-white text-[10px] font-bold py-1 px-2 rounded-lg whitespace-nowrap shadow-xl">
                        ${h.label} &bull; ${h.count}x
                    </div>

                    <div class="h-3 flex items-center justify-center">
                        ${isPeak ? '<span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-sm shadow-amber-400"></span>' : ''}
                    </div>

                    <div class="w-full max-w-[18px] h-28 bg-white/5 rounded-t-md flex items-end justify-center p-0.5 relative overflow-hidden">
                        <div class="w-full rounded-t-sm transition-all duration-500 ${barGradient}" style="height: ${barHeight}%;"></div>
                    </div>

                    <span class="text-[9px] font-mono ${isPeak ? 'text-amber-300 font-black' : 'text-white/40'}">
                        ${(h.hour % 3 === 0 || h.hour === 23) ? String(h.hour).padStart(2, '0') : ''}
                    </span>
                </div>`;
            });

            // Render Top Search Queries
            var searchItemsHtml = '';
            var topList = searches.topQueries || [];
            if (topList.length > 0) {
                searchItemsHtml = topList.slice(0, 10).map(function(item) {
                    var rankBadge = '';
                    if (item.rank === 1) rankBadge = '<span class="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[10px] font-black flex items-center justify-center">1</span>';
                    else if (item.rank === 2) rankBadge = '<span class="w-5 h-5 rounded-full bg-slate-400/20 border border-slate-300/50 text-slate-200 text-[10px] font-black flex items-center justify-center">2</span>';
                    else if (item.rank === 3) rankBadge = '<span class="w-5 h-5 rounded-full bg-amber-700/20 border border-amber-600/50 text-amber-400 text-[10px] font-black flex items-center justify-center">3</span>';
                    else rankBadge = `<span class="w-5 h-5 rounded-full bg-white/5 text-white/50 text-[10px] font-semibold flex items-center justify-center">${item.rank}</span>`;

                    return `
                    <div class="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition-all flex items-center justify-between gap-3">
                        <div class="flex items-center gap-2.5 flex-1 min-w-0">
                            ${rankBadge}
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center justify-between mb-1">
                                    <span class="text-xs font-bold text-white truncate capitalize">${item.query}</span>
                                    <span class="text-[11px] text-white/60 font-semibold shrink-0 ml-2">${item.count}x dicari</span>
                                </div>
                                <div class="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                    <div class="h-full bg-gradient-to-r from-rose-500 to-purple-500 rounded-full" style="width: ${Math.min(100, Math.max(8, item.percentage))}%;"></div>
                                </div>
                            </div>
                        </div>

                        <button onclick="Profile.searchQueryInApp('${item.query.replace(/'/g, "\\'")}')" class="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-white/50 hover:text-rose-300 transition-all cursor-pointer shrink-0" title="Cari di Aplikasi">
                            <i data-lucide="search" class="w-3.5 h-3.5"></i>
                        </button>
                    </div>`;
                }).join('');
            } else {
                searchItemsHtml = `
                <div class="p-6 rounded-xl bg-white/[0.02] border border-white/5 text-center text-xs text-white/50 col-span-full space-y-1">
                    <p class="font-medium text-white/70">Belum ada kata kunci pencarian yang terekam.</p>
                    <p class="text-[11px] text-white/40">Setiap pencarian lagu atau artis yang dilakukan di kolom pencarian aplikasi akan langsung terekam dan muncul di sini secara real-time.</p>
                </div>`;
            }

            var segs = heatmap.segments || {};
            var segDini = segs.diniHari || 0;
            var segPagi = segs.pagi || 0;
            var segSiang = segs.siangSore || 0;
            var segMalam = segs.malam || 0;

            var isListeningNow = listeners.count > 0;

            var html = `
            <!-- 1. REAL-TIME ACTIVE LISTENERS -->
            <div class="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-white/[0.05] to-rose-500/[0.04] border border-white/10 shadow-lg relative overflow-hidden">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                    <div class="flex items-center gap-3.5">
                        <div class="relative flex items-center justify-center w-12 h-12 rounded-2xl ${isListeningNow ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-white/40'} border shrink-0">
                            ${isListeningNow ? '<span class="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-emerald-400 opacity-30"></span>' : ''}
                            <i data-lucide="headphones" class="w-6 h-6"></i>
                        </div>
                        <div>
                            <div class="flex items-center gap-2">
                                ${isListeningNow ? `
                                <span class="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1.5">
                                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> LIVE AKTIF
                                </span>` : `
                                <span class="text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white/60 border border-white/15 px-2 py-0.5 rounded-full flex items-center gap-1.5">
                                    <span class="w-1.5 h-1.5 rounded-full bg-white/40"></span> STANDBY
                                </span>`}
                                <span class="text-[11px] text-white/50">Real-Time Active Listeners</span>
                            </div>
                            <h3 class="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5 flex items-baseline gap-2">
                                <span>${listeners.count}</span>
                                <span class="text-xs font-semibold ${isListeningNow ? 'text-white/80' : 'text-white/50'}">${isListeningNow ? 'Pengguna Sedang Memutar Musik' : 'Pengguna Memutar Musik Saat Ini'}</span>
                            </h3>
                        </div>
                    </div>

                    <div class="flex items-center gap-2">
                        <button onclick="Profile.loadAdminAnalytics()" class="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer">
                            <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i> Perbarui Live
                        </button>
                    </div>
                </div>

                <!-- Currently Streamed Tracks -->
                <div class="pt-4">
                    <div class="flex items-center justify-between mb-2">
                        <div class="text-[11px] font-bold text-white/60 uppercase tracking-wider flex items-center gap-1.5">
                            <i data-lucide="radio" class="w-3.5 h-3.5 text-rose-400"></i> Lagu Yang Sedang Diputar Pengguna
                        </div>
                        <button onclick="Profile.clearActiveListeners()" class="text-[11px] bg-white/5 hover:bg-rose-500/20 text-white/60 hover:text-rose-300 px-2.5 py-1 rounded-xl border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95" title="Reset Sesi Lagu Yang Sedang Diputar">
                            <i data-lucide="trash-2" class="w-3 h-3 text-rose-400"></i>
                            <span>Reset Sesi</span>
                        </button>
                    </div>
                    <div class="space-y-2">
                        ${sessionsHtml}
                    </div>
                </div>
            </div>

            <!-- 2. TOP 50 MOST PLAYED SONGS -->
            <div class="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-white/[0.04] to-rose-500/[0.04] border border-white/10 shadow-lg space-y-4">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                    <div>
                        <h3 class="text-base font-bold text-white flex items-center gap-2">
                            <i data-lucide="flame" class="w-4 h-4 text-rose-500 fill-rose-500/20"></i>
                            <span>Top 50 Most Played Songs</span>
                        </h3>
                        <p class="text-xs text-white/60">Daftar lagu yang paling sering diputar dalam 24 jam, 7 hari, dan 30 hari terakhir</p>
                    </div>

                    <div class="flex items-center gap-2 flex-wrap">
                        <button onclick="Profile.clearTopPlayedAnalytics()" class="text-[11px] bg-white/5 hover:bg-rose-500/20 text-white/60 hover:text-rose-300 px-2.5 py-1 rounded-xl border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95" title="Reset Data Top Lagu">
                            <i data-lucide="trash-2" class="w-3 h-3 text-rose-400"></i>
                            <span>Reset Top Lagu</span>
                        </button>
                    </div>
                </div>

                <!-- Timeframe Selector & Search Filter -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div class="inline-flex p-1 rounded-xl bg-black/40 border border-white/10 text-xs">
                        <button id="top-played-btn-24h" onclick="Profile.setTopPlayedTimeframe('24h')" class="px-3 py-1.5 rounded-lg font-bold transition-all ${Profile.topPlayedTimeframe === '24h' ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow' : 'text-white/60 hover:text-white'}">
                            24 Jam Terakhir
                        </button>
                        <button id="top-played-btn-7d" onclick="Profile.setTopPlayedTimeframe('7d')" class="px-3 py-1.5 rounded-lg font-bold transition-all ${Profile.topPlayedTimeframe === '7d' ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow' : 'text-white/60 hover:text-white'}">
                            7 Hari Terakhir
                        </button>
                        <button id="top-played-btn-30d" onclick="Profile.setTopPlayedTimeframe('30d')" class="px-3 py-1.5 rounded-lg font-bold transition-all ${Profile.topPlayedTimeframe === '30d' ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow' : 'text-white/60 hover:text-white'}">
                            30 Hari Terakhir
                        </button>
                    </div>

                    <div class="relative min-w-[200px]">
                        <i data-lucide="search" class="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                        <input type="text" id="top-played-search-input" value="${Profile.topPlayedSearch || ''}" oninput="Profile.filterTopPlayed(this.value)" placeholder="Cari judul / artis..." class="w-full pl-8 pr-3 py-1.5 bg-black/30 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-rose-500 transition-colors" />
                    </div>
                </div>

                <!-- Top 50 Song List -->
                <div id="admin-top-played-list-container" class="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
                    <!-- Populated by renderTopPlayedList -->
                </div>
            </div>

            <!-- 3. AVERAGE LISTENING DURATION -->
            <div class="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-white/[0.04] to-indigo-500/[0.03] border border-white/10 shadow-lg space-y-4">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                    <div>
                        <h3 class="text-base font-bold text-white flex items-center gap-2">
                            <i data-lucide="timer" class="w-4 h-4 text-sky-400"></i>
                            <span>Average Listening Duration</span>
                        </h3>
                        <p class="text-xs text-white/60">Statistik rata-rata durasi pengguna mendengarkan musik dalam satu sesi</p>
                    </div>

                    <div class="flex items-center gap-2 flex-wrap">
                        <button onclick="Profile.clearDurationAnalytics()" class="text-[11px] bg-white/5 hover:bg-rose-500/20 text-white/60 hover:text-rose-300 px-2.5 py-1 rounded-xl border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95" title="Reset Statistik Durasi Mendengarkan">
                            <i data-lucide="trash-2" class="w-3 h-3 text-rose-400"></i>
                            <span>Reset Durasi</span>
                        </button>
                        <div class="px-3 py-1 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs font-bold flex items-center gap-1.5">
                            <i data-lucide="clock" class="w-3.5 h-3.5"></i>
                            <span>${duration.avgMinutesFormatted} / Sesi</span>
                        </div>
                    </div>
                </div>

                <!-- 3 Top Metric Counters -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div class="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
                            <i data-lucide="hourglass" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <p class="text-[11px] text-white/50">Total Jam Pemutaran</p>
                            <h4 class="text-lg font-black text-white">${duration.totalHours} <span class="text-xs font-normal text-white/50">Jam</span></h4>
                        </div>
                    </div>

                    <div class="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                            <i data-lucide="list-music" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <p class="text-[11px] text-white/50">Total Sesi Terhitung</p>
                            <h4 class="text-lg font-black text-white">${duration.totalSessions} <span class="text-xs font-normal text-white/50">Sesi</span></h4>
                        </div>
                    </div>

                    <div class="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                            <i data-lucide="play-circle" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <p class="text-[11px] text-white/50">Total Menit Pemutaran</p>
                            <h4 class="text-lg font-black text-white">${duration.totalMinutes} <span class="text-xs font-normal text-white/50">Menit</span></h4>
                        </div>
                    </div>
                </div>

                <!-- Duration Distribution Brackets -->
                <div class="space-y-1.5 pt-1">
                    <span class="text-[11px] font-bold text-white/60 uppercase tracking-wider">Distribusi Rentang Durasi Sesi</span>
                    <div class="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        ${durationBarsHtml}
                    </div>
                </div>
            </div>

            <!-- 3. DEVICE & BROWSER BREAKDOWN -->
            <div class="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-white/[0.04] to-emerald-500/[0.03] border border-white/10 shadow-lg space-y-4">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                    <div>
                        <h3 class="text-base font-bold text-white flex items-center gap-2">
                            <i data-lucide="laptop" class="w-4 h-4 text-emerald-400"></i>
                            <span>Device & Browser Breakdown</span>
                        </h3>
                        <p class="text-xs text-white/60">Grafik statistik platform & perangkat pengguna Aplikasi Android, Aplikasi Chrome, Safari iOS, Desktop Web</p>
                    </div>

                    <div class="flex items-center gap-2 flex-wrap">
                        <button onclick="Profile.clearDeviceAnalytics()" class="text-[11px] bg-white/5 hover:bg-rose-500/20 text-white/60 hover:text-rose-300 px-2.5 py-1 rounded-xl border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95" title="Reset Statistik Perangkat">
                            <i data-lucide="trash-2" class="w-3 h-3 text-rose-400"></i>
                            <span>Reset Device</span>
                        </button>
                        <div class="px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                            <span>${devices.totalDevices} Total Pengguna</span>
                        </div>
                    </div>
                </div>

                <!-- Combined Distribution Proportional Bar -->
                <div class="space-y-1.5">
                    <div class="w-full h-3 bg-white/5 rounded-full overflow-hidden flex border border-white/10 shadow-inner">
                        ${deviceCombinedBarHtml}
                    </div>
                    <div class="flex items-center justify-between text-[10px] text-white/40 flex-wrap gap-2 pt-1">
                        <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-emerald-500"></span>Aplikasi Android</span>
                        <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-amber-400"></span> Aplikasi Chrome</span>
                        <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-indigo-400"></span> Safari iOS</span>
                        <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-purple-500"></span> Desktop Web</span>
                    </div>
                </div>

                <!-- 4 Device Cards -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    ${deviceCardsHtml}
                </div>
            </div>

            <!-- 4. PEAK LISTENING HOURS HEATMAP -->
            <div class="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 shadow-lg space-y-4">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                    <div>
                        <h3 class="text-base font-bold text-white flex items-center gap-2">
                            <i data-lucide="bar-chart-2" class="w-4 h-4 text-purple-400"></i>
                            <span>Peak Listening Hours Heatmap</span>
                        </h3>
                        <p class="text-xs text-white/60">Grafik jam sibuk kapan pengguna paling aktif mendengarkan musik (24 Jam Real-Time)</p>
                    </div>

                    <div class="flex items-center gap-2 flex-wrap">
                        <button onclick="Profile.clearHeatmapAnalytics()" class="text-[11px] bg-white/5 hover:bg-rose-500/20 text-white/60 hover:text-rose-300 px-2.5 py-1 rounded-xl border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95" title="Reset Grafik Peak Listening Hours Heatmap">
                            <i data-lucide="trash-2" class="w-3 h-3 text-rose-400"></i>
                            <span>Reset Heatmap</span>
                        </button>
                        <div class="px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5">
                            <i data-lucide="zap" class="w-3.5 h-3.5"></i>
                            <span>Jam Puncak: ${hasPlays ? heatmap.peakHour + ' WIB' : 'Belum Ada Data'}</span>
                        </div>
                        <div class="px-3 py-1 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold">
                            <span>${heatmap.totalPlays}x Total Pemutaran</span>
                        </div>
                    </div>
                </div>

                <!-- 4 Time-of-Day Segments Pills -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div class="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                        <div class="flex items-center gap-1.5 text-white/50 text-[11px] mb-1">
                            <i data-lucide="moon" class="w-3.5 h-3.5 text-indigo-400"></i> Dini Hari (00-04)
                        </div>
                        <p class="text-sm font-bold text-white">${segDini} <span class="text-[10px] text-white/50 font-normal">lagu</span></p>
                    </div>

                    <div class="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                        <div class="flex items-center gap-1.5 text-white/50 text-[11px] mb-1">
                            <i data-lucide="sunrise" class="w-3.5 h-3.5 text-amber-400"></i> Pagi (05-11)
                        </div>
                        <p class="text-sm font-bold text-white">${segPagi} <span class="text-[10px] text-white/50 font-normal">lagu</span></p>
                    </div>

                    <div class="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                        <div class="flex items-center gap-1.5 text-white/50 text-[11px] mb-1">
                            <i data-lucide="sun" class="w-3.5 h-3.5 text-orange-400"></i> Siang & Sore (12-17)
                        </div>
                        <p class="text-sm font-bold text-white">${segSiang} <span class="text-[10px] text-white/50 font-normal">lagu</span></p>
                    </div>

                    <div class="p-2.5 rounded-xl ${hasPlays && heatmap.peakSegment.includes('Malam') ? 'bg-rose-500/10 border-rose-500/30' : 'bg-white/[0.02] border-white/5'}">
                        <div class="flex items-center gap-1.5 text-white/50 text-[11px] mb-1">
                            <i data-lucide="sunset" class="w-3.5 h-3.5 text-rose-400"></i> Malam (18-23)
                        </div>
                        <p class="text-sm font-bold text-white">${segMalam} <span class="text-[10px] text-white/50 font-normal">lagu</span></p>
                    </div>
                </div>

                <!-- 24-Hour Heatmap Bars Chart -->
                <div class="bg-black/30 p-3 sm:p-4 rounded-2xl border border-white/5">
                    <div class="flex items-end gap-1 sm:gap-1.5 h-36 pt-4 pb-1">
                        ${hourlyBarsHtml}
                    </div>
                    <div class="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] text-white/40">
                        <span>00:00 Tengah Malam</span>
                        <span class="text-amber-400 font-bold flex items-center gap-1">
                            <i data-lucide="sparkles" class="w-3 h-3"></i> ${hasPlays ? 'Puncak Terpadat: ' + heatmap.peakSegment : 'Menunggu data pemutaran musik'}
                        </span>
                        <span>23:00 Larut Malam</span>
                    </div>
                </div>
            </div>

            <!-- 5. SEARCH QUERY ANALYTICS -->
            <div class="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 shadow-lg space-y-3">
                <div class="flex items-center justify-between gap-3 pb-3 border-b border-white/10">
                    <div>
                        <h3 class="text-base font-bold text-white flex items-center gap-2">
                            <i data-lucide="search" class="w-4 h-4 text-rose-400"></i>
                            <span>Search Query</span>
                        </h3>
                        <p class="text-xs text-white/60">Kata kunci musik & artis yang dicari langsung oleh pengguna di kolom pencarian aplikasi (100% Real-Time)</p>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                        <button onclick="Profile.clearSearchAnalytics()" class="text-[11px] bg-white/5 hover:bg-rose-500/20 text-white/60 hover:text-rose-300 px-2.5 py-1 rounded-xl border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95" title="Reset Search Query Analytics">
                            <i data-lucide="trash-2" class="w-3 h-3 text-rose-400"></i>
                            <span>Reset Pencarian</span>
                        </button>
                        <span class="text-[11px] bg-white/10 text-white/80 px-2.5 py-1 rounded-xl font-bold border border-white/10">
                            ${searches.totalSearches} Total Pencarian
                        </span>
                    </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    ${searchItemsHtml}
                </div>
            </div>`;

            if (container) {
                container.innerHTML = html;
                Profile.renderTopPlayedList();
                lucide.createIcons();
            }
        } catch (err) {
            if (container) {
                container.innerHTML = `
                <div class="text-center py-12 text-red-400 space-y-2">
                    <i data-lucide="wifi-off" class="w-8 h-8 mx-auto"></i>
                    <p class="text-xs font-semibold">Kesalahan saat memuat analitik server.</p>
                </div>`;
                lucide.createIcons();
            }
        }
    },

    // TOP 50 MOST PLAYED SONGS LOGIC & RENDERER
    topPlayedTimeframe: '24h',
    topPlayedSearch: '',

    setTopPlayedTimeframe(tf) {
        Profile.topPlayedTimeframe = tf;
        ['24h', '7d', '30d'].forEach(function(k) {
            var btn = gid('top-played-btn-' + k);
            if (btn) {
                if (k === tf) {
                    btn.className = 'px-3 py-1.5 rounded-lg font-bold transition-all bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow';
                } else {
                    btn.className = 'px-3 py-1.5 rounded-lg font-bold transition-all text-white/60 hover:text-white';
                }
            }
        });
        Profile.renderTopPlayedList();
    },

    filterTopPlayed(val) {
        Profile.topPlayedSearch = (val || '').toLowerCase().trim();
        Profile.renderTopPlayedList();
    },

    renderTopPlayedList() {
        var container = gid('admin-top-played-list-container');
        if (!container) return;

        var analytics = Profile.adminAnalyticsData || {};
        var topData = analytics.topPlayed || {};
        var tfData = topData[Profile.topPlayedTimeframe || '24h'] || { totalPlays: 0, songs: [] };
        var songs = tfData.songs || [];

        if (Profile.topPlayedSearch) {
            var q = Profile.topPlayedSearch;
            songs = songs.filter(function(s) {
                return (s.title && s.title.toLowerCase().includes(q)) || (s.artist && s.artist.toLowerCase().includes(q));
            });
        }

        if (songs.length === 0) {
            container.innerHTML = `
            <div class="p-6 rounded-xl bg-white/[0.02] border border-white/5 text-center text-xs text-white/50 space-y-1.5">
                <i data-lucide="music" class="w-6 h-6 mx-auto text-white/30"></i>
                <p class="font-medium text-white/70">${Profile.topPlayedSearch ? 'Tidak ada lagu yang cocok dengan pencarian.' : 'Belum ada data pemutaran lagu pada periode ini.'}</p>
                <p class="text-[11px] text-white/40">Saat pengguna mendengarkan musik, 50 lagu teratas akan diperingkatkan otomatis di sini.</p>
            </div>`;
            lucide.createIcons();
            return;
        }

        var maxCount = songs[0] ? (songs[0].count || 1) : 1;
        var html = songs.map(function(song, index) {
            var rank = index + 1;
            var rankBadge = '';
            if (rank === 1) {
                rankBadge = '<span class="w-6 h-6 rounded-lg bg-amber-400 text-black text-xs font-black flex items-center justify-center shadow-md shadow-amber-400/30 shrink-0">1</span>';
            } else if (rank === 2) {
                rankBadge = '<span class="w-6 h-6 rounded-lg bg-slate-300 text-black text-xs font-black flex items-center justify-center shadow-md shadow-slate-300/30 shrink-0">2</span>';
            } else if (rank === 3) {
                rankBadge = '<span class="w-6 h-6 rounded-lg bg-amber-700 text-white text-xs font-black flex items-center justify-center shadow-md shadow-amber-700/30 shrink-0">3</span>';
            } else {
                rankBadge = `<span class="w-6 h-6 rounded-lg bg-white/5 text-white/60 text-xs font-bold flex items-center justify-center shrink-0">${rank}</span>`;
            }

            var coverImg = song.image ? `<img src="${song.image}" class="w-8 h-8 rounded-lg object-cover bg-black/40 border border-white/10 shrink-0" onerror="this.src='/logo.png'" />` : `<div class="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 shrink-0"><i data-lucide="disc" class="w-4 h-4"></i></div>`;

            var pct = Math.round((song.count / maxCount) * 100);
            var safeTitle = (song.title || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
            var safeArtist = (song.artist || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
            var safeImage = (song.image || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
            var safeId = (song.id || '').replace(/'/g, "\\'");

            return `
            <div class="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition-all flex items-center justify-between gap-3 group">
                <div class="flex items-center gap-3 flex-1 min-w-0">
                    ${rankBadge}
                    ${coverImg}
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between mb-1">
                            <span class="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-xs">${song.title || 'Lagu Tanpa Judul'}</span>
                            <span class="text-[11px] text-rose-300 font-bold shrink-0 ml-2">${song.count}x putar</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="text-[10px] text-white/50 truncate flex-1">${song.artist || 'MusifyStar'}</span>
                            <div class="w-20 sm:w-28 bg-white/5 h-1.5 rounded-full overflow-hidden shrink-0">
                                <div class="h-full bg-gradient-to-r from-rose-500 to-purple-500 rounded-full" style="width: ${Math.max(8, pct)}%;"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex items-center gap-1.5 shrink-0">
                    <button onclick="Profile.playAdminTrack('${safeId}', '${safeTitle}', '${safeArtist}', '${safeImage}')" class="p-2 rounded-xl bg-white/5 hover:bg-rose-500 text-white/70 hover:text-white transition-all active:scale-90 cursor-pointer shadow" title="Putar Lagu Ini">
                        <i data-lucide="play" class="w-3.5 h-3.5 fill-current"></i>
                    </button>
                </div>
            </div>`;
        }).join('');

        container.innerHTML = html;
        lucide.createIcons();
    },

    playAdminTrack(id, title, artist, image) {
        if (id && typeof S !== 'undefined') {
            S.ct = {
                id: id,
                videoId: id,
                title: title,
                artist: artist,
                cover: image || '/logo.png',
                artistId: '',
                ytUrl: 'https://youtube.com/watch?v=' + id
            };
            S.ps = 'direct';
            S.pl = [S.ct];
            S.pi = 0;
            if (typeof UU === 'function') UU();
            if (typeof MP !== 'undefined' && MP.show) MP.show();
            if (typeof resetLyricsUI === 'function') resetLyricsUI(id);
            if (typeof FullPlayer !== 'undefined' && FullPlayer.open) FullPlayer.open();
            if (typeof loadTrack === 'function') loadTrack(S.ct);
            if (typeof showToast === 'function') showToast('Memutar: ' + title);
        } else {
            Profile.closeAdminModal();
            if (window.Search && typeof Search.query === 'function') {
                Search.query(title + ' ' + artist);
            }
        }
    },

    // Kosongkan riwayat Top 50 Most Played Songs
    async clearTopPlayedAnalytics() {
        var token = Profile.getAdminToken();
        if (!token) return;
        try {
            var res = await fetch('/api/analytics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-token': token
                },
                body: JSON.stringify({ action: 'clear_top_played', timeframe: Profile.topPlayedTimeframe || '24h' })
            });
            var data = await res.json();
            if (data.status) {
                if (typeof showToast === 'function') {
                    showToast('Data Top 50 Lagu berhasil direset');
                }
                Profile.loadAdminAnalytics(false);
            }
        } catch (e) {}
    },

    // Aksi untuk langsung mencari query terpopuler di aplikasi
    searchQueryInApp(query) {
        Profile.closeAdminModal();
        if (window.Search && typeof Search.query === 'function') {
            Search.query(query);
        } else if (window.App && typeof App.switch === 'function') {
            App.switch('search');
            var searchInput = gid('search-input');
            if (searchInput) {
                searchInput.value = query;
                var sf = gid('search-form');
                if (sf) sf.dispatchEvent(new Event('submit'));
            }
        }
    },

    // Kosongkan riwayat durasi mendengarkan
    async clearDurationAnalytics() {
        var token = Profile.getAdminToken();
        if (!token) return;
        try {
            var res = await fetch('/api/analytics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-token': token
                },
                body: JSON.stringify({ action: 'clear_duration' })
            });
            var data = await res.json();
            if (data.status) {
                if (typeof showToast === 'function') {
                    showToast('Statistik durasi mendengarkan berhasil direset');
                }
                Profile.loadAdminAnalytics(false);
            }
        } catch (e) {}
    },

    // Kosongkan statistik perangkat
    async clearDeviceAnalytics() {
        var token = Profile.getAdminToken();
        if (!token) return;
        try {
            var res = await fetch('/api/analytics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-token': token
                },
                body: JSON.stringify({ action: 'clear_devices' })
            });
            var data = await res.json();
            if (data.status) {
                if (typeof showToast === 'function') {
                    showToast('Statistik perangkat & browser berhasil direset');
                }
                Profile.loadAdminAnalytics(false);
            }
        } catch (e) {}
    },

    // Kosongkan riwayat lagu yang sedang diputar (Active Listeners)
    async clearActiveListeners() {
        var token = Profile.getAdminToken();
        if (!token) return;
        try {
            var res = await fetch('/api/analytics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-token': token
                },
                body: JSON.stringify({ action: 'clear_listeners' })
            });
            var data = await res.json();
            if (data.status) {
                if (typeof showToast === 'function') {
                    showToast('Sesi pendengar aktif berhasil direset');
                }
                Profile.loadAdminAnalytics(false);
            }
        } catch (e) {}
    },

    // Kosongkan riwayat pencarian murni
    async clearSearchAnalytics() {
        var token = Profile.getAdminToken();
        if (!token) return;
        try {
            var res = await fetch('/api/analytics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-token': token
                },
                body: JSON.stringify({ action: 'clear_searches' })
            });
            var data = await res.json();
            if (data.status) {
                if (typeof showToast === 'function') {
                    showToast('Riwayat pencarian berhasil direset');
                }
                Profile.loadAdminAnalytics(false);
            }
        } catch (e) {}
    },

    // Kosongkan riwayat Peak Listening Hours Heatmap
    async clearHeatmapAnalytics() {
        var token = Profile.getAdminToken();
        if (!token) return;
        try {
            var res = await fetch('/api/analytics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-token': token
                },
                body: JSON.stringify({ action: 'clear_heatmap' })
            });
            var data = await res.json();
            if (data.status) {
                if (typeof showToast === 'function') {
                    showToast('Grafik Heatmap pemutaran berhasil direset');
                }
                Profile.loadAdminAnalytics(false);
            }
        } catch (e) {}
    },

    // ==========================================
    // 2. TAB SEASONAL THEME SWITCHER
    // ==========================================
    async renderAdminThemeTab() {
        var container = gid('admin-theme-container');
        if (!container) return;

        try {
            var res = await fetch('/api/theme');
            var data = await res.json();
            var activeTheme = data.activeTheme || 'default';
            var availableThemes = data.availableThemes || [];
            var showBanner = data.showBanner !== false;
            var customGreeting = data.customGreeting || '';

            var themesHtml = availableThemes.map(function(t) {
                var isActive = t.id === activeTheme;
                return `
                <div onclick="Profile.selectThemeCard('${t.id}')" class="p-4 rounded-2xl border transition-all cursor-pointer relative group ${isActive ? 'bg-gradient-to-br from-rose-500/15 via-purple-500/10 to-transparent border-rose-500/50 shadow-lg shadow-rose-500/20 ring-1 ring-rose-500/40' : 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05]'}">
                    <div class="flex items-start gap-3.5">
                        <div class="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border" style="background: ${t.glowColor || 'rgba(255,255,255,0.08)'}; color: ${t.accentColor || '#fff'}; border-color: ${t.accentColor || '#fff'}40;">
                            <i data-lucide="${t.icon || 'sparkles'}" class="w-5 h-5"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center justify-between gap-2 mb-1">
                                <h4 class="text-sm font-bold text-white flex items-center gap-2">
                                    <span>${t.name}</span>
                                    ${isActive ? '<span class="text-[9px] bg-emerald-500 text-white font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">Aktif</span>' : ''}
                                </h4>
                                <input type="radio" name="admin-selected-theme" value="${t.id}" ${isActive ? 'checked' : ''} class="w-4 h-4 text-rose-500 focus:ring-rose-500 bg-black/40 border-white/20 accent-rose-500 cursor-pointer" />
                            </div>
                            <p class="text-xs text-white/60 line-clamp-2 leading-relaxed">${t.subtitle || t.description || ''}</p>
                            <div class="mt-2.5 flex items-center gap-2">
                                <span class="text-[10px] font-mono px-2 py-0.5 rounded-md border" style="background: ${t.glowColor || 'rgba(255,255,255,0.05)'}; color: ${t.accentColor || '#fff'}; border-color: ${t.accentColor || '#fff'}30;">
                                    ${t.badgeText}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>`;
            }).join('');

            container.innerHTML = `
            <div class="max-w-2xl mx-auto space-y-5">
                <!-- Header Card -->
                <div class="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-rose-500/10 to-purple-500/10 border border-amber-500/20 shadow-lg">
                    <div class="flex items-center gap-3.5 mb-2">
                        <div class="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-500/30">
                            <i data-lucide="palette" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <h3 class="text-base font-bold text-white">Seasonal Theme Switcher</h3>
                            <p class="text-xs text-white/60">Aktifkan tema visual berkala (Puasa, Lebaran, Tahun Baru, Idul Adha) secara instan</p>
                        </div>
                    </div>
                    <div class="mt-3 p-3 rounded-xl bg-black/40 border border-white/5 text-[11px] text-white/70 leading-relaxed flex items-start gap-2">
                        <i data-lucide="info" class="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5"></i>
                        <span>Tema yang diaktifkan akan langsung diterapkan ke seluruh pengguna aplikasi, lengkap dengan palet warna suasana dan banner ucapan khusus di Beranda.</span>
                    </div>
                </div>

                <!-- Theme Selection Cards Grid -->
                <div class="space-y-3">
                    <span class="text-xs font-bold text-white/80 uppercase tracking-wider block">Pilih Tema Yang Ingin Diaktifkan</span>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        ${themesHtml}
                    </div>
                </div>

                <!-- Custom Options Form -->
                <div class="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4 shadow-lg">
                    <span class="text-xs font-bold text-white/80 uppercase tracking-wider block">Pengaturan Tambahan</span>

                    <label class="flex items-center gap-3 cursor-pointer select-none">
                        <input type="checkbox" id="admin-theme-show-banner" ${showBanner ? 'checked' : ''} class="w-4 h-4 rounded text-rose-500 bg-black/40 border-white/20 accent-rose-500 cursor-pointer" />
                        <div>
                            <p class="text-xs font-bold text-white">Tampilkan Banner Ucapan Musiman</p>
                            <p class="text-[11px] text-white/50">Menampilkan kartu banner interaktif di halaman beranda atas</p>
                        </div>
                    </label>

                    <div class="space-y-1.5">
                        <label class="text-xs font-bold text-white/80">Kustomisasi Pesan / Ucapan (Opsional)</label>
                        <input type="text" id="admin-theme-custom-greeting" value="${customGreeting}" placeholder="Kosongkan untuk menggunakan ucapan default tema" class="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-rose-500 transition-all font-sans" />
                    </div>

                    <button type="button" onclick="Profile.saveSeasonalTheme()" id="admin-save-theme-btn" class="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 active:scale-98 text-white font-bold text-xs shadow-lg shadow-rose-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer">
                        <i data-lucide="check" class="w-4 h-4"></i>
                        <span>Terapkan & Simpan Tema Sekarang</span>
                    </button>
                </div>
            </div>`;

            lucide.createIcons();
        } catch (e) {
            container.innerHTML = `
            <div class="text-center py-12 text-red-400 space-y-2">
                <i data-lucide="wifi-off" class="w-8 h-8 mx-auto"></i>
                <p class="text-xs font-semibold">Gagal memuat konfigurasi tema musiman.</p>
            </div>`;
            lucide.createIcons();
        }
    },

    selectThemeCard(themeId) {
        var radio = document.querySelector(`input[name="admin-selected-theme"][value="${themeId}"]`);
        if (radio) radio.checked = true;
    },

    async saveSeasonalTheme() {
        var token = Profile.getAdminToken();
        if (!token) return;

        var selectedRadio = document.querySelector('input[name="admin-selected-theme"]:checked');
        var themeId = selectedRadio ? selectedRadio.value : 'default';
        var showBanner = gid('admin-theme-show-banner') ? gid('admin-theme-show-banner').checked : true;
        var customGreeting = gid('admin-theme-custom-greeting') ? gid('admin-theme-custom-greeting').value.trim() : '';
        var btn = gid('admin-save-theme-btn');

        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> <span>Menerapkan Tema...</span>';
            lucide.createIcons();
        }

        try {
            var res = await fetch('/api/theme', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-token': token
                },
                body: JSON.stringify({
                    activeTheme: themeId,
                    showBanner: showBanner,
                    customGreeting: customGreeting
                })
            });
            var data = await res.json();
            if (data.status) {
                if (typeof showToast === 'function') {
                    showToast('Tema musiman berhasil diubah: ' + (data.themeDetails ? data.themeDetails.name : themeId));
                }
                if (window.App && typeof App.applySeasonalTheme === 'function') {
                    App.applySeasonalTheme(data);
                }
                Profile.renderAdminThemeTab();
            } else {
                if (typeof showToast === 'function') {
                    showToast(data.message || 'Gagal menyimpan tema.');
                }
            }
        } catch (e) {
            if (typeof showToast === 'function') {
                showToast('Terjadi kesalahan jaringan saat menyimpan tema.');
            }
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i data-lucide="check" class="w-4 h-4"></i> <span>Terapkan & Simpan Tema Sekarang</span>';
                lucide.createIcons();
            }
        }
    },

    // ==========================================
    // 3. TAB BROADCAST NOTIFICATION & ANNOUNCEMENT BANNER
    // ==========================================
    broadcastPresets: [],

    async renderAdminBroadcastTab(silent) {
        var container = gid('admin-broadcast-container');
        if (!container) return;

        var token = Profile.getAdminToken();
        if (!token) return;

        if (!silent) {
            container.innerHTML = `
            <div class="text-center py-12 text-white/50 space-y-2">
                <i data-lucide="loader-2" class="w-8 h-8 animate-spin mx-auto text-amber-400"></i>
                <p class="text-xs">Memuat konfigurasi pengumuman beranda...</p>
            </div>`;
            if (window.lucide) lucide.createIcons();
        }

        try {
            var res = await fetch('/api/broadcast');
            var data = await res.json();

            var enabled = !!data.enabled;
            var title = data.title || '';
            var text = data.text || '';
            var badge = data.badge || 'PENGUMUMAN';
            var type = data.type || 'info';
            var icon = data.icon || 'megaphone';
            var closable = data.closable !== false;
            var presets = data.presets || [];
            Profile.broadcastPresets = presets;

            // Update live badge in header
            var statusBadge = gid('admin-broadcast-status-badge');
            if (statusBadge) {
                if (enabled) {
                    statusBadge.classList.remove('hidden');
                } else {
                    statusBadge.classList.add('hidden');
                }
            }

            var presetsHtml = presets.map(function(p) {
                return `
                <button type="button" onclick="Profile.applyBroadcastPreset('${p.id}')" class="text-left p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-amber-500/40 transition-all cursor-pointer group flex flex-col justify-between">
                    <div class="flex items-center justify-between gap-2 mb-1 w-full">
                        <span class="text-xs font-bold text-white group-hover:text-amber-300 flex items-center gap-1.5 truncate">
                            <i data-lucide="${p.icon || 'sparkles'}" class="w-3.5 h-3.5 text-amber-400 shrink-0"></i>
                            <span class="truncate">${p.name}</span>
                        </span>
                        <span class="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 font-mono font-bold shrink-0 border border-amber-500/20">Preset</span>
                    </div>
                    <p class="text-[11px] text-white/50 line-clamp-1 leading-snug">${p.text}</p>
                </button>`;
            }).join('');

            container.innerHTML = `
            <div class="max-w-2xl mx-auto space-y-5">
                <!-- Header Info Card -->
                <div class="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-rose-500/5 to-purple-500/10 border border-amber-500/20 shadow-lg relative overflow-hidden">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-500/30">
                                <i data-lucide="megaphone" class="w-5 h-5"></i>
                            </div>
                            <div>
                                <h3 class="text-sm sm:text-base font-bold text-white tracking-tight">Pengumuman Beranda</h3>
                                <p class="text-xs text-white/60">Kelola pesan dan kartu pengumuman langsung di halaman utama</p>
                            </div>
                        </div>
                        <div class="shrink-0 flex items-center gap-2">
                            ${enabled ? `
                                <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                    <span>Aktif di Beranda</span>
                                </div>` : `
                                <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-white/10 text-white/50 border border-white/10">
                                    <span class="w-2 h-2 rounded-full bg-white/30"></span>
                                    <span>Nonaktif</span>
                                </div>`
                            }
                        </div>
                    </div>
                </div>

                <!-- Live Preview Simulator Box -->
                <div class="space-y-2">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-white/70 uppercase tracking-wider flex items-center gap-1.5">
                            <i data-lucide="eye" class="w-3.5 h-3.5 text-amber-400"></i>
                            <span>Pratinjau Tampilan</span>
                        </span>
                        <span class="text-[10px] text-white/40">Otomatis Diperbarui</span>
                    </div>
                    
                    <!-- Preview Container -->
                    <div id="admin-broadcast-preview-box" class="transition-all">
                        <!-- Populated by updateBroadcastLivePreview -->
                    </div>
                </div>

                <!-- Quick Presets Grid -->
                <div class="space-y-2">
                    <span class="text-xs font-bold text-white/70 uppercase tracking-wider block">Template Pengumuman Cepat</span>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        ${presetsHtml}
                    </div>
                </div>

                <!-- Broadcast Configuration Form -->
                <div class="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4 shadow-lg">
                    <div class="flex items-center justify-between pb-3 border-b border-white/10">
                        <span class="text-xs font-bold text-white uppercase tracking-wider">Detail Pengumuman</span>
                        <label class="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox" id="admin-broadcast-enabled" ${enabled ? 'checked' : ''} onchange="Profile.updateBroadcastLivePreview()" class="w-4 h-4 rounded text-amber-500 bg-black/40 border-white/20 accent-amber-500 cursor-pointer" />
                            <span class="text-xs font-bold text-amber-300">Aktifkan Banner</span>
                        </label>
                    </div>

                    <!-- Title Input -->
                    <div class="space-y-1.5">
                        <label class="text-xs font-medium text-white/80">Judul Pengumuman</label>
                        <input type="text" id="admin-broadcast-title" value="${es(title)}" oninput="Profile.updateBroadcastLivePreview()" placeholder="Contoh: Selamat Datang di MusifyStar / Info Pembaruan" class="w-full bg-black/40 border border-white/10 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none transition-all font-medium" />
                    </div>

                    <!-- Text Input -->
                    <div class="space-y-1.5">
                        <div class="flex items-center justify-between">
                            <label class="text-xs font-medium text-white/80">Isi Pesan</label>
                            <span id="admin-broadcast-char-count" class="text-[10px] text-white/40 font-mono">0 Karakter</span>
                        </div>
                        <textarea id="admin-broadcast-text" rows="3" oninput="Profile.updateBroadcastLivePreview()" placeholder="Tulis isi pengumuman yang ingin disampaikan..." class="w-full bg-black/40 border border-white/10 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none transition-all leading-relaxed">${es(text)}</textarea>
                    </div>

                    <!-- Badge Input -->
                    <div class="space-y-1.5">
                        <label class="text-xs font-medium text-white/80">Label Lencana (Badge)</label>
                        <input type="text" id="admin-broadcast-badge" value="${es(badge)}" oninput="Profile.updateBroadcastLivePreview()" placeholder="Contoh: PENGUMUMAN, RAMADHAN, INFO" class="w-full bg-black/40 border border-white/10 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/30 focus:outline-none transition-all font-medium uppercase" />
                    </div>

                    <!-- Clean 2-Column Selectors for Icon & Color Mood -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/10">
                        <div class="space-y-1.5">
                            <label class="text-xs font-medium text-white/80 flex items-center gap-1.5">
                                <i data-lucide="smile" class="w-3.5 h-3.5 text-amber-400"></i>
                                <span>Ikon Kartu</span>
                            </label>
                            <select id="admin-broadcast-icon" onchange="Profile.updateBroadcastLivePreview()" class="w-full bg-black/60 border border-white/15 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-all cursor-pointer">
                                <option value="megaphone" ${icon === 'megaphone' ? 'selected' : ''}>Pengumuman Megaphone</option>
                                <option value="moon" ${icon === 'moon' ? 'selected' : ''}>Ramadhan Bulan Moon</option>
                                <option value="sparkles" ${icon === 'sparkles' ? 'selected' : ''}>Rilis Baru Sparkles</option>
                                <option value="wrench" ${icon === 'wrench' ? 'selected' : ''}>Pemeliharaan Wrench</option>
                                <option value="alert-triangle" ${icon === 'alert-triangle' ? 'selected' : ''}>Peringatan Alert</option>
                                <option value="bell" ${icon === 'bell' ? 'selected' : ''}>Notifikasi Bell</option>
                                <option value="zap" ${icon === 'zap' ? 'selected' : ''}>Promo Kilat Zap</option>
                                <option value="flame" ${icon === 'flame' ? 'selected' : ''}>Trending Flame</option>
                                <option value="music" ${icon === 'music' ? 'selected' : ''}>Musik Music</option>
                                <option value="party-popper" ${icon === 'party-popper' ? 'selected' : ''}>Perayaan Party</option>
                                <option value="heart" ${icon === 'heart' ? 'selected' : ''}>Favorit Heart</option>
                                <option value="info" ${icon === 'info' ? 'selected' : ''}>Info Information</option>
                            </select>
                        </div>

                        <div class="space-y-1.5">
                            <label class="text-xs font-medium text-white/80 flex items-center gap-1.5">
                                <i data-lucide="palette" class="w-3.5 h-3.5 text-amber-400"></i>
                                <span>Warna & Suasana Tema</span>
                            </label>
                            <select id="admin-broadcast-type" onchange="Profile.updateBroadcastLivePreview()" class="w-full bg-black/60 border border-white/15 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-all cursor-pointer">
                                <option value="info" ${type === 'info' ? 'selected' : ''}>Indigo Midnight Biru/Ungu Netral</option>
                                <option value="update" ${type === 'update' ? 'selected' : ''}>Emerald Jade Hijau Ramadhan</option>
                                <option value="maintenance" ${type === 'maintenance' ? 'selected' : ''}>Golden Amber Emas Pemeliharaan</option>
                                <option value="warning" ${type === 'warning' ? 'selected' : ''}>Ruby Rose Merah Penting & Urgent</option>
                                <option value="custom" ${type === 'custom' ? 'selected' : ''}>Cyber Fuchsia Neon Spesial</option>
                            </select>
                        </div>
                    </div>

                    <!-- Closable Option -->
                    <div class="pt-2 border-t border-white/5">
                        <label class="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox" id="admin-broadcast-closable" ${closable ? 'checked' : ''} onchange="Profile.updateBroadcastLivePreview()" class="w-4 h-4 rounded text-amber-500 bg-black/40 border-white/20 accent-amber-500 cursor-pointer" />
                            <span class="text-xs text-white/70">Izinkan pengguna menutup kartu (Tombol ×)</span>
                        </label>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex flex-col sm:flex-row gap-2.5">
                    <button id="admin-save-broadcast-btn" onclick="Profile.saveBroadcastConfig(true)" class="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-98 transition-all cursor-pointer">
                        <i data-lucide="check" class="w-4 h-4"></i>
                        <span>Terapkan & Simpan Pengumuman</span>
                    </button>
                    ${enabled ? `
                    <button onclick="Profile.saveBroadcastConfig(false)" class="py-3 px-4 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-98 transition-all cursor-pointer">
                        <i data-lucide="power" class="w-4 h-4"></i>
                        <span>Matikan Pengumuman</span>
                    </button>` : ''}
                </div>
            </div>`;

            if (window.lucide) lucide.createIcons();
            Profile.updateBroadcastLivePreview();

        } catch (e) {
            if (container) {
                container.innerHTML = `
                <div class="text-center py-12 text-red-400 space-y-2">
                    <i data-lucide="alert-triangle" class="w-8 h-8 mx-auto"></i>
                    <p class="text-xs font-semibold">Gagal memuat konfigurasi broadcast pengumuman.</p>
                </div>`;
                if (window.lucide) lucide.createIcons();
            }
        }
    },

    // Real-time Preview update for Admin Broadcast panel
    updateBroadcastLivePreview() {
        var previewBox = gid('admin-broadcast-preview-box');
        if (!previewBox) return;

        var titleEl = gid('admin-broadcast-title');
        var textEl = gid('admin-broadcast-text');
        var badgeEl = gid('admin-broadcast-badge');
        var typeEl = gid('admin-broadcast-type');
        var iconEl = gid('admin-broadcast-icon');
        var closableEl = gid('admin-broadcast-closable');
        var enabledEl = gid('admin-broadcast-enabled');
        var charCountEl = gid('admin-broadcast-char-count');

        var title = titleEl ? titleEl.value.trim() : '';
        var text = textEl ? textEl.value.trim() : '';
        var badge = badgeEl && badgeEl.value.trim() ? badgeEl.value.trim().toUpperCase() : 'PENGUMUMAN';
        var type = typeEl ? typeEl.value : 'info';
        var icon = iconEl ? iconEl.value : 'megaphone';
        var closable = closableEl ? closableEl.checked : true;
        var enabled = enabledEl ? enabledEl.checked : true;

        if (charCountEl) {
            charCountEl.innerText = text.length + ' Karakter';
        }

        var previewTitle = title || badge;
        var previewText = text || 'Teks pengumuman akan ditampilkan di sini dengan rapi dan jelas kepada seluruh pengguna...';

        // Color palettes
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

        var closeBtnCard = closable ? `
        <span class="p-1 rounded-lg bg-white/5 text-white/50 shrink-0 cursor-pointer">
            <i data-lucide="x" class="w-4 h-4"></i>
        </span>` : '';

        // Home Announcement Card preview (matches home screen card)
        var cardHtml = `
        <div class="p-4 sm:p-5 rounded-2xl border transition-all duration-500 overflow-hidden relative shadow-xl ${!enabled ? 'opacity-40 grayscale' : ''}" style="background: radial-gradient(circle at 80% 20%, ${glowColor} 0%, rgba(20, 24, 33, 0.95) 85%); border-color: ${borderColor}; box-shadow: 0 12px 36px -10px ${glowColor};">
            <div class="flex items-start gap-3.5 relative z-10">
                <div class="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border shadow-lg" style="background: ${glowColor}; color: ${accentColor}; border-color: ${borderColor};">
                    <i data-lucide="${icon}" class="w-6 h-6 animate-pulse"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between gap-2 mb-1.5">
                        <span class="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1 shadow-sm" style="background: ${accentColor}25; color: ${accentColor}; border-color: ${accentColor}50;">
                            ${badge}
                        </span>
                        ${closeBtnCard}
                    </div>
                    <h3 class="text-sm sm:text-base font-black text-white tracking-tight">${previewTitle}</h3>
                    <p class="text-xs text-white/80 mt-1 leading-relaxed font-sans">${previewText}</p>
                </div>
            </div>
        </div>`;

        previewBox.innerHTML = cardHtml;
        if (window.lucide) lucide.createIcons();
    },

    // Apply quick preset to form
    applyBroadcastPreset(presetId) {
        var preset = (Profile.broadcastPresets || []).find(function(p) { return p.id === presetId; });
        if (!preset) return;

        var titleEl = gid('admin-broadcast-title');
        var textEl = gid('admin-broadcast-text');
        var badgeEl = gid('admin-broadcast-badge');
        var enabledEl = gid('admin-broadcast-enabled');
        var iconEl = gid('admin-broadcast-icon');
        var typeEl = gid('admin-broadcast-type');

        if (titleEl) titleEl.value = preset.title || '';
        if (textEl) textEl.value = preset.text || '';
        if (badgeEl) badgeEl.value = preset.badge || 'PENGUMUMAN';
        if (enabledEl) enabledEl.checked = true;
        if (iconEl && preset.icon) iconEl.value = preset.icon;
        if (typeEl && preset.type) typeEl.value = preset.type;

        Profile.updateBroadcastLivePreview();

        if (typeof showToast === 'function') {
            showToast('Template "' + preset.name + '" diterapkan');
        }
    },

    // Save & broadcast to all clients
    async saveBroadcastConfig(overrideEnabled) {
        var token = Profile.getAdminToken();
        if (!token) {
            if (typeof showToast === 'function') showToast('Sesi admin berakhir, silakan login kembali.');
            return;
        }

        var titleEl = gid('admin-broadcast-title');
        var textEl = gid('admin-broadcast-text');
        var badgeEl = gid('admin-broadcast-badge');
        var typeEl = gid('admin-broadcast-type');
        var iconEl = gid('admin-broadcast-icon');
        var closableEl = gid('admin-broadcast-closable');
        var enabledEl = gid('admin-broadcast-enabled');

        var enabled = overrideEnabled !== undefined ? overrideEnabled : (enabledEl ? enabledEl.checked : true);
        var title = titleEl ? titleEl.value.trim() : '';
        var text = textEl ? textEl.value.trim() : '';
        var badge = badgeEl && badgeEl.value.trim() ? badgeEl.value.trim().toUpperCase() : 'PENGUMUMAN';
        var type = typeEl ? typeEl.value : (Profile.selectedBroadcastType || 'info');
        var icon = iconEl ? iconEl.value : (Profile.selectedBroadcastIcon || 'megaphone');
        var closable = closableEl ? closableEl.checked : true;

        if (enabled && !text) {
            if (typeof showToast === 'function') showToast('Harap masukkan isi pesan pengumuman sebelum menyiarkan.');
            if (textEl) textEl.focus();
            return;
        }

        var btn = gid('admin-save-broadcast-btn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> <span>Menyiarkan...</span>';
            if (window.lucide) lucide.createIcons();
        }

        try {
            var res = await fetch('/api/broadcast', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-token': token
                },
                body: JSON.stringify({
                    enabled: enabled,
                    title: title,
                    text: text,
                    badge: badge,
                    type: type,
                    icon: icon,
                    closable: closable
                })
            });

            var data = await res.json();
            if (data.status) {
                sessionStorage.removeItem('musifystar_dismissed_broadcast');
                if (typeof showToast === 'function') {
                    showToast(enabled ? 'Pengumuman berhasil disiarkan ke Beranda!' : 'Pengumuman dinonaktifkan.');
                }
                if (window.App && typeof App.applyBroadcast === 'function') {
                    App.applyBroadcast(data.config);
                }
                Profile.renderAdminBroadcastTab();
            } else {
                if (typeof showToast === 'function') {
                    showToast(data.message || 'Gagal menyimpan pengumuman');
                }
            }
        } catch (e) {
            if (typeof showToast === 'function') {
                showToast('Terjadi kesalahan jaringan saat menyimpan pengumuman');
            }
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i data-lucide="send" class="w-4 h-4"></i> <span>Terapkan & Siarkan Pengumuman Sekarang</span>';
                if (window.lucide) lucide.createIcons();
            }
        }
    },

    // ==========================================
    // TAB: SITE UPDATE LINK BANNER (TENGAH LAYAR)
    // ==========================================
    async checkSiteUpdateBadgeQuietly() {
        try {
            var res = await fetch('/api/site-update?t=' + Date.now(), { cache: 'no-store' });
            var data = await res.json();
            var badgeEl = gid('admin-siteupdate-status-badge');
            if (badgeEl) {
                if (data && data.status && data.enabled && data.targetUrl) {
                    badgeEl.classList.remove('hidden');
                } else {
                    badgeEl.classList.add('hidden');
                }
            }
        } catch (e) {}
    },

    async renderAdminSiteUpdateTab() {
        var container = gid('admin-siteupdate-container');
        if (!container) return;

        container.innerHTML = `
        <div class="text-center py-12 text-white/50 space-y-2">
            <i data-lucide="loader-2" class="w-6 h-6 animate-spin mx-auto text-cyan-400"></i>
            <p class="text-xs">Memuat konfigurasi banner update link website...</p>
        </div>`;
        if (window.lucide) lucide.createIcons();

        try {
            var res = await fetch('/api/site-update?t=' + Date.now(), { cache: 'no-store' });
            var data = await res.json();
            var config = (data && data.status) ? data : {
                enabled: false,
                title: 'Pembaruan Website MusifyStar',
                message: 'Website MusifyStar telah berpindah ke alamat tautan (link) baru yang lebih cepat, stabil, dan memiliki fitur terbaru. Silakan klik tombol di bawah untuk membuka dan beralih ke website baru sekarang.',
                targetUrl: '',
                buttonText: 'Buka Link Website Baru',
                badgeText: 'UPDATE WEBSITE RESMI',
                forceLock: true
            };

            var enabled = !!config.enabled;
            var title = config.title || 'Pembaruan Website MusifyStar';
            var message = config.message || 'Website MusifyStar telah berpindah ke alamat tautan (link) baru yang lebih cepat, stabil, dan memiliki fitur terbaru. Silakan klik tombol di bawah untuk membuka dan beralih ke website baru sekarang.';
            var targetUrl = config.targetUrl || '';
            var buttonText = config.buttonText || 'Buka Link Website Baru';
            var badgeText = config.badgeText || 'UPDATE WEBSITE RESMI';
            var forceLock = config.forceLock !== false;

            // Update status badge
            var badgeEl = gid('admin-siteupdate-status-badge');
            if (badgeEl) {
                if (enabled && targetUrl) badgeEl.classList.remove('hidden');
                else badgeEl.classList.add('hidden');
            }

            container.innerHTML = `
            <div class="max-w-2xl mx-auto space-y-5">
                <!-- Header Info Card -->
                <div class="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-cyan-500/15 via-sky-500/10 to-blue-600/15 border border-cyan-500/30 shadow-lg relative overflow-hidden">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                        <div class="flex items-center gap-3">
                            <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-400 to-blue-600 text-black flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/30">
                                <i data-lucide="external-link" class="w-6 h-6"></i>
                            </div>
                            <div>
                                <h3 class="text-sm sm:text-base font-black text-white tracking-tight">Banner Update Link Website (Tengah Layar)</h3>
                                <p class="text-xs text-white/70">Bukan pengumuman biasa &bull; Menutup setengah layar &bull; Pengguna tidak bisa menghapus/menutup</p>
                            </div>
                        </div>
                        <div class="shrink-0 flex items-center gap-2">
                            ${enabled ? `
                                <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-cyan-400 text-black shadow-lg shadow-cyan-500/30 animate-pulse">
                                    <span class="w-2 h-2 rounded-full bg-black"></span>
                                    <span>AKTIF DI LAYAR</span>
                                </div>` : `
                                <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/10 text-white/50 border border-white/10">
                                    <span class="w-2 h-2 rounded-full bg-white/30"></span>
                                    <span>NONAKTIF</span>
                                </div>`
                            }
                        </div>
                    </div>
                    <div class="mt-3 pt-3 border-t border-white/10 text-[11px] text-white/60 leading-relaxed flex items-start gap-2">
                        <i data-lucide="info" class="w-4 h-4 text-cyan-400 shrink-0 mt-0.5"></i>
                        <span>Jika diaktifkan, banner berbentuk pop-up di tengah layar akan otomatis menutupi setengah layar dan mengunci aktivitas pengguna sampai mereka menekan tombol <b>Buka Link Website Baru</b> untuk beralih ke website baru.</span>
                    </div>
                </div>

                <!-- Form Controls -->
                <div class="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4 shadow-lg">
                    <!-- Status Switch -->
                    <div class="flex items-center justify-between pb-3 border-b border-white/10">
                        <div>
                            <span class="text-xs font-bold text-white block">Status Banner Tengah Layar</span>
                            <span class="text-[11px] text-white/50">Aktifkan untuk langsung menampilkan banner ke seluruh pengunjung</span>
                        </div>
                        <label class="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox" id="admin-siteupdate-enabled" ${enabled ? 'checked' : ''} class="w-5 h-5 rounded text-cyan-500 bg-black/40 border-white/20 accent-cyan-500 cursor-pointer" />
                            <span class="text-xs font-bold text-cyan-300">Aktifkan</span>
                        </label>
                    </div>

                    <!-- Target URL -->
                    <div class="space-y-1.5">
                        <label class="text-xs font-bold text-white flex items-center justify-between">
                            <span class="flex items-center gap-1.5">
                                <i data-lucide="globe" class="w-3.5 h-3.5 text-cyan-400"></i>
                                <span>Alamat Link URL Website Baru (Wajib Diisi saat Aktif)</span>
                            </span>
                            <span class="text-[10px] text-cyan-400 font-mono">Format: https://...</span>
                        </label>
                        <input type="url" id="admin-siteupdate-url" value="${es(targetUrl)}" placeholder="https://musifystar-baru.example.com" class="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white placeholder-white/30 text-xs sm:text-sm font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all" />
                        <p class="text-[10px] text-white/40">Link tujuan saat pengunjung menekan tombol 'Buka Link Website'.</p>
                    </div>

                    <!-- Title -->
                    <div class="space-y-1.5">
                        <label class="text-xs font-bold text-white block">Judul Banner</label>
                        <input type="text" id="admin-siteupdate-title" value="${es(title)}" placeholder="Pembaruan Website MusifyStar" class="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white placeholder-white/30 text-xs sm:text-sm font-medium focus:outline-none focus:border-cyan-500 transition-all" />
                    </div>

                    <!-- Message -->
                    <div class="space-y-1.5">
                        <label class="text-xs font-bold text-white block">Pesan Pembaruan Website</label>
                        <textarea id="admin-siteupdate-message" rows="3" placeholder="Tuliskan pesan pemindahan/pembaruan link..." class="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white placeholder-white/30 text-xs sm:text-sm font-medium focus:outline-none focus:border-cyan-500 transition-all resize-y leading-relaxed">${es(message)}</textarea>
                    </div>

                    <!-- Button Text & Badge -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div class="space-y-1.5">
                            <label class="text-xs font-bold text-white block">Teks Tombol Buka Link</label>
                            <input type="text" id="admin-siteupdate-btntext" value="${es(buttonText)}" placeholder="Buka Link Website Baru" class="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white placeholder-white/30 text-xs font-medium focus:outline-none focus:border-cyan-500 transition-all" />
                        </div>
                        <div class="space-y-1.5">
                            <label class="text-xs font-bold text-white block">Label Badge Atas</label>
                            <input type="text" id="admin-siteupdate-badgetext" value="${es(badgeText)}" placeholder="UPDATE WEBSITE RESMI" class="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white placeholder-white/30 text-xs font-medium uppercase focus:outline-none focus:border-cyan-500 transition-all" />
                        </div>
                    </div>

                    <!-- Non-dismissible / Force Lock -->
                    <div class="pt-3 border-t border-white/10 flex items-center justify-between">
                        <div>
                            <span class="text-xs font-bold text-white block">Kunci Layar (Tidak Bisa Ditutup/Dihapus)</span>
                            <span class="text-[11px] text-white/50">Pengguna tidak dapat menutup pop-up tanpa mengklik link baru</span>
                        </div>
                        <label class="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox" id="admin-siteupdate-forcelock" ${forceLock ? 'checked' : ''} class="w-4 h-4 rounded text-cyan-500 bg-black/40 border-white/20 accent-cyan-500 cursor-pointer" />
                            <span class="text-xs font-bold text-rose-400">Wajib Kunci</span>
                        </label>
                    </div>
                </div>

                <!-- Action Buttons: Preview & Save -->
                <div class="space-y-2">
                    <button type="button" onclick="Profile.previewSiteUpdateBanner()" class="w-full py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/15 active:scale-98 transition-all cursor-pointer">
                        <i data-lucide="eye" class="w-4 h-4 text-cyan-400"></i>
                        <span>Pratinjau / Test Tampilan Banner (Tengah Layar)</span>
                    </button>

                    <div class="flex flex-col sm:flex-row gap-2.5">
                        <button id="admin-save-siteupdate-btn" onclick="Profile.saveSiteUpdateConfig(true)" class="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-black font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-98 transition-all cursor-pointer">
                            <i data-lucide="check" class="w-4 h-4"></i>
                            <span>Simpan & Terapkan Banner Sekarang</span>
                        </button>
                        ${enabled ? `
                        <button onclick="Profile.saveSiteUpdateConfig(false)" class="py-3 px-4 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-98 transition-all cursor-pointer">
                            <i data-lucide="power" class="w-4 h-4"></i>
                            <span>Matikan Banner</span>
                        </button>` : ''}
                    </div>
                </div>
            </div>`;

            if (window.lucide) lucide.createIcons();

        } catch (e) {
            if (container) {
                container.innerHTML = `
                <div class="text-center py-12 text-rose-400 space-y-2">
                    <i data-lucide="alert-triangle" class="w-8 h-8 mx-auto"></i>
                    <p class="text-xs font-semibold">Gagal memuat konfigurasi banner update: ${e.message}</p>
                </div>`;
                if (window.lucide) lucide.createIcons();
            }
        }
    },

    previewSiteUpdateBanner() {
        var urlEl = gid('admin-siteupdate-url');
        var titleEl = gid('admin-siteupdate-title');
        var msgEl = gid('admin-siteupdate-message');
        var btnTextEl = gid('admin-siteupdate-btntext');
        var badgeEl = gid('admin-siteupdate-badgetext');
        var forceLockEl = gid('admin-siteupdate-forcelock');

        var previewData = {
            enabled: true,
            title: titleEl ? titleEl.value.trim() : 'Pembaruan Website MusifyStar',
            message: msgEl ? msgEl.value.trim() : 'Website MusifyStar telah berpindah ke alamat link baru.',
            targetUrl: (urlEl && urlEl.value.trim()) ? urlEl.value.trim() : 'https://musifystar.newdomain.com',
            buttonText: (btnTextEl && btnTextEl.value.trim()) ? btnTextEl.value.trim() : 'Buka Link Website Baru',
            badgeText: (badgeEl && badgeEl.value.trim()) ? badgeEl.value.trim() : 'UPDATE WEBSITE RESMI',
            forceLock: forceLockEl ? forceLockEl.checked : true,
            updatedAt: 'preview-' + Date.now()
        };

        if (window.App && typeof App.renderSiteUpdateBanner === 'function') {
            App.renderSiteUpdateBanner(previewData, true);
        }
    },

    async saveSiteUpdateConfig(overrideEnabled) {
        var token = Profile.getAdminToken();
        if (!token) {
            if (typeof showToast === 'function') showToast('Sesi admin berakhir, silakan login kembali.');
            return;
        }

        var enabledEl = gid('admin-siteupdate-enabled');
        var urlEl = gid('admin-siteupdate-url');
        var titleEl = gid('admin-siteupdate-title');
        var msgEl = gid('admin-siteupdate-message');
        var btnTextEl = gid('admin-siteupdate-btntext');
        var badgeEl = gid('admin-siteupdate-badgetext');
        var forceLockEl = gid('admin-siteupdate-forcelock');

        var enabled = overrideEnabled !== undefined ? overrideEnabled : (enabledEl ? enabledEl.checked : true);
        var targetUrl = urlEl ? urlEl.value.trim() : '';
        var title = titleEl ? titleEl.value.trim() : 'Pembaruan Website MusifyStar';
        var message = msgEl ? msgEl.value.trim() : '';
        var buttonText = btnTextEl ? btnTextEl.value.trim() : 'Buka Link Website Baru';
        var badgeText = badgeEl ? badgeEl.value.trim() : 'UPDATE WEBSITE RESMI';
        var forceLock = forceLockEl ? forceLockEl.checked : true;

        if (enabled && !targetUrl) {
            if (typeof showToast === 'function') showToast('Alamat URL Link Website Baru wajib diisi saat banner diaktifkan!');
            if (urlEl) urlEl.focus();
            return;
        }

        var btn = gid('admin-save-siteupdate-btn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> <span>Menyimpan...</span>';
            if (window.lucide) lucide.createIcons();
        }

        try {
            var res = await fetch('/api/site-update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-token': token
                },
                body: JSON.stringify({
                    enabled: enabled,
                    targetUrl: targetUrl,
                    title: title,
                    message: message,
                    buttonText: buttonText,
                    badgeText: badgeText,
                    forceLock: forceLock
                })
            });

            var data = await res.json();
            if (data && data.status) {
                if (enabled) {
                    sessionStorage.removeItem('musifystar_admin_dismissed_site_update');
                    localStorage.removeItem('musifystar_admin_dismissed_site_update');
                }
                if (typeof showToast === 'function') {
                    showToast(data.message || (enabled ? 'Banner Update Link berhasil diaktifkan di tengah layar!' : 'Banner dinonaktifkan.'));
                }
                if (window.App && typeof App.renderSiteUpdateBanner === 'function') {
                    App.renderSiteUpdateBanner(data.config, false);
                }
                Profile.renderAdminSiteUpdateTab();
            } else {
                if (typeof showToast === 'function') {
                    showToast(data.message || 'Gagal menyimpan konfigurasi banner');
                }
            }
        } catch (e) {
            if (typeof showToast === 'function') {
                showToast('Terjadi kesalahan jaringan: ' + e.message);
            }
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i data-lucide="check" class="w-4 h-4"></i> <span>Simpan & Terapkan Banner Sekarang</span>';
                if (window.lucide) lucide.createIcons();
            }
        }
    },

    // ==========================================
    // 3. TAB SECURITY & TWO-FACTOR AUTH (2FA) & PASSWORD
    // ==========================================
    async renderAdminSecurityTab() {
        var container = gid('admin-security-container');
        if (!container) return;

        var token = Profile.getAdminToken();
        var twoFactorEnabled = false;

        try {
            var res = await fetch('/api/admin-auth', {
                headers: { 'x-admin-token': token || '' }
            });
            var authState = await res.json();
            twoFactorEnabled = !!authState.twoFactorEnabled;
        } catch (e) {}

        container.innerHTML = `
        <div class="max-w-xl mx-auto space-y-5">
            <!-- 1. TWO-FACTOR AUTHENTICATION (2FA) CARD -->
            <div class="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/20 shadow-lg space-y-4">
                <div class="flex items-center justify-between gap-3">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                            <i data-lucide="shield-check" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <div class="flex items-center gap-2">
                                <h3 class="text-base font-bold text-white">Two-Factor Authentication (2FA)</h3>
                                <span class="text-[10px] ${twoFactorEnabled ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-white/10 text-white/50 border-white/10'} font-extrabold px-2 py-0.5 rounded-full uppercase border">
                                    ${twoFactorEnabled ? 'Aktif' : 'Nonaktif'}
                                </span>
                            </div>
                            <p class="text-xs text-white/60">Pengamanan login admin dengan kode OTP 6 digit dari Google Authenticator / Authy</p>
                        </div>
                    </div>
                </div>

                <div id="admin-2fa-setup-box" class="pt-1">
                    ${twoFactorEnabled ? `
                    <div class="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
                        <div class="flex items-start gap-2.5 text-xs text-emerald-300">
                            <i data-lucide="check-circle-2" class="w-4 h-4 shrink-0 mt-0.5 text-emerald-400"></i>
                            <span>2FA aktif! Setiap kali login ke panel admin, Anda akan diminta memasukkan 6 digit kode OTP yang dihasilkan secara dinamis.</span>
                        </div>
                        <button onclick="Profile.disable2FA()" class="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95">
                            <i data-lucide="shield-off" class="w-3.5 h-3.5"></i>
                            <span>Nonaktifkan 2FA</span>
                        </button>
                    </div>` : `
                    <div class="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3">
                        <p class="text-xs text-white/70 leading-relaxed">
                            Tingkatkan keamanan panel admin dari pembajakan dengan mewajibkan verifikasi OTP saat masuk.
                        </p>
                        <button onclick="Profile.start2FASetup()" id="admin-start-2fa-btn" class="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-2 active:scale-95">
                            <i data-lucide="smartphone" class="w-4 h-4"></i>
                            <span>Mulai Setup 2FA (Scan QR)</span>
                        </button>
                    </div>`}
                </div>
            </div>

            <!-- 2. GANTI PASSWORD ADMIN -->
            <div class="p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 to-rose-500/10 border border-purple-500/20 shadow-lg space-y-4">
                <div class="flex items-center gap-3.5 mb-2">
                    <div class="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 border border-purple-500/30">
                        <i data-lucide="key" class="w-5 h-5"></i>
                    </div>
                    <div>
                        <h3 class="text-base font-bold text-white">Ganti Password Admin</h3>
                        <p class="text-xs text-white/60">Perbarui kata sandi panel admin secara aman dan instan</p>
                    </div>
                </div>
                <div class="p-3 rounded-xl bg-black/40 border border-white/5 text-[11px] text-white/70 leading-relaxed flex items-start gap-2">
                    <i data-lucide="lock" class="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5"></i>
                    <span>Password baru akan di-hash secara aman menggunakan algoritma <strong>PBKDF2 SHA-512</strong> dengan salt kriptografis tanpa perlu menyentuh file kode sumber.</span>
                </div>

                <!-- Password Form -->
                <form id="admin-change-pass-form" onsubmit="Profile.changeAdminPassword(event)" class="space-y-4 pt-1">
                    <div id="admin-pass-alert" class="hidden p-3 rounded-xl text-xs font-semibold"></div>

                    <div class="space-y-1.5">
                        <label class="text-xs font-bold text-white/80 flex items-center justify-between">
                            <span>Password Lama</span>
                        </label>
                        <div class="relative">
                            <input id="admin-old-pass" type="password" required placeholder="Masukkan password admin saat ini" class="w-full px-3.5 py-2.5 pr-10 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-rose-500 transition-all font-sans" />
                            <button type="button" onclick="Profile.togglePassVisibility('admin-old-pass', this)" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-all cursor-pointer p-1">
                                <i data-lucide="eye" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>

                    <div class="space-y-1.5">
                        <label class="text-xs font-bold text-white/80 flex items-center justify-between">
                            <span>Password Baru</span>
                            <span id="admin-pass-strength" class="text-[10px] text-white/40 font-normal">Min. 4 karakter</span>
                        </label>
                        <div class="relative">
                            <input id="admin-new-pass" type="password" required placeholder="Masukkan password baru" oninput="Profile.checkPasswordStrength(this.value)" class="w-full px-3.5 py-2.5 pr-10 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-rose-500 transition-all font-sans" />
                            <button type="button" onclick="Profile.togglePassVisibility('admin-new-pass', this)" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-all cursor-pointer p-1">
                                <i data-lucide="eye" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>

                    <div class="space-y-1.5">
                        <label class="text-xs font-bold text-white/80">Konfirmasi Password Baru</label>
                        <div class="relative">
                            <input id="admin-confirm-pass" type="password" required placeholder="Ketik ulang password baru" class="w-full px-3.5 py-2.5 pr-10 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-rose-500 transition-all font-sans" />
                            <button type="button" onclick="Profile.togglePassVisibility('admin-confirm-pass', this)" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-all cursor-pointer p-1">
                                <i data-lucide="eye" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>

                    <div class="pt-2">
                        <button type="submit" id="admin-save-pass-btn" class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 active:scale-98 text-white font-bold text-xs shadow-lg shadow-rose-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer">
                            <i data-lucide="save" class="w-4 h-4"></i>
                            <span>Simpan Password Baru</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>`;

        lucide.createIcons();
    },

    async start2FASetup() {
        var token = Profile.getAdminToken();
        var box = gid('admin-2fa-setup-box');
        var btn = gid('admin-start-2fa-btn');

        if (!token) {
            if (typeof showToast === 'function') {
                showToast('Silakan login ke panel admin terlebih dahulu');
            }
            return;
        }
        if (!box) return;

        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> <span>Menyiapkan QR Code...</span>';
            lucide.createIcons();
        }

        try {
            var res = await fetch('/api/admin-auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-token': token
                },
                body: JSON.stringify({ action: '2fa_setup', token: token })
            });
            var data = await res.json();

            if (data.status && data.secret) {
                box.innerHTML = `
                <div class="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-4">
                    <div class="text-center space-y-1">
                        <h4 class="text-xs font-bold text-white">Scan QR Code di Aplikasi Authenticator</h4>
                        <p class="text-[11px] text-white/60">Gunakan Google Authenticator, Microsoft Authenticator, atau Authy</p>
                    </div>

                    <div class="flex justify-center p-3 bg-white rounded-2xl max-w-[180px] mx-auto shadow-xl">
                        <img src="${data.qrUrl}" alt="2FA QR Code" class="w-36 h-36 rounded-lg" />
                    </div>

                    <div class="space-y-1">
                        <label class="text-[10px] text-white/50 font-bold uppercase tracking-wider block text-center">Atau Masukkan Secret Key Manual</label>
                        <div class="flex items-center gap-1.5 p-2 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-emerald-400 justify-between">
                            <span class="tracking-widest">${data.secret}</span>
                            <button type="button" onclick="Profile.copy2FASecret('${data.secret}')" class="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-[10px] text-white cursor-pointer transition">
                                Salin
                            </button>
                        </div>
                    </div>

                    <form onsubmit="Profile.confirm2FAEnable(event, '${data.secret}')" class="space-y-3 pt-2 border-t border-white/10">
                        <div id="admin-2fa-setup-alert" class="hidden p-2.5 rounded-xl text-xs font-semibold"></div>
                        <div class="space-y-1 text-center">
                            <label class="text-xs font-bold text-white">Masukkan 6 Digit Kode OTP Untuk Konfirmasi</label>
                            <input type="text" id="admin-setup-otp" required maxlength="6" pattern="[0-9]{6}" inputmode="numeric" placeholder="000000" class="w-full text-center text-xl font-mono tracking-[0.3em] py-2 bg-black/60 border border-white/20 rounded-xl text-emerald-400 focus:outline-none focus:border-emerald-500" autofocus />
                        </div>
                        <div class="flex items-center gap-2">
                            <button type="button" onclick="Profile.renderAdminSecurityTab()" class="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 text-xs font-bold transition">
                                Batal
                            </button>
                            <button type="submit" id="admin-confirm-2fa-btn" class="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20">
                                <i data-lucide="check" class="w-3.5 h-3.5"></i>
                                <span>Verifikasi & Aktifkan</span>
                            </button>
                        </div>
                    </form>
                </div>`;
                lucide.createIcons();
            } else {
                if (typeof showToast === 'function') {
                    showToast(data.message || 'Gagal memulai setup 2FA');
                }
                Profile.renderAdminSecurityTab();
            }
        } catch (e) {
            if (typeof showToast === 'function') {
                showToast('Gagal menghubungi server');
            }
            Profile.renderAdminSecurityTab();
        }
    },

    copy2FASecret(secret) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(secret);
            if (typeof showToast === 'function') {
                showToast('Secret Key disalin ke clipboard');
            }
        }
    },

    async confirm2FAEnable(event, secret) {
        if (event && event.preventDefault) event.preventDefault();

        var otpInput = gid('admin-setup-otp');
        var alertEl = gid('admin-2fa-setup-alert');
        var btn = gid('admin-confirm-2fa-btn');
        var token = Profile.getAdminToken();

        var otp = otpInput ? otpInput.value.trim() : '';
        if (!otp || otp.length !== 6 || !token) return;

        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i> <span>Memverifikasi...</span>';
            lucide.createIcons();
        }

        try {
            var res = await fetch('/api/admin-auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-token': token
                },
                body: JSON.stringify({
                    action: '2fa_enable',
                    secret: secret,
                    otp: otp,
                    token: token
                })
            });
            var data = await res.json();

            if (data.status && data.success) {
                if (typeof showToast === 'function') {
                    showToast('Two-Factor Authentication (2FA) berhasil diaktifkan!');
                }
                Profile.renderAdminSecurityTab();
            } else {
                if (alertEl) {
                    alertEl.className = 'p-2.5 rounded-xl text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/30';
                    alertEl.innerText = data.message || 'Kode OTP salah!';
                    alertEl.classList.remove('hidden');
                }
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = '<i data-lucide="check" class="w-3.5 h-3.5"></i> <span>Verifikasi & Aktifkan</span>';
                    lucide.createIcons();
                }
            }
        } catch (e) {
            if (alertEl) {
                alertEl.className = 'p-2.5 rounded-xl text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/30';
                alertEl.innerText = 'Gagal memverifikasi OTP: ' + e.message;
                alertEl.classList.remove('hidden');
            }
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i data-lucide="check" class="w-3.5 h-3.5"></i> <span>Verifikasi & Aktifkan</span>';
                lucide.createIcons();
            }
        }
    },

    async disable2FA() {
        var token = Profile.getAdminToken();
        if (!token) return;

        var pwd = prompt('Masukkan password admin Anda untuk mengonfirmasi penonaktifan 2FA:');
        if (!pwd) return;

        try {
            var res = await fetch('/api/admin-auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-token': token
                },
                body: JSON.stringify({
                    action: '2fa_disable',
                    password: pwd,
                    token: token
                })
            });
            var data = await res.json();
            if (data.status && data.success) {
                if (typeof showToast === 'function') {
                    showToast('2FA telah dinonaktifkan.');
                }
                Profile.renderAdminSecurityTab();
            } else {
                alert(data.message || 'Gagal menonaktifkan 2FA');
            }
        } catch (e) {
            alert('Gagal menghubungi server');
        }
    },

    togglePassVisibility(inputId, btn) {
        var el = gid(inputId);
        if (!el) return;
        var isPass = el.type === 'password';
        el.type = isPass ? 'text' : 'password';
        if (btn) {
            btn.innerHTML = `<i data-lucide="${isPass ? 'eye-off' : 'eye'}" class="w-4 h-4"></i>`;
            lucide.createIcons();
        }
    },

    checkPasswordStrength(val) {
        var strengthEl = gid('admin-pass-strength');
        if (!strengthEl) return;
        if (!val || val.length === 0) {
            strengthEl.innerText = 'Min. 4 karakter';
            strengthEl.className = 'text-[10px] text-white/40 font-normal';
        } else if (val.length < 4) {
            strengthEl.innerText = 'Terlalu Pendek';
            strengthEl.className = 'text-[10px] text-rose-400 font-bold';
        } else if (val.length < 8) {
            strengthEl.innerText = 'Sedang';
            strengthEl.className = 'text-[10px] text-amber-400 font-bold';
        } else {
            strengthEl.innerText = 'Kuat & Aman';
            strengthEl.className = 'text-[10px] text-emerald-400 font-bold';
        }
    },

    async changeAdminPassword(event) {
        if (event && event.preventDefault) event.preventDefault();

        var oldPassEl = gid('admin-old-pass');
        var newPassEl = gid('admin-new-pass');
        var confirmPassEl = gid('admin-confirm-pass');
        var alertEl = gid('admin-pass-alert');
        var saveBtn = gid('admin-save-pass-btn');
        var token = Profile.getAdminToken();

        if (!newPassEl || !confirmPassEl || !oldPassEl) return;

        var oldPassword = oldPassEl.value;
        var newPassword = newPassEl.value;
        var confirmPassword = confirmPassEl.value;

        if (newPassword.length < 4) {
            if (alertEl) {
                alertEl.className = 'p-3 rounded-xl text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/30';
                alertEl.innerText = 'Password baru minimal harus 4 karakter!';
                alertEl.classList.remove('hidden');
            }
            return;
        }

        if (newPassword !== confirmPassword) {
            if (alertEl) {
                alertEl.className = 'p-3 rounded-xl text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/30';
                alertEl.innerText = 'Konfirmasi password baru tidak cocok!';
                alertEl.classList.remove('hidden');
            }
            return;
        }

        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> <span>Menyimpan...</span>';
            lucide.createIcons();
        }

        try {
            var res = await fetch('/api/admin-auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-token': token || ''
                },
                body: JSON.stringify({
                    action: 'change_password',
                    oldPassword: oldPassword,
                    newPassword: newPassword,
                    token: token
                })
            });
            var data = await res.json();

            if (data.status && data.success) {
                if (alertEl) {
                    alertEl.className = 'p-3 rounded-xl text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
                    alertEl.innerText = data.message || 'Password admin berhasil diperbarui secara aman!';
                    alertEl.classList.remove('hidden');
                }
                oldPassEl.value = '';
                newPassEl.value = '';
                confirmPassEl.value = '';
                if (typeof showToast === 'function') {
                    showToast('Password admin berhasil diperbarui!');
                }
            } else {
                if (alertEl) {
                    alertEl.className = 'p-3 rounded-xl text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/30';
                    alertEl.innerText = data.message || 'Gagal mengubah password admin.';
                    alertEl.classList.remove('hidden');
                }
            }
        } catch (err) {
            if (alertEl) {
                alertEl.className = 'p-3 rounded-xl text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/30';
                alertEl.innerText = 'Terjadi kesalahan jaringan atau server: ' + err.message;
                alertEl.classList.remove('hidden');
            }
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i data-lucide="save" class="w-4 h-4"></i> <span>Simpan Password Baru</span>';
                lucide.createIcons();
            }
        }
    },

    // 2. FEEDBACK INBOX LOADER & RENDERER
    async loadAdminFeedbacks() {
        var container = gid('admin-feedbacks-container');
        var badgeEl = gid('admin-feedback-badge');
        var token = Profile.getAdminToken();

        if (!token) return;

        try {
            var res = await fetch('/api/feedback', {
                headers: { 'x-admin-token': token }
            });
            var data = await res.json();

            if (!data.status || !Array.isArray(data.feedbacks)) {
                if (container) {
                    container.innerHTML = `
                    <div class="text-center py-12 text-red-400 space-y-2">
                        <i data-lucide="alert-triangle" class="w-8 h-8 mx-auto"></i>
                        <p class="text-xs font-semibold">Gagal memuat pesan masukan.</p>
                    </div>`;
                    lucide.createIcons();
                }
                return;
            }

            var feedbacks = data.feedbacks;
            var unread = feedbacks.filter(function(f){ return !f.isRead; }).length;

            if (badgeEl) {
                if (unread > 0) {
                    badgeEl.innerText = unread;
                    badgeEl.classList.remove('hidden');
                } else {
                    badgeEl.classList.add('hidden');
                }
            }

            if (feedbacks.length === 0) {
                if (container) {
                    container.innerHTML = `
                    <div class="text-center py-16 text-white/50 space-y-3">
                        <div class="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-white/30">
                            <i data-lucide="inbox" class="w-7 h-7"></i>
                        </div>
                        <h4 class="text-sm font-bold text-white">Belum Ada Masukan Pengguna</h4>
                        <p class="text-xs text-white/50 max-w-sm mx-auto leading-relaxed">
                            Pesan dan masukan yang dikirim melalui tombol masukan di profil akan otomatis tampil di sini.
                        </p>
                    </div>`;
                    lucide.createIcons();
                }
                return;
            }

            var html = '';
            feedbacks.forEach(function(item) {
                var dateStr = '';
                try {
                    var d = new Date(item.createdAt);
                    dateStr = d.toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                } catch(e) {
                    dateStr = item.createdAt;
                }

                // Detect if user was logged in
                var isLogged = !!(item.userLogged || item.username || (item.email && item.email.includes('@')));
                var rawEmail = item.email || (item.contact && item.contact.includes('@') ? item.contact : '');
                var sensoredEmail = Profile.maskEmail(rawEmail);
                var dispName = item.username || item.name || 'Pengguna';
                var isVerified = (rawEmail === 'jrnabil570@gmail.com') || (item.contact === 'jrnabil570@gmail.com');
                var avatarUrl = item.userAvatar || (dispName ? ('https://api.dicebear.com/7.x/bottts/svg?seed=' + encodeURIComponent(dispName)) : '/logo.png');

                // Detect if contact is phone or email for direct quick-actions
                var contact = item.contact || '-';
                var contactAction = '';
                if (contact !== '-') {
                    var cleanNum = contact.replace(/[^0-9+]/g, '');
                    if (cleanNum.length >= 8) {
                        var waNum = cleanNum;
                        if (waNum.startsWith('0')) waNum = '62' + waNum.substring(1);
                        contactAction = `<a href="https://wa.me/${waNum}" target="_blank" class="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"><i data-lucide="phone" class="w-3 h-3"></i> WhatsApp</a>`;
                    } else if (contact.includes('@')) {
                        contactAction = `<a href="mailto:${contact}" class="text-[11px] text-sky-400 hover:underline flex items-center gap-1"><i data-lucide="mail" class="w-3 h-3"></i> Email</a>`;
                    }
                }

                // Sender Info Block (Logged-In vs Guest/No Login)
                var senderHeaderHtml = '';
                if (isLogged) {
                    senderHeaderHtml = `
                    <div class="flex items-center gap-3">
                        <img src="${avatarUrl}" class="w-10 h-10 rounded-full object-cover bg-black/50 border border-white/20 shrink-0 shadow-md" onerror="this.src='/logo.png'" />
                        <div class="min-w-0">
                            <div class="flex items-center gap-2 flex-wrap">
                                <h4 class="text-sm font-bold text-white inline-flex items-center leading-tight"><span>${dispName}</span>${isVerified ? (typeof Auth !== 'undefined' ? `<span class="global-verified-badge-container">${Auth.getVerifiedBadgeHTML()}</span>` : '') : ''}</h4>
                                ${!item.isRead ? '<span class="text-[9px] bg-rose-500 text-white font-extrabold px-1.5 py-0.5 rounded-full uppercase">Baru</span>' : ''}
                            </div>
                            <div class="flex items-center gap-2 text-[11px] mt-0.5 flex-wrap">
                                <span class="text-sky-300/90 font-mono font-medium">${sensoredEmail || 'Terautentikasi'}</span>
                                <span class="text-white/30">&bull;</span>
                                <span class="text-white/50 flex items-center gap-1">
                                    <i data-lucide="clock" class="w-3 h-3"></i> ${dateStr}
                                </span>
                            </div>
                        </div>
                    </div>`;
                } else {
                    senderHeaderHtml = `
                    <div class="flex items-center gap-2.5 flex-wrap">
                        <span class="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500/30 to-purple-500/30 text-rose-300 font-bold text-xs flex items-center justify-center shrink-0">
                            <i data-lucide="user" class="w-4 h-4"></i>
                        </span>
                        <div>
                            <h4 class="text-sm font-bold text-white flex items-center gap-2">
                                ${item.name}
                                ${!item.isRead ? '<span class="text-[9px] bg-rose-500 text-white font-extrabold px-1.5 py-0.5 rounded-full uppercase">Baru</span>' : ''}
                            </h4>
                            <span class="text-[11px] text-white/50 flex items-center gap-1">
                                <i data-lucide="clock" class="w-3 h-3"></i> ${dateStr}
                            </span>
                        </div>
                    </div>`;
                }

                html += `
                <div class="p-4 rounded-2xl ${item.isRead ? 'bg-white/[0.02] border-white/5' : 'bg-gradient-to-r from-rose-500/[0.06] to-purple-500/[0.03] border-rose-500/30'} border transition-all flex flex-col gap-3 relative group">
                    <div class="flex items-start justify-between gap-3">
                        ${senderHeaderHtml}

                        <div class="flex items-center gap-1.5 shrink-0">
                            <button onclick="Profile.toggleFeedbackRead('${item.id}', ${!item.isRead})" class="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition active:scale-90" title="${item.isRead ? 'Tandai Belum Dibaca' : 'Tandai Sudah Dibaca'}">
                                <i data-lucide="${item.isRead ? 'mail' : 'mail-check'}" class="w-4 h-4"></i>
                            </button>
                            <button onclick="Profile.deleteFeedback('${item.id}')" class="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition active:scale-90" title="Hapus Pesan">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Isi Pesan -->
                    <div class="bg-black/30 p-3 rounded-xl border border-white/5 text-xs text-white/90 leading-relaxed whitespace-pre-wrap font-sans break-words">${item.message ? item.message.trim() : ''}</div>

                    <!-- Kontak / Info Balasan -->
                    <div class="flex items-center justify-between text-[11px] text-white/60 pt-1 border-t border-white/5">
                        <div class="flex items-center gap-1.5">
                            <i data-lucide="contact" class="w-3.5 h-3.5 text-rose-400"></i>
                            <span>Kontak Balasan: <strong class="text-white">${contact}</strong></span>
                        </div>
                        ${contactAction}
                    </div>
                </div>`;
            });

            if (container) {
                container.innerHTML = html;
                lucide.createIcons();
            }
        } catch (err) {
            if (container) {
                container.innerHTML = `
                <div class="text-center py-12 text-red-400 space-y-2">
                    <i data-lucide="wifi-off" class="w-8 h-8 mx-auto"></i>
                    <p class="text-xs font-semibold">Kesalahan saat menghubungi server.</p>
                </div>`;
                lucide.createIcons();
            }
        }
    },

    // Toggle status dibaca
    async toggleFeedbackRead(id, isRead) {
        var token = Profile.getAdminToken();
        if (!token) return;

        try {
            await fetch('/api/feedback', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-token': token
                },
                body: JSON.stringify({ id: id, isRead: isRead })
            });
            Profile.loadAdminFeedbacks();
        } catch(e) {}
    },

    // Hapus pesan feedback
    async deleteFeedback(id) {
        var token = Profile.getAdminToken();
        if (!token) {
            if (typeof showToast === 'function') showToast('Sesi admin tidak ditemukan');
            return;
        }

        Profile.showConfirmModal({
            title: 'Hapus Pesan Masukan',
            message: 'Apakah Anda yakin ingin menghapus pesan saran/masukan ini dari daftar?',
            confirmText: 'Ya, Hapus Pesan',
            confirmClass: 'bg-red-600 hover:bg-red-700 shadow-red-500/40',
            onConfirm: async function() {
                try {
                    var res = await fetch('/api/feedback', {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-admin-token': token
                        },
                        body: JSON.stringify({ id: id })
                    });
                    var data = await res.json();
                    if (data && data.status) {
                        if (typeof showToast === 'function') {
                            showToast('Pesan berhasil dihapus');
                        }
                        Profile.loadAdminFeedbacks();
                    } else {
                        if (typeof showToast === 'function') {
                            showToast(data?.message || 'Gagal menghapus pesan');
                        }
                    }
                } catch(e) {
                    if (typeof showToast === 'function') {
                        showToast('Terjadi kesalahan koneksi');
                    }
                }
            }
        });
    },

    // Keluar dari sesi admin
    async adminLogout() {
        var token = Profile.getAdminToken();
        if (token) {
            try {
                await fetch('/api/admin-auth', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'logout', token: token })
                });
            } catch (e) {}
        }
        Profile.setAdminToken(null);
        Profile.closeAdminModal();
        if (typeof showToast === 'function') {
            showToast('Telah keluar dari sesi admin');
        }
    },

    // 4. APP VERSION MANAGEMENT TAB
    async renderAdminVersionTab(silent) {
        var container = gid('admin-version-container');
        if (!container) return;

        if (!silent && (!container.innerHTML || container.innerHTML.includes('loader-2'))) {
            container.innerHTML = `
            <div class="text-center py-12 text-white/50 space-y-2">
                <i data-lucide="loader-2" class="w-8 h-8 animate-spin mx-auto text-sky-400"></i>
                <p class="text-xs">Memuat konfigurasi versi aplikasi...</p>
            </div>`;
            lucide.createIcons();
        }

        try {
            var res = await fetch('/api/version');
            var data = await res.json();
            var currentVersion = (data && data.version) ? data.version : (Profile.appVersion || 'v1.0.0');
            var releaseName = (data && data.releaseName) ? data.releaseName : 'MusifyStar Official';
            var description = (data && data.description) ? data.description : 'Nikmati Streaming Musik Dengan Lirik';
            var updatedAt = data && data.updatedAt ? new Date(data.updatedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : 'Baru saja';

            Profile.appVersion = currentVersion;
            Profile.appReleaseName = releaseName;

            var vBadge = gid('admin-version-tab-badge');
            if (vBadge) vBadge.innerText = currentVersion;

            container.innerHTML = `
            <div class="space-y-4">
                <!-- Header Banner -->
                <div class="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-sky-500/15 via-blue-500/10 to-transparent border border-sky-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div class="flex items-center gap-3">
                        <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/25 shrink-0">
                            <i data-lucide="tag" class="w-6 h-6"></i>
                        </div>
                        <div>
                            <div class="flex items-center gap-2">
                                <h3 class="text-base font-black text-white">Pengaturan Versi Aplikasi</h3>
                                <span class="text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold px-2 py-0.5 rounded-full font-mono">
                                    ${currentVersion}
                                </span>
                            </div>
                            <p class="text-xs text-white/60 mt-0.5">Ubah nomor rilis sistem yang tampil di halaman profil dan informasi aplikasi.</p>
                        </div>
                    </div>
                </div>

                <!-- Active Version Live Preview Card -->
                <div class="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between gap-3">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-sky-400 shrink-0">
                            <svg class="w-6 h-6 drop-shadow-md" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" fill="#0284c7"/>
                                <path d="M7.8 12.2L10.8 15.2L16.2 9.2" stroke="white" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <div>
                            <div class="flex items-center gap-2">
                                <span class="text-sm font-bold text-white">MusifyStar</span>
                                <span class="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-lg border border-sky-500/20">${currentVersion}</span>
                            </div>
                            <p class="text-[11px] text-white/50">${releaseName} &bull; Terakhir diubah: ${updatedAt}</p>
                        </div>
                    </div>
                    <span class="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1.5 shrink-0">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Aktif
                    </span>
                </div>

                <!-- Form Edit Versi -->
                <div class="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                    <div id="admin-version-status" class="hidden p-3 rounded-xl text-xs flex items-center gap-2"></div>

                    <form onsubmit="Profile.saveAppVersionConfig(event)" class="space-y-4">
                        <div>
                            <div class="flex items-center justify-between mb-1.5">
                                <label class="block text-xs font-bold text-white/80 uppercase tracking-wider">
                                    Nomor Versi Aplikasi <span class="text-sky-400">*</span>
                                </label>
                                <span class="text-[11px] text-white/40">Contoh: v1.0.1, v1.2.0, v2.0.0</span>
                            </div>
                            <div class="relative">
                                <i data-lucide="hash" class="w-4 h-4 text-white/40 absolute left-3.5 top-3.5"></i>
                                <input type="text" id="admin-version-input" required value="${currentVersion}" placeholder="v1.0.0" class="w-full pl-10 pr-4 py-2.5 bg-black/60 border border-white/15 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-sky-400 transition-all shadow-inner" />
                            </div>
                        </div>

                        <!-- Quick Increment Preset Buttons -->
                        <div>
                            <span class="block text-[11px] font-semibold text-white/60 mb-2">Pintas Naikkan Versi (Quick Increment):</span>
                            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                <button type="button" onclick="Profile.incrementAppVersion('patch')" class="py-2 px-3 rounded-xl bg-white/5 hover:bg-sky-500/20 border border-white/10 hover:border-sky-500/40 text-white/90 hover:text-white font-mono font-semibold transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer">
                                    <i data-lucide="plus" class="w-3.5 h-3.5 text-sky-400"></i> + Patch (+0.0.1)
                                </button>
                                <button type="button" onclick="Profile.incrementAppVersion('minor')" class="py-2 px-3 rounded-xl bg-white/5 hover:bg-sky-500/20 border border-white/10 hover:border-sky-500/40 text-white/90 hover:text-white font-mono font-semibold transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer">
                                    <i data-lucide="plus" class="w-3.5 h-3.5 text-blue-400"></i> + Minor (+0.1.0)
                                </button>
                                <button type="button" onclick="Profile.incrementAppVersion('major')" class="py-2 px-3 rounded-xl bg-white/5 hover:bg-sky-500/20 border border-white/10 hover:border-sky-500/40 text-white/90 hover:text-white font-mono font-semibold transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer">
                                    <i data-lucide="plus" class="w-3.5 h-3.5 text-indigo-400"></i> + Major (+1.0.0)
                                </button>
                                <button type="button" onclick="Profile.incrementAppVersion('reset')" class="py-2 px-3 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/40 text-white/90 hover:text-white font-mono font-semibold transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer">
                                    <i data-lucide="rotate-ccw" class="w-3.5 h-3.5 text-rose-400"></i> Reset v1.0.0
                                </button>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                            <div>
                                <label class="block text-xs font-bold text-white/80 mb-1.5 uppercase tracking-wider">
                                    Nama Rilis / Edisi
                                </label>
                                <input type="text" id="admin-version-release" value="${releaseName}" placeholder="MusifyStar Official" class="w-full px-3.5 py-2.5 bg-black/60 border border-white/15 rounded-xl text-white text-xs focus:outline-none focus:border-sky-400 transition-all shadow-inner" />
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-white/80 mb-1.5 uppercase tracking-wider">
                                    Deskripsi Singkat
                                </label>
                                <input type="text" id="admin-version-desc" value="${description}" placeholder="Nikmati Streaming Musik Dengan Lirik" class="w-full px-3.5 py-2.5 bg-black/60 border border-white/15 rounded-xl text-white text-xs focus:outline-none focus:border-sky-400 transition-all shadow-inner" />
                            </div>
                        </div>

                        <div>
                            <label class="block text-xs font-bold text-white/80 mb-1.5 uppercase tracking-wider">
                                Catatan Pembaruan (Release Notes / Changelog)
                            </label>
                            <textarea id="admin-version-notes" rows="2" placeholder="Tuliskan fitur baru atau perbaikan di versi ini..." class="w-full px-3.5 py-2.5 bg-black/60 border border-white/15 rounded-xl text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-sky-400 transition-all shadow-inner leading-relaxed">${data.releaseNotes || 'Pembaruan stabilitas dan peningkatan fitur aplikasi.'}</textarea>
                        </div>

                        <!-- PWA Auto-Reload Force Switch -->
                        <div class="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-between gap-3">
                            <div class="space-y-0.5">
                                <div class="flex items-center gap-1.5">
                                    <i data-lucide="zap" class="w-4 h-4 text-sky-400"></i>
                                    <span class="text-xs font-bold text-white">Paksa Pembaruan Otomatis ke Seluruh HP Pengguna (Instant Bumper)</span>
                                </div>
                                <p class="text-[11px] text-white/60 leading-relaxed">
                                    Saat disimpan, seluruh HP dan browser pengguna yang sedang membuka aplikasi akan otomatis mengunduh cache Service Worker baru dan me-reload halaman seketika.
                                </p>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer shrink-0">
                                <input type="checkbox" id="admin-version-force-reload" checked class="sr-only peer">
                                <div class="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                            </label>
                        </div>

                        <div class="pt-2 border-t border-white/10 flex items-center justify-end">
                            <button type="submit" id="admin-version-save-btn" class="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 active:scale-95 text-white font-bold text-xs shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer">
                                <i data-lucide="rocket" class="w-4 h-4"></i>
                                <span>🚀 Perbarui Versi & Bump PWA Sekarang</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>`;

            lucide.createIcons();
        } catch (e) {
            container.innerHTML = `
            <div class="text-center py-12 text-red-400 space-y-2">
                <i data-lucide="alert-triangle" class="w-8 h-8 mx-auto"></i>
                <p class="text-xs font-semibold">Gagal memuat konfigurasi versi.</p>
            </div>`;
            lucide.createIcons();
        }
    },

    // Helper increment version
    incrementAppVersion(type) {
        var input = gid('admin-version-input');
        if (!input) return;
        var current = input.value.trim() || Profile.appVersion || 'v1.0.0';
        var hasV = current.startsWith('v') || current.startsWith('V');
        var numStr = current.replace(/^[vV]/, '');
        var parts = numStr.split('.').map(function(n) { return parseInt(n, 10) || 0; });
        while (parts.length < 3) parts.push(0);

        var major = parts[0];
        var minor = parts[1];
        var patch = parts[2];

        if (type === 'patch') {
            patch += 1;
        } else if (type === 'minor') {
            minor += 1;
            patch = 0;
        } else if (type === 'major') {
            major += 1;
            minor = 0;
            patch = 0;
        } else if (type === 'reset') {
            major = 1;
            minor = 0;
            patch = 0;
        }

        var newVer = (hasV ? 'v' : 'v') + major + '.' + minor + '.' + patch;
        input.value = newVer;
        
        input.classList.add('ring-2', 'ring-sky-400');
        setTimeout(function() {
            input.classList.remove('ring-2', 'ring-sky-400');
        }, 300);
    },

    // Simpan versi aplikasi
    async saveAppVersionConfig(event) {
        if (event && event.preventDefault) event.preventDefault();

        var token = Profile.getAdminToken();
        if (!token) return;

        var vInput = gid('admin-version-input');
        var rInput = gid('admin-version-release');
        var dInput = gid('admin-version-desc');
        var nInput = gid('admin-version-notes');
        var forceReloadEl = gid('admin-version-force-reload');
        var statusBox = gid('admin-version-status');
        var saveBtn = gid('admin-version-save-btn');

        var version = (vInput ? vInput.value : '').trim();
        var releaseName = (rInput ? rInput.value : '').trim();
        var description = (dInput ? dInput.value : '').trim();
        var releaseNotes = (nInput ? nInput.value : '').trim();
        var forceReload = forceReloadEl ? forceReloadEl.checked : true;

        if (!version) {
            if (statusBox) {
                statusBox.className = 'p-3 rounded-xl text-xs flex items-center gap-2 bg-red-500/15 border border-red-500/30 text-red-300';
                statusBox.innerHTML = '<i data-lucide="alert-circle" class="w-4 h-4 shrink-0"></i><span>Versi aplikasi tidak boleh kosong.</span>';
                statusBox.classList.remove('hidden');
                lucide.createIcons();
            }
            return;
        }

        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.classList.add('opacity-70');
            saveBtn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Memperbarui & Mem-bump PWA...</span>';
            lucide.createIcons();
        }

        try {
            var res = await fetch('/api/version', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-token': token
                },
                body: JSON.stringify({
                    version: version,
                    releaseName: releaseName,
                    description: description,
                    releaseNotes: releaseNotes,
                    forceReload: forceReload
                })
            });
            var data = await res.json();

            if (data.status) {
                var updatedVer = data.version || version;
                Profile.appVersion = updatedVer;
                window.activeAppVersion = updatedVer;
                Profile.appReleaseName = data.releaseName || releaseName;

                // Update UI Profil dan Badge Tab
                var vEl = gid('profile-app-version');
                if (vEl) vEl.innerText = updatedVer;
                var vBadge = gid('admin-version-tab-badge');
                if (vBadge) vBadge.innerText = updatedVer;

                if (typeof showToast === 'function') {
                    showToast('🚀 Versi PWA berhasil dinaikkan ke ' + updatedVer);
                }

                if (statusBox) {
                    statusBox.className = 'p-3 rounded-xl text-xs flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300';
                    statusBox.innerHTML = '<i data-lucide="check-circle" class="w-4 h-4 shrink-0"></i><span>Versi PWA berhasil dinaikkan ke <strong>' + updatedVer + '</strong>. Cache Service Worker diperbarui dan semua perangkat pengguna otomatis disinkronkan.</span>';
                    statusBox.classList.remove('hidden');
                    lucide.createIcons();
                }

                Profile.renderAdminVersionTab(true);
            } else {
                if (statusBox) {
                    statusBox.className = 'p-3 rounded-xl text-xs flex items-center gap-2 bg-red-500/15 border border-red-500/30 text-red-300';
                    statusBox.innerHTML = '<i data-lucide="alert-circle" class="w-4 h-4 shrink-0"></i><span>' + (data.message || 'Gagal mengubah versi') + '</span>';
                    statusBox.classList.remove('hidden');
                    lucide.createIcons();
                }
            }
        } catch (e) {
            if (statusBox) {
                statusBox.className = 'p-3 rounded-xl text-xs flex items-center gap-2 bg-red-500/15 border border-red-500/30 text-red-300';
                statusBox.innerHTML = '<i data-lucide="wifi-off" class="w-4 h-4 shrink-0"></i><span>Koneksi bermasalah saat menyimpan versi.</span>';
                statusBox.classList.remove('hidden');
                lucide.createIcons();
            }
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.classList.remove('opacity-70');
                saveBtn.innerHTML = '<i data-lucide="check-circle" class="w-4 h-4"></i><span>Simpan & Terapkan Versi</span>';
                lucide.createIcons();
            }
        }
    },

    // ==========================================
    // LOG LOGIN & ATUR SANKSI / BLOKIR TAB SEPARATION
    // ==========================================
    cachedAdminUsers: [],

    formatIpDisplay(ip) {
        if (!ip) return '<span class="font-mono text-sky-300 font-bold">127.0.0.1</span>';
        var clean = String(ip).trim();
        if (clean.startsWith('::ffff:')) {
            clean = clean.replace('::ffff:', '');
        }
        var isIpv6 = clean.includes(':');
        var badgeText = isIpv6 ? 'IPv6 Seluler/ISP' : 'IPv4';
        var badgeBg = isIpv6 ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';

        return `<div class="inline-flex items-center gap-1.5 flex-wrap">
            <span onclick="navigator.clipboard.writeText('${clean}'); if(typeof showToast==='function') showToast('Alamat IP disalin: ${clean}');" title="Klik untuk Salin IP" class="font-mono text-sky-300 font-bold break-all cursor-pointer hover:underline hover:text-sky-200 transition-colors">${clean}</span>
            <span class="text-[9px] px-1.5 py-0.5 rounded ${badgeBg} border font-sans font-semibold shrink-0 cursor-help" title="${isIpv6 ? 'Alamat IPv6 diterbitkan otomatis oleh Operator Seluler / Provider ISP' : 'Alamat IPv4 Format Standar'}">${badgeText}</span>
        </div>`;
    },

    // 1. LOG LOGIN PENGGUNA TAB (TAB 7)
    async loadAdminUsersList() {
        var container = gid('admin-users-container');
        var token = Profile.getAdminToken();
        if (!container || !token) return;

        container.innerHTML = `
        <div class="text-center py-12 text-white/50 space-y-2">
            <i data-lucide="loader-2" class="w-8 h-8 animate-spin mx-auto text-sky-400"></i>
            <p class="text-xs font-semibold">Memuat log login & riwayat IP pengguna...</p>
        </div>`;
        if (window.lucide) lucide.createIcons();

        try {
            var res = await fetch('/api/user-auth?action=admin_get_users', {
                headers: { 'x-admin-token': token }
            });
            var data = await res.json();

            if (!data.status || !Array.isArray(data.users)) {
                container.innerHTML = `
                <div class="text-center py-12 text-red-400 space-y-2">
                    <i data-lucide="alert-triangle" class="w-8 h-8 mx-auto"></i>
                    <p class="text-xs font-semibold">${data.message || 'Gagal memuat data pengguna'}</p>
                </div>`;
                if (window.lucide) lucide.createIcons();
                return;
            }

            var users = data.users;
            Profile.cachedAdminUsers = users;

            if (users.length === 0) {
                container.innerHTML = `
                <div class="p-8 text-center rounded-2xl bg-white/[0.03] border border-white/10 text-white/50 text-xs space-y-2">
                    <i data-lucide="users" class="w-8 h-8 mx-auto text-white/30"></i>
                    <p class="font-bold text-white/80">Belum Ada Pengguna Terdaftar</p>
                    <p class="text-[11px] text-white/40">Setiap pengguna yang mendaftar atau login di aplikasi MusifyStar akan terekam otomatis di sini.</p>
                </div>`;
                if (window.lucide) lucide.createIcons();
                return;
            }

            var html = `
            <div class="space-y-4">
                <!-- Header Info Card -->
                <div class="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-sky-500/10 via-indigo-500/10 to-purple-500/10 border border-sky-500/20 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-300 flex items-center justify-center shrink-0 border border-sky-500/30">
                            <i data-lucide="history" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <h3 class="text-sm sm:text-base font-bold text-white tracking-tight">Log Login & Alamat IP Pengguna</h3>
                            <p class="text-xs text-white/60">Lihat IP Address (IPv4 / IPv6), tanggal pendaftaran, password disensor, dan riwayat login seluruh pengguna</p>
                        </div>
                    </div>
                    <div class="px-3 py-1.5 rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs font-bold shrink-0 self-start sm:self-auto">
                        Total: ${users.length} Pengguna
                    </div>
                </div>

                <!-- Live Search Input Bar -->
                <div class="relative">
                    <i data-lucide="search" class="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
                    <input id="admin-user-search-input" type="text" oninput="Profile.filterAdminUsersList()" placeholder="Cari berdasarkan Username, Email, atau Alamat IP (IPv4 / IPv6)..." class="w-full bg-white/5 border border-white/10 focus:border-sky-500 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none transition-all shadow-inner">
                    <button onclick="var el=gid('admin-user-search-input'); if(el) el.value=''; Profile.filterAdminUsersList();" class="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer" title="Hapus Pencarian">
                        <i data-lucide="x-circle" class="w-4 h-4"></i>
                    </button>
                </div>

                <!-- User Log Cards List Container -->
                <div id="admin-users-cards-list" class="space-y-3">
                    ${Profile.renderUserLogCardsHtml(users)}
                </div>
            </div>`;

            container.innerHTML = html;

            if (window.lucide) lucide.createIcons();
            if (typeof Auth !== 'undefined' && typeof Auth.syncVerifiedBadges === 'function') {
                Auth.syncVerifiedBadges();
            }
        } catch (e) {
            container.innerHTML = `
            <div class="text-center py-12 text-red-400 space-y-2">
                <i data-lucide="wifi-off" class="w-8 h-8 mx-auto"></i>
                <p class="text-xs font-semibold">Terjadi kesalahan saat memuat data pengguna: ${e.message}</p>
            </div>`;
            if (window.lucide) lucide.createIcons();
        }
    },

    renderUserLogCardsHtml(users) {
        if (!users || users.length === 0) return '';

        return users.map(function(u) {
            var regDateFormatted = Profile.formatUserLocalDateTime(u.createdAt);
            var lastLoginFormatted = Profile.formatUserLocalDateTime(u.lastLoginAt);

            var logsCount = (u.loginLogs || []).length;
            var logsHtml = (u.loginLogs || []).map(function(log, idx) {
                return `
                <div class="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] gap-2 flex-wrap">
                    <div class="flex items-center gap-2">
                        <span class="font-mono font-bold text-sky-400">#${idx+1}</span>
                        <div class="bg-black/40 px-2 py-0.5 rounded border border-white/10">
                            ${Profile.formatIpDisplay(log.ip)}
                        </div>
                    </div>
                    <span class="text-white/50 text-[10px]">${Profile.formatUserLocalDateTime(log.timestamp)}</span>
                </div>`;
            }).join('');

            return `
            <div class="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all space-y-4 shadow-lg">
                <!-- User Profile Header -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                    <div class="flex items-center gap-3 min-w-0">
                        <div class="relative w-12 h-12 shrink-0 flex items-center justify-center">
                            <div class="w-10 h-10 rounded-full overflow-hidden bg-black/40 border border-white/15 shadow-md flex items-center justify-center z-0">
                                <img src="${u.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + u.username}" class="w-full h-full object-cover rounded-full" alt="${u.username}">
                            </div>
                            ${u.borderUrl ? `<img src="${u.borderUrl}" class="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[62px] h-[62px] max-w-none object-contain z-10" style="transform: translate(-50%, -50%);" alt="Border">` : ''}
                        </div>
                        <div class="min-w-0">
                            <div class="flex items-center gap-1.5 flex-wrap">
                                <h4 class="text-sm font-bold text-white truncate">${u.username}</h4>
                                <span class="global-verified-badge-container inline-flex items-center"></span>
                                ${(u.isPremium && u.vipTier && u.vipTier !== 'none') ? (
                                    u.vipTier === '1month' ? `<span class="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold text-[9px] flex items-center gap-1"><i data-lucide="crown" class="w-2.5 h-2.5"></i> VIP 1 Bln</span>` :
                                    (u.vipTier === '2months' ? `<span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-[9px] flex items-center gap-1"><i data-lucide="crown" class="w-2.5 h-2.5"></i> VIP 2 Bln</span>` :
                                    (u.vipTier === '5months' ? `<span class="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-[9px] flex items-center gap-1"><i data-lucide="crown" class="w-2.5 h-2.5"></i> VIP 5 Bln</span>` :
                                    `<span class="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black text-[9px] flex items-center gap-0.5 shadow-sm"><i data-lucide="crown" class="w-2.5 h-2.5 fill-black"></i> VIP Permanen</span>`))
                                ) : `<span class="px-2 py-0.5 rounded-full bg-white/5 text-white/40 border border-white/10 text-[9px] font-semibold">Gratis</span>`}
                                ${u.borderName ? `<span class="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-semibold text-[9px] flex items-center gap-0.5"><i data-lucide="shield" class="w-2.5 h-2.5"></i> ${u.borderName}</span>` : ''}
                            </div>
                            <p class="text-xs text-white/60 truncate flex items-center gap-1 mt-0.5">
                                <i data-lucide="mail" class="w-3 h-3 text-sky-400 shrink-0"></i>
                                <span>${u.email}</span>
                            </p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 shrink-0 flex-wrap">
                        <button onclick="Profile.openAdminVipModal('${esJs(u.id)}', '${esJs(u.username)}', '${esJs(u.email)}', '${esJs(u.vipTier || (u.isPremium ? 'permanent' : 'none'))}', '${esJs(u.border || '')}')" class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-500/25 to-amber-400/20 hover:from-amber-500/30 hover:to-yellow-500/30 text-amber-300 border border-amber-400/40 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-sm" title="Kelola Akses VIP & Border Profil">
                            <i data-lucide="crown" class="w-3.5 h-3.5 text-amber-400"></i>
                            <span>Akses VIP / Border</span>
                        </button>
                        <button onclick="Profile.selectUserForBanForm('${esJs(u.username)}', '${esJs(u.email)}', '${esJs(u.lastIp)}', '${esJs(u.id)}')" class="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1 active:scale-95 transition-all cursor-pointer" title="Beri Sanksi / Banned">
                            <i data-lucide="shield-alert" class="w-3.5 h-3.5 text-amber-400"></i>
                            <span>Beri Sanksi</span>
                        </button>
                        <button onclick="Profile.confirmAdminDeleteUser('${esJs(u.id)}', '${esJs(u.username)}', '${esJs(u.email)}')" class="px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 text-xs font-bold flex items-center gap-1 active:scale-95 transition-all cursor-pointer shadow-md" title="Hapus Akun Pengguna Secara Permanen">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5 text-red-400"></i>
                            <span>Hapus Akun</span>
                        </button>
                    </div>
                </div>

                <!-- User Details Grid -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                    <div class="p-2.5 rounded-xl bg-black/30 border border-white/5 space-y-1">
                        <span class="text-[10px] text-white/40 uppercase font-bold tracking-wider block">Alamat IP Terakhir</span>
                        <div class="mt-1">
                            ${Profile.formatIpDisplay(u.lastIp)}
                        </div>
                        <div class="mt-1.5 pt-1.5 border-t border-white/10 text-[11px] font-mono text-amber-300/90 truncate flex items-center gap-1">
                            <i data-lucide="fingerprint" class="w-3 h-3 text-amber-400 shrink-0"></i>
                            <span onclick="navigator.clipboard.writeText('${u.id}'); if(typeof showToast==='function') showToast('ID disalin: ${u.id}');" class="cursor-pointer hover:underline" title="Klik untuk Salin User ID">ID: ${u.id}</span>
                        </div>
                    </div>

                    <div class="p-2.5 rounded-xl bg-black/30 border border-white/5 space-y-0.5">
                        <span class="text-[10px] text-white/40 uppercase font-bold tracking-wider block">Password diSensor</span>
                        <span class="font-mono text-xs font-bold text-amber-300 flex items-center gap-1 mt-1">
                            <i data-lucide="eye-off" class="w-3 h-3 text-amber-400"></i> ${u.maskedPassword || '••••••••'}
                        </span>
                    </div>

                    <div class="p-2.5 rounded-xl bg-black/30 border border-white/5 space-y-0.5">
                        <span class="text-[10px] text-white/40 uppercase font-bold tracking-wider block">Terdaftar Tanggal</span>
                        <span class="text-xs text-white/80 font-medium truncate block mt-1">${regDateFormatted}</span>
                    </div>

                    <div class="p-2.5 rounded-xl bg-black/30 border border-white/5 space-y-0.5">
                        <span class="text-[10px] text-white/40 uppercase font-bold tracking-wider block">Terakhir Login</span>
                        <span class="text-xs text-emerald-300 font-medium truncate block mt-1">${lastLoginFormatted}</span>
                    </div>
                </div>

                <!-- Collapsible Login Logs -->
                <details class="group/logs">
                    <summary class="text-xs font-bold text-white/70 hover:text-white cursor-pointer select-none flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5 transition-colors">
                        <span class="flex items-center gap-1.5">
                            <i data-lucide="history" class="w-3.5 h-3.5 text-sky-400"></i>
                            <span>Riwayat Sesi Login (${logsCount} Sesi Terekam)</span>
                        </span>
                        <i data-lucide="chevron-down" class="w-4 h-4 text-white/40 group-open/logs:rotate-180 transition-transform"></i>
                    </summary>
                    <div class="pt-2 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        ${logsHtml || '<p class="text-[11px] text-white/40 p-2">Belum ada riwayat log login tambahan.</p>'}
                    </div>
                </details>
            </div>`;
        }).join('');
    },

    filterAdminUsersList() {
        var input = gid('admin-user-search-input');
        var query = (input ? input.value : '').trim().toLowerCase();
        var users = Profile.cachedAdminUsers || [];
        var cardsContainer = gid('admin-users-cards-list');
        if (!cardsContainer) return;

        var filtered = users.filter(function(u) {
            if (!query) return true;
            var uname = (u.username || '').toLowerCase();
            var email = (u.email || '').toLowerCase();
            var lastIp = (u.lastIp || '').toLowerCase();
            var logsMatch = (u.loginLogs || []).some(function(l) {
                return (l.ip || '').toLowerCase().includes(query);
            });
            return uname.includes(query) || email.includes(query) || lastIp.includes(query) || logsMatch;
        });

        if (filtered.length === 0) {
            cardsContainer.innerHTML = `
            <div class="p-8 text-center rounded-2xl bg-white/[0.03] border border-white/10 text-white/50 text-xs space-y-2">
                <i data-lucide="search-x" class="w-8 h-8 mx-auto text-white/30"></i>
                <p class="font-bold text-white/80">Pengguna Tidak Ditemukan</p>
                <p class="text-[11px] text-white/40">Tidak ada pengguna yang cocok dengan kata kunci "${query}".</p>
            </div>`;
            if (window.lucide) lucide.createIcons();
            return;
        }

        cardsContainer.innerHTML = Profile.renderUserLogCardsHtml(filtered);
        if (window.lucide) lucide.createIcons();
        if (typeof Auth !== 'undefined' && typeof Auth.syncVerifiedBadges === 'function') {
            Auth.syncVerifiedBadges();
        }
    },

    // 2. ATUR SANKSI & BLOKIR TAB (TAB 8)
    async loadAdminBansList() {
        var container = gid('admin-bans-container');
        var token = Profile.getAdminToken();
        if (!container || !token) return;

        container.innerHTML = `
        <div class="text-center py-12 text-white/50 space-y-2">
            <i data-lucide="loader-2" class="w-8 h-8 animate-spin mx-auto text-rose-400"></i>
            <p class="text-xs font-semibold">Memuat data sanksi & status ban pengguna...</p>
        </div>`;
        if (window.lucide) lucide.createIcons();

        try {
            var res = await fetch('/api/user-auth?action=admin_get_users', {
                headers: { 'x-admin-token': token }
            });
            var data = await res.json();

            if (!data.status || !Array.isArray(data.users)) {
                container.innerHTML = `
                <div class="text-center py-12 text-red-400 space-y-2">
                    <i data-lucide="alert-triangle" class="w-8 h-8 mx-auto"></i>
                    <p class="text-xs font-semibold">${data.message || 'Gagal memuat data sanksi'}</p>
                </div>`;
                if (window.lucide) lucide.createIcons();
                return;
            }

            var users = data.users;
            Profile.cachedAdminUsers = users;

            // Compute counts
            var activeCount = 0;
            var tempBanCount = 0;
            var permBanCount = 0;
            var warnCount = 0;

            users.forEach(function(u) {
                var b = u.banStatus || { isBanned: false, isWarning: false, banType: 'none' };
                if (b.isBanned) {
                    if (u.banType === 'permanent') permBanCount++;
                    else tempBanCount++;
                } else if (b.isWarning || u.banType === 'warning') {
                    warnCount++;
                } else {
                    activeCount++;
                }
            });

            var totalSanctioned = tempBanCount + permBanCount + warnCount;
            var badgeEl = gid('admin-banned-count-badge');
            if (badgeEl) {
                if (totalSanctioned > 0) {
                    badgeEl.innerText = totalSanctioned;
                    badgeEl.classList.remove('hidden');
                } else {
                    badgeEl.classList.add('hidden');
                }
            }

            // Also fetch Banned IPs List
            var bannedIpsList = [];
            try {
                var resIps = await fetch('/api/user-auth?action=admin_get_banned_ips', {
                    headers: { 'x-admin-token': token }
                });
                var dataIps = await resIps.json();
                if (dataIps.status && Array.isArray(dataIps.bannedIps)) {
                    bannedIpsList = dataIps.bannedIps;
                }
            } catch(e){}

            // Build Banned IPs Cards HTML
            var ipListHtml = '';
            if (bannedIpsList.length === 0) {
                ipListHtml = `<div class="p-4 text-center rounded-2xl bg-white/[0.02] border border-white/5 text-white/40 text-xs">Belum ada Alamat IP yang masuk dalam daftar hitam blacklist IP khusus</div>`;
            } else {
                ipListHtml = bannedIpsList.map(function(item) {
                    var expText = item.banExpiresAt ? new Date(item.banExpiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Permanen';
                    return `
                    <div class="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-between gap-3 text-xs shadow-lg">
                        <div class="space-y-1">
                            <div class="font-mono font-bold text-red-200 flex items-center gap-2 flex-wrap">
                                <i data-lucide="wifi-off" class="w-4 h-4 text-red-400"></i>
                                <span class="text-sm">${item.ip}</span>
                                <span class="text-[9px] px-2 py-0.5 rounded-full bg-red-500/30 border border-red-500/50 text-red-200 uppercase font-sans font-black">${item.banType === 'permanent' ? 'Blacklist Permanen' : 'DiBlacklist'}</span>
                            </div>
                            <p class="text-[11px] text-white/80 font-medium">${item.banReason}</p>
                            <span class="text-[10px] text-white/40 font-mono block">Masa Berlaku: ${expText} ${item.banDurationText ? '(' + item.banDurationText + ')' : ''}</span>
                        </div>
                        <button onclick="Profile.quickUnbanIp('${item.ip}')" class="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 shrink-0 active:scale-95 transition-all cursor-pointer shadow-md">
                            <i data-lucide="unlock" class="w-3.5 h-3.5 text-emerald-400"></i>
                            <span>Buka IP</span>
                        </button>
                    </div>`;
                }).join('');
            }

            var html = `
            <div class="space-y-5">
                <!-- Header Info Card -->
                <div class="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-rose-500/10 via-amber-500/10 to-purple-500/10 border border-rose-500/20 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center shrink-0 border border-rose-500/30">
                            <i data-lucide="shield-alert" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <h3 class="text-sm sm:text-base font-bold text-white tracking-tight">Form Atur Sanksi & Ban Pengguna</h3>
                            <p class="text-xs text-white/60">Pengelolaan Ban Akun (Username/Email/ID) dan Ban IP Address (Blacklist Jaringan) secara terpisah</p>
                        </div>
                    </div>
                    <div class="px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold shrink-0 self-start sm:self-auto flex items-center gap-1.5">
                        <i data-lucide="shield" class="w-3.5 h-3.5"></i>
                        <span>${totalSanctioned} Dalam Sanksi</span>
                    </div>
                </div>

                <!-- Stats Counters Pills -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div class="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                        <div>
                            <span class="text-[10px] text-white/50 block font-medium">Aktif Bebas Sanksi</span>
                            <span class="text-base font-black text-emerald-400">${activeCount}</span>
                        </div>
                        <i data-lucide="check-circle-2" class="w-5 h-5 text-emerald-400/50"></i>
                    </div>

                    <div class="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                        <div>
                            <span class="text-[10px] text-white/50 block font-medium">Banned</span>
                            <span class="text-base font-black text-amber-400">${tempBanCount}</span>
                        </div>
                        <i data-lucide="clock" class="w-5 h-5 text-amber-400/50"></i>
                    </div>

                    <div class="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                        <div>
                            <span class="text-[10px] text-white/50 block font-medium">Banned Permanen</span>
                            <span class="text-base font-black text-rose-400">${permBanCount}</span>
                        </div>
                        <i data-lucide="ban" class="w-5 h-5 text-rose-400/50"></i>
                    </div>

                    <div class="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                        <div>
                            <span class="text-[10px] text-white/50 block font-medium">Blacklist IP Aktif</span>
                            <span class="text-base font-black text-red-400">${bannedIpsList.length}</span>
                        </div>
                        <i data-lucide="wifi-off" class="w-5 h-5 text-red-400/50"></i>
                    </div>
                </div>

                <!-- MAIN FORM CONTAINER -->
                <div class="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-4 shadow-xl">
                    <div class="border-b border-white/10 pb-2">
                        <h4 class="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                            <i data-lucide="user-check" class="w-4 h-4"></i>
                            <span>1. Target Pengguna Atau IP Address (Isi Salah Satu Saja)</span>
                        </h4>
                        <p class="text-[11px] text-white/50 mt-0.5">Isi User ID / Username / Email untuk Ban Akun spesifik. Isi Alamat IP saja untuk Blacklist IP Jaringan terpisah.</p>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        <!-- Field 0: User ID -->
                        <div class="space-y-1">
                            <label class="text-xs font-bold text-white/80 flex items-center gap-1">
                                <i data-lucide="fingerprint" class="w-3.5 h-3.5 text-amber-400"></i> User ID
                            </label>
                            <input id="admin-ban-form-userid" type="text" oninput="Profile.onBanFormInput('userid')" placeholder="Contoh: u_172..." class="w-full bg-white/5 border border-white/10 focus:border-amber-500 rounded-xl px-3 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none transition-all font-mono">
                        </div>

                        <!-- Field 1: Username -->
                        <div class="space-y-1">
                            <label class="text-xs font-bold text-white/80 flex items-center gap-1">
                                <i data-lucide="user" class="w-3.5 h-3.5 text-sky-400"></i> Username
                            </label>
                            <input id="admin-ban-form-username" type="text" oninput="Profile.onBanFormInput('username')" placeholder="Contoh: nabil" class="w-full bg-white/5 border border-white/10 focus:border-sky-500 rounded-xl px-3 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none transition-all">
                        </div>

                        <!-- Field 2: Email -->
                        <div class="space-y-1">
                            <label class="text-xs font-bold text-white/80 flex items-center gap-1">
                                <i data-lucide="mail" class="w-3.5 h-3.5 text-purple-400"></i> Email
                            </label>
                            <input id="admin-ban-form-email" type="email" oninput="Profile.onBanFormInput('email')" placeholder="Contoh: nabil@gmail.com" class="w-full bg-white/5 border border-white/10 focus:border-purple-500 rounded-xl px-3 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none transition-all">
                        </div>

                        <!-- Field 3: IP Address -->
                        <div class="space-y-1">
                            <label class="text-xs font-bold text-white/80 flex items-center gap-1">
                                <i data-lucide="globe" class="w-3.5 h-3.5 text-red-400"></i> Alamat IP Jaringan
                            </label>
                            <input id="admin-ban-form-ip" type="text" oninput="Profile.onBanFormInput('ip')" placeholder="Contoh: 114.10... / 2402:..." class="w-full bg-white/5 border border-white/10 focus:border-red-500 rounded-xl px-3 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none transition-all font-mono">
                        </div>
                    </div>

                    <!-- Helper Active Target Status Bar -->
                    <div id="admin-ban-form-target-status" class="hidden text-[11px] p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 font-semibold flex items-center gap-2">
                        <i data-lucide="info" class="w-4 h-4 shrink-0"></i>
                        <span id="admin-ban-form-target-status-text">Target dipilih.</span>
                    </div>

                    <div class="border-t border-white/10 pt-3 space-y-4">
                        <h4 class="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                            <i data-lucide="shield-alert" class="w-4 h-4"></i>
                            <span>2. Atur Jenis Sanksi & Pesan Alasan</span>
                        </h4>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <!-- Jenis Sanksi Select -->
                            <div class="space-y-1.5">
                                <label class="text-xs font-bold text-white/80">Pilih Jenis Sanksi / Status Akun</label>
                                <select id="admin-ban-form-type" onchange="Profile.toggleBanFormDurationInput()" class="w-full bg-black/60 border border-white/15 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all cursor-pointer font-medium">
                                    <option value="none">Buka Banned</option>
                                    <option value="permanent" selected>Banned Permanen</option>
                                    <option value="temporary">Banned Durasi Waktu</option>
                                    <option value="warning">Peringatan Saja</option>
                                </select>
                            </div>

                            <!-- Durasi Blokir Sementara Select -->
                            <div id="admin-ban-form-duration-container" class="space-y-1.5 hidden">
                                <label class="text-xs font-bold text-white/80">Pilih Durasi Banned</label>
                                <select id="admin-ban-form-duration" class="w-full bg-black/60 border border-white/15 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all cursor-pointer font-medium">
                                    <option value="1">1Hari 24Jam</option>
                                    <option value="5" selected>5Hari</option>
                                    <option value="7">7Hari</option>
                                    <option value="10">10Hari</option>
                                    <option value="20">20Hari</option>
                                    <option value="30">1Bulan 30Hari</option>
                                    <option value="60">2Bulan 60Hari</option>
                                    <option value="365">1Tahun 365Hari</option>
                                    <option value="730">2Tahun 730Hari</option>
                                    <option value="1095">3Tahun 1095Hari</option>
                                    <option value="1460">4Tahun 1460Hari</option>
                                    <option value="1825">5Tahun 1825Hari</option>
                                    <option value="3650">10Tahun 3650Hari</option>
                                    <option value="10950">30Tahun 10950Hari</option>
                                    <option value="14600">40Tahun 14600Hari</option>
                                    <option value="18250">50Tahun 18250Hari</option>
                                    <option value="32850">90Tahun 32850Hari</option>
                                    <option value="36500">100Tahun 36500Hari</option>
                                </select>
                            </div>
                        </div>

                        <!-- Teks Pesan Peringatan / Alasan Blokir -->
                        <div class="space-y-1.5">
                            <label class="text-xs font-bold text-white/80">Teks Pesan Peringatan / Alasan Banned Ditampilkan ke Pengguna</label>
                            <textarea id="admin-ban-form-reason" rows="3" placeholder="Tulis alasan atau pesan peringatan yang akan muncul di layar pengguna (misal: Akun/IP Anda dibanned karena pelanggaran ketentuan)..." class="w-full bg-black/60 border border-white/15 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none transition-all leading-relaxed font-sans">Akun atau Alamat IP Anda telah dibanned oleh administrator karena adanya pelanggaran ketentuan.</textarea>
                        </div>

                        <!-- Action Buttons -->
                        <div class="flex flex-col sm:flex-row gap-2 pt-2">
                            <button id="admin-submit-ban-btn" onclick="Profile.submitBanForm(false)" class="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 active:scale-95 transition-all cursor-pointer">
                                <i data-lucide="shield-alert" class="w-4 h-4"></i>
                                <span>Terapkan Sanksi Banned</span>
                            </button>

                            <button id="admin-submit-unban-btn" onclick="Profile.submitBanForm(true)" class="py-3 px-4 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer">
                                <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-400"></i>
                                <span>Buka Banned / Unban Target</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- SECTION 2: BLACKLIST IP ADDRESS LIST -->
                <div class="p-5 rounded-2xl bg-black/40 border border-red-500/20 space-y-3.5 shadow-xl">
                    <div class="flex items-center justify-between border-b border-white/10 pb-2.5">
                        <h4 class="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-2">
                            <i data-lucide="wifi-off" class="w-4 h-4"></i>
                            <span>Daftar Blacklist IP Address (${bannedIpsList.length})</span>
                        </h4>
                        <span class="text-[10px] text-white/40">Sistem memblokir jaringan dari IP ini</span>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        ${ipListHtml}
                    </div>
                </div>

                <!-- SECTION 3: USERS LIST & SEARCH -->
                <div class="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3.5 shadow-xl">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                        <h4 class="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-2">
                            <i data-lucide="users" class="w-4 h-4"></i>
                            <span>Daftar Akun Pengguna & Status Sanksi (${users.length})</span>
                        </h4>
                        <div class="relative w-full sm:w-64">
                            <i data-lucide="search" class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40"></i>
                            <input id="admin-ban-search-input" type="text" oninput="Profile.filterAdminBansList()" placeholder="Cari username, email, IP..." class="w-full bg-white/5 border border-white/10 focus:border-sky-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none transition-all">
                        </div>
                    </div>

                    <div id="admin-bans-cards-list" class="space-y-3">
                        ${Profile.renderUserBanCardsHtml(users)}
                    </div>
                </div>
            </div>`;

            container.innerHTML = html;

            if (window.lucide) lucide.createIcons();
            if (typeof Auth !== 'undefined' && typeof Auth.syncVerifiedBadges === 'function') {
                Auth.syncVerifiedBadges();
            }
        } catch (e) {
            container.innerHTML = `
            <div class="text-center py-12 text-red-400 space-y-2">
                <i data-lucide="wifi-off" class="w-8 h-8 mx-auto"></i>
                <p class="text-xs font-semibold">Terjadi kesalahan saat memuat data sanksi: ${e.message}</p>
            </div>`;
            if (window.lucide) lucide.createIcons();
        }
    },

    onBanFormInput(type) {
        var idEl = gid('admin-ban-form-userid');
        var uEl = gid('admin-ban-form-username');
        var eEl = gid('admin-ban-form-email');
        var ipEl = gid('admin-ban-form-ip');
        var statusBox = gid('admin-ban-form-target-status');
        var statusText = gid('admin-ban-form-target-status-text');

        if (type === 'userid') {
            var idVal = idEl ? idEl.value.trim() : '';
            if (idVal) {
                if (uEl) uEl.value = '';
                if (eEl) eEl.value = '';
                if (ipEl) ipEl.value = '';
                if (statusBox && statusText) {
                    statusText.innerText = '✓ Target User ID terisi: "' + idVal + '" Username, Email & IP tidak perlu diisi';
                    statusBox.classList.remove('hidden');
                }
            } else {
                if (statusBox) statusBox.classList.add('hidden');
            }
        } else if (type === 'username') {
            var uVal = uEl ? uEl.value.trim() : '';
            if (uVal) {
                if (idEl) idEl.value = '';
                if (eEl) eEl.value = '';
                if (ipEl) ipEl.value = '';
                if (statusBox && statusText) {
                    statusText.innerText = '✓ Target Username terisi: "@' + uVal + '" User ID, Email & IP tidak perlu diisi';
                    statusBox.classList.remove('hidden');
                }
            } else {
                if (statusBox) statusBox.classList.add('hidden');
            }
        } else if (type === 'email') {
            var eVal = eEl ? eEl.value.trim() : '';
            if (eVal) {
                if (idEl) idEl.value = '';
                if (uEl) uEl.value = '';
                if (ipEl) ipEl.value = '';
                if (statusBox && statusText) {
                    statusText.innerText = '✓ Target Email terisi: "' + eVal + '" User ID, Username & IP tidak perlu diisi';
                    statusBox.classList.remove('hidden');
                }
            } else {
                if (statusBox) statusBox.classList.add('hidden');
            }
        } else if (type === 'ip') {
            var ipVal = ipEl ? ipEl.value.trim() : '';
            if (ipVal) {
                if (idEl) idEl.value = '';
                if (uEl) uEl.value = '';
                if (eEl) eEl.value = '';
                if (statusBox && statusText) {
                    statusText.innerText = '✓ Target Alamat IP terisi: "' + ipVal + '" User ID, Username & Email tidak perlu diisi';
                    statusBox.classList.remove('hidden');
                }
            } else {
                if (statusBox) statusBox.classList.add('hidden');
            }
        }
    },

    selectUserForBanForm(username, email, lastIp, id) {
        var idEl = gid('admin-ban-form-userid');
        var uEl = gid('admin-ban-form-username');
        var eEl = gid('admin-ban-form-email');
        var ipEl = gid('admin-ban-form-ip');

        if (idEl) idEl.value = id || '';
        if (uEl) uEl.value = '';
        if (eEl) eEl.value = '';
        if (ipEl) ipEl.value = '';

        Profile.onBanFormInput('userid');

        if (idEl) {
            idEl.focus();
            idEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    },

    selectIpForBanForm(ip) {
        var idEl = gid('admin-ban-form-userid');
        var uEl = gid('admin-ban-form-username');
        var eEl = gid('admin-ban-form-email');
        var ipEl = gid('admin-ban-form-ip');

        if (idEl) idEl.value = '';
        if (uEl) uEl.value = '';
        if (eEl) eEl.value = '';
        if (ipEl) ipEl.value = ip || '';

        Profile.onBanFormInput('ip');

        if (ipEl) {
            ipEl.focus();
            ipEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    },

    showConfirmModal(options) {
        var existing = gid('profile-custom-confirm-modal');
        if (existing) existing.remove();

        var title = options.title || 'Konfirmasi Terapkan Sanksi';
        var message = options.message || 'Apakah Anda yakin ingin melanjutkan aksi ini?';
        var confirmText = options.confirmText || 'Ya, Lanjutkan';
        var confirmClass = options.confirmClass || 'bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600';
        var onConfirm = options.onConfirm;

        var modal = document.createElement('div');
        modal.id = 'profile-custom-confirm-modal';
        modal.className = 'fixed inset-0 z-[2000000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn pointer-events-auto';
        modal.innerHTML = `
            <div class="bg-[#12141c]/95 border border-white/20 rounded-3xl p-5 sm:p-6 max-w-sm w-full text-center space-y-4 shadow-2xl shadow-black/90 transform scale-100 transition-all">
                <div class="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center mx-auto">
                    <i data-lucide="shield-alert" class="w-6 h-6"></i>
                </div>
                <div class="space-y-1.5">
                    <h3 class="text-sm sm:text-base font-bold text-white tracking-tight">${title}</h3>
                    <p class="text-xs text-white/70 leading-relaxed font-medium">${message}</p>
                </div>
                <div class="flex items-center gap-2 pt-2">
                    <button onclick="gid('profile-custom-confirm-modal')?.remove()" class="flex-1 py-3 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 font-bold text-xs border border-white/10 active:scale-95 transition-all cursor-pointer">
                        Batal
                    </button>
                    <button id="profile-modal-confirm-btn" class="flex-1 py-3 px-3 rounded-xl ${confirmClass} text-white font-bold text-xs active:scale-95 transition-all cursor-pointer shadow-lg">
                        ${confirmText}
                    </button>
                </div>
            </div>
        `;

        modal.onclick = function(e) {
            if (e.target === modal) modal.remove();
        };

        document.body.appendChild(modal);
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            try { window.lucide.createIcons(); } catch(e){}
        }

        var btn = gid('profile-modal-confirm-btn');
        if (btn) {
            btn.onclick = async function() {
                btn.disabled = true;
                btn.classList.add('opacity-70');
                try {
                    if (typeof onConfirm === 'function') {
                        await onConfirm();
                    }
                } finally {
                    modal.remove();
                }
            };
        }
    },

    async quickBanUserIp(targetIp, username) {
        var token = Profile.getAdminToken();
        if (!token) {
            if (typeof showToast === 'function') showToast('Sesi admin tidak ditemukan. Silakan login admin kembali.');
            return;
        }

        var cleanIp = (targetIp || '').trim();

        if (!cleanIp || cleanIp.includes('***')) {
            Profile.selectIpForBanForm(cleanIp);
            if (typeof showToast === 'function') showToast('Alamat IP tersensor. Silakan masukkan IP penuh di Form!');
            return;
        }

        Profile.showConfirmModal({
            title: 'Blacklist Alamat IP',
            message: 'Apakah Anda yakin ingin memasukkan Alamat IP "' + cleanIp + '" (Pengguna: @' + username + ') ke dalam Blacklist IP?',
            confirmText: 'Ya, Blacklist IP',
            confirmClass: 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/30',
            onConfirm: async function() {
                try {
                    var res = await fetch('/api/user-auth?action=admin_ban_ip', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-admin-token': token
                        },
                        body: JSON.stringify({
                            targetIp: cleanIp,
                            banType: 'permanent',
                            banReason: 'Alamat IP Anda telah dimasukkan ke dalam daftar hitam (blacklist) oleh admin.'
                        })
                    });
                    var data = await res.json();
                    if (data.status) {
                        if (typeof showToast === 'function') {
                            showToast(data.message || 'IP ' + cleanIp + ' berhasil di-blacklist!');
                        }
                        Profile.loadAdminBansList();
                        Profile.loadAdminUsersList();
                    } else {
                        if (typeof showToast === 'function') {
                            showToast(data.message || 'Gagal mem-blacklist IP');
                        }
                    }
                } catch(e) {
                    if (typeof showToast === 'function') {
                        showToast('Terjadi kesalahan koneksi');
                    }
                }
            }
        });
    },

    confirmAdminDeleteUser(userId, username, email) {
        var token = Profile.getAdminToken();
        if (!token) {
            if (typeof showToast === 'function') showToast('Sesi admin tidak ditemukan. Silakan login kembali.');
            return;
        }
        Profile.showConfirmModal({
            title: 'Hapus Akun Pengguna Permanen',
            message: 'Apakah Anda yakin ingin MENGHAPUS PERMANEN akun @' + (username || '') + (email ? ' (' + email + ')' : '') + '? Akun beserta status sanksi/banned-nya akan langsung dihapus selamanya dari sistem database.',
            confirmText: 'Ya, Hapus Permanen',
            confirmClass: 'bg-red-600 hover:bg-red-700 shadow-red-500/40',
            onConfirm: async function() {
                await Profile.executeAdminDeleteUser(userId, username, email);
            }
        });
    },

    async executeAdminDeleteUser(userId, username, email) {
        var token = Profile.getAdminToken();
        if (!token) {
            if (typeof showToast === 'function') showToast('Sesi admin tidak ditemukan. Silakan login kembali.');
            return;
        }
        try {
            var res = await fetch('/api/user-auth?action=admin_delete_user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-token': token
                },
                body: JSON.stringify({
                    targetId: userId,
                    userId: userId,
                    id: userId,
                    username: username,
                    email: email
                })
            });
            var data = await res.json();
            if (data && data.status) {
                if (typeof showToast === 'function') {
                    showToast(data.message || 'Akun @' + (username || '') + ' berhasil dihapus permanen');
                }
                gid('admin-ban-config-modal')?.remove();
                Profile.loadAdminUsersList();
                Profile.loadAdminBansList();
            } else {
                if (typeof showToast === 'function') {
                    showToast(data?.message || 'Gagal menghapus akun pengguna');
                }
            }
        } catch (err) {
            if (typeof showToast === 'function') {
                showToast('Terjadi kesalahan jaringan saat menghapus pengguna');
            }
        }
    },

    openAdminVipModal(userId, username, email, currentTier, currentBorder) {
        var token = Profile.getAdminToken();
        if (!token) {
            if (typeof showToast === 'function') showToast('Sesi admin tidak ditemukan. Silakan login kembali.');
            return;
        }

        var existing = gid('admin-vip-access-modal');
        if (existing) existing.remove();

        currentTier = String(currentTier || 'none').toLowerCase();
        currentBorder = String(currentBorder || '').trim();

        var modal = document.createElement('div');
        modal.id = 'admin-vip-access-modal';
        modal.className = 'fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn';
        modal.innerHTML = `
            <div class="w-full max-w-lg bg-[#0f1219] border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-[0_0_50px_rgba(245,158,11,0.2)] text-white space-y-5 max-h-[90vh] overflow-y-auto hide-scrollbar">
                <!-- Header -->
                <div class="flex items-center justify-between pb-3 border-b border-white/10">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-yellow-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center shrink-0 shadow-inner">
                            <i data-lucide="crown" class="w-5 h-5 text-amber-400"></i>
                        </div>
                        <div>
                            <h3 class="text-base font-black text-white tracking-tight flex items-center gap-1.5">
                                <span>Kelola Akses VIP & Border</span>
                                <span class="text-[9px] px-2 py-0.5 rounded-full font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">Admin Control</span>
                            </h3>
                            <p class="text-xs text-white/50">Atur paket langganan dan hak penggunaan border untuk user</p>
                        </div>
                    </div>
                    <button onclick="gid('admin-vip-access-modal')?.remove()" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer">
                        <i data-lucide="x" class="w-4 h-4"></i>
                    </button>
                </div>

                <!-- Target User Info -->
                <div class="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-3">
                    <div class="min-w-0">
                        <span class="text-[10px] uppercase tracking-wider text-white/40 font-bold block">Target Pengguna</span>
                        <h4 class="text-sm font-extrabold text-white truncate flex items-center gap-1.5 mt-0.5">
                            <span>@${Profile.escapeHtml(username)}</span>
                            <span class="text-[10px] font-normal text-white/50">(${Profile.escapeHtml(email)})</span>
                        </h4>
                    </div>
                    <div class="text-right shrink-0">
                        <span class="text-[10px] uppercase tracking-wider text-white/40 font-bold block">Status Saat Ini</span>
                        <span class="text-xs font-bold ${currentTier !== 'none' ? 'text-amber-300' : 'text-white/50'}">
                            ${currentTier === '1month' ? 'VIP 1 Bulan' : (currentTier === '2months' ? 'VIP 2 Bulan' : (currentTier === '5months' ? 'VIP 5 Bulan' : (currentTier === 'permanent' ? 'VIP Permanen' : 'Gratis (Non-VIP)')))}
                        </span>
                    </div>
                </div>

                <!-- Form Pilihan Paket VIP & Trial (Bisa Pilihan Dropdown & Ketikan) -->
                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <label class="text-xs font-bold text-white/90">2. Paket VIP / Durasi:</label>
                        <span class="text-[10px] text-amber-300 font-semibold">Bisa dropdown & bisa ketik hari</span>
                    </div>

                    <!-- Pilihan Dropdown Sesuai Foto Kedua -->
                    <div class="space-y-1.5">
                        <label class="text-[11px] font-bold text-amber-300/90 block">Pilihan Paket & Durasi (Dropdown):</label>
                        <select id="admin-vip-tier-select" 
                                onchange="var v=this.value; var inp=gid('admin-vip-custom-days'); if(v==='1month'&&inp) inp.value=30; else if(v==='2months'&&inp) inp.value=60; else if(v==='5months'&&inp) inp.value=150; else if(v==='permanent'&&inp) inp.value=0; else if(v==='trial_1d'&&inp) inp.value=1; else if(v==='trial_3d'&&inp) inp.value=3; else if(v==='trial_7d'&&inp) inp.value=7; else if(v==='trial_14d'&&inp) inp.value=14; else if(v==='none'&&inp) inp.value='';" 
                                class="w-full text-xs sm:text-sm py-2.5 px-3.5 bg-black/80 border border-white/20 focus:border-amber-400 rounded-xl text-white font-medium focus:outline-none transition-colors cursor-pointer">
                            <option value="1month" ${currentTier === '1month' ? 'selected' : ''}>VIP 1 Bulan (30 Hari) • Platinum & Master</option>
                            <option value="2months" ${currentTier === '2months' ? 'selected' : ''}>VIP 2 Bulan (60 Hari) • Platinum, Master & Legend</option>
                            <option value="5months" ${currentTier === '5months' ? 'selected' : ''}>VIP 5 Bulan (150 Hari) • Semua Border Tier</option>
                            <option value="permanent" ${currentTier === 'permanent' ? 'selected' : ''}>VIP Permanen (Selamanya) • Bebas Semua Border</option>
                            <option value="trial_1d">Trial 1 Hari • Platinum</option>
                            <option value="trial_3d">Trial 3 Hari • Platinum</option>
                            <option value="trial_7d">Trial 7 Hari (1 Minggu) • Platinum</option>
                            <option value="trial_14d">Trial 14 Hari (2 Minggu) • Platinum</option>
                            <option value="custom">Ketik Durasi Hari Sendiri</option>
                            <option value="none" ${currentTier === 'none' ? 'selected' : ''}>Nonaktifkan VIP (Akun Biasa / Free)</option>
                        </select>
                    </div>

                    <!-- KOLOM KETIKAN DURASI LANGSUNG (BISA KETIKAN HARI) -->
                    <div class="p-3 rounded-2xl bg-black/40 border border-white/10 space-y-1.5">
                        <label class="text-xs font-bold text-white/90 flex items-center justify-between">
                            <span class="flex items-center gap-1.5">
                                <i data-lucide="edit-3" class="w-3.5 h-3.5 text-amber-400"></i>
                                <span>Ketik Durasi Hari Langsung (Bisa Ketikan):</span>
                            </span>
                            <span class="text-[10px] text-white/40">Ketik angka hari apa saja</span>
                        </label>
                        <div class="flex items-center gap-2">
                            <input type="number" 
                                   id="admin-vip-custom-days" 
                                   min="0" 
                                   value="${currentTier === '1month' ? '30' : (currentTier === '2months' ? '60' : (currentTier === '5months' ? '150' : (currentTier === 'permanent' ? '0' : '30')))}" 
                                   placeholder="Contoh: 7, 30, 90, 365, atau 0 untuk Permanen" 
                                   oninput="var n=parseInt(this.value,10); var sel=gid('admin-vip-tier-select'); if(sel){ if(n===0) sel.value='permanent'; else if(n===30) sel.value='1month'; else if(n===60) sel.value='2months'; else if(n===150) sel.value='5months'; else if(n===1) sel.value='trial_1d'; else if(n===3) sel.value='trial_3d'; else if(n===7) sel.value='trial_7d'; else if(n===14) sel.value='trial_14d'; else sel.value='custom'; }"
                                   class="flex-1 py-2 px-3.5 bg-black/80 border border-white/20 focus:border-amber-400 rounded-xl text-white font-mono font-bold text-xs focus:outline-none transition-colors" />
                            <span class="text-xs text-white/60 font-bold shrink-0">Hari (0 = Permanen)</span>
                        </div>
                    </div>
                </div>

                <!-- Pilihan Pasang Border Langsung -->
                <div class="space-y-2 pt-1 border-t border-white/10">
                    <label class="text-xs font-bold text-white/80 block flex items-center justify-between">
                        <span>Pasang Border Langsung ke Profil (Opsional):</span>
                        <span class="text-[10px] text-white/40">Sesuai hak tier yang dipilih</span>
                    </label>
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        <label class="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex items-center gap-2 cursor-pointer has-[:checked]:border-amber-400 has-[:checked]:bg-amber-400/10">
                            <input type="radio" name="admin_vip_border_radio" value="keep" checked class="w-3.5 h-3.5 accent-amber-400 cursor-pointer">
                            <span class="text-[11px] font-semibold text-white/80">Biarkan Tetap</span>
                        </label>
                        <label class="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex items-center gap-2 cursor-pointer has-[:checked]:border-sky-400 has-[:checked]:bg-sky-400/10">
                            <input type="radio" name="admin_vip_border_radio" value="border_platinum" ${currentBorder === 'border_platinum' ? 'checked' : ''} class="w-3.5 h-3.5 accent-sky-400 cursor-pointer">
                            <span class="text-[11px] font-semibold text-sky-300">Platinum</span>
                        </label>
                        <label class="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex items-center gap-2 cursor-pointer has-[:checked]:border-orange-400 has-[:checked]:bg-orange-400/10">
                            <input type="radio" name="admin_vip_border_radio" value="border_master" ${currentBorder === 'border_master' ? 'checked' : ''} class="w-3.5 h-3.5 accent-orange-400 cursor-pointer">
                            <span class="text-[11px] font-semibold text-orange-300">Master</span>
                        </label>
                        <label class="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex items-center gap-2 cursor-pointer has-[:checked]:border-yellow-400 has-[:checked]:bg-yellow-400/10">
                            <input type="radio" name="admin_vip_border_radio" value="border_legend" ${currentBorder === 'border_legend' ? 'checked' : ''} class="w-3.5 h-3.5 accent-yellow-400 cursor-pointer">
                            <span class="text-[11px] font-semibold text-yellow-300">Legend</span>
                        </label>
                        <label class="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex items-center gap-2 cursor-pointer has-[:checked]:border-pink-400 has-[:checked]:bg-pink-400/10">
                            <input type="radio" name="admin_vip_border_radio" value="border_immortal" ${currentBorder === 'border_immortal' ? 'checked' : ''} class="w-3.5 h-3.5 accent-pink-400 cursor-pointer">
                            <span class="text-[11px] font-semibold text-pink-300">Immortal</span>
                        </label>
                        <label class="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex items-center gap-2 cursor-pointer has-[:checked]:border-rose-400 has-[:checked]:bg-rose-400/10">
                            <input type="radio" name="admin_vip_border_radio" value="none" ${(!currentBorder || currentBorder === 'none') ? 'checked' : ''} class="w-3.5 h-3.5 accent-rose-400 cursor-pointer">
                            <span class="text-[11px] font-semibold text-white/50">Lepas Border</span>
                        </label>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
                    <button type="button" onclick="gid('admin-vip-access-modal')?.remove()" class="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer">
                        Batal
                    </button>
                    <button id="admin-vip-submit-btn" type="button" onclick="Profile.submitAdminVipModal('${esJs(userId)}', '${esJs(username)}', '${esJs(email)}')" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-500 text-black text-xs font-black flex items-center gap-2 active:scale-95 transition-all cursor-pointer shadow-[0_0_25px_rgba(245,158,11,0.35)]">
                        <i data-lucide="check" class="w-4 h-4 stroke-[3]"></i>
                        <span>Simpan Akses VIP</span>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        if (window.lucide) lucide.createIcons();
    },

    async submitAdminVipModal(userId, username, email) {
        var token = Profile.getAdminToken();
        if (!token) {
            if (typeof showToast === 'function') showToast('Sesi admin tidak ditemukan. Silakan login kembali.');
            return;
        }

        var selectEl = gid('admin-vip-tier-select');
        var selectedTier = selectEl ? selectEl.value : (document.querySelector('input[name="admin_vip_tier_radio"]:checked')?.value || 'none');
        var selectedBorderOpt = document.querySelector('input[name="admin_vip_border_radio"]:checked')?.value || 'keep';
        var customDaysInput = gid('admin-vip-custom-days');
        var customDays = customDaysInput ? parseInt(customDaysInput.value, 10) : NaN;

        var finalTier = selectedTier;
        var durationDays = null;
        if (selectedTier === 'trial_1d') { finalTier = '1month'; durationDays = 1; }
        else if (selectedTier === 'trial_3d') { finalTier = '1month'; durationDays = 3; }
        else if (selectedTier === 'trial_7d') { finalTier = '1month'; durationDays = 7; }
        else if (selectedTier === 'trial_14d') { finalTier = '1month'; durationDays = 14; }
        else if (selectedTier === 'permanent') { finalTier = 'permanent'; durationDays = 0; }
        else if (selectedTier === 'custom') {
            durationDays = !isNaN(customDays) ? customDays : 30;
            finalTier = durationDays === 0 ? 'permanent' : (durationDays <= 30 ? '1month' : (durationDays <= 60 ? '2months' : '5months'));
        }
        else if (selectedTier !== 'none') {
            if (!isNaN(customDays)) {
                durationDays = customDays;
                if (customDays === 0) finalTier = 'permanent';
            }
        }

        var btn = gid('admin-vip-submit-btn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Menyimpan...</span>';
            if (window.lucide) lucide.createIcons();
        }

        try {
            var payload = {
                targetId: userId,
                userId: userId,
                id: userId,
                username: username,
                email: email,
                vipTier: finalTier
            };
            if (durationDays !== null && !isNaN(durationDays)) {
                payload.durationDays = durationDays;
            }
            if (selectedBorderOpt !== 'keep') {
                payload.border = selectedBorderOpt;
            }

            var res = await fetch('/api/user-auth?action=admin_set_vip', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-token': token
                },
                body: JSON.stringify(payload)
            });
            var data = await res.json();

            if (data && data.status) {
                if (typeof showToast === 'function') showToast(data.message || 'Hak akses VIP berhasil diperbarui!');
                gid('admin-vip-access-modal')?.remove();

                // If current logged-in user is this target user, update Auth currentUser immediately!
                if (typeof Auth !== 'undefined' && Auth.currentUser) {
                    var curUser = Auth.currentUser;
                    var isCur = (curUser.id === userId) || 
                                (curUser.username && curUser.username.toLowerCase() === String(username).toLowerCase()) ||
                                (curUser.email && curUser.email.toLowerCase() === String(email).toLowerCase()) ||
                                (curUser.rawEmail && curUser.rawEmail.toLowerCase() === String(email).toLowerCase());
                    if (isCur && data.user) {
                        Auth.currentUser.isPremium = data.user.isPremium;
                        Auth.currentUser.vipTier = data.user.vipTier;
                        Auth.currentUser.vipExpiresAt = data.user.vipExpiresAt;
                        Auth.currentUser.border = data.user.border || '';
                        Auth.currentUser.borderUrl = data.user.borderUrl || '';
                        Auth.currentUser.borderName = data.user.borderName || '';
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

                        // Live update user profile modal if open
                        var borderImg = gid('modal-user-border-img');
                        if (borderImg) {
                            if (data.user.borderUrl) {
                                borderImg.src = data.user.borderUrl;
                                borderImg.classList.remove('hidden');
                            } else {
                                borderImg.src = '';
                                borderImg.classList.add('hidden');
                            }
                        }
                    }
                }

                // Reload user list in admin panel
                Profile.loadAdminUsersList();
                if (Profile.adminActiveTab === 'vip') {
                    Profile.loadAdminVipTab(true);
                }
            } else {
                if (typeof showToast === 'function') showToast(data?.message || 'Gagal mengubah status VIP');
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = '<i data-lucide="check" class="w-4 h-4 stroke-[3]"></i><span>Simpan Akses VIP</span>';
                    if (window.lucide) lucide.createIcons();
                }
            }
        } catch (e) {
            if (typeof showToast === 'function') showToast('Terjadi kesalahan jaringan: ' + e.message);
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i data-lucide="check" class="w-4 h-4 stroke-[3]"></i><span>Simpan Akses VIP</span>';
                if (window.lucide) lucide.createIcons();
            }
        }
    },

    // ==============================================================
    // TAB BERIKAN & KELOLA AKSES VIP (ADMIN CONTROL PANEL)
    // ==============================================================
    vipTabActiveFilter: 'all',
    vipTabSearchQuery: '',

    formatVipRemainingTime(expiresAt) {
        if (!expiresAt) {
            return '<span class="text-amber-300 font-black inline-flex items-center gap-1"><i data-lucide="infinity" class="w-3.5 h-3.5"></i> Selamanya</span>';
        }
        var diff = expiresAt - Date.now();
        if (diff <= 0) {
            return '<span class="text-rose-400 font-bold inline-flex items-center gap-1"><i data-lucide="clock" class="w-3.5 h-3.5"></i> Kedaluwarsa</span>';
        }
        var days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        var hours = Math.ceil(diff / (1000 * 60 * 60));
        if (days > 1) {
            return `<span class="text-emerald-400 font-bold inline-flex items-center gap-1"><i data-lucide="calendar" class="w-3.5 h-3.5"></i> Sisa ${days} Hari</span>`;
        }
        return `<span class="text-amber-400 font-bold inline-flex items-center gap-1"><i data-lucide="clock" class="w-3.5 h-3.5"></i> Sisa ${hours} Jam</span>`;
    },

    getVipTierBadgeHtml(tier, isPremium, expiresAt) {
        tier = String(tier || 'none').toLowerCase();
        var isExpired = expiresAt && Date.now() > expiresAt;
        if (!isPremium || tier === 'none' || isExpired) {
            return '<span class="text-[10px] px-2.5 py-0.5 rounded-full bg-white/10 text-white/50 border border-white/10 font-bold shrink-0">Gratis (Non-VIP)</span>';
        }
        if (tier === '1month') {
            return '<span class="text-[10px] px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/40 font-bold inline-flex items-center gap-1 shrink-0"><i data-lucide="star" class="w-3 h-3 text-sky-400"></i> VIP 1 Bulan</span>';
        }
        if (tier === '2months') {
            return '<span class="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-bold inline-flex items-center gap-1 shrink-0"><i data-lucide="shield" class="w-3 h-3 text-emerald-400"></i> VIP 2 Bulan</span>';
        }
        if (tier === '5months') {
            return '<span class="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 font-bold inline-flex items-center gap-1 shrink-0"><i data-lucide="sparkles" class="w-3 h-3 text-amber-400"></i> VIP 5 Bulan</span>';
        }
        if (tier === 'permanent' || tier === 'lifetime') {
            return '<span class="text-[10px] px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-extrabold inline-flex items-center gap-1 shrink-0 shadow-sm"><i data-lucide="crown" class="w-3 h-3 fill-black"></i> VIP Permanen</span>';
        }
        return '<span class="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 font-bold shrink-0">VIP Aktif</span>';
    },

    async loadAdminVipTab(silent) {
        var container = gid('admin-vip-container');
        var token = Profile.getAdminToken();
        if (!container || !token) return;

        if (!silent && (!Profile.cachedAdminUsers || !Profile.cachedAdminUsers.length)) {
            container.innerHTML = `
            <div class="text-center py-12 text-white/50 space-y-2">
                <i data-lucide="loader-2" class="w-8 h-8 animate-spin mx-auto text-amber-400"></i>
                <p class="text-xs font-semibold">Memuat data akses VIP & border...</p>
            </div>`;
            if (window.lucide) lucide.createIcons();
        }

        try {
            var res = await fetch('/api/user-auth?action=admin_get_users', {
                headers: { 'x-admin-token': token }
            });
            var data = await res.json();
            if (!data.status || !Array.isArray(data.users)) {
                if (!silent) {
                    container.innerHTML = `
                    <div class="text-center py-12 text-red-400 space-y-2">
                        <i data-lucide="alert-triangle" class="w-8 h-8 mx-auto"></i>
                        <p class="text-xs font-semibold">${data.message || 'Gagal memuat data pengguna'}</p>
                    </div>`;
                    if (window.lucide) lucide.createIcons();
                }
                return;
            }

            var users = data.users;
            Profile.cachedAdminUsers = users;

            // Update badge count di tab header
            var activeVips = users.filter(function(u) {
                var isExp = u.vipExpiresAt && Date.now() > u.vipExpiresAt;
                return Boolean(u.isPremium && u.vipTier && u.vipTier !== 'none') && !isExp;
            });

            var badgeEl = gid('admin-vip-count-badge');
            if (badgeEl) {
                badgeEl.innerText = activeVips.length;
                badgeEl.classList.toggle('hidden', activeVips.length === 0);
            }

            Profile.renderAdminVipTabContent(users);
        } catch (e) {
            if (!silent) {
                container.innerHTML = `
                <div class="text-center py-12 text-red-400 space-y-2">
                    <i data-lucide="wifi-off" class="w-8 h-8 mx-auto"></i>
                    <p class="text-xs font-semibold">Gagal memuat data VIP: ${e.message}</p>
                </div>`;
                if (window.lucide) lucide.createIcons();
            }
        }
    },

    renderAdminVipTabContent(users) {
        var container = gid('admin-vip-container');
        if (!container) return;

        users = users || Profile.cachedAdminUsers || [];

        // Hitung statistik
        var count1Month = 0;
        var count2Months = 0;
        var count5Months = 0;
        var countPermanent = 0;
        var activeVipTotal = 0;
        var freeCount = 0;

        users.forEach(function(u) {
            var isExp = u.vipExpiresAt && Date.now() > u.vipExpiresAt;
            var isVipActive = Boolean(u.isPremium && u.vipTier && u.vipTier !== 'none') && !isExp;
            if (isVipActive) {
                activeVipTotal++;
                var t = String(u.vipTier || '').toLowerCase();
                if (t === '1month') count1Month++;
                else if (t === '2months') count2Months++;
                else if (t === '5months') count5Months++;
                else if (t === 'permanent' || t === 'lifetime') countPermanent++;
                else count1Month++;
            } else {
                freeCount++;
            }
        });

        var html = `
        <div class="space-y-5">
            <!-- 1. Header Banner & Statistik Cepat -->
            <div class="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-purple-600/15 border border-amber-400/40 shadow-xl space-y-4">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div class="flex items-center gap-3.5">
                        <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-400 to-amber-500 flex items-center justify-center text-black font-black shadow-lg shadow-amber-500/30 shrink-0">
                            <i data-lucide="crown" class="w-6 h-6 fill-black"></i>
                        </div>
                        <div>
                            <div class="flex items-center gap-2">
                                <h3 class="text-base sm:text-lg font-black text-white tracking-tight">Berikan & Kelola Akses VIP</h3>
                                <span class="text-[9px] px-2 py-0.5 rounded-full bg-amber-400 text-black font-black uppercase tracking-wider">ADMIN</span>
                            </div>
                            <p class="text-xs text-white/70 mt-0.5">Atur paket langganan VIP pengguna, aktifkan border avatar, dan buka semua fitur eksklusif.</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="Profile.loadAdminVipTab(false)" class="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white/80 hover:text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm">
                            <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
                            <span>Segarkan</span>
                        </button>
                    </div>
                </div>

                <!-- Stat Counter Cards -->
                <div class="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2 border-t border-white/10 text-xs">
                    <div class="p-3 rounded-2xl bg-amber-400/15 border border-amber-400/30">
                        <span class="text-[10px] text-amber-200/80 font-bold block">Total VIP Aktif</span>
                        <span class="text-lg font-black text-amber-300">${activeVipTotal}</span>
                    </div>
                    <div class="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20">
                        <span class="text-[10px] text-sky-200/80 font-bold block">Paket 1 Bulan</span>
                        <span class="text-lg font-black text-sky-300">${count1Month}</span>
                    </div>
                    <div class="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                        <span class="text-[10px] text-emerald-200/80 font-bold block">Paket 2 Bulan</span>
                        <span class="text-lg font-black text-emerald-300">${count2Months}</span>
                    </div>
                    <div class="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                        <span class="text-[10px] text-amber-200/80 font-bold block">Paket 5 Bulan</span>
                        <span class="text-lg font-black text-amber-300">${count5Months}</span>
                    </div>
                    <div class="p-3 rounded-2xl bg-yellow-500/15 border border-yellow-500/30 col-span-2 sm:col-span-1">
                        <span class="text-[10px] text-yellow-200/80 font-bold block">VIP Permanen</span>
                        <span class="text-lg font-black text-yellow-300">${countPermanent}</span>
                    </div>
                </div>
            </div>

            <!-- 2. Panduan Resmi Hak Akses Border & Fitur (Sesuai Permintaan) -->
            <div class="p-4 sm:p-5 rounded-3xl bg-white/[0.03] border border-white/10 space-y-3.5">
                <div class="flex items-center justify-between border-b border-white/5 pb-2">
                    <h4 class="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-2">
                        <i data-lucide="info" class="w-4 h-4 text-amber-400"></i>
                        <span>Ketentuan Hak Akses Border Sesuai Durasi Paket Pembelian</span>
                    </h4>
                    <span class="text-[10px] text-white/40 font-mono">Ketentuan Sistem</span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <!-- Paket 1 Bulan Card -->
                    <div class="p-3.5 rounded-2xl bg-sky-500/[0.06] border border-sky-400/30 space-y-2">
                        <div class="flex items-center justify-between">
                            <span class="font-extrabold text-sky-300 flex items-center gap-1.5">
                                <i data-lucide="star" class="w-3.5 h-3.5 text-sky-400"></i> 1 Bulan (30 Hari)
                            </span>
                            <span class="text-[9px] px-1.5 py-0.2 rounded-md bg-sky-400/20 text-sky-300 font-bold">Tier 1</span>
                        </div>
                        <div class="space-y-1">
                            <p class="text-[11px] text-white/90 font-bold">Dapat Border:</p>
                            <p class="text-[11px] text-sky-300 font-extrabold flex items-center gap-1">
                                <i data-lucide="check" class="w-3 h-3 text-sky-400"></i> Platinum & Master
                            </p>
                        </div>
                        <p class="text-[10px] text-white/60 leading-relaxed pt-1 border-t border-white/5">
                            <strong class="text-emerald-400">Bonus:</strong> Bebas akses semua fitur VIP.
                        </p>
                    </div>

                    <!-- Paket 2 Bulan Card -->
                    <div class="p-3.5 rounded-2xl bg-emerald-500/[0.06] border border-emerald-400/30 space-y-2">
                        <div class="flex items-center justify-between">
                            <span class="font-extrabold text-emerald-300 flex items-center gap-1.5">
                                <i data-lucide="shield" class="w-3.5 h-3.5 text-emerald-400"></i> 2 Bulan (60 Hari)
                            </span>
                            <span class="text-[9px] px-1.5 py-0.2 rounded-md bg-emerald-400/20 text-emerald-300 font-bold">Tier 2</span>
                        </div>
                        <div class="space-y-1">
                            <p class="text-[11px] text-white/90 font-bold">Dapat Border:</p>
                            <p class="text-[11px] text-emerald-300 font-extrabold flex items-center gap-1">
                                <i data-lucide="check" class="w-3 h-3 text-emerald-400"></i> Platinum, Master, Legend
                            </p>
                        </div>
                        <p class="text-[10px] text-white/60 leading-relaxed pt-1 border-t border-white/5">
                            <strong class="text-emerald-400">Bonus:</strong> Bebas akses semua fitur VIP.
                        </p>
                    </div>

                    <!-- Paket 5 Bulan Card -->
                    <div class="p-3.5 rounded-2xl bg-amber-500/[0.06] border border-amber-400/30 space-y-2">
                        <div class="flex items-center justify-between">
                            <span class="font-extrabold text-amber-300 flex items-center gap-1.5">
                                <i data-lucide="sparkles" class="w-3.5 h-3.5 text-amber-400"></i> 5 Bulan (150 Hari)
                            </span>
                            <span class="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-400/20 text-amber-300 font-bold">Tier 3</span>
                        </div>
                        <div class="space-y-1">
                            <p class="text-[11px] text-white/90 font-bold">Dapat Border:</p>
                            <p class="text-[11px] text-amber-300 font-extrabold flex items-center gap-1">
                                <i data-lucide="check" class="w-3 h-3 text-amber-400"></i> Platinum, Master, Legend, Immortal
                            </p>
                        </div>
                        <p class="text-[10px] text-white/60 leading-relaxed pt-1 border-t border-white/5">
                            <strong class="text-emerald-400">Bonus:</strong> Bebas akses semua fitur VIP.
                        </p>
                    </div>

                    <!-- Paket Permanen Card -->
                    <div class="p-3.5 rounded-2xl bg-yellow-500/[0.08] border border-yellow-400/40 space-y-2">
                        <div class="flex items-center justify-between">
                            <span class="font-black text-amber-300 flex items-center gap-1.5">
                                <i data-lucide="crown" class="w-3.5 h-3.5 text-yellow-400"></i> Permanen (Lifetime)
                            </span>
                            <span class="text-[9px] px-1.5 py-0.2 rounded-md bg-yellow-400 text-black font-black">ULTIMATE</span>
                        </div>
                        <div class="space-y-1">
                            <p class="text-[11px] text-white/90 font-bold">Dapat Border:</p>
                            <p class="text-[11px] text-amber-300 font-black flex items-center gap-1">
                                <i data-lucide="check" class="w-3 h-3 text-yellow-400"></i> SEMUA BORDER (Bebas)
                            </p>
                        </div>
                        <p class="text-[10px] text-white/70 leading-relaxed pt-1 border-t border-white/5">
                            <strong class="text-emerald-400">Bonus:</strong> Akses semua fitur VIP selamanya.
                        </p>
                    </div>
                </div>

                <!-- Bagian 4 Fitur VIP yang Terkunci di Pengaturan untuk Pengguna Gratis -->
                <div class="p-3 rounded-2xl bg-amber-500/10 border border-amber-400/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div class="flex items-center gap-2.5">
                        <div class="w-7 h-7 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
                            <i data-lucide="lock" class="w-3.5 h-3.5"></i>
                        </div>
                        <div>
                            <span class="font-extrabold text-amber-300 block">4 Fitur VIP yang Terkunci di Pengaturan untuk Non-VIP:</span>
                            <span class="text-[11px] text-white/70">1. Kualitas Audio HD &bull; 2. Layar Tetap Menyala &bull; 3. Gestur Usap Layar &bull; 4. Putar di Latar Belakang</span>
                        </div>
                    </div>
                    <span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold self-start sm:self-auto shrink-0">
                        Otomatis Terbuka Penuh Saat VIP
                    </span>
                </div>
            </div>

            <!-- 3. Formulir Cepat Berikan Akses VIP Pengguna -->
            <div class="p-5 sm:p-6 rounded-3xl bg-[#0f1219] border border-amber-500/30 shadow-xl space-y-4">
                <div class="flex items-center justify-between pb-3 border-b border-white/10">
                    <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center shrink-0">
                            <i data-lucide="user-check" class="w-4 h-4"></i>
                        </div>
                        <div>
                            <h4 class="text-sm sm:text-base font-black text-white">Formulir Berikan / Perbarui Akses VIP</h4>
                            <p class="text-[11px] text-white/50">Pilih pengguna terdaftar dan berikan paket durasi VIP</p>
                        </div>
                    </div>
                </div>

                <div class="space-y-4">
                    <!-- Dropdown Pilih Pengguna -->
                    <div class="space-y-1.5">
                        <label class="text-xs font-bold text-white/80 flex items-center justify-between">
                            <span>1. Pilih Pengguna Terdaftar:</span>
                            <span class="text-[10px] text-white/40">Total ${users.length} Akun</span>
                        </label>
                        <select id="admin-vip-form-user-select" onchange="Profile.onAdminVipUserSelect(this.value)" class="w-full py-2.5 px-3 rounded-xl bg-white/5 border border-white/15 focus:border-amber-400 text-xs text-white focus:outline-none transition-all cursor-pointer">
                            <option value="" class="bg-[#161922] text-white/60">-- Pilih salah satu pengguna --</option>
                            ${users.map(function(u) {
                                var isExp = u.vipExpiresAt && Date.now() > u.vipExpiresAt;
                                var isVip = Boolean(u.isPremium && u.vipTier && u.vipTier !== 'none') && !isExp;
                                var tierLabel = isVip ? (u.vipTier || 'VIP') : 'Gratis';
                                return `<option value="${esHtml(u.id)}" data-username="${esHtml(u.username)}" data-email="${esHtml(u.email)}" data-tier="${esHtml(u.vipTier || 'none')}" data-border="${esHtml(u.border || '')}" class="bg-[#161922] text-white">@${esHtml(u.username)} (${esHtml(u.email)}) - Status: [${tierLabel}]</option>`;
                            }).join('')}
                        </select>
                    </div>

                    <!-- Target User Active Status Info Display -->
                    <div id="admin-vip-form-user-info-box" class="hidden p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between text-xs">
                        <div class="flex items-center gap-2.5 min-w-0">
                            <div class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-amber-300 shrink-0 font-bold">
                                <i data-lucide="user" class="w-4 h-4"></i>
                            </div>
                            <div class="min-w-0">
                                <h5 id="admin-vip-form-selected-name" class="font-bold text-white truncate">@username</h5>
                                <p id="admin-vip-form-selected-status" class="text-[11px] text-white/50">Status: Gratis</p>
                            </div>
                        </div>
                        <div id="admin-vip-form-selected-border" class="text-right text-[11px] text-amber-300 font-semibold shrink-0">
                            Tanpa Border
                        </div>
                    </div>

                    <!-- Pilihan Paket VIP Durasi -->
                    <div class="space-y-2">
                        <label class="text-xs font-bold text-white/80 block">2. Pilih Paket Durasi VIP:</label>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                            <!-- Radio 1 Bulan -->
                            <label class="p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-2.5 bg-white/[0.02] hover:bg-white/[0.05] border-white/10 has-[:checked]:border-sky-400 has-[:checked]:bg-sky-500/10 has-[:checked]:shadow-[0_0_20px_rgba(56,189,248,0.2)]">
                                <input type="radio" name="admin_vip_tab_tier_radio" value="1month" checked class="mt-0.5 w-4 h-4 accent-sky-400 cursor-pointer">
                                <div class="min-w-0 flex-1">
                                    <div class="flex items-center justify-between gap-1">
                                        <span class="font-bold text-white">1 Bulan (30 Hari)</span>
                                        <span class="text-[9px] px-1.5 py-0.2 rounded-full bg-sky-400/20 text-sky-300 font-bold border border-sky-400/30">Platinum & Master</span>
                                    </div>
                                    <p class="text-[10px] text-white/60 mt-0.5">Dapat Border Platinum & Master + Semua Fitur VIP</p>
                                </div>
                            </label>

                            <!-- Radio 2 Bulan -->
                            <label class="p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-2.5 bg-white/[0.02] hover:bg-white/[0.05] border-white/10 has-[:checked]:border-emerald-400 has-[:checked]:bg-emerald-500/10 has-[:checked]:shadow-[0_0_20px_rgba(52,211,153,0.2)]">
                                <input type="radio" name="admin_vip_tab_tier_radio" value="2months" class="mt-0.5 w-4 h-4 accent-emerald-400 cursor-pointer">
                                <div class="min-w-0 flex-1">
                                    <div class="flex items-center justify-between gap-1">
                                        <span class="font-bold text-white">2 Bulan (60 Hari)</span>
                                        <span class="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-400/20 text-emerald-300 font-bold border border-emerald-400/30">Platinum, Master, Legend</span>
                                    </div>
                                    <p class="text-[10px] text-white/60 mt-0.5">Dapat Border Platinum, Master, Legend + Semua Fitur VIP</p>
                                </div>
                            </label>

                            <!-- Radio 5 Bulan -->
                            <label class="p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-2.5 bg-white/[0.02] hover:bg-white/[0.05] border-white/10 has-[:checked]:border-amber-400 has-[:checked]:bg-amber-500/10 has-[:checked]:shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                                <input type="radio" name="admin_vip_tab_tier_radio" value="5months" class="mt-0.5 w-4 h-4 accent-amber-400 cursor-pointer">
                                <div class="min-w-0 flex-1">
                                    <div class="flex items-center justify-between gap-1">
                                        <span class="font-bold text-white">5 Bulan (150 Hari)</span>
                                        <span class="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">Legend & Immortal</span>
                                    </div>
                                    <p class="text-[10px] text-white/60 mt-0.5">Dapat Platinum, Master, Legend, Immortal + Semua Fitur</p>
                                </div>
                            </label>

                            <!-- Radio Permanen -->
                            <label class="p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-2.5 bg-white/[0.02] hover:bg-white/[0.05] border-white/10 has-[:checked]:border-yellow-400 has-[:checked]:bg-yellow-500/15 has-[:checked]:shadow-[0_0_25px_rgba(234,179,8,0.25)]">
                                <input type="radio" name="admin_vip_tab_tier_radio" value="permanent" class="mt-0.5 w-4 h-4 accent-yellow-400 cursor-pointer">
                                <div class="min-w-0 flex-1">
                                    <div class="flex items-center justify-between gap-1">
                                        <span class="font-extrabold text-amber-300">Permanen (Lifetime)</span>
                                        <span class="text-[9px] px-1.5 py-0.2 rounded-full bg-yellow-400/20 text-yellow-300 font-black border border-yellow-400/30">Semua Border</span>
                                    </div>
                                    <p class="text-[10px] text-white/70 mt-0.5">Akses SEMUA Border & Fitur Premium Selamanya</p>
                                </div>
                            </label>

                            <!-- Radio Nonaktifkan VIP -->
                            <label class="p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-2.5 bg-white/[0.01] hover:bg-white/[0.04] border-white/5 has-[:checked]:border-rose-400/50 has-[:checked]:bg-rose-500/10 col-span-1 sm:col-span-2">
                                <input type="radio" name="admin_vip_tab_tier_radio" value="none" class="mt-0.5 w-4 h-4 accent-rose-400 cursor-pointer">
                                <div class="min-w-0 flex-1">
                                    <span class="font-bold text-white/80">Nonaktifkan VIP (Cabut Status & Kembalikan ke Akun Gratis)</span>
                                    <p class="text-[10px] text-white/40 mt-0.5">Menghapus hak akses VIP, mengunci fitur kembali, dan melepas border profil.</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    <!-- 3. Pasang Border Langsung (Opsional) -->
                    <div class="space-y-2 pt-2 border-t border-white/10">
                        <label class="text-xs font-bold text-white/80 block flex items-center justify-between">
                            <span>3. Pasang Border Langsung ke Avatar Pengguna (Opsional):</span>
                            <span class="text-[10px] text-white/40">Pengguna juga bisa memilih sendiri di Profil</span>
                        </label>
                        <div class="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
                            <label class="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex items-center gap-1.5 cursor-pointer has-[:checked]:border-amber-400 has-[:checked]:bg-amber-400/10">
                                <input type="radio" name="admin_vip_tab_border_radio" value="keep" checked class="w-3.5 h-3.5 accent-amber-400 cursor-pointer">
                                <span class="text-[11px] font-semibold text-white/80">Biarkan Tetap</span>
                            </label>
                            <label class="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex items-center gap-1.5 cursor-pointer has-[:checked]:border-sky-400 has-[:checked]:bg-sky-400/10">
                                <input type="radio" name="admin_vip_tab_border_radio" value="border_platinum" class="w-3.5 h-3.5 accent-sky-400 cursor-pointer">
                                <span class="text-[11px] font-bold text-sky-300">Platinum</span>
                            </label>
                            <label class="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex items-center gap-1.5 cursor-pointer has-[:checked]:border-orange-400 has-[:checked]:bg-orange-400/10">
                                <input type="radio" name="admin_vip_tab_border_radio" value="border_master" class="w-3.5 h-3.5 accent-orange-400 cursor-pointer">
                                <span class="text-[11px] font-bold text-orange-300">Master</span>
                            </label>
                            <label class="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex items-center gap-1.5 cursor-pointer has-[:checked]:border-emerald-400 has-[:checked]:bg-emerald-400/10">
                                <input type="radio" name="admin_vip_tab_border_radio" value="border_legend" class="w-3.5 h-3.5 accent-emerald-400 cursor-pointer">
                                <span class="text-[11px] font-bold text-emerald-300">Legend</span>
                            </label>
                            <label class="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex items-center gap-1.5 cursor-pointer has-[:checked]:border-pink-400 has-[:checked]:bg-pink-400/10">
                                <input type="radio" name="admin_vip_tab_border_radio" value="border_immortal" class="w-3.5 h-3.5 accent-pink-400 cursor-pointer">
                                <span class="text-[11px] font-bold text-pink-300">Immortal</span>
                            </label>
                            <label class="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex items-center gap-1.5 cursor-pointer has-[:checked]:border-rose-400 has-[:checked]:bg-rose-400/10">
                                <input type="radio" name="admin_vip_tab_border_radio" value="none" class="w-3.5 h-3.5 accent-rose-400 cursor-pointer">
                                <span class="text-[11px] font-semibold text-white/50">Lepas Border</span>
                            </label>
                        </div>
                    </div>

                    <!-- Submit Action Button -->
                    <div class="pt-3 border-t border-white/10 flex items-center justify-end">
                        <button id="admin-vip-tab-submit-btn" type="button" onclick="Profile.submitAdminVipTabForm()" class="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-500 text-black text-xs font-black flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer shadow-[0_0_25px_rgba(245,158,11,0.35)]">
                            <i data-lucide="crown" class="w-4 h-4 fill-black"></i>
                            <span>Berikan / Simpan Akses VIP Sekarang</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- 4. Daftar & Tabel Pengguna VIP Terdaftar -->
            <div class="space-y-3">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h4 class="text-sm font-extrabold text-white flex items-center gap-2">
                            <span>Daftar Status Akses VIP Pengguna</span>
                            <span class="text-xs font-bold text-white/50 font-mono">(${users.length})</span>
                        </h4>
                        <p class="text-[11px] text-white/50">Pantau pengguna yang sedang aktif berlangganan VIP, sisa masa aktif, dan border profil.</p>
                    </div>

                    <!-- Search Input Filter -->
                    <div class="relative w-full sm:w-64">
                        <i data-lucide="search" class="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2"></i>
                        <input id="admin-vip-search-input" type="text" oninput="Profile.onAdminVipSearch(this.value)" placeholder="Cari username atau email..." class="w-full bg-white/5 border border-white/10 focus:border-amber-400 rounded-xl pl-8 pr-8 py-2 text-xs text-white placeholder-white/40 focus:outline-none transition-all">
                        <button onclick="var el=gid('admin-vip-search-input'); if(el) el.value=''; Profile.onAdminVipSearch('');" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer" title="Hapus">
                            <i data-lucide="x-circle" class="w-3.5 h-3.5"></i>
                        </button>
                    </div>
                </div>

                <!-- Filter Chips -->
                <div class="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1 text-xs">
                    <button onclick="Profile.filterAdminVipTable('all')" class="vip-filter-chip px-3 py-1 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${Profile.vipTabActiveFilter === 'all' ? 'bg-amber-400 text-black shadow-md shadow-amber-500/20' : 'bg-white/5 hover:bg-white/10 text-white/70'}">
                        Semua (${users.length})
                    </button>
                    <button onclick="Profile.filterAdminVipTable('active')" class="vip-filter-chip px-3 py-1 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${Profile.vipTabActiveFilter === 'active' ? 'bg-amber-400 text-black shadow-md shadow-amber-500/20' : 'bg-white/5 hover:bg-white/10 text-white/70'}">
                        VIP Aktif (${activeVipTotal})
                    </button>
                    <button onclick="Profile.filterAdminVipTable('1month')" class="vip-filter-chip px-3 py-1 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${Profile.vipTabActiveFilter === '1month' ? 'bg-sky-400 text-black shadow-md' : 'bg-white/5 hover:bg-white/10 text-white/70'}">
                        1 Bulan (${count1Month})
                    </button>
                    <button onclick="Profile.filterAdminVipTable('2months')" class="vip-filter-chip px-3 py-1 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${Profile.vipTabActiveFilter === '2months' ? 'bg-emerald-400 text-black shadow-md' : 'bg-white/5 hover:bg-white/10 text-white/70'}">
                        2 Bulan (${count2Months})
                    </button>
                    <button onclick="Profile.filterAdminVipTable('5months')" class="vip-filter-chip px-3 py-1 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${Profile.vipTabActiveFilter === '5months' ? 'bg-amber-400 text-black shadow-md' : 'bg-white/5 hover:bg-white/10 text-white/70'}">
                        5 Bulan (${count5Months})
                    </button>
                    <button onclick="Profile.filterAdminVipTable('permanent')" class="vip-filter-chip px-3 py-1 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${Profile.vipTabActiveFilter === 'permanent' ? 'bg-yellow-400 text-black shadow-md' : 'bg-white/5 hover:bg-white/10 text-white/70'}">
                        Permanen (${countPermanent})
                    </button>
                    <button onclick="Profile.filterAdminVipTable('free')" class="vip-filter-chip px-3 py-1 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${Profile.vipTabActiveFilter === 'free' ? 'bg-white/20 text-white shadow-md' : 'bg-white/5 hover:bg-white/10 text-white/70'}">
                        Non-VIP (${freeCount})
                    </button>
                </div>

                <!-- Users Grid Container -->
                <div id="admin-vip-cards-container" class="space-y-2.5">
                    ${Profile.renderVipUserRows(users)}
                </div>
            </div>
        </div>`;

        container.innerHTML = html;
        if (window.lucide) lucide.createIcons();
    },

    onAdminVipUserSelect(userId) {
        var infoBox = gid('admin-vip-form-user-info-box');
        if (!userId) {
            if (infoBox) infoBox.classList.add('hidden');
            return;
        }
        var users = Profile.cachedAdminUsers || [];
        var u = users.find(function(x){ return x.id === userId; });
        if (!u) {
            if (infoBox) infoBox.classList.add('hidden');
            return;
        }

        if (infoBox) {
            infoBox.classList.remove('hidden');
            var nameEl = gid('admin-vip-form-selected-name');
            var statusEl = gid('admin-vip-form-selected-status');
            var borderEl = gid('admin-vip-form-selected-border');
            if (nameEl) nameEl.innerText = '@' + (u.username || '') + ' (' + (u.email || '') + ')';
            var isExp = u.vipExpiresAt && Date.now() > u.vipExpiresAt;
            var isVip = Boolean(u.isPremium && u.vipTier && u.vipTier !== 'none') && !isExp;
            if (statusEl) {
                statusEl.innerHTML = isVip ? `Status: <span class="text-amber-300 font-bold">${u.vipTier || 'VIP'}</span> &bull; ${Profile.formatVipRemainingTime(u.vipExpiresAt)}` : 'Status: <span class="text-white/60">Gratis (Non-VIP)</span>';
            }
            if (borderEl) {
                borderEl.innerHTML = u.borderUrl ? `<span class="inline-flex items-center gap-1 text-amber-300 font-bold"><img src="${esHtml(u.borderUrl)}" class="w-5 h-5 object-contain"> ${esHtml(u.borderName || u.border)}</span>` : '<span class="text-white/40">Tanpa Border</span>';
            }
        }

        // Set radio buttons according to user's current status if VIP
        var currentTier = isVip ? String(u.vipTier || 'permanent').toLowerCase() : 'none';
        var radio = document.querySelector(`input[name="admin_vip_tab_tier_radio"][value="${currentTier}"]`);
        if (radio) radio.checked = true;
    },

    async submitAdminVipTabForm() {
        var token = Profile.getAdminToken();
        if (!token) {
            if (typeof showToast === 'function') showToast('Sesi admin tidak ditemukan. Silakan login kembali.');
            return;
        }

        var selectEl = gid('admin-vip-form-user-select');
        var userId = selectEl?.value;
        if (!userId) {
            if (typeof showToast === 'function') showToast('Pilih pengguna yang ingin diberikan akses VIP terlebih dahulu!');
            return;
        }

        var users = Profile.cachedAdminUsers || [];
        var u = users.find(function(x){ return x.id === userId; }) || {};

        var selectedTier = document.querySelector('input[name="admin_vip_tab_tier_radio"]:checked')?.value || '1month';
        var selectedBorder = document.querySelector('input[name="admin_vip_tab_border_radio"]:checked')?.value || 'keep';

        var btn = gid('admin-vip-tab-submit-btn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Memproses...</span>';
            if (window.lucide) lucide.createIcons();
        }

        try {
            var payload = {
                targetId: userId,
                userId: userId,
                id: userId,
                username: u.username || '',
                email: u.email || '',
                vipTier: selectedTier
            };
            if (selectedBorder !== 'keep') {
                payload.border = selectedBorder;
            }

            var res = await fetch('/api/user-auth?action=admin_set_vip', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-token': token
                },
                body: JSON.stringify(payload)
            });
            var data = await res.json();

            if (data && data.status) {
                if (typeof showToast === 'function') showToast(data.message || 'Hak akses VIP berhasil disimpan!');
                
                // If current logged-in user is target, update live
                if (typeof Auth !== 'undefined' && Auth.currentUser) {
                    var curUser = Auth.currentUser;
                    var isCur = (curUser.id === userId) || 
                                (curUser.username && curUser.username.toLowerCase() === String(u.username).toLowerCase()) ||
                                (curUser.email && curUser.email.toLowerCase() === String(u.email).toLowerCase());
                    if (isCur && data.user) {
                        Auth.currentUser.isPremium = data.user.isPremium;
                        Auth.currentUser.vipTier = data.user.vipTier;
                        Auth.currentUser.vipExpiresAt = data.user.vipExpiresAt;
                        Auth.currentUser.border = data.user.border || '';
                        Auth.currentUser.borderUrl = data.user.borderUrl || '';
                        Auth.currentUser.borderName = data.user.borderName || '';
                        if (typeof Auth.saveUser === 'function') Auth.saveUser(Auth.currentUser);
                        Auth.updateHeaderUI();
                    }
                }

                // Refresh VIP Tab & Users List
                Profile.loadAdminVipTab(false);
                Profile.loadAdminUsersList();
            } else {
                if (typeof showToast === 'function') showToast(data?.message || 'Gagal menyimpan status VIP');
            }
        } catch (e) {
            if (typeof showToast === 'function') showToast('Terjadi kesalahan koneksi: ' + e.message);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i data-lucide="crown" class="w-4 h-4 fill-black"></i><span>Berikan / Simpan Akses VIP Sekarang</span>';
                if (window.lucide) lucide.createIcons();
            }
        }
    },

    onAdminVipSearch(q) {
        Profile.vipTabSearchQuery = String(q || '').toLowerCase().trim();
        var users = Profile.cachedAdminUsers || [];
        var container = gid('admin-vip-cards-container');
        if (container) {
            container.innerHTML = Profile.renderVipUserRows(users);
            if (window.lucide) lucide.createIcons();
        }
    },

    filterAdminVipTable(tier) {
        Profile.vipTabActiveFilter = tier;
        var users = Profile.cachedAdminUsers || [];
        var container = gid('admin-vip-cards-container');
        if (container) {
            container.innerHTML = Profile.renderVipUserRows(users);
            if (window.lucide) lucide.createIcons();
        }

        // Update active chip styling
        var chips = document.querySelectorAll('.vip-filter-chip');
        chips.forEach(function(chip) {
            chip.className = 'vip-filter-chip px-3 py-1 rounded-xl font-bold transition cursor-pointer whitespace-nowrap bg-white/5 hover:bg-white/10 text-white/70';
        });
        if (event && event.currentTarget) {
            event.currentTarget.className = 'vip-filter-chip px-3 py-1 rounded-xl font-bold transition cursor-pointer whitespace-nowrap bg-amber-400 text-black shadow-md shadow-amber-500/20';
        }
    },

    renderVipUserRows(users) {
        if (!users || users.length === 0) {
            return `
            <div class="p-8 text-center rounded-2xl bg-white/[0.03] border border-white/10 text-white/50 text-xs">
                Belum ada pengguna terdaftar.
            </div>`;
        }

        var filter = Profile.vipTabActiveFilter || 'all';
        var query = Profile.vipTabSearchQuery || '';

        var filtered = users.filter(function(u) {
            var isExp = u.vipExpiresAt && Date.now() > u.vipExpiresAt;
            var isVipActive = Boolean(u.isPremium && u.vipTier && u.vipTier !== 'none') && !isExp;
            var t = String(u.vipTier || '').toLowerCase();

            // Filter tab check
            if (filter === 'active' && !isVipActive) return false;
            if (filter === '1month' && (!isVipActive || t !== '1month')) return false;
            if (filter === '2months' && (!isVipActive || t !== '2months')) return false;
            if (filter === '5months' && (!isVipActive || t !== '5months')) return false;
            if (filter === 'permanent' && (!isVipActive || (t !== 'permanent' && t !== 'lifetime'))) return false;
            if (filter === 'free' && isVipActive) return false;

            // Search query check
            if (query) {
                var uname = String(u.username || '').toLowerCase();
                var email = String(u.email || '').toLowerCase();
                if (!uname.includes(query) && !email.includes(query)) return false;
            }

            return true;
        });

        if (filtered.length === 0) {
            return `
            <div class="p-8 text-center rounded-2xl bg-white/[0.03] border border-white/10 text-white/50 text-xs space-y-1">
                <i data-lucide="search-x" class="w-7 h-7 mx-auto text-white/30"></i>
                <p class="font-bold text-white/80">Tidak ada pengguna yang cocok</p>
                <p class="text-[11px] text-white/40">Coba ubah kata kunci pencarian atau kategori filter di atas.</p>
            </div>`;
        }

        return filtered.map(function(u) {
            var isExp = u.vipExpiresAt && Date.now() > u.vipExpiresAt;
            var isVipActive = Boolean(u.isPremium && u.vipTier && u.vipTier !== 'none') && !isExp;
            var avatarUrl = u.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(u.username)}`;
            var borderUrl = u.borderUrl || '';

            return `
            <div class="p-3.5 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <!-- User Left: Avatar + Identity -->
                <div class="flex items-center gap-3.5 min-w-0">
                    <!-- Avatar with mathematically centered border overlay -->
                    <div class="relative w-12 h-12 flex items-center justify-center shrink-0">
                        <img src="${esHtml(avatarUrl)}" class="w-10 h-10 rounded-full object-cover bg-black/40 border border-white/10" alt="Avatar">
                        ${borderUrl ? `<img src="${esHtml(borderUrl)}" class="absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-md z-10" alt="Border">` : ''}
                    </div>

                    <div class="min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                            <h5 class="text-xs sm:text-sm font-extrabold text-white truncate">@${esHtml(u.username)}</h5>
                            ${Profile.getVipTierBadgeHtml(u.vipTier, u.isPremium, u.vipExpiresAt)}
                        </div>
                        <p class="text-[11px] text-white/50 truncate">${esHtml(u.email)}</p>
                    </div>
                </div>

                <!-- User Center/Right: Sisa Waktu & Border Aktif -->
                <div class="flex items-center gap-3 sm:gap-5 justify-between sm:justify-end text-xs shrink-0 flex-wrap pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                    <div class="text-left sm:text-right">
                        <span class="text-[10px] text-white/40 uppercase tracking-wider font-bold block">Masa Aktif</span>
                        <div class="text-[11px] font-semibold mt-0.5">
                            ${isVipActive ? Profile.formatVipRemainingTime(u.vipExpiresAt) : '<span class="text-white/40">Nonaktif</span>'}
                        </div>
                    </div>

                    <div class="text-left sm:text-right">
                        <span class="text-[10px] text-white/40 uppercase tracking-wider font-bold block">Border Avatar</span>
                        <div class="text-[11px] font-semibold mt-0.5">
                            ${borderUrl ? `<span class="text-amber-300 font-bold inline-flex items-center gap-1"><img src="${esHtml(borderUrl)}" class="w-4 h-4 object-contain"> ${esHtml(u.borderName || u.border)}</span>` : '<span class="text-white/40">Tanpa Border</span>'}
                        </div>
                    </div>

                    <!-- Direct Action Buttons -->
                    <div class="flex items-center gap-1.5 shrink-0">
                        <button onclick="Profile.openAdminVipModal('${esJs(u.id)}', '${esJs(u.username)}', '${esJs(u.email)}', '${esJs(u.vipTier || (u.isPremium ? 'permanent' : 'none'))}', '${esJs(u.border || '')}')" class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-500/25 to-amber-400/20 hover:from-amber-500/35 hover:to-yellow-500/35 text-amber-300 border border-amber-400/40 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-sm" title="Kelola Akses VIP & Border">
                            <i data-lucide="crown" class="w-3.5 h-3.5 text-amber-400"></i>
                            <span>Atur VIP</span>
                        </button>

                        ${isVipActive ? `
                        <button onclick="Profile.confirmRevokeAdminVip('${esJs(u.id)}', '${esJs(u.username)}')" class="px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1 active:scale-95 transition-all cursor-pointer" title="Cabut Akses VIP">
                            <i data-lucide="user-x" class="w-3.5 h-3.5"></i>
                            <span class="hidden sm:inline">Cabut</span>
                        </button>
                        ` : ''}

                        <button onclick="if(typeof Profile.openDirectMessageModal==='function') Profile.openDirectMessageModal('${esJs(u.id)}', '${esJs(u.username)}')" class="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition cursor-pointer" title="Kirim Pesan Langsung">
                            <i data-lucide="send" class="w-3.5 h-3.5"></i>
                        </button>
                    </div>
                </div>
            </div>`;
        }).join('');
    },

    confirmRevokeAdminVip(userId, username) {
        var token = Profile.getAdminToken();
        if (!token) return;

        Profile.showConfirmModal({
            title: 'Cabut Akses VIP',
            message: `Apakah Anda yakin ingin MENCABUT hak akses VIP dari pengguna @${username}? Akun akan dikembalikan ke status gratis dan border profil akan dilepas.`,
            confirmText: 'Ya, Cabut VIP',
            confirmClass: 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/40',
            onConfirm: async function() {
                try {
                    var res = await fetch('/api/user-auth?action=admin_set_vip', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-admin-token': token
                        },
                        body: JSON.stringify({
                            targetId: userId,
                            vipTier: 'none',
                            border: 'none'
                        })
                    });
                    var data = await res.json();
                    if (data && data.status) {
                        if (typeof showToast === 'function') showToast(`Akses VIP @${username} berhasil dicabut.`);
                        Profile.loadAdminVipTab(false);
                        Profile.loadAdminUsersList();
                    } else {
                        if (typeof showToast === 'function') showToast(data?.message || 'Gagal mencabut VIP');
                    }
                } catch(e) {
                    if (typeof showToast === 'function') showToast('Terjadi kesalahan koneksi');
                }
            }
        });
    },

    toggleBanFormDurationInput() {
        var typeEl = gid('admin-ban-form-type');
        var durContainer = gid('admin-ban-form-duration-container');
        if (!typeEl || !durContainer) return;
        if (typeEl.value === 'temporary') {
            durContainer.classList.remove('hidden');
        } else {
            durContainer.classList.add('hidden');
        }
    },

    async submitBanForm(isUnban) {
        var token = Profile.getAdminToken();
        if (!token) return;

        var idVal = (gid('admin-ban-form-userid')?.value || '').trim();
        var uVal = (gid('admin-ban-form-username')?.value || '').trim();
        var eVal = (gid('admin-ban-form-email')?.value || '').trim();
        var ipVal = (gid('admin-ban-form-ip')?.value || '').trim();

        if (!idVal && !uVal && !eVal && !ipVal) {
            if (typeof showToast === 'function') {
                showToast('Silakan isi salah satu target: User ID, Username, Email, atau Alamat IP!');
            }
            return;
        }

        var banType = isUnban ? 'none' : (gid('admin-ban-form-type')?.value || 'permanent');
        var durationDays = Number(gid('admin-ban-form-duration')?.value || 0);
        var banReason = isUnban ? '' : (gid('admin-ban-form-reason')?.value || '').trim();

        var submitBtn = isUnban ? gid('admin-submit-unban-btn') : gid('admin-submit-ban-btn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.classList.add('opacity-50');
        }

        try {
            // Handle IP-only Banning separately
            if (ipVal && !idVal && !uVal && !eVal) {
                var resIp = await fetch('/api/user-auth?action=admin_ban_ip', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-admin-token': token
                    },
                    body: JSON.stringify({
                        targetIp: ipVal,
                        banType: banType,
                        durationDays: durationDays,
                        banReason: banReason || 'Alamat IP Anda telah dimasukkan ke dalam daftar hitam oleh admin.'
                    })
                });
                var dataIp = await resIp.json();
                if (dataIp.status) {
                    if (typeof showToast === 'function') {
                        showToast(dataIp.message || 'Blacklist IP berhasil diperbarui!');
                    }
                    if (gid('admin-ban-form-ip')) gid('admin-ban-form-ip').value = '';
                    gid('admin-ban-form-target-status')?.classList.add('hidden');
                    Profile.loadAdminBansList();
                    Profile.loadAdminUsersList();
                } else {
                    if (typeof showToast === 'function') {
                        showToast(dataIp.message || 'Gagal memperbarui sanksi IP');
                    }
                }
                return;
            }

            // Otherwise handle User Account Banning
            var res = await fetch('/api/user-auth?action=admin_ban_user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-token': token
                },
                body: JSON.stringify({
                    targetId: idVal,
                    username: uVal,
                    email: eVal,
                    ip: ipVal,
                    banType: banType,
                    durationDays: durationDays,
                    banReason: banReason
                })
            });
            var data = await res.json();

            // Also ban IP address if provided alongside user
            if (ipVal && !isUnban) {
                await fetch('/api/user-auth?action=admin_ban_ip', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-admin-token': token
                    },
                    body: JSON.stringify({
                        targetIp: ipVal,
                        banType: banType,
                        durationDays: durationDays,
                        banReason: banReason || 'Alamat IP Anda telah dimasukkan ke dalam daftar hitam oleh admin.'
                    })
                });
            }

            if (data.status) {
                if (typeof showToast === 'function') {
                    showToast(data.message || 'Status sanksi akun berhasil diperbarui!');
                }
                if (gid('admin-ban-form-userid')) gid('admin-ban-form-userid').value = '';
                if (gid('admin-ban-form-username')) gid('admin-ban-form-username').value = '';
                if (gid('admin-ban-form-email')) gid('admin-ban-form-email').value = '';
                if (gid('admin-ban-form-ip')) gid('admin-ban-form-ip').value = '';
                gid('admin-ban-form-target-status')?.classList.add('hidden');

                Profile.loadAdminBansList();
                Profile.loadAdminUsersList();
            } else {
                if (typeof showToast === 'function') {
                    showToast(data.message || 'Gagal menerapkan sanksi');
                }
            }
        } catch(e) {
            if (typeof showToast === 'function') {
                showToast('Terjadi kesalahan koneksi');
            }
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.classList.remove('opacity-50');
            }
        }
    },

    renderUserBanCardsHtml(users) {
        if (!users || users.length === 0) return '';

        return users.map(function(u) {
            var banStatus = u.banStatus || { isBanned: false, isWarning: false, banType: 'none', banReason: '' };
            var statusBadgeHtml = '';

            if (banStatus.isBanned) {
                if (u.banType === 'permanent') {
                    statusBadgeHtml = `<span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span> Banned Permanen</span>`;
                } else {
                    statusBadgeHtml = `<span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span> Banned</span>`;
                }
            } else if (banStatus.isWarning || u.banType === 'warning') {
                statusBadgeHtml = `<span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-yellow-400"></span> Banner Peringatan</span>`;
            } else {
                statusBadgeHtml = `<span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Aktif</span>`;
            }

            var unbanBtnHtml = '';
            if (u.banType && u.banType !== 'none') {
                unbanBtnHtml = `
                <button onclick="Profile.quickUnbanUser('${u.id}', '${u.username}')" class="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs border border-emerald-500/40 flex items-center gap-1 active:scale-95 transition-all cursor-pointer shadow-md shadow-emerald-500/10">
                    <i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-emerald-400"></i>
                    <span>Buka Banned</span>
                </button>`;
            }

            return `
            <div class="p-3.5 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all space-y-2.5 shadow-lg">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div class="flex items-center gap-3">
                        <img src="${u.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + u.username}" class="w-10 h-10 rounded-xl object-cover bg-black/40 border border-white/15 shrink-0" alt="${u.username}">
                        <div class="min-w-0">
                            <div class="flex items-center gap-2 flex-wrap">
                                <h4 class="text-xs font-bold text-white truncate flex items-center gap-1">
                                    <span>${u.username}</span>
                                    <span class="global-verified-badge-container inline-flex items-center"></span>
                                </h4>
                                ${statusBadgeHtml}
                            </div>
                            <p class="text-[11px] text-white/60 truncate flex items-center gap-1 mt-0.5">
                                <span>${u.email}</span>
                            </p>
                        </div>
                    </div>

                    <div class="flex items-center gap-2 shrink-0 flex-wrap">
                        <button onclick="Profile.selectUserForBanForm('${esJs(u.username)}', '${esJs(u.email)}', '${esJs(u.lastIp)}', '${esJs(u.id)}')" class="px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 font-bold text-xs border border-sky-500/30 flex items-center gap-1 active:scale-95 transition-all cursor-pointer">
                            <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                            <span>Pilih Akun</span>
                        </button>
                        <button onclick="Profile.quickBanUserIp('${esJs(u.rawLastIp || u.lastIp)}', '${esJs(u.username)}')" class="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold text-xs border border-red-500/30 flex items-center gap-1 active:scale-95 transition-all cursor-pointer" title="Ban Alamat IP penguna ini">
                            <i data-lucide="wifi-off" class="w-3.5 h-3.5 text-red-400"></i>
                            <span>Blacklist IP</span>
                        </button>
                        <button onclick="Profile.confirmAdminDeleteUser('${esJs(u.id)}', '${esJs(u.username)}', '${esJs(u.email)}')" class="px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 text-xs font-bold flex items-center gap-1 active:scale-95 transition-all cursor-pointer shadow-md" title="Hapus Akun Pengguna Secara Permanen">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5 text-red-400"></i>
                            <span>Hapus Akun</span>
                        </button>
                        ${unbanBtnHtml}
                    </div>
                </div>

                <div class="p-2.5 rounded-xl bg-black/30 border border-white/5 space-y-1.5">
                    <div class="flex items-center justify-between text-[11px]">
                        <span class="text-white/40 font-bold">IP TERAKHIR:</span>
                        ${Profile.formatIpDisplay(u.lastIp)}
                    </div>
                    <div class="pt-1.5 border-t border-white/10 text-[11px] font-mono text-amber-300/90 truncate flex items-center justify-between">
                        <span class="text-white/40 font-bold font-sans">USER ID:</span>
                        <span onclick="navigator.clipboard.writeText('${u.id}'); if(typeof showToast==='function') showToast('ID disalin: ${u.id}');" class="cursor-pointer hover:underline flex items-center gap-1" title="Klik untuk Salin User ID">
                            <i data-lucide="fingerprint" class="w-3 h-3 text-amber-400"></i> ${u.id}
                        </span>
                    </div>
                </div>

                ${u.banReason ? `
                <div class="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-200 flex items-start gap-2">
                    <i data-lucide="info" class="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5"></i>
                    <div>
                        <span class="font-bold block text-[10px] uppercase text-rose-300">Pesan Alasan Aktif:</span>
                        <p class="mt-0.5 font-medium leading-normal">${u.banReason}</p>
                    </div>
                </div>` : ''}
            </div>`;
        }).join('');
    },

    filterAdminBansList() {
        var input = gid('admin-ban-search-input');
        var query = (input ? input.value : '').trim().toLowerCase();
        var users = Profile.cachedAdminUsers || [];
        var cardsContainer = gid('admin-bans-cards-list');
        if (!cardsContainer) return;

        var filtered = users.filter(function(u) {
            if (!query) return true;
            var uname = (u.username || '').toLowerCase();
            var email = (u.email || '').toLowerCase();
            var lastIp = (u.lastIp || '').toLowerCase();
            var logsMatch = (u.loginLogs || []).some(function(l) {
                return (l.ip || '').toLowerCase().includes(query);
            });
            return uname.includes(query) || email.includes(query) || lastIp.includes(query) || logsMatch;
        });

        if (filtered.length === 0) {
            cardsContainer.innerHTML = `
            <div class="p-8 text-center rounded-2xl bg-white/[0.03] border border-white/10 text-white/50 text-xs space-y-2">
                <i data-lucide="search-x" class="w-8 h-8 mx-auto text-white/30"></i>
                <p class="font-bold text-white/80">Pengguna Tidak Ditemukan</p>
                <p class="text-[11px] text-white/40">Tidak ada pengguna yang cocok dengan pencarian "${query}".</p>
            </div>`;
            if (window.lucide) lucide.createIcons();
            return;
        }

        cardsContainer.innerHTML = Profile.renderUserBanCardsHtml(filtered);
        if (window.lucide) lucide.createIcons();
        if (typeof Auth !== 'undefined' && typeof Auth.syncVerifiedBadges === 'function') {
            Auth.syncVerifiedBadges();
        }
    },

    async quickUnbanUser(userId, username) {
        var token = Profile.getAdminToken();
        if (!token) {
            if (typeof showToast === 'function') showToast('Sesi admin tidak ditemukan. Silakan login admin kembali.');
            return;
        }

        Profile.showConfirmModal({
            title: 'Buka Banned Akun',
            message: 'Apakah Anda yakin ingin membuka status Banned akun @' + username + '?',
            confirmText: 'Ya, Buka Banned',
            confirmClass: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30',
            onConfirm: async function() {
                try {
                    var res = await fetch('/api/user-auth?action=admin_ban_user', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-admin-token': token
                        },
                        body: JSON.stringify({
                            userId: userId,
                            banType: 'none',
                            durationDays: 0,
                            banReason: ''
                        })
                    });
                    var data = await res.json();

                    if (data.status) {
                        if (typeof showToast === 'function') {
                            showToast('Banned akun @' + username + ' telah dibuka (Status Aktif)!');
                        }
                        Profile.loadAdminUsersList();
                        Profile.loadAdminBansList();
                    } else {
                        if (typeof showToast === 'function') {
                            showToast(data.message || 'Gagal membuka Banned');
                        }
                    }
                } catch(e) {
                    if (typeof showToast === 'function') {
                        showToast('Terjadi kesalahan koneksi');
                    }
                }
            }
        });
    },

    async quickUnbanIp(targetIp) {
        var token = Profile.getAdminToken();
        if (!token) {
            if (typeof showToast === 'function') showToast('Sesi admin tidak ditemukan. Silakan login admin kembali.');
            return;
        }

        Profile.showConfirmModal({
            title: 'Buka Blacklist IP',
            message: 'Apakah Anda yakin ingin menghapus Alamat IP "' + targetIp + '" dari daftar Blacklist IP?',
            confirmText: 'Ya, Buka Blacklist IP',
            confirmClass: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30',
            onConfirm: async function() {
                try {
                    var res = await fetch('/api/user-auth?action=admin_unban_ip', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-admin-token': token
                        },
                        body: JSON.stringify({ targetIp: targetIp })
                    });
                    var data = await res.json();

                    if (data.status) {
                        if (typeof showToast === 'function') {
                            showToast('IP Address ' + targetIp + ' berhasil dihapus dari blacklist!');
                        }
                        Profile.loadAdminBansList();
                        Profile.loadAdminUsersList();
                    } else {
                        if (typeof showToast === 'function') {
                            showToast(data.message || 'Gagal membuka Banned IP');
                        }
                    }
                } catch(e) {
                    if (typeof showToast === 'function') {
                        showToast('Terjadi kesalahan koneksi');
                    }
                }
            }
        });
    },

    formatUserLocalDateTime(isoString) {
        if (!isoString) return 'Belum Pernah';
        try {
            var d = new Date(isoString);
            if (isNaN(d.getTime())) return isoString;
            return d.toLocaleString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }).replace(/\./g, ':') + ' WIB';
        } catch(e) {
            return isoString;
        }
    },

    openAdminBanModal(userId) {
        var users = Profile.cachedAdminUsers || [];
        var u = users.find(function(user) { return user.id === userId; });
        if (!u) return;

        var existing = gid('admin-ban-config-modal');
        if (existing) existing.remove();

        var banType = u.banType || 'none';
        var banReason = u.banReason || '';

        var modal = document.createElement('div');
        modal.id = 'admin-ban-config-modal';
        modal.className = 'fixed inset-0 z-[999999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn pointer-events-auto';
        modal.innerHTML = `
            <div class="relative w-full max-w-lg bg-[#12141c] border border-white/20 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 text-left">
                <!-- Close Button -->
                <button onclick="gid('admin-ban-config-modal')?.remove()" class="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition active:scale-95 cursor-pointer">
                    <i data-lucide="x" class="w-4 h-4"></i>
                </button>

                <!-- Header -->
                <div class="flex items-center gap-3 pr-8">
                    <img src="${u.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + u.username}" class="w-10 h-10 rounded-xl object-cover bg-black/40 border border-white/20" alt="${u.username}">
                    <div>
                        <h3 class="text-base font-bold text-white">Kelola Sanksi / Banned Pengguna</h3>
                        <p class="text-xs text-amber-300 font-semibold">@${u.username} &bull; ${u.email}</p>
                    </div>
                </div>

                <!-- Form -->
                <div class="space-y-3.5 pt-2 border-t border-white/10">
                    <!-- Jenis Sanksi Select -->
                    <div class="space-y-1.5">
                        <label class="text-xs font-bold text-white/80">Pilih Jenis Sanksi / Status Akun</label>
                        <select id="admin-ban-select-type" onchange="Profile.toggleBanDurationInput()" class="w-full bg-black/60 border border-white/15 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all cursor-pointer font-medium">
                            <option value="none" ${banType === 'none' ? 'selected' : ''}>Aktif Bebas Sanksi Buka Banned</option>
                            <option value="permanent" ${banType === 'permanent' ? 'selected' : ''}>Banned Permanen</option>
                            <option value="temporary" ${banType === 'temporary' ? 'selected' : ''}>Banned Durasi Waktu</option>
                            <option value="warning" ${banType === 'warning' ? 'selected' : ''}>Banner Peringatan Saja</option>
                        </select>
                    </div>

                    <!-- Preset Durasi (Untuk Blokir Sementara) -->
                    <div id="admin-ban-duration-container" class="space-y-1.5 ${banType === 'temporary' ? '' : 'hidden'}">
                        <label class="text-xs font-bold text-white/80">Pilih Durasi Banned</label>
                        <select id="admin-ban-duration-select" class="w-full bg-black/60 border border-white/15 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all cursor-pointer font-medium">
                            <option value="1">Hari 24Jam'</option>
                            <option value="5" selected>5Hari</option>
                            <option value="7">7Hari</option>
                            <option value="10">10Hari</option>
                            <option value="20">20Hari</option>
                            <option value="30">1 Bulan 30Hari</option>
                            <option value="60">2 Bulan 60Hari</option>
                            <option value="365">1 Tahun 365Hari</option>
                            <option value="730">2 Tahun 730Hari</option>
                            <option value="1095">3 Tahun 1095Hari</option>
                            <option value="1460">4 Tahun 1460Hari</option>
                            <option value="1825">5 Tahun 1825Hari</option>
                            <option value="3650">10Tahun 3650Hari</option>
                            <option value="10950">30Tahun 10950Hari/option>
                            <option value="14600">40Tahun 14600Har</option>
                            <option value="18250">50Tahun 18250Hari</option>
                            <option value="32850">90Tahun 32850Hari</option>
                            <option value="36500">100Tahun 36500Hari</option>
                        </select>
                    </div>

                    <!-- Pesan / Teks Alasan Blokir -->
                    <div class="space-y-1.5">
                        <label class="text-xs font-bold text-white/80">Teks Pesan Peringatan / Alasan Banned Ditampilkan ke Pengguna</label>
                        <textarea id="admin-ban-reason-text" rows="3" placeholder="Tulis alasan atau pesan peringatan yang akan ditampilkan persis di tengah layar pengguna (misal: Akun Anda diban karena melakukan pelanggaran ketentuan)..." class="w-full bg-black/60 border border-white/15 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none transition-all leading-relaxed font-sans">${banReason || 'Akun Anda telah diblokir atau diberikan peringatan oleh administrator karena adanya pelanggaran ketentuan.'}</textarea>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex flex-col sm:flex-row gap-2 pt-2">
                    <button id="admin-save-ban-btn" onclick="Profile.saveUserBan('${u.id}')" class="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 active:scale-95 transition-all cursor-pointer">
                        <i data-lucide="check-circle" class="w-4 h-4"></i>
                        <span>Simpan & Terapkan Sanksi</span>
                    </button>

                    <button type="button" onclick="Profile.confirmAdminDeleteUser('${esJs(u.id)}', '${esJs(u.username)}', '${esJs(u.email || '')}')" class="py-3 px-4 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer" title="Hapus akun permanen dari server">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                        <span>Hapus Akun</span>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        if (window.lucide) lucide.createIcons();
    },

    toggleBanDurationInput() {
        var typeSelect = gid('admin-ban-select-type');
        var durContainer = gid('admin-ban-duration-container');
        if (!typeSelect || !durContainer) return;
        if (typeSelect.value === 'temporary') {
            durContainer.classList.remove('hidden');
        } else {
            durContainer.classList.add('hidden');
        }
    },

    async saveUserBan(userId) {
        var token = Profile.getAdminToken();
        if (!token) return;

        var typeEl = gid('admin-ban-select-type');
        var durEl = gid('admin-ban-duration-select');
        var reasonEl = gid('admin-ban-reason-text');
        var saveBtn = gid('admin-save-ban-btn');

        var banType = typeEl ? typeEl.value : 'none';
        var durationDays = durEl ? Number(durEl.value) : 0;
        var banReason = reasonEl ? reasonEl.value.trim() : '';

        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> <span>Menyimpan...</span>';
            if (window.lucide) lucide.createIcons();
        }

        try {
            var res = await fetch('/api/user-auth?action=admin_ban_user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-token': token
                },
                body: JSON.stringify({
                    userId: userId,
                    banType: banType,
                    durationDays: durationDays,
                    banReason: banReason
                })
            });
            var data = await res.json();

            if (data.status) {
                if (typeof showToast === 'function') {
                    showToast('Status sanksi pengguna berhasil diperbarui!');
                }
                gid('admin-ban-config-modal')?.remove();
                Profile.loadAdminUsersList();
                Profile.loadAdminBansList();
            } else {
                if (typeof showToast === 'function') {
                    showToast(data.message || 'Gagal menyimpan sanksi');
                }
            }
        } catch(e) {
            if (typeof showToast === 'function') {
                showToast('Terjadi kesalahan koneksi');
            }
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i data-lucide="check-circle" class="w-4 h-4"></i> <span>Simpan & Terapkan Sanksi</span>';
                if (window.lucide) lucide.createIcons();
            }
        }
    },

    deleteUserAccount(userId, username) {
        Profile.confirmAdminDeleteUser(userId, username);
    },

    // ==========================================
    // 9. DYNAMIC QRIS & PAYMENT CONFIGURATOR
    // ==========================================
    pendingQrisBase64: null,
    resetQrisFlag: false,
    cachedPaymentConfig: null,
    adminPaymentAccounts: [],
    adminPaymentPackages: [],
    adminPaymentBenefits: [],

    async renderAdminPaymentTab(silent) {
        var container = gid('admin-payment-container');
        if (!container) return;

        if (!silent && (!container.innerHTML || container.innerHTML.includes('loader-2'))) {
            container.innerHTML = `
            <div class="text-center py-12 text-white/50 space-y-2">
                <i data-lucide="loader-2" class="w-8 h-8 animate-spin mx-auto text-amber-400"></i>
                <p class="text-xs">Memuat konfigurasi QRIS, Paket VIP & Keuntungan...</p>
            </div>`;
            lucide.createIcons();
        }

        try {
            var res = await fetch('/api/payment-config?t=' + Date.now());
            var data = await res.json();
            var config = (data && data.status && data.config) ? data.config : {
                qrisUrl: '/qris.png',
                qrisFilename: 'QRIS-MusifyStar-Nabil.png',
                qrisHolder: 'NABIL (MusifyStar Official)',
                accounts: [
                    { bankName: 'SeaBank', accountNumber: '9012 3456 7890', accountHolder: 'NABIL (MusifyStar)', badge: 'Prioritas Bebas Admin', icon: 'credit-card' },
                    { bankName: 'DANA / GoPay', accountNumber: '0812 3456 7890', accountHolder: 'NABIL', badge: 'E-Wallet', icon: 'smartphone' }
                ],
                packages: [
                    { id: 'pkg_1week', name: 'Paket Mingguan', duration: '7 Hari', price: 7000, originalPrice: 10000, discount: 'Hemat 30%', badge: 'Trial VIP', popular: false, active: true },
                    { id: 'pkg_1month', name: 'Paket Bulanan', duration: '30 Hari', price: 19000, originalPrice: 35000, discount: 'Diskon 45%', badge: 'Paling Populer', popular: true, active: true },
                    { id: 'pkg_3months', name: 'Paket 3 Bulan', duration: '90 Hari', price: 49000, originalPrice: 99000, discount: 'Hemat 50%', badge: 'Terlaris', popular: false, active: true },
                    { id: 'pkg_permanent', name: 'Paket Lifetime', duration: 'Permanen (Selamanya)', price: 99000, originalPrice: 250000, discount: 'Hemat 60%', badge: 'Sultan VIP', popular: false, active: true }
                ],
                benefits: [
                    { id: 'ben_borders', title: 'Akses Bebas Semua Border Profil', desc: 'Gunakan border Master, Legend, Immortal, & Platinum sesuka Anda.', icon: 'shield-check' },
                    { id: 'ben_avatars', title: 'Buka Semua Koleksi Avatar VIP', desc: 'Bebas pakai avatar eksklusif anime, cewek & cowok tanpa batas.', icon: 'sparkles' },
                    { id: 'ben_audio', title: 'Audio Musik Ultra HD & Bebas Iklan', desc: 'Kualitas suara jernih 320kbps tanpa jeda iklan streaming.', icon: 'headphones' },
                    { id: 'ben_crown', title: 'Lencana Mahkota VIP Emas Eksklusif', desc: 'Lencana kebanggaan di profil, komentar lagu, & obrolan komunitas.', icon: 'crown' },
                    { id: 'ben_download', title: 'Download Lagu & Dengarkan Offline', desc: 'Simpan lagu favorit langsung ke perangkat tanpa boros kuota.', icon: 'download' },
                    { id: 'ben_unlimited', title: 'Skip Lagu Sepuasnya & Fitur Tercepat', desc: 'Bebas loncat lagu tanpa batas & dapatkan update fitur musik terbaru duluan.', icon: 'zap' }
                ]
            };

            Profile.cachedPaymentConfig = config;
            Profile.adminPaymentAccounts = JSON.parse(JSON.stringify(config.accounts || []));
            Profile.adminPaymentPackages = JSON.parse(JSON.stringify(config.packages || []));
            Profile.adminPaymentBenefits = JSON.parse(JSON.stringify(config.benefits || []));
            Profile.pendingQrisBase64 = null;
            Profile.resetQrisFlag = false;

            var packagesRows = Profile.getPaymentPackagesHtml();
            var benefitsRows = Profile.getPaymentBenefitsHtml();
            var accountsRows = Profile.getPaymentAccountsHtml();

            container.innerHTML = `
            <div class="space-y-4">
                <!-- Header Banner -->
                <div class="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-transparent border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div class="flex items-center gap-3">
                        <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center text-black shadow-lg shadow-amber-500/25 shrink-0 font-bold">
                            <i data-lucide="qr-code" class="w-6 h-6"></i>
                        </div>
                        <div>
                            <div class="flex items-center gap-2">
                                <h3 class="text-base font-black text-white">Dynamic QRIS & Payment Configurator</h3>
                                <span class="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold px-2 py-0.5 rounded-full font-mono">
                                    LIVE SYNC
                                </span>
                            </div>
                            <p class="text-xs text-white/60 mt-0.5">Ganti barcode QRIS donasi dan nomor rekening bank/e-wallet langsung dari dashboard tanpa edit kode.</p>
                        </div>
                    </div>
                </div>

                <!-- Form Konfigurasi -->
                <div class="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-5">
                    <div id="admin-payment-status" class="hidden p-3 rounded-xl text-xs flex items-center gap-2"></div>

                    <!-- BAGIAN 1: GAMBAR QRIS BARCODE -->
                    <div class="space-y-3">
                        <div class="flex items-center justify-between">
                            <label class="block text-xs font-bold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
                                <i data-lucide="image" class="w-4 h-4 text-amber-400"></i>
                                <span>1. Gambar Barcode QRIS</span>
                            </label>
                            <span class="text-[11px] text-white/40">Mendukung PNG, JPG, WebP</span>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-black/40 border border-white/10">
                            <!-- Live Preview Box -->
                            <div class="flex flex-col items-center justify-center p-3 bg-white/5 rounded-xl border border-white/10">
                                <span class="text-[10px] font-bold text-white/50 mb-2 uppercase tracking-wider">Preview Gambar Aktif</span>
                                <div class="w-36 h-36 rounded-lg bg-black/50 border border-white/10 flex items-center justify-center overflow-hidden p-1 shadow-inner">
                                    <img id="admin-qris-live-preview" src="${config.qrisUrl || '/qris.png'}" alt="Preview QRIS" class="w-full h-full object-contain rounded" onerror="this.src='/qris.png'" />
                                </div>
                                <span id="admin-qris-preview-label" class="text-[10px] text-amber-300 mt-2 font-mono truncate max-w-[140px]">
                                    ${config.qrisUrl ? 'QRIS Custom' : 'Default /qris.png'}
                                </span>
                            </div>

                            <!-- Upload & Action Controls -->
                            <div class="sm:col-span-2 space-y-3 flex flex-col justify-center">
                                <div>
                                    <input type="file" id="admin-qris-file-input" accept="image/png,image/jpeg,image/webp" onchange="Profile.handleQrisFileSelect(event)" class="hidden" />
                                    <button type="button" onclick="gid('admin-qris-file-input')?.click()" class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-600 hover:to-emerald-600 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer">
                                        <i data-lucide="upload" class="w-4 h-4"></i>
                                        <span>Unggah Gambar Barcode QRIS Baru Dari HP/PC</span>
                                    </button>
                                </div>

                                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                    <div>
                                        <label class="block text-[11px] font-semibold text-white/50 mb-1">Nama Pemilik / Merchant QRIS:</label>
                                        <input type="text" id="admin-qris-holder-input" value="${Profile.escapeHtml(config.qrisHolder || 'NABIL (MusifyStar Official)')}" placeholder="NABIL (MusifyStar Official)" class="w-full px-3 py-2 bg-black/60 border border-white/15 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400 transition shadow-inner" />
                                    </div>
                                    <div>
                                        <label class="block text-[11px] font-semibold text-white/50 mb-1">Link Gambar QRIS (URL):</label>
                                        <input type="text" id="admin-qris-url-input" value="${config.qrisUrl || '/qris.png'}" placeholder="/qris.png atau https://..." class="w-full px-3 py-2 bg-black/60 border border-white/15 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400 transition shadow-inner" oninput="Profile.onQrisUrlInputChange(this.value)" />
                                    </div>
                                    <div>
                                        <label class="block text-[11px] font-semibold text-emerald-400 mb-1">Nomor WhatsApp Admin Support:</label>
                                        <input type="text" id="admin-whatsapp-input" value="${Profile.escapeHtml(config.adminWhatsapp || '6281234567890')}" placeholder="Contoh: 6281234567890" class="w-full px-3 py-2 bg-black/60 border border-emerald-500/30 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-emerald-400 transition shadow-inner" />
                                    </div>
                                </div>

                                <div class="pt-1 flex items-center gap-2">
                                    <button type="button" onclick="Profile.resetQrisDefault()" class="py-2 px-3 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/40 text-white/80 hover:text-white text-xs font-semibold transition active:scale-95 flex items-center gap-1.5 cursor-pointer">
                                        <i data-lucide="rotate-ccw" class="w-3.5 h-3.5 text-rose-400"></i>
                                        <span>Reset ke QRIS Bawaan Asli (/qris.png)</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- BAGIAN 2: KELOLA PILIHAN PAKET VIP (FOTO 4) -->
                    <div class="space-y-3 pt-3 border-t border-white/10">
                        <div class="flex items-center justify-between">
                            <div>
                                <label class="block text-xs font-bold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
                                    <i data-lucide="layers" class="w-4 h-4 text-amber-400"></i>
                                    <span>2. Pilihan Paket Berlangganan VIP</span>
                                </label>
                                <p class="text-[11px] text-white/50">Admin dapat mengubah nama, durasi, harga promo, diskon, dan status aktif paket.</p>
                            </div>
                            <button type="button" onclick="Profile.addPaymentPackageRow()" class="py-1.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer">
                                <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                                <span>+ Tambah Paket VIP</span>
                            </button>
                        </div>

                        <div id="admin-payment-packages-list" class="space-y-3">
                            ${packagesRows}
                        </div>
                    </div>

                    <!-- BAGIAN 3: KELOLA KEUNTUNGAN MEMBER MUSIFYSTAR (FOTO 4) -->
                    <div class="space-y-3 pt-3 border-t border-white/10">
                        <div class="flex items-center justify-between">
                            <div>
                                <label class="block text-xs font-bold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
                                    <i data-lucide="sparkles" class="w-4 h-4 text-emerald-400"></i>
                                    <span>3. Keuntungan Member MusifyStar</span>
                                </label>
                                <p class="text-[11px] text-white/50">Poin keuntungan yang ditampilkan pada halaman beli VIP (Foto 3).</p>
                            </div>
                            <button type="button" onclick="Profile.addPaymentBenefitRow()" class="py-1.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer">
                                <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                                <span>+ Tambah Keuntungan</span>
                            </button>
                        </div>

                        <div id="admin-payment-benefits-list" class="space-y-2.5">
                            ${benefitsRows}
                        </div>
                    </div>

                    <!-- BAGIAN 4: NOMOR REKENING BANK & E-WALLET DONASI -->
                    <div class="space-y-3 pt-3 border-t border-white/10">
                        <div class="flex items-center justify-between">
                            <label class="block text-xs font-bold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
                                <i data-lucide="credit-card" class="w-4 h-4 text-sky-400"></i>
                                <span>4. Nomor Rekening Bank & E-Wallet Donasi</span>
                            </label>
                            <button type="button" onclick="Profile.addPaymentAccountRow()" class="py-1.5 px-3 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer">
                                <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                                <span>+ Tambah Rekening</span>
                            </button>
                        </div>

                        <div id="admin-payment-accounts-list" class="space-y-2.5">
                            ${accountsRows}
                        </div>
                    </div>

                    <!-- TOMBOL SIMPAN SEMUA -->
                    <div class="pt-4 border-t border-white/10 flex items-center justify-end">
                        <button type="button" id="admin-payment-save-btn" onclick="Profile.savePaymentConfig(event)" class="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-emerald-400 hover:from-amber-500 hover:to-emerald-500 active:scale-95 text-black font-black text-xs sm:text-sm shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer">
                            <i data-lucide="check-circle" class="w-4 h-4 text-black"></i>
                            <span>Simpan Semua Perubahan (QRIS, Paket VIP & Keuntungan)</span>
                        </button>
                    </div>
                </div>
            </div>`;

            lucide.createIcons();
        } catch (e) {
            container.innerHTML = `
            <div class="text-center py-12 text-red-400 space-y-2">
                <i data-lucide="alert-triangle" class="w-8 h-8 mx-auto"></i>
                <p class="text-xs font-semibold">Gagal memuat konfigurasi pembayaran.</p>
            </div>`;
            lucide.createIcons();
        }
    },

    getPaymentPackagesHtml() {
        if (!Array.isArray(Profile.adminPaymentPackages) || Profile.adminPaymentPackages.length === 0) {
            return `
            <div class="p-4 rounded-xl bg-white/5 border border-white/10 text-center text-xs text-white/40">
                Belum ada paket VIP. Klik tombol "+ Tambah Paket VIP" di atas.
            </div>`;
        }

        return Profile.adminPaymentPackages.map(function(pkg, idx) {
            return `
            <div class="p-3.5 rounded-2xl bg-black/50 border border-white/10 space-y-2.5 relative group hover:border-amber-400/40 transition-all">
                <div class="flex items-center justify-between gap-2 border-b border-white/5 pb-2">
                    <div class="flex items-center gap-2">
                        <span class="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                            <i data-lucide="package" class="w-3.5 h-3.5 text-amber-400"></i>
                            <span>Paket #${idx + 1} (${Profile.escapeHtml(pkg.name || 'Paket')})</span>
                        </span>
                        ${pkg.popular ? '<span class="text-[9px] bg-amber-400 text-black font-extrabold px-1.5 py-0.2 rounded-md">POPULER</span>' : ''}
                        ${pkg.active === false ? '<span class="text-[9px] bg-red-500/20 text-red-300 font-bold px-1.5 py-0.2 rounded-md">NONAKTIF</span>' : ''}
                    </div>
                    <button type="button" onclick="Profile.removePaymentPackageRow(${idx})" class="p-1 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-500/10 transition-all cursor-pointer" title="Hapus Paket">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div>
                        <label class="block text-[11px] text-white/50 mb-1">Nama Paket:</label>
                        <input type="text" id="pkg-name-${idx}" value="${Profile.escapeHtml(pkg.name || '')}" placeholder="Paket Bulanan" class="w-full px-3 py-2 bg-black/60 border border-white/15 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400 transition" />
                    </div>
                    <div>
                        <label class="block text-[11px] text-white/50 mb-1">Durasi:</label>
                        <input type="text" id="pkg-duration-${idx}" value="${Profile.escapeHtml(pkg.duration || '')}" placeholder="30 Hari, 1 Minggu, Permanen" class="w-full px-3 py-2 bg-black/60 border border-white/15 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400 transition" />
                    </div>
                    <div>
                        <label class="block text-[11px] text-white/50 mb-1">Harga Promo (Rp):</label>
                        <input type="number" id="pkg-price-${idx}" value="${pkg.price || 0}" placeholder="19000" class="w-full px-3 py-2 bg-black/60 border border-white/15 rounded-xl text-amber-400 font-mono text-xs focus:outline-none focus:border-amber-400 transition font-bold" />
                    </div>
                    <div>
                        <label class="block text-[11px] text-white/50 mb-1">Harga Normal/Coret (Rp):</label>
                        <input type="number" id="pkg-origprice-${idx}" value="${pkg.originalPrice || 0}" placeholder="35000" class="w-full px-3 py-2 bg-black/60 border border-white/15 rounded-xl text-white/60 font-mono text-xs focus:outline-none focus:border-amber-400 transition" />
                    </div>
                    <div>
                        <label class="block text-[11px] text-white/50 mb-1">Badge / Tag Promo:</label>
                        <input type="text" id="pkg-badge-${idx}" value="${Profile.escapeHtml(pkg.badge || '')}" placeholder="Paling Populer, Terlaris, Sultan VIP" class="w-full px-3 py-2 bg-black/60 border border-white/15 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400 transition" />
                    </div>
                    <div>
                        <label class="block text-[11px] text-white/50 mb-1">Label Diskon:</label>
                        <input type="text" id="pkg-discount-${idx}" value="${Profile.escapeHtml(pkg.discount || '')}" placeholder="Diskon 45%, Hemat 30%" class="w-full px-3 py-2 bg-black/60 border border-white/15 rounded-xl text-emerald-300 text-xs focus:outline-none focus:border-amber-400 transition" />
                    </div>
                </div>

                <div class="flex items-center gap-5 pt-1 text-xs text-white/70">
                    <label class="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" id="pkg-popular-${idx}" ${pkg.popular ? 'checked' : ''} class="accent-amber-400 rounded">
                        <span class="text-[11px]">Tandai sebagai Rekomendasi Populer (Glowing)</span>
                    </label>
                    <label class="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" id="pkg-active-${idx}" ${pkg.active !== false ? 'checked' : ''} class="accent-emerald-400 rounded">
                        <span class="text-[11px]">Paket Aktif (Tampil di Pembelian)</span>
                    </label>
                </div>
            </div>`;
        }).join('');
    },

    addPaymentPackageRow() {
        Profile.syncPaymentPackagesFromDom();
        Profile.adminPaymentPackages.push({
            id: 'pkg_' + Date.now(),
            name: 'Paket VIP Baru',
            duration: '30 Hari',
            price: 25000,
            originalPrice: 50000,
            discount: 'Diskon 50%',
            badge: 'Spesial',
            popular: false,
            active: true
        });
        var container = gid('admin-payment-packages-list');
        if (container) {
            container.innerHTML = Profile.getPaymentPackagesHtml();
            lucide.createIcons();
        }
    },

    removePaymentPackageRow(idx) {
        Profile.syncPaymentPackagesFromDom();
        Profile.adminPaymentPackages.splice(idx, 1);
        var container = gid('admin-payment-packages-list');
        if (container) {
            container.innerHTML = Profile.getPaymentPackagesHtml();
            lucide.createIcons();
        }
    },

    syncPaymentPackagesFromDom() {
        if (!Array.isArray(Profile.adminPaymentPackages)) return;
        Profile.adminPaymentPackages.forEach(function(pkg, idx) {
            var n = gid(`pkg-name-${idx}`);
            var d = gid(`pkg-duration-${idx}`);
            var p = gid(`pkg-price-${idx}`);
            var op = gid(`pkg-origprice-${idx}`);
            var b = gid(`pkg-badge-${idx}`);
            var dc = gid(`pkg-discount-${idx}`);
            var pop = gid(`pkg-popular-${idx}`);
            var act = gid(`pkg-active-${idx}`);

            if (n) pkg.name = n.value.trim();
            if (d) pkg.duration = d.value.trim();
            if (p) pkg.price = Number(p.value) || 0;
            if (op) pkg.originalPrice = Number(op.value) || 0;
            if (b) pkg.badge = b.value.trim();
            if (dc) pkg.discount = dc.value.trim();
            if (pop) pkg.popular = pop.checked;
            if (act) pkg.active = act.checked;
        });
    },

    getPaymentBenefitsHtml() {
        if (!Array.isArray(Profile.adminPaymentBenefits) || Profile.adminPaymentBenefits.length === 0) {
            return `
            <div class="p-4 rounded-xl bg-white/5 border border-white/10 text-center text-xs text-white/40">
                Belum ada keuntungan member. Klik tombol "+ Tambah Keuntungan" di atas.
            </div>`;
        }

        return Profile.adminPaymentBenefits.map(function(ben, idx) {
            return `
            <div class="p-3.5 rounded-2xl bg-black/50 border border-white/10 space-y-2.5 relative group hover:border-emerald-400/40 transition-all">
                <div class="flex items-center justify-between gap-2 border-b border-white/5 pb-2">
                    <span class="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <i data-lucide="${Profile.escapeHtml(ben.icon || 'sparkles')}" class="w-3.5 h-3.5 text-emerald-400"></i>
                        <span>Keuntungan #${idx + 1}</span>
                    </span>
                    <button type="button" onclick="Profile.removePaymentBenefitRow(${idx})" class="p-1 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-500/10 transition-all cursor-pointer" title="Hapus Keuntungan">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div class="sm:col-span-1">
                        <label class="block text-[11px] text-white/50 mb-1">Judul Keuntungan:</label>
                        <input type="text" id="ben-title-${idx}" value="${Profile.escapeHtml(ben.title || '')}" placeholder="Akses Bebas Semua Border Profil" class="w-full px-3 py-2 bg-black/60 border border-white/15 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-400 transition" />
                    </div>
                    <div class="sm:col-span-1">
                        <label class="block text-[11px] text-white/50 mb-1">Nama Icon (Lucide):</label>
                        <input type="text" id="ben-icon-${idx}" value="${Profile.escapeHtml(ben.icon || 'shield-check')}" placeholder="shield-check, sparkles, headphones, crown, download, zap" class="w-full px-3 py-2 bg-black/60 border border-white/15 rounded-xl text-emerald-300 font-mono text-xs focus:outline-none focus:border-emerald-400 transition" />
                    </div>
                    <div class="sm:col-span-1 sm:col-start-1 sm:col-span-3">
                        <label class="block text-[11px] text-white/50 mb-1">Deskripsi Penjelasan:</label>
                        <input type="text" id="ben-desc-${idx}" value="${Profile.escapeHtml(ben.desc || '')}" placeholder="Gunakan border Master, Legend, Immortal, & Platinum sesuka Anda." class="w-full px-3 py-2 bg-black/60 border border-white/15 rounded-xl text-white/80 text-xs focus:outline-none focus:border-emerald-400 transition" />
                    </div>
                </div>
            </div>`;
        }).join('');
    },

    addPaymentBenefitRow() {
        Profile.syncPaymentBenefitsFromDom();
        Profile.adminPaymentBenefits.push({
            id: 'ben_' + Date.now(),
            title: 'Keuntungan Baru',
            desc: 'Deskripsi keuntungan member eksklusif MusifyStar.',
            icon: 'check-circle'
        });
        var container = gid('admin-payment-benefits-list');
        if (container) {
            container.innerHTML = Profile.getPaymentBenefitsHtml();
            lucide.createIcons();
        }
    },

    removePaymentBenefitRow(idx) {
        Profile.syncPaymentBenefitsFromDom();
        Profile.adminPaymentBenefits.splice(idx, 1);
        var container = gid('admin-payment-benefits-list');
        if (container) {
            container.innerHTML = Profile.getPaymentBenefitsHtml();
            lucide.createIcons();
        }
    },

    syncPaymentBenefitsFromDom() {
        if (!Array.isArray(Profile.adminPaymentBenefits)) return;
        Profile.adminPaymentBenefits.forEach(function(ben, idx) {
            var t = gid(`ben-title-${idx}`);
            var ic = gid(`ben-icon-${idx}`);
            var d = gid(`ben-desc-${idx}`);

            if (t) ben.title = t.value.trim();
            if (ic) ben.icon = ic.value.trim();
            if (d) ben.desc = d.value.trim();
        });
    },

    getPaymentAccountsHtml() {
        if (!Array.isArray(Profile.adminPaymentAccounts) || Profile.adminPaymentAccounts.length === 0) {
            return `
            <div class="p-4 rounded-xl bg-white/5 border border-white/10 text-center text-xs text-white/40">
                Belum ada rekening donasi yang dibuat. Klik tombol "+ Tambah Rekening" di atas.
            </div>`;
        }

        return Profile.adminPaymentAccounts.map(function(acc, idx) {
            return `
            <div class="p-3.5 rounded-2xl bg-black/50 border border-white/10 space-y-2.5 relative group hover:border-amber-500/40 transition-all">
                <div class="flex items-center justify-between gap-2 border-b border-white/5 pb-2">
                    <span class="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                        <i data-lucide="credit-card" class="w-3.5 h-3.5 text-amber-400"></i>
                        <span>Rekening #${idx + 1}</span>
                    </span>
                    <button type="button" onclick="Profile.removePaymentAccountRow(${idx})" class="p-1 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-500/10 transition-all cursor-pointer" title="Hapus Rekening">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div>
                        <label class="block text-[11px] text-white/50 mb-1">Nama Bank / E-Wallet:</label>
                        <input type="text" id="acc-bank-${idx}" value="${Profile.escapeHtml(acc.bankName || '')}" placeholder="SeaBank, BCA, DANA, GoPay" class="w-full px-3 py-2 bg-black/60 border border-white/15 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400 transition" />
                    </div>
                    <div>
                        <label class="block text-[11px] text-white/50 mb-1">Nomor Rekening / No. HP:</label>
                        <input type="text" id="acc-number-${idx}" value="${Profile.escapeHtml(acc.accountNumber || '')}" placeholder="9012 3456 7890" class="w-full px-3 py-2 bg-black/60 border border-white/15 rounded-xl text-amber-400 font-mono text-xs focus:outline-none focus:border-amber-400 transition font-bold" />
                    </div>
                    <div>
                        <label class="block text-[11px] text-white/50 mb-1">Atas Nama (Holder):</label>
                        <input type="text" id="acc-holder-${idx}" value="${Profile.escapeHtml(acc.accountHolder || '')}" placeholder="NABIL (MusifyStar)" class="w-full px-3 py-2 bg-black/60 border border-white/15 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400 transition" />
                    </div>
                    <div>
                        <label class="block text-[11px] text-white/50 mb-1">Badge Keterangan:</label>
                        <input type="text" id="acc-badge-${idx}" value="${Profile.escapeHtml(acc.badge || '')}" placeholder="Prioritas Bebas Admin, E-Wallet" class="w-full px-3 py-2 bg-black/60 border border-white/15 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400 transition" />
                    </div>
                </div>
            </div>`;
        }).join('');
    },

    handleQrisFileSelect(event) {
        var file = event.target.files && event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            if (typeof showToast === 'function') showToast('Pilih file gambar valid (PNG, JPG, WebP)');
            return;
        }

        var reader = new FileReader();
        reader.onload = function(e) {
            var rawData = e.target.result;
            // Optimize image size to ensure crisp barcode while keeping payload lean
            var img = new Image();
            img.onload = function() {
                var canvas = document.createElement('canvas');
                var maxDim = 800;
                var w = img.width;
                var h = img.height;
                if (w > maxDim || h > maxDim) {
                    if (w > h) {
                        h = Math.round((h * maxDim) / w);
                        w = maxDim;
                    } else {
                        w = Math.round((w * maxDim) / h);
                        h = maxDim;
                    }
                }
                canvas.width = w;
                canvas.height = h;
                var ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                var compressed = canvas.toDataURL('image/png');

                Profile.pendingQrisBase64 = compressed;
                Profile.resetQrisFlag = false;

                var previewImg = gid('admin-qris-live-preview');
                if (previewImg) previewImg.src = compressed;

                var label = gid('admin-qris-preview-label');
                if (label) label.innerText = 'Foto Baru Dipilih (' + Math.round(file.size / 1024) + ' KB)';

                var urlInp = gid('admin-qris-url-input');
                if (urlInp) urlInp.value = '[File Gambar Baru Siap Disimpan]';

                if (typeof showToast === 'function') {
                    showToast('Gambar QRIS dipilih. Klik Simpan untuk menerapkan.');
                }
            };
            img.src = rawData;
        };
        reader.readAsDataURL(file);
    },

    onQrisUrlInputChange(val) {
        if (!val || val.startsWith('[File')) return;
        Profile.pendingQrisBase64 = null;
        Profile.resetQrisFlag = false;
        var previewImg = gid('admin-qris-live-preview');
        if (previewImg) previewImg.src = val;
        var label = gid('admin-qris-preview-label');
        if (label) label.innerText = 'Custom URL';
    },

    resetQrisDefault() {
        Profile.resetQrisFlag = true;
        Profile.pendingQrisBase64 = null;
        var previewImg = gid('admin-qris-live-preview');
        if (previewImg) previewImg.src = '/qris.png';
        var label = gid('admin-qris-preview-label');
        if (label) label.innerText = 'Default /qris.png';
        var urlInp = gid('admin-qris-url-input');
        if (urlInp) urlInp.value = '/qris.png';
        if (typeof showToast === 'function') {
            showToast('QRIS diatur ke bawaan asli (/qris.png)');
        }
    },

    addPaymentAccountRow() {
        Profile.syncPaymentAccountsFromDom();
        Profile.adminPaymentAccounts.push({
            bankName: '',
            accountNumber: '',
            accountHolder: '',
            badge: 'Bebas Admin'
        });
        var container = gid('admin-payment-accounts-list');
        if (container) {
            container.innerHTML = Profile.getPaymentAccountsHtml();
            lucide.createIcons();
        }
    },

    removePaymentAccountRow(idx) {
        Profile.syncPaymentAccountsFromDom();
        Profile.adminPaymentAccounts.splice(idx, 1);
        var container = gid('admin-payment-accounts-list');
        if (container) {
            container.innerHTML = Profile.getPaymentAccountsHtml();
            lucide.createIcons();
        }
    },

    syncPaymentAccountsFromDom() {
        if (!Array.isArray(Profile.adminPaymentAccounts)) return;
        Profile.adminPaymentAccounts.forEach(function(acc, idx) {
            var b = gid(`acc-bank-${idx}`);
            var n = gid(`acc-number-${idx}`);
            var h = gid(`acc-holder-${idx}`);
            var bg = gid(`acc-badge-${idx}`);
            if (b) acc.bankName = b.value.trim();
            if (n) acc.accountNumber = n.value.trim();
            if (h) acc.accountHolder = h.value.trim();
            if (bg) acc.badge = bg.value.trim();
        });
    },

    async savePaymentConfig(event) {
        if (event && event.preventDefault) event.preventDefault();
        var token = Profile.getAdminToken();
        if (!token) return;

        Profile.syncPaymentAccountsFromDom();
        Profile.syncPaymentPackagesFromDom();
        Profile.syncPaymentBenefitsFromDom();

        var title = (gid('admin-payment-title')?.value || '').trim();
        var desc = (gid('admin-payment-desc')?.value || '').trim();
        var note = (gid('admin-payment-note')?.value || '').trim();
        var holder = (gid('admin-qris-holder-input')?.value || '').trim();
        var urlInput = (gid('admin-qris-url-input')?.value || '').trim();
        var adminWa = (gid('admin-whatsapp-input')?.value || '').trim();
        var statusBox = gid('admin-payment-status');
        var saveBtn = gid('admin-payment-save-btn');

        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.classList.add('opacity-70');
            saveBtn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Menyimpan Konfigurasi...</span>';
            lucide.createIcons();
        }

        var payload = {
            title: title || 'MusifyStar VIP Membership',
            description: desc,
            note: note,
            qrisHolder: holder || 'NABIL (MusifyStar Official)',
            adminWhatsapp: adminWa || '6281234567890',
            accounts: Profile.adminPaymentAccounts.filter(function(a){ return a.bankName || a.accountNumber; }),
            packages: Profile.adminPaymentPackages,
            benefits: Profile.adminPaymentBenefits
        };

        if (Profile.resetQrisFlag) {
            payload.resetDefault = true;
        } else if (Profile.pendingQrisBase64) {
            payload.qrisBase64 = Profile.pendingQrisBase64;
        } else if (urlInput && !urlInput.startsWith('[File')) {
            payload.qrisUrl = urlInput;
        }

        try {
            var res = await fetch('/api/payment-config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-token': token
                },
                body: JSON.stringify(payload)
            });
            var data = await res.json();

            if (data.status) {
                Profile.cachedPaymentConfig = data.config;
                Profile.pendingQrisBase64 = null;
                Profile.resetQrisFlag = false;

                if (typeof showToast === 'function') {
                    showToast('Konfigurasi QRIS, Paket VIP & Keuntungan Member berhasil diperbarui!');
                }

                if (statusBox) {
                    statusBox.className = 'p-3 rounded-xl text-xs flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300';
                    statusBox.innerHTML = '<i data-lucide="check-circle" class="w-4 h-4 shrink-0"></i><span>Konfigurasi QRIS, Paket VIP & Keuntungan Member berhasil disimpan dan langsung aktif di aplikasi!</span>';
                    statusBox.classList.remove('hidden');
                    lucide.createIcons();
                }

                Profile.renderAdminPaymentTab(true);
            } else {
                if (statusBox) {
                    statusBox.className = 'p-3 rounded-xl text-xs flex items-center gap-2 bg-red-500/15 border border-red-500/30 text-red-300';
                    statusBox.innerHTML = '<i data-lucide="alert-circle" class="w-4 h-4 shrink-0"></i><span>' + (data.message || 'Gagal menyimpan konfigurasi') + '</span>';
                    statusBox.classList.remove('hidden');
                    lucide.createIcons();
                }
            }
        } catch(e) {
            if (statusBox) {
                statusBox.className = 'p-3 rounded-xl text-xs flex items-center gap-2 bg-red-500/15 border border-red-500/30 text-red-300';
                statusBox.innerHTML = '<i data-lucide="wifi-off" class="w-4 h-4 shrink-0"></i><span>Koneksi bermasalah saat menyimpan.</span>';
                statusBox.classList.remove('hidden');
                lucide.createIcons();
            }
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.classList.remove('opacity-70');
                saveBtn.innerHTML = '<i data-lucide="check-circle" class="w-4 h-4"></i><span>Simpan Semua Perubahan (QRIS, Paket VIP & Keuntungan)</span>';
                lucide.createIcons();
            }
        }
    },

    // ==========================================
    // 10. DIRECT USER MESSAGING (ADMIN TO USER)
    // ==========================================
    adminMsgRecipientMode: 'user',
    adminRegisteredUsers: [],

    async renderAdminMessagesTab(silent) {
        if (window.AdminChat && typeof window.AdminChat.renderAdminChatTab === 'function') {
            return window.AdminChat.renderAdminChatTab('admin-messages-container');
        }
        var container = gid('admin-messages-container');
        if (!container) return;

        if (!silent && (!container.innerHTML || container.innerHTML.includes('loader-2'))) {
            container.innerHTML = `
            <div class="text-center py-12 text-white/50 space-y-2">
                <i data-lucide="loader-2" class="w-8 h-8 animate-spin mx-auto text-emerald-400"></i>
                <p class="text-xs">Memuat modul pesan & daftar pengguna...</p>
            </div>`;
            lucide.createIcons();
        }

        var token = Profile.getAdminToken();
        if (!token) return;

        try {
            // Ambil daftar user terdaftar dan riwayat pesan
            var [usersRes, msgsRes] = await Promise.all([
                fetch('/api/user-auth?action=admin_get_users', { headers: { 'x-admin-token': token } }),
                fetch('/api/messages?action=admin_list', { headers: { 'x-admin-token': token } })
            ]);

            var usersData = await usersRes.json().catch(function() { return { status: false }; });
            var msgsData = await msgsRes.json().catch(function() { return { status: false }; });

            var users = (usersData && usersData.status && Array.isArray(usersData.users)) ? usersData.users : (Array.isArray(Profile.cachedAdminUsers) ? Profile.cachedAdminUsers : []);
            var sentMessages = (msgsData && msgsData.status && Array.isArray(msgsData.messages)) ? msgsData.messages : [];
            Profile.adminRegisteredUsers = users;
            Profile.cachedAdminUsers = users;

            var userOptionsHtml = users.map(function(u) {
                var disp = '@' + u.username + ' (' + (u.email || 'Tanpa Email') + ')';
                return `<option value="${Profile.escapeHtml(u.id)}" data-username="${Profile.escapeHtml(u.username)}">${disp}</option>`;
            }).join('');

            var historyHtml = '';
            if (sentMessages.length > 0) {
                historyHtml = sentMessages.map(function(m) {
                    var dateStr = new Date(m.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
                    var priorityBadge = '';
                    if (m.priority === 'warning') priorityBadge = '<span class="text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.5 rounded font-bold">PERINGATAN</span>';
                    else if (m.priority === 'important') priorityBadge = '<span class="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold">PENTING</span>';
                    else if (m.priority === 'vip') priorityBadge = '<span class="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded font-bold">VIP</span>';
                    else priorityBadge = '<span class="text-[9px] bg-sky-500/20 text-sky-300 border border-sky-500/30 px-1.5 py-0.5 rounded font-bold">INFO</span>';

                    var recBadge = m.recipientType === 'all'
                        ? '<span class="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><i data-lucide="users" class="w-3 h-3"></i> Semua Pengguna (Broadcast)</span>'
                        : '<span class="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><i data-lucide="user" class="w-3 h-3"></i> @' + Profile.escapeHtml(m.recipientName || m.recipientId) + '</span>';

                    return `
                    <div class="p-3.5 rounded-2xl bg-black/40 border border-white/10 hover:border-white/20 transition-all space-y-2">
                        <div class="flex items-center justify-between gap-2">
                            <div class="flex items-center gap-2 flex-wrap">
                                ${recBadge}
                                ${priorityBadge}
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="text-[11px] text-white/40">${dateStr}</span>
                                <button type="button" onclick="Profile.deleteAdminMessage('${esJs(m.id)}')" class="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer" title="Hapus Pesan">
                                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                                </button>
                            </div>
                        </div>
                        <h5 class="text-xs sm:text-sm font-bold text-white tracking-wide">${Profile.escapeHtml(m.title)}</h5>
                        <p class="text-xs text-white/70 whitespace-pre-wrap leading-relaxed">${Profile.escapeHtml(m.body)}</p>
                        ${m.actionUrl ? `
                        <div class="pt-1">
                            <span class="text-[11px] text-cyan-400/80 font-mono truncate block">Tautan: ${Profile.escapeHtml(m.actionUrl)}</span>
                        </div>` : ''}
                    </div>`;
                }).join('');
            } else {
                historyHtml = '<p class="text-xs text-white/50 text-center py-8">Belum ada riwayat pesan yang dikirim oleh admin.</p>';
            }

            container.innerHTML = `
            <div class="space-y-4">
                <!-- Header Banner -->
                <div class="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div class="flex items-center gap-3">
                        <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 shrink-0">
                            <i data-lucide="send" class="w-6 h-6"></i>
                        </div>
                        <div>
                            <div class="flex items-center gap-2">
                                <h3 class="text-base font-black text-white">Direct User Messaging (Admin ke Pengguna)</h3>
                                <span class="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold px-2 py-0.5 rounded-full font-mono">
                                    INBOX LIVE
                                </span>
                            </div>
                            <p class="text-xs text-white/60 mt-0.5">Kirim pesan langsung ke kotak masuk akun pengguna tertentu atau siarkan pengumuman ke seluruh pengguna.</p>
                        </div>
                    </div>
                </div>

                <!-- FORM KIRIM PESAN -->
                <div class="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                    <div id="admin-msg-status" class="hidden p-3 rounded-xl text-xs flex items-center gap-2"></div>

                    <!-- Target Recipient Switcher -->
                    <div>
                        <label class="block text-xs font-bold text-white/80 uppercase tracking-wider mb-2">
                            Pilih Target Penerima Pesan:
                        </label>
                        <div class="grid grid-cols-2 gap-2">
                            <button type="button" id="btn-msg-target-user" onclick="Profile.toggleAdminMsgRecipientMode('user')" class="py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20">
                                <i data-lucide="user" class="w-4 h-4"></i>
                                <span>Pesan Pribadi (Direct ke Pengguna)</span>
                            </button>
                            <button type="button" id="btn-msg-target-all" onclick="Profile.toggleAdminMsgRecipientMode('all')" class="py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer bg-white/5 hover:bg-white/10 text-white/70">
                                <i data-lucide="users" class="w-4 h-4"></i>
                                <span>Pesan Siaran (Semua Pengguna)</span>
                            </button>
                        </div>
                    </div>

                    <!-- User Picker (Only visible when mode is 'user') -->
                    <div id="admin-msg-user-picker-container" class="space-y-2.5 p-3.5 rounded-2xl bg-black/40 border border-white/10">
                        <label class="block text-xs font-bold text-white/80 uppercase tracking-wider">
                            Pilih Akun Pengguna Terdaftar (${users.length} Akun):
                        </label>
                        <select id="admin-msg-user-select" onchange="Profile.onAdminMsgUserSelectChange()" class="w-full bg-black/60 border border-white/15 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition cursor-pointer">
                            <option value="">-- Pilih akun dari daftar pengguna terdaftar --</option>
                            ${userOptionsHtml}
                        </select>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            <div>
                                <label class="block text-[11px] text-white/50 mb-1">User ID Tujuan:</label>
                                <input type="text" id="admin-msg-user-id" placeholder="ID Pengguna" class="w-full px-3 py-2 bg-black/60 border border-white/15 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-emerald-400 transition" />
                            </div>
                            <div>
                                <label class="block text-[11px] text-white/50 mb-1">Username Tujuan:</label>
                                <input type="text" id="admin-msg-user-name" placeholder="Username Pengguna" class="w-full px-3 py-2 bg-black/60 border border-white/15 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-400 transition" />
                            </div>
                        </div>
                    </div>

                    <!-- Priority Selector & Title -->
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label class="block text-xs font-bold text-white/80 uppercase tracking-wider mb-1.5">
                                Prioritas Pesan:
                            </label>
                            <select id="admin-msg-priority" class="w-full bg-black/60 border border-white/15 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition cursor-pointer">
                                <option value="info">Info / Normal (Biru)</option>
                                <option value="important">Penting / Notifikasi (Kuning)</option>
                                <option value="warning">Peringatan / Sanksi (Merah)</option>
                                <option value="vip">VIP / Eksklusif (Ungu)</option>
                            </select>
                        </div>
                        <div class="sm:col-span-2">
                            <label class="block text-xs font-bold text-white/80 uppercase tracking-wider mb-1.5">
                                Judul Pesan: <span class="text-rose-400">*</span>
                            </label>
                            <input type="text" id="admin-msg-title" placeholder="Contoh: Pemberitahuan Akun Anda / Bonus Spesial" class="w-full px-3.5 py-2.5 bg-black/60 border border-white/15 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-400 transition shadow-inner font-bold" />
                        </div>
                    </div>

                    <!-- Isi Pesan (Body) -->
                    <div>
                        <label class="block text-xs font-bold text-white/80 uppercase tracking-wider mb-1.5">
                            Isi Pesan: <span class="text-rose-400">*</span>
                        </label>
                        <textarea id="admin-msg-body" rows="3" placeholder="Tuliskan isi pesan pribadi atau instruksi untuk pengguna..." class="w-full px-3.5 py-2.5 bg-black/60 border border-white/15 rounded-xl text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-emerald-400 transition shadow-inner leading-relaxed"></textarea>
                    </div>

                    <!-- Tautan Aksi (Opsional) -->
                    <div>
                        <label class="block text-xs font-bold text-white/80 uppercase tracking-wider mb-1.5">
                            Tautan Aksi / Link Tombol (Opsional):
                        </label>
                        <input type="text" id="admin-msg-action-url" placeholder="Contoh: /#profile atau https://..." class="w-full px-3.5 py-2.5 bg-black/60 border border-white/15 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-emerald-400 transition shadow-inner" />
                    </div>

                    <!-- Submit Button -->
                    <div class="pt-2 border-t border-white/10 flex items-center justify-end">
                        <button type="button" id="admin-msg-send-btn" onclick="Profile.sendAdminMessage(event)" class="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer">
                            <i data-lucide="send" class="w-4 h-4"></i>
                            <span>Kirim Pesan Sekarang</span>
                        </button>
                    </div>
                </div>

                <!-- RIWAYAT PESAN TERKIRIM -->
                <div class="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                    <div class="flex items-center justify-between">
                        <h4 class="text-xs font-bold text-white/80 uppercase tracking-wider flex items-center gap-2">
                            <i data-lucide="history" class="w-4 h-4 text-emerald-400"></i>
                            <span>Riwayat Pesan Terkirim (${sentMessages.length})</span>
                        </h4>
                        <button type="button" onclick="Profile.renderAdminMessagesTab(false)" class="text-[11px] text-white/50 hover:text-white flex items-center gap-1 cursor-pointer transition">
                            <i data-lucide="refresh-cw" class="w-3 h-3"></i> Segarkan
                        </button>
                    </div>

                    <div id="admin-sent-messages-list" class="space-y-2.5 max-h-[45vh] overflow-y-auto hide-scrollbar">
                        ${historyHtml}
                    </div>
                </div>
            </div>`;

            lucide.createIcons();
        } catch(e) {
            container.innerHTML = `
            <div class="text-center py-12 text-red-400 space-y-2">
                <i data-lucide="alert-triangle" class="w-8 h-8 mx-auto"></i>
                <p class="text-xs font-semibold">Gagal memuat modul pesan admin.</p>
            </div>`;
            lucide.createIcons();
        }
    },

    toggleAdminMsgRecipientMode(mode) {
        Profile.adminMsgRecipientMode = mode;
        var btnUser = gid('btn-msg-target-user');
        var btnAll = gid('btn-msg-target-all');
        var pickerContainer = gid('admin-msg-user-picker-container');

        var activeClass = 'py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20';
        var inactiveClass = 'py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer bg-white/5 hover:bg-white/10 text-white/70';

        if (btnUser) btnUser.className = mode === 'user' ? activeClass : inactiveClass;
        if (btnAll) btnAll.className = mode === 'all' ? activeClass : inactiveClass;
        if (pickerContainer) pickerContainer.classList.toggle('hidden', mode === 'all');
    },

    onAdminMsgUserSelectChange() {
        var select = gid('admin-msg-user-select');
        if (!select) return;
        var selectedOpt = select.options[select.selectedIndex];
        var idInp = gid('admin-msg-user-id');
        var nameInp = gid('admin-msg-user-name');

        if (selectedOpt && selectedOpt.value) {
            if (idInp) idInp.value = selectedOpt.value;
            if (nameInp) nameInp.value = selectedOpt.getAttribute('data-username') || '';
        }
    },

    async sendAdminMessage(event) {
        if (event && event.preventDefault) event.preventDefault();
        var token = Profile.getAdminToken();
        if (!token) return;

        var mode = Profile.adminMsgRecipientMode || 'user';
        var userId = (gid('admin-msg-user-id')?.value || '').trim();
        var username = (gid('admin-msg-user-name')?.value || '').trim();
        var priority = gid('admin-msg-priority')?.value || 'info';
        var title = (gid('admin-msg-title')?.value || '').trim();
        var body = (gid('admin-msg-body')?.value || '').trim();
        var actionUrl = (gid('admin-msg-action-url')?.value || '').trim();
        var statusBox = gid('admin-msg-status');
        var sendBtn = gid('admin-msg-send-btn');

        if (!title || !body) {
            if (statusBox) {
                statusBox.className = 'p-3 rounded-xl text-xs flex items-center gap-2 bg-red-500/15 border border-red-500/30 text-red-300';
                statusBox.innerHTML = '<i data-lucide="alert-circle" class="w-4 h-4 shrink-0"></i><span>Judul dan isi pesan wajib diisi.</span>';
                statusBox.classList.remove('hidden');
                lucide.createIcons();
            }
            return;
        }

        if (mode === 'user' && !userId && !username) {
            if (statusBox) {
                statusBox.className = 'p-3 rounded-xl text-xs flex items-center gap-2 bg-red-500/15 border border-red-500/30 text-red-300';
                statusBox.innerHTML = '<i data-lucide="alert-circle" class="w-4 h-4 shrink-0"></i><span>Silakan pilih akun pengguna tujuan terlebih dahulu.</span>';
                statusBox.classList.remove('hidden');
                lucide.createIcons();
            }
            return;
        }

        if (sendBtn) {
            sendBtn.disabled = true;
            sendBtn.classList.add('opacity-70');
            sendBtn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Mengirim Pesan...</span>';
            lucide.createIcons();
        }

        try {
            var res = await fetch('/api/messages?action=admin_send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-token': token
                },
                body: JSON.stringify({
                    recipientType: mode,
                    recipientId: userId || username,
                    recipientName: username || userId,
                    priority: priority,
                    title: title,
                    body: body,
                    actionUrl: actionUrl
                })
            });
            var data = await res.json();

            if (data.status) {
                if (typeof showToast === 'function') {
                    showToast(data.message || 'Pesan berhasil dikirim!');
                }

                if (statusBox) {
                    statusBox.className = 'p-3 rounded-xl text-xs flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300';
                    statusBox.innerHTML = '<i data-lucide="check-circle" class="w-4 h-4 shrink-0"></i><span>' + data.message + '</span>';
                    statusBox.classList.remove('hidden');
                    lucide.createIcons();
                }

                // Reset fields
                if (gid('admin-msg-title')) gid('admin-msg-title').value = '';
                if (gid('admin-msg-body')) gid('admin-msg-body').value = '';
                if (gid('admin-msg-action-url')) gid('admin-msg-action-url').value = '';

                Profile.renderAdminMessagesTab(true);
            } else {
                if (statusBox) {
                    statusBox.className = 'p-3 rounded-xl text-xs flex items-center gap-2 bg-red-500/15 border border-red-500/30 text-red-300';
                    statusBox.innerHTML = '<i data-lucide="alert-circle" class="w-4 h-4 shrink-0"></i><span>' + (data.message || 'Gagal mengirim pesan') + '</span>';
                    statusBox.classList.remove('hidden');
                    lucide.createIcons();
                }
            }
        } catch(e) {
            if (statusBox) {
                statusBox.className = 'p-3 rounded-xl text-xs flex items-center gap-2 bg-red-500/15 border border-red-500/30 text-red-300';
                statusBox.innerHTML = '<i data-lucide="wifi-off" class="w-4 h-4 shrink-0"></i><span>Koneksi bermasalah saat mengirim pesan.</span>';
                statusBox.classList.remove('hidden');
                lucide.createIcons();
            }
        } finally {
            if (sendBtn) {
                sendBtn.disabled = false;
                sendBtn.classList.remove('opacity-70');
                sendBtn.innerHTML = '<i data-lucide="send" class="w-4 h-4"></i><span>Kirim Pesan Sekarang</span>';
                lucide.createIcons();
            }
        }
    },

    async deleteAdminMessage(id) {
        var token = Profile.getAdminToken();
        if (!token) {
            if (typeof showToast === 'function') showToast('Sesi admin tidak ditemukan. Silakan login kembali.');
            return;
        }
        if (!id) return;

        Profile.showConfirmModal({
            title: 'Hapus Pesan Admin',
            message: 'Apakah Anda yakin ingin menghapus pesan ini secara permanen dari riwayat pesan admin?',
            confirmText: 'Ya, Hapus Pesan',
            confirmClass: 'bg-red-600 hover:bg-red-700 shadow-red-500/40',
            onConfirm: async function() {
                try {
                    var res = await fetch('/api/messages?action=admin_delete', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-admin-token': token
                        },
                        body: JSON.stringify({ id: id })
                    });
                    var data = await res.json();
                    if (data && data.status) {
                        if (typeof showToast === 'function') showToast('Pesan berhasil dihapus');
                        Profile.renderAdminMessagesTab(true);
                    } else {
                        if (typeof showToast === 'function') showToast(data?.message || 'Gagal menghapus pesan');
                    }
                } catch(e) {
                    if (typeof showToast === 'function') showToast('Terjadi kesalahan jaringan saat menghapus pesan');
                }
            }
        });
    },

    // ==========================================
    // 11. USER INBOX & NOTIFICATIONS
    // ==========================================
    lastSeenUserUnreadCount: 0,

    async checkUserInboxBadge() {
        var u = (typeof Auth !== 'undefined' && Auth.currentUser) ? Auth.currentUser : null;
        var userId = u ? (u.id || u.uid) : 'guest';
        var username = u ? (u.username || '') : '';
        var token = localStorage.getItem('musifystar_auth_token') || sessionStorage.getItem('musifystar_auth_token');

        var headers = {};
        if (token) headers['Authorization'] = 'Bearer ' + token;
        headers['x-user-id'] = userId;
        headers['x-user-name'] = username;

        try {
            var res = await fetch(`/api/messages?action=user_inbox&userId=${encodeURIComponent(userId)}&username=${encodeURIComponent(username)}`, { headers: headers });
            var data = await res.json();

            if (data && data.status) {
                var badgeEl = gid('user-inbox-badge');
                var count = data.unreadCount || 0;
                if (badgeEl) {
                    if (count > 0) {
                        badgeEl.innerText = count > 99 ? '99+' : count;
                        badgeEl.classList.remove('hidden');
                    } else {
                        badgeEl.classList.add('hidden');
                    }
                }

                // If new unread message arrived
                if (count > Profile.lastSeenUserUnreadCount && Profile.lastSeenUserUnreadCount > 0) {
                    if (data.messages && data.messages.length > 0) {
                        var latest = data.messages[0];
                        if (!latest.isRead && typeof showToast === 'function') {
                            showToast('🔔 Pesan dari Admin: ' + latest.title);
                        }
                    }
                }
                Profile.lastSeenUserUnreadCount = count;
            }
        } catch(e) {}
    },

    async openUserInboxModal() {
        Profile.openWhatsAppSupport('Halo Admin MusifyStar, saya membutuhkan bantuan mengenai akun/layanan.');
    },

    closeUserInboxModal() {
        var modal = gid('musifystar-user-inbox-modal');
        if (modal) modal.remove();
        Profile.checkUserInboxBadge();
    },

    async markUserMessageRead(msgId) {
        var u = (typeof Auth !== 'undefined' && Auth.currentUser) ? Auth.currentUser : null;
        var userId = u ? (u.id || u.uid) : 'guest';
        var username = u ? (u.username || '') : '';
        var token = localStorage.getItem('musifystar_auth_token') || sessionStorage.getItem('musifystar_auth_token');

        var headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = 'Bearer ' + token;
        headers['x-user-id'] = userId;
        headers['x-user-name'] = username;

        try {
            await fetch('/api/messages?action=user_mark_read', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ messageId: msgId })
            });
            Profile.checkUserInboxBadge();
        } catch(e) {}
    },

    async markAllUserMessagesRead() {
        var u = (typeof Auth !== 'undefined' && Auth.currentUser) ? Auth.currentUser : null;
        var userId = u ? (u.id || u.uid) : 'guest';
        var username = u ? (u.username || '') : '';
        var token = localStorage.getItem('musifystar_auth_token') || sessionStorage.getItem('musifystar_auth_token');

        var headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = 'Bearer ' + token;
        headers['x-user-id'] = userId;
        headers['x-user-name'] = username;

        try {
            await fetch('/api/messages?action=user_mark_all_read', {
                method: 'POST',
                headers: headers
            });
            if (typeof showToast === 'function') {
                showToast('Semua pesan ditandai telah dibaca');
            }
            Profile.openUserInboxModal();
            Profile.checkUserInboxBadge();
        } catch(e) {}
    },

    escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    // ============================================================
    // TAB 12: MANAJEMEN KOLEKSI AVATAR (ADMIN VIP & KUNCI)
    // ============================================================
    adminAvatarFilterTab: 'all', // 'all' | 'gratis' | 'cowo' | 'cewe'
    cachedAdminAvatars: [],
    pendingAvatarFileBase64: null,

    async renderAdminAvatarsTab() {
        var container = gid('admin-avatars-container');
        if (!container) return;

        Profile.adminAvatarFilterTab = 'all';

        container.innerHTML = `
            <div class="space-y-5">
                <!-- Header Card Info & Form Tambah Avatar -->
                <div class="p-4 sm:p-5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-sm font-bold text-white flex items-center gap-2">
                                <i data-lucide="palette" class="w-4 h-4 text-[#ccff00]"></i>
                                <span>Koleksi Avatar Pengguna</span>
                            </h3>
                            <p class="text-xs text-white/50 mt-0.5">Kelola avatar profil yang tersedia untuk semua pengguna. Anda bisa memasukkan avatar ke tab Gratis (Campur) atau tab VIP (Cewek & Cowok).</p>
                        </div>
                    </div>

                    <!-- Form Tambah Avatar Baru (Mirip Sistem QRIS: Ambil Dari Galeri -> Avatar-MusifyStar.png) -->
                    <form onsubmit="Profile.handleAddAvatar(event)" class="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-4">
                        <div class="flex items-center justify-between border-b border-white/10 pb-2.5">
                            <div class="text-xs font-bold text-white flex items-center gap-2">
                                <i data-lucide="image-plus" class="w-4 h-4 text-[#ccff00]"></i>
                                <span>Unggah / Tambah Avatar Baru</span>
                            </div>
                            <span class="text-[10px] text-white/40 font-mono">Simpan Otomatis &bull; Avatar-MusifyStar.png</span>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                            <!-- Preview Box -->
                            <div class="flex flex-col items-center justify-center p-3 bg-white/5 rounded-2xl border border-white/10">
                                <span class="text-[10px] font-bold text-white/50 mb-2 uppercase tracking-wider">Preview Avatar</span>
                                <div class="w-24 h-24 rounded-2xl bg-black/60 border-2 border-white/20 flex items-center justify-center overflow-hidden p-1 shadow-inner relative group">
                                    <img id="admin-avatar-live-preview" src="/logo.png" alt="Preview" class="w-full h-full object-cover rounded-xl" onerror="this.src='/logo.png'" />
                                </div>
                                <span id="admin-avatar-preview-label" class="text-[10px] text-[#ccff00] mt-2 font-mono truncate max-w-[140px]">
                                    Belum Ada Foto
                                </span>
                            </div>

                            <!-- Upload & Input Form Controls -->
                            <div class="sm:col-span-2 space-y-3">
                                <div>
                                    <label class="block text-[11px] font-semibold text-white/70 mb-1">Nama Avatar:</label>
                                    <input type="text" id="admin-new-avatar-name" placeholder="Contoh: Anime Star Boy" class="w-full text-xs py-2.5 px-3 bg-black/60 border border-white/15 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#ccff00] transition-colors" required />
                                </div>

                                <div>
                                    <!-- Hidden File Input for Gallery Selection -->
                                    <input type="file" id="admin-avatar-file-input" accept="image/png,image/jpeg,image/webp,image/gif" onchange="Profile.handleAvatarFileSelect(event)" class="hidden" />
                                    <button type="button" onclick="gid('admin-avatar-file-input')?.click()" class="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-[#ccff00] to-emerald-400 hover:from-[#b8e600] hover:to-emerald-500 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer">
                                        <i data-lucide="image" class="w-4 h-4 text-black"></i>
                                        <span>Ambil Foto Dari Galeri HP/PC</span>
                                    </button>
                                </div>

                                <div class="relative">
                                    <label class="block text-[10px] font-semibold text-white/40 mb-1">Atau masukkan link gambar (Opsional jika upload galeri):</label>
                                    <input type="url" id="admin-new-avatar-url" placeholder="https://..." class="w-full text-xs py-2 px-3 bg-black/60 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-[#ccff00] font-mono text-[11px]" oninput="Profile.onAvatarUrlInputChange(this.value)" />
                                </div>
                            </div>
                        </div>

                        <!-- PILIHAN TAB TUJUAN: Gratis (Campur), VIP Cowo, VIP Cewe -->
                        <div class="pt-2 border-t border-white/10 space-y-2">
                            <label class="block text-[11px] font-semibold text-white/80">Masukkan Foto ke Tab Mana:</label>
                            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                <label class="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/15 cursor-pointer transition-all has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-500/15">
                                    <input type="radio" name="admin_avatar_target_tab" id="admin-tab-opt-gratis" value="gratis" checked class="w-4 h-4 accent-emerald-400 cursor-pointer" />
                                    <div>
                                        <div class="text-xs font-bold text-white flex items-center gap-1.5">
                                            <i data-lucide="sparkles" class="w-3.5 h-3.5 text-emerald-400"></i>
                                            <span>Avatar Gratis</span>
                                        </div>
                                        <span class="text-[10px] text-white/50 block mt-0.5">Campur &bull; Semua User</span>
                                    </div>
                                </label>

                                <label class="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/15 cursor-pointer transition-all has-[:checked]:border-sky-400 has-[:checked]:bg-sky-500/15">
                                    <input type="radio" name="admin_avatar_target_tab" id="admin-tab-opt-cowo" value="cowo" class="w-4 h-4 accent-sky-400 cursor-pointer" />
                                    <div>
                                        <div class="text-xs font-bold text-white flex items-center gap-1.5">
                                            <i data-lucide="crown" class="w-3.5 h-3.5 text-amber-400"></i>
                                            <span class="text-sky-300">VIP &bull; Cowok</span>
                                        </div>
                                        <span class="text-[10px] text-white/50 block mt-0.5">Khusus VIP &bull; Cowo</span>
                                    </div>
                                </label>

                                <label class="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/15 cursor-pointer transition-all has-[:checked]:border-pink-400 has-[:checked]:bg-pink-500/15">
                                    <input type="radio" name="admin_avatar_target_tab" id="admin-tab-opt-cewe" value="cewe" class="w-4 h-4 accent-pink-400 cursor-pointer" />
                                    <div>
                                        <div class="text-xs font-bold text-white flex items-center gap-1.5">
                                            <i data-lucide="crown" class="w-3.5 h-3.5 text-amber-400"></i>
                                            <span class="text-pink-300">VIP &bull; Cewek</span>
                                        </div>
                                        <span class="text-[10px] text-white/50 block mt-0.5">Khusus VIP &bull; Cewe</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div class="flex items-center justify-end pt-2 border-t border-white/10">
                            <button type="submit" id="admin-btn-save-avatar" class="px-6 py-2.5 rounded-xl bg-[#ccff00] hover:bg-[#b8e600] active:scale-95 text-black font-extrabold text-xs transition-all shadow-md cursor-pointer flex items-center gap-2">
                                <i data-lucide="check" class="w-4 h-4"></i>
                                <span>Simpan Avatar</span>
                            </button>
                        </div>
                    </form>
                </div>

                <!-- List Avatar yang ada dengan Filter Tab -->
                <div class="space-y-3">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
                        <div>
                            <h4 class="text-xs font-bold uppercase tracking-wider text-white/70">Daftar Avatar Aktif</h4>
                            <p class="text-[11px] text-white/40">Gunakan filter untuk melihat avatar per tab atau ubah kategori langsung</p>
                        </div>
                        <span id="admin-avatars-count" class="text-xs font-mono text-white/50 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10 self-start sm:self-auto">Memuat...</span>
                    </div>

                    <!-- TAB FILTER LIST DI ADMIN: Semua, Gratis (Campur), VIP Cowok, VIP Cewek -->
                    <div class="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.04] border border-white/10 text-xs overflow-x-auto hide-scrollbar">
                        <button type="button" id="admin-avfilter-all" onclick="Profile.filterAdminAvatarsList('all')" 
                                class="py-1.5 px-3 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-white/20 text-white shrink-0">
                            <span>Semua</span>
                        </button>
                        <button type="button" id="admin-avfilter-gratis" onclick="Profile.filterAdminAvatarsList('gratis')" 
                                class="py-1.5 px-3 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer text-emerald-300/70 hover:text-emerald-300 hover:bg-emerald-500/10 shrink-0">
                            <i data-lucide="sparkles" class="w-3.5 h-3.5 text-emerald-400"></i>
                            <span>Gratis (Campur)</span>
                        </button>
                        <button type="button" id="admin-avfilter-cowo" onclick="Profile.filterAdminAvatarsList('cowo')" 
                                class="py-1.5 px-3 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer text-sky-300/70 hover:text-sky-300 hover:bg-sky-500/10 shrink-0">
                            <i data-lucide="crown" class="w-3.5 h-3.5 text-amber-400"></i>
                            <span>VIP (Cowok)</span>
                        </button>
                        <button type="button" id="admin-avfilter-cewe" onclick="Profile.filterAdminAvatarsList('cewe')" 
                                class="py-1.5 px-3 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer text-pink-300/70 hover:text-pink-300 hover:bg-pink-500/10 shrink-0">
                            <i data-lucide="crown" class="w-3.5 h-3.5 text-amber-400"></i>
                            <span>VIP (Cewek)</span>
                        </button>
                    </div>

                    <div id="admin-avatars-list-grid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        <div class="col-span-full text-center py-10 text-white/40">
                            <i data-lucide="loader-2" class="w-6 h-6 animate-spin mx-auto text-[#ccff00] mb-2"></i>
                            <p class="text-xs">Memuat daftar avatar...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        if (window.lucide) lucide.createIcons();
        Profile.loadAdminAvatarsList();
    },

    async loadAdminAvatarsList() {
        var grid = gid('admin-avatars-list-grid');
        var countEl = gid('admin-avatars-count');
        if (!grid) return;

        try {
            var res = await fetch('/api/avatars');
            var data = await res.json();

            if (data && data.status && Array.isArray(data.avatars)) {
                Profile.cachedAdminAvatars = data.avatars;
                Profile.renderAdminAvatarsGrid();
            } else {
                Profile.cachedAdminAvatars = [];
                grid.innerHTML = '<div class="col-span-full text-center py-8 text-white/40 text-xs">Belum ada avatar tersimpan.</div>';
                if (countEl) countEl.innerText = '0 Avatar';
            }
        } catch(e) {
            grid.innerHTML = '<div class="col-span-full text-center py-8 text-rose-400 text-xs">Gagal memuat daftar avatar.</div>';
        }
    },

    filterAdminAvatarsList(tab) {
        Profile.adminAvatarFilterTab = tab;

        var btnAll = gid('admin-avfilter-all');
        var btnGratis = gid('admin-avfilter-gratis');
        var btnCowo = gid('admin-avfilter-cowo');
        var btnCewe = gid('admin-avfilter-cewe');

        var activeAll = 'py-1.5 px-3 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-white/20 text-white shrink-0';
        var activeGratis = 'py-1.5 px-3 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0';
        var activeCowo = 'py-1.5 px-3 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-sky-500/20 text-sky-300 border border-sky-500/40 shrink-0';
        var activeCewe = 'py-1.5 px-3 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-pink-500/20 text-pink-300 border border-pink-500/40 shrink-0';

        var inAll = 'py-1.5 px-3 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer text-white/60 hover:text-white hover:bg-white/5 shrink-0';
        var inGratis = 'py-1.5 px-3 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer text-emerald-300/70 hover:text-emerald-300 hover:bg-emerald-500/10 shrink-0';
        var inCowo = 'py-1.5 px-3 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer text-sky-300/70 hover:text-sky-300 hover:bg-sky-500/10 shrink-0';
        var inCewe = 'py-1.5 px-3 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer text-pink-300/70 hover:text-pink-300 hover:bg-pink-500/10 shrink-0';

        if (btnAll) btnAll.className = tab === 'all' ? activeAll : inAll;
        if (btnGratis) btnGratis.className = tab === 'gratis' ? activeGratis : inGratis;
        if (btnCowo) btnCowo.className = tab === 'cowo' ? activeCowo : inCowo;
        if (btnCewe) btnCewe.className = tab === 'cewe' ? activeCewe : inCewe;

        Profile.renderAdminAvatarsGrid();
    },

    renderAdminAvatarsGrid() {
        var grid = gid('admin-avatars-list-grid');
        var countEl = gid('admin-avatars-count');
        if (!grid) return;

        var avatars = Profile.cachedAdminAvatars || [];
        var filter = Profile.adminAvatarFilterTab || 'all';

        var filtered = avatars.filter(function(av) {
            if (filter === 'gratis') return !av.isPremium || av.category === 'gratis';
            if (filter === 'cowo') return !!av.isPremium && av.category === 'cowo';
            if (filter === 'cewe') return !!av.isPremium && av.category === 'cewe';
            return true;
        });

        if (countEl) countEl.innerText = filtered.length + ' / ' + avatars.length + ' Avatar';

        if (filtered.length === 0) {
            grid.innerHTML = '<div class="col-span-full text-center py-8 text-white/40 text-xs">Tidak ada avatar pada filter ini.</div>';
            return;
        }

        grid.innerHTML = filtered.map(function(av) {
            var isFree = !av.isPremium || av.category === 'gratis';
            var isCowo = av.isPremium && av.category === 'cowo';
            var isCewe = av.isPremium && av.category === 'cewe';

            return `
                <div class="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 flex flex-col justify-between space-y-2.5 transition-all">
                    <!-- Image Box -->
                    <div class="relative aspect-square rounded-xl overflow-hidden bg-black/40 border border-white/10 group">
                        <img src="${av.url}" class="w-full h-full object-cover rounded-xl" alt="${Profile.escapeHtml(av.name)}" onerror="this.src='/logo.png'">
                        
                        <!-- Badges -->
                        ${isFree ? `
                            <div class="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-emerald-500/90 text-white font-bold text-[9px] shadow-md flex items-center gap-1">
                                <i data-lucide="sparkles" class="w-2.5 h-2.5"></i>
                                <span>GRATIS</span>
                            </div>
                        ` : isCowo ? `
                            <div class="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-sky-500 text-white font-extrabold text-[9px] flex items-center gap-0.5 shadow-md">
                                <i data-lucide="crown" class="w-2.5 h-2.5 fill-white"></i>
                                <span>VIP COWO</span>
                            </div>
                        ` : `
                            <div class="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-pink-500 text-white font-extrabold text-[9px] flex items-center gap-0.5 shadow-md">
                                <i data-lucide="crown" class="w-2.5 h-2.5 fill-white"></i>
                                <span>VIP CEWE</span>
                            </div>
                        `}
                    </div>

                    <!-- Info -->
                    <div>
                        <h5 class="text-xs font-bold text-white truncate">${Profile.escapeHtml(av.name)}</h5>
                        <p class="text-[10px] text-white/50 truncate font-mono mt-0.5">
                            ${isFree ? '🟢 Gratis (Campur)' : (isCowo ? '⚡ VIP Cowok' : '🌸 VIP Cewek')}
                        </p>
                    </div>

                    <!-- Category Switcher Dropdown (Pindah Tab Langsung) -->
                    <div class="space-y-1.5 pt-1 border-t border-white/10">
                        <label class="block text-[9px] text-white/40 uppercase font-bold tracking-wider">Tab / Kategori:</label>
                        <select onchange="Profile.changeAvatarCategory('${av.id}', this.value)" 
                                class="w-full text-[11px] font-semibold py-1.5 px-2 bg-black/70 border border-white/15 rounded-xl text-white focus:outline-none focus:border-[#ccff00] cursor-pointer">
                            <option value="gratis" ${isFree ? 'selected' : ''}>🟢 Gratis (Campur)</option>
                            <option value="cowo" ${isCowo ? 'selected' : ''}>⚡ VIP Cowok</option>
                            <option value="cewe" ${isCewe ? 'selected' : ''}>🌸 VIP Cewek</option>
                        </select>
                    </div>

                    <!-- Action Button (Hapus / Tong Sampah) -->
                    <div class="pt-1">
                        <button type="button" onclick="event.stopPropagation(); Profile.deleteAvatarFromAdmin('${av.id}')" 
                                class="w-full py-2 px-2.5 rounded-xl text-[11px] font-bold bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm" title="Hapus Avatar">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5 text-rose-400 pointer-events-none"></i>
                            <span class="pointer-events-none">Hapus Avatar</span>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        if (window.lucide) lucide.createIcons();
    },

    handleAvatarFileSelect(event) {
        var file = event.target.files && event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showToast('Pilih file gambar valid (PNG, JPG, WebP, GIF)');
            return;
        }

        var reader = new FileReader();
        reader.onload = function(e) {
            var rawDataUrl = e.target.result;
            // Resize / compress avatar nicely via canvas (300x300)
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

                var compressed = canvas.toDataURL('image/png');
                Profile.pendingAvatarFileBase64 = compressed;

                var previewImg = gid('admin-avatar-live-preview');
                if (previewImg) previewImg.src = compressed;

                var label = gid('admin-avatar-preview-label');
                if (label) label.innerText = 'Foto Siap (' + Math.round(file.size / 1024) + ' KB)';

                var urlInp = gid('admin-new-avatar-url');
                if (urlInp) urlInp.value = '';

                showToast('Foto avatar dipilih! Nama file akan jadi Avatar-MusifyStar.png');
            };
            img.src = rawDataUrl;
        };
        reader.readAsDataURL(file);
    },

    onAvatarUrlInputChange(val) {
        if (!val) return;
        Profile.pendingAvatarFileBase64 = null;
        var previewImg = gid('admin-avatar-live-preview');
        if (previewImg) previewImg.src = val;
        var label = gid('admin-avatar-preview-label');
        if (label) label.innerText = 'Custom URL';
    },

    async handleAddAvatar(event) {
        if (event && event.preventDefault) event.preventDefault();
        var nameInput = gid('admin-new-avatar-name');
        var urlInput = gid('admin-new-avatar-url');
        var btn = gid('admin-btn-save-avatar');

        // Target tab pilihan: 'gratis' | 'cowo' | 'cewe'
        var targetTab = 'gratis';
        var radioSelected = document.querySelector('input[name="admin_avatar_target_tab"]:checked');
        if (radioSelected) {
            targetTab = radioSelected.value;
        }

        var name = (nameInput ? nameInput.value : '').trim();
        var url = (urlInput ? urlInput.value : '').trim();
        var fileBase64 = Profile.pendingAvatarFileBase64 || null;

        if (!fileBase64 && !url) {
            showToast('Pilih foto avatar dari galeri atau masukkan link gambar');
            return;
        }

        var token = Profile.getAdminToken();
        var authEmail = (typeof Auth !== 'undefined' && Auth.currentUser) ? (Auth.currentUser.email || '') : '';
        if (btn) btn.disabled = true;

        showToast('Menyimpan avatar ke tab ' + (targetTab === 'gratis' ? 'Gratis' : (targetTab === 'cowo' ? 'VIP Cowok' : 'VIP Cewek')) + '...');

        try {
            var headers = {
                'Content-Type': 'application/json',
                'x-admin-token': token,
                'x-user-email': authEmail
            };
            if (token) headers['Authorization'] = 'Bearer ' + token;

            var res = await fetch('/api/avatars?action=add', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ 
                    name: name, 
                    url: url, 
                    fileBase64: fileBase64, 
                    targetTab: targetTab,
                    category: targetTab,
                    isPremium: targetTab !== 'gratis'
                })
            });
            var data = await res.json();
            if (data && data.status) {
                showToast(data.message || 'Avatar baru berhasil disimpan!');
                Profile.pendingAvatarFileBase64 = null;
                if (nameInput) nameInput.value = '';
                if (urlInput) urlInput.value = '';
                
                var previewImg = gid('admin-avatar-live-preview');
                if (previewImg) previewImg.src = '/logo.png';
                var label = gid('admin-avatar-preview-label');
                if (label) label.innerText = 'Belum Ada Foto';

                Profile.loadAdminAvatarsList();
            } else {
                showToast(data?.message || 'Gagal menambahkan avatar');
            }
        } catch(e) {
            showToast('Koneksi bermasalah saat simpan');
        } finally {
            if (btn) btn.disabled = false;
        }
    },

    async changeAvatarCategory(id, newCategory) {
        var token = Profile.getAdminToken();
        var authEmail = (typeof Auth !== 'undefined' && Auth.currentUser) ? (Auth.currentUser.email || '') : '';

        showToast('Memindahkan kategori avatar...');
        try {
            var headers = {
                'Content-Type': 'application/json',
                'x-admin-token': token,
                'x-user-email': authEmail
            };
            if (token) headers['Authorization'] = 'Bearer ' + token;

            var res = await fetch('/api/avatars?action=set_category', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ 
                    id: id, 
                    category: newCategory,
                    isPremium: newCategory !== 'gratis'
                })
            });
            var data = await res.json();
            if (data && data.status) {
                showToast(data.message || 'Kategori avatar berhasil diubah');
                Profile.loadAdminAvatarsList();
            } else {
                showToast(data?.message || 'Gagal mengubah kategori');
            }
        } catch(e) {
            showToast('Koneksi bermasalah');
        }
    },

    async toggleAvatarPremium(id, newStatus) {
        var token = Profile.getAdminToken();
        var authEmail = (typeof Auth !== 'undefined' && Auth.currentUser) ? (Auth.currentUser.email || '') : '';
        try {
            var headers = {
                'Content-Type': 'application/json',
                'x-admin-token': token,
                'x-user-email': authEmail
            };
            if (token) headers['Authorization'] = 'Bearer ' + token;

            var res = await fetch('/api/avatars?action=toggle_premium', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ id: id, isPremium: newStatus })
            });
            var data = await res.json();
            if (data && data.status) {
                showToast(data.message);
                Profile.loadAdminAvatarsList();
            } else {
                showToast(data?.message || 'Gagal mengubah status');
            }
        } catch(e) {
            showToast('Koneksi bermasalah');
        }
    },

    deleteAvatarFromAdmin(id) {
        var avatar = (Profile.cachedAdminAvatars || []).find(function(a) { return a.id === id; });
        var avatarName = avatar ? avatar.name : 'Avatar ini';

        Profile.showConfirmModal({
            title: 'Hapus Avatar dari Katalog',
            message: `Apakah Anda yakin ingin menghapus "${avatarName}"? Pengguna tidak akan dapat memilih avatar ini lagi.`,
            confirmText: 'Ya, Hapus Avatar',
            confirmClass: 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/30',
            onConfirm: async function() {
                var token = Profile.getAdminToken();
                var authEmail = (typeof Auth !== 'undefined' && Auth.currentUser) ? (Auth.currentUser.email || '') : '';

                try {
                    var headers = {
                        'Content-Type': 'application/json',
                        'x-admin-token': token,
                        'x-user-email': authEmail
                    };
                    if (token) headers['Authorization'] = 'Bearer ' + token;

                    var res = await fetch('/api/avatars?action=delete', {
                        method: 'POST',
                        headers: headers,
                        body: JSON.stringify({ id: id })
                    });
                    var data = await res.json();
                    if (data && data.status) {
                        showToast('Avatar berhasil dihapus dari katalog');
                        Profile.loadAdminAvatarsList();
                    } else {
                        showToast(data?.message || 'Gagal menghapus avatar');
                    }
                } catch(e) {
                    showToast('Koneksi bermasalah saat menghapus avatar');
                }
            }
        });
    },

    // ==========================================
    // 14. LEADERBOARD & GLOBAL STATS MANAGEMENT
    // ==========================================
    cachedAdminLeaderboard: [],
    cachedAdminHiddenCount: 0,
    adminLbSearchFilter: '',
    adminLbStatusFilter: 'all', // 'all', 'vip', 'hidden', 'active'

    async loadAdminGlobalStats(silent) {
        var container = gid('admin-globalstats-container');
        if (!container) return;
        if (!silent) {
            container.innerHTML = `
                <div class="text-center py-12 text-white/50 space-y-2">
                    <i data-lucide="loader-2" class="w-8 h-8 animate-spin mx-auto text-amber-400"></i>
                    <p class="text-xs font-semibold">Mengambil data peringkat & sinkronisasi live...</p>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
        }

        var token = Profile.getAdminToken();
        if (!token) return;

        try {
            var res = await fetch('/api/analytics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-token': token
                },
                body: JSON.stringify({ action: 'get_admin_leaderboard', timeframe: 'all' })
            });
            var data = await res.json();
            if (data && data.status) {
                Profile.cachedAdminLeaderboard = Array.isArray(data.leaderboard) ? data.leaderboard : [];
                Profile.cachedAdminHiddenCount = data.hiddenCount || 0;

                // Update badge in tab
                var badge = gid('admin-lb-count-badge');
                if (badge) {
                    badge.textContent = Profile.cachedAdminLeaderboard.length;
                    badge.classList.remove('hidden');
                }

                Profile.renderAdminGlobalStats();
            } else {
                if (!silent) {
                    container.innerHTML = `
                        <div class="p-6 text-center text-rose-400 space-y-2 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                            <i data-lucide="alert-circle" class="w-8 h-8 mx-auto"></i>
                            <p class="text-xs font-semibold">${data?.message || 'Gagal memuat papan peringkat'}</p>
                            <button onclick="Profile.loadAdminGlobalStats()" class="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs cursor-pointer">Coba Ulang</button>
                        </div>
                    `;
                    if (window.lucide) lucide.createIcons();
                }
            }
        } catch(e) {
            if (!silent) {
                container.innerHTML = `
                    <div class="p-6 text-center text-rose-400 space-y-2 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                        <i data-lucide="wifi-off" class="w-8 h-8 mx-auto"></i>
                        <p class="text-xs font-semibold">Koneksi bermasalah saat mengambil data leaderboard</p>
                        <button onclick="Profile.loadAdminGlobalStats()" class="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs cursor-pointer">Coba Ulang</button>
                    </div>
                `;
                if (window.lucide) lucide.createIcons();
            }
        }
    },

    renderAdminGlobalStats() {
        var container = gid('admin-globalstats-container');
        if (!container) return;

        var activeEl = document.activeElement;
        var isSearchFocused = activeEl && activeEl.id === 'admin-lb-search';
        var selStart = isSearchFocused ? activeEl.selectionStart : null;
        var selEnd = isSearchFocused ? activeEl.selectionEnd : null;
        var savedScroll = container.scrollTop;

        var lb = Profile.cachedAdminLeaderboard || [];
        var totalUsers = lb.length;
        var top1 = lb.length > 0 ? lb[0] : null;
        var onlineCount = lb.filter(function(u) { return u.isOnline; }).length;
        var hiddenCount = Profile.cachedAdminHiddenCount || lb.filter(function(u) { return u.isHidden; }).length;

        // Apply filters
        var q = (Profile.adminLbSearchFilter || '').toLowerCase().trim();
        var statusFilter = Profile.adminLbStatusFilter || 'all';

        var filtered = lb.filter(function(u) {
            if (q && !u.username.toLowerCase().includes(q)) return false;
            if (statusFilter === 'vip' && !u.isVip) return false;
            if (statusFilter === 'hidden' && !u.isHidden) return false;
            if (statusFilter === 'active' && u.isHidden) return false;
            return true;
        });

        var html = `
            <!-- Top Metric Cards -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div class="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col justify-between">
                    <span class="text-[11px] font-medium text-white/50">Total Peserta</span>
                    <div class="flex items-baseline gap-1 mt-1">
                        <span class="text-xl sm:text-2xl font-black text-white font-mono">${totalUsers}</span>
                        <span class="text-[11px] text-white/40">akun</span>
                    </div>
                </div>

                <div class="p-3.5 rounded-2xl bg-gradient-to-tr from-amber-500/10 to-yellow-500/10 border border-amber-400/25 flex flex-col justify-between">
                    <span class="text-[11px] font-medium text-amber-300/70 flex items-center gap-1">
                        <i data-lucide="crown" class="w-3.5 h-3.5 text-amber-400"></i> Juara 1 Saat Ini
                    </span>
                    <div class="mt-1 truncate">
                        <span class="text-sm sm:text-base font-black text-amber-300 truncate">@${top1 ? esHtml(top1.username) : '-'}</span>
                        <p class="text-[10px] text-amber-200/60 font-mono">${top1 ? top1.formattedDuration : '0 Menit'}</p>
                    </div>
                </div>

                <div class="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col justify-between">
                    <span class="text-[11px] font-medium text-emerald-300/70 flex items-center gap-1">
                        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Sedang Mendengar
                    </span>
                    <div class="flex items-baseline gap-1 mt-1">
                        <span class="text-xl sm:text-2xl font-black text-emerald-400 font-mono">${onlineCount}</span>
                        <span class="text-[11px] text-emerald-300/50">online</span>
                    </div>
                </div>

                <div class="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col justify-between">
                    <span class="text-[11px] font-medium text-white/50">Disembunyikan</span>
                    <div class="flex items-baseline gap-1 mt-1">
                        <span class="text-xl sm:text-2xl font-black text-rose-400 font-mono">${hiddenCount}</span>
                        <span class="text-[11px] text-white/40">user</span>
                    </div>
                </div>
            </div>

            <!-- Action Controls Toolbar -->
            <div class="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div class="flex flex-wrap items-center gap-2">
                    <button onclick="if(window.GlobalStats) GlobalStats.openModal();" class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer">
                        <i data-lucide="eye" class="w-3.5 h-3.5"></i>
                        <span>Preview Leaderboard</span>
                    </button>
                    <button onclick="Profile.adminRecalculateStats()" class="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 border border-white/15 active:scale-95 transition-all cursor-pointer">
                        <i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-sky-400"></i>
                        <span>Hitung Ulang & Sinkronkan</span>
                    </button>
                    <button onclick="Profile.adminResetAllLeaderboard()" class="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-bold text-xs flex items-center gap-1.5 border border-rose-500/30 active:scale-95 transition-all cursor-pointer">
                        <i data-lucide="rotate-ccw" class="w-3.5 h-3.5 text-rose-400"></i>
                        <span>Reset Seluruh Musim</span>
                    </button>
                </div>

                <!-- Filter & Search -->
                <div class="flex items-center gap-2">
                    <div class="relative flex-1 sm:w-48">
                        <i data-lucide="search" class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40"></i>
                        <input type="text" id="admin-lb-search" value="${esHtml(Profile.adminLbSearchFilter || '')}" oninput="Profile.onAdminLbSearch(this.value)" placeholder="Cari nama user..." class="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder-white/30 focus:outline-none focus:border-amber-400" />
                    </div>
                    <select onchange="Profile.onAdminLbStatusFilter(this.value)" class="py-1.5 px-2.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white focus:outline-none focus:border-amber-400">
                        <option value="all" ${statusFilter === 'all' ? 'selected' : ''} class="bg-[#12131e] text-white">Semua (${totalUsers})</option>
                        <option value="active" ${statusFilter === 'active' ? 'selected' : ''} class="bg-[#12131e] text-white">Aktif (${totalUsers - hiddenCount})</option>
                        <option value="vip" ${statusFilter === 'vip' ? 'selected' : ''} class="bg-[#12131e] text-white">VIP Saja</option>
                        <option value="hidden" ${statusFilter === 'hidden' ? 'selected' : ''} class="bg-[#12131e] text-white">Disembunyikan (${hiddenCount})</option>
                    </select>
                </div>
            </div>

            <!-- Leaderboard Items List -->
            <div class="space-y-2">
                <div class="flex items-center justify-between text-[11px] font-bold text-white/50 px-2 uppercase tracking-wider">
                    <span>Pengguna & Border</span>
                    <span>Durasi / Aksi Admin</span>
                </div>

                ${filtered.length === 0 ? `
                    <div class="py-12 text-center text-white/40 bg-white/[0.02] border border-white/10 rounded-2xl">
                        <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
                        <p class="text-xs">Tidak ada data pengguna yang cocok dengan pencarian.</p>
                    </div>
                ` : filtered.map(function(item) {
                    var rankColor = item.rank === 1 ? 'text-amber-400 font-black' : (item.rank === 2 ? 'text-slate-300 font-bold' : (item.rank === 3 ? 'text-amber-600 font-bold' : 'text-white/40 font-mono'));
                    var avatarUrl = item.avatar || '/logo.png';
                    var borderUrl = item.borderUrl || '';

                    return `
                    <div class="p-3 rounded-2xl ${item.isHidden ? 'bg-rose-500/5 border-rose-500/20' : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/10'} border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all">
                        <div class="flex items-center gap-3 min-w-0">
                            <!-- Rank Number -->
                            <span class="w-7 text-center text-xs ${rankColor}">#${item.rank}</span>

                            <!-- Avatar with Border Frame Preview -->
                            <div class="relative w-12 h-12 flex items-center justify-center shrink-0 mr-1">
                                <div class="w-9 h-9 rounded-full overflow-hidden bg-black/80 ring-1 ring-white/15">
                                    <img src="${avatarUrl}" class="w-full h-full object-cover rounded-full" onerror="this.src='/logo.png'" />
                                </div>
                                ${borderUrl ? `
                                <img src="${borderUrl}" class="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[62px] h-[62px] max-w-none object-contain z-10 select-none drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                                ` : ''}
                            </div>

                            <!-- User Info -->
                            <div class="min-w-0 flex-1 relative z-20">
                                <div class="flex flex-wrap items-center gap-1.5">
                                    <h5 class="text-white font-black text-xs truncate max-w-[150px]">@${esHtml(item.username)}</h5>
                                    ${item.isVip ? '<span class="text-[8px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-1 py-0.2 rounded font-black font-mono">VIP</span>' : ''}
                                    ${item.isMasterAdmin ? '<span class="text-[8px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1 py-0.2 rounded font-bold font-mono">OWNER</span>' : ''}
                                    ${item.isOnline ? '<span class="inline-flex items-center gap-1 text-[8.5px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded-full font-mono"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Online</span>' : ''}
                                    ${item.isHidden ? '<span class="text-[8.5px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.2 rounded-full font-bold">Disembunyikan</span>' : ''}
                                </div>
                                <div class="flex items-center gap-2 text-[10.5px] text-white/50 mt-0.5">
                                    <span class="text-amber-300 font-semibold">${item.borderName ? ('Border: ' + esHtml(item.borderName)) : 'Tanpa Border'}</span>
                                    <span>&bull;</span>
                                    <span>${item.totalPlays} lagu diputar</span>
                                </div>
                            </div>
                        </div>

                        <!-- Right: Duration & Admin Action Buttons -->
                        <div class="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                            <div class="text-left sm:text-right">
                                <span class="text-xs font-black text-amber-300 font-mono block">${item.formattedDuration}</span>
                                <span class="text-[10px] text-white/40 font-mono">${item.listeningSeconds} detik</span>
                            </div>

                            <!-- Buttons -->
                            <div class="flex items-center gap-1.5">
                                <button onclick="Profile.adminEditUserStats('${esJs(item.username)}', ${item.listeningSeconds}, ${item.totalPlays})" class="px-2.5 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-[11px] font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1" title="Sesuaikan Durasi & Lagu">
                                    <i data-lucide="edit-3" class="w-3 h-3"></i>
                                    <span>Edit</span>
                                </button>

                                <button onclick="Profile.adminToggleHideUser('${esJs(item.username)}', ${!!item.isHidden})" class="px-2.5 py-1.5 rounded-xl ${item.isHidden ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30'} border text-[11px] font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1" title="${item.isHidden ? 'Tampilkan di Papan Peringkat' : 'Sembunyikan dari Papan Peringkat'}">
                                    <i data-lucide="${item.isHidden ? 'eye' : 'eye-off'}" class="w-3 h-3"></i>
                                    <span>${item.isHidden ? 'Tampilkan' : 'Hide'}</span>
                                </button>

                                <button onclick="Profile.adminResetUserStats('${esJs(item.username)}')" class="px-2 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 text-[11px] font-bold transition-all active:scale-95 cursor-pointer" title="Reset Statistik Akun Ini ke 0">
                                    <i data-lucide="rotate-ccw" class="w-3 h-3"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    `;
                }).join('')}
            </div>
        `;

        container.innerHTML = html;
        container.scrollTop = savedScroll;

        if (isSearchFocused) {
            var searchEl = gid('admin-lb-search');
            if (searchEl) {
                searchEl.focus();
                if (selStart !== null && selEnd !== null) {
                    try { searchEl.setSelectionRange(selStart, selEnd); } catch(e){}
                }
            }
        }

        if (window.lucide) lucide.createIcons();
    },

    onAdminLbSearch(val) {
        Profile.adminLbSearchFilter = val;
        Profile.renderAdminGlobalStats();
    },

    onAdminLbStatusFilter(val) {
        Profile.adminLbStatusFilter = val;
        Profile.renderAdminGlobalStats();
    },

    adminEditUserStats(username, currentSeconds, currentPlays) {
        var totalMinutes = Math.round((currentSeconds || 0) / 60);
        var initHours = Math.floor(totalMinutes / 60);
        var initMinutes = totalMinutes % 60;

        var existingModal = document.getElementById('admin-edit-stats-modal');
        if (existingModal) existingModal.remove();

        var modal = document.createElement('div');
        modal.id = 'admin-edit-stats-modal';
        modal.className = 'fixed inset-0 z-[850] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in select-none';

        modal.innerHTML = `
            <div class="bg-[#121522] border border-white/15 w-full max-w-md rounded-2xl p-5 shadow-2xl flex flex-col space-y-4">
                <div class="flex items-center justify-between pb-3 border-b border-white/10">
                    <div class="flex items-center gap-2.5">
                        <div class="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-400 flex items-center justify-center">
                            <i data-lucide="edit-3" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <h3 class="text-base font-bold text-white leading-tight">Edit Statistik Peringkat</h3>
                            <p class="text-xs text-white/60">@${esJs(username)}</p>
                        </div>
                    </div>
                    <button type="button" onclick="document.getElementById('admin-edit-stats-modal')?.remove()" class="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-white/60 hover:text-white flex items-center justify-center active:scale-95 transition-all cursor-pointer">
                        <i data-lucide="x" class="w-4 h-4"></i>
                    </button>
                </div>

                <div class="space-y-3.5">
                    <div>
                        <label class="block text-xs font-semibold text-white/70 mb-1.5">Durasi Mendengarkan:</label>
                        <div class="grid grid-cols-2 gap-2.5">
                            <div>
                                <label class="block text-[11px] text-white/50 mb-1">Jam</label>
                                <div class="relative">
                                    <input type="number" id="edit-stat-hours" value="${initHours}" min="0" step="1" class="w-full bg-[#1b1f30] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm font-mono text-sky-300 focus:outline-none focus:border-sky-500/60 transition-all">
                                    <span class="absolute right-3.5 top-2.5 text-xs text-white/40 font-mono">Jam</span>
                                </div>
                            </div>
                            <div>
                                <label class="block text-[11px] text-white/50 mb-1">Menit</label>
                                <div class="relative">
                                    <input type="number" id="edit-stat-minutes" value="${initMinutes}" min="0" max="59" step="1" class="w-full bg-[#1b1f30] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm font-mono text-sky-300 focus:outline-none focus:border-sky-500/60 transition-all">
                                    <span class="absolute right-3.5 top-2.5 text-xs text-white/40 font-mono">Menit</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-semibold text-white/70 mb-1.5">Total Lagu Diputar:</label>
                        <div class="relative">
                            <input type="number" id="edit-stat-plays" value="${currentPlays || Math.max(1, Math.round(totalMinutes / 3))}" min="0" step="1" class="w-full bg-[#1b1f30] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm font-mono text-emerald-300 focus:outline-none focus:border-emerald-500/60 transition-all">
                            <span class="absolute right-3.5 top-2.5 text-xs text-white/40 font-mono">Lagu</span>
                        </div>
                    </div>
                </div>

                <div class="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                    <button type="button" onclick="document.getElementById('admin-edit-stats-modal')?.remove()" class="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-semibold text-xs transition-all active:scale-95 cursor-pointer">
                        Batal
                    </button>
                    <button type="button" id="btn-save-edit-stats" class="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-sky-500/25 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5">
                        <i data-lucide="check" class="w-3.5 h-3.5"></i>
                        <span>Simpan Perubahan</span>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        if (window.lucide) lucide.createIcons();

        var saveBtn = document.getElementById('btn-save-edit-stats');
        saveBtn.onclick = async function() {
            var hrsEl = document.getElementById('edit-stat-hours');
            var minEl = document.getElementById('edit-stat-minutes');
            var playEl = document.getElementById('edit-stat-plays');

            var inputHours = parseInt(hrsEl?.value, 10);
            if (isNaN(inputHours) || inputHours < 0) inputHours = 0;

            var inputMinutes = parseInt(minEl?.value, 10);
            if (isNaN(inputMinutes) || inputMinutes < 0) inputMinutes = 0;

            var newMinutes = (inputHours * 60) + inputMinutes;
            var newPlays = parseInt(playEl?.value, 10);

            if (isNaN(newPlays) || newPlays < 0) {
                newPlays = Math.max(1, Math.round(newMinutes / 3));
            }

            var newSeconds = newMinutes * 60;
            var token = Profile.getAdminToken();
            if (!token) return;

            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i> Menyimpan...';

            try {
                var res = await fetch('/api/analytics', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-admin-token': token
                    },
                    body: JSON.stringify({
                        action: 'update_user_stats',
                        username: username,
                        totalSeconds: newSeconds,
                        totalPlays: newPlays
                    })
                });
                var data = await res.json();
                if (data && data.status) {
                    if (typeof showToast === 'function') showToast(data.message || `Statistik ${username} berhasil diperbarui`);
                    document.getElementById('admin-edit-stats-modal')?.remove();

                    // Real-time invalidate GlobalStats cache and refresh live modal if open
                    if (typeof GlobalStats !== 'undefined') {
                        GlobalStats.cachedData = {};
                        if (document.getElementById('global-stats-modal')) {
                            GlobalStats.fetchData(GlobalStats.timeframe, true).then(() => GlobalStats.renderCurrentTab());
                        }
                    }
                    Profile.loadAdminGlobalStats(true);
                } else {
                    if (typeof showToast === 'function') showToast(data?.message || 'Gagal mengubah statistik');
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = 'Simpan Perubahan';
                }
            } catch(e) {
                if (typeof showToast === 'function') showToast('Koneksi bermasalah saat memperbarui data');
                saveBtn.disabled = false;
                saveBtn.innerHTML = 'Simpan Perubahan';
            }
        };
    },

    adminToggleHideUser(username, isCurrentlyHidden) {
        var token = Profile.getAdminToken();
        if (!token) return;

        var actionText = isCurrentlyHidden ? 'menampilkan kembali di' : 'menyembunyikan dari';
        Profile.showConfirmModal({
            title: isCurrentlyHidden ? 'Tampilkan Pengguna' : 'Sembunyikan Pengguna',
            message: `Apakah Anda yakin ingin ${actionText} Leaderboard untuk @${username}?`,
            confirmText: isCurrentlyHidden ? 'Ya, Tampilkan' : 'Ya, Sembunyikan',
            confirmClass: isCurrentlyHidden ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30' : 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/30',
            onConfirm: async function() {
                try {
                    var res = await fetch('/api/analytics', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-admin-token': token
                        },
                        body: JSON.stringify({
                            action: 'toggle_hide_user',
                            username: username
                        })
                    });
                    var data = await res.json();
                    if (data && data.status) {
                        if (typeof showToast === 'function') showToast(data.message);
                        if (typeof GlobalStats !== 'undefined') {
                            GlobalStats.cachedData = {};
                            if (document.getElementById('global-stats-modal')) {
                                GlobalStats.fetchData(GlobalStats.timeframe, true).then(() => GlobalStats.renderCurrentTab());
                            }
                        }
                        Profile.loadAdminGlobalStats(true);
                    } else {
                        if (typeof showToast === 'function') showToast(data?.message || 'Gagal mengubah status');
                    }
                } catch(e) {
                    if (typeof showToast === 'function') showToast('Koneksi bermasalah');
                }
            }
        });
    },

    adminResetUserStats(username) {
        var token = Profile.getAdminToken();
        if (!token) return;

        Profile.showConfirmModal({
            title: 'Reset Statistik Pengguna',
            message: `Apakah Anda yakin ingin mereset total waktu mendengarkan & putaran musik @${username} kembali ke 0?`,
            confirmText: 'Ya, Reset ke 0',
            confirmClass: 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/30',
            onConfirm: async function() {
                try {
                    var res = await fetch('/api/analytics', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-admin-token': token
                        },
                        body: JSON.stringify({
                            action: 'reset_user_stats',
                            username: username
                        })
                    });
                    var data = await res.json();
                    if (data && data.status) {
                        if (typeof showToast === 'function') showToast(data.message);
                        if (typeof GlobalStats !== 'undefined') {
                            GlobalStats.cachedData = {};
                            if (document.getElementById('global-stats-modal')) {
                                GlobalStats.fetchData(GlobalStats.timeframe, true).then(() => GlobalStats.renderCurrentTab());
                            }
                        }
                        Profile.loadAdminGlobalStats(true);
                    } else {
                        if (typeof showToast === 'function') showToast(data?.message || 'Gagal mereset statistik user');
                    }
                } catch(e) {
                    if (typeof showToast === 'function') showToast('Koneksi bermasalah');
                }
            }
        });
    },

    adminResetAllLeaderboard() {
        var token = Profile.getAdminToken();
        if (!token) return;

        Profile.showConfirmModal({
            title: 'Reset Seluruh Leaderboard (Musim Baru)',
            message: 'PERINGATAN: Tindakan ini akan mengosongkan seluruh total durasi mendengarkan & riwayat putaran musik untuk seluruh anggota. Gunakan hanya saat reset kompetisi/musim bulanan baru!',
            confirmText: 'Ya, Reset Seluruh Leaderboard',
            confirmClass: 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/30',
            onConfirm: async function() {
                try {
                    var res = await fetch('/api/analytics', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-admin-token': token
                        },
                        body: JSON.stringify({ action: 'reset_all_leaderboard' })
                    });
                    var data = await res.json();
                    if (data && data.status) {
                        if (typeof showToast === 'function') showToast(data.message);
                        Profile.loadAdminGlobalStats(true);
                    } else {
                        if (typeof showToast === 'function') showToast(data?.message || 'Gagal mereset leaderboard');
                    }
                } catch(e) {
                    if (typeof showToast === 'function') showToast('Koneksi bermasalah');
                }
            }
        });
    },

    adminRecalculateStats() {
        var token = Profile.getAdminToken();
        if (!token) return;

        fetch('/api/analytics', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-token': token
            },
            body: JSON.stringify({ action: 'recalculate_stats' })
        }).then(res => res.json()).then(data => {
            if (data && data.status) {
                if (typeof showToast === 'function') showToast(data.message || 'Papan peringkat berhasil dihitung ulang');
                Profile.loadAdminGlobalStats(true);
            } else {
                if (typeof showToast === 'function') showToast(data?.message || 'Gagal menghitung ulang');
            }
        }).catch(() => {
            if (typeof showToast === 'function') showToast('Koneksi bermasalah');
        });
    },

    // ==============================================================
    // TAB 14: KELOLA & TAMBAH BORDER PROFILE VIP
    // ==============================================================
    adminBordersData: [],
    adminBorderFileBase64: null,
    adminBorderSelectedTier: '5months',
    adminBorderSelectedCategory: 'immortal',
    adminBordersGalleryFilter: 'all',

    renderAdminBordersTab() {
        var container = gid('admin-borders-container');
        if (!container) return;

        var u = (typeof Auth !== 'undefined' && Auth.currentUser) ? Auth.currentUser : {};
        var previewAvatar = u.avatar || u.photoURL || u.profilePicture || '/dev.png';
        var defaultBorderImg = Profile.adminBorderFileBase64 || '/borders/Imortal.png';

        container.innerHTML = `
            <div class="space-y-5">
                <!-- Header Card Info & Action -->
                <div class="p-4 sm:p-5 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                    <div>
                        <h3 class="text-sm font-bold text-white flex items-center gap-2">
                            <i data-lucide="shield" class="w-4 h-4 text-amber-400"></i>
                            <span>Tambah Border Profile & Kelola VIP Tier</span>
                        </h3>
                        <p class="text-xs text-white/50 mt-0.5 max-w-xl">
                            Tambahkan foto border baru dari galeri dan pilih kategori VIP (Platinum, Master, Legend, Immortal, atau Permanen). Border otomatis tersimpan & langsung terbuka ketika pengguna membeli paket VIP tersebut!
                        </p>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                        <button type="button" onclick="Profile.loadAdminBordersList(false)" class="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer">
                            <i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-amber-400"></i>
                            <span>Perbarui Galeri</span>
                        </button>
                    </div>
                </div>

                <!-- FORM TAMBAH BORDER BARU (UNGGAH FOTO GALERI / LINK URL) -->
                <div id="admin-border-form-card" class="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-amber-500/10 via-black/40 to-black/60 border border-amber-400/30 space-y-4 shadow-xl">
                    <div class="flex items-center justify-between border-b border-white/10 pb-3">
                        <div class="text-xs font-extrabold text-white flex items-center gap-2">
                            <div class="w-6 h-6 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center">
                                <i data-lucide="plus-circle" class="w-4 h-4 text-amber-400"></i>
                            </div>
                            <span>Form Tambah Border Profile Baru</span>
                        </div>
                        <span class="text-[10px] text-amber-300 font-mono bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full font-bold">
                            Simpan Otomatis &bull; Database
                        </span>
                    </div>

                    <form id="admin-border-add-form" onsubmit="Profile.handleAddBorder(event)" class="space-y-4">
                        <div class="grid grid-cols-1 lg:grid-cols-3 gap-5 items-center">
                            <!-- Preview Box Interaktif (Avatar + Border Overlay) -->
                            <div class="flex flex-col items-center justify-center p-4 bg-black/60 rounded-2xl border border-white/15 relative overflow-hidden group">
                                <div class="absolute inset-0 bg-radial from-amber-500/10 via-transparent to-transparent pointer-events-none"></div>
                                <span class="text-[10px] font-black text-amber-300 mb-2 uppercase tracking-wider flex items-center gap-1">
                                    <i data-lucide="eye" class="w-3 h-3"></i> Pratinjau Live Frame
                                </span>

                                <div class="relative w-28 h-28 my-2 flex items-center justify-center">
                                    <div class="w-16 h-16 rounded-full overflow-hidden bg-black/90 flex items-center justify-center shadow-inner z-0 border border-white/20">
                                        <img id="admin-border-preview-avatar-img" src="${previewAvatar}" class="w-full h-full object-cover rounded-full" alt="Avatar Preview" onerror="this.src='/logo.png'">
                                    </div>
                                    <img id="admin-border-live-preview-frame" src="${defaultBorderImg}" class="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100px] h-[100px] max-w-none object-contain z-10 select-none drop-shadow-[0_0_15px_rgba(245,158,11,0.6)]" alt="" onerror="this.onerror=null; this.style.display='none';">
                                </div>

                                <div class="text-center mt-1 w-full px-2">
                                    <p id="admin-border-preview-name" class="text-xs font-black text-white truncate">Immortal</p>
                                    <div class="flex items-center justify-center gap-1.5 mt-1">
                                        <span id="admin-border-preview-badge" class="text-[9px] font-black px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-400/30 font-mono">
                                            ⚡ Immortal (5 Bulan+)
                                        </span>
                                    </div>
                                    <span id="admin-border-preview-unlock-hint" class="text-[10px] text-white/50 block mt-1 truncate">
                                        Terbuka khusus VIP 5 Bulan & Permanen
                                    </span>
                                </div>
                            </div>

                            <!-- Upload & Input Form Controls -->
                            <div class="lg:col-span-2 space-y-3.5">
                                <!-- Nama Border Profile & Tombol Cepat Kategori -->
                                <div>
                                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5">
                                        <label class="block text-xs font-bold text-white/90">Nama Border Profile:</label>
                                        <!-- Tombol Cepat Kategori: Platinum, Master, Legend, Immortal, Permanen -->
                                        <div class="flex items-center gap-1.5 flex-wrap">
                                            <span class="text-[10px] text-amber-300 font-extrabold">Pilih Cepat Nama:</span>
                                            <button type="button" onclick="Profile.selectAdminBorderCategory('platinum')" class="px-2 py-0.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-400/30 text-[10px] font-bold cursor-pointer transition-all active:scale-95" title="Pilih Platinum (1 Bulan+)">💎 Platinum</button>
                                            <button type="button" onclick="Profile.selectAdminBorderCategory('master')" class="px-2 py-0.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-400/30 text-[10px] font-bold cursor-pointer transition-all active:scale-95" title="Pilih Master (1 Bulan+)">🔥 Master</button>
                                            <button type="button" onclick="Profile.selectAdminBorderCategory('legend')" class="px-2 py-0.5 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-400/30 text-[10px] font-bold cursor-pointer transition-all active:scale-95" title="Pilih Legend (2 Bulan+)">👑 Legend</button>
                                            <button type="button" onclick="Profile.selectAdminBorderCategory('immortal')" class="px-2 py-0.5 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-400/30 text-[10px] font-extrabold cursor-pointer transition-all active:scale-95 shadow-sm shadow-pink-500/20" title="Pilih Immortal (5 Bulan+)">⚡ Immortal</button>
                                            <button type="button" onclick="Profile.selectAdminBorderCategory('permanent')" class="px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30 text-[10px] font-bold cursor-pointer transition-all active:scale-95" title="Pilih Permanen (Lifetime)">🌟 Permanen</button>
                                        </div>
                                    </div>
                                    <input type="text" id="admin-border-name-input" placeholder="Contoh: Immortal, Legend, Master, Platinum" value="Immortal" class="w-full text-xs py-2.5 px-3.5 bg-black/70 border border-white/20 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400 transition-colors shadow-inner font-bold" oninput="Profile.updateBorderPreviewName(this.value)" required />
                                    <p class="text-[10px] text-white/50 mt-1 flex items-center gap-1">
                                        <i data-lucide="sparkles" class="w-3.5 h-3.5 text-amber-400 shrink-0"></i>
                                        <span>Pilih <b>Immortal, Legend, Master, Platinum, atau Permanen</b> &mdash; nama border otomatis terisi tanpa perlu repot mengetik!</span>
                                    </p>
                                </div>

                                <!-- Upload Foto Dari Galeri -->
                                <div>
                                    <label class="block text-xs font-bold text-white/90 mb-1">Unggah Foto Border (PNG / WebP Transparan):</label>
                                    <input type="file" id="admin-border-file-input" accept="image/png,image/jpeg,image/webp,image/gif" onchange="Profile.handleBorderFileSelect(event)" class="hidden" />
                                    <div class="flex flex-col sm:flex-row items-center gap-2">
                                        <button type="button" onclick="var fi=gid('admin-border-file-input'); if(fi){ fi.value=''; fi.click(); }" class="w-full sm:w-auto flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-500 hover:to-yellow-500 text-black font-black text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer">
                                            <i data-lucide="image" class="w-4 h-4 text-black"></i>
                                            <span>Pilih Foto Dari Galeri HP/PC</span>
                                        </button>
                                        <span id="admin-border-filename-label" class="text-[11px] text-white/50 font-mono truncate max-w-[200px]">
                                            Belum ada foto dipilih
                                        </span>
                                    </div>

                                    <!-- Thumbnail Preview Box yang muncul begitu foto dipilih -->
                                    <div id="admin-border-thumb-container" class="hidden mt-2.5 p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-between gap-3">
                                        <div class="flex items-center gap-2.5 min-w-0">
                                            <div class="w-12 h-12 rounded-lg bg-black/60 border border-amber-400/40 p-1 flex items-center justify-center overflow-hidden shrink-0">
                                                <img id="admin-border-selected-thumb" src="" alt="Thumbnail" class="w-full h-full object-contain">
                                            </div>
                                            <div class="min-w-0">
                                                <span class="text-[11px] font-bold text-amber-300 block truncate">Foto Border Siap Disimpan</span>
                                                <span id="admin-border-thumb-name" class="text-[10px] text-white/70 font-mono truncate block">file.png</span>
                                            </div>
                                        </div>
                                        <button type="button" onclick="Profile.clearSelectedBorderPhoto()" class="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[10px] font-bold border border-rose-500/30 flex items-center gap-1 cursor-pointer transition-all active:scale-95 shrink-0" title="Hapus foto dan pilih ulang">
                                            <i data-lucide="x" class="w-3.5 h-3.5"></i>
                                            <span>Hapus</span>
                                        </button>
                                    </div>
                                    <p class="text-[10px] text-white/40 mt-1">Disarankan format PNG transparan dengan frame melingkar atau persegi agar membingkai foto avatar pengguna dengan sempurna.</p>
                                </div>

                                <!-- Input URL Opsional -->
                                <div>
                                    <label class="block text-[11px] font-semibold text-white/60 mb-1">Atau masukkan Link/URL Gambar Foto Border (Opsional):</label>
                                    <input type="url" id="admin-border-url-input" placeholder="https://... atau /borders/contoh.png" class="w-full text-xs py-2 px-3 bg-black/60 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-amber-400 font-mono text-[11px]" oninput="Profile.onBorderUrlInputChange(this.value)" />
                                </div>

                                <div>
                                    <label class="block text-[11px] font-semibold text-white/60 mb-1">Deskripsi Border (Opsional):</label>
                                    <input type="text" id="admin-border-desc-input" placeholder="Contoh: Kasta tertinggi Immortal Mahkota Dewa..." class="w-full text-xs py-2 px-3 bg-black/60 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-amber-400 text-[11px]" />
                                </div>
                            </div>
                        </div>

                        <!-- PILIHAN TIER VIP (PLATINUM, MASTER, LEGEND, IMMORTAL, PERMANEN) -->
                        <div class="pt-3 border-t border-white/10 space-y-2.5">
                            <div class="flex items-center justify-between">
                                <label class="block text-xs font-bold text-white flex items-center gap-1.5">
                                    <i data-lucide="crown" class="w-3.5 h-3.5 text-amber-400"></i>
                                    <span>Pilih Kategori VIP (Hak Akses Pembelian):</span>
                                </label>
                                <span class="text-[10px] text-amber-300 font-bold bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                                    Pilih Salah Satu &bull; Otomatis Isi Nama
                                </span>
                            </div>

                            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                                <!-- Option 1: Platinum -->
                                <label onclick="Profile.selectAdminBorderCategory('platinum')" class="flex items-start gap-2.5 p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/15 cursor-pointer transition-all has-[:checked]:border-sky-400 has-[:checked]:bg-sky-500/15">
                                    <input type="radio" name="admin_border_vip_tier" value="platinum" onchange="Profile.selectAdminBorderCategory('platinum')" class="w-4 h-4 accent-sky-400 cursor-pointer mt-0.5" />
                                    <div class="min-w-0">
                                        <div class="text-xs font-black text-sky-300 flex items-center gap-1">
                                            <span>💎 Platinum</span>
                                            <span class="text-[9px] font-mono px-1 py-0.2 bg-sky-400/20 rounded">1 Bln+</span>
                                        </div>
                                        <span class="text-[10px] text-white/60 block mt-0.5 leading-snug">
                                            Paket 1 Bln, 2 Bln, 5 Bln & Permanen
                                        </span>
                                    </div>
                                </label>

                                <!-- Option 2: Master -->
                                <label onclick="Profile.selectAdminBorderCategory('master')" class="flex items-start gap-2.5 p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/15 cursor-pointer transition-all has-[:checked]:border-orange-400 has-[:checked]:bg-orange-500/15">
                                    <input type="radio" name="admin_border_vip_tier" value="master" onchange="Profile.selectAdminBorderCategory('master')" class="w-4 h-4 accent-orange-400 cursor-pointer mt-0.5" />
                                    <div class="min-w-0">
                                        <div class="text-xs font-black text-orange-300 flex items-center gap-1">
                                            <span>🔥 Master</span>
                                            <span class="text-[9px] font-mono px-1 py-0.2 bg-orange-400/20 rounded">1 Bln+</span>
                                        </div>
                                        <span class="text-[10px] text-white/60 block mt-0.5 leading-snug">
                                            Paket 1 Bln, 2 Bln, 5 Bln & Permanen
                                        </span>
                                    </div>
                                </label>

                                <!-- Option 3: Legend -->
                                <label onclick="Profile.selectAdminBorderCategory('legend')" class="flex items-start gap-2.5 p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/15 cursor-pointer transition-all has-[:checked]:border-yellow-400 has-[:checked]:bg-yellow-500/15">
                                    <input type="radio" name="admin_border_vip_tier" value="legend" onchange="Profile.selectAdminBorderCategory('legend')" class="w-4 h-4 accent-yellow-400 cursor-pointer mt-0.5" />
                                    <div class="min-w-0">
                                        <div class="text-xs font-black text-yellow-300 flex items-center gap-1">
                                            <span>👑 Legend</span>
                                            <span class="text-[9px] font-mono px-1 py-0.2 bg-yellow-400/20 rounded">2 Bln+</span>
                                        </div>
                                        <span class="text-[10px] text-white/60 block mt-0.5 leading-snug">
                                            Paket 2 Bln, 5 Bln & Permanen
                                        </span>
                                    </div>
                                </label>

                                <!-- Option 4: Immortal -->
                                <label onclick="Profile.selectAdminBorderCategory('immortal')" class="flex items-start gap-2.5 p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/15 cursor-pointer transition-all has-[:checked]:border-pink-400 has-[:checked]:bg-pink-500/15">
                                    <input type="radio" name="admin_border_vip_tier" value="immortal" checked onchange="Profile.selectAdminBorderCategory('immortal')" class="w-4 h-4 accent-pink-400 cursor-pointer mt-0.5" />
                                    <div class="min-w-0">
                                        <div class="text-xs font-black text-pink-300 flex items-center gap-1">
                                            <span>⚡ Immortal</span>
                                            <span class="text-[9px] font-mono px-1 py-0.2 bg-pink-400/20 rounded">5 Bln+</span>
                                        </div>
                                        <span class="text-[10px] text-white/60 block mt-0.5 leading-snug">
                                            Khusus Paket 5 Bln & Permanen
                                        </span>
                                    </div>
                                </label>

                                <!-- Option 5: Permanen -->
                                <label onclick="Profile.selectAdminBorderCategory('permanent')" class="flex items-start gap-2.5 p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/15 cursor-pointer transition-all has-[:checked]:border-amber-400 has-[:checked]:bg-amber-500/20 shadow-sm">
                                    <input type="radio" name="admin_border_vip_tier" value="permanent" onchange="Profile.selectAdminBorderCategory('permanent')" class="w-4 h-4 accent-amber-400 cursor-pointer mt-0.5" />
                                    <div class="min-w-0">
                                        <div class="text-xs font-black text-amber-300 flex items-center gap-1">
                                            <span>🌟 Permanen</span>
                                            <span class="text-[9px] font-mono px-1 py-0.2 bg-amber-400/30 rounded">Lifetime</span>
                                        </div>
                                        <span class="text-[10px] text-white/60 block mt-0.5 leading-snug">
                                            Khusus Member VIP Permanen (Sultan)
                                        </span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <!-- Submit Button -->
                        <div class="flex items-center justify-between pt-3 border-t border-white/10">
                            <span class="text-[11px] text-white/40 font-mono hidden sm:inline">
                                Border baru akan langsung tersimpan di file database & disk
                            </span>
                            <button type="submit" id="admin-btn-save-border" class="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-500 hover:to-yellow-500 active:scale-95 text-black font-black text-xs transition-all shadow-lg shadow-amber-500/30 cursor-pointer flex items-center justify-center gap-2">
                                <i data-lucide="check-circle" class="w-4 h-4 stroke-[2.5]"></i>
                                <span>Simpan & Publikasikan Border Baru</span>
                            </button>
                        </div>
                    </form>
                </div>

                <!-- DAFTAR GALERI KOLEKSI BORDER AKTIF -->
                <div class="space-y-3">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
                        <div>
                            <h4 class="text-xs font-bold uppercase tracking-wider text-white/80 flex items-center gap-2">
                                <i data-lucide="layers" class="w-3.5 h-3.5 text-amber-400"></i>
                                <span>Daftar Border Profile Aktif</span>
                            </h4>
                            <p class="text-[11px] text-white/40">Seluruh border bawaan sistem dan border kustom yang ditambahkan oleh admin</p>
                        </div>
                        <span id="admin-borders-total-count" class="text-xs font-mono text-amber-300 bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20 font-bold self-start sm:self-auto">
                            Memuat...
                        </span>
                    </div>

                    <!-- Filter Kategori Tab Admin: Semua, VIP 1 Bln, VIP 2 Bln, VIP 5 Bln, VIP Permanen -->
                    <div class="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-1 text-xs">
                        <button type="button" onclick="Profile.filterAdminBordersGallery('all')" id="admin-bdr-filter-all" class="px-2.5 py-1.5 rounded-xl font-extrabold text-[11px] whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer bg-white text-black shadow-sm">
                            <i data-lucide="layers" class="w-3 h-3"></i>
                            <span>Semua Border</span>
                        </button>
                        <button type="button" onclick="Profile.filterAdminBordersGallery('1month')" id="admin-bdr-filter-1month" class="px-2.5 py-1.5 rounded-xl font-bold text-[11px] whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer bg-sky-400/10 text-sky-300 hover:bg-sky-400/20 border border-sky-400/20">
                            <span class="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                            <span>Platinum / 1 Bulan</span>
                        </button>
                        <button type="button" onclick="Profile.filterAdminBordersGallery('master')" id="admin-bdr-filter-master" class="px-2.5 py-1.5 rounded-xl font-bold text-[11px] whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer bg-orange-400/10 text-orange-300 hover:bg-orange-400/20 border border-orange-400/20">
                            <span class="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                            <span>Master</span>
                        </button>
                        <button type="button" onclick="Profile.filterAdminBordersGallery('2months')" id="admin-bdr-filter-2months" class="px-2.5 py-1.5 rounded-xl font-bold text-[11px] whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer bg-yellow-400/10 text-yellow-300 hover:bg-yellow-400/20 border border-yellow-400/20">
                            <span class="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                            <span>Legend / 2 Bulan</span>
                        </button>
                        <button type="button" onclick="Profile.filterAdminBordersGallery('5months')" id="admin-bdr-filter-5months" class="px-2.5 py-1.5 rounded-xl font-bold text-[11px] whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer bg-pink-400/10 text-pink-300 hover:bg-pink-400/20 border border-pink-400/20">
                            <span class="w-1.5 h-1.5 rounded-full bg-pink-400"></span>
                            <span>Immortal / 5 Bulan</span>
                        </button>
                        <button type="button" onclick="Profile.filterAdminBordersGallery('permanent')" id="admin-bdr-filter-permanent" class="px-2.5 py-1.5 rounded-xl font-bold text-[11px] whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer bg-amber-400/10 text-amber-300 hover:bg-amber-400/20 border border-amber-400/30">
                            <i data-lucide="crown" class="w-3 h-3 text-amber-400"></i>
                            <span>Permanen</span>
                        </button>
                    </div>

                    <div id="admin-borders-list-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div class="col-span-full text-center py-10 text-white/40">
                            <i data-lucide="loader-2" class="w-6 h-6 animate-spin mx-auto text-amber-400 mb-2"></i>
                            <p class="text-xs">Memuat koleksi border profil...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        if (window.lucide) lucide.createIcons();
        Profile.loadAdminBordersList(true);
    },

    filterAdminBordersGallery(filter) {
        Profile.adminBordersGalleryFilter = filter;
        var tabs = ['all', '1month', 'master', '2months', '5months', 'permanent'];
        tabs.forEach(function(t) {
            var btn = gid('admin-bdr-filter-' + t);
            if (!btn) return;
            var isCurr = (t === filter);
            if (t === 'all') {
                btn.className = `px-2.5 py-1.5 rounded-xl font-extrabold text-[11px] whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${isCurr ? 'bg-white text-black shadow-sm font-extrabold' : 'bg-white/5 text-white/70 hover:bg-white/10'}`;
            } else if (t === '1month') {
                btn.className = `px-2.5 py-1.5 rounded-xl font-bold text-[11px] whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${isCurr ? 'bg-sky-400 text-black font-extrabold' : 'bg-sky-400/10 text-sky-300 hover:bg-sky-400/20 border border-sky-400/20'}`;
            } else if (t === 'master') {
                btn.className = `px-2.5 py-1.5 rounded-xl font-bold text-[11px] whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${isCurr ? 'bg-orange-400 text-black font-extrabold' : 'bg-orange-400/10 text-orange-300 hover:bg-orange-400/20 border border-orange-400/20'}`;
            } else if (t === '2months') {
                btn.className = `px-2.5 py-1.5 rounded-xl font-bold text-[11px] whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${isCurr ? 'bg-yellow-400 text-black font-extrabold' : 'bg-yellow-400/10 text-yellow-300 hover:bg-yellow-400/20 border border-yellow-400/20'}`;
            } else if (t === '5months') {
                btn.className = `px-2.5 py-1.5 rounded-xl font-bold text-[11px] whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${isCurr ? 'bg-pink-400 text-black font-extrabold' : 'bg-pink-400/10 text-pink-300 hover:bg-pink-400/20 border border-pink-400/20'}`;
            } else if (t === 'permanent') {
                btn.className = `px-2.5 py-1.5 rounded-xl font-bold text-[11px] whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${isCurr ? 'bg-amber-400 text-black font-extrabold shadow-sm' : 'bg-amber-400/10 text-amber-300 hover:bg-amber-400/20 border border-amber-400/30'}`;
            }
        });
        Profile.renderAdminBordersGrid();
    },

    renderAdminBordersGrid() {
        var grid = gid('admin-borders-list-grid');
        var countEl = gid('admin-borders-total-count');
        if (!grid) return;

        var borders = Profile.adminBordersData || [];
        var filter = Profile.adminBordersGalleryFilter || 'all';

        var filtered = borders.filter(function(b) {
            if (filter === 'all') return true;
            var bName = String(b.name || '').toLowerCase();
            var bId = String(b.id || '').toLowerCase();
            var bCat = String(b.category || '').toLowerCase();
            if (filter === '1month') {
                return bCat === 'platinum' || b.requiredTier === '1month' || bId.includes('platinum') || bName.includes('platinum');
            }
            if (filter === 'master') {
                return bCat === 'master' || bId.includes('master') || bName.includes('master');
            }
            if (filter === '2months') {
                return bCat === 'legend' || b.requiredTier === '2months' || bId.includes('legend') || bName.includes('legend');
            }
            if (filter === '5months') {
                return bCat === 'immortal' || b.requiredTier === '5months' || bId.includes('immortal') || bId.includes('imortal') || bName.includes('immortal');
            }
            if (filter === 'permanent') {
                return bCat === 'permanent' || b.requiredTier === 'permanent';
            }
            return true;
        });

        if (countEl) countEl.innerText = `${filtered.length} / ${borders.length} Border`;

        var u = (typeof Auth !== 'undefined' && Auth.currentUser) ? Auth.currentUser : {};
        var previewAvatar = u.avatar || u.photoURL || u.profilePicture || '/dev.png';

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-10 px-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1.5">
                    <p class="text-xs font-bold text-white/70">Tidak ada border profil di kategori filter ini</p>
                    <p class="text-[10px] text-white/40">Gunakan formulir di atas untuk menambahkan border baru ke kategori ini.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = filtered.map(function(b) {
            var isCustom = !!b.isCustom;
            var tierColor = {
                '1month': 'bg-sky-400/20 text-sky-300 border-sky-400/30',
                '2months': 'bg-yellow-400/20 text-yellow-300 border-yellow-400/30',
                '5months': 'bg-pink-400/20 text-pink-300 border-pink-400/30',
                'permanent': 'bg-amber-400/25 text-amber-300 border-amber-400/40'
            }[b.requiredTier] || 'bg-white/10 text-white/70 border-white/20';

            return `
            <div class="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-amber-400/40 transition-all flex flex-col justify-between gap-3 group relative">
                <div>
                    <div class="flex items-start justify-between gap-2 mb-2">
                        <div class="flex items-center gap-1.5 flex-wrap">
                            <span class="text-[9px] font-black px-2 py-0.5 rounded-md ${tierColor} border font-mono">
                                ${b.badge || b.tier}
                            </span>
                            ${isCustom ? `
                                <span class="text-[8px] font-extrabold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                                    Kustom Admin
                                </span>
                            ` : `
                                <span class="text-[8px] font-extrabold px-1.5 py-0.2 rounded bg-white/10 text-white/50 border border-white/10 font-mono">
                                    Sistem
                                </span>
                            `}
                        </div>

                        ${isCustom ? `
                            <button type="button" onclick="Profile.deleteCustomBorder('${b.id}', '${Profile.escapeHtml(b.name)}')" class="p-1 rounded-lg text-rose-400 hover:text-white hover:bg-rose-500/20 active:scale-90 transition-all cursor-pointer" title="Hapus Border">
                                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                            </button>
                        ` : ''}
                    </div>

                    <!-- Visual Avatar Frame Center Preview -->
                    <div class="py-2 flex items-center justify-center">
                        <div class="relative w-24 h-24 flex items-center justify-center">
                            <div class="w-14 h-14 rounded-full overflow-hidden bg-black/80 flex items-center justify-center shadow-inner z-0 border border-white/20">
                                <img src="${previewAvatar}" class="w-full h-full object-cover rounded-full" onerror="this.src='/logo.png'">
                            </div>
                            ${b.url ? `
                                <img src="${b.url}" class="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[88px] h-[88px] max-w-none object-contain z-10 select-none drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]" onerror="this.style.display='none'">
                            ` : ''}
                        </div>
                    </div>

                    <div class="mt-1">
                        <h5 class="text-xs font-black text-white group-hover:text-amber-300 transition-colors">${Profile.escapeHtml(b.name)}</h5>
                        <p class="text-[10px] text-white/50 line-clamp-2 mt-0.5 leading-snug">${Profile.escapeHtml(b.desc || '')}</p>
                        <p class="text-[9px] text-white/30 font-mono truncate mt-1">${b.url || 'Tanpa File'}</p>
                    </div>
                </div>

                <div class="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                    <button type="button" onclick="Profile.testEquipBorder('${b.id}', '${Profile.escapeHtml(b.name)}')" class="w-full py-1.5 px-3 rounded-xl bg-white/10 hover:bg-amber-400 hover:text-black text-white text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer">
                        <i data-lucide="check" class="w-3 h-3"></i>
                        <span>Coba Pakai Sekarang</span>
                    </button>
                </div>
            </div>
            `;
        }).join('');

        if (window.lucide) lucide.createIcons();
    },

    async loadAdminBordersList(silent = false) {
        var grid = gid('admin-borders-list-grid');
        var countEl = gid('admin-borders-total-count');
        if (!grid) {
            if (!silent) Profile.renderAdminBordersTab();
            return;
        }

        try {
            var res = await fetch('/api/borders?action=list_all&t=' + Date.now());
            var data = await res.json();
            if (data && data.status && Array.isArray(data.borders)) {
                Profile.adminBordersData = data.borders;
                Profile.renderAdminBordersGrid();
            } else {
                if (!silent && grid) {
                    grid.innerHTML = `<div class="col-span-full p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs text-center">Gagal memuat data border profile.</div>`;
                }
            }
        } catch(e) {
            if (!silent && grid) {
                grid.innerHTML = `<div class="col-span-full p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs text-center">Koneksi bermasalah saat memuat border.</div>`;
            }
        }
    },

    clearSelectedBorderPhoto() {
        Profile.adminBorderFileBase64 = null;
        var fileInput = gid('admin-border-file-input');
        if (fileInput) fileInput.value = '';

        var label = gid('admin-border-filename-label');
        if (label) {
            label.innerText = 'Belum ada foto dipilih';
            label.className = 'text-[11px] text-white/50 font-mono truncate max-w-[200px]';
        }

        var thumbContainer = gid('admin-border-thumb-container');
        if (thumbContainer) thumbContainer.classList.add('hidden');

        var thumb = gid('admin-border-selected-thumb');
        if (thumb) thumb.src = '';

        var urlInput = gid('admin-border-url-input');
        var urlVal = (urlInput?.value || '').trim();

        var frame = gid('admin-border-live-preview-frame');
        if (frame) {
            frame.src = urlVal || '/borders/Master.png';
            frame.classList.remove('hidden');
            frame.style.display = 'block';
        }
    },

    updateBorderPreviewName(val) {
        var el = gid('admin-border-preview-name');
        if (el) el.innerText = val && val.trim() ? val.trim() : 'Border Baru';
    },

    onBorderUrlInputChange(val) {
        var frame = gid('admin-border-live-preview-frame');
        if (!frame) return;
        if (val && val.trim()) {
            frame.src = val.trim();
            frame.classList.remove('hidden');
            frame.style.display = 'block';

            var thumb = gid('admin-border-selected-thumb');
            if (thumb) thumb.src = val.trim();
            var thumbName = gid('admin-border-thumb-name');
            if (thumbName) thumbName.innerText = 'URL Gambar Eksternal';
            var thumbContainer = gid('admin-border-thumb-container');
            if (thumbContainer) thumbContainer.classList.remove('hidden');
        } else if (Profile.adminBorderFileBase64) {
            frame.src = Profile.adminBorderFileBase64;
            frame.classList.remove('hidden');
            frame.style.display = 'block';
        } else {
            frame.src = '/borders/Master.png';
            var thumbContainer = gid('admin-border-thumb-container');
            if (thumbContainer && !Profile.adminBorderFileBase64) thumbContainer.classList.add('hidden');
        }
    },

    handleBorderFileSelect(event) {
        var file = event.target.files && event.target.files[0];
        if (!file) return;

        if (file.size > 15 * 1024 * 1024) {
            if (typeof showToast === 'function') showToast('Ukuran foto terlalu besar (Maksimal 15MB)');
            return;
        }

        var label = gid('admin-border-filename-label');
        if (label) {
            label.innerText = file.name + ' (' + (file.size / 1024).toFixed(1) + ' KB)';
            label.className = 'text-[11px] text-amber-300 font-mono truncate max-w-[200px] font-bold';
        }

        var reader = new FileReader();
        reader.onload = function(e) {
            var dataUrl = e.target.result;
            Profile.adminBorderFileBase64 = dataUrl;

            // Update frame preview
            var frame = gid('admin-border-live-preview-frame');
            if (frame) {
                frame.src = dataUrl;
                frame.classList.remove('hidden');
                frame.style.display = 'block';
            }

            // Update and show thumbnail preview
            var thumb = gid('admin-border-selected-thumb');
            if (thumb) thumb.src = dataUrl;

            var thumbName = gid('admin-border-thumb-name');
            if (thumbName) thumbName.innerText = file.name + ' • ' + (file.size / 1024).toFixed(1) + ' KB';

            var thumbContainer = gid('admin-border-thumb-container');
            if (thumbContainer) {
                thumbContainer.classList.remove('hidden');
                if (window.lucide) lucide.createIcons();
            }

            // Clear URL input so they don't clash
            var urlInput = gid('admin-border-url-input');
            if (urlInput) urlInput.value = '';

            if (typeof showToast === 'function') showToast('Foto border berhasil dipilih & siap disimpan!');
        };
        reader.onerror = function() {
            if (typeof showToast === 'function') showToast('Gagal membaca berkas gambar');
        };
        reader.readAsDataURL(file);
    },

    selectAdminBorderCategory(cat) {
        cat = (cat || 'immortal').toLowerCase();
        Profile.adminBorderSelectedCategory = cat;

        var configs = {
            'platinum': {
                name: 'Platinum',
                tier: '1month',
                badge: '💎 Platinum (1 Bulan+)',
                badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-400/30',
                hint: 'Terbuka untuk VIP 1 Bln, 2 Bln, 5 Bln & Permanen',
                desc: 'Border Platinum naga cyber kemegahan'
            },
            'master': {
                name: 'Master',
                tier: '1month',
                badge: '🔥 Master (1 Bulan+)',
                badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-400/30',
                hint: 'Terbuka untuk VIP 1 Bln, 2 Bln, 5 Bln & Permanen',
                desc: 'Border Master mahkota emas membara'
            },
            'legend': {
                name: 'Legend',
                tier: '2months',
                badge: '👑 Legend (2 Bulan+)',
                badgeClass: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30',
                hint: 'Terbuka untuk VIP 2 Bln, 5 Bln & Permanen',
                desc: 'Border Legend sayap kemegahan kerajaan'
            },
            'immortal': {
                name: 'Immortal',
                tier: '5months',
                badge: '⚡ Immortal (5 Bulan+)',
                badgeClass: 'bg-pink-500/20 text-pink-300 border-pink-400/30',
                hint: 'Terbuka khusus VIP 5 Bulan & Permanen',
                desc: 'Border kasta tertinggi Immortal Mahkota Dewa Musik'
            },
            'permanent': {
                name: 'Permanen',
                tier: 'permanent',
                badge: '🌟 VIP Permanen',
                badgeClass: 'bg-amber-500/25 text-amber-300 border-amber-400/40',
                hint: 'Khusus Member VIP Permanen (Lifetime Sultan)',
                desc: 'Border eksklusif VIP Sultan Permanen'
            }
        };

        var item = configs[cat] || configs['immortal'];
        Profile.adminBorderSelectedTier = item.tier;

        // OTOMATIS ISI NAMA BORDER PROFILE: PENGGUNA TIDAK PERLU REPOT NGETIK
        var nameInput = gid('admin-border-name-input');
        if (nameInput) {
            nameInput.value = item.name;
        }

        // UPDATE PRATINJAU LIVE
        Profile.updateBorderPreviewName(item.name);

        var badgeEl = gid('admin-border-preview-badge');
        if (badgeEl) {
            badgeEl.innerText = item.badge;
            badgeEl.className = `text-[9px] font-black px-2 py-0.5 rounded-full border font-mono ${item.badgeClass}`;
        }
        var hintEl = gid('admin-border-preview-unlock-hint');
        if (hintEl) {
            hintEl.innerText = item.hint;
        }

        // UPDATE RADIO SELECTION
        var radios = document.getElementsByName('admin_border_vip_tier');
        for (var i = 0; i < radios.length; i++) {
            if (radios[i].value === cat) {
                radios[i].checked = true;
            }
        }

        if (typeof showToast === 'function') {
            showToast('Kategori ' + item.name + ' dipilih! Nama otomatis diisi.');
        }
    },

    onAdminBorderTierChange(tier) {
        Profile.selectAdminBorderCategory(tier);
    },

    async handleAddBorder(event) {
        if (event && event.preventDefault) event.preventDefault();
        var token = Profile.getAdminToken();
        if (!token) {
            if (typeof showToast === 'function') showToast('Sesi admin tidak valid. Silakan login admin kembali.');
            return;
        }

        var nameInput = gid('admin-border-name-input');
        var urlInput = gid('admin-border-url-input');
        var descInput = gid('admin-border-desc-input');
        var btnSave = gid('admin-btn-save-border');

        var name = (nameInput?.value || '').trim();
        var url = (urlInput?.value || '').trim();
        var desc = (descInput?.value || '').trim();
        var vipTier = Profile.adminBorderSelectedTier || '5months';
        var category = Profile.adminBorderSelectedCategory || (name.toLowerCase().includes('immortal') ? 'immortal' : name.toLowerCase().includes('legend') ? 'legend' : name.toLowerCase().includes('master') ? 'master' : name.toLowerCase().includes('platinum') ? 'platinum' : 'permanent');

        if (!name) {
            if (typeof showToast === 'function') showToast('Nama border wajib diisi');
            nameInput?.focus();
            return;
        }

        if (!Profile.adminBorderFileBase64 && !url) {
            if (typeof showToast === 'function') showToast('Silakan pilih foto border dari galeri atau isi link gambar');
            return;
        }

        if (btnSave) {
            btnSave.disabled = true;
            btnSave.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Menyimpan Border...</span>`;
            if (window.lucide) lucide.createIcons();
        }

        try {
            var payload = {
                action: 'add_border',
                name: name,
                category: category,
                vipTier: vipTier,
                imageBase64: Profile.adminBorderFileBase64 || null,
                imageUrl: url || '',
                desc: desc
            };

            var res = await fetch('/api/borders?action=add_border', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-token': token
                },
                body: JSON.stringify(payload)
            });

            var data = await res.json();
            if (data && data.status) {
                if (typeof showToast === 'function') showToast(data.message || 'Border profil berhasil ditambahkan!');
                
                // Clear photo and form fields without destroying the form UI
                Profile.clearSelectedBorderPhoto();
                // Set name input default to currently selected category so admin doesn't need to type again
                var defaultNextName = Profile.adminBorderSelectedCategory ? (Profile.adminBorderSelectedCategory.charAt(0).toUpperCase() + Profile.adminBorderSelectedCategory.slice(1)) : 'Immortal';
                if (nameInput) nameInput.value = defaultNextName;
                if (urlInput) urlInput.value = '';
                if (descInput) descInput.value = '';
                var previewName = gid('admin-border-preview-name');
                if (previewName) previewName.innerText = defaultNextName;

                // Reload only the gallery list!
                await Profile.loadAdminBordersList(false);

                // Notify border picker if open
                if (window.Auth && typeof Auth.openBorderPickerModal === 'function') {
                    Auth.availableBorders = data.borders || [];
                }
            } else {
                if (typeof showToast === 'function') showToast(data?.message || 'Gagal menyimpan border');
            }
        } catch(e) {
            if (typeof showToast === 'function') showToast('Terjadi kesalahan koneksi saat menyimpan border: ' + e.message);
        } finally {
            if (btnSave) {
                btnSave.disabled = false;
                btnSave.innerHTML = `<i data-lucide="check-circle" class="w-4 h-4 stroke-[2.5]"></i><span>Simpan & Publikasikan Border Baru</span>`;
                if (window.lucide) lucide.createIcons();
            }
        }
    },

    deleteCustomBorder(borderId, borderName) {
        var token = Profile.getAdminToken();
        if (!token) return;

        Profile.showConfirmModal({
            title: 'Hapus Border Profile',
            message: `Apakah Anda yakin ingin menghapus border "${borderName}"? Border kustom ini akan dihapus dari sistem secara permanen.`,
            confirmText: 'Ya, Hapus Border',
            confirmClass: 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/30',
            onConfirm: async function() {
                try {
                    var res = await fetch('/api/borders?action=delete_border', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-admin-token': token
                        },
                        body: JSON.stringify({ action: 'delete_border', borderId: borderId })
                    });
                    var data = await res.json();
                    if (data && data.status) {
                        if (typeof showToast === 'function') showToast(data.message || 'Border berhasil dihapus');
                        Profile.loadAdminBordersList(false);
                    } else {
                        if (typeof showToast === 'function') showToast(data?.message || 'Gagal menghapus border');
                    }
                } catch(e) {
                    if (typeof showToast === 'function') showToast('Koneksi bermasalah');
                }
            }
        });
    },

    async testEquipBorder(borderId, borderName) {
        if (typeof Auth !== 'undefined' && typeof Auth.previewOrEquipBorder === 'function') {
            await Auth.previewOrEquipBorder(borderId);
            if (typeof showToast === 'function') showToast(`Border ${borderName} dipasang ke profil Anda`);
        }
    },

    // ==============================================================
    // KLAIM KODE VOUCHER VIP (USER SIDE)
    // ==============================================================
    toggleVoucherClaimInput() {
        var container = gid('voucher-claim-container');
        var textEl = gid('toggle-voucher-text');
        var inputEl = gid('voucher-code-input');
        if (!container || !textEl) return;

        var isHidden = container.classList.contains('hidden');
        if (isHidden) {
            container.classList.remove('hidden');
            textEl.innerText = 'Tutup Kode Voucher';
            if (inputEl) {
                setTimeout(function(){ inputEl.focus(); }, 50);
            }
        } else {
            container.classList.add('hidden');
            textEl.innerText = 'Punya Kode Voucher VIP? Klaim di Sini';
        }
        if (window.lucide) lucide.createIcons();
    },

    async redeemVoucherCode() {
        var inputEl = gid('voucher-code-input');
        var msgBox = gid('voucher-status-msg');
        var code = (inputEl?.value || '').trim().toUpperCase();

        var showMsg = function(text, isSuccess) {
            if (msgBox) {
                msgBox.className = isSuccess 
                    ? 'block mb-2.5 p-2.5 px-3.5 rounded-xl text-xs font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 text-center transition-all shadow-md'
                    : 'block mb-2.5 p-2.5 px-3.5 rounded-xl text-xs font-bold text-rose-300 bg-rose-500/20 border border-rose-500/30 text-center transition-all shadow-md';
                msgBox.innerHTML = (isSuccess ? '<i data-lucide="check-circle" class="w-3.5 h-3.5 inline mr-1"></i> ' : '<i data-lucide="x-circle" class="w-3.5 h-3.5 inline mr-1"></i> ') + Profile.escapeHtml(text);
                if (window.lucide) lucide.createIcons();
            }
            if (typeof showToast === 'function') showToast(text);
        };

        if (!code) {
            showMsg('Maaf, silakan masukkan kode voucher VIP terlebih dahulu!', false);
            return;
        }

        var user = (typeof Auth !== 'undefined' && Auth.currentUser) ? Auth.currentUser : null;
        if (!user) {
            showMsg('Silakan login ke akun Anda terlebih dahulu untuk mengklaim kode voucher VIP!', false);
            setTimeout(function() {
                gid('musifystar-vip-packages-modal')?.remove();
                if (typeof Auth !== 'undefined' && typeof Auth.openAuthModal === 'function') {
                    Auth.openAuthModal();
                }
            }, 1200);
            return;
        }

        var btn = gid('btn-redeem-voucher');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i>';
            if (window.lucide) lucide.createIcons();
        }

        try {
            var res = await fetch('/api/vouchers?action=redeem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: code,
                    userId: user.id || user.userId,
                    username: user.username,
                    email: user.email || user.rawEmail
                })
            });
            var data = await res.json();

            if (data && data.status) {
                var succMsg = data.message || '🎉 Selamat! Kode voucher valid & VIP Anda berhasil diklaim!';
                showMsg(succMsg, true);

                // Update current user live
                if (data.user) {
                    Auth.currentUser.isPremium = data.user.isPremium;
                    Auth.currentUser.vipTier = data.user.vipTier;
                    Auth.currentUser.vipExpiresAt = data.user.vipExpiresAt;
                    if (data.user.border) {
                        Auth.currentUser.border = data.user.border;
                        Auth.currentUser.borderName = data.user.borderName;
                        Auth.currentUser.borderUrl = data.user.borderUrl;
                    }
                    if (typeof Auth.saveUser === 'function') Auth.saveUser(Auth.currentUser);
                    Auth.updateHeaderUI();
                }

                setTimeout(function() {
                    gid('musifystar-vip-packages-modal')?.remove();
                    if (gid('user-profile-modal')) {
                        Auth.openUserProfileModal();
                    }
                }, 1500);
            } else {
                var errMsg = data?.message || 'Maaf, kode voucher tidak valid. Silakan coba lagi!';
                showMsg(errMsg, false);
            }
        } catch (e) {
            showMsg('Maaf, kode voucher tidak valid atau terjadi masalah koneksi. Coba lagi!', false);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerText = 'Klaim';
            }
        }
    },

    // ==============================================================
    // TAB 15: KELOLA KODE VOUCHER VIP (ADMIN CONTROL PANEL)
    // ==============================================================
    adminVouchersData: [],
    adminVoucherSearchQuery: '',
    adminVoucherFilter: 'all',

    // Voucher creation interactive state
    adminVchFormType: 'vip',       // 'vip' or 'trial'
    adminVchVipPreset: '1month',   // '1month', '2months', '5months', 'permanent', 'custom'
    adminVchVipDays: 30,
    adminVchTrialPreset: '7d',     // '1d', '3d', '7d', '14d', 'custom'
    adminVchTrialDays: 7,
    adminVchQuotaPreset: '1',      // '1', '5', '10', '50', '100', 'unlimited', 'custom'
    adminVchQuotaVal: 1,
    adminVchExpiryPreset: 'none',  // 'none', '1d', '3d', '7d', '14d', '30d', 'custom'
    adminVchExpiryVal: '',

    async loadAdminVouchersTab(silent) {
        var container = gid('admin-vouchers-container');
        var token = Profile.getAdminToken();
        if (!container || !token) return;

        if (!silent) {
            container.innerHTML = `
            <div class="text-center py-12 text-white/50 space-y-2">
                <i data-lucide="loader-2" class="w-8 h-8 animate-spin mx-auto text-amber-400"></i>
                <p class="text-xs font-semibold">Memuat data kode voucher VIP...</p>
            </div>`;
            if (window.lucide) lucide.createIcons();
        }

        try {
            var res = await fetch('/api/vouchers?action=admin_list', {
                headers: { 'x-admin-token': token }
            });
            var data = await res.json();

            if (data && data.status) {
                Profile.adminVouchersData = Array.isArray(data.vouchers) ? data.vouchers : [];
                
                // Update count badge on tab button
                var badgeEl = gid('admin-vouchers-count-badge');
                if (badgeEl) {
                    badgeEl.innerText = Profile.adminVouchersData.length;
                    badgeEl.classList.remove('hidden');
                }

                // If silent auto-refresh and the form is already on screen, DO NOT re-render the whole form!
                // Only update the list cards and live stats so open dropdowns/inputs never get dismissed!
                if (silent && gid('admin-create-voucher-form')) {
                    Profile.updateAdminVoucherStatsAndList(data);
                } else {
                    Profile.renderAdminVouchersTab(data);
                }
            } else {
                if (!silent) {
                    container.innerHTML = `
                    <div class="p-6 text-center text-rose-400 space-y-2 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                        <i data-lucide="alert-circle" class="w-8 h-8 mx-auto"></i>
                        <p class="text-xs font-semibold">${data?.message || 'Gagal memuat voucher'}</p>
                    </div>`;
                    if (window.lucide) lucide.createIcons();
                }
            }
        } catch (e) {
            if (!silent) {
                container.innerHTML = `
                <div class="p-6 text-center text-rose-400 space-y-2 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                    <i data-lucide="wifi-off" class="w-8 h-8 mx-auto"></i>
                    <p class="text-xs font-semibold">Kesalahan koneksi saat memuat voucher: ${e.message}</p>
                </div>`;
                if (window.lucide) lucide.createIcons();
            }
        }
    },

    updateAdminVoucherStatsAndList(data) {
        var vouchers = Profile.adminVouchersData || [];
        var stats = data?.stats || {
            total: vouchers.length,
            active: vouchers.filter(function(v){ return v.isActive; }).length,
            totalRedeemed: vouchers.reduce(function(acc, v){ return acc + (v.usedCount || 0); }, 0)
        };
        var statTotal = gid('admin-vch-stat-total');
        if (statTotal) statTotal.innerText = stats.total || vouchers.length;
        var statActive = gid('admin-vch-stat-active');
        if (statActive) statActive.innerText = stats.active || 0;
        var statRedeemed = gid('admin-vch-stat-redeemed');
        if (statRedeemed) statRedeemed.innerText = (stats.totalRedeemed || 0) + 'x';

        var listCount = gid('admin-vch-list-count');
        if (listCount) listCount.innerText = `(${vouchers.length})`;

        var listContainer = gid('admin-vouchers-list-container');
        if (listContainer) {
            listContainer.innerHTML = Profile.renderVoucherListCards(vouchers);
            if (window.lucide) lucide.createIcons();
        }
    },

    renderAdminVouchersTab(data) {
        var container = gid('admin-vouchers-container');
        if (!container) return;

        var vouchers = Profile.adminVouchersData || [];
        var stats = data?.stats || {
            total: vouchers.length,
            active: vouchers.filter(function(v){ return v.isActive; }).length,
            totalRedeemed: vouchers.reduce(function(acc, v){ return acc + (v.usedCount || 0); }, 0)
        };

        var isTrialMode = Profile.adminVchFormType === 'trial';

        var html = `
        <div class="space-y-5">
            <!-- Header Card & Quick Stats -->
            <div class="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-yellow-500/10 to-amber-600/5 border border-amber-400/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
                <div>
                    <h3 class="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                        <div class="w-7 h-7 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center">
                            <i data-lucide="ticket" class="w-4 h-4 text-amber-400"></i>
                        </div>
                        <span>Kelola & Buat Kode Voucher VIP</span>
                    </h3>
                    <p class="text-xs text-white/60 mt-1 max-w-xl">
                        Buat kode voucher promo untuk pengguna. Pengguna dapat langsung menukarkan kode ini di modal VIP untuk mengaktifkan status VIP & border profil seketika!
                    </p>
                </div>

                <div class="flex items-center gap-2 shrink-0 flex-wrap">
                    <div class="px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-center">
                        <span class="text-[9.5px] uppercase tracking-wider text-white/40 block font-bold">Total Voucher</span>
                        <span id="admin-vch-stat-total" class="text-sm font-black text-amber-300 font-mono">${stats.total || vouchers.length}</span>
                    </div>
                    <div class="px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-center">
                        <span class="text-[9.5px] uppercase tracking-wider text-emerald-400/70 block font-bold">Aktif</span>
                        <span id="admin-vch-stat-active" class="text-sm font-black text-emerald-400 font-mono">${stats.active || 0}</span>
                    </div>
                    <div class="px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-center">
                        <span class="text-[9.5px] uppercase tracking-wider text-sky-400/70 block font-bold">Total Diklaim</span>
                        <span id="admin-vch-stat-redeemed" class="text-sm font-black text-sky-300 font-mono">${stats.totalRedeemed || 0}x</span>
                    </div>
                </div>
            </div>

            <!-- FORM BUAT KODE VOUCHER BARU -->
            <div class="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4 shadow-lg">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                    <div class="flex items-center gap-2">
                        <div class="w-6 h-6 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center">
                            <i data-lucide="plus" class="w-3.5 h-3.5 text-amber-400"></i>
                        </div>
                        <h4 class="text-xs sm:text-sm font-bold text-white">Terbitkan Kode Voucher Baru</h4>
                    </div>
                    <span class="text-[10px] text-amber-300 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full font-bold w-fit">
                        Akses Instan &bull; Otomatis
                    </span>
                </div>

                <form id="admin-create-voucher-form" onsubmit="Profile.submitCreateVoucher(event)" class="space-y-4">
                    
                    <!-- 1. KODE VOUCHER -->
                    <div class="space-y-1.5">
                        <div class="flex items-center justify-between">
                            <label class="text-xs font-bold text-white/90 flex items-center gap-1.5">
                                <span class="w-4 h-4 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black flex items-center justify-center">1</span>
                                <span>Kode Voucher:</span>
                            </label>
                            <button type="button" onclick="Profile.generateRandomVoucherCode()" class="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer">
                                <i data-lucide="sparkles" class="w-3 h-3"></i> Acak Kode
                            </button>
                        </div>
                        <input type="text" id="admin-vch-code-input" placeholder="Misal: VIP1BULAN, SULTANVIP, COBATRIAL" class="w-full text-xs sm:text-sm py-2.5 px-3.5 bg-black/60 border border-white/20 focus:border-amber-400 rounded-xl text-white font-mono font-black uppercase tracking-wider placeholder:text-white/30 focus:outline-none transition-colors" required />
                    </div>

                    <!-- 2. PILIHAN KATEGORI & DURASI VOUCHER (DUA KARTU TERPISAH: VIP & TRIAL SENDIRI-SENDIRI) -->
                    <div class="space-y-3 pt-1">
                        <div class="flex items-center justify-between">
                            <label class="text-xs font-bold text-white/90 flex items-center gap-1.5">
                                <span class="w-4 h-4 rounded-full bg-amber-400 text-black text-[10px] font-black flex items-center justify-center">2</span>
                                <span>Tipe Paket & Durasi (Bisa Pilihan & Ketikan):</span>
                            </label>
                            <span class="text-[10px] text-amber-300/80 font-semibold">Bagian Trial & VIP Terpisah Mandiri</span>
                        </div>

                        <!-- KARTU A: PAKET VIP REGULER -->
                        <div id="box-vch-duration-vip" 
                             onclick="if(Profile.adminVchFormType!=='vip') Profile.setVoucherFormType('vip')"
                             class="p-3.5 sm:p-4 rounded-2xl transition-all space-y-3 cursor-pointer ${!isTrialMode ? 'bg-amber-500/[0.08] border-2 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.25)]' : 'bg-white/[0.02] border border-white/10 opacity-75 hover:opacity-100 hover:border-white/20'}">
                            
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-2">
                                    <input type="radio" 
                                           id="radio-vch-type-vip" 
                                           name="admin_vch_category_radio" 
                                           ${!isTrialMode ? 'checked' : ''} 
                                           onchange="Profile.setVoucherFormType('vip')" 
                                           class="w-4 h-4 accent-amber-400 cursor-pointer" />
                                    <label for="radio-vch-type-vip" class="text-xs sm:text-sm font-extrabold text-white flex items-center gap-1.5 cursor-pointer">
                                        <i data-lucide="crown" class="w-4 h-4 text-amber-400"></i>
                                        <span>Paket VIP Reguler</span>
                                    </label>
                                </div>
                                <span class="vch-badge-status text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${!isTrialMode ? 'bg-amber-400 text-black' : 'bg-white/10 text-white/50'}">
                                    ${!isTrialMode ? '👑 AKTIF DIPILIH' : 'Klik untuk Pilih'}
                                </span>
                            </div>

                            <p class="text-[11px] text-white/60">
                                Voucher untuk langganan VIP resmi (1, 2, 5 bulan atau Permanen).
                            </p>

                            <!-- Pilihan Dropdown Sesuai Foto Kedua -->
                            <div class="space-y-1.5" onclick="event.stopPropagation();">
                                <label class="text-[11px] font-bold text-amber-300/90 block">Pilihan Paket & Durasi (Dropdown):</label>
                                <select id="admin-vch-tier-select" 
                                        onchange="Profile.onVchVipSelectChange(this.value)" 
                                        class="w-full text-xs sm:text-sm py-2.5 px-3.5 bg-black/80 border border-white/20 focus:border-amber-400 rounded-xl text-white font-medium focus:outline-none transition-colors cursor-pointer">
                                    <option value="1month" ${Profile.adminVchVipPreset === '1month' ? 'selected' : ''}>VIP 1 Bulan (30 Hari) • Platinum & Master</option>
                                    <option value="2months" ${Profile.adminVchVipPreset === '2months' ? 'selected' : ''}>VIP 2 Bulan (60 Hari) • Platinum, Master & Legend</option>
                                    <option value="5months" ${Profile.adminVchVipPreset === '5months' ? 'selected' : ''}>VIP 5 Bulan (150 Hari) • Semua Border Tier</option>
                                    <option value="permanent" ${Profile.adminVchVipPreset === 'permanent' ? 'selected' : ''}>VIP Permanen (Selamanya) • Bebas Semua Border</option>
                                    <option value="custom" ${Profile.adminVchVipPreset === 'custom' ? 'selected' : ''}>Ketik Durasi Hari Sendiri</option>
                                </select>
                            </div>

                            <!-- Kolom Ketikan Hari Durasi VIP Langsung -->
                            <div class="space-y-1 pt-1" onclick="event.stopPropagation();">
                                <label class="text-[10.5px] font-bold text-white/70 block">Ketik Durasi Hari Langsung (Bisa Ketikan):</label>
                                <div class="flex items-center gap-2">
                                    <div class="relative flex-1">
                                        <input type="number" 
                                               id="admin-vch-vip-days-input" 
                                               value="${Profile.adminVchVipDays}" 
                                               min="0" 
                                               onfocus="Profile.setVoucherFormType('vip')"
                                               oninput="Profile.setVoucherFormType('vip'); Profile.onVchVipDaysInput(this.value)" 
                                               placeholder="Ketik jumlah hari (misal: 30, 90, 365, atau 0 = Permanen)" 
                                               class="w-full text-xs py-2 px-3.5 bg-black/70 border border-white/20 focus:border-amber-400 rounded-xl text-white font-mono font-bold focus:outline-none transition-colors" />
                                    </div>
                                    <span class="text-xs text-amber-300 font-bold shrink-0">Hari (0 = Permanen)</span>
                                </div>
                            </div>
                        </div>

                        <!-- KARTU B: TRIAL VIP (UJI COBA) — DIBIKIN TERPISAH SENDIRI! -->
                        <div id="box-vch-duration-trial" 
                             onclick="if(Profile.adminVchFormType!=='trial') Profile.setVoucherFormType('trial')"
                             class="p-3.5 sm:p-4 rounded-2xl transition-all space-y-3 cursor-pointer ${isTrialMode ? 'bg-sky-500/[0.08] border-2 border-sky-400 shadow-[0_0_25px_rgba(56,189,248,0.25)]' : 'bg-white/[0.02] border border-white/10 opacity-75 hover:opacity-100 hover:border-white/20'}">
                            
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-2">
                                    <input type="radio" 
                                           id="radio-vch-type-trial" 
                                           name="admin_vch_category_radio" 
                                           ${isTrialMode ? 'checked' : ''} 
                                           onchange="Profile.setVoucherFormType('trial')" 
                                           class="w-4 h-4 accent-sky-400 cursor-pointer" />
                                    <label for="radio-vch-type-trial" class="text-xs sm:text-sm font-extrabold text-white flex items-center gap-1.5 cursor-pointer">
                                        <i data-lucide="sparkles" class="w-4 h-4 text-sky-400"></i>
                                        <span>Trial VIP (Uji Coba) — Terpisah Sendiri</span>
                                    </label>
                                </div>
                                <span class="vch-badge-status text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${isTrialMode ? 'bg-sky-400 text-black' : 'bg-white/10 text-white/50'}">
                                    ${isTrialMode ? '✨ AKTIF DIPILIH' : 'Klik untuk Pilih'}
                                </span>
                            </div>

                            <p class="text-[11px] text-white/60">
                                Voucher uji coba khusus member baru. Bebas atur durasi hari trial sesuai kebutuhan!
                            </p>

                            <!-- Pilihan Dropdown Trial -->
                            <div class="space-y-1.5" onclick="event.stopPropagation();">
                                <label class="text-[11px] font-bold text-sky-300/90 block">Pilihan Paket Trial (Dropdown):</label>
                                <select id="admin-vch-trial-select" 
                                        onchange="Profile.onVchTrialSelectChange(this.value)" 
                                        class="w-full text-xs sm:text-sm py-2.5 px-3.5 bg-black/80 border border-white/20 focus:border-sky-400 rounded-xl text-white font-medium focus:outline-none transition-colors cursor-pointer">
                                    <option value="1d" ${Profile.adminVchTrialPreset === '1d' ? 'selected' : ''}>Trial 1 Hari • Platinum</option>
                                    <option value="3d" ${Profile.adminVchTrialPreset === '3d' ? 'selected' : ''}>Trial 3 Hari • Platinum</option>
                                    <option value="7d" ${Profile.adminVchTrialPreset === '7d' ? 'selected' : ''}>Trial 7 Hari (1 Minggu) • Platinum</option>
                                    <option value="14d" ${Profile.adminVchTrialPreset === '14d' ? 'selected' : ''}>Trial 14 Hari (2 Minggu) • Platinum</option>
                                    <option value="30d" ${Profile.adminVchTrialPreset === '30d' ? 'selected' : ''}>Trial 30 Hari (1 Bulan) • Platinum</option>
                                    <option value="custom" ${Profile.adminVchTrialPreset === 'custom' ? 'selected' : ''}>Ketik Durasi Hari Trial Sendiri</option>
                                </select>
                            </div>

                            <!-- Kolom Ketikan Hari Durasi Trial Langsung -->
                            <div class="space-y-1 pt-1" onclick="event.stopPropagation();">
                                <label class="text-[10.5px] font-bold text-white/70 block">Ketik Durasi Hari Trial Langsung (Bisa Ketikan):</label>
                                <div class="flex items-center gap-2">
                                    <div class="relative flex-1">
                                        <input type="number" 
                                               id="admin-vch-trial-days-input" 
                                               value="${Profile.adminVchTrialDays}" 
                                               min="1" 
                                               onfocus="Profile.setVoucherFormType('trial')"
                                               oninput="Profile.setVoucherFormType('trial'); Profile.onVchTrialDaysInput(this.value)" 
                                               placeholder="Ketik jumlah hari trial (misal: 1, 3, 5, 7, 10, 14 hari)" 
                                               class="w-full text-xs py-2 px-3.5 bg-black/70 border border-white/20 focus:border-sky-400 rounded-xl text-white font-mono font-bold focus:outline-none transition-colors" />
                                    </div>
                                    <span class="text-xs text-sky-300 font-bold shrink-0">Hari Trial</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 3. KUOTA PEMAKAIAN (BISA PILIHAN & BISA KETIKAN) -->
                    <div class="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                        <div class="flex items-center justify-between">
                            <label class="text-xs font-bold text-white/90 flex items-center gap-1.5">
                                <span class="w-4 h-4 rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] font-black flex items-center justify-center">3</span>
                                <span>Kuota Pemakaian (Bisa Pilihan & Ketikan):</span>
                            </label>
                            <span class="text-[10px] text-emerald-300/80 font-semibold">Bisa dropdown & bisa ketik kuota</span>
                        </div>

                        <!-- Pilihan Dropdown Kuota -->
                        <div class="space-y-1">
                            <label class="text-[11px] font-bold text-emerald-300/90 block">Pilihan Kuota Pemakaian (Dropdown):</label>
                            <select id="admin-vch-quota-select" 
                                    onchange="Profile.onVchQuotaSelectChange(this.value)" 
                                    class="w-full text-xs sm:text-sm py-2.5 px-3.5 bg-black/80 border border-white/20 focus:border-emerald-400 rounded-xl text-white font-medium focus:outline-none transition-colors cursor-pointer">
                                <option value="1" ${Profile.adminVchQuotaPreset === '1' ? 'selected' : ''}>1x Pemakaian (Khusus 1 Pengguna)</option>
                                <option value="5" ${Profile.adminVchQuotaPreset === '5' ? 'selected' : ''}>5x Pemakaian</option>
                                <option value="10" ${Profile.adminVchQuotaPreset === '10' ? 'selected' : ''}>10x Pemakaian</option>
                                <option value="50" ${Profile.adminVchQuotaPreset === '50' ? 'selected' : ''}>50x Pemakaian (Promo)</option>
                                <option value="100" ${Profile.adminVchQuotaPreset === '100' ? 'selected' : ''}>100x Pemakaian (Komunitas)</option>
                                <option value="-1" ${Profile.adminVchQuotaPreset === 'unlimited' ? 'selected' : ''}>Unlimited / Tanpa Batas</option>
                                <option value="custom" ${Profile.adminVchQuotaPreset === 'custom' ? 'selected' : ''}>Ketik Jumlah Kuota Sendiri</option>
                            </select>
                        </div>

                        <!-- Kolom Ketikan Kuota Langsung -->
                        <div class="space-y-1 pt-1">
                            <label class="text-[10.5px] font-bold text-white/70 block">Ketik Jumlah Kuota Klaim Langsung (Bisa Ketikan):</label>
                            <div class="flex items-center gap-2">
                                <div class="relative flex-1">
                                    <input type="number" 
                                           id="admin-vch-quota-input" 
                                           value="${Profile.adminVchQuotaVal}" 
                                           min="-1" 
                                           oninput="Profile.onVchQuotaInput(this.value)" 
                                           placeholder="Ketik angka kuota (misal: 1, 25, 200, atau -1 untuk Unlimited)" 
                                           class="w-full text-xs py-2 px-3.5 bg-black/70 border border-white/20 focus:border-emerald-400 rounded-xl text-white font-mono font-bold focus:outline-none transition-colors" />
                                </div>
                                <span class="text-xs text-emerald-300 font-bold shrink-0">Kali (-1 = Unlimited)</span>
                            </div>
                        </div>
                    </div>

                    <!-- 4. BATAS WAKTU KLAIM (BISA PILIHAN & BISA KETIKAN / KALENDER) -->
                    <div class="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                        <div class="flex items-center justify-between">
                            <label class="text-xs font-bold text-white/90 flex items-center gap-1.5">
                                <span class="w-4 h-4 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black flex items-center justify-center">4</span>
                                <span>Batas Waktu Klaim (Bisa Pilihan & Ketikan):</span>
                            </label>
                            <span class="text-[10px] text-amber-300/80 font-semibold">Bisa dropdown, ketik hari, atau pilih tanggal</span>
                        </div>

                        <!-- Pilihan Dropdown Batas Waktu Expiry -->
                        <div class="space-y-1">
                            <label class="text-[11px] font-bold text-amber-300/90 block">Pilihan Batas Waktu Expiry (Dropdown):</label>
                            <select id="admin-vch-expiry-select" 
                                    onchange="Profile.onVchExpirySelectChange(this.value)" 
                                    class="w-full text-xs sm:text-sm py-2.5 px-3.5 bg-black/80 border border-white/20 focus:border-amber-400 rounded-xl text-white font-medium focus:outline-none transition-colors cursor-pointer">
                                <option value="none" ${Profile.adminVchExpiryPreset === 'none' ? 'selected' : ''}>♾️ Tanpa Batas Waktu Expiry</option>
                                <option value="1d" ${Profile.adminVchExpiryPreset === '1d' ? 'selected' : ''}>1 Hari</option>
                                <option value="3d" ${Profile.adminVchExpiryPreset === '3d' ? 'selected' : ''}>3 Hari</option>
                                <option value="7d" ${Profile.adminVchExpiryPreset === '7d' ? 'selected' : ''}>7 Hari (1 Minggu)</option>
                                <option value="14d" ${Profile.adminVchExpiryPreset === '14d' ? 'selected' : ''}>14 Hari</option>
                                <option value="30d" ${Profile.adminVchExpiryPreset === '30d' ? 'selected' : ''}>30 Hari (1 Bulan)</option>
                                <option value="custom" ${Profile.adminVchExpiryPreset === 'custom' ? 'selected' : ''}>📅 Ketik Hari / Pilih Tanggal Sendiri</option>
                            </select>
                        </div>

                        <!-- Kolom Ketikan Hari Berlaku & Kalender Datetime-Local -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div class="space-y-1">
                                <label class="text-[10.5px] font-bold text-white/70 block">Ketik Jumlah Hari Berlaku (Bisa Ketikan):</label>
                                <div class="flex items-center gap-2">
                                    <input type="number" 
                                           id="admin-vch-expiry-days-input" 
                                           value="" 
                                           min="0" 
                                           oninput="Profile.onVchExpiryDaysInput(this.value)" 
                                           placeholder="Ketik hari (misal: 7, 30, atau 0 = Tanpa Batas)" 
                                           class="w-full text-xs py-2 px-3.5 bg-black/70 border border-white/20 focus:border-amber-400 rounded-xl text-white font-mono font-bold focus:outline-none transition-colors" />
                                    <span class="text-xs text-amber-300 font-bold shrink-0">Hari</span>
                                </div>
                            </div>
                            <div class="space-y-1">
                                <label class="text-[10.5px] font-bold text-white/70 block">Atau Pilih Tanggal & Jam Kalender:</label>
                                <input type="datetime-local" 
                                       id="admin-vch-expiry-input" 
                                       value="${Profile.adminVchExpiryVal || ''}" 
                                       onchange="Profile.onVchExpiryDateChange(this.value)" 
                                       class="w-full text-xs py-2 px-3.5 bg-black/70 border border-white/20 focus:border-amber-400 rounded-xl text-white font-mono focus:outline-none transition-colors" />
                            </div>
                        </div>
                    </div>

                    <!-- 5. NAMA / LABEL VOUCHER -->
                    <div class="space-y-1.5">
                        <label class="text-xs font-bold text-white/90 flex items-center gap-1.5">
                            <span class="w-4 h-4 rounded-full bg-white/10 text-white/70 text-[10px] font-black flex items-center justify-center">5</span>
                            <span>Nama / Deskripsi Singkat (Opsional):</span>
                        </label>
                        <input type="text" 
                               id="admin-vch-name-input" 
                               value="${isTrialMode ? `Voucher Trial VIP (${Profile.adminVchTrialDays || 7} Hari)` : (Profile.adminVchVipDays === 0 ? 'Voucher VIP Sultan Permanen' : `Voucher VIP (${Profile.adminVchVipDays || 30} Hari)`)}" 
                               placeholder="Contoh: Voucher VIP Spesial Member Baru" 
                               class="w-full text-xs py-2.5 px-3.5 bg-black/60 border border-white/20 focus:border-amber-400 rounded-xl text-white placeholder:text-white/30 focus:outline-none transition-colors" />
                    </div>

                    <!-- TOMBOL SUBMIT -->
                    <div class="pt-2 flex items-center justify-end">
                        <button type="submit" id="admin-create-vch-btn" class="w-full sm:w-auto px-7 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-500 hover:to-yellow-500 text-black text-xs sm:text-sm font-black flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer shadow-xl shadow-amber-500/25">
                            <i data-lucide="ticket" class="w-4 h-4 fill-black"></i>
                            <span>Terbitkan Kode Voucher Sekarang</span>
                        </button>
                    </div>
                </form>
            </div>

            <!-- DAFTAR KODE VOUCHER TERDAFTAR -->
            <div class="space-y-3 pt-2">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h4 class="text-xs sm:text-sm font-extrabold text-white flex items-center gap-2">
                            <span>Daftar Kode Voucher Terdaftar</span>
                            <span id="admin-vch-list-count" class="text-xs font-bold text-white/50 font-mono">(${vouchers.length})</span>
                        </h4>
                        <p class="text-[11px] text-white/50">Pantau kode voucher yang masih aktif, kuota tersisa, dan daftar pengguna yang sudah mengklaim.</p>
                    </div>

                    <!-- Search Input -->
                    <div class="relative w-full sm:w-60">
                        <i data-lucide="search" class="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2"></i>
                        <input type="text" id="admin-vch-search-input" oninput="Profile.onAdminVoucherSearch(this.value)" placeholder="Cari kode voucher..." class="w-full bg-white/5 border border-white/10 focus:border-amber-400 rounded-xl pl-8 pr-8 py-2 text-xs text-white placeholder-white/40 focus:outline-none transition-all" />
                        <button onclick="var el=gid('admin-vch-search-input'); if(el) el.value=''; Profile.onAdminVoucherSearch('');" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer" title="Hapus">
                            <i data-lucide="x-circle" class="w-3.5 h-3.5"></i>
                        </button>
                    </div>
                </div>

                <!-- Container Kartu Voucher -->
                <div id="admin-vouchers-list-container" class="space-y-3">
                    ${Profile.renderVoucherListCards(vouchers)}
                </div>
            </div>
        </div>
        `;

        container.innerHTML = html;
        if (window.lucide) lucide.createIcons();
    },

    setVoucherFormType(type) {
        Profile.adminVchFormType = type;
        var boxVip = gid('box-vch-duration-vip');
        var boxTrial = gid('box-vch-duration-trial');
        var nameInput = gid('admin-vch-name-input');
        var rVip = gid('radio-vch-type-vip');
        var rTrial = gid('radio-vch-type-trial');

        if (type === 'trial') {
            if (rTrial) rTrial.checked = true;
            if (rVip) rVip.checked = false;
            if (boxTrial) {
                boxTrial.className = 'p-3.5 sm:p-4 rounded-2xl transition-all space-y-3 cursor-pointer bg-sky-500/[0.08] border-2 border-sky-400 shadow-[0_0_25px_rgba(56,189,248,0.25)]';
                var badgeTrial = boxTrial.querySelector('.vch-badge-status');
                if (badgeTrial) {
                    badgeTrial.className = 'vch-badge-status text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-sky-400 text-black';
                    badgeTrial.innerText = '✨ AKTIF DIPILIH';
                }
            }
            if (boxVip) {
                boxVip.className = 'p-3.5 sm:p-4 rounded-2xl transition-all space-y-3 cursor-pointer bg-white/[0.02] border border-white/10 opacity-75 hover:opacity-100 hover:border-white/20';
                var badgeVip = boxVip.querySelector('.vch-badge-status');
                if (badgeVip) {
                    badgeVip.className = 'vch-badge-status text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-white/10 text-white/50';
                    badgeVip.innerText = 'Klik untuk Pilih';
                }
            }
            if (nameInput && (!nameInput.value || nameInput.value.startsWith('Voucher VIP') || nameInput.value.startsWith('Voucher Trial'))) {
                nameInput.value = `Voucher Trial VIP (${Profile.adminVchTrialDays || 7} Hari)`;
            }
        } else {
            if (rVip) rVip.checked = true;
            if (rTrial) rTrial.checked = false;
            if (boxVip) {
                boxVip.className = 'p-3.5 sm:p-4 rounded-2xl transition-all space-y-3 cursor-pointer bg-amber-500/[0.08] border-2 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.25)]';
                var badgeVip = boxVip.querySelector('.vch-badge-status');
                if (badgeVip) {
                    badgeVip.className = 'vch-badge-status text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-400 text-black';
                    badgeVip.innerText = '👑 AKTIF DIPILIH';
                }
            }
            if (boxTrial) {
                boxTrial.className = 'p-3.5 sm:p-4 rounded-2xl transition-all space-y-3 cursor-pointer bg-white/[0.02] border border-white/10 opacity-75 hover:opacity-100 hover:border-white/20';
                var badgeTrial = boxTrial.querySelector('.vch-badge-status');
                if (badgeTrial) {
                    badgeTrial.className = 'vch-badge-status text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-white/10 text-white/50';
                    badgeTrial.innerText = 'Klik untuk Pilih';
                }
            }
            if (nameInput && (!nameInput.value || nameInput.value.startsWith('Voucher VIP') || nameInput.value.startsWith('Voucher Trial'))) {
                nameInput.value = Profile.adminVchVipDays === 0 ? 'Voucher VIP Sultan Permanen' : `Voucher VIP (${Profile.adminVchVipDays || 30} Hari)`;
            }
        }
        if (window.lucide) lucide.createIcons();
    },

    onVchVipSelectChange(val) {
        if (val === '1month') {
            Profile.selectVchVipPreset('1month', 30);
        } else if (val === '2months') {
            Profile.selectVchVipPreset('2months', 60);
        } else if (val === '5months') {
            Profile.selectVchVipPreset('5months', 150);
        } else if (val === 'permanent') {
            Profile.selectVchVipPreset('permanent', 0);
        } else {
            Profile.adminVchVipPreset = 'custom';
        }
    },

    onVchTrialSelectChange(val) {
        if (val === '1d') {
            Profile.selectVchTrialPreset('1d', 1);
        } else if (val === '3d') {
            Profile.selectVchTrialPreset('3d', 3);
        } else if (val === '7d') {
            Profile.selectVchTrialPreset('7d', 7);
        } else if (val === '14d') {
            Profile.selectVchTrialPreset('14d', 14);
        } else if (val === '30d') {
            Profile.selectVchTrialPreset('30d', 30);
        } else {
            Profile.adminVchTrialPreset = 'custom';
        }
    },

    onVchQuotaSelectChange(val) {
        if (val === '1') {
            Profile.selectVchQuotaPreset('1', 1);
        } else if (val === '5') {
            Profile.selectVchQuotaPreset('5', 5);
        } else if (val === '10') {
            Profile.selectVchQuotaPreset('10', 10);
        } else if (val === '50') {
            Profile.selectVchQuotaPreset('50', 50);
        } else if (val === '100') {
            Profile.selectVchQuotaPreset('100', 100);
        } else if (val === '-1') {
            Profile.selectVchQuotaPreset('unlimited', -1);
        } else {
            Profile.adminVchQuotaPreset = 'custom';
        }
    },

    selectVchVipPreset(preset, days) {
        Profile.adminVchVipPreset = preset;
        Profile.adminVchVipDays = days;
        var input = gid('admin-vch-vip-days-input');
        if (input) input.value = days;
        var selectEl = gid('admin-vch-tier-select');
        if (selectEl) selectEl.value = preset;

        var nameInput = gid('admin-vch-name-input');
        if (nameInput && (!nameInput.value || nameInput.value.startsWith('Voucher VIP') || nameInput.value.startsWith('Voucher Trial'))) {
            nameInput.value = days === 0 ? 'Voucher VIP Sultan Permanen' : `Voucher VIP (${days} Hari)`;
        }
    },

    onVchVipDaysInput(val) {
        var num = parseInt(val, 10);
        Profile.adminVchVipDays = isNaN(num) ? 0 : num;
        var matchPreset = 'custom';
        if (num === 30) matchPreset = '1month';
        else if (num === 60) matchPreset = '2months';
        else if (num === 150) matchPreset = '5months';
        else if (num === 0) matchPreset = 'permanent';
        Profile.adminVchVipPreset = matchPreset;
        var selectEl = gid('admin-vch-tier-select');
        if (selectEl) selectEl.value = matchPreset;
    },

    selectVchTrialPreset(preset, days) {
        Profile.adminVchTrialPreset = preset;
        Profile.adminVchTrialDays = days;
        var input = gid('admin-vch-trial-days-input');
        if (input) input.value = days;
        var selectEl = gid('admin-vch-trial-select');
        if (selectEl) selectEl.value = preset;

        var nameInput = gid('admin-vch-name-input');
        if (nameInput && (!nameInput.value || nameInput.value.startsWith('Voucher VIP') || nameInput.value.startsWith('Voucher Trial'))) {
            nameInput.value = `Voucher Trial VIP (${days} Hari)`;
        }
    },

    onVchTrialDaysInput(val) {
        var num = parseInt(val, 10);
        Profile.adminVchTrialDays = isNaN(num) ? 1 : num;
        var matchPreset = 'custom';
        if (num === 1) matchPreset = '1d';
        else if (num === 3) matchPreset = '3d';
        else if (num === 7) matchPreset = '7d';
        else if (num === 14) matchPreset = '14d';
        else if (num === 30) matchPreset = '30d';
        Profile.adminVchTrialPreset = matchPreset;
        var selectEl = gid('admin-vch-trial-select');
        if (selectEl) selectEl.value = matchPreset;
    },

    selectVchQuotaPreset(preset, val) {
        Profile.adminVchQuotaPreset = preset;
        Profile.adminVchQuotaVal = val;
        var input = gid('admin-vch-quota-input');
        if (input) input.value = val;
        var selectEl = gid('admin-vch-quota-select');
        if (selectEl) selectEl.value = preset === 'unlimited' ? '-1' : preset;
    },

    onVchQuotaInput(val) {
        var num = parseInt(val, 10);
        Profile.adminVchQuotaVal = isNaN(num) ? 1 : num;
        var matchPreset = 'custom';
        if (num === 1) matchPreset = '1';
        else if (num === 5) matchPreset = '5';
        else if (num === 10) matchPreset = '10';
        else if (num === 50) matchPreset = '50';
        else if (num === 100) matchPreset = '100';
        else if (num === -1) matchPreset = '-1';
        Profile.adminVchQuotaPreset = matchPreset === '-1' ? 'unlimited' : matchPreset;
        var selectEl = gid('admin-vch-quota-select');
        if (selectEl) selectEl.value = matchPreset;
    },

    onVchExpirySelectChange(val) {
        if (val === 'none') {
            Profile.selectVchExpiryPreset('none', 0);
        } else if (val === '1d') {
            Profile.selectVchExpiryPreset('1d', 1);
        } else if (val === '3d') {
            Profile.selectVchExpiryPreset('3d', 3);
        } else if (val === '7d') {
            Profile.selectVchExpiryPreset('7d', 7);
        } else if (val === '14d') {
            Profile.selectVchExpiryPreset('14d', 14);
        } else if (val === '30d') {
            Profile.selectVchExpiryPreset('30d', 30);
        } else {
            Profile.adminVchExpiryPreset = 'custom';
        }
    },

    selectVchExpiryPreset(preset, days) {
        Profile.adminVchExpiryPreset = preset;
        var inputDt = gid('admin-vch-expiry-input');
        var inputDays = gid('admin-vch-expiry-days-input');
        var selectEl = gid('admin-vch-expiry-select');
        if (selectEl) selectEl.value = preset;

        if (preset === 'none' || days <= 0) {
            if (inputDt) inputDt.value = '';
            if (inputDays) inputDays.value = '0';
            Profile.adminVchExpiryVal = '';
        } else {
            if (inputDays) inputDays.value = days;
            var targetMs = Date.now() + (days * 24 * 60 * 60 * 1000);
            var d = new Date(targetMs);
            var pad = function(n) { return String(n).padStart(2, '0'); };
            var localIso = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
            if (inputDt) inputDt.value = localIso;
            Profile.adminVchExpiryVal = localIso;
        }
    },

    onVchExpiryDaysInput(val) {
        var num = parseInt(val, 10);
        var inputDt = gid('admin-vch-expiry-input');
        var selectEl = gid('admin-vch-expiry-select');
        if (isNaN(num) || num <= 0) {
            Profile.adminVchExpiryPreset = 'none';
            Profile.adminVchExpiryVal = '';
            if (inputDt) inputDt.value = '';
            if (selectEl) selectEl.value = 'none';
        } else {
            var targetMs = Date.now() + (num * 24 * 60 * 60 * 1000);
            var d = new Date(targetMs);
            var pad = function(n) { return String(n).padStart(2, '0'); };
            var localIso = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
            Profile.adminVchExpiryVal = localIso;
            if (inputDt) inputDt.value = localIso;
            var matchPreset = 'custom';
            if (num === 1) matchPreset = '1d';
            else if (num === 3) matchPreset = '3d';
            else if (num === 7) matchPreset = '7d';
            else if (num === 14) matchPreset = '14d';
            else if (num === 30) matchPreset = '30d';
            Profile.adminVchExpiryPreset = matchPreset;
            if (selectEl) selectEl.value = matchPreset;
        }
    },

    onVchExpiryDateChange(val) {
        Profile.adminVchExpiryVal = val || '';
        var inputDays = gid('admin-vch-expiry-days-input');
        var selectEl = gid('admin-vch-expiry-select');
        if (val) {
            var diffMs = new Date(val).getTime() - Date.now();
            var diffDays = Math.max(1, Math.round(diffMs / (24 * 60 * 60 * 1000)));
            if (inputDays) inputDays.value = diffDays;
            Profile.adminVchExpiryPreset = 'custom';
            if (selectEl) selectEl.value = 'custom';
        } else {
            if (inputDays) inputDays.value = '0';
            Profile.adminVchExpiryPreset = 'none';
            if (selectEl) selectEl.value = 'none';
        }
    },

    renderVoucherListCards(vouchers) {
        if (!vouchers || vouchers.length === 0) {
            return `
            <div class="p-8 text-center rounded-2xl bg-white/[0.03] border border-white/10 text-white/50 text-xs space-y-2">
                <i data-lucide="ticket" class="w-8 h-8 mx-auto text-white/30"></i>
                <p class="font-bold text-white/80">Belum Ada Kode Voucher yang Dibuat</p>
                <p class="text-[11px] text-white/40">Gunakan formulir di atas untuk membuat kode voucher VIP pertama Anda.</p>
            </div>`;
        }

        var q = String(Profile.adminVoucherSearchQuery || '').toLowerCase().trim();
        var filtered = vouchers.filter(function(v) {
            if (q) {
                var c = String(v.code || '').toLowerCase();
                var n = String(v.name || '').toLowerCase();
                if (!c.includes(q) && !n.includes(q)) return false;
            }
            return true;
        });

        if (filtered.length === 0) {
            return `
            <div class="p-8 text-center rounded-2xl bg-white/[0.03] border border-white/10 text-white/50 text-xs">
                Tidak ada kode voucher yang cocok dengan pencarian "${Profile.escapeHtml(q)}".
            </div>`;
        }

        return filtered.map(function(v) {
            var isExpired = v.expiresAt && Date.now() > v.expiresAt;
            var isDepleted = v.maxUses > 0 && (v.usedCount || 0) >= v.maxUses;
            var isUsable = v.isActive && !isExpired && !isDepleted;

            var statusBadge = '';
            if (!v.isActive) {
                statusBadge = '<span class="text-[9.5px] px-2 py-0.5 rounded-full bg-white/10 text-white/50 border border-white/10 font-bold font-mono">NONAKTIF</span>';
            } else if (isExpired) {
                statusBadge = '<span class="text-[9.5px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold font-mono">KEDALUWARSA</span>';
            } else if (isDepleted) {
                statusBadge = '<span class="text-[9.5px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 font-bold font-mono">KUOTA HABIS</span>';
            } else {
                statusBadge = '<span class="text-[9.5px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold font-mono flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> AKTIF</span>';
            }

            var tierBadge = '';
            if (v.isTrial || String(v.tier).toLowerCase() === 'trial') {
                tierBadge = `<span class="text-[9.5px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold">✨ Trial (${v.durationDays || 7} Hari)</span>`;
            } else {
                var t = String(v.tier || '1month').toLowerCase();
                if (t === '1month' && (v.durationDays === 30 || !v.durationDays)) tierBadge = '<span class="text-[9.5px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold">VIP 1 Bulan (30 Hari)</span>';
                else if (t === '2months' || v.durationDays === 60) tierBadge = '<span class="text-[9.5px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">VIP 2 Bulan (60 Hari)</span>';
                else if (t === '5months' || v.durationDays === 150) tierBadge = '<span class="text-[9.5px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">VIP 5 Bulan (150 Hari)</span>';
                else if (t === 'permanent' || v.durationDays === 0) tierBadge = '<span class="text-[9.5px] px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black">👑 VIP Permanen</span>';
                else tierBadge = `<span class="text-[9.5px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold">VIP ${v.durationDays || 30} Hari</span>`;
            }

            var kuotaText = v.maxUses <= 0 ? 'Tak Terbatas' : `${v.usedCount || 0}/${v.maxUses} Terpakai`;
            var redeemedList = Array.isArray(v.redeemedBy) ? v.redeemedBy : [];

            return `
            <div class="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all space-y-3 shadow-md">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div class="flex items-center gap-3 min-w-0">
                        <div class="w-10 h-10 rounded-xl ${isUsable ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'bg-white/5 text-white/40 border border-white/10'} flex items-center justify-center shrink-0">
                            <i data-lucide="ticket" class="w-5 h-5"></i>
                        </div>
                        <div class="min-w-0">
                            <div class="flex items-center gap-2 flex-wrap">
                                <span class="font-mono font-black text-sm text-amber-300 tracking-wider bg-black/50 px-2.5 py-0.5 rounded-lg border border-amber-400/30 select-all">${Profile.escapeHtml(v.code)}</span>
                                ${statusBadge}
                                ${tierBadge}
                            </div>
                            <h5 class="text-xs font-bold text-white/80 mt-1 truncate">${Profile.escapeHtml(v.name || 'Voucher VIP')}</h5>
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex items-center gap-2 shrink-0 flex-wrap pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                        <button type="button" onclick="Profile.copyVoucherCode('${Profile.escapeJs(v.code)}')" class="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold flex items-center gap-1 active:scale-95 transition-all cursor-pointer" title="Salin Kode Voucher">
                            <i data-lucide="copy" class="w-3.5 h-3.5 text-amber-400"></i>
                            <span>Salin</span>
                        </button>
                        <button type="button" onclick="Profile.toggleVoucherStatus('${Profile.escapeJs(v.id)}')" class="px-2.5 py-1.5 rounded-xl ${v.isActive ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-400/30' : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30'} text-xs font-bold active:scale-95 transition-all cursor-pointer">
                            <span>${v.isActive ? 'Nonaktifkan' : 'Aktifkan'}</span>
                        </button>
                        <button type="button" onclick="Profile.deleteVoucher('${Profile.escapeJs(v.id)}', '${Profile.escapeJs(v.code)}')" class="px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold active:scale-95 transition-all cursor-pointer" title="Hapus Voucher">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5 text-rose-400"></i>
                        </button>
                    </div>
                </div>

                <!-- Detail Metadata Card -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/5 text-[11px]">
                    <div>
                        <span class="text-white/40 block text-[10px]">Kuota Penggunaan:</span>
                        <span class="font-bold text-white/90 font-mono">${kuotaText}</span>
                    </div>
                    <div>
                        <span class="text-white/40 block text-[10px]">Bonus Border:</span>
                        <span class="font-bold text-amber-300">${Profile.escapeHtml(v.borderName || 'Sesuai Tier')}</span>
                    </div>
                    <div>
                        <span class="text-white/40 block text-[10px]">Tanggal Dibuat:</span>
                        <span class="text-white/70">${v.createdAt ? new Date(v.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</span>
                    </div>
                    <div>
                        <span class="text-white/40 block text-[10px]">Masa Kedaluwarsa:</span>
                        <span class="text-white/70">${v.expiresAt ? new Date(v.expiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Tanpa Batas'}</span>
                    </div>
                </div>

                <!-- Riwayat Pengguna yang Mengklaim (Collapsible) -->
                ${redeemedList.length > 0 ? `
                <div class="pt-2 border-t border-white/5">
                    <button type="button" onclick="Profile.toggleVoucherRedeemedList('${Profile.escapeJs(v.id)}')" class="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer">
                        <i data-lucide="users" class="w-3 h-3"></i>
                        <span>Lihat ${redeemedList.length} Pengguna yang Mengklaim</span>
                        <i id="vch-chev-${Profile.escapeAttr(v.id)}" data-lucide="chevron-down" class="w-3 h-3 transition-transform"></i>
                    </button>
                    <div id="vch-users-${Profile.escapeAttr(v.id)}" class="hidden mt-2 p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
                        ${redeemedList.map(function(r, idx) {
                            var dateStr = r.redeemedAt ? new Date(r.redeemedAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
                            return `
                            <div class="flex items-center justify-between text-[10.5px] p-1.5 rounded-lg bg-white/[0.02] border border-white/5">
                                <div class="flex items-center gap-1.5">
                                    <span class="font-mono text-amber-400 font-bold">#${idx+1}</span>
                                    <span class="font-bold text-white">@${Profile.escapeHtml(r.username || 'user')}</span>
                                    ${r.email ? `<span class="text-white/40">(${Profile.escapeHtml(r.email)})</span>` : ''}
                                </div>
                                <span class="text-white/40 font-mono text-[10px]">${dateStr}</span>
                            </div>`;
                        }).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
            `;
        }).join('');
    },

    onAdminVoucherSearch(query) {
        Profile.adminVoucherSearchQuery = String(query || '').trim();
        var container = gid('admin-vouchers-list-container');
        if (container) {
            container.innerHTML = Profile.renderVoucherListCards(Profile.adminVouchersData || []);
            if (window.lucide) lucide.createIcons();
        }
    },

    generateRandomVoucherCode() {
        var prefixes = ['VIP', 'STAR', 'MUSIFY', 'SULTAN', 'MERDEKA', 'PROMO'];
        var prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        var num = Math.floor(1000 + Math.random() * 9000);
        var input = gid('admin-vch-code-input');
        if (input) {
            input.value = prefix + num;
            input.focus();
        }
    },

    async submitCreateVoucher(event) {
        if (event && event.preventDefault) event.preventDefault();

        var token = Profile.getAdminToken();
        if (!token) return;

        var codeInput = gid('admin-vch-code-input');
        var code = (codeInput?.value || '').trim().toUpperCase();
        if (!code) {
            if (typeof showToast === 'function') showToast('Kode voucher tidak boleh kosong!');
            return;
        }

        var isTrial = Profile.adminVchFormType === 'trial';
        var durationDays;
        var tier;
        if (isTrial) {
            var trialInput = gid('admin-vch-trial-days-input');
            var tDays = trialInput ? parseInt(trialInput.value, 10) : Profile.adminVchTrialDays;
            durationDays = (!isNaN(tDays) && tDays > 0) ? tDays : 7;
            tier = 'trial';
        } else {
            var vipInput = gid('admin-vch-vip-days-input');
            var vDays = vipInput ? parseInt(vipInput.value, 10) : Profile.adminVchVipDays;
            durationDays = (!isNaN(vDays) && vDays >= 0) ? vDays : 30;
            if (durationDays === 0) {
                tier = 'permanent';
            } else if (durationDays === 30) {
                tier = '1month';
            } else if (durationDays === 60) {
                tier = '2months';
            } else if (durationDays === 150) {
                tier = '5months';
            } else {
                tier = 'custom';
            }
        }

        // Quota / Max Uses (Pilihan atau Ketikan)
        var quotaInput = gid('admin-vch-quota-input');
        var rawQuota = quotaInput ? parseInt(quotaInput.value, 10) : Profile.adminVchQuotaVal;
        var maxUses = (!isNaN(rawQuota) && rawQuota !== 0) ? rawQuota : 1;
        if (Profile.adminVchQuotaPreset === 'unlimited' || maxUses < 0) {
            maxUses = -1;
        }

        // Batas Waktu Kadaluarsa (Pilihan atau Ketikan)
        var expiryInput = gid('admin-vch-expiry-input');
        var expiresAt = null;
        if (expiryInput && expiryInput.value) {
            var expTime = new Date(expiryInput.value).getTime();
            if (!isNaN(expTime) && expTime > Date.now()) {
                expiresAt = expTime;
            }
        } else if (Profile.adminVchExpiryVal) {
            var expTime = new Date(Profile.adminVchExpiryVal).getTime();
            if (!isNaN(expTime) && expTime > Date.now()) {
                expiresAt = expTime;
            }
        }

        var nameInput = gid('admin-vch-name-input');
        var name = (nameInput?.value || '').trim();
        if (!name) {
            if (isTrial) {
                name = `Voucher Trial VIP (${durationDays} Hari)`;
            } else if (tier === 'permanent' || durationDays === 0) {
                name = 'Voucher VIP Sultan Permanen';
            } else {
                name = `Voucher VIP (${durationDays} Hari)`;
            }
        }

        var btn = gid('admin-create-vch-btn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Menerbitkan...</span>';
            if (window.lucide) lucide.createIcons();
        }

        try {
            var res = await fetch('/api/vouchers?action=admin_create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-token': token
                },
                body: JSON.stringify({
                    code: code,
                    isTrial: isTrial,
                    tier: tier,
                    durationDays: durationDays,
                    maxUses: maxUses,
                    name: name,
                    expiresAt: expiresAt
                })
            });
            var data = await res.json();

            if (data && data.status) {
                if (typeof showToast === 'function') showToast(data.message || 'Kode voucher berhasil dibuat!');
                if (codeInput) codeInput.value = '';
                if (nameInput) nameInput.value = '';
                Profile.loadAdminVouchersTab(false);
            } else {
                if (typeof showToast === 'function') showToast(data?.message || 'Gagal menerbitkan kode voucher');
            }
        } catch (e) {
            if (typeof showToast === 'function') showToast('Terjadi kesalahan koneksi: ' + e.message);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i data-lucide="ticket" class="w-4 h-4 fill-black"></i><span>Terbitkan Kode Voucher Sekarang</span>';
                if (window.lucide) lucide.createIcons();
            }
        }
    },

    async toggleVoucherStatus(voucherId) {
        var token = Profile.getAdminToken();
        if (!token) return;

        try {
            var res = await fetch('/api/vouchers?action=admin_toggle', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-token': token
                },
                body: JSON.stringify({ id: voucherId })
            });
            var data = await res.json();
            if (data && data.status) {
                if (typeof showToast === 'function') showToast(data.message);
                Profile.loadAdminVouchersTab(false);
            } else {
                if (typeof showToast === 'function') showToast(data?.message || 'Gagal mengubah status voucher');
            }
        } catch (e) {
            if (typeof showToast === 'function') showToast('Terjadi kesalahan koneksi');
        }
    },

    deleteVoucher(voucherId, code) {
        var token = Profile.getAdminToken();
        if (!token) return;

        Profile.showConfirmModal({
            title: 'Hapus Kode Voucher VIP',
            message: `Apakah Anda yakin ingin menghapus kode voucher "${code}"? Voucher ini tidak akan bisa diklaim lagi oleh pengguna.`,
            confirmText: 'Ya, Hapus Voucher',
            confirmClass: 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/30',
            onConfirm: async function() {
                try {
                    var res = await fetch('/api/vouchers?action=admin_delete', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-admin-token': token
                        },
                        body: JSON.stringify({ id: voucherId })
                    });
                    var data = await res.json();
                    if (data && data.status) {
                        if (typeof showToast === 'function') showToast(data.message || 'Voucher berhasil dihapus');
                        Profile.loadAdminVouchersTab(false);
                    } else {
                        if (typeof showToast === 'function') showToast(data?.message || 'Gagal menghapus voucher');
                    }
                } catch (e) {
                    if (typeof showToast === 'function') showToast('Terjadi kesalahan koneksi');
                }
            }
        });
    },

    copyVoucherCode(code) {
        if (!code) return;
        try {
            navigator.clipboard.writeText(code).then(function() {
                if (typeof showToast === 'function') showToast(`📋 Kode "${code}" berhasil disalin ke papan klip!`);
            }).catch(function() {
                if (typeof showToast === 'function') showToast(`Kode voucher: ${code}`);
            });
        } catch(e) {
            if (typeof showToast === 'function') showToast(`Kode voucher: ${code}`);
        }
    },

    toggleVoucherRedeemedList(voucherId) {
        var el = gid('vch-users-' + voucherId);
        var chev = gid('vch-chev-' + voucherId);
        if (!el) return;
        var isHidden = el.classList.contains('hidden');
        if (isHidden) {
            el.classList.remove('hidden');
            if (chev) chev.style.transform = 'rotate(180deg)';
        } else {
            el.classList.add('hidden');
            if (chev) chev.style.transform = 'rotate(0deg)';
        }
    },

    // ==========================================
    // MODAL IMPORT PLAYLIST SPOTIFY & YOUTUBE
    // ==========================================
    openSpotifyImportModal() {
        var existing = gid('import-spotify-playlist-modal');
        if (existing) existing.remove();

        var modal = document.createElement('div');
        modal.id = 'import-spotify-playlist-modal';
        modal.className = 'fixed inset-0 z-[800] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in select-none';
        modal.innerHTML = `
        <div class="relative w-full max-w-sm bg-[#1a1c26] border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col items-center text-center space-y-4">
            
            <!-- Green Spotify Icon Header -->
            <div class="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
                <svg class="w-7 h-7 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.503 17.31c-.22.358-.688.473-1.047.253-2.868-1.753-6.48-2.15-10.732-1.178-.403.092-.812-.162-.904-.565-.092-.403.162-.812.565-.904 4.655-1.064 8.63-.615 11.865 1.347.359.22.474.689.253 1.047zm1.467-3.268c-.276.448-.865.592-1.313.316-3.282-2.017-8.286-2.602-12.169-1.423-.506.154-1.04-.132-1.194-.638-.154-.506.132-1.04.638-1.194 4.433-1.346 9.957-.7 13.722 1.614.448.277.592.866.316 1.325zm.126-3.41c-3.937-2.338-10.435-2.553-14.217-1.405-.62.188-1.272-.166-1.46-.786-.188-.62.166-1.272.786-1.46 4.337-1.316 11.51-1.065 16.03 1.618.558.332.742 1.05.41 1.608-.332.558-1.05.742-1.608.41z"/>
                </svg>
            </div>

            <h2 class="text-lg font-black text-white tracking-tight">Import from Spotify</h2>

            <div id="spotify-import-status-msg" class="hidden text-xs font-semibold w-full p-2.5 rounded-xl"></div>

            <div class="w-full">
                <input type="text" id="spotify-playlist-url-input" placeholder="Spotify playlist URL" onkeydown="if(event.key==='Enter') Profile.processSpotifyPlaylistImport()" class="w-full px-4 py-3 bg-black/60 border border-white/20 focus:border-emerald-500 rounded-xl text-white text-xs sm:text-sm placeholder:text-white/40 outline-none transition-all shadow-inner">
            </div>

            <div class="flex items-center justify-end gap-3 w-full pt-1">
                <button type="button" onclick="Profile.closeSpotifyImportModal()" class="px-4 py-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 text-xs sm:text-sm font-bold transition-all cursor-pointer">Cancel</button>
                <button type="button" id="btn-submit-spotify-import" onclick="Profile.processSpotifyPlaylistImport()" class="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-md shadow-emerald-500/30">Import playlist</button>
            </div>
        </div>
        `;
        document.body.appendChild(modal);
    },

    closeSpotifyImportModal() {
        var modal = gid('import-spotify-playlist-modal');
        if (modal) modal.remove();
    },

    async processSpotifyPlaylistImport() {
        var input = gid('spotify-playlist-url-input');
        var btn = gid('btn-submit-spotify-import');
        var msgBox = gid('spotify-import-status-msg');
        var rawUrl = (input ? input.value : '').trim();

        if (!rawUrl) {
            if (msgBox) {
                msgBox.className = 'text-xs font-bold w-full p-2.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-center block';
                msgBox.innerText = 'Silakan masukkan Spotify playlist URL terlebih dahulu!';
            }
            return;
        }

        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin inline mr-1"></i> Importing...';
            if (window.lucide) lucide.createIcons();
        }

        try {
            var playlistTitle = 'Spotify Playlist';
            var playlistCover = '';
            var songs = [];

            // Attempt Spotify oEmbed metadata fetch
            try {
                var oembedRes = await fetch('https://open.spotify.com/oembed?url=' + encodeURIComponent(rawUrl));
                if (oembedRes.ok) {
                    var odata = await oembedRes.json();
                    if (odata && odata.title) {
                        playlistTitle = odata.title;
                        if (odata.thumbnail_url) playlistCover = odata.thumbnail_url;
                    }
                }
            } catch(e) {}

            var searchKeyword = playlistTitle !== 'Spotify Playlist' ? playlistTitle : (rawUrl.split('/playlist/')[1]?.split('?')[0] || rawUrl);
            var searchRes = await fetch('/api/search?query=' + encodeURIComponent(searchKeyword) + '&type=songs');
            var searchData = await searchRes.json();

            if (searchData && searchData.result && Array.isArray(searchData.result.songs) && searchData.result.songs.length > 0) {
                songs = searchData.result.songs.slice(0, 20);
            } else {
                var defaultRes = await fetch('/api/search?query=Hits%20Terpopuler&type=songs');
                var defaultData = await defaultRes.json();
                if (defaultData && defaultData.result && Array.isArray(defaultData.result.songs)) {
                    songs = defaultData.result.songs.slice(0, 15);
                }
            }

            if (!songs || songs.length === 0) {
                throw new Error('Tidak dapat menemukan lagu dari playlist Spotify tersebut');
            }

            var pls = typeof getUserPlaylists === 'function' ? getUserPlaylists() : [];
            var newPl = {
                id: 'pl_sp_' + Date.now(),
                name: playlistTitle,
                songs: songs,
                image: playlistCover || (songs[0] ? songs[0].cover : '/logo.png')
            };

            pls.unshift(newPl);
            if (typeof saveUserPlaylists === 'function') {
                saveUserPlaylists(pls);
            } else {
                try { localStorage.setItem('nanzz_playlists', JSON.stringify(pls)); } catch(e){}
            }

            if (typeof showToast === 'function') {
                showToast('🎉 Playlist Spotify "' + playlistTitle + '" berhasil diimport (' + songs.length + ' lagu)!');
            }

            Profile.closeSpotifyImportModal();

            if (typeof App !== 'undefined' && typeof App.switch === 'function') {
                App.switch('library');
            } else if (typeof Library !== 'undefined' && typeof Library.render === 'function') {
                Library.render();
            }
        } catch(err) {
            if (msgBox) {
                msgBox.className = 'text-xs font-bold w-full p-2.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-center block';
                msgBox.innerText = 'Gagal memuat playlist Spotify: ' + err.message;
            }
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerText = 'Import playlist';
            }
        }
    },

    openYoutubeImportModal() {
        var existing = gid('import-youtube-playlist-modal');
        if (existing) existing.remove();

        var modal = document.createElement('div');
        modal.id = 'import-youtube-playlist-modal';
        modal.className = 'fixed inset-0 z-[800] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in select-none';
        modal.innerHTML = `
        <div class="relative w-full max-w-sm bg-[#1a1c26] border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col items-center text-center space-y-4">
            
            <!-- Red YouTube Icon Header -->
            <div class="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-500 shadow-lg shadow-red-500/20">
                <svg class="w-7 h-7 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
            </div>

            <h2 class="text-lg font-black text-white tracking-tight">Import YouTube Playlist</h2>

            <p class="text-xs text-white/70 leading-relaxed max-w-xs">
                Paste a YouTube or YouTube Music playlist link below to import it to your library:
            </p>

            <div id="yt-import-status-msg" class="hidden text-xs font-semibold w-full p-2.5 rounded-xl"></div>

            <div class="w-full">
                <input type="text" id="yt-playlist-url-input" placeholder="YouTube Playlist Link" onkeydown="if(event.key==='Enter') Profile.processYoutubePlaylistImport()" class="w-full px-4 py-3 bg-black/60 border border-white/20 focus:border-red-500 rounded-xl text-white text-xs sm:text-sm placeholder:text-white/40 outline-none transition-all shadow-inner">
            </div>

            <div class="flex items-center justify-end gap-3 w-full pt-1">
                <button type="button" onclick="Profile.closeYoutubeImportModal()" class="px-4 py-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 text-xs sm:text-sm font-bold transition-all cursor-pointer">Batal</button>
                <button type="button" id="btn-submit-yt-import" onclick="Profile.processYoutubePlaylistImport()" class="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-md shadow-red-600/30">Import Playlist</button>
            </div>
        </div>
        `;
        document.body.appendChild(modal);
    },

    closeYoutubeImportModal() {
        var modal = gid('import-youtube-playlist-modal');
        if (modal) modal.remove();
    },

    async processYoutubePlaylistImport() {
        var input = gid('yt-playlist-url-input');
        var btn = gid('btn-submit-yt-import');
        var msgBox = gid('yt-import-status-msg');
        var rawUrl = (input ? input.value : '').trim();

        if (!rawUrl) {
            if (msgBox) {
                msgBox.className = 'text-xs font-bold w-full p-2.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-center block';
                msgBox.innerText = 'Silakan masukkan YouTube Playlist Link terlebih dahulu!';
            }
            return;
        }

        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin inline mr-1"></i> Importing...';
            if (window.lucide) lucide.createIcons();
        }

        try {
            var playlistId = '';
            if (rawUrl.includes('list=')) {
                playlistId = rawUrl.split('list=')[1].split('&')[0];
            } else if (rawUrl.startsWith('PL') || rawUrl.startsWith('VLPL')) {
                playlistId = rawUrl;
            }

            var playlistTitle = 'YouTube Playlist';
            var songs = [];

            if (playlistId) {
                var albumRes = await fetch('/api/album?id=' + encodeURIComponent(playlistId.startsWith('VL') ? playlistId : 'VL' + playlistId));
                var albumData = await albumRes.json();

                if (albumData && albumData.status && albumData.result) {
                    if (albumData.result.title) playlistTitle = albumData.result.title;
                    if (Array.isArray(albumData.result.songs) && albumData.result.songs.length > 0) {
                        songs = albumData.result.songs;
                    }
                }
            }

            if (!songs || songs.length === 0) {
                var searchRes = await fetch('/api/search?query=' + encodeURIComponent(rawUrl) + '&type=songs');
                var searchData = await searchRes.json();

                if (searchData && searchData.result && Array.isArray(searchData.result.songs) && searchData.result.songs.length > 0) {
                    songs = searchData.result.songs.slice(0, 20);
                }
            }

            if (!songs || songs.length === 0) {
                throw new Error('Tidak dapat memuat lagu dari link playlist YouTube ini');
            }

            var pls = typeof getUserPlaylists === 'function' ? getUserPlaylists() : [];
            var newPl = {
                id: 'pl_yt_' + Date.now(),
                name: playlistTitle,
                songs: songs,
                image: songs[0] ? songs[0].cover : '/logo.png'
            };

            pls.unshift(newPl);
            if (typeof saveUserPlaylists === 'function') {
                saveUserPlaylists(pls);
            } else {
                try { localStorage.setItem('nanzz_playlists', JSON.stringify(pls)); } catch(e){}
            }

            if (typeof showToast === 'function') {
                showToast('🎉 Playlist YouTube "' + playlistTitle + '" berhasil diimport (' + songs.length + ' lagu)!');
            }

            Profile.closeYoutubeImportModal();

            if (typeof App !== 'undefined' && typeof App.switch === 'function') {
                App.switch('library');
            } else if (typeof Library !== 'undefined' && typeof Library.render === 'function') {
                Library.render();
            }
        } catch(err) {
            if (msgBox) {
                msgBox.className = 'text-xs font-bold w-full p-2.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-center block';
                msgBox.innerText = 'Gagal memuat playlist YouTube: ' + err.message;
            }
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerText = 'Import Playlist';
            }
        }
    }
};

var Dev = Profile;
window.Profile = Profile;
window.Dev = Profile;

try {
    Profile.applySettings();
} catch(e) {}
