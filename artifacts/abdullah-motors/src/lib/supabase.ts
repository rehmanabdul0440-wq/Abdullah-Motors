import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl) {
  throw new Error(
    "[Supabase] Missing VITE_SUPABASE_URL.\n" +
      "Add it to your .env file:\n" +
      "  VITE_SUPABASE_URL=https://<project-ref>.supabase.co",
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    "[Supabase] Missing VITE_SUPABASE_ANON_KEY.\n" +
      "Add it to your .env file:\n" +
      "  VITE_SUPABASE_ANON_KEY=<your-anon-public-key>",
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
