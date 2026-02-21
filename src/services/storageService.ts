import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Upload a photo to Supabase Storage
 */
export async function uploadPhoto(
    userId: string,
    file: File,
    slot: number
): Promise<string | null> {
    if (!isSupabaseConfigured) {
        // Return local object URL for mock mode
        return URL.createObjectURL(file);
    }

    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/photo_${slot}.${fileExt}`;

    // Upload (overwrite if exists)
    const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, file, { upsert: true });

    if (uploadError) {
        console.error('Error uploading photo:', uploadError);
        return null;
    }

    // Get public URL
    const { data } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath);

    return data.publicUrl;
}

/**
 * Get the public URL for a photo path
 */
export function getPhotoUrl(path: string): string {
    if (!isSupabaseConfigured || !path) return path;

    // If it's already a full URL, return as-is
    if (path.startsWith('http')) return path;

    const { data } = supabase.storage
        .from('photos')
        .getPublicUrl(path);

    return data.publicUrl;
}
