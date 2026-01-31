import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import logo from '../assets/logo.png';
import { supabase } from '../lib/supabase';

export const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [emailOrUsername, setEmailOrUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        let emailToSignIn = emailOrUsername;

        // Simple heuristic: If it has an '@', treat as email.
        const isEmail = emailOrUsername.includes('@');

        if (!isEmail) {
            // Lookup email by username
            const { data, error: lookupError } = await supabase
                .from('profiles')
                .select('email')
                .eq('username', emailOrUsername)
                .maybeSingle();

            if (lookupError || !data || !data.email) {
                setError("Username not found.");
                setLoading(false);
                return;
            }

            emailToSignIn = data.email;
        }

        try {
            const { error: authError } = await supabase.auth.signInWithPassword({
                email: emailToSignIn,
                password: password,
            });

            if (authError) throw authError;

            // Success
            navigate('/dashboard');
        } catch (err: any) {
            // Improve error message for bad credentials
            if (err.message === "Invalid login credentials") {
                setError("Incorrect email or password.");
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#0a0a0a',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
        }}>
            <div style={{ width: '100%', maxWidth: '400px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <img src={logo} alt="Ruthless Chess" style={{ width: '60px', marginBottom: '1rem', opacity: 0.8 }} />
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Welcome Back</h1>
                    <p style={{ color: '#888' }}>Enter the arena once more.</p>
                </div>

                <form onSubmit={handleSubmit} style={{
                    background: 'var(--color-surface-1)',
                    padding: '2rem',
                    borderRadius: '16px',
                    border: '1px solid #333',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.25rem'
                }}>
                    {error && (
                        <div style={{
                            background: 'rgba(220, 38, 38, 0.1)',
                            border: '1px solid rgba(220, 38, 38, 0.3)',
                            color: '#fca5a5',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            textAlign: 'center'
                        }}>
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#ccc' }}>Email or Username</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#666' }} />
                            <input
                                type="text"
                                required
                                value={emailOrUsername}
                                onChange={(e) => setEmailOrUsername(e.target.value)}
                                placeholder="you@example.com"
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#ccc' }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#666' }} />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            marginTop: '1rem',
                            padding: '1rem',
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            background: 'var(--color-primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            transition: 'opacity 0.2s',
                            boxShadow: 'var(--shadow-glow)'
                        }}
                    >
                        {loading ? 'Authenticating...' : 'Login'}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: '#888' }}>
                        Don't have an account?{' '}
                        <button
                            type="button"
                            onClick={() => navigate('/pricing')}
                            style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            Sign Up
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 10px 10px 40px',
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '8px',
    color: 'white',
    fontSize: '1rem',
    boxSizing: 'border-box'
};
