import { supabase } from '../lib/supabase';
import type { Event, EventParticipant, EventWithDetails, EventMessage } from '../types';
import { createNotification } from './notificationService';

export const createEvent = async (eventData: Omit<Event, 'id' | 'created_at'>): Promise<Event> => {
    const { data, error } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single();

    if (error) {
        console.error('Error creating event:', error);
        throw error;
    }

    return data;
};

export const getEvents = async (): Promise<EventWithDetails[]> => {
    // We select events and join with profiles for creator
    // We also select all event_participants and join with profiles
    const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select(`
            *,
            creator:profiles!events_creator_id_fkey(*)
        `)
        .gte('event_time', new Date().toISOString())
        .order('event_time', { ascending: true });

    // Fire-and-forget aggressive cleanup: delete expired events from the database
    // This is safe because our updated RLS allows any authenticated user to trigger this cleanup
    supabase.from('events').delete().lt('event_time', new Date().toISOString()).then(() => { });

    if (eventsError) {
        console.error('Error fetching events:', eventsError);
        return [];
    }

    if (!eventsData || eventsData.length === 0) return [];

    // Fetch participants for these events
    const eventIds = eventsData.map(e => e.id);
    const { data: participantsData, error: participantsError } = await supabase
        .from('event_participants')
        .select(`
            *,
            profile:profiles!event_participants_user_id_fkey(*)
        `)
        .in('event_id', eventIds);

    if (participantsError) {
        console.error('Error fetching participants:', participantsError);
        // Continue anyway, just without participants
    }

    // Combine them
    const eventsWithDetails: EventWithDetails[] = eventsData.map(e => {
        const parts = participantsData ? participantsData.filter(p => p.event_id === e.id) : [];
        return {
            ...e,
            participants: parts
        };
    });

    return eventsWithDetails;
};

export const getEventById = async (eventId: string): Promise<EventWithDetails | null> => {
    try {
        const { data: eventData, error: eventError } = await supabase
            .from('events')
            .select(`
                *,
                creator:profiles!events_creator_id_fkey(*)
            `)
            .eq('id', eventId)
            .single();

        if (eventError || !eventData) {
            console.error('Error fetching event by id:', eventError);
            return null;
        }

        const { data: participantsData, error: participantsError } = await supabase
            .from('event_participants')
            .select(`
                *,
                profile:profiles!event_participants_user_id_fkey(*)
            `)
            .eq('event_id', eventId);

        if (participantsError) {
            console.error('Error fetching participants for event:', participantsError);
        }

        return {
            ...eventData,
            participants: participantsData || []
        };
    } catch (err) {
        console.error('Error in getEventById:', err);
        return null;
    }
};

export const requestToJoinEvent = async (eventId: string, userId: string): Promise<EventParticipant | null> => {
    const { data, error } = await supabase
        .from('event_participants')
        .insert([{
            event_id: eventId,
            user_id: userId,
            status: 'pending'
        }])
        .select()
        .single();

    if (error) {
        console.error('Error requesting to join event:', error);
        throw error;
    }

    // Notify event creator
    try {
        console.log(`[EventService] Trying to notify creator of event ${eventId} about request from ${userId}`);
        const { data: eventData, error: eventErr } = await supabase.from('events').select('creator_id').eq('id', eventId).single();

        if (eventErr) {
            console.error('[EventService] Failed to fetch event creator:', eventErr);
        } else if (eventData?.creator_id) {
            console.log(`[EventService] Creator ID found: ${eventData.creator_id}. Triggering notification...`);
            await createNotification(eventData.creator_id, 'EVENT_REQUEST', userId, eventId);
        } else {
            console.warn('[EventService] Creator ID was null or missing for event', eventId);
        }
    } catch (notifErr: any) {
        console.error('Error sending EVENT_REQUEST notification:', notifErr);
    }

    return data;
};

export const updateParticipantStatus = async (eventId: string, userId: string, status: 'approved' | 'rejected'): Promise<boolean> => {
    // 1. Get current status to know if we are kicking an approved user
    let previousStatus: string | null = null;
    try {
        const { data: currentParticipant } = await supabase
            .from('event_participants')
            .select('status')
            .eq('event_id', eventId)
            .eq('user_id', userId)
            .single();
        if (currentParticipant) {
            previousStatus = currentParticipant.status;
        }
    } catch (e) {
        console.warn('Could not fetch previous participant status:', e);
    }

    // 2. Update status
    const { error } = await supabase
        .from('event_participants')
        .update({ status })
        .eq('event_id', eventId)
        .eq('user_id', userId);

    if (error) {
        console.error('Error updating participant status:', error);
        return false;
    }

    // 3. Notify the user who requested to join (or the one being kicked)
    try {
        const { data: eventData } = await supabase.from('events').select('creator_id').eq('id', eventId).single();
        if (eventData?.creator_id) {
            let notifType = status === 'approved' ? 'EVENT_ACCEPT' : 'EVENT_REJECT';

            // If the user was already approved and is now being rejected, it's a REMOVE/KICK action
            if (previousStatus === 'approved' && status === 'rejected') {
                notifType = 'EVENT_REMOVE';
            }
            // Add ts-ignore if notifType type mismatch throws a temporary tantrum, though we fixed the enum
            await createNotification(userId, notifType as any, eventData.creator_id, eventId);
        }
    } catch (notifErr) {
        console.error(`Error sending ${status} notification:`, notifErr);
    }

    return true;
};

export const cancelJoinRequest = async (eventId: string, userId: string): Promise<boolean> => {
    const { error } = await supabase
        .from('event_participants')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', userId);

    if (error) {
        console.error('Error cancelling join request:', error);
        return false;
    }
    return true;
};

export const deleteEvent = async (eventId: string): Promise<boolean> => {
    console.log('[Event] Attempting to delete event:', eventId);
    const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

    if (error) {
        console.error('[Event] Error deleting event:', error.message, error.details, error.hint, error.code);
        return false;
    }
    console.log('[Event] Event deleted successfully');
    return true;
};

// Get events the user is part of (as creator or approved participant)
export const getUserEvents = async (userId: string): Promise<EventWithDetails[]> => {
    try {
        const allEvents = await getEvents();
        return allEvents.filter(evt =>
            evt.creator_id === userId ||
            evt.participants.some(p => p.user_id === userId && p.status === 'approved')
        );
    } catch (err) {
        console.error('Error in getUserEvents:', err);
        return [];
    }
};

// ── Event Chat Unread Tracking (localStorage-based) ──

const EVENT_LAST_READ_KEY = 'baudr_event_chat_last_read';

function getLastReadTimestamps(): Record<string, string> {
    try {
        return JSON.parse(localStorage.getItem(EVENT_LAST_READ_KEY) || '{}');
    } catch { return {}; }
}

export function markEventChatRead(eventId: string) {
    const timestamps = getLastReadTimestamps();
    timestamps[eventId] = new Date().toISOString();
    localStorage.setItem(EVENT_LAST_READ_KEY, JSON.stringify(timestamps));
}

export const getEventUnreadCount = async (eventId: string): Promise<number> => {
    try {
        const timestamps = getLastReadTimestamps();
        const lastRead = timestamps[eventId] || '1970-01-01T00:00:00Z';

        const { count, error } = await supabase
            .from('event_messages')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', eventId)
            .gt('created_at', lastRead);

        if (error) {
            console.error('[EventChat] Error getting unread count:', error);
            return 0;
        }
        return count || 0;
    } catch (err) {
        console.error('[EventChat] Error in getEventUnreadCount:', err);
        return 0;
    }
};

export const getTotalEventUnreadCount = async (userId: string): Promise<number> => {
    try {
        const events = await getUserEvents(userId);
        if (events.length === 0) return 0;

        let total = 0;
        await Promise.all(events.map(async (evt) => {
            const count = await getEventUnreadCount(evt.id);
            total += count;
        }));
        return total;
    } catch (err) {
        console.error('[EventChat] Error in getTotalEventUnreadCount:', err);
        return 0;
    }
};

// ── Event Chat Functions ──

export const getEventMessages = async (eventId: string): Promise<EventMessage[]> => {
    try {
        // Simple query: get messages, then fetch sender profiles
        const { data, error } = await supabase
            .from('event_messages')
            .select('*')
            .eq('event_id', eventId)
            .order('created_at', { ascending: true })
            .limit(200);

        if (error) {
            console.error('[EventChat] Error fetching messages:', error);
            return [];
        }
        if (!data || data.length === 0) return [];

        // Fetch sender profiles
        const senderIds = [...new Set(data.map(m => m.sender_id))];
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, display_name, twitch_username, photo_1')
            .in('id', senderIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

        return data.map(msg => ({
            ...msg,
            sender: profileMap.get(msg.sender_id) || undefined,
        })) as EventMessage[];
    } catch (err) {
        console.error('[EventChat] Error in getEventMessages:', err);
        return [];
    }
};

export const sendEventMessage = async (eventId: string, senderId: string, content: string): Promise<EventMessage | null> => {
    try {
        console.log('[EventChat] Sending message:', { eventId, senderId, contentLength: content.length });

        const { data, error } = await supabase
            .from('event_messages')
            .insert([{ event_id: eventId, sender_id: senderId, content }])
            .select('*')
            .single();

        if (error) {
            console.error('[EventChat] Error sending message:', error.message, error.details, error.hint);
            return null;
        }

        console.log('[EventChat] Message sent successfully:', data.id);

        // Fetch sender profile separately
        const { data: senderProfile } = await supabase
            .from('profiles')
            .select('id, display_name, twitch_username, photo_1')
            .eq('id', senderId)
            .single();

        return {
            ...data,
            sender: senderProfile || undefined,
        } as EventMessage;
    } catch (err) {
        console.error('[EventChat] Exception in sendEventMessage:', err);
        return null;
    }
};

export const subscribeToEventMessages = (eventId: string, callback: (msg: EventMessage) => void) => {
    const channel = supabase
        .channel(`event_chat_${eventId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'event_messages',
                filter: `event_id=eq.${eventId}`,
            },
            async (payload) => {
                const newMsg = payload.new as EventMessage;
                // Fetch sender profile
                const { data } = await supabase
                    .from('profiles')
                    .select('id, display_name, twitch_username, photo_1')
                    .eq('id', newMsg.sender_id)
                    .single();
                if (data) {
                    newMsg.sender = data;
                }
                callback(newMsg);
            }
        )
        .subscribe((status) => {
            console.log('[EventChat] Realtime subscription:', status);
        });

    return () => {
        supabase.removeChannel(channel);
    };
};

