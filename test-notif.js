import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
const env = dotenv.parse(fs.readFileSync('.env'));
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function test() {
  // 1. Check profiles
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('id, display_name').limit(2);
  console.log("Profiles:", profiles);
  
  if (!profiles || profiles.length < 2) return;
  
  // 2. Try to insert a notification with anon key (will fail due to RLS, but we can see the exact RLS error)
  const { data: insertData, error: insertErr } = await supabase.from('notifications').insert({
    user_id: profiles[0].id,
    type: 'EVENT_REQUEST',
    actor_id: profiles[1].id
  });
  console.log("Insert Error (Anon):", insertErr);
  
  // 3. Count notifications
  const { data: countData, error: countErr } = await supabase.from('notifications').select('id', { count: 'exact' });
  console.log("Total Notifications:", countData?.length, "Error:", countErr);
}
test();
