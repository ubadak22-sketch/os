/**
 * Nova OS Boot — Animated startup sequence.
 * Initializes all subsystems, loads installed apps, reveals desktop.
 */
'use strict';

(function (global) {
  const STEPS = [
    { label: 'Initializing kernel...',         pct: 10 },
    { label: 'Loading memory subsystem...',    pct: 22 },
    { label: 'Starting storage driver...',     pct: 35 },
    { label: 'Starting process manager...',    pct: 48 },
    { label: 'Starting window manager...',     pct: 60 },
    { label: 'Registering applications...',    pct: 74 },
    { label: 'Loading desktop services...',    pct: 88 },
    { label: 'Welcome to Nova OS.',            pct: 100 },
  ];

  const Boot = {
    async start() {
      const bar    = document.querySelector('.boot-bar');
      const status = document.querySelector('.boot-status');

      const setStep = step => new Promise(resolve => {
        if (bar)    bar.style.width = step.pct + '%';
        if (status) status.textContent = step.label;
        setTimeout(resolve, 180 + Math.random() * 100);
      });

      try {
        for (const step of STEPS) await setStep(step);

        // Boot kernel (chains all subsystems)
        global.NovaOS.Kernel.init();

        // Apply saved wallpaper
        _applyWallpaper(global.NovaOS.Kernel.state.wallpaper || 'default');

        await new Promise(r => setTimeout(r, 350));

        const bootScreen = document.getElementById('boot-screen');
        bootScreen.classList.add('fade-out');

        bootScreen.addEventListener('transitionend', () => {
          bootScreen.classList.add('hidden');
          document.getElementById('desktop').classList.remove('hidden');
          global.NovaOS.EventBus.emit('desktop:ready');
          global.NovaOS.Kernel.notify('Nova OS', 'System ready. Welcome!', '&#11041;', 3000);
        }, { once: true });

      } catch (err) {
        console.error('[Boot] Fatal error:', err);
        if (status) status.textContent = 'Boot failed: ' + err.message;
      }
    }
  };

  function _applyWallpaper(id) {
    const el = document.getElementById('wallpaper');
    if (!el) return;
    const map = {
      default:  'radial-gradient(ellipse 80% 60% at 20% 80%,rgba(194,123,62,.13),transparent 60%),radial-gradient(ellipse 60% 50% at 80% 20%,rgba(58,110,165,.09),transparent 55%),linear-gradient(145deg,#f0ede8,#e8dfd0)',
      ocean:    'linear-gradient(135deg,#1a4f7a,#2d8fb5,#7ec8d8)',
      forest:   'linear-gradient(135deg,#1a3320,#2d6640,#7db87a)',
      sunset:   'linear-gradient(135deg,#7b2d8b,#e05c2f,#f0a040)',
      midnight: 'linear-gradient(135deg,#0d0d1a,#1a1a3a,#2a2a5a)',
      rose:     'linear-gradient(135deg,#7a2040,#c85580,#e8a0b0)',
      sand:     'linear-gradient(135deg,#c8a060,#e8d080,#f8f0c0)',
      slate:    'linear-gradient(135deg,#3a4050,#5a6070,#8a9090)',
    };
    el.style.background = map[id] || map.default;
  }

  global.NovaOS = global.NovaOS || {};
  global.NovaOS.Boot = Boot;
  global.NovaOS.applyWallpaper = _applyWallpaper;
})(window);
