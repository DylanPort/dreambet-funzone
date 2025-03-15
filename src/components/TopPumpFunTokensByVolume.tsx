
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

  // Initial data fetch
  useEffect(() => {
    fetchTopTokensByVolume();

    // Set up subscription for real-time updates
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
      // Trigger the edge function to fetch the latest data
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

        // Fetch the updated data
        await fetchTopTokensByVolume();
      }
    } catch (error) {
      console.error("Error refreshing tokens:", error);
      toast.error("Failed to refresh top tokens");
    } finally {
      setRefreshing(false);
    }
  };

  // Add the JSX return statement
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 overflow-hidden">
      <div className="p-4 bg-black/30 border-b border-white/10">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Top PumpFun Tokens By Volume</h2>
          <Button 
            onClick={handleRefresh} 
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="flex items-center"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
      <div className="p-4">
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin w-6 h-6 border-2 border-current border-t-transparent rounded-full"></div>
          </div>
        ) : tokens.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tokens.map((token) => (
              <TokenCard key={token.token_mint} token={token} />
            ))}
          </div>
        ) : (
          <div className="text-center p-8 text-gray-400">
            No tokens found. Please try again later.
          </div>
        )}
      </div>
    </div>
  );
};

export default TopPumpFunTokensByVolume;
