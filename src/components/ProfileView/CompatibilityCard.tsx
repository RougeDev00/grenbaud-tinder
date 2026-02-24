import React, { useState, useEffect } from 'react';
import type { Profile } from '../../types';
import { calculateCompatibility } from '../../utils/compatibility';
import { getCachedCompatibility, getCompatibilityCacheKey, generateCompatibilityExplanation, getStoredCompatibility } from '../../services/aiService';
import { checkMutualAnalysis } from '../../services/notificationService';

interface CompatibilityCardProps {
    profile: Profile;
    currentUser: Profile;
}

export const CompatibilityCard: React.FC<CompatibilityCardProps> = ({ profile, currentUser }) => {
    const [matchScore, setMatchScore] = useState<number | null>(null);
    const [isEstimated, setIsEstimated] = useState(true);
    const [compatibilityExplanation, setCompatibilityExplanation] = useState<string | null>(null);
    const [isExplanationExpanded, setIsExplanationExpanded] = useState(false);
    const [isExplanationLoading, setIsExplanationLoading] = useState(false);
    const [isChatUnlocked, setIsChatUnlocked] = useState(false);

    useEffect(() => {
        if (!currentUser?.id || !profile?.id) return;

        const cacheKey = getCompatibilityCacheKey(currentUser.id, profile.id);

        // Show cached value immediately for fast UX
        const cached = getCachedCompatibility(cacheKey);
        if (cached) {
            setMatchScore(cached.score);
            setCompatibilityExplanation(cached.explanation);
            setIsEstimated(false);
        } else {
            // Default to estimated calculation
            const estimated = calculateCompatibility(currentUser, profile);
            setMatchScore(estimated);
            setIsEstimated(true);
        }

        // ALWAYS verify against DB (source of truth)
        const verifyWithDB = async () => {
            if (!currentUser?.id || !profile?.id) return;
            const stored = await getStoredCompatibility(currentUser.id, profile.id);
            if (stored) {
                setMatchScore(stored.score);
                setCompatibilityExplanation(stored.explanation);
                setIsEstimated(false);
            } else {
                // Score was deleted from DB — clear stale cache and reset
                try { localStorage.removeItem(cacheKey); } catch (_) { /* */ }
                const estimated = calculateCompatibility(currentUser, profile);
                setMatchScore(estimated);
                setCompatibilityExplanation(null);
                setIsEstimated(true);
            }
        };
        verifyWithDB();

        // Check if chat is unlocked (mutual analysis)
        const fetchUnlockStatus = async () => {
            if (!currentUser?.id || !profile?.id) return;
            const unlocked = await checkMutualAnalysis(currentUser.id, profile.id);
            setIsChatUnlocked(unlocked);
        };
        fetchUnlockStatus();
    }, [currentUser, profile]);


    const handleGenerateCompatibility = async () => {
        if (!matchScore || isExplanationLoading) return;
        setIsExplanationLoading(true);
        setIsExplanationExpanded(true);

        const result = await generateCompatibilityExplanation(currentUser, profile, matchScore);
        if (result) {
            setMatchScore(result.score);
            setCompatibilityExplanation(result.explanation);
            setIsEstimated(false);
            // After generating, re-check unlock status
            const unlocked = await checkMutualAnalysis(currentUser.id, profile.id);
            setIsChatUnlocked(unlocked);
        } else {
            alert("Errore durante l'analisi della compatibilità. Riprova più tardi.");
            setIsExplanationExpanded(false);
        }
        setIsExplanationLoading(false);
    };





    if (matchScore === null) return null;

    return (
        <div className="compatibility-card glass-card animate-fade-in-up" style={{ animationDelay: '0.1s', position: 'relative' }}>
            <div className="compatibility-header">
                <div className="compatibility-score-circle">
                    <svg viewBox="0 0 36 36" className="circular-chart">
                        <path className="circle-bg"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path className="circle"
                            strokeDasharray={`${matchScore}, 100`}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <text x="18" y="20.35" className="percentage">
                            {isEstimated ? '~' : ''}{matchScore}%
                        </text>
                    </svg>
                </div>
                <div className="compatibility-info">
                    <h3 className="compatibility-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isEstimated ? 'Affinità Stimata' : 'Affinità Confermata'}
                        {!isEstimated && <span className="ai-badge" title="Calcolata da AI">✨ AI</span>}
                    </h3>
                    <p className="compatibility-subtitle">Affinità Baudriana</p>
                </div>

                {compatibilityExplanation && (
                    <button
                        className={`btn-toggle-compatibility ${isExplanationExpanded ? 'expanded' : ''}`}
                        onClick={() => setIsExplanationExpanded(!isExplanationExpanded)}
                        aria-label={isExplanationExpanded ? 'Riduci' : 'Espandi'}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </button>
                )}
            </div>

            <div className={`compatibility-reasoning ${isExplanationExpanded || !compatibilityExplanation ? 'expanded' : 'collapsed'}`}>
                {isExplanationLoading ? (
                    <div className="compatibility-loading">
                        <span className="shimmer">Analisi profonda in corso... 🧠 Dai tempo all'AI di scandagliare le vostre vite.</span>
                    </div>
                ) : compatibilityExplanation ? (
                    <>
                        <p className="compatibility-text">
                            {compatibilityExplanation.split(/(\*\*.*?\*\*)/).map((part, index) => {
                                if (part.startsWith('**') && part.endsWith('**')) {
                                    return <strong key={index}>{part.slice(2, -2)}</strong>;
                                }
                                return part;
                            })}
                        </p>
                    </>
                ) : (
                    <div className="compatibility-empty-state">
                        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginBottom: '12px', marginTop: '4px' }}>
                            Vuoi un'analisi psicanalitica completa sui vostri punti in comune?
                        </p>
                        <button
                            className="btn-regenerate-ai"
                            style={{ margin: '0', cursor: 'pointer', zIndex: 10, position: 'relative' }}
                            onClick={handleGenerateCompatibility}
                        >
                            ✨ Genera Analisi AI
                        </button>
                    </div>
                )}

                {/* Chat Unlock Message */}
                {!isChatUnlocked && (
                    <div className="chat-unlock-info" style={{
                        marginTop: '20px',
                        padding: '12px',
                        background: 'rgba(139, 92, 246, 0.1)',
                        border: '1px dashed rgba(139, 92, 246, 0.3)',
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                        lineHeight: '1.4',
                        color: 'rgba(255, 255, 255, 0.9)'
                    }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <span style={{ fontSize: '1.2rem' }}>🔒</span>
                            <p>
                                <strong>La chat privata è bloccata.</strong><br />
                                {isEstimated ? (
                                    "Genera l'analisi AI per mostrare la tua curiosità. Se anche l'altro ricambierà, potrete messaggiare!"
                                ) : (
                                    "Hai già mostrato curiosità! Ora tocca all'altro: se genererà la compatibilità con te, la chat si sbloccherà ✨"
                                )}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};
