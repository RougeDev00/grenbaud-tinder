import React from 'react';
import {
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    Radar, ResponsiveContainer, Tooltip
} from 'recharts';

interface PersonalityRadarChartProps {
    mind?: number;    // Extraverted vs Introverted
    energy?: number;  // Intuitive vs Observant
    nature?: number;  // Thinking vs Feeling
    tactics?: number; // Judging vs Prospecting
    identity?: number; // Assertive vs Turbulent
    personalityType?: string; // e.g. "INFP-T"
}

interface DataPoint {
    trait: string;
    value: number;
    fullMark: 100;
}

const NEON_PURPLE = '#a855f7';
const NEON_PINK = '#ec4899';

export const PersonalityRadarChart: React.FC<PersonalityRadarChartProps> = ({
    mind, energy, nature, tactics, identity, personalityType
}) => {
    // Don't render if no personality data exists
    const hasData = [mind, energy, nature, tactics, identity].some(v => v != null);
    if (!hasData) return null;

    const data: DataPoint[] = [
        { trait: '🧠 Mente', value: mind ?? 50, fullMark: 100 },
        { trait: '⚡ Energia', value: energy ?? 50, fullMark: 100 },
        { trait: '💜 Natura', value: nature ?? 50, fullMark: 100 },
        { trait: '🎯 Tattica', value: tactics ?? 50, fullMark: 100 },
        { trait: '🛡️ Identità', value: identity ?? 50, fullMark: 100 },
    ];

    return (
        <div className="personality-radar-card" style={{
            background: 'rgba(168, 85, 247, 0.06)',
            border: '1px solid rgba(168, 85, 247, 0.2)',
            borderRadius: '16px',
            padding: '20px 10px 10px',
            marginTop: '12px',
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '8px',
            }}>
                <span style={{ fontSize: '1.3rem' }}>🎮</span>
                <span style={{
                    fontWeight: 700,
                    fontSize: '1rem',
                    background: `linear-gradient(135deg, ${NEON_PURPLE}, ${NEON_PINK})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '0.5px',
                }}>
                    Stats Personalità
                </span>
                {personalityType && (
                    <span style={{
                        background: 'rgba(168, 85, 247, 0.2)',
                        border: '1px solid rgba(168, 85, 247, 0.4)',
                        borderRadius: '8px',
                        padding: '2px 8px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: NEON_PURPLE,
                        letterSpacing: '1px',
                    }}>
                        {personalityType}
                    </span>
                )}
            </div>

            <ResponsiveContainer width="100%" height={260}>
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                    <PolarGrid
                        stroke="rgba(168, 85, 247, 0.15)"
                        strokeWidth={1}
                    />
                    <PolarAngleAxis
                        dataKey="trait"
                        tick={{
                            fill: 'rgba(255,255,255,0.7)',
                            fontSize: 11,
                            fontWeight: 500,
                        }}
                    />
                    <PolarRadiusAxis
                        angle={90}
                        domain={[0, 100]}
                        tick={false}
                        axisLine={false}
                    />
                    <Radar
                        name="Personalità"
                        dataKey="value"
                        stroke={NEON_PURPLE}
                        fill={`url(#radarGradient)`}
                        fillOpacity={0.45}
                        strokeWidth={2}
                        animationDuration={800}
                        animationEasing="ease-out"
                    />
                    <Tooltip
                        contentStyle={{
                            background: 'rgba(24, 24, 27, 0.95)',
                            border: '1px solid rgba(168, 85, 247, 0.3)',
                            borderRadius: '10px',
                            color: 'white',
                            fontSize: '13px',
                            padding: '8px 12px',
                        }}
                        formatter={(value: number | string | undefined) => [`${value ?? 0}%`, 'Score']}
                    />
                    <defs>
                        <linearGradient id="radarGradient" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor={NEON_PURPLE} stopOpacity={0.6} />
                            <stop offset="100%" stopColor={NEON_PINK} stopOpacity={0.3} />
                        </linearGradient>
                    </defs>
                </RadarChart>
            </ResponsiveContainer>

            {/* Legend row */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '6px 12px',
                marginTop: '4px',
                fontSize: '0.7rem',
                color: 'rgba(255,255,255,0.45)',
            }}>
                <span>🧠 Estroverso ⇄ Introverso</span>
                <span>⚡ Intuitivo ⇄ Osservatore</span>
                <span>💜 Razionale ⇄ Emotivo</span>
                <span>🎯 Giudizio ⇄ Percezione</span>
                <span>🛡️ Assertivo ⇄ Turbolento</span>
            </div>
        </div>
    );
};
