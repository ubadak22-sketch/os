/**
 * LunaOS — Breakout App
 * Full-featured Breakout arcade game with levels and HUD.
 */
'use strict';

(function (global) {
  function mount(container, { windowId }) {
    container.innerHTML = `
      <div class="breakout-app" id="brk-wrap-${windowId}">
        <div class="breakout-hud">
          <span>🎮 <strong id="brk-score-${windowId}">0</strong></span>
          <span>❤️ <strong id="brk-lives-${windowId}">3</strong></span>
          <span>Lv <strong id="brk-level-${windowId}">1</strong></span>
        </div>
        <canvas id="brk-canvas-${windowId}" width="480" height="320"></canvas>
        <div style="font-size:11px;color:rgba(232,227,219,.45);font-family:var(--font-mono)">Move mouse · Click to start/pause</div>
      </div>
    `;

    const canvas = container.querySelector(`#brk-canvas-${windowId}`);
    const ctx = canvas.getContext('2d');
    const scoreEl = container.querySelector(`#brk-score-${windowId}`);
    const livesEl = container.querySelector(`#brk-lives-${windowId}`);
    const levelEl = container.querySelector(`#brk-level-${windowId}`);

    const W = canvas.width, H = canvas.height;

    // Game state
    let state = 'idle'; // idle | playing | paused | dead | won
    let score = 0, lives = 3, level = 1;
    let raf = null;

    // Paddle
    const pad = { w: 80, h: 10, x: W/2 - 40, y: H - 24, speed: 0 };

    // Ball
    const ball = { x: W/2, y: H - 40, vx: 0, vy: 0, r: 7 };

    // Bricks
    let bricks = [];
    const COLS = 10, ROWS = 5;
    const brickW = (W - 40) / COLS, brickH = 18;

    const COLORS = ['#e05c2f','#c27b3e','#e8a06a','#4a8c5c','#3a6ea5','#7b5ea5'];

    function buildBricks() {
      bricks = [];
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const hp = Math.ceil((ROWS - r) / 2);
          bricks.push({
            x: 20 + c * brickW, y: 40 + r * (brickH + 4),
            w: brickW - 4, h: brickH,
            hp, maxHp: hp,
            color: COLORS[r % COLORS.length]
          });
        }
      }
    }

    function resetBall() {
      ball.x = pad.x + pad.w / 2;
      ball.y = pad.y - ball.r - 2;
      const angle = (Math.random() * 60 + 60) * Math.PI / 180;
      const speed = 4 + level * 0.5;
      ball.vx = Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1);
      ball.vy = -Math.sin(angle) * speed;
    }

    function startLevel() {
      buildBricks();
      resetBall();
      levelEl.textContent = level;
    }

    function update() {
      if (state !== 'playing') return;

      // Move ball
      ball.x += ball.vx;
      ball.y += ball.vy;

      // Wall collisions
      if (ball.x - ball.r < 0) { ball.x = ball.r; ball.vx *= -1; }
      if (ball.x + ball.r > W) { ball.x = W - ball.r; ball.vx *= -1; }
      if (ball.y - ball.r < 0) { ball.y = ball.r; ball.vy *= -1; }

      // Lost ball
      if (ball.y > H + 20) {
        lives--;
        livesEl.textContent = lives;
        if (lives <= 0) { state = 'dead'; return; }
        resetBall();
        state = 'idle';
        return;
      }

      // Paddle collision
      if (
        ball.y + ball.r >= pad.y && ball.y + ball.r <= pad.y + pad.h &&
        ball.x >= pad.x && ball.x <= pad.x + pad.w
      ) {
        ball.vy = -Math.abs(ball.vy);
        const rel = (ball.x - (pad.x + pad.w / 2)) / (pad.w / 2);
        ball.vx = rel * 5;
      }

      // Brick collisions
      for (let i = bricks.length - 1; i >= 0; i--) {
        const b = bricks[i];
        if (ball.x + ball.r > b.x && ball.x - ball.r < b.x + b.w &&
            ball.y + ball.r > b.y && ball.y - ball.r < b.y + b.h) {
          b.hp--;
          score += 10;
          scoreEl.textContent = score;
          if (b.hp <= 0) bricks.splice(i, 1);

          // Determine bounce direction
          const overlapLeft   = ball.x + ball.r - b.x;
          const overlapRight  = b.x + b.w - (ball.x - ball.r);
          const overlapTop    = ball.y + ball.r - b.y;
          const overlapBottom = b.y + b.h - (ball.y - ball.r);
          const minX = Math.min(overlapLeft, overlapRight);
          const minY = Math.min(overlapTop, overlapBottom);
          if (minX < minY) ball.vx *= -1; else ball.vy *= -1;
          break;
        }
      }

      // Level clear
      if (bricks.length === 0) {
        level++;
        score += 200;
        scoreEl.textContent = score;
        startLevel();
        state = 'idle';
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // Background
      ctx.fillStyle = '#0d0d14';
      ctx.fillRect(0, 0, W, H);

      // Bricks
      bricks.forEach(b => {
        const alpha = 0.5 + 0.5 * (b.hp / b.maxHp);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.roundRect(b.x, b.y, b.w, b.h, 3);
        ctx.fill();

        if (b.hp > 1) {
          ctx.globalAlpha = 0.7;
          ctx.fillStyle = '#fff';
          ctx.font = '9px var(--font-mono, monospace)';
          ctx.textAlign = 'center';
          ctx.fillText(b.hp, b.x + b.w / 2, b.y + b.h / 2 + 3);
        }
        ctx.globalAlpha = 1;
      });

      // Paddle
      ctx.fillStyle = '#c27b3e';
      ctx.beginPath();
      ctx.roundRect(pad.x, pad.y, pad.w, pad.h, 5);
      ctx.fill();

      // Ball
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fillStyle = '#e8e3db';
      ctx.fill();

      // Overlay messages
      if (state === 'idle') {
        ctx.fillStyle = 'rgba(0,0,0,.6)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#e8e3db';
        ctx.font = '20px Fraunces, serif';
        ctx.textAlign = 'center';
        ctx.fillText('Click to Launch', W/2, H/2);
      }
      if (state === 'paused') {
        ctx.fillStyle = 'rgba(0,0,0,.5)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#e8e3db';
        ctx.font = '22px Fraunces, serif';
        ctx.textAlign = 'center';
        ctx.fillText('Paused', W/2, H/2);
        ctx.font = '13px DM Sans, sans-serif';
        ctx.fillText('Click to resume', W/2, H/2 + 28);
      }
      if (state === 'dead') {
        ctx.fillStyle = 'rgba(0,0,0,.65)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#e85c5c';
        ctx.font = '26px Fraunces, serif';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', W/2, H/2 - 10);
        ctx.fillStyle = '#e8e3db';
        ctx.font = '13px DM Sans, sans-serif';
        ctx.fillText(`Score: ${score}`, W/2, H/2 + 20);
        ctx.fillText('Click to play again', W/2, H/2 + 44);
      }
    }

    function loop() {
      update();
      draw();
      raf = requestAnimationFrame(loop);
    }

    // Mouse control
    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (W / rect.width);
      pad.x = Math.max(0, Math.min(W - pad.w, mx - pad.w / 2));
    });

    canvas.addEventListener('click', () => {
      if (state === 'idle') {
        state = 'playing';
      } else if (state === 'playing') {
        state = 'paused';
      } else if (state === 'paused') {
        state = 'playing';
      } else if (state === 'dead') {
        score = 0; lives = 3; level = 1;
        scoreEl.textContent = 0; livesEl.textContent = 3;
        startLevel();
        state = 'idle';
      }
    });

    // Cleanup
    global.NovaOS.EventBus.once('window:closed', ({ windowId: wid }) => {
      if (wid === windowId) cancelAnimationFrame(raf);
    });

    // Start
    startLevel();
    loop();
  }

  global.NovaOS.AppLoader.register({
    id: 'breakout', title: 'Breakout', width: 520, height: 440,
    mount
  });
})(window);
