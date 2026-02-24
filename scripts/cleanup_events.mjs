import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not found in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function cleanupEvents() {
    console.log('Attempting to delete all events...');

    // Note: This uses the Anon Key. 
    // If RLS is enabled and strictly enforced, this might only delete events the 'anon' user has permission for (likely none).
    // However, we saw a policy 'Creators can delete their events' with 'USING (true)' for 'authenticated'.

    const { data, error } = await supabase
        .from('events')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete everything

    if (error) {
        console.error('Error deleting events:', error.message);
        console.error('Details:', error.details);
    } else {
        console.log('Successfully deleted all events (that the policy allows).');
    }
}

cleanupEvents();
