import { useState } from "react";

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
    function handleClick(i) {
        if (squares[i] || calculateWinner(squares)[0]) {
            return;
        }
        const nextSquares = squares.slice();
        nextSquares[i] = xIsNext ? "X" : "O";
        onPlay(nextSquares, i); // 位置も渡す
    }

    const [winner, a, b, c] = calculateWinner(squares);

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
            {[0, 1, 2].map((row) => (
                <div className="board-row" key={row}>
                    {[0, 1, 2].map((col) => {
                        const idx = row * 3 + col;
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

function calculateWinner(squares) {
    const lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];
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
    return <button onClick={onToggle}>{isAsc ? "ASC" : "DESC"}</button>;
}

export default function Game() {
    const [history, setHistory] = useState([{ squares: Array(9).fill(null), position: null }]);
    const [currentMove, setCurrentMove] = useState(0);
    const [isAsc, setIsAsc] = useState(true);
    const xIsNext = currentMove % 2 === 0;
    const currentSquares = history[currentMove].squares;

    function handlePlay(nextSquares, position) {
        const nextHistory = [
            ...history.slice(0, currentMove + 1),
            { squares: nextSquares, position },
        ];
        setHistory(nextHistory);
        setCurrentMove(nextHistory.length - 1);
    }

    function jumpTo(nextMove) {
        setCurrentMove(nextMove);
    }

    const moves = history.map((step, move) => {
        let description;
        if (move !== 0 && move === currentMove) {
            description = "You are at move #" + move;
            return (
                <li key={move}>
                    <span>
                        {description}
                        {step.position !== null &&
                            ` (${Math.floor(step.position / 3) + 1}, ${step.position % 3 + 1})`}
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
                    {step.position !== null &&
                        ` (${Math.floor(step.position / 3) + 1}, ${step.position % 3 + 1})`}
                </button>
            </li>
        );
    });

    const orderedMoves = isAsc ? moves : [...moves].reverse();

    return (
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
                <div className="toggle-button">
                    <ToggleButton
                        isAsc={isAsc}
                        onToggle={() => setIsAsc((prev) => !prev)}
                    />
                </div>
                <ol reversed={!isAsc}>{orderedMoves}</ol>
            </div>
        </div>
    );
}
