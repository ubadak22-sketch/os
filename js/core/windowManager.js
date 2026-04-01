/**
 * Nova OS — WindowManager v3
 * Window snapping, smooth drag/resize, sound integration, touch drag.
 */
'use strict';

(function (global) {
  let _zCounter    = 100;
  let _windowCount = 0;
  const _windows   = new Map();

  // Snap zones (% of layer dimension)
  const SNAP = { edge: 8 }; // px from edge to trigger snap

  const WM = {
    _windows,

    create(opts = {}) {
      const { appId, title = 'Untitled', width = 680, height = 480 } = opts;

      const windowId = `win-${++_windowCount}`;
      const template = document.getElementById('window-template');
      const el       = template.content.cloneNode(true).querySelector('.os-window');

      el.dataset.windowId = windowId;
      el.dataset.appId    = appId;
      el.querySelector('.window-title').textContent = title;

      // Cascade position
      const layer  = document.getElementById('window-layer');
      const layerW = layer.offsetWidth  || window.innerWidth;
      const layerH = layer.offsetHeight || (window.innerHeight - 120);
      const offset = ((_windowCount - 1) % 8) * 26;
      const posX   = Math.max(10, Math.min(80 + offset, layerW - width  - 40));
      const posY   = Math.max(10, Math.min(40 + offset, layerH - height - 40));

      el.style.width  = Math.min(width,  layerW - 20) + 'px';
      el.style.height = Math.min(height, layerH - 20) + 'px';
      el.style.left   = posX + 'px';
      el.style.top    = posY + 'px';

      _windows.set(windowId, { el, pid: null, appId, minimized: false, maximized: false, snapped: null, _prevGeom: null });

      // Controls
      el.querySelector('.wc-close').addEventListener('click', e => { e.stopPropagation(); this.close(windowId); });
      el.querySelector('.wc-min'  ).addEventListener('click', e => { e.stopPropagation(); this.minimize(windowId); });
      el.querySelector('.wc-max'  ).addEventListener('click', e => { e.stopPropagation(); this.toggleMaximize(windowId); });

      // Focus on interaction
      el.addEventListener('mousedown',  () => this.focus(windowId), true);
      el.addEventListener('touchstart', () => this.focus(windowId), { passive: true, capture: true });

      // Drag (mouse + touch)
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

      global.NovaOS.SoundSystem?.windowOpen();
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
      global.NovaOS.SoundSystem?.windowClose();
      w.el.classList.add('closing');
      // Fallback in case animationend doesn't fire
      const cleanup = () => {
        w.el.remove();
        if (w.pid != null) global.NovaOS.ProcessManager.kill(w.pid);
        _windows.delete(windowId);
        global.NovaOS.EventBus.emit('window:closed', { windowId, appId: w.appId });
        _syncDockDot(w.appId);
      };
      w.el.addEventListener('animationend', cleanup, { once: true });
      setTimeout(cleanup, 400); // guaranteed fallback
    },

    minimize(windowId) {
      const w = _windows.get(windowId);
      if (!w || w.minimized) return;
      w.minimized = true;

      // Animate toward dock
      const dock = document.getElementById('dock');
      const dockRect = dock?.getBoundingClientRect();
      const winRect  = w.el.getBoundingClientRect();
      if (dockRect) {
        const tx = dockRect.left + dockRect.width / 2 - (winRect.left + winRect.width / 2);
        const ty = dockRect.top  - winRect.top;
        w.el.style.setProperty('--min-tx', tx + 'px');
        w.el.style.setProperty('--min-ty', ty + 'px');
      }

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
        global.NovaOS.SoundSystem?.windowOpen();
      }
      this.focus(windowId);
    },

    toggleMaximize(windowId) {
      const w = _windows.get(windowId);
      if (!w) return;
      // Clear snap first
      if (w.snapped) this.unsnap(windowId);

      if (w.maximized) {
        w.maximized = false;
        w.el.classList.remove('maximized');
        w.el.style.transition = 'left .22s var(--ease), top .22s var(--ease), width .22s var(--ease), height .22s var(--ease)';
        if (w._prevGeom) Object.assign(w.el.style, w._prevGeom);
        setTimeout(() => w.el.style.transition = '', 250);
      } else {
        w._prevGeom = { left: w.el.style.left, top: w.el.style.top, width: w.el.style.width, height: w.el.style.height };
        w.maximized = true;
        w.el.style.transition = 'left .22s var(--ease), top .22s var(--ease), width .22s var(--ease), height .22s var(--ease)';
        w.el.classList.add('maximized');
        setTimeout(() => w.el.style.transition = '', 250);
      }
    },

    /** Snap window to left or right half */
    snap(windowId, side) {
      const w = _windows.get(windowId);
      if (!w || w.maximized) return;
      const layer  = document.getElementById('window-layer');
      const lw = layer.offsetWidth;
      const lh = layer.offsetHeight;

      w._prevGeom = { left: w.el.style.left, top: w.el.style.top, width: w.el.style.width, height: w.el.style.height };
      w.snapped = side;

      w.el.style.transition = 'left .22s var(--ease), top .22s var(--ease), width .22s var(--ease), height .22s var(--ease)';
      w.el.style.top    = '0px';
      w.el.style.height = lh + 'px';
      w.el.style.width  = Math.round(lw / 2) + 'px';
      w.el.style.left   = side === 'left' ? '0px' : Math.round(lw / 2) + 'px';
      setTimeout(() => w.el.style.transition = '', 250);
    },

    unsnap(windowId) {
      const w = _windows.get(windowId);
      if (!w || !w.snapped) return;
      w.snapped = null;
      w.el.style.transition = 'left .2s var(--ease), top .2s var(--ease), width .2s var(--ease), height .2s var(--ease)';
      if (w._prevGeom) Object.assign(w.el.style, w._prevGeom);
      setTimeout(() => w.el.style.transition = '', 250);
    },

    getBody(windowId)  { return _windows.get(windowId)?.el.querySelector('.window-body') || null; },
    getByApp(appId)    {
      for (const [id, w] of _windows) { if (w.appId === appId) return { windowId: id, ...w }; }
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

  // ── Drag (mouse + touch) ──────────────────────────────────
  function _attachDrag(el, handle, windowId) {
    let dragging = false, sx, sy, sl, st;
    let snapIndicator = null;

    function startDrag(cx, cy) {
      const w = _windows.get(windowId);
      if (w?.maximized) return;
      if (w?.snapped) WM.unsnap(windowId);
      dragging = true;
      sx = cx; sy = cy;
      sl = parseInt(el.style.left) || 0;
      st = parseInt(el.style.top)  || 0;
      el.classList.add('dragging');
      el.style.willChange = 'left, top';
    }

    function moveDrag(cx, cy) {
      if (!dragging) return;
      const layer = document.getElementById('window-layer');
      const lw = layer?.offsetWidth  || window.innerWidth;
      const lh = layer?.offsetHeight || window.innerHeight;
      const newL = Math.max(0, Math.min(lw - el.offsetWidth,  sl + cx - sx));
      const newT = Math.max(0, Math.min(lh - el.offsetHeight, st + cy - sy));
      el.style.left = newL + 'px';
      el.style.top  = newT + 'px';

      // Snap indicators
      _updateSnapIndicator(newL, lw);
    }

    function endDrag(cx, cy) {
      if (!dragging) return;
      dragging = false;
      el.classList.remove('dragging');
      el.style.willChange = '';
      _removeSnapIndicator();

      // Check snap zones
      const layer = document.getElementById('window-layer');
      const lw = layer?.offsetWidth || window.innerWidth;
      const curL = parseInt(el.style.left) || 0;
      if (curL <= SNAP.edge) WM.snap(windowId, 'left');
      else if (curL >= lw - el.offsetWidth - SNAP.edge) WM.snap(windowId, 'right');
    }

    function _updateSnapIndicator(x, lw) {
      if (!snapIndicator) {
        snapIndicator = document.createElement('div');
        snapIndicator.className = 'snap-indicator';
        document.getElementById('window-layer')?.appendChild(snapIndicator);
      }
      if (x <= SNAP.edge) {
        snapIndicator.className = 'snap-indicator snap-left';
        snapIndicator.style.display = '';
      } else if (x >= lw - el.offsetWidth - SNAP.edge) {
        snapIndicator.className = 'snap-indicator snap-right';
        snapIndicator.style.display = '';
      } else {
        snapIndicator.style.display = 'none';
      }
    }
    function _removeSnapIndicator() {
      snapIndicator?.remove();
      snapIndicator = null;
    }

    // Mouse
    handle.addEventListener('mousedown', e => {
      if (e.target.classList.contains('wc-btn')) return;
      startDrag(e.clientX, e.clientY);
      e.preventDefault();
    });
    document.addEventListener('mousemove', e => moveDrag(e.clientX, e.clientY));
    document.addEventListener('mouseup',   e => endDrag(e.clientX, e.clientY));

    // Touch drag on titlebar
    handle.addEventListener('touchstart', e => {
      if (e.target.classList.contains('wc-btn')) return;
      const t = e.touches[0];
      startDrag(t.clientX, t.clientY);
    }, { passive: true });
    handle.addEventListener('touchmove', e => {
      const t = e.touches[0];
      moveDrag(t.clientX, t.clientY);
    }, { passive: true });
    handle.addEventListener('touchend', e => {
      const t = e.changedTouches[0];
      endDrag(t.clientX, t.clientY);
    }, { passive: true });
  }

  // ── Resize ────────────────────────────────────────────────
  function _attachResize(el, handle) {
    let resizing = false, sx, sy, sw, sh;

    handle.addEventListener('mousedown', e => {
      resizing = true;
      sx = e.clientX; sy = e.clientY;
      sw = el.offsetWidth; sh = el.offsetHeight;
      el.classList.add('resizing');
      el.style.willChange = 'width, height';
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
      el.style.willChange = '';
    });
  }

  // ── Dock dot sync ─────────────────────────────────────────
  function _syncDockDot(appId) {
    const dot = document.querySelector(`.dock-app[data-app="${appId}"]`);
    if (dot) dot.classList.toggle('running', global.NovaOS.ProcessManager.isRunning(appId));
  }

  setTimeout(() => {
    global.NovaOS.EventBus.on('process:spawned', ({ appId }) => {
      document.querySelector(`.dock-app[data-app="${appId}"]`)?.classList.add('running');
    });
    global.NovaOS.EventBus.on('process:killed', ({ appId }) => _syncDockDot(appId));
  }, 0);

  global.NovaOS = global.NovaOS || {};
  global.NovaOS.WindowManager = WM;
})(window);
