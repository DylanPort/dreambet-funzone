
import React, { FC } from 'react';
import { TokenVolumeData, fetchTokensByVolumeCategory } from '@/services/tokenVolumeService';
import { fetchAbove15kTokens, fetchAbove30kTokens } from '@/services/tokenVolumeService';
import { useState, useEffect } from 'react';
import { debounce } from 'lodash';
import FuturisticTokenDisplay from '@/components/FuturisticTokenDisplay';
import { useSpring, animated } from '@react-spring/web';
import { toast } from 'sonner';

const TopVolumeTokens: FC = () => {
  const [tokens, setTokens] = useState<TokenVolumeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTokens = async () => {
      setLoading(true);
      try {
        const tokenData = await fetchAbove30kTokens();
        setTokens(tokenData.slice(0, 6)); // Take top 6
        setError(null);
      } catch (err) {
        console.error('Error fetching tokens:', err);
        setError('Failed to load tokens');
        // Don't show toast for token loading errors
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, []);

  const fadeIn = useSpring({
    opacity: loading ? 0 : 1,
    transform: loading ? 'translateY(20px)' : 'translateY(0)',
    config: { tension: 280, friction: 20 },
  });

  return (
    <div className="rounded-lg overflow-hidden bg-black/20 border border-white/10">
      <div className="p-4 bg-black/30 border-b border-white/10">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Top Volume Tokens</h2>
          {loading && (
            <div className="flex items-center">
              <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
              <span className="text-xs text-white/70">Updating...</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="p-4">
        {error ? (
          <div className="text-center text-red-400 p-4">
            {error}. Please try again later.
          </div>
        ) : (
          <animated.div style={fadeIn}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tokens.map((token) => (
                <FuturisticTokenDisplay 
                  key={token.token_mint}
                  tokenName={token.token_name || 'Unknown'}
                  tokenSymbol={token.token_symbol || 'N/A'}
                  marketCap={token.current_market_cap || 0}
                  volume={token.volume_24h}
                  tokenMint={token.token_mint}
                />
              ))}
              {tokens.length === 0 && !loading && (
                <div className="col-span-3 text-center text-gray-400 p-8">
                  No high volume tokens found.
                </div>
              )}
            </div>
          </animated.div>
        )}
      </div>
    </div>
  );
};

export default TopVolumeTokens;
