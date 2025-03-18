
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowUpRight, ArrowDownRight, BarChart3, RefreshCw, Copy, Check, ExternalLink, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { fetchMigratingTokens } from '@/api/mockData';
import usePumpPortal from '@/hooks/usePumpPortal';

const MigratingTokenList = () => {
  const [migratingTokens, setMigratingTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  
  // Use pumpPortal to get token metrics
  const pumpPortal = usePumpPortal();
  
  useEffect(() => {
    fetchTokensData();
  }, []);
  
  // Subscribe to get token metrics for all tokens in the list when pump portal connects
  useEffect(() => {
    if (pumpPortal.isConnected && migratingTokens.length > 0) {
      console.log('Pump portal connected, fetching metrics for migrating tokens');
      migratingTokens.forEach(token => {
        if (token.id) {
          console.log(`Fetching metrics for token ${token.id}`);
          pumpPortal.fetchTokenMetrics(token.id);
        }
      });
    }
  }, [pumpPortal.isConnected, migratingTokens]);
  
  const fetchTokensData = async () => {
    try {
      setLoading(true);
      const data = await fetchMigratingTokens();
      console.log('Fetched migrating tokens:', data);
      setMigratingTokens(data);
      
      // Fetch metrics for all tokens if pump portal is connected
      if (pumpPortal.isConnected) {
        data.forEach(token => {
          if (token.id) pumpPortal.fetchTokenMetrics(token.id);
        });
      }
    } catch (error) {
      console.error('Error fetching migrating tokens:', error);
      toast.error('Failed to load migrating tokens');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    toast.success('Address copied to clipboard');
    setTimeout(() => setCopiedAddress(null), 2000);
  };
  
  const handleRefresh = async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    try {
      await fetchTokensData();
      toast.success('Token data refreshed');
    } catch (error) {
      console.error('Error refreshing token data:', error);
      toast.error('Failed to refresh token data');
    } finally {
      setRefreshing(false);
    }
  };
  
  // Get token holder count from pumpPortal metrics
  const getHolderCount = (tokenId: string) => {
    if (!pumpPortal.tokenMetrics || !pumpPortal.tokenMetrics[tokenId]) {
      return null;
    }
    
    return pumpPortal.tokenMetrics[tokenId].holders || 0;
  };
  
  const formatTimeAgo = (timestamp: number) => {
    const now = new Date().getTime();
    const secondsAgo = Math.floor((now - timestamp) / 1000);
    
    if (secondsAgo < 60) return `${secondsAgo}s ago`;
    if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`;
    if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h ago`;
    return `${Math.floor(secondsAgo / 86400)}d ago`;
  };
  
  return (
    <div className="glass-panel p-6 rounded-lg relative overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <img src="/lovable-uploads/8b54a80c-266a-4fcc-8f22-788cab6ce1b4.png" alt="Rocket" className="h-5 w-5" />
          <span>Migrating Tokens</span>
        </h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      {loading ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-dream-accent1 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-dream-foreground/70">Loading tokens...</p>
        </div>
      ) : migratingTokens.length === 0 ? (
        <div className="text-center py-8">
          <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
          <p className="text-dream-foreground/70">No migrating tokens found</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          {migratingTokens.map((token, index) => {
            const holderCount = getHolderCount(token.id);
            return (
              <motion.div 
                key={token.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="border border-dream-foreground/10 rounded-lg p-4 transition-all hover:border-dream-accent2/30 hover:bg-dream-foreground/5"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">{token.logo}</div>
                    <div>
                      <h3 className="font-semibold">{token.name}</h3>
                      <p className="text-sm text-dream-foreground/70">{token.symbol}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="text-lg font-semibold">${token.currentPrice.toFixed(6)}</div>
                    <div className={`text-sm flex items-center ${token.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {token.change24h >= 0 ? (
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 mr-1" />
                      )}
                      {Math.abs(token.change24h).toFixed(2)}%
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mb-2 text-sm">
                  <div className="flex items-center text-dream-foreground/70">
                    <BarChart3 className="h-4 w-4 mr-1" />
                    ${token.marketCap.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-dream-foreground/70">
                    Migrated {formatTimeAgo(token.migrationTime)}
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-3 text-xs text-dream-foreground/60">
                  <div className="flex items-center gap-1 overflow-hidden">
                    <span>Contract:</span>
                    <span className="font-mono truncate max-w-[120px]" title={token.id}>
                      {token.id.substring(0, 4)}...{token.id.substring(token.id.length - 4)}
                    </span>
                    <button 
                      onClick={() => handleCopyAddress(token.id)} 
                      className="text-dream-accent2 hover:text-dream-accent2/80"
                    >
                      {copiedAddress === token.id ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    <span>{holderCount !== null ? holderCount.toLocaleString() : 'Loading...'} holders</span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Link 
                    to={`/token/${token.id}`} 
                    className="flex-1 py-2 px-4 bg-dream-foreground/10 hover:bg-dream-foreground/15 rounded text-center text-sm transition-colors"
                  >
                    View
                  </Link>
                  <Link 
                    to={`/betting/${token.id}`} 
                    className="flex-1 py-2 px-4 bg-gradient-to-r from-dream-accent1 to-dream-accent2 hover:opacity-90 rounded text-center text-sm transition-opacity"
                  >
                    Place Bet
                  </Link>
                  <a 
                    href={`https://dexscreener.com/solana/${token.id}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="py-2 px-3 bg-dream-foreground/10 hover:bg-dream-foreground/15 rounded text-center text-sm transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MigratingTokenList;
