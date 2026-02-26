import React, { useEffect, useState, useCallback } from 'react';
import type { Profile } from '../types';
import './MatchOverlay.css';

interface MatchOverlayProps {
    matchedProfile: Profile;
    currentUser: Profile;
    onClose: () => void;
    onOpenChat?: (user: Profile) => void;
}

const MatchOverlay: React.FC<MatchOverlayProps> = ({ matchedProfile, currentUser, onClose, onOpenChat }) => {
    const [confetti, setConfetti] = useState<Array<{ id: number; left: string; delay: string; color: string; size: number; rotation: number }>>([]);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const colors = ['#8B5CF6', '#A78BFA', '#C4B5FD', '#F43F5E', '#EC4899', '#F59E0B', '#34D399', '#60A5FA'];
        const pieces = Array.from({ length: 50 }, (_, i) => ({
            id: i,
            left: `${Math.random() * 100}%`,
            delay: `${Math.random() * 1.5}s`,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: 4 + Math.random() * 8,
            rotation: Math.random() * 360,
        }));
        setConfetti(pieces);
        requestAnimationFrame(() => setVisible(true));
    }, []);

    const handleClose = useCallback(() => {
        setVisible(false);
        setTimeout(onClose, 300);
    }, [onClose]);

    const handleOpenChat = useCallback(() => {
        setVisible(false);
        setTimeout(() => {
            onClose();
            onOpenChat?.(matchedProfile);
        }, 300);
    }, [onClose, onOpenChat, matchedProfile]);

    return (
        <div className={`match-overlay ${visible ? 'match-overlay--visible' : ''}`} onClick={handleClose}>
            {/* Confetti */}
            <div className="match-confetti">
                {confetti.map(piece => (
                    <div
                        key={piece.id}
                        className="confetti-piece"
                        style={{
                            left: piece.left,
                            animationDelay: piece.delay,
                            backgroundColor: piece.color,
                            width: `${piece.size}px`,
                            height: `${piece.size}px`,
                            transform: `rotate(${piece.rotation}deg)`,
                        }}
                    />
                ))}
            </div>

            {/* Glow rings */}
            <div className="match-glow-ring match-glow-ring--1" />
            <div className="match-glow-ring match-glow-ring--2" />

            <div className="match-content" onClick={e => e.stopPropagation()}>
                {/* Sparkle badge */}
                <div className="match-sparkle-badge">
                    <span>⚡</span>
                </div>

                <h1 className="match-title">
                    <span className="match-title-text">Connessione!</span>
                </h1>
                <p className="match-subtitle">
                    Tu e <strong>{matchedProfile.display_name}</strong> siete curiosi l'uno dell'altro
                </p>

                {/* Avatars */}
                <div className="match-avatars">
                    <div className="match-avatar match-avatar--left">
                        <img
                            src={currentUser.photo_1 || 'https://via.placeholder.com/120'}
                            alt="Tu"
                        />
                    </div>
                    <div className="match-icon-container">
                        <div className="match-icon-pulse" />
                        <div className="match-icon">
                            <span>🤝</span>
                        </div>
                    </div>
                    <div className="match-avatar match-avatar--right">
                        <img
                            src={matchedProfile.photo_1 || 'https://via.placeholder.com/120'}
                            alt={matchedProfile.display_name}
                        />
                    </div>
                </div>

                <div className="match-unlock-message">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0"></path>
                    </svg>
                    <span>La chat è ora sbloccata! Potete scrivervi 💬</span>
                </div>

                <div className="match-actions">
                    <button className="match-btn match-btn--chat" onClick={handleOpenChat}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        Scrivi un messaggio
                    </button>
                    <button className="match-btn match-btn--close" onClick={handleClose}>
                        Continua a esplorare
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MatchOverlay;
