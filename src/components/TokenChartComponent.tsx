
import React, { useState, useEffect } from 'react';
import { RefreshCw, ExternalLink } from 'lucide-react';

interface TokenChartProps {
  tokenId: string;
  tokenName: string;
  refreshData: () => void;
  loading: boolean;
  onPriceUpdate: (price: number, change?: number) => void;
  setShowCreateBet: (show: boolean) => void;
}

const TokenChartComponent: React.FC<TokenChartProps> = ({
  tokenId,
  tokenName,
  refreshData,
  loading,
  onPriceUpdate,
  setShowCreateBet
}) => {
  const [timeInterval, setTimeInterval] = useState('15');
  const [chartTheme, setChartTheme] = useState('dark');
  
  const handleRefreshChart = () => {
    refreshData();
  };
  
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        if (event.data && typeof event.data === 'string') {
          const data = JSON.parse(event.data);
          if (data.type === 'price_update' && data.price) {
            onPriceUpdate(data.price, data.change || 0);
          }
        }
      } catch (error) {
        console.error("Error handling chart message:", error);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onPriceUpdate]);
  
  const chartUrl = `https://www.gmgn.cc/kline/sol/${tokenId}?theme=${chartTheme}&interval=${timeInterval}&send_price=true`;
  
  return (
    <div className="glass-panel p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-display font-bold">Price Chart</h2>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="interval" className="text-sm text-dream-foreground/70">Interval:</label>
            <select
              id="interval"
              value={timeInterval}
              onChange={e => setTimeInterval(e.target.value)}
              className="bg-black/20 border border-dream-accent2/20 rounded px-2 py-1 text-sm"
            >
              <option value="1S">1 Second</option>
              <option value="1">1 Minute</option>
              <option value="5">5 Minutes</option>
              <option value="15">15 Minutes</option>
              <option value="60">1 Hour</option>
              <option value="240">4 Hours</option>
              <option value="720">12 Hours</option>
              <option value="1D">1 Day</option>
            </select>
          </div>
          <div className="flex gap-2">
            <a
              href={`https://dexscreener.com/solana/${tokenId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-dream-accent2 hover:underline flex items-center text-sm"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              DexScreener
            </a>
            <button
              onClick={handleRefreshChart}
              className="text-dream-foreground/70 hover:text-dream-foreground flex items-center text-sm"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>
      
      <div className="w-full h-[400px] bg-black/10 rounded-lg overflow-hidden relative">
        <iframe
          src={chartUrl}
          className="w-full h-full border-0"
          title="GMGN Price Chart"
          loading="lazy"
        ></iframe>
      </div>
    </div>
  );
};

export default TokenChartComponent;
