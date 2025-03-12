
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TokenVolumeData {
  token_mint: string;
  token_name: string;
  token_symbol: string;
  volume_24h: number;
  current_market_cap: number;
  last_trade_price: number;
  volume_category: string;
}

export const fetchTokensByVolumeCategory = async (category: string): Promise<TokenVolumeData[]> => {
  try {
    console.log(`Fetching tokens with volume category: ${category}`);
    
    const { data, error } = await supabase
      .from('tokens')
      .select('token_mint, token_name, token_symbol, volume_24h, current_market_cap, last_trade_price')
      .order('volume_24h', { ascending: false });
    
    if (error) {
      console.error(`Error fetching ${category} tokens:`, error);
      toast.error(`Failed to fetch ${category} tokens`);
      return [];
    }
    
    // Filter and transform the data based on volume category
    const transformedData: TokenVolumeData[] = (data || []).map(token => ({
      ...token,
      volume_category: token.volume_24h >= 30000 ? 'above_30k' : 
                      token.volume_24h >= 15000 ? 'above_15k' : 'below_15k'
    })).filter(token => {
      if (category === 'above_30k') return token.volume_24h >= 30000;
      if (category === 'above_15k') return token.volume_24h >= 15000;
      return true;
    });
    
    console.log(`Found ${transformedData.length} tokens in category ${category}`);
    return transformedData;
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
