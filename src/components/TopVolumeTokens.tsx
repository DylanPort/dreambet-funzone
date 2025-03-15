
import React, { useState, useEffect } from 'react';
import { fetchTopTokensByVolumeFromSupabase, transformSupabaseTokenToCardData } from '@/services/bitqueryService';
import TokenCard from './TokenCard';
import { Button } from './ui/button';
import { RefreshCw, ArrowUpDown, DollarSign, AlertCircle } from 'lucide-react';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const TopVolumeTokens: React.FC = () => {
  const [topVolumeTokens, setTopVolumeTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching top volume tokens from Supabase...");
      const tokensData = await fetchTopTokensByVolumeFromSupabase();
      console.log("Tokens data received:", tokensData);
      setTopVolumeTokens(tokensData);
      
      if (tokensData.length === 0) {
        console.log("No tokens found in Supabase, manually triggering update function");
        
        // If no tokens, trigger the edge function to fetch and add some
        try {
          const { data, error } = await supabase.functions.invoke("update-token-volumes");
          if (error) {
            console.error("Error invoking update-token-volumes function:", error);
          } else {
            console.log("Update function response:", data);
            
            // After triggering the function, try to fetch tokens again
            setTimeout(async () => {
              const updatedTokens = await fetchTopTokensByVolumeFromSupabase();
              console.log("Updated tokens after invoking function:", updatedTokens);
              setTopVolumeTokens(updatedTokens);
            }, 3000);
          }
        } catch (functionError) {
          console.error("Exception invoking update-token-volumes function:", functionError);
        }
      }
    } catch (error) {
      console.error("Error fetching top volume tokens:", error);
      setError("Failed to fetch volume data. Please try again later.");
      toast.error("Failed to fetch volume data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('tokens-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'tokens'
        },
        (payload) => {
          console.log('Token change detected:', payload);
          // Refresh the data when tokens are updated
          fetchData();
          toast.info("Token data updated from backend");
        }
      )
      .subscribe();
    
    // Also set a refresh interval
    const intervalId = setInterval(() => {
      console.log("Auto-refreshing token volume data");
      fetchData();
    }, 60000); // Refresh every minute
    
    return () => {
      console.log("Cleaning up TopVolumeTokens subscriptions");
      supabase.removeChannel(channel);
      clearInterval(intervalId);
    };
  }, []);

  const handleRefresh = async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    toast.info("Refreshing volume data...");
    
    try {
      // First try to invoke the update function directly
      await supabase.functions.invoke("update-token-volumes");
      
      // Then fetch the updated data
      await fetchData();
      toast.success("Volume data refreshed successfully!");
    } catch (error) {
      console.error("Error during refresh:", error);
      toast.error("Failed to refresh volume data.");
    } finally {
      setRefreshing(false);
    }
  };

  const handlePlaceBet = (tokenMint: string, tokenName: string) => {
    navigate(`/token/${tokenMint}`, { state: { placeBet: true } });
    toast.success(`Prepare to place a bet on ${tokenName}`);
  };

  // Format volume with commas
  const formatVolume = (volume: number) => {
    return volume ? volume.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '0';
  };

  // Calculate how many tokens to show in the cards section
  const numCardsToShow = Math.min(6, topVolumeTokens.length);

  return (
    <div className="glass-panel p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-display font-bold text-dream-foreground">
          Most Traded PumpFun Tokens <span className="text-xs bg-dream-accent3/20 text-dream-accent3 px-2 py-1 rounded-full ml-2">24h Volume</span>
        </h2>
        <div className="flex gap-2">
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
      </div>
      
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-dream-accent3 border-t-transparent rounded-full"></div>
          <p className="ml-3 text-dream-foreground/60">Loading trending tokens...</p>
        </div>
      ) : error ? (
        <div className="glass-panel p-8 text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-400" />
          <p className="text-dream-foreground/70 mb-4">{error}</p>
          <Button onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} /> Try Again
          </Button>
        </div>
      ) : topVolumeTokens.length === 0 ? (
        <div className="glass-panel p-10 text-center">
          <p className="text-dream-foreground/60 mb-6">
            No tokens found. The system is fetching the latest data.
          </p>
          <div className="flex justify-center">
            <Button 
              variant="outline" 
              onClick={handleRefresh} 
              disabled={refreshing}
              className="mx-auto"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-dream-foreground/10">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Token</th>
                  <th className="py-3 px-4">
                    <div className="flex items-center">
                      <span>Price</span>
                    </div>
                  </th>
                  <th className="py-3 px-4">
                    <div className="flex items-center">
                      <span>24h Volume</span>
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {topVolumeTokens.map((token, index) => (
                  <tr 
                    key={`table-row-${token.token_mint}`} 
                    className="border-b border-dream-foreground/5 hover:bg-dream-foreground/5 transition-colors"
                  >
                    <td className="py-4 px-4 font-medium">{index + 1}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <img 
                          src="/lovable-uploads/74707f80-3a88-4b9c-82d2-5a590a3a32df.png" 
                          alt={token.token_name} 
                          className="w-8 h-8 mr-3"
                        />
                        <div>
                          <div className="font-medium">{token.token_name}</div>
                          <div className="text-dream-foreground/60 text-sm">{token.token_symbol}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-medium">
                      ${token.last_trade_price.toFixed(6)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center text-dream-accent2 font-medium">
                        <DollarSign className="h-4 w-4 mr-1" />
                        {formatVolume(token.volume_24h)}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handlePlaceBet(token.token_mint, token.token_name)}
                        className="bg-dream-accent1 hover:bg-dream-accent1/80 text-white border-none"
                      >
                        Place Bet
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {numCardsToShow > 0 && (
            <>
              <h3 className="text-lg font-semibold mt-8 mb-4">Featured Tokens</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {topVolumeTokens.slice(0, numCardsToShow).map((token, index) => (
                  <TokenCard 
                    key={`volume-${token.token_mint}-${index}`}
                    {...transformSupabaseTokenToCardData(token)}
                    index={index}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default TopVolumeTokens;
