const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data: profiles, error: pError } = await supabase.from('profiles').select('id, display_name');
    if (pError) return console.error("Profile error:", pError);

    console.log(`Found ${profiles.length} profiles.`);

    const { data: notifs, error: nError } = await supabase.from('notifications')
        .select('*')
        .in('type', ['SPY', 'SPY_RECIPROCAL'])
        .order('created_at', { ascending: false });
    if (nError) return console.error("Notification error:", nError);

    console.log(`Found ${notifs.length} SPY/SPY_RECIPROCAL notifications:`);
    notifs.forEach(n => {
        const u = profiles.find(p => p.id === n.user_id)?.display_name || n.user_id;
        const a = profiles.find(p => p.id === n.actor_id)?.display_name || n.actor_id;
        console.log(`- Type: ${n.type} | User (Target): ${u} | Actor (Spy): ${a} | Date: ${n.created_at}`);
    });
}
run();
