import React, { useEffect, useState } from 'react';
import type { Profile } from '../types';
import { getAllProfiles } from '../services/profileService';
import { generateMockProfiles } from '../lib/mockData';
import ProfileCard from './ProfileCard';
import ProfileView from './ProfileView';
import './ProfileGrid.css';

interface ProfileGridProps {
    currentUser: Profile;
    onOpenChat?: (user: Profile) => void;
}

const ProfileGrid: React.FC<ProfileGridProps> = ({ currentUser, onOpenChat }) => {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [mockProfiles, setMockProfiles] = useState<Profile[]>([]);
    const [isDemo, setIsDemo] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

    useEffect(() => {
        const fetchProfiles = async () => {
            setLoading(true);
            try {
                // Fetch first 50 profiles for now, excluding self at server level
                const data = await getAllProfiles(0, 50, currentUser.twitch_id);
                // Secondary filter for safety using twitch_id (most reliable)
                const filtered = data.filter(p => p.twitch_id !== currentUser.twitch_id);
                setProfiles(filtered);
            } catch (err) {
                console.error('Error loading grid:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfiles();
    }, [currentUser.twitch_id]);

    if (loading) {
        return (
            <div className="grid-loading">
                <div className="loading-spinner" />
                <p>Caricamento community...</p>
            </div>
        );
    }

    if (selectedProfile) {
        return (
            <div className="profile-detail-view animate-fade-in">
                <button
                    className="btn-back"
                    onClick={() => setSelectedProfile(null)}
                >
                    <div className="btn-back-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                    </div>
                    <span>Torna alla griglia</span>
                </button>
                <ProfileView
                    profile={selectedProfile}
                    currentUser={currentUser}
                    readOnly
                    onOpenChat={() => onOpenChat?.(selectedProfile)}
                />
            </div>
        );
    }

    const displayedProfiles = isDemo ? mockProfiles : profiles;
    const title = isDemo ? `Demo Mode (${displayedProfiles.length})` : `Scopri Tutti (${displayedProfiles.length})`;

    return (
        <div className="profile-grid-container animate-fade-in">
            <div className="grid-header">
                <h2 className="grid-title">{title}</h2>
                <button
                    className={`btn-demo ${isDemo ? 'btn-demo--active' : ''}`}
                    onClick={() => {
                        if (!isDemo && mockProfiles.length === 0) {
                            setMockProfiles(generateMockProfiles(100));
                        }
                        setIsDemo(!isDemo);
                    }}
                >
                    {isDemo ? 'Disattiva Demo' : 'Simula 100 Utenti'}
                </button>
            </div>
            <div className="profile-grid">
                {displayedProfiles.map(profile => (
                    <div
                        key={profile.id}
                        className="grid-card-wrapper"
                    >
                        <ProfileCard
                            profile={profile}
                            currentUser={currentUser}
                            onOpenProfile={() => setSelectedProfile(profile)}
                        />
                    </div>
                ))}
            </div>

            {
                displayedProfiles.length === 0 && (
                    <div className="grid-empty">
                        <p>Nessun utente trovato :(</p>
                    </div>
                )
            }

            <div style={{ textAlign: 'center', opacity: 0.7, fontSize: '0.8rem', padding: '20px 0', color: 'rgba(255,255,255,0.5)' }}>
                v0.2.3-fix
            </div>
        </div >
    );
};

export default ProfileGrid;
