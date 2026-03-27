/**
 * LunaOS — Music App
 * YouTube iframe-based music player with curated playlist.
 */
'use strict';

(function (global) {
  function mount(container) {
    const YT = global.NovaOS.YoutubeService;
    let currentIdx = 0;
    let playlist = [...YT.defaultPlaylist];

    container.innerHTML = `
      <div class="music-app">
        <div class="music-search-bar">
          <input class="input" id="mus-url" placeholder="YouTube URL or Video ID…" style="flex:1" />
          <button class="btn btn-primary btn-sm" id="mus-load">▶ Load</button>
        </div>
        <div class="music-player">
          <div class="music-embed-wrap" id="mus-embed"></div>
          <div class="music-playlist" id="mus-playlist"></div>
        </div>
      </div>
    `;

    const embedWrap = container.querySelector('#mus-embed');
    const playlistEl= container.querySelector('#mus-playlist');
    const urlInput  = container.querySelector('#mus-url');
    const loadBtn   = container.querySelector('#mus-load');

    function loadTrack(idx, autoplay = 0) {
      currentIdx = idx;
      const track = playlist[idx];
      embedWrap.innerHTML = '';

      if (!track) return;

      const iframe = YT.createEmbed(track.id, { autoplay });
      iframe.addEventListener('error', () => showEmbedError(track.id));
      embedWrap.appendChild(iframe);
      renderPlaylist();
    }

    function showEmbedError(id) {
      embedWrap.innerHTML = `
        <div class="music-error">
          <div style="font-size:32px">🎵</div>
          <div style="font-size:14px;font-weight:500">Playback blocked</div>
          <div style="font-size:12px">This video may be restricted.<br/>Try another track or open YouTube directly.</div>
          <a href="https://youtu.be/${id}" target="_blank" class="btn btn-ghost btn-sm" style="margin-top:8px">Open on YouTube ↗</a>
        </div>
      `;
    }

    function renderPlaylist() {
      playlistEl.innerHTML = '';
      playlist.forEach((track, i) => {
        const el = document.createElement('div');
        el.className = 'music-track' + (i === currentIdx ? ' playing' : '');
        el.innerHTML = `
          <span class="music-track-icon">${i === currentIdx ? '▶' : '♪'}</span>
          <span style="flex:1">${_esc(track.title)}</span>
          <button class="btn-icon" data-del="${i}" style="font-size:12px;width:24px;height:24px">×</button>
        `;
        el.addEventListener('click', e => {
          if (e.target.dataset.del !== undefined) {
            const di = parseInt(e.target.dataset.del);
            playlist.splice(di, 1);
            if (currentIdx >= di) currentIdx = Math.max(0, currentIdx - 1);
            if (!playlist.length) embedWrap.innerHTML = '<div class="music-error"><div style="font-size:32px">🎵</div><div>Playlist empty</div></div>';
            else loadTrack(currentIdx);
            return;
          }
          loadTrack(i, 1);
        });
        playlistEl.appendChild(el);
      });
    }

    loadBtn.addEventListener('click', () => {
      const raw = urlInput.value.trim();
      if (!raw) return;
      const id = YT.extractId(raw);
      if (!id) {
        global.NovaOS.Kernel.notify('Music', 'Invalid YouTube URL or ID', '⚠️');
        return;
      }
      const title = prompt('Track name:', raw) || raw;
      playlist.push({ id, title });
      urlInput.value = '';
      loadTrack(playlist.length - 1, 1);
    });

    urlInput.addEventListener('keydown', e => { if (e.key === 'Enter') loadBtn.click(); });

    // Load first track
    if (playlist.length) loadTrack(0);
  }

  function _esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  global.NovaOS.AppLoader.register({
    id: 'music', title: 'Music', width: 500, height: 520,
    mount
  });
})(window);
