import React, { useState, useEffect } from 'react';
import { TokenVolumeData, fetchAbove15kTokens, fetchAbove30kTokens, subscribeToTokenVolumeUpdates, triggerTokenVolumeUpdate } from '@/services/tokenVolumeService';
import TokenCard from './TokenCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, RefreshCw, ChevronsUp } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from "sonner";
import { transformSupabaseTokenToCardData } from '@/services/bitqueryService';
const VolumeFilteredTokens: React.FC = () => {
  const [tokensAbove15k, setTokensAbove15k] = useState<TokenVolumeData[]>([]);
  const [tokensAbove30k, setTokensAbove30k] = useState<TokenVolumeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('above15k');
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Initial data fetch and set up real-time subscriptions
  useEffect(() => {
    console.log("Setting up volume subscriptions");
    setLoading(true);

    // Subscribe to 15k+ volume tokens
    const unsubscribe15k = subscribeToTokenVolumeUpdates('above_15k', tokens => {
      console.log(`Received ${tokens.length} tokens above 15k`);
      setTokensAbove15k(tokens);
      setLoading(false);
    });

    // Subscribe to 30k+ volume tokens
    const unsubscribe30k = subscribeToTokenVolumeUpdates('above_30k', tokens => {
      console.log(`Received ${tokens.length} tokens above 30k`);
      setTokensAbove30k(tokens);
      setLoading(false);
    });

    // Initial data load if needed
    triggerTokenVolumeUpdate();
    return () => {
      unsubscribe15k();
      unsubscribe30k();
    };
  }, []);

  // Auto refresh timer
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      intervalId = setInterval(() => {
        handleRefresh(false);
      }, 60000); // Refresh every minute
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh]);
  const handleRefresh = async (showToast = true) => {
    if (refreshing) return;
    setRefreshing(true);
    if (showToast) toast.info("Refreshing token volume data...");
    try {
      const success = await triggerTokenVolumeUpdate();
      if (success && showToast) {
        toast.success("Token volume data refreshed");
      }
    } catch (error) {
      console.error("Error refreshing token data:", error);
      if (showToast) toast.error("Failed to refresh token data");
    } finally {
      setRefreshing(false);
    }
  };
  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
    toast.info(`Auto refresh ${!autoRefresh ? 'enabled' : 'disabled'}`);
  };
  return;
};
export default VolumeFilteredTokens;