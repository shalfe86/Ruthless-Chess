import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swords, Crown, Zap } from 'lucide-react';
import logo from '../assets/logo.png';
import heroBg from '../assets/hero-bg.jpg';

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const [showUsernameInput, setShowUsernameInput] = useState(false);
    const [username, setUsername] = useState(() => localStorage.getItem('ruthless_username') || '');

    return (
        <div className="landing-container" style={{ overflowX: 'hidden', background: '#000' }}>

            {/* Background Container */}
            <div className="hero-bg-container">
                <img src={heroBg} alt="" className="hero-bg-image" style={{ opacity: 0.8 }} />
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, transparent 0%, #000 90%)' }} />
            </div>

            <nav style={{ display: 'flex', justifyContent: 'flex-end', padding: '1.5rem 2rem', alignItems: 'center', position: 'relative', zIndex: 10 }}>
                {/* Empty nav for future expansion */}
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
                        The fastest, most brutal chess platform. 25-second blitz matches against an unforgiving AI.
                    </p>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', minHeight: '60px' }}>
                        {!showUsernameInput ? (
                            <>
                                <button
                                    onClick={() => navigate('/game', { state: { username: 'Anonymous' } })}
                                    style={{
                                        padding: '1rem 2rem',
                                        fontSize: '1.2rem',
                                        background: 'transparent',
                                        border: '1px solid #444',
                                        color: '#ccc',
                                        cursor: 'pointer',
                                        borderRadius: '8px',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    Just Play
                                </button>
                                <button
                                    onClick={() => setShowUsernameInput(true)}
                                    style={{
                                        padding: '1rem 2rem',
                                        fontSize: '1.2rem',
                                        background: 'var(--color-primary)',
                                        color: 'white',
                                        border: 'none',
                                        boxShadow: 'var(--shadow-glow)',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        borderRadius: '8px'
                                    }}
                                >
                                    Play with Username
                                </button>
                            </>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '400px' }}>
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        const finalName = username.trim();
                                        if (finalName) {
                                            localStorage.setItem('ruthless_username', finalName);
                                        }
                                        navigate('/game', { state: { username: finalName || 'Anonymous' } });
                                    }}
                                    style={{ display: 'flex', gap: '1rem', width: '100%' }}
                                >
                                    <input
                                        type="text"
                                        placeholder="Enter username..."
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        autoFocus
                                        maxLength={20}
                                        style={{
                                            flex: 1,
                                            padding: '1rem',
                                            fontSize: '1.2rem',
                                            background: 'rgba(255,255,255,0.1)',
                                            border: '1px solid #555',
                                            color: 'white',
                                            borderRadius: '8px',
                                            outline: 'none'
                                        }}
                                    />
                                    <button
                                        type="submit"
                                        style={{
                                            padding: '1rem 2rem',
                                            fontSize: '1.2rem',
                                            background: 'var(--color-primary)',
                                            color: 'white',
                                            border: 'none',
                                            boxShadow: 'var(--shadow-glow)',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            borderRadius: '8px'
                                        }}
                                    >
                                        Start
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowUsernameInput(false)}
                                        style={{
                                            padding: '1rem',
                                            fontSize: '1.2rem',
                                            background: 'transparent',
                                            color: '#aaa',
                                            border: '1px solid #444',
                                            cursor: 'pointer',
                                            borderRadius: '8px'
                                        }}
                                        title="Cancel"
                                    >
                                        X
                                    </button>
                                </form>
                                <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#aaa' }}>
                                    Enter a username to be eligible for <strong>shout-outs</strong> on our social media for your best sessions!
                                </p>
                            </div>
                        )}
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
                    icon={<Crown size={32} color="var(--color-primary)" />}
                    title="Pure AI Gameplay"
                    desc="Challenge the Ruthless Engine. Three difficulties carefully calibrated to crush you."
                />
                <FeatureCard
                    icon={<Swords size={32} color="var(--color-primary)" />}
                    title="Frictionless Play"
                    desc="No accounts. No signups. No wallets. Just instant, brutal chess action."
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
