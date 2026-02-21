import { supabase } from '../lib/supabase';
import type { Message } from '../types';

// ── Send a message ──
export const sendMessage = async (senderId: string, receiverId: string, content: string): Promise<Message | null> => {
    try {
        const { data, error } = await supabase
            .from('messages')
            .insert([{ sender_id: senderId, receiver_id: receiverId, content }])
            .select()
            .single();

        if (error) {
            console.error('Error sending message:', error);
            return null;
        }
        return data;
    } catch (err) {
        console.error('Error sending message:', err);
        return null;
    }
};

// ── Get messages for a conversation (last 24h) ──
export const getMessages = async (userId1: string, userId2: string): Promise<Message[]> => {
    try {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)
            .gte('created_at', yesterday)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching messages:', error);
            return [];
        }
        return data || [];
    } catch (err) {
        console.error('Error fetching messages:', err);
        return [];
    }
};

// ── Subscribe to new messages (real-time) ──
// ── Subscribe to new messages (INSERT) and status updates (UPDATE) ──
export const subscribeToMessages = (callback: (msg: Message) => void) => {
    const channel = supabase
        .channel('baudr_global_chat')
        .on(
            'postgres_changes',
            {
                event: '*', // Listen to INSERT and UPDATE
                schema: 'public',
                table: 'messages',
            },
            (payload) => {
                const newMsg = payload.new as Message;
                callback(newMsg);
            }
        )
        .on(
            'broadcast',
            { event: 'new_message' },
            (payload) => {
                const msg = payload.payload as Message;
                callback(msg);
            }
        )
        .subscribe((status) => {
            console.log('[ChatService] Realtime subscription status:', status);
        });

    return () => {
        supabase.removeChannel(channel);
    };
};

// ── Mark messages as read in DB ──
export const markMessagesAsRead = async (senderId: string, receiverId: string) => {
    try {
        const { error } = await supabase
            .from('messages')
            .update({ read_at: new Date().toISOString() })
            .eq('sender_id', senderId)
            .eq('receiver_id', receiverId)
            .is('read_at', null); // Only unread ones

        if (error) console.error('Error marking messages read:', error);
    } catch (err) {
        console.error('Error in markMessagesAsRead:', err);
    }
};

// ── Get list of conversations (distinct users) ──
export const getConversations = async (currentUserId: string): Promise<{ userId: string; lastMessage: Message; unreadCount: number }[]> => {
    try {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
            .gte('created_at', yesterday)
            .order('created_at', { ascending: false });

        if (error || !data) return [];

        const conversations = new Map<string, { lastMessage: Message; unreadCount: number }>();

        data.forEach((msg: Message) => {
            const otherId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;
            const existing = conversations.get(otherId);

            if (!existing) {
                // First message found is the latest due to sort order
                const isUnread = msg.sender_id !== currentUserId && !isMessageRead(msg);
                conversations.set(otherId, {
                    lastMessage: msg,
                    unreadCount: isUnread ? 1 : 0,
                });
            } else {
                // Count additional unread
                if (msg.sender_id !== currentUserId && !isMessageRead(msg)) {
                    existing.unreadCount++;
                }
            }
        });

        return Array.from(conversations.entries()).map(([userId, { lastMessage, unreadCount }]) => ({
            userId,
            lastMessage,
            unreadCount,
        }));
    } catch (err) {
        console.error('Error getting conversations:', err);
        return [];
    }
};

// ── Get total unread count across all conversations ──
export const getTotalUnreadCount = async (currentUserId: string): Promise<number> => {
    try {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('receiver_id', currentUserId)
            .gte('created_at', yesterday)
            .order('created_at', { ascending: false });

        if (error || !data) return 0;

        let count = 0;
        data.forEach((msg: Message) => {
            if (!isMessageRead(msg)) {
                count++;
            }
        });
        return count;
    } catch (err) {
        console.error('Error getting unread count:', err);
        return 0;
    }
};

export const isMessageRead = (message: Message): boolean => {
    return !!message.read_at;
};

// Deprecated local storage function, keeping for backward compat if needed but now unused
export const markConversationRead = async (currentUserId: string, otherUserId: string) => {
    // Now calls the server to mark as read
    // But this function signature was (currentUserId, otherUserId).
    // The server needs (sender_id, receiver_id).
    // If I am 'currentUserId', I mark messages sent by 'otherUserId' to 'currentUserId'.
    await markMessagesAsRead(otherUserId, currentUserId);
};
