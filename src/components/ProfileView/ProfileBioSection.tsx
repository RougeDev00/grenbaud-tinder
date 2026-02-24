import React from 'react';
import type { Profile } from '../../types';

interface SectionProps {
    iconKey: string;
    label: string;
    value: React.ReactNode;
}

const getIcon = (key: string) => {
    switch (key) {
        case 'bio': return '✍️';
        case 'lookingFor': return '🎯';
        case 'hobbies': return '🎨';
        case 'music': return '🎵';
        case 'youtube': return '▶️';
        case 'twitch': return '🟣';
        case 'instagram': return '📸';
        case 'zodiac': return '✨';
        case 'job': return '💼';
        case 'education': return '🎓';
        case 'gender': return '👤';
        case 'age': return '🎂';
        case 'city': return '📍';
        case 'dream': return '💭';
        case 'weekend': return '🌅';
        case 'redFlag': return '🚩';
        case 'greenFlag': return '✅';
        case 'dealbreaker': return '❌';
        case 'secret': return '🤫';
        case 'freeTime': return '🎮';
        case 'grenbaud': return '🤔';
        case 'personality': return '🧠';
        default: return '📌';
    }
};

const Section: React.FC<SectionProps> = ({ iconKey, label, value }) => (
    <div className="profile-section">
        <div className="profile-section-header">
            <span className="profile-section-icon">{getIcon(iconKey)}</span>
            <span className="profile-section-label">{label}</span>
        </div>
        <p className="profile-section-value">{value}</p>
    </div>
);

interface ProfileBioSectionProps {
    profile: Profile;
}

export const ProfileBioSection: React.FC<ProfileBioSectionProps> = ({
    profile
}) => {
    return (
        <div className="profile-view-sections">
            {(profile.bio || profile.looking_for) && (
                <>
                    <div className="profile-category-header">Chi Sono</div>
                    {profile.bio && <Section iconKey="bio" label="Bio" value={profile.bio} />}
                    {profile.looking_for && <Section iconKey="lookingFor" label="Cosa mi porta qui" value={profile.looking_for} />}
                </>
            )}

            {(profile.twitch_watches || profile.twitch_streamers || profile.youtube || profile.youtube_channels || profile.grenbaud_is) && (
                <>
                    <div className="profile-category-header mt-4">Piattaforme</div>
                    {profile.twitch_watches && <Section iconKey="twitch" label="Cosa guardi su Twitch" value={profile.twitch_watches} />}
                    {profile.twitch_streamers && <Section iconKey="twitch" label="Streamer Preferiti" value={profile.twitch_streamers} />}
                    {profile.youtube && <Section iconKey="youtube" label="Cosa guardi su YouTube" value={profile.youtube} />}
                    {profile.youtube_channels && <Section iconKey="youtube" label="Youtuber Preferiti" value={profile.youtube_channels} />}
                    {profile.grenbaud_is && <Section iconKey="grenbaud" label="GrenBaud è un..." value={profile.grenbaud_is} />}
                </>
            )}

            {(profile.hobbies || profile.free_time || profile.music || profile.music_artists) && (
                <>
                    <div className="profile-category-header mt-4">Passioni & Lifestyle</div>
                    {profile.free_time && <Section iconKey="freeTime" label="Tempo Libero" value={profile.free_time} />}
                    {profile.hobbies && <Section iconKey="hobbies" label="Hobby & Passioni" value={profile.hobbies} />}
                    {profile.music && <Section iconKey="music" label="Generi Musicali" value={profile.music} />}
                    {profile.music_artists && <Section iconKey="music" label="Artisti Preferiti" value={profile.music_artists} />}
                </>
            )}

            {(profile.question_dream || profile.question_weekend || profile.question_redflag) && (
                <>
                    <div className="profile-category-header mt-4">Q&A</div>
                    {profile.question_dream && <Section iconKey="dream" label="Sogno nel cassetto" value={profile.question_dream} />}
                    {profile.question_weekend && <Section iconKey="weekend" label="Weekend ideale" value={profile.question_weekend} />}
                    {profile.question_redflag && <Section iconKey="redFlag" label="Red Flag" value={profile.question_redflag} />}
                </>
            )}

            {profile.instagram && (
                <>
                    <div className="profile-category-header mt-4">Social</div>
                    <Section iconKey="instagram" label="Instagram" value={profile.instagram} />
                </>
            )}
        </div>
    );
};
