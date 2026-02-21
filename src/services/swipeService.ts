import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Profile } from '../types';

interface MatchWithProfile {
    id: string;
    matchedProfile: Profile;
    created_at: string;
}

/**
 * Record a swipe. Returns the matched profile if it's a mutual like.
 */
export async function recordSwipe(
    swiperId: string,
    swipedId: string,
    direction: 'like' | 'dislike'
): Promise<{ isMatch: boolean; matchedProfile?: Profile }> {
    if (!isSupabaseConfigured) {
        // Simulate 30% match rate in mock mode
        return { isMatch: direction === 'like' && Math.random() < 0.3 };
    }

    // Insert swipe
    const { error: swipeError } = await supabase
        .from('swipes')
        .insert({ swiper_id: swiperId, swiped_id: swipedId, direction });

    if (swipeError) {
        console.error('Error recording swipe:', swipeError);
        return { isMatch: false };
    }

    // If it was a like, check for match (the DB trigger also creates it, but we check here for UI)
    if (direction === 'like') {
        const { data: mutualSwipe } = await supabase
            .from('swipes')
            .select('id')
            .eq('swiper_id', swipedId)
            .eq('swiped_id', swiperId)
            .eq('direction', 'like')
            .single();

        if (mutualSwipe) {
            // Fetch matched profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', swipedId)
                .single();

            return { isMatch: true, matchedProfile: profile as Profile };
        }
    }

    return { isMatch: false };
}

/**
 * Get all matches for a user with their full profiles
 */
export async function getMatches(userId: string): Promise<MatchWithProfile[]> {
    if (!isSupabaseConfigured) return [];

    // Get matches where user is either user_1 or user_2
    const { data: matchesData, error } = await supabase
        .from('matches')
        .select('*')
        .or(`user_1.eq.${userId},user_2.eq.${userId}`)
        .order('created_at', { ascending: false });

    if (error || !matchesData) {
        console.error('Error fetching matches:', error);
        return [];
    }

    // Fetch the other user's profile for each match
    const results: MatchWithProfile[] = [];
    for (const match of matchesData) {
        const otherId = match.user_1 === userId ? match.user_2 : match.user_1;
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', otherId)
            .single();

        if (profile) {
            results.push({
                id: match.id,
                matchedProfile: profile as Profile,
                created_at: match.created_at,
            });
        }
    }

    return results;
}
