import React, { useState } from 'react';
import type { Profile, EventCategory } from '../../types';
import { createEvent } from '../../services/eventService';
import './Events.css'; // Manteniamo lo stesso CSS per ora o ne aggiungiamo uno specifico

interface CreateEventModalProps {
    currentUser: Profile;
    onClose: () => void;
    onCreated: () => void;
}

const CATEGORIES: EventCategory[] = ['Gaming', 'Chiacchiere', 'Listening Party', 'Reaction YouTube', 'Altro'];

const CreateEventModal: React.FC<CreateEventModalProps> = ({ currentUser, onClose, onCreated }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<EventCategory>('Gaming');
    const [dateMode, setDateMode] = useState<'oggi' | 'domani' | 'custom'>('oggi');
    const [customDate, setCustomDate] = useState('');
    const [time, setTime] = useState('');
    const [maxParticipants, setMaxParticipants] = useState<number>(5);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !time) {
            setError('Titolo e orario sono obbligatori.');
            return;
        }

        if (dateMode === 'custom' && !customDate) {
            setError('Devi selezionare una data se scegli l\'opzione "Scegli".');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            let finalDate = new Date();
            if (dateMode === 'domani') {
                finalDate.setDate(finalDate.getDate() + 1);
            } else if (dateMode === 'custom') {
                finalDate = new Date(customDate);
            }

            const [hours, minutes] = time.split(':');
            finalDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

            if (finalDate < new Date()) {
                setError('L\'orario dell\'evento non può essere nel passato.');
                setLoading(false);
                return;
            }

            await createEvent({
                creator_id: currentUser.id,
                title,
                description,
                category,
                event_time: finalDate.toISOString(),
                max_participants: maxParticipants,
                banner_url: null, // Per ora senza banner image upload
            });
            onCreated();
        } catch (err: any) {
            setError(err.message || 'Errore durante la creazione.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content animate-fade-in event-modal" onClick={e => e.stopPropagation()}>
                <div className="event-modal-header">
                    <h3>Crea un Nuovo Evento</h3>
                    <button className="event-details-close" onClick={onClose} aria-label="Chiudi" style={{ position: 'static' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <form className="event-form" onSubmit={handleSubmit}>
                    {error && <div className="error-message" style={{ marginBottom: '15px' }}>{error}</div>}

                    <div className="event-form-group">
                        <label>Titolo dell'evento</label>
                        <input
                            type="text"
                            className="event-form-input"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="es. Duo su Fortnite, Listening Party..."
                            required
                            maxLength={50}
                        />
                    </div>

                    <div className="event-form-row">
                        <div className="event-form-group flex-1">
                            <label>Categoria</label>
                            <select
                                className="event-form-input"
                                value={category}
                                onChange={e => setCategory(e.target.value as EventCategory)}
                            >
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div className="event-form-group flex-1">
                            <label>Data e Ora</label>

                            <div className="date-mode-tabs">
                                <button type="button" className={`date-mode-btn ${dateMode === 'oggi' ? 'active' : ''}`} onClick={() => setDateMode('oggi')}>Oggi</button>
                                <button type="button" className={`date-mode-btn ${dateMode === 'domani' ? 'active' : ''}`} onClick={() => setDateMode('domani')}>Domani</button>
                                <button type="button" className={`date-mode-btn ${dateMode === 'custom' ? 'active' : ''}`} onClick={() => setDateMode('custom')}>Scegli</button>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                {dateMode === 'custom' && (
                                    <input
                                        type="date"
                                        className="event-form-input"
                                        value={customDate}
                                        onChange={e => setCustomDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]} // Disable past dates natively
                                        required
                                        style={{ flex: 1 }}
                                    />
                                )}
                                <input
                                    type="time"
                                    className="event-form-input"
                                    value={time}
                                    onChange={e => setTime(e.target.value)}
                                    required
                                    style={{ flex: 1 }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="event-form-group">
                        <label>Descrizione (Opzionale)</label>
                        <textarea
                            className="event-form-input"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Scrivi due righe su cosa farete o i requisiti per partecipare..."
                            rows={3}
                            maxLength={300}
                        />
                    </div>

                    <div className="event-form-group">
                        <label>Partecipanti Massimi: <span className="highlight-number">{maxParticipants}</span></label>
                        <div className="slider-container">
                            <span className="slider-label">2</span>
                            <input
                                type="range"
                                className="event-slider"
                                min="2"
                                max="10"
                                value={maxParticipants}
                                onChange={e => setMaxParticipants(parseInt(e.target.value))}
                            />
                            <span className="slider-label">10</span>
                        </div>
                    </div>

                    <div className="event-modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                            Annulla
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Creazione in corso...' : 'Crea Evento ✨'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateEventModal;
