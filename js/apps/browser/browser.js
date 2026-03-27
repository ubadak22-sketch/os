/**
 * LunaOS — Browser App
 * Sandboxed browser with curated bookmarks. Uses iframe with safe origins.
 */
'use strict';

(function (global) {
  const BOOKMARKS = [
    { label: '🌐 Wikipedia',   url: 'https://en.m.wikipedia.org/wiki/Main_Page' },
    { label: '📰 HN',          url: 'https://news.ycombinator.com' },
    { label: '🧮 Wolfram Alpha',url: 'https://www.wolframalpha.com' },
    { label: '📖 MDN',         url: 'https://developer.mozilla.org/en-US/' },
    { label: '🗺 OpenStreetMap',url: 'https://www.openstreetmap.org' },
    { label: '📡 Weather',     url: 'https://forecast.weather.gov' },
  ];

  function mount(container) {
    container.innerHTML = `
      <div class="browser-app">
        <div class="browser-bar">
          <button class="btn-icon" id="br-back" title="Back">‹</button>
          <button class="btn-icon" id="br-fwd" title="Forward">›</button>
          <button class="btn-icon" id="br-reload" title="Reload">↻</button>
          <div class="browser-url" id="br-url">about:blank</div>
          <button class="btn btn-primary btn-sm" id="br-go">Go</button>
        </div>
        <div class="browser-bookmarks" id="br-bookmarks"></div>
        <div style="flex:1;position:relative;overflow:hidden">
          <iframe class="browser-frame" id="br-frame"
            sandbox="allow-scripts allow-same-origin allow-forms"
            src="about:blank"
            title="Browser"
          ></iframe>
          <div id="br-overlay" style="display:none;position:absolute;inset:0;background:var(--luna-surface);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;z-index:10">
            <div style="font-size:40px">🌐</div>
            <div style="font-size:15px;font-weight:500;color:var(--luna-text-2)">Page blocked</div>
            <div style="font-size:12px;color:var(--luna-text-3);text-align:center;max-width:280px">This site cannot be loaded in a sandboxed frame.<br/>Use the bookmarks above for supported sites.</div>
          </div>
        </div>
      </div>
    `;

    const frame    = container.querySelector('#br-frame');
    const urlEl    = container.querySelector('#br-url');
    const bookmarks= container.querySelector('#br-bookmarks');
    const overlay  = container.querySelector('#br-overlay');

    function navigate(url) {
      if (!url || url === 'about:blank') return;
      try {
        const u = url.startsWith('http') ? url : 'https://' + url;
        urlEl.textContent = u;
        overlay.style.display = 'none';
        frame.src = u;
      } catch (err) {
        console.warn('[Browser] navigate error:', err);
      }
    }

    // Detect blocked pages
    frame.addEventListener('error', () => {
      overlay.style.display = 'flex';
    });

    frame.addEventListener('load', () => {
      try {
        // If the frame loads about:blank or similar, show placeholder
        if (frame.contentDocument?.location?.href === 'about:blank' && frame.src !== 'about:blank') {
          overlay.style.display = 'flex';
        } else {
          overlay.style.display = 'none';
        }
      } catch {
        // Cross-origin — that's OK, page loaded
        overlay.style.display = 'none';
      }
    });

    // Bookmarks
    BOOKMARKS.forEach(bm => {
      const el = document.createElement('div');
      el.className = 'browser-bookmark';
      el.textContent = bm.label;
      el.addEventListener('click', () => navigate(bm.url));
      bookmarks.appendChild(el);
    });

    // Nav controls
    container.querySelector('#br-back').addEventListener('click', () => {
      try { frame.contentWindow?.history.back(); } catch {}
    });
    container.querySelector('#br-fwd').addEventListener('click', () => {
      try { frame.contentWindow?.history.forward(); } catch {}
    });
    container.querySelector('#br-reload').addEventListener('click', () => {
      try { frame.contentWindow?.location.reload(); } catch { frame.src = frame.src; }
    });
    container.querySelector('#br-go').addEventListener('click', () => {
      navigate(urlEl.textContent.trim());
    });

    // Make URL clickable/editable
    urlEl.addEventListener('click', () => {
      const current = urlEl.textContent;
      const input = document.createElement('input');
      input.className = 'input';
      input.value = current;
      input.style.cssText = 'flex:1;font-size:12px;font-family:var(--font-mono)';
      urlEl.replaceWith(input);
      input.select();
      const commit = () => {
        const newUrl = input.value.trim();
        input.replaceWith(urlEl);
        urlEl.textContent = newUrl;
        navigate(newUrl);
      };
      input.addEventListener('blur', commit);
      input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); commit(); } });
    });

    // Start with Wikipedia
    navigate(BOOKMARKS[0].url);
  }

  global.NovaOS.AppLoader.register({
    id: 'browser', title: 'Browser', width: 800, height: 560,
    mount
  });
})(window);
