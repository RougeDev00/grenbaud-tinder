const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
    const { data: profiles } = await supabase.from('profiles').select('id, display_name').limit(2);
    console.log("Profiles:", profiles);
    
    if (profiles && profiles.length == 2) {
        const p1 = profiles[0].id;
        const p2 = profiles[1].id;
        
        const { data: notifs } = await supabase.from('notifications').select('*').in('type', ['SPY', 'SPY_RECIPROCAL']).limit(10);
        console.log("Notifs:", notifs);
    }
}
run();
