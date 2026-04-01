/**
 * Nova OS — Snake Game
 */
'use strict';
(function(global) {
  function mount(container, { windowId }) {
    const GRID = 20, CELL = 18;
    const W = GRID * CELL, H = GRID * CELL;

    container.innerHTML = `
      <div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:linear-gradient(135deg,#0f0f1a,#1a1a2e);padding:12px;">
        <div style="display:flex;gap:24px;font-family:var(--font-mono);font-size:13px;color:rgba(165,180,252,0.8)">
          <span>Score: <strong id="snk-score-${windowId}" style="color:#a5b4fc">0</strong></span>
          <span>Best: <strong id="snk-best-${windowId}" style="color:#a5b4fc">0</strong></span>
        </div>
        <canvas id="snk-canvas-${windowId}" width="${W}" height="${H}"
          style="border-radius:8px;border:1px solid rgba(99,102,241,0.3);max-width:100%;max-height:calc(100% - 80px)"></canvas>
        <div style="font-size:11px;color:rgba(165,180,252,0.4);font-family:var(--font-mono)">Arrow keys / WASD • Tap sides to steer</div>
      </div>`;

    const canvas = container.querySelector(`#snk-canvas-${windowId}`);
    const ctx = canvas.getContext('2d');
    const scoreEl = container.querySelector(`#snk-score-${windowId}`);
    const bestEl  = container.querySelector(`#snk-best-${windowId}`);

    let snake, dir, nextDir, food, score, best, alive, raf, interval;
    const store = global.NovaOS.Storage.ns('snake');
    best = store.get('best', 0);
    bestEl.textContent = best;

    function reset() {
      snake = [{x:10,y:10},{x:9,y:10},{x:8,y:10}];
      dir = {x:1,y:0}; nextDir = {x:1,y:0};
      score = 0; alive = true;
      placeFood(); scoreEl.textContent = 0;
    }

    function placeFood() {
      do {
        food = {x: Math.floor(Math.random()*GRID), y: Math.floor(Math.random()*GRID)};
      } while (snake.some(s => s.x===food.x && s.y===food.y));
    }

    function step() {
      if (!alive) return;
      dir = nextDir;
      const head = {x: snake[0].x + dir.x, y: snake[0].y + dir.y};
      // Wall collision
      if (head.x < 0||head.x >= GRID||head.y < 0||head.y >= GRID) { die(); return; }
      // Self collision
      if (snake.some(s => s.x===head.x && s.y===head.y)) { die(); return; }
      snake.unshift(head);
      if (head.x===food.x && head.y===food.y) {
        score++; scoreEl.textContent = score;
        if (score > best) { best = score; bestEl.textContent = best; store.set('best', best); }
        placeFood();
      } else { snake.pop(); }
    }

    function die() {
      alive = false;
      clearInterval(interval);
    }

    function draw() {
      ctx.fillStyle = '#0d0d1a';
      ctx.fillRect(0, 0, W, H);

      // Grid dots
      ctx.fillStyle = 'rgba(99,102,241,0.08)';
      for (let x=0;x<GRID;x++) for(let y=0;y<GRID;y++) {
        ctx.beginPath(); ctx.arc(x*CELL+CELL/2, y*CELL+CELL/2, 1, 0, Math.PI*2); ctx.fill();
      }

      // Food
      const pulse = 0.8 + 0.2 * Math.sin(Date.now()/200);
      ctx.shadowBlur = 12 * pulse; ctx.shadowColor = '#f43f5e';
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.roundRect(food.x*CELL+2, food.y*CELL+2, CELL-4, CELL-4, 4);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Snake
      snake.forEach((seg, i) => {
        const t = i / snake.length;
        const r = Math.round(99  + (165-99)*t);
        const g = Math.round(102 + (180-102)*t);
        const b = Math.round(241 + (252-241)*t);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.shadowBlur = i === 0 ? 10 : 0;
        ctx.shadowColor = '#6366f1';
        const rad = i === 0 ? 5 : 3;
        ctx.beginPath();
        ctx.roundRect(seg.x*CELL+1, seg.y*CELL+1, CELL-2, CELL-2, rad);
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      // Dead overlay
      if (!alive) {
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(0,0,W,H);
        ctx.fillStyle = '#f43f5e';
        ctx.font = 'bold 22px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', W/2, H/2 - 14);
        ctx.fillStyle = '#a5b4fc';
        ctx.font = '13px Inter, sans-serif';
        ctx.fillText(`Score: ${score}`, W/2, H/2 + 14);
        ctx.fillStyle = 'rgba(165,180,252,0.6)';
        ctx.font = '11px Inter, sans-serif';
        ctx.fillText('Tap / Press Space to restart', W/2, H/2 + 38);
      }

      raf = requestAnimationFrame(draw);
    }

    function startGame() {
      clearInterval(interval);
      reset();
      interval = setInterval(step, 120);
    }

    // Keyboard
    document.addEventListener('keydown', function handler(e) {
      if (!container.isConnected) { document.removeEventListener('keydown', handler); return; }
      const map = {ArrowUp:{x:0,y:-1},ArrowDown:{x:0,y:1},ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0},
                   w:{x:0,y:-1},s:{x:0,y:1},a:{x:-1,y:0},d:{x:1,y:0}};
      const k = map[e.key];
      if (k && !(k.x===-dir.x||k.y===-dir.y)) nextDir = k;
      if ((e.key===' '||e.key==='Enter') && !alive) startGame();
    });

    // Touch controls
    let touchX, touchY;
    canvas.addEventListener('touchstart', e => { touchX=e.touches[0].clientX; touchY=e.touches[0].clientY; e.preventDefault(); }, {passive:false});
    canvas.addEventListener('touchend', e => {
      if (!alive) { startGame(); return; }
      const dx = e.changedTouches[0].clientX - touchX;
      const dy = e.changedTouches[0].clientY - touchY;
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 20 && dir.x !== -1) nextDir = {x:1,y:0};
        else if (dx < -20 && dir.x !== 1) nextDir = {x:-1,y:0};
      } else {
        if (dy > 20 && dir.y !== -1) nextDir = {x:0,y:1};
        else if (dy < -20 && dir.y !== 1) nextDir = {x:0,y:-1};
      }
      e.preventDefault();
    }, {passive:false});

    canvas.addEventListener('click', () => { if (!alive) startGame(); });

    global.NovaOS.EventBus.once('window:closed', ({windowId:wid}) => {
      if (wid !== windowId) return;
      clearInterval(interval); cancelAnimationFrame(raf);
    });

    startGame(); draw();
  }

  global.NovaOS.AppLoader.register({
    id:'snake', title:'Snake', width:420, height:460, mount
  });
})(window);
