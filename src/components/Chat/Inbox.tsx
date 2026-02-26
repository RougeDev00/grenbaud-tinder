import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Profile, Message, EventWithDetails } from '../../types';
import { getConversations, subscribeToMessages, sendMessage } from '../../services/chatService';
import { getProfileByTwitchId, getProfile } from '../../services/profileService';
import { getHighScoringMatches } from '../../services/aiService';
import { checkMutualAnalysis } from '../../services/notificationService';
import { getUserEvents, getEventUnreadCount, markEventChatRead, subscribeToEventMessages } from '../../services/eventService';
import EventChat from '../Events/EventChat';
import './Inbox.css';

interface InboxProps {
    currentUser: Profile;
    onSelectChat: (otherUser: Profile) => void;
    refreshTrigger?: number;
    onRefreshUnread?: () => void;
}

interface Conversation {
    user: Profile;
    lastMessage: Message;
    unreadCount: number;
}

interface Suggestion {
    profile: Profile;
    score: number;
}

const DISMISSED_KEY = 'baudr_suggestion_dismissed';

function getDismissedIds(): string[] {
    try {
        return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]');
    } catch { return []; }
}

function addDismissedId(id: string) {
    const ids = getDismissedIds();
    if (!ids.includes(id)) {
        ids.push(id);
        localStorage.setItem(DISMISSED_KEY, JSON.stringify(ids));
    }
}

const getCategoryColor = (category: string) => {
    switch (category) {
        case 'Gaming': return '#a855f7';
        case 'Chiacchiere': return '#ec4899';
        case 'Listening Party': return '#3b82f6';
        case 'Reaction YouTube': return '#ef4444';
        default: return '#10b981';
    }
};

const Inbox: React.FC<InboxProps> = ({ currentUser, onSelectChat, refreshTrigger, onRefreshUnread }) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [dismissedIds, setDismissedIds] = useState<string[]>(getDismissedIds());
    const [sendingTo, setSendingTo] = useState<string | null>(null);
    const [userEvents, setUserEvents] = useState<EventWithDetails[]>([]);
    const [openEventChat, setOpenEventChat] = useState<EventWithDetails | null>(null);
    const [eventUnreadCounts, setEventUnreadCounts] = useState<Record<string, number>>({});
    const [searchParams, setSearchParams] = useSearchParams();

    const loadConversations = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const rawConvos = await getConversations(currentUser.twitch_id);

            const loadedConvos: Conversation[] = [];

            await Promise.all(rawConvos.map(async (c) => {
                const profile = await getProfileByTwitchId(c.userId);
                if (profile) {
                    loadedConvos.push({
                        user: profile,
                        lastMessage: c.lastMessage,
                        unreadCount: c.unreadCount,
                    });
                }
            }));

            loadedConvos.sort((a, b) =>
                new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
            );

            setConversations(loadedConvos);
        } catch (err) {
            console.error('Error loading conversations:', err);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    // Load suggestions from AI compatibility cache
    const loadSuggestions = async () => {
        try {
            const highMatches = getHighScoringMatches(currentUser.id, 80);
            const loaded: Suggestion[] = [];
            for (const match of highMatches) {
                if (loaded.length >= 6) break;
                try {
                    const profile = await getProfile(match.partnerId);
                    if (profile && profile.id !== currentUser.id) {
                        loaded.push({ profile, score: match.score });
                    }
                } catch { /* skip */ }
            }
            setSuggestions(loaded);
        } catch (err) {
            console.error('Error loading suggestions:', err);
        }
    };

    // Load user's events and their unread counts
    const loadUserEvents = async () => {
        try {
            const events = await getUserEvents(currentUser.id);
            setUserEvents(events);
            // Load unread counts for each event
            const counts: Record<string, number> = {};
            await Promise.all(events.map(async (evt) => {
                counts[evt.id] = await getEventUnreadCount(evt.id);
            }));
            setEventUnreadCounts(counts);
        } catch (err) {
            console.error('Error loading user events:', err);
        }
    };

    // Auto-open event chat if redirected from event details
    useEffect(() => {
        const eventChatId = searchParams.get('eventChat');
        if (eventChatId && userEvents.length > 0 && !loading) {
            const targetEvent = userEvents.find(e => e.id === eventChatId);
            if (targetEvent) {
                handleOpenEventChat(targetEvent);
                // Clear the param so it doesn't reopen
                const newParams = new URLSearchParams(searchParams);
                newParams.delete('eventChat');
                setSearchParams(newParams, { replace: true });
            }
        }
    }, [searchParams, userEvents, loading]);

    useEffect(() => {
        loadConversations(false);
        loadSuggestions();
        loadUserEvents();
    }, [currentUser.twitch_id, currentUser.id]);

    useEffect(() => {
        if (refreshTrigger && refreshTrigger > 0) {
            loadConversations(true);
        }
    }, [refreshTrigger]);

    useEffect(() => {
        const unsubscribe = subscribeToMessages((msg) => {
            setConversations(prev => {
                const partnerId = msg.sender_id === currentUser.twitch_id ? msg.receiver_id : msg.sender_id;
                const existingIndex = prev.findIndex(c => c.user.twitch_id === partnerId);
                if (existingIndex === -1) {
                    loadConversations(true);
                    return prev;
                }
                const updatedConvos = [...prev];
                const conv = { ...updatedConvos[existingIndex] };
                conv.lastMessage = msg;
                updatedConvos.splice(existingIndex, 1);
                updatedConvos.unshift(conv);
                return updatedConvos;
            });
        });
        const interval = setInterval(() => loadConversations(true), 10000);
        return () => { unsubscribe(); clearInterval(interval); };
    }, [currentUser.twitch_id]);

    // Subscriptions for event group chats
    useEffect(() => {
        const unsubscribes = userEvents.map(evt =>
            subscribeToEventMessages(evt.id, (newMsg) => {
                if (newMsg.sender_id !== currentUser.id) {
                    setEventUnreadCounts(prev => {
                        // If this chat is currently open, don't show unread badge and update lastread
                        if (openEventChat?.id === evt.id) {
                            markEventChatRead(evt.id);
                            return prev;
                        }
                        return {
                            ...prev,
                            [evt.id]: (prev[evt.id] || 0) + 1
                        };
                    });
                    // Trigger global navbar badge update
                    if (onRefreshUnread) onRefreshUnread();
                }
            })
        );
        return () => {
            unsubscribes.forEach(unsub => unsub());
        };
    }, [userEvents, currentUser.id, onRefreshUnread, openEventChat?.id]);

    // Polling fallback for event unread counts (every 4 seconds)
    useEffect(() => {
        if (userEvents.length === 0) return;

        const refreshEventCounts = async () => {
            const counts: Record<string, number> = {};
            await Promise.all(userEvents.map(async (evt) => {
                // If this chat is currently open, it's already read
                if (openEventChat?.id === evt.id) {
                    counts[evt.id] = 0;
                } else {
                    counts[evt.id] = await getEventUnreadCount(evt.id);
                }
            }));

            setEventUnreadCounts(prev => {
                // Check if anything actually changed
                const changed = Object.keys(counts).some(id => counts[id] !== (prev[id] || 0));
                if (changed) {
                    if (onRefreshUnread) onRefreshUnread();
                    return counts;
                }
                return prev;
            });
        };

        const interval = setInterval(refreshEventCounts, 4000);
        return () => clearInterval(interval);
    }, [userEvents, onRefreshUnread, openEventChat?.id]);

    // Filter suggestions: remove dismissed, remove already in conversations
    const conversationUserIds = useMemo(() =>
        new Set(conversations.map(c => c.user.id)),
        [conversations]
    );

    const visibleSuggestions = useMemo(() =>
        suggestions
            .filter(s => !dismissedIds.includes(s.profile.id) && !conversationUserIds.has(s.profile.id))
            .slice(0, 3),
        [suggestions, dismissedIds, conversationUserIds]
    );

    const handleDismiss = (profileId: string) => {
        addDismissedId(profileId);
        setDismissedIds(prev => [...prev, profileId]);
    };

    const handleSendCiao = async (profile: Profile) => {
        setSendingTo(profile.id);
        try {
            // ⚠️ TEMPORARILY DISABLED — re-enable by uncommenting:
            // const isAdmin = currentUser.twitch_username?.toLowerCase() === 'grenbaud';
            // if (!isAdmin) {
            const needsUnlock = true; // treat everyone equally
            if (needsUnlock) {
                const unlocked = await checkMutualAnalysis(currentUser.id, profile.id);
                if (!unlocked) {
                    alert('Devi prima generare l\'affinità AI con questo utente!');
                    return;
                }
            }
            await sendMessage(currentUser.twitch_id, profile.twitch_id, 'Ciao! 👋');
            addDismissedId(profile.id);
            setDismissedIds(prev => [...prev, profile.id]);
            await loadConversations(true);
            onSelectChat(profile);
        } catch (err) {
            console.error('Error sending message:', err);
        } finally {
            setSendingTo(null);
        }
    };

    const handleOpenEventChat = (evt: EventWithDetails) => {
        markEventChatRead(evt.id);
        setEventUnreadCounts(prev => ({ ...prev, [evt.id]: 0 }));
        if (onRefreshUnread) onRefreshUnread(); // Instant notification clear
        setOpenEventChat(evt);
    };

    // If an event chat is open, show it as an overlay
    if (openEventChat) {
        return (
            <div className="inbox-container animate-fade-in event-chat-overlay" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div className="event-chat-overlay-header" style={{ marginBottom: '20px', position: 'relative' }}>
                    <button
                        className="btn-back-chat"
                        onClick={() => {
                            if (openEventChat) markEventChatRead(openEventChat.id);
                            setOpenEventChat(null);
                            loadUserEvents();
                            if (onRefreshUnread) onRefreshUnread();
                        }}
                        style={{
                            background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                            fontSize: '0.85rem', padding: '10px 16px', borderRadius: '14px', marginBottom: '20px',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                        Torna ai messaggi
                    </button>

                    <div className="event-chat-banner" style={{
                        display: 'flex', alignItems: 'center', gap: '16px',
                        padding: '16px', background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '14px',
                            background: `linear-gradient(135deg, ${getCategoryColor(openEventChat.category)}, ${getCategoryColor(openEventChat.category)}80)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0,
                            boxShadow: `0 8px 16px -4px ${getCategoryColor(openEventChat.category)}40`
                        }}>
                            {openEventChat.category === 'Gaming' ? '🎮' :
                                openEventChat.category === 'Chiacchiere' ? '💬' :
                                    openEventChat.category === 'Listening Party' ? '🎵' :
                                        openEventChat.category === 'Reaction YouTube' ? '▶️' : '🎉'}
                        </div>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ margin: '0 0 2px 0', color: 'white', fontSize: '1.2rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>{openEventChat.title}</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="9" cy="7" r="4"></circle>
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                    </svg>
                                    {openEventChat.participants.filter(p => p.status === 'approved').length + 1} membri
                                </span>
                                <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.2)' }} />
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: getCategoryColor(openEventChat.category) }}>{openEventChat.category}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div style={{ flex: 1, minHeight: 0 }}>
                    <EventChat eventId={openEventChat.id} currentUser={currentUser} />
                </div>
            </div>
        );
    }

    if (loading) {
        return <div className="inbox-loading">Caricamento messaggi...</div>;
    }

    return (
        <div className="inbox-container animate-fade-in">
            <h2 className="inbox-title">Messaggi</h2>



            {/* Suggestions Section */}
            {visibleSuggestions.length > 0 && (
                <div className="inbox-suggestions">
                    <div className="suggestions-header">
                        <h3 className="suggestions-title">
                            <span className="suggestions-icon">✨</span>
                            Persone compatibili
                        </h3>
                        <p className="suggestions-subtitle">AI ha trovato un'alta affinità con questi profili</p>
                    </div>
                    <div className="suggestions-list">
                        {visibleSuggestions.map(({ profile, score }) => (
                            <div key={profile.id} className="suggestion-card">
                                <button
                                    className="suggestion-dismiss"
                                    onClick={(e) => { e.stopPropagation(); handleDismiss(profile.id); }}
                                    title="Nascondi"
                                >
                                    ✕
                                </button>
                                <div className="suggestion-avatar-wrap" onClick={() => onSelectChat(profile)}>
                                    <img
                                        src={profile.photo_1 || 'https://via.placeholder.com/60'}
                                        alt={profile.display_name}
                                        className="suggestion-avatar"
                                    />
                                    <span className="suggestion-score">{score}%</span>
                                </div>
                                <h4 className="suggestion-name">{profile.display_name}</h4>
                                <p className="suggestion-username">@{profile.twitch_username}</p>
                                <button
                                    className="suggestion-cta"
                                    onClick={() => handleSendCiao(profile)}
                                    disabled={sendingTo === profile.id}
                                >
                                    {sendingTo === profile.id ? '...' : '👋 Ciao!'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Conversations */}
            <div className="inbox-list">
                {conversations.length === 0 ? (
                    <div className="inbox-empty">
                        <p>Nessuna conversazione attiva.</p>
                        <p className="inbox-hint">Esplora la sezione "Tutti" per trovare qualcuno!</p>
                    </div>
                ) : (
                    conversations.map((c) => (
                        <div
                            key={c.user.twitch_id}
                            className={`inbox-item ${c.unreadCount > 0 ? 'inbox-item--unread' : ''}`}
                            onClick={() => onSelectChat(c.user)}
                        >
                            <div className="inbox-avatar-wrapper">
                                <img
                                    src={c.user.photo_1 || 'https://via.placeholder.com/50'}
                                    alt={c.user.display_name}
                                    className="inbox-avatar"
                                />
                                {c.unreadCount > 0 && (
                                    <span className="inbox-avatar-badge">{c.unreadCount}</span>
                                )}
                            </div>
                            <div className="inbox-content">
                                <div className="inbox-row">
                                    <div className="inbox-name-wrap">
                                        <h3 className="inbox-name">{c.user.display_name}</h3>
                                        <span className="inbox-display-name">@{c.user.twitch_username}</span>
                                    </div>
                                    <span className="inbox-time">
                                        {new Date(c.lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className="inbox-message-row">
                                    <p className="inbox-message-preview">
                                        {c.lastMessage.sender_id === currentUser.twitch_id ? (
                                            <span className="inbox-tick">✓</span>
                                        ) : null}
                                        {c.lastMessage.sender_id === currentUser.twitch_id ? 'Tu: ' : ''}
                                        {c.lastMessage.content}
                                    </p>
                                    {c.unreadCount > 0 && (
                                        <span className="inbox-unread-badge">{c.unreadCount}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Event Group Chats */}
            {userEvents.length > 0 && (
                <div className="inbox-event-groups">
                    <div className="inbox-event-groups-header">
                        <h3>
                            <span style={{ marginRight: '8px' }}>💬</span>
                            Chat Gruppi Evento
                        </h3>
                    </div>
                    <div className="inbox-list">
                        {userEvents.map(evt => (
                            <div
                                key={evt.id}
                                className="inbox-item inbox-item--event"
                                onClick={() => handleOpenEventChat(evt)}
                            >
                                <div className="inbox-avatar-wrapper">
                                    <div className="inbox-event-icon" style={{
                                        background: `linear-gradient(135deg, ${getCategoryColor(evt.category)}, ${getCategoryColor(evt.category)}80)`,
                                    }}>
                                        {evt.category === 'Gaming' ? '🎮' :
                                            evt.category === 'Chiacchiere' ? '💬' :
                                                evt.category === 'Listening Party' ? '🎵' :
                                                    evt.category === 'Reaction YouTube' ? '▶️' : '🎉'}
                                    </div>
                                    {(eventUnreadCounts[evt.id] || 0) > 0 && (
                                        <span className="inbox-avatar-badge">{eventUnreadCounts[evt.id]}</span>
                                    )}
                                </div>
                                <div className="inbox-content">
                                    <div className="inbox-row">
                                        <h3 className="inbox-name">{evt.title}</h3>
                                        <span className="inbox-event-badge" style={{ color: getCategoryColor(evt.category) }}>
                                            {evt.category}
                                        </span>
                                    </div>
                                    <div className="inbox-message-row">
                                        <p className="inbox-message-preview" style={{ opacity: 0.6 }}>
                                            {evt.participants.filter(p => p.status === 'approved').length + 1} membri • di @{evt.creator.twitch_username}
                                        </p>
                                        {(eventUnreadCounts[evt.id] || 0) > 0 ? (
                                            <span className="inbox-unread-badge">{eventUnreadCounts[evt.id]}</span>
                                        ) : (
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                                <polyline points="9 18 15 12 9 6"></polyline>
                                            </svg>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="inbox-footer-hint">
                <small>I messaggi si cancellano dopo 24 ore.</small>
            </div>
        </div>
    );
};

export default Inbox;
