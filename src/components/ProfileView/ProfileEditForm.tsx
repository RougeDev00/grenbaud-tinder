import React from 'react';

export interface EditFieldProps {
    label: string;
    value: string;
    onChange: (v: string) => void;
    maxLength?: number;
    multiline?: boolean;
    placeholder?: string;
}

export const EditField = ({ label, value, onChange, maxLength, multiline, placeholder }: EditFieldProps) => (
    <div className="edit-field">
        <label className="edit-field-label">{label}</label>
        {multiline ? (
            <textarea className="input-field" value={value} onChange={e => onChange(e.target.value)} maxLength={maxLength} rows={3} placeholder={placeholder} />
        ) : (
            <input className="input-field" type="text" value={value} onChange={e => onChange(e.target.value)} maxLength={maxLength} placeholder={placeholder} />
        )}
    </div>
);

export interface ProfileEditFormProps {
    displayName: string; setDisplayName: (val: string) => void;
    age: string; setAge: (val: string) => void;
    city: string; setCity: (val: string) => void;
    bio: string; setBio: (val: string) => void;
    hobbies: string; setHobbies: (val: string) => void;
    music: string; setMusic: (val: string) => void;
    musicArtists: string; setMusicArtists: (val: string) => void;
    youtube: string; setYoutube: (val: string) => void;
    youtubeChannels: string; setYoutubeChannels: (val: string) => void;
    twitchWatches: string; setTwitchWatches: (val: string) => void;
    twitchStreamers: string; setTwitchStreamers: (val: string) => void;
    grenbaudIs: string; setGrenbaudIs: (val: string) => void;
    freeTime: string; setFreeTime: (val: string) => void;
    questionDream: string; setQuestionDream: (val: string) => void;
    questionWeekend: string; setQuestionWeekend: (val: string) => void;
    questionRedflag: string; setQuestionRedflag: (val: string) => void;
    instagram: string; setInstagram: (val: string) => void;
    gender: string; setGender: (val: string) => void;
    lookingFor: string; setLookingFor: (val: string) => void;
    zodiac: string; setZodiac: (val: string) => void;
}

export const ProfileEditForm: React.FC<ProfileEditFormProps> = ({
    displayName, setDisplayName,
    age, setAge,
    city, setCity,
    bio, setBio,
    hobbies, setHobbies,
    music, setMusic,
    musicArtists, setMusicArtists,
    youtube, setYoutube,
    youtubeChannels, setYoutubeChannels,
    twitchWatches, setTwitchWatches,
    twitchStreamers, setTwitchStreamers,
    grenbaudIs, setGrenbaudIs,
    freeTime, setFreeTime,
    questionDream, setQuestionDream,
    questionWeekend, setQuestionWeekend,
    questionRedflag, setQuestionRedflag,
    instagram, setInstagram,
    gender, setGender,
    lookingFor, setLookingFor,
    zodiac, setZodiac
}) => {
    const zodiacOptions = [
        '♈ Ariete', '♉ Toro', '♊ Gemelli', '♋ Cancro',
        '♌ Leone', '♍ Vergine', '♎ Bilancia', '♏ Scorpione',
        '♐ Sagittario', '♑ Capricorno', '♒ Acquario', '♓ Pesci'
    ];

    return (
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
    );
};
