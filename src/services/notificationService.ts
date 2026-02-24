import { supabase } from '../lib/supabase';

export type NotificationType = 'SPY' | 'SPY_RECIPROCAL' | 'EVENT_REQUEST' | 'EVENT_ACCEPT' | 'EVENT_REJECT' | 'EVENT_REMOVE' | 'ESPLORA_LIKE' | 'ESPLORA_COMMENT' | 'ESPLORA_REPLY';

export interface Notification {
    id: string;
    user_id: string;
    actor_id: string | null;
    type: NotificationType;
    reference_id: string | null;
    read: boolean;
    created_at: string;
    actor_profile?: {
        display_name: string;
        twitch_username: string | null;
        photo_1: string | null;
    };
}

export const createNotification = async (
    userId: string,
    type: NotificationType,
    actorId?: string,
    referenceId?: string
) => {
    try {
        console.log(`[NotificationService] Attempting to create: user_id=${userId}, type=${type}, actor_id=${actorId}`);
        const { error } = await supabase
            .from('notifications')
            .insert({
                user_id: userId,
                actor_id: actorId || null,
                type,
                reference_id: referenceId || null
            })
            .select();

        if (error) {
            console.error('[NotificationService] Supabase insert error:', error);
            throw error;
        }

        console.log('[NotificationService] Insert success!');
        return true;
    } catch (err: any) {
        console.error('[NotificationService] Exception creating notification:', err);
        return false;
    }
};

export const checkReciprocalInterest = async (userId: string, actorId: string): Promise<boolean> => {
    try {
        // Check if the OTHER user (actorId) has already generated a compatibility score for this pair
        // This is the source of truth — not SPY notifications (which persist after admin deletion)
        const [user_a, user_b] = [userId, actorId].sort();
        const { data, error } = await supabase
            .from('compatibility_scores')
            .select('id')
            .eq('user_a', user_a)
            .eq('user_b', user_b)
            .eq('generated_by', actorId)
            .maybeSingle();

        if (error) throw error;
        return !!data;
    } catch (err) {
        console.error('[NotificationService] Error checking reciprocal interest:', err);
        return false;
    }
};

export const checkMutualAnalysis = async (user1Id: string, user2Id: string): Promise<boolean> => {
    try {
        // ONLY check compatibility_scores — BOTH users must have generated independently
        // SPY notifications are for user-facing notifications only, NOT for chat access control
        const [user_a, user_b] = [user1Id, user2Id].sort();

        // Check if user1 generated a score for this pair
        const { data: score1, error: err1 } = await supabase
            .from('compatibility_scores')
            .select('id')
            .eq('user_a', user_a)
            .eq('user_b', user_b)
            .eq('generated_by', user1Id)
            .maybeSingle();

        if (err1) throw err1;

        // Check if user2 generated a score for this pair
        const { data: score2, error: err2 } = await supabase
            .from('compatibility_scores')
            .select('id')
            .eq('user_a', user_a)
            .eq('user_b', user_b)
            .eq('generated_by', user2Id)
            .maybeSingle();

        if (err2) throw err2;

        // Chat unlocks only when BOTH users have generated
        return !!(score1 && score2);
    } catch (err) {
        console.error('[NotificationService] Error checking mutual analysis:', err);
        return false;
    }
};


export const deleteSpyNotifications = async (userId: string, actorId: string): Promise<boolean> => {
    try {
        // Delete all 'SPY' or 'SPY_RECIPROCAL' notifications where:
        // (user_id = userId AND actor_id = actorId) OR (user_id = actorId AND actor_id = userId)
        // This effectively "resets" the spying state between these two users.
        const { error } = await supabase
            .from('notifications')
            .delete()
            .in('type', ['SPY', 'SPY_RECIPROCAL'])
            .or(`and(user_id.eq.${userId},actor_id.eq.${actorId}),and(user_id.eq.${actorId},actor_id.eq.${userId})`);

        if (error) throw error;
        return true;
    } catch (err) {
        console.error('[NotificationService] Error deleting spy notifications:', err);
        return false;
    }
};

export const getNotifications = async (userId: string): Promise<Notification[]> => {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select(`
                *,
                actor_profile:profiles!actor_id(display_name, twitch_username, photo_1)
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50); // limit to recent 50 for performance

        if (error) throw error;
        return data as unknown as Notification[];
    } catch (err) {
        console.error('Error fetching notifications:', err);
        return [];
    }
};

export const markAsRead = async (notificationId: string) => {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId);

        if (error) throw error;
        return true;
    } catch (err) {
        console.error('Error marking notification as read:', err);
        return false;
    }
};

export const markAllAsRead = async (userId: string) => {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', userId)
            .eq('read', false);

        if (error) throw error;
        return true;
    } catch (err) {
        console.error('Error marking all notifications as read:', err);
        return false;
    }
};

export const deleteNotification = async (notificationId: string) => {
    try {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId);

        if (error) throw error;
        return true;
    } catch (err) {
        console.error('Error deleting notification:', err);
        return false;
    }
};

export const deleteAllNotifications = async (userId: string) => {
    try {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('user_id', userId);

        if (error) throw error;
        return true;
    } catch (err) {
        console.error('Error deleting all notifications:', err);
        return false;
    }
};
