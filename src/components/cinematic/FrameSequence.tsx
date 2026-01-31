import React, { useEffect, useRef, useState } from 'react';

interface FrameSequenceProps {
    folderPath: string;
    frameCount: number;
    fps?: number;
    onFinish?: () => void;
    className?: string;
}

export const FrameSequence: React.FC<FrameSequenceProps> = ({
    folderPath,
    frameCount,
    fps = 30,
    onFinish,
    className = ""
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [images, setImages] = useState<HTMLImageElement[]>([]);
    const [loadedCount, setLoadedCount] = useState(0);
    const requestRef = useRef<number>(0);
    const startTimeRef = useRef<number>(0);
    const [isPlaying, setIsPlaying] = useState(false);

    // Preload images
    useEffect(() => {
        const loadedImages: HTMLImageElement[] = [];
        let loaded = 0;

        for (let i = 1; i <= frameCount; i++) {
            const img = new Image();
            // Pad with zeros to 5 digits (e.g., 00001.png) as seen in file list
            const filename = i.toString().padStart(5, '0') + '.png';
            img.src = `${folderPath}/${filename}`;

            img.onload = () => {
                loaded++;
                setLoadedCount(loaded);
                if (loaded === frameCount) {
                    setIsPlaying(true);
                }
            };
            loadedImages.push(img);
        }

        setImages(loadedImages);

        return () => {
            loadedImages.forEach(img => {
                img.onload = null;
                img.src = '';
            });
        };
    }, [folderPath, frameCount]);

    // Animation Loop
    const animate = (time: number) => {
        if (!startTimeRef.current) startTimeRef.current = time;
        const progress = time - startTimeRef.current;

        // Calculate current frame based on time and fps
        const frameIndex = Math.floor((progress / 1000) * fps);

        if (frameIndex < frameCount) {
            const ctx = canvasRef.current?.getContext('2d');
            const img = images[frameIndex];

            if (ctx && img && canvasRef.current) {
                // Clear and draw
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

                // Draw image 'cover' style
                const canvasAspect = canvasRef.current.width / canvasRef.current.height;
                const imgAspect = img.width / img.height;

                let drawWidth, drawHeight, offsetX, offsetY;

                if (canvasAspect > imgAspect) {
                    drawWidth = canvasRef.current.width;
                    drawHeight = canvasRef.current.width / imgAspect;
                    offsetX = 0;
                    offsetY = (canvasRef.current.height - drawHeight) / 2;
                } else {
                    drawWidth = canvasRef.current.height * imgAspect;
                    drawHeight = canvasRef.current.height;
                    offsetX = (canvasRef.current.width - drawWidth) / 2;
                    offsetY = 0;
                }

                ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
            }
            requestRef.current = requestAnimationFrame(animate);
        } else {
            if (onFinish) onFinish();
        }
    };

    useEffect(() => {
        if (isPlaying) {
            requestRef.current = requestAnimationFrame(animate);
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isPlaying]);

    // Handle resize
    useEffect(() => {
        const handleResize = () => {
            if (canvasRef.current) {
                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight;
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Initial size

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (!isPlaying) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-black text-white z-50">
                <div className="text-2xl font-bold tracking-widest animate-pulse">
                    LOADING CINEMATIC {Math.round((loadedCount / frameCount) * 100)}%
                </div>
            </div>
        );
    }

    return (
        <canvas
            ref={canvasRef}
            className={`fixed inset-0 w-full h-full pointer-events-none z-40 bg-black ${className}`}
        />
    );
};
