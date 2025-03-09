
import React, { useState, useEffect } from 'react';
import { fetchMigratingTokens } from '@/api/mockData';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';

const MigratingTokenList = () => {
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTokens = async () => {
      try {
        const data = await fetchMigratingTokens();
        setTokens(data);
      } catch (error) {
        console.error('Error loading tokens:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTokens();
  }, []);

  // Function to format time since migration
  const formatTimeSince = (timestamp: number) => {
    const now = new Date().getTime();
    const diffMs = now - timestamp;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m ago`;
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold text-dream-foreground">
        Migrating Tokens
      </h2>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-dream-accent2 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tokens.map(token => (
            <Link
              key={token.id}
              to={`/token/${token.id}`}
              className="glass-panel p-4 hover:shadow-neon transition-all duration-300"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <div className="text-3xl mr-2">{token.logo}</div>
                  <div>
                    <h3 className="font-display font-semibold">{token.name}</h3>
                    <p className="text-sm text-dream-foreground/70">{token.symbol}</p>
                  </div>
                </div>
                <div className="flex items-center text-sm">
                  <Clock className="w-3 h-3 mr-1 text-dream-foreground/70" />
                  <span className="text-dream-foreground/70">
                    {formatTimeSince(token.migrationTime)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center mt-3 justify-between">
                <div>
                  <div className="text-lg font-bold">${token.currentPrice.toFixed(6)}</div>
                  <div className={`text-sm flex items-center ${token.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {token.change24h >= 0 ? (
                      <ArrowUpRight className="w-3 h-3 mr-1" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 mr-1" />
                    )}
                    {Math.abs(token.change24h).toFixed(1)}%
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button className="bg-dream-accent1/20 hover:bg-dream-accent1/40 px-3 py-1 rounded text-sm transition-colors">
                    Bet
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MigratingTokenList;
