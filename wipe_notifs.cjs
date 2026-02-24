const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log("Wiping all SPY and SPY_RECIPROCAL notifications...");
    const { data, error } = await supabase
        .from('notifications')
        .delete()
        .in('type', ['SPY', 'SPY_RECIPROCAL']);

    if (error) {
        console.error("Error deleting notifications:", error);
    } else {
        console.log("Successfully deleted all spy notifications from the database.");
    }
}
run();
