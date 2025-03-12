
import { supabase } from "@/integrations/supabase/client";

export const startPumpPortalSync = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('pump-portal-sync', {
      body: { action: 'start_sync' },
      method: 'POST',
    });
    
    if (error) {
      console.error('Error starting PumpPortal sync:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error invoking PumpPortal sync:', error);
    throw error;
  }
};

export const getTrendingTokens = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('pump-portal-sync', {
      body: { action: 'get_trending_tokens' },
      method: 'POST',
    });
    
    if (error) {
      console.error('Error fetching trending tokens:', error);
      throw error;
    }
    
    return data?.data || [];
  } catch (error) {
    console.error('Error invoking PumpPortal sync for trending tokens:', error);
    throw error;
  }
};

export const fetchTokenData = async (tokenMint: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('pump-portal-sync', {
      body: { action: 'fetch_token_data', tokenMint },
      method: 'POST',
    });
    
    if (error) {
      console.error(`Error fetching token data for ${tokenMint}:`, error);
      throw error;
    }
    
    return data?.data;
  } catch (error) {
    console.error(`Error invoking PumpPortal sync for token ${tokenMint}:`, error);
    throw error;
  }
};
