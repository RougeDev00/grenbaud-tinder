import type { Profile } from '../types';
import { PERSONALITY_QUESTIONS } from '../data/personalityQuestions';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { createNotification, checkReciprocalInterest } from './notificationService';

// Direct fetch helper for Edge Functions (bypasses JWT verification issues)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function callEdgeFunction(body: Record<string, unknown>): Promise<any> {
    // Send the authenticated user's JWT for server-side verification
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || SUPABASE_ANON_KEY;

    const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-ai`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Edge Function error ${res.status}: ${errText}`);
    }
    return res.json();
}

// Session storage key — v8 uses directional keys (viewer→target)
const CACHE_KEY_PREFIX = 'baudr_compatibility_v8_';

// Directional cache key: viewer_id → target_id (NOT sorted)
export const getCompatibilityCacheKey = (viewerId: string, targetId: string) => {
    return CACHE_KEY_PREFIX + `${viewerId}-${targetId}`;
};

export const getCachedCompatibility = (key: string): { score: number, explanation: string } | null => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (e) {
        return null;
    }
};

/**
 * Scan localStorage for all AI-confirmed compatibility scores >= minScore for a given user.
 * Returns [{ partnerId, score }] sorted by score descending.
 */
export const getHighScoringMatches = (userId: string, minScore: number = 80): { partnerId: string; score: number }[] => {
    const results: { partnerId: string; score: number }[] = [];
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key || !key.startsWith(CACHE_KEY_PREFIX)) continue;
            const pairStr = key.replace(CACHE_KEY_PREFIX, '');
            const ids = pairStr.split('-');
            if (ids.length !== 2) continue;
            // Check if this user is one of the pair
            const partnerId = ids[0] === userId ? ids[1] : ids[1] === userId ? ids[0] : null;
            if (!partnerId) continue;
            const data = getCachedCompatibility(key);
            if (data && data.score >= minScore) {
                results.push({ partnerId, score: data.score });
            }
        }
    } catch (e) {
        console.warn('Error scanning compatibility cache:', e);
    }
    return results.sort((a, b) => b.score - a.score);
};

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Sort two UUIDs so user_a is always the smaller one (matches DB constraint) */
const sortedPair = (id1: string, id2: string): [string, string] =>
    id1 < id2 ? [id1, id2] : [id2, id1];

const setCachedCompatibility = async (
    viewerId: string,
    targetId: string,
    data: { score: number; explanation: string }
): Promise<void> => {
    // 1. Always write to localStorage for instant UI feedback
    try {
        const key = getCompatibilityCacheKey(viewerId, targetId);
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.warn('LocalStorage write failed', e);
    }

    // 2. Persist to Supabase (source of truth) with generated_by
    if (!isSupabaseConfigured) return;
    try {
        const [user_a, user_b] = sortedPair(viewerId, targetId);
        const { error } = await supabase
            .from('compatibility_scores')
            .upsert(
                { user_a, user_b, generated_by: viewerId, score: data.score, explanation: data.explanation },
                { onConflict: 'generated_by,user_a,user_b' }
            );
        if (error) console.error('[DB] Error saving compatibility score:', error);
        else console.log('[DB] Compatibility score saved for generator:', viewerId);
    } catch (e) {
        console.error('[DB] Exception saving compatibility score:', e);
    }
};

export const clearCompatibilityCache = (id1: string, id2: string) => {
    const key = getCompatibilityCacheKey(id1, id2);
    try {
        localStorage.removeItem(key);
    } catch (e) {
        console.warn('Failed to clear compatibility cache', e);
    }
};

export const generateProfileSummary = async (
    profile: Partial<Profile>,
    answers?: Record<number, number>
): Promise<string | null> => {
    if (!isSupabaseConfigured) return null;

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

        const data = await callEdgeFunction({ action: 'summary', payload: { prompt: prompt } });
        return data?.content || null;
    } catch (error) {
        console.error('[AI] Error generating summary:', error);
        return null;
    }
};

export const generatePersonalityAnalysis = async (
    profile: Partial<Profile>,
    answers: Record<number, number>
): Promise<string | null> => {
    if (!isSupabaseConfigured) return null;

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

        const data = await callEdgeFunction({ action: 'personality', payload: { prompt: prompt } });
        return data?.content || null;
    } catch (error) {
        console.error('[AI] Error generating personality analysis:', error);
        return null;
    }
};

export const getStoredCompatibility = async (
    viewerId: string,
    targetId: string
): Promise<{ score: number; explanation: string } | null> => {
    // Always check Supabase (source of truth) — query by generated_by
    if (!isSupabaseConfigured) return null;
    const key = getCompatibilityCacheKey(viewerId, targetId);
    try {
        const [user_a, user_b] = sortedPair(viewerId, targetId);
        const { data, error } = await supabase
            .from('compatibility_scores')
            .select('score, explanation')
            .eq('user_a', user_a)
            .eq('user_b', user_b)
            .eq('generated_by', viewerId)
            .maybeSingle();

        if (error) {
            console.error('[DB] Error fetching compatibility score:', error);
            return null;
        }
        if (!data) {
            // Score was deleted or doesn't exist — clear stale localStorage cache
            try { localStorage.removeItem(key); } catch (_) { /* */ }
            return null;
        }

        // Hydrate localStorage cache
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (_) {/* ignore */ }

        return data as { score: number; explanation: string };
    } catch (e) {
        console.error('[DB] Exception fetching compatibility score:', e);
        return null;
    }
};

export const generateCompatibilityExplanation = async (
    user1: Profile,
    user2: Profile,
    currentScore: number
): Promise<{ score: number, explanation: string } | null> => {
    // IDs sorting removed as DB logic is disabled

    // We no longer check the DB for existing scores, allowing each user to generate their own.

    if (!isSupabaseConfigured) return null;

    try {
        const prompt = `
Sei un brillante e spietato analista di relazioni per la community "Baudr" di GrenBaud. 
Il tuo obiettivo è CALCOLARE LA PERCENTUALE DI COMPATIBILITÀ REALE (da 1 a 100) tra due utenti e spiegare PERCHÉ la pensi così, basandoti sui loro interessi e personalità.

Il sistema ha stimato un punteggio base temporaneo matematico di ${currentScore}%.
**IGNORA QUESTO PUNTEGGIO SE RITIENI CHE LA COMPATIBILITÀ SEMANTICA SIA DIVERSA E CALCOLA TÚ IL PUNTEGGIO FINALE!**

DATI UTENTE 1 (${user1.display_name}):
- Bio: ${user1.bio}
- Interessi e Passioni: ${user1.hobbies}, ${user1.music}, ${user1.music_artists}
- Segue su Twitch/YouTube: ${user1.twitch_watches}, ${user1.twitch_streamers}, ${user1.youtube}, ${user1.youtube_channels}
- Personalità (MBTI): ${user1.personality_type}
- GrenBaud è: ${user1.grenbaud_is}
- Domande: Sogno: ${user1.question_dream}, Weekend: ${user1.question_weekend}, Red Flag: ${user1.question_redflag}

DATI UTENTE 2 (${user2.display_name}):
- Bio: ${user2.bio}
- Interessi e Passioni: ${user2.hobbies}, ${user2.music}, ${user2.music_artists}
- Segue su Twitch/YouTube: ${user2.twitch_watches}, ${user2.twitch_streamers}, ${user2.youtube}, ${user2.youtube_channels}
- Personalità (MBTI): ${user2.personality_type}
- GrenBaud è: ${user2.grenbaud_is}
- Domande: Sogno: ${user2.question_dream}, Weekend: ${user2.question_weekend}, Red Flag: ${user2.question_redflag}

CRITERI DI VALUTAZIONE DEL SUO PUNTEGGIO FONDAMENTALI:
1. **PESO ENORME AGLI INTERESSI IN COMUNE O AFFINI (IL 60% DEL VALORE):** Analizza in modo "furbo" l'affinità semantica. Se a uno piace "viaggiare" e all'altro "scoprire", o entrambi seguono streamer simili, ascoltano musica simile o frequentano ambienti simili (es. entrambi escono molto o entrambi sono casalinghi), il punteggio DEVE partire da una base molto alta (minimo 60%-70%). Anche un singolo interesse molto forte in comune vale tantissimo.
2. **PERSONALITÀ E RISPOSTE (IL 40% DEL VALORE):** Valuta come le personalità MBTI si incastrano (se note) e come divergono i loro sogni/weekend/red flag. Le differenze compensative possono essere positive, le visioni del mondo drammaticamente opposte sono negative. Aggiusta il punteggio di conseguenza.

REGOLE PER L'ANALISI SCRITTA:
- **ANALISI PROFONDA E LUNGA**: Non fare riassuntini. Scrivi un'analisi argomentata e corposa (2-3 paragrafi).
- **ELENCA TUTTO**: Devi assolutamente citare ESPLICITAMENTE tutti gli artisti musicali, streamer, youtuber e hobby affini. Fai i NOMI e spiega perché li accomunano.
- **TONO**: Schietto, da community di GrenBaud, intelligente ma psicologico, anche un po' ironico e argomentato. Niente banalità.
- Restituisci RIGOROSAMENTE un oggetto JSON valido.

FORMATO JSON RICHIESTO:
{
  "score": (INSERISCI QUI IL NUOVO PUNTEGGIO CALCOLATO DA TE DA 1 A 100 IN FORMATO NUMERICO, ignorando se vuoi quello iniziale o tenendolo in considerazione),
  "explanation": "testo della spiegazione (usa i paragrafi con \n\n)..."
}
`;

        const result = await callEdgeFunction({ action: 'compatibility', payload: { prompt: prompt } });
        console.log('[AI] Processed compatibility response:', result);

        if (!result) throw new Error("L'API non ha restituito contenuto. Riprova più tardi.");

        // Error handling if data wasn't JSON formatted already
        if (result && result.explanation) {
            // Use the score from the object if present, otherwise fallback to currentScore
            const finalResult = {
                score: result.score || currentScore,
                explanation: result.explanation
            };

            // Persist to DB + localStorage
            await setCachedCompatibility(user1.id, user2.id, finalResult);

            // Notify user2 that user1 spied on them
            // Check if user2 had already spied on user1 (reciprocal interest)
            // We now check the database directly because localStorage is private to each browser/user
            const user2AlreadySpied = await checkReciprocalInterest(user1.id, user2.id);
            const notificationType = user2AlreadySpied ? 'SPY_RECIPROCAL' : 'SPY';

            createNotification(user2.id, notificationType, user1.id).catch(err =>
                console.error(`[AI] Failed to send ${notificationType} notification:`, err)
            );

            return finalResult;
        }

        throw new Error("L'AI ha restituito un oggetto non valido (manca explanation).");
    } catch (error: any) {
        console.error('[AI] Fatal error in generateCompatibilityExplanation:', error);
        throw error; // Rethrow to let the UI catch and display the specific message
    }
};

// Fetch all users who have "spied" on a given profile (generated AI analysis)
export const getProfileViewers = async (viewedUserId: string): Promise<string[]> => {
    if (!isSupabaseConfigured) return [];
    try {
        const { data, error } = await supabase
            .from('profile_views')
            .select('viewer_id')
            .eq('viewed_id', viewedUserId);

        if (error) {
            console.warn('[AI] Error fetching profile viewers:', error);
            return [];
        }

        return (data || []).map((row: any) => row.viewer_id);
    } catch (e) {
        console.warn('[AI] Error in getProfileViewers:', e);
        return [];
    }
};

