import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Auth from "./components/Auth";
import { useGameData } from "./hooks/useGameData";
import { useProfile } from "./hooks/useProfile";
import { getAIMove } from "./utils/aiPlayer";

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

function Board({ xIsNext, squares, currentMove, onPlay, isAIMode, aiDifficulty }) {
    const [winner, a, b, c] = calculateWinner(squares);
    function handleClick(i) {
        if (squares[i] || winner) {
            return;
        }
        
        // AIモードでOの手番の場合はクリックを無視
        if (isAIMode && !xIsNext) {
            return;
        }
        
        const nextSquares = squares.slice();
        nextSquares[i] = xIsNext ? "X" : "O";
        onPlay(nextSquares, i);
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

function Header({ user, onProfileClick, onLogout, displayName, showDropdown, onToggleDropdown }) {
    return (
        <header className="header">
            <h1>Tic Tac Toe</h1>
            {user && (
                <div className="header-user-info">
                    <span className="header-user-name">
                        {displayName || user.email}
                    </span>
                    <div className="settings-dropdown">
                        <button 
                            className="settings-dropdown-button" 
                            onClick={onToggleDropdown}
                            title="設定"
                        >
                            ⚙️
                        </button>
                        {showDropdown && (
                            <div className="settings-dropdown-menu">
                                <button 
                                    className="dropdown-item" 
                                    onClick={onProfileClick}
                                >
                                    👤 プロフィール設定
                                </button>
                                <div className="dropdown-divider"></div>
                                <button 
                                    className="dropdown-item logout-item" 
                                    onClick={onLogout}
                                >
                                    🚪 ログアウト
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
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
    const [gameStartTime, setGameStartTime] = useState(null);
    const [currentPlayTime, setCurrentPlayTime] = useState(0);
    const [isAIMode, setIsAIMode] = useState(false);
    const [aiDifficulty, setAiDifficulty] = useState('normal');
    const [gameEnded, setGameEnded] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const [showSettingsDialog, setShowSettingsDialog] = useState(false);
    const [showProfileDialog, setShowProfileDialog] = useState(false);
    const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
    const xIsNext = currentMove % 2 === 0;
    const currentSquares = history[currentMove].squares;
    
    const { user, signOut } = useAuth();
    const { stats, saveGame } = useGameData();
    const { profile, saveProfile, loading: profileLoading } = useProfile();
    
    // 現在のゲーム時間を1秒ごとに更新（ゲーム開始後、終了時は停止）
    useEffect(() => {
        if (!gameStarted || gameEnded || !gameStartTime) return;
        
        const timer = setInterval(() => {
            setCurrentPlayTime(Math.floor((Date.now() - gameStartTime) / 1000));
        }, 1000);
        
        return () => clearInterval(timer);
    }, [gameStartTime, gameEnded, gameStarted]);
    
    // AIの手番処理（ゲーム開始後のみ）
    useEffect(() => {
        if (gameStarted && isAIMode && !xIsNext && currentMove === history.length - 1) {
            const [winner] = calculateWinner(currentSquares);
            if (!winner && currentSquares.includes(null)) {
                const timer = setTimeout(() => {
                    const aiMove = getAIMove([...currentSquares], aiDifficulty);
                    if (aiMove !== null) {
                        const nextSquares = [...currentSquares];
                        nextSquares[aiMove] = 'O';
                        handlePlay(nextSquares, aiMove);
                    }
                }, 500);
                
                return () => clearTimeout(timer);
            }
        }
    }, [gameStarted, isAIMode, xIsNext, currentSquares, currentMove, history.length, aiDifficulty]);

    function handlePlay(nextSquares, position) {
        // ゲーム未開始の場合は何もしない
        if (!gameStarted) return;
        
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
            setGameEnded(true);
            const durationSeconds = Math.floor((Date.now() - gameStartTime) / 1000);
            const finalWinner = winner || 'draw';
            saveGame(finalWinner, nextHistory.length - 1, nextHistory, durationSeconds);
        }
    }

    function jumpTo(nextMove) {
        setCurrentMove(nextMove);
    }

    function startGame() {
        setGameStarted(true);
        setGameStartTime(Date.now());
        setCurrentPlayTime(0);
        setGameEnded(false);
    }
    
    function resetGame() {
        setHistory([{ squares: Array(9).fill(null), position: null }]);
        setCurrentMove(0);
        setGameStartTime(null);
        setCurrentPlayTime(0);
        setGameEnded(false);
        setGameStarted(false);
    }
    
    function applySettings(newIsAIMode, newAiDifficulty) {
        setIsAIMode(newIsAIMode);
        setAiDifficulty(newAiDifficulty);
        setShowSettingsDialog(false);
        resetGame();
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
            <div className="mode-info">
                <span>モード: {isAIMode ? `AI対戦 (${aiDifficulty})` : '人対人'}</span>
                <button 
                    className="settings-button" 
                    onClick={() => setShowSettingsDialog(true)}
                    title="設定"
                >
                    ⚙️
                </button>
            </div>
            <p>プレイ時間: {formatPlayTime(currentPlayTime)}</p>
        </div>
    );
    
    // 設定ダイアログコンポーネント
    const SettingsDialog = () => {
        const [tempIsAIMode, setTempIsAIMode] = useState(isAIMode);
        const [tempAiDifficulty, setTempAiDifficulty] = useState(aiDifficulty);
        
        if (!showSettingsDialog) return null;
        
        return (
            <div className="dialog-overlay" onClick={() => setShowSettingsDialog(false)}>
                <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
                    <h3>対戦モード設定</h3>
                    <div className="dialog-body">
                        <div className="mode-selection">
                            <label>
                                <input
                                    type="radio"
                                    name="gameMode"
                                    checked={!tempIsAIMode}
                                    onChange={() => setTempIsAIMode(false)}
                                />
                                人対人
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="gameMode"
                                    checked={tempIsAIMode}
                                    onChange={() => setTempIsAIMode(true)}
                                />
                                AI対戦
                            </label>
                        </div>
                        {tempIsAIMode && (
                            <div className="difficulty-selection">
                                <label>難易度:</label>
                                <select
                                    value={tempAiDifficulty}
                                    onChange={(e) => setTempAiDifficulty(e.target.value)}
                                >
                                    <option value="easy">簡単</option>
                                    <option value="normal">普通</option>
                                    <option value="hard">難しい</option>
                                </select>
                            </div>
                        )}
                    </div>
                    <div className="dialog-buttons">
                        <button 
                            className="cancel-button" 
                            onClick={() => setShowSettingsDialog(false)}
                        >
                            キャンセル
                        </button>
                        <button 
                            className="apply-button" 
                            onClick={() => applySettings(tempIsAIMode, tempAiDifficulty)}
                        >
                            適用
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <Header 
                user={user}
                displayName={profile.display_name}
                onProfileClick={() => {
                    setShowProfileDialog(true);
                    setShowSettingsDropdown(false);
                }}
                onLogout={signOut}
                showDropdown={showSettingsDropdown}
                onToggleDropdown={() => setShowSettingsDropdown(!showSettingsDropdown)}
            />
            <div 
                className="game" 
                onClick={() => setShowSettingsDropdown(false)}
            >
                <div className="game-board">
                    <Board
                        xIsNext={xIsNext}
                        squares={currentSquares}
                        currentMove={currentMove}
                        onPlay={handlePlay}
                        isAIMode={isAIMode}
                        aiDifficulty={aiDifficulty}
                    />
                    <div className="board-controls">
                        {!gameStarted ? (
                            <button className="start-button" onClick={startGame}>
                                Start Game
                            </button>
                        ) : (
                            <button className="reset-button" onClick={resetGame}>
                                Reset Game
                            </button>
                        )}
                    </div>
                </div>
                <div className="game-info">
                    <div className="game-settings">
                        <CurrentGameInfo />
                        <StatsDisplay />
                    </div>
                    <div className="game-history">
                        <div className="history-header">
                            <h3>手番履歴</h3>
                            <ToggleButton
                                isAsc={isAsc}
                                onToggle={() => setIsAsc((prev) => !prev)}
                            />
                        </div>
                        <ol reversed={!isAsc}>{orderedMoves}</ol>
                    </div>
                </div>
            </div>
            <Footer />
            <SettingsDialog />
            <ProfileDialog />
        </>
    );
    
    // プロフィールダイアログコンポーネント
    function ProfileDialog() {
        const [tempDisplayName, setTempDisplayName] = useState(profile.display_name || '');
        const [saving, setSaving] = useState(false);
        
        useEffect(() => {
            if (showProfileDialog) {
                setTempDisplayName(profile.display_name || '');
            }
        }, [showProfileDialog, profile.display_name]);
        
        if (!showProfileDialog) return null;
        
        const handleSave = async () => {
            setSaving(true);
            const result = await saveProfile(tempDisplayName.trim());
            setSaving(false);
            
            if (result.success) {
                setShowProfileDialog(false);
            }
        };
        
        return (
            <div className="dialog-overlay" onClick={() => setShowProfileDialog(false)}>
                <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
                    <h3>プロフィール設定</h3>
                    <div className="dialog-body">
                        <div className="profile-field">
                            <label>ユーザー名:</label>
                            <input
                                type="text"
                                value={tempDisplayName}
                                onChange={(e) => setTempDisplayName(e.target.value)}
                                placeholder="ユーザー名を入力"
                                maxLength={50}
                            />
                        </div>
                        <div className="profile-info">
                            <small>メール: {user.email}</small>
                        </div>
                    </div>
                    <div className="dialog-buttons">
                        <button 
                            className="cancel-button" 
                            onClick={() => setShowProfileDialog(false)}
                            disabled={saving}
                        >
                            キャンセル
                        </button>
                        <button 
                            className="apply-button" 
                            onClick={handleSave}
                            disabled={saving || profileLoading}
                        >
                            {saving ? '保存中...' : '保存'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }
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
