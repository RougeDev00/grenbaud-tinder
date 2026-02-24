import React, { useEffect, useState } from 'react';
import type { Profile } from '../types';
import { getAllProfiles } from '../services/profileService';
import { calculateCompatibility } from '../utils/compatibility';
import { getCachedCompatibility, getCompatibilityCacheKey, getProfileViewers } from '../services/aiService';
import { generateMockProfiles } from '../lib/mockData';
import ProfileCard from './ProfileCard';
import ProfileView from './ProfileView';
import './AIMatch.css';

interface AIMatchProps {
    currentUser: Profile;
    onOpenChat?: (user: Profile) => void;
}

const AIMatch: React.FC<AIMatchProps> = ({ currentUser, onOpenChat }) => {
    const [topMatches, setTopMatches] = useState<{ profile: Profile; score: number; isAI: boolean }[]>([]);
    const [spyProfiles, setSpyProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

    const handleSimulateMatches = () => {
        const mockMatches = generateMockProfiles(10).map(p => ({
            profile: p,
            score: 65 + Math.floor(Math.random() * 30),
            isAI: false
        }));
        setTopMatches(prev => [...prev, ...mockMatches]);
    };

    const handleSimulateSpies = () => {
        const mockSpies = generateMockProfiles(10);
        setSpyProfiles(prev => [...prev, ...mockSpies]);
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const allProfiles = await getAllProfiles(0, 200, currentUser.twitch_id);

                // --- SECTION 1: Top Matches (estimated > 65%) ---
                const highMatches = allProfiles
                    .map(p => {
                        const cacheKey = getCompatibilityCacheKey(currentUser.id, p.id);
                        const stored = getCachedCompatibility(cacheKey);
                        return {
                            profile: p,
                            score: stored ? stored.score : calculateCompatibility(currentUser, p),
                            isAI: !!stored
                        };
                    })
                    .filter(m => m.score >= 65 && !m.isAI) // Only keep unconfirmed matches -> needs AI analysis
                    .sort((a, b) => b.score - a.score);

                setTopMatches(highMatches);

                // --- SECTION 2: Who Spied on Me ---
                const viewerIds = await getProfileViewers(currentUser.id);
                if (viewerIds.length > 0) {
                    const spies = allProfiles.filter(p => viewerIds.includes(p.id));
                    setSpyProfiles(spies);
                }
            } catch (err) {
                console.error('Error fetching AI matches:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentUser.twitch_id, currentUser.id]);


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

            {/* Debug Controls - Moved out of the flow */}
            <div className="ai-match-debug-bar">
                <button className="btn-debug" onClick={handleSimulateMatches}>
                    Simula Match 🔥
                </button>
                <button className="btn-debug btn-debug-spy" onClick={handleSimulateSpies}>
                    Simula Spie 👀
                </button>
            </div>

            {/* === SECTION 1: TOP MATCHES === */}
            <div className="ai-match-section">
                <div className="section-header">
                    <h2 className="section-title title-fire">
                        <span className="section-emoji emoji-fire">🔥</span>
                        <span className="title-text">Top Matches</span>
                        <span className="section-emoji emoji-fire">🔥</span>
                    </h2>
                    <p className="section-subtitle">Profili con potenziale stimato alto (&gt;65%). Genera un'analisi AI per scoprirlo!</p>
                </div>

                {topMatches.length > 0 ? (
                    <div className="profile-grid">
                        {topMatches.map(({ profile, score, isAI }) => (
                            <div key={profile.id} className="grid-card-wrapper hot-match-card">
                                <div className="hot-glow" />
                                <ProfileCard
                                    profile={profile}
                                    currentUser={currentUser}
                                    onOpenProfile={() => setSelectedProfile(profile)}
                                />
                                <div className="hot-score-badge">
                                    <span className="fire-icon">🔥</span>
                                    {isAI ? '' : '~'}{score}%
                                    {isAI && <span className="hot-badge-label">AI ✓</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="ai-match-empty">
                        <div className="empty-icon">🧊</div>
                        <h3>Ancora niente di bollente</h3>
                        <p>Non abbiamo trovato utenti con affinità superiore al 65%. Torna più tardi o aggiorna il tuo profilo!</p>
                    </div>
                )}
            </div>

            {/* === SEPARATOR === */}
            <div className="ai-match-separator" />

            {/* === SECTION 2: WHO SPIED ON ME === */}
            <div className="ai-match-section">
                <div className="section-header">
                    <h2 className="section-title title-spy">
                        <span className="section-emoji emoji-spy">👀</span>
                        <span className="title-text">Chi ti ha Spiato</span>
                        <span className="section-emoji emoji-spy">🔍</span>
                    </h2>
                    <p className="section-subtitle">Utenti che hanno analizzato il tuo profilo</p>
                </div>

                {spyProfiles.length > 0 ? (
                    <div className="profile-grid">
                        {spyProfiles.map(profile => (
                            <div key={profile.id} className="grid-card-wrapper spy-match-card">
                                <div className="spy-glow" />
                                <ProfileCard
                                    profile={profile}
                                    currentUser={currentUser}
                                    onOpenProfile={() => setSelectedProfile(profile)}
                                />
                                <div className="spy-badge">
                                    <span className="spy-badge-icon">👀</span>
                                    Ti ha spiato
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="spy-empty">
                        <div className="empty-icon">🕵️</div>
                        <h3>Nessuno ti ha ancora spiato</h3>
                        <p>Quando qualcuno genererà un'analisi AI sul tuo profilo, apparirà qui!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIMatch;
