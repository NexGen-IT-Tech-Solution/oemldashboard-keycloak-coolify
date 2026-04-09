import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ogjqrvjdpsppacvvlqox.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nanFydmpkcHNwcGFjdnZscW94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NTU4NDUsImV4cCI6MjA5MDEzMTg0NX0.MvAgWw0RnmwccZpsDnif5O8PRkwkRTCV_t-fMzrLK4U'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
