import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { OpenAI } from "npm:openai@^4.22.0";
import { createClient } from "npm:@supabase/supabase-js@^2.95.3";

// Allowed origins — restrict to production + local dev
const ALLOWED_ORIGINS = [
    "https://baudr.fun",
    "https://www.baudr.fun",
    "http://localhost:4173",
    "http://localhost:5173",
];

function getCorsHeaders(req: Request) {
    const origin = req.headers.get("origin") || "";
    const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
    return {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    };
}

// ═══════════════════════════════════════════════════════════
// RATE LIMITING — in-memory per user
// ═══════════════════════════════════════════════════════════
const RATE_LIMIT_PER_MINUTE = 5;
const RATE_LIMIT_PER_DAY = 1000;

interface UserRateData {
    minuteTimestamps: number[];  // timestamps of calls in current minute window
    dayCount: number;            // total calls today
    dayReset: number;            // timestamp when day counter resets
}

const rateLimitStore = new Map<string, UserRateData>();

// Cleanup stale entries every 10 minutes to prevent memory leaks
setInterval(() => {
    const now = Date.now();
    for (const [userId, data] of rateLimitStore) {
        // Remove users who haven't made a call in over 2 hours
        if (data.minuteTimestamps.length === 0 && now > data.dayReset) {
            rateLimitStore.delete(userId);
        }
    }
}, 10 * 60 * 1000);

function checkRateLimit(userId: string): { allowed: boolean; retryAfterMs?: number; reason?: string } {
    const now = Date.now();
    const oneMinuteAgo = now - 60_000;
    const oneDayMs = 24 * 60 * 60 * 1000;

    let data = rateLimitStore.get(userId);
    if (!data) {
        data = { minuteTimestamps: [], dayCount: 0, dayReset: now + oneDayMs };
        rateLimitStore.set(userId, data);
    }

    // Reset daily counter if past reset time
    if (now >= data.dayReset) {
        data.dayCount = 0;
        data.dayReset = now + oneDayMs;
    }

    // Check daily limit
    if (data.dayCount >= RATE_LIMIT_PER_DAY) {
        const retryAfterMs = data.dayReset - now;
        return { allowed: false, retryAfterMs, reason: `Limite giornaliero raggiunto (${RATE_LIMIT_PER_DAY}/giorno). Riprova domani.` };
    }

    // Clean old minute timestamps
    data.minuteTimestamps = data.minuteTimestamps.filter(t => t > oneMinuteAgo);

    // Check per-minute limit
    if (data.minuteTimestamps.length >= RATE_LIMIT_PER_MINUTE) {
        const oldestInWindow = data.minuteTimestamps[0];
        const retryAfterMs = (oldestInWindow + 60_000) - now;
        return { allowed: false, retryAfterMs, reason: `Troppo veloce! Max ${RATE_LIMIT_PER_MINUTE} richieste al minuto. Riprova tra ${Math.ceil(retryAfterMs / 1000)}s.` };
    }

    // Allowed — record the call
    data.minuteTimestamps.push(now);
    data.dayCount++;
    return { allowed: true };
}

serve(async (req) => {
    const cors = getCorsHeaders(req);

    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: cors });
    }

    try {
        // ─── JWT Authentication ───────────────────────────────────
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return new Response(
                JSON.stringify({ error: "Missing auth token" }),
                { headers: { ...cors, "Content-Type": "application/json" }, status: 401 }
            );
        }

        // Verify the JWT by creating a Supabase client with the user's token
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_ANON_KEY")!,
            { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: "Unauthorized — invalid or expired token" }),
                { headers: { ...cors, "Content-Type": "application/json" }, status: 401 }
            );
        }

        // ─── Rate Limiting ────────────────────────────────────────
        const rateCheck = checkRateLimit(user.id);
        if (!rateCheck.allowed) {
            return new Response(
                JSON.stringify({ error: rateCheck.reason }),
                {
                    headers: {
                        ...cors,
                        "Content-Type": "application/json",
                        "Retry-After": String(Math.ceil((rateCheck.retryAfterMs || 60000) / 1000)),
                    },
                    status: 429,
                }
            );
        }

        // ─── Process AI request ───────────────────────────────────
        const { action, payload } = await req.json();

        const openai = new OpenAI({
            apiKey: Deno.env.get("OPENAI_API_KEY"),
        });

        let result = null;

        if (action === "summary") {
            const completion = await openai.chat.completions.create({
                messages: [{ role: "user", content: payload.prompt }],
                model: "gpt-4o-mini",
            });
            result = { content: completion.choices[0]?.message?.content };

        } else if (action === "personality") {
            const completion = await openai.chat.completions.create({
                messages: [{ role: "user", content: payload.prompt }],
                model: "gpt-4o-mini",
            });
            result = { content: completion.choices[0]?.message?.content };

        } else if (action === "compatibility") {
            const completion = await openai.chat.completions.create({
                messages: [{ role: "user", content: payload.prompt }],
                model: "gpt-4o-mini",
                response_format: { type: "json_object" },
                max_tokens: 1500,
            });
            const rawContent = completion.choices[0]?.message?.content || "{}";
            const cleanContent = rawContent.replace(/```json\n?|\n?```/g, '').trim();
            result = JSON.parse(cleanContent);

        } else {
            return new Response(
                JSON.stringify({ error: `Unknown action: ${action}` }),
                { headers: { ...cors, "Content-Type": "application/json" }, status: 400 }
            );
        }

        return new Response(JSON.stringify(result), {
            headers: { ...cors, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        console.error("AI Function Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...cors, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
