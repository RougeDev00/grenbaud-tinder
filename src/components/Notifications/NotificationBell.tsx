import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications
} from '../../services/notificationService';
import type { Notification } from '../../services/notificationService';
import './NotificationBell.css';
import { supabase } from '../../lib/supabase';

export const NotificationBell: React.FC = () => {
    const { user, profile } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const location = useLocation();

    const unreadCount = notifications.filter(n => !n.read).length;

    useEffect(() => {
        // We use profile?.id instead of user?.id because mock users have profiles but no real auth user
        const targetId = profile?.id || user?.id;
        if (!targetId) return;

        const fetchNotifs = async () => {
            const data = await getNotifications(targetId);
            setNotifications(data);
        };

        fetchNotifs();

        // Realtime subscription
        const channel = supabase
            .channel('public:notifications')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${targetId}`
                },
                () => {
                    fetchNotifs(); // Re-fetch on any change
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, profile]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Close on navigation
    useEffect(() => {
        setIsOpen(false);
    }, [location.pathname]);

    const handleMarkAllRead = async () => {
        const targetId = profile?.id || user?.id;
        if (!targetId || unreadCount === 0) return;
        const success = await markAllAsRead(targetId);
        if (success) {
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        }
    };

    const handleToggle = () => {
        const opening = !isOpen;
        setIsOpen(opening);
        // Auto-mark all as read when opening the dropdown
        if (opening) {
            handleMarkAllRead();
        }
    };

    const handleDeleteAll = async () => {
        const targetId = profile?.id || user?.id;
        if (!targetId || notifications.length === 0) return;
        if (!window.confirm('Sei sicuro di voler eliminare tutte le notifiche?')) return;

        const success = await deleteAllNotifications(targetId);
        if (success) {
            setNotifications([]);
        }
    };

    const handleDeleteSingle = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // prevent clicking the notification body
        const success = await deleteNotification(id);
        if (success) {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }
    };

    const handleNotificationClick = async (notif: Notification) => {
        if (!notif.read) {
            await markAsRead(notif.id);
            setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
        }

        switch (notif.type) {
            case 'SPY':
            case 'SPY_RECIPROCAL':
                if (notif.actor_id) {
                    navigate(`/?profile=${notif.actor_id}`);
                } else {
                    navigate('/');
                }
                break;
            case 'EVENT_REQUEST':
                // navigate to the specific event page or event management
                if (notif.reference_id) {
                    navigate(`/events?manage=${notif.reference_id}`);
                } else {
                    navigate('/events');
                }
                break;
            case 'EVENT_ACCEPT':
            case 'EVENT_REJECT':
                navigate('/events?tab=mine');
                break;
            case 'ESPLORA_LIKE':
            case 'ESPLORA_COMMENT':
            case 'ESPLORA_REPLY':
                if (notif.reference_id) {
                    navigate(`/threads?focusPost=${notif.reference_id}`);
                } else {
                    navigate('/threads');
                }
                break;
            default:
                break;
        }
        setIsOpen(false);
    };

    const formatTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Ora';
        if (diffMins < 60) return `${diffMins} min fa`;
        if (diffHours < 24) return `${diffHours} h fa`;
        if (diffDays === 1) return `Ieri`;
        return `${diffDays} gg fa`;
    };

    const getNotificationContent = (notif: Notification) => {
        const actorName = notif.actor_profile?.twitch_username || notif.actor_profile?.display_name || 'Un utente anonimo';

        switch (notif.type) {
            case 'SPY':
                return {
                    icon: '👀',
                    title: `Curiosità da ${actorName}`,
                    text: `Ha appena dato un'occhiata alla vostra compatibilità!`,
                    color: '#7c3aed'
                };
            case 'SPY_RECIPROCAL':
                return {
                    icon: '✨',
                    title: `Curiosità Ricambiata!`,
                    text: `${actorName} ha ricambiato la curiosità su di te.. scrivigli subito!`,
                    color: '#8b5cf6'
                };
            case 'EVENT_REQUEST':
                return {
                    icon: '🎫',
                    title: 'Nuova Richiesta',
                    text: `${actorName} vuole partecipare al tuo evento!`,
                    color: '#f59e0b'
                };
            case 'EVENT_ACCEPT':
                return {
                    icon: '✅',
                    title: 'Richiesta Accettata',
                    text: `${actorName} ha accettato la tua richiesta per l'evento.`,
                    color: '#10b981'
                };
            case 'EVENT_REJECT':
                return {
                    icon: '❌',
                    title: 'Richiesta Rifiutata',
                    text: `${actorName} non ha accettato la tua richiesta per l'evento.`,
                    color: '#ef4444'
                };
            case 'EVENT_REMOVE':
                return {
                    icon: '🚫',
                    title: 'Rimosso dall\'Evento',
                    text: `${actorName} ti ha rimosso dai partecipanti dell'evento.`,
                    color: '#f43f5e'
                };
            case 'ESPLORA_LIKE':
                return {
                    icon: '❤️',
                    title: 'Nuovo Like!',
                    text: `@${notif.actor_profile?.twitch_username || actorName} ha messo like a un tuo post!`,
                    color: '#e11d48'
                };
            case 'ESPLORA_COMMENT':
                return {
                    icon: '💬',
                    title: 'Nuovo Commento!',
                    text: `@${notif.actor_profile?.twitch_username || actorName} ha commentato un tuo post!`,
                    color: '#3b82f6'
                };
            case 'ESPLORA_REPLY':
                return {
                    icon: '↩️',
                    title: 'Nuova Risposta!',
                    text: `@${notif.actor_profile?.twitch_username || actorName} ha risposto al tuo commento!`,
                    color: '#06b6d4'
                };
            default:
                return {
                    icon: '🔔',
                    title: 'Nuova Notifica',
                    text: 'Hai una nuova notifica.',
                    color: '#64748b'
                };
        }
    };

    if (!user && !profile) return null;

    return (
        <div className="notification-bell-container" ref={dropdownRef}>
            <button className={`bell-btn ${unreadCount > 0 ? 'has-unread' : ''}`} onClick={handleToggle}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {unreadCount > 0 && (
                    <span className="badge-count animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="notification-dropdown animate-fade-in-up">
                    <div className="dropdown-header">
                        <h3>Notifiche</h3>
                        <div className="header-actions">
                            {unreadCount > 0 && (
                                <button className="btn-text" onClick={handleMarkAllRead}>Segna come lette</button>
                            )}
                            {notifications.length > 0 && (
                                <button className="btn-icon-danger" onClick={handleDeleteAll} title="Elimina tutte">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="notification-list">
                        {notifications.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">📭</div>
                                <p>Nessuna notifica</p>
                            </div>
                        ) : (
                            notifications.map(notif => {
                                const { icon, title, text, color } = getNotificationContent(notif);
                                return (
                                    <div
                                        key={notif.id}
                                        className={`notification-item ${!notif.read ? 'unread' : ''}`}
                                        onClick={() => handleNotificationClick(notif)}
                                    >
                                        <div className="notif-icon-wrapper">
                                            {notif.actor_profile?.photo_1 ? (
                                                <img
                                                    src={notif.actor_profile.photo_1}
                                                    alt={notif.actor_profile.display_name}
                                                    className="notif-actor-photo"
                                                />
                                            ) : (
                                                <div className="notif-icon" style={{ backgroundColor: `${color}20`, color: color }}>
                                                    {icon}
                                                </div>
                                            )}
                                        </div>
                                        <div className="notif-content">
                                            <div className="notif-title-row">
                                                <span className="notif-title">{title}</span>
                                                <span className="notif-time">{formatTimeAgo(notif.created_at)}</span>
                                            </div>
                                            <p className="notif-text">{text}</p>
                                        </div>
                                        <button
                                            className="notif-delete-btn"
                                            onClick={(e) => handleDeleteSingle(e, notif.id)}
                                            title="Elimina"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                        </button>
                                        {!notif.read && <div className="unread-dot" />}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
