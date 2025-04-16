
import React from 'react';
import TradeGamePanel from './TradeGamePanel';
import { Shield, ArrowUp, ArrowDown, Wallet, DollarSign } from 'lucide-react';

const PXBTradingGame = () => {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent mb-4">
          PXB Trading Pool
        </h2>
        <p className="text-dream-foreground/70 max-w-2xl mx-auto">
          Deposit, trade, and earn PXB points in our decentralized trading pool. 
          Test your trading skills and climb the leaderboard!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="glass-panel p-4 rounded-lg border border-dream-accent1/20 flex items-center">
          <div className="rounded-full bg-purple-500/20 p-2 mr-3">
            <DollarSign className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <div className="text-sm font-medium">Deposit</div>
            <div className="text-xs text-dream-foreground/70">Join with PXB points</div>
          </div>
        </div>
        
        <div className="glass-panel p-4 rounded-lg border border-dream-accent1/20 flex items-center">
          <div className="rounded-full bg-green-500/20 p-2 mr-3">
            <ArrowUp className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <div className="text-sm font-medium">Trade Up</div>
            <div className="text-xs text-dream-foreground/70">Profit from gains</div>
          </div>
        </div>
        
        <div className="glass-panel p-4 rounded-lg border border-dream-accent1/20 flex items-center">
          <div className="rounded-full bg-red-500/20 p-2 mr-3">
            <ArrowDown className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <div className="text-sm font-medium">Trade Down</div>
            <div className="text-xs text-dream-foreground/70">Test loss protection</div>
          </div>
        </div>
        
        <div className="glass-panel p-4 rounded-lg border border-dream-accent1/20 flex items-center">
          <div className="rounded-full bg-blue-500/20 p-2 mr-3">
            <Wallet className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <div className="text-sm font-medium">Withdraw</div>
            <div className="text-xs text-dream-foreground/70">Cash out anytime</div>
          </div>
        </div>
      </div>

      <TradeGamePanel />

      <div className="mt-8 glass-panel p-6 rounded-lg border border-dream-accent1/20">
        <div className="flex items-start gap-4">
          <Shield className="h-8 w-8 text-purple-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-xl font-semibold mb-2">PXB Trading Pool Protection</h3>
            <p className="text-dream-foreground/70 mb-3">
              Our trading pool includes built-in safeguards to protect traders:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-dream-foreground/70">
              <li>Minimum 50% payout guarantee even with severe losses</li>
              <li>Maximum payout cap of 5x your initial deposit</li>
              <li>3% contribution to the PXB Liquidity Vault for ecosystem growth</li>
              <li>Pool solvency adjustment to ensure fair distribution of rewards</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PXBTradingGame;
