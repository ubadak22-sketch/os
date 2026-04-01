/**
 * Nova OS — Security App
 * Password management: set, change, remove, lock now.
 * Installed via App Store; also surfaced in Settings > Security.
 */
'use strict';

(function (global) {
  function mount(container) {
    render();

    function render() {
      const LS = global.NovaOS.LockScreen;
      const hasPass = LS.hasPassword();

      container.innerHTML = `
        <div class="security-app">
          <!-- Header -->
          <div class="security-header">
            <div class="security-hero-icon">🔒</div>
            <div>
              <div class="security-title">Security</div>
              <div class="security-subtitle">
                ${hasPass
                  ? '<span class="sec-badge sec-badge--on">🟢 Password protected</span>'
                  : '<span class="sec-badge sec-badge--off">🔴 No password set</span>'}
              </div>
            </div>
          </div>

          <!-- Content -->
          <div class="security-body" id="sec-body">
            ${hasPass ? renderChangeUI() : renderSetUI()}
          </div>
        </div>`;

      _wireEvents(container, hasPass);
    }

    function renderSetUI() {
      return `
        <div class="sec-section">
          <div class="sec-section-title">Set Password</div>
          <div class="sec-desc">Protect your Nova OS with a password. You'll be asked to enter it on startup.</div>
          <div class="sec-form">
            <div class="form-row">
              <div class="form-label">New Password</div>
              <input class="input" id="sec-new-pw" type="password" placeholder="Enter password" maxlength="32" />
            </div>
            <div class="form-row">
              <div class="form-label">Confirm Password</div>
              <input class="input" id="sec-confirm-pw" type="password" placeholder="Confirm password" maxlength="32" />
            </div>
            <div class="sec-error" id="sec-err"></div>
            <div style="display:flex;gap:10px;margin-top:4px">
              <button class="btn btn-primary" id="sec-set-btn">🔒 Set Password</button>
            </div>
          </div>
        </div>`;
    }

    function renderChangeUI() {
      return `
        <div class="sec-section">
          <div class="sec-section-title">Change Password</div>
          <div class="sec-form">
            <div class="form-row">
              <div class="form-label">Current Password</div>
              <input class="input" id="sec-cur-pw" type="password" placeholder="Enter current password" maxlength="32" />
            </div>
            <div class="form-row">
              <div class="form-label">New Password</div>
              <input class="input" id="sec-new-pw" type="password" placeholder="New password" maxlength="32" />
            </div>
            <div class="form-row">
              <div class="form-label">Confirm New Password</div>
              <input class="input" id="sec-confirm-pw" type="password" placeholder="Confirm new password" maxlength="32" />
            </div>
            <div class="sec-error" id="sec-err"></div>
            <div style="display:flex;gap:10px;margin-top:4px">
              <button class="btn btn-primary" id="sec-change-btn">✅ Update Password</button>
            </div>
          </div>
        </div>

        <div class="sec-section" style="margin-top:16px">
          <div class="sec-section-title">Lock & Remove</div>
          <div class="sec-actions">
            <button class="btn btn-ghost sec-action-btn" id="sec-lock-btn">
              <span style="font-size:18px">🔒</span>
              <div>
                <div style="font-weight:600;font-size:13px">Lock Now</div>
                <div style="font-size:11px;color:var(--nova-text-3)">Lock screen immediately</div>
              </div>
            </button>
            <button class="btn btn-danger sec-action-btn" id="sec-remove-btn">
              <span style="font-size:18px">🗑</span>
              <div>
                <div style="font-weight:600;font-size:13px">Remove Password</div>
                <div style="font-size:11px;color:var(--nova-red);opacity:.8">Disables lock screen</div>
              </div>
            </button>
          </div>
        </div>`;
    }

    function _wireEvents(container, hasPass) {
      const LS  = global.NovaOS.LockScreen;
      const K   = global.NovaOS.Kernel;
      const err = () => container.querySelector('#sec-err');
      const showErr = (msg) => {
        const e = err(); if (e) { e.textContent = msg; e.classList.add('show'); }
      };
      const clearErr = () => { const e = err(); if (e) { e.textContent=''; e.classList.remove('show'); } };

      if (!hasPass) {
        // Set password
        container.querySelector('#sec-set-btn')?.addEventListener('click', () => {
          clearErr();
          const pw  = container.querySelector('#sec-new-pw').value;
          const pw2 = container.querySelector('#sec-confirm-pw').value;
          if (!pw)        { showErr('Password cannot be empty.'); return; }
          if (pw.length < 4) { showErr('Password must be at least 4 characters.'); return; }
          if (pw !== pw2) { showErr('Passwords do not match.'); return; }
          LS.setPassword(pw);
          K.notify('Security', 'Password set. Lock screen enabled.', '🔒', 3500);
          render();
        });
      } else {
        // Change password
        container.querySelector('#sec-change-btn')?.addEventListener('click', () => {
          clearErr();
          const cur = container.querySelector('#sec-cur-pw').value;
          const pw  = container.querySelector('#sec-new-pw').value;
          const pw2 = container.querySelector('#sec-confirm-pw').value;
          if (!LS.verify(cur)) { showErr('Current password is incorrect.'); return; }
          if (!pw)             { showErr('New password cannot be empty.'); return; }
          if (pw.length < 4)   { showErr('Password must be at least 4 characters.'); return; }
          if (pw !== pw2)      { showErr('New passwords do not match.'); return; }
          LS.setPassword(pw);
          K.notify('Security', 'Password updated successfully.', '✅', 3500);
          render();
        });

        // Lock now
        container.querySelector('#sec-lock-btn')?.addEventListener('click', () => {
          K.notify('Security', 'Locking screen…', '🔒', 1000);
          setTimeout(() => LS.lock(), 600);
        });

        // Remove password
        container.querySelector('#sec-remove-btn')?.addEventListener('click', () => {
          if (!confirm('Remove password? Lock screen will be disabled.')) return;
          const cur = prompt('Enter current password to confirm:');
          if (cur === null) return;
          if (!LS.verify(cur)) { K.notify('Security', 'Incorrect password.', '❌', 3000); return; }
          LS.removePassword();
          K.notify('Security', 'Password removed. Lock screen disabled.', '🔓', 3500);
          render();
        });
      }
    }
  }

  global.NovaOS.AppLoader.register({
    id: 'security', title: 'Security', width: 520, height: 500,
    mount
  });
})(window);
