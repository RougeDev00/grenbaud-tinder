import React, { useState, useCallback } from 'react';
import type { EsploraPostWithProfile, EsploraCommentWithProfile } from '../../types';
import { toggleEsploraLike, getPostComments, createComment, deleteComment, togglePinPost } from '../../services/esploraService';

interface ThreadPostProps {
    post: EsploraPostWithProfile;
    currentUserId: string;
    currentUsername?: string;
    isAdmin?: boolean;
    onLike: () => void;
    onDelete: () => void;
    onImageClick: (url: string) => void;
    onProfileClick: (userId: string) => void;
}


const formatTimeAgo = (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'ora';
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}g`;
    return new Date(dateStr).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
};

const ThreadPost: React.FC<ThreadPostProps> = ({ post, currentUserId, currentUsername, isAdmin = false, onLike, onDelete, onImageClick, onProfileClick }) => {
    const [liked, setLiked] = useState(post.hasLiked || false);
    const [likesCount, setLikesCount] = useState(post.likes_count);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<EsploraCommentWithProfile[]>([]);
    const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
    const [commentText, setCommentText] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);
    const [submittingComment, setSubmittingComment] = useState(false);
    const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
    const [replyText, setReplyText] = useState('');

    const isOwner = post.user_id === currentUserId;
    const canDelete = isOwner || isAdmin;
    const avatar = post.profile?.photo_1;
    const displayName = post.profile?.display_name || post.profile?.twitch_username || 'Utente';
    const twitchUsername = post.profile?.twitch_username;
    const isGold = twitchUsername?.toLowerCase() === 'grenbaud';

    const handleLike = async () => {
        const newLiked = !liked;
        setLiked(newLiked);
        setLikesCount(prev => newLiked ? prev + 1 : Math.max(0, prev - 1));
        await toggleEsploraLike(post.id, currentUserId);
        onLike();
    };

    const handleToggleComments = useCallback(async () => {
        if (showComments) {
            setShowComments(false);
            return;
        }
        setLoadingComments(true);
        setShowComments(true);
        try {
            const data = await getPostComments(post.id);
            setComments(data);
        } catch (err) {
            console.error('Error loading comments:', err);
        } finally {
            setLoadingComments(false);
        }
    }, [showComments, post.id]);

    const handleSubmitComment = useCallback(async () => {
        const text = (commentText || '').trim();
        if (!text || submittingComment) return;
        setSubmittingComment(true);
        try {
            const ok = await createComment(post.id, currentUserId, text, null);
            if (ok) {
                setCommentText('');
                setCommentsCount(prev => prev + 1);
                const refreshed = await getPostComments(post.id);
                setComments(refreshed);
            }
        } catch (err) {
            console.error('Error creating comment:', err);
        } finally {
            setSubmittingComment(false);
        }
    }, [commentText, submittingComment, post.id, currentUserId]);

    const handleSubmitReply = async () => {
        const text = replyText.trim();
        if (!text || submittingComment || !replyingTo) return;
        setSubmittingComment(true);
        const ok = await createComment(post.id, currentUserId, text, replyingTo.id);
        if (ok) {
            setReplyText('');
            setReplyingTo(null);
            setCommentsCount(prev => prev + 1);
            const refreshed = await getPostComments(post.id);
            setComments(refreshed);
        }
        setSubmittingComment(false);
    };

    const handleDeleteComment = async (commentId: string) => {
        const success = await deleteComment(commentId, currentUserId, isAdmin);
        if (success) {
            setComments(prev => prev.filter(c => c.id !== commentId));
            setCommentsCount(prev => Math.max(0, prev - 1));
        }
    };

    const handleTogglePin = async () => {
        const newPinned = !post.is_pinned;
        const success = await togglePinPost(post.id, newPinned, currentUsername || '');
        if (success) onLike(); // refresh posts
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmitComment();
        }
    };

    return (
        <div className="thread-post-wrapper">
            <article className={`thread-post ${isGold ? 'thread-post--gold' : ''} ${post.is_pinned ? 'thread-post--pinned' : ''}`}>
                {/* Pinned Banner */}
                {post.is_pinned && (
                    <div className="thread-pinned-banner">
                        <span className="thread-pinned-icon">📌</span>
                        <span className="thread-pinned-label">Post Fissato</span>
                    </div>
                )}
                {/* Header */}
                <div className="thread-post-header">
                    {avatar ? (
                        <img
                            className={`thread-avatar ${isGold ? 'thread-avatar--gold' : ''}`}
                            src={avatar}
                            alt={displayName}
                            onClick={() => onProfileClick(post.user_id)}
                        />
                    ) : (
                        <div className={`thread-avatar-placeholder ${isGold ? 'thread-avatar--gold' : ''}`} onClick={() => onProfileClick(post.user_id)}>
                            {displayName.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div className="thread-post-meta">
                        <span className="thread-username" onClick={() => onProfileClick(post.user_id)}>
                            {displayName}
                            {isGold && <span className="thread-gold-badge" title="CEO of BAUDR">👑</span>}
                        </span>
                        {twitchUsername && (
                            <span className="thread-twitch-handle">@{twitchUsername}</span>
                        )}
                        <span className="thread-time">{formatTimeAgo(post.created_at)}</span>
                    </div>
                    {canDelete && (
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            {isAdmin && (
                                <button
                                    className={`thread-pin-btn ${post.is_pinned ? 'pinned' : ''}`}
                                    onClick={handleTogglePin}
                                    title={post.is_pinned ? 'Rimuovi pin' : 'Pinna post'}
                                >
                                    📌
                                </button>
                            )}
                            <button className="thread-delete-btn" onClick={onDelete} title="Elimina post">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>

                {/* Content */}
                {post.text_content && (
                    <div className="thread-post-content">{post.text_content}</div>
                )}

                {/* Image */}
                {post.media_url && (
                    <img
                        className="thread-post-image"
                        src={post.media_url}
                        alt="Post"
                        onClick={() => onImageClick(post.media_url!)}
                        loading="lazy"
                    />
                )}

                {/* Actions */}
                <div className="thread-actions">
                    <div className="thread-like-wrapper">
                        <button className={`thread-action-btn ${liked ? 'liked' : ''}`} onClick={handleLike}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                            {likesCount > 0 && <span>{likesCount}</span>}
                        </button>
                        {/* Likers tooltip — appears on hover */}
                        {post.likers && post.likers.length > 0 && (
                            <div className="thread-likers-tooltip">
                                <div className="thread-likers-title">Piaciuto a</div>
                                {post.likers.map((liker, i) => (
                                    <div key={liker.id || i} className="thread-liker-row">
                                        {liker.photo_1 && <img src={liker.photo_1} alt="" className="thread-liker-avatar" />}
                                        <span className="thread-liker-name">{liker.twitch_username}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button className="thread-action-btn" onClick={handleToggleComments}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        {commentsCount > 0 && <span>{commentsCount}</span>}
                    </button>
                </div>

                {/* Comments Section */}
                {showComments && (
                    <div className="thread-comments">
                        {loadingComments ? (
                            <div style={{ textAlign: 'center', padding: '12px', color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>Caricamento...</div>
                        ) : (
                            <>
                                {comments.map(comment => (
                                    <div key={comment.id} className="thread-comment">
                                        {comment.profile?.photo_1 ? (
                                            <img className="thread-comment-avatar" src={comment.profile.photo_1} alt="" />
                                        ) : (
                                            <div className="thread-comment-avatar" style={{ background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.7rem', fontWeight: 700 }}>
                                                {(comment.profile?.display_name || '?').charAt(0)}
                                            </div>
                                        )}
                                        <div className="thread-comment-body">
                                            <div className="thread-comment-header">
                                                <span className="thread-comment-name" style={{ cursor: 'pointer' }} onClick={() => onProfileClick(comment.user_id)}>
                                                    {comment.profile?.display_name || comment.profile?.twitch_username || 'Utente'}
                                                </span>
                                                {comment.profile?.twitch_username && (
                                                    <span className="thread-twitch-handle" style={{ fontSize: '0.65rem', marginLeft: 2 }}>@{comment.profile.twitch_username}</span>
                                                )}
                                                <span className="thread-comment-time">{formatTimeAgo(comment.created_at)}</span>
                                                {(comment.user_id === currentUserId || isAdmin) && (
                                                    <button className="thread-comment-delete" onClick={() => handleDeleteComment(comment.id)} title="Elimina">×</button>
                                                )}
                                            </div>
                                            <div className="thread-comment-text">{comment.content}</div>
                                            {/* Reply button */}
                                            <button
                                                className="thread-reply-btn"
                                                onClick={() => setReplyingTo(replyingTo?.id === comment.id ? null : { id: comment.id, name: comment.profile?.display_name || comment.profile?.twitch_username || 'Utente' })}
                                            >
                                                ↩ Rispondi
                                            </button>
                                            {/* Reply input for this comment */}
                                            {replyingTo?.id === comment.id && (
                                                <div className="thread-reply-input-row">
                                                    <input
                                                        className="thread-comment-input thread-reply-input"
                                                        placeholder={`Rispondi a ${replyingTo.name}...`}
                                                        value={replyText}
                                                        autoFocus
                                                        onChange={e => setReplyText(e.target.value)}
                                                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmitReply(); } if (e.key === 'Escape') setReplyingTo(null); }}
                                                        maxLength={500}
                                                    />
                                                    <button
                                                        className="thread-comment-send"
                                                        disabled={!replyText.trim() || submittingComment}
                                                        onClick={handleSubmitReply}
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            )}
                                            {/* Nested replies */}
                                            {comment.replies && comment.replies.length > 0 && (
                                                <div className="thread-replies">
                                                    {comment.replies.map(reply => (
                                                        <div key={reply.id} className="thread-reply">
                                                            <span className="thread-reply-arrow">↩</span>
                                                            {reply.profile?.photo_1 ? (
                                                                <img className="thread-comment-avatar thread-reply-avatar" src={reply.profile.photo_1} alt="" />
                                                            ) : (
                                                                <div className="thread-comment-avatar thread-reply-avatar" style={{ background: '#5b21b6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.6rem', fontWeight: 700 }}>
                                                                    {(reply.profile?.display_name || '?').charAt(0)}
                                                                </div>
                                                            )}
                                                            <div className="thread-comment-body">
                                                                <div className="thread-comment-header">
                                                                    <span className="thread-comment-name" style={{ fontSize: '0.75rem', cursor: 'pointer' }} onClick={() => onProfileClick(reply.user_id)}>
                                                                        {reply.profile?.display_name || reply.profile?.twitch_username || 'Utente'}
                                                                    </span>
                                                                    {reply.profile?.twitch_username && (
                                                                        <span className="thread-twitch-handle" style={{ fontSize: '0.6rem', marginLeft: 2 }}>@{reply.profile.twitch_username}</span>
                                                                    )}
                                                                    <span className="thread-comment-time">{formatTimeAgo(reply.created_at)}</span>
                                                                    {reply.user_id === currentUserId && (
                                                                        <button className="thread-comment-delete" onClick={() => handleDeleteComment(reply.id)} title="Elimina">×</button>
                                                                    )}
                                                                </div>
                                                                <div className="thread-comment-text" style={{ fontSize: '0.82rem' }}>{reply.content}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {comments.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '12px', color: 'rgba(255,255,255,0.25)', fontSize: '0.85rem' }}>Nessun commento ancora. Sii il primo!</div>
                                )}
                            </>
                        )}

                        {/* Main comment input */}
                        <div className="thread-comment-input-row">
                            <input
                                className="thread-comment-input"
                                placeholder="Scrivi un commento..."
                                value={commentText}
                                onChange={e => setCommentText(e.target.value)}
                                onKeyDown={handleKeyDown}
                                maxLength={500}
                            />
                            <button
                                className="thread-comment-send"
                                disabled={!commentText.trim() || submittingComment}
                                onClick={handleSubmitComment}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
            </article>
        </div>
    );
};

export default ThreadPost;
