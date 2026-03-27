/**
 * LunaOS — Notes App
 * Persistent, multi-note editor with sidebar navigation.
 */
'use strict';

(function (global) {
  const store = global.NovaOS.Storage.ns('notes');

  function loadNotes() {
    return store.get('list', []);
  }

  function saveNotes(notes) {
    store.set('list', notes);
  }

  function mount(container) {
    let notes = loadNotes();
    let activeId = notes[0]?.id || null;

    container.innerHTML = `
      <div class="notes-layout">
        <div class="notes-sidebar">
          <div class="notes-sidebar-header">
            <button class="btn btn-primary btn-sm" id="notes-new" style="flex:1">+ New</button>
          </div>
          <div class="notes-list" id="notes-list"></div>
        </div>
        <div class="notes-editor" id="notes-editor">
          <div class="empty-state">
            <div class="es-icon">📝</div>
            <div class="es-title">No note selected</div>
            <div class="es-desc">Create a new note or select one from the list.</div>
          </div>
        </div>
      </div>
    `;

    const listEl   = container.querySelector('#notes-list');
    const editorEl = container.querySelector('#notes-editor');
    const newBtn   = container.querySelector('#notes-new');

    function genId() { return 'note-' + Date.now(); }

    function renderList() {
      listEl.innerHTML = '';
      if (!notes.length) {
        listEl.innerHTML = '<div style="padding:16px;font-size:12px;color:var(--luna-text-3);text-align:center">No notes yet</div>';
        return;
      }
      notes.forEach(note => {
        const el = document.createElement('div');
        el.className = 'note-item' + (note.id === activeId ? ' active' : '');
        el.innerHTML = `
          <div class="note-item-title">${_esc(note.title || 'Untitled')}</div>
          <div class="note-item-preview">${_esc((note.body || '').slice(0, 50))}</div>
          <div class="note-item-date">${new Date(note.updatedAt).toLocaleDateString()}</div>
        `;
        el.addEventListener('click', () => { activeId = note.id; renderList(); renderEditor(); });
        el.addEventListener('contextmenu', e => {
          e.preventDefault();
          _contextMenu(e.clientX, e.clientY, [
            { label: '🗑 Delete', action: () => deleteNote(note.id) }
          ]);
        });
        listEl.appendChild(el);
      });
    }

    function renderEditor() {
      const note = notes.find(n => n.id === activeId);
      if (!note) {
        editorEl.innerHTML = `<div class="empty-state"><div class="es-icon">📝</div><div class="es-title">No note selected</div></div>`;
        return;
      }
      editorEl.innerHTML = `
        <div class="notes-editor-toolbar">
          <span style="font-size:11px;color:var(--luna-text-3);font-family:var(--font-mono)">Saved automatically</span>
          <button class="btn btn-ghost btn-sm" id="notes-delete">Delete</button>
        </div>
        <input class="notes-title-input" id="note-title" placeholder="Title" value="${_esc(note.title)}" />
        <textarea class="notes-body-input" id="note-body" placeholder="Start writing...">${_esc(note.body)}</textarea>
      `;

      const titleIn = editorEl.querySelector('#note-title');
      const bodyIn  = editorEl.querySelector('#note-body');

      const save = () => {
        const n = notes.find(n => n.id === activeId);
        if (!n) return;
        n.title = titleIn.value;
        n.body  = bodyIn.value;
        n.updatedAt = Date.now();
        saveNotes(notes);
        renderList();
      };

      titleIn.addEventListener('input', save);
      bodyIn.addEventListener('input', save);
      editorEl.querySelector('#notes-delete').addEventListener('click', () => deleteNote(note.id));
    }

    function deleteNote(id) {
      notes = notes.filter(n => n.id !== id);
      if (activeId === id) activeId = notes[0]?.id || null;
      saveNotes(notes);
      renderList();
      renderEditor();
    }

    newBtn.addEventListener('click', () => {
      const note = { id: genId(), title: '', body: '', updatedAt: Date.now() };
      notes.unshift(note);
      activeId = note.id;
      saveNotes(notes);
      renderList();
      renderEditor();
      container.querySelector('#note-title')?.focus();
    });

    renderList();
    renderEditor();
  }

  function _esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function _contextMenu(x, y, items) {
    document.querySelectorAll('.context-menu').forEach(m => m.remove());
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    items.forEach(item => {
      const el = document.createElement('div');
      el.className = 'context-item';
      el.textContent = item.label;
      el.addEventListener('click', () => { item.action(); menu.remove(); });
      menu.appendChild(el);
    });
    document.body.appendChild(menu);
    menu.style.left = x + 'px'; menu.style.top = y + 'px';
    document.addEventListener('click', () => menu.remove(), { once: true });
  }

  global.NovaOS.AppLoader.register({
    id: 'notes', title: 'Notes', width: 720, height: 500,
    mount
  });
})(window);
