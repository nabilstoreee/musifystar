// MusifyStar - Direct Admin <-> User Private Support Chat Module

(function() {
    'use strict';

    window.AdminChat = {
        activeUserId: null,
        userChatPollInterval: null,
        adminChatPollInterval: null,
        pendingAttachmentBase64: null,
        cachedAdminProfile: null,

        // -------------------------------------------------------------
        // HELPER RENDERERS FOR AVATAR, BORDER FRAME, AND BLUE CHECKMARK
        // -------------------------------------------------------------
        renderAvatarWithBorder: function(avatarUrl, borderUrl, sizePx, extraClass) {
            var size = sizePx || 40;
            var innerSize = Math.round(size * 0.8);
            var borderSize = Math.round(size * 1.52);

            var safeAvatar = avatarUrl || '/auth-logo.png';
            var safeBorder = borderUrl || '';

            return `
            <div class="relative shrink-0 flex items-center justify-center select-none ${extraClass || ''}" style="width: ${size}px; height: ${size}px;">
                <div class="rounded-full overflow-hidden bg-black/90 flex items-center justify-center shadow-inner z-0 ring-1 ring-white/10" style="width: ${innerSize}px; height: ${innerSize}px;">
                    <img src="${AdminChat.escapeAttr(safeAvatar)}" class="w-full h-full object-cover" onerror="this.onerror=null; this.src='/auth-logo.png';" alt="Avatar">
                </div>
                ${safeBorder ? `
                    <img src="${AdminChat.escapeAttr(safeBorder)}" class="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 object-contain z-10 select-none drop-shadow-md" style="width: ${borderSize}px; height: ${borderSize}px; max-width: none;" alt="" onerror="this.onerror=null; this.style.display='none';">
                ` : ''}
            </div>`;
        },

        getAdminBlueCheckmarkHTML: function() {
            return `
            <svg style="width: 14px; height: 14px;" class="shrink-0 inline-block align-middle ml-1" viewBox="0 0 24 24" fill="none" title="Terverifikasi Resmi Admin">
                <circle cx="12" cy="12" r="10" fill="#0095F6"/>
                <path fill-rule="evenodd" clip-rule="evenodd" d="M16.707 8.293a1 1 0 0 1 0 1.414l-6 6a1 1 0 0 1-1.414 0l-3-3a1 1 0 1 1 1.414-1.414L10 13.586l5.293-5.293a1 1 0 0 1 1.414 0z" fill="#FFFFFF"/>
            </svg>`;
        },

        getBorderBadgeHTML: function(borderName, isVip) {
            if (borderName && borderName !== 'none' && borderName !== 'Tanpa Border') {
                var bLower = String(borderName).toLowerCase();
                var badgeClass = 'bg-amber-400/20 text-amber-300 border-amber-400/40';
                var icon = 'shield';
                if (bLower.includes('platinum')) badgeClass = 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40';
                else if (bLower.includes('master')) badgeClass = 'bg-orange-500/20 text-orange-300 border-orange-400/40';
                else if (bLower.includes('legend')) badgeClass = 'bg-yellow-500/20 text-yellow-300 border-yellow-400/40';
                else if (bLower.includes('immortal') || bLower.includes('imortal')) badgeClass = 'bg-pink-500/20 text-pink-300 border-pink-400/40';

                return `
                <span class="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full border text-[9.5px] font-extrabold ${badgeClass} shadow-sm select-none">
                    <i data-lucide="${icon}" class="w-3 h-3"></i>
                    <span>${AdminChat.escapeHtml(borderName)}</span>
                </span>`;
            } else if (isVip) {
                return `
                <span class="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[9.5px] font-extrabold select-none">
                    <i data-lucide="crown" class="w-3 h-3"></i> VIP
                </span>`;
            }
            return '';
        },

        // -------------------------------------------------------------
        // ADMIN DASHBOARD MODAL: Dedicated Direct Chat Inbox Modal for Admin
        // -------------------------------------------------------------
        openAdminDashboardModal: function() {
            var existing = document.getElementById('musifystar-admin-dashboard-modal');
            if (existing) existing.remove();

            var modal = document.createElement('div');
            modal.id = 'musifystar-admin-dashboard-modal';
            modal.className = 'fixed inset-0 z-[870] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xl animate-fade-in select-none';

            modal.innerHTML = `
            <div class="w-full max-w-5xl bg-[#11131c] border border-emerald-500/30 rounded-3xl shadow-2xl flex flex-col h-[90vh] max-h-[780px] overflow-hidden">
                <!-- HEADER: Admin Inbox Header -->
                <div class="px-4 sm:px-6 py-3.5 bg-gradient-to-r from-emerald-950/90 via-[#161a27] to-[#11131c] border-b border-white/10 flex items-center justify-between shrink-0">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 shrink-0">
                            <i data-lucide="message-square" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <div class="flex items-center gap-2">
                                <h3 class="text-sm sm:text-base font-black text-white tracking-wide">Inbox Chat Pengguna & Support Admin</h3>
                                <span class="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">PANEL ADMIN</span>
                            </div>
                            <p class="text-[10.5px] text-white/60 leading-tight">Daftar semua pesan direct pengguna, foto bukti transfer, dan balasan real-time</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="AdminChat.refreshAdminDashboardModal()" class="w-9 h-9 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer border border-white/10" title="Perbarui Chat">
                            <i data-lucide="refresh-cw" class="w-4 h-4 text-emerald-400"></i>
                        </button>
                        <button onclick="AdminChat.closeAdminDashboardModal()" class="w-9 h-9 rounded-2xl bg-white/10 hover:bg-rose-500/20 hover:text-rose-400 active:scale-95 flex items-center justify-center text-white/80 transition-all cursor-pointer border border-white/10" title="Tutup">
                            <i data-lucide="x" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>

                <!-- BODY: RENDER ADMIN CHAT INTERFACE -->
                <div id="admin-dashboard-modal-inner-container" class="flex-1 overflow-hidden p-3 sm:p-4 bg-black/30">
                </div>
            </div>`;

            document.body.appendChild(modal);
            if (window.lucide) lucide.createIcons();

            AdminChat.renderAdminChatTab('admin-dashboard-modal-inner-container');

            // Set auto refresh poll for admin dashboard modal
            if (AdminChat.adminChatPollInterval) clearInterval(AdminChat.adminChatPollInterval);
            AdminChat.adminChatPollInterval = setInterval(function() {
                var modalEl = document.getElementById('musifystar-admin-dashboard-modal');
                if (modalEl) {
                    AdminChat.loadAdminThreads();
                    if (AdminChat.activeUserId) {
                        AdminChat.refreshActiveRoomMessages(AdminChat.activeUserId);
                    }
                } else {
                    clearInterval(AdminChat.adminChatPollInterval);
                }
            }, 3500);
        },

        refreshAdminDashboardModal: function() {
            AdminChat.loadAdminThreads();
            if (AdminChat.activeUserId) {
                AdminChat.selectAdminThread(AdminChat.activeUserId);
            }
        },

        closeAdminDashboardModal: function() {
            if (AdminChat.adminChatPollInterval) clearInterval(AdminChat.adminChatPollInterval);
            var modal = document.getElementById('musifystar-admin-dashboard-modal');
            if (modal) modal.remove();
        },

        // -------------------------------------------------------------
        // USER VIEW: Open Chat Admin Modal
        // -------------------------------------------------------------
        openUserChatModal: function(prefillMessage, prefillAttachment) {
            var isAdmin = (typeof Profile !== 'undefined' && Profile.isAdminLoggedIn && Profile.isAdminLoggedIn()) ||
                          (typeof Auth !== 'undefined' && Auth.currentUser && (Auth.currentUser.role === 'admin' || Auth.currentUser.isAdmin)) ||
                          !!localStorage.getItem('musifystar_admin_token');

            if (isAdmin) {
                return AdminChat.openAdminDashboardModal();
            }

            var existing = document.getElementById('musifystar-admin-chat-modal');
            if (existing) existing.remove();

            var currentUser = (typeof Auth !== 'undefined' && Auth.currentUser) ? Auth.currentUser : null;
            var adminAvatar = (AdminChat.cachedAdminProfile && AdminChat.cachedAdminProfile.avatarUrl) ? AdminChat.cachedAdminProfile.avatarUrl : '/auth-logo.png';
            var adminBorder = (AdminChat.cachedAdminProfile && AdminChat.cachedAdminProfile.borderUrl) ? AdminChat.cachedAdminProfile.borderUrl : '/borders/Imortal.png';

            var modal = document.createElement('div');
            modal.id = 'musifystar-admin-chat-modal';
            modal.className = 'fixed inset-0 z-[860] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xl animate-fade-in select-none';

            modal.innerHTML = `
            <div class="w-full max-w-lg bg-[#11131c] border border-emerald-500/30 rounded-3xl shadow-2xl flex flex-col h-[85vh] max-h-[680px] overflow-hidden">
                <!-- HEADER: Admin Profile Header -->
                <div class="px-4 sm:px-5 py-3.5 bg-gradient-to-r from-emerald-950/80 via-[#161a27] to-[#11131c] border-b border-white/10 flex items-center justify-between shrink-0">
                    <div class="flex items-center gap-3">
                        <div id="user-chat-admin-header-avatar">
                            ${AdminChat.renderAvatarWithBorder(adminAvatar, adminBorder, 42)}
                        </div>
                        <div>
                            <div class="flex items-center gap-1">
                                <h3 class="text-sm font-black text-white tracking-wide">Admin MusifyStar</h3>
                                ${AdminChat.getAdminBlueCheckmarkHTML()}
                                <span class="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase tracking-wider ml-1">OFFICIAL SUPPORT</span>
                            </div>
                            <p class="text-[10.5px] text-white/60 leading-tight">Layanan Bantuan & Konfirmasi VIP Real-Time</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <button onclick="AdminChat.refreshUserMessages()" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer" title="Perbarui Chat">
                            <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                        </button>
                        <button onclick="AdminChat.closeUserChatModal()" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer" title="Tutup">
                            <i data-lucide="x" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>

                <!-- MESSAGES BODY -->
                <div id="user-chat-messages-container" class="flex-1 overflow-y-auto p-4 space-y-3.5 hide-scrollbar bg-black/30">
                    <div class="text-center py-10 text-white/40 space-y-2">
                        <i data-lucide="loader-2" class="w-7 h-7 animate-spin mx-auto text-emerald-400"></i>
                        <p class="text-xs">Memuat percakapan dengan Admin...</p>
                    </div>
                </div>

                <!-- ATTACHMENT PREVIEW CONTAINER -->
                <div id="user-chat-attachment-preview" class="hidden px-4 py-2 bg-black/60 border-t border-emerald-500/30 flex items-center justify-between">
                    <div class="flex items-center gap-2 overflow-hidden">
                        <img id="user-chat-preview-img" src="" class="w-10 h-10 rounded-xl object-cover border border-emerald-400/50">
                        <div class="text-xs text-white/80 truncate">
                            <span class="font-bold text-emerald-400">Foto Siap Dikirim</span>
                            <p class="text-[10px] text-white/50 truncate">Bukti Transfer / Gambar Lampiran</p>
                        </div>
                    </div>
                    <button onclick="AdminChat.clearAttachmentPreview()" class="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center hover:bg-rose-500/30 cursor-pointer">
                        <i data-lucide="x" class="w-3.5 h-3.5"></i>
                    </button>
                </div>

                <!-- INPUT FOOTER -->
                <div class="p-3 bg-[#161825] border-t border-white/10 shrink-0">
                    <form onsubmit="AdminChat.submitUserMessage(event)" class="flex items-center gap-2">
                        <input type="file" id="user-chat-file-input" accept="image/*" class="hidden" onchange="AdminChat.handleFileSelect(event)">

                        <button type="button" onclick="document.getElementById('user-chat-file-input')?.click()" class="w-10 h-10 rounded-2xl bg-white/10 hover:bg-emerald-500/20 text-emerald-400 border border-white/15 flex items-center justify-center shrink-0 active:scale-95 transition-all cursor-pointer" title="Lampirkan Bukti Transfer / Foto">
                            <i data-lucide="image" class="w-5 h-5"></i>
                        </button>

                        <input type="text" id="user-chat-input-text" placeholder="Tulis pesan atau kirim bukti transfer..." class="flex-1 bg-black/50 border border-white/15 focus:border-emerald-400 rounded-2xl px-4 py-2.5 text-xs text-white placeholder:text-white/40 focus:outline-none transition-all">

                        <button type="submit" class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold flex items-center justify-center shrink-0 active:scale-95 transition-all cursor-pointer shadow-md shadow-emerald-500/20">
                            <i data-lucide="send" class="w-4 h-4 fill-black"></i>
                        </button>
                    </form>
                </div>
            </div>`;

            document.body.appendChild(modal);
            if (window.lucide) lucide.createIcons();

            if (prefillMessage) {
                var input = document.getElementById('user-chat-input-text');
                if (input) input.value = prefillMessage;
            }
            if (prefillAttachment) {
                AdminChat.setPendingAttachment(prefillAttachment);
            }

            AdminChat.refreshUserMessages();

            // Start poll interval every 3.5s
            if (AdminChat.userChatPollInterval) clearInterval(AdminChat.userChatPollInterval);
            AdminChat.userChatPollInterval = setInterval(function() {
                if (document.getElementById('musifystar-admin-chat-modal')) {
                    AdminChat.refreshUserMessages(true);
                } else {
                    clearInterval(AdminChat.userChatPollInterval);
                }
            }, 3500);
        },

        closeUserChatModal: function() {
            var modal = document.getElementById('musifystar-admin-chat-modal');
            if (modal) modal.remove();
            if (AdminChat.userChatPollInterval) clearInterval(AdminChat.userChatPollInterval);
        },

        handleFileSelect: function(event) {
            var file = event.target.files && event.target.files[0];
            if (!file) return;

            if (file.size > 10 * 1024 * 1024) {
                if (typeof showToast === 'function') showToast('Ukuran foto terlalu besar (Maks 10MB).');
                return;
            }

            var reader = new FileReader();
            reader.onload = function(e) {
                var base64 = e.target.result;
                AdminChat.setPendingAttachment(base64);
            };
            reader.readAsDataURL(file);
        },

        setPendingAttachment: function(base64) {
            AdminChat.pendingAttachmentBase64 = base64;
            var container = document.getElementById('user-chat-attachment-preview');
            var img = document.getElementById('user-chat-preview-img');
            if (container && img) {
                img.src = base64;
                container.classList.remove('hidden');
            }
        },

        clearAttachmentPreview: function() {
            AdminChat.pendingAttachmentBase64 = null;
            var container = document.getElementById('user-chat-attachment-preview');
            var input = document.getElementById('user-chat-file-input');
            if (container) container.classList.add('hidden');
            if (input) input.value = '';
        },

        refreshUserMessages: async function(silent) {
            var container = document.getElementById('user-chat-messages-container');
            if (!container) return;

            var token = (typeof Auth !== 'undefined' && Auth.token) ? Auth.token : (localStorage.getItem('musifystar_auth_token') || sessionStorage.getItem('musifystar_auth_token') || '');
            var currentUser = (typeof Auth !== 'undefined' && Auth.currentUser) ? Auth.currentUser : null;
            var userId = currentUser ? (currentUser.id || currentUser.uid || currentUser.username) : (localStorage.getItem('musifystar_user_id') || '');

            try {
                var url = '/api/admin-chat?action=get_messages';
                if (userId) url += '&userId=' + encodeURIComponent(userId);

                var headers = {};
                if (token) headers['Authorization'] = 'Bearer ' + token;
                if (userId) headers['x-user-id'] = userId;

                var res = await fetch(url, { headers: headers });
                var data = await res.json();
                if (!data || !data.status) return;

                if (data.adminProfile) {
                    AdminChat.cachedAdminProfile = data.adminProfile;
                    var headerAvatar = document.getElementById('user-chat-admin-header-avatar');
                    if (headerAvatar) {
                        headerAvatar.innerHTML = AdminChat.renderAvatarWithBorder(data.adminProfile.avatarUrl, data.adminProfile.borderUrl, 42);
                    }
                }

                var messages = Array.isArray(data.messages) ? data.messages : [];
                AdminChat.renderUserMessagesList(messages, container, data.adminProfile, data.userProfile);

                // Mark messages read
                var markHeaders = { 'Content-Type': 'application/json' };
                if (token) markHeaders['Authorization'] = 'Bearer ' + token;
                if (userId) markHeaders['x-user-id'] = userId;

                fetch('/api/admin-chat?action=mark_read', {
                    method: 'POST',
                    headers: markHeaders,
                    body: JSON.stringify({ userId: userId })
                }).catch(function(){});

            } catch(e) {
                if (!silent && container) {
                    container.innerHTML = '<p class="text-xs text-rose-400 text-center py-8">Gagal memuat pesan support. Periksa koneksi internet Anda.</p>';
                }
            }
        },

        renderUserMessagesList: function(messages, container, adminProfile, userProfile) {
            if (messages.length === 0) {
                container.innerHTML = `
                <div class="text-center py-12 px-4 space-y-3">
                    <div class="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30 shadow-lg">
                        <i data-lucide="message-circle" class="w-6 h-6"></i>
                    </div>
                    <div class="space-y-1">
                        <h4 class="text-xs font-bold text-white">Selamat datang di Chat Support Admin MusifyStar!</h4>
                        <p class="text-[11px] text-white/50 max-w-xs mx-auto leading-relaxed">
                            Kirimkan bukti transfer QRIS atau pertanyaan Anda di sini. Admin akan merespons secepat mungkin.
                        </p>
                    </div>
                </div>`;
                if (window.lucide) lucide.createIcons();
                return;
            }

            var currentUser = (typeof Auth !== 'undefined' && Auth.currentUser) ? Auth.currentUser : null;
            var currentAvatar = currentUser ? (currentUser.avatar || currentUser.avatarUrl || '') : (userProfile?.avatarUrl || '');
            var currentBorderUrl = (typeof Auth !== 'undefined' && Auth.getBorderUrl) ? Auth.getBorderUrl(currentUser) : (currentUser?.borderUrl || userProfile?.borderUrl || '');
            var currentBorderName = (typeof Auth !== 'undefined' && Auth.getBorderName) ? Auth.getBorderName(currentUser) : (currentUser?.borderName || userProfile?.borderName || '');
            var currentIsVip = currentUser ? Boolean(currentUser.isPremium || currentUser.is_premium || currentUser.isVip) : Boolean(userProfile?.isVip);

            var html = messages.map(function(m) {
                var isAdmin = m.senderRole === 'admin';
                var timeStr = new Date(m.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

                var avatarUrl = isAdmin ? (m.senderAvatarUrl || adminProfile?.avatarUrl || '/auth-logo.png') : (m.senderAvatarUrl || currentAvatar || '/auth-logo.png');
                var borderUrl = isAdmin ? (m.senderBorderUrl || adminProfile?.borderUrl || '/borders/Imortal.png') : (m.senderBorderUrl || currentBorderUrl || '');
                var borderName = isAdmin ? (m.senderBorderName || 'Immortal Admin') : (m.senderBorderName || currentBorderName || '');
                var senderName = isAdmin ? 'Admin MusifyStar' : (m.senderUsername || (currentUser ? currentUser.username : 'Pengguna'));
                var isVip = isAdmin ? true : Boolean(m.senderIsVip || currentIsVip);

                var attachmentHtml = '';
                if (m.attachment) {
                    attachmentHtml = `
                    <div class="mt-2 relative group cursor-pointer overflow-hidden rounded-2xl border border-white/20 bg-black/50" onclick="AdminChat.openImageModal('${AdminChat.escapeAttr(m.attachment)}')">
                        <img src="${AdminChat.escapeAttr(m.attachment)}" class="max-w-[220px] max-h-[220px] object-cover rounded-2xl hover:scale-105 transition-all">
                        <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-all">
                            <i data-lucide="zoom-in" class="w-5 h-5"></i>
                        </div>
                    </div>`;
                }

                if (isAdmin) {
                    // Admin message (Left side)
                    return `
                    <div class="flex items-start gap-2.5 max-w-[88%] sm:max-w-[80%] group">
                        ${AdminChat.renderAvatarWithBorder(avatarUrl, borderUrl, 38)}
                        <div class="space-y-1">
                            <div class="flex items-center gap-1">
                                <span class="text-[11px] font-black text-emerald-400">${AdminChat.escapeHtml(senderName)}</span>
                                ${AdminChat.getAdminBlueCheckmarkHTML()}
                                <span class="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1 rounded font-bold ml-1">ADMIN</span>
                                <span class="text-[9.5px] text-white/40 ml-1">${timeStr}</span>
                                <button onclick="AdminChat.deleteMessage('${m.id}')" class="opacity-0 group-hover:opacity-100 ml-1.5 text-white/40 hover:text-rose-400 transition-all cursor-pointer" title="Hapus Pesan">
                                    <i data-lucide="trash-2" class="w-3 h-3"></i>
                                </button>
                            </div>
                            <div class="p-3 rounded-2xl rounded-tl-xs bg-gradient-to-br from-[#1a2130] to-[#121622] border border-emerald-500/30 text-xs text-white leading-relaxed shadow-md">
                                ${AdminChat.escapeHtml(m.message)}
                                ${attachmentHtml}
                            </div>
                        </div>
                    </div>`;
                } else {
                    // User message (Right side)
                    var borderBadgePill = AdminChat.getBorderBadgeHTML(borderName, isVip);
                    return `
                    <div class="flex items-start justify-end gap-2.5 ml-auto max-w-[88%] sm:max-w-[80%] group">
                        <div class="space-y-1 text-right">
                            <div class="flex items-center justify-end gap-1.5 flex-wrap">
                                <button onclick="AdminChat.deleteMessage('${m.id}')" class="opacity-0 group-hover:opacity-100 mr-1 text-white/40 hover:text-rose-400 transition-all cursor-pointer" title="Hapus Pesan">
                                    <i data-lucide="trash-2" class="w-3 h-3"></i>
                                </button>
                                <span class="text-[9.5px] text-white/40">${timeStr}</span>
                                ${borderBadgePill}
                                <span class="text-[11px] font-bold text-white/90">${AdminChat.escapeHtml(senderName)}</span>
                            </div>
                            <div class="p-3 rounded-2xl rounded-tr-xs bg-gradient-to-br from-emerald-600/30 to-teal-700/20 border border-emerald-400/40 text-xs text-white leading-relaxed shadow-md text-left">
                                ${AdminChat.escapeHtml(m.message)}
                                ${attachmentHtml}
                            </div>
                        </div>
                        ${AdminChat.renderAvatarWithBorder(avatarUrl, borderUrl, 38)}
                    </div>`;
                }
            }).join('');

            container.innerHTML = html;
            if (window.lucide) lucide.createIcons();

            // Scroll to bottom
            setTimeout(function() {
                container.scrollTop = container.scrollHeight;
            }, 50);
        },

        submitUserMessage: async function(e) {
            if (e) e.preventDefault();

            var textInput = document.getElementById('user-chat-input-text');
            var msgText = textInput ? textInput.value.trim() : '';
            var attachment = AdminChat.pendingAttachmentBase64 || '';

            if (!msgText && !attachment) {
                if (typeof showToast === 'function') showToast('Tulis pesan atau lampirkan foto terlebih dahulu.');
                return;
            }

            var token = (typeof Auth !== 'undefined' && Auth.token) ? Auth.token : (localStorage.getItem('musifystar_auth_token') || sessionStorage.getItem('musifystar_auth_token') || '');
            var currentUser = (typeof Auth !== 'undefined' && Auth.currentUser) ? Auth.currentUser : null;
            var userId = currentUser ? (currentUser.id || currentUser.uid || currentUser.username) : (localStorage.getItem('musifystar_user_id') || '');

            var myUsername = currentUser ? (currentUser.username || 'Pengguna') : 'Pengguna';
            var myAvatar = currentUser ? (currentUser.avatar || currentUser.avatarUrl || '') : '';
            var myBorderUrl = (typeof Auth !== 'undefined' && Auth.getBorderUrl) ? Auth.getBorderUrl(currentUser) : (currentUser ? currentUser.borderUrl : '');
            var myBorderName = (typeof Auth !== 'undefined' && Auth.getBorderName) ? Auth.getBorderName(currentUser) : (currentUser ? currentUser.borderName : '');
            var myIsVip = currentUser ? Boolean(currentUser.isPremium || currentUser.is_premium || currentUser.isVip) : false;
            var myVipTier = currentUser ? (currentUser.vipTier || 'none') : 'none';

            if (textInput) textInput.value = '';
            AdminChat.clearAttachmentPreview();

            try {
                var headers = { 'Content-Type': 'application/json' };
                if (token) headers['Authorization'] = 'Bearer ' + token;
                if (userId) headers['x-user-id'] = userId;

                var res = await fetch('/api/admin-chat?action=send_message', {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify({
                        userId: userId,
                        message: msgText,
                        attachment: attachment,
                        senderUsername: myUsername,
                        senderAvatarUrl: myAvatar,
                        senderBorderUrl: myBorderUrl,
                        senderBorderName: myBorderName,
                        senderIsVip: myIsVip,
                        senderVipTier: myVipTier
                    })
                });

                var data = await res.json();
                if (data && data.status) {
                    AdminChat.refreshUserMessages();
                } else {
                    if (typeof showToast === 'function') showToast(data.message || 'Gagal mengirim pesan.');
                }
            } catch(err) {
                if (typeof showToast === 'function') showToast('Gagal terhubung ke server.');
            }
        },

        // Lightbox viewer for photo attachments
        openImageModal: function(src) {
            var existing = document.getElementById('musifystar-image-lightbox');
            if (existing) existing.remove();

            var overlay = document.createElement('div');
            overlay.id = 'musifystar-image-lightbox';
            overlay.className = 'fixed inset-0 z-[990] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 animate-fade-in select-none';
            overlay.onclick = function() { overlay.remove(); };
            overlay.innerHTML = `
            <div class="relative max-w-4xl max-h-[90vh] flex flex-col items-center justify-center space-y-3">
                <button onclick="document.getElementById('musifystar-image-lightbox')?.remove()" class="absolute -top-10 right-0 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
                <img src="${src}" class="max-w-full max-h-[80vh] object-contain rounded-2xl border border-white/20 shadow-2xl">
                <p class="text-xs text-white/70 font-mono">Bukti Foto / Transfer QRIS - Klik di mana saja untuk menutup</p>
            </div>`;
            document.body.appendChild(overlay);
            if (window.lucide) lucide.createIcons();
        },

        lastAdminTabContainerId: 'admin-messages-container',

        getAdminToken: function() {
            var tok = (typeof Profile !== 'undefined' && Profile.getAdminToken) ? Profile.getAdminToken() : '';
            if (!tok) {
                tok = sessionStorage.getItem('musifystar_admin_token') || 
                      localStorage.getItem('musifystar_admin_token') || 
                      (typeof Auth !== 'undefined' && Auth.token ? Auth.token : '');
            }
            return tok || '';
        },

        // -------------------------------------------------------------
        // ADMIN PANEL VIEW: Render Admin Chat Tab in Admin Modal
        // -------------------------------------------------------------
        renderAdminChatTab: async function(containerId) {
            if (containerId) AdminChat.lastAdminTabContainerId = containerId;
            var targetId = containerId || AdminChat.lastAdminTabContainerId || 'admin-messages-container';
            var container = document.getElementById(targetId);
            if (!container) return;

            var token = AdminChat.getAdminToken();
            if (!token) {
                container.innerHTML = `
                <div class="text-center py-16 px-4 space-y-3 bg-[#11131c] rounded-2xl border border-amber-500/30">
                    <div class="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30 shadow-lg">
                        <i data-lucide="shield-alert" class="w-7 h-7"></i>
                    </div>
                    <div class="space-y-1">
                        <h4 class="text-sm font-bold text-white">Sesi Admin Tidak Ditemukan</h4>
                        <p class="text-xs text-white/50 max-w-sm mx-auto leading-relaxed">
                            Harap login dengan akun Admin MusifyStar terlebih dahulu untuk mengakses Inbox Chat Support & Bukti Transfer.
                        </p>
                    </div>
                </div>`;
                if (window.lucide) lucide.createIcons();
                return;
            }

            container.innerHTML = `
            <div class="space-y-4">
                <!-- Header Banner -->
                <div class="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent border border-emerald-500/30 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 shrink-0">
                            <i data-lucide="message-square" class="w-6 h-6"></i>
                        </div>
                        <div>
                            <div class="flex items-center gap-2">
                                <h3 class="text-base font-black text-white">Direct Chat Support & Konfirmasi Bukti TF</h3>
                                <span class="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold px-2 py-0.5 rounded-full font-mono">
                                    LIVE SUPPORT
                                </span>
                            </div>
                            <p class="text-xs text-white/60 mt-0.5">Balas pesan direct pengguna dan periksa foto bukti transfer QRIS secara real-time.</p>
                        </div>
                    </div>
                    <button onclick="AdminChat.renderAdminChatTab()" class="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 border border-white/15 cursor-pointer">
                        <i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-emerald-400"></i>
                        <span>Refresh Threads</span>
                    </button>
                </div>

                <!-- MAIN CHAT INTERFACE (THREADS LIST + CHAT WINDOW) -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 h-[580px] bg-black/40 border border-white/10 rounded-2xl overflow-hidden">
                    <!-- LEFT COLUMN: THREADS LIST -->
                    <div class="md:col-span-1 border-r border-white/10 flex flex-col h-full bg-[#11131c]">
                        <div class="p-3 border-b border-white/10 flex items-center justify-between bg-black/30">
                            <h4 class="text-xs font-bold text-white uppercase tracking-wider">Daftar Chat Support</h4>
                            <span id="admin-threads-count-badge" class="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-bold px-2 py-0.5 rounded-full">0 User</span>
                        </div>
                        <div id="admin-chat-threads-list" class="flex-1 overflow-y-auto divide-y divide-white/5 hide-scrollbar">
                            <div class="text-center py-12 text-white/40 space-y-2">
                                <i data-lucide="loader-2" class="w-6 h-6 animate-spin mx-auto text-emerald-400"></i>
                                <p class="text-xs">Memuat riwayat chat pengguna...</p>
                            </div>
                        </div>
                    </div>

                    <!-- RIGHT COLUMN: SELECTED USER CHAT ROOM -->
                    <div id="admin-chat-room-container" class="md:col-span-2 flex flex-col h-full bg-[#151722]">
                        <div class="flex-1 flex flex-col items-center justify-center p-8 text-center text-white/40 space-y-3">
                            <i data-lucide="message-square-dashed" class="w-12 h-12 text-emerald-400/40"></i>
                            <div>
                                <h4 class="text-sm font-bold text-white/80">Pilih Percakapan Pengguna</h4>
                                <p class="text-xs text-white/50">Klik salah satu user di panel sebelah kiri untuk melihat pesan dan bukti transfer.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;

            if (window.lucide) lucide.createIcons();

            AdminChat.loadAdminThreads();
        },

        loadAdminThreads: async function() {
            var threadsListContainer = document.getElementById('admin-chat-threads-list');
            if (!threadsListContainer) return;

            var token = AdminChat.getAdminToken();
            var myUserId = (typeof Auth !== 'undefined' && Auth.currentUser && Auth.currentUser.id) ? Auth.currentUser.id : '';

            try {
                var res = await fetch('/api/admin-chat?action=get_threads', {
                    headers: {
                        'x-admin-token': token,
                        'authorization': token ? 'Bearer ' + token : '',
                        'x-user-id': myUserId
                    }
                });
                var data = await res.json();
                if (!data || !data.status) {
                    if (threadsListContainer) {
                        threadsListContainer.innerHTML = '<p class="text-xs text-rose-400 text-center py-8 px-3">' + AdminChat.escapeHtml(data && data.message ? data.message : 'Gagal memuat threads chat.') + '</p>';
                    }
                    return;
                }

                var threads = Array.isArray(data.threads) ? data.threads : [];

                var badgeEl = document.getElementById('admin-threads-count-badge');
                if (badgeEl) badgeEl.textContent = threads.length + ' User';

                if (threads.length === 0) {
                    threadsListContainer.innerHTML = '<p class="text-xs text-white/40 text-center py-12">Belum ada percakapan dari pengguna.</p>';
                    return;
                }

                var html = threads.map(function(t) {
                    var unreadBadge = t.unreadCountForAdmin > 0
                        ? `<span class="bg-rose-500 text-white text-[9.5px] font-black px-1.5 py-0.2 rounded-full shadow-sm animate-pulse">${t.unreadCountForAdmin} NEW</span>`
                        : '';
                    var borderBadgePill = AdminChat.getBorderBadgeHTML(t.borderName, t.isVip);
                    var photoIcon = t.hasAttachment ? `<i data-lucide="image" class="w-3 h-3 text-emerald-400 shrink-0"></i>` : '';

                    var activeClass = (AdminChat.activeUserId === t.userId) ? 'bg-emerald-500/20 border-l-4 border-l-emerald-400' : 'hover:bg-white/5';

                    var formattedTime = t.lastMessageAt ? new Date(t.lastMessageAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '';

                    return `
                    <div onclick="AdminChat.selectAdminThread('${AdminChat.escapeAttr(t.userId)}')" class="p-3 ${activeClass} transition-all cursor-pointer flex items-center justify-between gap-2.5">
                        <div class="flex items-center gap-2.5 min-w-0 flex-1">
                            ${AdminChat.renderAvatarWithBorder(t.avatarUrl, t.borderUrl, 38)}
                            <div class="min-w-0 flex-1">
                                <div class="flex items-center gap-1.5 flex-wrap">
                                    <h5 class="text-xs font-bold text-white truncate">@${AdminChat.escapeHtml(t.username)}</h5>
                                    ${borderBadgePill}
                                </div>
                                <p class="text-[11px] text-white/50 truncate flex items-center gap-1 mt-0.5">
                                    ${photoIcon}
                                    <span>${AdminChat.escapeHtml(t.lastMessage || 'Foto Bukti Transfer')}</span>
                                </p>
                            </div>
                        </div>
                        <div class="flex flex-col items-end gap-1 shrink-0">
                            ${unreadBadge}
                            <span class="text-[9.5px] text-white/30">${formattedTime}</span>
                        </div>
                    </div>`;
                }).join('');

                threadsListContainer.innerHTML = html;
                if (window.lucide) lucide.createIcons();

            } catch(e) {
                if (threadsListContainer) {
                    threadsListContainer.innerHTML = '<p class="text-xs text-rose-400 text-center py-8 px-3">Gagal memuat threads chat.</p>';
                }
            }
        },

        selectAdminThread: async function(userId) {
            AdminChat.activeUserId = userId;
            AdminChat.loadAdminThreads(); // update active highlight

            var roomContainer = document.getElementById('admin-chat-room-container');
            if (!roomContainer) return;

            roomContainer.innerHTML = `
            <div class="flex-1 flex items-center justify-center text-white/40">
                <i data-lucide="loader-2" class="w-7 h-7 animate-spin text-emerald-400"></i>
            </div>`;
            if (window.lucide) lucide.createIcons();

            var token = AdminChat.getAdminToken();
            var myUserId = (typeof Auth !== 'undefined' && Auth.currentUser && Auth.currentUser.id) ? Auth.currentUser.id : '';

            try {
                var res = await fetch('/api/admin-chat?action=get_messages&userId=' + encodeURIComponent(userId), {
                    headers: {
                        'x-admin-token': token,
                        'authorization': token ? 'Bearer ' + token : '',
                        'x-user-id': myUserId
                    }
                });
                var data = await res.json();
                if (!data || !data.status) return;

                var userProfile = data.userProfile || {};
                var adminProfile = data.adminProfile || {};
                var messages = Array.isArray(data.messages) ? data.messages : [];

                var userBadgePill = AdminChat.getBorderBadgeHTML(userProfile.borderName, userProfile.isVip);

                roomContainer.innerHTML = `
                <!-- CHAT HEADER WITH USER PROFILE & BORDER FRAME -->
                <div class="p-3.5 bg-black/40 border-b border-white/10 flex items-center justify-between shrink-0">
                    <div class="flex items-center gap-3">
                        ${AdminChat.renderAvatarWithBorder(userProfile.avatarUrl, userProfile.borderUrl, 44)}
                        <div>
                            <div class="flex items-center gap-2 flex-wrap">
                                <h4 class="text-xs sm:text-sm font-black text-white">@${AdminChat.escapeHtml(userProfile.username)}</h4>
                                ${userBadgePill || (userProfile.isVip ? '<span class="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9.5px] font-bold px-1.5 py-0.2 rounded-full">VIP (' + userProfile.vipTier + ')</span>' : '<span class="bg-white/10 text-white/60 text-[9.5px] px-1.5 py-0.2 rounded-full font-bold">Standard Member</span>')}
                            </div>
                            <p class="text-[10.5px] text-white/50 font-mono">ID: ${userProfile.id} &bull; ${userProfile.email || 'Tanpa Email'}</p>
                        </div>
                    </div>

                    <div class="flex items-center gap-2">
                        <button onclick="AdminChat.quickActivateVipForUser('${AdminChat.escapeAttr(userProfile.username)}')" class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer">
                            <i data-lucide="crown" class="w-3.5 h-3.5 fill-black"></i>
                            <span>Aktivasi VIP User Ini</span>
                        </button>
                        <button onclick="AdminChat.deleteThread('${AdminChat.escapeAttr(userProfile.id)}')" class="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 font-extrabold text-xs flex items-center gap-1.5 shadow-md cursor-pointer" title="Hapus seluruh percakapan dengan pengguna ini">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5 text-rose-400"></i>
                            <span>Hapus Chat</span>
                        </button>
                    </div>
                </div>

                <!-- CHAT MESSAGES STREAM -->
                <div id="admin-room-messages-stream" class="flex-1 overflow-y-auto p-4 space-y-3.5 bg-black/20 hide-scrollbar">
                    <!-- Rendered by renderUserMessagesList -->
                </div>

                <!-- ATTACHMENT PREVIEW FOR ADMIN -->
                <div id="admin-chat-attachment-preview" class="hidden px-4 py-2 bg-black/60 border-t border-emerald-500/30 flex items-center justify-between">
                    <div class="flex items-center gap-2 overflow-hidden">
                        <img id="admin-chat-preview-img" src="" class="w-10 h-10 rounded-xl object-cover border border-emerald-400/50">
                        <div class="text-xs text-white/80 truncate">
                            <span class="font-bold text-emerald-400">Foto Siap Dikirim</span>
                            <p class="text-[10px] text-white/50 truncate">Balasan Foto dari Admin</p>
                        </div>
                    </div>
                    <button onclick="AdminChat.clearAdminAttachmentPreview()" class="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center hover:bg-rose-500/30 cursor-pointer">
                        <i data-lucide="x" class="w-3.5 h-3.5"></i>
                    </button>
                </div>

                <!-- ADMIN REPLY INPUT FOOTER -->
                <div class="p-3 bg-[#11131c] border-t border-white/10 shrink-0">
                    <form onsubmit="AdminChat.submitAdminReply(event, '${AdminChat.escapeAttr(userId)}')" class="flex items-center gap-2">
                        <input type="file" id="admin-chat-file-input" accept="image/*" class="hidden" onchange="AdminChat.handleAdminFileSelect(event)">

                        <button type="button" onclick="document.getElementById('admin-chat-file-input')?.click()" class="w-10 h-10 rounded-2xl bg-white/10 hover:bg-emerald-500/20 text-emerald-400 border border-white/15 flex items-center justify-center shrink-0 active:scale-95 transition-all cursor-pointer" title="Lampirkan Foto Balasan">
                            <i data-lucide="image" class="w-5 h-5"></i>
                        </button>

                        <input type="text" id="admin-reply-input-text" placeholder="Tulis balasan pesan untuk @${AdminChat.escapeAttr(userProfile.username)}..." class="flex-1 bg-black/50 border border-white/15 focus:border-emerald-400 rounded-2xl px-4 py-2.5 text-xs text-white placeholder:text-white/40 focus:outline-none transition-all">

                        <button type="submit" class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold flex items-center justify-center shrink-0 active:scale-95 transition-all cursor-pointer shadow-md shadow-emerald-500/20">
                            <i data-lucide="send" class="w-4 h-4 fill-black"></i>
                        </button>
                    </form>
                </div>`;

                if (window.lucide) lucide.createIcons();

                var streamEl = document.getElementById('admin-room-messages-stream');
                AdminChat.renderUserMessagesList(messages, streamEl, adminProfile, userProfile);

                // Mark read by admin
                fetch('/api/admin-chat?action=mark_read', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-admin-token': token,
                        'authorization': token ? 'Bearer ' + token : '',
                        'x-user-id': myUserId
                    },
                    body: JSON.stringify({ userId: userId })
                }).catch(function(){});

            } catch(e) {
                if (roomContainer) roomContainer.innerHTML = '<p class="text-xs text-rose-400 text-center py-8">Gagal memuat detail percakapan.</p>';
            }
        },

        refreshActiveRoomMessages: async function(userId) {
            if (!userId) return;
            var streamEl = document.getElementById('admin-room-messages-stream');
            if (!streamEl) return;

            var token = AdminChat.getAdminToken();
            var myUserId = (typeof Auth !== 'undefined' && Auth.currentUser && Auth.currentUser.id) ? Auth.currentUser.id : '';

            try {
                var res = await fetch('/api/admin-chat?action=get_messages&userId=' + encodeURIComponent(userId), {
                    headers: {
                        'x-admin-token': token,
                        'authorization': token ? 'Bearer ' + token : '',
                        'x-user-id': myUserId
                    }
                });
                var data = await res.json();
                if (!data || !data.status) return;

                var userProfile = data.userProfile || {};
                var adminProfile = data.adminProfile || {};
                var messages = Array.isArray(data.messages) ? data.messages : [];

                AdminChat.renderUserMessagesList(messages, streamEl, adminProfile, userProfile);
            } catch(e) {}
        },

        handleAdminFileSelect: function(event) {
            var file = event.target.files && event.target.files[0];
            if (!file) return;

            var reader = new FileReader();
            reader.onload = function(e) {
                AdminChat.pendingAttachmentBase64 = e.target.result;
                var container = document.getElementById('admin-chat-attachment-preview');
                var img = document.getElementById('admin-chat-preview-img');
                if (container && img) {
                    img.src = e.target.result;
                    container.classList.remove('hidden');
                }
            };
            reader.readAsDataURL(file);
        },

        clearAdminAttachmentPreview: function() {
            AdminChat.pendingAttachmentBase64 = null;
            var container = document.getElementById('admin-chat-attachment-preview');
            var input = document.getElementById('admin-chat-file-input');
            if (container) container.classList.add('hidden');
            if (input) input.value = '';
        },

        submitAdminReply: async function(e, userId) {
            if (e) e.preventDefault();

            var input = document.getElementById('admin-reply-input-text');
            var msgText = input ? input.value.trim() : '';
            var attachment = AdminChat.pendingAttachmentBase64 || '';

            if (!msgText && !attachment) {
                if (typeof showToast === 'function') showToast('Tulis pesan balasan atau sertakan foto terlebih dahulu.');
                return;
            }

            var token = AdminChat.getAdminToken();
            var myUserId = (typeof Auth !== 'undefined' && Auth.currentUser && Auth.currentUser.id) ? Auth.currentUser.id : '';

            if (input) input.value = '';
            AdminChat.clearAdminAttachmentPreview();

            try {
                var res = await fetch('/api/admin-chat?action=send_message', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-admin-token': token,
                        'authorization': token ? 'Bearer ' + token : '',
                        'x-user-id': myUserId
                    },
                    body: JSON.stringify({
                        userId: userId,
                        message: msgText,
                        attachment: attachment
                    })
                });

                var data = await res.json();
                if (data && data.status) {
                    if (typeof showToast === 'function') showToast('Balasan terkirim!');
                    AdminChat.refreshActiveRoomMessages(userId);
                    AdminChat.loadAdminThreads();
                } else {
                    if (typeof showToast === 'function') showToast(data.message || 'Gagal mengirim balasan.');
                }
            } catch(err) {
                if (typeof showToast === 'function') showToast('Gagal terhubung ke server.');
            }
        },

        deleteMessage: async function(messageId) {
            if (!messageId) return;
            if (!confirm('Apakah Anda yakin ingin menghapus pesan ini?')) return;

            var token = AdminChat.getAdminToken();
            var myUserId = (typeof Auth !== 'undefined' && Auth.currentUser && Auth.currentUser.id) ? Auth.currentUser.id : '';

            try {
                var res = await fetch('/api/admin-chat?action=delete_message', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-admin-token': token,
                        'authorization': token ? 'Bearer ' + token : '',
                        'x-user-id': myUserId
                    },
                    body: JSON.stringify({ messageId: messageId })
                });
                var data = await res.json();
                if (data && data.status) {
                    if (typeof showToast === 'function') showToast('Pesan berhasil dihapus.');
                    if (AdminChat.activeUserId) {
                        AdminChat.refreshActiveRoomMessages(AdminChat.activeUserId);
                        AdminChat.loadAdminThreads();
                    }
                    if (document.getElementById('musifystar-admin-chat-modal')) {
                        AdminChat.refreshUserMessages(true);
                    }
                } else {
                    if (typeof showToast === 'function') showToast(data.message || 'Gagal menghapus pesan.');
                }
            } catch(e) {
                if (typeof showToast === 'function') showToast('Gagal menghapus pesan.');
            }
        },

        deleteThread: async function(userId) {
            if (!userId) return;
            if (!confirm('Apakah Anda yakin ingin menghapus seluruh percakapan dengan pengguna ini?')) return;

            var token = AdminChat.getAdminToken();
            var myUserId = (typeof Auth !== 'undefined' && Auth.currentUser && Auth.currentUser.id) ? Auth.currentUser.id : '';

            try {
                var res = await fetch('/api/admin-chat?action=delete_thread', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-admin-token': token,
                        'authorization': token ? 'Bearer ' + token : '',
                        'x-user-id': myUserId
                    },
                    body: JSON.stringify({ userId: userId })
                });
                var data = await res.json();
                if (data && data.status) {
                    if (typeof showToast === 'function') showToast('Seluruh percakapan telah dihapus.');
                    AdminChat.activeUserId = null;
                    var roomContainer = document.getElementById('admin-chat-room-container');
                    if (roomContainer) {
                        roomContainer.innerHTML = `
                        <div class="flex-1 flex flex-col items-center justify-center p-8 text-center text-white/40 space-y-3">
                            <i data-lucide="message-square-dashed" class="w-12 h-12 text-emerald-400/40"></i>
                            <div>
                                <h4 class="text-sm font-bold text-white/80">Pilih Percakapan Pengguna</h4>
                                <p class="text-xs text-white/50">Klik salah satu user di panel sebelah kiri untuk melihat pesan dan bukti transfer.</p>
                            </div>
                        </div>`;
                        if (window.lucide) lucide.createIcons();
                    }
                    AdminChat.loadAdminThreads();
                } else {
                    if (typeof showToast === 'function') showToast(data.message || 'Gagal menghapus percakapan.');
                }
            } catch(e) {
                if (typeof showToast === 'function') showToast('Gagal menghapus percakapan.');
            }
        },

        quickActivateVipForUser: function(username) {
            if (typeof Profile !== 'undefined' && Profile.setAdminTab) {
                Profile.setAdminTab('vip');
                setTimeout(function() {
                    var input = document.getElementById('admin-vip-search-user');
                    if (input) {
                        input.value = username;
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }, 300);
            }
        },

        // Helper utilities
        escapeHtml: function(str) {
            if (!str) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        },

        escapeAttr: function(str) {
            if (!str) return '';
            return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        }
    };

})();
