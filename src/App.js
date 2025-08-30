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
    return <button onClick={onToggle}>{isAsc ? "ASC" : "DESC"}</button>;
}

function formatPosition(position) {
    return ` (${Math.floor(position / 3) + 1}, ${position % 3 + 1})`;
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
