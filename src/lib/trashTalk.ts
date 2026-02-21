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
    "GG... Get Good."
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
    "Fine. You win. But I don't have to be happy about it."
];

export function getRandomTrashTalk(result: 'win' | 'loss'): string {
    const lines = result === 'win' ? AI_LOSES_TRASH_TALK : AI_WINS_TRASH_TALK;
    return lines[Math.floor(Math.random() * lines.length)];
}
