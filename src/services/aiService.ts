import OpenAI from 'openai';
import type { Profile } from '../types';
import { PERSONALITY_QUESTIONS } from '../data/personalityQuestions';
// DB imports removed since we only use local cache for AI explanations

// Session storage key
const CACHE_KEY_PREFIX = 'baudr_compatibility_v6_';

export const getCompatibilityCacheKey = (id1: string, id2: string) => {
    return CACHE_KEY_PREFIX + [id1, id2].sort().join('-');
};

export const getCachedCompatibility = (key: string): { score: number, explanation: string } | null => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (e) {
        return null;
    }
};

const setCachedCompatibility = (key: string, data: { score: number, explanation: string }) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.warn('LocalStorage full or unavailable', e);
    }
};

const getOpenAIClient = () => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
        console.warn('OpenAI API Key missing in .env');
        return null;
    }
    return new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true // Required for client-side usage (note: risky for production apps without backend proxy)
    });
};

export const generateProfileSummary = async (
    profile: Partial<Profile>,
    answers?: Record<number, number>
): Promise<string | null> => {
    const openai = getOpenAIClient();
    if (!openai) return null;

    try {
        let answerDetails = '';
        if (answers) {
            answerDetails = '\nRisposte Dettagliate Test Personalità:\n';
            Object.entries(answers).forEach(([qId, val]) => {
                const question = PERSONALITY_QUESTIONS.find(q => q.id === Number(qId));
                if (question) {
                    let meaning = '';
                    if (val === 4) meaning = 'Neutrale';
                    else if (val > 4) meaning = `D'accordo (${val}/7)`;
                    else meaning = `In disaccordo (${val}/7)`;
                    answerDetails += `- "${question.text}": ${meaning}\n`;
                }
            });
        }

        const prompt = `
Sei un analista di profili per "Baudr" (community di GrenBaud). 
Il tuo obiettivo è generare un profilo che sia la TRASCRIZIONE FEDELE E DETTAGLIATA di ogni dato inserito dall'utente.

TASSATIVO E OBBLIGATORIO:
1. **ZERO ALLUCINAZIONI**: Se un campo è "Non specificato" o "Non detto", NON INVENTARE NULLA. Se scrivi che l'utente ha un sogno o un weekend ideale che non è presente nei dati, hai fallito il compito.
2. **MENZIONA TUTTO**: Devi citare TUTTI i nomi propri, marche, hobby, artisti, canali e streamer elencati. Ogni singola parola chiave fornita DEVE essere presente nel testo.
3. **RISPETTA IL DATO BRUTO**: Se l'utente scrive "coglione" riferito a GrenBaud, riportalo. Se scrive "slottare al casino", riportalo. Non censurare e non "abbellire" i fatti se questo significa cambiare il senso o omettere il dettaglio.
4. **DETTAGLI FISICI/ANAGRAFICI**: Età e altezza (se presenti nella Bio) sono fondamentali e vanno inclusi.

STRUTTURA DEL TESTO:
- Il testo deve essere lungo e denso.
- Inizia citando i dati della Bio (Nome, età, altezza).
- Prosegui con Hobby e passioni, elencandoli tutti.
- Passa alla sezione media: cita ogni artista rap/trap, ogni canale YouTube e ogni streamer fornito.
- Concludi con la sezione psicologica basata sulle Risposte Dettagliate del test (se presenti).

Dati Utente:
- Nome: ${profile.display_name}
- Età: ${profile.age || 'Non specificata'}
- Città: ${profile.city || 'Non specificata'}
- Altezza/Bio: ${profile.bio || 'Non specificata'}
- Genere: ${profile.gender || 'Non specificato'}
- Segno Zodiacale: ${profile.zodiac_sign || 'Non specificato'}
- Hobby: ${profile.hobbies || 'Non specificati'}
- Tempo Libero: ${profile.free_time || 'Non specificato'}
- Musica: ${profile.music || 'Non specificata'} (Artisti: ${profile.music_artists || ''})
- YouTube: ${profile.youtube || ''} (Canali: ${profile.youtube_channels || ''})
- Twitch: ${profile.twitch_watches || ''} (Streamer: ${profile.twitch_streamers || ''})
- GrenBaud è: ${profile.grenbaud_is || 'Non specificato'}
- Cerca: ${profile.looking_for || 'Non specifico'}
- Sogno nel cassetto (Senza inventare!): ${profile.question_dream || 'Non detto'}
- Weekend ideale (Senza inventare!): ${profile.question_weekend || 'Non detto'}
- Red Flag (Senza inventare!): ${profile.question_redflag || 'Non detta'}
- Instagram: ${profile.instagram || 'Non specificato'}
- Personalità MBTI: ${profile.personality_type || 'Non specificata'}

${answerDetails}

SCRIVI IL TESTO ORA. RICORDA: Ogni omissione è un errore. Ogni invenzione (tipo "sogno da astronauta") è un errore gravissimo.
`;

        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-4o-mini",
        });

        return completion.choices[0]?.message?.content || null;
    } catch (error) {
        console.error('[AI] Error generating summary:', error);
        return null;
    }
};

export const generatePersonalityAnalysis = async (
    profile: Partial<Profile>,
    answers: Record<number, number>
): Promise<string | null> => {
    const openai = getOpenAIClient();
    if (!openai) return null;

    try {
        let answerDetails = '\nRisposte Dettagliate:\n';
        Object.entries(answers).forEach(([qId, val]) => {
            const question = PERSONALITY_QUESTIONS.find(q => q.id === Number(qId));
            if (question) {
                let meaning = '';
                if (val === 4) meaning = 'Neutrale';
                else if (val > 4) meaning = `D'accordo (${val}/7)`;
                else meaning = `In disaccordo (${val}/7)`;
                answerDetails += `- "${question.text}": ${meaning}\n`;
            }
        });

        const prompt = `
Sei un esperto psicologo clinico ed analista comportamentale per la community di Baudr. Il tuo compito è fornire un'analisi psicologica profonda e personalizzata basata sui risultati del test MBTI e sulle risposte specifiche date dall'utente.

DATI UTENTE:
- Nome: ${profile.display_name}
- Tipo MBTI: ${profile.personality_type} (Punteggi: Mente ${profile.personality_mind}%, Energia ${profile.personality_energy}%, Natura ${profile.personality_nature}%, Tattica ${profile.personality_tactics}%, Identità ${profile.personality_identity}%)

RISPOSTE DETTAGLIATE DELL'UTENTE (Domanda -> Risposta):
${answerDetails}

L'utente vuole un'analisi specifica che faccia riferimento alle sue risposte. Linee guida:
1. **Analisi del Carattere**: Descrivi il "nucleo" della sua personalità unendo i punteggi MBTI con le tendenze emerse dalle risposte singole.
2. **RIFERIMENTI PRECISI**: Fondamentale! Cita almeno 2-3 risposte specifiche per dare validità all'analisi (es: "Il tuo forte accordo con '[Domanda]' dimostra che...").
3. **Vibe e Social**: Che tipo di energia porta nella community di GrenBaud?
4. **Tono**: Intelligente, empatico, introspettivo. Evita cliché banali. NO titoli o soprannomi (es. "Il Mediatore").

Restituisci solo l'analisi, senza introduzioni.
`;

        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-4o-mini",
        });

        return completion.choices[0]?.message?.content || null;
    } catch (error) {
        console.error('[AI] Error generating personality analysis:', error);
        return null;
    }
};

export const getStoredCompatibility = async (id1: string, id2: string): Promise<{ score: number, explanation: string } | null> => {
    // 1. Check local cache first for instant feedback
    const key = getCompatibilityCacheKey(id1, id2);
    const cached = getCachedCompatibility(key);
    if (cached) return cached;

    // We only rely on local cache now. DB logic removed.
    return null;
};

export const generateCompatibilityExplanation = async (
    user1: Profile,
    user2: Profile,
    currentScore: number
): Promise<{ score: number, explanation: string } | null> => {
    // IDs sorting removed as DB logic is disabled

    // We no longer check the DB for existing scores, allowing each user to generate their own.

    const openai = getOpenAIClient();
    if (!openai) return null;

    try {
        const prompt = `
Sei un analista di relazioni per la community "Baudr" di GrenBaud. 
Il tuo obiettivo è spiegare PERCHÉ due utenti hanno una determinata compatibilità, basandoti sui loro interessi. 

Il punteggio matematico calcolato dal sistema è ESATTAMENTE ${currentScore}%. 
**NON MODIFICARE QUESTO PUNTEGGIO.** Il tuo compito è solo giustificarlo analizzando cosa hanno in comune (es. ascoltano gli stessi artisti, seguono gli stessi streamer) o cosa li differenzia.

DATI UTENTE 1 (${user1.display_name}):
- Bio: ${user1.bio}
- Interessi: ${user1.hobbies}, ${user1.music_artists}
- Personalità: ${user1.personality_type}
- GrenBaud è: ${user1.grenbaud_is}
- Domande: Sogno: ${user1.question_dream}, Weekend: ${user1.question_weekend}, Red Flag: ${user1.question_redflag}

DATI UTENTE 2 (${user2.display_name}):
- Bio: ${user2.bio}
- Interessi: ${user2.hobbies}, ${user2.music_artists}
- Personalità: ${user2.personality_type}
- GrenBaud è: ${user2.grenbaud_is}
- Domande: Sogno: ${user2.question_dream}, Weekend: ${user2.question_weekend}, Red Flag: ${user2.question_redflag}

REGOLE:
- **ANALISI PROFONDA E LUNGA**: Non fare riassuntini. Scrivi un'analisi dettagliata (2-3 paragrafi belli corposi).
- **ELENCA TUTTO**: Devi assolutamente citare ESPLICITAMENTE tutti gli artisti musicali, streamer (es. Blur), youtuber (es. Ale della Giusta) e hobby che hanno in comune. Non generalizzare, fai i NOMI.
- **CONSIDERAZIONI INTERESSANTI**: Analizza come i loro tipi MBTI, i loro sogni e le loro "Red Flag" si incastrano. Fai riflessioni psicologiche e divertenti su come interagirebbero nella vita reale o in chat.
- **TONO**: Schietto, da community di GrenBaud, ma intelligente e argomentato.
- Restituisci RIGOROSAMENTE un oggetto JSON valido.

FORMATO JSON RICHIESTO:
{
  "score": ${currentScore},
  "explanation": "testo della spiegazione..."
}
`;

        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-4o-mini",
            response_format: { type: "json_object" }
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) return null;

        const result = JSON.parse(content) as { score: number, explanation: string };

        if (result && result.score && result.explanation) {
            // We no longer save to the DB, keeping it 100% local cache.

            // 3. Save to Local Cache (Speed)
            const cacheKey = getCompatibilityCacheKey(user1.id, user2.id);
            setCachedCompatibility(cacheKey, result);

            return result;
        }

        return null;
    } catch (error) {
        console.error('[AI] Error generating compatibility explanation:', error);
        return null;
    }
};
