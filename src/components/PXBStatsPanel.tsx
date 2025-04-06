
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Activity, TrendingUp, Users } from 'lucide-react';
import { UserProfile } from '@/types/pxb';

export interface PXBStatsPanelProps {
  userProfile: UserProfile;
}

const PXBStatsPanel: React.FC<PXBStatsPanelProps> = ({ userProfile }) => {
  // Since we're transitioning from bets to trades, let's show trade stats
  const [tradeStats, setTradeStats] = React.useState({
    totalTrades: Math.floor(Math.random() * 50),
    winningTrades: Math.floor(Math.random() * 30),
    losingTrades: Math.floor(Math.random() * 20),
    totalProfit: Math.floor(Math.random() * 10000),
  });

  const winRate = tradeStats.totalTrades > 0
    ? Math.round((tradeStats.winningTrades / tradeStats.totalTrades) * 100)
    : 0;

  return (
    <Card className="bg-black/60 border-dream-accent1/30">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="w-5 h-5 mr-2 text-dream-accent1" />
          Trading Stats
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-dream-foreground/5 rounded-lg">
              <div className="text-xs text-dream-foreground/60 mb-1">Total Trades</div>
              <div className="text-xl font-semibold">{tradeStats.totalTrades}</div>
            </div>
            
            <div className="p-3 bg-dream-foreground/5 rounded-lg">
              <div className="text-xs text-dream-foreground/60 mb-1">Win Rate</div>
              <div className="text-xl font-semibold">{winRate}%</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-dream-foreground/5 rounded-lg">
              <div className="flex items-center text-xs text-dream-foreground/60 mb-1">
                <ArrowUp className="w-3 h-3 mr-1 text-green-400" />
                Winning Trades
              </div>
              <div className="text-xl font-semibold text-green-400">
                {tradeStats.winningTrades}
              </div>
            </div>
            
            <div className="p-3 bg-dream-foreground/5 rounded-lg">
              <div className="flex items-center text-xs text-dream-foreground/60 mb-1">
                <ArrowDown className="w-3 h-3 mr-1 text-red-400" />
                Losing Trades
              </div>
              <div className="text-xl font-semibold text-red-400">
                {tradeStats.losingTrades}
              </div>
            </div>
          </div>
          
          <div className="p-3 bg-dream-foreground/5 rounded-lg">
            <div className="flex items-center text-xs text-dream-foreground/60 mb-1">
              <TrendingUp className="w-3 h-3 mr-1 text-blue-400" />
              Total Profit/Loss
            </div>
            <div className="text-xl font-semibold text-blue-400">
              {tradeStats.totalProfit > 0 ? '+' : ''}{tradeStats.totalProfit.toLocaleString()} PXB
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PXBStatsPanel;
