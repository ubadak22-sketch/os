/**
 * Nova OS — Sound System
 * Lightweight Web Audio API sounds. Optional, zero-deps, zero-lag.
 * All sounds are synthesised — no file downloads needed.
 */
'use strict';

(function (global) {
  let _ctx = null;
  let _enabled = true;

  // Lazy-init AudioContext on first user interaction (browser policy)
  function _getCtx() {
    if (!_ctx) {
      try { _ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch { return null; }
    }
    if (_ctx.state === 'suspended') _ctx.resume().catch(() => {});
    return _ctx;
  }

  function _play(type, opts = {}) {
    if (!_enabled) return;
    const ctx = _getCtx();
    if (!ctx) return;

    const {
      freq = 440, freq2 = null,
      duration = 0.12, gain = 0.18,
      wave = 'sine', ramp = 'exp'
    } = opts;

    try {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.type = wave;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      if (freq2) osc.frequency.exponentialRampToValueAtTime(freq2, ctx.currentTime + duration);

      gainNode.gain.setValueAtTime(gain, ctx.currentTime);
      if (ramp === 'exp') {
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      } else {
        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
      }

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration + 0.02);
    } catch (e) { /* silent fail */ }
  }

  const SoundSystem = {
    /** Enable/disable all sounds */
    setEnabled(v) { _enabled = !!v; },
    isEnabled() { return _enabled; },

    /** Soft UI click */
    click() {
      _play('click', { freq: 800, freq2: 600, duration: 0.08, gain: 0.12, wave: 'sine' });
    },

    /** Window open pop */
    windowOpen() {
      _play('open', { freq: 520, freq2: 820, duration: 0.18, gain: 0.15, wave: 'sine' });
    },

    /** Window close */
    windowClose() {
      _play('close', { freq: 520, freq2: 280, duration: 0.15, gain: 0.12, wave: 'sine' });
    },

    /** App install complete — two-tone success */
    installComplete() {
      setTimeout(() => _play('i1', { freq: 660, duration: 0.12, gain: 0.14, wave: 'sine' }), 0);
      setTimeout(() => _play('i2', { freq: 880, duration: 0.16, gain: 0.14, wave: 'sine' }), 100);
    },

    /** Error / wrong password */
    error() {
      _play('err', { freq: 220, freq2: 180, duration: 0.20, gain: 0.14, wave: 'square', ramp: 'lin' });
    },

    /** Notification pop */
    notify() {
      setTimeout(() => _play('n1', { freq: 760, duration: 0.09, gain: 0.12, wave: 'sine' }), 0);
      setTimeout(() => _play('n2', { freq: 960, duration: 0.09, gain: 0.10, wave: 'sine' }), 80);
    },

    /** Lock screen */
    lock() {
      _play('lock', { freq: 400, freq2: 280, duration: 0.22, gain: 0.13, wave: 'sine' });
    }
  };

  // Unlock AudioContext on first touch/click
  const _unlock = () => { _getCtx(); document.removeEventListener('click', _unlock); document.removeEventListener('touchend', _unlock); };
  document.addEventListener('click', _unlock, { once: true });
  document.addEventListener('touchend', _unlock, { once: true });

  global.NovaOS = global.NovaOS || {};
  global.NovaOS.SoundSystem = SoundSystem;
})(window);
