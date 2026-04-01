/**
 * LunaOS — HTML Editor App
 * Split-pane HTML/CSS/JS editor with live preview using srcdoc.
 */
'use strict';

(function (global) {
  const store = global.NovaOS.Storage.ns('editor');

  const STARTER = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    body {
      font-family: system-ui, sans-serif;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; margin: 0;
      background: linear-gradient(135deg, #f0ede8, #e8dfd0);
    }
    h1 { font-size: 2rem; color: #c27b3e; }
  </style>
</head>
<body>
  <h1>Hello, Nova OS! ✨</h1>
</body>
</html>`;

  function mount(container) {
    let code = store.get('code', STARTER);
    let debounce = null;

    container.innerHTML = `
      <div class="editor-app">
        <div class="toolbar">
          <button class="btn btn-primary btn-sm" id="ed-run">▶ Run</button>
          <button class="btn btn-ghost btn-sm" id="ed-clear">Clear</button>
          <div class="toolbar-sep"></div>
          <button class="btn btn-ghost btn-sm" id="ed-copy">Copy HTML</button>
          <span style="flex:1"></span>
          <span style="font-size:11px;color:var(--luna-text-3)">Live Preview</span>
        </div>
        <div class="editor-layout" style="flex:1;overflow:hidden">
          <div class="editor-pane">
            <div class="editor-pane-label">HTML / CSS / JS</div>
            <textarea class="editor-textarea" id="ed-code" spellcheck="false"></textarea>
          </div>
          <div class="editor-pane">
            <div class="editor-pane-label">Preview</div>
            <iframe class="editor-preview" id="ed-preview" sandbox="allow-scripts allow-same-origin" style="border:none;flex:1"></iframe>
          </div>
        </div>
      </div>
    `;

    const codeEl    = container.querySelector('#ed-code');
    const previewEl = container.querySelector('#ed-preview');

    codeEl.value = code;

    function updatePreview() {
      try {
        previewEl.srcdoc = codeEl.value;
      } catch (err) {
        console.warn('[Editor] Preview error:', err);
      }
    }

    codeEl.addEventListener('input', () => {
      code = codeEl.value;
      store.set('code', code);
      clearTimeout(debounce);
      debounce = setTimeout(updatePreview, 600);
    });

    container.querySelector('#ed-run').addEventListener('click', updatePreview);

    container.querySelector('#ed-clear').addEventListener('click', () => {
      if (!confirm('Clear editor? This cannot be undone.')) return;
      codeEl.value = STARTER;
      code = STARTER;
      store.set('code', code);
      updatePreview();
    });

    container.querySelector('#ed-copy').addEventListener('click', () => {
      navigator.clipboard.writeText(codeEl.value).then(() => {
        global.NovaOS.Kernel.notify('Editor', 'HTML copied to clipboard', '📋');
      }).catch(() => {});
    });

    // Initial render
    updatePreview();

    // Tab key support
    codeEl.addEventListener('keydown', e => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const s = codeEl.selectionStart;
        const v = codeEl.value;
        codeEl.value = v.slice(0, s) + '  ' + v.slice(codeEl.selectionEnd);
        codeEl.selectionStart = codeEl.selectionEnd = s + 2;
      }
    });
  }

  global.NovaOS.AppLoader.register({
    id: 'editor', title: 'HTML Editor', width: 860, height: 540,
    mount
  });
})(window);
