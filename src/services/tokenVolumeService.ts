
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
    
    // Simplify the transformation to avoid deep type recursion
    const transformedData: TokenVolumeData[] = [];
    
    if (data) {
      for (let i = 0; i < data.length; i++) {
        const token = data[i];
        let volumeCategory = 'below_15k';
        
        // Use nullish coalescing to handle potential undefined/null values
        const volume24h = token.volume_24h ?? 0;
        
        if (volume24h >= 30000) {
          volumeCategory = 'above_30k';
        } else if (volume24h >= 15000) {
          volumeCategory = 'above_15k';
        }
        
        // Only add tokens that match the requested category
        if ((category === 'above_30k' && volumeCategory === 'above_30k') ||
            (category === 'above_15k' && volumeCategory === 'above_15k') ||
            (category === 'below_15k' && volumeCategory === 'below_15k')) {
          
          transformedData.push({
            token_mint: token.token_mint,
            token_name: token.token_name,
            token_symbol: token.token_symbol,
            volume_24h: volume24h,
            current_market_cap: token.current_market_cap ?? 0,
            last_trade_price: token.last_trade_price ?? 0,
            volume_category: volumeCategory
          });
        }
      }
    }
    
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
        table: 'tokens'
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
