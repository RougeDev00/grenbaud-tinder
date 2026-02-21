import React from 'react';
import type { AppView } from '../types';
import './Navbar.css';

interface NavbarProps {
    currentView: AppView;
    onNavigate: (view: AppView) => void;
    unreadCount?: number;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, unreadCount = 0 }) => {
    const navItems: { view: AppView; label: string; icon: React.ReactNode; badge?: number }[] = [
        {
            view: 'explore',
            label: 'Tutti',
            icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
            ),
        },
        {
            view: 'aimatch',
            label: 'AI Match',
            icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
            ),
        },
        {
            view: 'chat',
            label: 'Messaggi',
            icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
            ),
            badge: unreadCount,
        },
        {
            view: 'profile',
            label: 'Profilo',
            icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
            ),
        },
    ];

    return (
        <nav className="navbar">
            {navItems.map(item => (
                <button
                    key={item.view}
                    className={`navbar-item ${currentView === item.view ? 'navbar-item--active' : ''}`}
                    onClick={() => onNavigate(item.view)}
                >
                    <span className="navbar-icon">
                        {item.icon}
                        {item.badge != null && item.badge > 0 && (
                            <span className="navbar-badge">{item.badge > 99 ? '99+' : item.badge}</span>
                        )}
                    </span>
                    <span className="navbar-label">{item.label}</span>
                    {currentView === item.view && <div className="navbar-indicator" />}
                </button>
            ))}
        </nav>
    );
};

export default Navbar;
