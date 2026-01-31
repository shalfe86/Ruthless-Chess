import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Sidebar } from '../components/Dashboard/Sidebar';
import { StatCard } from '../components/Dashboard/StatCard';
import { PremiumGate } from '../components/PremiumGate'; // Import Gate
import { Search, Bell, ChevronDown, Activity, Skull, Zap, Target } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getPlayerAnalytics, getRatingHistory, getSkillBreakdown } from '../lib/analytics';
import type { PlayerAnalytics } from '../types/database';

const mockSparkline = Array.from({ length: 10 }, () => ({ value: Math.random() * 100 }));

// Hook for media query defined outside component
function useMedia(query: string) {
    const [matches, setMatches] = useState(window.matchMedia(query).matches);

    useEffect(() => {
        const media = window.matchMedia(query);
        if (media.matches !== matches) {
            setMatches(media.matches);
        }
        const listener = () => setMatches(media.matches);
        media.addEventListener('change', listener);
        return () => media.removeEventListener('change', listener);
    }, [query]);

    return matches;
}

export const PlayerDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [analytics, setAnalytics] = useState<PlayerAnalytics | null>(null);
    const [ratingHistory, setRatingHistory] = useState<any[]>([]);
    const [skillBreakdown, setSkillBreakdown] = useState({ difficulty: 0, speed: 0, pressure: 0, accuracy: 0 });

    const isMobile = useMedia('(max-width: 768px)');

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { navigate('/login'); return; }

            // Fetch profile
            const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            if (profileData) {
                setProfile(profileData);
            }

            // Fetch real analytics from database
            const analyticsData = await getPlayerAnalytics(user.id);
            setAnalytics(analyticsData);

            // Fetch rating history
            const history = await getRatingHistory(user.id);
            setRatingHistory(history);

            // Calculate skill breakdown
            const breakdown = getSkillBreakdown(analyticsData);
            setSkillBreakdown(breakdown);

            setLoading(false);
        };
        fetchProfile();
    }, [navigate]);

    if (loading) return <div style={{ height: '100vh', background: '#050505' }} />;

    const isPremium = profile?.is_premium === true;

    return (
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', minHeight: '100vh', background: '#050505', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
            {!isMobile && (
                <div style={{ width: '240px', flexShrink: 0 }}>
                    <Sidebar isPremium={isPremium} />
                </div>
            )}

            {/* Mobile Header */}
            {isMobile && (
                <div style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #333', background: '#0a0a0a' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>ROOK & PAWN</div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <button onClick={() => navigate('/arena')} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: '#333', border: 'none', color: '#fff', borderRadius: '4px' }}>Play</button>
                        <button
                            onClick={async () => {
                                await supabase.auth.signOut();
                                navigate('/');
                            }}
                            style={{ padding: '0.4rem', background: 'transparent', border: 'none', color: '#666' }}
                        >
                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Logout</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div style={{ flex: 1, padding: isMobile ? '1rem' : '2rem', width: '100%', maxWidth: '100vw', overflowX: 'hidden' }}>

                {/* Top Header - Hide on mobile */}
                {!isMobile && (
                    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', padding: '0.75rem 1.5rem', borderRadius: '100px', width: '300px', gap: '0.75rem' }}>
                            <Search size={18} color="#666" />
                            <input placeholder="Search metrics, reports..." style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%' }} />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <button className="glass-panel" style={{ padding: '0.75rem', borderRadius: '50%', display: 'flex' }}><Bell size={20} /></button>
                            <div className="glass-panel" style={{ padding: '0.5rem 1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(45deg, #dc2626, #fca5a5)' }} />
                                <span style={{ fontWeight: 'bold' }}>{profile?.username}</span>
                                <ChevronDown size={16} color="#666" />
                            </div>
                        </div>
                    </header>
                )}

                {/* KPI Cards Row - Responsive Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
                    gap: isMobile ? '0.75rem' : '1.5rem',
                    marginBottom: '2rem'
                }}>
                    <StatCard title="Total Games" value={analytics?.total_games.toString() || "0"} trend="" trendUp={true} data={mockSparkline} color="#8b5cf6" />

                    {/* GATED: Global Rank */}
                    <PremiumGate isPremium={isPremium} title="Global Ranking">
                        <StatCard
                            title="Global Rank"
                            value={analytics?.is_rated && analytics.global_rank ? `#${analytics.global_rank}` : analytics?.games_until_rated ? `${analytics.games_until_rated} more games` : "Play 10 games"}
                            trend={analytics?.is_rated ? "Ranked" : "Unrated"}
                            trendUp={analytics?.is_rated || false}
                            data={mockSparkline}
                            color="#3b82f6"
                        />
                    </PremiumGate>

                    <StatCard title="Win Rate" value={`${analytics?.win_rate.toFixed(1) || 0}%`} trend="" trendUp={analytics?.win_rate ? analytics.win_rate > 50 : false} data={mockSparkline} color="#f59e0b" />
                    <StatCard title="Wins" value={analytics?.wins.toString() || "0"} trend="" trendUp={true} data={mockSparkline} color="#10b981" />
                </div>

                {/* Charts Grid - GATED - Stack on mobile */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
                    gap: isMobile ? '1rem' : '1.5rem',
                    marginBottom: '2rem'
                }}>

                    {/* Main Chart: Rating Over Time */}
                    <div className="glass-panel" style={{ borderRadius: '24px', overflow: 'hidden' }}>
                        <PremiumGate isPremium={isPremium} title="Rating Analytics" description="See your progress over time.">
                            <div style={{ padding: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                                    <h3 style={{ fontSize: '1.2rem' }}>Rating Progression</h3>
                                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: '#888' }}>
                                        {analytics?.is_rated && <span style={{ color: '#dc2626' }}>ELO: {analytics.elo_rating}</span>}
                                        {!analytics?.is_rated && <span style={{ color: '#888' }}>Play {analytics?.games_until_rated || 10} more games to get rated</span>}
                                    </div>
                                </div>
                                {analytics?.is_rated && ratingHistory.length > 0 ? (
                                    <div style={{ height: '300px', marginLeft: '-20px' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={ratingHistory}>
                                                <defs>
                                                    <linearGradient id="colorRating" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#666' }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#666' }} domain={['dataMin - 50', 'dataMax + 50']} />
                                                <Tooltip />
                                                <Area type="monotone" dataKey="value" stroke="#dc2626" strokeWidth={3} fillOpacity={1} fill="url(#colorRating)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯</div>
                                            <div>Play {analytics?.games_until_rated || 10} more games to unlock your rating chart</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </PremiumGate>
                    </div>

                    {/* Breakdown Chart */}
                    <div className="glass-panel" style={{ borderRadius: '24px', overflow: 'hidden' }}>
                        <PremiumGate isPremium={isPremium} title="Skill DNA">
                            <div style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <h3 style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>Skill Breakdown</h3>
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                    {/* Simple Donut via CSS or Recharts Pie - Using simple circle for 'vibe' */}
                                    <div style={{
                                        width: '200px', height: '200px',
                                        borderRadius: '50%',
                                        border: '15px solid #222',
                                        borderTop: '15px solid #dc2626',
                                        borderRight: '15px solid #f59e0b',
                                        transform: 'rotate(-45deg)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <div style={{ textAlign: 'center', transform: 'rotate(45deg)' }}>
                                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{skillBreakdown.accuracy}</div>
                                            <div style={{ color: '#888' }}>Overall</div>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '2rem' }}>
                                    <MetricDot color="#dc2626" label="Difficulty" val={`${skillBreakdown.difficulty}%`} />
                                    <MetricDot color="#f59e0b" label="Speed" val={`${skillBreakdown.speed}%`} />
                                    <MetricDot color="#8b5cf6" label="Pressure" val={`${skillBreakdown.pressure}%`} />
                                    <MetricDot color="#10b981" label="Accuracy" val={`${skillBreakdown.accuracy}%`} />
                                </div>
                            </div>
                        </PremiumGate>
                    </div>
                </div>

                {/* Detailed Analytics Grid (Bottom) - GATED */}
                <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Detailed Metrics</h3>
                <div style={{ position: 'relative' }}>
                    {/* We gate the whole grid */}
                    <PremiumGate isPremium={isPremium} title="Advanced Metrics" description="Unlock detailed performance analytics.">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                            <DetailCard icon={<Skull size={20} />} title="Avg Accuracy" value={`${analytics?.avg_accuracy.toFixed(1) || 0}%`} />
                            <DetailCard icon={<Zap size={20} />} title="Total Mistakes" value={analytics?.total_mistakes.toString() || "0"} />
                            <DetailCard icon={<Target size={20} />} title="Total Blunders" value={analytics?.total_blunders.toString() || "0"} />
                            <DetailCard icon={<Activity size={20} />} title="Brilliant Moves" value={analytics?.total_brilliant_moves.toString() || "0"} />
                        </div>
                    </PremiumGate>
                </div>

            </div>
        </div>
    );
};

const MetricDot = ({ color, label, val }: any) => (
    <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', marginBottom: '0.25rem' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
            <span style={{ fontSize: '0.8rem', color: '#888' }}>{label}</span>
        </div>
        <div style={{ fontWeight: 'bold' }}>{val}</div>
    </div>
);

const DetailCard = ({ icon, title, value }: any) => (
    <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>{icon}</div>
        <div>
            <div style={{ fontSize: '0.85rem', color: '#888' }}>{title}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{value}</div>
        </div>
    </div>
);
