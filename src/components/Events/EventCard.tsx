import React from 'react';
import type { EventWithDetails } from '../../types';
import './Events.css';

interface EventCardProps {
    event: EventWithDetails;
    onViewDetails: (event: EventWithDetails) => void;
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

const EventCard: React.FC<EventCardProps> = ({ event, onViewDetails }) => {
    const isFull = event.participants.filter(p => p.status === 'approved').length + 1 >= event.max_participants;
    const dateObj = new Date(event.event_time);
    const dateStr = dateObj.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
    const timeStr = dateObj.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

    const categoryColor = getCategoryColor(event.category);
    const categoryColorAlpha = `${categoryColor}40`;

    return (
        <div
            className="event-card"
            onClick={() => onViewDetails(event)}
            style={{
                '--category-color': categoryColor,
                '--category-color-alpha': categoryColorAlpha
            } as React.CSSProperties}
        >
            <div className="event-card-header">
                <span className="event-category-badge">
                    {event.category}
                </span>
                <div className="event-time-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    {dateStr} • {timeStr}
                </div>
            </div>

            <h3 className="event-title">{event.title}</h3>

            {event.description && (
                <p className="event-description">
                    {event.description}
                </p>
            )}

            <div className="event-card-footer">
                <div className="event-creator-info">
                    {event.creator.photo_1 ? (
                        <img src={event.creator.photo_1} alt={event.creator.twitch_username} className="event-creator-avatar" />
                    ) : (
                        <div className="creator-avatar-placeholder" style={{ width: '32px', height: '32px', borderRadius: '50%', fontSize: '0.8rem', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white' }}>
                            {event.creator.twitch_username.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <span className="event-creator-name">@{event.creator.twitch_username}</span>
                </div>

                <div className={`event-users-pill ${isFull ? 'full' : ''}`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle>
                    </svg>
                    {event.participants.filter(p => p.status === 'approved').length + 1}/{event.max_participants}
                </div>
            </div>
        </div>
    );
};

export default EventCard;
