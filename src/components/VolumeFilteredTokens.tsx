import React, { useState, useEffect } from 'react';
import { TokenVolumeData, fetchTokensByVolumeCategory, subscribeToTokenVolumeUpdates, triggerTokenVolumeUpdate } from '@/services/tokenVolumeService';
import TokenCard from './TokenCard';
import { RefreshCw, Rocket } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from "sonner";
import { transformSupabaseTokenToCardData } from '@/services/bitqueryService';
const VolumeFilteredTokens: React.FC = () => {
  const [tokensAbove15k, setTokensAbove15k] = useState<TokenVolumeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  useEffect(() => {
    console.log("Setting up PumpFun tokens subscription");
    setLoading(true);
    const unsubscribe = subscribeToTokenVolumeUpdates('above_15k', tokens => {
      console.log(`Received ${tokens.length} PumpFun tokens above 15k MCAP`);
      setTokensAbove15k(tokens);
      setLoading(false);
    });
    triggerTokenVolumeUpdate();
    return () => {
      unsubscribe();
    };
  }, []);
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
    if (showToast) toast.info("Refreshing PumpFun token data...");
    try {
      const success = await triggerTokenVolumeUpdate();
      if (success && showToast) {
        toast.success("PumpFun token data refreshed");
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