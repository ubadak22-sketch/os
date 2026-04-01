/**
 * Nova OS Boot v6 — Enhanced boot with animated messages and desktop fade.
 */
'use strict';

(function (global) {
  const STEPS = [
    { label: 'Initializing Nova Core…',        pct: 10 },
    { label: 'Loading memory subsystem…',       pct: 20 },
    { label: 'Mounting storage driver…',         pct: 32 },
    { label: 'Starting process manager…',        pct: 44 },
    { label: 'Starting window manager…',         pct: 56 },
    { label: 'Registering applications…',        pct: 68 },
    { label: 'Loading desktop services…',        pct: 80 },
    { label: 'Applying security policies…',      pct: 90 },
    { label: 'System ready.',                    pct: 100 },
  ];

  const Boot = {
    async start() {
      const bar    = document.querySelector('.boot-bar');
      const status = document.querySelector('.boot-status');

      // Smooth bar — never goes backwards
      let currentPct = 0;
      const setBar = pct => {
        currentPct = Math.max(currentPct, pct);
        if (bar) bar.style.width = currentPct + '%';
      };

      const setStep = step => new Promise(resolve => {
        setBar(step.pct);
        if (status) {
          status.classList.add('status-change');
          status.textContent = step.label;
          status.addEventListener('animationend', () => status.classList.remove('status-change'), { once: true });
        }
        setTimeout(resolve, 140 + Math.random() * 70);
      });

      try {
        for (const step of STEPS) await setStep(step);

        global.NovaOS.Kernel.init();
        _applyWallpaper(global.NovaOS.Kernel.state.wallpaper || 'default');
        global.NovaOS.GestureSystem?.init();

        // Wire sound to kernel notify
        const _origNotify = global.NovaOS.Kernel.notify.bind(global.NovaOS.Kernel);
        global.NovaOS.Kernel.notify = function(...args) {
          global.NovaOS.SoundSystem?.notify();
          return _origNotify(...args);
        };

        await new Promise(r => setTimeout(r, 380));
        _revealDesktop();

      } catch (err) {
        console.error('[Boot] Fatal:', err);
        if (status) status.textContent = 'Boot error: ' + err.message;
        setTimeout(_revealDesktop, 2500);
      }
    }
  };

  function _revealDesktop() {
    const bootScreen = document.getElementById('boot-screen');
    const desktop    = document.getElementById('desktop');
    if (!bootScreen || !desktop) return;

    bootScreen.classList.add('fade-out');

    let fired = false;
    const done = () => {
      if (fired) return;
      fired = true;
      bootScreen.classList.add('hidden');

      // Desktop fades in
      desktop.classList.remove('hidden');
      desktop.classList.add('desktop-fadein');
      desktop.addEventListener('animationend', () => desktop.classList.remove('desktop-fadein'), { once: true });

      global.NovaOS.EventBus.emit('desktop:ready');

      setTimeout(() => {
        if (global.NovaOS.LockScreen?.hasPassword()) {
          global.NovaOS.LockScreen.lock();
        } else {
          global.NovaOS.Kernel.notify('Nova OS', 'System ready.', '⬡', 2800);
        }
      }, 350);

      global.NovaOS.EventBus.once('lockscreen:unlocked', () => {
        global.NovaOS.Kernel.notify('Nova OS', 'Welcome back.', '⬡', 2500);
      });
    };

    bootScreen.addEventListener('transitionend', done, { once: true });
    setTimeout(done, 850);
  }

  function _applyWallpaper(id) {
    const el = document.getElementById('wallpaper');
    if (!el) return;
    const map = {
      midnight: 'radial-gradient(ellipse 70% 55% at 15% 85%,rgba(99,102,241,0.28) 0%,transparent 55%),radial-gradient(ellipse 60% 50% at 85% 15%,rgba(139,92,246,0.22) 0%,transparent 55%),linear-gradient(135deg,#0f0f1a 0%,#1a1a3e 50%,#0f1a2e 100%)',
      ocean:    'radial-gradient(ellipse 60% 50% at 20% 80%,rgba(59,130,246,0.25) 0%,transparent 55%),linear-gradient(135deg,#0a1628 0%,#0f2a4a 50%,#0a1e38 100%)',
      forest:   'radial-gradient(ellipse 60% 50% at 80% 20%,rgba(52,211,153,0.20) 0%,transparent 55%),linear-gradient(135deg,#071a0f 0%,#0f2e1a 50%,#071a0f 100%)',
      sunset:   'radial-gradient(ellipse 70% 50% at 50% 80%,rgba(251,191,36,0.20) 0%,transparent 55%),radial-gradient(ellipse 50% 40% at 20% 30%,rgba(244,114,182,0.18) 0%,transparent 45%),linear-gradient(135deg,#1a0a1e 0%,#2e1030 50%,#1a0a14 100%)',
      rose:     'radial-gradient(ellipse 60% 50% at 70% 30%,rgba(244,114,182,0.22) 0%,transparent 55%),linear-gradient(135deg,#1a0a14 0%,#2e0f20 50%,#1a0a18 100%)',
      slate:    'linear-gradient(135deg,#0a0a14 0%,#141428 50%,#0a0a20 100%)',
    };
    if (id !== 'default' && map[id]) el.style.background = map[id];
  }

  // Compact mode
  function _checkCompactMode() {
    document.body.classList.toggle('compact-mode', window.innerHeight < 500);
  }
  _checkCompactMode();
  window.addEventListener('resize', _checkCompactMode);

  // PWA deep-link
  setTimeout(() => {
    const launch = new URLSearchParams(window.location.search).get('launch');
    if (launch) global.NovaOS.EventBus.once('desktop:ready', () => setTimeout(() => global.NovaOS.AppLoader.launch(launch), 500));
  }, 0);

  global.NovaOS = global.NovaOS || {};
  global.NovaOS.Boot = Boot;
  global.NovaOS.applyWallpaper = _applyWallpaper;
})(window);
