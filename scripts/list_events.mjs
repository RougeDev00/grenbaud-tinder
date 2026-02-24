import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listEvents() {
    const { data, error } = await supabase
        .from('events')
        .select('*');

    if (error) {
        console.error('Error listing events:', error.message);
    } else {
        console.log('Remaining events:', JSON.stringify(data, null, 2));
    }
}

listEvents();
