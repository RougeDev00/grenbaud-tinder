import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import logoText from '../assets/logo-text-v2.png';
import './Landing.css';

import TermsModal from './TermsModal';

interface LandingProps {
    onLogin: () => void;
}

const Landing: React.FC<LandingProps> = ({ onLogin }) => {
    const { signInWithTwitch, isMockMode } = useAuth();
    const [showTerms, setShowTerms] = React.useState(false);

    const handleAuth = async (intent: 'create' | 'login') => {
        localStorage.setItem('auth_intent', intent);
        if (isMockMode) {
            onLogin();
        } else {
            await signInWithTwitch();
        }
    };

    const TwitchIcon = () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
        </svg>
    );

    return (
        <div className="landing">
            {/* Ambient glow */}
            <div className="landing-ambient" />

            <div className="landing-content animate-fade-in-up">
                {/* Logo */}
                <div className="landing-logo-container">
                    <img
                        src={logoText}
                        alt="Baudr"
                        className="landing-logo-main"
                    />
                    <p className="landing-tagline">
                        Community esclusiva per gli abbonati di GrenBaud
                    </p>
                </div>

                {/* Feature pills with SVG icons */}
                <div className="landing-features">
                    <div className="feature-pill">
                        <span className="feature-icon">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                        </span>
                        <span>Solo subscriber</span>
                    </div>
                    <div className="feature-pill">
                        <span className="feature-icon">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        </span>
                        <span>Community match</span>
                    </div>
                    <div className="feature-pill">
                        <span className="feature-icon">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                        </span>
                        <span>100% esclusivo</span>
                    </div>
                </div>

                {/* CTA */}
                <div className="landing-cta-group">
                    <button
                        className="btn btn-twitch landing-btn-create"
                        onClick={() => handleAuth('create')}
                    >
                        <TwitchIcon />
                        Crea Account con Twitch
                    </button>

                    <div className="landing-separator">
                        <span className="landing-separator-line" />
                        <span className="landing-separator-text">oppure</span>
                        <span className="landing-separator-line" />
                    </div>

                    <button
                        className="landing-btn-login"
                        onClick={() => handleAuth('login')}
                    >
                        <TwitchIcon />
                        <span>Hai già un account? <strong>Accedi</strong></span>
                    </button>
                </div>

                {/* Mission Footer */}
                <div className="landing-mission-footer">
                    <p className="mission-text">
                        Baudr è un progetto sviluppato da <strong>GrenBaud</strong> con l'aiuto dell'AI.
                        <br />
                        Vogliamo che sia un posto sereno dove chi si sente solo può trovare nuovi amici. 💜
                    </p>
                    <button className="terms-link-btn" onClick={() => setShowTerms(true)}>
                        Termini e Condizioni
                    </button>
                </div>

                <p className="landing-disclaimer">
                    Devi essere sub di GrenBaud per accedere.
                    <br />
                    <a href="https://twitch.tv/subs/grenbaud" target="_blank" rel="noreferrer" className="sub-link-highlight">
                        Abbonati ora per entrare!
                    </a>
                </p>

                <p style={{ opacity: 0.7, fontSize: '0.8rem', marginTop: '1rem', color: 'rgba(255,255,255,0.5)' }}>v0.2.5-fix</p>
            </div>

            {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
        </div>
    );
};

export default Landing;
