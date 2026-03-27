/**
 * LunaOS — Settings App
 * System preferences: appearance, system info, storage management.
 */
'use strict';

(function (global) {
  const store = global.NovaOS.Storage.ns('settings');

  const SECTIONS = ['Appearance', 'System', 'Storage', 'About'];

  function mount(container) {
    let activeSection = 'Appearance';

    container.innerHTML = `
      <div class="settings-app">
        <div class="settings-sidebar" id="stg-sidebar"></div>
        <div class="settings-main" id="stg-main"></div>
      </div>
    `;

    const sidebar = container.querySelector('#stg-sidebar');
    const main    = container.querySelector('#stg-main');

    const ICONS = { Appearance: '🎨', System: '⚙️', Storage: '💾', About: 'ℹ️' };

    SECTIONS.forEach(sec => {
      const el = document.createElement('div');
      el.className = 'settings-nav-item' + (sec === activeSection ? ' active' : '');
      el.innerHTML = `<span>${ICONS[sec]}</span><span>${sec}</span>`;
      el.addEventListener('click', () => {
        sidebar.querySelectorAll('.settings-nav-item').forEach(x => x.classList.remove('active'));
        el.classList.add('active');
        activeSection = sec;
        renderSection();
      });
      sidebar.appendChild(el);
    });

    function renderSection() {
      main.innerHTML = '';
      switch (activeSection) {
        case 'Appearance': renderAppearance(); break;
        case 'System':     renderSystem();     break;
        case 'Storage':    renderStorage();    break;
        case 'About':      renderAbout();      break;
      }
    }

    function row(label, desc, control) {
      return `
        <div class="settings-row">
          <div>
            <div class="settings-row-label">${label}</div>
            ${desc ? `<div class="settings-row-desc">${desc}</div>` : ''}
          </div>
          <div>${control}</div>
        </div>
      `;
    }

    function renderAppearance() {
      const userName = global.NovaOS.Kernel.state.userName || 'User';
      main.innerHTML = `
        <div class="settings-section-title">Appearance</div>
        <div class="settings-group">
          <div class="settings-group-title">Identity</div>
          ${row('Username', 'Your display name', `<input class="input" id="stg-username" value="${_esc(userName)}" style="width:160px" />`)}
        </div>
        <div class="settings-group">
          <div class="settings-group-title">Wallpaper</div>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:8px" id="stg-wallpapers"></div>
        </div>
        <div class="settings-group">
          <div class="settings-group-title">Dock</div>
          ${row('Show app labels on hover', 'Tooltip labels on dock icons', `<div class="toggle on" id="stg-dock-labels"></div>`)}
        </div>
      `;

      main.querySelector('#stg-username').addEventListener('change', e => {
        global.NovaOS.Kernel.setState('userName', e.target.value);
        global.NovaOS.Kernel.notify('Settings', 'Username updated', '✅');
      });

      const wallpapers = [
        { id: 'default',  style: 'background:radial-gradient(ellipse at 20% 80%,rgba(194,123,62,.2),transparent 60%),radial-gradient(ellipse at 80% 20%,rgba(58,110,165,.15),transparent 55%),linear-gradient(135deg,#f0ede8,#e8dfd0)' },
        { id: 'ocean',    style: 'background:linear-gradient(135deg,#1a4f7a,#2d8fb5,#7ec8d8)' },
        { id: 'forest',   style: 'background:linear-gradient(135deg,#1a3320,#2d6640,#7db87a)' },
        { id: 'sunset',   style: 'background:linear-gradient(135deg,#7b2d8b,#e05c2f,#f0a040)' },
        { id: 'midnight', style: 'background:linear-gradient(135deg,#0d0d1a,#1a1a3a,#2a2a5a)' },
        { id: 'rose',     style: 'background:linear-gradient(135deg,#7a2040,#c85580,#e8a0b0)' },
        { id: 'sand',     style: 'background:linear-gradient(135deg,#c8a060,#e8d080,#f8f0c0)' },
        { id: 'slate',    style: 'background:linear-gradient(135deg,#3a4050,#5a6070,#8a9090)' },
      ];

      const wpGrid = main.querySelector('#stg-wallpapers');
      const current = global.NovaOS.Kernel.state.wallpaper || 'default';
      wallpapers.forEach(wp => {
        const el = document.createElement('div');
        el.style.cssText = `height:60px;border-radius:8px;cursor:pointer;${wp.style};border:2px solid ${wp.id===current?'var(--luna-accent)':'transparent'};transition:border-color .2s`;
        el.title = wp.id;
        el.addEventListener('click', () => {
          wpGrid.querySelectorAll('div').forEach(d => d.style.borderColor = 'transparent');
          el.style.borderColor = 'var(--luna-accent)';
          global.NovaOS.Kernel.setState('wallpaper', wp.id);
          global.NovaOS.applyWallpaper?.(wp.id);
          global.NovaOS.Kernel.notify('Settings', 'Wallpaper changed', '🎨');
        });
        wpGrid.appendChild(el);
      });

      // Toggle demo
      const toggle = main.querySelector('#stg-dock-labels');
      toggle.addEventListener('click', () => toggle.classList.toggle('on'));
    }

    function renderSystem() {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const lang = navigator.language;
      const procs = global.NovaOS.ProcessManager.list();
      main.innerHTML = `
        <div class="settings-section-title">System</div>
        <div class="settings-group">
          <div class="settings-group-title">Environment</div>
          ${row('Timezone', '', `<span style="font-family:var(--font-mono);font-size:12px">${tz}</span>`)}
          ${row('Language', '', `<span style="font-family:var(--font-mono);font-size:12px">${lang}</span>`)}
          ${row('Platform', '', `<span style="font-family:var(--font-mono);font-size:12px">${navigator.platform || 'Web'}</span>`)}
        </div>
        <div class="settings-group">
          <div class="settings-group-title">Processes (${procs.length} running)</div>
          ${procs.length ? procs.map(p => row(p.appId, `PID ${p.pid}`, `<button class="btn btn-danger btn-sm" onclick="NovaOS.ProcessManager.kill(${p.pid})">Kill</button>`)).join('') : '<div style="font-size:12px;color:var(--luna-text-3);padding:8px 0">No processes running.</div>'}
        </div>
      `;
    }

    function renderStorage() {
      let totalBytes = 0;
      const keys = global.NovaOS.Storage.keys();
      const breakdown = {};
      keys.forEach(k => {
        try {
          const raw = localStorage.getItem('lunaos:' + k) || '';
          const bytes = raw.length * 2;
          totalBytes += bytes;
          const ns = k.split('.')[0];
          breakdown[ns] = (breakdown[ns] || 0) + bytes;
        } catch {}
      });

      const fmt = b => b > 1024 ? (b/1024).toFixed(1) + ' KB' : b + ' B';

      main.innerHTML = `
        <div class="settings-section-title">Storage</div>
        <div class="settings-group">
          <div class="settings-group-title">Usage — ${fmt(totalBytes)} total</div>
          ${Object.entries(breakdown).map(([ns, b]) => row(ns, '', `<span style="font-family:var(--font-mono);font-size:12px;color:var(--luna-text-2)">${fmt(b)}</span>`)).join('')}
        </div>
        <div class="settings-group">
          <div class="settings-group-title">Actions</div>
          ${row('Clear all LunaOS data', 'Resets settings, notes, files etc.', `<button class="btn btn-danger btn-sm" id="stg-clear-all">Clear All</button>`)}
        </div>
      `;

      main.querySelector('#stg-clear-all')?.addEventListener('click', () => {
        if (!confirm('Clear ALL LunaOS data? This cannot be undone.')) return;
        global.NovaOS.Storage.keys().forEach(k => global.NovaOS.Storage.remove(k));
        global.NovaOS.Kernel.notify('Settings', 'All data cleared. Reloading...', '🗑');
        setTimeout(() => location.reload(), 1500);
      });
    }

    function renderAbout() {
      main.innerHTML = `
        <div class="settings-section-title">About LunaOS</div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:16px;padding:24px;text-align:center">
          <div style="font-size:64px;line-height:1">◐</div>
          <div style="font-family:var(--font-serif);font-size:28px;font-weight:300">LunaOS</div>
          <div style="font-size:12px;color:var(--luna-text-3);font-family:var(--font-mono)">Version 1.0.0</div>
          <div class="panel" style="text-align:left;max-width:360px;font-size:13px;line-height:1.7;color:var(--luna-text-2)">
            A production-grade, modular browser OS built with vanilla JS. Features a real kernel, window manager, process manager, event bus, and 12 fully functional applications.
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%;max-width:360px">
            ${[['Kernel','v1.0'],['Window Manager','Drag + Resize'],['Apps','12 installed'],['Storage','localStorage']].map(([k,v])=>`
              <div class="panel" style="text-align:center">
                <div style="font-size:11px;color:var(--luna-text-3);text-transform:uppercase;letter-spacing:.06em">${k}</div>
                <div style="font-size:14px;font-weight:500;margin-top:4px">${v}</div>
              </div>`).join('')}
          </div>
        </div>
      `;
    }

    renderSection();
  }

  function _esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  global.NovaOS.AppLoader.register({
    id: 'settings', title: 'Settings', width: 680, height: 500,
    mount
  });
})(window);
