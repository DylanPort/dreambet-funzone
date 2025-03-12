import React, { useState, useEffect } from 'react';
import { transformSupabaseTokenToCardData } from '@/services/bitqueryService';
import TokenCard from './TokenCard';
import { BarChart3, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePumpPortalWebSocket } from '@/services/pumpPortalWebSocketService';
import { triggerTokenVolumeUpdate } from '@/services/tokenVolumeService';

const TopVolumeTokens: React.FC = () => {
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const pumpPortal = usePumpPortalWebSocket();

  const fetchHighMarketCapTokens = async () => {
    try {
      setLoading(true);
      console.log("Fetching high market cap tokens...");
      let tokensFound = false;

      // First try the PumpPortal WebSocket data (prioritize this as real-time source)
      if (pumpPortal.rawTokens && pumpPortal.rawTokens.length > 0) {
        // Filter tokens with market cap over 15k
        const highMarketCapTokens = pumpPortal.rawTokens.filter(token => token.marketCapSol && token.marketCapSol > 15000);
        console.log("WebSocket tokens:", pumpPortal.rawTokens);
        console.log("Filtered high market cap tokens:", highMarketCapTokens);
        if (highMarketCapTokens.length > 0) {
          setTokens(highMarketCapTokens.map(token => ({
            token_mint: token.mint,
            token_name: token.name || 'Unknown Token',
            token_symbol: token.symbol || '',
            current_market_cap: token.marketCapSol || 0,
            last_trade_price: token.marketCapSol ? token.marketCapSol / 1000000000 : 0,
            volume_24h: token.volume24h || 0
          })));
          tokensFound = true;
          console.log("Using WebSocket data for high market cap tokens");
        }
      }

      // If no tokens from WebSocket, try to use Supabase
      if (!tokensFound) {
        console.log("No tokens from WebSocket, fetching from Supabase...");

        // Query tokens from Supabase with market cap higher than 15k
        const {
          data,
          error
        } = await supabase.from('tokens').select('*').gt('current_market_cap', 15000).order('current_market_cap', {
          ascending: false
        }).limit(12);
        if (error) {
          console.error("Error fetching tokens:", error);
          toast.error("Failed to fetch tokens");
          return;
        }
        console.log("Fetched tokens from Supabase:", data);

        // If we have data from Supabase, use it
        if (data && data.length > 0) {
          setTokens(data);
          tokensFound = true;
          console.log("Using Supabase data for high market cap tokens");
        } else {
          // Try to force refresh from Bitquery to get real data
          console.log("No tokens in Supabase with MCAP > 15k, triggering update-token-volumes...");
          await triggerTokenVolumeUpdate();

          // Check again after update
          const {
            data: refreshedData,
            error: refreshError
          } = await supabase.from('tokens').select('*').gt('current_market_cap', 15000).order('current_market_cap', {
            ascending: false
          }).limit(12);
          if (!refreshError && refreshedData && refreshedData.length > 0) {
            setTokens(refreshedData);
            tokensFound = true;
            console.log("Using refreshed Supabase data after trigger");
          }
        }
      }

      // If still no tokens, show empty state
      if (!tokensFound) {
        console.log("No tokens found with market cap over 15k");
        setTokens([]);
      }
    } catch (error) {
      console.error("Error in fetchHighMarketCapTokens:", error);
      toast.error("Failed to fetch tokens");
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchHighMarketCapTokens();
  }, []);

  // Subscribe to PumpPortal when connected
  useEffect(() => {
    if (pumpPortal.connected) {
      console.log("Subscribing to PumpPortal WebSocket");
      pumpPortal.subscribeToNewTokens();
    }
  }, [pumpPortal.connected]);

  // Refresh when new tokens are received in PumpPortal
  useEffect(() => {
    if (pumpPortal.rawTokens && pumpPortal.rawTokens.length > 0) {
      console.log("New tokens received from PumpPortal, refreshing data");
      fetchHighMarketCapTokens();
    }
  }, [pumpPortal.rawTokens]);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    toast.info("Refreshing tokens data...");
    try {
      console.log("Forcing data refresh...");

      // Force reconnect the WebSocket to get fresh data
      if (pumpPortal.connected) {
        console.log("Disconnecting and reconnecting WebSocket");
        pumpPortal.disconnect();
        setTimeout(() => {
          pumpPortal.connect();
        }, 1000);
      }

      // Trigger the update-token-volumes Edge Function
      await triggerTokenVolumeUpdate();

      // After function call, refresh our data
      await fetchHighMarketCapTokens();
      toast.success("Token data refreshed successfully");
    } catch (error) {
      console.error("Error refreshing tokens:", error);
      toast.error("Failed to refresh token data");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-dream-accent2" />
          <h2 className="text-xl font-semibold">High Volume Tokens</h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <p>Loading...</p>
        ) : tokens.length > 0 ? (
          tokens.map((token, index) => (
            <TokenCard
              key={token.token_mint}
              {...transformSupabaseTokenToCardData(token)}
              index={index}
            />
          ))
        ) : (
          <p>No high volume tokens found</p>
        )}
      </div>
    </div>
  );
};

export default TopVolumeTokens;
