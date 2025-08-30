// AI対戦のロジック

// 勝利ラインの定義
const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // 横
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // 縦
  [0, 4, 8], [2, 4, 6] // 斜め
];

// 勝者判定
const checkWinner = (squares) => {
  for (let line of WINNING_LINES) {
    const [a, b, c] = line;
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
};

// 空いているマスを取得
const getAvailableMoves = (squares) => {
  return squares.map((square, index) => square === null ? index : null)
                .filter(val => val !== null);
};

// ミニマックス法でAIの手を決定
const minimax = (squares, depth, isMaximizing, alpha = -Infinity, beta = Infinity) => {
  const winner = checkWinner(squares);
  
  // 終了条件
  if (winner === 'O') return 10 - depth; // AIの勝利
  if (winner === 'X') return depth - 10; // プレイヤーの勝利
  if (getAvailableMoves(squares).length === 0) return 0; // 引き分け
  
  if (isMaximizing) {
    let maxval = -Infinity;
    for (let move of getAvailableMoves(squares)) {
      squares[move] = 'O';
      const val = minimax(squares, depth + 1, false, alpha, beta);
      squares[move] = null;
      maxval = Math.max(maxval, val);
      alpha = Math.max(alpha, val);
      if (beta <= alpha) break; // アルファベータ剪定
    }
    return maxval;
  } else {
    let minval = Infinity;
    for (let move of getAvailableMoves(squares)) {
      squares[move] = 'X';
      const val = minimax(squares, depth + 1, true, alpha, beta);
      squares[move] = null;
      minval = Math.min(minval, val);
      beta = Math.min(beta, val);
      if (beta <= alpha) break; // アルファベータ剪定
    }
    return minval;
  }
};

// 難易度別AI
export const getAIMove = (squares, difficulty = 'normal') => {
  const availableMoves = getAvailableMoves(squares);
  
  if (availableMoves.length === 0) return null;
  
  switch (difficulty) {
    case 'easy':
      // 30%の確率でランダム、70%で最適手
      if (Math.random() < 0.3) {
        return availableMoves[Math.floor(Math.random() * availableMoves.length)];
      }
      // fall through to normal
      
    case 'normal':
      // 最適手を選択
      let bestMove = availableMoves[0];
      let bestValue = -Infinity;
      
      for (let move of availableMoves) {
        squares[move] = 'O';
        const movvalue = minimax(squares, 0, false);
        squares[move] = null;
        
        if (movvalue > bestValue) {
          bestValue = movvalue;
          bestMove = move;
        }
      }
      return bestMove;
      
    case 'hard':
      // 完全な最適手（ミニマックス法）
      let bestMoveHard = availableMoves[0];
      let bestValueHard = -Infinity;
      
      for (let move of availableMoves) {
        squares[move] = 'O';
        const movvalue = minimax(squares, 0, false);
        squares[move] = null;
        
        if (movvalue > bestValueHard) {
          bestValueHard = movvalue;
          bestMoveHard = move;
        }
      }
      return bestMoveHard;
      
    default:
      return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }
};