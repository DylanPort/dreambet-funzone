
import { useState, useEffect } from 'react';
import { fetchTokenById } from '@/services/supabaseService';
import { fetchTokenMetrics, addCustomTokenToCache } from '@/services/tokenDataCache';
import { fetchTokenDataFromSolscan } from '@/services/solscanService';
import { fetchGMGNTokenData } from '@/services/gmgnService';
import { toast } from 'sonner';

// Define the expected token structure
export interface TokenData {
  token_mint: string;
  token_name: string;
  token_symbol: string;
  current_market_cap: number;
  initial_market_cap: number;
  created_on: string;
  last_trade_price: number;
  last_updated_time: string;
  total_supply: number;
  volume_24h: number;
}

export const useTokenData = (tokenId: string | undefined) => {
  const [token, setToken] = useState<TokenData | null>(null);
  const [tokenMetrics, setTokenMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTokenData = async () => {
      if (!tokenId) {
        setError("Token ID is missing from URL parameters");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        console.log("Fetching token details for:", tokenId);
        
        // Try to fetch from Supabase first
        let tokenData = await fetchTokenById(tokenId);
        
        // If token not found in Supabase, try searching on Solscan
        if (!tokenData) {
          console.log(`No token found in database for ID: ${tokenId}, trying Solscan...`);
          const solscanData = await fetchTokenDataFromSolscan(tokenId);
          
          if (solscanData) {
            // Create a complete token object with all required properties
            tokenData = {
              token_mint: tokenId,
              token_name: solscanData.name || 'Unknown Token',
              token_symbol: solscanData.symbol || tokenId.substring(0, 5).toUpperCase(),
              current_market_cap: 0,
              initial_market_cap: 0,
              created_on: 'unknown',
              last_trade_price: 0,
              last_updated_time: new Date().toISOString(),
              total_supply: 1000000000,
              volume_24h: 0
            };
            
            // Create custom entry in token cache
            addCustomTokenToCache(tokenId, tokenData);
          }
        }
        
        // If still no token, try GMGN service for more info
        if (!tokenData || !tokenData.token_name) {
          console.log(`No complete token data, trying GMGN for: ${tokenId}`);
          try {
            const gmgnData = await fetchGMGNTokenData(tokenId);
            if (gmgnData.marketCap || gmgnData.price) {
              if (!tokenData) {
                // Create complete token object with default values
                tokenData = {
                  token_mint: tokenId,
                  token_name: 'Unknown Token',
                  token_symbol: tokenId.substring(0, 5).toUpperCase(),
                  current_market_cap: gmgnData.marketCap || 0,
                  initial_market_cap: 0,
                  created_on: 'unknown',
                  last_trade_price: gmgnData.price || 0,
                  last_updated_time: new Date().toISOString(),
                  total_supply: 1000000000,
                  volume_24h: gmgnData.volume24h || 0
                };
              } else {
                tokenData.current_market_cap = gmgnData.marketCap || tokenData.current_market_cap;
                tokenData.last_trade_price = gmgnData.price || tokenData.last_trade_price;
                tokenData.volume_24h = gmgnData.volume24h || tokenData.volume_24h;
              }
            }
          } catch (gmgnError) {
            console.log("Error getting GMGN data:", gmgnError);
            // Continue with whatever data we have
          }
        }
        
        // If still no token, create a minimal placeholder with all required fields
        if (!tokenData) {
          console.log(`Creating minimal placeholder for token: ${tokenId}`);
          tokenData = {
            token_mint: tokenId,
            token_name: 'Unknown Token',
            token_symbol: tokenId.substring(0, 5).toUpperCase(),
            current_market_cap: 0,
            initial_market_cap: 0,
            created_on: 'unknown',
            last_trade_price: 0,
            last_updated_time: new Date().toISOString(),
            total_supply: 1000000000,
            volume_24h: 0
          };
        }
        
        // Always ensure we have at least token_name and token_symbol
        if (!tokenData.token_name) {
          tokenData.token_name = 'Unknown Token';
        }
        if (!tokenData.token_symbol) {
          tokenData.token_symbol = tokenId.substring(0, 5).toUpperCase();
        }
        
        // Ensure all required properties have default values if missing
        const completeTokenData: TokenData = {
          ...tokenData,
          created_on: tokenData.created_on || 'unknown',
          current_market_cap: tokenData.current_market_cap || 0,
          initial_market_cap: tokenData.initial_market_cap || 0,
          last_trade_price: tokenData.last_trade_price || 0,
          last_updated_time: tokenData.last_updated_time || new Date().toISOString(),
          total_supply: tokenData.total_supply || 1000000000,
          volume_24h: tokenData.volume_24h || 0
        };
        
        console.log("Final token data:", completeTokenData);
        setToken(completeTokenData);

        // Fetch token metrics from TokenDataCache
        const metrics = await fetchTokenMetrics(tokenId);
        console.log("Token metrics fetched:", metrics);
        setTokenMetrics(metrics);
      } catch (error: any) {
        console.error("Error fetching token data:", error);
        setError(error?.message || "Failed to load token data. Please try again later.");
        toast.error("Failed to load token data");
      } finally {
        setLoading(false);
      }
    };

    loadTokenData();
  }, [tokenId]);

  return { token, tokenMetrics, loading, error };
};
