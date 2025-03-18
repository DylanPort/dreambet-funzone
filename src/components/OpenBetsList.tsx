
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { ArrowUpRight, ArrowDownRight, AlertTriangle, RefreshCw, Copy, Check, ExternalLink, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { fetchOpenBets } from '@/api/mockData';
import { Bet } from '@/types/bet';
import BetsListView from './BetsListView';
import usePumpPortal from '@/hooks/usePumpPortal';

const OpenBetsList = () => {
  const [bets, setBets] = useState<Bet[]>([]);
  const [activeBets, setActiveBets] = useState<Bet[]>([]);
  const [upBets, setUpBets] = useState<Bet[]>([]);
  const [downBets, setDownBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  
  const { connected, publicKey } = useWallet();
  const publicKeyString = publicKey?.toString() || null;
  
  // Use pumpPortal to get token metrics
  const pumpPortal = usePumpPortal();

  useEffect(() => {
    fetchBets();
  }, []);
  
  // Subscribe to get token metrics for all bets tokens when pump portal connects
  useEffect(() => {
    if (pumpPortal.isConnected && activeBets.length > 0) {
      console.log('Pump portal connected, fetching metrics for bet tokens');
      activeBets.forEach(bet => {
        if (bet.tokenMint) {
          console.log(`Fetching metrics for bet token ${bet.tokenMint}`);
          pumpPortal.fetchTokenMetrics(bet.tokenMint);
        }
      });
    }
  }, [pumpPortal.isConnected, activeBets]);

  const fetchBets = async () => {
    try {
      setLoading(true);
      const data = await fetchOpenBets();
      console.log('OpenBetsList - Fetched bets:', data);
      
      setBets(data);
      setActiveBets(data);
      setUpBets(data.filter(bet => bet.prediction === 'migrate'));
      setDownBets(data.filter(bet => bet.prediction === 'die'));
      
      // Fetch metrics for all token mints in bets if pump portal is connected
      if (pumpPortal.isConnected) {
        const uniqueTokens = [...new Set(data.map(bet => bet.tokenMint))];
        console.log(`Fetching metrics for ${uniqueTokens.length} unique bet tokens`);
        uniqueTokens.forEach(tokenId => {
          if (tokenId) pumpPortal.fetchTokenMetrics(tokenId);
        });
      }
    } catch (error) {
      console.error('Error fetching open bets:', error);
      toast.error('Failed to load open bets');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    try {
      await fetchBets();
      toast.success('Bets refreshed');
    } catch (error) {
      console.error('Error refreshing bets:', error);
      toast.error('Failed to refresh bets');
    } finally {
      setRefreshing(false);
    }
  };

  const handleAcceptBet = (bet: Bet) => {
    if (!connected) {
      toast.error('Please connect your wallet to accept bets');
      return;
    }
    
    toast.success(`Bet on ${bet.tokenSymbol} accepted!`);
  };
  
  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    toast.success('Address copied to clipboard');
    setTimeout(() => setCopiedAddress(null), 2000);
  };
  
  // Get token holder count from pumpPortal metrics
  const getHolderCount = (tokenId: string) => {
    if (!pumpPortal.tokenMetrics || !pumpPortal.tokenMetrics[tokenId]) {
      return null;
    }
    
    return pumpPortal.tokenMetrics[tokenId].holders || 0;
  };
  
  // Get token contract info component with copy button
  const TokenContractInfo = ({ tokenId }: { tokenId: string }) => (
    <div className="flex items-center gap-1 text-xs text-dream-foreground/60 mt-2">
      <span>Contract:</span>
      <span className="font-mono truncate max-w-[120px]" title={tokenId}>
        {tokenId.substring(0, 4)}...{tokenId.substring(tokenId.length - 4)}
      </span>
      <button 
        onClick={() => handleCopyAddress(tokenId)} 
        className="text-dream-accent2 hover:text-dream-accent2/80"
      >
        {copiedAddress === tokenId ? (
          <Check className="h-3 w-3" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </button>
      
      {pumpPortal.tokenMetrics && pumpPortal.tokenMetrics[tokenId] && (
        <div className="ml-2 flex items-center gap-1">
          <Users className="h-3 w-3" />
          <span>
            {getHolderCount(tokenId) !== null ? getHolderCount(tokenId)?.toLocaleString() : 'Loading...'} holders
          </span>
        </div>
      )}
      
      <a 
        href={`https://dexscreener.com/solana/${tokenId}`} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="ml-1 text-dream-accent2 hover:text-dream-accent2/80"
      >
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );

  // Modify BetCard to include token contract info
  const ModifiedBetsListView = ({ bets }: { bets: Bet[] }) => (
    <div className="space-y-5">
      {bets.length === 0 ? (
        <div className="backdrop-blur-lg bg-black/20 border border-white/10 rounded-xl p-6 text-center">
          <p className="text-dream-foreground/70">No bets available in this category.</p>
          <p className="text-sm mt-2">Check back soon or create your own bet on a Pump Fun token!</p>
        </div>
      ) : (
        bets.slice(0, 5).map((bet, index) => (
          <motion.div 
            key={`${bet.id}-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            className="border border-dream-foreground/10 hover:border-dream-accent2/30 rounded-lg p-4 transition-all hover:bg-dream-foreground/5"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    bet.prediction === 'migrate' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {bet.prediction === 'migrate' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  </div>
                  <span className="font-semibold">
                    {bet.tokenSymbol}
                  </span>
                </div>
                <p className="text-sm text-dream-foreground/70">{bet.tokenName}</p>
                
                <TokenContractInfo tokenId={bet.tokenMint} />
              </div>
              
              <div className="text-right">
                <div className="font-semibold">{bet.amount} PXB</div>
                <div className="text-xs text-dream-foreground/50">
                  {new Date(bet.expiresAt).toLocaleString()}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-3">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleAcceptBet(bet)}
                disabled={!connected}
                className="text-xs"
              >
                {bet.prediction === 'migrate' ? 'Bet it will DIE' : 'Bet it will MOON'}
              </Button>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );

  return (
    <div className="glass-panel p-6 rounded-lg relative overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <img src="/lovable-uploads/d4517df7-78f7-4229-a4d5-0e4cba7bdbf1.png" alt="Skull" className="h-5 w-5" />
          <span>Open Bets</span>
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
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Bets ({activeBets.length})</TabsTrigger>
          <TabsTrigger value="up">
            <ArrowUpRight className="h-3.5 w-3.5 mr-2 text-green-400" />
            MOON ({upBets.length})
          </TabsTrigger>
          <TabsTrigger value="down">
            <ArrowDownRight className="h-3.5 w-3.5 mr-2 text-red-400" />
            DIE ({downBets.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-dream-accent2 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-dream-foreground/70">Loading open bets...</p>
            </div>
          ) : (
            <ModifiedBetsListView bets={activeBets} />
          )}
        </TabsContent>
        
        <TabsContent value="up" className="mt-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-dream-accent2 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-dream-foreground/70">Loading bets...</p>
            </div>
          ) : (
            <ModifiedBetsListView bets={upBets} />
          )}
        </TabsContent>
        
        <TabsContent value="down" className="mt-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-dream-accent2 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-dream-foreground/70">Loading bets...</p>
            </div>
          ) : (
            <ModifiedBetsListView bets={downBets} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OpenBetsList;
