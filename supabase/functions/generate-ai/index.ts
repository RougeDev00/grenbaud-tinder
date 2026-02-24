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
