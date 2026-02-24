import React, { useState } from 'react';
import type { Profile } from '../types';
import {
    verifyAdmin,
    getAdminProfiles,
    banUser,
    unbanUser,
    warnUser,
    deleteUser,
    getCompatibilityScores,
    deleteCompatibilityScore,
} from '../services/adminService';
import type { CompatibilityScoreRow } from '../services/adminService';
import './AdminApp.css';
import './AdminCenter.css';

const AdminCenter: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

    // Action Modals State
    const [activeAction, setActiveAction] = useState<'ban' | 'warn' | 'delete' | null>(null);
    const [actionReason, setActionReason] = useState('');
    const [isActionLoading, setIsActionLoading] = useState(false);

    // Compatibility scores
    const [scores, setScores] = useState<CompatibilityScoreRow[]>([]);
    const [loadingScores, setLoadingScores] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setLoginError('');

        try {
            const isValid = await verifyAdmin(password);
            if (isValid) {
                setIsAuthenticated(true);
                loadProfiles(password);
            } else {
                setLoginError('Password errata o accesso negato.');
            }
        } catch (err) {
            setLoginError('Errore di connessione al database.');
        } finally {
            setIsLoading(false);
        }
    };

    const loadProfiles = async (pwd: string) => {
        setIsLoading(true);
        try {
            const data = await getAdminProfiles(pwd);
            setProfiles(data);
        } catch (err) {
            console.error('Failed to load profiles:', err);
            setLoginError('Impossibile caricare gli utenti.');
        } finally {
            setIsLoading(false);
        }
    };

    const selectProfile = async (p: Profile) => {
        setSelectedProfile(p);
        setScores([]);
        setLoadingScores(true);
        try {
            const data = await getCompatibilityScores(p.id, password);
            setScores(data);
        } catch (err) {
            console.error('Failed to load scores:', err);
        } finally {
            setLoadingScores(false);
        }
    };

    const handleDeleteScore = async (scoreId: string) => {
        if (!confirm('Vuoi davvero cancellare questo punteggio di affinità?')) return;
        try {
            await deleteCompatibilityScore(scoreId, password);
            setScores(prev => prev.filter(s => s.score_id !== scoreId));
        } catch (err) {
            alert(`Errore: ${(err as Error).message}`);
        }
    };

    const handleActionSubmit = async () => {
        if (!selectedProfile || !activeAction) return;
        setIsActionLoading(true);
        try {
            if (activeAction === 'ban') {
                await banUser(selectedProfile.id, actionReason, password);
            } else if (activeAction === 'warn') {
                await warnUser(selectedProfile.id, actionReason, password);
            } else if (activeAction === 'delete') {
                await deleteUser(selectedProfile.id, password);
                setSelectedProfile(null);
                setScores([]);
            }
            await loadProfiles(password);
            if (activeAction !== 'delete') {
                const updated = await getAdminProfiles(password);
                const freshProfile = updated.find(p => p.id === selectedProfile.id);
                if (freshProfile) {
                    setSelectedProfile(freshProfile);
                }
            }
            setActiveAction(null);
            setActionReason('');
        } catch (err) {
            console.error(`Error performing ${activeAction}:`, err);
            alert(`Errore durante l'operazione: ${(err as Error).message}`);
        } finally {
            setIsActionLoading(false);
        }
    };

    // Filter profiles by search
    const filteredProfiles = profiles.filter(p => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            (p.display_name || '').toLowerCase().includes(q) ||
            (p.twitch_username || '').toLowerCase().includes(q) ||
            (p.id || '').toLowerCase().includes(q)
        );
    });

    if (!isAuthenticated) {
        return (
            <div className="admin-login-container">
                <div className="admin-login-box">
                    <div className="admin-logo">🛡️ Baudr Admin Center</div>
                    <form onSubmit={handleLogin} className="admin-login-form">
                        <input
                            type="password"
                            placeholder="Inserisci la password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button type="submit" disabled={isLoading} className="btn-admin-login">
                            {isLoading ? 'Verifica...' : 'Accedi'}
                        </button>
                        {loginError && <div className="admin-error">{loginError}</div>}
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-layout">
            {/* Sidebar / List */}
            <div className="admin-sidebar">
                <div className="admin-sidebar-header">
                    <h2>Utenti ({filteredProfiles.length})</h2>
                    <button onClick={() => loadProfiles(password)} className="btn-icon" title="Ricarica">🔄</button>
                </div>
                <div className="ac-search-bar">
                    <input
                        type="text"
                        placeholder="🔍 Cerca utente..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="admin-user-list">
                    {filteredProfiles.map(p => (
                        <div
                            key={p.id}
                            className={`admin-user-item ${selectedProfile?.id === p.id ? 'selected' : ''} ${p.is_banned ? 'banned' : ''}`}
                            onClick={() => selectProfile(p)}
                        >
                            <img src={p.photo_1 || p.avatar_url || 'https://via.placeholder.com/40'} alt="avatar" />
                            <div className="admin-user-info">
                                <strong>{p.display_name || p.twitch_username}</strong>
                                <span>@{p.twitch_username} · {new Date(p.created_at || Date.now()).toLocaleDateString('it-IT')}</span>
                            </div>
                            {p.is_banned && <div className="admin-badge badge-banned">BAN</div>}
                            {p.warning_message && <div className="admin-badge badge-warn">WARN</div>}
                        </div>
                    ))}
                    {filteredProfiles.length === 0 && (
                        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#666' }}>
                            {searchQuery ? 'Nessun risultato' : 'Nessun utente'}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content / Detail */}
            <div className="admin-main">
                {selectedProfile ? (
                    <div className="admin-profile-detail">
                        {/* Header */}
                        <div className="admin-profile-header">
                            <img src={selectedProfile.photo_1 || selectedProfile.avatar_url || 'https://via.placeholder.com/150'} alt="avatar" className="admin-detail-avatar" />
                            <div className="admin-detail-title">
                                <h1>{selectedProfile.display_name} <span>@{selectedProfile.twitch_username}</span></h1>
                                <p>Twitch ID: {selectedProfile.twitch_id}</p>
                                <p>UUID: {selectedProfile.id}</p>
                                <p>Iscritto il: {new Date(selectedProfile.created_at || Date.now()).toLocaleString('it-IT')}</p>
                            </div>
                            <div className="admin-actions">
                                {selectedProfile.is_banned ? (
                                    <button
                                        className="btn-admin btn-unban"
                                        onClick={async () => {
                                            if (confirm('Vuoi davvero SBANNARE questo utente?')) {
                                                setIsActionLoading(true);
                                                await unbanUser(selectedProfile.id, password);
                                                await loadProfiles(password);
                                                setSelectedProfile({ ...selectedProfile, is_banned: false, ban_reason: null });
                                                setIsActionLoading(false);
                                            }
                                        }}
                                        disabled={isActionLoading}
                                    >
                                        ✅ Sblocca Utente
                                    </button>
                                ) : (
                                    <button className="btn-admin btn-ban" onClick={() => setActiveAction('ban')}>🚫 Banna Utente</button>
                                )}
                                <button className="btn-admin btn-warn" onClick={() => setActiveAction('warn')}>⚠️ Invia Segnalazione</button>
                                <button className="btn-admin btn-delete" onClick={() => setActiveAction('delete')}>🗑️ Elimina Definitivamente</button>
                            </div>
                        </div>

                        {/* Status Banners */}
                        {selectedProfile.is_banned && (
                            <div className="admin-status-banner banner-banned">
                                <strong>UTENTE BANNATO</strong>
                                <p>Motivo: {selectedProfile.ban_reason}</p>
                            </div>
                        )}
                        {selectedProfile.warning_message && (
                            <div className="admin-status-banner banner-warned">
                                <strong>SEGNALAZIONE ATTIVA</strong>
                                <p>Messaggio: {selectedProfile.warning_message}</p>
                            </div>
                        )}

                        {/* Profile Data Grid */}
                        <div className="admin-profile-data-grid">
                            <div className="admin-data-card">
                                <h3>📋 Bio & Info</h3>
                                <p><strong>Bio:</strong> {selectedProfile.bio || '—'}</p>
                                <p><strong>Hobby:</strong> {selectedProfile.hobbies || '—'}</p>
                                <p><strong>Musica:</strong> {selectedProfile.music || '—'}</p>
                                <p><strong>Instagram:</strong> {selectedProfile.instagram || '—'}</p>
                            </div>
                            <div className="admin-data-card">
                                <h3>⚙️ Preferenze</h3>
                                <p><strong>Zodiaco:</strong> {selectedProfile.zodiac_sign || '—'}</p>
                                <p><strong>Cerco:</strong> {selectedProfile.looking_for || '—'}</p>
                                <p><strong>Genere:</strong> {selectedProfile.gender || '—'}</p>
                                <p><strong>Età:</strong> {selectedProfile.age || '—'}</p>
                                <p><strong>Città:</strong> {selectedProfile.city || '—'}</p>
                            </div>
                            <div className="admin-data-card">
                                <h3>🎮 Twitch & Social</h3>
                                <p><strong>Guardo:</strong> {selectedProfile.twitch_watches || '—'}</p>
                                <p><strong>GrenBaud è:</strong> {selectedProfile.grenbaud_is || '—'}</p>
                                <p><strong>YouTube:</strong> {selectedProfile.youtube || '—'}</p>
                            </div>
                            <div className="admin-data-card">
                                <h3>🧠 AI & Personalità</h3>
                                <p><strong>Tipo:</strong> {selectedProfile.personality_type || '—'}</p>
                                <p><strong>AI Summary:</strong> {selectedProfile.ai_summary ? selectedProfile.ai_summary.substring(0, 200) + '...' : '—'}</p>
                            </div>
                        </div>

                        {/* Photos */}
                        <div className="ac-photos-section">
                            <h3>📸 Foto</h3>
                            <div className="ac-photos-grid">
                                {[selectedProfile.photo_1, selectedProfile.photo_2, selectedProfile.photo_3].filter(Boolean).map((url, i) => (
                                    <img key={i} src={url!} alt={`Foto ${i + 1}`} className="ac-photo-thumb" onClick={() => window.open(url!, '_blank')} />
                                ))}
                                {![selectedProfile.photo_1, selectedProfile.photo_2, selectedProfile.photo_3].some(Boolean) && (
                                    <p style={{ color: '#666' }}>Nessuna foto caricata</p>
                                )}
                            </div>
                        </div>

                        {/* Compatibility Scores */}
                        <div className="ac-scores-section">
                            <h3>💜 Punteggi Affinità ({scores.length})</h3>
                            {loadingScores ? (
                                <p style={{ color: '#888' }}>Caricamento...</p>
                            ) : scores.length === 0 ? (
                                <p style={{ color: '#666' }}>Nessun punteggio di affinità trovato per questo utente.</p>
                            ) : (
                                <div className="ac-scores-table">
                                    <div className="ac-scores-header">
                                        <span>Con utente</span>
                                        <span>Generata da</span>
                                        <span>Punteggio</span>
                                        <span>Spiegazione</span>
                                        <span>Data</span>
                                        <span></span>
                                    </div>
                                    {scores.map(s => (
                                        <div className="ac-score-row" key={s.score_id}>
                                            <div className="ac-score-user">
                                                <img src={s.other_avatar || 'https://via.placeholder.com/32'} alt="" />
                                                <div>
                                                    <strong>{s.other_display_name}</strong>
                                                    <span>@{s.other_twitch_username}</span>
                                                </div>
                                            </div>
                                            <div className="ac-score-generated-by">
                                                <span className="ac-generated-badge">{s.generated_by_name}</span>
                                            </div>
                                            <div className="ac-score-value">
                                                <span className={`ac-score-badge ${s.score >= 70 ? 'high' : s.score >= 40 ? 'mid' : 'low'}`}>
                                                    {s.score}%
                                                </span>
                                            </div>
                                            <div className="ac-score-explanation">
                                                {s.explanation ? (s.explanation.length > 120 ? s.explanation.substring(0, 120) + '...' : s.explanation) : '—'}
                                            </div>
                                            <div className="ac-score-date">
                                                {new Date(s.created_at).toLocaleDateString('it-IT')}
                                            </div>
                                            <div className="ac-score-actions">
                                                <button
                                                    className="ac-btn-delete-score"
                                                    onClick={() => handleDeleteScore(s.score_id)}
                                                    title="Cancella questo punteggio"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="admin-empty-state">
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>👈</div>
                            <p>Seleziona un utente dalla lista per visualizzare i dettagli e le azioni di moderazione.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Action Modal */}
            {activeAction && (
                <div className="admin-modal-overlay">
                    <div className={`admin-modal modal-${activeAction}`}>
                        <h2>
                            {activeAction === 'ban' && '🚫 Banna Utente'}
                            {activeAction === 'warn' && '⚠️ Invia Segnalazione'}
                            {activeAction === 'delete' && '🗑️ Eliminazione Definitiva'}
                        </h2>

                        {activeAction === 'delete' ? (
                            <p className="admin-danger-text">
                                ATTENZIONE: Questa azione eliminerà permanentemente l'utente <strong>{selectedProfile?.display_name}</strong>, tutti i suoi messaggi, match e dati. Questa operazione è IRREVERSIBILE.
                            </p>
                        ) : (
                            <div className="admin-input-group">
                                <label>Messaggio per l'utente:</label>
                                <textarea
                                    value={actionReason}
                                    onChange={e => setActionReason(e.target.value)}
                                    placeholder={activeAction === 'ban' ? "Motivo del ban (es. Violazione policy spam)" : "Motivo della segnalazione..."}
                                    rows={4}
                                />
                            </div>
                        )}

                        <div className="admin-modal-actions">
                            <button className="btn-admin-cancel" onClick={() => setActiveAction(null)}>Annulla</button>
                            <button
                                className={`btn-admin btn-${activeAction}`}
                                onClick={handleActionSubmit}
                                disabled={isActionLoading || (activeAction !== 'delete' && !actionReason.trim())}
                            >
                                {isActionLoading ? 'Elaborazione...' : 'Conferma Azione'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCenter;
