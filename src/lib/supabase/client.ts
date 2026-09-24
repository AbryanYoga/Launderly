import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

const supabaseUrl = env.supabaseUrl || "https://placeholder.supabase.co";
const supabaseAnonKey = env.supabaseAnonKey || "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const createSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || supabaseAnonKey
  );
};
