import React, { useState, useRef, useEffect } from 'react';
import type { Profile, EsploraPostWithProfile } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { deleteProfile, updateProfile } from '../services/profileService';
import { getUserPosts } from '../services/esploraService';
import { generatePersonalityAnalysis } from '../services/aiService';
import { checkMutualAnalysis } from '../services/notificationService';
import { compressImage } from '../utils/imageUtils';
import PersonalityQuiz from './PersonalityQuiz';
import ThreadPost from './Esplora/ThreadPost';
import { CompatibilityCard } from './ProfileView/CompatibilityCard';
import { ProfileBioSection } from './ProfileView/ProfileBioSection';
import { ProfileEditForm } from './ProfileView/ProfileEditForm';
import { ProfileHeader } from './ProfileView/ProfileHeader';
import { PersonalityRadarChart } from './ProfileView/PersonalityRadarChart';
import { ARCHETYPES } from '../data/archetypes';
import './ProfileView.css';

interface ProfileViewProps {
    profile: Profile;
    currentUser?: Profile;
    onLogout?: () => void;
    readOnly?: boolean;
    onOpenChat?: () => void;
}

/* ---- Colored SVG icons matching ProfileCard ---- */
const sectionIcons: Record<string, { svg: React.ReactNode; color: string }> = {
    bio: {
        color: '#60A5FA',
        svg: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="17" y1="10" x2="3" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="17" y1="18" x2="3" y2="18" /></svg>,
    },
    hobbies: {
        color: '#F59E0B',
        svg: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
    },
    music: {
        color: '#EC4899',
        svg: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>,
    },
    youtube: {
        color: '#EF4444',
        svg: <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.87.55 9.38.55 9.38.55s7.5 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" /></svg>,
    },
    twitch: {
        color: '#9146FF',
        svg: <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" /></svg>,
    },
    grenbaud: {
        color: '#A78BFA',
        svg: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>,
    },
    instagram: {
        color: '#E1306C',
        svg: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="5" /><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" /></svg>,
    },
    lookingFor: {
        color: '#34D399',
        svg: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
    },
    gender: {
        color: '#8B5CF6',
        svg: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="3" /><line x1="12" y1="8" x2="12" y2="17" /><line x1="9" y1="20" x2="15" y2="20" /></svg>,
    },
    freeTime: {
        color: '#10B981',
        svg: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
    },
    personality: {
        color: '#A855F7',
        svg: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>,
    },
    dream: {
        color: '#FCD34D',
        svg: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" /></svg>,
    },
    weekend: {
        color: '#6EE7B7',
        svg: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
    },
    redFlag: {
        color: '#EF4444',
        svg: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>,
    },
};

const Section = ({ iconKey, label, value }: { iconKey: string; label: string; value: string }) => {
    const { svg, color } = sectionIcons[iconKey] || { svg: null, color: 'var(--text-muted)' };
    return (
        <div className="profile-section">
            <div className="profile-section-header">
                {svg && <span className="profile-section-icon" style={{ color }}>{svg}</span>}
                <span className="profile-section-label">{label}</span>
            </div>
            <p className="profile-section-value">{value}</p>
        </div>
    );
};

const ProfileView: React.FC<ProfileViewProps> = ({ profile: initialProfile, currentUser, onLogout, readOnly = false, onOpenChat }) => {
    const { user, session } = useAuth();
    const [profile, setProfile] = useState<Profile>(initialProfile);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isQuizOpen, setIsQuizOpen] = useState(false);
    const [localAiAnalysis, setLocalAiAnalysis] = useState<string | null>(null);
    const [showDetails, setShowDetails] = useState(true);
    const [isSummaryExpanded, setIsSummaryExpanded] = useState(true);
    const [isPersonalityExpanded, setIsPersonalityExpanded] = useState(true);
    const [isChatUnlocked, setIsChatUnlocked] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'posts'>('profile');
    const [userPosts, setUserPosts] = useState<EsploraPostWithProfile[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(false);


    // Edit state
    const [displayName, setDisplayName] = useState(profile.display_name);
    const [bio, setBio] = useState(profile.bio);
    const [hobbies, setHobbies] = useState(profile.hobbies);
    const [music, setMusic] = useState(profile.music);
    const [age, setAge] = useState<string>(profile.age ? String(profile.age) : '');
    const [city, setCity] = useState(profile.city || '');
    const [musicArtists, setMusicArtists] = useState(profile.music_artists);
    const [youtube, setYoutube] = useState(profile.youtube);
    const [youtubeChannels, setYoutubeChannels] = useState(profile.youtube_channels);
    const [twitchWatches, setTwitchWatches] = useState(profile.twitch_watches);
    const [twitchStreamers, setTwitchStreamers] = useState(profile.twitch_streamers);
    const [grenbaudIs, setGrenbaudIs] = useState(profile.grenbaud_is);
    const [instagram, setInstagram] = useState(profile.instagram);
    const [lookingFor, setLookingFor] = useState(profile.looking_for || '');
    const [zodiac, setZodiac] = useState(profile.zodiac_sign || '');
    const [gender, setGender] = useState(profile.gender || '');
    const [freeTime, setFreeTime] = useState(profile.free_time || '');
    const [questionDream, setQuestionDream] = useState(profile.question_dream || '');
    const [questionWeekend, setQuestionWeekend] = useState(profile.question_weekend || '');
    const [questionRedflag, setQuestionRedflag] = useState(profile.question_redflag || '');

    // Photo state
    const [photos, setPhotos] = useState([profile.photo_1, profile.photo_2, profile.photo_3]);
    const [photoFiles, setPhotoFiles] = useState<(File | null)[]>([null, null, null]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [editingPhotoSlot, setEditingPhotoSlot] = useState(-1);

    const handlePhotoClick = (slot: number) => {
        if (!isEditing) return;
        setEditingPhotoSlot(slot);
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        let file = e.target.files?.[0];
        if (!file || editingPhotoSlot < 0) return;

        // Auto-compress < 2MB usually
        try {
            console.log(`Original file size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
            if (file.type.match(/image.*/)) {
                const compressed = await compressImage(file, 1200, 1200, 0.7);
                console.log(`Compressed file size: ${(compressed.size / 1024 / 1024).toFixed(2)} MB`);
                file = compressed;
            }
        } catch (err) {
            console.warn('Image compression failed, using original file:', err);
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            const newPhotos = [...photos];
            newPhotos[editingPhotoSlot] = ev.target?.result as string;
            setPhotos(newPhotos);
            const newFiles = [...photoFiles];
            newFiles[editingPhotoSlot] = file;
            setPhotoFiles(newFiles);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleCancel = () => {
        setDisplayName(profile.display_name);
        setBio(profile.bio);
        setAge(profile.age ? String(profile.age) : '');
        setCity(profile.city || '');
        setHobbies(profile.hobbies);
        setMusic(profile.music);
        setMusicArtists(profile.music_artists);
        setYoutube(profile.youtube);
        setYoutubeChannels(profile.youtube_channels);
        setTwitchWatches(profile.twitch_watches);
        setTwitchStreamers(profile.twitch_streamers);
        setGrenbaudIs(profile.grenbaud_is);
        setInstagram(profile.instagram);
        setLookingFor(profile.looking_for || '');
        setZodiac(profile.zodiac_sign || '');
        setGender(profile.gender || '');
        setFreeTime(profile.free_time || '');
        setQuestionDream(profile.question_dream || '');
        setQuestionWeekend(profile.question_weekend || '');
        setQuestionRedflag(profile.question_redflag || '');
        setPhotos([profile.photo_1, profile.photo_2, profile.photo_3]);
        setPhotoFiles([null, null, null]);
        setIsEditing(false);
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm('SEI SICURO DI VOLER CANCELLARE IL TUO ACCOUNT?\n\nTutti i tuoi dati (match, messaggi, foto) verranno eliminati permanentemente.\nPotrai registrarti di nuovo da zero.')) {
            return;
        }

        const success = await deleteProfile(profile.id);
        if (success) {
            alert('Account eliminato correttamente. Verrai reindirizzato alla pagina iniziale.');
            window.location.href = '/';
        } else {
            alert('Errore durante l\'eliminazione. Riprova o contatta il supporto.');
        }
    };



    // Check mutual analysis for chat unlock
    React.useEffect(() => {
        const fetchUnlockStatus = async () => {
            if (!currentUser?.id || !profile?.id || currentUser.id === profile.id) return;
            const unlocked = await checkMutualAnalysis(currentUser.id, profile.id);
            setIsChatUnlocked(unlocked);
        };
        fetchUnlockStatus();
    }, [currentUser?.id, profile?.id]);

    // Fetch user posts when Posts tab is activated
    useEffect(() => {
        if (activeTab !== 'posts') return;
        setLoadingPosts(true);
        getUserPosts(profile.id, currentUser?.id || profile.id).then(data => {
            setUserPosts(data);
            setLoadingPosts(false);
        });
    }, [activeTab, profile.id, currentUser?.id]);

    const handleSave = async () => {
        if (!session || !user) return;
        setSaving(true);
        try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            const twitchId = user.id;

            const uploadedPhotoUrls = [...photos];
            for (let i = 0; i < photoFiles.length; i++) {
                const file = photoFiles[i];
                if (!file) continue;
                const ext = file.name.split('.').pop() || 'jpg';
                const filePath = `${twitchId}/photo_${i + 1}.${ext}`;
                try {
                    const uploadRes = await fetch(
                        `${supabaseUrl}/storage/v1/object/photos/${filePath}`,
                        {
                            method: 'POST',
                            headers: {
                                'apikey': supabaseKey,
                                'Authorization': `Bearer ${session.access_token}`,
                                'Content-Type': file.type || 'image/jpeg',
                                'x-upsert': 'true',
                            },
                            body: file,
                        }
                    );
                    if (uploadRes.ok) {
                        uploadedPhotoUrls[i] = `${supabaseUrl}/storage/v1/object/public/photos/${filePath}`;
                    }
                } catch (err) {
                    console.error(`[EDIT] Photo ${i + 1} error:`, err);
                }
            }

            const updatedData = {
                display_name: displayName, bio, hobbies,
                music, music_artists: musicArtists,
                youtube, youtube_channels: youtubeChannels,
                twitch_watches: twitchWatches, twitch_streamers: twitchStreamers,
                grenbaud_is: grenbaudIs, instagram,
                zodiac_sign: zodiac, looking_for: lookingFor, gender, free_time: freeTime,
                age: parseInt(age) || null, city,
                question_dream: questionDream,
                question_weekend: questionWeekend,
                question_redflag: questionRedflag,
                photo_1: uploadedPhotoUrls[0] || '',
                photo_2: uploadedPhotoUrls[1] || '',
                photo_3: uploadedPhotoUrls[2] || '',
            };

            const res = await fetch(
                `${supabaseUrl}/rest/v1/profiles?id=eq.${profile.id}`,
                {
                    method: 'PATCH',
                    headers: {
                        'apikey': supabaseKey,
                        'Authorization': `Bearer ${session.access_token}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation',
                    },
                    body: JSON.stringify(updatedData),
                }
            );

            if (res.ok) {
                const data = await res.json();
                if (data.length > 0) {
                    setProfile(data[0] as Profile);
                    setPhotos([data[0].photo_1, data[0].photo_2, data[0].photo_3]);
                }
                setPhotoFiles([null, null, null]);
                setIsEditing(false);
                alert('✅ Profilo aggiornato!');
            } else {
                alert('❌ Errore nel salvataggio. Riprova.');
            }
        } catch (err) {
            console.error('[EDIT] Save failed:', err);
            alert('❌ Errore di connessione. Riprova.');
        } finally {
            setSaving(false);
        }
    };

    const handleQuizComplete = async (type: string, scores: any, answers: Record<number, number>) => {
        setSaving(true);
        console.log('[QUIZ] Saving results for profile:', profile.id, { type, scores });
        try {
            // Force valid 4-char MBTI code
            let safeType = type;
            if (type.length > 4) {
                if (type.includes('-')) {
                    safeType = type.split('-')[0];
                } else {
                    console.warn('[QUIZ] Type length > 4. Truncating to:', safeType);
                }
            }

            // Generate AI Analysis
            let aiAnalysis = null;
            let newRegenerationCount = profile.personality_ai_regenerations || 0;
            const maxRegenerations = 3;

            try {
                if (answers && Object.keys(answers).length > 0) {
                    if (newRegenerationCount >= maxRegenerations) {
                        console.warn('[QUIZ] Max regenerations reached. Skipping AI analysis.');
                        alert(`Nota: Hai raggiunto il limite di analisi AI (${maxRegenerations}). Il test verrà salvato ma l'analisi AI non verrà rigenerata.`);
                    } else {
                        console.log('[QUIZ] Generating AI analysis with answers:', Object.keys(answers).length);
                        aiAnalysis = await generatePersonalityAnalysis({
                            display_name: profile.display_name,
                            personality_type: safeType,
                            personality_mind: scores.mind,
                            personality_energy: scores.energy,
                            personality_nature: scores.nature,
                            personality_tactics: scores.tactics,
                            personality_identity: scores.identity
                        }, answers);

                        if (!aiAnalysis) {
                            console.error('[QUIZ] AI returned null.');
                            alert('⚠️ L\'AI non ha generato il riassunto. Riprova tra poco.');
                        } else {
                            console.log('[QUIZ] AI Analysis result:', aiAnalysis.substring(0, 20) + '...');
                            setLocalAiAnalysis(aiAnalysis);
                            newRegenerationCount++; // Increment only if successful
                        }
                    }
                } else {
                    console.warn('[QUIZ] No answers provided for AI analysis');
                    alert('⚠️ Nessuna risposta trovata per l\'analisi AI. Hai usato la Demo?');
                }
            } catch (e) {
                console.error('[QUIZ] AI analysis failed:', e);
                alert('⚠️ Errore durante l\'analisi AI: ' + e);
            }

            const updatePayload: any = {
                personality_type: safeType.substring(0, 4),
                personality_mind: scores.mind,
                personality_energy: scores.energy,
                personality_nature: scores.nature,
                personality_tactics: scores.tactics,
                personality_identity: scores.identity
            };

            if (aiAnalysis) {
                updatePayload.personality_ai_analysis = aiAnalysis;
                updatePayload.personality_ai_regenerations = newRegenerationCount;
            }

            const updated = await updateProfile(profile.id, updatePayload);

            if (updated) {
                console.log('[QUIZ] Profile updated successfully');
                setProfile(updated);
                setIsQuizOpen(false);
                alert('✨ Test completato! Il profilo è stato aggiornato con l\'analisi AI.');
            } else {
                console.error('[QUIZ] Update returned null. Check RLS or database columns.');
                alert('❌ Errore nel salvataggio. Riprova.');
            }
        } catch (err) {
            console.error('[QUIZ] Critical error during save:', err);
            alert('❌ Errore di sistema durante il salvataggio. Riprova.');
        } finally {
            setSaving(false);
        }
    };

    const visiblePhotos = photos.filter(Boolean);
    const [heroIndex, setHeroIndex] = useState(0);


    return (
        <div className="profile-view">
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleFileChange} />



            {/* Header */}
            <ProfileHeader
                readOnly={readOnly}
                profile={profile}
                isEditing={isEditing}
                saving={saving}
                handleSave={handleSave}
                handleCancel={handleCancel}
                setIsEditing={setIsEditing}
                isSettingsOpen={isSettingsOpen}
                setIsSettingsOpen={setIsSettingsOpen}
                onLogout={onLogout}
                handleDeleteAccount={handleDeleteAccount}
                currentUser={currentUser}
                onOpenChat={onOpenChat}
                isChatUnlocked={isChatUnlocked}
            />

            {/* Photos — Hero Carousel (view) or Edit Grid */}
            {isEditing ? (
                <div className="profile-view-photos">
                    {[0, 1, 2].map(i => (
                        <button
                            key={i}
                            className={`profile-view-photo profile-view-photo--edit ${photos[i] ? '' : 'profile-view-photo--empty'}`}
                            onClick={() => handlePhotoClick(i)}
                        >
                            {photos[i] ? (
                                <>
                                    <img src={photos[i]} alt={`Foto ${i + 1}`} />
                                    <div className="photo-edit-badge">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                    </div>
                                </>
                            ) : (
                                <div className="photo-add-icon">+</div>
                            )}
                        </button>
                    ))}
                </div>
            ) : visiblePhotos.length > 0 ? (
                <div className="profile-hero">
                    {/* Main hero image */}
                    <div className="profile-hero-img-wrap">
                        {visiblePhotos.map((photo, i) => (
                            <img
                                key={i}
                                className={`profile-hero-img ${i === heroIndex ? 'profile-hero-img--active' : ''}`}
                                src={photo}
                                alt={`Foto ${i + 1}`}
                            />
                        ))}
                        {/* Left / Right tap zones */}
                        {visiblePhotos.length > 1 && (
                            <>
                                <button
                                    className="profile-hero-nav profile-hero-nav--prev"
                                    onClick={() => setHeroIndex(i => (i - 1 + visiblePhotos.length) % visiblePhotos.length)}
                                    aria-label="Foto precedente"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                                </button>
                                <button
                                    className="profile-hero-nav profile-hero-nav--next"
                                    onClick={() => setHeroIndex(i => (i + 1) % visiblePhotos.length)}
                                    aria-label="Foto successiva"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                                </button>
                            </>
                        )}
                        {/* Gradient overlay */}
                        <div className="profile-hero-gradient" />
                        {/* Dot indicators */}
                        {visiblePhotos.length > 1 && (
                            <div className="profile-hero-dots">
                                {visiblePhotos.map((_, i) => (
                                    <button
                                        key={i}
                                        className={`profile-hero-dot ${i === heroIndex ? 'profile-hero-dot--active' : ''}`}
                                        onClick={() => setHeroIndex(i)}
                                    />
                                ))}
                            </div>
                        )}
                        {/* Thumbnail strip along bottom */}
                        {visiblePhotos.length > 1 && (
                            <div className="profile-hero-thumbs">
                                {visiblePhotos.map((photo, i) => (
                                    <button
                                        key={i}
                                        className={`profile-hero-thumb ${i === heroIndex ? 'profile-hero-thumb--active' : ''}`}
                                        onClick={() => setHeroIndex(i)}
                                    >
                                        <img src={photo} alt="" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ) : null}

            {/* Tab Switcher — premium pill style */}
            <div className="profile-tabs">
                <div
                    className="profile-tabs-slider"
                    style={{ transform: `translateX(${activeTab === 'posts' ? '100%' : '0%'})` }}
                />
                <button
                    className={`profile-tab ${activeTab === 'profile' ? 'active' : ''}`}
                    onClick={() => setActiveTab('profile')}
                >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                    Profilo
                </button>
                <button
                    className={`profile-tab ${activeTab === 'posts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('posts')}
                >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <line x1="3" y1="9" x2="21" y2="9" />
                        <line x1="9" y1="21" x2="9" y2="9" />
                    </svg>
                    Post
                    {userPosts.length > 0 && <span className="profile-tab-badge">{userPosts.length}</span>}
                </button>
            </div>

            {activeTab === 'posts' ? (
                /* ── Posts Tab ── */
                <div className="profile-view-card">
                    <div className="profile-posts-tab">
                        {loadingPosts ? (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.4)' }}>
                                Caricamento post...
                            </div>
                        ) : userPosts.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: '12px', opacity: 0.5 }}>📝</div>
                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
                                    {profile.id === currentUser?.id ? 'Non hai ancora pubblicato nessun post.' : 'Nessun post pubblicato.'}
                                </p>
                            </div>
                        ) : (
                            <div className="profile-posts-list">
                                {userPosts.map(post => (
                                    <div id={`profile-post-${post.id}`} key={post.id}>
                                        <ThreadPost
                                            post={post}
                                            currentUserId={currentUser?.id || profile.id}
                                            onLike={() => {
                                                getUserPosts(profile.id, currentUser?.id || profile.id).then(setUserPosts);
                                            }}
                                            onDelete={() => {
                                                setUserPosts(prev => prev.filter(p => p.id !== post.id));
                                            }}
                                            onImageClick={(url) => window.open(url, '_blank')}
                                            onProfileClick={(userId) => {
                                                window.location.href = `/profile?view=${userId}`;
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>


            ) : (
                <>
                    <div className="profile-view-card glass-card">
                        {isEditing ? (
                            <ProfileEditForm
                                displayName={displayName} setDisplayName={setDisplayName}
                                age={age} setAge={setAge}
                                city={city} setCity={setCity}
                                bio={bio} setBio={setBio}
                                hobbies={hobbies} setHobbies={setHobbies}
                                music={music} setMusic={setMusic}
                                musicArtists={musicArtists} setMusicArtists={setMusicArtists}
                                youtube={youtube} setYoutube={setYoutube}
                                youtubeChannels={youtubeChannels} setYoutubeChannels={setYoutubeChannels}
                                twitchWatches={twitchWatches} setTwitchWatches={setTwitchWatches}
                                twitchStreamers={twitchStreamers} setTwitchStreamers={setTwitchStreamers}
                                grenbaudIs={grenbaudIs} setGrenbaudIs={setGrenbaudIs}
                                freeTime={freeTime} setFreeTime={setFreeTime}
                                questionDream={questionDream} setQuestionDream={setQuestionDream}
                                questionWeekend={questionWeekend} setQuestionWeekend={setQuestionWeekend}
                                questionRedflag={questionRedflag} setQuestionRedflag={setQuestionRedflag}
                                instagram={instagram} setInstagram={setInstagram}
                                gender={gender} setGender={setGender}
                                lookingFor={lookingFor} setLookingFor={setLookingFor}
                                zodiac={zodiac} setZodiac={setZodiac}
                            />
                        ) : (
                            <>
                                {readOnly && currentUser && currentUser.id !== profile.id && (
                                    <CompatibilityCard profile={profile} currentUser={currentUser} />
                                )}

                                <div className="profile-view-name-row">
                                    <div className="profile-identity-block">
                                        {profile.twitch_username && (
                                            <a
                                                href={`https://twitch.tv/${profile.twitch_username}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="profile-twitch-badge"
                                            >
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" /></svg>
                                                @{profile.twitch_username}
                                            </a>
                                        )}
                                        <h3 className="profile-identity-name">
                                            {profile.display_name}
                                            {profile.age && <span className="profile-identity-age">{profile.age}</span>}
                                        </h3>
                                    </div>
                                    {profile.ai_summary && (
                                        <button
                                            className={`btn-toggle-details ${!showDetails ? 'collapsed' : ''}`}
                                            onClick={() => setShowDetails(!showDetails)}
                                            title={showDetails ? "Nascondi dettagli e mostra solo AI" : "Mostra tutti i dettagli"}
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="18 15 12 9 6 15"></polyline>
                                            </svg>
                                        </button>
                                    )}
                                </div>
                                <div className="profile-view-chips-row">
                                    {profile.gender && (() => {
                                        const genderLabel: Record<string, string> = { 'M': 'Maschio', 'F': 'Femmina', 'N/S': 'Non specificato' };
                                        const label = genderLabel[profile.gender] || profile.gender;
                                        const icon = profile.gender === 'M' || profile.gender === 'Maschio' ? '♂' : profile.gender === 'F' || profile.gender === 'Femmina' ? '♀' : '⚧';
                                        return <span className="chip chip--gender">{icon} {label}</span>;
                                    })()}
                                    {profile.city && (
                                        <span className="chip chip--city">📍 {profile.city}</span>
                                    )}
                                    {profile.zodiac_sign && (
                                        <span className="chip chip--zodiac">{profile.zodiac_sign}</span>
                                    )}
                                    {profile.personality_type && (
                                        <span className="chip chip--archetype">
                                            {ARCHETYPES[profile.personality_type.split('-')[0]]?.title || profile.personality_type}
                                        </span>
                                    )}
                                </div>

                                {/* AI Summary Moved Here */}
                                {profile.ai_summary && (
                                    <div className="profile-section profile-section--ai" style={{ marginBottom: '24px' }}>
                                        <div className="ai-ultra-header-wrapper">
                                            <div className="ai-ultra-animated-border"></div>
                                            <div className="ai-ultra-header">
                                                <div className="ai-ultra-brand">
                                                    <div className="ai-ultra-badge" style={{ alignSelf: 'flex-start' }}>
                                                        <span className="sparkle-icon">✨</span>
                                                        <span className="badge-text" style={{ fontSize: '0.65rem' }}>AI Powered</span>
                                                    </div>
                                                    <div className="ai-ultra-text" style={{ paddingRight: '8px' }}>
                                                        <h3 className="ai-ultra-title" style={{ fontSize: '1.2rem' }}>Riassunto AI</h3>
                                                    </div>
                                                </div>

                                                <div className="ai-ultra-actions" style={{ position: 'relative', zIndex: 10 }}>

                                                    <button
                                                        className={`btn-ai-ultra-toggle ${isSummaryExpanded ? 'expanded' : ''}`}
                                                        onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
                                                        aria-label={isSummaryExpanded ? 'Riduci' : 'Espandi'}
                                                        style={{ width: '32px', height: '32px', padding: 0 }}
                                                    >
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="6 9 12 15 18 9"></polyline>
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`collapsible-summary ${isSummaryExpanded ? 'expanded' : 'collapsed'}`}>
                                            <p className="profile-section-value" style={{ whiteSpace: 'pre-wrap', paddingLeft: 0, marginTop: '8px', color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem' }}>
                                                {profile.ai_summary}
                                            </p>
                                        </div>
                                    </div>
                                )}



                                <div className={`profile-view-sections ${!showDetails ? 'hidden' : ''}`}>
                                    <ProfileBioSection profile={profile} />

                                    {profile.personality_type ? (
                                        <Section
                                            iconKey="personality"
                                            label="Personalità MBTI"
                                            value={ARCHETYPES[profile.personality_type.split('-')[0]]?.title || profile.personality_type}
                                        />
                                    ) : (
                                        readOnly && (
                                            <Section
                                                iconKey="personality"
                                                label="Personalità MBTI"
                                                value="L'utente non ha ancora effettuato il test delle personalità"
                                            />
                                        )
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Personality Test CTA or Results - Moved to bottom */}
                    {
                        !readOnly && !isEditing ? (
                            <div className="personality-cta glass-card animate-fade-in">
                                <div className="personality-cta-content">
                                    <div className="personality-cta-icon">✨</div>
                                    <div>
                                        <h4>Test della Personalità</h4>
                                        <p>
                                            {profile.personality_type
                                                ? `Sei un ${ARCHETYPES[profile.personality_type.split('-')[0]]?.title || profile.personality_type}. Rifallo per aggiornare il tuo profilo!`
                                                : 'Scopri il tuo profilo MBTI per trovare persone più compatibili!'}
                                        </p>
                                    </div>
                                </div>
                                <button className="btn btn-primary" onClick={() => setIsQuizOpen(true)}>
                                    {profile.personality_type ? 'Rifai il Test' : 'Inizia il Test'}
                                </button>
                            </div>
                        ) : null
                    }

                    {/* Detailed Personality Results (Visible to all if they exist) */}
                    {
                        profile.personality_type && profile.personality_mind !== undefined && (
                            <div className="personality-details glass-card animate-fade-in">
                                <div className="personality-header">
                                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                                        <h3 className="personality-title" style={{ margin: 0 }}>
                                            {ARCHETYPES[profile.personality_type.split('-')[0]]?.title || profile.personality_type}
                                        </h3>
                                        <button
                                            className={`btn-toggle-details ${!isPersonalityExpanded ? 'collapsed' : ''}`}
                                            onClick={() => setIsPersonalityExpanded(!isPersonalityExpanded)}
                                            title={isPersonalityExpanded ? "Nascondi dettagli personalità" : "Mostra dettagli personalità"}
                                            style={{ position: 'absolute', right: '0', top: '50%', transform: `translateY(-50%) ${!isPersonalityExpanded ? 'rotate(180deg)' : ''}` }}
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="18 15 12 9 6 15"></polyline>
                                            </svg>
                                        </button>
                                    </div>

                                    <p className="personality-desc" style={{ margin: 0 }}>
                                        {ARCHETYPES[profile.personality_type.split('-')[0]]?.description}
                                    </p>
                                </div>

                                <div className={`personality-collapsible-content ${!isPersonalityExpanded ? 'hidden' : ''}`}>
                                    <div className="personality-bars">
                                        <SimpleResultBar label="Mente" left="Estroverso" right="Introverso" val={profile.personality_mind} color="#4298B4" />
                                        {/* Energy: Swap logic to match Intuitivo (Left) vs Concreto (Right) */}
                                        <SimpleResultBar label="Energia" left="Intuitivo" right="Concreto" val={100 - (profile.personality_energy ?? 50)} color="#E4AE3A" />
                                        <SimpleResultBar label="Natura" left="Razionale" right="Empatico" val={profile.personality_nature} color="#33A474" />
                                        <SimpleResultBar label="Tattica" left="Organizzato" right="Spontaneo" val={profile.personality_tactics} color="#88619A" />
                                    </div>

                                    {/* Gamified Radar Chart */}
                                    <PersonalityRadarChart
                                        mind={profile.personality_mind}
                                        energy={profile.personality_energy}
                                        nature={profile.personality_nature}
                                        tactics={profile.personality_tactics}
                                        identity={profile.personality_identity}
                                        personalityType={profile.personality_type}
                                    />

                                    {(profile.personality_ai_analysis || localAiAnalysis) && (
                                        <div className="personality-ai-analysis">
                                            <div className="personality-ai-analysis-header">
                                                <span className="personality-ai-header-icon">🧠</span>
                                                <h4 className="personality-ai-header-title">Analisi Psicologica AI</h4>
                                            </div>
                                            <p className="personality-ai-text">
                                                {localAiAnalysis || profile.personality_ai_analysis}
                                            </p>
                                        </div>
                                    )}
                                </div>




                            </div>
                        )
                    }

                    {
                        isQuizOpen && (
                            <div className="quiz-overlay">
                                <div className="quiz-modal glass-card animate-fade-in-up">
                                    <button className="quiz-close" onClick={() => setIsQuizOpen(false)} aria-label="Close quiz">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                    <PersonalityQuiz
                                        onComplete={handleQuizComplete}
                                        isSaving={saving}
                                    />
                                </div>
                            </div>
                        )
                    }

                    {/* Global Loader Overlay */}
                    {
                        saving && (
                            <div style={{
                                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                                backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 999999,
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                backdropFilter: 'blur(8px)'
                            }}>
                                <div className="loading-spinner" style={{ width: '60px', height: '60px', border: '5px solid rgba(255,255,255,0.1)', borderTop: '5px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                <h2 style={{ color: 'white', marginTop: '25px', fontSize: '1.4rem', fontWeight: 600 }}>Analisi AI in corso... 🧠</h2>
                                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', marginTop: '8px' }}>Stiamo scrivendo il tuo profilo psicologico</p>
                            </div>
                        )
                    }
                </>
            )}
        </div >
    );
};



const SimpleResultBar = ({ left, right, val, color }: any) => {
    const isLeft = val >= 50;
    const pctDisplay = isLeft ? val : (100 - val);
    const winningLabel = isLeft ? left : right;

    return (
        <div className="result-bar-container">
            {/* 1. Top Row: Score & Winning Label Centered */}
            <div className="result-score-centered" style={{ color: color }}>
                <strong>{pctDisplay}%</strong> {winningLabel}
            </div>

            {/* 2. Middle: The Bar */}
            <div className="result-track-full" style={{ backgroundColor: `${color}40` }}>
                <div className="result-fill-full" style={{
                    backgroundColor: color,
                    width: '100%'
                }}></div>
                <div className="result-handle-white" style={{
                    left: `${100 - val}%`,
                    borderColor: color
                }}></div>
            </div>

            {/* 3. Bottom Row: Labels */}
            <div className="result-labels-row">
                <span className="result-label-text">{left}</span>
                <span className="result-label-text">{right}</span>
            </div>
        </div>
    );
}

export default ProfileView;
