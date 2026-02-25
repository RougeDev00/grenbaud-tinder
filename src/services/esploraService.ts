import { supabase } from '../lib/supabase';
import type { EsploraPost, EsploraPostWithProfile, EsploraCommentWithProfile } from '../types';

/**
 * Fetches all Esplora posts from the last 24 hours, including creator profiles
 * and whether the current user has liked them.
 */
export const getEsploraPosts = async (currentUserId: string): Promise<EsploraPostWithProfile[]> => {
    try {
        const { data: postsData, error: postsError } = await supabase
            .from('esplora_posts')
            .select(`
                *,
                profile:profiles!esplora_posts_user_id_fkey(*)
            `)
            .order('created_at', { ascending: false });

        if (postsError) {
            console.error('Error fetching esplora posts:', postsError);
            return [];
        }

        if (!postsData || postsData.length === 0) return [];

        // Fetch ALL likes for these posts to show visual pins
        const postIds = postsData.map(p => p.id);
        const { data: allLikesData, error: allLikesError } = await supabase
            .from('esplora_likes')
            .select(`
                post_id,
                user_id,
                pos_x,
                pos_y,
                profile:profiles(id, twitch_username, photo_1)
            `)
            .in('post_id', postIds);

        if (allLikesError) {
            console.error('Error fetching all esplora likes:', allLikesError);
        }

        const likesMap = new Map<string, any[]>();
        allLikesData?.forEach(like => {
            if (!likesMap.has(like.post_id)) {
                likesMap.set(like.post_id, []);
            }
            if (like.profile) {
                likesMap.get(like.post_id)!.push({
                    ...like.profile,
                    pos_x: like.pos_x,
                    pos_y: like.pos_y
                });
            }
        });

        return postsData.map(post => ({
            ...post,
            comments_count: post.comments_count ?? 0,
            profile: post.profile,
            hasLiked: allLikesData?.some(l => l.post_id === post.id && l.user_id === currentUserId) || false,
            likers: likesMap.get(post.id) || [],
            // Fallback for coordinates if they don't exist in DB yet
            pos_x: post.pos_x,
            pos_y: post.pos_y
        })) as EsploraPostWithProfile[];

    } catch (err) {
        console.error('Exception in getEsploraPosts:', err);
        return [];
    }
};

/**
 * Fetches posts by a specific user.
 */
export const getUserPosts = async (userId: string, currentUserId: string): Promise<EsploraPostWithProfile[]> => {
    try {
        const { data: postsData, error } = await supabase
            .from('esplora_posts')
            .select(`
                *,
                profile:profiles!esplora_posts_user_id_fkey(*)
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error || !postsData) return [];

        const postIds = postsData.map(p => p.id);
        const { data: allLikesData } = await supabase
            .from('esplora_likes')
            .select('post_id, user_id, profile:profiles(id, twitch_username, photo_1)')
            .in('post_id', postIds);

        const likesMap = new Map<string, any[]>();
        allLikesData?.forEach(like => {
            if (!likesMap.has(like.post_id)) likesMap.set(like.post_id, []);
            if (like.profile) likesMap.get(like.post_id)!.push(like.profile);
        });

        return postsData.map(post => ({
            ...post,
            comments_count: post.comments_count ?? 0,
            profile: post.profile,
            hasLiked: allLikesData?.some(l => l.post_id === post.id && l.user_id === currentUserId) || false,
            likers: likesMap.get(post.id) || [],
        })) as EsploraPostWithProfile[];
    } catch (err) {
        console.error('Exception in getUserPosts:', err);
        return [];
    }
};

/**
 * Creates a new Esplora post.
 */
export const createEsploraPost = async (
    userId: string,
    contentType: 'text' | 'image' | 'video',
    textContent: string | null,
    mediaFile: File | null,
    colorTheme: string = 'yellow',
    targetX?: number,
    targetY?: number
): Promise<EsploraPost | null> => {
    try {
        let mediaUrl = null;

        if (mediaFile && (contentType === 'image' || contentType === 'video')) {
            const fileExt = mediaFile.name.split('.').pop();

            // Storage RLS requires path to start with auth.uid()
            const { data: { session } } = await supabase.auth.getSession();
            const authUid = session?.user?.id;
            if (!authUid) throw new Error('Not authenticated');

            const fileName = `esplora_${Date.now()}.${fileExt}`;
            const filePath = `${authUid}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('photos')
                .upload(filePath, mediaFile);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('photos').getPublicUrl(filePath);
            mediaUrl = data.publicUrl;
        }

        // Fetch existing post positions for collision check
        let existingCoords: { pos_x: number, pos_y: number }[] = [];
        try {
            const { data: recentPosts } = await supabase
                .from('esplora_posts')
                .select('pos_x, pos_y');

            if (recentPosts) {
                existingCoords = recentPosts
                    .filter(p => p.pos_x != null && p.pos_y != null)
                    .map(p => ({ pos_x: Number(p.pos_x), pos_y: Number(p.pos_y) }));
            }
        } catch (e) {
            console.error('Failed to fetch existing coords for collision check:', e);
        }

        const MIN_DISTANCE = 18; // % distance required between post-it centers

        // Check if a position is free of collisions
        const isFree = (x: number, y: number) => {
            for (const coord of existingCoords) {
                const dist = Math.sqrt(Math.pow(coord.pos_x - x, 2) + Math.pow(coord.pos_y - y, 2));
                if (dist < MIN_DISTANCE) return false;
            }
            return true;
        };


        let posX: number;
        let posY: number;

        if (targetX !== undefined && targetY !== undefined) {
            // User chose a position — spiral outward to find nearest free spot
            posX = targetX;
            posY = targetY;

            if (!isFree(posX, posY)) {
                let found = false;
                // Spiral outward: try increasing radii in 12 directions
                for (let radius = 5; radius <= 80 && !found; radius += 5) {
                    for (let angle = 0; angle < 360; angle += 30) {
                        const rad = (angle * Math.PI) / 180;
                        const tryX = posX + Math.cos(rad) * radius;
                        const tryY = posY + Math.sin(rad) * radius;
                        if (isFree(tryX, tryY)) {
                            posX = tryX;
                            posY = tryY;
                            found = true;
                            break;
                        }
                    }
                }
            }
        } else {
            // No target — random placement with collision avoidance
            posX = 15 + Math.random() * 70;
            posY = 15 + Math.random() * 60;
            let attempts = 0;
            while (attempts < 50) {
                if (isFree(posX, posY)) break;
                posX = 15 + Math.random() * 70;
                posY = 15 + Math.random() * 60;
                attempts++;
            }
        }

        const { data: postData, error: postError } = await supabase
            .from('esplora_posts')
            .insert([{
                user_id: userId,
                content_type: contentType,
                text_content: textContent,
                media_url: mediaUrl,
                color_theme: colorTheme,
                pos_x: posX,
                pos_y: posY
            }])
            .select()
            .single();

        if (postError) {
            console.error('[Esplora] Error creating post:', postError.message, postError.details, postError.hint);
            return null;
        }
        return postData as EsploraPost;
    } catch (err) {
        console.error('Exception in createEsploraPost:', err);
        return null;
    }
};

/**
 * Toggles a like on an Esplora post ("Appunta un chiodino").
 * accepts optional posX and posY (0-100) for pin placement.
 */
export const toggleEsploraLike = async (
    postId: string,
    userId: string,
    posX?: number,
    posY?: number
): Promise<boolean | null> => {
    try {
        // RPC handles: toggle like, update count, AND send notification (all SECURITY DEFINER)
        const { data: isNowLiked, error: rpcError } = await supabase
            .rpc('toggle_esplora_like', { p_post_id: postId, p_user_id: userId });

        if (rpcError) {
            console.error('Error in toggle_esplora_like RPC:', rpcError);
            return null;
        }

        // Update pin coordinates if provided (and we just liked)
        if (isNowLiked && (posX !== undefined || posY !== undefined)) {
            await supabase.from('esplora_likes')
                .update({ pos_x: posX ?? 50, pos_y: posY ?? 90 })
                .eq('post_id', postId)
                .eq('user_id', userId);
        }

        return isNowLiked;
    } catch (err) {
        console.error('Exception in toggleEsploraLike:', err);
        return null;
    }
};

export const deleteEsploraPost = async (postId: string, userId: string, isAdmin = false): Promise<boolean> => {
    try {
        let query = supabase.from('esplora_posts').delete().eq('id', postId);
        if (!isAdmin) query = query.eq('user_id', userId);

        const { error } = await query;
        if (error) {
            console.error('Error deleting esplora post:', error);
            return false;
        }
        return true;
    } catch (err) {
        console.error('Exception in deleteEsploraPost:', err);
        return false;
    }
};

/**
 * Toggle pin status on a post (admin only).
 */
export const togglePinPost = async (postId: string, pinned: boolean, username?: string): Promise<boolean> => {
    try {
        const { data, error } = await supabase
            .rpc('admin_toggle_pin', {
                p_post_id: postId,
                p_pinned: pinned,
                p_username: username || ''
            });
        if (error) {
            console.error('Error toggling pin:', error);
            return false;
        }
        return !!data;
    } catch (err) {
        console.error('Exception in togglePinPost:', err);
        return false;
    }
};

// ── Comments ──

/**
 * Fetches comments for a given post, with author profile info.
 */
export const getPostComments = async (postId: string): Promise<EsploraCommentWithProfile[]> => {
    try {
        const { data, error } = await supabase
            .from('esplora_comments')
            .select(`
                *,
                profile:profiles!esplora_comments_user_id_fkey(id, display_name, twitch_username, photo_1)
            `)
            .eq('post_id', postId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching comments:', error);
            return [];
        }

        // Nest replies under parent comments
        const all = (data || []) as EsploraCommentWithProfile[];
        const topLevel = all.filter(c => !c.parent_id);
        const replies = all.filter(c => c.parent_id);
        topLevel.forEach(c => {
            c.replies = replies.filter(r => r.parent_id === c.id);
        });
        return topLevel;
    } catch (err) {
        console.error('Exception in getPostComments:', err);
        return [];
    }
};


/**
 * Creates a comment on a post.
 */
export const createComment = async (
    postId: string,
    userId: string,
    content: string,
    parentId?: string | null
): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('esplora_comments')
            .insert([{ post_id: postId, user_id: userId, content, parent_id: parentId ?? null }]);

        if (error) {
            console.error('[esploraService] createComment failed:', error.message, error.code);
            return false;
        }

        const { createNotification } = await import('./notificationService');

        if (parentId) {
            // It's a reply — notify the parent comment author
            const { data: parentComment } = await supabase
                .from('esplora_comments')
                .select('user_id')
                .eq('id', parentId)
                .single();
            if (parentComment && parentComment.user_id !== userId) {
                await createNotification(parentComment.user_id, 'ESPLORA_REPLY', userId, postId);
            }
        } else {
            // Top-level comment — notify the post author
            const { data: post } = await supabase
                .from('esplora_posts')
                .select('user_id')
                .eq('id', postId)
                .single();
            if (post && post.user_id !== userId) {
                await createNotification(post.user_id, 'ESPLORA_COMMENT', userId, postId);
            }
        }

        return true;
    } catch (err) {
        console.error('Exception in createComment:', err);
        return false;
    }
};


/**
 * Deletes a comment.
 */
export const deleteComment = async (commentId: string, userId: string, isAdmin = false): Promise<boolean> => {
    try {
        let query = supabase.from('esplora_comments').delete().eq('id', commentId);
        if (!isAdmin) query = query.eq('user_id', userId);

        const { error } = await query;

        if (error) {
            console.error('Error deleting comment:', error);
            return false;
        }
        return true;
    } catch (err) {
        console.error('Exception in deleteComment:', err);
        return false;
    }
};
