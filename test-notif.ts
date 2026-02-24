import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
const env = dotenv.parse(fs.readFileSync('.env'));
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function test() {
    // Check notifications count
    const { data, count, error: countErr } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' });

    console.log("Notifications Select:", data?.length, "Count:", count, "Error:", countErr);

    // Try forcing an insert without auth (should fail but tell us exactly why!)
    const { error: insertErr } = await supabase.from('notifications').insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        type: 'EVENT_REQUEST'
    });
    console.log("Insert Error (Anon):", insertErr);
}
test();
