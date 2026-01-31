import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, Crown } from 'lucide-react';

export const PricingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div style={{
            minHeight: '100vh',
            background: '#0a0a0a',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4rem 1rem'
        }}>
            <h1 style={{
                fontSize: '3rem',
                fontWeight: '900',
                marginBottom: '1rem',
                textAlign: 'center',
                textTransform: 'uppercase',
                letterSpacing: '2px'
            }}>
                Choose Your <span style={{ color: 'var(--color-primary)' }}>Path</span>
            </h1>
            <p style={{
                color: '#888',
                marginBottom: '4rem',
                fontSize: '1.2rem',
                maxWidth: '600px',
                textAlign: 'center'
            }}>
                Whether you're just starting your ruthless journey or aiming for total domination, we have a tier for you.
            </p>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '2rem',
                width: '100%',
                maxWidth: '900px'
            }}>
                {/* FREE TIER */}
                <div style={{
                    background: 'var(--color-surface-1)',
                    borderRadius: '16px',
                    padding: '2rem',
                    border: '1px solid #333',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative'
                }}>
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Ruthless Rookie</h2>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>Free</div>
                        <p style={{ color: '#888' }}>Forever</p>
                    </div>

                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', flex: 1 }}>
                        <FeatureItem available>Play Ruthless AI with full speed & pressure</FeatureItem>
                        <FeatureItem available>Basic game stats only</FeatureItem>
                        <FeatureItem available>Practice and improve your skill</FeatureItem>
                        <FeatureItem available>Earn experience toward Ruthless Rating</FeatureItem>
                        <FeatureItem available>Ad-supported</FeatureItem>
                        <FeatureItem available={false}>Money modes</FeatureItem>
                        <FeatureItem available={false}>Tournaments or Duels</FeatureItem>
                    </ul>

                    <button
                        onClick={() => navigate('/signup?plan=free')}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            borderRadius: '8px',
                            background: '#333',
                            color: 'white',
                            border: 'none',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            transition: 'background 0.2s'
                        }}
                    >
                        Play Free
                    </button>
                </div>

                {/* PREMIUM TIER */}
                <div style={{
                    background: 'linear-gradient(145deg, #1a1a1a 0%, #0d0d0d 100%)',
                    borderRadius: '16px',
                    padding: '2rem',
                    border: '1px solid var(--color-primary)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    boxShadow: '0 0 30px rgba(220, 38, 38, 0.15)'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: '-12px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'var(--color-primary)',
                        color: 'white',
                        padding: '0.25rem 1rem',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        letterSpacing: '1px'
                    }}>
                        MOST POPULAR
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            Premium <Crown size={20} color="var(--color-primary)" />
                        </h2>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>$5.99</div>
                        <p style={{ color: '#888' }}>per month</p>
                    </div>

                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', flex: 1 }}>
                        <FeatureItem available>Ad-free gameplay</FeatureItem>
                        <FeatureItem available>Advanced game analytics & insights</FeatureItem>
                        <FeatureItem available>Full Ruthless Rating (1700-style skill score)</FeatureItem>
                        <FeatureItem available>Detailed mistake & pressure analysis</FeatureItem>
                        <FeatureItem available>Progress tracking over time</FeatureItem>
                        <FeatureItem available>Unlock Speed Duels & Tournaments</FeatureItem>
                        <FeatureItem available>Priority access to new modes</FeatureItem>
                        <FeatureItem available>Prestige badges & titles</FeatureItem>
                    </ul>

                    <button
                        onClick={() => navigate('/signup?plan=premium')}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            borderRadius: '8px',
                            background: 'var(--color-primary)',
                            color: 'white',
                            border: 'none',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)',
                            transition: 'transform 0.2s'
                        }}
                    >
                        Go Premium
                    </button>
                </div>
            </div>

            <button
                onClick={() => navigate('/')}
                style={{
                    marginTop: '3rem',
                    background: 'transparent',
                    border: 'none',
                    color: '#666',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                }}
            >
                Back to Home
            </button>
        </div>
    );
};

const FeatureItem = ({ children, available = true }: { children: React.ReactNode, available?: boolean }) => (
    <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', opacity: available ? 1 : 0.5 }}>
        {available ? (
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '50%', padding: '2px' }}>
                <Check size={14} color="var(--color-primary)" />
            </div>
        ) : (
            <X size={18} color="#444" />
        )}
        <span style={{ textDecoration: available ? 'none' : 'line-through' }}>{children}</span>
    </li>
);
