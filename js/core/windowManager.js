/**
 * LunaOS WindowManager v2 — Draggable, resizable, animated windows.
 * Exposed _windows map for AppLoader pid wiring.
 */
'use strict';

(function (global) {
  let _zCounter  = 100;
  let _windowCount = 0;
  const _windows = new Map(); // windowId → { el, pid, appId, minimized, maximized }

  const WM = {
    // Expose for AppLoader pid wiring
    _windows,

    create(opts = {}) {
      const {
        appId,
        title  = 'Untitled',
        width  = 680,
        height = 480,
        pid
      } = opts;

      const windowId = `win-${++_windowCount}`;
      const template = document.getElementById('window-template');
      const clone    = template.content.cloneNode(true);
      const el       = clone.querySelector('.os-window');

      el.dataset.windowId = windowId;
      el.dataset.appId    = appId;
      el.querySelector('.window-title').textContent = title;

      // Position with cascade
      const layer = document.getElementById('window-layer');
      const layerW = layer.offsetWidth  || window.innerWidth;
      const layerH = layer.offsetHeight || window.innerHeight - 116;
      const offset = ((_windowCount - 1) % 8) * 26;
      const posX = Math.max(10, Math.min(80 + offset, layerW - width  - 40));
      const posY = Math.max(10, Math.min(60 + offset, layerH - height - 40));

      el.style.width  = Math.min(width,  layerW - 20) + 'px';
      el.style.height = Math.min(height, layerH - 20) + 'px';
      el.style.left   = posX + 'px';
      el.style.top    = posY + 'px';

      _windows.set(windowId, { el, pid: pid || null, appId, minimized: false, maximized: false, _prevGeom: null });

      // Titlebar buttons
      el.querySelector('.wc-close').addEventListener('click', e => { e.stopPropagation(); this.close(windowId); });
      el.querySelector('.wc-min').addEventListener('click',   e => { e.stopPropagation(); this.minimize(windowId); });
      el.querySelector('.wc-max').addEventListener('click',   e => { e.stopPropagation(); this.toggleMaximize(windowId); });

      // Focus on any mousedown inside window
      el.addEventListener('mousedown', () => this.focus(windowId), true);

      // Drag + double-click maximize on titlebar
      const titlebar = el.querySelector('.window-titlebar');
      _attachDrag(el, titlebar, windowId);
      titlebar.addEventListener('dblclick', e => {
        if (e.target.classList.contains('wc-btn')) return;
        this.toggleMaximize(windowId);
      });

      // Resize
      _attachResize(el, el.querySelector('.window-resize-handle'));

      layer.appendChild(el);

      // Enter animation
      requestAnimationFrame(() => {
        el.classList.add('entering');
        el.addEventListener('animationend', () => el.classList.remove('entering'), { once: true });
      });

      this.focus(windowId);
      global.NovaOS.EventBus.emit('window:created', { windowId, appId });
      return windowId;
    },

    focus(windowId) {
      _windows.forEach((w, id) => w.el.classList.toggle('focused', id === windowId));
      const w = _windows.get(windowId);
      if (w) w.el.style.zIndex = ++_zCounter;
    },

    close(windowId) {
      const w = _windows.get(windowId);
      if (!w) return;

      w.el.classList.add('closing');
      w.el.addEventListener('animationend', () => {
        w.el.remove();
        if (w.pid != null) global.NovaOS.ProcessManager.kill(w.pid);
        _windows.delete(windowId);
        global.NovaOS.EventBus.emit('window:closed', { windowId, appId: w.appId });
        _syncDockDot(w.appId);
      }, { once: true });
    },

    minimize(windowId) {
      const w = _windows.get(windowId);
      if (!w || w.minimized) return;
      w.minimized = true;
      w.el.classList.add('minimizing');
      w.el.addEventListener('animationend', () => {
        w.el.style.display = 'none';
        w.el.classList.remove('minimizing');
      }, { once: true });
    },

    restore(windowId) {
      const w = _windows.get(windowId);
      if (!w) return;
      if (w.minimized) {
        w.minimized = false;
        w.el.style.display = '';
        w.el.classList.add('entering');
        w.el.addEventListener('animationend', () => w.el.classList.remove('entering'), { once: true });
      }
      this.focus(windowId);
    },

    toggleMaximize(windowId) {
      const w = _windows.get(windowId);
      if (!w) return;
      if (w.maximized) {
        w.maximized = false;
        w.el.classList.remove('maximized');
        if (w._prevGeom) {
          const g = w._prevGeom;
          Object.assign(w.el.style, { left: g.left, top: g.top, width: g.width, height: g.height });
        }
      } else {
        w._prevGeom = { left: w.el.style.left, top: w.el.style.top, width: w.el.style.width, height: w.el.style.height };
        w.maximized = true;
        w.el.classList.add('maximized');
      }
    },

    getBody(windowId) {
      return _windows.get(windowId)?.el.querySelector('.window-body') || null;
    },

    getByApp(appId) {
      for (const [id, w] of _windows) {
        if (w.appId === appId) return { windowId: id, ...w };
      }
      return null;
    },

    toggleFromDock(appId) {
      const entry = this.getByApp(appId);
      if (!entry) return false;
      const w = _windows.get(entry.windowId);
      if (!w) return false;
      if (w.minimized) this.restore(entry.windowId);
      else if (w.el.classList.contains('focused')) this.minimize(entry.windowId);
      else this.focus(entry.windowId);
      return true;
    }
  };

  // ── Drag ─────────────────────────────────────────────────
  function _attachDrag(el, handle, windowId) {
    let dragging = false, sx, sy, sl, st;

    handle.addEventListener('mousedown', e => {
      if (e.target.classList.contains('wc-btn')) return;
      const w = _windows.get(windowId);
      if (w?.maximized) return;
      dragging = true;
      sx = e.clientX; sy = e.clientY;
      sl = parseInt(el.style.left) || 0;
      st = parseInt(el.style.top)  || 0;
      el.classList.add('dragging');
      e.preventDefault();
    });

    const onMove = e => {
      if (!dragging) return;
      const layer  = document.getElementById('window-layer');
      const maxL   = (layer?.offsetWidth  || window.innerWidth)  - el.offsetWidth;
      const maxT   = (layer?.offsetHeight || window.innerHeight)  - el.offsetHeight;
      el.style.left = Math.max(0, Math.min(maxL, sl + e.clientX - sx)) + 'px';
      el.style.top  = Math.max(0, Math.min(maxT, st + e.clientY - sy)) + 'px';
    };

    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      el.classList.remove('dragging');
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  }

  // ── Resize ────────────────────────────────────────────────
  function _attachResize(el, handle) {
    let resizing = false, sx, sy, sw, sh;

    handle.addEventListener('mousedown', e => {
      resizing = true;
      sx = e.clientX; sy = e.clientY;
      sw = el.offsetWidth; sh = el.offsetHeight;
      el.classList.add('resizing');
      e.preventDefault(); e.stopPropagation();
    });

    document.addEventListener('mousemove', e => {
      if (!resizing) return;
      el.style.width  = Math.max(280, sw + e.clientX - sx) + 'px';
      el.style.height = Math.max(200, sh + e.clientY - sy) + 'px';
    });

    document.addEventListener('mouseup', () => {
      if (!resizing) return;
      resizing = false;
      el.classList.remove('resizing');
    });
  }

  // ── Dock indicator sync ───────────────────────────────────
  function _syncDockDot(appId) {
    const dot = document.querySelector(`.dock-app[data-app="${appId}"]`);
    if (!dot) return;
    dot.classList.toggle('running', global.NovaOS.ProcessManager.isRunning(appId));
  }

  // Wire process events → dock dots
  setTimeout(() => {
    global.NovaOS.EventBus.on('process:spawned', ({ appId }) => {
      document.querySelector(`.dock-app[data-app="${appId}"]`)?.classList.add('running');
    });
    global.NovaOS.EventBus.on('process:killed', ({ appId }) => {
      _syncDockDot(appId);
    });
  }, 0);

  global.NovaOS = global.NovaOS || {};
  global.NovaOS.WindowManager = WM;
})(window);
