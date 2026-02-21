import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Profile } from '../types';

export const verifyAdmin = async (password: string): Promise<boolean> => {
    if (!isSupabaseConfigured) return false;

    // To verify without throwing a hard error to the user if wrong, 
    // we can just try to fetch profiles with it and see if it fails.
    try {
        const { error } = await supabase.rpc('admin_get_profiles', { admin_password: password });
        if (error) return false;
        return true;
    } catch (e) {
        return false;
    }
};

export const getAdminProfiles = async (password: string): Promise<Profile[]> => {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase.rpc('admin_get_profiles', { admin_password: password });

    if (error) {
        console.error('Error fetching admin profiles:', error);
        throw error;
    }

    return data || [];
};

export const banUser = async (targetId: string, reason: string, password: string): Promise<void> => {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.rpc('admin_ban_user', { target_id: targetId, reason, admin_password: password });
    if (error) throw error;
};

export const unbanUser = async (targetId: string, password: string): Promise<void> => {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.rpc('admin_unban_user', { target_id: targetId, admin_password: password });
    if (error) throw error;
};

export const warnUser = async (targetId: string, msg: string, password: string): Promise<void> => {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.rpc('admin_warn_user', { target_id: targetId, msg, admin_password: password });
    if (error) throw error;
};

export const deleteUser = async (targetId: string, password: string): Promise<void> => {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.rpc('admin_delete_user', { target_id: targetId, admin_password: password });
    if (error) throw error;
};

export const acknowledgeWarning = async (): Promise<void> => {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.rpc('acknowledge_warning');
    if (error) throw error;
};
