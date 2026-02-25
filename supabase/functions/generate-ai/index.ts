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

serve(async (req) => {
    const cors = getCorsHeaders(req);
    if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

    try {
        // ─── JWT Authentication ───────────────────────────────────
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return new Response(JSON.stringify({ error: "Missing auth token" }),
                { headers: { ...cors, "Content-Type": "application/json" }, status: 401 });
        }

        // User client (with user's JWT — for auth verification)
        const supabaseUser = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_ANON_KEY")!,
            { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
        if (authError || !user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }),
                { headers: { ...cors, "Content-Type": "application/json" }, status: 401 });
        }

        // ─── DB Rate Limit Check (persistent, 1000/day) ──────────
        // Service role client (bypasses RLS, can call the rate limit function)
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        const { data: allowed, error: rlError } = await supabaseAdmin.rpc(
            'check_ai_rate_limit',
            { p_user_id: user.id, p_daily_max: 1000 }
        );

        if (rlError) {
            console.error("Rate limit check error:", rlError);
            // Fail open on DB error (don't block users if DB hiccups)
        } else if (allowed === false) {
            return new Response(
                JSON.stringify({ error: "Hai raggiunto il limite di 1000 richieste AI al giorno. Riprova domani." }),
                { headers: { ...cors, "Content-Type": "application/json" }, status: 429 }
            );
        }

        // ─── Process AI request ───────────────────────────────────
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
        console.error("AI Function Error:", error);
        return new Response(JSON.stringify({ error: error.message }),
            { headers: { ...cors, "Content-Type": "application/json" }, status: 400 });
    }
});
