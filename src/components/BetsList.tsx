
import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, Clock } from 'lucide-react';
import { fetchUserBets } from '@/api/mockData';
import { Button } from '@/components/ui/button';
import { useWallet } from '@solana/wallet-adapter-react';
import { Bet } from '@/types/bet';
import { Link } from 'react-router-dom';

interface BetsListProps {
  title: string;
  type: 'latest' | 'active';
}

const BetsList: React.FC<BetsListProps> = ({ title, type }) => {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const { connected, publicKey } = useWallet();

  useEffect(() => {
    const loadBets = async () => {
      try {
        setLoading(true);
        if (connected && publicKey) {
          const userBets = await fetchUserBets(publicKey.toString());
          
          // Filter bets based on type
          let filteredBets: Bet[];
          if (type === 'latest') {
            // Latest bets - sort by timestamp descending and take first 5
            filteredBets = [...userBets].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
          } else {
            // Active bets - only matched or open
            filteredBets = userBets.filter(bet => ['open', 'matched'].includes(bet.status));
          }
          
          setBets(filteredBets);
        } else {
          setBets([]);
        }
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
  }, [connected, publicKey, type]);

  const formatTimeRemaining = (expiresAt: number) => {
    const now = new Date().getTime();
    const diffMs = expiresAt - now;
    if (diffMs <= 0) return 'Expired';
    
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHrs}h ${diffMins}m left`;
  };

  if (!connected) {
    return (
      <div className="glass-panel p-6 space-y-4">
        <h2 className="text-2xl font-display font-bold">{title}</h2>
        <div className="text-center py-6">
          <p className="text-dream-foreground/70 mb-3">Connect your wallet to view your bets</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 space-y-4">
      <h2 className="text-2xl font-display font-bold">{title}</h2>
      
      {loading ? (
        <div className="flex justify-center py-6">
          <div className="w-6 h-6 border-4 border-dream-accent2 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {bets.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-dream-foreground/70">No {type === 'latest' ? 'recent' : 'active'} bets found</p>
              <p className="text-sm mt-2">Start betting on migrating tokens now!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bets.map(bet => (
                <Link 
                  key={bet.id} 
                  to={`/betting/token/${bet.tokenId}`} 
                  className="block transition-transform hover:scale-[1.01]"
                >
                  <div className="border border-dream-foreground/10 rounded-md p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-display font-semibold">{bet.tokenName} ({bet.tokenSymbol})</h3>
                        <div className="flex items-center text-sm">
                          <span className={`${bet.prediction === 'migrate' ? 'text-green-400' : 'text-red-400'} flex items-center`}>
                            {bet.prediction === 'migrate' ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                            {bet.prediction === 'migrate' ? 'MIGRATE' : 'DIE'}
                          </span>
                          <span className="mx-2 text-dream-foreground/50">•</span>
                          <span>{bet.amount} SOL</span>
                        </div>
                      </div>
                      <div className="flex items-center text-xs text-dream-foreground/70">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatTimeRemaining(bet.expiresAt)}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs">
                      <div className="text-dream-foreground/50">
                        {new Date(bet.timestamp).toLocaleDateString()}
                      </div>
                      <div className={`px-2 py-1 rounded-full ${
                        bet.status === 'open' 
                          ? 'bg-yellow-500/20 text-yellow-400' 
                          : bet.status === 'matched' 
                            ? 'bg-blue-500/20 text-blue-400' 
                            : bet.status === 'completed' 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-red-500/20 text-red-400'
                      }`}>
                        {bet.status.charAt(0).toUpperCase() + bet.status.slice(1)}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
              
              {type === 'latest' && (
                <Button asChild variant="outline" className="w-full mt-4">
                  <Link to="/betting/my-bets">View All My Bets</Link>
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BetsList;
