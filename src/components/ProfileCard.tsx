import React, { useState } from 'react';
import type { Profile } from '../types';
import { calculateCompatibility } from '../utils/compatibility';
import { getCompatibilityCacheKey, getCachedCompatibility } from '../services/aiService';
import './ProfileCard.css';

interface ProfileCardProps {
    profile: Profile;
    currentUser?: Profile;
    onOpenProfile?: () => void;
}

const ARCHETYPES_MAP: Record<string, string> = {
    'INTJ': "Il Progettista", 'INTP': "Il Teorico", 'ENTJ': "Il Condottiero", 'ENTP': "L'Innovatore",
    'INFJ': "Il Consigliere", 'INFP': "L'Idealista", 'ENFJ': "Il Mentore", 'ENFP': "L'Ispiratore",
    'ISTJ': "Il Custode", 'ISFJ': "Il Protettore", 'ESTJ': "L'Amministratore", 'ESFJ': "L'Ospite",
    'ISTP': "Il Tecnico", 'ISFP': "L'Artista", 'ESTP': "Il Dinamico", 'ESFP': "L'Animatore",
};

const ProfileCard: React.FC<ProfileCardProps> = ({ profile, currentUser, onOpenProfile }) => {
    // State for score and estimation status
    const [matchScore, setMatchScore] = useState<number | null>(null);
    const [isEstimated, setIsEstimated] = useState(true);

    React.useEffect(() => {
        if (!currentUser || !profile) return;

        const cacheKey = getCompatibilityCacheKey(currentUser.id, profile.id);
        const cached = getCachedCompatibility(cacheKey);

        if (cached) {
            setMatchScore(cached.score);
            setIsEstimated(false);
        } else {
            const estimated = calculateCompatibility(currentUser, profile);
            setMatchScore(estimated);
            setIsEstimated(true);
        }
    }, [currentUser, profile]);

    // All photo URLs from profile (images lazy-load via browser)
    const photos = [profile.photo_1, profile.photo_2, profile.photo_3].filter(Boolean) as string[];
    const [currentPhoto, setCurrentPhoto] = useState(0);
    const [isCenterHovered, setIsCenterHovered] = useState(false);

    // Key processing
    const rawType = profile.personality_type || '';
    const baseType = rawType.split('-')[0].trim().toUpperCase();

    const personalityBadgeColors: Record<string, string> = {
        'INTJ': '#6d5dfc', 'INTP': '#6d5dfc', 'ENTJ': '#6d5dfc', 'ENTP': '#6d5dfc',
        'INFJ': '#2ecc71', 'INFP': '#2ecc71', 'ENFJ': '#2ecc71', 'ENFP': '#2ecc71',
        'ISTJ': '#3498db', 'ISFJ': '#3498db', 'ESTJ': '#3498db', 'ESFJ': '#3498db',
        'ISTP': '#e67e22', 'ISFP': '#e67e22', 'ESTP': '#ff00ff', 'ESFP': '#e67e22',
    };


    const getZone = (e: React.MouseEvent | React.TouchEvent, rect: DOMRect) => {
        const clientX = 'touches' in e ? (e as any).touches[0].clientX : (e as React.MouseEvent).clientX;
        const x = clientX - rect.left;
        const width = rect.width;

        if (x < width * 0.3) return 'left';
        if (x > width * 0.7) return 'right';
        return 'center';
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const zone = getZone(e, rect);
        setIsCenterHovered(zone === 'center');
    };

    const handleMouseLeave = () => {
        setIsCenterHovered(false);
    };

    const handlePhotoTap = (e: React.MouseEvent | React.TouchEvent) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const clientY = 'touches' in e ? (e as any).changedTouches[0].clientY : (e as React.MouseEvent).clientY;

        const relativeY = clientY - rect.top;
        const photoHeight = rect.width * (4 / 3);

        if (relativeY > photoHeight) {
            onOpenProfile?.();
            return;
        }

        const zone = getZone(e, rect);

        if (zone === 'left') {
            setCurrentPhoto(prev => Math.max(0, prev - 1));
        } else if (zone === 'right') {
            setCurrentPhoto(prev => Math.min(photos.length - 1, prev + 1));
        } else {
            onOpenProfile?.();
        }
    };

    // Parse Hobbies
    const hobbiesList = profile.hobbies ? profile.hobbies.split(',').map(h => h.trim()).slice(0, 3) : [];

    // Extract dynamic keywords (Artists, Streamers, etc.)
    const keywords: string[] = [];
    if (profile.music_artists) {
        profile.music_artists.split(',').map(s => s.trim()).filter(Boolean).slice(0, 1).forEach(k => keywords.push(k));
    }
    if (profile.twitch_streamers) {
        profile.twitch_streamers.split(',').map(s => s.trim()).filter(Boolean).slice(0, 1).forEach(k => keywords.push(k));
    }
    if (profile.youtube_channels) {
        profile.youtube_channels.split(',').map(s => s.trim()).filter(Boolean).slice(0, 1).forEach(k => keywords.push(k));
    }

    // Filter out duplicates and limit
    const uniqueKeywords = Array.from(new Set([...keywords, ...hobbiesList])).slice(0, 4);

    // Parse Zodiac (take only icon + name if needed, or just first word)
    const zodiac = profile.zodiac_sign ? profile.zodiac_sign.split(' ')[0] : '';

    // Determine Badge Style
    const getBadgeStyle = (score: number, estimated: boolean) => {
        // Estimated Scores: Neutral, Provisional
        if (estimated) {
            return {
                tier: 'estimated',
                icon: '🔮',
                label: 'STIMATA'
            };
        }

        // Final AI Scores: Premium Tiers
        if (score >= 85) return {
            tier: 'titan',
            icon: '🚀',
            label: 'AI ✓'
        };
        if (score >= 70) return {
            tier: 'high',
            icon: '🔥',
            label: 'AI ✓'
        };
        if (score >= 45) return {
            tier: 'good',
            icon: '✨',
            label: 'AI ✓'
        };
        if (score >= 25) return {
            tier: 'neutral',
            icon: '🧊',
            label: 'AI ✓'
        };
        return {
            tier: 'cold',
            icon: '❄️',
            label: 'AI ✓'
        };
    };

    const badgeStyle = matchScore !== null ? getBadgeStyle(matchScore, isEstimated) : null;

    const isGold = profile.twitch_username?.toLowerCase() === 'grenbaud';

    return (
        <div className={`profile-card ${isCenterHovered ? 'is-center-hovered' : ''} ${isGold ? 'profile-card--gold' : ''}`} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
            <div className="profile-card-photos" onClick={handlePhotoTap}>
                {photos.length > 1 && (
                    <div className="photo-dots">
                        {photos.map((_, i) => (
                            <div
                                key={i}
                                className={`photo-dot ${i === currentPhoto ? 'photo-dot--active' : ''}`}
                            />
                        ))}
                    </div>
                )}

                {/* Stacked Images for Instant Switching */}
                {photos.map((photo, index) => (
                    <img
                        key={index}
                        src={photo}
                        alt={`${profile.display_name} ${index + 1}`}
                        className={`profile-card-photo ${index === currentPhoto ? 'active' : ''}`}
                        draggable={false}
                        style={{
                            opacity: index === currentPhoto ? 1 : 0,
                            zIndex: index === currentPhoto ? 2 : 1,
                            transition: 'opacity 0.2s ease-in-out'
                        }}
                        loading="lazy"
                        decoding="async"
                    />
                ))}

                {matchScore !== null && badgeStyle && (
                    <div className={`match-badge match-tier-${badgeStyle.tier} ${!isEstimated ? 'match-badge--final' : 'match-badge--estimated'}`}>
                        <span className="match-icon">{badgeStyle.icon}</span>
                        <div className="match-score-content">
                            <span className="match-percent">{isEstimated ? '~' : ''}{matchScore}%</span>
                            <span className="match-label">{badgeStyle.label}</span>
                        </div>
                    </div>
                )}

                <div className="profile-card-gradient" />

                {/* View Profile Overlay - Triggered by center hover */}
                <div className="profile-card-center-overlay">
                    <span>Vedi Profilo</span>
                </div>

                <div className="profile-card-overlay">
                    {/* Name & Zodiac */}
                    <div className="profile-card-name-row">
                        <h2 className="profile-card-name">{profile.display_name}{profile.age ? `, ${profile.age}` : ''}</h2>
                        {zodiac && <span className="profile-card-zodiac">{zodiac}</span>}
                    </div>
                    {profile.twitch_username && (
                        <p className="profile-card-username">@{profile.twitch_username}</p>
                    )}

                    {/* Badges: Gender & Looking For */}
                    <div className="profile-card-badges">
                        {isGold && (
                            <span className="card-badge card-badge--gold" title="CEO of BAUDR">
                                👑 GOLD
                            </span>
                        )}
                        {profile.gender && (
                            <span className={`card-badge card-badge--gender`}>
                                {profile.gender === 'Maschio' ? '♂' : profile.gender === 'Femmina' ? '♀' : '⚧'} {profile.gender}
                                {profile.city && <span style={{ opacity: 0.8, marginLeft: '6px' }}>• {profile.city}</span>}
                            </span>
                        )}
                        {profile.looking_for && (
                            <span className="card-badge card-badge--looking">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                                {profile.looking_for}
                            </span>
                        )}
                        {profile.personality_type && (
                            <span
                                className={`card-badge card-badge--personality`}
                                style={{ backgroundColor: personalityBadgeColors[baseType] || '#6B7280' }}
                            >
                                ✨ {baseType === 'ESTP' ? "Il Dinamico" : (ARCHETYPES_MAP[baseType] || baseType)}
                            </span>
                        )}
                    </div>

                    {/* Bio Preview */}
                    {profile.bio && <p className="profile-card-bio-preview">{profile.bio}</p>}

                    {/* Dynamic Keywords Chips */}
                    {uniqueKeywords.length > 0 && (
                        <div className="profile-card-hobbies">
                            {uniqueKeywords.map((keyword, i) => (
                                <span key={i} className="hobby-chip">{keyword}</span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfileCard;
