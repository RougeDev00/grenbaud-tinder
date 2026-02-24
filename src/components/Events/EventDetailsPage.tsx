import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Profile, EventWithDetails } from '../../types';
import { getEventById, requestToJoinEvent, cancelJoinRequest, updateParticipantStatus, deleteEvent } from '../../services/eventService';
import ProfileView from '../ProfileView';
import './Events.css';

interface EventDetailsPageProps {
    currentUser: Profile;
}

const getCategoryColor = (category: string) => {
    switch (category) {
        case 'Gaming': return 'var(--primary)';
        case 'Chiacchiere': return '#ec4899';
        case 'Listening Party': return '#3b82f6';
        case 'Reaction YouTube': return '#ef4444';
        default: return '#10b981';
    }
};

const EventDetailsPage: React.FC<EventDetailsPageProps> = ({ currentUser }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [event, setEvent] = useState<EventWithDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'chat'>('info');
    const [viewingProfile, setViewingProfile] = useState<Profile | null>(null);

    const fetchEvent = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const data = await getEventById(id);
            if (data) {
                setEvent(data);
            } else {
                navigate('/events');
            }
        } catch (error) {
            console.error('Failed to fetch event:', error);
            navigate('/events');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvent();
    }, [id]);

    if (loading) {
        return (
            <div className="events-container" style={{ textAlign: 'center', padding: '100px 20px' }}>
                <div className="loading-spinner" style={{ margin: '0 auto 20px' }} />
                <p style={{ color: '#94a3b8' }}>Caricamento evento...</p>
            </div>
        );
    }

    if (!event) return null;

    if (viewingProfile) {
        return (
            <div className="profile-detail-view animate-fade-in" style={{ zIndex: 1100, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--bg-dark)' }}>
                <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
                    <button className="btn-back" onClick={() => setViewingProfile(null)} style={{ marginBottom: '20px' }}>
                        <div className="btn-back-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                        </div>
                        <span>Torna all'Evento</span>
                    </button>
                    <ProfileView
                        profile={viewingProfile}
                        currentUser={currentUser}
                        readOnly
                    />
                </div>
            </div>
        );
    }

    const isCreator = event.creator_id === currentUser.id;
    const myParticipantRecord = event.participants.find(p => p.user_id === currentUser.id);
    const isApproved = myParticipantRecord?.status === 'approved';
    const canAccessChat = isCreator || isApproved;
    const approvedCount = event.participants.filter(p => p.status === 'approved').length + 1;
    const isFull = approvedCount >= event.max_participants;

    const dateObj = new Date(event.event_time);
    const dateStr = dateObj.toLocaleDateString('it-IT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    const timeStr = dateObj.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    const categoryColor = getCategoryColor(event.category);

    const handleJoin = async () => {
        setActionLoading(true);
        try {
            await requestToJoinEvent(event.id, currentUser.id);
            fetchEvent();
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancelRequest = async () => {
        setActionLoading(true);
        try {
            await cancelJoinRequest(event.id, currentUser.id);
            fetchEvent();
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateStatus = async (userId: string, status: 'approved' | 'rejected') => {
        setActionLoading(true);
        try {
            await updateParticipantStatus(event.id, userId, status);
            fetchEvent();
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Sei sicuro di voler eliminare questo evento?')) return;
        setActionLoading(true);
        try {
            const success = await deleteEvent(event.id);
            if (success) {
                navigate('/events');
            } else {
                alert('Errore durante l\'eliminazione dell\'evento. Controlla la console.');
                setActionLoading(false);
            }
        } catch (e) {
            console.error('[Event] handleDelete error:', e);
            alert('Errore durante l\'eliminazione dell\'evento.');
            setActionLoading(false);
        }
    };

    return (
        <div className="event-details-page animate-fade-in" style={{ '--category-color': categoryColor } as React.CSSProperties}>
            <div className="events-container" style={{ paddingBottom: '100px' }}>
                <button className="btn-back" onClick={() => navigate('/events')} style={{ marginBottom: '24px' }}>
                    <div className="btn-back-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                    </div>
                    <span>Tutti gli eventi</span>
                </button>

                <div className="event-page-card">
                    <header className="event-details-header">
                        <span className="event-category-badge">
                            {event.category}
                        </span>
                        <h1 className="event-details-title" style={{ fontSize: '2.5rem', marginBottom: '16px' }}>{event.title}</h1>

                        <div className="event-details-meta">
                            <div className="meta-item">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                                <span style={{ textTransform: 'capitalize' }}>{dateStr}</span>
                            </div>
                            <div className="meta-item">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                                {timeStr}
                            </div>
                        </div>
                    </header>

                    {canAccessChat && (
                        <nav className="event-details-tabs">
                            <button
                                className={`event-details-tab ${activeTab === 'info' ? 'active' : ''}`}
                                onClick={() => setActiveTab('info')}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                    <polyline points="10 9 9 9 8 9"></polyline>
                                </svg>
                                Info
                            </button>
                            <button
                                className={`event-details-tab ${activeTab === 'chat' ? 'active' : ''}`}
                                onClick={() => setActiveTab('chat')}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                </svg>
                                Chat
                            </button>
                        </nav>
                    )}

                    {activeTab === 'info' && (
                        <div className="animate-fade-in">
                            {event.description && (
                                <div className="event-description-box" style={{ background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '20px', marginBottom: '40px', lineHeight: '1.6', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.05)', fontSize: '1.05rem' }}>
                                    {event.description}
                                </div>
                            )}

                            <div className="participants-section">
                                <h4 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>
                                    Partecipanti
                                    <span style={{ color: isFull ? '#ef4444' : '#10b981', fontSize: '0.9rem' }}>
                                        {approvedCount}/{event.max_participants} {isFull && '• FULL'}
                                    </span>
                                </h4>

                                <div className="participant-row creator" onClick={() => setViewingProfile(event.creator)}>
                                    <img src={event.creator.photo_1 || 'https://via.placeholder.com/40'} alt={event.creator.twitch_username} className="participant-avatar" style={{ width: '44px', height: '44px' }} />
                                    <div className="participant-name-wrap">
                                        <div className="participant-name" style={{ fontSize: '1.1rem' }}>@{event.creator.twitch_username}</div>
                                        <div className="participant-badge">Creatore</div>
                                    </div>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                                    </svg>
                                </div>

                                {event.participants.filter(p => p.status === 'approved').map(p => (
                                    <div key={p.id} className="participant-row" onClick={(e) => { if ((e.target as HTMLElement).tagName !== 'BUTTON') setViewingProfile(p.profile); }}>
                                        <img src={p.profile.photo_1 || 'https://via.placeholder.com/40'} alt={p.profile.twitch_username} className="participant-avatar" style={{ width: '44px', height: '44px' }} />
                                        <div className="participant-name-wrap">
                                            <div className="participant-name" style={{ fontSize: '1.1rem' }}>@{p.profile.twitch_username}</div>
                                        </div>
                                        {isCreator && (
                                            <button className="btn-remove-participant" onClick={(e) => { e.stopPropagation(); handleUpdateStatus(p.user_id, 'rejected'); }} disabled={actionLoading}>
                                                Rimuovi
                                            </button>
                                        )}
                                    </div>
                                ))}

                                {isCreator && event.participants.filter(p => p.status === 'pending').length > 0 && (
                                    <div className="pending-requests" style={{ marginTop: '40px' }}>
                                        <h4 style={{ color: '#f59e0b', fontSize: '1.2rem', marginBottom: '20px' }}>Richieste in Sospeso</h4>
                                        {event.participants.filter(p => p.status === 'pending').map(p => (
                                            <div key={p.id} className="participant-row" style={{ borderColor: 'rgba(245, 158, 11, 0.2)', background: 'rgba(245, 158, 11, 0.03)' }} onClick={(e) => { if ((e.target as HTMLElement).tagName !== 'BUTTON') setViewingProfile(p.profile); }}>
                                                <img src={p.profile.photo_1 || 'https://via.placeholder.com/40'} alt={p.profile.twitch_username} className="participant-avatar" style={{ width: '44px', height: '44px' }} />
                                                <div className="participant-name-wrap">
                                                    <div className="participant-name" style={{ fontSize: '1.1rem' }}>@{p.profile.twitch_username}</div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <button className="btn" style={{ background: '#059669', color: 'white', padding: '8px 16px', fontSize: '0.85rem', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); handleUpdateStatus(p.user_id, 'approved'); }} disabled={actionLoading || isFull}>
                                                        Accetta
                                                    </button>
                                                    <button className="btn" style={{ background: '#dc2626', color: 'white', padding: '8px 16px', fontSize: '0.85rem', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); handleUpdateStatus(p.user_id, 'rejected'); }} disabled={actionLoading}>
                                                        Rifiuta
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <footer className="page-action-area" style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                {!isCreator ? (
                                    <div className="join-actions">
                                        {!myParticipantRecord ? (
                                            <button className="btn btn-join-event" onClick={handleJoin} disabled={actionLoading || isFull} style={{ width: '100%', padding: '20px', fontSize: '1.2rem', borderRadius: '20px' }}>
                                                {isFull ? 'Evento Completo 🚫' : 'Partecipa all\'evento ✨'}
                                            </button>
                                        ) : myParticipantRecord?.status === 'pending' ? (
                                            <button className="btn-cancel-request" onClick={handleCancelRequest} disabled={actionLoading} style={{ width: '100%', padding: '20px', fontSize: '1.1rem', borderRadius: '20px' }}>
                                                Richiesta Inviata (Annulla)
                                            </button>
                                        ) : myParticipantRecord?.status === 'approved' ? (
                                            <div className="status-indicator approved" style={{ padding: '24px', borderRadius: '20px', fontSize: '1.2rem' }}>
                                                Sei un partecipante! ✨
                                            </div>
                                        ) : (
                                            <div className="status-indicator rejected" style={{ padding: '24px', borderRadius: '20px', fontSize: '1.2rem' }}>
                                                Richiesta non accettata
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center' }}>
                                        <button className="btn-delete-event" onClick={handleDelete} disabled={actionLoading} style={{ fontSize: '1rem' }}>
                                            🗑️ Elimina questo evento
                                        </button>
                                    </div>
                                )}
                            </footer>
                        </div>
                    )}

                    {activeTab === 'chat' && canAccessChat && (
                        <div className="animate-fade-in event-chat-redirect-container" style={{ padding: '60px 20px', textAlign: 'center' }}>
                            <div className="redirect-icon-wrap" style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(168, 85, 247, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
                                <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                </svg>
                            </div>
                            <h2 style={{ color: 'white', marginBottom: '16px', fontSize: '1.8rem' }}>Chat di Gruppo</h2>
                            <p style={{ color: '#94a3b8', marginBottom: '40px', lineHeight: '1.6', fontSize: '1.1rem', maxWidth: '400px', margin: '0 auto 40px' }}>
                                Entra nella chat completa per messaggiare con gli altri partecipanti e organizzare l'evento.
                            </p>
                            <button
                                className="btn btn-primary"
                                style={{ padding: '18px 48px', borderRadius: '20px', fontWeight: '800', fontSize: '1.1rem' }}
                                onClick={() => {
                                    navigate(`/messages?eventChat=${event.id}`);
                                }}
                            >
                                Apri Chat Completa 💬
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EventDetailsPage;
