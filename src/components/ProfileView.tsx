import React, { useState, useRef } from 'react';
import type { Profile } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { deleteProfile, updateProfile } from '../services/profileService';
import { generatePersonalityAnalysis, generateProfileSummary, generateCompatibilityExplanation, getStoredCompatibility } from '../services/aiService';
import { compressImage } from '../utils/imageUtils';
import { calculateCompatibility } from '../utils/compatibility';
import { useEffect } from 'react';
import PersonalityQuiz from './PersonalityQuiz';
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
    const [isRegeneratingSummary, setIsRegeneratingSummary] = useState(false);
    const [showDetails, setShowDetails] = useState(true);

    // Compatibility state
    const [compatibilityScore, setCompatibilityScore] = useState<number | null>(null);
    const [compatibilityExplanation, setCompatibilityExplanation] = useState<string | null>(null);
    const [isExplanationLoading, setIsExplanationLoading] = useState(false);
    const [isScoreEstimated, setIsScoreEstimated] = useState(true);

    useEffect(() => {
        if (readOnly && currentUser && profile.id !== currentUser.id) {
            // First, establish the live mathematical score immediately for UI
            const initialScore = calculateCompatibility(currentUser, profile);
            setCompatibilityScore(initialScore);
            setIsScoreEstimated(true);

            // Then check if the DB already has a final saved score & explanation
            const fetchStored = async () => {
                try {
                    const stored = await getStoredCompatibility(currentUser.id, profile.id);
                    if (stored) {
                        setCompatibilityScore(stored.score);
                        setCompatibilityExplanation(stored.explanation);
                        setIsScoreEstimated(false);
                    }
                } catch (e) {
                    console.error('Failed to fetch existing compatibility', e);
                }
            };
            fetchStored();
        }
    }, [profile.id, currentUser?.id, readOnly]);

    const handleGenerateCompatibility = async () => {
        if (!currentUser) return;
        setIsExplanationLoading(true);
        try {
            const currentScore = compatibilityScore ?? calculateCompatibility(currentUser, profile);
            const result = await generateCompatibilityExplanation(currentUser, profile, currentScore);
            if (result) {
                setCompatibilityExplanation(result.explanation);
                setCompatibilityScore(result.score);
                setIsScoreEstimated(false);
            }
        } catch (e) {
            console.error('Failed to generate compatibility explanation', e);
        } finally {
            setIsExplanationLoading(false);
        }
    };

    // Removed misplaced JSX block

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

    const handleRegenerateSummary = async () => {
        if (!session || !user || isRegeneratingSummary) return;

        const currentCount = profile.ai_summary_regenerations || 0;
        const maxRegenerations = 3;

        if (currentCount >= maxRegenerations) {
            alert(`Hai raggiunto il limite massimo di rigenerazioni (${maxRegenerations}).`);
            return;
        }

        if (profile.ai_summary) {
            const confirmMsg = `Vuoi rigenerare la tua Bio AI? (Rimasti: ${maxRegenerations - currentCount}/${maxRegenerations})`;
            if (!window.confirm(confirmMsg)) return;
        }

        setIsRegeneratingSummary(true);
        try {
            console.log('[AI] Manual summary regeneration requested...');
            const newSummary = await generateProfileSummary(profile, profile.personality_answers);

            if (newSummary) {
                const newCount = currentCount + 1;
                const updatedProfile = await updateProfile(profile.id, {
                    ai_summary: newSummary,
                    ai_summary_regenerations: newCount
                });
                if (updatedProfile) {
                    setProfile(prev => ({ ...prev, ai_summary: newSummary, ai_summary_regenerations: newCount }));
                    alert(`Bio AI aggiornata! (${newCount}/${maxRegenerations} usati) ✨`);
                } else {
                    alert('Errore durante il salvataggio della nuova Bio AI.');
                }
            } else {
                alert('Errore durante la generazione della Bio AI.');
            }
        } catch (err) {
            console.error('[AI] Regeneration error:', err);
            alert('Errore imprevisto nella rigenerazione.');
        } finally {
            setIsRegeneratingSummary(false);
        }
    };

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
    const zodiacOptions = [
        '♈ Ariete', '♉ Toro', '♊ Gemelli', '♋ Cancro',
        '♌ Leone', '♍ Vergine', '♎ Bilancia', '♏ Scorpione',
        '♐ Sagittario', '♑ Capricorno', '♒ Acquario', '♓ Pesci'
    ];

    useEffect(() => {
        if (readOnly && currentUser && profile.id !== currentUser.id) {
            // 1. Calculate Local Estimate immediately
            const initialScore = calculateCompatibility(currentUser, profile);
            setCompatibilityScore(initialScore);
            setIsScoreEstimated(true);

            // 2. Check if we ALREADY have a real score in cache/DB 
            // (Don't generate new one, just check existence)
            // We can't easily check DB without triggering the whole service, 
            // but we can check local cache if we want. 
            // For now, let's keep it manual unless already cached.
        }
    }, [profile.id, currentUser?.id, readOnly]);

    return (
        <div className="profile-view">
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleFileChange} />



            {/* Header */}
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
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={onOpenChat}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        Messaggio
                    </button>
                )}
            </div>

            {/* Photos */}
            <div className="profile-view-photos">
                {isEditing ? (
                    [0, 1, 2].map(i => (
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
                    ))
                ) : (
                    visiblePhotos.map((photo, i) => (
                        <div key={i} className="profile-view-photo">
                            <img src={photo} alt={`Foto ${i + 1}`} />
                        </div>
                    ))
                )}
            </div>


            {/* Info Card */}
            <div className="profile-view-card glass-card">
                {isEditing ? (
                    <div className="profile-edit-form">
                        <EditField label="Nome" value={displayName} onChange={setDisplayName} maxLength={30} />
                        <EditField label="Età" value={age} onChange={setAge} maxLength={2} />
                        <EditField label="Città" value={city} onChange={setCity} maxLength={50} />
                        <EditField label="Bio" value={bio} onChange={setBio} maxLength={300} multiline />
                        <EditField label="Hobby & Passioni" value={hobbies} onChange={setHobbies} maxLength={150} />
                        <EditField label="Generi Musicali" value={music} onChange={setMusic} maxLength={150} />
                        <EditField label="Artisti/Band Preferiti" value={musicArtists} onChange={setMusicArtists} maxLength={150} />
                        <EditField label="Cosa guardi su YouTube" value={youtube} onChange={setYoutube} maxLength={150} />
                        <EditField label="Youtuber Preferiti" value={youtubeChannels} onChange={setYoutubeChannels} maxLength={150} />
                        <EditField label="Cosa guardi su Twitch" value={twitchWatches} onChange={setTwitchWatches} maxLength={150} />
                        <EditField label="Streamer Preferiti" value={twitchStreamers} onChange={setTwitchStreamers} maxLength={150} />
                        <EditField label="GrenBaud è un..." value={grenbaudIs} onChange={setGrenbaudIs} maxLength={200} />
                        <EditField label="Cosa fai nel tempo libero?" value={freeTime} onChange={setFreeTime} maxLength={300} multiline />
                        <EditField label="Sogno nel cassetto" value={questionDream} onChange={setQuestionDream} maxLength={200} />
                        <EditField label="Weekend ideale" value={questionWeekend} onChange={setQuestionWeekend} maxLength={200} />
                        <EditField label="La tua Red Flag" value={questionRedflag} onChange={setQuestionRedflag} maxLength={200} />
                        <EditField label="Instagram" value={instagram} onChange={setInstagram} maxLength={50} placeholder="@username" />
                        <div className="edit-field">
                            <label className="edit-field-label">Genere</label>
                            <select className="input-field" value={gender} onChange={e => setGender(e.target.value)}>
                                <option value="">Seleziona...</option>
                                <option value="Maschio">Maschio</option>
                                <option value="Femmina">Femmina</option>
                                <option value="Preferisco non specificarlo">Preferisco non specificarlo</option>
                            </select>
                        </div>
                        <div className="edit-field">
                            <label className="edit-field-label">Cosa mi porta qui</label>
                            <select className="input-field" value={lookingFor} onChange={e => setLookingFor(e.target.value)}>
                                <option value="">Seleziona...</option>
                                <option value="Nuove Amicizie">Nuove Amicizie</option>
                                <option value="Compagni di Giochi">Compagni di Giochi</option>
                                <option value="Due Chiacchiere">Due Chiacchiere</option>
                            </select>
                        </div>
                        <div className="edit-field">
                            <label className="edit-field-label">Segno Zodiacale</label>
                            <select className="input-field" value={zodiac} onChange={e => setZodiac(e.target.value)}>
                                <option value="">Seleziona...</option>
                                {zodiacOptions.map(z => <option key={z} value={z}>{z}</option>)}
                            </select>
                        </div>
                    </div>
                ) : (
                    <>
                        {compatibilityScore !== null && (
                            <div className="compatibility-card animate-fade-in">
                                <div className="compatibility-header">
                                    <div className="compatibility-score-circle">
                                        <svg viewBox="0 0 36 36" className="circular-chart">
                                            <path className="circle-bg"
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            />
                                            <path className="circle"
                                                strokeDasharray={`${compatibilityScore}, 100`}
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            />
                                            <text x="18" y="20.35" className="percentage">
                                                {isScoreEstimated ? '~' : ''}{compatibilityScore}%
                                            </text>
                                        </svg>
                                    </div>
                                    <div className="compatibility-info">
                                        <h3 className="compatibility-title">
                                            {isScoreEstimated ? 'Compatibilità Stimata' : 'Compatibilità Finale'}
                                        </h3>
                                        <p className="compatibility-subtitle">Affinità Baudriana</p>
                                    </div>
                                </div>
                                <div className="compatibility-reasoning">
                                    {isExplanationLoading ? (
                                        <div className="compatibility-loading">
                                            <span className="shimmer">Analisi profonda in corso... 🧠 Dai tempo all'AI di scandagliare le vostre vite.</span>
                                        </div>
                                    ) : compatibilityExplanation ? (
                                        <p className="compatibility-text">{compatibilityExplanation}</p>
                                    ) : (
                                        <div className="compatibility-empty-state">
                                            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginBottom: '12px', marginTop: '4px' }}>
                                                Vuoi un'analisi psicanalitica completa sui vostri punti in comune?
                                            </p>
                                            <button
                                                className="btn-regenerate-ai"
                                                style={{ margin: '0', cursor: 'pointer', zIndex: 10, position: 'relative' }}
                                                onClick={handleGenerateCompatibility}
                                            >
                                                ✨ Genera Analisi AI
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="profile-view-name-row">
                            <h3>{profile.display_name}{profile.age ? `, ${profile.age}` : ''}</h3>
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
                            {profile.gender && (
                                <span className="chip" style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {profile.gender === 'Maschio' ? '♂' : profile.gender === 'Femmina' ? '♀' : '⚧'} {profile.gender}
                                    {profile.city && <span style={{ opacity: 0.6, marginLeft: '4px', borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '8px' }}>📍 {profile.city}</span>}
                                </span>
                            )}
                            {profile.zodiac_sign && <span className="chip">{profile.zodiac_sign}</span>}
                            {profile.personality_type && (
                                <span className="chip" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7' }}>
                                    {ARCHETYPES[profile.personality_type.split('-')[0]]?.title || profile.personality_type}
                                </span>
                            )}
                        </div>
                        <p className="profile-view-username">@{profile.twitch_username}</p>
                        <div className={`profile-view-sections ${!showDetails ? 'hidden' : ''}`}>
                            {profile.bio && <Section iconKey="bio" label="Bio" value={profile.bio} />}
                            {profile.free_time && <Section iconKey="freeTime" label="Tempo Libero" value={profile.free_time} />}
                            {profile.hobbies && <Section iconKey="hobbies" label="Hobby & Passioni" value={profile.hobbies} />}
                            {profile.music && <Section iconKey="music" label="Generi Musicali" value={profile.music} />}
                            {profile.music_artists && <Section iconKey="music" label="Artisti Preferiti" value={profile.music_artists} />}
                            {profile.youtube && <Section iconKey="youtube" label="Cosa guardi su YouTube" value={profile.youtube} />}
                            {profile.youtube_channels && <Section iconKey="youtube" label="Youtuber Preferiti" value={profile.youtube_channels} />}
                            {profile.twitch_watches && <Section iconKey="twitch" label="Cosa guardi su Twitch" value={profile.twitch_watches} />}
                            {profile.twitch_streamers && <Section iconKey="twitch" label="Streamer Preferiti" value={profile.twitch_streamers} />}
                            {profile.grenbaud_is && <Section iconKey="grenbaud" label="GrenBaud è un..." value={profile.grenbaud_is} />}
                            {profile.instagram && <Section iconKey="instagram" label="Instagram" value={profile.instagram} />}
                            {profile.looking_for && <Section iconKey="lookingFor" label="Cosa mi porta qui" value={profile.looking_for} />}
                            {profile.question_dream && <Section iconKey="dream" label="Sogno nel cassetto" value={profile.question_dream} />}
                            {profile.question_weekend && <Section iconKey="weekend" label="Weekend ideale" value={profile.question_weekend} />}
                            {profile.question_redflag && <Section iconKey="redFlag" label="Red Flag" value={profile.question_redflag} />}
                        </div>
                        {profile.ai_summary && (
                            <div className="profile-section profile-section--ai">
                                <div className="profile-section-header" style={{ justifyContent: 'space-between', width: '100%' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span className="profile-section-icon">🤖</span>
                                        <span className="profile-section-label">AI Riassunto</span>
                                    </div>

                                    {!readOnly && (
                                        <button
                                            className={`btn-regenerate-ai ${isRegeneratingSummary ? 'loading' : ''}`}
                                            onClick={handleRegenerateSummary}
                                            disabled={isRegeneratingSummary || (profile.ai_summary_regenerations || 0) >= 3}
                                            title="Rigenera con i dati aggiornati"
                                            style={{ opacity: (profile.ai_summary_regenerations || 0) >= 3 ? 0.5 : 1 }}
                                        >
                                            {isRegeneratingSummary ? '⏳ Generazione...' : (
                                                `🔄 Rigenera (${3 - (profile.ai_summary_regenerations || 0)})`
                                            )}
                                        </button>
                                    )}
                                </div>
                                <p className="profile-section-value" style={{ whiteSpace: 'pre-wrap' }}>{profile.ai_summary}</p>
                            </div>
                        )}
                        {!profile.ai_summary && !readOnly && !isEditing && (
                            <div className="profile-section profile-section--ai profile-ai-empty-cta">
                                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                                    <div style={{ fontSize: '2rem', marginBottom: '12px' }}>✨</div>
                                    <h4 style={{ color: '#fff', marginBottom: '8px' }}>Manca la tua Bio AI!</h4>
                                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginBottom: '16px' }}>
                                        L'intelligenza artificiale può analizzare i tuoi dati per creare una descrizione unica di chi sei.
                                    </p>
                                    <button
                                        className={`btn btn-primary btn-generate-big ${isRegeneratingSummary ? 'loading' : ''}`}
                                        onClick={handleRegenerateSummary}
                                        disabled={isRegeneratingSummary || (profile.ai_summary_regenerations || 0) >= 3}
                                        style={{ width: '100%', maxWidth: '240px', margin: '0 auto', opacity: (profile.ai_summary_regenerations || 0) >= 3 ? 0.5 : 1 }}
                                    >
                                        {isRegeneratingSummary ? '⏳ Generazione in corso...' : (
                                            `✨ Genera Bio AI (${3 - (profile.ai_summary_regenerations || 0)})`
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                        {profile.personality_type && (
                            <Section
                                iconKey="personality"
                                label="Personalità MBTI"
                                value={ARCHETYPES[profile.personality_type.split('-')[0]]?.title || profile.personality_type}
                            />
                        )}
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
                            <h3 className="personality-title">
                                {ARCHETYPES[profile.personality_type.split('-')[0]]?.title || profile.personality_type}
                            </h3>
                            <p className="personality-desc">
                                {ARCHETYPES[profile.personality_type.split('-')[0]]?.description}
                            </p>
                        </div>

                        <div className="personality-bars">
                            <SimpleResultBar label="Mente" left="Estroverso" right="Introverso" val={profile.personality_mind} color="#4298B4" />
                            {/* Energy: Swap logic to match Intuitivo (Left) vs Concreto (Right) */}
                            <SimpleResultBar label="Energia" left="Intuitivo" right="Concreto" val={100 - (profile.personality_energy ?? 50)} color="#E4AE3A" />
                            <SimpleResultBar label="Natura" left="Razionale" right="Empatico" val={profile.personality_nature} color="#33A474" />
                            <SimpleResultBar label="Tattica" left="Organizzato" right="Spontaneo" val={profile.personality_tactics} color="#88619A" />
                        </div>

                        {(profile.personality_ai_analysis || localAiAnalysis) && (
                            <div className="personality-ai-analysis" style={{ marginTop: '20px', padding: '16px', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#a855f7' }}>
                                    <span style={{ fontSize: '1.2rem' }}>🧠</span>
                                    <h4 style={{ margin: 0, fontSize: '1rem' }}>Analisi Psicologica AI</h4>
                                </div>
                                <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'rgba(255,255,255,0.9)', whiteSpace: 'pre-wrap' }}>
                                    {localAiAnalysis || profile.personality_ai_analysis}
                                </p>
                            </div>
                        )}




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
        </div >
    );
};

/* --- EDIT FIELD COMPONENT --- */

interface EditFieldProps {
    label: string; value: string; onChange: (v: string) => void;
    maxLength?: number; multiline?: boolean; placeholder?: string;
}

const EditField = ({ label, value, onChange, maxLength, multiline, placeholder }: EditFieldProps) => (
    <div className="edit-field">
        <label className="edit-field-label">{label}</label>
        {multiline ? (
            <textarea className="input-field" value={value} onChange={e => onChange(e.target.value)} maxLength={maxLength} rows={3} placeholder={placeholder} />
        ) : (
            <input className="input-field" type="text" value={value} onChange={e => onChange(e.target.value)} maxLength={maxLength} placeholder={placeholder} />
        )}
    </div>
);

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
