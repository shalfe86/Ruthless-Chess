import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Clock, BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import { RuthlessEngine } from '../lib/RuthlessEngine';
import { createGame, updateGame, createMove, formatMoveForDatabase } from '../lib/database';
import { supabase } from '../lib/supabase';
import { calculateGameAnalytics, updatePlayerAnalytics, updatePlayerRating } from '../lib/analytics';
import { analyzeSingleMove, type MoveAnalysis } from '../lib/moveAnalysis';

const engine = new RuthlessEngine();

export const GamePage: React.FC = () => {
    const navigate = useNavigate();
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
    // const [showCinematic, setShowCinematic] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // Analytics stub
    const [moveHistory, setMoveHistory] = useState<string[]>([]);
    const [liveAnalysis, setLiveAnalysis] = useState<MoveAnalysis[]>([]);
    console.log(liveAnalysis); // Keep unused variable for debugging/future use
    const [liveStats, setLiveStats] = useState({
        accuracy: 0,
        mistakes: 0,
        blunders: 0,
        brilliant: 0
    });

    // Database tracking
    const [currentGameId, setCurrentGameId] = useState<string | null>(null);
    const [moveCount, setMoveCount] = useState(0);
    const gameStartTimeRef = useRef<Date | null>(null);

    const timerRef = useRef<number | null>(null);
    const moveListRef = useRef<HTMLDivElement>(null);

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
                        const timeoutTrashTalk = [
                            "Too slow! Did you fall asleep?",
                            "Time's up, slowpoke! Maybe set an alarm next time?",
                            "You ran out of time! I've seen sloths move faster!",
                            "Tick tock, you lose! Should've thought faster!",
                            "Out of time AND out of luck! Classic!"
                        ];
                        endGame("TIME'S UP", timeoutTrashTalk[Math.floor(Math.random() * timeoutTrashTalk.length)], 'loss');
                        return 0;
                    }
                    return t - 0.1;
                });
            } else {
                setBlackTime(t => {
                    if (t <= 0.1) {
                        // AI ran out of time - Player wins!
                        const timeoutWinMessages = [
                            "The AI ran out of time! VICTORY IS YOURS!",
                            "Time's up for the AI! You outlasted it!",
                            "The AI couldn't keep up! CONGRATULATIONS!",
                            "AI timed out! You're too RUTHLESS!"
                        ];
                        endGame("TIME FAULT", timeoutWinMessages[Math.floor(Math.random() * timeoutWinMessages.length)], 'win');
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
        // setShowCinematic(true); // DISABLED: Cinematic removed
        setShowModal(true); // Show result immediately
        if (timerRef.current) clearInterval(timerRef.current);

        // Save final game state to database
        if (currentGameId && gameStartTimeRef.current) {
            const endedAt = new Date();
            const durationSeconds = Math.floor((endedAt.getTime() - gameStartTimeRef.current.getTime()) / 1000);

            // Determine result reason based on title
            let resultReason: 'checkmate' | 'timeout' | 'stalemate' | 'insufficient_material' = 'checkmate';
            if (title.includes('TIME')) resultReason = 'timeout';
            else if (title.includes('DRAW')) resultReason = 'stalemate';

            // Determine winner color
            let winnerColor: 'white' | 'black' | null = null;
            if (type === 'win') winnerColor = 'white';
            else if (type === 'loss') winnerColor = 'black';

            await updateGame(currentGameId, {
                ended_at: endedAt.toISOString(),
                duration_seconds: durationSeconds,
                final_fen: game.fen(),
                pgn: game.pgn(),
                total_moves: moveCount,
                result_reason: resultReason,
                winner_color: winnerColor
            });

            console.log('✅ Game saved to database:', currentGameId);

            // Calculate and save analytics
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await calculateGameAnalytics(currentGameId);
                await updatePlayerAnalytics(user.id);
                await updatePlayerRating(user.id, currentGameId, type);
                console.log('📊 Analytics and rating updated');

                // Start engine analysis in background (non-blocking)
                // This will analyze all moves and update with real accuracy
                import('../lib/analytics').then(({ analyzeGameWithEngine }) => {
                    analyzeGameWithEngine(currentGameId).catch((err: Error) => {
                        console.error('Engine analysis failed:', err);
                    });
                });
            }
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

            const fenBefore = currentGame.fen();
            const moveStartTime = Date.now();

            // Use the Engine!
            // We defer to setTimeout in the caller to keep UI snappy, but the valid calc happens here.
            let moveChoice = null;
            try {
                const bestMoveSan = engine.getBestMove(currentGame.fen(), 3); // Depth 3 is good for speed/strength balance
                // Fallback to random if engine returns null
                moveChoice = bestMoveSan || possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
            } catch (engineError) {
                console.error("RuthlessEngine critical failure:", engineError);
                // Last resort fallback
                moveChoice = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
            }

            const newGame = new Chess(currentGame.fen());
            const move = newGame.move(moveChoice);

            setGame(newGame);
            setFen(newGame.fen());
            if (move) {
                setMoveHistory(prev => [...prev, `${move.color === 'w' ? 'White' : 'Black'}: ${move.san}`]);
                console.log(`🤖 AI moved: ${move.san}`);

                // Save AI move to database
                if (currentGameId) {
                    const moveTimeMs = Date.now() - moveStartTime;
                    const moveData = formatMoveForDatabase(
                        currentGameId,
                        Math.floor(moveCount / 2) + 1,
                        move,
                        fenBefore,
                        newGame.fen(),
                        moveTimeMs,
                        Math.floor(blackTime * 1000)
                    );
                    await createMove(moveData);
                    setMoveCount(prev => prev + 1);
                }
            }

            // Check if AI just delivered checkmate
            if (newGame.isGameOver()) {
                handleGameOverOutput(newGame);
                return;
            }

            // Trigger analysis for AI move too
            analyzeSingleMove(moveChoice, fenBefore, newGame.fen()).catch(e => console.error("AI Analysis failed:", e));

            // Increment time for Black (AI), capped at 25s
            setBlackTime(t => Math.min(t + 1, 25));
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
                const aiTrashTalk = [
                    "Did you even try? That was embarrassing!",
                    "I've seen better moves from a toddler!",
                    "You got absolutely DESTROYED! Better luck next time, champ!",
                    "That was brutal... for you! Maybe stick to checkers?",
                    "You just got ROASTED by a bunch of code!"
                ];
                endGame("DEFEAT", aiTrashTalk[Math.floor(Math.random() * aiTrashTalk.length)], 'loss');
            } else {
                // Player (White) won
                const playerWinMessages = [
                    "Absolutely RUTHLESS!",
                    "The AI didn't stand a chance!",
                    "You're a RUTHLESS CHAMPION!",
                    "FLAWLESS VICTORY! The AI is speechless!"
                ];
                endGame("VICTORY", playerWinMessages[Math.floor(Math.random() * playerWinMessages.length)], 'win');
            }
        } else if (gameInstance.isDraw()) {
            endGame('DRAW', 'Stalemate / Insufficient Material', 'draw');
        }
    }

    const onDrop = React.useCallback(({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string | null; piece: { isSparePiece: boolean; position: string; pieceType: string } }) => {
        if (gameOver || activeTurn !== playerColor || !targetSquare) return false;

        const newGame = new Chess(game.fen());
        const fenBefore = game.fen();
        const moveStartTime = Date.now();

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

                // Get current user and create game (async)
                (async () => {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        const gameRecord = await createGame({
                            player_id: user.id,
                            opponent_type: 'ai',
                            opponent_id: null,
                            ai_difficulty: 3, // Default difficulty
                            ai_engine_version: '1.0',
                            time_control_initial: 25,
                            time_control_increment: 1,
                            player_color: 'white',
                            result: 'loss', // Will be updated at end
                            result_reason: null,
                            winner_color: null,
                            total_moves: 0,
                            duration_seconds: null,
                            final_fen: null,
                            pgn: null,
                            analysis_status: 'pending',
                            analysis_completed_at: null,
                            opening_eco: null,
                            opening_name: null,
                            opening_variation: null,
                            started_at: gameStartTimeRef.current!.toISOString(),
                            ended_at: null
                        });

                        if (gameRecord) {
                            setCurrentGameId(gameRecord.id);
                            console.log('🎮 Game created:', gameRecord.id);
                        }
                    }
                })().catch(e => console.error("Game/Move creation error:", e));
            }

            setGame(newGame);
            setFen(newGame.fen());
            setMoveHistory(prev => [...prev, `${move.color === 'w' ? 'White' : 'Black'}: ${move.san}`]);

            // Save move to database (async, non-blocking)
            if (currentGameId) {
                const moveTimeMs = Date.now() - moveStartTime;
                const moveData = formatMoveForDatabase(
                    currentGameId,
                    Math.floor(moveCount / 2) + 1,
                    move,
                    fenBefore,
                    newGame.fen(),
                    moveTimeMs,
                    Math.floor(whiteTime * 1000)
                );
                createMove(moveData).then(() => {
                    setMoveCount(prev => prev + 1);
                }).catch(e => console.error("Move save error:", e));
            }

            // Trigger live analysis (non-blocking)
            analyzeSingleMove(move.san, fenBefore, newGame.fen()).then(analysis => {
                if (analysis) {
                    setLiveAnalysis(prev => {
                        const newAnalysis = [...prev, analysis];
                        // Update stats
                        const mistakes = newAnalysis.filter(a => a.is_mistake).length;
                        const blunders = newAnalysis.filter(a => a.is_blunder).length;
                        const brilliant = newAnalysis.filter(a => a.is_brilliant).length;

                        // Simple accuracy estimate for live view (real one calculated at end)
                        // accuracy = 100 - (avg_cpl / 10)
                        const totalCpl = newAnalysis.reduce((sum, a) => sum + a.centipawn_loss, 0);
                        const accuracy = Math.max(0, Math.min(100, 100 - (totalCpl / newAnalysis.length / 10)));

                        setLiveStats({
                            accuracy: Math.round(accuracy),
                            mistakes,
                            blunders,
                            brilliant
                        });

                        return newAnalysis;
                    });
                }
            }).catch(e => console.error("Live analysis failed:", e));

            // Increment time for White (Player), capped at 25s
            setWhiteTime(t => Math.min(t + 1, 25));
            setActiveTurn('b');

            if (newGame.isGameOver()) {
                if (newGame.isCheckmate()) {
                    // If game is over after player's move, player checkmated the AI
                    const playerWinMessages = [
                        "You're absolutely RUTHLESS!",
                        "The AI bows to your skill!",
                        "You showed no mercy!",
                        "The AI never saw it coming!"
                    ];
                    endGame("CHECKMATE", playerWinMessages[Math.floor(Math.random() * playerWinMessages.length)], 'win');
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
    }, [game, gameOver, activeTurn, playerColor, gameStarted, currentGameId, moveCount, whiteTime]);

    return (
        <div style={{
            height: '100vh',
            width: '100vw',
            overflow: 'hidden',
            background: '#0a0a0a',
            display: 'grid',
            gridTemplateColumns: 'minmax(280px, 300px) 1fr minmax(280px, 300px)',
            gap: '1.5rem',
            padding: '1.5rem',
            position: 'relative'
        }}>
            {/* Quit Button */}
            <button
                onClick={() => navigate('/arena')}
                style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    padding: '0.5rem 1rem',
                    background: 'transparent',
                    border: '1px solid #444',
                    color: '#fff',
                    cursor: 'pointer',
                    zIndex: 100
                }}
            >
                ← Leave Game
            </button>

            {/* Left Panel: Opponent Info & Analytics */}
            <div className="panel" style={panelStyle}>
                <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                    <img src={logo} alt="Ruthless Chess" style={{ width: '80%', opacity: 0.9 }} />
                </div>

                <div className="opponent-card" style={cardStyle}>
                    <h3>Ruthless AI (Bot)</h3>
                    <div style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>Rank: ???</div>
                </div>

                <div className="analytics-card" style={{ ...cardStyle, marginTop: 'auto' }}>
                    <h4><BarChart2 size={16} style={{ display: 'inline', marginRight: 8 }} /> Live Analytics</h4>
                    <p style={{ fontSize: '0.9rem', color: '#888' }}>Real-time engine evaluation</p>
                    <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <div>Accuracy: <span style={{ color: liveStats.accuracy > 80 ? '#22c55e' : liveStats.accuracy > 50 ? '#eab308' : '#ef4444', fontWeight: 'bold' }}>{liveStats.accuracy > 0 ? `${liveStats.accuracy}%` : '-'}</span></div>
                        <div>Brilliant: <span style={{ color: '#22c55e', fontWeight: 'bold' }}>{liveStats.brilliant}</span></div>
                        <div>Mistakes: <span style={{ color: '#eab308', fontWeight: 'bold' }}>{liveStats.mistakes}</span></div>
                        <div>Blunders: <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{liveStats.blunders}</span></div>
                    </div>
                </div>
            </div>

            {/* Center: Board */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', height: '100%' }}>

                {!gameStarted && !gameOver && (
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

                {/* Opponent Timer */}
                <TimerDisplay time={blackTime} isActive={activeTurn === 'b'} label="AI" />

                <div className="board-container" style={{ width: '60vh', height: '60vh', margin: '2rem 0', flexShrink: 0 }}>
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
                            }
                        }}
                    />
                </div>

                {/* Player Timer */}
                <TimerDisplay time={whiteTime} isActive={activeTurn === 'w'} label="YOU" />

                {/* Cinematic Overlay Trigger - DISABLED */}
                {/* {showCinematic && gameResult && (
                    <CinematicOverlay
                        resultType={gameResult.type}
                        onFinish={() => {
                            setShowCinematic(false);
                            setShowModal(true);
                        }}
                    />
                )} */}
                {/* Instead, directly show modal when game ends settings are handled in endGame */}

                {/* Fading Backdrop (only visible when modal is) */}
                {/* REMOVED: Separate backdrop causing click blocking issues. The Modal below handles its own backdrop. */}

                {/* Game Over Modal */}
                {showModal && gameResult && (
                    <div className="modal-backdrop" style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.85)', // Stronger background
                        backdropFilter: 'blur(10px)', // Apply blur here directly
                        zIndex: 2000, // Very high Z-Index
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
                            maxWidth: '500px'
                        }}>
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

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr 1fr 1fr',
                                gap: '1rem',
                                marginBottom: '2.5rem',
                                background: 'rgba(255,255,255,0.05)',
                                padding: '1rem',
                                borderRadius: '12px'
                            }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#888' }}>Accuracy</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: liveStats.accuracy > 80 ? '#22c55e' : '#fff' }}>
                                        {liveStats.accuracy}%
                                    </div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#888' }}>Brilliant</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#22c55e' }}>{liveStats.brilliant}</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#888' }}>Mistakes</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#eab308' }}>{liveStats.mistakes}</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#888' }}>Blunders</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ef4444' }}>{liveStats.blunders}</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                <button
                                    onClick={() => window.location.reload()}
                                    style={{
                                        fontSize: '1rem',
                                        padding: '0.8rem 2rem',
                                        background: gameResult.type === 'win' ? 'var(--color-accent)' : gameResult.type === 'loss' ? 'var(--color-primary)' : '#444',
                                        color: gameResult.type === 'win' ? '#000' : 'white',
                                        border: 'none',
                                        fontWeight: '700',
                                        letterSpacing: '0.5px',
                                        minWidth: '140px'
                                    }}
                                >
                                    REMATCH
                                </button>
                                <button
                                    onClick={() => navigate('/arena')}
                                    style={{
                                        fontSize: '1rem',
                                        padding: '0.8rem 2rem',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: '#aaa',
                                        fontWeight: '500',
                                        minWidth: '140px'
                                    }}
                                >
                                    EXIT
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Panel: Move History / Chat */}
            <div className="panel" style={panelStyle}>
                <h3>Move History</h3>
                <div ref={moveListRef} style={{
                    flex: 1,
                    overflowY: 'auto',
                    minHeight: 0, // Critical for flex scrolling
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
        </div>
    );
};

const TimerDisplay = React.memo(({ time, isActive, label }: { time: number; isActive: boolean; label: string }) => {
    const minutes = Math.floor(Math.max(0, time) / 60);
    const seconds = Math.floor(Math.max(0, time) % 60);
    const decimal = Math.floor((Math.max(0, time) % 1) * 10);

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '0.5rem 1.5rem',
            background: isActive ? 'var(--color-surface-2)' : 'transparent',
            borderRadius: '8px',
            border: isActive ? '1px solid var(--color-primary)' : '1px solid transparent',
            width: '100%',
            maxWidth: '400px',
            transition: 'all 0.2s'
        }}>
            <div style={{ fontWeight: 'bold', color: '#888' }}>{label}</div>
            <div style={{
                marginLeft: 'auto',
                fontSize: '2rem',
                fontFamily: 'monospace',
                fontWeight: 'bold',
                color: time < 10 ? 'var(--color-primary)' : 'white'
            }}>
                {minutes}:{seconds.toString().padStart(2, '0')}.{decimal}
            </div>
            <Clock size={20} color={isActive ? 'var(--color-primary)' : '#444'} />
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
