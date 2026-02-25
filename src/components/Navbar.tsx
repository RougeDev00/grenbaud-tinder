import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { NotificationBell } from './Notifications/NotificationBell';
import './Navbar.css';

interface NavbarProps {
    unreadCount?: number;
}

const Navbar: React.FC<NavbarProps> = ({ unreadCount = 0 }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems: { path: string; label: string; icon: React.ReactNode; badge?: number }[] = [
        {
            path: '/',
            label: 'Tutti',
            icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
            ),
        },
        {
            path: '/threads',
            label: 'Esplora',
            icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                </svg>
            ),
        },
        {
            path: '/events',
            label: 'Eventi',
            icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
            ),
        },
        {
            path: '/messages',
            label: 'Messaggi',
            icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
            ),
            badge: unreadCount,
        },
        {
            path: '/profile',
            label: 'Profilo',
            icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
            ),
        },
    ];

    const isActive = (path: string) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    return (
        <>
            {/* Top header bar with logo — Ultra Premium */}
            <header className="navbar-header">
                {/* Animated mesh background */}
                <div className="header-mesh-bg">
                    <svg className="header-mesh-svg" viewBox="0 0 800 120" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="meshGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.15" />
                                <stop offset="50%" stopColor="#a855f7" stopOpacity="0.08" />
                                <stop offset="100%" stopColor="#ec4899" stopOpacity="0.12" />
                            </linearGradient>
                            <linearGradient id="meshGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.1" />
                                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.06" />
                            </linearGradient>
                            <radialGradient id="glowCenter" cx="50%" cy="50%" r="40%">
                                <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.2" />
                                <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
                            </radialGradient>
                        </defs>
                        {/* Grid lines */}
                        <g className="header-grid-lines" stroke="rgba(139,92,246,0.06)" strokeWidth="0.5" fill="none">
                            {Array.from({ length: 16 }, (_, i) => (
                                <line key={`v${i}`} x1={i * 53} y1="0" x2={i * 53} y2="120" />
                            ))}
                            {Array.from({ length: 5 }, (_, i) => (
                                <line key={`h${i}`} x1="0" y1={i * 30} x2="800" y2={i * 30} />
                            ))}
                        </g>
                        {/* Flowing wave 1 */}
                        <path className="header-wave header-wave-1" d="M0,80 C150,40 300,100 450,60 C600,20 700,90 800,50" fill="none" stroke="url(#meshGrad1)" strokeWidth="1.5" />
                        {/* Flowing wave 2 */}
                        <path className="header-wave header-wave-2" d="M0,40 C100,80 250,20 400,70 C550,120 650,30 800,80" fill="none" stroke="url(#meshGrad2)" strokeWidth="1" />
                        {/* Center glow orb */}
                        <circle className="header-glow-orb" cx="400" cy="60" r="120" fill="url(#glowCenter)" />
                        {/* Floating particles */}
                        <circle className="header-particle header-particle-1" cx="150" cy="30" r="1.5" fill="#a78bfa" opacity="0.4" />
                        <circle className="header-particle header-particle-2" cx="350" cy="80" r="1" fill="#c084fc" opacity="0.3" />
                        <circle className="header-particle header-particle-3" cx="550" cy="25" r="2" fill="#818cf8" opacity="0.35" />
                        <circle className="header-particle header-particle-4" cx="650" cy="70" r="1.2" fill="#a78bfa" opacity="0.25" />
                        <circle className="header-particle header-particle-5" cx="100" cy="90" r="1.8" fill="#c084fc" opacity="0.3" />
                    </svg>
                </div>

                {/* Accent border line */}
                <div className="header-accent-line" />

                {/* Content */}
                <div className="navbar-header-inner">
                    <div className="navbar-header-left">
                        <div className="navbar-version-pill">
                            <span className="version-dot" />
                            <span className="version-text">v0.7.4β</span>
                            <span className="version-divider" />
                            <span className="version-beta">β</span>
                        </div>
                    </div>
                    <div className="navbar-header-center">
                        <img
                            src="/baudr-logo.png"
                            alt="Baudr"
                            className="navbar-logo"
                            onClick={() => navigate('/')}
                        />
                        <span className="navbar-tagline">Community di GrenBaud</span>
                    </div>
                    <div className="navbar-header-right">
                        <NotificationBell />
                    </div>
                </div>
            </header>

            {/* Bottom navigation tabs */}
            <nav className="navbar">
                {navItems.map(item => (
                    <button
                        key={item.path}
                        className={`navbar-item ${isActive(item.path) ? 'navbar-item--active' : ''}`}
                        onClick={() => navigate(item.path)}
                    >
                        <span className="navbar-icon">
                            {item.icon}
                            {item.badge != null && item.badge > 0 && (
                                <span className="navbar-badge">{item.badge > 99 ? '99+' : item.badge}</span>
                            )}
                        </span>
                        <span className="navbar-label">{item.label}</span>
                        {isActive(item.path) && <div className="navbar-indicator" />}
                    </button>
                ))}
            </nav>
        </>
    );
};

export default Navbar;
