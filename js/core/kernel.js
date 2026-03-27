/**
 * Nova OS Kernel — Central system controller.
 * RAM management, storage simulation, desktop widgets, notifications.
 */
'use strict';

(function (global) {
  let _initialized = false;

  // ── RAM subsystem ─────────────────────────────────────────
  const RAM = {
    total:    15000,
    reserved: 1500,
    used:     0,
    appLimits: {
      notes:       500,  clock:       150,  calendar:    300,
      editor:      600,  terminal:    400,  files:       400,
      settings:    200,  weather:     300,  music:       800,
      browser:     1500, chess:       500,  breakout:    600,
      taskManager: 300,  playStore:   400,
      gameApp:     800,  chatApp:     300,  toolApp:     200,
    },
    available() { return RAM.total - RAM.reserved - RAM.used; },
    allocate(appId) {
      const need = RAM.appLimits[appId] || 400;
      if (need > RAM.available()) return false;
      RAM.used += need;
      return true;
    },
    free(appId) {
      const need = RAM.appLimits[appId] || 400;
      RAM.used = Math.max(0, RAM.used - need);
    }
  };

  // ── Storage simulation ────────────────────────────────────
  // totalStorage in MB; usedStorage persisted in localStorage
  const STORAGE_KEY   = 'nova_sys.storage';
  const INSTALLED_KEY = 'nova_sys.installed';

  const StorageSim = {
    total: 1000, // MB
    get used() {
      try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || 0; }
      catch { return 0; }
    },
    set used(v) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(Math.max(0, v))); } catch {}
    },
    available() { return StorageSim.total - StorageSim.used; },
    consume(mb) {
      if (mb > StorageSim.available()) return false;
      StorageSim.used = StorageSim.used + mb;
      return true;
    },
    free(mb) {
      StorageSim.used = StorageSim.used - mb;
    },

    // Installed apps registry
    getInstalled() {
      try { return JSON.parse(localStorage.getItem(INSTALLED_KEY)) || []; }
      catch { return []; }
    },
    saveInstalled(list) {
      try { localStorage.setItem(INSTALLED_KEY, JSON.stringify(list)); } catch {}
    }
  };

  const Kernel = {
    version: '2.0.0',
    RAM,
    StorageSim,

    state: {
      wallpaper: 'default',
      userName:  'User',
    },

    init() {
      if (_initialized) return;
      _initialized = true;

      const saved = global.NovaOS.Storage.get('kernel.state', {});
      Object.assign(this.state, saved);

      _startClock();
      _bindDock();
      _bindDesktopIcons();
      _bindDesktopContext();
      _createNotifArea();
      _startWidgets();

      // Persist kernel state on change
      global.NovaOS.EventBus.on('kernel:state-change', () => {
        global.NovaOS.Storage.set('kernel.state', this.state);
      });

      // Free RAM when process dies
      global.NovaOS.EventBus.on('process:killed', ({ appId }) => {
        RAM.free(appId);
        _updateRamBar();
      });

      console.info(`[Kernel] Nova OS v${this.version} — ${RAM.available()} MB RAM free, ${StorageSim.available()} MB storage free`);
      global.NovaOS.EventBus.emit('kernel:ready');
    },

    setState(key, value) {
      this.state[key] = value;
      global.NovaOS.EventBus.emit('kernel:state-change', { key, value });
    },

    tryAllocRAM(appId) {
      if (!RAM.allocate(appId)) {
        this.notify('Out of Memory', `Not enough RAM to open "${appId}". Free: ${RAM.available()} MB`, '🔴');
        _updateRamBar();
        return false;
      }
      _updateRamBar();
      return true;
    },

    notify(title, message, icon = 'ℹ️', duration = 3500) {
      const area = document.getElementById('notification-area');
      if (!area) return;
      const notif = document.createElement('div');
      notif.className = 'notification';
      notif.innerHTML = `
        <div class="notif-icon">${icon}</div>
        <div class="notif-body">
          <div class="notif-title">${_esc(title)}</div>
          <div class="notif-msg">${_esc(message)}</div>
        </div>`;
      area.appendChild(notif);
      notif.addEventListener('click', () => notif.remove());
      setTimeout(() => {
        notif.style.transition = 'opacity .4s,transform .4s';
        notif.style.opacity = '0';
        notif.style.transform = 'translateX(30px)';
        notif.addEventListener('transitionend', () => notif.remove());
      }, duration);
    }
  };

  // ── Clock (topbar + widget) ───────────────────────────────
  function _startClock() {
    const tbClock = document.getElementById('tb-clock');
    const tbDate  = document.getElementById('tb-date');
    const dwTime  = document.getElementById('dw-time');
    const dwDate  = document.getElementById('dw-date');
    const dwTz    = document.getElementById('dw-tz');
    const tick = () => {
      const now = new Date();
      const t12  = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const tFull= now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const dShort = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
      const dLong  = now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      if (tbClock) tbClock.textContent = t12;
      if (tbDate)  tbDate.textContent  = dShort;
      if (dwTime)  dwTime.textContent  = tFull;
      if (dwDate)  dwDate.textContent  = dLong;
      if (dwTz)    dwTz.textContent    = Intl.DateTimeFormat().resolvedOptions().timeZone;
    };
    tick();
    setInterval(tick, 1000);
  }

  // ── System widgets ────────────────────────────────────────
  function _startWidgets() {
    _updateRamBar();
    _updateStorageBar();
    _startSystemWidget();
    _loadWeatherWidget();
  }

  function _updateRamBar() {
    const el  = document.getElementById('tb-ram-indicator');
    const pct = Math.round((RAM.used / (RAM.total - RAM.reserved)) * 100);
    if (el) {
      el.textContent = `RAM ${pct}%`;
      el.style.color = pct > 80 ? 'var(--luna-red)' : 'var(--luna-text-3)';
    }
  }

  function _updateStorageBar() {
    const bar = document.getElementById('dw-sto-bar');
    const val = document.getElementById('dw-sto-val');
    const pct = Math.round((StorageSim.used / StorageSim.total) * 100);
    if (bar) bar.style.width = pct + '%';
    if (val) val.textContent = pct + '%';
  }

  function _startSystemWidget() {
    let cpuBase = 8, gpuBase = 5;
    const update = () => {
      const cpu    = Math.min(99, Math.max(2, cpuBase + (Math.random() * 12 - 6)));
      const gpu    = Math.min(99, Math.max(2, gpuBase + (Math.random() * 8  - 4)));
      const ramPct = Math.round((RAM.used / (RAM.total - RAM.reserved)) * 100);
      cpuBase = Math.max(5,  Math.min(60, cpuBase + (Math.random() * 4 - 2)));
      gpuBase = Math.max(3,  Math.min(40, gpuBase + (Math.random() * 3 - 1.5)));

      _setBar('dw-cpu-bar','dw-cpu-val', cpu);
      _setBar('dw-ram-bar','dw-ram-val', ramPct);
      _setBar('dw-gpu-bar','dw-gpu-val', gpu);
      _updateStorageBar();
      _updateRamBar();
    };
    update();
    setInterval(update, 1800);
  }

  function _setBar(barId, valId, pct) {
    const b = document.getElementById(barId);
    const v = document.getElementById(valId);
    if (b) b.style.width = pct + '%';
    if (v) v.textContent = Math.round(pct) + '%';
  }

  async function _loadWeatherWidget() {
    const inner = document.getElementById('dw-wx-inner');
    if (!inner) return;
    try {
      const { lat, lon } = await global.NovaOS.WeatherService.getLocation();
      const data = await global.NovaOS.WeatherService.fetchByCoords(lat, lon);
      inner.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px">
          <div style="font-size:34px;line-height:1">${data.icon}</div>
          <div>
            <div style="font-size:24px;font-weight:300;font-family:var(--font-mono);line-height:1">${data.temperature}${data.unit}</div>
            <div style="font-size:11px;color:var(--luna-text-2);margin-top:2px">${data.condition}</div>
          </div>
        </div>
        <div style="font-size:10px;color:var(--luna-text-3);margin-top:8px">&#128205; ${data.timezone.replace(/_/g,' ')}</div>
        <div style="display:flex;gap:10px;margin-top:6px">
          <span style="font-size:10px;color:var(--luna-text-3)">&#128167; ${data.humidity}%</span>
          <span style="font-size:10px;color:var(--luna-text-3)">&#127788; ${data.windSpeed} km/h</span>
        </div>`;
    } catch {
      inner.innerHTML = `<div style="font-size:11px;color:var(--luna-text-3);text-align:center">Weather unavailable<br/>Allow location access</div>`;
    }
  }

  // ── Dock ──────────────────────────────────────────────────
  function _bindDock() {
    document.getElementById('dock-inner')?.addEventListener('click', e => {
      const item = e.target.closest('.dock-app');
      if (item?.dataset.app) global.NovaOS.AppLoader.launch(item.dataset.app);
    });
  }

  // ── Desktop icons ─────────────────────────────────────────
  function _bindDesktopIcons() {
    document.getElementById('desktop-icons')?.addEventListener('click', e => {
      const icon = e.target.closest('.desktop-icon');
      if (!icon?.dataset.app) return;
      icon.classList.add('di-tap');
      icon.addEventListener('animationend', () => icon.classList.remove('di-tap'), { once: true });
      global.NovaOS.AppLoader.launch(icon.dataset.app);
    });
    document.getElementById('tb-menu-apps')?.addEventListener('click', () => {
      global.NovaOS.AppLoader.launch('playStore');
    });
  }

  // ── Desktop right-click ───────────────────────────────────
  function _bindDesktopContext() {
    document.getElementById('desktop')?.addEventListener('contextmenu', e => {
      if (e.target.closest('.os-window,.dock,#topbar,#desktop-widgets')) return;
      e.preventDefault();
      _showContextMenu(e.clientX, e.clientY, [
        { label: '&#9881;&#65039; Settings',   action: () => global.NovaOS.AppLoader.launch('settings') },
        { label: '&#127780; Weather',          action: () => global.NovaOS.AppLoader.launch('weather') },
        { label: '&#128202; Task Manager',     action: () => global.NovaOS.AppLoader.launch('taskManager') },
        { sep: true },
        { label: '&#128247; Refresh Widgets',  action: _loadWeatherWidget },
        { label: '&#128260; Reload Desktop',   action: () => location.reload() },
      ]);
    });
    document.addEventListener('click', () => document.querySelectorAll('.context-menu').forEach(m => m.remove()));
  }

  function _showContextMenu(x, y, items) {
    document.querySelectorAll('.context-menu').forEach(m => m.remove());
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    items.forEach(item => {
      if (item.sep) { menu.appendChild(Object.assign(document.createElement('div'), { className: 'context-sep' })); return; }
      const el = document.createElement('div');
      el.className = 'context-item';
      el.innerHTML = item.label;
      el.addEventListener('click', () => { item.action?.(); menu.remove(); });
      menu.appendChild(el);
    });
    document.body.appendChild(menu);
    requestAnimationFrame(() => {
      const r = menu.getBoundingClientRect();
      if (x + r.width  > window.innerWidth)  x -= r.width;
      if (y + r.height > window.innerHeight)  y -= r.height;
      menu.style.left = Math.max(0, x) + 'px';
      menu.style.top  = Math.max(0, y) + 'px';
    });
  }

  function _createNotifArea() {
    if (document.getElementById('notification-area')) return;
    const a = document.createElement('div');
    a.id = 'notification-area';
    document.body.appendChild(a);
  }

  function _esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  global.NovaOS = global.NovaOS || {};
  global.NovaOS.Kernel = Kernel;
})(window);
