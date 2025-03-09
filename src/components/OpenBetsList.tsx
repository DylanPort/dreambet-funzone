
import React, { useState, useEffect } from 'react';
import { fetchOpenBets, acceptBet } from '@/api/mockData';
import { useWallet } from '@solana/wallet-adapter-react';
import { SortAsc, SortDesc, Timer, Clock, Wallet, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Bet } from '@/types/bet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BetsListView from './BetsListView';
import { getSortedBets, getExpiringBets, getPublicBets } from '@/utils/betUtils';

const OpenBetsList = () => {
  const [bets, setBets] = useState<Bet[]>([]);
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

  const loadBets = async () => {
    try {
      setLoading(true);
      console.log("Fetching open bets...");
      const data = await fetchOpenBets();
      console.log("Fetched open bets:", data);
      if (data && Array.isArray(data)) {
        setBets(data);
      } else {
        console.error("Invalid data returned from fetchOpenBets:", data);
        setBets([]);
      }
    } catch (error) {
      console.error('Error loading bets:', error);
      setBets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("OpenBetsList component mounted, loading bets...");
    loadBets();
    // Refresh every 30 seconds
    const interval = setInterval(loadBets, 30000);
    return () => clearInterval(interval);
  }, []);

  // Listen for new bet created or accepted events
  useEffect(() => {
    const handleNewBet = (event: CustomEvent) => {
      console.log("New bet created event received in OpenBetsList:", event.detail);
      
      const { amount, prediction, tokenId } = event.detail;
      setNewBetNotification({
        visible: true,
        message: `New ${amount} SOL bet created predicting token will ${prediction}!`
      });
      
      // Automatically hide the notification after 5 seconds
      setTimeout(() => {
        setNewBetNotification(prev => ({ ...prev, visible: false }));
      }, 5000);
      
      // Refresh the bets list immediately
      loadBets();
    };

    const handleBetAccepted = (event: CustomEvent) => {
      console.log("Bet accepted event received in OpenBetsList:", event.detail);
      // Immediately refresh the bets when one is accepted
      loadBets();
    };

    window.addEventListener('newBetCreated', handleNewBet as EventListener);
    window.addEventListener('betAccepted', handleBetAccepted as EventListener);
    
    return () => {
      window.removeEventListener('newBetCreated', handleNewBet as EventListener);
      window.removeEventListener('betAccepted', handleBetAccepted as EventListener);
    };
  }, []);

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
      // Pass the wallet instance here
      await acceptBet(bet, publicKey.toString(), wallet);
      toast({
        title: "Bet accepted!",
        description: `You've accepted a ${bet.amount} SOL bet on ${bet.tokenName}`
      });

      // Refresh bets
      const updatedBets = await fetchOpenBets();
      setBets(updatedBets);
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
    // Debug logging
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
