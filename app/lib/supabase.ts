import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://kvhrwvrwhzhovzdribuq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2aHJ3dnJ3aHpob3Z6ZHJpYnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4NjQ1ODUsImV4cCI6MjA4ODQ0MDU4NX0.hSgK0iR-gE4pRCP6YdlUujgHqbxb55lwO_vijhQNBQg";

export const supabase = createClient(supabaseUrl, supabaseKey);