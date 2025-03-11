
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
      
      const { data, error } = await supabase
        .from('tokens')
        .select('*')
        .not('volume_rank', 'is', null)
        .order('volume_rank', { ascending: true })
        .limit(10);
      
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
    const channel = supabase
      .channel('tokens-volume-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tokens',
          filter: 'volume_rank.gte.1'
        },
        () => {
          console.log("Received real-time update for top tokens");
          fetchTopTokensByVolume();
        }
      )
      .subscribe();
    
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
      const { data, error } = await supabase.functions.invoke('fetch-top-pumpfun-tokens', {
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
    <div className="glass-panel p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-display font-semibold text-dream-foreground flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-dream-accent1" />
          Top PumpFun Tokens by Volume
          <span className="text-xs bg-dream-accent1/20 text-dream-accent1 px-2 py-1 rounded-full ml-2">Hourly Updates</span>
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
          No top tokens by volume found. Try refreshing to fetch the latest data.
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

export default TopPumpFunTokensByVolume;
