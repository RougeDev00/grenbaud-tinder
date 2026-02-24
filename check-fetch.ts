import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
const env = dotenv.parse(fs.readFileSync('.env'));

// Bypass RLS using the service role key to see EVERY row
const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY);

async function check() {
    console.log("Checking ALL DB notifications...");
    const { data, error } = await supabase.from('notifications').select('*');
    console.log("Notifs found total:", data?.length, "Error:", error);
    if (data?.length) {
        console.log(JSON.stringify(data, null, 2));
    }
}
check();
