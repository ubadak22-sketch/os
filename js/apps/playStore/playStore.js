/**
 * Nova OS — App Store (Play Store)
 * Install/uninstall apps with storage simulation.
 * Persists installed apps across reboots.
 */
'use strict';

(function (global) {

  // ── App catalog ───────────────────────────────────────────
  const CATALOG = [
    {
      id:       'gameApp',
      name:     'Nova Games',
      icon:     '&#127918;',
      banner:   'background:linear-gradient(135deg,#0d0d14,#1a1a2e)',
      desc:     'A collection of casual mini-games. Arcade classics remixed for Nova OS.',
      sizeMB:   120,
      ramMB:    800,
      rating:   '&#9733;&#9733;&#9733;&#9733;&#9733; 4.8',
      version:  '2.1.0',
      mount(container) {
        container.innerHTML = `
          <div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:24px;background:linear-gradient(135deg,#0d0d14,#1a1a2e)">
            <div style="font-size:56px">&#127918;</div>
            <div style="font-family:var(--font-serif);font-size:22px;font-weight:300;color:#e8e3db">Nova Games</div>
            <div style="font-size:13px;color:rgba(232,227,219,.6);text-align:center;max-width:260px;line-height:1.6">
              Your installed games are available in the dock.<br/>
              Try <strong style="color:var(--luna-accent-2)">Breakout</strong> and <strong style="color:var(--luna-accent-2)">Chess</strong>!
            </div>
            <div style="display:flex;gap:10px;margin-top:8px">
              <button class="btn btn-primary btn-sm" onclick="NovaOS.AppLoader.launch('breakout')">&#127918; Breakout</button>
              <button class="btn btn-ghost btn-sm" style="color:#e8e3db;border-color:rgba(232,227,219,.2)" onclick="NovaOS.AppLoader.launch('chess')">&#9823; Chess</button>
            </div>
          </div>`;
      }
    },
    {
      id:       'chatApp',
      name:     'NovaChat',
      icon:     '&#128172;',
      banner:   'background:linear-gradient(135deg,#1a3a5c,#2d6ea5)',
      desc:     'A minimal local chat simulator. Exchange messages in a cozy room.',
      sizeMB:   60,
      ramMB:    300,
      rating:   '&#9733;&#9733;&#9733;&#9733; 4.1',
      version:  '1.0.4',
      mount(container) {
        const store = global.NovaOS.Storage.ns('chatapp');
        let messages = store.get('msgs', [
          { from: 'System', text: 'Welcome to NovaChat! This is a local chat simulator.', ts: Date.now() - 60000 }
        ]);

        function render() {
          container.innerHTML = `
            <div style="height:100%;display:flex;flex-direction:column;background:var(--luna-surface)">
              <div style="padding:10px 14px;border-bottom:1px solid var(--luna-border);background:rgba(240,237,232,.6);display:flex;align-items:center;gap:8px">
                <span style="font-size:18px">&#128172;</span>
                <span style="font-weight:500;font-size:13px">NovaChat — Local Room</span>
                <span style="margin-left:auto;font-size:10px;color:var(--luna-text-3)">&#128994; Online</span>
              </div>
              <div id="chat-msgs" style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px"></div>
              <div style="display:flex;gap:8px;padding:10px 12px;border-top:1px solid var(--luna-border)">
                <input id="chat-input" class="input" placeholder="Type a message…" style="flex:1" />
                <button id="chat-send" class="btn btn-primary btn-sm">Send</button>
              </div>
            </div>`;

          const msgsEl = container.querySelector('#chat-msgs');
          messages.forEach(m => {
            const isMe = m.from === 'You';
            const el = document.createElement('div');
            el.style.cssText = `display:flex;flex-direction:column;align-items:${isMe ? 'flex-end' : 'flex-start'};gap:2px`;
            el.innerHTML = `
              <span style="font-size:10px;color:var(--luna-text-3)">${m.from}</span>
              <div style="max-width:75%;padding:8px 12px;border-radius:12px;font-size:13px;line-height:1.5;
                background:${isMe ? 'var(--luna-accent)' : 'var(--luna-surface-2)'};
                color:${isMe ? '#fff' : 'var(--luna-text)'};
                border:1px solid ${isMe ? 'transparent' : 'var(--luna-border)'}">${m.text}</div>`;
            msgsEl.appendChild(el);
          });
          msgsEl.scrollTop = msgsEl.scrollHeight;

          const input = container.querySelector('#chat-input');
          const send = () => {
            const txt = input.value.trim();
            if (!txt) return;
            messages.push({ from: 'You', text: txt, ts: Date.now() });
            store.set('msgs', messages);
            input.value = '';
            render();
            const replies = ['Got it!','Interesting...','Tell me more!','That\'s cool.','Nova OS is awesome!','Agreed!','Sure thing.','&#128079;'];
            setTimeout(() => {
              messages.push({ from: 'NovaBot', text: replies[Math.floor(Math.random() * replies.length)], ts: Date.now() });
              store.set('msgs', messages);
              render();
            }, 800 + Math.random() * 600);
          };
          container.querySelector('#chat-send').addEventListener('click', send);
          input.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
          input.focus();
        }
        render();
      }
    },
    {
      id:       'toolApp',
      name:     'DevToolkit',
      icon:     '&#128295;',
      banner:   'background:linear-gradient(135deg,#1a3a20,#2d6640)',
      desc:     'JSON formatter, Base64 encoder/decoder, and UUID v4 generator.',
      sizeMB:   40,
      ramMB:    200,
      rating:   '&#9733;&#9733;&#9733;&#9733;&#9733; 4.9',
      version:  '3.0.1',
      mount(container) {
        let activeTab = 'json';
        function renderTab() {
          const tabs = { json: renderJSON, base64: renderBase64, uuid: renderUUID };
          const body = container.querySelector('#dt-body');
          if (body) { body.innerHTML = ''; tabs[activeTab](body); }
          container.querySelectorAll('.dt-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === activeTab));
        }
        container.innerHTML = `
          <div style="height:100%;display:flex;flex-direction:column">
            <div style="display:flex;gap:4px;padding:10px 12px;border-bottom:1px solid var(--luna-border);background:rgba(240,237,232,.5)">
              <button class="btn btn-ghost btn-sm dt-tab" data-tab="json">JSON</button>
              <button class="btn btn-ghost btn-sm dt-tab" data-tab="base64">Base64</button>
              <button class="btn btn-ghost btn-sm dt-tab" data-tab="uuid">UUID</button>
            </div>
            <div id="dt-body" style="flex:1;overflow:auto;padding:14px"></div>
          </div>`;
        container.querySelectorAll('.dt-tab').forEach(t => t.addEventListener('click', () => { activeTab = t.dataset.tab; renderTab(); }));

        function renderJSON(body) {
          body.innerHTML = `
            <div style="display:flex;flex-direction:column;gap:10px;height:100%">
              <textarea id="json-in" class="input" style="flex:1;min-height:120px;font-family:var(--font-mono);font-size:12px" placeholder='{"key":"value"}'></textarea>
              <div style="display:flex;gap:8px">
                <button class="btn btn-primary btn-sm" id="json-fmt">Format</button>
                <button class="btn btn-ghost btn-sm"   id="json-min">Minify</button>
                <button class="btn btn-ghost btn-sm"   id="json-copy">Copy</button>
              </div>
              <textarea id="json-out" class="input" style="flex:1;min-height:120px;font-family:var(--font-mono);font-size:12px" readonly placeholder="Output…"></textarea>
            </div>`;
          const i = body.querySelector('#json-in'), o = body.querySelector('#json-out');
          body.querySelector('#json-fmt').addEventListener('click', () => { try { o.value = JSON.stringify(JSON.parse(i.value), null, 2); } catch(e) { o.value = 'Error: ' + e.message; } });
          body.querySelector('#json-min').addEventListener('click', () => { try { o.value = JSON.stringify(JSON.parse(i.value)); } catch(e) { o.value = 'Error: ' + e.message; } });
          body.querySelector('#json-copy').addEventListener('click', () => { navigator.clipboard.writeText(o.value).catch(()=>{}); global.NovaOS.Kernel.notify('DevToolkit','Copied!','&#128203;',1500); });
        }

        function renderBase64(body) {
          body.innerHTML = `
            <div style="display:flex;flex-direction:column;gap:10px">
              <textarea id="b64-in" class="input" style="min-height:100px;font-family:var(--font-mono);font-size:12px" placeholder="Input text or Base64…"></textarea>
              <div style="display:flex;gap:8px">
                <button class="btn btn-primary btn-sm" id="b64-enc">Encode</button>
                <button class="btn btn-ghost btn-sm"   id="b64-dec">Decode</button>
                <button class="btn btn-ghost btn-sm"   id="b64-copy">Copy</button>
              </div>
              <textarea id="b64-out" class="input" style="min-height:100px;font-family:var(--font-mono);font-size:12px" readonly></textarea>
            </div>`;
          const i = body.querySelector('#b64-in'), o = body.querySelector('#b64-out');
          body.querySelector('#b64-enc').addEventListener('click', () => { try { o.value = btoa(unescape(encodeURIComponent(i.value))); } catch(e) { o.value='Error: '+e.message; } });
          body.querySelector('#b64-dec').addEventListener('click', () => { try { o.value = decodeURIComponent(escape(atob(i.value))); } catch(e) { o.value='Error: '+e.message; } });
          body.querySelector('#b64-copy').addEventListener('click', () => { navigator.clipboard.writeText(o.value).catch(()=>{}); global.NovaOS.Kernel.notify('DevToolkit','Copied!','&#128203;',1500); });
        }

        function renderUUID(body) {
          const gen = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = crypto.getRandomValues(new Uint8Array(1))[0] % 16;
            return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
          });
          let uuids = [];
          const draw = () => {
            body.innerHTML = `
              <div style="display:flex;flex-direction:column;gap:10px">
                <div style="display:flex;gap:8px">
                  <button class="btn btn-primary btn-sm" id="uuid-gen">+ Generate</button>
                  <button class="btn btn-ghost btn-sm"   id="uuid-clear">Clear</button>
                </div>
                <div id="uuid-list" style="display:flex;flex-direction:column;gap:6px;max-height:280px;overflow-y:auto">
                  ${uuids.map(u => `
                    <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--luna-surface-2);border:1px solid var(--luna-border);border-radius:var(--radius-sm)">
                      <code style="font-family:var(--font-mono);font-size:12px;flex:1;color:var(--luna-accent)">${u}</code>
                      <button class="btn btn-ghost btn-sm" data-copy="${u}" style="padding:3px 8px;font-size:10px">Copy</button>
                    </div>`).join('')}
                  ${!uuids.length ? '<div style="font-size:12px;color:var(--luna-text-3)">Click Generate to create UUIDs</div>' : ''}
                </div>
              </div>`;
            body.querySelector('#uuid-gen').addEventListener('click', () => { uuids.unshift(gen()); draw(); });
            body.querySelector('#uuid-clear').addEventListener('click', () => { uuids = []; draw(); });
            body.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', () => {
              navigator.clipboard.writeText(b.dataset.copy).catch(()=>{});
              global.NovaOS.Kernel.notify('DevToolkit','Copied!','&#128203;',1500);
            }));
          };
          draw();
        }
        renderTab();
      }
    }
  ];

  // ── Installed-apps state (persisted via StorageSim) ───────
  function getInstalled() {
    return new Set(global.NovaOS.Kernel.StorageSim.getInstalled());
  }
  function saveInstalled(set) {
    global.NovaOS.Kernel.StorageSim.saveInstalled(Array.from(set));
  }

  // ── Pre-register apps that were installed in a previous session ──
  function _registerApp(app) {
    if (global.NovaOS.AppLoader.has(app.id)) return; // already registered
    global.NovaOS.AppLoader.register({
      id:     app.id,
      title:  app.name,
      width:  600,
      height: 460,
      mount:  app.mount
    });
    // Add RAM limit
    const k = global.NovaOS.Kernel;
    if (k?.RAM?.appLimits) k.RAM.appLimits[app.id] = app.ramMB;
  }

  function _addDockIcon(app) {
    const dockInner = document.getElementById('dock-inner');
    if (!dockInner || dockInner.querySelector(`[data-app="${app.id}"]`)) return;
    const item = document.createElement('div');
    item.className  = 'dock-app';
    item.dataset.app = app.id;
    item.title       = app.name;
    item.innerHTML   = `<div class="dock-icon">${app.icon}</div><span>${app.name}</span>`;
    item.addEventListener('click', () => global.NovaOS.AppLoader.launch(app.id));
    const settings = dockInner.querySelector('[data-app="settings"]');
    dockInner.insertBefore(item, settings || null);
  }

  // Boot: restore previously-installed apps
  const _installed = getInstalled();
  CATALOG.forEach(app => {
    if (_installed.has(app.id)) {
      _registerApp(app);
      // Dock icons added after desktop is ready
      global.NovaOS.EventBus.on && global.NovaOS.EventBus.once('desktop:ready', () => _addDockIcon(app));
    }
  });

  // ── Store UI ──────────────────────────────────────────────
  function mount(container) {

    function render() {
      const installed = getInstalled();
      const K = global.NovaOS.Kernel;
      const stoUsed = K.StorageSim.used;
      const stoTotal = K.StorageSim.total;
      const stoFree  = K.StorageSim.available();

      container.innerHTML = `
        <div class="playstore-app">
          <div class="playstore-header">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
              <div style="font-size:32px">&#127978;</div>
              <div>
                <div class="playstore-title">Nova OS App Store</div>
                <div class="playstore-sub">Discover and install apps for your system</div>
              </div>
            </div>
            <!-- Storage bar -->
            <div style="background:var(--luna-surface-2);border:1px solid var(--luna-border);border-radius:var(--radius);padding:10px 14px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                <span style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--luna-text-3)">&#128190; Storage</span>
                <span style="font-size:11px;font-family:var(--font-mono);color:var(--luna-text-2)">${stoUsed} / ${stoTotal} MB used</span>
              </div>
              <div style="height:6px;background:rgba(0,0,0,.08);border-radius:99px;overflow:hidden">
                <div style="height:100%;width:${Math.round((stoUsed/stoTotal)*100)}%;background:var(--luna-accent);border-radius:99px;transition:width .4s"></div>
              </div>
              <div style="font-size:10px;color:var(--luna-text-3);margin-top:4px">${stoFree} MB available</div>
            </div>
          </div>

          <div class="playstore-grid" id="ps-grid"></div>
        </div>
      `;

      const grid = container.querySelector('#ps-grid');
      CATALOG.forEach(app => {
        const isInstalled = installed.has(app.id);
        const card = document.createElement('div');
        card.className = 'ps-card';
        card.innerHTML = `
          <div class="ps-card-banner" style="${app.banner}">${app.icon}</div>
          <div class="ps-card-body">
            <div class="ps-card-name">${app.name}</div>
            <div class="ps-card-desc">${app.desc}</div>
            <div class="ps-card-meta">
              <span class="ps-card-size">&#128190; ${app.sizeMB} MB &nbsp;&#128176; ${app.ramMB} MB RAM</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px">
              <span class="ps-rating">${app.rating}</span>
              <button class="ps-install-btn ${isInstalled ? 'installed' : ''}" data-id="${app.id}">
                ${isInstalled ? '&#9989; Installed' : '&#8681; Install'}
              </button>
            </div>
            ${isInstalled ? `<button class="btn btn-ghost btn-sm" style="width:100%;margin-top:8px" onclick="NovaOS.AppLoader.launch('${app.id}')">Open App</button>` : ''}
          </div>
        `;
        grid.appendChild(card);
      });

      // Wire install buttons
      grid.querySelectorAll('.ps-install-btn:not(.installed)').forEach(btn => {
        btn.addEventListener('click', () => {
          const app = CATALOG.find(a => a.id === btn.dataset.id);
          if (!app) return;

          // Storage check
          if (!K.StorageSim.consume(app.sizeMB)) {
            K.notify('App Store', `Storage full! Need ${app.sizeMB} MB, only ${K.StorageSim.available()} MB free.`, '&#128190;', 4000);
            return;
          }

          btn.textContent = 'Installing\u2026';
          btn.classList.add('installing');
          btn.disabled = true;

          setTimeout(() => {
            _registerApp(app);
            _addDockIcon(app);
            const newInstalled = getInstalled();
            newInstalled.add(app.id);
            saveInstalled(newInstalled);

            K.notify('App Store', `"${app.name}" installed! (${app.sizeMB} MB used)`, '&#9989;', 4000);
            render();
          }, 1000 + Math.random() * 800);
        });
      });
    }

    render();
  }

  global.NovaOS.AppLoader.register({
    id: 'playStore', title: 'App Store', width: 660, height: 580,
    mount
  });
})(window);
