import { createClient } from "@supabase/supabase-js";
import { Database } from "../lib/database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePubKey = import.meta.env.VITE_SUPABASE_PUB_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabasePubKey);