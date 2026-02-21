import React, { useState, useRef } from 'react';
import type { Profile } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { compressImage } from '../utils/imageUtils';
import PersonalityQuiz from './PersonalityQuiz';
import * as nsfwjs from 'nsfwjs';
import './Registration.css';

let nsfwModelCache: nsfwjs.NSFWJS | null = null;

interface RegistrationProps {
    onComplete: (profile: Partial<Profile>) => void;
}

import { generateProfileSummary } from '../services/aiService';

const ZODIAC_SIGNS = [
    '♈ Ariete', '♉ Toro', '♊ Gemelli', '♋ Cancro',
    '♌ Leone', '♍ Vergine', '♎ Bilancia', '♏ Scorpione',
    '♐ Sagittario', '♑ Capricorno', '♒ Acquario', '♓ Pesci'
];

const Registration: React.FC<RegistrationProps> = ({ onComplete }) => {
    const { user, session, profile, isMockMode, signOut } = useAuth();
    const [step, setStep] = useState(1);
    const totalSteps = 7;
    const [saving, setSaving] = useState(false);
    const [tosAccepted, setTosAccepted] = useState(false);
    const [personalityType, setPersonalityType] = useState(profile?.personality_type || '');

    // Initialize with existing profile data if available (except photos)
    const [photos, setPhotos] = useState<string[]>(['', '', '']);
    const [bio, setBio] = useState(profile?.bio || '');
    const [hobbies, setHobbies] = useState(profile?.hobbies || '');
    const [music, setMusic] = useState(profile?.music || '');
    const [musicArtists, setMusicArtists] = useState(profile?.music_artists || '');
    const [youtube, setYoutube] = useState(profile?.youtube || '');
    const [youtubeChannels, setYoutubeChannels] = useState(profile?.youtube_channels || '');
    const [twitchWatches, setTwitchWatches] = useState(profile?.twitch_watches || '');
    const [twitchStreamers, setTwitchStreamers] = useState(profile?.twitch_streamers || '');
    const [zodiac, setZodiac] = useState(profile?.zodiac_sign || '');
    const [grenbaudIs, setGrenbaudIs] = useState(profile?.grenbaud_is || '');
    const [instagram, setInstagram] = useState(profile?.instagram || '');
    const [lookingFor, setLookingFor] = useState(profile?.looking_for || '');
    const [displayName, setDisplayName] = useState(profile?.display_name || '');
    const [gender, setGender] = useState(profile?.gender || '');
    const [freeTime, setFreeTime] = useState(profile?.free_time || '');
    const [age, setAge] = useState<string>(profile?.age ? String(profile.age) : '');
    const [city, setCity] = useState(profile?.city || '');
    const [questionDream, setQuestionDream] = useState(profile?.question_dream || '');
    const [questionWeekend, setQuestionWeekend] = useState(profile?.question_weekend || '');
    const [questionRedflag, setQuestionRedflag] = useState(profile?.question_redflag || '');
    const [personalityAnswers, setPersonalityAnswers] = useState<Record<number, number>>({});

    // City Autocomplete State
    const [citySuggestions, setCitySuggestions] = useState<{ name: string, lat: string, lon: string }[]>([]);
    const [isFetchingCities, setIsFetchingCities] = useState(false);
    const [showCityDropdown, setShowCityDropdown] = useState(false);
    const citySearchTimeoutInfo = useRef<NodeJS.Timeout | null>(null);

    const [statusMessage, setStatusMessage] = useState(''); // New status message for UI feedback

    const fileInputRef = useRef<HTMLInputElement>(null);

    const ageOptions = Array.from({ length: 82 }, (_, i) => i + 18); // 18 to 99

    const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setCity(val);

        if (val.length < 3) {
            setCitySuggestions([]);
            setShowCityDropdown(false);
            return;
        }

        setShowCityDropdown(true);
        setIsFetchingCities(true);

        if (citySearchTimeoutInfo.current) {
            clearTimeout(citySearchTimeoutInfo.current);
        }

        citySearchTimeoutInfo.current = setTimeout(async () => {
            try {
                // Search for cities in Italy using Nominatim (OpenStreetMap)
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&countrycodes=it&featureType=city,town,village&limit=5`);
                const data = await res.json();

                const suggestions = data.map((item: any) => ({
                    name: item.display_name.split(',')[0].trim() + (item.display_name.includes('Provincia') ? ` (${item.display_name.split(',')[1].trim()})` : ''),
                    lat: item.lat,
                    lon: item.lon
                }));

                // Deduplicate by name
                const uniqueSuggestions = suggestions.filter((v: any, i: number, a: any[]) => a.findIndex((t: any) => (t.name === v.name)) === i);

                setCitySuggestions(uniqueSuggestions);
            } catch (err) {
                console.error("City search failed", err);
            } finally {
                setIsFetchingCities(false);
            }
        }, 500); // 500ms debounce
    };

    const selectCity = (cityName: string) => {
        setCity(cityName);
        setShowCityDropdown(false);
        setCitySuggestions([]);
    };
    const [uploadingSlot, setUploadingSlot] = useState(-1);

    const handlePhotoClick = (index: number) => {
        if (isMockMode) {
            // Demo photos for mock mode
            const demoPhotos = [
                'https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=600&h=800&fit=crop',
                'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=600&h=800&fit=crop',
                'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=600&h=800&fit=crop',
            ];
            const newPhotos = [...photos];
            newPhotos[index] = demoPhotos[index] || demoPhotos[0];
            setPhotos(newPhotos);
        } else {
            setUploadingSlot(index);
            fileInputRef.current?.click();
        }
    };

    const [isUploading, setIsUploading] = useState(false);
    const [isCheckingImage, setIsCheckingImage] = useState(false);
    const [nsfwError, setNsfwError] = useState<string | null>(null);
    const [photoFiles, setPhotoFiles] = useState<(File | null)[]>([null, null, null]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        let file = e.target.files?.[0];
        if (!file || uploadingSlot < 0) return;

        setIsCheckingImage(true);
        setNsfwError(null);

        try {
            // Auto-compress BEFORE NSFW check to speed up both inference and upload
            if (file.type.match(/image.*/)) {
                console.log(`[Reg] Original file size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
                file = await compressImage(file, 1000, 1000, 0.7);
                console.log(`[Reg] Compressed file size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
            }

            // Check for NSFW content on the compressed image
            const imgUrl = URL.createObjectURL(file);
            const imgElement = new Image();
            imgElement.src = imgUrl;

            await new Promise((resolve, reject) => {
                imgElement.onload = resolve;
                imgElement.onerror = reject;
            });

            // Load model (cached) and classify
            if (!nsfwModelCache) {
                nsfwModelCache = await nsfwjs.load();
            }
            const predictions = await nsfwModelCache.classify(imgElement);
            URL.revokeObjectURL(imgUrl); // Clean up memory

            // Block if high probability of explicit content
            const isNsfw = predictions.some((p: any) =>
                (p.className === 'Porn' || p.className === 'Hentai' || p.className === 'Sexy') && p.probability > 0.65
            );

            if (isNsfw) {
                console.warn('NSFW content detected:', predictions);
                setNsfwError('⚠️ Immagine non appropriata rilevata. Riprova con un\'altra foto.');
                setIsCheckingImage(false);
                setUploadingSlot(-1);
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }

            setIsCheckingImage(false);
            setIsUploading(true);

            // Always use local preview URL for instant feedback
            const previewUrl = URL.createObjectURL(file);
            const newPhotos = [...photos];
            newPhotos[uploadingSlot] = previewUrl;
            setPhotos(newPhotos);

            // Store the file for later upload
            const newFiles = [...photoFiles];
            newFiles[uploadingSlot] = file;
            setPhotoFiles(newFiles);
        } catch (error) {
            console.error('Photo error:', error);
            alert('Errore nel caricamento della foto. Riprova.');
        } finally {
            setIsCheckingImage(false);
            setIsUploading(false);
            setUploadingSlot(-1);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const canProceed = () => {
        switch (step) {
            case 1: return tosAccepted;
            case 2: return displayName.trim().length > 0 && photos.some(p => p !== '') && gender !== '' && age !== '' && city.trim().length > 0;
            case 3: return bio.trim().length > 0 && freeTime.trim().length > 0;
            case 4: return music.trim().length > 0 || youtube.trim().length > 0;
            case 5: return true; // Questions are optional but encouraged
            case 6: return true; // Personality Quiz is optional
            case 7: return grenbaudIs.trim().length > 0 && zodiac !== '';
            default: return false;
        }
    };

    const handleNext = async () => {
        if (step < totalSteps) {
            setStep(step + 1);
        } else {
            setSaving(true);
            setStatusMessage('Caricamento foto...');

            if (!isMockMode && user && session) {
                const twitchId = user.id;
                const twitchUsername = user.user_metadata?.preferred_username || user.user_metadata?.full_name || user.email || '';
                const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

                // 1. Upload photos to Supabase Storage
                const uploadedPhotoUrls = [...photos];
                for (let i = 0; i < photoFiles.length; i++) {
                    const file = photoFiles[i];
                    if (!file) continue;

                    const ext = file.name.split('.').pop() || 'jpg';
                    const filePath = `${twitchId}/photo_${i + 1}.${ext}`;

                    console.log(`[UPLOAD] Uploading photo ${i + 1}:`, filePath);
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
                            const publicUrl = `${supabaseUrl}/storage/v1/object/public/photos/${filePath}`;
                            uploadedPhotoUrls[i] = publicUrl;
                            console.log(`[UPLOAD] Photo ${i + 1} OK:`, publicUrl);
                        } else {
                            const errText = await uploadRes.text();
                            console.error(`[UPLOAD] Photo ${i + 1} failed:`, uploadRes.status, errText);
                        }
                    } catch (err) {
                        console.error(`[UPLOAD] Photo ${i + 1} error:`, err);
                    }
                }

                // 1.5 Generate AI Summary
                setStatusMessage('Analisi AI in corso... (potrebbe richiedere qualche secondo) 🧠');
                let aiSummary = '';
                try {
                    console.log('[AI] Generating profile summary...');
                    const summaryData = {
                        display_name: displayName, age: parseInt(age) || undefined, city, bio, hobbies, music, music_artists: musicArtists,
                        youtube, youtube_channels: youtubeChannels, twitch_watches: twitchWatches,
                        twitch_streamers: twitchStreamers, personality_type: personalityType,
                        grenbaud_is: grenbaudIs, looking_for: lookingFor,
                        question_dream: questionDream, question_weekend: questionWeekend, question_redflag: questionRedflag,
                        personality_answers: personalityAnswers,
                        gender, zodiac_sign: zodiac, instagram
                    };
                    const summary = await generateProfileSummary(summaryData);
                    if (summary) {
                        aiSummary = summary;
                        console.log('[AI] Summary generated:', summary);
                    }
                } catch (e) {
                    console.error('[AI] Generation failed (non-blocking):', e);
                }

                setStatusMessage('Salvataggio profilo...');

                // 2. Save profile
                const profileData: Partial<Profile> = {
                    display_name: displayName,
                    photo_1: uploadedPhotoUrls[0] || '',
                    photo_2: uploadedPhotoUrls[1] || '',
                    photo_3: uploadedPhotoUrls[2] || '',
                    bio,
                    hobbies,
                    music,
                    music_artists: musicArtists,
                    youtube,
                    youtube_channels: youtubeChannels,
                    twitch_watches: twitchWatches,
                    twitch_streamers: twitchStreamers,
                    zodiac_sign: zodiac,
                    grenbaud_is: grenbaudIs,
                    instagram,
                    looking_for: lookingFor,
                    personality_type: personalityType,
                    gender,
                    age: parseInt(age) || undefined,
                    city,
                    free_time: freeTime,
                    question_dream: questionDream,
                    question_weekend: questionWeekend,
                    question_redflag: questionRedflag,
                    tos_accepted: true,
                    is_registered: true,
                    twitch_id: twitchId,
                    twitch_username: twitchUsername,
                    ai_summary: aiSummary,
                    personality_answers: personalityAnswers,
                };

                console.log('[SAVE] Saving profile...', twitchId);

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 20000);

                try {
                    // Check if profile exists
                    const checkRes = await fetch(`${supabaseUrl}/rest/v1/profiles?twitch_id=eq.${twitchId}&select=id`, {
                        headers: {
                            'apikey': supabaseKey,
                            'Authorization': `Bearer ${session.access_token}`,
                        }
                    });
                    const existingProfiles = await checkRes.json();
                    const exists = existingProfiles && existingProfiles.length > 0;

                    let res;
                    if (exists) {
                        res = await fetch(`${supabaseUrl}/rest/v1/profiles?twitch_id=eq.${twitchId}`, {
                            method: 'PATCH',
                            headers: {
                                'Content-Type': 'application/json',
                                'apikey': supabaseKey,
                                'Authorization': `Bearer ${session.access_token}`,
                                'Prefer': 'return=representation',
                            },
                            body: JSON.stringify(profileData),
                        });
                    } else {
                        res = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'apikey': supabaseKey,
                                'Authorization': `Bearer ${session.access_token}`,
                                'Prefer': 'return=representation',
                            },
                            body: JSON.stringify(profileData),
                        });
                    }

                    clearTimeout(timeoutId);
                    const text = await res.text();

                    if (!res.ok) throw new Error(`DB Error ${res.status}: ${text}`);

                    const savedData = JSON.parse(text);
                    const savedProfile = Array.isArray(savedData) ? savedData[0] : savedData;

                    console.log('[SAVE] Success:', savedProfile);
                    setSaving(false);
                    onComplete(savedProfile);

                } catch (err: any) {
                    console.error('[SAVE] Error:', err);
                    alert(`Errore di salvataggio: ${err.message}. Riprova.`);
                    setSaving(false);
                }
            } else {
                // Mock mode
                setSaving(false);
                onComplete({ display_name: displayName, is_registered: true } as any);
            }
        }
    };

    return (
        <div className="registration">
            {/* Progress bar */}
            <div className="reg-progress">
                <div className="reg-progress-bar">
                    <div
                        className="reg-progress-fill"
                        style={{ width: `${(step / totalSteps) * 100}%` }}
                    />
                </div>
                <span className="reg-progress-text">
                    {step} / {totalSteps}
                </span>
            </div>

            <div className="reg-content animate-fade-in-up" key={step}>
                {/* ===== Step 1: Regole & TOS ===== */}
                {step === 1 && (
                    <div className="tos-step">
                        <div className="tos-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        </div>
                        <h2>Baudr</h2>
                        <p className="reg-subtitle">Unisciti con rispetto alla community di GrenBaud</p>

                        <div className="tos-box">
                            <div className="tos-item tos-item--primary">
                                <strong>🤝 Trova persone simili a te</strong>
                                <p>Baudr nasce per creare connessioni reali e nuove amicizie. Vogliamo che sia un posto sano, non un posto "marcio".</p>
                            </div>
                            <div className="tos-item">
                                <strong>💜 Rispetto Assoluto</strong>
                                <p>Sii rispettoso sempre e con chiunque. Non sono ammessi insulti, molestie o discriminazioni di alcun tipo.</p>
                            </div>
                            <div className="tos-item">
                                <strong>🔞 Solo per Maggiorenni</strong>
                                <p>Confermando, dichiari di avere almeno 18 anni. L'accesso ai minori non è consentito.</p>
                            </div>
                            <div className="tos-item tos-item--danger">
                                <strong>⚠️ Moderazione e Tolleranza Zero</strong>
                                <p>
                                    <strong>Ogni comportamento fuori posto o segnalazione motivata porterà al</strong>
                                    <strong> ban istantaneo</strong> e, nei casi più gravi, alla <strong>segnalazione immediata alle autorità competenti</strong>.
                                </p>
                            </div>
                        </div>

                        <div className="tos-acceptance">
                            <label className="checkbox-container">
                                <input
                                    type="checkbox"
                                    checked={tosAccepted}
                                    onChange={(e) => setTosAccepted(e.target.checked)}
                                />
                                <span className="checkmark"></span>
                                <span className="checkbox-text">Dichiaro di essere maggiorenne e mi impegno a rispettare la community</span>
                            </label>
                        </div>
                    </div>
                )}

                {/* ===== Step 2: Foto + Nome ===== */}
                {step === 2 && (
                    <>
                        <h2>Le tue foto 📸</h2>
                        <p className="reg-subtitle">Carica almeno 1 foto (max 3)</p>
                        <div className="photo-grid">
                            {photos.map((photo, i) => (
                                <button
                                    key={i}
                                    className={`photo-slot ${photo ? 'photo-slot--filled' : ''}`}
                                    onClick={() => !isUploading && !isCheckingImage && handlePhotoClick(i)}
                                    disabled={isUploading || isCheckingImage}
                                >
                                    {(isUploading || isCheckingImage) && uploadingSlot === i ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <div className="spinner-small" style={{
                                                width: '20px',
                                                height: '20px',
                                                border: '2px solid rgba(255,255,255,0.3)',
                                                borderTop: '2px solid white',
                                                borderRadius: '50%',
                                                animation: 'spin 1s linear infinite',
                                                marginBottom: '8px'
                                            }} />
                                            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)' }}>
                                                {isCheckingImage ? 'Analisi...' : 'Caricamento...'}
                                            </span>
                                        </div>
                                    ) : photo ? (
                                        <img src={photo} alt={`Foto ${i + 1}`} />
                                    ) : (
                                        <div className="photo-slot-placeholder">
                                            <span className="photo-plus">+</span>
                                            <span className="photo-label">Foto {i + 1}</span>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>

                        {nsfwError && (
                            <div style={{ color: '#F25E62', fontSize: '0.9rem', textAlign: 'center', margin: '15px 0', padding: '10px', background: 'rgba(242, 94, 98, 0.1)', borderRadius: '8px', border: '1px solid rgba(242, 94, 98, 0.3)' }}>
                                {nsfwError}
                            </div>
                        )}

                        <div className="reg-field">
                            <label className="input-label">Come ti chiami?</label>
                            <input
                                className="input-field"
                                type="text"
                                placeholder="Il tuo nome..."
                                value={displayName}
                                onChange={e => setDisplayName(e.target.value)}
                                maxLength={30}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                            <div className="reg-field" style={{ flex: 1, marginBottom: 0 }}>
                                <label className="input-label">Età</label>
                                <select
                                    className="input-field select-field"
                                    value={age}
                                    onChange={e => setAge(e.target.value)}
                                >
                                    <option value="" disabled>Seleziona</option>
                                    {ageOptions.map(num => (
                                        <option key={num} value={num}>{num}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="reg-field" style={{ flex: 2, position: 'relative', marginBottom: 0 }}>
                                <label className="input-label">Di dove sei?</label>
                                <div className="city-input-container">
                                    <input
                                        className="input-field"
                                        type="text"
                                        placeholder="Città..."
                                        value={city}
                                        onChange={handleCityChange}
                                        onFocus={() => { if (citySuggestions.length > 0) setShowCityDropdown(true) }}
                                        onBlur={() => setTimeout(() => setShowCityDropdown(false), 200)} // delay to allow click on suggestion
                                        maxLength={50}
                                        autoComplete="off"
                                    />
                                    {isFetchingCities && <div className="spinner-small city-spinner"></div>}
                                </div>

                                {/* Autocomplete Dropdown */}
                                {showCityDropdown && (
                                    <div className="city-autocomplete-dropdown">
                                        {citySuggestions.length > 0 ? (
                                            citySuggestions.map((s, idx) => (
                                                <div
                                                    key={idx}
                                                    className="city-suggestion-item"
                                                    onClick={() => selectCity(s.name)}
                                                >
                                                    📍 {s.name}
                                                </div>
                                            ))
                                        ) : (
                                            !isFetchingCities && city.length >= 3 && (
                                                <div className="city-suggestion-empty">Nessuna città trovata in Italia</div>
                                            )
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="reg-field" style={{ marginTop: '20px' }}>
                            <label className="input-label">Genere</label>
                            <div className="gender-options" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {['Maschio', 'Femmina', 'Preferisco non specificarlo'].map(opt => (
                                    <button
                                        key={opt}
                                        className={`btn-option ${gender === opt ? 'btn-option--active' : ''}`}
                                        onClick={() => setGender(opt)}
                                        style={{
                                            flex: 1,
                                            padding: '0.75rem',
                                            borderRadius: '12px',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            background: gender === opt ? 'linear-gradient(135deg, #6e00ff 0%, #a64aff 100%)' : 'rgba(20, 20, 20, 0.6)',
                                            color: 'white',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* ===== Step 3: Bio + Hobby ===== */}
                {step === 3 && (
                    <>
                        <h2>Parlaci di te</h2>
                        <div className="reg-info-box" style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem' }}>
                            <p><strong>⚠️  IMPORTANTE:</strong> Rispondi come se stessi parlando a voce! Scrivi risposte lunghe e dettagliate.</p>
                            <p style={{ marginTop: '4px', opacity: 0.8 }}>L'AI userà queste info per scrivere il tuo profilo e analizzare la tua compatibilità, quindi più scrivi meglio è! 🗣️</p>
                        </div>
                        <p className="reg-subtitle">Fai sapere chi sei alla community!</p>
                        <div className="reg-field">
                            <label className="input-label">Bio</label>
                            <textarea
                                className="input-field"
                                placeholder="Scrivi qualcosa su di te..."
                                value={bio}
                                onChange={e => setBio(e.target.value)}
                                maxLength={300}
                                rows={4}
                            />
                            <span className="char-count">{bio.length}/300</span>
                        </div>
                        <div className="reg-field">
                            <label className="input-label">Cosa fai nel tempo libero?</label>
                            <textarea
                                className="input-field"
                                placeholder="Raccontaci come passi le tue giornate..."
                                value={freeTime}
                                onChange={e => setFreeTime(e.target.value)}
                                maxLength={300}
                                rows={3}
                            />
                        </div>
                        <div className="reg-field">
                            <label className="input-label">Hobby e Passioni</label>
                            <input
                                className="input-field"
                                type="text"
                                placeholder="Gaming, Palestra, Cucina..."
                                value={hobbies}
                                onChange={e => setHobbies(e.target.value)}
                                maxLength={150}
                            />
                        </div>
                    </>
                )}

                {/* ===== Step 4: Gusti ===== */}
                {step === 4 && (
                    <>
                        <h2>I tuoi gusti 🎵📺</h2>
                        <p className="reg-subtitle">Raccontaci cosa ti piace!</p>

                        {/* MUSICA */}
                        <div className="reg-section-divider">
                            <span className="divider-icon">🎵</span> Musica
                        </div>
                        <div className="reg-field">
                            <label className="input-label">Generi preferiti</label>
                            <input
                                className="input-field"
                                type="text"
                                placeholder="Pop, Rock, Rap..."
                                value={music}
                                onChange={e => setMusic(e.target.value)}
                                maxLength={150}
                            />
                        </div>
                        <div className="reg-field">
                            <label className="input-label">Artisti/Band preferiti</label>
                            <input
                                className="input-field"
                                type="text"
                                placeholder="Chi ascolti di più?"
                                value={musicArtists}
                                onChange={e => setMusicArtists(e.target.value)}
                                maxLength={150}
                            />
                        </div>

                        {/* YOUTUBE */}
                        <div className="reg-section-divider" style={{ marginTop: '24px' }}>
                            <span className="divider-icon">▶️</span> YouTube
                        </div>
                        <div className="reg-field">
                            <label className="input-label">Cosa guardi su YouTube?</label>
                            <input
                                className="input-field"
                                type="text"
                                placeholder="Gameplay, Vlog, Tech..."
                                value={youtube}
                                onChange={e => setYoutube(e.target.value)}
                                maxLength={150}
                            />
                        </div>
                        <div className="reg-field">
                            <label className="input-label">Youtuber preferiti</label>
                            <input
                                className="input-field"
                                type="text"
                                placeholder="Canali che segui..."
                                value={youtubeChannels}
                                onChange={e => setYoutubeChannels(e.target.value)}
                                maxLength={150}
                            />
                        </div>

                        {/* TWITCH */}
                        <div className="reg-section-divider" style={{ marginTop: '24px' }}>
                            <span className="divider-icon">💜</span> Twitch
                        </div>
                        <div className="reg-field">
                            <label className="input-label">Cosa guardi su Twitch?</label>
                            <input
                                className="input-field"
                                type="text"
                                placeholder="Just Chatting, Giochi..."
                                value={twitchWatches}
                                onChange={e => setTwitchWatches(e.target.value)}
                                maxLength={150}
                            />
                        </div>
                        <div className="reg-field">
                            <label className="input-label">Streamer preferiti</label>
                            <input
                                className="input-field"
                                type="text"
                                placeholder="Chi segui oltre a GrenBaud?"
                                value={twitchStreamers}
                                onChange={e => setTwitchStreamers(e.target.value)}
                                maxLength={150}
                            />
                        </div>
                    </>
                )}

                {/* ===== Step 5: Domande Flash (Open Questions) ===== */}
                {step === 5 && (
                    <>
                        <h2>Domande Flash ⚡</h2>
                        <p className="reg-subtitle">Rispondi di pancia! L'AI userà queste info.</p>

                        <div className="reg-field">
                            <label className="input-label">Qual è il tuo sogno nel cassetto? 🌟</label>
                            <textarea
                                className="input-field"
                                placeholder="Diventare streamer, viaggiare su Marte..."
                                value={questionDream}
                                onChange={e => setQuestionDream(e.target.value)}
                                maxLength={200}
                                rows={2}
                            />
                        </div>

                        <div className="reg-field">
                            <label className="input-label">Il tuo weekend ideale (o tipico) 🍕🎉</label>
                            <textarea
                                className="input-field"
                                placeholder="Club fino all'alba o serie TV e copertina?"
                                value={questionWeekend}
                                onChange={e => setQuestionWeekend(e.target.value)}
                                maxLength={200}
                                rows={2}
                            />
                        </div>

                        <div className="reg-field">
                            <label className="input-label">Una tua Red Flag 🚩 (Sii onesto!)</label>
                            <input
                                className="input-field"
                                type="text"
                                placeholder="Sono troppo geloso/a, arrivo sempre in ritardo..."
                                value={questionRedflag}
                                onChange={e => setQuestionRedflag(e.target.value)}
                                maxLength={100}
                            />
                        </div>
                    </>
                )}

                {/* ===== Step 6: Personality Quiz ===== */}
                {step === 6 && (
                    <PersonalityQuiz
                        onComplete={(type, _, answers) => {
                            setPersonalityType(type);
                            setPersonalityAnswers(answers);
                            setStep(7);
                        }}
                        onSkip={() => setStep(7)}
                    />
                )}

                {/* ===== Step 7: GrenBaud + Zodiaco ===== */}
                {step === 7 && (
                    <>
                        <h2>Ultime cose</h2>
                        <p className="reg-subtitle">Quasi fatto!</p>
                        <div className="reg-field">
                            <label className="input-label">GrenBaud è un...</label>
                            <textarea
                                className="input-field"
                                placeholder="Completa la frase a modo tuo!"
                                value={grenbaudIs}
                                onChange={e => setGrenbaudIs(e.target.value)}
                                maxLength={200}
                                rows={3}
                            />
                        </div>
                        <div className="reg-field">
                            <label className="input-label">Segno Zodiacale</label>
                            <div className="zodiac-grid">
                                {ZODIAC_SIGNS.map(sign => (
                                    <button
                                        key={sign}
                                        className={`zodiac-btn ${zodiac === sign ? 'zodiac-btn--active' : ''}`}
                                        onClick={() => setZodiac(sign)}
                                    >
                                        {sign}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="reg-field">
                            <label className="input-label">Instagram (Opzionale)</label>
                            <input
                                className="input-field"
                                type="text"
                                placeholder="@username"
                                value={instagram}
                                onChange={e => setInstagram(e.target.value)}
                                maxLength={50}
                            />
                        </div>

                        <div className="reg-field" style={{ marginTop: '24px' }}>
                            <label className="input-label">Cosa ti porta qui?</label>
                            <div className="looking-for-grid">
                                {['Nuove Amicizie', 'Compagni di Giochi', 'Due Chiacchiere'].map(option => (
                                    <button
                                        key={option}
                                        className={`looking-for-btn ${lookingFor === option ? 'looking-for-btn--active' : ''}`}
                                        onClick={() => setLookingFor(option)}
                                    >
                                        <span className="looking-for-icon">
                                            {option === 'Nuove Amicizie' && (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                                </svg>
                                            )}
                                            {option === 'Compagni di Giochi' && (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                                </svg>
                                            )}
                                            {option === 'Due Chiacchiere' && (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                                </svg>
                                            )}
                                        </span>
                                        <span>{option}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Navigation */}
            <div className="reg-nav">
                {step > 1 && step !== 6 && (
                    <button
                        className="btn btn-secondary"
                        onClick={() => setStep(step - 1)}
                    >
                        ← Indietro
                    </button>
                )}
                {step !== 6 && (
                    <button
                        className={`btn btn-primary ${!canProceed() || saving ? 'btn-disabled' : ''}`}
                        onClick={handleNext}
                        disabled={!canProceed() || saving}
                    >
                        {saving ? (statusMessage || 'Salvataggio...') : step === totalSteps ? 'Completa ✨' : 'Avanti →'}
                    </button>
                )}
            </div>

            {/* Troubleshooting Actions */}
            <div className="reg-footer-actions" style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center', opacity: 0.7 }}>
                <button
                    onClick={() => signOut()}
                    className="btn-text"
                    style={{ color: '#ff4444', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                    Esci
                </button>
                <button
                    onClick={async () => {
                        if (!confirm('Sei sicuro? Questo cancellerà tutti i dati inseriti e ti farà ricominciare da zero.')) return;

                        // Hard reset via raw fetch
                        if (user && session) {
                            try {
                                const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                                const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
                                await fetch(`${supabaseUrl}/rest/v1/profiles?twitch_id=eq.${user.id}`, {
                                    method: 'PATCH',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'apikey': supabaseKey,
                                        'Authorization': `Bearer ${session.access_token}`,
                                    },
                                    body: JSON.stringify({
                                        is_registered: false,
                                        photo_1: '', photo_2: '', photo_3: '',
                                        bio: '', hobbies: '', music: '', youtube: '',
                                        twitch_watches: '', zodiac_sign: '', grenbaud_is: '', instagram: '',
                                        display_name: '' // Clear everything
                                    }),
                                });
                                window.location.reload();
                            } catch (e) { console.error(e); alert('Errore nel reset. Riprova.'); }
                        }
                    }}
                    className="btn-text"
                    style={{ color: '#ff4444', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                    Resetta Account
                </button>
                <button
                    onClick={async () => {
                        if (user && session) {
                            try {
                                console.log('[TEST DB] Fetching...');
                                const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                                const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
                                const res = await fetch(`${supabaseUrl}/rest/v1/profiles?select=*&limit=5`, {
                                    headers: {
                                        'apikey': supabaseKey,
                                        'Authorization': `Bearer ${session.access_token}`,
                                    },
                                });
                                const text = await res.text();
                                console.log('[TEST DB] Status:', res.status, text);
                                if (res.ok) {
                                    const data = JSON.parse(text);
                                    alert(`Trovati ${data.length} profili (incluso te).\nControlla la console per i dettagli.`);
                                } else {
                                    alert(`Errore ${res.status}: ${text}`);
                                }
                            } catch (e) { console.error(e); alert('Errore test DB'); }
                        }
                    }}
                    className="btn-text"
                    style={{ color: '#888', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', marginLeft: '10px' }}
                >
                    Test DB
                </button>
            </div>

            {/* Hidden file input for photo uploads */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />
        </div>
    );
};

export default Registration;
