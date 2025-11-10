import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fhndnywkzwkptizfshci.supabase.co'  // replace with your actual project URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZobmRueXdrendrcHRpemZzaGNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MDcxMzUsImV4cCI6MjA2ODQ4MzEzNX0.I_VilQpBCDe6ohH7MrPBaS5guHRisL2z_gl5cqky3To'

export const supabase = createClient(supabaseUrl, supabaseKey)
