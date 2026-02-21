import React, { useState } from 'react';
import type { Profile } from '../types';
import { verifyAdmin, getAdminProfiles, banUser, unbanUser, warnUser, deleteUser } from '../services/adminService';
import './AdminApp.css'; // We will create this next

const AdminApp: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

    // Action Modals State
    const [activeAction, setActiveAction] = useState<'ban' | 'warn' | 'delete' | null>(null);
    const [actionReason, setActionReason] = useState('');
    const [isActionLoading, setIsActionLoading] = useState(false);

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
            }

            // Reload to get fresh data
            await loadProfiles(password);

            // Re-select the profile with updated data (unless deleted)
            if (activeAction !== 'delete') {
                const updated = await getAdminProfiles(password);
                const freshProfile = updated.find(p => p.id === selectedProfile.id);
                if (freshProfile) setSelectedProfile(freshProfile);
            }

            // Reset modal
            setActiveAction(null);
            setActionReason('');
        } catch (err) {
            console.error(`Error performing ${activeAction}:`, err);
            alert(`Errore durante l'operazione: ${(err as Error).message}`);
        } finally {
            setIsActionLoading(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="admin-login-container">
                <div className="admin-login-box">
                    <div className="admin-logo">🛡️ Baudr Admin</div>
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
                    <h2>Utenti ({profiles.length})</h2>
                    <button onClick={() => loadProfiles(password)} className="btn-icon">🔄</button>
                </div>
                <div className="admin-user-list">
                    {profiles.map(p => (
                        <div
                            key={p.id}
                            className={`admin-user-item ${selectedProfile?.id === p.id ? 'selected' : ''} ${p.is_banned ? 'banned' : ''}`}
                            onClick={() => setSelectedProfile(p)}
                        >
                            <img src={p.photo_1 || p.avatar_url || 'https://via.placeholder.com/40'} alt="avatar" />
                            <div className="admin-user-info">
                                <strong>{p.display_name || p.twitch_username}</strong>
                                <span>{new Date(p.created_at || Date.now()).toLocaleDateString('it-IT')}</span>
                            </div>
                            {p.is_banned && <div className="admin-badge badge-banned">BAN</div>}
                            {p.warning_message && <div className="admin-badge badge-warn">WARN</div>}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content / Detail */}
            <div className="admin-main">
                {selectedProfile ? (
                    <div className="admin-profile-detail">
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
                                        Sblocca Utente (Unban)
                                    </button>
                                ) : (
                                    <button className="btn-admin btn-ban" onClick={() => setActiveAction('ban')}>Banna Utente</button>
                                )}

                                <button className="btn-admin btn-warn" onClick={() => setActiveAction('warn')}>Invia Segnalazione</button>
                                <button className="btn-admin btn-delete" onClick={() => setActiveAction('delete')}>Elimina Definitivamente</button>
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
                                <strong>SEGNALAZIONE ATTIVA (Non ancora letta)</strong>
                                <p>Messaggio: {selectedProfile.warning_message}</p>
                            </div>
                        )}

                        <div className="admin-profile-data-grid">
                            <div className="admin-data-card">
                                <h3>Bio & Info</h3>
                                <p><strong>Bio:</strong> {selectedProfile.bio}</p>
                                <p><strong>Hobby:</strong> {selectedProfile.hobbies}</p>
                                <p><strong>Musica:</strong> {selectedProfile.music}</p>
                            </div>
                            <div className="admin-data-card">
                                <h3>Preferenze</h3>
                                <p><strong>Zodiaco:</strong> {selectedProfile.zodiac_sign}</p>
                                <p><strong>Cerco:</strong> {selectedProfile.looking_for}</p>
                                <p><strong>Genere:</strong> {selectedProfile.gender}</p>
                            </div>
                            <div className="admin-data-card">
                                <h3>Twitch View</h3>
                                <p><strong>Guardo:</strong> {selectedProfile.twitch_watches}</p>
                                <p><strong>Grenbaud è:</strong> {selectedProfile.grenbaud_is}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="admin-empty-state">
                        <p>Seleziona un utente dalla lista per visualizzare i dettagli e le azioni di moderazione.</p>
                    </div>
                )}
            </div>

            {/* Action Modal */}
            {activeAction && (
                <div className="admin-modal-overlay">
                    <div className={`admin-modal modal-${activeAction}`}>
                        <h2>
                            {activeAction === 'ban' && 'Banna Utente'}
                            {activeAction === 'warn' && 'Invia Segnalazione'}
                            {activeAction === 'delete' && 'Eliminazione Definitiva'}
                        </h2>

                        {activeAction === 'delete' ? (
                            <p className="admin-danger-text">
                                ATTENZIONE: Questa azione eliminerà permanentemente l'utente, i suoi messaggi, e i suoi match. Questa operazione è IRREVERSIBILE.
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

export default AdminApp;
