import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { OpenAI } from "npm:openai@^4.22.0";
import { corsHeaders } from "../_shared/cors.ts"; // Se non hai cors.ts, lo creiamo o gestiamo CORS qua sotto.

// Gestione CORS inline per semplicità caso d'uso singolo
const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    // Handle CORS preflight options
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: cors });
    }

    try {
        const { action, payload } = await req.json();

        const openai = new OpenAI({
            apiKey: Deno.env.get("OPENAI_API_KEY"),
        });

        let result = null;

        // Scegli quale operazione eseguire in base allAction
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
            // Parse JSON
            const rawContent = completion.choices[0]?.message?.content || "{}";
            const cleanContent = rawContent.replace(/```json\n?|\n?```/g, '').trim();
            result = JSON.parse(cleanContent);
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
