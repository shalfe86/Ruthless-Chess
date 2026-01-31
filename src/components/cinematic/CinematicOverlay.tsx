import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FrameSequence } from './FrameSequence';

interface CinematicOverlayProps {
    resultType: 'win' | 'loss' | 'draw';
    onFinish: () => void;
}

export const CinematicOverlay: React.FC<CinematicOverlayProps> = ({ resultType, onFinish }) => {
    // Assuming 'win' means the player (User) won. 
    // Need to know WHO won to pick folder. 
    // For now, let's assume resultType 'win' -> White Wins folder, 'loss' -> Black Wins folder.
    // Ideally this should be passed explicitly (e.g. winnerColor: 'white' | 'black')

    // Config
    const whiteFrames = 192; // Based on file list
    const blackFrames = 192; // Assuming symmetrical count, checking safe bet

    // Determine folder
    const isWhiteWin = resultType === 'win';
    const folder = isWhiteWin ? '/cinematic/white' : '/cinematic/black';
    const count = isWhiteWin ? whiteFrames : blackFrames;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 2000,
                    background: 'black', // Solid black background for cinematic
                }}
            >
                <FrameSequence
                    folderPath={folder}
                    frameCount={count}
                    fps={30}
                    onFinish={onFinish}
                />

                {/* Optional Overlay Text - Fade in near end? */}
                {/* 
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 4, duration: 1 }}
                    className="absolute bottom-10 left-0 w-full text-center text-white text-4xl font-bold tracking-[1rem] uppercase"
                >
                    {resultType === 'win' ? 'Victory' : 'Defeat'}
                </motion.div> 
                */}
            </motion.div>
        </AnimatePresence>
    );
};
