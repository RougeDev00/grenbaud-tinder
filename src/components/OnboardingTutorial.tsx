import React, { useState, useEffect, useCallback } from 'react';
import './OnboardingTutorial.css';

interface TutorialStep {
    title: string;
    emoji: string;
    description: string;
    detail?: React.ReactNode;
    spotlightTarget?: string;
}

const STEPS: TutorialStep[] = [
    // ── 1. Welcome ──────────────────────────────
    {
        title: 'Benvenuto su Baudr! 🎊',
        emoji: '🟣',
        description: 'La community di GrenBaud dove connettere persone affini. In pochi secondi ti mostriamo tutto quello che puoi fare!',
        detail: (
            <div className="tut-welcome-logos">
                <div className="tut-logo-glow">🎮</div>
                <div className="tut-logo-plus">+</div>
                <div className="tut-logo-glow" style={{ animationDelay: '0.5s' }}>❤️</div>
                <div className="tut-logo-plus">+</div>
                <div className="tut-logo-glow" style={{ animationDelay: '1s' }}>🤝</div>
            </div>
        ),
    },
    // ── 2. Esplora Profili ──────────────────────
    {
        title: 'Esplora la Community',
        emoji: '🔍',
        description: 'Nella scheda Esplora trovi tutti i profili della community in una griglia. Clicca su un profilo per vedere i dettagli, le foto e la bio.',
        spotlightTarget: 'explore',
        detail: (
            <div className="tut-grid-demo">
                {['🎮', '🎨', '🎵', '🌙'].map((e, i) => (
                    <div key={i} className="tut-grid-card" style={{ animationDelay: `${i * 0.1}s` }}>
                        <span className="tut-grid-avatar">{e}</span>
                        <div className="tut-grid-info">
                            <div className="tut-grid-name" />
                            <div className="tut-grid-score">
                                <span className="tut-mini-badge">✨ {70 + i * 6}%</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        ),
    },
    // ── 3. Compatibilità ────────────────────────
    {
        title: 'Punteggi di Compatibilità',
        emoji: '📊',
        description: 'Ogni profilo mostra quanto siete compatibili. Hai due tipi di punteggio:',
        detail: (
            <div className="tutorial-badges-demo">
                <div className="tutorial-badge-row">
                    <div className="tutorial-badge tutorial-badge--estimated">
                        <span className="tutorial-badge-icon">🔮</span>
                        <div className="tutorial-badge-content">
                            <span className="tutorial-badge-score">~72%</span>
                        </div>
                    </div>
                    <div className="tutorial-badge-explain">
                        <strong>Stimata automaticamente</strong>
                        <span>Calcolata in base ai vostri interessi comuni. È una previsione rapida.</span>
                    </div>
                </div>
                <div className="tutorial-badge-divider"><span>VS</span></div>
                <div className="tutorial-badge-row">
                    <div className="tutorial-badge tutorial-badge--final">
                        <span className="tutorial-badge-icon">🔥</span>
                        <div className="tutorial-badge-content">
                            <span className="tutorial-badge-score">85%</span>
                            <span className="tutorial-badge-tag">AI ✓</span>
                        </div>
                    </div>
                    <div className="tutorial-badge-explain">
                        <strong>Confermata dall'AI</strong>
                        <span>Analisi approfondita fatta dall'Intelligenza Artificiale. È il punteggio definitivo!</span>
                    </div>
                </div>
            </div>
        ),
    },
    // ── 4. AI Match ─────────────────────────────
    {
        title: 'AI Match — I Tuoi Top Match',
        emoji: '🔥',
        description: 'La sezione AI Match ti mostra i profili più compatibili con te e chi ha "spiato" il tuo profilo — un chiaro segnale di interesse!',
        spotlightTarget: 'aimatch',
        detail: (
            <div className="tut-match-demo">
                <div className="tut-match-row">
                    <span className="tut-match-icon">👁️</span>
                    <div className="tut-match-text">
                        <strong>Chi ti ha spiato</strong>
                        <span>Qualcuno ha visitato il tuo profilo — forse c'è interesse reciproco!</span>
                    </div>
                </div>
                <div className="tut-match-row">
                    <span className="tut-match-icon">🤖</span>
                    <div className="tut-match-text">
                        <strong>Genera l'analisi AI</strong>
                        <span>Apri un profilo e clicca "Genera analisi" per ottenere il punteggio AI definitivo.</span>
                    </div>
                </div>
            </div>
        ),
    },
    // ── 5. Sblocco Chat ─────────────────────────
    {
        title: 'Come Sbloccare la Chat 🔓',
        emoji: '💬',
        description: 'La chat privata si sblocca automaticamente quando entrambi generate l\'analisi AI reciproca. È il nostro modo per garantire interesse genuino!',
        spotlightTarget: 'chat',
        detail: (
            <div className="tut-unlock-demo">
                <div className="tut-unlock-step">
                    <div className="tut-unlock-num">1</div>
                    <span>Tu generi l'analisi AI sul profilo di qualcuno</span>
                </div>
                <div className="tut-unlock-arrow">↓</div>
                <div className="tut-unlock-step">
                    <div className="tut-unlock-num">2</div>
                    <span>Anche quel qualcuno genera l'analisi sul tuo profilo</span>
                </div>
                <div className="tut-unlock-arrow">↓</div>
                <div className="tut-unlock-step tut-unlock-step--success">
                    <div className="tut-unlock-num tut-unlock-num--success">✓</div>
                    <span><strong>Chat sbloccata!</strong> Ora potete scrivervi.</span>
                </div>
            </div>
        ),
    },
    // ── 6. Esplora Feed ─────────────────────────
    {
        title: 'Feed Esplora — Post & Storie',
        emoji: '📱',
        description: 'Oltre ai profili, c\'è un feed social! Gli utenti pubblicano post con immagini e testo. Puoi mettere like ❤️, commentare 💬 e rispondere ai commenti.',
        detail: (
            <div className="tut-feed-demo">
                <div className="tut-post-card">
                    <div className="tut-post-header">
                        <span className="tut-post-avatar">🎮</span>
                        <div className="tut-post-meta">
                            <strong>GrenFan42</strong>
                            <span>@grenfan42 · 2m</span>
                        </div>
                    </div>
                    <p className="tut-post-text">Chi guarda anche GrenBaud? 👋 Questa community è pazzesca!</p>
                    <div className="tut-post-actions">
                        <button className="tut-action-btn tut-action-btn--like">❤️ 24</button>
                        <button className="tut-action-btn">💬 Commenta</button>
                        <button className="tut-action-btn">↩ Rispondi</button>
                    </div>
                </div>
            </div>
        ),
    },
    // ── 7. Risposte ai commenti ─────────────────
    {
        title: 'Commenti & Risposte Annidate',
        emoji: '↩️',
        description: 'Ogni commento ha un bottone "Rispondi". Le risposte appaiono annidate sotto il commento originale — come una vera conversazione!',
        detail: (
            <div className="tut-replies-demo">
                <div className="tut-comment">
                    <span className="tut-comment-avatar">😄</span>
                    <div className="tut-comment-body">
                        <strong>Alice</strong><span className="tut-comment-time">3m</span>
                        <p>Super content!</p>
                        <button className="tut-reply-btn">↩ Rispondi</button>
                    </div>
                </div>
                <div className="tut-nested-reply">
                    <span className="tut-reply-arrow">↩</span>
                    <span className="tut-comment-avatar tut-comment-avatar--sm">🎯</span>
                    <div className="tut-comment-body">
                        <strong>Bob</strong>
                        <p>Anche io! 🔥</p>
                    </div>
                </div>
            </div>
        ),
    },
    // ── 8. Events ───────────────────────────────
    {
        title: 'Eventi della Community',
        emoji: '🎪',
        description: 'Scopri e partecipa agli eventi organizzati dalla community! Troverai raduni, serate gaming, meetup e molto altro. Solo eventi futuri — niente eventi scaduti!',
        detail: (
            <div className="tut-events-demo">
                <div className="tut-event-card">
                    <div className="tut-event-icon">🎮</div>
                    <div className="tut-event-info">
                        <strong>Gaming Night Milano</strong>
                        <span>📅 Sab 28 Feb · 📍 Milano</span>
                        <button className="tut-event-btn">Partecipa</button>
                    </div>
                </div>
                <div className="tut-event-card">
                    <div className="tut-event-icon">🎤</div>
                    <div className="tut-event-info">
                        <strong>Serata Karaoke fan GrenBaud</strong>
                        <span>📅 Dom 2 Mar · 📍 Roma</span>
                        <button className="tut-event-btn">Partecipa</button>
                    </div>
                </div>
            </div>
        ),
    },
    // ── 9. Notifiche ────────────────────────────
    {
        title: 'Notifiche in Tempo Reale 🔔',
        emoji: '🔔',
        description: 'Il campanellino in alto ti avvisa di tutto: quando qualcuno spia il tuo profilo, mette like ai tuoi post, commenta o risponde — tutto in tempo reale!',
        detail: (
            <div className="tut-notifs-demo">
                {[
                    { icon: '👁️', color: '#a855f7', text: 'GrenFan42 ha visitato il tuo profilo!' },
                    { icon: '❤️', color: '#f43f5e', text: 'Alice ha messo like al tuo post!' },
                    { icon: '💬', color: '#06b6d4', text: 'Bob ha commentato il tuo post!' },
                    { icon: '↩️', color: '#10b981', text: 'Alice ha risposto al tuo commento!' },
                ].map((n, i) => (
                    <div key={i} className="tut-notif-row" style={{ animationDelay: `${i * 0.15}s` }}>
                        <span className="tut-notif-icon" style={{ background: n.color + '22', color: n.color }}>{n.icon}</span>
                        <span className="tut-notif-text">{n.text}</span>
                    </div>
                ))}
            </div>
        ),
    },
    // ── 10. Profilo ─────────────────────────────
    {
        title: 'Il Tuo Profilo ✨',
        emoji: '👤',
        description: 'Completa il tuo profilo per ottenere match migliori: carica fino a 3 foto, scrivi la bio, fai il test della personalità e pubblica post nella tab Post!',
        spotlightTarget: 'profile',
        detail: (
            <div className="tut-profile-demo">
                <div className="tut-profile-tip"><span>📸</span><span><strong>Foto</strong> — Carosello hero con navigazione sinistra/destra</span></div>
                <div className="tut-profile-tip"><span>✍️</span><span><strong>Bio & Interessi</strong> — Racconta chi sei</span></div>
                <div className="tut-profile-tip"><span>🧠</span><span><strong>Test Personalità</strong> — Scopri il tuo archetipo</span></div>
                <div className="tut-profile-tip"><span>📝</span><span><strong>Post</strong> — Pubblica contenuti nella tab Post</span></div>
                <div className="tut-profile-tip"><span>🤖</span><span><strong>Riassunto AI</strong> — Descrizione AI del tuo profilo</span></div>
            </div>
        ),
    },
];

const OnboardingTutorial: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [animating, setAnimating] = useState(false);
    const [visible, setVisible] = useState(false);
    const [spotlightPos, setSpotlightPos] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

    const step = STEPS[currentStep];
    const isLastStep = currentStep === STEPS.length - 1;

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 100);
        return () => clearTimeout(t);
    }, []);

    const updateSpotlight = useCallback(() => {
        if (!step.spotlightTarget) { setSpotlightPos(null); return; }
        const navItems = document.querySelectorAll('.navbar-item');
        const order = ['explore', 'aimatch', 'chat', 'profile'];
        const idx = order.indexOf(step.spotlightTarget);
        if (idx >= 0 && navItems[idx]) {
            const r = (navItems[idx] as HTMLElement).getBoundingClientRect();
            setSpotlightPos({ x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height });
        }
    }, [step.spotlightTarget]);

    useEffect(() => {
        updateSpotlight();
        window.addEventListener('resize', updateSpotlight);
        return () => window.removeEventListener('resize', updateSpotlight);
    }, [updateSpotlight]);

    const goNext = () => {
        if (animating) return;
        if (isLastStep) {
            setVisible(false);
            setTimeout(() => { localStorage.setItem('baudr_tutorial_completed', 'true'); onComplete(); }, 400);
            return;
        }
        setAnimating(true);
        setTimeout(() => { setCurrentStep(p => p + 1); setAnimating(false); }, 300);
    };

    const goPrev = () => {
        if (animating || currentStep === 0) return;
        setAnimating(true);
        setTimeout(() => { setCurrentStep(p => p - 1); setAnimating(false); }, 300);
    };

    const skip = () => {
        setVisible(false);
        setTimeout(() => { localStorage.setItem('baudr_tutorial_completed', 'true'); onComplete(); }, 400);
    };

    return (
        <div className={`tutorial-overlay ${visible ? 'tutorial-overlay--visible' : ''}`}>
            {/* Backdrop blur */}
            <svg className="tutorial-spotlight-svg" viewBox={`0 0 ${window.innerWidth} ${window.innerHeight}`} preserveAspectRatio="none">
                <defs>
                    <mask id="spotlight-mask">
                        <rect width="100%" height="100%" fill="white" />
                        {spotlightPos && (
                            <ellipse cx={spotlightPos.x} cy={spotlightPos.y} rx={spotlightPos.w / 2 + 14} ry={spotlightPos.h / 2 + 10} fill="black" />
                        )}
                    </mask>
                </defs>
                <rect width="100%" height="100%" fill="rgba(0,0,0,0.78)" mask="url(#spotlight-mask)" />
            </svg>

            {spotlightPos && (
                <div className="tutorial-spotlight-ring" style={{
                    left: spotlightPos.x - spotlightPos.w / 2 - 16,
                    top: spotlightPos.y - spotlightPos.h / 2 - 12,
                    width: spotlightPos.w + 32,
                    height: spotlightPos.h + 24,
                }} />
            )}

            {/* Card */}
            <div className={`tutorial-card ${animating ? 'tutorial-card--exit' : 'tutorial-card--enter'}`} key={currentStep}>
                {/* Step counter */}
                <div className="tutorial-step-counter">
                    {currentStep + 1} / {STEPS.length}
                </div>

                <div className="tutorial-card-emoji">{step.emoji}</div>
                <h2 className="tutorial-card-title">{step.title}</h2>
                <p className="tutorial-card-desc">{step.description}</p>
                {step.detail && <div className="tutorial-card-detail">{step.detail}</div>}

                <div className="tutorial-card-actions">
                    {currentStep > 0 && (
                        <button className="tutorial-btn-prev" onClick={goPrev}>← Indietro</button>
                    )}
                    <button className="tutorial-btn-next" onClick={goNext}>
                        {isLastStep ? '🚀 Inizia!' : 'Avanti →'}
                    </button>
                </div>

                {/* Progress bar */}
                <div className="tutorial-progress">
                    {STEPS.map((_, i) => (
                        <div
                            key={i}
                            className={`tutorial-dot ${i === currentStep ? 'tutorial-dot--active' : ''} ${i < currentStep ? 'tutorial-dot--done' : ''}`}
                            onClick={() => !animating && setCurrentStep(i)}
                        />
                    ))}
                </div>
            </div>

            <button className="tutorial-skip" onClick={skip}>Salta tutorial</button>
        </div>
    );
};

export default OnboardingTutorial;
