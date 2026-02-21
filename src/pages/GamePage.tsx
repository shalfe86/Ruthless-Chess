import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Clock, BarChart2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/logo.png';
import { getStockfishEngine } from '../lib/stockfish';
import { createSession, updateSession, createGame, updateGame } from '../lib/database';
import { getRandomTrashTalk } from '../lib/trashTalk';

export const GamePage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [difficulty, setDifficulty] = useState<string | null>(null);
    const username = location.state?.username || 'Anonymous';

    const [game, setGame] = useState(new Chess());
    const [fen, setFen] = useState(game.fen());
    const [playerColor] = useState<'w' | 'b'>('w'); // Player is always white for now

    // Timers (in seconds)
    const [whiteTime, setWhiteTime] = useState(25);
    const [blackTime, setBlackTime] = useState(25);
    const [activeTurn, setActiveTurn] = useState<'w' | 'b'>('w');
    const [gameOver, setGameOver] = useState(false);
    const [gameResult, setGameResult] = useState<{ title: string, subtitle: string, type: 'win' | 'loss' | 'draw' } | null>(null);
    const [gameStarted, setGameStarted] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [sessionRecord, setSessionRecord] = useState({ wins: 0, losses: 0, draws: 0 });

    // Local session tracking
    const [moveHistory, setMoveHistory] = useState<string[]>([]);

    // Database tracking
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [currentGameId, setCurrentGameId] = useState<string | null>(null);
    const gameStartTimeRef = useRef<Date | null>(null);

    const timerRef = useRef<number | null>(null);
    const moveListRef = useRef<HTMLDivElement>(null);

    // Init engine on mount
    useEffect(() => {
        const engine = getStockfishEngine();
        engine.initialize().catch(e => console.error("Failed to init Stockfish on mount:", e));
    }, []);

    // Auto-scroll move list
    useEffect(() => {
        if (moveListRef.current) {
            moveListRef.current.scrollTop = moveListRef.current.scrollHeight;
        }
    }, [moveHistory]);

    useEffect(() => {
        if (gameOver || !gameStarted) return;

        timerRef.current = window.setInterval(() => {
            if (activeTurn === 'w') {
                setWhiteTime(t => {
                    if (t <= 0.1) {
                        // Player ran out of time - AI trash talk!
                        endGame("TIME'S UP", getRandomTrashTalk('loss'), 'loss');
                        return 0;
                    }
                    return t - 0.1;
                });
            } else {
                setBlackTime(t => {
                    if (t <= 0.1) {
                        // AI ran out of time - Player wins!
                        endGame("TIME FAULT", getRandomTrashTalk('win'), 'win');
                        return 0;
                    }
                    return t - 0.1;
                });
            }
        }, 100);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [activeTurn, gameOver, gameStarted]);

    const endGame = async (title: string, subtitle: string, type: 'win' | 'loss' | 'draw') => {
        setGameOver(true);
        setGameResult({ title, subtitle, type });
        setShowModal(true); // Show result immediately
        if (timerRef.current) clearInterval(timerRef.current);

        const newWins = type === 'win' ? sessionRecord.wins + 1 : sessionRecord.wins;
        const newLosses = type === 'loss' ? sessionRecord.losses + 1 : sessionRecord.losses;
        const newDraws = type === 'draw' ? sessionRecord.draws + 1 : sessionRecord.draws;

        // Update session record
        setSessionRecord({ wins: newWins, losses: newLosses, draws: newDraws });

        if (currentSessionId) {
            await updateSession(currentSessionId, { wins: newWins, losses: newLosses, draws: newDraws });
        }

        // Save final game state to database
        if (currentGameId) {
            await updateGame(currentGameId, {
                status: 'completed',
                result: type
            });
            console.log('✅ Game completed:', currentGameId);
        }
    };

    // ... (other imports)

    // ... (inside component)

    async function makeRuthlessMove(currentGame: Chess) {
        try {
            console.log("🤖 AI thinking...");
            const possibleMoves = currentGame.moves();
            if (currentGame.isGameOver() || currentGame.isDraw() || possibleMoves.length === 0) {
                handleGameOverOutput(currentGame);
                return;
            }

            let depth = 10;
            // Map difficulty to Stockfish depths
            if (difficulty === 'Executioner') {
                depth = 15;
            } else if (difficulty === 'Relentless') {
                depth = 10;
            } else {
                depth = 5;  // Initiate or fallback
            }

            // Use the Engine!
            let moveChoice = null;
            const engine = getStockfishEngine();
            try {
                moveChoice = await engine.getBestMove(currentGame.fen(), { depth });
            } catch (engineError) {
                console.error("Stockfish critical failure:", engineError);
                // Last resort fallback
                const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
                moveChoice = randomMove; // SAN format for random
            }

            const newGame = new Chess(currentGame.fen());
            let move = null;

            if (moveChoice && possibleMoves.includes(moveChoice)) {
                // If fallback generated a SAN string
                move = newGame.move(moveChoice);
            } else if (moveChoice && typeof moveChoice === 'string') {
                // Stockfish returns UCI format (e.g. e2e4 or e7e8q)
                const from = moveChoice.substring(0, 2);
                const to = moveChoice.substring(2, 4);
                const promotion = moveChoice.length === 5 ? moveChoice[4] : undefined;

                try {
                    move = newGame.move({ from, to, promotion });
                } catch (e) {
                    console.error("Error applying UCI move:", moveChoice, e);
                    move = newGame.move(possibleMoves[Math.floor(Math.random() * possibleMoves.length)]);
                }
            } else {
                move = newGame.move(possibleMoves[Math.floor(Math.random() * possibleMoves.length)]);
            }

            setGame(newGame);
            setFen(newGame.fen());
            if (move) {
                setMoveHistory(prev => [...prev, `${move.color === 'w' ? 'White' : 'Black'}: ${move.san}`]);
                console.log(`🤖 AI moved: ${move.san}`);
            }

            // Check if AI just delivered checkmate
            if (newGame.isGameOver()) {
                handleGameOverOutput(newGame);
                return;
            }


            // Increment time for Black (AI), capped at 25s
            const increment = difficulty === 'Executioner' ? 1 : difficulty === 'Relentless' ? 1.5 : 2;
            setBlackTime(t => Math.min(t + increment, 25));
            setActiveTurn('w');
        } catch (error) {
            console.error("FATAL: Error in makeRuthlessMove:", error);
            // Attempt to restore turn to player so game isn't stuck
            setActiveTurn('w');
        }
    }

    function handleGameOverOutput(gameInstance: Chess) {
        if (gameInstance.isCheckmate()) {
            if (gameInstance.turn() === 'w') {
                // AI (Black) won
                endGame("CHECKMATED", getRandomTrashTalk('loss'), 'loss');
            } else {
                // Player (White) won
                endGame("CHECKMATE - YOU WIN", getRandomTrashTalk('win'), 'win');
            }
        } else if (gameInstance.isDraw()) {
            endGame('DRAW', 'Stalemate / Insufficient Material', 'draw');
        }
    }

    const onDrop = React.useCallback(({ sourceSquare, targetSquare }: { sourceSquare: string, targetSquare: string | null }) => {
        if (gameOver || activeTurn !== playerColor || !targetSquare) return false;

        const newGame = new Chess(game.fen());

        try {
            const move = newGame.move({
                from: sourceSquare,
                to: targetSquare,
                promotion: 'q', // Always promote to queen for simplicity
            });

            if (move === null) return false;

            console.log(`👤 Player moved: ${move.san}`);

            // Create game record on first move (async, non-blocking)
            if (!gameStarted) {
                setGameStarted(true);
                gameStartTimeRef.current = new Date();

                // Create game and session (async)
                (async () => {
                    let sessionId = currentSessionId;

                    if (!sessionId) {
                        const sessionRecord = await createSession({ username });
                        if (sessionRecord) {
                            sessionId = sessionRecord.id;
                            setCurrentSessionId(sessionId);
                            console.log('👤 Session created:', sessionId);
                        }
                    }

                    const gameRecord = await createGame({
                        session_id: sessionId,
                        username: username,
                        difficulty: difficulty || 'Initiate',
                        status: 'active',
                        result: null
                    });

                    if (gameRecord) {
                        setCurrentGameId(gameRecord.id);
                        console.log('🎮 Game Started:', gameRecord.id);
                    }
                })().catch(e => console.error("Game/Move creation error:", e));
            }

            setGame(newGame);
            setFen(newGame.fen());
            setMoveHistory(prev => [...prev, `${move.color === 'w' ? 'White' : 'Black'}: ${move.san}`]);

            // Increment time for White (Player), capped at 25s
            const increment = difficulty === 'Executioner' ? 1 : difficulty === 'Relentless' ? 1.5 : 2;
            setWhiteTime(t => Math.min(t + increment, 25));
            setActiveTurn('b');

            if (newGame.isGameOver()) {
                if (newGame.isCheckmate()) {
                    // If game is over after player's move, player checkmated the AI
                    endGame("CHECKMATE - YOU WIN", getRandomTrashTalk('win'), 'win');
                } else {
                    endGame('DRAW', 'Stalemate / Repetition', 'draw');
                }
                return true;
            }

            // AI Response (Simulated "Ruthless" speed - immediate)
            setTimeout(() => makeRuthlessMove(newGame), 100);

            return true;
        } catch (error) {
            console.error("Move drop error:", error);
            return false;
        }
    }, [game, gameOver, activeTurn, playerColor, gameStarted, currentGameId, whiteTime, difficulty, username, currentSessionId]);

    const handleRematch = () => {
        setGame(new Chess());
        setFen(new Chess().fen());
        setWhiteTime(25);
        setBlackTime(25);
        setActiveTurn('w');
        setGameOver(false);
        setGameResult(null);
        setGameStarted(false);
        setShowModal(false);
        setMoveHistory([]);
        setCurrentGameId(null);
        gameStartTimeRef.current = null;
    };

    // Media query hook
    const isMobile = useMedia('(max-width: 768px)');

    // Dynamic styles based on screen size
    const containerStyle: React.CSSProperties = isMobile ? {
        minHeight: '100vh', // use minHeight to allow scrolling
        width: '100vw',
        background: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        padding: '1rem',
        gap: '1rem',
        paddingTop: '3.5rem' // space for leave button
    } : {
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: '#0a0a0a',
        display: 'grid',
        gridTemplateColumns: 'minmax(280px, 300px) 1fr minmax(280px, 300px)',
        gap: '1.5rem',
        padding: '1.5rem',
        position: 'relative'
    };

    const boardSize = isMobile ? 'min(90vw, 90vw)' : '60vh';

    return (
        <div style={containerStyle}>
            {/* Quit Button - positioned slightly differently on mobile */}
            <button
                onClick={() => navigate('/')}
                style={{
                    position: isMobile ? 'absolute' : 'absolute',
                    top: isMobile ? '0.5rem' : '1rem',
                    left: isMobile ? '0.5rem' : 'auto', // Top left on mobile
                    right: isMobile ? 'auto' : '1rem',
                    padding: '0.4rem 0.8rem',
                    fontSize: isMobile ? '0.8rem' : '1rem',
                    background: 'transparent',
                    border: '1px solid #444',
                    color: '#fff',
                    cursor: 'pointer',
                    zIndex: 100
                }}
            >
                ← Home
            </button>

            {/* Left Panel: Opponent Info & Analytics - Mobile: Collapsible or Stacked? Stacked for now, simplified */}
            {!isMobile && (
                <div className="panel" style={panelStyle}>
                    <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                        <img src={logo} alt="Ruthless Chess" style={{ width: '80%', opacity: 0.9 }} />
                    </div>

                    <div className="opponent-card" style={cardStyle}>
                        <h3>Ruthless AI (Bot)</h3>
                        <div style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>Level {difficulty}</div>
                    </div>

                    <div className="analytics-card" style={{ ...cardStyle, marginTop: 'auto' }}>
                        <h4><BarChart2 size={16} style={{ display: 'inline', marginRight: 8 }} /> Session</h4>
                        <p style={{ fontSize: '0.9rem', color: '#888' }}>Persistent across rematches</p>
                        <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                            <div>Wins: <span style={{ color: '#22c55e', fontWeight: 'bold' }}>{sessionRecord.wins}</span></div>
                            <div>Draws: <span style={{ color: '#aaa', fontWeight: 'bold' }}>{sessionRecord.draws}</span></div>
                            <div>Losses: <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{sessionRecord.losses}</span></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Header: Opponent Info */}
            {isMobile && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', padding: '0 0.5rem' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Vs. Ruthless AI</div>
                </div>
            )}


            {/* Center: Board */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: isMobile ? 'flex-start' : 'center',
                position: 'relative',
                height: isMobile ? 'auto' : '100%'
            }}>

                {difficulty === null && (
                    <div style={{
                        position: 'absolute',
                        zIndex: 200,
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.85)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(5px)'
                    }}>
                        <h2 style={{ color: 'white', marginBottom: '2rem', fontSize: '2rem' }}>Select AI Strength</h2>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                            <button onClick={() => setDifficulty('Initiate')} style={{ padding: '1rem 2rem', fontSize: '1.2rem', background: 'transparent', border: '1px solid #444', color: '#ccc', cursor: 'pointer', borderRadius: '8px' }}>Initiate</button>
                            <button onClick={() => setDifficulty('Relentless')} style={{ padding: '1rem 2rem', fontSize: '1.2rem', background: 'var(--color-primary)', color: 'white', border: 'none', boxShadow: 'var(--shadow-glow)', cursor: 'pointer', borderRadius: '8px', fontWeight: 'bold' }}>Relentless</button>
                            <button onClick={() => setDifficulty('Executioner')} style={{ padding: '1rem 2rem', fontSize: '1.2rem', background: 'transparent', border: '1px solid #dc2626', color: '#dc2626', cursor: 'pointer', borderRadius: '8px' }}>Executioner</button>
                        </div>
                    </div>
                )}

                {difficulty !== null && !gameStarted && !gameOver && (
                    <div style={{
                        position: 'absolute',
                        zIndex: 10,
                        top: '45%',
                        pointerEvents: 'none',
                        background: 'rgba(0,0,0,0.6)',
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        border: '1px solid var(--color-primary)',
                        color: 'white',
                        fontWeight: 'bold',
                        animation: 'fadeInDelay 0.5s ease-out'
                    }}>
                        Make a move to start
                    </div>
                )}

                {gameOver && !showModal && (
                    <button
                        onClick={() => setShowModal(true)}
                        style={{
                            position: 'absolute',
                            zIndex: 100,
                            top: '45%',
                            padding: '0.8rem 1.5rem',
                            fontSize: '1.2rem',
                            background: 'var(--color-primary)',
                            color: 'white',
                            border: 'none',
                            boxShadow: 'var(--shadow-glow)',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            borderRadius: '8px'
                        }}
                    >
                        Show Results
                    </button>
                )}

                {/* Opponent Timer */}
                <TimerDisplay time={blackTime} isActive={activeTurn === 'b'} label="AI" isMobile={isMobile} />

                <div className="board-container" style={{ width: boardSize, height: boardSize, margin: isMobile ? '1rem 0' : '2rem 0', flexShrink: 0 }}>
                    <Chessboard
                        options={{
                            position: fen,
                            onPieceDrop: onDrop,
                            boardOrientation: "white",
                            darkSquareStyle: { backgroundColor: '#661111' },
                            lightSquareStyle: { backgroundColor: '#e5e5e5' },
                            boardStyle: {
                                borderRadius: '4px',
                                boxShadow: '0 0 20px rgba(0,0,0,0.5)'
                            },
                            squareStyles: (game.isCheck() && activeTurn === playerColor) ? {
                                // Find the player's king square dynamically
                                [game.board().flat().find(p => p && p.type === 'k' && p.color === playerColor)?.square || 'e1']: {
                                    background: 'radial-gradient(circle, rgba(255,0,0,0.8) 0%, rgba(200,0,0,0.4) 100%)',
                                    borderRadius: '50%',
                                    boxShadow: 'inset 0 0 10px rgba(255, 0, 0, 0.8), 0 0 15px red'
                                }
                            } : {}
                        }}
                    />
                </div>

                {/* Player Timer */}
                <TimerDisplay time={whiteTime} isActive={activeTurn === 'w'} label="YOU" isMobile={isMobile} />

                {/* Fading Backdrop (only visible when modal is) */}
                {/* REMOVED: Separate backdrop causing click blocking issues. The Modal below handles its own backdrop. */}

                {showModal && gameResult && (
                    <div className="modal-backdrop" style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.85)',
                        backdropFilter: 'blur(10px)',
                        zIndex: 2000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <div className="modal-content" style={{
                            background: '#111',
                            border: `2px solid ${gameResult.type === 'win' ? '#22c55e' : '#dc2626'}`,
                            padding: '3rem',
                            borderRadius: '16px',
                            textAlign: 'center',
                            maxWidth: '500px',
                            position: 'relative',
                            overflow: 'hidden',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.8)'
                        }}>
                            <h1 style={{
                                fontSize: '2.5rem',
                                color: gameResult.type === 'win' ? '#22c55e' : gameResult.type === 'loss' ? '#dc2626' : '#aaa',
                                marginBottom: '0.5rem',
                                marginTop: 0,
                                textTransform: 'uppercase',
                                letterSpacing: '2px'
                            }}>
                                {gameResult.title}
                            </h1>
                            <h2 style={{
                                fontSize: '1.2rem',
                                fontWeight: '400',
                                lineHeight: '1.5',
                                opacity: 0.9,
                                maxWidth: '80%',
                                margin: '0 auto 1.5rem'
                            }}>
                                {gameResult.subtitle}
                            </h2>

                            <div style={{ position: 'relative' }}>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr 1fr',
                                    gap: '1rem',
                                    marginBottom: '2.5rem',
                                    background: 'rgba(255,255,255,0.05)',
                                    padding: '1rem',
                                    borderRadius: '12px'
                                }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Wins</div>
                                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#22c55e' }}>{sessionRecord.wins}</div>
                                    </div>
                                    <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.1)', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Draws</div>
                                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#aaa' }}>{sessionRecord.draws}</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Losses</div>
                                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626' }}>{sessionRecord.losses}</div>
                                    </div>
                                </div>

                                {/* Grade Display Removed per requirements */}

                            </div>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                                <button
                                    onClick={() => setShowModal(false)}
                                    style={{
                                        fontSize: '1rem',
                                        padding: '0.8rem 2rem',
                                        background: 'transparent',
                                        color: '#ccc',
                                        border: '1px solid #555',
                                        fontWeight: '700',
                                        letterSpacing: '0.5px',
                                        borderRadius: '8px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    VIEW BOARD
                                </button>
                                <button
                                    onClick={handleRematch}
                                    style={{
                                        fontSize: '1rem',
                                        padding: '0.8rem 2rem',
                                        background: gameResult.type === 'win' ? '#22c55e' : gameResult.type === 'loss' ? 'var(--color-primary)' : '#444',
                                        color: 'white',
                                        border: 'none',
                                        fontWeight: '700',
                                        letterSpacing: '0.5px',
                                        borderRadius: '8px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    REMATCH
                                </button>
                                <button
                                    onClick={() => navigate('/')}
                                    style={{
                                        fontSize: '1rem',
                                        padding: '0.8rem 2rem',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: '#aaa',
                                        fontWeight: '500',
                                        borderRadius: '8px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    EXIT
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Panel: Move History / Chat - On mobile, put underneath */}
            <div className="panel" style={{
                ...panelStyle,
                order: isMobile ? 3 : 0, // Flex order
                maxHeight: isMobile ? '200px' : 'none',
                height: isMobile ? 'auto' : '100%',
                flex: isMobile ? 'none' : 1
            }}>
                <h3>Move History</h3>
                <div ref={moveListRef} style={{
                    flex: 1,
                    overflowY: 'auto',
                    minHeight: isMobile ? '100px' : 0,
                    marginTop: '1rem',
                    fontFamily: 'monospace',
                    color: '#aaa',
                    border: '1px solid #333',
                    padding: '0.5rem',
                    borderRadius: '4px',
                }}>
                    {moveHistory.length === 0 ? (
                        <div style={{ padding: '0.5rem', color: '#666' }}>No moves yet...</div>
                    ) : (
                        moveHistory.map((move, index) => (
                            <div key={index} style={{ padding: '0.5rem', background: '#111', marginBottom: 2 }}>
                                {index + 1}. {move}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Mobile Analytics (Replaced with Session Stats) */}
            {isMobile && (
                <div className="analytics-card" style={{ ...cardStyle, order: 4 }}>
                    <h4 style={{ fontSize: '0.9rem' }}><BarChart2 size={14} style={{ display: 'inline', marginRight: 8 }} /> Session</h4>
                    <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                        <div>Wins: <span style={{ color: '#22c55e', fontWeight: 'bold' }}>{sessionRecord.wins}</span></div>
                        <div>Draws: <span style={{ color: '#aaa', fontWeight: 'bold' }}>{sessionRecord.draws}</span></div>
                        <div>Losses: <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{sessionRecord.losses}</span></div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Hook for media query
function useMedia(query: string) {
    const [matches, setMatches] = useState(window.matchMedia(query).matches);

    useEffect(() => {
        const media = window.matchMedia(query);
        if (media.matches !== matches) {
            setMatches(media.matches);
        }
        const listener = () => setMatches(media.matches);
        media.addEventListener('change', listener);
        return () => media.removeEventListener('change', listener);
    }, [query]);

    return matches;
}


const TimerDisplay = React.memo(({ time, isActive, label, isMobile }: { time: number; isActive: boolean; label: string, isMobile?: boolean }) => {
    const minutes = Math.floor(Math.max(0, time) / 60);
    const seconds = Math.floor(Math.max(0, time) % 60);
    const decimal = Math.floor((Math.max(0, time) % 1) * 10);

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: isMobile ? '0.3rem 1rem' : '0.5rem 1.5rem',
            background: isActive ? 'var(--color-surface-2)' : 'transparent',
            borderRadius: '8px',
            border: isActive ? '1px solid var(--color-primary)' : '1px solid transparent',
            width: '100%',
            maxWidth: isMobile ? '90vw' : '400px',
            transition: 'all 0.2s'
        }}>
            <div style={{ fontWeight: 'bold', color: '#888', fontSize: isMobile ? '0.9rem' : '1rem' }}>{label}</div>
            <div style={{
                marginLeft: 'auto',
                fontSize: isMobile ? '1.5rem' : '2rem',
                fontFamily: 'monospace',
                fontWeight: 'bold',
                color: time < 10 ? 'var(--color-primary)' : 'white'
            }}>
                {minutes}:{seconds.toString().padStart(2, '0')}.{decimal}
            </div>
            <Clock size={isMobile ? 16 : 20} color={isActive ? 'var(--color-primary)' : '#444'} />
        </div>
    );
});

const panelStyle: React.CSSProperties = {
    background: 'var(--color-surface-1)',
    borderRadius: '12px',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden'
};

const cardStyle = {
    background: '#000',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1rem'
};
