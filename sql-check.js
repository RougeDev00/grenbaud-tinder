import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
const env = dotenv.parse(fs.readFileSync('.env'));
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
async function test() {
   const { data, error } = await supabase.from('notifications').insert({ user_id: '3507cbff-9d58-4de8-9538-dfd03cb824bb', type: 'EVENT_REQUEST' }).select();
   console.log("Insert with select:", data, error);
}
test();
