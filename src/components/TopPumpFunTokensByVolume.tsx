
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

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-display font-bold flex items-center gap-2">
          <BarChart2 className="text-dream-accent1" />
          Top PumpFun Tokens by Volume
        </h2>
        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={refreshing ? "animate-spin" : ""} size={16} />
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-panel p-4 animate-pulse h-44" />
          ))}
        </div>
      ) : tokens.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tokens.map((token, index) => {
            const cardData = transformSupabaseTokenToCardData(token);
            return (
              <TokenCard
                key={`${cardData.id}-${index}`}
                {...cardData}
                index={index}
              />
            );
          })}
        </div>
      ) : (
        <div className="glass-panel p-6 text-center">
          <p>No top tokens by volume found. Try refreshing or check back later.</p>
          <Button onClick={handleRefresh} className="mt-4" disabled={refreshing}>
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      )}
    </section>
  );
};

export default TopPumpFunTokensByVolume;
