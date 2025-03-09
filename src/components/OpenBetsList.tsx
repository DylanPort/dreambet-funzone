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
  const {
    connected,
    publicKey
  } = useWallet();
  const {
    toast
  } = useToast();
  const [sortBy, setSortBy] = useState<'newest' | 'expiring' | 'amount'>('newest');
  useEffect(() => {
    const loadBets = async () => {
      try {
        const data = await fetchOpenBets();
        setBets(data);
      } catch (error) {
        console.error('Error loading bets:', error);
      } finally {
        setLoading(false);
      }
    };
    loadBets();
    // Refresh every 30 seconds
    const interval = setInterval(loadBets, 30000);
    return () => clearInterval(interval);
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
      await acceptBet(bet.id, publicKey.toString());
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
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const publicKeyString = publicKey ? publicKey.toString() : null;
  return <div className="space-y-6">
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
      
      {loading && bets.length === 0 ? <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-dream-accent2 border-t-transparent rounded-full animate-spin"></div>
        </div> : <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full flex mb-4">
            <TabsTrigger value="all" className="flex-1">All Open Bets</TabsTrigger>
            <TabsTrigger value="public" className="flex-1">Recent Bets</TabsTrigger>
            <TabsTrigger value="expiring" className="flex-1">Expiring Soon</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <BetsListView bets={getSortedBets(bets, sortBy).slice(0, 10)} connected={connected} publicKeyString={publicKeyString} onAcceptBet={handleAcceptBet} />
          </TabsContent>
          
          <TabsContent value="public">
            <BetsListView bets={getPublicBets(bets, sortBy, publicKeyString)} connected={connected} publicKeyString={publicKeyString} onAcceptBet={handleAcceptBet} />
          </TabsContent>
          
          <TabsContent value="expiring">
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-2 mb-4 flex items-center">
              <AlertTriangle className="text-orange-400 mr-2" />
              <p className="text-sm">These bets will expire within the next hour!</p>
            </div>
            <BetsListView bets={getExpiringBets(bets, sortBy)} connected={connected} publicKeyString={publicKeyString} onAcceptBet={handleAcceptBet} />
          </TabsContent>
        </Tabs>}
    </div>;
};
export default OpenBetsList;