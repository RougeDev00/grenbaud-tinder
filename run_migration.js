import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    try {
        const sqlPath = path.join(__dirname, 'supabase', 'add_events.sql');
        const sqlString = fs.readFileSync(sqlPath, 'utf8');

        console.log("Executing SQL migration via RPC...");

        // Fallback: Using a known RPC 'exec_sql' if it exists, or trying a raw post
        // The regular JS client doesn't have a direct 'execute raw SQL' method for security reasons.
        // However, if the user doesn't have CLI access, we can try to use standard REST endpoints 
        // or assume the user has a custom exec_sql function.

        const { data, error } = await supabase.rpc('exec_sql', { sql: sqlString });

        if (error) {
            console.error("RPC Error (exec_sql might not exist). Supabase JS cannot run raw DDL directly from edge functions without an exec_sql wrapper.", error);
            console.log("\n--- INSTRUCTIONS FOR USER ---");
            console.log("Please run the SQL file 'supabase/add_events.sql' directly in your Supabase SQL Editor.");
        } else {
            console.log("Migration successful!", data);
        }
    } catch (err) {
        console.error("Script error:", err);
    }
}

run();
