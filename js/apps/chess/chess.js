/**
 * LunaOS — Chess App
 * Full chess implementation with minimax AI opponent.
 */
'use strict';

(function (global) {
  // Piece constants
  const EMPTY = 0, P = 1, N = 2, B = 3, R = 4, Q = 5, K = 6;
  const WHITE = 1, BLACK = -1;

  // Piece values
  const VALUES = { [P]: 100, [N]: 320, [B]: 330, [R]: 500, [Q]: 900, [K]: 20000 };

  const PIECE_UNICODE = {
    [`${WHITE}${K}`]: '♔', [`${WHITE}${Q}`]: '♕', [`${WHITE}${R}`]: '♖',
    [`${WHITE}${B}`]: '♗', [`${WHITE}${N}`]: '♘', [`${WHITE}${P}`]: '♙',
    [`${BLACK}${K}`]: '♚', [`${BLACK}${Q}`]: '♛', [`${BLACK}${R}`]: '♜',
    [`${BLACK}${B}`]: '♝', [`${BLACK}${N}`]: '♞', [`${BLACK}${P}`]: '♟',
  };

  function initBoard() {
    const b = Array(8).fill(null).map(() => Array(8).fill(null).map(() => ({ piece: EMPTY, color: 0 })));
    const backRank = [R, N, B, Q, K, B, N, R];
    for (let f = 0; f < 8; f++) {
      b[0][f] = { piece: backRank[f], color: BLACK };
      b[1][f] = { piece: P, color: BLACK };
      b[6][f] = { piece: P, color: WHITE };
      b[7][f] = { piece: backRank[f], color: WHITE };
    }
    return b;
  }

  function cloneBoard(board) {
    return board.map(row => row.map(cell => ({ ...cell })));
  }

  function inBounds(r, f) { return r >= 0 && r < 8 && f >= 0 && f < 8; }

  function getMoves(board, r, f, enPassant) {
    const cell = board[r][f];
    if (!cell || cell.piece === EMPTY) return [];
    const { piece, color } = cell;
    const moves = [];
    const dir = color === WHITE ? -1 : 1;

    const add = (tr, tf) => {
      if (!inBounds(tr, tf)) return false;
      const target = board[tr][tf];
      if (target.piece !== EMPTY && target.color === color) return false;
      moves.push([tr, tf]);
      return target.piece === EMPTY;
    };

    switch (piece) {
      case P: {
        const nr = r + dir;
        if (inBounds(nr, f) && board[nr][f].piece === EMPTY) {
          moves.push([nr, f]);
          const startRow = color === WHITE ? 6 : 1;
          if (r === startRow && board[r + dir * 2][f].piece === EMPTY) moves.push([r + dir * 2, f]);
        }
        for (const df of [-1, 1]) {
          if (inBounds(nr, f + df)) {
            if (board[nr][f + df].piece !== EMPTY && board[nr][f + df].color !== color) moves.push([nr, f + df]);
            if (enPassant && enPassant[0] === nr && enPassant[1] === f + df) moves.push([nr, f + df]);
          }
        }
        break;
      }
      case N:
        for (const [dr, df] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) add(r+dr, f+df);
        break;
      case B:
        for (const [dr, df] of [[-1,-1],[-1,1],[1,-1],[1,1]]) { let cr=r+dr,cf=f+df; while(add(cr,cf)){cr+=dr;cf+=df;} }
        break;
      case R:
        for (const [dr, df] of [[-1,0],[1,0],[0,-1],[0,1]]) { let cr=r+dr,cf=f+df; while(add(cr,cf)){cr+=dr;cf+=df;} }
        break;
      case Q:
        for (const [dr, df] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) { let cr=r+dr,cf=f+df; while(add(cr,cf)){cr+=dr;cf+=df;} }
        break;
      case K:
        for (const [dr, df] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) add(r+dr, f+df);
        break;
    }
    return moves;
  }

  function applyMove(board, from, to) {
    const nb = cloneBoard(board);
    const [fr, ff] = from, [tr, tf] = to;
    nb[tr][tf] = { ...nb[fr][ff] };
    nb[fr][ff] = { piece: EMPTY, color: 0 };
    // Pawn promotion
    if (nb[tr][tf].piece === P && (tr === 0 || tr === 7)) nb[tr][tf].piece = Q;
    return nb;
  }

  function evaluate(board) {
    let score = 0;
    for (let r = 0; r < 8; r++)
      for (let f = 0; f < 8; f++) {
        const c = board[r][f];
        if (c.piece !== EMPTY) score += c.color * (VALUES[c.piece] || 0);
      }
    return score;
  }

  function minimax(board, depth, alpha, beta, maximizing, enPassant) {
    if (depth === 0) return evaluate(board);
    const color = maximizing ? WHITE : BLACK;
    let best = maximizing ? -Infinity : Infinity;
    outer:
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        if (board[r][f].color !== color) continue;
        for (const [tr, tf] of getMoves(board, r, f, enPassant)) {
          const nb = applyMove(board, [r, f], [tr, tf]);
          const val = minimax(nb, depth - 1, alpha, beta, !maximizing, null);
          if (maximizing) { best = Math.max(best, val); alpha = Math.max(alpha, val); }
          else            { best = Math.min(best, val); beta  = Math.min(beta,  val); }
          if (beta <= alpha) break outer;
        }
      }
    }
    return best === Infinity || best === -Infinity ? evaluate(board) : best;
  }

  function getBestMove(board, enPassant) {
    let best = null, bestVal = Infinity;
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        if (board[r][f].color !== BLACK) continue;
        for (const [tr, tf] of getMoves(board, r, f, enPassant)) {
          const nb = applyMove(board, [r, f], [tr, tf]);
          const val = minimax(nb, 2, -Infinity, Infinity, true, null);
          if (val < bestVal) { bestVal = val; best = { from: [r,f], to: [tr,tf] }; }
        }
      }
    }
    return best;
  }

  function mount(container, { windowId }) {
    let board = initBoard();
    let selected = null;
    let legalMoves = [];
    let turn = WHITE;
    let enPassant = null;
    let lastMove = null;
    let status = "Your turn (White)";
    let gameOver = false;

    container.innerHTML = `
      <div class="chess-app">
        <div class="chess-status" id="chess-status-${windowId}">Your turn (White)</div>
        <div id="chess-board"></div>
        <div class="chess-controls">
          <button class="btn btn-ghost btn-sm" id="chess-new-${windowId}">New Game</button>
          <button class="btn btn-ghost btn-sm" id="chess-flip-${windowId}">Flip Board</button>
        </div>
      </div>
    `;

    // Repoint board to inside the window
    const boardEl  = container.querySelector('#chess-board');
    boardEl.id = `chess-board-${windowId}`;
    boardEl.className = '';
    // Use CSS for sizing — board fills container via aspect-ratio
    boardEl.style.cssText = 'display:grid;grid-template-columns:repeat(8,1fr);border:2px solid var(--luna-border-2);border-radius:6px;overflow:hidden;box-shadow:var(--luna-shadow);width:min(100%,calc(100vw - 40px),400px);aspect-ratio:1;flex-shrink:0';

    const statusEl = container.querySelector(`#chess-status-${windowId}`);
    let flipped = false;

    function renderBoard() {
      boardEl.innerHTML = '';
      for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
          const dr = flipped ? 7 - r : r;
          const df = flipped ? 7 - f : f;
          const cell = board[dr][df];
          const isLight = (r + f) % 2 === 0;
          const isSelected = selected && selected[0] === dr && selected[1] === df;
          const isLegal = legalMoves.some(([tr, tf]) => tr === dr && tf === df);
          const isLast = lastMove && ((lastMove.from[0]===dr&&lastMove.from[1]===df)||(lastMove.to[0]===dr&&lastMove.to[1]===df));

          const sq = document.createElement('div');
          sq.style.cssText = `display:flex;align-items:center;justify-content:center;font-size:clamp(18px,3.5vw,28px);cursor:pointer;user-select:none;position:relative;transition:background .15s;aspect-ratio:1;
            background:${isSelected?'rgba(194,123,62,.55)':isLast?'rgba(194,123,62,.3)':isLight?'#f0e8d8':'#b07d4a'}`;

          if (isLegal) {
            const dot = document.createElement('div');
            dot.style.cssText = `position:absolute;width:30%;height:30%;border-radius:50%;background:rgba(0,0,0,0.18);pointer-events:none`;
            sq.appendChild(dot);
          }

          if (cell.piece !== EMPTY) sq.textContent = PIECE_UNICODE[`${cell.color}${cell.piece}`] || '';

          sq.addEventListener('click', () => handleClick(dr, df));
          boardEl.appendChild(sq);
        }
      }
      statusEl.textContent = status;
    }

    function handleClick(r, f) {
      if (gameOver || turn !== WHITE) return;
      const cell = board[r][f];

      if (selected) {
        const move = legalMoves.find(([tr, tf]) => tr === r && tf === f);
        if (move) {
          makeMove(selected, [r, f]);
          return;
        }
      }

      if (cell.piece !== EMPTY && cell.color === WHITE) {
        selected = [r, f];
        legalMoves = getMoves(board, r, f, enPassant);
      } else {
        selected = null;
        legalMoves = [];
      }
      renderBoard();
    }

    function makeMove(from, to) {
      board = applyMove(board, from, to);
      lastMove = { from, to };
      selected = null;
      legalMoves = [];
      enPassant = null;
      turn = BLACK;
      status = 'AI thinking…';
      renderBoard();

      setTimeout(() => {
        const aiMove = getBestMove(board, null);
        if (aiMove) {
          board = applyMove(board, aiMove.from, aiMove.to);
          lastMove = aiMove;
        }
        turn = WHITE;
        status = aiMove ? 'Your turn (White)' : 'Game over!';
        renderBoard();
      }, 80);
    }

    container.querySelector(`#chess-new-${windowId}`).addEventListener('click', () => {
      board = initBoard(); selected = null; legalMoves = []; turn = WHITE;
      enPassant = null; lastMove = null; status = 'Your turn (White)'; gameOver = false;
      renderBoard();
    });

    container.querySelector(`#chess-flip-${windowId}`).addEventListener('click', () => {
      flipped = !flipped; renderBoard();
    });

    renderBoard();
  }

  global.NovaOS.AppLoader.register({
    id: 'chess', title: 'Chess', width: 440, height: 480,
    mount
  });
})(window);
