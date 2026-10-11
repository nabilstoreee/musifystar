// =========================================================================
// MusifyStar - Live Real-time Clock & Islamic Countdown Widget (Ramadhan, Idul Fitri, Idul Adha)
// =========================================================================

var IslamicClock = {
    activeTab: 'ramadhan', // 'ramadhan' | 'idul_fitri' | 'idul_adha'
    timerInterval: null,

    // Upcoming Islamic event schedules (Gregorian projection)
    events: {
        ramadhan: {
            id: 'ramadhan',
            name: 'Ramadhan',
            title: 'Waktu Mundur Awal Puasa Ramadhan',
            badge: '1 Ramadhan',
            icon: 'moon',
            accent: '#38bdf8', // Sky Blue
            accentBg: 'rgba(56, 189, 248, 0.15)',
            border: 'rgba(56, 189, 248, 0.35)',
            searchQuery: 'Lagu Religi Ramadhan',
            dates: [
                '2026-02-18T00:00:00',
                '2027-02-08T00:00:00',
                '2028-01-28T00:00:00',
                '2029-01-16T00:00:00',
                '2030-01-05T00:00:00'
            ]
        },
        idul_fitri: {
            id: 'idul_fitri',
            name: 'Idul Fitri',
            title: 'Waktu Mundur Hari Raya Idul Fitri',
            badge: '1 Syawal',
            icon: 'sparkles',
            accent: '#34d399', // Emerald Green
            accentBg: 'rgba(52, 211, 153, 0.15)',
            border: 'rgba(52, 211, 153, 0.35)',
            searchQuery: 'Lagu Lebaran Idul Fitri',
            dates: [
                '2026-03-20T00:00:00',
                '2027-03-10T00:00:00',
                '2028-02-27T00:00:00',
                '2029-02-15T00:00:00',
                '2030-02-04T00:00:00'
            ]
        },
        idul_adha: {
            id: 'idul_adha',
            name: 'Idul Adha',
            title: 'Waktu Mundur Hari Raya Idul Adha',
            badge: '10 Dzulhijjah',
            icon: 'heart-handshake',
            accent: '#fbbf24', // Amber Gold
            accentBg: 'rgba(251, 191, 36, 0.15)',
            border: 'rgba(251, 191, 36, 0.35)',
            searchQuery: 'Takbiran Idul Adha Religi',
            dates: [
                '2026-05-27T00:00:00',
                '2027-05-16T00:00:00',
                '2028-05-05T00:00:00',
                '2029-04-24T00:00:00',
                '2030-04-14T00:00:00'
            ]
        }
    },

    getNextTargetDate(eventKey) {
        var event = IslamicClock.events[eventKey];
        if (!event) return null;
        var nowMs = Date.now();
        for (var i = 0; i < event.dates.length; i++) {
            var d = new Date(event.dates[i]);
            if (d.getTime() > nowMs) {
                return d;
            }
        }
        // Fallback default +365 days if table ends
        return new Date(nowMs + 365 * 24 * 3600 * 1000);
    },

    getTimeDifference(targetDate) {
        if (!targetDate) return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
        var diff = targetDate.getTime() - Date.now();
        if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, isPassed: true };

        var seconds = Math.floor((diff / 1000) % 60);
        var minutes = Math.floor((diff / (1000 * 60)) % 60);
        var hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        var days = Math.floor(diff / (1000 * 60 * 60 * 24));

        return {
            days: days,
            hours: hours,
            minutes: minutes,
            seconds: seconds,
            totalMs: diff,
            isPassed: false
        };
    },

    formatDateFull(now) {
        var days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        var months = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        var dayName = days[now.getDay()];
        var dateNum = now.getDate();
        var monthName = months[now.getMonth()];
        var yearNum = now.getFullYear();

        return dayName + ', ' + dateNum + ' ' + monthName + ' ' + yearNum;
    },

    formatTimeDigital(now) {
        var h = String(now.getHours()).padStart(2, '0');
        var m = String(now.getMinutes()).padStart(2, '0');
        var s = String(now.getSeconds()).padStart(2, '0');
        return h + ':' + m + ':' + s;
    },

    setTab(tabKey) {
        if (IslamicClock.events[tabKey]) {
            IslamicClock.activeTab = tabKey;
            IslamicClock.updateCountdownDOM();
        }
    },

    init() {
        if (IslamicClock.timerInterval) {
            clearInterval(IslamicClock.timerInterval);
        }

        IslamicClock.renderContainers();
        IslamicClock.updateCountdownDOMForProfileCard();
        IslamicClock.tick();
        IslamicClock.timerInterval = setInterval(IslamicClock.tick, 1000);
    },

    renderContainers() {
        var slots = ['home-live-clock-slot', 'profile-live-clock-slot'];
        slots.forEach(function(slotId) {
            IslamicClock.renderSlot(slotId);
        });
    },

    renderSlot(slotId) {
        var container = gid(slotId);
        if (!container) return;

        var currentEvent = IslamicClock.events[IslamicClock.activeTab] || IslamicClock.events.ramadhan;
        var prefix = (slotId === 'profile-live-clock-slot') ? 'prof-' : '';

        var tabsHtml = ['ramadhan', 'idul_fitri', 'idul_adha'].map(function(k) {
            var ev = IslamicClock.events[k];
            var isAct = (IslamicClock.activeTab === k);
            return '<button onclick="IslamicClock.setTab(\'' + k + '\')" class="' + prefix + 'islamic-tab-btn px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ' + (isAct
                ? 'bg-white text-black shadow-md shadow-white/20 border border-white scale-[1.03]'
                : 'bg-white/[0.08] hover:bg-white/[0.14] text-white/80 hover:text-white border border-white/20 backdrop-blur-md') + '">' +
                '<i data-lucide="' + ev.icon + '" class="w-3.5 h-3.5 ' + (isAct ? 'text-black' : '') + '"></i>' +
                '<span>' + es(ev.name) + '</span>' +
            '</button>';
        }).join('');

        container.innerHTML = `
        <div class="rounded-3xl p-4 sm:p-5 border border-white/20 bg-white/[0.08] backdrop-blur-xl shadow-lg relative overflow-hidden transition-all duration-300 select-none mb-3.5">
            <!-- Ambient Background Glow -->
            <div id="${prefix}islamic-clock-ambient" class="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-20 transition-all duration-700" style="background: ${currentEvent.accent};"></div>

            <!-- 1. Real-time Live Clock & Date Header (HP Synchronized) -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 mb-3.5 border-b border-white/10 relative z-10">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-inner">
                        <i data-lucide="clock" class="w-5 h-5 text-amber-300 animate-pulse"></i>
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <span id="${prefix}live-time-text" class="text-xl sm:text-2xl font-black text-white font-mono tracking-wider drop-shadow-sm">00:00:00</span>
                            <span class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                                LIVE
                            </span>
                        </div>
                        <p id="${prefix}live-date-text" class="text-xs text-white/70 mt-0.5 font-medium leading-tight">Memuat tanggal...</p>
                    </div>
                </div>

                <!-- Event Filter Chips Tabs -->
                <div class="flex items-center gap-1.5 overflow-x-auto hide-scrollbar py-0.5 -mx-1 px-1">
                    ${tabsHtml}
                </div>
            </div>

            <!-- 2. Countdown Display Area -->
            <div id="${prefix}islamic-countdown-area" class="relative z-10 space-y-3">
                <!-- Rendered dynamically by updateCountdownDOM -->
            </div>
        </div>`;

        if (window.lucide) lucide.createIcons();
        IslamicClock.updateCountdownDOMForPrefix(prefix);
    },

    updateCountdownDOM() {
        IslamicClock.updateCountdownDOMForPrefix('');
        IslamicClock.updateCountdownDOMForProfileCard();
    },

    updateCountdownDOMForProfileCard() {
        var area = gid('prof-islamic-countdown-area');
        if (!area) return;

        var ev = IslamicClock.events[IslamicClock.activeTab] || IslamicClock.events.ramadhan;
        var targetDate = IslamicClock.getNextTargetDate(IslamicClock.activeTab);
        var diff = IslamicClock.getTimeDifference(targetDate);
        var targetDateStr = targetDate ? IslamicClock.formatDateFull(targetDate) : '-';

        // Update tab buttons style in profile modal
        var btns = document.querySelectorAll('.prof-islamic-tab-btn');
        var keys = ['ramadhan', 'idul_fitri', 'idul_adha'];
        btns.forEach(function(b, idx) {
            var isAct = (keys[idx] === IslamicClock.activeTab);
            b.className = 'prof-islamic-tab-btn px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ' + (isAct
                ? 'bg-white text-black shadow-md border border-white scale-[1.02]'
                : 'bg-white/[0.08] hover:bg-white/[0.14] text-white/80 border border-white/20');
        });

        area.innerHTML = `
        <div class="flex items-center justify-between gap-2 flex-wrap mb-1">
            <span class="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border leading-none" style="background: ${ev.accentBg}; color: ${ev.accent}; border-color: ${ev.border};">
                <i data-lucide="${ev.icon}" class="w-3 h-3"></i> ${ev.badge}
            </span>
            <span class="text-[11px] text-white/80 font-bold truncate">${ev.title}</span>
        </div>

        <!-- 4 Countdown Digits in Filter Chips Glass Style -->
        <div class="grid grid-cols-4 gap-2 my-2">
            <div class="flex flex-col items-center justify-center p-2 rounded-xl bg-white/[0.06] border border-white/15 backdrop-blur-md text-center">
                <span id="prof-cd-days" class="text-lg sm:text-xl font-black text-white font-mono leading-none">${diff.days}</span>
                <span class="text-[9px] font-bold text-white/60 uppercase mt-1">Hari</span>
            </div>
            <div class="flex flex-col items-center justify-center p-2 rounded-xl bg-white/[0.06] border border-white/15 backdrop-blur-md text-center">
                <span id="prof-cd-hours" class="text-lg sm:text-xl font-black text-white font-mono leading-none">${String(diff.hours).padStart(2, '0')}</span>
                <span class="text-[9px] font-bold text-white/60 uppercase mt-1">Jam</span>
            </div>
            <div class="flex flex-col items-center justify-center p-2 rounded-xl bg-white/[0.06] border border-white/15 backdrop-blur-md text-center">
                <span id="prof-cd-minutes" class="text-lg sm:text-xl font-black text-white font-mono leading-none">${String(diff.minutes).padStart(2, '0')}</span>
                <span class="text-[9px] font-bold text-white/60 uppercase mt-1">Menit</span>
            </div>
            <div class="flex flex-col items-center justify-center p-2 rounded-xl bg-white/[0.06] border border-white/15 backdrop-blur-md text-center" style="border-color: ${ev.border};">
                <span id="prof-cd-seconds" class="text-lg sm:text-xl font-black font-mono leading-none animate-pulse" style="color: ${ev.accent};">${String(diff.seconds).padStart(2, '0')}</span>
                <span class="text-[9px] font-bold text-white/60 uppercase mt-1">Detik</span>
            </div>
        </div>

        <div class="flex items-center justify-between text-[10px] text-white/50 pt-0.5">
            <span class="truncate">Perkiraan: <strong class="text-white/80 font-bold">${targetDateStr}</strong></span>
            <button onclick="if(typeof App!=='undefined'&&App.switch){gid('user-profile-modal')?.remove();App.switch('search');var inp=gid('search-input');if(inp){inp.value='${ev.searchQuery}';if(Search&&Search.doSearch)Search.doSearch('${ev.searchQuery}');}}" class="text-[10px] font-bold text-emerald-400 hover:underline cursor-pointer ml-auto shrink-0 flex items-center gap-0.5">
                <i data-lucide="music-2" class="w-3 h-3"></i> Putar Religi
            </button>
        </div>`;

        if (window.lucide) lucide.createIcons();
    },

    updateCountdownDOMForPrefix(prefix) {
        var area = gid(prefix + 'islamic-countdown-area');
        if (!area) return;

        var ev = IslamicClock.events[IslamicClock.activeTab] || IslamicClock.events.ramadhan;
        var targetDate = IslamicClock.getNextTargetDate(IslamicClock.activeTab);
        var diff = IslamicClock.getTimeDifference(targetDate);
        var targetDateStr = targetDate ? IslamicClock.formatDateFull(targetDate) : '-';

        // Update tab buttons style
        var btns = document.querySelectorAll('.' + prefix + 'islamic-tab-btn');
        var keys = ['ramadhan', 'idul_fitri', 'idul_adha'];
        btns.forEach(function(b, idx) {
            var isAct = (keys[idx] === IslamicClock.activeTab);
            b.className = prefix + 'islamic-tab-btn px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ' + (isAct
                ? 'bg-white text-black shadow-md shadow-white/20 border border-white scale-[1.03]'
                : 'bg-white/[0.08] hover:bg-white/[0.14] text-white/80 hover:text-white border border-white/20 backdrop-blur-md');
        });

        var ambient = gid(prefix + 'islamic-clock-ambient');
        if (ambient) ambient.style.background = ev.accent;

        area.innerHTML = `
        <div class="flex items-center justify-between gap-2 flex-wrap">
            <div class="flex items-center gap-2">
                <span class="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border leading-none" style="background: ${ev.accentBg}; color: ${ev.accent}; border-color: ${ev.border};">
                    <i data-lucide="${ev.icon}" class="w-3 h-3"></i> ${ev.badge}
                </span>
                <h4 class="text-xs sm:text-sm font-bold text-white tracking-tight">${ev.title}</h4>
            </div>
            <button onclick="if(typeof App!=='undefined'&&App.switch){App.switch('search');var inp=gid('search-input');if(inp){inp.value='${ev.searchQuery}';if(Search&&Search.doSearch)Search.doSearch('${ev.searchQuery}');}}" class="text-[11px] font-bold text-white/70 hover:text-white px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 transition-all flex items-center gap-1 active:scale-95 cursor-pointer" title="Cari Lagu Islami">
                <i data-lucide="music-2" class="w-3 h-3"></i>
                <span>Putar Musik Religi</span>
            </button>
        </div>

        <!-- 4 Countdown Digits (Days, Hours, Minutes, Seconds) in Filter Chips Style -->
        <div class="grid grid-cols-4 gap-2 sm:gap-3 my-2">
            <!-- Days -->
            <div class="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-white/[0.06] border border-white/15 backdrop-blur-md shadow-inner text-center">
                <span id="${prefix}cd-days" class="text-xl sm:text-3xl font-black text-white font-mono tracking-tight leading-none">${diff.days}</span>
                <span class="text-[9.5px] sm:text-[10px] font-bold text-white/60 uppercase tracking-wider mt-1.5">Hari</span>
            </div>

            <!-- Hours -->
            <div class="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-white/[0.06] border border-white/15 backdrop-blur-md shadow-inner text-center">
                <span id="${prefix}cd-hours" class="text-xl sm:text-3xl font-black text-white font-mono tracking-tight leading-none">${String(diff.hours).padStart(2, '0')}</span>
                <span class="text-[9.5px] sm:text-[10px] font-bold text-white/60 uppercase tracking-wider mt-1.5">Jam</span>
            </div>

            <!-- Minutes -->
            <div class="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-white/[0.06] border border-white/15 backdrop-blur-md shadow-inner text-center">
                <span id="${prefix}cd-minutes" class="text-xl sm:text-3xl font-black text-white font-mono tracking-tight leading-none">${String(diff.minutes).padStart(2, '0')}</span>
                <span class="text-[9.5px] sm:text-[10px] font-bold text-white/60 uppercase tracking-wider mt-1.5">Menit</span>
            </div>

            <!-- Seconds -->
            <div class="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-white/[0.06] border border-white/15 backdrop-blur-md shadow-inner text-center" style="border-color: ${ev.border};">
                <span id="${prefix}cd-seconds" class="text-xl sm:text-3xl font-black font-mono tracking-tight leading-none animate-pulse" style="color: ${ev.accent};">${String(diff.seconds).padStart(2, '0')}</span>
                <span class="text-[9.5px] sm:text-[10px] font-bold text-white/60 uppercase tracking-wider mt-1.5">Detik</span>
            </div>
        </div>

        <!-- Target Date Info Footer -->
        <div class="flex items-center justify-between text-[11px] text-white/50 px-1 pt-0.5">
            <span class="flex items-center gap-1">
                <i data-lucide="calendar" class="w-3.5 h-3.5 text-white/60"></i>
                <span>Perkiraan: <strong class="text-white/80 font-bold">${targetDateStr}</strong></span>
            </span>
            <span class="text-[10px] text-white/40 italic">Mengikuti hisab / waktu lokal</span>
        </div>`;

        if (window.lucide) lucide.createIcons();
    },

    tick() {
        var now = new Date();
        var targetDate = IslamicClock.getNextTargetDate(IslamicClock.activeTab);
        var diff = IslamicClock.getTimeDifference(targetDate);
        var dateStr = IslamicClock.formatDateFull(now);
        var timeStr = IslamicClock.formatTimeDigital(now);

        // Update Profile individual card fields
        var pCardDate = gid('prof-card-live-date');
        var pCardTime = gid('prof-card-live-time');
        if (pCardDate) pCardDate.innerText = dateStr;
        if (pCardTime) pCardTime.innerText = timeStr;

        var pD = gid('prof-cd-days');
        var pH = gid('prof-cd-hours');
        var pM = gid('prof-cd-minutes');
        var pS = gid('prof-cd-seconds');
        if (pD) pD.innerText = diff.days;
        if (pH) pH.innerText = String(diff.hours).padStart(2, '0');
        if (pM) pM.innerText = String(diff.minutes).padStart(2, '0');
        if (pS) pS.innerText = String(diff.seconds).padStart(2, '0');

        // Update Home slot and general slots
        var prefixes = ['', 'prof-'];
        prefixes.forEach(function(prefix) {
            // 1. Update Live Clock & Date
            var timeEl = gid(prefix + 'live-time-text');
            var dateEl = gid(prefix + 'live-date-text');
            if (timeEl) timeEl.innerText = timeStr;
            if (dateEl) dateEl.innerText = dateStr;

            // 2. Update Countdown Digits
            var dEl = gid(prefix + 'cd-days');
            var hEl = gid(prefix + 'cd-hours');
            var mEl = gid(prefix + 'cd-minutes');
            var sEl = gid(prefix + 'cd-seconds');

            if (dEl) dEl.innerText = diff.days;
            if (hEl) hEl.innerText = String(diff.hours).padStart(2, '0');
            if (mEl) mEl.innerText = String(diff.minutes).padStart(2, '0');
            if (sEl) sEl.innerText = String(diff.seconds).padStart(2, '0');
        });
    }
};

// Global helper for searching from banner
if (typeof Search !== 'undefined' && !Search.searchQuery) {
    Search.searchQuery = function(q) {
        if (typeof App !== 'undefined' && App.switch) {
            App.switch('search');
            var input = gid('search-input');
            if (input) {
                input.value = q;
                if (Search.doSearch) Search.doSearch(q);
            }
        }
    };
}
