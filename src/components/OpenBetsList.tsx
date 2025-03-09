
import React, { useState, useEffect } from 'react';
import { fetchOpenBets, acceptBet } from '@/api/mockData';
import { useWallet } from '@solana/wallet-adapter-react';
import { ArrowUp, ArrowDown, Clock, AlertTriangle, Wallet, Users, SortAsc, SortDesc, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Bet } from '@/types/bet';
import CountdownTimer from './CountdownTimer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const OpenBetsList = () => {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const { connected, publicKey } = useWallet();
  const { toast } = useToast();
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

  const formatTimeRemaining = (expiresAt: number) => {
    const now = new Date().getTime();
    const diffMs = expiresAt - now;
    if (diffMs <= 0) return 'Expired';
    
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHrs}h ${diffMins}m left`;
  };

  const handleAcceptBet = async (bet: Bet) => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to accept bets",
        variant: "destructive",
      });
      return;
    }

    if (bet.initiator === publicKey.toString()) {
      toast({
        title: "Cannot accept your own bet",
        description: "You cannot bet against yourself",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await acceptBet(bet.id, publicKey.toString());
      toast({
        title: "Bet accepted!",
        description: `You've accepted a ${bet.amount} SOL bet on ${bet.tokenName}`,
      });
      
      // Refresh bets
      const updatedBets = await fetchOpenBets();
      setBets(updatedBets);
    } catch (error) {
      console.error('Error accepting bet:', error);
      toast({
        title: "Failed to accept bet",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSortedBets = () => {
    switch(sortBy) {
      case 'newest':
        return [...bets].sort((a, b) => b.timestamp - a.timestamp);
      case 'expiring':
        return [...bets].sort((a, b) => a.expiresAt - b.expiresAt);
      case 'amount':
        return [...bets].sort((a, b) => b.amount - a.amount);
      default:
        return bets;
    }
  };

  const getExpiringBets = () => {
    const oneHourFromNow = new Date().getTime() + 60 * 60 * 1000;
    return getSortedBets().filter(bet => bet.expiresAt < oneHourFromNow).slice(0, 10); // Show top 10
  };

  const getPublicBets = () => {
    return getSortedBets().filter(bet => !publicKey || bet.initiator !== publicKey.toString()).slice(0, 10); // Show top 10
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const renderBetsList = (betsToRender: Bet[]) => {
    if (betsToRender.length === 0) {
      return (
        <div className="glass-panel p-6 text-center">
          <p className="text-dream-foreground/70">No bets available in this category.</p>
          <p className="text-sm mt-2">Check back soon or create your own bet!</p>
        </div>
      );
    }

    // Limit to top 10 bets in each category
    const topBets = betsToRender.slice(0, 10);
    
    return (
      <div className="space-y-4">
        {topBets.map(bet => (
          <div key={bet.id} className="glass-panel p-4 transition-all hover:shadow-lg animate-fade-in">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-display font-semibold flex items-center gap-2">
                  {bet.tokenName} <span className="text-sm font-normal text-dream-foreground/60">({bet.tokenSymbol})</span>
                </h3>
                <div className="flex items-center text-sm text-dream-foreground/70 mt-1">
                  <Users className="w-3 h-3 mr-1" />
                  <span className="truncate">
                    Created by: {formatAddress(bet.initiator)}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col items-end text-sm">
                <div className="flex items-center mb-1">
                  <Clock className="w-3 h-3 mr-1 text-dream-foreground/70" />
                  <span className={`${bet.expiresAt - new Date().getTime() < 3600000 ? 'text-red-400 font-semibold' : 'text-dream-foreground/70'}`}>
                    {formatTimeRemaining(bet.expiresAt)}
                  </span>
                </div>
                <div className="flex items-center">
                  <Timer className="w-3 h-3 mr-1 text-dream-foreground/70" />
                  <span className="text-dream-foreground/70">
                    {new Date(bet.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center mt-3 justify-between">
              <div className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full mr-2 ${
                  bet.prediction === 'up' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {bet.prediction === 'up' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                </div>
                <div>
                  <div className="font-semibold flex items-center">
                    Betting {bet.prediction === 'up' ? 'UP ↑' : 'DOWN ↓'}
                    {bet.expiresAt - new Date().getTime() < 3600000 && (
                      <AlertTriangle className="ml-2 w-4 h-4 text-orange-400" />
                    )}
                  </div>
                  <div className="flex items-center text-sm text-dream-foreground/70">
                    <Wallet className="w-3 h-3 mr-1" />
                    <span>{bet.amount} SOL</span>
                    <span className="mx-1">•</span>
                    <span>Potential win: {bet.amount * 2} SOL</span>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={() => handleAcceptBet(bet)}
                className={`${
                  bet.prediction === 'up'
                    ? 'bg-red-500 hover:bg-red-600'  // If they bet up, you bet down (red)
                    : 'bg-green-500 hover:bg-green-600'  // If they bet down, you bet up (green)
                }`}
                disabled={!connected || bet.initiator === publicKey?.toString()}
              >
                Take {bet.prediction === 'up' ? 'DOWN' : 'UP'} Position
              </Button>
            </div>
          </div>
        ))}
        
        {betsToRender.length > 10 && (
          <div className="text-center mt-4 text-sm text-dream-foreground/70">
            Showing top 10 of {betsToRender.length} bets
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-display font-bold text-dream-foreground">
          Open Bets
        </h2>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-dream-foreground/70">Sort by:</span>
          <div className="flex border rounded overflow-hidden">
            <button 
              className={`px-2 py-1 text-xs flex items-center ${sortBy === 'newest' ? 'bg-dream-accent2/30 text-dream-accent2' : 'bg-dream-accent1/10 text-dream-foreground/70'}`}
              onClick={() => setSortBy('newest')}
            >
              <SortDesc className="w-3 h-3 mr-1" /> Newest
            </button>
            <button 
              className={`px-2 py-1 text-xs flex items-center border-l ${sortBy === 'expiring' ? 'bg-dream-accent2/30 text-dream-accent2' : 'bg-dream-accent1/10 text-dream-foreground/70'}`}
              onClick={() => setSortBy('expiring')}
            >
              <Clock className="w-3 h-3 mr-1" /> Expiring
            </button>
            <button 
              className={`px-2 py-1 text-xs flex items-center border-l ${sortBy === 'amount' ? 'bg-dream-accent2/30 text-dream-accent2' : 'bg-dream-accent1/10 text-dream-foreground/70'}`}
              onClick={() => setSortBy('amount')}
            >
              <Wallet className="w-3 h-3 mr-1" /> Amount
            </button>
          </div>
        </div>
      </div>
      
      {loading && bets.length === 0 ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-dream-accent2 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full flex mb-4">
            <TabsTrigger value="all" className="flex-1">All Open Bets</TabsTrigger>
            <TabsTrigger value="public" className="flex-1">Public Bets</TabsTrigger>
            <TabsTrigger value="expiring" className="flex-1">Expiring Soon</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            {renderBetsList(getSortedBets().slice(0, 10))}
          </TabsContent>
          
          <TabsContent value="public">
            {renderBetsList(getPublicBets())}
          </TabsContent>
          
          <TabsContent value="expiring">
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-2 mb-4 flex items-center">
              <AlertTriangle className="text-orange-400 mr-2" />
              <p className="text-sm">These bets will expire within the next hour!</p>
            </div>
            {renderBetsList(getExpiringBets())}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default OpenBetsList;
