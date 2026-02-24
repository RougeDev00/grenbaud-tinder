import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
const env = dotenv.parse(fs.readFileSync('.env'));
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function check() {
  console.log("Checking DB directly for user 3507cbff-9d58-4de8-9538-dfd03cb824bb...");
  const { data, error } = await supabase.from('notifications').select('*').eq('user_id', '3507cbff-9d58-4de8-9538-dfd03cb824bb');
  console.log("Notifs found:", data?.length, "Error:", error);
  if (data?.length > 0) {
      console.log(data);
  }
}
check();
