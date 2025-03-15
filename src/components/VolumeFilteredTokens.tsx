
import React, { FC } from 'react';
import { TokenVolumeData, fetchTokensByVolumeCategory } from '@/services/tokenVolumeService';
import { fetchAbove15kTokens, fetchAbove30kTokens } from '@/services/tokenVolumeService';
import { useState, useEffect } from 'react';
import { debounce } from 'lodash';
import { toast } from 'sonner';
import FuturisticTokenDisplay from '@/components/FuturisticTokenDisplay';

const VolumeFilteredTokens: FC = () => {
  const [tokens, setTokens] = useState<TokenVolumeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [volumeFilter, setVolumeFilter] = useState<string>('above_15k');

  useEffect(() => {
    const fetchTokens = async () => {
      setLoading(true);
      try {
        let tokenData: TokenVolumeData[] = [];
        
        if (volumeFilter === 'above_15k') {
          tokenData = await fetchAbove15kTokens();
        } else if (volumeFilter === 'above_30k') {
          tokenData = await fetchAbove30kTokens();
        } else {
          tokenData = await fetchTokensByVolumeCategory(volumeFilter);
        }
        
        setTokens(tokenData);
      } catch (error) {
        console.error('Error fetching tokens:', error);
        // Don't show toast for errors in token fetching
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, [volumeFilter]);

  const handleVolumeFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setVolumeFilter(e.target.value);
  };

  return (
    <div className="rounded-lg overflow-hidden">
      <div className="p-4 bg-black/30 border-b border-white/10">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Top Volume Tokens</h2>
          <select 
            value={volumeFilter}
            onChange={handleVolumeFilterChange}
            className="bg-black/50 border border-white/20 rounded px-3 py-1 text-sm"
          >
            <option value="above_15k">Above 15k Volume</option>
            <option value="above_30k">Above 30k Volume</option>
          </select>
        </div>
      </div>
      
      <div className="bg-black/20 p-4">
        {loading ? (
          <div className="animate-pulse flex justify-center items-center h-40">
            <div className="w-8 h-8 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
          </div>
        ) : tokens.length > 0 ? (
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
          </div>
        ) : (
          <div className="text-center text-gray-400 p-8">
            No tokens found with this volume criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default VolumeFilteredTokens;
