
import React, { useState, useEffect } from 'react';
import { transformSupabaseTokenToCardData } from '@/services/bitqueryService';
import TokenCard from './TokenCard';
import { BarChart3, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePumpPortalWebSocket } from '@/services/pumpPortalWebSocketService';

const TopVolumeTokens: React.FC = () => {
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const pumpPortal = usePumpPortalWebSocket();

  const fetchPumpFunHighMarketCapTokens = async () => {
    try {
      setLoading(true);
      let tokensFound = false;
      
      // First try the PumpPortal WebSocket data (prioritize this as real-time source)
      if (pumpPortal.rawTokens && pumpPortal.rawTokens.length > 0) {
        // Filter tokens with market cap over 15k
        const highMarketCapTokens = pumpPortal.rawTokens.filter(token => 
          token.marketCapSol && token.marketCapSol > 15000
        );
        
        console.log("Using WebSocket high market cap tokens:", highMarketCapTokens);
        
        if (highMarketCapTokens.length > 0) {
          setTokens(highMarketCapTokens.map(token => ({
            token_mint: token.mint,
            token_name: token.name || 'Unknown Token',
            token_symbol: token.symbol || '',
            current_market_cap: token.marketCapSol || 0,
            last_trade_price: token.marketCapSol ? (token.marketCapSol / token.supply || 1000000000) : 0,
            volume_24h: token.volume24h || 0
          })));
          tokensFound = true;
        }
      }
      
      // If no tokens from WebSocket, try to use Supabase
      if (!tokensFound) {
        // Query tokens from Supabase with market cap higher than 15k
        const { data, error } = await supabase
          .from('tokens')
          .select('*')
          .gt('current_market_cap', 15000)
          .order('current_market_cap', { ascending: false })
          .limit(12);
        
        if (error) {
          console.error("Error fetching tokens:", error);
          toast.error("Failed to fetch tokens");
          return;
        }
        
        console.log("Fetched high market cap tokens from Supabase:", data);
        
        // If we have data from Supabase, use it
        if (data && data.length > 0) {
          setTokens(data);
          tokensFound = true;
        }
      }
      
      // If still no tokens, show empty state
      if (!tokensFound) {
        console.log("No tokens found with market cap over 15k");
        setTokens([]);
      }
    } catch (error) {
      console.error("Error in fetchPumpFunHighMarketCapTokens:", error);
      toast.error("Failed to fetch tokens");
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchPumpFunHighMarketCapTokens();
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
      fetchPumpFunHighMarketCapTokens();
    }
  }, [pumpPortal.rawTokens]);

  const handleRefresh = async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    toast.info("Refreshing tokens data...");
    
    try {
      // Force reconnect the WebSocket to get fresh data
      if (pumpPortal.connected) {
        pumpPortal.disconnect();
        setTimeout(() => {
          pumpPortal.connect();
        }, 1000);
      }
      
      // Trigger the update-token-volumes Edge Function
      await supabase.functions.invoke('update-token-volumes', {
        method: 'POST',
        body: {}
      });
      
      // After function call, refresh our data
      await fetchPumpFunHighMarketCapTokens();
      toast.success("Token data refreshed successfully");
    } catch (error) {
      console.error("Error refreshing tokens:", error);
      toast.error("Failed to refresh token data");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="glass-panel p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-display font-semibold text-dream-foreground flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-dream-accent2" />
          Tokens &gt; 15k MCAP
          <span className="text-xs bg-dream-accent2/20 text-dream-accent2 px-2 py-1 rounded-full ml-2">Live Data</span>
        </h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="text-xs"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin w-8 h-8 border-2 border-dream-accent1 border-t-transparent rounded-full"></div>
        </div>
      ) : tokens.length === 0 ? (
        <div className="text-center py-10 text-dream-foreground/60">
          No tokens found with market cap over 15k. Try refreshing later.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tokens.map((token, index) => (
            <TokenCard 
              key={`${token.token_mint}-${index}`}
              {...transformSupabaseTokenToCardData(token)}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TopVolumeTokens;
