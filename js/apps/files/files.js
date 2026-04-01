/**
 * LunaOS — File Manager App
 * Browse and manage the virtual filesystem backed by Storage.
 */
'use strict';

(function (global) {
  const fsStore = global.NovaOS.Storage.ns('files');

  function getFS() { return fsStore.get('tree', { '/': {}, '/home': { 'readme.txt': 'Welcome to Nova OS!' }, '/docs': {}, '/downloads': {} }); }
  function saveFS(fs) { fsStore.set('tree', fs); }

  function mount(container) {
    let cwd = '/home';
    let selected = null;

    const LOCATIONS = [
      { label: '🏠 Home',      path: '/home' },
      { label: '📄 Docs',      path: '/docs' },
      { label: '⬇️ Downloads', path: '/downloads' },
      { label: '💾 Root',      path: '/' },
    ];

    container.innerHTML = `
      <div class="files-app">
        <div class="files-sidebar" id="fm-sidebar"></div>
        <div class="files-main">
          <div class="toolbar">
            <button class="btn btn-primary btn-sm" id="fm-new-file">+ File</button>
            <button class="btn btn-ghost btn-sm" id="fm-new-dir">+ Folder</button>
            <div class="toolbar-sep"></div>
            <button class="btn btn-ghost btn-sm" id="fm-rename" disabled>Rename</button>
            <button class="btn btn-danger btn-sm" id="fm-delete" disabled>Delete</button>
            <span style="flex:1"></span>
            <span style="font-size:11px;color:var(--luna-text-3)" id="fm-path">/home</span>
          </div>
          <div class="files-grid" id="fm-grid"></div>
          <div class="files-statusbar" id="fm-status"></div>
        </div>
      </div>
    `;

    const sidebar = container.querySelector('#fm-sidebar');
    const grid    = container.querySelector('#fm-grid');
    const pathEl  = container.querySelector('#fm-path');
    const statusEl= container.querySelector('#fm-status');
    const renameBtn = container.querySelector('#fm-rename');
    const deleteBtn = container.querySelector('#fm-delete');

    // Sidebar
    LOCATIONS.forEach(loc => {
      const el = document.createElement('div');
      el.className = 'files-nav-item' + (loc.path === cwd ? ' active' : '');
      el.textContent = loc.label;
      el.addEventListener('click', () => { cwd = loc.path; selected = null; render(); });
      sidebar.appendChild(el);
    });

    function render() {
      const fs = getFS();
      pathEl.textContent = cwd;
      grid.innerHTML = '';
      selected = null;
      updateButtons();

      // Update sidebar active
      sidebar.querySelectorAll('.files-nav-item').forEach((el, i) => {
        el.classList.toggle('active', LOCATIONS[i].path === cwd);
      });

      const dir = fs[cwd] || {};
      const entries = Object.entries(dir);

      if (!entries.length) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="es-icon">📂</div><div class="es-title">Empty folder</div><div class="es-desc">No files here yet.</div></div>`;
        statusEl.textContent = '0 items';
        return;
      }

      entries.forEach(([name, content]) => {
        const isDir = typeof content === 'object';
        const el = document.createElement('div');
        el.className = 'file-item';
        el.innerHTML = `<div class="file-icon">${isDir ? '📁' : getFileIcon(name)}</div><div class="file-name">${_esc(name)}</div>`;

        el.addEventListener('click', (e) => {
          grid.querySelectorAll('.file-item').forEach(x => x.classList.remove('selected'));
          el.classList.add('selected');
          selected = name;
          updateButtons();
        });

        el.addEventListener('dblclick', () => {
          if (isDir) {
            cwd = (cwd === '/' ? '' : cwd) + '/' + name;
            render();
          } else {
            openFile(name, content);
          }
        });

        el.addEventListener('contextmenu', e => {
          e.preventDefault();
          el.click();
          showContextMenu(e.clientX, e.clientY, name, isDir, content);
        });

        grid.appendChild(el);
      });

      statusEl.textContent = `${entries.length} item${entries.length !== 1 ? 's' : ''}`;
    }

    function updateButtons() {
      renameBtn.disabled = !selected;
      deleteBtn.disabled = !selected;
    }

    function getFileIcon(name) {
      const ext = name.split('.').pop().toLowerCase();
      const map = { txt:'📄', md:'📝', html:'🌐', css:'🎨', js:'📜', json:'⚙️', png:'🖼', jpg:'🖼', gif:'🖼', mp3:'🎵', mp4:'🎬' };
      return map[ext] || '📄';
    }

    function openFile(name, content) {
      // Open in a simple viewer dialog
      const win = document.createElement('div');
      win.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:9000;display:flex;align-items:center;justify-content:center';
      win.innerHTML = `
        <div style="background:var(--luna-surface);border-radius:var(--radius-lg);padding:24px;min-width:400px;max-width:80vw;max-height:70vh;display:flex;flex-direction:column;gap:12px;box-shadow:var(--luna-shadow-lg)">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <strong>${_esc(name)}</strong>
            <button class="btn btn-ghost btn-sm" id="fv-close">✕</button>
          </div>
          <textarea style="flex:1;min-height:200px;font-family:var(--font-mono);font-size:13px;border:1px solid var(--luna-border);border-radius:var(--radius-sm);padding:12px;resize:vertical;outline:none" id="fv-content">${_esc(content)}</textarea>
          <div style="display:flex;gap:8px;justify-content:flex-end">
            <button class="btn btn-ghost btn-sm" id="fv-cancel">Cancel</button>
            <button class="btn btn-primary btn-sm" id="fv-save">Save</button>
          </div>
        </div>
      `;
      document.body.appendChild(win);
      win.querySelector('#fv-close').addEventListener('click', () => win.remove());
      win.querySelector('#fv-cancel').addEventListener('click', () => win.remove());
      win.querySelector('#fv-save').addEventListener('click', () => {
        const fs = getFS();
        if (fs[cwd]) {
          fs[cwd][name] = win.querySelector('#fv-content').value;
          saveFS(fs);
          render();
        }
        win.remove();
      });
    }

    function showContextMenu(x, y, name, isDir, content) {
      document.querySelectorAll('.context-menu').forEach(m => m.remove());
      const menu = document.createElement('div');
      menu.className = 'context-menu';
      const items = isDir
        ? [{ label: '📂 Open', action: () => { cwd += '/' + name; render(); } }]
        : [{ label: '📄 Open', action: () => openFile(name, content) }];
      items.push(
        { label: '✏️ Rename', action: () => renameItem(name) },
        { sep: true },
        { label: '🗑 Delete', action: () => deleteItem(name), danger: true }
      );
      items.forEach(item => {
        if (item.sep) { menu.appendChild(Object.assign(document.createElement('div'), { className: 'context-sep' })); return; }
        const el = document.createElement('div');
        el.className = 'context-item' + (item.danger ? ' danger' : '');
        el.textContent = item.label;
        el.addEventListener('click', () => { item.action(); menu.remove(); });
        menu.appendChild(el);
      });
      document.body.appendChild(menu);
      menu.style.left = x + 'px'; menu.style.top = y + 'px';
      document.addEventListener('click', () => menu.remove(), { once: true });
    }

    function renameItem(name) {
      const newName = prompt('Rename to:', name);
      if (!newName || newName === name) return;
      const fs = getFS();
      const dir = fs[cwd];
      if (!dir) return;
      dir[newName] = dir[name];
      delete dir[name];
      saveFS(fs);
      render();
    }

    function deleteItem(name) {
      if (!confirm(`Delete "${name}"?`)) return;
      const fs = getFS();
      const dir = fs[cwd];
      if (!dir) return;
      delete dir[name];
      // Also remove sub-entries for dirs
      const full = (cwd === '/' ? '' : cwd) + '/' + name;
      delete fs[full];
      saveFS(fs);
      render();
    }

    container.querySelector('#fm-new-file').addEventListener('click', () => {
      const name = prompt('File name:', 'newfile.txt');
      if (!name?.trim()) return;
      const fs = getFS();
      if (!fs[cwd]) fs[cwd] = {};
      fs[cwd][name.trim()] = '';
      saveFS(fs);
      render();
    });

    container.querySelector('#fm-new-dir').addEventListener('click', () => {
      const name = prompt('Folder name:', 'New Folder');
      if (!name?.trim()) return;
      const fs = getFS();
      if (!fs[cwd]) fs[cwd] = {};
      fs[cwd][name.trim()] = {};
      const full = (cwd === '/' ? '' : cwd) + '/' + name.trim();
      fs[full] = {};
      saveFS(fs);
      render();
    });

    renameBtn.addEventListener('click', () => { if (selected) renameItem(selected); });
    deleteBtn.addEventListener('click', () => { if (selected) deleteItem(selected); });

    render();
  }

  function _esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  global.NovaOS.AppLoader.register({
    id: 'files', title: 'File Manager', width: 720, height: 480,
    mount
  });
})(window);
