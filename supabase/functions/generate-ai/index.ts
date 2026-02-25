import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { OpenAI } from "npm:openai@^4.22.0";
import { createClient } from "npm:@supabase/supabase-js@^2.95.3";

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

// ── RATE LIMITING (10 req/min per user) ──
const RATE_LIMIT = 10;
const userCalls = new Map<string, number[]>();

function isRateLimited(userId: string): boolean {
    const now = Date.now();
    const timestamps = (userCalls.get(userId) || []).filter(t => t > now - 60000);
    if (timestamps.length >= RATE_LIMIT) {
        userCalls.set(userId, timestamps);
        return true;
    }
    timestamps.push(now);
    userCalls.set(userId, timestamps);
    return false;
}

serve(async (req) => {
    const cors = getCorsHeaders(req);
    if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return new Response(JSON.stringify({ error: "Missing auth token" }),
                { headers: { ...cors, "Content-Type": "application/json" }, status: 401 });
        }

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_ANON_KEY")!,
            { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }),
                { headers: { ...cors, "Content-Type": "application/json" }, status: 401 });
        }

        // ── RATE LIMIT CHECK ──
        if (isRateLimited(user.id)) {
            return new Response(
                JSON.stringify({ error: "Limite raggiunto: max 10 richieste al minuto." }),
                { headers: { ...cors, "Content-Type": "application/json" }, status: 429 }
            );
        }

        const { action, payload } = await req.json();
        const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });
        let result = null;

        if (action === "summary" || action === "personality") {
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
            const raw = completion.choices[0]?.message?.content || "{}";
            result = JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim());

        } else {
            return new Response(JSON.stringify({ error: `Unknown action: ${action}` }),
                { headers: { ...cors, "Content-Type": "application/json" }, status: 400 });
        }

        return new Response(JSON.stringify(result), {
            headers: { ...cors, "Content-Type": "application/json" }, status: 200
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }),
            { headers: { ...cors, "Content-Type": "application/json" }, status: 400 });
    }
});
