import React, { useState, useEffect } from 'react';

const DISMISS_KEY = 'baudr_pwa_install_dismissed';

/**
 * Detects if user is on iOS Safari (not in standalone PWA mode).
 * Only shows the install prompt on iPhones/iPads that haven't installed the app.
 */
const isIOSSafari = (): boolean => {
    const ua = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/.test(ua);
    const isStandalone = (window.navigator as any).standalone === true;
    // Already in PWA mode — don't show
    if (isStandalone) return false;
    return isIOS;
};

const InstallPrompt: React.FC = () => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const dismissed = localStorage.getItem(DISMISS_KEY);
        if (dismissed === 'true') return;
        if (isIOSSafari()) {
            // Small delay so it doesn't pop up immediately
            const t = setTimeout(() => setShow(true), 1500);
            return () => clearTimeout(t);
        }
    }, []);

    if (!show) return null;

    const handleClose = () => setShow(false);

    const handleDismissForever = () => {
        localStorage.setItem(DISMISS_KEY, 'true');
        setShow(false);
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10010,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            animation: 'pwaFadeIn 0.3s ease',
            padding: '0 16px',
            paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
        }}>
            <div style={{
                background: 'linear-gradient(180deg, #1a1730 0%, #0f0d1a 100%)',
                border: '1px solid rgba(139, 92, 246, 0.25)',
                borderRadius: '24px',
                padding: '28px 24px 20px',
                maxWidth: '380px',
                width: '100%',
                animation: 'pwaSlideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                boxShadow: '0 -10px 40px rgba(0,0,0,0.5), 0 0 60px rgba(139, 92, 246, 0.1)',
                textAlign: 'center',
            }}>
                {/* Icon */}
                <div style={{
                    fontSize: '3rem',
                    marginBottom: '12px',
                    filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.3))',
                }}>📲</div>

                {/* Title */}
                <h3 style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: '1.3rem',
                    fontWeight: 800,
                    color: '#fff',
                    margin: '0 0 8px',
                    lineHeight: 1.2,
                }}>
                    Installa Baudr sul telefono!
                </h3>

                {/* Description */}
                <p style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '0.85rem',
                    color: 'rgba(255,255,255,0.6)',
                    margin: '0 0 20px',
                    lineHeight: 1.5,
                }}>
                    Aggiungi Baudr alla Home per un'esperienza app completa, senza barra del browser!
                </p>

                {/* Steps */}
                <div style={{
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: '16px',
                    padding: '16px',
                    border: '1px solid rgba(255,255,255,0.06)',
                    textAlign: 'left',
                    marginBottom: '20px',
                }}>
                    {[
                        { num: '1', text: 'Tocca l\'icona', icon: '⬆️', highlight: 'Condividi', highlightStyle: { background: 'rgba(0,122,255,0.15)', color: '#4da3ff', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 as const } },
                        { num: '2', text: 'Scorri e seleziona', icon: '➕', highlight: '"Aggiungi alla schermata Home"', highlightStyle: { fontWeight: 700 as const, color: '#fff' } },
                        { num: '3', text: 'Conferma con', icon: '✅', highlight: '"Aggiungi"', highlightStyle: { fontWeight: 700 as const, color: '#a78bfa' } },
                    ].map((step) => (
                        <div key={step.num} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '8px 0',
                            borderBottom: step.num !== '3' ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        }}>
                            <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                color: '#fff',
                                flexShrink: 0,
                            }}>
                                {step.num}
                            </div>
                            <span style={{
                                fontSize: '0.82rem',
                                color: 'rgba(255,255,255,0.7)',
                                fontFamily: "'Inter', sans-serif",
                            }}>
                                {step.icon} {step.text} <span style={step.highlightStyle}>{step.highlight}</span>
                            </span>
                        </div>
                    ))}
                </div>

                {/* CTA Button */}
                <button
                    onClick={handleClose}
                    style={{
                        width: '100%',
                        padding: '14px',
                        borderRadius: '14px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        fontFamily: "'Outfit', sans-serif",
                        cursor: 'pointer',
                        marginBottom: '10px',
                        boxShadow: '0 4px 16px rgba(124, 58, 237, 0.3)',
                    }}
                >
                    Ho capito! 🚀
                </button>

                {/* Dismiss forever */}
                <button
                    onClick={handleDismissForever}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'rgba(255,255,255,0.3)',
                        fontSize: '0.75rem',
                        fontFamily: "'Inter', sans-serif",
                        cursor: 'pointer',
                        padding: '6px',
                        width: '100%',
                    }}
                >
                    Non mostrare più
                </button>
            </div>

            <style>{`
                @keyframes pwaFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes pwaSlideUp {
                    from { opacity: 0; transform: translateY(60px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );
};

export default InstallPrompt;
