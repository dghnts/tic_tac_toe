import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Auth from "./components/Auth";
import { useGameData } from "./hooks/useGameData";

function Square({ value, onSquareClick, highlight }) {
    return (
        <button
            className={`square${highlight ? " highlight" : ""}`}
            onClick={onSquareClick}
        >
            {value}
        </button>
    );
}

function Board({ xIsNext, squares, currentMove, onPlay }) {
    const [winner, a, b, c] = calculateWinner(squares);
    function handleClick(i) {
        if (squares[i] || winner) {
            return;
        }
        const nextSquares = squares.slice();
        nextSquares[i] = xIsNext ? "X" : "O";
        onPlay(nextSquares, i); // 位置も渡す
    }


    let status;
    if (winner) {
        status = "Winner: " + winner;
    } else if (currentMove === 9) {
        status = "Draw!";
    } else {
        status = "Next Player: " + (xIsNext ? "X" : "O");
    }

    // 勝利ラインのインデックス配列
    const winLine = [a, b, c];

    return (
        <>
            <div className="status">{status}</div>
            {Array.from({length: BOARD_SIZE}, (_, row) => (
                <div className="board-row" key={row}>
                    {Array.from({length: BOARD_SIZE}, (_, col) => {
                        const idx = row * BOARD_SIZE + col;
                        const highlight = winLine.includes(idx) && winner;
                        return (
                            <Square
                                key={idx}
                                value={squares[idx]}
                                onSquareClick={() => handleClick(idx)}
                                highlight={highlight}
                            />
                        );
                    })}
                </div>
            ))}
        </>
    );
}

const BOARD_SIZE = 3;
const WINNING_LINES = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
];

function calculateWinner(squares) {
    for (let i = 0; i < WINNING_LINES.length; i++) {
        const [a, b, c] = WINNING_LINES[i];
        if (
            squares[a] &&
            squares[a] === squares[b] &&
            squares[a] === squares[c]
        ) {
            return [squares[a], a, b, c];
        }
    }
    return Array(4).fill(null);
}

function ToggleButton({ isAsc, onToggle }) {
    return <button className="toggle-button" onClick={onToggle}>{isAsc ? "ASC" : "DESC"}</button>;
}

function formatPosition(position) {
    return ` (${Math.floor(position / 3) + 1}, ${position % 3 + 1})`;
}

function Header() {
    return (
        <header className="header">
            <h1>Tic Tac Toe</h1>
        </header>
    );
}

function Footer() {
    return (
        <footer className="footer">
            <p>Created by dghnts | <a href="https://github.com/dghnts/tic_tac_toe" target="_blank" rel="noopener noreferrer">tic_tac_toe</a></p>
        </footer>
    );
}

function Game() {
    const [history, setHistory] = useState([{ squares: Array(9).fill(null), position: null }]);
    const [currentMove, setCurrentMove] = useState(0);
    const [isAsc, setIsAsc] = useState(true);
    const [gameStartTime, setGameStartTime] = useState(Date.now());
    const [currentPlayTime, setCurrentPlayTime] = useState(0);
    const xIsNext = currentMove % 2 === 0;
    const currentSquares = history[currentMove].squares;
    
    const { user, signOut } = useAuth();
    const { stats, saveGame } = useGameData();
    
    // 現在のゲーム時間を1秒ごとに更新
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentPlayTime(Math.floor((Date.now() - gameStartTime) / 1000));
        }, 1000);
        
        return () => clearInterval(timer);
    }, [gameStartTime]);

    function handlePlay(nextSquares, position) {
        const nextHistory = [
            ...history.slice(0, currentMove + 1),
            { squares: nextSquares, position },
        ];
        setHistory(nextHistory);
        setCurrentMove(nextHistory.length - 1);
        
        // ゲーム終了チェック
        const [winner] = calculateWinner(nextSquares);
        const isGameEnd = winner || nextHistory.length === 10;
        
        if (isGameEnd) {
            const durationSeconds = Math.floor((Date.now() - gameStartTime) / 1000);
            const finalWinner = winner || 'draw';
            saveGame(finalWinner, nextHistory.length - 1, nextHistory, durationSeconds);
        }
    }

    function jumpTo(nextMove) {
        setCurrentMove(nextMove);
    }

    function resetGame() {
        setHistory([{ squares: Array(9).fill(null), position: null }]);
        setCurrentMove(0);
        setGameStartTime(Date.now());
        setCurrentPlayTime(0);
    }

    const moves = history.map((step, move) => {
        let description;
        if (move !== 0 && move === currentMove) {
            description = "You are at move #" + move;
            return (
                <li key={move}>
                    <span>
                        {description}
                        {step.position !== null && formatPosition(step.position)}
                    </span>
                </li>
            );
        }
        if (move > 0) {
            description = "Go to move #" + move;
        } else {
            description = "Go to game start";
        }
        return (
            <li key={move}>
                <button onClick={() => jumpTo(move)}>
                    {description}
                    {step.position !== null && formatPosition(step.position)}
                </button>
            </li>
        );
    });

    const orderedMoves = isAsc ? moves : moves.slice().reverse();

    // 時間フォーマット関数
    const formatPlayTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        
        if (minutes > 0) {
            return `${minutes}分${secs}秒`;
        } else {
            return `${secs}秒`;
        }
    };
    
    // 統計情報表示コンポーネント
    const StatsDisplay = () => (
        <div className="stats-display">
            <h3>統計情報</h3>
            <p>総ゲーム数: {stats.total_games}</p>
            <p>勝利: {stats.wins}</p>
            <p>敗北: {stats.losses}</p>
            <p>引き分け: {stats.draws}</p>
            {stats.total_games > 0 && (
                <p>勝率: {Math.round((stats.wins / stats.total_games) * 100)}%</p>
            )}
        </div>
    );
    
    // 現在のゲーム情報表示コンポーネント
    const CurrentGameInfo = () => (
        <div className="current-game-info">
            <h3>現在のゲーム</h3>
            <p>プレイ時間: {formatPlayTime(currentPlayTime)}</p>
        </div>
    );

    return (
        <>
            <Header />
            {user && (
                <div className="user-info">
                    <span>ログイン中: {user.email}</span>
                    <button onClick={signOut}>ログアウト</button>
                </div>
            )}
            <div className="game">
                <div className="game-board">
                    <Board
                        xIsNext={xIsNext}
                        squares={currentSquares}
                        currentMove={currentMove}
                        onPlay={handlePlay}
                    />
                </div>
                <div className="game-info">
                    <CurrentGameInfo />
                    <StatsDisplay />
                    <div className="game-controls">
                        <button className="reset-button" onClick={resetGame}>
                            New Game
                        </button>
                        <ToggleButton
                            isAsc={isAsc}
                            onToggle={() => setIsAsc((prev) => !prev)}
                        />
                    </div>
                    <ol reversed={!isAsc}>{orderedMoves}</ol>
                </div>
            </div>
            <Footer />
        </>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <AuthenticatedApp />
        </AuthProvider>
    );
}

function AuthenticatedApp() {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="loading">読み込み中...</div>;
    }

    return user ? <Game /> : <Auth />;
}
