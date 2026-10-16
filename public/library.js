var Library={
    activeTab: 'playlists',
    setTab(t){
        Library.activeTab = t;
        Library.render();
    },
    render(){
        var pls = typeof getUserPlaylists === 'function' ? getUserPlaylists() : [];
        var likedArtists = typeof getLikedArtists === 'function' ? getLikedArtists() : [];
        var isPlaylistsTab = Library.activeTab === 'playlists';
        var isArtistsTab = Library.activeTab === 'artists';

        var html = '<div class="pt-8 pb-3.5 px-4 sticky top-0 z-30 border-b border-white/10 shadow-2xl transition-all" style="background: linear-gradient(180deg, rgba(13, 15, 22, 0.88) 0%, rgba(13, 15, 22, 0.97) 100%), url(\'/banner.png\') center/cover no-repeat; backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);">' +
            '<div class="flex items-center justify-between mb-3">' +
                '<h1 class="text-3xl font-black text-white tracking-tight drop-shadow-md">Library</h1>' +
            '</div>' +
            
            '<!-- Tabs Navigation -->' +
            '<div class="flex gap-2 p-1.5 bg-black/40 backdrop-blur-md rounded-2xl border border-white/15">' +
                '<button onclick="Library.setTab(\'playlists\')" class="flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ' + (isPlaylistsTab ? 'bg-white text-black shadow-md' : 'text-white/70 hover:text-white') + '">' +
                    '<i data-lucide="list-music" class="w-4 h-4 ' + (isPlaylistsTab ? 'text-blue-600' : '') + '"></i>' +
                    '<span>Playlists</span>' +
                '</button>' +
                '<button onclick="Library.setTab(\'artists\')" class="flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ' + (isArtistsTab ? 'bg-white text-black shadow-md' : 'text-white/70 hover:text-white') + '">' +
                    '<i data-lucide="user" class="w-4 h-4 ' + (isArtistsTab ? 'text-amber-600' : '') + '"></i>' +
                    '<span>Artists</span>' +
                '</button>' +
            '</div>' +
        '</div>' +
        '<div class="px-4 mt-4 pb-12">';

        if (isArtistsTab) {
            // ARTISTS TAB CONTENT
            if(likedArtists.length === 0){
                html += '<div class="text-center text-white/70 py-16 px-4 bg-white/[0.04] backdrop-blur-xl rounded-3xl border border-white/10 mt-2">' +
                    '<div class="w-20 h-20 mx-auto mb-4 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">' +
                        '<i data-lucide="user" class="w-10 h-10 text-amber-400 opacity-60"></i>' +
                    '</div>' +
                    '<h3 class="text-white font-bold text-lg mb-1">Belum Ada Artist Disukai</h3>' +
                    '<p class="text-xs text-white/70 max-w-xs mx-auto mb-6">Sukai artist favoritmu untuk melihatnya di sini.</p>' +
                    '<button onclick="App.switch(\'search\')" class="bg-white/10 hover:bg-white/20 px-6 py-3 font-bold rounded-full text-xs active:scale-95 inline-flex items-center gap-1.5 text-white border border-white/20 transition-all"><i data-lucide="search" class="w-4 h-4"></i> Cari Artist</button>' +
                '</div>';
            } else {
                html += '<div class="grid grid-cols-2 gap-3">';
                likedArtists.forEach(function(a){
                    html += '<div onclick="Artist.open(\'' + es(a.artistId) + '\', \'' + esJs(a.name) + '\')" class="p-3.5 rounded-2xl bg-[#20222c] border border-white/10 shadow-xl hover:bg-[#282b38] cursor-pointer active:scale-95 transition-all text-center flex flex-col items-center justify-center group">' +
                        '<div class="relative w-20 h-20 mb-3 rounded-full overflow-hidden border-2 border-white/10 shadow-md group-hover:scale-105 transition-transform duration-300">' +
                            '<img src="' + a.thumbnail + '" class="w-full h-full object-cover" onerror="this.src=\'' + FI + '\'" />' +
                        '</div>' +
                        '<h3 class="font-bold text-sm truncate text-white w-full px-1">' + es(a.name) + '</h3>' +
                        '<p class="text-white/60 text-[10px] mt-0.5 uppercase tracking-wider font-semibold">Artist</p>' +
                    '</div>';
                });
                html += '</div>';
            }
        } else if (isPlaylistsTab) {
            // PLAYLISTS TAB CONTENT
            html += '<button onclick="Library.createNew()" class="w-full bg-white/15 hover:bg-white/20 border border-white/20 font-bold py-3.5 rounded-2xl active:scale-95 mb-5 flex items-center justify-center gap-2 text-white shadow-lg transition-all">+ Buat Playlist Baru</button>';
            
            if(pls.length === 0){
                html += '<div class="text-center text-white/70 py-16 px-4 bg-white/[0.04] backdrop-blur-xl rounded-3xl border border-white/10 mt-2">' +
                    '<i data-lucide="list-music" class="w-16 h-16 mx-auto mb-4 opacity-30 text-white"></i>' +
                    '<h3 class="text-white font-bold text-lg mb-1">Belum Ada Playlist</h3>' +
                    '<p class="text-xs text-white/70 max-w-xs mx-auto mb-5">Buat playlist pertamamu dan kumpulkan lagu-lagu favoritmu di satu tempat.</p>' +
                '</div>';
            } else {
                html += '<div class="grid grid-cols-2 gap-3">';
                pls.forEach(function(p){
                    html += '<div onclick="Library.open(\'' + p.id + '\')" class="p-2.5 rounded-2xl bg-[#20222c] border border-white/10 shadow-xl hover:bg-[#282b38] cursor-pointer active:scale-95 transition-all group flex flex-col">' +
                        '<div class="relative w-full aspect-square mb-2.5 rounded-xl overflow-hidden shadow-md">' +
                            '<img src="' + (p.image || (p.songs.length > 0 ? p.songs[0].cover : FI)) + '" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onerror="this.src=\'' + FI + '\'" />' +
                            '<button onclick="event.stopPropagation();Library.showActions(\'' + p.id + '\')" class="absolute top-2 right-2 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-full p-2 active:scale-90 transition-all" title="Opsi Playlist"><i data-lucide="more-vertical" class="w-4 h-4 text-white"></i></button>' +
                            (p.songs.length > 0 ? '<button onclick="event.stopPropagation();Library.playSong(\'' + p.id + '\',0)" class="absolute bottom-2 right-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full p-2.5 shadow-black/40 active:scale-90" title="Putar"><i data-lucide="play" class="w-4 h-4 text-white fill-current ml-0.5"></i></button>' : '') +
                        '</div>' +
                        '<h3 class="font-semibold text-sm truncate text-white px-0.5">' + es(p.name) + '</h3>' +
                        '<p class="text-white/60 text-xs mt-0.5 px-0.5">' + p.songs.length + ' lagu</p>' +
                    '</div>';
                });
                html += '</div>';
            }
        }

        html += '</div>';
        gid('view-library').innerHTML = html;
        lucide.createIcons();
    },
    playAllLiked(){
        var songs = typeof getLikedSongs === 'function' ? getLikedSongs() : [];
        if(!songs.length) return;
        S.pl = songs;
        S.pi = 0;
        S.ps = 'playlist';
        S.ct = S.pl[S.pi];
        UU(); MP.show(); S.il = true; UB();
        resetLyricsUI(S.ct.videoId);
        loadTrack(S.ct);
    },
    playLikedIndex(index){
        var songs = typeof getLikedSongs === 'function' ? getLikedSongs() : [];
        if(!songs[index]) return;
        var s = songs[index];
        if (S.ct && (S.ct.id === s.id || S.ct.videoId === s.videoId || (S.ct.title === s.title && S.ct.artist === s.artist)) && AU.src) {
            TP();
            return;
        }
        S.pl = songs;
        S.pi = index;
        S.ps = 'playlist';
        S.ct = S.pl[S.pi];
        UU(); MP.show(); S.il = true; UB();
        resetLyricsUI(S.ct.videoId);
        loadTrack(S.ct);
    },
    createNew(cb){
        var popup=document.createElement('div');popup.className='fixed inset-0 z-[300] flex items-end justify-center bg-black/60';
        popup.innerHTML='<div class="glass-strong w-full max-w-md rounded-t-3xl p-6 border-t border-white/10" style="animation:slideUp 0.3s ease-out forwards;"><div class="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4"></div><h3 class="font-bold text-white mb-4">Buat Playlist Baru</h3><input id="pl-name" class="w-full glass-input text-white rounded-xl px-4 py-3 mb-3 focus:outline-none" placeholder="Nama Playlist" /><input id="pl-image" type="file" accept="image/*" class="w-full text-sm text-white/70 mb-4" /><div class="flex gap-3"><button id="pl-create" class="flex-1 btn-chrome font-bold py-3 rounded-full">Buat</button><button onclick="this.closest(\'.fixed\').remove()" class="px-6 py-3 glass glass-hover text-white rounded-full">Batal</button></div></div>';
        document.body.appendChild(popup);
        popup.querySelector('#pl-create').onclick=function(){
            var name=gid('pl-name').value.trim()||'Playlist Baru';
            var file=gid('pl-image').files[0];
            if(file){
                var reader=new FileReader();
                reader.onload=function(e){
                    var newId = createPlaylist(name,e.target.result);
                    popup.remove();
                    Library.render();
                    if(typeof cb === 'function') cb(newId);
                };
                reader.readAsDataURL(file);
            } else {
                var newId = createPlaylist(name,'');
                popup.remove();
                Library.render();
                if(typeof cb === 'function') cb(newId);
            }
        };
    },
    showActions(id){
        var pls=getUserPlaylists();var pl=pls.find(function(p){return p.id===id;});if(!pl)return;
        var dupInfo = Library.getDuplicateInfo(pl);
        var popup=document.createElement('div');popup.className='fixed inset-0 z-[300] flex items-end justify-center bg-black/60';
        popup.onclick=function(e){if(e.target===popup)popup.remove();};
        popup.innerHTML='<div class="w-full max-w-md rounded-t-3xl p-6 border-t border-white/10 glass-strong" style="animation:slideUp 0.3s ease-out forwards; background: var(--bg-color);">'+
            '<div class="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4"></div>'+
            '<div class="flex items-center gap-3 mb-5"><img src="'+(pl.image||(pl.songs.length>0?pl.songs[0].cover:FI))+'" class="w-12 h-12 rounded-lg object-cover" onerror="this.src=\''+FI+'\'" /><div class="truncate"><h3 class="font-bold text-white truncate">'+es(pl.name)+'</h3><p class="text-white/70 text-xs">'+pl.songs.length+' lagu</p></div></div>'+
            '<button onclick="this.closest(\'.fixed\').remove();Library.cleanDuplicates(\''+id+'\')" class="w-full text-left p-4 rounded-xl hover:bg-white/5 flex items-center gap-3 mb-1 cursor-pointer"><i data-lucide="sparkles" class="w-5 h-5 text-amber-400"></i><div class="flex-1"><span class="font-medium text-white">Bersihkan Lagu Duplikat</span><p class="text-[10px] text-white/50">'+(dupInfo.count > 0 ? dupInfo.count + ' duplikat ditemukan' : 'Deteksi & hapus lagu kembar')+'</p></div>'+(dupInfo.count > 0 ? '<span class="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold font-mono">'+dupInfo.count+'</span>' : '')+'</button>'+
            '<button onclick="this.closest(\'.fixed\').remove();Library.startSelectMode(\''+id+'\')" class="w-full text-left p-4 rounded-xl hover:bg-white/5 flex items-center gap-3 mb-1 cursor-pointer"><i data-lucide="check-square" class="w-5 h-5 text-rose-400"></i><div class="flex-1"><span class="font-medium text-white">Pilih & Hapus Banyak Lagu</span><p class="text-[10px] text-white/50">Centang beberapa lagu sekaligus</p></div></button>'+
            '<button onclick="this.closest(\'.fixed\').remove();Library.editPlaylist(\''+id+'\')" class="w-full text-left p-4 rounded-xl hover:bg-white/5 flex items-center gap-3 mb-1 cursor-pointer"><i data-lucide="pencil" class="w-5 h-5 text-white"></i><span class="font-medium text-white">Edit Playlist</span></button>'+
            '<button onclick="this.closest(\'.fixed\').remove();Library.confirmDelete(\''+id+'\')" class="w-full text-left p-4 rounded-xl hover:bg-red-500/10 flex items-center gap-3 cursor-pointer"><i data-lucide="trash-2" class="w-5 h-5 text-red-400"></i><span class="font-medium text-red-400">Hapus Playlist</span></button>'+
        '</div>';
        document.body.appendChild(popup);lucide.createIcons();
    },
    editPlaylist(id){
        var pls=getUserPlaylists();var pl=pls.find(function(p){return p.id===id;});if(!pl)return;
        var popup=document.createElement('div');popup.className='fixed inset-0 z-[300] flex items-end justify-center bg-black/60';
        popup.innerHTML='<div class="glass-strong w-full max-w-md rounded-t-3xl p-6 border-t border-white/10" style="animation:slideUp 0.3s ease-out forwards;"><div class="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4"></div><h3 class="font-bold text-white mb-4">Edit Playlist</h3><input id="pl-edit-name" class="w-full glass-input text-white rounded-xl px-4 py-3 mb-3 focus:outline-none" placeholder="Nama Playlist" value="'+es(pl.name).replace(/"/g,'&quot;')+'" /><input id="pl-edit-image" type="file" accept="image/*" class="w-full text-sm text-white/70 mb-4" /><div class="flex gap-3"><button id="pl-edit-save" class="flex-1 btn-chrome font-bold py-3 rounded-full">Simpan</button><button onclick="this.closest(\'.fixed\').remove()" class="px-6 py-3 glass glass-hover text-white rounded-full">Batal</button></div></div>';
        document.body.appendChild(popup);
        popup.querySelector('#pl-edit-save').onclick=function(){
            var name=gid('pl-edit-name').value.trim()||pl.name;
            var file=gid('pl-edit-image').files[0];
            if(file){var reader=new FileReader();reader.onload=function(e){updateUserPlaylist(id,name,e.target.result);popup.remove();Library.render();showToast('Playlist diperbarui');};reader.readAsDataURL(file);}
            else{updateUserPlaylist(id,name,null);popup.remove();Library.render();showToast('Playlist diperbarui');}
        };
    },
    confirmDelete(id){
        var pls=getUserPlaylists();var pl=pls.find(function(p){return p.id===id;});if(!pl)return;
        var popup=document.createElement('div');popup.className='fixed inset-0 z-[300] flex items-end justify-center bg-black/60';
        popup.innerHTML='<div class="glass-strong w-full max-w-md rounded-t-3xl p-6 border-t border-white/10" style="animation:slideUp 0.3s ease-out forwards;"><div class="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4"></div><h3 class="font-bold text-white mb-2">Hapus "'+es(pl.name)+'"?</h3><p class="text-white/70 text-sm mb-5">Playlist ini akan dihapus permanen dan tidak bisa dikembalikan.</p><div class="flex gap-3"><button onclick="deleteUserPlaylist(\''+id+'\');this.closest(\'.fixed\').remove();Library.render();Library.close();showToast(\'Playlist dihapus\')" class="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-full active:scale-95">Hapus</button><button onclick="this.closest(\'.fixed\').remove()" class="px-6 py-3 glass glass-hover text-white rounded-full">Batal</button></div></div>';
        document.body.appendChild(popup);
    },
    share(id){
        var pls = getUserPlaylists();
        var pl = pls.find(function(p){return p.id===id;});
        if(!pl) return;
        var url = location.origin + '/playlist/' + id;
        var text = 'Dengarkan playlist "' + pl.name + '" (' + pl.songs.length + ' lagu) di MusifyStar!';
        if (navigator.share) {
            navigator.share({ title: pl.name + ' - MusifyStar', text: text, url: url }).catch(function(){});
        } else {
            navigator.clipboard.writeText(url).then(function(){
                showToast('Link playlist berhasil disalin!');
            }).catch(function(){
                showToast('Gagal menyalin link playlist');
            });
        }
    },
    handleScroll(){
        const c = gid('library-content');
        const h = gid('library-header');
        if (!h) return;
        if (c && c.scrollTop > 50) {
            h.style.background = 'rgba(5, 5, 7, 0.9)';
        } else {
            h.style.background = 'transparent';
        }
    },
    currentPlaylistId: null,
    selectMode: false,
    selectedSongs: new Set(),

    getDuplicateInfo(pl) {
        if (!pl || !pl.songs || pl.songs.length <= 1) {
            return { count: 0, indices: [], uniqueSongs: pl ? (pl.songs || []) : [] };
        }
        var seen = new Set();
        var duplicateIndices = [];
        var uniqueSongs = [];
        pl.songs.forEach(function(s, idx) {
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

    cleanDuplicates(id) {
        var pls = getUserPlaylists();
        var pl = pls.find(function(p){ return p.id === id; });
        if (!pl) return;
        var info = Library.getDuplicateInfo(pl);
        if (info.count === 0) {
            if (typeof showToast === 'function') showToast('Tidak ada lagu duplikat di playlist ini');
            return;
        }

        var popup = document.createElement('div');
        popup.className = 'fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in';
        popup.innerHTML = '<div class="w-full max-w-sm sm:max-w-md rounded-3xl p-6 border border-white/15 shadow-2xl relative" style="animation:slideUp 0.3s ease-out forwards; background: #12141c; box-shadow: 0 20px 40px rgba(245,158,11,0.2);">' +
            '<div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/30 mb-4">' +
                '<i data-lucide="sparkles" class="w-6 h-6"></i>' +
            '</div>' +
            '<h3 class="font-black text-white text-lg mb-1 tracking-tight">Bersihkan ' + info.count + ' Lagu Duplikat?</h3>' +
            '<p class="text-white/70 text-xs leading-relaxed mb-5">Ditemukan <strong class="text-amber-300 font-bold">' + info.count + ' lagu duplikat</strong> di playlist "<span class="text-white font-semibold">' + es(pl.name) + '</span>". Lagu kembar akan dihapus dan menyisakan satu versi asli.</p>' +
            '<div class="flex gap-2.5">' +
                '<button id="confirm-clean-dup-btn" class="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:opacity-95 active:scale-95 text-white font-bold text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5">' +
                    '<i data-lucide="trash-2" class="w-4 h-4"></i>' +
                    '<span>Bersihkan Duplikat</span>' +
                '</button>' +
                '<button onclick="this.closest(\'.fixed\').remove()" class="py-3 px-5 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-white font-semibold text-xs border border-white/10 transition-all cursor-pointer">Batal</button>' +
            '</div>' +
        '</div>';
        document.body.appendChild(popup);
        lucide.createIcons();

        popup.querySelector('#confirm-clean-dup-btn').onclick = function() {
            pl.songs = info.uniqueSongs;
            if (!pl.image && pl.songs.length > 0) pl.image = pl.songs[0].cover;
            saveUserPlaylists(pls);
            popup.remove();
            Library.open(id);
            if (typeof showToast === 'function') showToast('Berhasil membersihkan ' + info.count + ' lagu duplikat!');
        };
    },

    toggleSelectMode(id) {
        Library.selectMode = !Library.selectMode;
        Library.selectedSongs.clear();
        Library.open(id);
    },

    startSelectMode(id) {
        Library.selectMode = true;
        Library.selectedSongs.clear();
        Library.open(id);
    },

    toggleSongSelect(id, index) {
        if (Library.selectedSongs.has(index)) {
            Library.selectedSongs.delete(index);
        } else {
            Library.selectedSongs.add(index);
        }
        Library.updateSelectUI(id);
    },

    selectAllSongs(id) {
        var pls = getUserPlaylists();
        var pl = pls.find(function(p){ return p.id === id; });
        if (!pl || !pl.songs) return;
        if (Library.selectedSongs.size === pl.songs.length) {
            Library.selectedSongs.clear();
        } else {
            pl.songs.forEach(function(_, idx) {
                Library.selectedSongs.add(idx);
            });
        }
        Library.updateSelectUI(id);
    },

    updateSelectUI(id) {
        var count = Library.selectedSongs.size;
        var pls = getUserPlaylists();
        var pl = pls.find(function(p){ return p.id === id; });
        var total = pl && pl.songs ? pl.songs.length : 0;

        var countText = gid('select-count-text');
        if (countText) countText.innerText = count + ' Dipilih';

        var btnSelectAll = gid('btn-select-all');
        if (btnSelectAll) {
            btnSelectAll.innerText = count === total && total > 0 ? 'Batal Semua' : 'Pilih Semua';
        }

        var btnDelete = gid('btn-delete-selected');
        if (btnDelete) {
            btnDelete.innerHTML = '<i data-lucide="trash-2" class="w-3.5 h-3.5"></i> <span>Hapus (' + count + ')</span>';
            if (count === 0) {
                btnDelete.classList.add('opacity-50', 'pointer-events-none');
            } else {
                btnDelete.classList.remove('opacity-50', 'pointer-events-none');
            }
        }

        var container = gid('playlist-songs-list');
        if (container && pl && pl.songs) {
            var items = container.querySelectorAll('.song-select-row');
            items.forEach(function(row) {
                var idx = parseInt(row.getAttribute('data-song-idx'), 10);
                var isSel = Library.selectedSongs.has(idx);
                var cb = row.querySelector('.select-checkbox');
                var title = row.querySelector('.song-title-text');
                if (isSel) {
                    row.className = 'song-select-row flex items-center gap-3 p-2.5 rounded-xl cursor-pointer active:scale-[0.99] transition-all select-none bg-rose-500/15 border border-rose-500/40 shadow-sm';
                    if (cb) {
                        cb.className = 'select-checkbox w-6 h-6 rounded-lg bg-rose-500 border border-rose-400 text-white shadow-md flex items-center justify-center shrink-0 transition-all';
                    }
                    if (title) {
                        title.className = 'song-title-text text-sm truncate text-rose-300 font-bold';
                    }
                } else {
                    row.className = 'song-select-row flex items-center gap-3 p-2.5 rounded-xl cursor-pointer active:scale-[0.99] transition-all select-none bg-white/[0.03] border border-white/5 hover:bg-white/[0.06]';
                    if (cb) {
                        cb.className = 'select-checkbox w-6 h-6 rounded-lg bg-black/40 border border-white/30 text-transparent flex items-center justify-center shrink-0 transition-all';
                    }
                    if (title) {
                        title.className = 'song-title-text text-sm truncate text-white font-medium';
                    }
                }
            });
        }
        lucide.createIcons();
    },

    deleteSelectedSongs(id) {
        var pls = getUserPlaylists();
        var pl = pls.find(function(p){ return p.id === id; });
        if (!pl || !pl.songs) return;
        var count = Library.selectedSongs.size;
        if (count === 0) {
            if (typeof showToast === 'function') showToast('Pilih setidaknya 1 lagu terlebih dahulu');
            return;
        }

        var popup = document.createElement('div');
        popup.className = 'fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in';
        popup.innerHTML = '<div class="w-full max-w-sm sm:max-w-md rounded-3xl p-6 border border-white/15 shadow-2xl relative" style="animation:slideUp 0.3s ease-out forwards; background: #12141c; box-shadow: 0 20px 40px rgba(239,68,68,0.2);">' +
            '<div class="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 mb-4">' +
                '<i data-lucide="trash-2" class="w-6 h-6"></i>' +
            '</div>' +
            '<h3 class="font-black text-white text-lg mb-1 tracking-tight">Hapus ' + count + ' Lagu Terpilih?</h3>' +
            '<p class="text-white/70 text-xs leading-relaxed mb-5">Lagu yang dicentang akan dihapus dari playlist "<span class="text-white font-semibold">' + es(pl.name) + '</span>".</p>' +
            '<div class="flex gap-2.5">' +
                '<button id="confirm-batch-delete-btn" class="flex-1 py-3 px-4 rounded-xl bg-red-500 hover:bg-red-600 active:scale-95 text-white font-bold text-xs shadow-lg shadow-red-500/25 transition-all cursor-pointer flex items-center justify-center gap-1.5">' +
                    '<i data-lucide="trash-2" class="w-4 h-4"></i>' +
                    '<span>Hapus ' + count + ' Lagu</span>' +
                '</button>' +
                '<button onclick="this.closest(\'.fixed\').remove()" class="py-3 px-5 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-white font-semibold text-xs border border-white/10 transition-all cursor-pointer">Batal</button>' +
            '</div>' +
        '</div>';
        document.body.appendChild(popup);
        lucide.createIcons();

        popup.querySelector('#confirm-batch-delete-btn').onclick = function() {
            pl.songs = pl.songs.filter(function(_, idx) {
                return !Library.selectedSongs.has(idx);
            });
            if (pl.songs.length === 0) {
                pl.image = '';
            } else if (!pl.image) {
                pl.image = pl.songs[0].cover;
            }
            saveUserPlaylists(pls);
            Library.selectMode = false;
            Library.selectedSongs.clear();
            popup.remove();
            Library.open(id);
            if (typeof showToast === 'function') showToast(count + ' lagu berhasil dihapus');
        };
    },

    open(id){
        var pls=getUserPlaylists();var pl=pls.find(function(p){return p.id===id;});if(!pl)return;
        Library.currentPlaylistId = id;
        var url = location.origin + '/playlist/' + id;
        history.pushState({}, '', url);
        
        var modal = gid('library-modal');
        if(!modal) {
            modal = document.createElement('div');
            modal.id = 'library-modal';
            modal.className = 'fixed inset-0 bg-[#050507] flex flex-col z-[100]';
            modal.style.animation = 'slideUp 0.3s ease-out forwards';
            document.body.appendChild(modal);
        }
        modal.style.display = 'flex';
        
        var dupInfo = Library.getDuplicateInfo(pl);
        var isSelMode = Library.selectMode;

        var headerHtml = '';
        if (isSelMode) {
            headerHtml = `
            <div class="flex items-center justify-between p-3.5 pt-safe bg-[#0d0f16]/95 backdrop-blur-xl border-b border-white/10 shadow-2xl sticky top-0 left-0 w-full z-[100] transition-all" id="library-header">
                <div class="flex items-center gap-2">
                    <button onclick="Library.toggleSelectMode('${id}')" class="glass glass-hover rounded-full text-white/80 hover:text-white p-2 active:scale-90 transition-all cursor-pointer" title="Keluar"><i data-lucide="x" class="w-5 h-5"></i></button>
                    <span id="select-count-text" class="text-xs font-bold text-white px-2.5 py-1 rounded-lg bg-rose-500/20 border border-rose-500/30 font-mono tracking-tight">${Library.selectedSongs.size} Dipilih</span>
                </div>
                <div class="flex items-center gap-2">
                    <button id="btn-select-all" onclick="Library.selectAllSongs('${id}')" class="text-xs font-semibold text-white/80 hover:text-white px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 transition-all cursor-pointer">
                        ${Library.selectedSongs.size === pl.songs.length && pl.songs.length > 0 ? 'Batal Semua' : 'Pilih Semua'}
                    </button>
                    <button id="btn-delete-selected" onclick="Library.deleteSelectedSongs('${id}')" class="px-3.5 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-red-500/20 transition-all cursor-pointer ${Library.selectedSongs.size === 0 ? 'opacity-50 pointer-events-none' : ''}">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                        <span>Hapus (${Library.selectedSongs.size})</span>
                    </button>
                </div>
            </div>`;
        } else {
            headerHtml = `
            <div class="flex items-center gap-3 p-4 pt-safe bg-transparent absolute top-0 left-0 w-full z-[100] transition-all" id="library-header">
                <button onclick="Library.close()" class="glass glass-hover rounded-full text-white p-3 active:scale-90 shadow-md bg-black/80 cursor-pointer"><i data-lucide="arrow-left" class="w-6 h-6"></i></button>
                <div class="flex-1"></div>
                <div class="flex items-center gap-1 bg-black/80 rounded-full shadow-md">
                    <button onclick="Library.share('${id}')" class="text-white hover:text-white p-2.5 active:scale-90 cursor-pointer" title="Bagikan Playlist"><i data-lucide="share-2" class="w-5 h-5"></i></button>
                    <button onclick="Library.editPlaylist('${id}')" class="text-white hover:text-white p-2.5 active:scale-90 cursor-pointer" title="Edit Playlist"><i data-lucide="pencil" class="w-5 h-5"></i></button>
                    <button onclick="Library.confirmDelete('${id}')" class="text-red-400 hover:text-red-300 p-2.5 active:scale-90 cursor-pointer" title="Hapus Playlist"><i data-lucide="trash-2" class="w-5 h-5"></i></button>
                </div>
            </div>`;
        }

        var html = headerHtml + `
            <div class="flex-1 overflow-y-auto hide-scrollbar pb-36 relative" id="library-content" onscroll="Library.handleScroll()">
                <div class="relative w-full aspect-square md:aspect-video max-h-[50vh] overflow-hidden ${isSelMode ? 'mt-0' : '-mt-20'} mb-6">
                    <img src="${pl.image||(pl.songs.length>0?pl.songs[0].cover:FI)}" class="w-full h-full object-cover" onerror="this.src='${FI}'" />
                    <div class="absolute inset-0 bg-gradient-to-t from-[#050507] via-[#050507]/60 to-transparent"></div>
                    <div class="absolute bottom-6 left-6 right-6 flex flex-col justify-end items-center text-center z-10">
                        <img src="${pl.image||(pl.songs.length>0?pl.songs[0].cover:FI)}" class="w-32 h-32 md:w-48 md:h-48 rounded-xl object-cover border border-white/10 mb-4 shadow-2xl" onerror="this.src='${FI}'" />
                        <div>
                            <p class="text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-1">PLAYLIST LOKAL</p>
                            <h1 class="text-3xl md:text-5xl font-black text-white mb-2 leading-tight line-clamp-2">${es(pl.name)}</h1>
                            <p class="text-white text-xs md:text-sm line-clamp-2">${pl.songs.length} lagu</p>
                        </div>
                    </div>
                </div>

                <!-- Action Toolbar -->
                <div class="px-6 mb-5 flex flex-wrap items-center gap-2.5">
                    ${pl.songs.length>0 && !isSelMode ? `
                        <button onclick="Library.playSong('${id}',0)" class="bg-white hover:bg-gray-200 text-black w-12 h-12 rounded-full flex items-center justify-center active:scale-95 transition-all shadow-lg shadow-white/20 cursor-pointer" title="Putar Semua">
                            <i data-lucide="play" class="w-6 h-6 fill-current ml-0.5"></i>
                        </button>
                        <button onclick="Library.shufflePlaylist('${id}')" class="text-white/80 hover:text-white w-12 h-12 rounded-full active:scale-95 bg-white/10 hover:bg-white/15 border border-white/10 flex items-center justify-center transition-all cursor-pointer" title="Acak Urutan (Shuffle)">
                            <i data-lucide="shuffle" class="w-5 h-5"></i>
                        </button>
                        <button onclick="Library.toggleSelectMode('${id}')" class="px-3.5 py-3 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition-all cursor-pointer" title="Hapus Banyak Lagu Sekaligus">
                            <i data-lucide="check-square" class="w-4 h-4 text-rose-400"></i>
                            <span>Pilih Banyak</span>
                        </button>
                        <button onclick="Library.cleanDuplicates('${id}')" class="px-3.5 py-3 rounded-full ${dupInfo.count > 0 ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30' : 'bg-white/10 text-white border-white/10 hover:bg-white/20'} active:scale-95 text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer" title="Pembersih Lagu Duplikat">
                            <i data-lucide="sparkles" class="w-4 h-4 text-amber-400"></i>
                            <span>${dupInfo.count > 0 ? 'Duplikat (' + dupInfo.count + ')' : 'Cek Duplikat'}</span>
                        </button>
                    ` : ''}
                </div>

                <!-- Duplicate Songs Alert Banner -->
                ${dupInfo.count > 0 && !isSelMode ? `
                    <div class="mx-6 mb-5 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/30 flex items-center justify-between gap-3 shadow-lg">
                        <div class="flex items-center gap-2.5 min-w-0">
                            <div class="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400">
                                <i data-lucide="sparkles" class="w-5 h-5"></i>
                            </div>
                            <div class="min-w-0">
                                <p class="text-xs font-bold text-amber-300">Ada ${dupInfo.count} Lagu Duplikat</p>
                                <p class="text-[10px] text-amber-200/80 truncate">Hapus lagu kembar agar playlist rapi</p>
                            </div>
                        </div>
                        <button onclick="Library.cleanDuplicates('${id}')" class="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-black text-xs shrink-0 shadow-md transition-all cursor-pointer flex items-center gap-1">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                            <span>Bersihkan</span>
                        </button>
                    </div>
                ` : ''}
        `;

        if(pl.songs.length===0){
            html+='<div class="text-center text-white/70 mt-10"><p>Belum ada lagu</p></div>';
        } else {
            html+='<div id="playlist-songs-list" class="space-y-1.5 px-4">';
            pl.songs.forEach(function(s,i){
                if (isSelMode) {
                    var isSel = Library.selectedSongs.has(i);
                    html += '<div onclick="Library.toggleSongSelect(\''+id+'\','+i+')" data-song-idx="'+i+'" class="song-select-row flex items-center gap-3 p-2.5 rounded-xl cursor-pointer active:scale-[0.99] transition-all select-none ' + (isSel ? 'bg-rose-500/15 border border-rose-500/40 shadow-sm' : 'bg-white/[0.03] border border-white/5 hover:bg-white/[0.06]') + '">' +
                        '<div class="select-checkbox w-6 h-6 rounded-lg ' + (isSel ? 'bg-rose-500 border border-rose-400 text-white shadow-md' : 'bg-black/40 border border-white/30 text-transparent') + ' flex items-center justify-center shrink-0 transition-all">' +
                            '<i data-lucide="check" class="w-4 h-4 stroke-[3]"></i>' +
                        '</div>' +
                        '<div class="relative w-10 h-10 rounded-lg overflow-hidden shrink-0">' +
                            '<img src="' + s.cover + '" class="w-full h-full object-cover" onerror="this.src=\'' + FI + '\'" />' +
                        '</div>' +
                        '<div class="truncate flex-1 min-w-0">' +
                            '<p class="song-title-text text-sm truncate ' + (isSel ? 'text-rose-300 font-bold' : 'text-white font-medium') + '">' + es(s.title) + '</p>' +
                            '<p class="text-white/60 text-xs truncate">' + es(s.artist) + '</p>' +
                        '</div>' +
                    '</div>';
                } else {
                    var isCur = S.ct && (
                        (s.id && (S.ct.id === s.id || S.ct.videoId === s.id)) ||
                        (s.videoId && (S.ct.id === s.videoId || S.ct.videoId === s.videoId)) ||
                        (s.title && S.ct.title && s.title.trim().toLowerCase() === S.ct.title.trim().toLowerCase() && (!s.artist || !S.ct.artist || s.artist.trim().toLowerCase() === S.ct.artist.trim().toLowerCase()))
                    );
                    var isPlay = isCur && S.ip;
                    var isLoad = isCur && S.il;

                    var iconOverlay = '';
                    if (isLoad) {
                        iconOverlay = '<div class="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>';
                    } else if (isPlay) {
                        iconOverlay = '<div class="flex items-end justify-center gap-[2px] w-4 h-4 pb-0.5"><span class="w-[2px] bg-rose-400 rounded-full animate-eq-1"></span><span class="w-[2px] bg-rose-400 rounded-full animate-eq-2"></span><span class="w-[2px] bg-rose-400 rounded-full animate-eq-3"></span></div>';
                    } else if (isCur) {
                        iconOverlay = '<i data-lucide="pause" class="w-4 h-4 text-rose-400 fill-current"></i>';
                    } else {
                        iconOverlay = '<i data-lucide="play" class="w-4 h-4 text-white fill-white"></i>';
                    }

                    var rowBg = isPlay 
                        ? 'bg-white/20 border-white/40 shadow-lg shadow-white/10' 
                        : (isCur ? 'bg-white/15 border-white/30' : 'bg-white/[0.08] hover:bg-white/[0.14] border-white/20 hover:border-white/35 shadow-sm');
                    var titleClass = isCur ? 'text-white font-black' : 'text-white/90 font-bold';

                    html+='<div class="flex items-center gap-2.5 sm:gap-3 p-1.5 pr-3 sm:p-2 sm:pr-4 rounded-full active:scale-95 transition-all duration-200 border backdrop-blur-md select-none ' + rowBg + '">'+
                        '<div onclick="Library.playSong(\''+id+'\','+i+')" class="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0 cursor-pointer">'+
                            '<div class="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden shrink-0 shadow-sm border border-white/20 bg-black/40">'+
                                '<img src="'+s.cover+'" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onerror="this.src=\'' + FI + '\'" />'+
                                '<div class="absolute inset-0 bg-black/60 ' + (isCur ? 'opacity-100' : 'opacity-0 hover:opacity-100') + ' transition-all flex items-center justify-center">' + iconOverlay + '</div>'+
                            '</div>'+
                            '<div class="truncate flex-1 min-w-0">'+
                                '<p class="text-xs sm:text-sm truncate ' + titleClass + '">'+es(s.title)+'</p>'+
                                '<p class="text-white/60 text-[11px] truncate mt-0.5">'+es(s.artist)+'</p>'+
                            '</div>'+
                        '</div>'+
                        '<button onclick="Library.removeSong(\''+id+'\','+i+')" class="w-8 h-8 rounded-full bg-white/5 hover:bg-red-500/20 text-white/50 hover:text-red-400 border border-white/10 flex items-center justify-center shrink-0 active:scale-90 transition-all cursor-pointer" title="Hapus dari Playlist"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>'+
                    '</div>';
                }
            });
            html+='</div>';
        }
        html+='</div>';
        modal.innerHTML=html;
        lucide.createIcons();
    },
    closeModalOnly() {
        var modal = gid('library-modal');
        if(modal) modal.style.display = 'none';
        Library.currentPlaylistId = null;
        Library.selectMode = false;
        Library.selectedSongs.clear();
    },
    close() {
        if(window.location.pathname.startsWith('/playlist/')) history.pushState({},'', '/');
        this.closeModalOnly();
        if (S.at === 'library') Library.render();
    },
    renderActive() {
        if (Library.selectMode) return;
        if (S.at === 'library' && S.libTab === 'liked') {
            Library.render();
            return;
        }
        var modal = gid('library-modal');
        if (!modal || modal.style.display === 'none' || !Library.currentPlaylistId) return;
        var pls = getUserPlaylists();
        var pl = pls.find(function(p){ return p.id === Library.currentPlaylistId; });
        var container = gid('playlist-songs-list');
        if (!container || !pl || !pl.songs) return;

        var children = container.children;
        for (var i = 0; i < pl.songs.length; i++) {
            var s = pl.songs[i];
            var el = children[i];
            if (!el) continue;

            var isCur = S.ct && (
                (s.id && (S.ct.id === s.id || S.ct.videoId === s.id)) ||
                (s.videoId && (S.ct.id === s.videoId || S.ct.videoId === s.videoId)) ||
                (s.title && S.ct.title && s.title.trim().toLowerCase() === S.ct.title.trim().toLowerCase() && (!s.artist || !S.ct.artist || s.artist.trim().toLowerCase() === S.ct.artist.trim().toLowerCase()))
            );
            var isPlay = isCur && S.ip;
            var isLoad = isCur && S.il;

            var iconOverlay = '';
            if (isLoad) {
                iconOverlay = '<div class="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>';
            } else if (isPlay) {
                iconOverlay = '<div class="flex items-end justify-center gap-[2px] w-4 h-4 pb-0.5"><span class="w-[2px] bg-rose-400 rounded-full animate-eq-1"></span><span class="w-[2px] bg-rose-400 rounded-full animate-eq-2"></span><span class="w-[2px] bg-rose-400 rounded-full animate-eq-3"></span></div>';
            } else if (isCur) {
                iconOverlay = '<i data-lucide="pause" class="w-4 h-4 text-rose-400 fill-current"></i>';
            } else {
                iconOverlay = '<i data-lucide="play" class="w-4 h-4 text-white fill-white"></i>';
            }

            var coverOverlay = el.querySelector('.relative.w-12 .absolute') || el.querySelector('.relative.w-10 .absolute');
            if (coverOverlay) {
                coverOverlay.innerHTML = iconOverlay;
                coverOverlay.className = 'absolute inset-0 bg-black/70 ' + (isCur ? 'opacity-100' : 'opacity-0 group-hover:opacity-100') + ' transition-all flex items-center justify-center';
            }

            var rowBg = isPlay ? 'bg-[#282b3a] border border-white/35 shadow-xl' : (isCur ? 'bg-[#202330] border border-white/25' : 'bg-[#181920] border border-white/[0.08] hover:bg-[#21232e]');
            el.className = 'flex items-center gap-3 p-2.5 rounded-[18px] active:scale-[0.98] transition-all shadow-md ' + rowBg;

            var titleEl = el.querySelector('p');
            if (titleEl) {
                titleEl.className = 'text-sm truncate ' + (isCur ? 'text-white font-black' : 'text-white/95 font-bold');
            }
        }
        lucide.createIcons();
    },
    removeSong(plId,index){var pls=getUserPlaylists();var pl=pls.find(function(p){return p.id===plId;});if(!pl)return;pl.songs.splice(index,1);saveUserPlaylists(pls);Library.open(plId);showToast('Lagu dihapus');},
    shufflePlaylist(plId){
        var pls = getUserPlaylists();
        var pl = pls.find(p => p.id === plId);
        if(!pl || pl.songs.length === 0) return;
        var arr = pl.songs;
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        saveUserPlaylists(pls);
        Library.open(plId);
        showToast('Urutan playlist diacak');
    },
    playSong(plId,index){
        var pls=getUserPlaylists();var pl=pls.find(function(p){return p.id===plId;});if(!pl||!pl.songs[index])return;
        var s = pl.songs[index];
        if (S.ct && (S.ct.id === s.id || S.ct.videoId === s.videoId || (S.ct.title === s.title && S.ct.artist === s.artist)) && AU.src) {
            TP();
            return;
        }
        S.pl=pl.songs;S.pi=index;S.ps='playlist';S.ct=S.pl[S.pi];UU();MP.show();S.il=true;UB();resetLyricsUI(S.ct.videoId);loadTrack(S.ct);
    }
};
