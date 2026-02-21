import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { CURRENT_MOCK_USER } from '../lib/mockData';
import type { Profile } from '../types';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: Profile | null;
    loading: boolean;
    isAuthenticated: boolean;
    isMockMode: boolean;
    signInWithTwitch: () => Promise<void>;
    signOut: () => Promise<void>;
    setProfile: (profile: Profile) => void;
    // Mock mode helpers
    mockLogin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// Raw fetch to load profile — bypasses Supabase JS client which hangs
async function fetchProfileRaw(twitchId: string, accessToken: string): Promise<Profile | null> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
        const res = await fetch(
            `${supabaseUrl}/rest/v1/profiles?twitch_id=eq.${twitchId}&select=*`,
            {
                method: 'GET',
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${accessToken}`,
                },
                signal: controller.signal,
            }
        );
        clearTimeout(timeoutId);

        if (!res.ok) {
            console.error('[AUTH] Profile fetch error:', res.status, await res.text());
            return null;
        }

        const data = await res.json();
        console.log('[AUTH] Profile fetch result:', data?.length, 'rows');
        if (Array.isArray(data) && data.length > 0) {
            return data[0] as Profile;
        }
        return null;
    } catch (err) {
        clearTimeout(timeoutId);
        console.error('[AUTH] Profile fetch failed:', err);
        return null;
    }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isMockMode] = useState(!isSupabaseConfigured);

    // Initialize: check existing session
    useEffect(() => {
        const initAuth = async () => {
            console.log('initAuth started. URL Hash:', window.location.hash);
            if (!isSupabaseConfigured) {
                setLoading(false);
                return;
            }

            try {
                // Get current session
                const { data: { session: currentSession }, error } = await supabase.auth.getSession();
                console.log('getSession result:', { currentSession: !!currentSession, error });

                if (currentSession) {
                    setSession(currentSession);
                    setUser(currentSession.user);

                    // Load profile via raw fetch — bypasses Supabase JS client hang
                    console.log('[AUTH] Loading profile for:', currentSession.user.id);
                    const userProfile = await fetchProfileRaw(
                        currentSession.user.id,
                        currentSession.access_token
                    );
                    if (userProfile) {
                        console.log('[AUTH] Profile loaded:', userProfile.display_name, 'registered:', userProfile.is_registered);
                        // Check for broken blob: photo URLs — force re-registration to upload real photos
                        const hasBlobPhotos = [userProfile.photo_1, userProfile.photo_2, userProfile.photo_3]
                            .some(url => url && url.startsWith('blob:'));
                        if (hasBlobPhotos) {
                            console.log('[AUTH] Profile has blob: photo URLs — forcing hard reset as requested');
                            userProfile.is_registered = false;

                            // WIPE EVERYTHING to give user a fresh start
                            userProfile.photo_1 = '';
                            userProfile.photo_2 = '';
                            userProfile.photo_3 = '';
                            userProfile.bio = '';
                            userProfile.hobbies = '';
                            userProfile.music = '';
                            userProfile.youtube = '';
                            userProfile.twitch_watches = '';
                            userProfile.zodiac_sign = '';
                            userProfile.grenbaud_is = '';
                            // Keep display_name and twitch info as they are identity-related, 
                            // but user can edit display_name in the form if they want.
                            // Actually user said "elimina i dati", so let's clear display_name too (except from twitch metadata default)
                            userProfile.display_name = '';
                        }
                        setProfile(userProfile);
                    } else {
                        console.log('[AUTH] No profile found — will show registration');
                    }
                }
            } catch (err) {
                console.error('Auth init error:', err);
            } finally {
                setLoading(false);
            }
        };

        // Safety timeout — never stay on loading for more than 4 seconds
        const timeout = setTimeout(() => {
            console.log('Auth timeout reached, forcing loading false');
            setLoading(false);
        }, 4000);

        initAuth().then(() => clearTimeout(timeout));

        // Listen for auth changes
        if (isSupabaseConfigured) {
            const { data: { subscription } } = supabase.auth.onAuthStateChange(
                async (event, newSession) => {
                    console.log('Auth state changed:', event, newSession?.user?.id);
                    setSession(newSession);
                    setUser(newSession?.user ?? null);

                    if (newSession?.user) {
                        const userProfile = await fetchProfileRaw(
                            newSession.user.id,
                            newSession.access_token
                        );
                        setProfile(userProfile);
                    } else {
                        setProfile(null);
                    }
                }
            );

            return () => subscription.unsubscribe();
        }
    }, []);

    // Sign in with Twitch OAuth
    const signInWithTwitch = async () => {
        if (!isSupabaseConfigured) {
            console.warn('Supabase not configured. Use mockLogin() instead.');
            return;
        }

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'twitch',
            options: {
                redirectTo: window.location.origin,
            },
        });

        if (error) {
            console.error('Login error:', error);
        }
    };

    // Sign out
    const signOut = async () => {
        if (!isSupabaseConfigured) {
            setUser(null);
            setSession(null);
            setProfile(null);
            return;
        }

        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setProfile(null);
    };

    // Mock login (for development without Supabase)
    const mockLogin = () => {
        setProfile({ ...CURRENT_MOCK_USER });
    };

    const isAuthenticated = isMockMode ? profile !== null : !!session;

    const value: AuthContextType = {
        user,
        session,
        profile,
        loading,
        isAuthenticated,
        isMockMode,
        signInWithTwitch,
        signOut,
        setProfile,
        mockLogin,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
