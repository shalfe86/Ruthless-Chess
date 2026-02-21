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

type CommandTask = {
    type: 'evaluate' | 'uci';
    payload?: any;
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
    internalState?: any;
};

export class StockfishEngine {
    private engine: Worker | null = null;
    private ready: boolean = false;
    private queue: CommandTask[] = [];
    private isProcessing: boolean = false;

    /**
     * Initialize the Stockfish engine
     */
    async initialize(): Promise<void> {
        if (this.engine) return;

        return new Promise((resolve, reject) => {
            try {
                console.log('🧠 Initializing Stockfish engine...');

                // Use local Stockfish.js file (copied from node_modules to public/)
                // This avoids CORS issues with Web Workers
                const worker = new Worker('/stockfish.js');
                this.engine = worker;

                this.engine.onmessage = this.handleEngineMessage.bind(this);
                this.engine.onerror = (err) => {
                    console.error("❌ Stockfish Worker Error:", err);
                    reject(new Error(`Stockfish initialization failed: ${err.message || 'Unknown error'}`));
                };

                // temporary handler for initialization only
                const initHandler = (event: MessageEvent) => {
                    const message = event.data || event;
                    console.log('🧠 Stockfish message:', message);

                    if (typeof message === 'string' && (message === 'uciok' || message.includes('uciok'))) {
                        this.ready = true;
                        this.engine?.removeEventListener('message', initHandler);
                        console.log('✅ Stockfish engine initialized successfully');
                        resolve();
                        this.processQueue();
                    }
                };

                // We need to add the listener specifically for init
                // The main handler `handleEngineMessage` is also active but will ignore messages if no current task
                this.engine.addEventListener('message', initHandler);

                console.log('🧠 Sending UCI command...');
                this.engine.postMessage('uci');

                // Timeout
                setTimeout(() => {
                    if (!this.ready) {
                        console.error('❌ Stockfish initialization timeout');
                        reject(new Error('Stockfish initialization timeout - engine did not respond within 10 seconds'));
                    }
                }, 10000); // Increased to 10s for slower connections
            } catch (error) {
                console.error('❌ Failed to create Stockfish worker:', error);
                reject(error);
            }
        });
    }

    private handleEngineMessage(event: MessageEvent) {
        if (!this.currentTask) return;

        const message = event.data;
        if (typeof message !== 'string') return;

        // Pass message to current task's specific handler logic
        // We accumulate data until the task is "done"
        if (this.currentTask.type === 'evaluate') {
            const task = this.currentTask;
            const evalState = task.internalState as Partial<EngineEvaluation>;

            // Extract evaluation score
            if (message.includes('score cp')) {
                const match = message.match(/score cp (-?\d+)/);
                if (match) evalState.score = parseInt(match[1]);
            }
            if (message.includes('score mate')) {
                const match = message.match(/score mate (-?\d+)/);
                if (match) {
                    const mateIn = parseInt(match[1]);
                    evalState.mate = mateIn;
                    evalState.score = mateIn > 0 ? 10000 : -10000;
                }
            }
            if (message.includes('depth')) {
                const match = message.match(/depth (\d+)/);
                if (match) evalState.depth = parseInt(match[1]);
            }
            if (message.includes('pv')) {
                const pvMatch = message.match(/pv (.+)/);
                if (pvMatch) evalState.pv = pvMatch[1].split(' ');
            }
            if (message.startsWith('bestmove')) {
                const match = message.match(/bestmove (\S+)/);
                if (match) evalState.bestMove = match[1];

                // Task Complete
                task.resolve(evalState as EngineEvaluation);
                this.currentTask = null;
                this.processQueue();
            }
        }
    }

    private currentTask: (CommandTask & { internalState?: any }) | null = null;

    private async processQueue() {
        if (this.isProcessing || this.queue.length === 0 || !this.ready) return;

        this.isProcessing = true;
        const task = this.queue.shift()!;
        this.currentTask = task;

        try {
            if (task.type === 'evaluate') {
                const { fen, depth } = task.payload;
                task.internalState = { score: 0, bestMove: '', depth: 0, pv: [] }; // Reset state
                this.engine?.postMessage(`position fen ${fen}`);
                this.engine?.postMessage(`go depth ${depth}`);
            }
        } catch (err) {
            task.reject(err);
            this.currentTask = null;
            this.processQueue();
        }

        this.isProcessing = false;
    }

    /**
     * Evaluate a chess position
     */
    async evaluatePosition(fen: string, config: EngineConfig = {}): Promise<EngineEvaluation> {
        await this.initialize();

        return new Promise((resolve, reject) => {
            this.queue.push({
                type: 'evaluate',
                payload: { fen, depth: config.depth || 15 },
                resolve,
                reject
            });
            this.processQueue();
        });
    }

    /**
     * Get the best move for a position
     */
    async getBestMove(fen: string, config: EngineConfig = {}): Promise<string> {
        const evaluation = await this.evaluatePosition(fen, config);
        return evaluation.bestMove;
    }

    terminate(): void {
        if (this.engine) {
            this.engine.terminate();
            this.engine = null;
            this.ready = false;
            this.queue = [];
            this.currentTask = null;
            console.log('🧠 Stockfish engine terminated');
        }
    }
}

// Singleton instance for global use
let engineInstance: StockfishEngine | null = null;

export function getStockfishEngine(): StockfishEngine {
    if (!engineInstance) {
        engineInstance = new StockfishEngine();
    }
    return engineInstance;
}
