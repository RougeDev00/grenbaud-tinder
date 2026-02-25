import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Profile } from '../types';
import { getGridProfiles, getTotalProfileCount } from '../services/profileService';
import { supabase } from '../lib/supabase';
import { generateMockProfiles } from '../lib/mockData';
import { geocodeCity, haversineDistance } from '../utils/geo';
import { getCompatibilityCacheKey } from '../services/aiService';
import ProfileCard from './ProfileCard';
import ProfileView from './ProfileView';
import './ProfileGrid.css';

interface ProfileGridProps {
    currentUser: Profile;
    onOpenChat?: (user: Profile) => void;
}

type GenderFilter = 'all' | 'M' | 'F' | 'NS';
type AffinityType = 'all' | 'confirmed' | 'estimated';

const ProfileGrid: React.FC<ProfileGridProps> = ({ currentUser, onOpenChat }) => {
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
    const [dbPage, setDbPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const sentinelRef = useRef<HTMLDivElement>(null);

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

    // Total count from DB
    const [totalCount, setTotalCount] = useState<number>(0);

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
                setHasMore(data.length >= PAGE_SIZE);
                setDbPage(1);
            } catch (err) {
                console.error('Error loading grid:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfiles();
    }, [currentUser.twitch_id]);

    // Realtime: listen for new/updated profiles to keep cache fresh
    useEffect(() => {
        const channel = supabase
            .channel('grid-profiles-realtime')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'profiles',
                filter: 'is_registered=eq.true'
            }, (payload: any) => {
                if (payload.eventType === 'INSERT') {
                    const newProfile = payload.new as Profile;
                    if (newProfile.twitch_id !== currentUser.twitch_id) {
                        setProfiles(prev => [newProfile, ...prev]);
                        setTotalCount(prev => prev + 1);
                    }
                } else if (payload.eventType === 'UPDATE') {
                    const updated = payload.new as Profile;
                    setProfiles(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
                } else if (payload.eventType === 'DELETE') {
                    const deleted = payload.old as { id: string };
                    setProfiles(prev => prev.filter(p => p.id !== deleted.id));
                    setTotalCount(prev => Math.max(0, prev - 1));
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [currentUser.twitch_id]);

    // Load more pages on scroll
    const loadMore = useCallback(async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        try {
            const data = await getGridProfiles(currentUser.twitch_id, dbPage, PAGE_SIZE);
            if (data.length < PAGE_SIZE) setHasMore(false);
            setProfiles(prev => {
                const existingIds = new Set(prev.map(p => p.id));
                const newProfiles = data.filter(p => !existingIds.has(p.id));
                return [...prev, ...newProfiles];
            });
            setDbPage(prev => prev + 1);
        } catch (err) {
            console.error('Error loading more profiles:', err);
        } finally {
            setLoadingMore(false);
        }
    }, [loadingMore, hasMore, dbPage, currentUser.twitch_id]);

    // Handle deep linking from SPY notifications
    useEffect(() => {
        const profileId = searchParams.get('profile');
        if (profileId) {
            const source = isDemo ? mockProfiles : profiles;
            const target = source.find(p => p.id === profileId);
            if (target) {
                setSelectedProfile(target);
                // Clear the parameter so going back doesn't immediately reopen it
                searchParams.delete('profile');
                setSearchParams(searchParams, { replace: true });
            }
        }
    }, [searchParams, profiles, mockProfiles, isDemo, setSearchParams]);

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


    // Apply filters (uses applied state, not draft)
    const filteredProfiles = useMemo(() => {
        const source = isDemo ? mockProfiles : profiles;
        const query = searchQuery.toLowerCase().trim();

        return source.filter(p => {
            // Username search (real-time, always active)
            if (query) {
                const matchesUsername = p.twitch_username?.toLowerCase().includes(query)
                    || p.display_name?.toLowerCase().includes(query);
                if (!matchesUsername) return false;
            }

            // Gender filter (applied)
            if (genderFilter !== 'all') {
                const pGender = (p.gender || '').toUpperCase();
                if (genderFilter === 'M' && pGender !== 'M' && pGender !== 'MASCHIO') return false;
                if (genderFilter === 'F' && pGender !== 'F' && pGender !== 'FEMMINA') return false;
                if (genderFilter === 'NS' && pGender !== '' && pGender !== 'NS' && pGender !== 'NON SPECIFICATO') return false;
            }

            // Affinity type filter
            if (affinityFilter !== 'all') {
                const key = getCompatibilityCacheKey(currentUser.id, p.id);
                const isConfirmed = !!localStorage.getItem(key);
                if (affinityFilter === 'confirmed' && !isConfirmed) return false;
                if (affinityFilter === 'estimated' && isConfirmed) return false;
            }

            // Age range
            if (ageMin || ageMax) {
                const age = p.age || 0;
                if (ageMin && age < parseInt(ageMin)) return false;
                if (ageMax && age > parseInt(ageMax)) return false;
            }

            // City / Distance filter
            if (cityFilter.trim()) {
                const kmMax = parseInt(cityKm) || 50;
                const dist = profileDistances.get(p.id);
                // If we have distance data, use it; otherwise fallback to text match
                if (profileDistances.size > 0) {
                    if (dist === undefined || dist > kmMax) return false;
                } else {
                    // No geo data yet — fallback to text match
                    const pCity = (p.city || '').toLowerCase();
                    if (!pCity.includes(cityFilter.toLowerCase().trim())) return false;
                }
            }

            // Keyword filter (searches across hobby, music, streamers, bio, etc.)
            if (keywordFilter) {
                const kw = keywordFilter.toLowerCase().trim();
                const searchableText = [
                    p.hobbies, p.music, p.music_artists,
                    p.twitch_watches, p.twitch_streamers,
                    p.youtube, p.youtube_channels,
                    p.bio, p.grenbaud_is, p.looking_for
                ].filter(Boolean).join(' ').toLowerCase();

                if (!searchableText.includes(kw)) return false;
            }

            return true;
        });
    }, [profiles, mockProfiles, isDemo, searchQuery, genderFilter, ageMin, ageMax, cityFilter, cityKm, keywordFilter, affinityFilter, profileDistances, currentUser.id]);

    // Infinite scroll — load more from DB
    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadMore();
                }
            },
            { rootMargin: '400px' }
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [loadMore]);

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
                    const colIndex = index % columns;
                    const isLeftHalf = colIndex < columns / 2;
                    const slideDir = isLeftHalf ? 1 : -1;
                    const rowDelay = Math.floor(index / columns) * 0.1;
                    const colDelay = isLeftHalf ? colIndex * 0.05 : (columns - 1 - colIndex) * 0.05;

                    return (
                        <div
                            key={profile.id}
                            className="grid-card-wrapper"
                            style={{
                                '--animation-order': index,
                                '--slide-dir': slideDir,
                                'animationDelay': `${rowDelay + colDelay}s`
                            } as React.CSSProperties}
                        >
                            <ProfileCard
                                profile={profile}
                                currentUser={currentUser}
                                onOpenProfile={() => setSelectedProfile(profile)}
                            />
                        </div>
                    );
                })}
            </div>

            {/* Infinite scroll sentinel */}
            {(hasMore || loadingMore) && (
                <div ref={sentinelRef} className="grid-load-more">
                    <div className="loading-spinner" style={{ width: 24, height: 24 }} />
                </div>
            )}

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
