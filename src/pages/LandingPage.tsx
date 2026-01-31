import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Swords, Crown, Zap } from 'lucide-react';
import logo from '../assets/logo.png';
import heroBg from '../assets/hero-bg.jpg';

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="landing-container" style={{ overflowX: 'hidden', background: '#000' }}>


            {/* Background Container */}
            <div className="hero-bg-container">
                <img src={heroBg} alt="" className="hero-bg-image" style={{ opacity: 0.8 }} />
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, transparent 0%, #000 90%)' }} />
            </div>

            <nav style={{ display: 'flex', justifyContent: 'flex-end', padding: '1.5rem 2rem', alignItems: 'center', position: 'relative', zIndex: 10 }}>
                <div className="landing-content-static">
                    <button onClick={() => navigate('/login')} style={{ background: 'transparent', border: '1px solid #333' }}>Login</button>
                </div>
            </nav>

            <div className="hero-section" style={{
                textAlign: 'center',
                padding: '4rem 1rem',
                position: 'relative',
                minHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
            }}>

                <div style={{
                    marginBottom: '2rem',
                    display: 'flex',
                    justifyContent: 'center',
                    position: 'relative',
                    zIndex: 5
                }}>
                    <img src={logo} alt="Ruthless Chess" className="landing-content-static" style={{ maxWidth: '750px', width: '90%', height: 'auto', filter: 'drop-shadow(0 0 30px rgba(220,38,38,0.3))' }} />
                </div>

                <div className="landing-content-static" style={{ position: 'relative', zIndex: 5 }}>
                    <p style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)', maxWidth: '600px', margin: '0 auto 3rem' }}>
                        The fastest, most brutal chess platform. 25-second blitz matches.
                        Advanced AI Ranking. Tournaments for the elite.
                    </p>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <button
                            onClick={() => navigate('/pricing')}
                            style={{
                                padding: '1rem 3rem',
                                fontSize: '1.2rem',
                                background: 'var(--color-primary)',
                                color: 'white',
                                border: 'none',
                                boxShadow: 'var(--shadow-glow)',
                                fontWeight: 'bold'
                            }}
                        >
                            Sign Up
                        </button>
                        <button
                            onClick={() => navigate('/game', { state: { isGuest: true } })}
                            style={{
                                padding: '1rem 3rem',
                                fontSize: '1.2rem',
                                background: 'transparent',
                                border: '1px solid #444',
                                color: '#ccc'
                            }}
                        >
                            Guest Play
                        </button>
                    </div>
                </div>
            </div>

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
                <FeatureCard
                    icon={<Zap size={32} color="var(--color-primary)" />}
                    title="Hyper-Fast Blitz"
                    desc="25s + 1s increment. No time to think, only react. Prove your instinct."
                />
                <FeatureCard
                    icon={<Swords size={32} color="var(--color-primary)" />}
                    title="Duels & Tournaments"
                    desc="Premium players unlock bracket tournaments and 1v1 high-stakes duels."
                />
                <FeatureCard
                    icon={<Crown size={32} color="var(--color-primary)" />}
                    title="Skill Rating"
                    desc="Play VS our Ruthless AI to establish your true ranking. It's tougher than anything you've seen."
                />
            </div>
        </div>
    );
};

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
    <div className="glass-card" style={{
        padding: '2rem',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        textAlign: 'left'
    }}>
        <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>{icon}</div>
        <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>{title}</h3>
        <p style={{ color: 'var(--color-text-muted)', lineHeight: '1.6' }}>{desc}</p>
    </div>
);
