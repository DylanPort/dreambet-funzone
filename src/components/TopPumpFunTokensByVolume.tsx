import React, { useState, useEffect } from 'react';
import { TrendingUp, BarChart2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import TokenCard from './TokenCard';
import { transformSupabaseTokenToCardData } from '@/services/bitqueryService';
import { toast } from 'sonner';

const TopPumpFunTokensByVolume: React.FC = () => {
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTopTokensByVolume = async () => {
    try {
      setLoading(true);
      console.log("Fetching top PumpFun tokens by volume...");
      const {
        data,
        error
      } = await supabase.from('tokens').select('*').not('volume_rank', 'is', null).order('volume_rank', {
        ascending: true
      }).limit(10);
      if (error) {
        console.error("Error fetching top tokens by volume:", error);
        toast.error("Failed to fetch top tokens by volume");
        setLoading(false);
        return;
      }
      console.log("Fetched top tokens by volume:", data);
      if (data && data.length > 0) {
        setTokens(data);
      } else {
        setTokens([]);
        console.log("No top tokens by volume found");
      }
      setLoading(false);
    } catch (error) {
      console.error("Error in fetchTopTokensByVolume:", error);
      toast.error("Failed to fetch top tokens by volume");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopTokensByVolume();

    const channel = supabase.channel('tokens-volume-changes').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'tokens',
      filter: 'volume_rank.gte.1'
    }, () => {
      console.log("Received real-time update for top tokens");
      fetchTopTokensByVolume();
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    toast.info("Refreshing top tokens by volume...");
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('fetch-top-pumpfun-tokens', {
        method: 'POST',
        body: {}
      });
      if (error) {
        console.error("Error triggering token update:", error);
        toast.error("Failed to refresh top tokens");
      } else {
        console.log("Refresh response:", data);
        toast.success(`Successfully refreshed top tokens`);

        await fetchTopTokensByVolume();
      }
    } catch (error) {
      console.error("Error refreshing tokens:", error);
      toast.error("Failed to refresh top tokens");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="top-pumpfun-tokens">
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center">
          <BarChart2 className="mr-2 h-5 w-5 text-green-400" />
          <h2 className="text-lg font-bold">Top Volume PumpFun Tokens</h2>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh} 
          disabled={refreshing}
          className="flex items-center text-xs"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="bg-dream-background/40 rounded-lg p-4 animate-pulse h-44"></div>
          ))}
        </div>
      ) : tokens.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tokens.map((token, index) => (
            <TokenCard 
              key={token.token_mint || index}
              {...transformSupabaseTokenToCardData(token)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-dream-foreground/60">
          <p>No top volume tokens found at the moment.</p>
          <p className="text-sm mt-2">Check back later or refresh!</p>
        </div>
      )}
    </div>
  );
};

export default TopPumpFunTokensByVolume;
