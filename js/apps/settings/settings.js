/**
 * Nova OS — Settings App v2
 * Appearance, System, Storage (256 GB), Security, About
 */
'use strict';

(function (global) {
  const store = global.NovaOS.Storage.ns('settings');

  const SECTIONS = [
    { id: 'Appearance', icon: '🎨' },
    { id: 'System',     icon: '⚙️' },
    { id: 'Storage',    icon: '💾' },
    { id: 'Security',   icon: '🔒' },
    { id: 'About',      icon: 'ℹ️' },
  ];

  function mount(container, { openSection } = {}) {
    let activeSection = openSection || 'Appearance';

    container.innerHTML = `
      <div class="settings-app">
        <div class="settings-sidebar" id="stg-sidebar"></div>
        <div class="settings-main" id="stg-main"></div>
      </div>`;

    const sidebar = container.querySelector('#stg-sidebar');
    const main    = container.querySelector('#stg-main');

    SECTIONS.forEach(sec => {
      const el = document.createElement('div');
      el.className = 'settings-nav-item' + (sec.id === activeSection ? ' active' : '');
      el.innerHTML = `<span>${sec.icon}</span><span>${sec.id}</span>`;
      el.addEventListener('click', () => {
        sidebar.querySelectorAll('.settings-nav-item').forEach(x => x.classList.remove('active'));
        el.classList.add('active');
        activeSection = sec.id;
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
        case 'Security':   renderSecurity();   break;
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
        </div>`;
    }

    // ── Appearance ─────────────────────────────────────────
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
          ${row('Show labels on hover', 'Tooltip labels on dock icons', `<div class="toggle on" id="stg-dock-labels"></div>`)}
        </div>
        <div class="settings-group">
          <div class="settings-group-title">System Sounds</div>
          ${row('Enable Sounds', 'UI clicks, window open/close, notifications', `<div class="toggle ${global.NovaOS.SoundSystem?.isEnabled() ? 'on' : ''}" id="stg-sounds"></div>`)}
        </div>`;

      main.querySelector('#stg-username').addEventListener('change', e => {
        global.NovaOS.Kernel.setState('userName', e.target.value);
        global.NovaOS.Kernel.notify('Settings', 'Username updated', '✅');
      });

      const wallpapers = [
        { id:'default',  label:'Nova',    style:'background:linear-gradient(135deg,#0f0f1a,#1a1a3e,#0f1a2e)' },
        { id:'midnight', label:'Midnight',style:'background:linear-gradient(135deg,#0d0d1a,#1a1a3a,#2a2a5a)' },
        { id:'ocean',    label:'Ocean',   style:'background:linear-gradient(135deg,#0a1628,#0f2a4a,#0a1e38)' },
        { id:'forest',   label:'Forest',  style:'background:linear-gradient(135deg,#071a0f,#0f2e1a,#071a0f)' },
        { id:'sunset',   label:'Sunset',  style:'background:linear-gradient(135deg,#1a0a1e,#2e1030,#1a0a14)' },
        { id:'rose',     label:'Rose',    style:'background:linear-gradient(135deg,#1a0a14,#2e0f20,#1a0a18)' },
        { id:'slate',    label:'Slate',   style:'background:linear-gradient(135deg,#0a0a14,#141428,#0a0a20)' },
        { id:'sand',     label:'Amber',   style:'background:linear-gradient(135deg,#1a1400,#2e2400,#1a1800)' },
      ];

      const wpGrid = main.querySelector('#stg-wallpapers');
      const current = global.NovaOS.Kernel.state.wallpaper || 'default';
      wallpapers.forEach(wp => {
        const el = document.createElement('div');
        el.style.cssText = `height:54px;border-radius:8px;cursor:pointer;${wp.style};
          border:2px solid ${wp.id===current?'var(--nova-accent)':'rgba(255,255,255,0.1)'};
          transition:border-color .2s,transform .15s;position:relative;overflow:hidden`;
        const lbl = document.createElement('div');
        lbl.style.cssText = 'position:absolute;bottom:3px;left:0;right:0;text-align:center;font-size:9px;font-weight:600;color:rgba(255,255,255,0.7);letter-spacing:.06em;text-transform:uppercase';
        lbl.textContent = wp.label;
        el.appendChild(lbl);
        el.addEventListener('click', () => {
          wpGrid.querySelectorAll('div').forEach(d => d.style.borderColor='rgba(255,255,255,0.1)');
          el.style.borderColor = 'var(--nova-accent)';
          global.NovaOS.Kernel.setState('wallpaper', wp.id);
          global.NovaOS.applyWallpaper?.(wp.id);
          global.NovaOS.Kernel.notify('Settings', `Wallpaper: ${wp.label}`, '🎨');
        });
        wpGrid.appendChild(el);
      });

      main.querySelector('#stg-dock-labels').addEventListener('click', function() { this.classList.toggle('on'); });
      main.querySelector('#stg-sounds')?.addEventListener('click', function() {
        this.classList.toggle('on');
        global.NovaOS.SoundSystem?.setEnabled(this.classList.contains('on'));
        global.NovaOS.SoundSystem?.click();
      });
    }

    // ── System ─────────────────────────────────────────────
    function renderSystem() {
      const tz    = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const lang  = navigator.language;
      const procs = global.NovaOS.ProcessManager.list();
      main.innerHTML = `
        <div class="settings-section-title">System</div>
        <div class="settings-group">
          <div class="settings-group-title">Environment</div>
          ${row('Timezone', '', `<span style="font-family:var(--font-mono);font-size:12px;color:var(--nova-text-2)">${tz}</span>`)}
          ${row('Language', '', `<span style="font-family:var(--font-mono);font-size:12px;color:var(--nova-text-2)">${lang}</span>`)}
          ${row('Platform', '', `<span style="font-family:var(--font-mono);font-size:12px;color:var(--nova-text-2)">${navigator.platform || 'Web'}</span>`)}
          ${row('Nova OS Version', '', `<span style="font-family:var(--font-mono);font-size:12px;color:var(--nova-accent-3)">v5.0.0</span>`)}
        </div>
        <div class="settings-group">
          <div class="settings-group-title">Running Processes (${procs.length})</div>
          ${procs.length
            ? procs.map(p => row(p.appId, `PID ${p.pid}`, `<button class="btn btn-danger btn-sm" onclick="NovaOS.ProcessManager.kill(${p.pid})">Kill</button>`)).join('')
            : '<div style="font-size:12px;color:var(--nova-text-3);padding:8px 0">No processes running.</div>'}
        </div>`;
    }

    // ── Storage ─────────────────────────────────────────────
    function renderStorage() {
      const sim   = global.NovaOS.Kernel.StorageSim;
      const used  = sim.used;        // MB
      const total = sim.total;       // 256000 MB = 256 GB
      const free  = sim.available();
      const pct   = Math.round((used / total) * 100);

      // Installed apps for breakdown
      const installedIds = sim.getInstalled();

      // App store catalog sizes (approximate)
      const APP_SIZES = { snake:8, game2048:6, tictactoe:4, gameApp:120, chatApp:60, toolApp:40, securityApp:5 };
      let installedMB = 0;
      installedIds.forEach(id => { installedMB += APP_SIZES[id] || 10; });

      const fmtGB = mb => mb >= 1024 ? (mb/1024).toFixed(2) + ' GB' : mb.toFixed(0) + ' MB';

      // localStorage actual usage
      let lsBytes = 0;
      try {
        const keys = global.NovaOS.Storage.keys();
        keys.forEach(k => { lsBytes += (localStorage.getItem('nova_' + k)||'').length * 2; });
      } catch {}
      const lsKB = (lsBytes / 1024).toFixed(1);

      main.innerHTML = `
        <div class="settings-section-title">Storage</div>

        <!-- Big usage bar -->
        <div class="settings-group">
          <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px">
            <div class="settings-group-title" style="margin-bottom:0">Device Storage</div>
            <span style="font-size:11px;font-family:var(--font-mono);color:var(--nova-text-3)">${fmtGB(used)} / ${fmtGB(total)}</span>
          </div>
          <div style="height:8px;background:rgba(255,255,255,0.08);border-radius:99px;overflow:hidden;margin-bottom:6px">
            <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,var(--nova-accent),var(--nova-accent-2));border-radius:99px;transition:width .5s"></div>
          </div>
          <div style="font-size:11px;color:var(--nova-text-3)">${fmtGB(free)} available · ${pct}% used</div>
        </div>

        <!-- Breakdown -->
        <div class="settings-group">
          <div class="settings-group-title">Breakdown</div>
          ${row('Installed Apps',   `${installedIds.length} apps installed`,   `<span style="font-family:var(--font-mono);font-size:12px;color:var(--nova-text-2)">${fmtGB(installedMB)}</span>`)}
          ${row('App Data',         'Notes, files, settings etc.',              `<span style="font-family:var(--font-mono);font-size:12px;color:var(--nova-text-2)">${lsKB} KB</span>`)}
          ${row('System Reserved',  '256 MB OS overhead',                       `<span style="font-family:var(--font-mono);font-size:12px;color:var(--nova-text-2)">256 MB</span>`)}
          ${row('Available',        'Ready to use',                             `<span style="font-family:var(--font-mono);font-size:12px;color:var(--nova-green)">${fmtGB(free)}</span>`)}
        </div>

        <!-- Installed apps list -->
        ${installedIds.length ? `
          <div class="settings-group">
            <div class="settings-group-title">Installed Apps (${installedIds.length})</div>
            ${installedIds.map(id => row(
              id, `${APP_SIZES[id] || 10} MB`,
              `<button class="btn btn-danger btn-sm stg-uninstall" data-id="${id}">Uninstall</button>`
            )).join('')}
          </div>` : ''}

        <!-- Actions -->
        <div class="settings-group">
          <div class="settings-group-title">Actions</div>
          ${row('Clear App Data', 'Resets notes, files, settings (keeps installed apps)', `<button class="btn btn-danger btn-sm" id="stg-clear-data">Clear Data</button>`)}
          ${row('Factory Reset', 'Wipes everything including installed apps', `<button class="btn btn-danger btn-sm" id="stg-factory-reset">Factory Reset</button>`)}
        </div>`;

      main.querySelector('#stg-clear-data')?.addEventListener('click', () => {
        if (!confirm('Clear all app data? This cannot be undone.')) return;
        // Keep installed list and storage used
        const installed = sim.getInstalled();
        const stoUsed   = sim.used;
        global.NovaOS.Storage.keys().filter(k => !k.startsWith('sys.')).forEach(k => global.NovaOS.Storage.remove(k));
        global.NovaOS.Kernel.notify('Settings', 'App data cleared. Reloading…', '🗑');
        setTimeout(() => location.reload(), 1500);
      });

      main.querySelector('#stg-factory-reset')?.addEventListener('click', () => {
        if (!confirm('Factory reset? ALL data including installed apps will be wiped. This cannot be undone.')) return;
        if (!confirm('Are you absolutely sure? This will delete everything.')) return;
        // Wipe all nova_ keys
        Object.keys(localStorage).filter(k => k.startsWith('nova_')).forEach(k => localStorage.removeItem(k));
        global.NovaOS.Kernel.notify('Settings', 'Factory reset. Rebooting…', '🔄');
        setTimeout(() => location.reload(), 1500);
      });

      main.querySelectorAll('.stg-uninstall').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          if (!confirm(`Uninstall "${id}"?`)) return;
          const list = sim.getInstalled().filter(x => x !== id);
          sim.saveInstalled(list);
          const freed = APP_SIZES[id] || 10;
          sim.free(freed);
          global.NovaOS.Kernel.notify('Settings', `"${id}" uninstalled. ${freed} MB freed.`, '🗑');
          renderStorage(); // refresh
        });
      });
    }

    // ── Security ─────────────────────────────────────────────
    function renderSecurity() {
      const LS      = global.NovaOS.LockScreen;
      const hasPass = LS?.hasPassword?.() || false;

      main.innerHTML = `
        <div class="settings-section-title">Security</div>

        <div class="settings-group">
          <div class="settings-group-title">Lock Screen</div>
          <div style="display:flex;align-items:center;gap:10px;padding:10px 0;margin-bottom:8px">
            <span style="font-size:28px">🔒</span>
            <div>
              <div style="font-size:13px;font-weight:600;color:var(--nova-text)">Password Protection</div>
              <div style="font-size:11px;color:${hasPass ? 'var(--nova-green)' : 'var(--nova-red)'};margin-top:2px">
                ${hasPass ? '🟢 Enabled — lock screen active' : '🔴 Disabled — no password set'}
              </div>
            </div>
          </div>

          ${hasPass ? `
            ${row('Lock Screen Now', 'Lock immediately', `<button class="btn btn-primary btn-sm" id="stg-lock-now">🔒 Lock</button>`)}
            ${row('Change Password', 'Update your password', `<button class="btn btn-ghost btn-sm" id="stg-change-pw">Change</button>`)}
            ${row('Remove Password', 'Disable lock screen', `<button class="btn btn-danger btn-sm" id="stg-remove-pw">Remove</button>`)}
          ` : `
            <div style="background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.22);border-radius:10px;padding:14px;margin-bottom:12px">
              <div style="font-size:13px;font-weight:500;color:var(--nova-text);margin-bottom:4px">Set up a password</div>
              <div style="font-size:12px;color:var(--nova-text-3);line-height:1.5">Install the <strong style="color:var(--nova-accent-3)">Security App</strong> from the App Store to enable password protection, or set it up below.</div>
            </div>
            <div class="sec-form" id="stg-set-form">
              <div class="form-row">
                <div class="form-label">New Password</div>
                <input class="input" id="stg-new-pw" type="password" placeholder="Min 4 characters" maxlength="32" />
              </div>
              <div class="form-row">
                <div class="form-label">Confirm Password</div>
                <input class="input" id="stg-confirm-pw" type="password" placeholder="Confirm password" maxlength="32" />
              </div>
              <div class="sec-error" id="stg-sec-err"></div>
              <button class="btn btn-primary btn-sm" id="stg-set-pw" style="margin-top:4px">🔒 Enable Lock Screen</button>
            </div>
          `}
        </div>

        <!-- Change password form (hidden until needed) -->
        <div id="stg-change-form" style="display:none">
          <div class="settings-group">
            <div class="settings-group-title">Change Password</div>
            <div class="form-row">
              <div class="form-label">Current Password</div>
              <input class="input" id="stg-cur-pw" type="password" placeholder="Current password" maxlength="32" />
            </div>
            <div class="form-row">
              <div class="form-label">New Password</div>
              <input class="input" id="stg-new-pw2" type="password" placeholder="New password" maxlength="32" />
            </div>
            <div class="form-row">
              <div class="form-label">Confirm New</div>
              <input class="input" id="stg-confirm-pw2" type="password" placeholder="Confirm" maxlength="32" />
            </div>
            <div class="sec-error" id="stg-chg-err"></div>
            <div style="display:flex;gap:8px;margin-top:4px">
              <button class="btn btn-primary btn-sm" id="stg-do-change">Update</button>
              <button class="btn btn-ghost btn-sm" id="stg-cancel-change">Cancel</button>
            </div>
          </div>
        </div>`;

      const K  = global.NovaOS.Kernel;
      const showErr = (id, msg) => { const e = main.querySelector('#'+id); if(e){e.textContent=msg;e.classList.add('show');} };
      const clearErr= (id)      => { const e = main.querySelector('#'+id); if(e){e.textContent='';e.classList.remove('show');} };

      if (!hasPass) {
        main.querySelector('#stg-set-pw')?.addEventListener('click', () => {
          clearErr('stg-sec-err');
          const pw  = main.querySelector('#stg-new-pw').value;
          const pw2 = main.querySelector('#stg-confirm-pw').value;
          if (!pw || pw.length < 4) { showErr('stg-sec-err','Min 4 characters.'); return; }
          if (pw !== pw2)           { showErr('stg-sec-err','Passwords do not match.'); return; }
          LS.setPassword(pw);
          K.notify('Security', 'Password set. Lock screen enabled.', '🔒', 3500);
          renderSecurity();
        });
      } else {
        main.querySelector('#stg-lock-now')?.addEventListener('click', () => {
          K.notify('Security', 'Locking…', '🔒', 1000);
          setTimeout(() => LS.lock(), 500);
        });

        main.querySelector('#stg-change-pw')?.addEventListener('click', () => {
          main.querySelector('#stg-change-form').style.display = '';
          main.querySelector('#stg-cur-pw')?.focus();
        });

        main.querySelector('#stg-cancel-change')?.addEventListener('click', () => {
          main.querySelector('#stg-change-form').style.display = 'none';
        });

        main.querySelector('#stg-do-change')?.addEventListener('click', () => {
          clearErr('stg-chg-err');
          const cur = main.querySelector('#stg-cur-pw').value;
          const pw  = main.querySelector('#stg-new-pw2').value;
          const pw2 = main.querySelector('#stg-confirm-pw2').value;
          if (!LS.verify(cur)) { showErr('stg-chg-err','Incorrect current password.'); return; }
          if (!pw||pw.length<4){ showErr('stg-chg-err','Min 4 characters.'); return; }
          if (pw!==pw2)         { showErr('stg-chg-err','Passwords do not match.'); return; }
          LS.setPassword(pw);
          K.notify('Security', 'Password updated.', '✅', 3000);
          main.querySelector('#stg-change-form').style.display = 'none';
          renderSecurity();
        });

        main.querySelector('#stg-remove-pw')?.addEventListener('click', () => {
          if (!confirm('Remove password protection?')) return;
          const cur = prompt('Enter current password to confirm removal:');
          if (cur === null) return;
          if (!LS.verify(cur)) { K.notify('Security', 'Incorrect password.', '❌', 3000); return; }
          LS.removePassword();
          K.notify('Security', 'Password removed. Lock screen disabled.', '🔓', 3500);
          renderSecurity();
        });
      }
    }

    // ── About ──────────────────────────────────────────────
    function renderAbout() {
      const installed = global.NovaOS.Kernel.StorageSim.getInstalled().length;
      main.innerHTML = `
        <div class="settings-section-title">About Nova OS</div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:16px;padding:24px;text-align:center">
          <div style="font-size:56px;filter:drop-shadow(0 0 20px rgba(129,140,248,0.6))">⬡</div>
          <div style="font-size:26px;font-weight:300;letter-spacing:.12em;color:var(--nova-text);text-transform:uppercase">Nova OS</div>
          <div style="font-size:11px;color:var(--nova-accent-3);font-family:var(--font-mono)">Version 5.0.0 — Premium Edition</div>
          <div class="panel" style="text-align:left;max-width:360px;font-size:13px;line-height:1.7;color:var(--nova-text-2)">
            A production-grade, modular browser OS. Features a real kernel, window manager, process manager, PWA support, lock screen, and ${installed + 14}+ applications.
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%;max-width:360px">
            ${[
              ['Kernel','v2.0'],['Window Manager','Drag + Resize'],
              ['Storage','256 GB'],['Apps',`${installed + 14} installed`],
              ['Lock Screen', global.NovaOS.LockScreen?.hasPassword() ? '🔒 Active' : '🔓 Off'],
              ['PWA','Installable']
            ].map(([k,v])=>`
              <div class="panel" style="text-align:center">
                <div style="font-size:10px;color:var(--nova-text-3);text-transform:uppercase;letter-spacing:.06em">${k}</div>
                <div style="font-size:13px;font-weight:600;margin-top:4px;color:var(--nova-text)">${v}</div>
              </div>`).join('')}
          </div>
        </div>`;
    }

    renderSection();
  }

  function _esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  global.NovaOS.AppLoader.register({
    id: 'settings', title: 'Settings', width: 700, height: 540,
    mount
  });
})(window);
