import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Profile, EsploraPostWithProfile } from '../../types';
import { getEsploraPosts, createEsploraPost, deleteEsploraPost } from '../../services/esploraService';
import { getProfile } from '../../services/profileService';
import ThreadPost from './ThreadPost';
import CreatePostModal from './CreatePostModal';
import './ThreadsFeed.css';

interface ThreadsFeedProps {
    currentUser: Profile;
    onOpenProfile?: (user: Profile) => void;
}

const ThreadsFeed: React.FC<ThreadsFeedProps> = ({ currentUser, onOpenProfile }) => {
    const [posts, setPosts] = useState<EsploraPostWithProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    const [searchParams] = useSearchParams();

    const isAdmin = currentUser.twitch_username?.toLowerCase() === 'grenbaud';

    // Focus/highlight a specific post when coming from a notification
    useEffect(() => {
        const focusPostId = searchParams.get('focusPost');
        if (!focusPostId || loading) return;
        // Small delay to let the DOM render
        setTimeout(() => {
            const el = document.getElementById(`post-${focusPostId}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('post-highlight');
                setTimeout(() => el.classList.remove('post-highlight'), 2500);
            }
        }, 400);
    }, [searchParams, loading]);

    const fetchPosts = useCallback(async () => {
        try {
            const data = await getEsploraPosts(currentUser.id);
            // Sort: pinned first, then by date
            data.sort((a, b) => {
                if (a.is_pinned && !b.is_pinned) return -1;
                if (!a.is_pinned && b.is_pinned) return 1;
                return 0; // keep original date order
            });
            setPosts(data);
        } catch (err) {
            console.error('Error fetching posts:', err);
        } finally {
            setLoading(false);
        }
    }, [currentUser.id]);

    useEffect(() => {
        fetchPosts();
        const interval = setInterval(fetchPosts, 60000);
        return () => clearInterval(interval);
    }, [fetchPosts]);

    const handleCreatePost = async (text: string, imageFile: File | null) => {
        const contentType = imageFile ? 'image' : 'text';
        const result = await createEsploraPost(
            currentUser.id,
            contentType,
            text || null,
            imageFile
        );
        if (result) {
            setShowCreateModal(false);
            await fetchPosts();
        }
    };

    const handleDeletePost = async (postId: string) => {
        if (!confirm('Vuoi eliminare questo post?')) return;
        const success = await deleteEsploraPost(postId, currentUser.id, isAdmin);
        if (success) {
            setPosts(prev => prev.filter(p => p.id !== postId));
        }
    };

    const handleProfileClick = async (userId: string) => {
        if (onOpenProfile) {
            try {
                const profile = await getProfile(userId);
                if (profile) onOpenProfile(profile);
            } catch (err) {
                console.error('Error opening profile:', err);
            }
        }
    };

    return (
        <div className="threads-feed">
            {/* Header */}
            <div className="threads-header">
                <div className="threads-header-text">
                    <h1>Esplora</h1>
                    <p className="threads-header-subtitle">
                        <span className="threads-header-dot" />
                        I post vengono eliminati dopo 1 mese
                    </p>
                </div>
                <button className="btn-new-post" onClick={() => setShowCreateModal(true)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Nuovo Post
                </button>
            </div>

            {/* Feed */}
            {loading ? (
                <>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="thread-skeleton">
                            <div className="thread-skeleton-header">
                                <div className="thread-skeleton-avatar" />
                                <div className="thread-skeleton-name" />
                            </div>
                            <div className="thread-skeleton-body" />
                        </div>
                    ))}
                </>
            ) : posts.length === 0 ? (
                <div className="threads-empty">
                    <div className="threads-empty-icon">✨</div>
                    <h3>Nessun post ancora</h3>
                    <p>Sii il primo a condividere qualcosa con la community!</p>
                </div>
            ) : (
                posts.map(post => (
                    <div id={`post-${post.id}`} key={post.id}>
                        <ThreadPost
                            post={post}
                            currentUserId={currentUser.id}
                            currentUsername={currentUser.twitch_username}
                            isAdmin={isAdmin}
                            onLike={fetchPosts}
                            onDelete={() => handleDeletePost(post.id)}
                            onImageClick={(url) => setLightboxUrl(url)}
                            onProfileClick={handleProfileClick}
                        />
                    </div>
                ))
            )}

            {/* Create Post Modal */}
            {showCreateModal && (
                <CreatePostModal
                    onClose={() => setShowCreateModal(false)}
                    onSubmit={handleCreatePost}
                />
            )}

            {/* Image Lightbox */}
            {lightboxUrl && (
                <div className="thread-lightbox" onClick={() => setLightboxUrl(null)}>
                    <img src={lightboxUrl} alt="Full size" />
                </div>
            )}
        </div>
    );
};

export default ThreadsFeed;
