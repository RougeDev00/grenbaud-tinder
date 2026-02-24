import React, { useState, useEffect } from 'react';
import { PERSONALITY_QUESTIONS } from '../data/personalityQuestions';
import { ARCHETYPES } from '../data/archetypes';
import './PersonalityQuiz.css';

interface Props {
    onComplete: (type: string, scores: {
        mind: number; energy: number; nature: number; tactics: number; identity: number;
    }, answers: Record<number, number>) => void;
    onSkip?: () => void;
    isSaving?: boolean;
}

const PersonalityQuiz: React.FC<Props> = ({ onComplete, onSkip, isSaving }) => {
    // State
    const [currentIndex, setCurrentIndex] = useState(0);
    // Answers map: questionId -> value (1-7)
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [showResult, setShowResult] = useState(false);

    // Result State
    const [finalType, setFinalType] = useState('');
    const [finalScores, setFinalScores] = useState({
        mind: 0, energy: 0, nature: 0, tactics: 0, identity: 0
    });

    // Scroll to top on new question
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [currentIndex]);

    const currentQuestion = PERSONALITY_QUESTIONS[currentIndex];
    const progress = Math.round(((currentIndex) / PERSONALITY_QUESTIONS.length) * 100);

    const handleAnswer = (value: number) => {
        // Value is 1-7
        const newAnswers = { ...answers, [currentQuestion.id]: value };
        setAnswers(newAnswers);

        // Small delay for animation
        setTimeout(() => {
            if (currentIndex < PERSONALITY_QUESTIONS.length - 1) {
                setCurrentIndex(currentIndex + 1);
            } else {
                calculateResult(newAnswers);
            }
        }, 250);
    };

    const calculateResult = (finalAnswers: Record<number, number>) => {
        // Dimensions

        const rawScores = { Mind: 0, Energy: 0, Nature: 0, Tactics: 0, Identity: 0 };

        // 1. Calculate raw scores (-36 to +36 approx per dimension)
        PERSONALITY_QUESTIONS.forEach(q => {
            const ans = finalAnswers[q.id] || 4; // Default neutral if missing
            // Transform 1..7 to -3..+3
            // 1->-3, 2->-2, 3->-1, 4->0, 5->+1, 6->+2, 7->+3
            const v = ans - 4;

            // Contribution depends on direction
            // If direction is 1 (Positive Pole), contribution is v
            // If direction is -1 (Negative Pole), contribution is -v
            const contribution = v * q.direction;

            rawScores[q.dimension] += contribution;
        });

        // 2. Convert to percentages (0..100)
        // Range is roughly -36 to +36 (12 questions * 3 max points = 36)
        // Formula from PDF: pct_first = ((score + 36) / 72) * 100
        const calcPct = (score: number) => Math.round(((score + 36) / 72) * 100);

        const scores = {
            mind: calcPct(rawScores['Mind']),       // E vs I (High = E) -> WAIT, PDF says: score >= 0 wins First Pole.
            // Let's re-read PDF carefully. 
            // "pct_first = ((score + 36) / 72) * 100" meaning 100% is FULL FIRST POLE.
            energy: calcPct(rawScores['Energy']),   // S vs N (High = S)
            nature: calcPct(rawScores['Nature']),   // T vs F (High = T)
            tactics: calcPct(rawScores['Tactics']), // J vs P (High = J)
            identity: calcPct(rawScores['Identity'])// A vs T (High = A)
        };

        // 3. Determine Type String
        // E/I - S/N - T/F - J/P - A/T
        // First pole wins if score >= 0 (pct >= 50)

        // Mind: Extraverted (E) vs Introverted (I)
        const letter1 = scores.mind >= 50 ? 'E' : 'I';

        // Energy: Observant (S) vs Intuitive (N)
        const letter2 = scores.energy >= 50 ? 'S' : 'N';

        // Nature: Thinking (T) vs Feeling (F)
        const letter3 = scores.nature >= 50 ? 'T' : 'F';

        // Tactics: Judging (J) vs Prospecting (P)
        const letter4 = scores.tactics >= 50 ? 'J' : 'P';

        // Identity: Assertive (A) vs Turbulent (T)
        const letter5 = scores.identity >= 50 ? 'A' : 'T';

        const type = `${letter1}${letter2}${letter3}${letter4}-${letter5}`;

        setFinalType(type);
        setFinalScores(scores);
        setShowResult(true);
    };



    if (showResult) {
        // Strip -A/-T for description lookup if needed, but we used full keys in data? 
        // Actually ARCHETYPES keys are like 'INTJ'. We need to strip the 5th letter for title lookup.
        const baseType = finalType.split('-')[0];
        const info = ARCHETYPES[baseType] || { title: baseType, description: 'Un tipo unico.' };
        // Determine variant title
        // Use Title as main identifier (e.g. "L'Amministratore")
        const friendlyName = info.title;
        const identity = finalType.split('-')[1];
        const variant = identity === 'A' ? 'Assertivo' : 'Turbolento';

        return (
            <div className="quiz-container animate-fade-in">
                <div className="result-card">
                    <div className="result-header">
                        <span className="result-badge">✨ Il tuo archetipo</span>
                        <h1 className="result-type">{friendlyName}</h1>
                        <h2 className="result-title"><span className="result-variant">({variant})</span></h2>
                    </div>

                    <p className="result-description">{info.description}</p>

                    <div className="result-bars">
                        {/* 1. MIND (Blue) - Left: Estroverso (E), Right: Introverso (I) */}
                        {/* My code: Mind Score is % of E. If >50, Left (E) wins. Correct. */}
                        <ResultBar label="Mente" left="Estroverso" right="Introverso" val={finalScores.mind} color="#4298B4" />

                        {/* 2. ENERGY (Gold) - Left: Intuitivo (N), Right: Concreto (S) */}
                        {/* My code: Energy Score is % of S. So Left is Concreto. */}
                        {/* Reference wants Left=Intuitivo. So we swap labels and value. */}
                        {/* Pass (100-val) so that if S is low (High N), the value is High (Left). */}
                        <ResultBar label="Energia" left="Intuitivo" right="Concreto" val={100 - finalScores.energy} color="#E4AE3A" />

                        {/* 3. NATURE (Green) - Left: Razionale (T), Right: Empatico (F) */}
                        {/* My code: Nature Score is % of T. Correct. */}
                        <ResultBar label="Natura" left="Razionale" right="Empatico" val={finalScores.nature} color="#33A474" />

                        {/* 4. TACTICS (Purple) - Left: Organizzato (J), Right: Spontaneo (P) */}
                        {/* My code: Tactics Score is % of J. Correct. */}
                        <ResultBar label="Tattica" left="Organizzato" right="Spontaneo" val={finalScores.tactics} color="#88619A" />

                        {/* 5. IDENTITY (Red) - Left: Assertivo (A), Right: Turbolento (T) */}
                        {/* My code: Identity Score is % of A. Correct. */}
                        <ResultBar label="Identità" left="Assertivo" right="Turbolento" val={finalScores.identity} color="#F25E62" />
                    </div>

                    <button
                        className="btn btn-primary btn-xl"
                        onClick={() => onComplete(finalType, finalScores, answers)}
                        disabled={isSaving}
                        style={{ opacity: isSaving ? 0.7 : 1, cursor: isSaving ? 'wait' : 'pointer' }}
                    >
                        {isSaving ? 'Salvataggio... ⏳' : 'Salva Profilo ✨'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="quiz-container">
            <div className="quiz-header sticky-header">
                <div className="quiz-progress-row">
                    <span className="quiz-progress-text">{progress}% Completato</span>
                    <span className="quiz-counter">{currentIndex + 1} / {PERSONALITY_QUESTIONS.length}</span>
                </div>
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                </div>
            </div>

            <div className="question-card animate-slide-up" key={currentIndex}>
                <h2 className="question-text">{currentQuestion.text}</h2>

                <div className="likert-scale">
                    <div className="likert-labels">
                        <span className="color-disagree">In Disaccordo</span>
                        <span className="color-agree">D'accordo</span>
                    </div>

                    <div className="likert-buttons">
                        <CircleBtn val={1} size="xl" color="disagree" onClick={() => handleAnswer(1)} />
                        <CircleBtn val={2} size="lg" color="disagree" onClick={() => handleAnswer(2)} />
                        <CircleBtn val={3} size="md" color="disagree" onClick={() => handleAnswer(3)} />

                        <CircleBtn val={4} size="sm" color="neutral" onClick={() => handleAnswer(4)} />

                        <CircleBtn val={5} size="md" color="agree" onClick={() => handleAnswer(5)} />
                        <CircleBtn val={6} size="lg" color="agree" onClick={() => handleAnswer(6)} />
                        <CircleBtn val={7} size="xl" color="agree" onClick={() => handleAnswer(7)} />
                    </div>
                    <div className="likert-labels-mobile">
                        <span>In Disaccordo</span>
                        <span>D'accordo</span>
                    </div>
                </div>
            </div>

            {onSkip && (
                <div className="quiz-footer" style={{ display: 'flex', justifyContent: 'center', marginTop: '40px', padding: '0 10px' }}>
                    <button className="quiz-skip" style={{
                        background: 'transparent',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: 'rgba(255, 255, 255, 0.7)',
                        padding: '10px 24px',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontFamily: 'inherit'
                    }} onClick={onSkip}>
                        Fallo più tardi
                    </button>
                </div>
            )}
        </div>
    );
};

// Subcomponents
const CircleBtn = ({ val, size, color, onClick }: any) => (
    <button
        className={`likert-btn likert-btn-${size} likert-btn-${color}`}
        onClick={onClick}
        aria-label={`Voto ${val}`}
    />
);

const ResultBar = ({ left, right, val, color }: any) => {
    // val is pct of First Pole (Left).
    // If val > 50, Left wins. If val < 50, Right wins.
    const isLeft = val >= 50;
    const pctDisplay = isLeft ? val : (100 - val);
    const winningLabel = isLeft ? left : right;

    return (
        <div className="result-bar-container">
            {/* 1. Top Row: Score & Winning Label Centered */}
            <div className="result-score-centered" style={{ color: color }}>
                <strong>{pctDisplay}%</strong> {winningLabel}
            </div>

            {/* 2. Middle: The Bar */}
            <div className="result-track-full" style={{ backgroundColor: `${color}40` }}> {/* 25% opacity for track bg */}
                {/* Colored fill? No, screenshot shows solid bar with handle. 
                    Actually checking provided screen "3605":
                    The bar is a solid color track (e.g. Blue). 
                    A White circle handle is at the percentage.
                    The "Introverso" side is Right. "Estroverso" is Left.
                    If 53% Introverso (Right wins), handle is at 53% from Left? 
                    Wait, if Left is 0% and Right is 100%. 
                    If I am 53% Right, I should be at 53%? Yes.
                    
                    But my `val` is % of Left.
                    If `val` is 47 (means 53% Right).
                    So Handle should be at 47?
                    If 0 is Left, 100 is Right.
                    Handle at 47 is slightly Left.
                    But 53% Right means slightly Right.
                    So proper position is: `100 - val` if val is Left%.
                    Example: val=0 (100% Right) -> Position 100.
                    Example: val=100 (100% Left) -> Position 0.
                    Example: val=47 (53% Right) -> Position 53.
                */}
                <div className="result-fill-full" style={{
                    backgroundColor: color,
                    width: '100%'
                }}></div>
                <div className="result-handle-white" style={{
                    left: `${100 - val}%`, // val is Left%, so 100-val is Right% (dist from left)
                    borderColor: color
                }}></div>
            </div>

            {/* 3. Bottom Row: Labels */}
            <div className="result-labels-row">
                <span className="result-label-text">{left}</span>
                <span className="result-label-text">{right}</span>
            </div>
        </div>
    );
}

export default PersonalityQuiz;
