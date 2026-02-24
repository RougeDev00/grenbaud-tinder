import type { Profile } from '../types';

const ZODIAC_ELEMENTS: Record<string, string> = {
    '♈ Ariete': 'Fire', '♌ Leone': 'Fire', '♐ Sagittario': 'Fire',
    '♉ Toro': 'Earth', '♍ Vergine': 'Earth', '♑ Capricorno': 'Earth',
    '♊ Gemelli': 'Air', '♎ Bilancia': 'Air', '♒ Acquario': 'Air',
    '♋ Cancro': 'Water', '♏ Scorpione': 'Water', '♓ Pesci': 'Water'
};

const ELEMENT_COMPATIBILITY: Record<string, string[]> = {
    'Fire': ['Fire', 'Air'],
    'Air': ['Air', 'Fire'],
    'Earth': ['Earth', 'Water'],
    'Water': ['Water', 'Earth']
};

/** Simple hash to create a deterministic "chemistry" offset per user pair */
const pairHash = (id1: string, id2: string): number => {
    const sorted = [id1, id2].sort();
    const str = sorted.join('-');
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    }
    return h;
};

/**
 * Calculates a compatibility score between 15 and 88.
 * Designed to produce varied results across different user pairs.
 */
export const calculateCompatibility = (u1: Profile, u2: Profile): number => {
    let score = 18; // Lower base

    // 0. Deterministic "chemistry" factor: +/- 8 based on user pair
    //    This ensures that even users with similar profiles get different scores
    const hash = pairHash(u1.id || '', u2.id || '');
    const chemistryOffset = ((hash % 17) - 8); // Range: -8 to +8
    score += chemistryOffset;

    // 1. Zodiac Compatibility (Max +7, Min -5)
    if (u1.zodiac_sign && u2.zodiac_sign) {
        const e1 = ZODIAC_ELEMENTS[u1.zodiac_sign];
        const e2 = ZODIAC_ELEMENTS[u2.zodiac_sign];
        if (e1 && e2) {
            if (e1 === e2) score += 7;
            else if (ELEMENT_COMPATIBILITY[e1]?.includes(e2)) score += 3;
            else score -= 5;
        }
    }

    // 2. Personality Compatibility (Max +30, continuous curve)
    const dimensions = [
        { d1: u1.personality_mind, d2: u2.personality_mind },
        { d1: u1.personality_energy, d2: u2.personality_energy },
        { d1: u1.personality_nature, d2: u2.personality_nature },
        { d1: u1.personality_tactics, d2: u2.personality_tactics }
    ];

    let personalityScore = 0;
    let dimensionCount = 0;

    dimensions.forEach(d => {
        if (d.d1 !== undefined && d.d2 !== undefined) {
            const diff = Math.abs(d.d1 - d.d2);
            // Continuous scoring: closer = better, further = worse
            // diff 0  → +8,  diff 25 → +4,  diff 50 → 0,  diff 75 → -4,  diff 100 → -6
            const dimScore = 8 - (diff / 6.25);
            personalityScore += dimScore;
            dimensionCount++;
        }
    });

    if (dimensionCount > 0) {
        // Scale by how many dimensions we actually have data for
        score += Math.round(personalityScore * (dimensionCount / 4));
    }

    // 3. Age Penalty (Max -15)
    if (u1.age && u2.age) {
        const ageDiff = Math.abs(u1.age - u2.age);
        if (ageDiff > 3) {
            score -= Math.min((ageDiff - 3) * 2, 15);
        }
    }

    // 4. Interests Overlap (Smarter Category Matching, Max 28)
    const STOP_WORDS = new Set([
        'con', 'per', 'che', 'non', 'una', 'uno', 'gli', 'della', 'sono', 'alla', 'nel', 'sul', 'dei', 'dal', 'del', 'come', 'più',
        'amo', 'mi', 'piace', 'fare', 'vedere', 'guardare', 'ascolto', 'tutto', 'molto', 'poco', 'sempre', 'mai', 'quando',
        'streamer', 'twitch', 'youtube', 'video', 'live', 'canale', 'fare', 'giocare', 'ascoltare', 'musica', 'preferito', 'preferiti',
        'amo', 'odio', 'adoro', 'tutti', 'tutte', 'cose', 'cosa', 'vita', 'il', 'lo', 'la', 'i', 'le', 'un',
        'anche', 'solo', 'ma', 'se', 'o', 'e', 'ed', 'ad', 'al', 'allo', 'ai', 'agli', 'di', 'a', 'da', 'in', 'su', 'tra', 'fra',
        'essere', 'avere', 'mio', 'tuo', 'suo', 'nostro', 'vostro', 'loro', 'questo', 'quello', 'qui', 'lì', 'qua', 'là',
        'sopra', 'sotto', 'dentro', 'fuori', 'prima', 'dopo', 'ora', 'oggi', 'ieri', 'domani', 'sempre', 'spesso', 'quasi',
        'cercare', 'trovare', 'amici', 'amicizia', 'amore', 'ragazzo', 'ragazza', 'persone', 'qualcuno', 'qualcuna'
    ]);

    const getWords = (s: string | undefined) =>
        s?.toLowerCase().split(/[,\s.?!;:"'()]+/).map(w => w.trim()).filter(w => w.length > 2 && !STOP_WORDS.has(w)) || [];

    const c1 = {
        streaming: [...getWords(u1.twitch_watches), ...getWords(u1.twitch_streamers), ...getWords(u1.youtube), ...getWords(u1.youtube_channels), ...getWords(u1.grenbaud_is)],
        music: [...getWords(u1.music), ...getWords(u1.music_artists)],
        hobbies: [...getWords(u1.hobbies), ...getWords(u1.free_time), ...getWords(u1.bio)]
    };

    const c2 = {
        streaming: [...getWords(u2.twitch_watches), ...getWords(u2.twitch_streamers), ...getWords(u2.youtube), ...getWords(u2.youtube_channels), ...getWords(u2.grenbaud_is)],
        music: [...getWords(u2.music), ...getWords(u2.music_artists)],
        hobbies: [...getWords(u2.hobbies), ...getWords(u2.free_time), ...getWords(u2.bio)]
    };

    let totalMatches = 0;

    const countMatches = (arr1: string[], arr2: string[]) => {
        const intersection = arr1.filter(item => arr2.includes(item));
        return Array.from(new Set(intersection)).length;
    };

    totalMatches += countMatches(c1.streaming, c2.streaming);
    totalMatches += countMatches(c1.music, c2.music);
    totalMatches += countMatches(c1.hobbies, c2.hobbies);

    // Diminishing returns: 1st match = +14, 2nd = +7, 3rd = +4, etc.
    if (totalMatches > 0) {
        let interestScore = 0;
        let points = 14;
        for (let i = 0; i < totalMatches; i++) {
            interestScore += points;
            points = Math.floor(points / 2);
        }
        score += Math.min(interestScore, 28);
    }

    // 5. Custom Questions Keyword matching (Max 12)
    const questions1 = [u1.question_dream, u1.question_weekend, u1.question_redflag].join(' ');
    const questions2 = [u2.question_dream, u2.question_weekend, u2.question_redflag].join(' ');

    const qMatches = countMatches(getWords(questions1), getWords(questions2));
    if (qMatches > 0) {
        let qScore = 0;
        let points = 6;
        for (let i = 0; i < qMatches; i++) {
            qScore += points;
            points = Math.floor(points / 2);
        }
        score += Math.min(qScore, 12);
    }

    // Final Clamping: Max 88% (90%+ is reserved for AI-confirmed matches)
    return Math.max(15, Math.min(88, Math.round(score)));
};
