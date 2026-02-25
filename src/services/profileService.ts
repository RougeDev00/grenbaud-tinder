import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Profile } from '../types';
import { MOCK_PROFILES, CURRENT_MOCK_USER } from '../lib/mockData';

/**
 * Get profile by Twitch ID (from auth)
 */
export async function getProfileByTwitchId(twitchId: string): Promise<Profile | null> {
    if (!isSupabaseConfigured) {
        return MOCK_PROFILES.find(p => p.twitch_id === twitchId) || (CURRENT_MOCK_USER.twitch_id === twitchId ? CURRENT_MOCK_USER : null);
    }

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('twitch_id', twitchId)
        .single();

    if (error || !data) return null;
    return data as Profile;
}

/**
 * Get profile by UUID
 */
export async function getProfile(userId: string): Promise<Profile | null> {
    if (!isSupabaseConfigured) {
        return MOCK_PROFILES.find(p => p.id === userId) || (CURRENT_MOCK_USER.id === userId ? CURRENT_MOCK_USER : null);
    }

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error || !data) return null;
    return data as Profile;
}

/**
 * Create a new profile
 */
export async function createProfile(profileData: Partial<Profile> & { twitch_id: string; twitch_username: string }): Promise<Profile | null> {
    if (!isSupabaseConfigured) {
        return { ...CURRENT_MOCK_USER, ...profileData, is_registered: true } as Profile;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        console.error('createProfile: No active session');
        return null;
    }

    const body = {
        ...profileData,
        is_registered: true,
    };

    try {
        const { data, error } = await supabase
            .from('profiles')
            .upsert(body, { onConflict: 'twitch_id' })
            .select('*')
            .single();

        if (error) {
            console.error('createProfile error:', error);
            return null;
        }

        console.log('createProfile success:', data?.id);
        return data as Profile;
    } catch (err: unknown) {
        console.error('createProfile exception:', err);
        return null;
    }
}

/**
 * Update an existing profile
 */
export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
    console.log('[profileService] updateProfile: updating user', userId, 'with', updates);
    if (!isSupabaseConfigured) {
        console.log('[profileService] updateProfile: Supabase not configured, returning mock data');
        return { ...CURRENT_MOCK_USER, ...updates } as Profile;
    }

    try {
        const { data, error } = await supabase
            .from('profiles')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', userId)
            .select('*')
            .single();

        if (error) {
            console.error('[profileService] Error updating profile:', error.message, error.details, error.hint);
            return null;
        }
        console.log('[profileService] updateProfile: success');
        return data as Profile;
    } catch (err) {
        console.error('[profileService] Critical updateProfile error:', err);
        return null;
    }
}

/**
 * Get profiles not yet swiped by the current user
 */
export async function getDiscoverProfiles(userId: string): Promise<Profile[]> {
    if (!isSupabaseConfigured) return MOCK_PROFILES;

    try {
        console.log('[DISCOVER] Fetching profiles for user:', userId);

        const { data, error } = await supabase
            .rpc('get_profiles_to_swipe', { querying_user_id: userId });

        if (error) {
            console.error('[DISCOVER] RPC error:', error);
            return [];
        }

        if (data) {
            console.log(`[DISCOVER] Found ${data.length} profiles`);
            // Add null checks for properties that might be missing in older rows
            const safeData = (data as Profile[]).map(p => ({
                ...p,
                looking_for: p.looking_for || '',
                personality_type: p.personality_type || '',
            }));
            return safeData;
        }

        return [];

    } catch (err) {
        console.error('getDiscoverProfiles exception:', err);
        return [];
    }
}

/**
 * Get all registered profiles with pagination
 */
export async function getAllProfiles(page: number = 0, limit: number = 20, excludeTwitchId?: string): Promise<Profile[]> {
    if (!isSupabaseConfigured) {
        let profiles = MOCK_PROFILES;
        if (excludeTwitchId) {
            profiles = profiles.filter(p => p.twitch_id !== excludeTwitchId);
        }
        return profiles.slice(page * limit, (page + 1) * limit);
    }

    const from = page * limit;
    const to = from + limit - 1;

    let query = supabase
        .from('profiles')
        .select('*')
        .eq('is_registered', true);

    if (excludeTwitchId) {
        query = query.neq('twitch_id', excludeTwitchId);
    }

    const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

    if (error) {
        console.error('Error fetching all profiles:', error);
        return [];
    }

    return (data as Profile[]).map(p => ({
        ...p,
        looking_for: p.looking_for || '',
    }));
}

/**
 * Ultra-slim query for grid cards — only columns visible on card UI.
 * Supports true DB pagination for infinite scroll.
 */
const GRID_COLUMNS = [
    'id', 'twitch_id', 'twitch_username', 'display_name',
    'age', 'city', 'gender', 'zodiac_sign',
    'photo_1', 'photo_2', 'photo_3',
    'personality_type',
    'hobbies', 'music_artists', 'twitch_streamers', 'youtube_channels',
    'bio', 'looking_for',
    'is_registered', 'is_banned'
].join(',');

export async function getGridProfiles(
    excludeTwitchId?: string,
    page: number = 0,
    limit: number = 30
): Promise<Profile[]> {
    if (!isSupabaseConfigured) {
        let profiles = MOCK_PROFILES;
        if (excludeTwitchId) {
            profiles = profiles.filter(p => p.twitch_id !== excludeTwitchId);
        }
        return profiles.slice(page * limit, (page + 1) * limit);
    }

    const from = page * limit;
    const to = from + limit - 1;

    let query = supabase
        .from('profiles')
        .select(GRID_COLUMNS)
        .eq('is_registered', true);

    if (excludeTwitchId) {
        query = query.neq('twitch_id', excludeTwitchId);
    }

    const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

    if (error) {
        console.error('Error fetching grid profiles:', error);
        return [];
    }

    return (data as unknown as Profile[]).map(p => ({
        ...p,
        looking_for: p.looking_for || '',
    }));
}

/**
 * Get total count of registered profiles (for grid header)
 */
export async function getTotalProfileCount(excludeTwitchId?: string): Promise<number> {
    if (!isSupabaseConfigured) return MOCK_PROFILES.length;

    let query = supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('is_registered', true);

    if (excludeTwitchId) {
        query = query.neq('twitch_id', excludeTwitchId);
    }

    const { count, error } = await query;
    if (error) {
        console.error('Error fetching profile count:', error);
        return 0;
    }
    return count || 0;
}

/**
 * Lazy-load photo_2 and photo_3 for a single profile (called on photo swipe)
 */
export async function getProfilePhotos(profileId: string): Promise<{ photo_2: string | null; photo_3: string | null }> {
    if (!isSupabaseConfigured) return { photo_2: null, photo_3: null };

    const { data, error } = await supabase
        .from('profiles')
        .select('photo_2, photo_3')
        .eq('id', profileId)
        .single();

    if (error || !data) return { photo_2: null, photo_3: null };
    return { photo_2: data.photo_2 || null, photo_3: data.photo_3 || null };
}

/**
 * Delete profile by User ID (for account reset)
 */
export async function deleteProfile(userId: string): Promise<boolean> {
    if (!isSupabaseConfigured) return true;

    try {
        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId);

        if (error) {
            console.error('Error deleting profile:', error);
            return false;
        }
        return true;
    } catch (err) {
        console.error('deleteProfile exception:', err);
        return false;
    }
}
