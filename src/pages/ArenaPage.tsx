import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Swords, Trophy, Zap, ArrowLeft } from 'lucide-react';
import heroBg from '../assets/hero-bg.jpg';

export const ArenaPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="landing-container" style={{ overflowX: 'hidden', background: '#000' }}>
            {/* Background Container */}
            <div className="hero-bg-container">
                <img src={heroBg} alt="" className="hero-bg-image" style={{ opacity: 0.15 }} />
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, transparent 0%, #000 90%)' }} />
                {/* Pulsing Light Overlay */}
                <div
                    className="animate-pulse-slow"
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'radial-gradient(circle at center, rgba(220, 38, 38, 0.1) 0%, transparent 60%)',
                        pointerEvents: 'none'
                    }}
                />
            </div>

            {/* Back Button */}
            <nav style={{ display: 'flex', justifyContent: 'flex-start', padding: '1.5rem 2rem', alignItems: 'center', position: 'relative', zIndex: 10 }}>
                <button
                    onClick={() => navigate('/dashboard')}
                    style={{ background: 'transparent', border: '1px solid #333', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <ArrowLeft size={18} />
                    Back to Dashboard
                </button>
            </nav>

            {/* Hero Section with Title */}
            <div className="hero-section" style={{
                textAlign: 'center',
                padding: '2rem 1rem',
                position: 'relative',
                minHeight: '30vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <div className="landing-content-static" style={{ position: 'relative', zIndex: 5 }}>
                    <h1 style={{
                        fontSize: '4rem',
                        fontWeight: '900',
                        fontStyle: 'italic',
                        marginBottom: '1rem',
                        background: 'linear-gradient(to right, #dc2626, #ffffff, #dc2626)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        letterSpacing: '-0.02em'
                    }}>
                        CHOOSE YOUR ARENA
                    </h1>
                    <p style={{ fontSize: '1.1rem', color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                        Select a game mode to begin
                    </p>
                </div>
            </div>

            {/* Arena Cards Grid */}
            <div className="landing-content-reveal features-grid" style={{
                display: 'grid',
                position: 'relative',
                zIndex: 5,
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '2rem',
                padding: '4rem 2rem',
                maxWidth: '1200px',
                margin: '0 auto'
            }}>
                <ArenaCard
                    icon={<Zap size={32} color="var(--color-primary)" />}
                    title="Free Play"
                    desc="Challenge the Ruthless Engine. No rating, just pure chess. Test your skills."
                    onClick={() => navigate('/play')}
                    active={true}
                />
                <ArenaCard
                    icon={<Swords size={32} color="var(--color-primary)" />}
                    title="Duels"
                    desc="1v1 ranked matches against other players. Wager points and climb the global leaderboard."
                    comingSoon={true}
                />
                <ArenaCard
                    icon={<Trophy size={32} color="var(--color-primary)" />}
                    title="Tournaments"
                    desc="High-stakes bracket tournaments. Compete for prize pools and eternal glory."
                    comingSoon={true}
                />
            </div>
        </div>
    );
};

const ArenaCard = ({
    icon,
    title,
    desc,
    onClick,
    active = false,
    comingSoon = false
}: {
    icon: React.ReactNode;
    title: string;
    desc: string;
    onClick?: () => void;
    active?: boolean;
    comingSoon?: boolean;
}) => (
    <div
        className={`glass-card ${active ? 'cursor-pointer' : ''} ${comingSoon ? 'opacity-60 grayscale hover:grayscale-0 hover:opacity-100' : ''}`}
        onClick={onClick}
        style={{
            padding: '2rem',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            textAlign: 'left',
            position: 'relative',
            transition: 'all 0.3s ease'
        }}
    >
        {comingSoon && (
            <div style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                padding: '0.25rem 0.5rem',
                background: 'rgba(234, 179, 8, 0.2)',
                border: '1px solid rgba(234, 179, 8, 0.3)',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                color: '#eab308'
            }}>
                COMING SOON
            </div>
        )}

        <div style={{
            marginBottom: '1rem',
            padding: '0.75rem',
            background: active ? 'rgba(220, 38, 38, 0.1)' : 'rgba(255,255,255,0.05)',
            borderRadius: '12px'
        }}>
            {icon}
        </div>

        <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>{title}</h3>
        <p style={{ color: 'var(--color-text-muted)', lineHeight: '1.6' }}>{desc}</p>

        {active && (
            <div style={{ marginTop: '1rem', opacity: 0, transition: 'opacity 0.3s' }} className="group-hover:opacity-100">
                <span style={{ color: 'var(--color-primary)', fontSize: '0.875rem', fontWeight: 'bold' }}>
                    ENTER ARENA →
                </span>
            </div>
        )}
    </div>
);

export default ArenaPage;
