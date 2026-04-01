/**
 * Nova OS — Gesture System (Mobile / Compact Mode Only)
 * Touch gestures on the desktop layer.
 * Does NOT affect desktop mouse interactions.
 */
'use strict';

(function (global) {
  const SWIPE_THRESHOLD  = 60;   // px minimum swipe distance
  const SWIPE_MAX_ANGLE  = 35;   // degrees from axis — keeps it intentional
  const EDGE_ZONE        = 28;   // px from screen edge for edge swipes

  let _enabled = false;
  let _tx = 0, _ty = 0, _tTime = 0;

  function _isMobile() {
    return window.innerWidth <= 768 || document.body.classList.contains('compact-mode');
  }

  function _init() {
    const layer = document.getElementById('window-layer');
    const desktop = document.getElementById('desktop');
    if (!desktop) return;

    desktop.addEventListener('touchstart', _onStart, { passive: true });
    desktop.addEventListener('touchend',   _onEnd,   { passive: true });
  }

  function _onStart(e) {
    if (!_isMobile()) return;
    const t = e.changedTouches[0];
    _tx = t.clientX; _ty = t.clientY; _tTime = Date.now();
  }

  function _onEnd(e) {
    if (!_isMobile()) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - _tx;
    const dy = t.clientY - _ty;
    const dt = Date.now() - _tTime;
    const dist = Math.hypot(dx, dy);

    // Must be fast enough and long enough
    if (dist < SWIPE_THRESHOLD || dt > 600) return;

    const angleX = Math.abs(Math.atan2(dy, dx) * 180 / Math.PI);
    const angleY = Math.abs(Math.atan2(dx, dy) * 180 / Math.PI);

    // Determine dominant direction
    if (Math.abs(dy) > Math.abs(dx) && angleY < SWIPE_MAX_ANGLE) {
      if (dy < 0) _onSwipeUp();
      else        _onSwipeDown();
    } else if (Math.abs(dx) > Math.abs(dy) && angleX < SWIPE_MAX_ANGLE) {
      if (dx > 0) _onSwipeRight();
      else        _onSwipeLeft();
    }
  }

  function _onSwipeUp() {
    // Open app switcher (Task Manager)
    global.NovaOS.SoundSystem?.click();
    global.NovaOS.AppLoader?.launch('taskManager');
  }

  function _onSwipeDown() {
    // Minimize the topmost focused window
    const WM = global.NovaOS.WindowManager;
    if (!WM) return;
    // Find focused window
    const focusedEl = document.querySelector('.os-window.focused');
    if (!focusedEl) return;
    const windowId = focusedEl.dataset.windowId;
    if (windowId) {
      global.NovaOS.SoundSystem?.click();
      WM.minimize(windowId);
    }
  }

  function _onSwipeLeft() {
    // Focus next window
    _cycleWindows(1);
  }

  function _onSwipeRight() {
    // Focus previous window
    _cycleWindows(-1);
  }

  function _cycleWindows(dir) {
    const WM = global.NovaOS.WindowManager;
    if (!WM) return;
    const all = Array.from(document.querySelectorAll('.os-window:not([style*="display: none"])'));
    if (all.length < 2) return;
    const focusedIdx = all.findIndex(el => el.classList.contains('focused'));
    const nextIdx = ((focusedIdx + dir) + all.length) % all.length;
    const nextId = all[nextIdx]?.dataset.windowId;
    if (nextId) {
      global.NovaOS.SoundSystem?.click();
      WM.focus(nextId);
      // On mobile, restore if minimized
      const entry = WM._windows?.get(nextId);
      if (entry?.minimized) WM.restore(nextId);
    }
  }

  // App switcher overlay
  function _showSwitcher() {
    document.getElementById('nova-app-switcher')?.remove();
    const WM = global.NovaOS.WindowManager;
    const windows = WM ? Array.from(WM._windows?.values() || []).filter(w => !w.minimized) : [];

    if (!windows.length) {
      global.NovaOS.Kernel?.notify('Nova OS', 'No open apps', '📱', 1800);
      return;
    }

    const overlay = document.createElement('div');
    overlay.id = 'nova-app-switcher';
    overlay.innerHTML = `
      <div class="switcher-backdrop"></div>
      <div class="switcher-panel">
        <div class="switcher-title">Open Apps</div>
        <div class="switcher-list">
          ${windows.map(w => `
            <div class="switcher-item" data-wid="${w.el.dataset.windowId}">
              <div class="switcher-item-icon">${_appIcon(w.appId)}</div>
              <div class="switcher-item-name">${w.el.querySelector('.window-title')?.textContent || w.appId}</div>
              <button class="switcher-close" data-wid="${w.el.dataset.windowId}">✕</button>
            </div>
          `).join('')}
        </div>
        <div class="switcher-hint">Tap an app to switch · Swipe down to close</div>
      </div>`;

    document.body.appendChild(overlay);

    overlay.querySelectorAll('.switcher-item').forEach(item => {
      item.addEventListener('click', e => {
        if (e.target.classList.contains('switcher-close')) return;
        const wid = item.dataset.wid;
        WM.focus(wid);
        overlay.remove();
      });
    });
    overlay.querySelectorAll('.switcher-close').forEach(btn => {
      btn.addEventListener('click', () => {
        const wid = btn.dataset.wid;
        WM.close(wid);
        btn.closest('.switcher-item').remove();
        if (!overlay.querySelectorAll('.switcher-item').length) overlay.remove();
      });
    });
    overlay.querySelector('.switcher-backdrop').addEventListener('click', () => overlay.remove());
  }

  function _appIcon(appId) {
    const icons = {
      notes:'📝', clock:'🕐', calendar:'📅', editor:'💻', terminal:'⌨️',
      files:'📁', settings:'⚙️', weather:'🌤', music:'🎵', browser:'🌐',
      chess:'♟', breakout:'🎮', taskManager:'📊', playStore:'🏪',
      snake:'🐍', game2048:'🔢', tictactoe:'❌', security:'🔒',
      novablender:'⬡', chatApp:'💬', toolApp:'🔧', gameApp:'🎮'
    };
    return icons[appId] || '📦';
  }

  // Expose
  const GestureSystem = { init: _init };

  global.NovaOS = global.NovaOS || {};
  global.NovaOS.GestureSystem = GestureSystem;
})(window);
