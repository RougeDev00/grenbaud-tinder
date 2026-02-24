import type { Profile } from '../types';

// Mock profiles per testare l'app senza Supabase
export const MOCK_PROFILES: Profile[] = [
    {
        id: '1',
        twitch_id: 'tw_001',
        twitch_username: 'luna_pixel',
        display_name: 'Luna',
        avatar_url: '',
        bio: 'Gamer incallita e amante dei gatti. Se non sto giocando, sto probabilmente guardando stream. 🎮🐱',
        hobbies: 'Gaming, Disegno digitale, Cosplay',
        music: 'Lo-fi, J-Pop, Elettronica',
        music_artists: 'Yoasobi, Eve, Lofi Girl',
        youtube: 'Kurzgesagt, Dario Moccia, Breaking Italy',
        youtube_channels: 'Breaking Italy, Dario Moccia Archive',
        twitch_watches: 'GrenBaud, Raziel, Bertra',
        twitch_streamers: 'GrenBaud, Raziel',
        grenbaud_is: 'il mio streamer preferito, punto.',
        instagram: '@luna_pixel',
        looking_for: 'Cerco l\'amore',
        gender: 'Femmina',
        free_time: 'Disegno mentre ascolto podcast crime',
        zodiac_sign: '♒ Acquario',
        photo_1: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=800&fit=crop',
        photo_2: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop',
        photo_3: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop',
        is_registered: true,
        created_at: '2026-01-15',
    },
    {
        id: '2',
        twitch_id: 'tw_002',
        twitch_username: 'marco_plays',
        display_name: 'Marco',
        avatar_url: '',
        bio: 'Streamer wannabe, sub da 24 mesi. Milano city 🏙️ Cerco qualcunə con cui guardare gli stream la sera.',
        hobbies: 'Palestra, Gaming, Cucina',
        music: 'Rap italiano, Trap, Indie',
        music_artists: 'Marracash, Guè, Blanco',
        youtube: 'Marcello Ascani, Slimdogs, Cane Secco',
        youtube_channels: 'Slimdogs, Marcello Ascani',
        twitch_watches: 'GrenBaud, Pow3r, ZanoXVII',
        twitch_streamers: 'ZanoXVII, Pow3r',
        grenbaud_is: 'una leggenda vivente, change my mind',
        instagram: '@marco_plays',
        looking_for: 'Entrambi',
        gender: 'Maschio',
        free_time: 'Vado in palestra e poi streammo',
        zodiac_sign: '♌ Leone',
        photo_1: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=800&fit=crop',
        photo_2: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop',
        photo_3: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop',
        is_registered: true,
        created_at: '2026-01-20',
    },
    // ... keep existing ones or remove for brevity if generator is good
];

export const CURRENT_MOCK_USER: Profile = {
    id: 'current',
    twitch_id: 'tw_current',
    twitch_username: 'test_user',
    display_name: 'Test User',
    avatar_url: '',
    bio: '',
    hobbies: '',
    music: '',
    music_artists: '',
    youtube: '',
    youtube_channels: '',
    twitch_watches: '',
    twitch_streamers: '',
    grenbaud_is: '',
    instagram: '',
    looking_for: '',
    zodiac_sign: '',
    photo_1: '',
    photo_2: '',
    photo_3: '',
    is_registered: false,
    created_at: new Date().toISOString(),
};

// --- Generator Logic ---

const NAMES_M = ['Alessandro', 'Luca', 'Marco', 'Andrea', 'Davide', 'Matteo', 'Francesco', 'Lorenzo', 'Riccardo', 'Federico', 'Simone', 'Giuseppe', 'Antonio', 'Giovanni', 'Roberto', 'Stefano', 'Fabio', 'Paolo', 'Daniele', 'Michele'];
const NAMES_F = ['Sofia', 'Giulia', 'Aurora', 'Alice', 'Ginevra', 'Emma', 'Giorgia', 'Greta', 'Beatrice', 'Anna', 'Martina', 'Sara', 'Chiara', 'Ludovica', 'Vittoria', 'Noemi', 'Rebecca', 'Francesca', 'Elisa', 'Alessia'];

const BIOS = [
    'Amo i viaggi e la fotografia 📸', 'Gamer accanito 🎮', 'In cerca di nuove amicizie ✨', 'Pizza, Netflix e relax 🍕',
    'Studio ingegneria ma vorrei fare lo streamer', 'Ascolto musica 24/7 🎧', 'Palestrato inside 💪', 'Appassionato di cucina 🍝',
    'Leggo troppi libri 📚', 'Viaggio solo con lo zaino in spalla', 'Ballare è la mia vita 💃', ' Nerd orgoglioso 🤓',
    'Amante degli animali 🐶', 'Caffè dipendente ☕', 'Fotografo amatoriale', 'Scrivimi se ti piace il sushi 🍣'
];

const HOBBIES_LIST = ['Gaming', 'Palestra', 'Cucina', 'Viaggi', 'Serie TV', 'Musica', 'Lettura', 'Calcio', 'Basket', 'Nuoto', 'Arte', 'Fotografia', 'Moda', 'Tecnologia', 'Anime', 'Manga'];
const LOOKING_FOR_OPTIONS = ['Cerco l\'amore', 'Cerco amicizia', 'Entrambi'];
const ZODIAC_SIGNS = ['♈ Ariete', '♉ Toro', '♊ Gemelli', '♋ Cancro', '♌ Leone', '♍ Vergine', '♎ Bilancia', '♏ Scorpione', '♐ Sagittario', '♑ Capricorno', '♒ Acquario', '♓ Pesci'];
const MBTI_TYPES = ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'];

const PHOTOS_M = [
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=800&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&h=800&fit=crop',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=800&fit=crop',
    'https://images.unsplash.com/photo-1480429370139-e0132c086e2a?w=600&h=800&fit=crop',
    'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=600&h=800&fit=crop',
    'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=600&h=800&fit=crop',
    'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=600&h=800&fit=crop',
    'https://images.unsplash.com/photo-1513956589380-bad618211cf7?w=600&h=800&fit=crop'
];

const PHOTOS_F = [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=800&fit=crop',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop',
    'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=800&fit=crop',
    'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&h=800&fit=crop',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop',
    'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=800&fit=crop',
    'https://images.unsplash.com/photo-1485206412256-701b8b4072a3?w=600&h=800&fit=crop',
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&h=800&fit=crop'
];

const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const pickMultiple = <T>(arr: T[], count: number): T[] => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};

export const generateMockProfiles = (count: number): Profile[] => {
    const profiles: Profile[] = [];
    for (let i = 0; i < count; i++) {
        const isFemale = Math.random() > 0.5;
        const name = isFemale ? pickRandom(NAMES_F) : pickRandom(NAMES_M);
        const gender = isFemale ? 'Femmina' : 'Maschio'; // Mostly binary for mock data visual variety
        const photoPool = isFemale ? PHOTOS_F : PHOTOS_M;

        profiles.push({
            id: `mock_${i}`,
            twitch_id: `twitch_${i}`,
            twitch_username: `${name.toLowerCase()}_${Math.floor(Math.random() * 1000)}`,
            display_name: name,
            avatar_url: '',
            bio: pickRandom(BIOS),
            hobbies: pickMultiple(HOBBIES_LIST, 3).join(', '),
            music: 'Pop, Rock',
            music_artists: 'Coldplay, Imagine Dragons',
            youtube: 'MrBeast',
            youtube_channels: 'MrBeast, PewDiePie',
            twitch_watches: 'GrenBaud',
            twitch_streamers: 'GrenBaud, Blur',
            grenbaud_is: 'Top streamer',
            instagram: `@${name.toLowerCase()}`,
            looking_for: pickRandom(LOOKING_FOR_OPTIONS),
            gender: gender,
            age: Math.floor(Math.random() * (35 - 18 + 1)) + 18,
            free_time: 'Streaming e serie TV',
            zodiac_sign: pickRandom(ZODIAC_SIGNS),
            photo_1: pickRandom(photoPool),
            photo_2: pickRandom(photoPool),
            photo_3: pickRandom(photoPool),
            personality_type: pickRandom(MBTI_TYPES),
            is_registered: true,
            created_at: new Date().toISOString(),
        });
    }
    return profiles;
};
