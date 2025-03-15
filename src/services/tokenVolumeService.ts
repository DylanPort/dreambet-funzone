
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TokenVolumeData {
  token_mint: string;
  volume_24h: number;
  liquidity?: number;
  current_market_cap?: number;
  last_trade_price?: number;
  token_name?: string;
  token_symbol?: string;
  created_time?: string;
}

export const fetchTokensByVolumeCategory = async (category: string): Promise<TokenVolumeData[]> => {
  try {
    console.log(`Fetching tokens with volume category: ${category}`);
    
    // Make sure we explicitly select only fields that exist in the database
    const { data, error } = await supabase
      .from('tokens')
      .select('token_mint, volume_24h, current_market_cap, last_trade_price, token_name, token_symbol')
      .eq('volume_category', category)
      .order('volume_24h', { ascending: false });
    
    if (error) {
      console.error(`Error fetching ${category} tokens:`, error);
      toast.error(`Failed to fetch ${category} tokens`);
      throw error;
    }
    
    // Create a simple array of token data without complex type transformations
    let tokens: TokenVolumeData[] = [];
    
    if (data && Array.isArray(data)) {
      // Using a simple map with explicit return type
      tokens = data.map((item: any): TokenVolumeData => ({
        token_mint: item.token_mint || '',
        volume_24h: item.volume_24h || 0,
        current_market_cap: item.current_market_cap,
        last_trade_price: item.last_trade_price,
        token_name: item.token_name,
        token_symbol: item.token_symbol
      }));
    }
    
    console.log(`Found ${tokens.length} tokens in category ${category}`);
    return tokens;
  } catch (error) {
    console.error(`Error in fetchTokensByVolumeCategory for ${category}:`, error);
    return [];
  }
};

export const fetchAbove15kTokens = () => fetchTokensByVolumeCategory('above_15k');
export const fetchAbove30kTokens = () => fetchTokensByVolumeCategory('above_30k');

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
      toast.error("Failed to update token volumes");
      return false;
    }
    
    console.log("Token volume update response:", data);
    
    if (data?.success) {
      toast.success(`Updated ${data.tokensProcessed} tokens (${data.tokensAbove15k} above 15k, ${data.tokensAbove30k} above 30k)`);
      return true;
    } else {
      toast.error(`Failed to update tokens: ${data?.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.error("Exception in triggerTokenVolumeUpdate:", error);
    toast.error("Failed to update token volumes");
    return false;
  }
};
