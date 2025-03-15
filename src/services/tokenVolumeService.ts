
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TokenVolumeData {
  token_mint: string;
  volume_24h: number;
  liquidity?: number | null;
  current_market_cap?: number | null;
  last_trade_price?: number | null;
  token_name?: string;
  token_symbol?: string;
  created_time?: string;
}

export const fetchTokensByVolumeCategory = async (category: string): Promise<TokenVolumeData[]> => {
  try {
    console.log(`Fetching tokens with volume category: ${category}`);
    
    // Explicitly select fields to avoid type instantiation errors
    const { data, error } = await supabase
      .from('tokens')
      .select('token_mint, volume_24h, current_market_cap, last_trade_price, token_name, token_symbol')
      .eq('volume_category', category)
      .order('volume_24h', { ascending: false });
    
    if (error) {
      console.error(`Error fetching ${category} tokens:`, error);
      return [];
    }
    
    return data as TokenVolumeData[];
  } catch (error) {
    console.error(`Error in fetchTokensByVolumeCategory for ${category}:`, error);
    return [];
  }
};

export const fetchAbove15kTokens = async (): Promise<TokenVolumeData[]> => {
  try {
    const { data, error } = await supabase
      .from('tokens')
      .select('token_mint, volume_24h, current_market_cap, last_trade_price, token_name, token_symbol')
      .gte('volume_24h', 15000)
      .order('volume_24h', { ascending: false });
    
    if (error) {
      console.error('Error fetching tokens above 15k:', error);
      return [];
    }
    
    return data as TokenVolumeData[];
  } catch (error) {
    console.error('Error in fetchAbove15kTokens:', error);
    return [];
  }
};

export const fetchAbove30kTokens = async (): Promise<TokenVolumeData[]> => {
  try {
    const { data, error } = await supabase
      .from('tokens')
      .select('token_mint, volume_24h, current_market_cap, last_trade_price, token_name, token_symbol')
      .gte('volume_24h', 30000)
      .order('volume_24h', { ascending: false });
    
    if (error) {
      console.error('Error fetching tokens above 30k:', error);
      return [];
    }
    
    return data as TokenVolumeData[];
  } catch (error) {
    console.error('Error in fetchAbove30kTokens:', error);
    return [];
  }
};

export const subscribeToTokenVolumeUpdates = (
  category: string,
  callback: (tokens: TokenVolumeData[]) => void
) => {
  // Initial fetch
  fetchTokensByVolumeCategory(category).then(callback);
  
  // Set up real-time subscription
  const channel = supabase
    .channel('tokens-volume-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tokens',
        filter: `volume_category=eq.${category}`
      },
      () => {
        // When we get any changes, fetch the full updated list
        fetchTokensByVolumeCategory(category).then(callback);
      }
    )
    .subscribe();
  
  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
};

// Trigger the token volume update function
export const triggerTokenVolumeUpdate = async (): Promise<boolean> => {
  try {
    console.log("Triggering token volume update via Edge Function");
    const { data, error } = await supabase.functions.invoke('update-token-volumes', {
      method: 'POST',
      body: {}
    });
    
    if (error) {
      console.error("Error triggering token volume update:", error);
      // Only show toast for new bets, not for token volume updates
      return false;
    }
    
    console.log("Token volume update response:", data);
    
    if (data?.success) {
      // Only log to console, don't show toast
      console.log(`Updated ${data.tokensProcessed} tokens (${data.tokensAbove15k} above 15k, ${data.tokensAbove30k} above 30k)`);
      return true;
    } else {
      console.error(`Failed to update tokens: ${data?.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.error("Exception in triggerTokenVolumeUpdate:", error);
    return false;
  }
};
