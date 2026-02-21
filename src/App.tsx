import React, { useState, useEffect, useCallback } from 'react';
import type { Profile, AppView } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import Landing from './components/Landing';
import Registration from './components/Registration';
import ProfileGrid from './components/ProfileGrid';
import AIMatch from './components/AIMatch';
import ProfileView from './components/ProfileView';
import Navbar from './components/Navbar';
import Inbox from './components/Chat/Inbox';
import ChatWindow from './components/Chat/ChatWindow';
import { subscribeToMessages, getTotalUnreadCount, markConversationRead } from './services/chatService';
import logoText from './assets/logo-text-v2.png';
import './index.css';
import './App.css';

type IntentModal = 'existing_account' | 'no_account' | null;

const AppContent: React.FC = () => {
  const { profile, isAuthenticated, loading, setProfile, signOut, mockLogin, isMockMode } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>('explore');
  const [intentModal, setIntentModal] = useState<IntentModal>(null);
  const [intentChecked, setIntentChecked] = useState(false);
  const [activeChatUser, setActiveChatUser] = useState<Profile | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [inboxRefreshTrigger, setInboxRefreshTrigger] = useState(0);
  const [localWarningDismissed, setLocalWarningDismissed] = useState(false);

  // Refresh unread count
  const refreshUnreadCount = useCallback(async () => {
    if (!profile?.twitch_id) return;
    const count = await getTotalUnreadCount(profile.twitch_id);
    setUnreadCount(count);
  }, [profile?.twitch_id]);

  // Global realtime subscription for unread badge
  useEffect(() => {
    if (!profile?.twitch_id || !profile?.is_registered) return;

    refreshUnreadCount();

    const unsubscribe = subscribeToMessages((newMsg) => {
      // Optimistic update for instant feedback
      if (profile?.twitch_id && newMsg.receiver_id === profile.twitch_id) {
        setUnreadCount(prev => prev + 1);
      }
      refreshUnreadCount();
    });

    // Adaptive Polling
    // Active: every 3s
    const activeInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshUnreadCount();
      }
    }, 3000);

    // Inactive: every 15s
    const inactiveInterval = setInterval(() => {
      if (document.visibilityState !== 'visible') {
        refreshUnreadCount();
      }
    }, 15000);

    return () => {
      unsubscribe();
      clearInterval(activeInterval);
      clearInterval(inactiveInterval);
    };
  }, [profile?.twitch_id, profile?.is_registered, refreshUnreadCount]);

  // Check auth intent after login
  useEffect(() => {
    if (!isAuthenticated || loading || intentChecked) return;

    const intent = localStorage.getItem('auth_intent');
    if (!intent) {
      setIntentChecked(true);
      return;
    }

    console.log('[APP] Auth intent:', intent, 'Profile:', profile?.display_name, 'Registered:', profile?.is_registered);

    if (intent === 'create' && profile?.is_registered) {
      // User clicked "Create" but already has an account
      setIntentModal('existing_account');
    } else if (intent === 'login' && (!profile || !profile.is_registered)) {
      // User clicked "Login" but has no account
      setIntentModal('no_account');
    }

    localStorage.removeItem('auth_intent');
    setIntentChecked(true);
  }, [isAuthenticated, loading, profile, intentChecked]);

  // Load discover profiles when authenticated
  // This useEffect is no longer needed as profiles state is removed and ProfileGrid handles its own data loading.
  // useEffect(() => {
  //   const loadProfiles = async () => {
  //     if (!isAuthenticated || !profile?.is_registered) return;

  //     setLoadingProfiles(true);
  //     try {
  //       if (isSupabaseConfigured && profile && session) {
  //         const discovered = await getDiscoverProfiles(profile.id);
  //         setProfiles(discovered);
  //       } else {
  //         setProfiles(MOCK_PROFILES);
  //       }
  //     } catch (err) {
  //       console.error('Error loading profiles:', err);
  //       setProfiles(MOCK_PROFILES);
  //     } finally {
  //       setLoadingProfiles(false);
  //     }
  //   };

  //   loadProfiles();
  // }, [isAuthenticated, profile]);

  // handleUseMockData is no longer needed as isDemoData state is removed.
  // const handleUseMockData = () => {
  //   console.log('[APP] Switching to Demo Mode with mock data');
  //   setIsDemoData(true);
  //   setProfiles(MOCK_PROFILES);
  // };

  // Handle login
  const handleLogin = () => {
    if (isMockMode) {
      mockLogin();
    }
    // Real Twitch login is handled by Landing.tsx directly
  };

  // Complete registration
  const handleRegistrationComplete = (profileData: Partial<Profile>) => {
    const newProfile: Profile = {
      id: profile?.id || '',
      twitch_id: profile?.twitch_id || '',
      twitch_username: profile?.twitch_username || '',
      display_name: '',
      avatar_url: '',
      bio: '',
      hobbies: '',
      music: '',
      music_artists: '',
      youtube: '',
      youtube_channels: '',
      twitch_watches: '',
      twitch_streamers: '',
      grenbaud_is: '',
      instagram: '',
      looking_for: '',
      zodiac_sign: '',
      photo_1: '',
      photo_2: '',
      photo_3: '',
      is_registered: true,
      created_at: new Date().toISOString(),
      ...profileData,
    };
    console.log('Registration complete, setting profile:', newProfile);
    setProfile(newProfile);
    setCurrentView('explore');
  };

  // Logout
  const handleLogout = async () => {
    await signOut();
    setCurrentView('explore');
    setIntentChecked(false);
    setActiveChatUser(null);
  };

  const handleOpenChat = (user: Profile) => {
    setActiveChatUser(user);
    if (profile) {
      markConversationRead(profile.twitch_id, user.twitch_id);
      refreshUnreadCount();
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="app-loading" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg-dark)',
        color: 'white'
      }}>
        <div className="landing-logo-glow" style={{ width: '80px', height: '80px', marginBottom: '20px' }} />
        <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Baudr</h1>
        <div className="loading-spinner" style={{
          width: '30px',
          height: '30px',
          border: '3px solid rgba(255,255,255,0.1)',
          borderTop: '3px solid var(--primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  // Not authenticated → Landing
  if (!isAuthenticated) {
    return <Landing onLogin={handleLogin} />;
  }

  // === Intent Modals ===

  // User clicked "Create" but already has an account
  if (intentModal === 'existing_account') {
    return (
      <div className="intent-modal-overlay">
        <div className="intent-modal">
          <div className="intent-modal-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-light)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
          </div>
          <h2>Account già esistente</h2>
          <p>
            Esiste già un account collegato a questo profilo Twitch
            {profile?.display_name ? ` (${profile.display_name})` : ''}.
          </p>
          <p style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '8px' }}>
            Vuoi accedere al tuo account?
          </p>
          <div className="intent-modal-actions">
            <button
              className="btn btn-primary"
              onClick={() => setIntentModal(null)}
            >
              Sì, accedi 💜
            </button>
            <button
              className="btn btn-secondary"
              onClick={async () => {
                setIntentModal(null);
                await signOut();
              }}
              style={{ opacity: 0.7 }}
            >
              No, esci
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User clicked "Login" but has no account
  if (intentModal === 'no_account') {
    return (
      <div className="intent-modal-overlay">
        <div className="intent-modal">
          <div className="intent-modal-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-light)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          </div>
          <h2>Nessun account trovato</h2>
          <p>
            Non abbiamo trovato un account collegato a questo profilo Twitch.
          </p>
          <p style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '8px' }}>
            Vuoi crearne uno adesso?
          </p>
          <div className="intent-modal-actions">
            <button
              className="btn btn-primary"
              onClick={() => setIntentModal(null)}
            >
              Sì, crea account ✨
            </button>
            <button
              className="btn btn-secondary"
              onClick={async () => {
                setIntentModal(null);
                await signOut();
              }}
              style={{ opacity: 0.7 }}
            >
              No, esci
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated but not registered OR no profile (New User) → Registration
  if (!profile || !profile.is_registered) {
    return <Registration onComplete={handleRegistrationComplete} />;
  }

  // --- MODERATION BLOCKS ---
  if (profile?.is_banned) {
    return (
      <div className="app-container" style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#450a0a', color: '#fca5a5', padding: '20px', textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '10px' }}>🚫 Account Sospeso</h1>
        <p style={{ fontSize: '1.2rem', maxWidth: '500px' }}>Il tuo account è stato bloccato in modo permanente dai moderatori.</p>

        {profile?.ban_reason && (
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '10px', marginTop: '20px', maxWidth: '500px' }}>
            <strong>Motivo del ban:</strong>
            <p style={{ marginTop: '10px', color: 'white' }}>{profile.ban_reason}</p>
          </div>
        )}
        <button className="btn btn-secondary" onClick={handleLogout} style={{ marginTop: '30px', border: '1px solid #7f1d1d', background: 'transparent', color: '#fca5a5' }}>
          Torna alla Home
        </button>
      </div>
    );
  }

  // Warning Overlay Logic
  const showWarning = profile?.warning_message && !localWarningDismissed;

  if (showWarning) {
    return (
      <div className="warning-overlay" style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 99999,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
      }}>
        <div style={{
          background: '#451a03', border: '1px solid #b45309', borderRadius: '16px',
          padding: '40px', maxWidth: '500px', textAlign: 'center', color: '#fcd34d'
        }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '1.8rem' }}>⚠️ Avviso di Moderazione</h2>
          <p style={{ lineHeight: 1.5, fontSize: '1.1rem', color: 'white' }}>{profile.warning_message}</p>
          <div style={{ marginTop: '30px', fontSize: '0.9rem', color: '#d97706' }}>
            Continuando a usare Baudr, accetti di rispettare le nostre regole. Violazioni ripetute porteranno al ban definitivo.
          </div>
          <button
            className="btn btn-primary"
            style={{ marginTop: '30px', background: '#d97706', border: 'none', padding: '12px 30px', fontSize: '1.1rem' }}
            onClick={async () => {
              try {
                const { supabase } = await import('./lib/supabase');
                await supabase.rpc('acknowledge_warning');
                setLocalWarningDismissed(true);
                setProfile({ ...profile, warning_message: null });
              } catch (e) {
                console.error('Failed to acknowledge warning', e);
                setLocalWarningDismissed(true);
              }
            }}
          >
            Ho capito, continua
          </button>
        </div>
      </div>
    );
  }

  // Main app
  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <img
          src={logoText}
          alt="Baudr"
          className="app-logo-img"
        />
      </header>

      {/* Main Content */}
      <main className="app-main">
        <div className="main-spotlight" />
        {currentView === 'explore' && (
          <ProfileGrid currentUser={profile} onOpenChat={handleOpenChat} />
        )}
        {currentView === 'aimatch' && (
          <AIMatch currentUser={profile} onOpenChat={handleOpenChat} />
        )}
        {currentView === 'matches' && (
          <div className="matches-page">
            <div className="matches-empty">
              <div className="matches-empty-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-light)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
              </div>
              <h3>I tuoi Match</h3>
              <p>Quando trovi un match apparirà qui!</p>
              <p className="matches-hint">Continua a swipare per trovare la tua anima gemella nella community</p>
            </div>
          </div>
        )}
        {currentView === 'profile' && (
          <div className="profile-page-wrapper" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            {activeChatUser && (
              <button
                className="btn-back"
                onClick={() => setCurrentView('chat')}
                style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                ← Torna alla chat
              </button>
            )}
            <ProfileView
              profile={activeChatUser && currentView === 'profile' ? activeChatUser : profile}
              currentUser={profile}
              readOnly={!!activeChatUser}
              onLogout={handleLogout}
            />
          </div>
        )}
        {currentView === 'chat' && (
          <Inbox currentUser={profile} onSelectChat={handleOpenChat} refreshTrigger={inboxRefreshTrigger} />
        )}
      </main>

      {/* Global Chat Overlay */}
      {activeChatUser && currentView !== 'profile' && (
        <ChatWindow
          currentUser={{ ...profile, id: profile.id }}
          otherUser={activeChatUser}
          onClose={() => {
            setActiveChatUser(null);
            refreshUnreadCount();
            setInboxRefreshTrigger(prev => prev + 1); // Force Inbox reload
          }}
          onNewMessage={refreshUnreadCount}
          onOpenProfile={() => setCurrentView('profile')}
        />
      )}

      {/* Bottom navbar */}
      <Navbar currentView={currentView} onNavigate={setCurrentView} unreadCount={unreadCount} />
      <div style={{ position: 'fixed', bottom: '80px', right: '10px', fontSize: '10px', opacity: 0.8, zIndex: 9999, pointerEvents: 'none', textShadow: '0 1px 2px black' }}>v0.2.3-fix</div>
    </div>
  );
};

import PremiumBackground from './components/PremiumBackground';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <PremiumBackground />
      <AppContent />
    </AuthProvider>
  );
};

export default App;
