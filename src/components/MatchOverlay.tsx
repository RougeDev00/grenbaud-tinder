import React, { useEffect, useState } from 'react';
import type { Profile } from '../types';
import './MatchOverlay.css';

interface MatchOverlayProps {
    matchedProfile: Profile;
    currentUser: Profile;
    onClose: () => void;
}

const MatchOverlay: React.FC<MatchOverlayProps> = ({ matchedProfile, currentUser, onClose }) => {
    const [confetti, setConfetti] = useState<Array<{ id: number; left: string; delay: string; color: string; size: number }>>([]);

    useEffect(() => {
        const colors = ['#8B5CF6', '#A78BFA', '#C4B5FD', '#F43F5E', '#EC4899', '#F59E0B'];
        const pieces = Array.from({ length: 35 }, (_, i) => ({
            id: i,
            left: `${Math.random() * 100}%`,
            delay: `${Math.random() * 1}s`,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: 5 + Math.random() * 7,
        }));
        setConfetti(pieces);
    }, []);

    return (
        <div className="match-overlay" onClick={onClose}>
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
                        }}
                    />
                ))}
            </div>

            <div className="match-content animate-fade-in-scale" onClick={e => e.stopPropagation()}>
                <h1 className="match-title">
                    <span className="text-gradient">È un Match!</span>
                </h1>
                <p className="match-subtitle">
                    Tu e <strong>{matchedProfile.display_name}</strong> vi piacete a vicenda
                </p>

                {/* Avatars */}
                <div className="match-avatars">
                    <div className="match-avatar match-avatar--left">
                        <img
                            src={currentUser.photo_1 || 'https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=200&h=200&fit=crop'}
                            alt="Tu"
                        />
                    </div>
                    <div className="match-heart">
                        <svg viewBox="0 0 24 24" fill="white">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                    </div>
                    <div className="match-avatar match-avatar--right">
                        <img
                            src={matchedProfile.photo_1}
                            alt={matchedProfile.display_name}
                        />
                    </div>
                </div>

                <button className="btn btn-primary match-btn" onClick={onClose}>
                    Continua
                </button>
            </div>
        </div>
    );
};

export default MatchOverlay;
