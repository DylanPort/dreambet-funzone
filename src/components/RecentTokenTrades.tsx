
import React from 'react';
import { usePumpPortal } from '@/hooks/usePumpPortal';
import { formatRawTrade } from '@/services/pumpPortalWebSocketService';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const RecentTokenTrades: React.FC = () => {
  const { recentRawTrades } = usePumpPortal();
  
  if (!recentRawTrades || recentRawTrades.length === 0) {
    return null;
  }
  
  return (
    <div className="w-full overflow-hidden glass-panel p-4 backdrop-blur-md">
      <h3 className="text-lg font-semibold mb-4">Recent Token Trades</h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-2 px-3 text-sm font-medium text-dream-foreground/70">Type</th>
              <th className="text-left py-2 px-3 text-sm font-medium text-dream-foreground/70">Token</th>
              <th className="text-right py-2 px-3 text-sm font-medium text-dream-foreground/70">Amount</th>
              <th className="text-right py-2 px-3 text-sm font-medium text-dream-foreground/70">Price</th>
              <th className="text-right py-2 px-3 text-sm font-medium text-dream-foreground/70">SOL</th>
              <th className="text-left py-2 px-3 text-sm font-medium text-dream-foreground/70">Trader</th>
            </tr>
          </thead>
          <tbody>
            {recentRawTrades.slice(0, 10).map((trade, index) => {
              const formattedTrade = formatRawTrade(trade);
              return (
                <tr key={`${trade.signature}-${index}`} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-2 px-3">
                    <div className="flex items-center">
                      {trade.txType === 'buy' ? (
                        <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                      )}
                      <span className={trade.txType === 'buy' ? 'text-green-500' : 'text-red-500'}>
                        {trade.txType.toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center">
                      <a 
                        href={`/token/${trade.mint}`}
                        className="hover:text-dream-accent2 transition-colors"
                      >
                        {trade.mint.substring(0, 6)}...{trade.mint.substring(trade.mint.length - 4)}
                      </a>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-sm">{formattedTrade.amount}</td>
                  <td className="py-2 px-3 text-right font-mono text-sm">{formattedTrade.price}</td>
                  <td className="py-2 px-3 text-right font-mono text-sm">{formattedTrade.solAmount}</td>
                  <td className="py-2 px-3 text-sm">{formattedTrade.trader}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentTokenTrades;
