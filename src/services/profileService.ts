import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Profile } from '../types';
import { MOCK_PROFILES, CURRENT_MOCK_USER } from '../lib/mockData';

/**
 * Get profile by Twitch ID (from auth)
 */
export async function getProfileByTwitchId(twitchId: string): Promise<Profile | null> {
    if (!isSupabaseConfigured) return CURRENT_MOCK_USER;

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
    if (!isSupabaseConfigured) return CURRENT_MOCK_USER;

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error || !data) return null;
    return data as Profile;
}

/**
 * Create a new profile — uses raw fetch to avoid Supabase JS client hanging
 */
export async function createProfile(profileData: Partial<Profile> & { twitch_id: string; twitch_username: string }): Promise<Profile | null> {
    if (!isSupabaseConfigured) {
        return { ...CURRENT_MOCK_USER, ...profileData, is_registered: true } as Profile;
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    // Get the current session token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        console.error('createProfile: No active session');
        return null;
    }

    const body = {
        ...profileData,
        is_registered: true,
    };

    console.log('createProfile: sending raw fetch to Supabase REST API...');

    // Use AbortController for a hard 8-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${session.access_token}`,
                'Prefer': 'resolution=merge-duplicates,return=representation',
            },
            body: JSON.stringify(body),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const responseText = await response.text();
        console.log('createProfile response:', response.status, responseText);

        if (!response.ok) {
            console.error('createProfile HTTP error:', response.status, responseText);
            return null;
        }

        const data = JSON.parse(responseText);
        const profile = Array.isArray(data) ? data[0] : data;
        console.log('createProfile success:', profile?.id);
        return profile as Profile;
    } catch (err: unknown) {
        clearTimeout(timeoutId);
        if (err instanceof Error && err.name === 'AbortError') {
            console.error('createProfile: Request aborted (8s timeout)');
        } else {
            console.error('createProfile fetch error:', err);
        }
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
 * Uses raw fetch to avoid Supabase client issues
 */
export async function getDiscoverProfiles(userId: string): Promise<Profile[]> {
    if (!isSupabaseConfigured) return MOCK_PROFILES;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
        console.log('[DISCOVER] Fetching profiles for user:', userId);

        const { data, error } = await supabase
            .rpc('get_profiles_to_swipe', { querying_user_id: userId });

        clearTimeout(timeoutId);

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
        clearTimeout(timeoutId);
        console.error('getDiscoverProfiles exception:', err);
        return [];
    }
}

/**
 * Get all registered profiles with pagination
 */
export async function getAllProfiles(page: number = 0, limit: number = 20, excludeTwitchId?: string): Promise<Profile[]> {
    if (!isSupabaseConfigured) return MOCK_PROFILES;

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
