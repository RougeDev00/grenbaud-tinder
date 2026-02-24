import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

const env = dotenv.parse(fs.readFileSync('.env'));
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function test() {
    // Try joining with a completely fake relationship name to see if it errors
    const { data: errorData, error: joinError } = await supabase
        .from('notifications')
        .select(`*, fake_profile:profiles!fake_id(display_name)`)
        .limit(1);
    console.log("FAKE JOIN ERROR:", joinError);
}
test();
