import { createClient } from "@supabase/supabase-js";

export type Report = {
  id: string;
  company_name: string;
  report_content: string;
  created_at: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
