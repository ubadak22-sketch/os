/**
 * Nova OS — App Store v3
 * Simulated download + install with progress bars.
 * Persistent storage, RAM limits, dock injection.
 */
'use strict';
(function(global) {

  const CATALOG = [
    // ── Games ──────────────────────────────────────────────
    {
      id:'snake', name:'Snake', icon:'🐍', category:'Games',
      banner:'background:linear-gradient(135deg,#064e3b,#065f46)',
      desc:'Classic snake game. Eat food, grow longer, avoid walls. Swipe or arrow keys.',
      sizeMB:8, ramMB:200, rating:'4.7', ratingCount:'18K',
      appId:'snake',
    },
    {
      id:'game2048', name:'2048', icon:'🔢', category:'Games',
      banner:'background:linear-gradient(135deg,#312e81,#4338ca)',
      desc:'Slide tiles and combine matching numbers to reach 2048. Strategy meets luck.',
      sizeMB:6, ramMB:150, rating:'4.9', ratingCount:'42K',
      appId:'game2048',
    },
    {
      id:'tictactoe', name:'Tic Tac Toe', icon:'❌', category:'Games',
      banner:'background:linear-gradient(135deg,#1e1b4b,#3730a3)',
      desc:'Classic 3×3 grid game against an unbeatable minimax AI. Can you tie?',
      sizeMB:4, ramMB:100, rating:'4.5', ratingCount:'9K',
      appId:'tictactoe',
    },
    {
      id:'gameApp', name:'Nova Games Hub', icon:'🎮', category:'Games',
      banner:'background:linear-gradient(135deg,#0d0d14,#1a1a2e)',
      desc:'Your portal to all installed games. Launch Breakout, Chess, and more.',
      sizeMB:120, ramMB:800, rating:'4.8', ratingCount:'55K',
      appId:'gameApp',
      mountFn(container) {
        container.innerHTML = `
          <div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:24px;background:linear-gradient(135deg,#0d0d14,#1a1a2e)">
            <div style="font-size:56px">🎮</div>
            <div style="font-size:22px;font-weight:300;color:#e8e3db">Nova Games Hub</div>
            <div style="font-size:13px;color:rgba(232,227,219,.5);text-align:center;max-width:260px;line-height:1.6">All your installed games in one place.</div>
            <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:8px">
              <button class="btn btn-primary btn-sm" onclick="NovaOS.AppLoader.launch('breakout')">🎮 Breakout</button>
              <button class="btn btn-ghost btn-sm" style="color:#e8e3db;border-color:rgba(232,227,219,.2)" onclick="NovaOS.AppLoader.launch('chess')">♟ Chess</button>
              <button class="btn btn-ghost btn-sm" style="color:#e8e3db;border-color:rgba(232,227,219,.2)" onclick="NovaOS.AppLoader.launch('snake')">🐍 Snake</button>
              <button class="btn btn-ghost btn-sm" style="color:#e8e3db;border-color:rgba(232,227,219,.2)" onclick="NovaOS.AppLoader.launch('game2048')">🔢 2048</button>
            </div>
          </div>`;
      }
    },
    // ── Productivity ────────────────────────────────────────
    {
      id:'chatApp', name:'NovaChat', icon:'💬', category:'Social',
      banner:'background:linear-gradient(135deg,#1a3a5c,#1e40af)',
      desc:'Local chat simulator with an AI bot. Send messages, get instant replies.',
      sizeMB:60, ramMB:300, rating:'4.1', ratingCount:'7K',
      appId:'chatApp',
      mountFn(container) {
        const store = global.NovaOS.Storage.ns('chatapp');
        let messages = store.get('msgs', [{from:'System',text:'Welcome to NovaChat!',ts:Date.now()-60000}]);
        function render() {
          container.innerHTML = `
            <div style="height:100%;display:flex;flex-direction:column;background:var(--luna-surface)">
              <div style="padding:10px 14px;border-bottom:1px solid var(--luna-border);background:rgba(255,255,255,.6);display:flex;align-items:center;gap:8px">
                <span style="font-size:18px">💬</span>
                <span style="font-weight:600;font-size:13px">NovaChat</span>
                <span style="margin-left:auto;font-size:10px;color:#10b981">● Online</span>
              </div>
              <div id="chat-msgs" style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px"></div>
              <div style="display:flex;gap:8px;padding:10px 12px;border-top:1px solid var(--luna-border)">
                <input id="chat-input" class="input" placeholder="Type a message…" style="flex:1" />
                <button id="chat-send" class="btn btn-primary btn-sm">Send</button>
              </div>
            </div>`;
          const msgsEl = container.querySelector('#chat-msgs');
          messages.forEach(m => {
            const isMe = m.from==='You';
            const el = document.createElement('div');
            el.style.cssText = `display:flex;flex-direction:column;align-items:${isMe?'flex-end':'flex-start'};gap:2px`;
            el.innerHTML = `<span style="font-size:10px;color:rgba(255,255,255,0.78)">${m.from}</span>
              <div style="max-width:75%;padding:8px 12px;border-radius:12px;font-size:13px;line-height:1.5;
                background:${isMe?'var(--nova-accent)':'rgba(255,255,255,0.12)'};
                color:#fff;
                border:1px solid ${isMe?'transparent':'rgba(255,255,255,0.18)'}">${m.text}</div>`;
            msgsEl.appendChild(el);
          });
          msgsEl.scrollTop = msgsEl.scrollHeight;
          const input = container.querySelector('#chat-input');
          const send = () => {
            const txt = input.value.trim(); if(!txt) return;
            messages.push({from:'You',text:txt,ts:Date.now()});
            store.set('msgs',messages); input.value=''; render();
            const replies=['Got it!','Interesting...','Tell me more!','Nova OS is great!','😊','Sure!','Agreed!'];
            setTimeout(()=>{messages.push({from:'NovaBot',text:replies[Math.floor(Math.random()*replies.length)],ts:Date.now()});store.set('msgs',messages);render();},700+Math.random()*500);
          };
          container.querySelector('#chat-send').addEventListener('click',send);
          input.addEventListener('keydown',e=>{if(e.key==='Enter')send();});
          input.focus();
        }
        render();
      }
    },
    {
      id:'toolApp', name:'DevToolkit', icon:'🔧', category:'Developer',
      banner:'background:linear-gradient(135deg,#14532d,#166534)',
      desc:'JSON formatter, Base64 encoder/decoder, UUID v4 generator. Developer essentials.',
      sizeMB:40, ramMB:200, rating:'4.9', ratingCount:'31K',
      appId:'toolApp',
      mountFn(container) {
        let tab='json';
        const tabs={
          json:`<textarea id="ti" class="input" style="min-height:100px;font-family:var(--font-mono);font-size:12px" placeholder='{"key":"value"}'></textarea>
            <div style="display:flex;gap:8px;margin:8px 0">
              <button class="btn btn-primary btn-sm" id="jfmt">Format</button>
              <button class="btn btn-ghost btn-sm" id="jmin">Minify</button>
              <button class="btn btn-ghost btn-sm" id="jcpy">Copy</button>
            </div>
            <textarea id="to" class="input" style="min-height:100px;font-family:var(--font-mono);font-size:12px" readonly placeholder="Output…"></textarea>`,
          base64:`<textarea id="bi" class="input" style="min-height:80px;font-family:var(--font-mono);font-size:12px" placeholder="Input…"></textarea>
            <div style="display:flex;gap:8px;margin:8px 0">
              <button class="btn btn-primary btn-sm" id="benc">Encode</button>
              <button class="btn btn-ghost btn-sm" id="bdec">Decode</button>
              <button class="btn btn-ghost btn-sm" id="bcpy">Copy</button>
            </div>
            <textarea id="bo" class="input" style="min-height:80px;font-family:var(--font-mono);font-size:12px" readonly></textarea>`,
          uuid:`<button class="btn btn-primary btn-sm" id="ugen" style="margin-bottom:10px">+ Generate UUID</button>
            <div id="ulist" style="display:flex;flex-direction:column;gap:6px;max-height:220px;overflow-y:auto"></div>`
        };
        let uuids=[];
        const draw=()=>{
          container.innerHTML=`<div style="height:100%;display:flex;flex-direction:column">
            <div style="display:flex;gap:4px;padding:10px 12px;border-bottom:1px solid var(--luna-border);background:rgba(15,15,40,0.80)">
              ${['json','base64','uuid'].map(t=>`<button class="btn btn-ghost btn-sm" data-t="${t}" style="${tab===t?'background:var(--nova-accent-bg);color:var(--nova-accent);border-color:var(--nova-accent)':''}">${t.toUpperCase()}</button>`).join('')}
            </div>
            <div style="flex:1;overflow:auto;padding:14px">${tabs[tab]}</div>
          </div>`;
          container.querySelectorAll('[data-t]').forEach(b=>b.addEventListener('click',()=>{tab=b.dataset.t;draw();}));
          if(tab==='json'){
            const i=container.querySelector('#ti'),o=container.querySelector('#to');
            container.querySelector('#jfmt').onclick=()=>{try{o.value=JSON.stringify(JSON.parse(i.value),null,2);}catch(e){o.value='Error: '+e.message;}};
            container.querySelector('#jmin').onclick=()=>{try{o.value=JSON.stringify(JSON.parse(i.value));}catch(e){o.value='Error: '+e.message;}};
            container.querySelector('#jcpy').onclick=()=>{navigator.clipboard.writeText(o.value).catch(()=>{});};
          } else if(tab==='base64'){
            const i=container.querySelector('#bi'),o=container.querySelector('#bo');
            container.querySelector('#benc').onclick=()=>{try{o.value=btoa(unescape(encodeURIComponent(i.value)));}catch(e){o.value='Error';}};
            container.querySelector('#bdec').onclick=()=>{try{o.value=decodeURIComponent(escape(atob(i.value)));}catch(e){o.value='Error';}};
            container.querySelector('#bcpy').onclick=()=>{navigator.clipboard.writeText(o.value).catch(()=>{});};
          } else {
            const gen=()=>'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=crypto.getRandomValues(new Uint8Array(1))[0]%16;return(c==='x'?r:(r&0x3)|0x8).toString(16);});
            const list=container.querySelector('#ulist');
            const redraw=()=>{list.innerHTML=uuids.map(u=>`<div style="display:flex;gap:8px;padding:7px 10px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.18);border-radius:8px"><code style="font-family:var(--font-mono);font-size:11px;flex:1;color:var(--nova-accent)">${u}</code><button class="btn btn-ghost btn-sm" data-copy="${u}" style="padding:2px 7px;font-size:10px">Copy</button></div>`).join('')||'<div style="font-size:12px;color:var(--nova-text-3)">Click Generate</div>';
              list.querySelectorAll('[data-copy]').forEach(b=>b.addEventListener('click',()=>navigator.clipboard.writeText(b.dataset.copy).catch(()=>{})));};
            container.querySelector('#ugen').addEventListener('click',()=>{uuids.unshift(gen());if(uuids.length>10)uuids.pop();redraw();});
            redraw();
          }
        };
        draw();
      }
    }
  ];

  // ── State management ──────────────────────────────────────
  const K = () => global.NovaOS.Kernel;
  function getInstalled() { return new Set(K().StorageSim.getInstalled()); }
  function saveInstalled(set) { K().StorageSim.saveInstalled(Array.from(set)); }

  function getMountFn(item) {
    // Use explicit mountFn or look up registered app
    if (item.mountFn) return item.mountFn;
    const existing = global.NovaOS.AppLoader.get?.(item.appId);
    if (existing) return existing.mount;
    return (c) => { c.innerHTML = `<div class="empty-state"><div class="es-icon">${item.icon}</div><div class="es-title">${item.name}</div><div class="es-desc">App launched successfully.</div></div>`; };
  }

  function registerApp(item) {
    if (global.NovaOS.AppLoader.has(item.appId)) return;
    global.NovaOS.AppLoader.register({
      id: item.appId, title: item.name,
      width: 520, height: 480,
      mount: getMountFn(item)
    });
    if (K()?.RAM?.appLimits) K().RAM.appLimits[item.appId] = item.ramMB;
  }

  function addDockIcon(item) {
    const dock = document.getElementById('dock-inner');
    if (!dock || dock.querySelector(`[data-app="${item.appId}"]`)) return;
    const el = document.createElement('div');
    el.className = 'dock-app'; el.dataset.app = item.appId; el.title = item.name;
    el.innerHTML = `<div class="dock-icon">${item.icon}</div><span>${item.name}</span>`;
    el.addEventListener('click', () => global.NovaOS.AppLoader.launch(item.appId));
    const settings = dock.querySelector('[data-app="settings"]');
    dock.insertBefore(el, settings || null);
  }

  // ── Boot: restore installed ───────────────────────────────
  const _installed = getInstalled();
  CATALOG.forEach(item => {
    if (_installed.has(item.id)) {
      registerApp(item);
      global.NovaOS.EventBus.on('desktop:ready', () => addDockIcon(item));
    }
  });

  // ── Simulate download + install ───────────────────────────
  const _downloading = new Set();

  function simulateInstall(item, card, onDone) {
    if (_downloading.has(item.id)) return;
    _downloading.add(item.id);

    const btn = card.querySelector('.ps-install-btn');
    const progressWrap = card.querySelector('.ps-progress');
    const TOTAL_MS = 10000 + Math.random() * 8000;
    const steps = [
      {t:0,    label:'Downloading…'},
      {t:0.6,  label:'Installing…'},
      {t:0.95, label:'Finishing…'},
    ];
    let start = null;

    btn.disabled = true;
    progressWrap.style.display = 'block';

    function tick(ts) {
      if (!start) start = ts;
      const pct = Math.min((ts - start) / TOTAL_MS, 1);
      const bar = card.querySelector('.ps-prog-bar');
      const lbl = card.querySelector('.ps-prog-label');
      if (bar) bar.style.width = (pct * 100).toFixed(1) + '%';

      const step = steps.slice().reverse().find(s => pct >= s.t);
      if (lbl && step) lbl.textContent = step.label + ` ${Math.round(pct*100)}%`;

      if (pct < 1) {
        requestAnimationFrame(tick);
      } else {
        _downloading.delete(item.id);
        onDone();
      }
    }
    requestAnimationFrame(tick);
  }

  // ── App UI ────────────────────────────────────────────────
  function mount(container) {
    function render() {
      const installed = getInstalled();
      const K = global.NovaOS.Kernel;
      const stoUsed = K.StorageSim.used, stoTotal = K.StorageSim.total;
      const stoPct = Math.round((stoUsed/stoTotal)*100);

      const categories = [...new Set(CATALOG.map(a=>a.category))];

      container.innerHTML = `
        <div class="playstore-app" style="height:100%;display:flex;flex-direction:column;overflow:hidden;">
          <!-- Header -->
          <div style="padding:14px 18px 10px;border-bottom:1px solid rgba(255,255,255,0.12);background:rgba(14,14,38,0.92);flex-shrink:0">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
              <div style="font-size:28px">🏪</div>
              <div>
                <div style="font-size:17px;font-weight:700;color:#ffffff">Nova App Store</div>
                <div style="font-size:11px;color:rgba(255,255,255,0.82)">${CATALOG.length} apps available</div>
              </div>
            </div>
            <!-- Storage bar -->
            <div style="background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.14);border-radius:10px;padding:9px 12px">
              <div style="display:flex;justify-content:space-between;margin-bottom:5px">
                <span style="font-size:11px;font-weight:600;color:#ffffff">💾 Storage</span>
                <span style="font-size:11px;font-family:var(--font-mono);color:rgba(255,255,255,0.92)">${stoUsed}/${stoTotal} MB</span>
              </div>
              <div style="height:5px;background:rgba(255,255,255,0.12);border-radius:99px;overflow:hidden">
                <div style="height:100%;width:${stoPct}%;background:${stoPct>80?'var(--nova-red)':'var(--nova-accent)'};border-radius:99px;transition:width .4s"></div>
              </div>
              <div style="font-size:10px;color:rgba(255,255,255,0.78);margin-top:3px">${K.StorageSim.available()} MB free</div>
            </div>
          </div>

          <!-- Apps grid -->
          <div style="flex:1;overflow-y:auto;padding:14px 14px 20px">
            ${categories.map(cat => `
              <div style="margin-bottom:18px">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:rgba(255,255,255,0.90);margin-bottom:10px;padding:0 2px">${cat}</div>
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px" id="ps-cat-${cat.replace(/\s/g,'_')}"></div>
              </div>
            `).join('')}
          </div>
        </div>`;

      CATALOG.forEach(item => {
        const isInstalled = installed.has(item.id);
        const catId = item.category.replace(/\s/g,'_');
        const grid = container.querySelector(`#ps-cat-${catId}`);
        if (!grid) return;

        const card = document.createElement('div');
        card.style.cssText = 'background:#1e1e3a;border:1px solid rgba(255,255,255,0.12);border-radius:14px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.40);transition:transform .2s,box-shadow .2s';
        card.onmouseenter = () => { card.style.transform='translateY(-2px)'; card.style.boxShadow='0 8px 32px rgba(0,0,0,0.55)'; card.style.borderColor='rgba(99,102,241,0.35)'; };
        card.onmouseleave = () => { card.style.transform=''; card.style.boxShadow='0 4px 16px rgba(0,0,0,0.40)'; card.style.borderColor='rgba(255,255,255,0.12)'; };

        card.innerHTML = `
          <div style="height:72px;display:flex;align-items:center;justify-content:center;font-size:38px;${item.banner}"></div>
          <div style="padding:10px 12px">
            <div style="font-size:14px;font-weight:700;color:#ffffff">${item.name}</div>
            <div style="font-size:12px;color:rgba(200,205,255,0.82);margin-top:5px;line-height:1.5">${item.desc}</div>
            <div style="display:flex;align-items:center;gap:6px;margin-top:8px">
              <span style="font-size:10px;color:#f59e0b">${'★'.repeat(Math.round(item.rating))}${'☆'.repeat(5-Math.round(item.rating))}</span>
              <span style="font-size:10px;color:rgba(255,255,255,0.72)">(${item.ratingCount})</span>
              <span style="margin-left:auto;font-size:10px;font-family:var(--font-mono);color:rgba(255,255,255,0.72)">${item.sizeMB} MB</span>
            </div>
            <!-- Progress bar (hidden until download) -->
            <div class="ps-progress" style="display:none;margin-top:8px">
              <div style="height:4px;background:rgba(255,255,255,0.12);border-radius:99px;overflow:hidden;margin-bottom:4px">
                <div class="ps-prog-bar" style="height:100%;width:0%;background:var(--nova-accent);border-radius:99px;transition:none"></div>
              </div>
              <div class="ps-prog-label" style="font-size:10px;color:rgba(255,255,255,0.85);font-family:var(--font-mono)">Downloading… 0%</div>
            </div>
            <div style="display:flex;gap:6px;margin-top:10px;align-items:center">
              <button class="ps-install-btn btn btn-sm ${isInstalled?'btn-ghost':'btn-primary'}" style="flex:1">
                ${isInstalled ? '✓ Installed' : '⬇ Install'}
              </button>
              ${isInstalled ? `<button class="btn btn-ghost btn-sm ps-open-btn" style="background:rgba(99,102,241,0.18);color:#a5b4fc;border:1px solid rgba(99,102,241,0.35);font-weight:600">Open</button>` : ''}
            </div>
          </div>`;

        const installBtn = card.querySelector('.ps-install-btn');
        const openBtn    = card.querySelector('.ps-open-btn');

        if (!isInstalled) {
          installBtn.addEventListener('click', () => {
            if (_downloading.has(item.id)) return;
            // Storage check
            if (!K.StorageSim.consume(item.sizeMB)) {
              K.notify('App Store', `Storage full! Need ${item.sizeMB} MB, only ${K.StorageSim.available()} MB free.`, '💾', 4000);
              return;
            }
            simulateInstall(item, card, () => {
              // Install complete
              registerApp(item);
              addDockIcon(item);
              const newSet = getInstalled();
              newSet.add(item.id);
              saveInstalled(newSet);
              global.NovaOS.SoundSystem?.installComplete();
            K.notify('App Store', `"${item.name}" installed!`, '✅', 4000);
              render(); // refresh
            });
          });
        } else if (openBtn) {
          openBtn.addEventListener('click', () => global.NovaOS.AppLoader.launch(item.appId));
          installBtn.disabled = true;
        }

        grid.appendChild(card);
      });
    }

    render();
  }

  global.NovaOS.AppLoader.register({id:'playStore',title:'App Store',width:680,height:580,mount});
})(window);
