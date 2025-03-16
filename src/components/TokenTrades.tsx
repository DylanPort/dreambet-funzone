
import React from 'react';
import { Activity } from 'lucide-react';

interface TokenTradesProps {
  tokenId: string;
}

const TokenTrades: React.FC<TokenTradesProps> = ({ tokenId }) => {
  return (
    <div className="min-h-[300px] flex flex-col items-center justify-center text-dream-foreground/60">
      <Activity className="h-12 w-12 mb-4 opacity-30" />
      <p className="text-lg">Trade history is not available yet</p>
      <p className="text-sm">Check back soon for real-time trades</p>
    </div>
  );
};

export default TokenTrades;
