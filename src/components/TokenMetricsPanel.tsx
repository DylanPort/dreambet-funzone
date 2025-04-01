
import React from 'react';
import { DollarSign, BarChart3, Users } from 'lucide-react';

interface TokenMetricsPanelProps {
  tokenMetrics: {
    marketCap: number | null;
    volume24h: number | null;
    liquidity: number | null;
    holders: number;
  };
}

const TokenMetricsPanel: React.FC<TokenMetricsPanelProps> = ({ tokenMetrics }) => {
  const formatLargeNumber = (num: number | null) => {
    if (num === null || num === undefined) return "N/A";
    if (num >= 1000000000) {
      return `$${(num / 1000000000).toFixed(2)}B`;
    } else if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(2)}K`;
    } else {
      return `$${num.toFixed(2)}`;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <div className="glass-panel p-4 flex flex-col items-center justify-center">
        <div className="text-sm text-dream-foreground/70 mb-1 flex items-center">
          <DollarSign className="w-4 h-4 mr-1" />
          Market Cap
        </div>
        <div className="text-xl font-semibold">
          {formatLargeNumber(tokenMetrics.marketCap)}
        </div>
      </div>
      
      <div className="glass-panel p-4 flex flex-col items-center justify-center">
        <div className="text-sm text-dream-foreground/70 mb-1 flex items-center">
          <BarChart3 className="w-4 h-4 mr-1" />
          24h Volume
        </div>
        <div className="text-xl font-semibold">
          {formatLargeNumber(tokenMetrics.volume24h)}
        </div>
      </div>
      
      <div className="glass-panel p-4 flex flex-col items-center justify-center">
        <div className="text-sm text-dream-foreground/70 mb-1 flex items-center">
          <Users className="w-4 h-4 mr-1" />
          Liquidity
        </div>
        <div className="text-xl font-semibold">
          {formatLargeNumber(tokenMetrics.liquidity)}
        </div>
      </div>
    </div>
  );
};

export default TokenMetricsPanel;
