import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

const env = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('notifications').select('*').limit(5);
  console.log("NOTIFICATIONS (anon):", { data, error });
  
  // Try to test the specific postgrest join
  const { data: joinData, error: joinError } = await supabase
        .from('notifications')
        .select(`*, actor_profile:profiles!actor_id(display_name, photo_1)`)
        .limit(1);
  console.log("JOIN SYNTAX:", { error: joinError });
}
test();
