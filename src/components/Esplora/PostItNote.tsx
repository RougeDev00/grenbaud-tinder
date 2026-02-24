import React, { useMemo } from 'react';
import type { EsploraPostWithProfile, Profile, EsploraLiker } from '../../types';
import './Esplora.css';

interface PostItNoteProps {
    post: EsploraPostWithProfile;
    currentUser: Profile;
    onLike: (postId: string, posX?: number, posY?: number) => void;
    onDelete: (postId: string) => void;
    onClick?: () => void;
    onOpenProfile?: (userId: string) => void;
}

const formatTimeAgo = (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'ora';
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}g`;
};

const PostItNote: React.FC<PostItNoteProps> = ({ post, currentUser, onLike, onDelete, onClick, onOpenProfile }) => {
    const isOwner = post.user_id === currentUser?.id;
    const hasLiked = post.hasLiked || false;

    const styles = useMemo(() => {
        const seed = post.id.charCodeAt(0) + post.id.charCodeAt(1);
        const rotation = (seed % 9) - 4; // -4 to +4 degrees for slight tilt
        const posX = post.pos_x ?? (15 + (seed * 7) % 70);
        const posY = post.pos_y ?? (15 + (seed * 11) % 60);
        return {
            left: `${posX}%`,
            top: `${posY}%`,
            transform: `rotate(${rotation}deg)`,
        } as React.CSSProperties;
    }, [post.id, post.pos_x, post.pos_y]);

    const handleLikeClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const posX = 10 + Math.random() * 80;
        const posY = 10 + Math.random() * 80;
        onLike(post.id, posX, posY);
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('Vuoi eliminare questo post?')) {
            onDelete(post.id);
        }
    };

    const handleProfileClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onOpenProfile) onOpenProfile(post.user_id);
    };

    const avatar = post.profile?.photo_1;
    const displayName = post.profile?.display_name || post.profile?.twitch_username || 'Utente';

    return (
        <div className="postit-container" style={styles} onClick={onClick}>
            {/* Holographic glowing pin */}
            <div className="postit-pin" />

            {/* Card */}
            <div className="postit-card" data-theme={post.color_theme || 'purple'}>
                {/* Header */}
                <div className="postit-header">
                    <div className="postit-author" onClick={handleProfileClick}>
                        {avatar ? (
                            <img className="postit-avatar" src={avatar} alt="" />
                        ) : (
                            <div className="postit-avatar-placeholder">
                                {displayName.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <span className="postit-username">{displayName}</span>
                    </div>
                    <span className="postit-timestamp">{formatTimeAgo(post.created_at)}</span>
                    {isOwner && (
                        <button className="postit-delete" onClick={handleDeleteClick} title="Elimina">×</button>
                    )}
                </div>

                {/* Content */}
                <div className="postit-content">
                    {post.media_url && (
                        <img className="postit-image" src={post.media_url} alt="" loading="lazy" />
                    )}
                    {post.text_content && (
                        <p className="postit-text">{post.text_content}</p>
                    )}
                </div>

                {/* Footer */}
                <div className="postit-footer">
                    <button
                        className={`postit-like-btn ${hasLiked ? 'liked' : ''}`}
                        onClick={handleLikeClick}
                    >
                        📌 {post.likes_count > 0 && <span>{post.likes_count}</span>}
                    </button>
                </div>

                {/* Like pins visualization */}
                {post.likers && post.likers.length > 0 && (
                    <div className="postit-pins-layer">
                        {post.likers.map((liker: EsploraLiker, i: number) => (
                            <div
                                key={liker.id || i}
                                className="postit-like-pin"
                                style={{
                                    left: `${liker.pos_x ?? (20 + i * 15)}%`,
                                    top: `${liker.pos_y ?? 85}%`,
                                }}
                                title={liker.twitch_username}
                            >
                                {liker.photo_1 ? (
                                    <img src={liker.photo_1} alt="" className="pin-avatar" />
                                ) : (
                                    <span className="pin-dot" />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PostItNote;
