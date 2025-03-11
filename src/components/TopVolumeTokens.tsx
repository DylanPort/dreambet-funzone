
import React, { useState, useEffect } from 'react';
import { fetchTopTokensByVolumeFromSupabase, transformSupabaseTokenToCardData } from '@/services/bitqueryService';
import TokenCard from './TokenCard';
import { Button } from './ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';

const TopVolumeTokens: React.FC = () => {
  const [topVolumeTokens, setTopVolumeTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      const tokensData = await fetchTopTokensByVolumeFromSupabase();
      setTopVolumeTokens(tokensData);
    } catch (error) {
      console.error("Error fetching top volume tokens:", error);
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
          event: 'UPDATE',
          schema: 'public',
          table: 'tokens'
        },
        (payload) => {
          console.log('Token updated:', payload);
          // Refresh the data when tokens are updated
          fetchData();
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
    
    try {
      await fetchData();
      toast.success("Volume data refreshed successfully!");
    } catch (error) {
      toast.error("Failed to refresh volume data.");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="glass-panel p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-display font-bold text-dream-foreground">
          Most Traded PumpFun Tokens <span className="text-xs bg-dream-accent3/20 text-dream-accent3 px-2 py-1 rounded-full ml-2">24h Volume</span>
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
        <div className="flex justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-dream-accent3 border-t-transparent rounded-full"></div>
        </div>
      ) : topVolumeTokens.length === 0 ? (
        <div className="text-center py-10 text-dream-foreground/60">
          No tokens found. Try refreshing later.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topVolumeTokens.map((token, index) => (
            <TokenCard 
              key={`volume-${token.token_mint}-${index}`}
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
