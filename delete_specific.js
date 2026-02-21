import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function purge() {
  const { data, error: selectErr } = await supabase.from('compatibility_scores').select('id');
  if (selectErr) return console.error(selectErr);

  for (const row of data) {
    await supabase.from('compatibility_scores').delete().eq('id', row.id);
  }

  const { data: check } = await supabase.from('compatibility_scores').select('id');
  console.log('Remaining rows:', check?.length);
}
purge();
