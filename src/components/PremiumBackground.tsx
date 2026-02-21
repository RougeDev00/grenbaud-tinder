import React from 'react';
import './PremiumBackground.css';

const PremiumBackground: React.FC = () => {
    return (
        <div className="premium-bg-container">
            {/* Animated glowing orbs */}
            <div className="bg-blob blob-primary"></div>
            <div className="bg-blob blob-secondary"></div>
            <div className="bg-blob blob-accent"></div>

            {/* Structural effects */}
            <div className="bg-particles"></div>
            <div className="bg-grid"></div>
            <div className="bg-blob-overlay"></div>
        </div>
    );
};

export default PremiumBackground;
