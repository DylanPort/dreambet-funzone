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
  return;
};
export default TopPumpFunTokensByVolume;