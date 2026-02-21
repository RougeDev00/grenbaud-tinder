import React, { useEffect, useState } from 'react';
import type { Profile, Message } from '../../types';
import { getConversations, subscribeToMessages } from '../../services/chatService';
import { getProfileByTwitchId } from '../../services/profileService';
import './Inbox.css';

interface InboxProps {
    currentUser: Profile;
    onSelectChat: (otherUser: Profile) => void;
    refreshTrigger?: number; // New prop to force reload
}

interface Conversation {
    user: Profile;
    lastMessage: Message;
    unreadCount: number;
}

const Inbox: React.FC<InboxProps> = ({ currentUser, onSelectChat, refreshTrigger }) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);

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

            // Sort by last message date
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

    // Initial load - ALWAYS load with loading spinner
    useEffect(() => {
        loadConversations(false);
    }, [currentUser.twitch_id]);

    // Refresh trigger - silent reload when trigger changes
    useEffect(() => {
        if (refreshTrigger && refreshTrigger > 0) {
            loadConversations(true);
        }
    }, [refreshTrigger]);

    useEffect(() => {
        // Subscribe to realtime so the inbox updates live (Insert, Update, Broadcast)
        const unsubscribe = subscribeToMessages((msg) => {
            // Optimistic update: manually update the conversation list WITHOUT fetching DB
            setConversations(prev => {
                const partnerId = msg.sender_id === currentUser.twitch_id ? msg.receiver_id : msg.sender_id;
                const existingIndex = prev.findIndex(c => c.user.twitch_id === partnerId);

                if (existingIndex === -1) {
                    // New conversation? Fallback to reload to get profile data
                    loadConversations(true);
                    return prev;
                }

                const updatedConvos = [...prev];
                const conv = { ...updatedConvos[existingIndex] };

                // Determine if this is just a read status update (same ID) or new message
                const isUpdate = conv.lastMessage.id === msg.id;

                // Update last message
                conv.lastMessage = msg;

                if (isUpdate) {
                    // Just update in place, don't move to top
                    // Also update unread count if we read it? No, unread count logic is complex here without full reload
                    // But if it's an update from ME reading it, we might want to allow reload to fix count
                    updatedConvos[existingIndex] = conv;
                    return updatedConvos;
                }

                // Move to top only if it's a new message
                updatedConvos.splice(existingIndex, 1);
                updatedConvos.unshift(conv);

                return updatedConvos;
            });
        });

        // Polling fallback (every 10s)
        const interval = setInterval(() => {
            loadConversations(true);
        }, 10000);

        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }, [currentUser.twitch_id]);

    if (loading) {
        return <div className="inbox-loading">Caricamento messaggi...</div>;
    }

    return (
        <div className="inbox-container animate-fade-in">
            <h2 className="inbox-title">Messaggi</h2>
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
                                    <h3 className="inbox-name">{c.user.display_name}</h3>
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
            <div className="inbox-footer-hint">
                <small>I messaggi si cancellano dopo 24 ore.</small>
            </div>
        </div>
    );
};

export default Inbox;
