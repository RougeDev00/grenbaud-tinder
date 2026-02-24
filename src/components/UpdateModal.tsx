import React, { useState, useEffect } from 'react';

// ── All versions, newest first ──
const ALL_VERSIONS = [
    {
        version: '0.7.1',
        date: '24 Feb 2026',
        items: [
            { emoji: '🎨', text: 'Header ridisegnato con logo centrato' },
            { emoji: '✨', text: 'Nuova tagline "Community di GrenBaud"' },
            { emoji: '🏷️', text: 'Badge versione premium nell\'header' },
            { emoji: '🧹', text: 'Layout più pulito e compatto' },
        ],
    },
    {
        version: '0.7',
        date: '24 Feb 2026',
        items: [
            { emoji: '🔒', text: 'Sicurezza account admin potenziata' },
            { emoji: '🛡️', text: 'Protezione dati migliorata su eventi e post' },
            { emoji: '⚡', text: 'Like più affidabili e veloci' },
            { emoji: '🐛', text: 'Fix e miglioramenti generali' },
        ],
    },
    {
        version: '0.6',
        date: '22 Feb 2026',
        items: [
            { emoji: '🎯', text: 'Compatibilità stimata più precisa e variata' },
            { emoji: '💬', text: 'Tooltip sui like: vedi chi ha messo like ai post' },
            { emoji: '👑', text: 'Account GOLD per il CEO di Baudr' },
            { emoji: '🛡️', text: 'Privilegi admin: elimina post/commenti, pinna post' },
            { emoji: '📌', text: 'Post pinnati in cima al feed' },
            { emoji: '🐛', text: 'Fix vari e miglioramenti prestazioni' },
        ],
    },
];

const CURRENT_VERSION = ALL_VERSIONS[0].version;

interface UpdateModalProps {
    onClose: () => void;
}

const UpdateModal: React.FC<UpdateModalProps> = ({ onClose }) => {
    const lastSeen = localStorage.getItem('baudr_last_version');

    // Find which versions the user hasn't seen
    const missedVersions = lastSeen
        ? ALL_VERSIONS.filter(v => compareVersions(v.version, lastSeen) > 0)
        : ALL_VERSIONS; // never opened → show all

    const [currentPage, setCurrentPage] = useState(0);
    const total = missedVersions.length;
    const current = missedVersions[currentPage];

    if (!current) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            animation: 'fadeIn 0.3s ease',
        }}>
            <div style={{
                background: 'linear-gradient(145deg, #0f0a1e 0%, #1a1030 50%, #150d25 100%)',
                border: '1px solid rgba(139, 92, 246, 0.25)',
                borderRadius: '24px',
                padding: '32px',
                maxWidth: '440px',
                width: '90%',
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 60px rgba(139, 92, 246, 0.08)',
                animation: 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                position: 'relative',
            }}>
                {/* Version badge */}
                <div style={{
                    position: 'absolute',
                    top: '-14px',
                    right: '20px',
                    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                    color: '#1a1000',
                    fontWeight: 800,
                    fontSize: '0.7rem',
                    padding: '5px 14px',
                    borderRadius: '20px',
                    letterSpacing: '1px',
                    boxShadow: '0 4px 12px rgba(255, 215, 0, 0.3)',
                }}>
                    v{current.version}
                </div>

                {/* Pagination dots */}
                {total > 1 && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '6px',
                        marginBottom: '16px',
                    }}>
                        {missedVersions.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentPage(i)}
                                style={{
                                    width: i === currentPage ? '20px' : '8px',
                                    height: '8px',
                                    borderRadius: '4px',
                                    border: 'none',
                                    background: i === currentPage
                                        ? 'linear-gradient(90deg, #a78bfa, #7c3aed)'
                                        : 'rgba(255,255,255,0.15)',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    padding: 0,
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* Icon + Title */}
                <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🚀</div>
                <h2 style={{
                    color: '#fff',
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    margin: '0 0 4px 0',
                    fontFamily: "'Outfit', sans-serif",
                }}>
                    {total > 1 ? `Novità v${current.version}` : 'Baudr si è aggiornato!'}
                </h2>
                <p style={{
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: '0.75rem',
                    margin: '0 0 16px 0',
                    fontFamily: "'Inter', sans-serif",
                }}>
                    {current.date}
                    {total > 1 && ` · ${currentPage + 1}/${total}`}
                </p>

                {/* Changes list — scrollable */}
                <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '16px',
                    padding: '14px 16px',
                    border: '1px solid rgba(255,255,255,0.06)',
                    overflowY: 'auto',
                    maxHeight: '240px',
                    flex: 1,
                }}>
                    {current.items.map((item, idx) => (
                        <div key={idx} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '7px 0',
                            borderBottom: idx < current.items.length - 1
                                ? '1px solid rgba(255,255,255,0.04)'
                                : 'none',
                        }}>
                            <span style={{ fontSize: '1rem', flexShrink: 0 }}>{item.emoji}</span>
                            <span style={{
                                color: 'rgba(255,255,255,0.85)',
                                fontSize: '0.82rem',
                                fontWeight: 500,
                                fontFamily: "'Inter', sans-serif",
                            }}>{item.text}</span>
                        </div>
                    ))}
                </div>

                {/* Navigation + Close */}
                <div style={{
                    display: 'flex',
                    gap: '10px',
                    marginTop: '18px',
                }}>
                    {total > 1 && currentPage < total - 1 && (
                        <button
                            onClick={() => setCurrentPage(p => p + 1)}
                            style={{
                                flex: 1,
                                padding: '12px',
                                borderRadius: '12px',
                                border: '1px solid rgba(139, 92, 246, 0.3)',
                                background: 'rgba(139, 92, 246, 0.1)',
                                color: '#a78bfa',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                fontFamily: "'Outfit', sans-serif",
                                transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                            }}
                        >
                            ← Precedente
                        </button>
                    )}
                    {total > 1 && currentPage > 0 && (
                        <button
                            onClick={() => setCurrentPage(p => p - 1)}
                            style={{
                                flex: 1,
                                padding: '12px',
                                borderRadius: '12px',
                                border: '1px solid rgba(139, 92, 246, 0.3)',
                                background: 'rgba(139, 92, 246, 0.1)',
                                color: '#a78bfa',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                fontFamily: "'Outfit', sans-serif",
                                transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                            }}
                        >
                            Successiva →
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        style={{
                            flex: 2,
                            padding: '12px',
                            borderRadius: '12px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            fontFamily: "'Outfit', sans-serif",
                            transition: 'all 0.2s ease',
                            boxShadow: '0 4px 15px rgba(124, 58, 237, 0.3)',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(124, 58, 237, 0.4)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(124, 58, 237, 0.3)';
                        }}
                    >
                        Ho capito! 🎉
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(30px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );
};

/**
 * Compare two semver-like strings. Returns > 0 if a > b, 0 if equal, < 0 if a < b.
 */
function compareVersions(a: string, b: string): number {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const na = pa[i] ?? 0;
        const nb = pb[i] ?? 0;
        if (na !== nb) return na - nb;
    }
    return 0;
}

/**
 * Hook to show the update modal once per version.
 */
export const useUpdateModal = () => {
    const [showUpdate, setShowUpdate] = useState(false);

    useEffect(() => {
        const lastSeenVersion = localStorage.getItem('baudr_last_version');
        if (lastSeenVersion !== CURRENT_VERSION) {
            setShowUpdate(true);
        }
    }, []);

    const handleClose = () => {
        localStorage.setItem('baudr_last_version', CURRENT_VERSION);
        setShowUpdate(false);
    };

    return { showUpdate, handleClose };
};

export default UpdateModal;
