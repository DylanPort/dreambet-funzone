
import React, { useState, useEffect } from 'react';
import { fetchOpenBets, acceptBet } from '@/api/mockData';
import { useWallet } from '@solana/wallet-adapter-react';
import { ArrowUp, ArrowDown, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Bet } from '@/types/bet';

const OpenBetsList = () => {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const { connected, publicKey } = useWallet();
  const { toast } = useToast();

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

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold text-dream-foreground">
        Open Bets
      </h2>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-dream-accent2 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {bets.length === 0 ? (
            <div className="glass-panel p-6 text-center">
              <p className="text-dream-foreground/70">No open bets available right now.</p>
              <p className="text-sm mt-2">Be the first to create a bet on a migrating token!</p>
            </div>
          ) : (
            bets.map(bet => (
              <div key={bet.id} className="glass-panel p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-display font-semibold">{bet.tokenName} ({bet.tokenSymbol})</h3>
                    <p className="text-sm text-dream-foreground/70 truncate">
                      Initiator: {bet.initiator.slice(0, 4)}...{bet.initiator.slice(-4)}
                    </p>
                  </div>
                  <div className="flex items-center text-sm">
                    <Clock className="w-3 h-3 mr-1 text-dream-foreground/70" />
                    <span className="text-dream-foreground/70">
                      {formatTimeRemaining(bet.expiresAt)}
                    </span>
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
                      <div className="font-semibold">
                        Betting {bet.prediction === 'up' ? 'UP ↑' : 'DOWN ↓'}
                      </div>
                      <div className="text-sm text-dream-foreground/70">
                        {bet.amount} SOL
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
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default OpenBetsList;
