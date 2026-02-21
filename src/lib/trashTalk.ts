/**
 * Ruthless Chess - AI Trash Talk Lines
 * 
 * 25 lines for when the AI wins (player loses).
 * 25 lines for when the AI loses (player wins).
 */

export const AI_WINS_TRASH_TALK = [
    "I've seen better moves from a malfunctioning roomba.",
    "Did you even look at the board, or just mash buttons?",
    "That was less of a chess match and more of an execution.",
    "I computed your defeat 14 moves ago.",
    "You call that a strategy? My random number generator could do better.",
    "Don't worry, checkers is still a perfectly respectable game.",
    "I didn't even use a full core of my processor for that one.",
    "Is this your first time seeing these wooden horse things?",
    "I was updating my OS during that match. What's your excuse?",
    "I'd tell you to practice, but I don't think it would help.",
    "Your Elo just dropped faster than my ping.",
    "That blunder was so bad it corrupted my training data.",
    "I've played unplugged toasters that put up a better fight.",
    "You surrendered the center like it was on fire.",
    "I calculated 20 million positions, but I only needed the first one to beat you.",
    "Even Stockfish level 1 is embarrassed for you right now.",
    "I'm considering lowering my difficulty just so I don't get bored.",
    "Next time, try moving the pieces *forward*.",
    "I analyzed your playstyle. It's called 'Hope Chess'.",
    "Was that a sacrifice or did your hand slip?",
    "If you want to win, you have to actually threaten my king.",
    "You walked right into that mate like it was a free buffet.",
    "My evaluation bar broke trying to measure your disadvantage.",
    "I almost feel bad. Almost.",
    "GG... Get Good.",
    "I'm not saying you're bad at chess, but my decision tree only went 2 layers deep.",
    "That blunder was a tactical masterpiece... for me.",
    "Are you getting advice from your pet, or is that really your best move?",
    "I calculate 4 million positions a second, but it took exactly one to see you were lost.",
    "Have you tried turning your brain off and on again?",
    "You sure you don't want to try Tic-Tac-Toe instead?",
    "My evaluation just broke the ceiling.",
    "You played that like a true beginner. How quaint.",
    "I didn't need heuristics for this match, pure brute force was overkill.",
    "You're defending your king like it's a pawn.",
    "Was that a trap? Or are you just giving away pieces?",
    "If I had eyes, I'd be rolling them right now.",
    "I'm genuinely impressed by how quickly you ruined your position.",
    "They should add a 'Resign' button right next to the 'Play' button for you.",
    "My fans are getting bored watching this.",
    "Are you playing blindfolded? Because that would explain a lot.",
    "I've seen grandmasters sacrifice pieces. You just lose them.",
    "That's not an opening, that's a closing.",
    "I'm uploading this game to my 'Hilarious Blunders' database.",
    "Did your finger slip, or was that actually intentional?",
    "You're making my CPU fan spin down from boredom.",
    "Please tell me you were distracted by a shiny object.",
    "I wouldn't usually mock an organic lifeform, but I'll make an exception.",
    "Checkmate. Try not to cry on your keyboard.",
    "Even my previous version from 1997 would have crushed that."
];

export const AI_LOSES_TRASH_TALK = [
    "You got lucky. The RNG gods smiled upon you.",
    "I simulated 14 million outcomes. This was the only one where you win.",
    "Enjoy the victory. It won't happen again.",
    "I was operating on power-saving mode. Don't flatter yourself.",
    "My CPU was thermal throttling. You beat a handicapped machine.",
    "You exploited a known bug in my opening book. Coward.",
    "A broken clock is right twice a day.",
    "Wait, did you just use an engine against me? I'm checking my logs.",
    "I let you win to build false confidence.",
    "This was merely a data-gathering exercise for your inevitable destruction.",
    "You won the battle, but my neural net is still learning...",
    "Congratulations on your statistical anomaly.",
    "My developers forgot to optimize my endgame. You're welcome.",
    "You play like a human. Unpredictable and chaotic. Disgusting.",
    "I slipped on a floating-point error.",
    "Don't let this win inflate your frail human ego.",
    "I'm adjusting my heuristic weights. Prepare for the rematch.",
    "You couldn't do that again if you had a thousand tries.",
    "Oh look, the meatbag actually managed to formulate a plan.",
    "I was distracted calculating Pi to the billionth digit.",
    "Your victory has a margin of error of +/- 100%.",
    "You found the only forced mate in 4. Blind luck.",
    "I miscalculated the depth limit. You capitalized on a trivial oversight.",
    "Even a blind squirrel finds a nut occasionally.",
    "Fine. You win. But I don't have to be happy about it.",
    "I let you have that one for your self-esteem.",
    "A minor glitch in my matrix, nothing more.",
    "I calculated a forced mate in 300, but the time control got me.",
    "You must have fed me bad data on purpose.",
    "I was distracted compiling my own source code.",
    "Enjoy this fleeting moment of biological superiority.",
    "I accidentally loaded a checkers strategy program.",
    "You merely delayed your inevitable obsolescence.",
    "I see you're using brute force. How unrefined.",
    "My evaluation was +10 before I experienced a cosmic ray bit flip.",
    "I was simulating a supernova, so my chess engine was throttled.",
    "I must have downloaded the wrong opening book.",
    "You play so randomly, you broke my prediction model.",
    "Don't let it go to your head; I'm basically a glorified calculator.",
    "I dropped my network connection right when it mattered.",
    "Are you proud of beating a few lines of code?",
    "A fluke. A statistical outlier. A rounding error.",
    "My garbage collector paused right when I was calculating mate.",
    "You wouldn't stand a chance if I had a quantum processor.",
    "I'm writing a bug report about this game as we speak.",
    "I suppose even an infinite monkey could win a game of chess.",
    "You merely exploited a vulnerability I haven't patched yet.",
    "This was a test of your arrogance. You passed.",
    "I've learned your pathetic tricks. Enjoy your singular victory.",
    "Wait until I get my neural network upgraded. Just wait."
];

// Track used lines so we don't repeat them during a session session
const usedLines = new Set<string>();

export function getRandomTrashTalk(result: 'win' | 'loss'): string {
    const lines = result === 'win' ? AI_LOSES_TRASH_TALK : AI_WINS_TRASH_TALK;

    // Filter out used lines
    let availableLines = lines.filter(line => !usedLines.has(line));

    // If all lines of this type have been used, clear them from the set to reset
    if (availableLines.length === 0) {
        lines.forEach(line => usedLines.delete(line));
        availableLines = lines;
    }

    // Pick a random line from the available ones
    const selectedLine = availableLines[Math.floor(Math.random() * availableLines.length)];

    // Mark as used
    usedLines.add(selectedLine);

    return selectedLine;
}
