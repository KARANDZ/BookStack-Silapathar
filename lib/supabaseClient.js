import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rtpxzmdmvnswtakbvdhx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0cHh6bWRtdm5zd3Rha2J2ZGh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NTQ4MDYsImV4cCI6MjA4MTAzMDgwNn0.4T4ydEFz24D80KBCFxlbmUDmAwdDb6C20Yefa5x7Em8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

