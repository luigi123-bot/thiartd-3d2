const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('configuraciones').select('*').limit(1);
  if (error) {
    if (error.code === 'PGRST116' || error.message.includes('relation "configuraciones" does not exist')) {
        console.log('Table configuraciones DOES NOT exist');
    } else {
        console.log('Error:', error.message);
    }
  } else {
    console.log('Table configuraciones EXISTS');
  }
}

check();
