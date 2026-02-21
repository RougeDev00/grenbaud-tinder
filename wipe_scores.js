import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function clearScores() {
    console.log('Clearing old compatibility scores...');
    const { error } = await supabase.from('compatibility_scores').delete().neq('user_a', '00000000-0000-0000-0000-000000000000');
    if (error) {
        console.error('Error clearing table:', error);
    } else {
        console.log('Table cleared successfully! Scores will recalculate on next view.');
    }
}

clearScores();
