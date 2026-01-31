import { Chess, Move } from 'chess.js';

// --- EVALUATION CONSTANTS ---
const MATERIAL_WEIGHTS = {
    p: 100,
    n: 320,
    b: 330,
    r: 500,
    q: 900,
    k: 20000
};

// Piece-Square Tables (PST) - Simplified from standard engines
// Higher numbers = better square for that piece (from White's perspective)
// We will flip these for Black.
const PAWN_PST = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5, 5, 10, 25, 25, 10, 5, 5],
    [0, 0, 0, 20, 20, 0, 0, 0],
    [5, -5, -10, 0, 0, -10, -5, 5],
    [5, 10, 10, -20, -20, 10, 10, 5],
    [0, 0, 0, 0, 0, 0, 0, 0]
];

const KNIGHT_PST = [
    [-50, -40, -30, -30, -30, -30, -40, -50],
    [-40, -20, 0, 0, 0, 0, -20, -40],
    [-30, 0, 10, 15, 15, 10, 0, -30],
    [-30, 5, 15, 20, 20, 15, 5, -30],
    [-30, 0, 15, 20, 20, 15, 0, -30],
    [-30, 5, 10, 15, 15, 10, 5, -30],
    [-40, -20, 0, 5, 5, 0, -20, -40],
    [-50, -40, -30, -30, -30, -30, -40, -50]
];

const BISHOP_PST = [
    [-20, -10, -10, -10, -10, -10, -10, -20],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-10, 0, 5, 10, 10, 5, 0, -10],
    [-10, 5, 5, 10, 10, 5, 5, -10],
    [-10, 0, 10, 10, 10, 10, 0, -10],
    [-10, 10, 10, 10, 10, 10, 10, -10],
    [-10, 5, 0, 0, 0, 0, 5, -10],
    [-20, -10, -10, -10, -10, -10, -10, -20]
];

const ROOK_PST = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [5, 10, 10, 10, 10, 10, 10, 5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [0, 0, 0, 5, 5, 0, 0, 0]
];

const QUEEN_PST = [
    [-20, -10, -10, -5, -5, -10, -10, -20],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-10, 0, 5, 5, 5, 5, 0, -10],
    [-5, 0, 5, 5, 5, 5, 0, -5],
    [0, 0, 5, 5, 5, 5, 0, -5],
    [-10, 5, 5, 5, 5, 5, 0, -10],
    [-10, 0, 5, 0, 0, 0, 0, -10],
    [-20, -10, -10, -5, -5, -10, -10, -20]
];

const KING_PST = [ // Middle game
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-20, -30, -30, -40, -40, -30, -30, -20],
    [-10, -20, -20, -20, -20, -20, -20, -10],
    [20, 20, 0, 0, 0, 0, 20, 20],
    [20, 30, 10, 0, 0, 10, 30, 20]
];

// Reverses array for black
const mirrorPST = (pst: number[][]) => [...pst].reverse();

export class RuthlessEngine {
    private game: Chess;
    private nodesEvaluated: number = 0;

    constructor() {
        this.game = new Chess();
    }

    public getBestMove(fen: string, depth: number = 3): string | null {
        this.game.load(fen);
        this.nodesEvaluated = 0;

        const isWhite = this.game.turn() === 'w';

        // Timer for diagnostics
        const start = performance.now();

        const { move } = this.minimax(depth, -Infinity, Infinity, isWhite);

        const end = performance.now();
        console.log(`Ruthless Calculation: ${(end - start).toFixed(2)}ms | Nodes: ${this.nodesEvaluated} | Move: ${move?.san}`);

        return move ? move.san : null;
    }

    private minimax(depth: number, alpha: number, beta: number, isMaximizing: boolean): { score: number, move: Move | null } {
        this.nodesEvaluated++;

        if (depth === 0 || this.game.isGameOver()) {
            return { score: this.evaluateBoard(), move: null };
        }

        const possibleMoves = this.game.moves({ verbose: true });

        // Simple move ordering: captures and checks first (improvement: sort by capture value)
        possibleMoves.sort((a, b) => {
            if (a.captured && !b.captured) return -1;
            if (!a.captured && b.captured) return 1;
            return 0;
        });

        if (possibleMoves.length === 0) {
            // Checkmate or Stalemate handled by isGameOver above, but double check
            if (this.game.isCheckmate()) {
                return { score: isMaximizing ? -Infinity : Infinity, move: null };
            }
            return { score: 0, move: null }; // Stalemate
        }

        let bestMove: Move | null = null;

        if (isMaximizing) {
            let maxEval = -Infinity;
            for (const move of possibleMoves) {
                this.game.move(move);
                const evaluation = this.minimax(depth - 1, alpha, beta, false).score;
                this.game.undo();

                if (evaluation > maxEval) {
                    maxEval = evaluation;
                    bestMove = move;
                }
                alpha = Math.max(alpha, evaluation);
                if (beta <= alpha) break; // Prune
            }
            return { score: maxEval, move: bestMove };
        } else {
            let minEval = Infinity;
            for (const move of possibleMoves) {
                this.game.move(move);
                const evaluation = this.minimax(depth - 1, alpha, beta, true).score;
                this.game.undo();

                if (evaluation < minEval) {
                    minEval = evaluation;
                    bestMove = move;
                }
                beta = Math.min(beta, evaluation);
                if (beta <= alpha) break; // Prune
            }
            return { score: minEval, move: bestMove };
        }
    }

    private evaluateBoard(): number {
        let totalEvaluation = 0;
        const board = this.game.board();

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece) {
                    // 1. Material score
                    let value = MATERIAL_WEIGHTS[piece.type];

                    // 2. Position score (PST)
                    // Note: board[0][0] is a8. PSTs are defined from White perspective (row 0 is rank 8). 
                    // However, typical PST definition: row 0 is Rank 8. 
                    // Let's ensure alignment. Array index 0 = rank 8. Array index 7 = rank 1.

                    let pstValue = 0;
                    const isWhite = piece.color === 'w';

                    switch (piece.type) {
                        case 'p': pstValue = isWhite ? PAWN_PST[row][col] : mirrorPST(PAWN_PST)[row][col]; break;
                        case 'n': pstValue = isWhite ? KNIGHT_PST[row][col] : mirrorPST(KNIGHT_PST)[row][col]; break;
                        case 'b': pstValue = isWhite ? BISHOP_PST[row][col] : mirrorPST(BISHOP_PST)[row][col]; break;
                        case 'r': pstValue = isWhite ? ROOK_PST[row][col] : mirrorPST(ROOK_PST)[row][col]; break;
                        case 'q': pstValue = isWhite ? QUEEN_PST[row][col] : mirrorPST(QUEEN_PST)[row][col]; break;
                        case 'k': pstValue = isWhite ? KING_PST[row][col] : mirrorPST(KING_PST)[row][col]; break;
                    }

                    value += pstValue;

                    totalEvaluation += isWhite ? value : -value;
                }
            }
        }
        return totalEvaluation;
    }
}
