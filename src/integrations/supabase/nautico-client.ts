
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase-nautico';

const SUPABASE_URL = "https://hsawlrjmsuduoyfypngj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzYXdscmptc3VkdW95ZnlwbmdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzNDcyMzgsImV4cCI6MjA2NDkyMzIzOH0.kkgksfU-LfQyfI-CEyU5N-uCA-HM1i3f7qT0av7XhF8";

export const nauticoSupabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
