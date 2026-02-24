/**
 * Twitch Helix API service for checking subscription status.
 *
 * Requires:
 * - VITE_TWITCH_CLIENT_ID env variable
 * - user:read:subscriptions OAuth scope
 * - providerToken from Supabase session (session.provider_token)
 */

const TWITCH_CLIENT_ID = import.meta.env.VITE_TWITCH_CLIENT_ID || '';
const GRENBAUD_CHANNEL = 'grenbaud';

/** Resolve the current authenticated user's Twitch ID from their token */
async function getMyTwitchId(providerToken: string): Promise<string | null> {
    try {
        const res = await fetch('https://api.twitch.tv/helix/users', {
            headers: {
                'Authorization': `Bearer ${providerToken}`,
                'Client-Id': TWITCH_CLIENT_ID,
            },
        });
        if (!res.ok) {
            console.error('[Twitch] Failed to get current user:', res.status);
            return null;
        }
        const data = await res.json();
        const userId = data?.data?.[0]?.id;
        console.log('[Twitch] Current user ID:', userId, 'login:', data?.data?.[0]?.login);
        return userId || null;
    } catch (err) {
        console.error('[Twitch] Error getting current user:', err);
        return null;
    }
}

/** Resolve a Twitch username to a user ID */
async function getTwitchUserIdByLogin(
    login: string,
    providerToken: string
): Promise<string | null> {
    try {
        const res = await fetch(
            `https://api.twitch.tv/helix/users?login=${encodeURIComponent(login)}`,
            {
                headers: {
                    'Authorization': `Bearer ${providerToken}`,
                    'Client-Id': TWITCH_CLIENT_ID,
                },
            }
        );
        if (!res.ok) {
            console.error('[Twitch] Failed to resolve user ID for', login, ':', res.status);
            return null;
        }
        const data = await res.json();
        return data?.data?.[0]?.id || null;
    } catch (err) {
        console.error('[Twitch] Error resolving user ID:', err);
        return null;
    }
}

/**
 * Check if the authenticated user is subscribed to GrenBaud's channel.
 * Only requires the providerToken — resolves all IDs automatically.
 */
export async function checkGrenbaudSubscription(
    providerToken: string
): Promise<{ isSubscribed: boolean; tier?: string }> {
    if (!TWITCH_CLIENT_ID) {
        console.error('[Twitch] VITE_TWITCH_CLIENT_ID not set — skipping sub check');
        // Fail open: allow registration if Client ID is not configured
        return { isSubscribed: true };
    }

    try {
        // 1. Resolve current user's Twitch ID
        const myTwitchId = await getMyTwitchId(providerToken);
        if (!myTwitchId) {
            console.error('[Twitch] Could not resolve current user Twitch ID');
            return { isSubscribed: false };
        }

        // 2. Resolve GrenBaud's broadcaster ID
        const broadcasterId = await getTwitchUserIdByLogin(GRENBAUD_CHANNEL, providerToken);
        if (!broadcasterId) {
            console.error('[Twitch] Could not resolve broadcaster ID for', GRENBAUD_CHANNEL);
            return { isSubscribed: false };
        }

        console.log('[Twitch] Checking sub: user', myTwitchId, 'broadcaster', broadcasterId);

        // 3. Check subscription
        const res = await fetch(
            `https://api.twitch.tv/helix/subscriptions/user?broadcaster_id=${broadcasterId}&user_id=${myTwitchId}`,
            {
                headers: {
                    'Authorization': `Bearer ${providerToken}`,
                    'Client-Id': TWITCH_CLIENT_ID,
                },
            }
        );

        if (res.status === 404) {
            // Not subscribed
            console.log('[Twitch] User is NOT subscribed');
            return { isSubscribed: false };
        }

        if (!res.ok) {
            const errText = await res.text();
            console.error('[Twitch] Sub check failed:', res.status, errText);
            return { isSubscribed: false };
        }

        const data = await res.json();
        const sub = data?.data?.[0];

        if (sub) {
            console.log('[Twitch] User IS subscribed! Tier:', sub.tier);
            return { isSubscribed: true, tier: sub.tier };
        }

        return { isSubscribed: false };
    } catch (err) {
        console.error('[Twitch] Exception checking subscription:', err);
        return { isSubscribed: false };
    }
}
