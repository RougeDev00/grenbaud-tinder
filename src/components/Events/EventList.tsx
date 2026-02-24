import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { Profile, EventWithDetails } from '../../types';
import { getEvents } from '../../services/eventService';
import CreateEventModal from './CreateEventModal';
import EventCard from './EventCard';
import ProfileView from '../ProfileView';
import './Events.css';

interface EventListProps {
    currentUser: Profile;
}

const EventList: React.FC<EventListProps> = ({ currentUser }) => {
    const navigate = useNavigate();
    const [events, setEvents] = useState<EventWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [viewingProfile, setViewingProfile] = useState<Profile | null>(null);
    const [searchParams] = useSearchParams();

    // Determine initial tab from URL or default to 'all'
    const initialTab = (searchParams.get('tab') as 'all' | 'joined' | 'mine') || 'all';
    const [activeTab, setActiveTab] = useState<'all' | 'joined' | 'mine'>(initialTab);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const data = await getEvents();
            setEvents(data);

            // Check if we need to auto-open an event from URL
            const manageId = searchParams.get('manage');
            const eventId = searchParams.get('event');
            const targetId = manageId || eventId;

            if (targetId) {
                navigate(`/events/${targetId}`);
            }
        } catch (error) {
            console.error('Failed to fetch events:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, [searchParams]);

    const handleEventCreated = () => {
        setIsCreateOpen(false);
        fetchEvents();
    };



    if (viewingProfile) {
        return (
            <div className="profile-detail-view animate-fade-in" style={{ zIndex: 1100, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--bg-card)' }}>
                <button className="btn-back" onClick={() => setViewingProfile(null)}>
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
        );
    }

    const filteredEvents = events.filter(evt => {
        const isMine = evt.creator.id === currentUser.id;
        const amJoinedOrPending = evt.participants.some(p => p.user_id === currentUser.id && (p.status === 'approved' || p.status === 'pending'));

        if (activeTab === 'all') {
            return !isMine && !amJoinedOrPending;
        } else if (activeTab === 'joined') {
            return amJoinedOrPending;
        } else {
            return isMine;
        }
    });

    return (
        <div className="events-container animate-fade-in">
            <div className="events-header">
                <h2>Eventi</h2>
                <button className="btn-create-event" onClick={() => setIsCreateOpen(true)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Crea
                </button>
            </div>

            <div className="events-tabs">
                <button
                    className={`events-tab ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveTab('all')}
                >
                    Tutti
                </button>
                <button
                    className={`events-tab ${activeTab === 'joined' ? 'active' : ''}`}
                    onClick={() => setActiveTab('joined')}
                >
                    Partecipazioni
                </button>
                <button
                    className={`events-tab ${activeTab === 'mine' ? 'active' : ''}`}
                    onClick={() => setActiveTab('mine')}
                >
                    I miei eventi
                </button>
            </div>

            {loading && events.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    <div className="loading-spinner" style={{ margin: '0 auto 10px' }}></div>
                    Caricamento eventi...
                </div>
            ) : filteredEvents.length === 0 ? (
                <div className="events-empty">
                    <h3>
                        {activeTab === 'all' && 'Nessun nuovo evento'}
                        {activeTab === 'joined' && 'Nessuna partecipazione'}
                        {activeTab === 'mine' && 'Non hai creato eventi'}
                    </h3>
                    <p>
                        {activeTab === 'all' && 'Non ci sono nuovi eventi creati da altre persone al momento.'}
                        {activeTab === 'joined' && 'Non ti sei ancora unito o candidato a nessun evento.'}
                        {activeTab === 'mine' && 'Crea il tuo primo evento per invitare altre persone!'}
                    </p>
                </div>
            ) : (
                <div className="events-list">
                    {filteredEvents.map((evt) => (
                        <EventCard
                            key={evt.id}
                            event={evt}
                            onViewDetails={(e) => navigate(`/events/${e.id}`)}
                        />
                    ))}
                </div>
            )}

            {isCreateOpen && (
                <CreateEventModal
                    currentUser={currentUser}
                    onClose={() => setIsCreateOpen(false)}
                    onCreated={handleEventCreated}
                />
            )}
        </div>
    );
};

export default EventList;
