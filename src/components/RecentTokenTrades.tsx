
import React from 'react';
import { usePumpPortal } from '@/hooks/usePumpPortal';
import { formatRawTrade } from '@/services/pumpPortalWebSocketService';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const RecentTokenTrades: React.FC = () => {
  const {
    recentRawTrades
  } = usePumpPortal();

  if (!recentRawTrades || recentRawTrades.length === 0) {
    return (
      <div className="glass-panel p-6 relative overflow-hidden transition-all duration-300 transform hover:scale-105 animate-fade-in">
        <div className="absolute inset-0 bg-gradient-to-r from-dream-accent2/10 to-dream-accent3/10 animate-gradient-move"></div>
        <div className="flex items-center text-dream-foreground/70 mb-2 relative z-10">
          <span className="text-lg font-semibold">Recent Trades</span>
        </div>
        <div className="text-center py-4">
          <p className="text-dream-foreground/60">No recent trades found</p>
        </div>
      </div>
    );
  }

  const latestTrades = recentRawTrades.slice(0, 5);

  return (
    <div className="glass-panel p-6 relative overflow-hidden transition-all duration-300 transform hover:scale-105 animate-fade-in">
      <div className="absolute inset-0 bg-gradient-to-r from-dream-accent2/10 to-dream-accent3/10 animate-gradient-move"></div>
      <div className="flex items-center text-dream-foreground/70 mb-2 relative z-10">
        <span className="text-lg font-semibold">Recent Trades</span>
      </div>
      <div className="space-y-2 relative z-10">
        {latestTrades.map((trade, index) => {
          try {
            if (!trade) return null;
            const formattedTrade = formatRawTrade(trade);
            return (
              <div key={`${trade.signature}-${index}`} className="flex items-center justify-between p-2 rounded bg-dream-background/40 border border-white/5">
                <div className="flex items-center">
                  {trade.txType === 'buy' ? (
                    <ArrowUpRight className="w-4 h-4 text-green-500 mr-2" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-500 mr-2" />
                  )}
                  <span className="text-sm truncate max-w-[100px]">{trade.name || 'Unknown'}</span>
                </div>
                <div className="text-sm font-mono">{formattedTrade.price}</div>
              </div>
            );
          } catch (error) {
            console.error("Error rendering trade:", error, trade);
            return null;
          }
        })}
      </div>
      <div 
        className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-dream-accent2 to-dream-accent3 animate-pulse-glow" 
        style={{ width: `100%` }}
      ></div>
    </div>
  );
};

export default RecentTokenTrades;
