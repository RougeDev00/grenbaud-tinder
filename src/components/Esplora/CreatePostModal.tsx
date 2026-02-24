import React, { useState, useRef } from 'react';

interface CreatePostModalProps {
    onClose: () => void;
    onSubmit: (text: string, image: File | null) => Promise<void>;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ onClose, onSubmit }) => {
    const [text, setText] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setImagePreview(ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async () => {
        if (!text.trim() && !imageFile) return;
        setSubmitting(true);
        try {
            await onSubmit(text.trim(), imageFile);
        } finally {
            setSubmitting(false);
        }
    };

    const canSubmit = (text.trim().length > 0 || imageFile !== null) && !submitting;

    return (
        <div className="create-post-overlay" onClick={onClose}>
            <div className="create-post-modal" onClick={e => e.stopPropagation()}>
                <div className="create-post-header">
                    <h2>Nuovo Post</h2>
                    <button className="create-post-close" onClick={onClose}>×</button>
                </div>

                <div className="create-post-body">
                    <textarea
                        className="create-post-textarea"
                        placeholder="Cosa stai pensando?"
                        value={text}
                        onChange={e => setText(e.target.value)}
                        autoFocus
                        maxLength={1000}
                    />

                    {imagePreview && (
                        <div className="create-post-image-preview">
                            <img src={imagePreview} alt="Preview" />
                            <button className="create-post-remove-image" onClick={handleRemoveImage}>×</button>
                        </div>
                    )}
                </div>

                <div className="create-post-footer">
                    <button
                        className="create-post-attach"
                        onClick={() => fileInputRef.current?.click()}
                        title="Allega immagine"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                        </svg>
                    </button>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleImageSelect}
                    />

                    <button
                        className="create-post-submit"
                        disabled={!canSubmit}
                        onClick={handleSubmit}
                    >
                        {submitting ? 'Pubblicando...' : 'Pubblica'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreatePostModal;
