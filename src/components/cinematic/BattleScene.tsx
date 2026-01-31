import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';

interface BattleSceneProps {
    step: 'transform' | 'slash' | 'finished';
    resultType: 'win' | 'loss' | 'draw';
}

// Realistic Chess King Piece
const ChessKing = ({ color, variant = 'classic', isTop = false, isBottom = false }: { color: string, variant?: 'classic' | 'ruthless', isTop?: boolean, isBottom?: boolean }) => {

    if (variant === 'ruthless') {
        // RUTHLESS VARIANT: Dark, Skeletal, Armored
        const armorColor = "#1a1a1a";
        const glowColor = "#ff0000";

        return (
            <group>
                {/* Base / Bottom Half */}
                {(!isTop) && (
                    <group>
                        {/* Rugged Base */}
                        <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
                            <cylinderGeometry args={[1.1, 1.3, 0.2, 6]} /> {/* Hexagonal base */}
                            <meshStandardMaterial color="#0f0f0f" roughness={0.9} metalness={0.5} />
                        </mesh>
                        <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
                            <cylinderGeometry args={[0.9, 1.1, 0.3, 6]} />
                            <meshStandardMaterial color="#0f0f0f" roughness={0.9} metalness={0.5} />
                        </mesh>

                        {/* Armored Lower Body - Segmented Plates */}
                        <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
                            <cylinderGeometry args={[0.6, 0.85, 0.8, 8]} />
                            <meshStandardMaterial color={armorColor} metalness={0.8} roughness={0.4} />
                        </mesh>
                        <mesh position={[0, 1.4, 0]} castShadow receiveShadow>
                            <cylinderGeometry args={[0.5, 0.65, 0.8, 8]} />
                            <meshStandardMaterial color={armorColor} metalness={0.8} roughness={0.4} />
                        </mesh>
                        {/* Spikes on armor */}
                        <mesh position={[0, 1.1, 0.6]} rotation={[0.5, 0, 0]} castShadow>
                            <coneGeometry args={[0.1, 0.5, 4]} />
                            <meshStandardMaterial color="#333" metalness={0.9} roughness={0.2} />
                        </mesh>
                    </group>
                )}

                {/* Top Half */}
                {(!isBottom) && (
                    <group position={[0, 0, 0]}>
                        {/* Chest / Shoulder Armor */}
                        <mesh position={[0, 2.1, 0]} castShadow receiveShadow>
                            <cylinderGeometry args={[0.5, 0.45, 0.9, 8]} />
                            <meshStandardMaterial color={armorColor} metalness={0.8} roughness={0.4} />
                        </mesh>

                        {/* Pauldrons (Shoulders) */}
                        <mesh position={[0.5, 2.4, 0]} rotation={[0, 0, -0.3]} castShadow>
                            <sphereGeometry args={[0.35, 16, 16]} />
                            <meshStandardMaterial color={armorColor} metalness={0.9} roughness={0.2} />
                        </mesh>
                        <mesh position={[-0.5, 2.4, 0]} rotation={[0, 0, 0.3]} castShadow>
                            <sphereGeometry args={[0.35, 16, 16]} />
                            <meshStandardMaterial color={armorColor} metalness={0.9} roughness={0.2} />
                        </mesh>

                        {/* Head - Skull Shape */}
                        <group position={[0, 3.0, 0]}>
                            <mesh castShadow>
                                <sphereGeometry args={[0.35, 16, 16]} />
                                <meshStandardMaterial color="#bdc3c7" roughness={0.3} metalness={0.5} /> {/* Bone-ish color */}
                            </mesh>
                            {/* Jaw */}
                            <mesh position={[0, -0.2, 0.1]} castShadow>
                                <boxGeometry args={[0.3, 0.25, 0.3]} />
                                <meshStandardMaterial color="#bdc3c7" roughness={0.3} metalness={0.5} />
                            </mesh>

                            {/* GLOWING EYES */}
                            <mesh position={[0.12, 0.05, 0.28]}>
                                <sphereGeometry args={[0.06, 8, 8]} />
                                <meshBasicMaterial color={glowColor} toneMapped={false} />
                                <pointLight distance={1} intensity={2} color={glowColor} />
                            </mesh>
                            <mesh position={[-0.12, 0.05, 0.28]}>
                                <sphereGeometry args={[0.06, 8, 8]} />
                                <meshBasicMaterial color={glowColor} toneMapped={false} />
                                <pointLight distance={1} intensity={2} color={glowColor} />
                            </mesh>
                        </group>

                        {/* Spiky Crown */}
                        <group position={[0, 3.4, 0]}>
                            <mesh castShadow>
                                <cylinderGeometry args={[0.4, 0.35, 0.2, 8]} />
                                <meshStandardMaterial color="#111" metalness={1} roughness={0.1} />
                            </mesh>
                            {/* Crown Spikes */}
                            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                                <mesh key={i} position={[Math.sin(i * Math.PI / 4) * 0.35, 0.3, Math.cos(i * Math.PI / 4) * 0.35]} rotation={[0, 0, 0]}>
                                    <coneGeometry args={[0.06, 0.5, 4]} />
                                    <meshStandardMaterial color="#111" metalness={1} roughness={0.1} />
                                    {/* Glowing tip */}
                                    <mesh position={[0, 0.25, 0]}>
                                        <sphereGeometry args={[0.02, 4, 4]} />
                                        <meshBasicMaterial color={glowColor} />
                                    </mesh>
                                </mesh>
                            ))}
                        </group>
                    </group>
                )}
            </group>
        );
    }

    // CLASSIC VARIANT (Existing code)
    return (
        <group>
            {/* Base / Bottom Half */}
            {(!isTop) && (
                <group>
                    {/* Base platform */}
                    <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
                        <cylinderGeometry args={[1, 1.2, 0.2, 32]} />
                        <meshPhysicalMaterial
                            color={color}
                            metalness={0.1}
                            roughness={0.3}
                            clearcoat={0.8}
                            clearcoatRoughness={0.2}
                        />
                    </mesh>
                    {/* Lower body */}
                    <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
                        <cylinderGeometry args={[0.7, 0.9, 0.6, 32]} />
                        <meshPhysicalMaterial
                            color={color}
                            metalness={0.1}
                            roughness={0.3}
                            clearcoat={0.8}
                        />
                    </mesh>
                    {/* Mid section */}
                    <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
                        <cylinderGeometry args={[0.5, 0.6, 1.2, 32]} />
                        <meshPhysicalMaterial
                            color={color}
                            metalness={0.1}
                            roughness={0.3}
                            clearcoat={0.8}
                        />
                    </mesh>
                </group>
            )}

            {/* Top Half */}
            {(!isBottom) && (
                <group position={[0, 0, 0]}>
                    {/* Neck */}
                    <mesh position={[0, 2.2, 0]} castShadow receiveShadow>
                        <cylinderGeometry args={[0.35, 0.45, 0.8, 32]} />
                        <meshPhysicalMaterial
                            color={color}
                            metalness={0.1}
                            roughness={0.3}
                            clearcoat={0.8}
                        />
                    </mesh>
                    {/* Crown base */}
                    <mesh position={[0, 2.8, 0]} castShadow receiveShadow>
                        <cylinderGeometry args={[0.6, 0.4, 0.4, 32]} />
                        <meshPhysicalMaterial
                            color={color}
                            metalness={0.1}
                            roughness={0.2}
                            clearcoat={1}
                        />
                    </mesh>
                    {/* Crown body */}
                    <mesh position={[0, 3.3, 0]} castShadow receiveShadow>
                        <cylinderGeometry args={[0.5, 0.55, 0.8, 32]} />
                        <meshPhysicalMaterial
                            color={color}
                            metalness={0.1}
                            roughness={0.2}
                            clearcoat={1}
                        />
                    </mesh>
                    {/* Cross - vertical */}
                    <mesh position={[0, 4.2, 0]} castShadow receiveShadow>
                        <boxGeometry args={[0.15, 1.2, 0.15]} />
                        <meshPhysicalMaterial
                            color={color}
                            metalness={0.1}
                            roughness={0.2}
                            clearcoat={1}
                        />
                    </mesh>
                    {/* Cross - horizontal */}
                    <mesh position={[0, 4.5, 0]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
                        <boxGeometry args={[0.15, 0.8, 0.15]} />
                        <meshPhysicalMaterial
                            color={color}
                            metalness={0.1}
                            roughness={0.2}
                            clearcoat={1}
                        />
                    </mesh>
                </group>
            )}
        </group>
    );
};

export const BattleScene: React.FC<BattleSceneProps> = ({ step, resultType }) => {
    const winnerKingRef = useRef<THREE.Group>(null);
    const loserTopRef = useRef<THREE.Group>(null);
    const loserBottomRef = useRef<THREE.Group>(null);
    const swordRef = useRef<THREE.Group>(null);

    useGSAP(() => {
        if (step === 'transform' && winnerKingRef.current) {
            // Reset state
            gsap.set(winnerKingRef.current.position, { x: 4, y: 0.5, z: 0 });
            gsap.set(winnerKingRef.current.rotation, { y: 0 });
            gsap.set(winnerKingRef.current.scale, { x: 0, y: 0, z: 0 });

            const tl = gsap.timeline();

            // Entrance: Scale up and move to center
            tl.to(winnerKingRef.current.scale, {
                x: 0.8, y: 0.8, z: 0.8,
                duration: 1.5,
                ease: "back.out(1.7)"
            })
                .to(winnerKingRef.current.position, {
                    x: 1.8,
                    duration: 1.5,
                    ease: "power2.out"
                }, "<")
                .to(winnerKingRef.current.rotation, {
                    y: Math.PI * 2, // Spin 360
                    duration: 2,
                    ease: "power1.inOut"
                }, "<");

            // Float idle
            gsap.to(winnerKingRef.current.position, {
                y: 0.6,
                duration: 1.5,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
                delay: 1.5
            });
        }

        if (step === 'slash' && winnerKingRef.current && loserTopRef.current && loserBottomRef.current && swordRef.current) {
            const tl = gsap.timeline();

            // 1. Wind up
            tl.to(winnerKingRef.current.rotation, {
                y: Math.PI / 1.5,
                duration: 0.6,
                ease: "power2.in"
            })
                .to(winnerKingRef.current.position, {
                    x: 2.8,
                    duration: 0.6,
                    ease: "power2.in"
                }, "<")
                .to(swordRef.current.rotation, {
                    z: Math.PI / 4,
                    duration: 0.6,
                    ease: "power2.in"
                }, "<")

                // 2. THE STRIKE
                .to(winnerKingRef.current.position, {
                    x: -3,
                    duration: 0.25,
                    ease: "power4.out"
                })
                .to(swordRef.current.rotation, {
                    z: -Math.PI / 1.1,
                    duration: 0.25,
                    ease: "power4.out"
                }, "<")

                // 3. Explosion / Split
                .to(loserTopRef.current.position, {
                    x: -3,
                    y: 2,
                    duration: 1,
                    ease: "power1.out"
                }, "<+=0.05") // Slight delay after impact
                .to(loserTopRef.current.rotation, {
                    x: 1,
                    z: 2,
                    duration: 1,
                    ease: "power1.out"
                }, "<")
                .to(loserBottomRef.current.position, {
                    x: 0.5,
                    duration: 0.5,
                    ease: "power1.out"
                }, "<")
                .to(loserBottomRef.current.rotation, {
                    z: -0.5,
                    duration: 0.5,
                    ease: "power1.out"
                }, "<");
        }
    }, [step]); // Re-run when step changes

    return (
        <>
            {/* Winner King */}
            <group ref={winnerKingRef}>
                <ChessKing
                    color={resultType === 'win' ? '#f5f5dc' : '#2c2c2c'}
                    variant={resultType === 'loss' ? 'ruthless' : 'classic'}
                />
                {/* Realistic Medieval Sword */}
                <group ref={swordRef} position={[0.8, 2.5, 0]} rotation={[0, 0, Math.PI / 4]}>
                    {/* Blade */}
                    <mesh castShadow>
                        <boxGeometry args={[0.08, 4, 0.15]} />
                        <meshPhysicalMaterial
                            color="#c0c0c0"
                            metalness={1}
                            roughness={0.2}
                            clearcoat={1}
                        />
                    </mesh>
                    {/* Crossguard */}
                    <mesh position={[0, -2, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                        <boxGeometry args={[0.15, 1.2, 0.15]} />
                        <meshPhysicalMaterial
                            color="#8b7355"
                            metalness={0.5}
                            roughness={0.4}
                        />
                    </mesh>
                    {/* Handle */}
                    <mesh position={[0, -2.5, 0]} castShadow>
                        <cylinderGeometry args={[0.1, 0.1, 0.8, 16]} />
                        <meshPhysicalMaterial
                            color="#654321"
                            metalness={0}
                            roughness={0.8}
                        />
                    </mesh>
                    {/* Pommel */}
                    <mesh position={[0, -2.95, 0]} castShadow>
                        <sphereGeometry args={[0.15, 16, 16]} />
                        <meshPhysicalMaterial
                            color="#8b7355"
                            metalness={0.5}
                            roughness={0.3}
                        />
                    </mesh>
                </group>
            </group>

            {/* Loser King */}
            <group position={[0, -1, 0]} scale={[0.8, 0.8, 0.8]}>
                <group ref={loserTopRef}>
                    <ChessKing
                        color={resultType === 'win' ? '#2c2c2c' : '#f5f5dc'}
                        isTop={true}
                        variant={resultType === 'win' ? 'ruthless' : 'classic'}
                    />
                </group>
                <group ref={loserBottomRef}>
                    <ChessKing
                        color={resultType === 'win' ? '#2c2c2c' : '#f5f5dc'}
                        isBottom={true}
                        variant={resultType === 'win' ? 'ruthless' : 'classic'}
                    />
                </group>

                {step === 'slash' && (
                    <Sparkles
                        count={300}
                        scale={3}
                        size={10}
                        speed={4}
                        color={resultType === 'win' ? '#00eaff' : '#ff1100'}
                    />
                )}
            </group>
        </>
    );
};
