import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Profile, EsploraPostWithProfile } from '../../types';
import { getEsploraPosts, createEsploraPost, toggleEsploraLike, deleteEsploraPost } from '../../services/esploraService';
import { getProfile } from '../../services/profileService';
import PostItNote from './PostItNote';
import './Esplora.css';

interface EsploraFeedProps {
    currentUser: Profile;
    onOpenProfile?: (user: Profile) => void;
}

const COLOR_THEMES = ['purple', 'blue', 'green', 'yellow', 'pink', 'orange'];
const COLOR_CSS: Record<string, string> = {
    purple: 'rgba(180, 120, 255, 0.7)',
    blue: 'rgba(100, 180, 255, 0.7)',
    green: 'rgba(100, 255, 180, 0.7)',
    yellow: 'rgba(255, 235, 100, 0.7)',
    pink: 'rgba(255, 120, 190, 0.7)',
    orange: 'rgba(255, 170, 70, 0.7)',
};

const EsploraFeed: React.FC<EsploraFeedProps> = ({ currentUser, onOpenProfile }) => {
    const [posts, setPosts] = useState<EsploraPostWithProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'board' | 'create'>('board');

    // Create post state
    const [newPostText, setNewPostText] = useState('');
    const [newPostImage, setNewPostImage] = useState<File | null>(null);
    const [newPostImagePreview, setNewPostImagePreview] = useState<string | null>(null);
    const [newPostColor, setNewPostColor] = useState('purple');
    const [creating, setCreating] = useState(false);

    // Canvas pan/zoom
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);
    const [translate, setTranslate] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const translateStart = useRef({ x: 0, y: 0 });

    const fetchPosts = useCallback(async () => {
        try {
            const data = await getEsploraPosts(currentUser.id);
            setPosts(data);
        } catch (err) {
            console.error('Error fetching posts:', err);
        } finally {
            setLoading(false);
        }
    }, [currentUser.id]);

    useEffect(() => {
        fetchPosts();
        const interval = setInterval(fetchPosts, 30000);
        return () => clearInterval(interval);
    }, [fetchPosts]);

    // Fit canvas to viewport on mount
    useEffect(() => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        // Fit the 3000px wide canvas to the viewport width
        const fitScale = rect.width / 3000;
        setScale(fitScale);
        setTranslate({ x: 0, y: 0 });
    }, []);

    const handleCreatePost = async () => {
        if (!newPostText.trim() && !newPostImage) return;
        setCreating(true);
        try {
            const contentType = newPostImage ? 'image' : 'text';
            const result = await createEsploraPost(
                currentUser.id, contentType,
                newPostText || null, newPostImage,
                newPostColor
            );
            if (result) {
                setNewPostText('');
                setNewPostImage(null);
                setNewPostImagePreview(null);
                setNewPostColor('purple');
                setView('board');
                await fetchPosts();
            }
        } catch (err) {
            console.error('Error creating post:', err);
        } finally {
            setCreating(false);
        }
    };

    const handleLike = async (postId: string, posX?: number, posY?: number) => {
        await toggleEsploraLike(postId, currentUser.id, posX, posY);
        await fetchPosts();
    };

    const isAdmin = currentUser.twitch_username?.toLowerCase() === 'grenbaud';

    const handleDelete = async (postId: string) => {
        const ok = await deleteEsploraPost(postId, currentUser.id, isAdmin);
        if (ok) setPosts(prev => prev.filter(p => p.id !== postId));
    };

    const handleProfileClick = async (userId: string) => {
        if (!onOpenProfile) return;
        try {
            const profile = await getProfile(userId);
            if (profile) onOpenProfile(profile);
        } catch (err) {
            console.error('Error opening profile:', err);
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setNewPostImage(file);
        const reader = new FileReader();
        reader.onload = (ev) => setNewPostImagePreview(ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    // ── Zoom (trackpad pinch + scroll wheel) ──
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();

            if (e.ctrlKey || e.metaKey) {
                // Trackpad pinch-to-zoom
                const zoomFactor = 1 - e.deltaY * 0.01;
                setScale(prev => Math.max(0.15, Math.min(3, prev * zoomFactor)));
            } else {
                // Normal scroll → pan
                setTranslate(prev => ({
                    x: prev.x - e.deltaX,
                    y: prev.y - e.deltaY,
                }));
            }
        };

        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, []);

    // ── Drag to pan ──
    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        if ((e.target as HTMLElement).closest('.postit-container')) return;
        setIsDragging(true);
        dragStart.current = { x: e.clientX, y: e.clientY };
        translateStart.current = { ...translate };
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    }, [translate]);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!isDragging) return;
        setTranslate({
            x: translateStart.current.x + (e.clientX - dragStart.current.x),
            y: translateStart.current.y + (e.clientY - dragStart.current.y),
        });
    }, [isDragging]);

    const handlePointerUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    const canvasStyle = useMemo(() => ({
        transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
        transformOrigin: '0 0',
        width: '3000px',
        height: '2400px',
    }), [translate, scale]);

    if (loading) {
        return (
            <div className="esplora-container">
                <div className="esplora-loading">
                    <div className="loading-spinner" />
                    <p>Caricamento bacheca...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="esplora-container">
            {/* Toolbar */}
            <div className="esplora-toolbar">
                <h1 className="esplora-title">📋 Bacheca</h1>
                <div className="esplora-toolbar-actions">
                    <span className="esplora-zoom-label">{Math.round(scale * 100)}%</span>
                    {view === 'board' ? (
                        <button className="esplora-btn-new" onClick={() => setView('create')}>
                            + Nuovo Post
                        </button>
                    ) : (
                        <button className="esplora-btn-back" onClick={() => setView('board')}>
                            ← Torna
                        </button>
                    )}
                </div>
            </div>

            {view === 'create' ? (
                /* ── Create Post ── */
                <div className="esplora-create-container">
                    <div className="esplora-create-card">
                        <h2>📌 Crea un Post</h2>

                        <div className="esplora-color-picker">
                            {COLOR_THEMES.map(color => (
                                <button
                                    key={color}
                                    className={`esplora-color-btn ${newPostColor === color ? 'active' : ''}`}
                                    style={{ backgroundColor: COLOR_CSS[color], color: COLOR_CSS[color] }}
                                    onClick={() => setNewPostColor(color)}
                                />
                            ))}
                        </div>

                        <textarea
                            className="esplora-create-textarea"
                            placeholder="Scrivi qualcosa..."
                            value={newPostText}
                            onChange={e => setNewPostText(e.target.value)}
                            maxLength={500}
                        />

                        {newPostImagePreview && (
                            <div className="esplora-image-preview">
                                <img src={newPostImagePreview} alt="Preview" />
                                <button className="esplora-remove-image" onClick={() => { setNewPostImage(null); setNewPostImagePreview(null); }}>×</button>
                            </div>
                        )}

                        <div className="esplora-create-actions">
                            <label className="esplora-attach-btn">
                                📷 Foto
                                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageSelect} />
                            </label>
                            <button
                                className="esplora-publish-btn"
                                disabled={(!newPostText.trim() && !newPostImage) || creating}
                                onClick={handleCreatePost}
                            >
                                {creating ? '⏳ Pubblicando...' : '📌 Pubblica'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                /* ── Board Canvas ── */
                <div
                    ref={containerRef}
                    className="esplora-canvas-container"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                >
                    <div className="esplora-canvas" style={canvasStyle}>
                        {/* Background fills entire canvas */}
                        <div className="board-bg" />

                        {/* Post-it notes */}
                        {posts.map(post => (
                            <PostItNote
                                key={post.id}
                                post={post}
                                currentUser={currentUser}
                                onLike={handleLike}
                                onDelete={handleDelete}
                                onOpenProfile={handleProfileClick}
                            />
                        ))}

                        {posts.length === 0 && (
                            <div className="esplora-empty">
                                <h3>La bacheca è vuota</h3>
                                <p>Sii il primo a lasciare un post 📌</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EsploraFeed;
