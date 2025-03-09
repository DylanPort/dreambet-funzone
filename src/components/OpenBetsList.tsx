
import React, { useState, useEffect, useCallback } from 'react';
import { fetchOpenBets, acceptBet } from '@/api/mockData';
import { useWallet } from '@solana/wallet-adapter-react';
import { SortAsc, SortDesc, Timer, Clock, Wallet, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Bet } from '@/types/bet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BetsListView from './BetsListView';
import { getSortedBets, getExpiringBets, getPublicBets } from '@/utils/betUtils';
import { supabase } from "@/integrations/supabase/client";

const FALLBACK_BETS_KEY = 'pumpxbounty_fallback_bets';

const OpenBetsList = () => {
  const [bets, setBets] = useState<Bet[]>([]);
  const [fallbackBets, setFallbackBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBetNotification, setNewBetNotification] = useState<{
    visible: boolean;
    message: string;
  }>({ visible: false, message: '' });
  const {
    connected,
    publicKey,
    wallet
  } = useWallet();
  const {
    toast
  } = useToast();
  const [sortBy, setSortBy] = useState<'newest' | 'expiring' | 'amount'>('newest');

  const loadFallbackBets = useCallback(() => {
    try {
      const storedBets = localStorage.getItem(FALLBACK_BETS_KEY);
      if (storedBets) {
        const parsedBets = JSON.parse(storedBets) as Bet[];
        console.log("Loaded fallback bets from localStorage:", parsedBets);
        
        const now = Date.now();
        const validBets = parsedBets.filter(bet => bet.expiresAt > now);
        
        if (validBets.length !== parsedBets.length) {
          localStorage.setItem(FALLBACK_BETS_KEY, JSON.stringify(validBets));
        }
        
        setFallbackBets(validBets);
        return validBets;
      }
    } catch (error) {
      console.error("Error loading fallback bets:", error);
    }
    return [];
  }, []);

  const saveFallbackBet = useCallback((bet: Bet) => {
    try {
      const existingBets = loadFallbackBets();
      
      const betExists = existingBets.some(
        existingBet => existingBet.onChainBetId === bet.onChainBetId || 
                        existingBet.id === bet.id
      );
      
      if (!betExists) {
        const updatedBets = [...existingBets, bet];
        localStorage.setItem(FALLBACK_BETS_KEY, JSON.stringify(updatedBets));
        setFallbackBets(updatedBets);
      }
    } catch (error) {
      console.error("Error saving fallback bet:", error);
    }
  }, [loadFallbackBets]);

  const loadBets = async () => {
    try {
      setLoading(true);
      console.log("Fetching open bets...");
      const data = await fetchOpenBets();
      console.log("Fetched open bets:", data);
      
      const fallbacks = loadFallbackBets();
      
      let combinedBets: Bet[] = [];
      
      if (data && Array.isArray(data)) {
        const existingBetIds = new Set(data.map(bet => bet.id));
        const existingOnChainIds = new Set(
          data
            .filter(bet => bet.onChainBetId)
            .map(bet => bet.onChainBetId)
        );
        const existingTxSignatures = new Set(
          data
            .filter(bet => bet.transactionSignature)
            .map(bet => bet.transactionSignature)
        );
        
        const uniqueFallbacks = fallbacks.filter(
          fallbackBet => 
            !existingBetIds.has(fallbackBet.id) && 
            (!fallbackBet.onChainBetId || !existingOnChainIds.has(fallbackBet.onChainBetId)) &&
            (!fallbackBet.transactionSignature || !existingTxSignatures.has(fallbackBet.transactionSignature))
        );
        
        combinedBets = [...data, ...uniqueFallbacks];
        console.log("Combined bets:", combinedBets);
      } else {
        console.error("Invalid data returned from fetchOpenBets:", data);
        combinedBets = [...fallbacks];
      }
      
      setBets(combinedBets);
    } catch (error) {
      console.error('Error loading bets:', error);
      const fallbacks = loadFallbackBets();
      setBets(fallbacks);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("OpenBetsList component mounted, loading bets...");
    loadBets();
    const interval = setInterval(loadBets, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('public:bets')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'bets' 
        }, 
        (payload) => {
          console.log('New bet inserted:', payload);
          loadBets();
          
          setNewBetNotification({
            visible: true,
            message: `New bet created in the network!`
          });
          
          setTimeout(() => {
            setNewBetNotification(prev => ({ ...prev, visible: false }));
          }, 5000);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const handleNewBet = (event: CustomEvent) => {
      console.log("New bet created event received in OpenBetsList:", event.detail);
      
      const { amount, prediction, tokenId, tokenName, tokenSymbol, bet } = event.detail;
      
      if (bet) {
        console.log("Adding new bet to fallback storage:", bet);
        saveFallbackBet(bet);
        
        setBets(prevBets => {
          const exists = prevBets.some(
            existingBet => 
              existingBet.id === bet.id || 
              (existingBet.onChainBetId && existingBet.onChainBetId === bet.onChainBetId)
          );
          
          if (!exists) {
            return [...prevBets, bet];
          }
          return prevBets;
        });
      }
      
      setNewBetNotification({
        visible: true,
        message: `New ${amount} SOL bet created predicting token will ${prediction}!`
      });
      
      setTimeout(() => {
        setNewBetNotification(prev => ({ ...prev, visible: false }));
      }, 5000);
      
      loadBets();
    };

    const handleBetAccepted = (event: CustomEvent) => {
      console.log("Bet accepted event received in OpenBetsList:", event.detail);
      loadBets();
    };

    window.addEventListener('newBetCreated', handleNewBet as EventListener);
    window.addEventListener('betAccepted', handleBetAccepted as EventListener);
    
    return () => {
      window.removeEventListener('newBetCreated', handleNewBet as EventListener);
      window.removeEventListener('betAccepted', handleBetAccepted as EventListener);
    };
  }, [saveFallbackBet]);

  const handleAcceptBet = async (bet: Bet) => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to accept bets",
        variant: "destructive"
      });
      return;
    }
    if (bet.initiator === publicKey.toString()) {
      toast({
        title: "Cannot accept your own bet",
        description: "You cannot bet against yourself",
        variant: "destructive"
      });
      return;
    }
    try {
      setLoading(true);
      await acceptBet(bet, publicKey.toString(), wallet);
      toast({
        title: "Bet accepted!",
        description: `You've accepted a ${bet.amount} SOL bet on ${bet.tokenName}`
      });

      loadBets();
    } catch (error) {
      console.error('Error accepting bet:', error);
      toast({
        title: "Failed to accept bet",
        description: "Something went wrong with the blockchain transaction. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const publicKeyString = publicKey ? publicKey.toString() : null;
  
  useEffect(() => {
    console.log("Current bets in OpenBetsList:", bets);
  }, [bets]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-display font-bold text-dream-foreground">
          Open Bets
        </h2>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-dream-foreground/70">Sort by:</span>
          <div className="flex border rounded overflow-hidden">
            <button className={`px-2 py-1 text-xs flex items-center ${sortBy === 'newest' ? 'bg-dream-accent2/30 text-dream-accent2' : 'bg-dream-accent1/10 text-dream-foreground/70'}`} onClick={() => setSortBy('newest')}>
              <SortDesc className="w-3 h-3 mr-1" /> Newest
            </button>
            <button className={`px-2 py-1 text-xs flex items-center border-l ${sortBy === 'expiring' ? 'bg-dream-accent2/30 text-dream-accent2' : 'bg-dream-accent1/10 text-dream-foreground/70'}`} onClick={() => setSortBy('expiring')}>
              <Clock className="w-3 h-3 mr-1" /> Expiring
            </button>
            <button className={`px-2 py-1 text-xs flex items-center border-l ${sortBy === 'amount' ? 'bg-dream-accent2/30 text-dream-accent2' : 'bg-dream-accent1/10 text-dream-foreground/70'}`} onClick={() => setSortBy('amount')}>
              <Wallet className="w-3 h-3 mr-1" /> Amount
            </button>
          </div>
        </div>
      </div>
      
      {newBetNotification.visible && (
        <div className="bg-green-500/20 border border-green-500/30 text-green-400 rounded-md p-3 animate-pulse-slow flex justify-between items-center">
          <p className="flex items-center">
            <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
            {newBetNotification.message}
          </p>
          <button 
            onClick={() => setNewBetNotification(prev => ({ ...prev, visible: false }))}
            className="text-green-400/70 hover:text-green-400 text-sm"
          >
            ×
          </button>
        </div>
      )}
      
      {loading && bets.length === 0 ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-dream-accent2 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full flex mb-4">
            <TabsTrigger value="all" className="flex-1">All Open Bets</TabsTrigger>
            <TabsTrigger value="public" className="flex-1">Recent Bets</TabsTrigger>
            <TabsTrigger value="expiring" className="flex-1">Expiring Soon</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <BetsListView 
              bets={getSortedBets(bets, sortBy).slice(0, 10)} 
              connected={connected} 
              publicKeyString={publicKeyString} 
              onAcceptBet={handleAcceptBet} 
            />
          </TabsContent>
          
          <TabsContent value="public">
            <BetsListView 
              bets={getPublicBets(bets, sortBy, publicKeyString)} 
              connected={connected} 
              publicKeyString={publicKeyString} 
              onAcceptBet={handleAcceptBet} 
            />
          </TabsContent>
          
          <TabsContent value="expiring">
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-2 mb-4 flex items-center">
              <AlertTriangle className="text-orange-400 mr-2" />
              <p className="text-sm">These bets will expire within the next 10 minutes!</p>
            </div>
            <BetsListView 
              bets={getExpiringBets(bets, sortBy)} 
              connected={connected} 
              publicKeyString={publicKeyString} 
              onAcceptBet={handleAcceptBet} 
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default OpenBetsList;
