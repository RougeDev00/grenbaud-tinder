import React from 'react';
import type { Profile } from '../../types';

interface ProfileHeaderProps {
    readOnly?: boolean;
    profile: Profile;
    isEditing: boolean;
    saving: boolean;
    handleSave: () => void;
    handleCancel: () => void;
    setIsEditing: (v: boolean) => void;
    isSettingsOpen: boolean;
    setIsSettingsOpen: (v: boolean) => void;
    onLogout?: () => void;
    handleDeleteAccount: () => void;
    currentUser?: Profile;
    onOpenChat?: () => void;
    isChatUnlocked?: boolean;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
    readOnly,
    profile,
    isEditing,
    saving,
    handleSave,
    handleCancel,
    setIsEditing,
    isSettingsOpen,
    setIsSettingsOpen,
    onLogout,
    handleDeleteAccount,
    currentUser,
    onOpenChat,
    isChatUnlocked = false
}) => {
    return (
        <div className="profile-view-header">
            <h2>{readOnly ? profile.display_name : (isEditing ? 'Modifica Profilo' : 'Il tuo Profilo')}</h2>

            {!readOnly && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {isEditing ? (
                        <>
                            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                                {saving ? 'Salvo...' : 'Salva'}
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={handleCancel} disabled={saving} style={{ opacity: 0.7 }}>
                                Annulla
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="btn btn-primary btn-sm" onClick={() => setIsEditing(true)}>
                                Modifica
                            </button>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <button
                                    className="btn-icon btn-settings"
                                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                                    title="Impostazioni"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="3"></circle>
                                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                                    </svg>
                                </button>
                                {isSettingsOpen && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        right: 0,
                                        marginTop: '8px',
                                        padding: '8px',
                                        background: '#18181b', // dark bg
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                        zIndex: 100,
                                        minWidth: '180px'
                                    }}>
                                        <button
                                            className="btn btn-sm"
                                            onClick={onLogout}
                                            style={{ width: '100%', textAlign: 'left', marginBottom: '4px', background: 'transparent', border: 'none', color: '#e4e4e7' }}
                                        >
                                            Esci (Logout)
                                        </button>
                                        <button
                                            className="btn btn-sm"
                                            onClick={handleDeleteAccount}
                                            style={{ width: '100%', textAlign: 'left', background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444' }}
                                        >
                                            Elimina Account
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}

            {readOnly && currentUser && onOpenChat && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <button
                        className={`btn ${isChatUnlocked ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                        onClick={() => {
                            if (isChatUnlocked) {
                                onOpenChat();
                            } else {
                                alert("🔒 Chat Bloccata\n\nPer sbloccare la messaggistica privata, entrambi dovete generare l'analisi di compatibilità AI. È il nostro modo per assicurarci che ci sia una curiosità reciproca! ✨");
                            }
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer',
                            opacity: isChatUnlocked ? 1 : 0.7,
                            background: isChatUnlocked ? undefined : 'rgba(255,255,255,0.05)',
                            border: isChatUnlocked ? undefined : '1px solid rgba(255,255,255,0.1)',
                            color: isChatUnlocked ? undefined : 'rgba(255,255,255,0.5)'
                        }}
                    >
                        {isChatUnlocked ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        )}
                        {isChatUnlocked ? 'Messaggio' : 'Chat Bloccata'}
                    </button>
                    {!isChatUnlocked && (
                        <span style={{ fontSize: '0.65rem', opacity: 0.5, color: '#fff', marginRight: '4px' }}>
                            Serve analisi reciproca ✨
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};
