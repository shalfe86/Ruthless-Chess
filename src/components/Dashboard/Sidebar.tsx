import React from 'react';
import { Home, Play, Users, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../../assets/logo.png';
import { supabase } from '../../lib/supabase';

export const Sidebar: React.FC<{ isPremium?: boolean }> = ({ isPremium = false }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    return (
        <div className="glass-panel" style={{
            width: '240px',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            display: 'flex',
            flexDirection: 'column',
            padding: '2rem 1.5rem',
            zIndex: 50
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem', paddingLeft: '0.5rem' }}>
                <img src={logo} alt="Logo" style={{ width: '140px' }} />
                {/* Removed text span as logo likely contains text now */}
            </div>

            <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <SidebarItem icon={<Home size={20} />} label="Overview" active={isActive('/dashboard')} onClick={() => navigate('/dashboard')} />
                <SidebarItem icon={<Play size={20} />} label="Arena" active={isActive('/arena')} onClick={() => navigate('/arena')} />
                <SidebarItem icon={<Users size={20} />} label="Leaderboard" active={false} onClick={() => { }} locked={!isPremium} />
            </nav>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
                <button
                    onClick={handleLogout}
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        background: 'transparent',
                        color: '#666',
                        justifyContent: 'flex-start',
                        padding: '0.75rem 1rem'
                    }}
                >
                    <LogOut size={20} />
                    <span>Log Out</span>
                </button>
            </div>
        </div>
    );
};

const SidebarItem = ({ icon, label, active, onClick, locked }: any) => (
    <button
        onClick={onClick}
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            width: '100%',
            padding: '1rem',
            background: active ? 'rgba(220, 38, 38, 0.1)' : 'transparent',
            border: active ? '1px solid rgba(220, 38, 38, 0.2)' : '1px solid transparent',
            color: active ? 'white' : '#888',
            borderRadius: '12px',
            cursor: locked ? 'not-allowed' : 'pointer',
            opacity: locked ? 0.5 : 1,
            textAlign: 'left',
            transition: 'all 0.2s'
        }}
    >
        <span style={{ color: active ? 'var(--color-primary)' : 'inherit' }}>{icon}</span>
        <span style={{ fontWeight: 500 }}>{label}</span>
    </button>
);
