import React, { useEffect, useState } from 'react';
import type { Profile } from '../types';
import { getAllProfiles } from '../services/profileService';
import { calculateCompatibility } from '../utils/compatibility';
import { getCachedCompatibility, getCompatibilityCacheKey } from '../services/aiService';
import ProfileCard from './ProfileCard';
import ProfileView from './ProfileView';
import './AIMatch.css';

interface AIMatchProps {
    currentUser: Profile;
    onOpenChat?: (user: Profile) => void;
}

const AIMatch: React.FC<AIMatchProps> = ({ currentUser, onOpenChat }) => {
    const [matches, setMatches] = useState<{ profile: Profile; score: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

    useEffect(() => {
        const fetchAndFilterMatches = async () => {
            setLoading(true);
            try {
                // Fetch users (ideally this would be a specialized API, but we'll filter client-side for now)
                const allProfiles = await getAllProfiles(0, 100, currentUser.twitch_id);

                const highMatches = allProfiles
                    .map(p => {
                        const cacheKey = getCompatibilityCacheKey(currentUser.twitch_id, p.twitch_id);
                        const stored = getCachedCompatibility(cacheKey);
                        return {
                            profile: p,
                            score: stored ? stored.score : calculateCompatibility(currentUser, p)
                        };
                    })
                    .filter(m => m.score > 85)
                    .sort((a, b) => b.score - a.score);

                setMatches(highMatches);
            } catch (err) {
                console.error('Error fetching AI matches:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAndFilterMatches();
    }, [currentUser.twitch_id]);

    if (selectedProfile) {
        return (
            <div className="profile-detail-view animate-fade-in">
                <button className="btn-back" onClick={() => setSelectedProfile(null)}>
                    <div className="btn-back-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                    </div>
                    <span>Torna ai Match</span>
                </button>
                <ProfileView
                    profile={selectedProfile}
                    currentUser={currentUser}
                    readOnly
                    onOpenChat={() => onOpenChat?.(selectedProfile)}
                />
            </div>
        );
    }

    if (loading) {
        return (
            <div className="ai-match-loading">
                <div className="fire-spinner">🔥</div>
                <p>Scansione affinità in corso...</p>
            </div>
        );
    }

    return (
        <div className="ai-match-container animate-fade-in">
            <div className="ai-match-header">
                <h2 className="ai-match-title">
                    <span className="fire-emoji fire-left">🔥</span>
                    Hot Matches
                    <span className="fire-emoji fire-right">🔥</span>
                </h2>
                <p className="ai-match-subtitle">Solo le connessioni più esplosive (&gt;85%)</p>
            </div>

            {matches.length > 0 ? (
                <div className="profile-grid">
                    {matches.map(({ profile, score }) => (
                        <div key={profile.id} className="grid-card-wrapper hot-match-card">
                            <div className="hot-glow" />
                            <ProfileCard
                                profile={profile}
                                currentUser={currentUser}
                                onOpenProfile={() => setSelectedProfile(profile)}
                            />
                            <div className="hot-score-badge">
                                <span className="fire-icon">🔥</span>
                                {score}%
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="ai-match-empty">
                    <div className="empty-icon">🧊</div>
                    <h3>Ancora niente di bollente</h3>
                    <p>Non abbiamo trovato utenti con affinità superiore all'85%. Torna più tardi o aggiorna il tuo profilo!</p>
                </div>
            )}
        </div>
    );
};

export default AIMatch;

