import React, { useState, useEffect, useRef } from 'react';
import type { Profile, EventMessage } from '../../types';
import { getEventMessages, sendEventMessage, subscribeToEventMessages } from '../../services/eventService';
import './Events.css';

interface EventChatProps {
    eventId: string;
    currentUser: Profile;
}

const EventChat: React.FC<EventChatProps> = ({ eventId, currentUser }) => {
    const [messages, setMessages] = useState<EventMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Scroll to bottom
    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Load messages
    useEffect(() => {
        const loadMessages = async () => {
            setLoading(true);
            const msgs = await getEventMessages(eventId);
            setMessages(msgs);
            setLoading(false);
            setTimeout(scrollToBottom, 100);
        };
        loadMessages();
    }, [eventId]);

    // Realtime subscription
    useEffect(() => {
        const unsubscribe = subscribeToEventMessages(eventId, (newMsg) => {
            // Avoid duplicates (if we sent it ourselves, it might already be in the list)
            setMessages(prev => {
                if (prev.some(m => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
            });
            setTimeout(scrollToBottom, 50);
        });

        return () => unsubscribe();
    }, [eventId]);

    // Polling fallback (every 3 seconds)
    useEffect(() => {
        const interval = setInterval(async () => {
            const msgs = await getEventMessages(eventId);
            setMessages(prev => {
                // Only update state if there are actually new messages
                if (msgs.length > prev.length) {
                    setTimeout(scrollToBottom, 50);
                    return msgs;
                }
                return prev;
            });
        }, 3000);

        return () => clearInterval(interval);
    }, [eventId]);

    // Auto-scroll when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        const trimmed = newMessage.trim();
        if (!trimmed || sending) return;

        setSending(true);
        setNewMessage('');

        const sent = await sendEventMessage(eventId, currentUser.id, trimmed);
        if (sent) {
            // Add optimistically (the realtime will also fire, but dedup handles it)
            setMessages(prev => {
                if (prev.some(m => m.id === sent.id)) return prev;
                return [...prev, sent];
            });
        }
        setSending(false);
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return (
            <div className="event-chat-loading">
                <div className="loading-spinner" style={{ margin: '0 auto 10px' }}></div>
                Caricamento chat...
            </div>
        );
    }

    return (
        <div className="event-chat">
            <div className="event-chat-messages">
                {messages.length === 0 && (
                    <div className="event-chat-empty">
                        <span style={{ fontSize: '2rem' }}>💬</span>
                        <p>Nessun messaggio ancora.</p>
                        <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Sii il primo a scrivere!</p>
                    </div>
                )}
                {messages.map((msg) => {
                    const isMe = msg.sender_id === currentUser.id;
                    return (
                        <div key={msg.id} className={`event-chat-msg ${isMe ? 'mine' : 'other'}`}>
                            {!isMe && (
                                <img
                                    src={msg.sender?.photo_1 || 'https://via.placeholder.com/32'}
                                    alt={msg.sender?.twitch_username || '?'}
                                    className="event-chat-avatar"
                                />
                            )}
                            <div className="event-chat-bubble-wrapper">
                                {!isMe && (
                                    <span className="event-chat-sender">
                                        @{msg.sender?.twitch_username || 'Utente'}
                                    </span>
                                )}
                                <div className={`event-chat-bubble ${isMe ? 'mine' : 'other'}`}>
                                    {msg.content}
                                </div>
                                <span className="event-chat-time">{formatTime(msg.created_at)}</span>
                            </div>
                        </div>
                    );
                })}
                <div ref={chatEndRef} />
            </div>

            <div className="event-chat-input-area">
                <input
                    ref={inputRef}
                    type="text"
                    className="event-chat-input"
                    placeholder="Scrivi un messaggio..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    maxLength={500}
                    disabled={sending}
                />
                <button
                    className="event-chat-send-btn"
                    onClick={handleSend}
                    disabled={!newMessage.trim() || sending}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default EventChat;
