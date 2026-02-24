import React, { useState, useEffect, useRef } from 'react';
import type { Profile, Message } from '../../types';
import { sendMessage, getMessages, subscribeToMessages, markMessagesAsRead, markConversationRead } from '../../services/chatService';
import './ChatWindow.css';

interface ChatWindowProps {
    currentUser: Profile;
    otherUser: Profile;
    onClose: () => void;
    onNewMessage?: () => void;
    onOpenProfile?: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ currentUser, otherUser, onClose, onNewMessage, onOpenProfile }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior });
        }
    };

    const loadMessages = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const data = await getMessages(currentUser.twitch_id, otherUser.twitch_id);

            // Only update if different (simple check)
            setMessages(prev => {
                if (prev.length !== data.length || prev[prev.length - 1]?.id !== data[data.length - 1]?.id) {
                    setTimeout(scrollToBottom, 100);
                    return data;
                }
                return prev;
            });

            // Mark as read (server-side)
            markMessagesAsRead(otherUser.twitch_id, currentUser.twitch_id);
            onNewMessage?.();
        } catch (err) {
            console.error('Error loading messages:', err);
        } finally {
            if (!silent) setLoading(false);
            if (!silent) setTimeout(scrollToBottom, 50); // faster than 100
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const tempMsg: Message = {
            id: 'temp-' + Date.now(),
            sender_id: currentUser.twitch_id,
            receiver_id: otherUser.twitch_id,
            content: newMessage,
            created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, tempMsg]);
        setNewMessage('');
        setTimeout(scrollToBottom, 100);

        const sent = await sendMessage(currentUser.twitch_id, otherUser.twitch_id, tempMsg.content);
        if (!sent) {
            alert('Errore invio messaggio');
            setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
        }
        // Don't replace temp - the realtime subscription will deliver the real message
        // and our dedup logic will handle it
    };

    // Initial scroll
    useEffect(() => {
        if (!loading && messages.length > 0) {
            // Instant scroll on load
            scrollToBottom('auto');
        }
    }, [loading]);

    // Scroll on new message
    useEffect(() => {
        if (messages.length > 0) {
            // Smooth scroll for new messages
            scrollToBottom('smooth');
        }
    }, [messages.length]);

    // Mark as read when opening
    useEffect(() => {
        markConversationRead(currentUser.twitch_id, otherUser.twitch_id);
        onNewMessage?.(); // refresh unread counts
    }, []);

    useEffect(() => {
        loadMessages();

        // Subscribe to real-time messages for this conversation
        const unsubscribe = subscribeToMessages((newMsg) => {
            // Case-insensitive comparison
            const sId = String(newMsg.sender_id).toLowerCase();
            const rId = String(newMsg.receiver_id).toLowerCase();
            const oId = String(otherUser.twitch_id).toLowerCase();
            const cId = String(currentUser.twitch_id).toLowerCase();

            const isRelevant =
                (sId === oId && rId === cId) ||
                (sId === cId && rId === oId);

            if (isRelevant) {
                setMessages((prev) => {
                    // Check if message exists (for UPDATE events like read status)
                    const existingIndex = prev.findIndex(m => m.id === newMsg.id);
                    if (existingIndex !== -1) {
                        const updated = [...prev];
                        updated[existingIndex] = newMsg;
                        return updated;
                    }

                    // Deduplicate: skip if we already have this message ID (optimistic or real)
                    if (prev.some(m => m.id === newMsg.id)) return prev;

                    // Also remove any temp message with matching content
                    const filtered = prev.filter(m => !(m.id.startsWith('temp-') && m.content === newMsg.content && m.sender_id === newMsg.sender_id));
                    return [...filtered, newMsg];
                });

                // If receiving a message from other, mark IT as read
                if (sId === oId) {
                    markMessagesAsRead(otherUser.twitch_id, currentUser.twitch_id);
                    onNewMessage?.();
                }

                // If the message is from ME (and it's an update), no need to mark read

                setTimeout(scrollToBottom, 100);
            }
        });

        // Polling fallback (every 2s)
        const interval = setInterval(() => {
            loadMessages(true); // silent refresh
        }, 2000);

        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }, [currentUser.twitch_id, otherUser.twitch_id]);

    return (
        <div className="chat-window-overlay animate-slide-up">
            <div className="chat-window-container">
                {/* Header */}
                <div className="chat-header">
                    <button className="chat-back-btn" onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    </button>
                    <div className="chat-user-info" onClick={onOpenProfile} style={{ cursor: 'pointer', flex: 1 }}>
                        <img
                            src={otherUser.photo_1 || 'https://via.placeholder.com/40'}
                            alt={otherUser.display_name}
                            className="chat-avatar"
                        />
                        <div className="chat-name-stack">
                            <span className="chat-username">{otherUser.display_name}</span>
                            <span className="chat-display-name">@{otherUser.twitch_username}</span>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="chat-loading">
                        <div className="spinner"></div>
                        <p>Caricamento chat...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="chat-rules-container animate-fade-in">
                        <div className="chat-rules-content">
                            <div className="chat-rules-icon">🛡️</div>
                            <h3>Benvenuto in Chat!</h3>
                            <p className="chat-rules-intro">
                                Questa è una zona di <strong>connessione umana</strong>. Qui siamo tutti uguali.
                            </p>

                            <ul className="chat-rules-list">
                                <li>
                                    <span>🤝</span>
                                    <div>
                                        <strong>Massima Educazione</strong>
                                        <p>Il rispetto è la base di tutto. Sii gentile.</p>
                                    </div>
                                </li>
                                <li>
                                    <span>🚫</span>
                                    <div>
                                        <strong>Tolleranza Zero</strong>
                                        <p>Insulti, molestie o comportamenti tossici verranno segnalati immediatamente.</p>
                                    </div>
                                </li>
                                <li>
                                    <span>💜</span>
                                    <div>
                                        <strong>Divertiti</strong>
                                        <p>Conosci persone nuove e sii te stesso.</p>
                                    </div>
                                </li>
                            </ul>

                            <p className="chat-rules-footer">
                                Rompi il ghiaccio con un "Ciao"! 👋
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="chat-messages">
                        {messages.map((msg, index) => {
                            const isMe = msg.sender_id === currentUser.twitch_id;
                            // Reset stagger every few messages or just use index
                            const animationDelay = `${(index % 10) * 0.05}s`;

                            return (
                                <div
                                    key={msg.id}
                                    className={`message-row ${isMe ? 'message-row--me' : 'message-row--other'} animate-message-in`}
                                    style={{ animationDelay }}
                                >
                                    {!isMe && (
                                        <div className="message-avatar-wrap">
                                            <img
                                                src={otherUser.photo_1 || 'https://via.placeholder.com/32'}
                                                alt=""
                                                className="message-avatar"
                                            />
                                        </div>
                                    )}
                                    <div className="message-content-wrap">
                                        {!isMe && (
                                            <span className="message-author-name">
                                                {otherUser.display_name} <small>@{otherUser.twitch_username}</small>
                                            </span>
                                        )}
                                        <div className="message-bubble">
                                            {msg.content}
                                            {isMe && (
                                                <span className="message-tick">
                                                    ✓
                                                </span>
                                            )}
                                        </div>
                                        <span className="message-time">
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                )}

                {/* Input Area */}
                <form className="chat-input-area" onSubmit={handleSend}>
                    <input
                        type="text"
                        className="chat-input"
                        placeholder="Scrivi un messaggio..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        required
                    />
                    <button type="submit" className="chat-send-btn" disabled={!newMessage.trim()}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatWindow;
