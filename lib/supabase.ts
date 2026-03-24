/* 
Simply lets you connect to the superbase client 
*/
import { createClient } from "@supabase/supabase-js";

// adding this or statment so that the app doesn't just crash since adding to data isn't most crutial
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";

// Use service role key for server-side operations (bypasses RLS)
// Use anon key for client-side operations (respects RLS policies)
// this is dangerous but will ignore for now since it's not for production
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

// really useful error message i
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !supabaseServiceKey) {
  console.warn(" Supabase credentials not found. need an .env.local file");
}

// function creates a client takes int URL nad service Key
export const supabase = createClient(supabaseUrl, supabaseServiceKey);
