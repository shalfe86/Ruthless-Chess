/**
 * Stockfish Chess Engine Wrapper
 * 
 * Provides a clean Promise-based API for interacting with the Stockfish chess engine.
 * Runs the engine in a Web Worker to prevent blocking the main UI thread.
 */

export interface EngineEvaluation {
    score: number;        // Centipawn score (from white's perspective)
    mate?: number;        // Mate in N moves (if applicable)
    bestMove: string;     // Best move in UCI format (e.g., "e2e4")
    depth: number;        // Search depth reached
    pv?: string[];        // Principal variation (best line)
}

export interface EngineConfig {
    depth?: number;       // Search depth (default: 15)
    timeLimit?: number;   // Time limit in milliseconds (default: 2000)
    threads?: number;     // Number of threads (default: 1)
}

export class StockfishEngine {
    private engine: any = null;
    private ready: boolean = false;
    private initPromise: Promise<void> | null = null;

    /**
     * Initialize the Stockfish engine
     * This is called automatically when needed, but can be called manually for pre-loading
     */
    async initialize(): Promise<void> {
        if (this.ready) return;
        if (this.initPromise) return this.initPromise;

        this.initPromise = new Promise((resolve, reject) => {
            try {
                // Import Stockfish using the correct path
                // The stockfish package exports a function that returns a Worker-like object
                import('stockfish/src/stockfish.js').then((module) => {
                    // The module default export is a function that creates the engine
                    const StockfishConstructor = module.default || module;
                    this.engine = StockfishConstructor();

                    // Wait for engine to be ready
                    this.engine.onmessage = (event: MessageEvent) => {
                        const message = event.data || event;
                        if (message === 'uciok' || message.includes('uciok')) {
                            this.ready = true;
                            console.log('🧠 Stockfish engine initialized');
                            resolve();
                        }
                    };

                    // Initialize UCI protocol
                    this.engine.postMessage('uci');

                    // Timeout after 10 seconds
                    setTimeout(() => {
                        if (!this.ready) {
                            reject(new Error('Stockfish initialization timeout'));
                        }
                    }, 10000);
                }).catch(reject);
            } catch (error) {
                reject(error);
            }
        });

        return this.initPromise;
    }

    /**
     * Evaluate a chess position
     * @param fen - Position in FEN notation
     * @param config - Engine configuration
     * @returns Evaluation with score and best move
     */
    async evaluatePosition(fen: string, config: EngineConfig = {}): Promise<EngineEvaluation> {
        await this.initialize();

        const depth = config.depth || 15;
        const timeLimit = config.timeLimit || 2000;

        return new Promise((resolve, reject) => {
            let evaluation: Partial<EngineEvaluation> = {
                score: 0,
                bestMove: '',
                depth: 0,
                pv: []
            };

            const timeout = setTimeout(() => {
                reject(new Error('Engine evaluation timeout'));
            }, timeLimit + 1000);

            this.engine.onmessage = (event: MessageEvent) => {
                const message = event.data || event;

                // Parse engine output
                if (typeof message === 'string') {
                    // Extract evaluation score
                    if (message.includes('score cp')) {
                        const match = message.match(/score cp (-?\d+)/);
                        if (match) {
                            evaluation.score = parseInt(match[1]);
                        }
                    }

                    // Extract mate score
                    if (message.includes('score mate')) {
                        const match = message.match(/score mate (-?\d+)/);
                        if (match) {
                            evaluation.mate = parseInt(match[1]);
                            // Convert mate to centipawn equivalent (very high/low score)
                            evaluation.score = evaluation.mate > 0 ? 10000 : -10000;
                        }
                    }

                    // Extract depth
                    if (message.includes('depth')) {
                        const match = message.match(/depth (\d+)/);
                        if (match) {
                            evaluation.depth = parseInt(match[1]);
                        }
                    }

                    // Extract principal variation
                    if (message.includes('pv')) {
                        const pvMatch = message.match(/pv (.+)/);
                        if (pvMatch) {
                            evaluation.pv = pvMatch[1].split(' ');
                        }
                    }

                    // Extract best move from final output
                    if (message.startsWith('bestmove')) {
                        const match = message.match(/bestmove (\S+)/);
                        if (match) {
                            evaluation.bestMove = match[1];
                            clearTimeout(timeout);
                            resolve(evaluation as EngineEvaluation);
                        }
                    }
                }
            };

            // Send commands to engine
            this.engine.postMessage(`position fen ${fen}`);
            this.engine.postMessage(`go depth ${depth}`);
        });
    }

    /**
     * Get the best move for a position
     * @param fen - Position in FEN notation
     * @param config - Engine configuration
     * @returns Best move in UCI format
     */
    async getBestMove(fen: string, config: EngineConfig = {}): Promise<string> {
        const evaluation = await this.evaluatePosition(fen, config);
        return evaluation.bestMove;
    }

    /**
     * Analyze a specific move and return its centipawn loss
     * @param fenBefore - Position before the move
     * @param fenAfter - Position after the move
     * @param config - Engine configuration
     * @returns Centipawn loss (positive = worse position)
     */
    async analyzeMove(fenBefore: string, fenAfter: string, config: EngineConfig = {}): Promise<number> {
        // Evaluate position before move
        const evalBefore = await this.evaluatePosition(fenBefore, config);

        // Evaluate position after move
        const evalAfter = await this.evaluatePosition(fenAfter, config);

        // Calculate centipawn loss
        // Note: We need to flip the sign for black's moves
        const isWhiteToMove = fenBefore.split(' ')[1] === 'w';
        const scoreBefore = isWhiteToMove ? evalBefore.score : -evalBefore.score;
        const scoreAfter = isWhiteToMove ? -evalAfter.score : evalAfter.score;

        const centipawnLoss = Math.max(0, scoreBefore - scoreAfter);

        return centipawnLoss;
    }

    /**
     * Terminate the engine and clean up resources
     */
    terminate(): void {
        if (this.engine) {
            this.engine.postMessage('quit');
            this.engine = null;
            this.ready = false;
            this.initPromise = null;
            console.log('🧠 Stockfish engine terminated');
        }
    }

    /**
     * Check if engine is ready
     */
    isReady(): boolean {
        return this.ready;
    }
}

// Singleton instance for global use
let engineInstance: StockfishEngine | null = null;

/**
 * Get the global Stockfish engine instance
 * Creates a new instance if one doesn't exist
 */
export function getStockfishEngine(): StockfishEngine {
    if (!engineInstance) {
        engineInstance = new StockfishEngine();
    }
    return engineInstance;
}

/**
 * Terminate the global engine instance
 */
export function terminateStockfishEngine(): void {
    if (engineInstance) {
        engineInstance.terminate();
        engineInstance = null;
    }
}
