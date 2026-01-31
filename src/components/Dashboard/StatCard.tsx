import React from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface StatCardProps {
    title: string;
    value: string;
    trend: string;
    trendUp: boolean;
    data: any[];
    color: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, trend, trendUp, data, color }) => {
    return (
        <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'relative', zIndex: 2 }}>
                <div style={{ fontSize: '0.9rem', color: '#888', marginBottom: '0.5rem' }}>{title}</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{value}</div>
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    fontSize: '0.85rem',
                    color: trendUp ? '#22c55e' : '#ef4444',
                    background: trendUp ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '100px'
                }}>
                    {trendUp ? '↗' : '↘'} {trend}
                </div>
            </div>

            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60px', opacity: 0.3, zIndex: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={color}
                            fill={`url(#gradient-${title})`}
                            strokeWidth={2}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
