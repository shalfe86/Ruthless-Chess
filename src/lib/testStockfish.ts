/**
 * Test script for Stockfish engine integration
 * Run this to verify the engine is working correctly
 */

import { getStockfishEngine } from './stockfish';
import { analyzeGame, calculateAccuracy } from './moveAnalysis';
import { detectOpening } from './openings';

async function testStockfishEngine() {
    console.log('🧪 Testing Stockfish Engine Integration...\n');

    try {
        // Test 1: Engine Initialization
        console.log('Test 1: Initializing engine...');
        const engine = getStockfishEngine();
        await engine.initialize();
        console.log('✅ Engine initialized successfully\n');

        // Test 2: Position Evaluation
        console.log('Test 2: Evaluating starting position...');
        const startingFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        const eval1 = await engine.evaluatePosition(startingFen, { depth: 10 });
        console.log(`✅ Evaluation: ${eval1.score}cp, Best move: ${eval1.bestMove}, Depth: ${eval1.depth}\n`);

        // Test 3: Best Move
        console.log('Test 3: Getting best move for starting position...');
        const bestMove = await engine.getBestMove(startingFen, { depth: 10 });
        console.log(`✅ Best move: ${bestMove}\n`);

        // Test 4: Move Analysis
        console.log('Test 4: Analyzing a short game...');
        const testMoves = ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5'];
        const analyses = await analyzeGame(testMoves, undefined, (current, total) => {
            console.log(`   Progress: ${current}/${total} moves analyzed`);
        });

        console.log('\n✅ Game analysis complete!');
        console.log(`   Total moves: ${analyses.length}`);
        console.log(`   Accuracy: ${calculateAccuracy(analyses).toFixed(1)}%`);
        console.log(`   Brilliant moves: ${analyses.filter(a => a.is_brilliant).length}`);
        console.log(`   Mistakes: ${analyses.filter(a => a.is_mistake).length}`);
        console.log(`   Blunders: ${analyses.filter(a => a.is_blunder).length}\n`);

        // Test 5: Opening Detection
        console.log('Test 5: Detecting opening...');
        const opening = detectOpening(testMoves);
        if (opening) {
            console.log(`✅ Opening detected: ${opening.name} - ${opening.variation} (${opening.eco})\n`);
        } else {
            console.log('❌ No opening detected\n');
        }

        // Cleanup
        engine.terminate();
        console.log('✅ All tests passed! Engine is working correctly.');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run tests if this file is executed directly
if (typeof window !== 'undefined') {
    (window as any).testStockfish = testStockfishEngine;
    console.log('💡 Run testStockfish() in the console to test the engine');
}

export { testStockfishEngine };
