import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkEvents() {
    const { count, error } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('Error counting events:', error.message);
    } else {
        console.log(`Remaining events: ${count}`);
    }
}

checkEvents();
