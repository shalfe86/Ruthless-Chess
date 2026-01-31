import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Mail, Lock, Check } from 'lucide-react';
import logo from '../assets/logo.png';
import { supabase } from '../lib/supabase';

export const SignupPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const plan = searchParams.get('plan') || 'free';
    const isPremium = plan === 'premium';
    const [showVerificationModal, setShowVerificationModal] = useState(false);

    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (formData.password !== formData.confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        try {
            // 1. Sign up user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        username: formData.username,
                        full_name: formData.fullName,
                        is_premium: isPremium
                    }
                }
            });

            if (authError) throw authError;

            // Trigger handles profile creation automatically now.
            if (authData.user) {
                console.log("Registration successful:", authData);
                setShowVerificationModal(true);
            }
        } catch (error: any) {
            console.error("Signup error:", error);
            if (error.status === 429 || error.message?.includes('Too Many Requests')) {
                alert("Too many signup attempts! Supabase has rate-limited this IP for security. Please wait 15-60 minutes or create the user manually in the Supabase Dashboard.");
            } else {
                alert("Error signing up: " + error.message);
            }
        }
    };

    if (showVerificationModal) {
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(0,0,0,0.85)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
            }}>
                <div style={{
                    background: '#1a1a1a',
                    padding: '3rem',
                    borderRadius: '16px',
                    border: '1px solid var(--color-primary)',
                    textAlign: 'center',
                    maxWidth: '400px',
                    boxShadow: '0 0 50px rgba(220, 38, 38, 0.2)'
                }}>
                    <Mail size={48} color="var(--color-primary)" style={{ marginBottom: '1.5rem' }} />
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '1rem', color: 'white' }}>Check Your Email</h2>
                    <p style={{ color: '#aaa', marginBottom: '2rem', lineHeight: '1.5' }}>
                        We've sent a verification link to <strong>{formData.email}</strong>.<br />
                        Please verify your account to start your ruthless journey.
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        style={{
                            padding: '0.8rem 2rem',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            background: 'white',
                            color: 'black',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        OK, Got it
                    </button>
                </div>
            </div>
        );
    }

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
            <div style={{ width: '100%', maxWidth: '450px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <img src={logo} alt="Ruthless Chess" style={{ width: '60px', marginBottom: '1rem', opacity: 0.8 }} />
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Create Account</h1>
                    <p style={{ color: '#888' }}>
                        Join as a <span style={{ color: isPremium ? 'var(--color-primary)' : 'white', fontWeight: 'bold' }}>
                            {isPremium ? 'Premium Member' : 'Ruthless Rookie'}
                        </span>
                    </p>
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
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#ccc' }}>Full Name</label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#666' }} />
                            <input
                                type="text"
                                name="fullName"
                                required
                                value={formData.fullName}
                                onChange={handleChange}
                                placeholder="John Doe"
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#ccc' }}>Username</label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#666' }} />
                            <input
                                type="text"
                                name="username"
                                required
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="ChessMaster99"
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#ccc' }}>Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#666' }} />
                            <input
                                type="email"
                                name="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
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
                                name="password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#ccc' }}>Confirm Password</label>
                        <div style={{ position: 'relative' }}>
                            <Check size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#666' }} />
                            <input
                                type="password"
                                name="confirmPassword"
                                required
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="••••••••"
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    <button type="submit" style={{
                        marginTop: '1rem',
                        padding: '1rem',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        background: 'var(--color-primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'opacity 0.2s',
                        boxShadow: 'var(--shadow-glow)'
                    }}>
                        {isPremium ? 'Continue to Payment' : 'Start Playing'}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <button
                            type="button"
                            onClick={() => navigate('/pricing')}
                            style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                            Change Plan
                        </button>
                        <div style={{ fontSize: '0.9rem', color: '#888' }}>
                            Already have an account?{' '}
                            <button
                                type="button"
                                onClick={() => navigate('/login')}
                                style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                Login
                            </button>
                        </div>
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
    boxSizing: 'border-box' // Fix for width calculation
};
