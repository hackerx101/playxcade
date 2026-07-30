import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://eqcvnwcvahziwswbohlx.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxY3Zud2N2YWh6aXdzd2JvaGx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzNTQ5ODMsImV4cCI6MjEwMDkzMDk4M30.Dw6axbr0EWfrCiBaxT8_PajnTZEV7ELEV5QdGF1j7S4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
