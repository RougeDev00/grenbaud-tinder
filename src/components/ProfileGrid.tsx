import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Profile } from '../types';
import { getGridProfiles, getTotalProfileCount, getProfile, searchGridProfiles } from '../services/profileService';
import { supabase } from '../lib/supabase';
import { generateMockProfiles } from '../lib/mockData';
import { geocodeCity, haversineDistance } from '../utils/geo';
import { calculateCompatibility } from '../utils/compatibility';
import { getCompatibilityCacheKey, getCachedCompatibility } from '../services/aiService';

import ProfileCard from './ProfileCard';
import ProfileView from './ProfileView';
import './ProfileGrid.css';

interface ProfileGridProps {
    currentUser: Profile;
    onOpenChat?: (user: Profile) => void;
    onMatchDetected?: (matchedProfile: Profile) => void;
}

type GenderFilter = 'all' | 'M' | 'F' | 'NS';
type AffinityType = 'all' | 'confirmed' | 'estimated';

/**
 * LazyCard — renders a ProfileCard only when near the viewport using IntersectionObserver.
 * Cards far from viewport show a lightweight placeholder instead.
 */
const LazyCard: React.FC<{
    profile: Profile;
    currentUser: Profile;
    matchScore: number | null;
    isEstimated: boolean;
    onOpenProfile: () => void;
    index: number;
    skipAnimation: boolean;
    columns: number;
}> = React.memo(({ profile, currentUser, matchScore, isEstimated, onOpenProfile, index, skipAnimation, columns }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect(); // Once visible, stay rendered
                }
            },
            { rootMargin: '600px' } // Start loading 600px before visible
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const colIndex = index % columns;
    const isLeftHalf = colIndex < columns / 2;
    const slideDir = isLeftHalf ? 1 : -1;

    return (
        <div
            ref={ref}
            className={`grid-card-wrapper ${skipAnimation ? 'grid-card-no-anim' : ''}`}
            style={skipAnimation ? undefined : {
                '--animation-order': index,
                '--slide-dir': slideDir,
                'animationDelay': `${Math.min(index * 0.04, 0.8)}s`
            } as React.CSSProperties}
        >
            {isVisible ? (
                <ProfileCard
                    profile={profile}
                    currentUser={currentUser}
                    onOpenProfile={onOpenProfile}
                    matchScore={matchScore}
                    isEstimated={isEstimated}
                />
            ) : (
                <div className="grid-card-placeholder" />
            )}
        </div>
    );
});

const ProfileGrid: React.FC<ProfileGridProps> = ({ currentUser, onOpenChat, onMatchDetected }) => {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [mockProfiles, setMockProfiles] = useState<Profile[]>([]);
    const [isDemo] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
    const [searchParams, setSearchParams] = useSearchParams();

    // Responsive columns tracking for animations
    const gridRef = useRef<HTMLDivElement>(null);
    const [columns, setColumns] = useState(5);

    // True DB pagination
    const PAGE_SIZE = 30;
    const dbPageRef = useRef(0);
    const hasMoreRef = useRef(true);
    const loadingMoreRef = useRef(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const sentinelRef = useRef<HTMLDivElement>(null);

    // Track how many cards have been initially loaded (to skip animation for later ones)
    const initialLoadCountRef = useRef(0);

    // Draft filter state (what user edits in the panel)
    const [searchQuery, setSearchQuery] = useState('');
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [draftGender, setDraftGender] = useState<GenderFilter>('all');
    const [draftAgeMin, setDraftAgeMin] = useState('');
    const [draftAgeMax, setDraftAgeMax] = useState('');
    const [draftCity, setDraftCity] = useState('');
    const [draftCityKm, setDraftCityKm] = useState('50');
    const [draftKeyword, setDraftKeyword] = useState('');
    const [draftAffinity, setDraftAffinity] = useState<AffinityType>('all');

    // Applied filter state (what actually filters)
    const [genderFilter, setGenderFilter] = useState<GenderFilter>('all');
    const [ageMin, setAgeMin] = useState('');
    const [ageMax, setAgeMax] = useState('');
    const [cityFilter, setCityFilter] = useState('');
    const [cityKm, setCityKm] = useState('50');
    const [keywordFilter, setKeywordFilter] = useState('');
    const [affinityFilter, setAffinityFilter] = useState<AffinityType>('all');

    // Geo distance state
    const [profileDistances, setProfileDistances] = useState<Map<string, number>>(new Map());

    // Confirmed compatibility IDs (from DB)
    const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());

    // Total count from DB
    const [totalCount, setTotalCount] = useState<number>(0);

    // ── Batch compatibility scores ──
    // Pre-compute all scores once and pass to cards as props
    const compatibilityScores = useMemo(() => {
        const source = isDemo ? mockProfiles : profiles;
        const scores = new Map<string, { score: number; isEstimated: boolean }>();

        for (const profile of source) {
            // Check local storage cache first (AI-confirmed)
            const cacheKey = getCompatibilityCacheKey(currentUser.id, profile.id);
            const cached = getCachedCompatibility(cacheKey);

            if (cached) {
                scores.set(profile.id, { score: cached.score, isEstimated: false });
            } else {
                // Calculate estimated score
                const estimated = calculateCompatibility(currentUser, profile);
                scores.set(profile.id, { score: estimated, isEstimated: true });
            }
        }

        return scores;
    }, [profiles, mockProfiles, isDemo, currentUser]);

    // Load first page + total count
    useEffect(() => {
        const fetchProfiles = async () => {
            setLoading(true);
            try {
                const [data, count] = await Promise.all([
                    getGridProfiles(currentUser.twitch_id, 0, PAGE_SIZE),
                    getTotalProfileCount(currentUser.twitch_id)
                ]);
                setProfiles(data);
                setTotalCount(count);
                initialLoadCountRef.current = data.length;
                const more = data.length >= PAGE_SIZE;
                hasMoreRef.current = more;
                dbPageRef.current = 1;
            } catch (err) {
                console.error('Error loading grid:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfiles();

        // Fetch confirmed compatibility IDs
        const fetchConfirmed = async () => {
            try {
                const { data } = await supabase
                    .from('compatibility_scores')
                    .select('user_a, user_b')
                    .or(`user_a.eq.${currentUser.id},user_b.eq.${currentUser.id}`);
                if (data) {
                    const ids = new Set<string>();
                    data.forEach((row: any) => {
                        if (row.user_a === currentUser.id) ids.add(row.user_b);
                        else ids.add(row.user_a);
                    });
                    setConfirmedIds(ids);
                }
            } catch (err) {
                console.error('Error fetching confirmed IDs:', err);
            }
        };
        fetchConfirmed();
    }, [currentUser.twitch_id]);

    // Realtime: listen for new/updated profiles — THROTTLED to batch updates
    useEffect(() => {
        let pendingUpdates: any[] = [];
        let flushTimer: number | null = null;

        const flushUpdates = () => {
            if (pendingUpdates.length === 0) return;

            const updates = [...pendingUpdates];
            pendingUpdates = [];

            setProfiles(prev => {
                let next = [...prev];
                for (const payload of updates) {
                    if (payload.eventType === 'INSERT') {
                        const newProfile = payload.new as Profile;
                        if (newProfile.twitch_id !== currentUser.twitch_id) {
                            if (!next.some(p => p.id === newProfile.id)) {
                                next = [newProfile, ...next];
                            }
                        }
                    } else if (payload.eventType === 'UPDATE') {
                        const updated = payload.new as Profile;
                        next = next.map(p => p.id === updated.id ? { ...p, ...updated } : p);
                    } else if (payload.eventType === 'DELETE') {
                        const deleted = payload.old as { id: string };
                        next = next.filter(p => p.id !== deleted.id);
                    }
                }
                return next;
            });

            // Update total count
            const inserts = updates.filter(u => u.eventType === 'INSERT').length;
            const deletes = updates.filter(u => u.eventType === 'DELETE').length;
            if (inserts || deletes) {
                setTotalCount(prev => Math.max(0, prev + inserts - deletes));
            }
        };

        const channel = supabase
            .channel('grid-profiles-realtime')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'profiles',
                filter: 'is_registered=eq.true'
            }, (payload: any) => {
                pendingUpdates.push(payload);
                // Throttle: flush updates every 2 seconds
                if (!flushTimer) {
                    flushTimer = window.setTimeout(() => {
                        flushTimer = null;
                        flushUpdates();
                    }, 2000);
                }
            })
            .subscribe();

        return () => {
            if (flushTimer) clearTimeout(flushTimer);
            supabase.removeChannel(channel);
        };
    }, [currentUser.twitch_id]);

    // Load more — uses refs to avoid stale closures
    const loadMore = useCallback(async () => {
        if (loadingMoreRef.current || !hasMoreRef.current) return;
        loadingMoreRef.current = true;
        setLoadingMore(true);
        try {
            const page = dbPageRef.current;
            const data = await getGridProfiles(currentUser.twitch_id, page, PAGE_SIZE);
            if (data.length < PAGE_SIZE) {
                hasMoreRef.current = false;
            }
            setProfiles(prev => {
                const existingIds = new Set(prev.map(p => p.id));
                const newProfiles = data.filter(p => !existingIds.has(p.id));
                return [...prev, ...newProfiles];
            });
            dbPageRef.current = page + 1;
        } catch (err) {
            console.error('Error loading more profiles:', err);
        } finally {
            loadingMoreRef.current = false;
            setLoadingMore(false);
        }
    }, [currentUser.twitch_id]);

    // Keep a ref to loadMore so observer always has the latest
    const loadMoreRef = useRef(loadMore);
    loadMoreRef.current = loadMore;

    // Fetch full profile (with all photos/data) before opening detail view
    const openFullProfile = useCallback(async (slimProfile: Profile) => {
        // Try to fetch full profile from DB
        const full = await getProfile(slimProfile.id);
        setSelectedProfile(full || slimProfile);
    }, []);

    // Handle deep linking from SPY notifications
    useEffect(() => {
        const profileId = searchParams.get('profile');
        if (!profileId) return;

        const openDeepLinkedProfile = async () => {
            // Try loaded profiles first
            const source = isDemo ? mockProfiles : profiles;
            let target = source.find(p => p.id === profileId);

            // If not in loaded list, fetch directly from DB
            if (!target && !isDemo) {
                try {
                    const fetched = await getProfile(profileId);
                    if (fetched) target = fetched;
                } catch (err) {
                    console.error('Error fetching deep-linked profile:', err);
                }
            }

            if (target) {
                openFullProfile(target);
            }
            // Clear the parameter
            searchParams.delete('profile');
            setSearchParams(searchParams, { replace: true });
        };

        openDeepLinkedProfile();
    }, [searchParams, profiles, mockProfiles, isDemo, setSearchParams, openFullProfile]);

    // Geocode when applied city filter changes
    const computeDistances = useCallback(async (city: string, source: Profile[]) => {
        if (!city.trim()) {
            setProfileDistances(new Map());
            return;
        }

        try {
            const originCoord = await geocodeCity(city);
            if (!originCoord) {
                setProfileDistances(new Map());
                return;
            }
            const distances = new Map<string, number>();
            const uniqueCities = [...new Set(source.map(p => (p.city || '').trim()).filter(Boolean))];
            const cityCoords = new Map<string, { lat: number; lng: number } | null>();
            await Promise.all(uniqueCities.map(async (c) => {
                const coord = await geocodeCity(c);
                cityCoords.set(c.toLowerCase(), coord);
            }));
            for (const p of source) {
                const pCity = (p.city || '').trim().toLowerCase();
                if (!pCity) continue;
                const pCoord = cityCoords.get(pCity);
                if (pCoord) {
                    distances.set(p.id, haversineDistance(originCoord, pCoord));
                }
            }
            setProfileDistances(distances);
        } catch (err) {
            console.warn('[Geo] Distance computation failed:', err);
        }
    }, []);

    // Track grid columns for edge animation
    useEffect(() => {
        if (!gridRef.current) return;

        const observer = new ResizeObserver(entries => {
            const grid = entries[0].target as HTMLDivElement;
            const style = window.getComputedStyle(grid);
            const gridColumns = style.getPropertyValue('grid-template-columns').trim().split(/\s+/).length;
            setColumns(gridColumns || 5);
        });

        observer.observe(gridRef.current);
        return () => observer.disconnect();
    }, []);

    // Geocode only when applied city filter changes
    useEffect(() => {
        const source = isDemo ? mockProfiles : profiles;
        computeDistances(cityFilter, source);
    }, [cityFilter, profiles, mockProfiles, isDemo, computeDistances]);

    // Apply filters button handler
    const applyFilters = () => {
        setGenderFilter(draftGender);
        setAgeMin(draftAgeMin);
        setAgeMax(draftAgeMax);
        setCityFilter(draftCity);
        setCityKm(draftCityKm);
        setKeywordFilter(draftKeyword);
        setAffinityFilter(draftAffinity);
        setFiltersOpen(false);

        // If in demo mode, regenerate the profiles to apply the new logic (like ages)
        if (isDemo) {
            setMockProfiles(generateMockProfiles(100));
        }
    };

    // ── Server-side search when filters or search are active ──
    const [searchResults, setSearchResults] = useState<Profile[] | null>(null);
    const [, setSearching] = useState(false);

    const hasActiveFilters = searchQuery.trim() !== '' ||
        genderFilter !== 'all' || ageMin !== '' || ageMax !== '' ||
        cityFilter !== '' || keywordFilter !== '' || affinityFilter !== 'all';

    useEffect(() => {
        if (!hasActiveFilters) {
            setSearchResults(null);
            return;
        }

        // Debounce for search query
        const timer = setTimeout(async () => {
            setSearching(true);
            try {
                const results = await searchGridProfiles(currentUser.twitch_id, {
                    search: searchQuery.trim() || undefined,
                    gender: genderFilter !== 'all' ? genderFilter : undefined,
                    ageMin: ageMin ? parseInt(ageMin) : undefined,
                    ageMax: ageMax ? parseInt(ageMax) : undefined,
                    city: cityFilter.trim() || undefined,
                    keyword: keywordFilter.trim() || undefined,
                });
                setSearchResults(results);
            } catch (err) {
                console.error('Error in server-side search:', err);
            } finally {
                setSearching(false);
            }
        }, searchQuery.trim() ? 300 : 0); // debounce only for text search

        return () => clearTimeout(timer);
    }, [searchQuery, genderFilter, ageMin, ageMax, cityFilter, keywordFilter, currentUser.twitch_id, hasActiveFilters]);

    // Count active APPLIED filters
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (genderFilter !== 'all') count++;
        if (ageMin) count++;
        if (ageMax) count++;
        if (cityFilter) count++;
        if (keywordFilter) count++;
        if (affinityFilter !== 'all') count++;
        return count;
    }, [genderFilter, ageMin, ageMax, cityFilter, keywordFilter]);

    // Check if drafts differ from applied


    // Apply filters — use server results when filters active, else paginated profiles
    const filteredProfiles = useMemo(() => {
        // When filters are active and we have server results, use those
        const source = hasActiveFilters && searchResults !== null
            ? searchResults
            : (isDemo ? mockProfiles : profiles);

        return source.filter(p => {
            // Affinity type filter (client-side only — needs confirmedIds)
            if (affinityFilter !== 'all') {
                const isConfirmed = confirmedIds.has(p.id);
                if (affinityFilter === 'confirmed' && !isConfirmed) return false;
                if (affinityFilter === 'estimated' && isConfirmed) return false;
            }

            // City / Distance filter (client-side for geo distance)
            if (cityFilter.trim() && profileDistances.size > 0) {
                const kmMax = parseInt(cityKm) || 50;
                const dist = profileDistances.get(p.id);
                if (dist === undefined || dist > kmMax) return false;
            }

            return true;
        });
    }, [profiles, mockProfiles, isDemo, searchResults, hasActiveFilters, genderFilter, ageMin, ageMax, cityFilter, cityKm, keywordFilter, affinityFilter, profileDistances, confirmedIds, currentUser.id, searchQuery]);

    // Infinite scroll — re-create observer after loading finishes (sentinel appears)
    useEffect(() => {
        if (loading) return; // sentinel not in DOM yet

        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadMoreRef.current();
                }
            },
            { rootMargin: '800px' }
        );

        observer.observe(sentinel);

        // Scroll-event fallback for trackpad/mobile
        const handleScroll = () => {
            const scrollY = window.scrollY + window.innerHeight;
            const docHeight = document.documentElement.scrollHeight;
            if (docHeight - scrollY < 1200) {
                loadMoreRef.current();
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            observer.disconnect();
            window.removeEventListener('scroll', handleScroll);
        };
    }, [loading]); // re-run when loading finishes

    const clearFilters = () => {
        // Reset drafts
        setDraftGender('all');
        setDraftAgeMin('');
        setDraftAgeMax('');
        setDraftCity('');
        setDraftCityKm('50');
        setDraftKeyword('');
        // Reset applied
        setGenderFilter('all');
        setAgeMin('');
        setAgeMax('');
        setCityFilter('');
        setCityKm('50');
        setKeywordFilter('');
        setAffinityFilter('all');
        setDraftAffinity('all');
    };

    if (loading) {
        return (
            <div className="grid-loading">
                <div className="loading-spinner" />
                <p>Caricamento community...</p>
            </div>
        );
    }

    if (selectedProfile) {
        return (
            <div className="profile-detail-view animate-fade-in">
                <button className="btn-back" onClick={() => setSelectedProfile(null)}>
                    <div className="btn-back-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                    </div>
                    <span>Torna alla griglia</span>
                </button>
                <ProfileView
                    profile={selectedProfile}
                    currentUser={currentUser}
                    readOnly
                    onOpenChat={() => onOpenChat?.(selectedProfile)}
                    onMatchDetected={onMatchDetected}
                />
            </div>
        );
    }

    const title = isDemo ? `Demo Mode` : `Scopri Tutti`;

    return (
        <div className="profile-grid-container animate-fade-in">
            {/* Header */}
            <div className="grid-header">
                <h2 className="grid-title">{title}</h2>
            </div>

            {/* Search Bar */}
            <div className="search-bar">
                <div className="search-bar-input-wrap">
                    <svg className="search-bar-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        type="text"
                        className="search-bar-input"
                        placeholder="Cerca per username Twitch..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button className="search-clear" onClick={() => setSearchQuery('')}>✕</button>
                    )}
                </div>

                <button
                    className={`filter-toggle ${filtersOpen ? 'filter-toggle--open' : ''} ${activeFilterCount > 0 ? 'filter-toggle--active' : ''}`}
                    onClick={() => setFiltersOpen(!filtersOpen)}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="20" y2="12" /><line x1="12" y1="18" x2="20" y2="18" />
                    </svg>
                    Filtri
                    {activeFilterCount > 0 && (
                        <span className="filter-count">{activeFilterCount}</span>
                    )}
                </button>
            </div>

            {/* Filters Panel */}
            <div className={`filter-panel ${filtersOpen ? 'filter-panel--open' : ''}`}>
                <div className="filter-panel-inner">
                    <div className="filter-row">
                        {/* Gender */}
                        <div className="filter-group">
                            <label className="filter-label">Genere</label>
                            <div className="filter-chips">
                                {([
                                    ['all', 'Tutti'],
                                    ['M', '♂ Maschio'],
                                    ['F', '♀ Femmina'],
                                    ['NS', '⚪ N/S'],
                                ] as [GenderFilter, string][]).map(([val, lab]) => (
                                    <button
                                        key={val}
                                        className={`filter-chip ${draftGender === val ? 'filter-chip--active' : ''}`}
                                        onClick={() => setDraftGender(val)}
                                    >
                                        {lab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Affinity Type */}
                        <div className="filter-group">
                            <label className="filter-label">Tipo Affinità</label>
                            <div className="filter-chips">
                                {([
                                    ['all', 'Tutti'],
                                    ['confirmed', '✨ Completa'],
                                    ['estimated', '⏳ Provvisoria'],
                                ] as [AffinityType, string][]).map(([val, lab]) => (
                                    <button
                                        key={val}
                                        className={`filter-chip ${draftAffinity === val ? 'filter-chip--active' : ''}`}
                                        onClick={() => setDraftAffinity(val)}
                                    >
                                        {lab}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="filter-row">
                        {/* Age */}
                        <div className="filter-group">
                            <label className="filter-label">Età</label>
                            <div className="filter-age-row">
                                <input
                                    type="number"
                                    className="filter-input filter-input--age"
                                    placeholder="Min"
                                    value={draftAgeMin}
                                    onChange={e => setDraftAgeMin(e.target.value)}
                                    min="13"
                                    max="99"
                                />
                                <span className="filter-age-sep">—</span>
                                <input
                                    type="number"
                                    className="filter-input filter-input--age"
                                    placeholder="Max"
                                    value={draftAgeMax}
                                    onChange={e => setDraftAgeMax(e.target.value)}
                                    min="13"
                                    max="99"
                                />
                            </div>
                        </div>

                        {/* City + Distance */}
                        <div className="filter-group">
                            <label className="filter-label">Città + Raggio</label>
                            <input
                                type="text"
                                className="filter-input"
                                placeholder="es. Milano, Roma..."
                                value={draftCity}
                                onChange={e => setDraftCity(e.target.value)}
                            />
                            {draftCity.trim() && (
                                <div className="filter-km-row">
                                    <input
                                        type="range"
                                        className="filter-km-slider"
                                        min="5"
                                        max="200"
                                        step="5"
                                        value={draftCityKm}
                                        onChange={e => setDraftCityKm(e.target.value)}
                                    />
                                    <span className="filter-km-value">{draftCityKm} km</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Keywords */}
                    <div className="filter-group">
                        <label className="filter-label">Parole chiave</label>
                        <input
                            type="text"
                            className="filter-input"
                            placeholder="es. Fortnite, Nayt, musica..."
                            value={draftKeyword}
                            onChange={e => setDraftKeyword(e.target.value)}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="filter-actions">
                        <button className="filter-clear-btn" onClick={clearFilters}>
                            ✕ Reset
                        </button>
                        <button className="filter-apply-btn" onClick={applyFilters}>
                            ✓ Applica Filtri
                        </button>
                    </div>
                </div>
            </div>

            {/* Results count */}
            <div className="grid-results-count">
                {filteredProfiles.length} {filteredProfiles.length === 1 ? 'profilo' : 'profili'}
                {totalCount > 0 && (
                    <span> su {totalCount}</span>
                )}
            </div>

            {/* Grid */}
            <div className="profile-grid" ref={gridRef}>
                {filteredProfiles.map((profile, index) => {
                    const scoreData = compatibilityScores.get(profile.id);
                    return (
                        <LazyCard
                            key={profile.id}
                            profile={profile}
                            currentUser={currentUser}
                            matchScore={scoreData?.score ?? null}
                            isEstimated={scoreData?.isEstimated ?? true}
                            onOpenProfile={() => openFullProfile(profile)}
                            index={index}
                            skipAnimation={index >= initialLoadCountRef.current}
                            columns={columns}
                        />
                    );
                })}
            </div>

            {/* Infinite scroll sentinel — always in DOM for observer */}
            <div ref={sentinelRef} className="grid-load-more" style={{ minHeight: 1 }}>
                {loadingMore && <div className="loading-spinner" style={{ width: 24, height: 24 }} />}
            </div>

            {filteredProfiles.length === 0 && (
                <div className="grid-empty">
                    <div className="grid-empty-icon">🔍</div>
                    <p>Nessun profilo trovato con questi filtri</p>
                    {activeFilterCount > 0 && (
                        <button className="filter-clear-btn" onClick={clearFilters} style={{ marginTop: 12 }}>
                            Cancella filtri
                        </button>
                    )}
                </div>
            )}


        </div>
    );
};

export default ProfileGrid;
