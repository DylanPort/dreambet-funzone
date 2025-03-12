
import { supabase } from "@/integrations/supabase/client";

// User related functions
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};
