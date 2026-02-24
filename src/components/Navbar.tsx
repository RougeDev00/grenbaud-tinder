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
            {/* Top header bar with logo */}
            <header className="navbar-header">
                <div className="navbar-header-left">
                    <span className="navbar-version-badge">v0.7.1</span>
                    <span className="navbar-version-beta">beta</span>
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
