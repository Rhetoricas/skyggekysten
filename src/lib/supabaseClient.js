// supabaseClient.js
import { createClient } from '@supabase/supabase-js';
import { SPIL_PROTOCOL_VERSION, TROFAE_GENERATION } from './klientVersioner';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
        headers: {
            'x-game-protocol': String(SPIL_PROTOCOL_VERSION),
            'x-trophy-generation': String(TROFAE_GENERATION)
        }
    }
});
