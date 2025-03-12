
import { supabase } from "@/integrations/supabase/client";

// Token related functions
export const fetchTokens = async () => {
  const { data, error } = await supabase
    .from('tokens')
    .select('*')
    .order('last_updated_time', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const fetchTokenById = async (tokenMint: string) => {
  const { data, error } = await supabase
    .from('tokens')
    .select('*')
    .eq('token_mint', tokenMint)
    .single();
  
  if (error) throw error;
  return data;
};
