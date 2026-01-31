import React from 'react';
import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PremiumGateProps {
    isPremium: boolean;
    children: React.ReactNode;
    title?: string;
    description?: string;
}

export const PremiumGate: React.FC<PremiumGateProps> = ({ isPremium, children, title = "Premium Feature", description = "Upgrade to unlock this data." }) => {
    const navigate = useNavigate();

    if (isPremium) {
        return <>{children}</>;
    }

    return (
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 'inherit' }}>
            <div style={{ filter: 'blur(8px)', pointerEvents: 'none', opacity: 0.3, userSelect: 'none' }}>
                {children}
            </div>

            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                // Add a subtle gradient overlay to make text pop
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.6))'
            }}>
                <div className="glass-panel" style={{
                    padding: '1.5rem 2rem',
                    borderRadius: '16px',
                    textAlign: 'center',
                    border: '1px solid rgba(220, 38, 38, 0.3)',
                    boxShadow: '0 0 30px rgba(0,0,0,0.5)'
                }}>
                    <Lock size={32} color="#dc2626" style={{ marginBottom: '0.75rem' }} />
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>{title}</h3>
                    <p style={{ margin: '0 0 1.25rem 0', color: '#aaa', fontSize: '0.9rem', maxWidth: '200px' }}>{description}</p>
                    <button
                        onClick={() => navigate('/premium')}
                        style={{
                            background: 'var(--color-primary)',
                            color: 'white',
                            border: 'none',
                            padding: '0.6rem 1.2rem',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            boxShadow: '0 0 15px rgba(220, 38, 38, 0.4)'
                        }}
                    >
                        GO PREMIUM
                    </button>
                </div>
            </div>
        </div>
    );
};
