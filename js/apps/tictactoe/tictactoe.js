/**
 * Nova OS — Tic Tac Toe (vs AI)
 */
'use strict';
(function(global) {
  function mount(container, {windowId}) {
    let board, human, ai, current, gameOver;

    function reset() {
      board = Array(9).fill(null);
      human = 'X'; ai = 'O';
      current = 'X'; gameOver = false;
      render();
    }

    function checkWin(b, p) {
      const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
      return lines.find(l => l.every(i => b[i]===p)) || null;
    }

    function minimax(b, isMax) {
      const hWin = checkWin(b, human), aWin = checkWin(b, ai);
      if (aWin) return 10; if (hWin) return -10;
      if (b.every(c=>c)) return 0;
      const moves = b.map((c,i)=>c?null:i).filter(i=>i!==null);
      const scores = moves.map(i => {
        const nb=[...b]; nb[i]=isMax?ai:human;
        return minimax(nb, !isMax);
      });
      return isMax ? Math.max(...scores) : Math.min(...scores);
    }

    function aiMove() {
      let best=-Infinity, move=null;
      board.forEach((c,i) => {
        if (!c) {
          const nb=[...board]; nb[i]=ai;
          const s=minimax(nb,false);
          if (s>best) { best=s; move=i; }
        }
      });
      if (move !== null) { board[move]=ai; current=human; }
    }

    function handleClick(i) {
      if (gameOver || board[i] || current !== human) return;
      board[i] = human; current = ai;
      const win = checkWin(board, human);
      if (win || board.every(c=>c)) { gameOver=true; render(win); return; }
      setTimeout(() => {
        aiMove();
        const aiWin = checkWin(board, ai);
        if (aiWin || board.every(c=>c)) gameOver = true;
        render(aiWin || (board.every(c=>c) ? 'draw' : null));
      }, 200);
    }

    function render(winLine=null) {
      const isDraw = winLine==='draw' || (!winLine && gameOver && board.every(c=>c));
      const winner = winLine && winLine!=='draw' ? board[winLine[0]] : null;

      container.innerHTML = `
        <div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:20px;background:linear-gradient(135deg,#0f0f1a,#1a1a2e)">
          <div style="font-family:var(--font-sans);font-size:22px;font-weight:700;color:#a5b4fc">Tic Tac Toe</div>
          <div style="font-size:13px;color:rgba(165,180,252,0.7);min-height:20px;font-weight:500">
            ${gameOver ? (isDraw?'Draw!':winner==='X'?'You Win! 🎉':'AI Wins 🤖') : (current==='X'?'Your turn':'AI thinking...')}
          </div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;width:240px;height:240px">
            ${board.map((cell,i) => {
              const isWin = Array.isArray(winLine) && winLine.includes(i);
              return `<div class="ttt-cell" data-i="${i}" style="
                display:flex;align-items:center;justify-content:center;
                border-radius:12px;font-size:44px;cursor:pointer;
                background:${isWin?'rgba(99,102,241,0.35)':'rgba(99,102,241,0.1)'};
                border:2px solid ${isWin?'rgba(99,102,241,0.6)':'rgba(99,102,241,0.2)'};
                color:${cell==='X'?'#818cf8':'#f43f5e'};
                transition:all 0.15s;
                ${!cell&&!gameOver?'cursor:pointer':'cursor:default'};
              ">${cell||''}</div>`;
            }).join('')}
          </div>
          <button id="ttt-reset" style="padding:8px 24px;border-radius:99px;background:rgba(99,102,241,0.25);color:#a5b4fc;border:1px solid rgba(99,102,241,0.4);font-size:13px;cursor:pointer;font-weight:500">New Game</button>
          <div style="font-size:10px;color:rgba(165,180,252,0.3)">You are X — AI plays O</div>
        </div>`;

      container.querySelectorAll('.ttt-cell').forEach(el => {
        el.addEventListener('click', () => handleClick(parseInt(el.dataset.i)));
        el.addEventListener('mouseenter', () => { if(!board[el.dataset.i]&&!gameOver&&current===human) el.style.background='rgba(99,102,241,0.2)'; });
        el.addEventListener('mouseleave', () => { if(!Array.isArray(winLine)||!winLine.includes(parseInt(el.dataset.i))) el.style.background='rgba(99,102,241,0.1)'; });
      });
      container.querySelector('#ttt-reset').addEventListener('click', reset);
    }

    reset();
  }

  global.NovaOS.AppLoader.register({id:'tictactoe',title:'Tic Tac Toe',width:340,height:440,mount});
})(window);
