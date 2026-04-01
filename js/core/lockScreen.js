/**
 * Nova OS — Lock Screen
 * Fullscreen lock UI with PIN/password unlock.
 * Shows on startup if password is set. Smooth dark-glass theme.
 */
'use strict';

(function (global) {
  const PASS_KEY = 'nova_security.password';

  const LockScreen = {
    _el: null,
    _active: false,

    /** True if a password is currently set */
    hasPassword() {
      try { return !!localStorage.getItem(PASS_KEY); }
      catch { return false; }
    },

    /** Save password (plain-text for demo; in prod use hashed) */
    setPassword(pw) {
      try {
        if (!pw) { localStorage.removeItem(PASS_KEY); }
        else      { localStorage.setItem(PASS_KEY, btoa(pw)); }
        return true;
      } catch { return false; }
    },

    /** Verify password */
    verify(pw) {
      try {
        const stored = localStorage.getItem(PASS_KEY);
        if (!stored) return true; // no password set — always pass
        return stored === btoa(pw);
      } catch { return false; }
    },

    /** Remove password */
    removePassword() {
      try { localStorage.removeItem(PASS_KEY); return true; }
      catch { return false; }
    },

    /** Show the lock screen */
    lock() {
      if (this._active) return;
      this._active = true;
      global.NovaOS.SoundSystem?.lock();
      this._render();
    },

    /** Unlock — called after successful verification */
    unlock() {
      if (!this._el) return;
      this._el.classList.add('lock-fade-out');
      this._el.addEventListener('animationend', () => {
        this._el?.remove();
        this._el = null;
        this._active = false;
        global.NovaOS.EventBus?.emit('lockscreen:unlocked');
      }, { once: true });
    },

    _render() {
      // Remove existing if any
      document.getElementById('nova-lockscreen')?.remove();

      const now  = new Date();
      const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const date = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
      const user = global.NovaOS?.Kernel?.state?.userName || 'User';

      const el = document.createElement('div');
      el.id = 'nova-lockscreen';
      el.innerHTML = `
        <div class="ls-bg"></div>

        <!-- Clock -->
        <div class="ls-clock-wrap">
          <div class="ls-time" id="ls-time">${time}</div>
          <div class="ls-date" id="ls-date">${date}</div>
        </div>

        <!-- Unlock panel -->
        <div class="ls-panel">
          <div class="ls-avatar">
            <div class="ls-avatar-ring">
              <span style="font-size:32px">👤</span>
            </div>
          </div>
          <div class="ls-username">${_esc(user)}</div>

          <div class="ls-input-wrap">
            <input
              id="ls-input"
              type="password"
              class="ls-input"
              placeholder="Enter password"
              autocomplete="current-password"
              maxlength="32"
            />
            <button class="ls-submit" id="ls-submit" title="Unlock">
              <span style="font-size:18px">➜</span>
            </button>
          </div>
          <div class="ls-error" id="ls-error"></div>
          <div class="ls-hint">Press Enter or click ➜ to unlock</div>
        </div>
      `;

      document.body.appendChild(el);
      this._el = el;

      // Wire events
      const input   = el.querySelector('#ls-input');
      const errEl   = el.querySelector('#ls-error');
      const submitBtn = el.querySelector('#ls-submit');

      const attempt = () => {
        const pw = input.value;
        if (this.verify(pw)) {
          errEl.textContent = '';
          errEl.classList.remove('show');
          this.unlock();
        } else {
          input.value = '';
          errEl.textContent = 'Incorrect password. Try again.';
          errEl.classList.add('show');
          global.NovaOS.SoundSystem?.error();
          el.classList.add('ls-shake');
          el.addEventListener('animationend', () => el.classList.remove('ls-shake'), { once: true });
          input.focus();
        }
      };

      input.addEventListener('keydown', e => { if (e.key === 'Enter') attempt(); });
      submitBtn.addEventListener('click', attempt);

      // Tick the lock screen clock
      const tick = setInterval(() => {
        if (!document.getElementById('nova-lockscreen')) { clearInterval(tick); return; }
        const n = new Date();
        const t = el.querySelector('#ls-time');
        const d = el.querySelector('#ls-date');
        if (t) t.textContent = n.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
        if (d) d.textContent = n.toLocaleDateString([], { weekday:'long', month:'long', day:'numeric' });
      }, 10000);

      // Focus after entrance animation
      setTimeout(() => input?.focus(), 500);
    }
  };

  function _esc(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  global.NovaOS = global.NovaOS || {};
  global.NovaOS.LockScreen = LockScreen;
})(window);
