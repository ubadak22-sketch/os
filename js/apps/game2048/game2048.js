/**
 * Nova OS — 2048 Game
 */
'use strict';
(function(global) {
  function mount(container, {windowId}) {
    const store = global.NovaOS.Storage.ns('game2048');
    let board, score, best, moved;
    best = store.get('best', 0);

    const COLORS = {
      0:'rgba(255,255,255,0.06)', 2:'#eef2ff', 4:'#e0e7ff', 8:'#c7d2fe',
      16:'#a5b4fc', 32:'#818cf8', 64:'#6366f1', 128:'#4f46e5',
      256:'#f59e0b', 512:'#f97316', 1024:'#ef4444', 2048:'#ec4899'
    };
    const TEXT_COLORS = {2:'#312e81',4:'#312e81',8:'#fff',16:'#fff',32:'#fff',64:'#fff',128:'#fff',256:'#fff',512:'#fff',1024:'#fff',2048:'#fff'};

    function newBoard() {
      board = Array.from({length:4}, ()=>[0,0,0,0]);
      score = 0; addRandom(); addRandom();
    }
    function addRandom() {
      const empty = [];
      board.forEach((r,i) => r.forEach((v,j) => { if(!v) empty.push([i,j]); }));
      if (!empty.length) return;
      const [r,c] = empty[Math.floor(Math.random()*empty.length)];
      board[r][c] = Math.random() < 0.9 ? 2 : 4;
    }
    function compress(row) {
      const f = row.filter(v=>v);
      for (let i=0;i<f.length-1;i++) {
        if (f[i]===f[i+1]) { f[i]*=2; score+=f[i]; f.splice(i+1,1); }
      }
      while(f.length<4) f.push(0);
      return f;
    }
    function move(dir) {
      const prev = JSON.stringify(board);
      if (dir==='left')  board = board.map(r => compress(r));
      if (dir==='right') board = board.map(r => compress([...r].reverse()).reverse());
      if (dir==='up')    board = rotate(rotate(rotate(board.map(r=>compress(r.map((_,i)=>board.map(row=>row[i])[i])))))); // simplified
      // Proper transpose-based moves:
      if (dir==='up') {
        const t = transpose(board);
        board = transpose(t.map(r=>compress(r)));
      }
      if (dir==='down') {
        const t = transpose(board);
        board = transpose(t.map(r=>compress([...r].reverse()).reverse()));
      }
      moved = JSON.stringify(board) !== prev;
      if (moved) {
        if (score > best) { best = score; store.set('best', best); }
        addRandom();
        render();
      }
    }
    function transpose(m) { return m[0].map((_,i) => m.map(row=>row[i])); }
    function rotate(m) { return m[0].map((_,i) => m.map(row=>row[i]).reverse()); }

    function render() {
      const grid = container.querySelector('#g2048-grid');
      const scoreEl = container.querySelector('#g2048-score');
      const bestEl  = container.querySelector('#g2048-best');
      if (!grid) return;
      scoreEl.textContent = score;
      bestEl.textContent  = best;
      grid.innerHTML = '';
      board.forEach(row => row.forEach(val => {
        const cell = document.createElement('div');
        cell.style.cssText = `
          display:flex;align-items:center;justify-content:center;
          border-radius:8px;font-weight:700;
          background:${COLORS[val]||'#9333ea'};
          color:${TEXT_COLORS[val]||'#fff'};
          font-size:${val>=1000?'18px':val>=100?'22px':'26px'};
          aspect-ratio:1;transition:background 0.1s;
          box-shadow:${val?'0 2px 8px rgba(0,0,0,0.12)':'none'};
        `;
        cell.textContent = val || '';
        grid.appendChild(cell);
      }));
    }

    container.innerHTML = `
      <div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:16px;background:linear-gradient(135deg,#0f0f1a,#1a1a2e)">
        <div style="display:flex;align-items:center;gap:16px;width:100%;max-width:320px">
          <div style="font-family:var(--font-sans);font-size:24px;font-weight:700;color:#a5b4fc;flex:1">2048</div>
          <div style="text-align:center;background:rgba(99,102,241,0.2);border-radius:8px;padding:6px 14px">
            <div style="font-size:10px;color:rgba(165,180,252,0.6);text-transform:uppercase;letter-spacing:.1em">Score</div>
            <div id="g2048-score" style="font-size:18px;font-weight:700;color:#a5b4fc">0</div>
          </div>
          <div style="text-align:center;background:rgba(99,102,241,0.15);border-radius:8px;padding:6px 14px">
            <div style="font-size:10px;color:rgba(165,180,252,0.6);text-transform:uppercase;letter-spacing:.1em">Best</div>
            <div id="g2048-best" style="font-size:18px;font-weight:700;color:#a5b4fc">0</div>
          </div>
          <button id="g2048-new" style="padding:6px 12px;border-radius:8px;background:rgba(99,102,241,0.3);color:#a5b4fc;border:1px solid rgba(99,102,241,0.4);font-size:12px;cursor:pointer">New</button>
        </div>
        <div id="g2048-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;background:rgba(99,102,241,0.12);border-radius:12px;padding:10px;width:100%;max-width:320px;border:1px solid rgba(99,102,241,0.2)"></div>
        <div style="font-size:11px;color:rgba(165,180,252,0.35);font-family:var(--font-mono)">Arrow keys or swipe</div>
      </div>`;

    container.querySelector('#g2048-new').addEventListener('click', () => { newBoard(); render(); });

    // Keyboard
    document.addEventListener('keydown', function h(e) {
      if (!container.isConnected) { document.removeEventListener('keydown',h); return; }
      const map = {ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'};
      if (map[e.key]) { e.preventDefault(); move(map[e.key]); }
    });

    // Touch
    let tx, ty;
    container.addEventListener('touchstart', e=>{tx=e.touches[0].clientX;ty=e.touches[0].clientY;},{passive:true});
    container.addEventListener('touchend', e=>{
      const dx=e.changedTouches[0].clientX-tx, dy=e.changedTouches[0].clientY-ty;
      if(Math.abs(dx)>Math.abs(dy)) move(dx>20?'right':'left');
      else move(dy>20?'down':'up');
    },{passive:true});

    newBoard(); render();
  }

  global.NovaOS.AppLoader.register({id:'game2048',title:'2048',width:380,height:460,mount});
})(window);
