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

/**
 * Calculates a compatibility score between 1 and 100
 */
export const calculateCompatibility = (u1: Profile, u2: Profile): number => {
    let score = 25; // Base score (starts low)

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

    // 2. Personality Compatibility (Max +40, potential penalties)
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
            // If very similar (diff < 20): Strong bonus
            // If medium (20-40): Small bonus
            // If very different (> 60): Penalty
            if (diff < 20) personalityScore += 10;
            else if (diff < 40) personalityScore += 5;
            else if (diff > 60) personalityScore -= 5;
            dimensionCount++;
        }
    });

    if (dimensionCount > 0) {
        score += personalityScore;
    }

    // 3. Interests Overlap (Max 25)
    const getWords = (s: string) => s?.toLowerCase().split(/[,\s]+/).map(w => w.trim()).filter(w => w.length > 2) || [];

    const interests1 = [
        ...getWords(u1.hobbies),
        ...getWords(u1.music_artists),
        ...getWords(u1.twitch_streamers),
        ...getWords(u1.youtube_channels)
    ];

    const interests2 = [
        ...getWords(u2.hobbies),
        ...getWords(u2.music_artists),
        ...getWords(u2.twitch_streamers),
        ...getWords(u2.youtube_channels)
    ];

    const intersection = interests1.filter(item => interests2.includes(item));
    const uniqueMatches = Array.from(new Set(intersection));

    // HUGE BOOST for shared interests. Each unique match gives 15 points, max 60.
    // E.g., sharing "blur" and "nayt" gives +30 points instantly.
    if (uniqueMatches.length > 0) {
        score += Math.min(uniqueMatches.length * 15, 60);
    }

    // 4. Custom Questions Keyword matching (Max 20)
    const questions1 = [u1.question_dream, u1.question_weekend, u1.question_redflag].join(' ');
    const questions2 = [u2.question_dream, u2.question_weekend, u2.question_redflag].join(' ');

    const qMatches = getWords(questions1).filter(w => getWords(questions2).includes(w));
    if (qMatches.length > 0) {
        // Each word match gives 3 points, max 20
        score += Math.min(qMatches.length * 3, 20);
    }

    // Final Clamping
    return Math.max(1, Math.min(99, Math.round(score)));
};
