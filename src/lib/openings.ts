/**
 * Chess Opening Detection System
 * 
 * Detects chess openings by matching move sequences against a database
 * of common openings with ECO codes.
 */

export interface Opening {
    eco: string;          // ECO code (e.g., "C50")
    name: string;         // Opening name (e.g., "Italian Game")
    variation: string;    // Variation (e.g., "Giuoco Piano")
    moves: string[];      // Move sequence in SAN format
}

/**
 * Database of common chess openings
 * Top 50 most popular openings with ECO codes
 */
const OPENING_DATABASE: Opening[] = [
    // King's Pawn Openings (C00-C99)
    { eco: 'C50', name: 'Italian Game', variation: 'Giuoco Piano', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5'] },
    { eco: 'C50', name: 'Italian Game', variation: 'Main Line', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4'] },
    { eco: 'C55', name: 'Two Knights Defense', variation: 'Main Line', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6'] },
    { eco: 'C42', name: 'Russian Game', variation: 'Main Line', moves: ['e4', 'e5', 'Nf3', 'Nf6'] },
    { eco: 'C44', name: 'Scotch Game', variation: 'Main Line', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'd4'] },
    { eco: 'C65', name: 'Ruy Lopez', variation: 'Berlin Defense', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'Nf6'] },
    { eco: 'C60', name: 'Ruy Lopez', variation: 'Main Line', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5'] },
    { eco: 'C84', name: 'Ruy Lopez', variation: 'Closed', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7'] },

    // Sicilian Defense (B20-B99)
    { eco: 'B20', name: 'Sicilian Defense', variation: 'Main Line', moves: ['e4', 'c5'] },
    { eco: 'B50', name: 'Sicilian Defense', variation: 'Main Line', moves: ['e4', 'c5', 'Nf3', 'd6'] },
    { eco: 'B90', name: 'Sicilian Defense', variation: 'Najdorf', moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6'] },
    { eco: 'B70', name: 'Sicilian Defense', variation: 'Dragon', moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'g6'] },
    { eco: 'B40', name: 'Sicilian Defense', variation: 'Accelerated Dragon', moves: ['e4', 'c5', 'Nf3', 'Nc6', 'd4', 'cxd4', 'Nxd4', 'g6'] },

    // French Defense (C00-C19)
    { eco: 'C00', name: 'French Defense', variation: 'Main Line', moves: ['e4', 'e6'] },
    { eco: 'C10', name: 'French Defense', variation: 'Main Line', moves: ['e4', 'e6', 'd4', 'd5'] },
    { eco: 'C11', name: 'French Defense', variation: 'Winawer', moves: ['e4', 'e6', 'd4', 'd5', 'Nc3', 'Bb4'] },

    // Caro-Kann Defense (B10-B19)
    { eco: 'B10', name: 'Caro-Kann Defense', variation: 'Main Line', moves: ['e4', 'c6'] },
    { eco: 'B12', name: 'Caro-Kann Defense', variation: 'Advance', moves: ['e4', 'c6', 'd4', 'd5', 'e5'] },
    { eco: 'B18', name: 'Caro-Kann Defense', variation: 'Classical', moves: ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Bf5'] },

    // Queen's Pawn Openings (D00-D99)
    { eco: 'D06', name: "Queen's Gambit", variation: 'Main Line', moves: ['d4', 'd5', 'c4'] },
    { eco: 'D30', name: "Queen's Gambit Declined", variation: 'Main Line', moves: ['d4', 'd5', 'c4', 'e6'] },
    { eco: 'D37', name: "Queen's Gambit Declined", variation: 'Orthodox', moves: ['d4', 'd5', 'c4', 'e6', 'Nf3', 'Nf6', 'Nc3', 'Be7'] },
    { eco: 'D20', name: "Queen's Gambit Accepted", variation: 'Main Line', moves: ['d4', 'd5', 'c4', 'dxc4'] },
    { eco: 'D85', name: 'Grünfeld Defense', variation: 'Main Line', moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'd5'] },

    // Indian Defenses (E00-E99)
    { eco: 'E60', name: "King's Indian Defense", variation: 'Main Line', moves: ['d4', 'Nf6', 'c4', 'g6'] },
    { eco: 'E90', name: "King's Indian Defense", variation: 'Classical', moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6'] },
    { eco: 'E20', name: 'Nimzo-Indian Defense', variation: 'Main Line', moves: ['d4', 'Nf6', 'c4', 'e6', 'Nc3', 'Bb4'] },
    { eco: 'E40', name: 'Nimzo-Indian Defense', variation: 'Rubinstein', moves: ['d4', 'Nf6', 'c4', 'e6', 'Nc3', 'Bb4', 'e3'] },

    // English Opening (A10-A39)
    { eco: 'A10', name: 'English Opening', variation: 'Main Line', moves: ['c4'] },
    { eco: 'A20', name: 'English Opening', variation: 'Symmetrical', moves: ['c4', 'e5'] },
    { eco: 'A30', name: 'English Opening', variation: 'Symmetrical', moves: ['c4', 'c5'] },

    // Réti Opening (A04-A09)
    { eco: 'A04', name: 'Réti Opening', variation: 'Main Line', moves: ['Nf3'] },
    { eco: 'A09', name: 'Réti Opening', variation: 'Accepted', moves: ['Nf3', 'd5', 'c4'] },

    // Other Popular Openings
    { eco: 'A00', name: 'Van\'t Kruijs Opening', variation: 'Main Line', moves: ['e3'] },
    { eco: 'A40', name: 'Modern Defense', variation: 'Main Line', moves: ['d4', 'g6'] },
    { eco: 'B00', name: 'Nimzowitsch Defense', variation: 'Main Line', moves: ['e4', 'Nc6'] },
    { eco: 'B01', name: 'Scandinavian Defense', variation: 'Main Line', moves: ['e4', 'd5'] },
    { eco: 'C20', name: "King's Pawn Game", variation: 'Main Line', moves: ['e4', 'e5'] },
    { eco: 'D00', name: "Queen's Pawn Game", variation: 'Main Line', moves: ['d4', 'd5'] },
    { eco: 'A45', name: 'Indian Defense', variation: 'Main Line', moves: ['d4', 'Nf6'] },
    { eco: 'C30', name: "King's Gambit", variation: 'Main Line', moves: ['e4', 'e5', 'f4'] },
    { eco: 'C33', name: "King's Gambit Accepted", variation: 'Main Line', moves: ['e4', 'e5', 'f4', 'exf4'] },
];

/**
 * Detect the opening from a sequence of moves
 * @param moves - Array of moves in SAN format
 * @returns Opening object or null if not found
 */
export function detectOpening(moves: string[]): Opening | null {
    if (moves.length === 0) return null;

    // Find the longest matching opening
    let bestMatch: Opening | null = null;
    let maxMatchLength = 0;

    for (const opening of OPENING_DATABASE) {
        // Check if the game moves match this opening
        const matchLength = getMatchLength(moves, opening.moves);

        // We need at least 2 moves to match (1 full move)
        if (matchLength >= 2 && matchLength > maxMatchLength) {
            maxMatchLength = matchLength;
            bestMatch = opening;
        }
    }

    return bestMatch;
}

/**
 * Get the number of matching moves between two sequences
 * @param gameMoves - Moves from the game
 * @param openingMoves - Moves from the opening definition
 * @returns Number of matching moves
 */
function getMatchLength(gameMoves: string[], openingMoves: string[]): number {
    const minLength = Math.min(gameMoves.length, openingMoves.length);

    for (let i = 0; i < minLength; i++) {
        if (gameMoves[i] !== openingMoves[i]) {
            return i;
        }
    }

    return minLength;
}

/**
 * Get opening statistics for a player
 * (This will be implemented when we have the database integration)
 */
export interface OpeningStats {
    eco: string;
    name: string;
    games_played: number;
    wins: number;
    losses: number;
    draws: number;
    win_rate: number;
    avg_accuracy: number;
}

/**
 * Format opening for display
 * @param opening - Opening object
 * @returns Formatted string
 */
export function formatOpening(opening: Opening): string {
    if (opening.variation && opening.variation !== 'Main Line') {
        return `${opening.name}: ${opening.variation} (${opening.eco})`;
    }
    return `${opening.name} (${opening.eco})`;
}
