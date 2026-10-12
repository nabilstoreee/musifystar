/**
 * MusifyStar Client-Side Anti-Tamper & Security Watchdog
 * Melindungi status VIP dari manipulasi DevTools / Console / Storage pada PC & Browser
 * Jika terdeteksi otak-atik, laporkan ke server & blokir IP secara permanen.
 */
(function() {
    'use strict';

    var Security = {
        _isTriggered: false,
        _lastKnownGoodVip: null,
        _lastKnownSignature: null,

        // Laporkan tindakan tampering ke server & kunci layar
        reportTamper: function(reason, detail) {
            if (Security._isTriggered) return;
            Security._isTriggered = true;

            var targetUser = null;
            try {
                targetUser = JSON.parse(localStorage.getItem('musifystar_auth_user') || 'null');
            } catch(e) {}

            var payload = {
                action: 'report_tamper',
                reason: reason || 'Manipulasi status VIP akun via DevTools / Console / Storage',
                detail: detail || '',
                userId: targetUser ? (targetUser.id || targetUser.originalId) : '',
                username: targetUser ? targetUser.username : ''
            };

            // Kirim laporan pelanggaran ke server untuk memblokir IP secara permanen
            try {
                if (navigator.sendBeacon) {
                    var blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
                    navigator.sendBeacon('/api/security?action=report_tamper', blob);
                } else {
                    fetch('/api/security?action=report_tamper', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                        keepalive: true
                    }).catch(function(){});
                }
            } catch(e) {}

            // Hapus semua token & data lokal agar tidak bisa digunakan
            try {
                localStorage.removeItem('musifystar_auth_user');
                localStorage.removeItem('musifystar_auth_token');
                sessionStorage.clear();
            } catch(e) {}

            // Hentikan pemutaran musik seketika
            if (window.MusicPlayer) {
                try {
                    if (typeof MusicPlayer.pause === 'function') MusicPlayer.pause();
                    if (MusicPlayer.sound && typeof MusicPlayer.sound.pause === 'function') MusicPlayer.sound.pause();
                } catch(e) {}
            }

            // Tampilkan layar kunci blokir permanen
            Security.showLockdownScreen(reason);
        },

        // Tampilan Layar Kunci Blokir Permanen
        showLockdownScreen: function(reason) {
            document.documentElement.innerHTML = `
            <!DOCTYPE html>
            <html lang="id">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>AKSES DITOLAK - IP DIBLOKIR</title>
                <style>
                    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
                    body { background: #06070a; color: #fff; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
                    .card { max-width: 520px; width: 100%; background: #0e111a; border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 24px; padding: 32px 24px; text-align: center; box-shadow: 0 0 50px rgba(239, 68, 68, 0.25); }
                    .icon { width: 72px; height: 72px; background: rgba(239, 68, 68, 0.15); border: 2px solid rgba(239, 68, 68, 0.4); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; color: #ef4444; font-size: 32px; }
                    h1 { font-size: 20px; font-weight: 900; color: #ef4444; letter-spacing: 0.5px; margin-bottom: 8px; text-transform: uppercase; }
                    p.desc { font-size: 13px; color: rgba(255, 255, 255, 0.7); line-height: 1.6; margin-bottom: 24px; }
                    .info-box { background: rgba(0, 0, 0, 0.6); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 16px; text-align: left; margin-bottom: 24px; font-size: 12px; }
                    .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
                    .info-row:last-child { margin-bottom: 0; }
                    .info-label { color: rgba(255, 255, 255, 0.4); }
                    .info-val { color: #f87171; font-family: monospace; font-weight: bold; }
                    .badge { display: inline-block; background: rgba(239, 68, 68, 0.2); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.4); padding: 6px 14px; border-radius: 999px; font-size: 11px; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="icon">🚫</div>
                    <h1>AKSES DITOLAK: IP DIBLOKIR</h1>
                    <p class="desc">Sistem mendeteksi percobaan pengubahan / manipulasi status akun VIP secara ilegal melalui DevTools / Console / Storage. Alamat IP dan perangkat Anda telah diblokir secara permanen dari server MusifyStar.</p>
                    <div class="info-box">
                        <div class="info-row">
                            <span class="info-label">Status Akses:</span>
                            <span class="info-val">DIBLOKIR TOTAL (PERMANEN)</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Pelanggaran:</span>
                            <span class="info-val">${reason || 'Manipulasi Akun VIP Ilegal'}</span>
                        </div>
                    </div>
                    <div class="badge">Proteksi Keamanan Anti-DevTools MusifyStar Aktif</div>
                </div>
            </body>
            </html>
            `;
            // Block any further script execution
            throw new Error('Security Lockdown Activated');
        },

        // Sinkronisasi status VIP sah yang terverifikasi dari server
        registerServerUser: function(user) {
            if (!user) {
                Security._lastKnownGoodVip = false;
                Security._lastKnownSignature = null;
                return;
            }
            Security._lastKnownGoodVip = Boolean(user.isPremium && user.vipTier && user.vipTier !== 'none');
            Security._lastKnownSignature = user.vipSignature || null;
        },

        // Periksa integritas local storage dan objek user
        verifyIntegrity: function() {
            if (Security._isTriggered) return;

            try {
                var raw = localStorage.getItem('musifystar_auth_user');
                if (!raw) return;

                var user = JSON.parse(raw);
                if (!user) return;

                var claimedVip = Boolean((user.isPremium || user.isVip || (user.vipTier && user.vipTier !== 'none')));
                
                // Jika user mengklaim VIP, harus memiliki vipSignature sah dari server
                if (claimedVip) {
                    if (!user.vipSignature) {
                        Security.reportTamper('Manipulasi VIP terdeteksi: vipSignature server tidak ada pada akun VIP lokal.');
                        return;
                    }
                    if (Security._lastKnownSignature && user.vipSignature !== Security._lastKnownSignature) {
                        Security.reportTamper('Manipulasi VIP terdeteksi: Signature VIP lokal tidak cocok dengan server.');
                        return;
                    }
                    if (Security._lastKnownGoodVip === false) {
                        Security.reportTamper('Manipulasi VIP terdeteksi: Akun non-VIP diubah menjadi VIP di local storage.');
                        return;
                    }
                }
            } catch(e) {}
        },

        // Inisialisasi pengawasan berkala & interceptor
        init: function() {
            // Jalankan pemeriksaan integritas secara reguler
            setInterval(function() {
                Security.verifyIntegrity();
            }, 1500);

            // Pantau event storage untuk mendeteksi perubahan dari DevTools Application tab
            window.addEventListener('storage', function(e) {
                if (e.key === 'musifystar_auth_user') {
                    Security.verifyIntegrity();
                }
            });

            // Pantau objek Auth jika tersedia
            var checkAuthUser = function() {
                if (window.Auth && window.Auth.currentUser) {
                    var u = window.Auth.currentUser;
                    var claimedVip = Boolean(u.isPremium || u.isVip || (u.vipTier && u.vipTier !== 'none'));
                    if (claimedVip && !u.vipSignature) {
                        Security.reportTamper('Manipulasi objek memori Auth.currentUser.vipTier via Console terdeteksi.');
                    }
                }
            };
            setInterval(checkAuthUser, 2000);
        }
    };

    window.Security = Security;
    Security.init();
})();
