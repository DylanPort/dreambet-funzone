
import React from 'react';
import { usePumpPortal } from '@/hooks/usePumpPortal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TrendingUp, Loader } from 'lucide-react';
import { formatAddress } from '@/utils/betUtils';

const TradingSimulator = () => {
  const { rawTokens, isConnected } = usePumpPortal();

  if (!isConnected) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
          Trading Simulator
        </h1>
        <p className="text-dream-foreground/60 mt-2">
          Practice trading with virtual funds on newly listed tokens
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rawTokens.map((token, index) => (
          <Card key={token.mint} className="p-6 bg-dream-background/40 backdrop-blur-sm border border-dream-accent1/20">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-dream-foreground">
                  {token.symbol || 'Unknown'}
                </h3>
                <p className="text-sm text-dream-foreground/60">{token.name || 'Unknown Token'}</p>
              </div>
              <TrendingUp className="w-5 h-5 text-dream-accent2" />
            </div>
            
            <div className="space-y-4">
              <div className="bg-dream-foreground/10 p-3 rounded-lg">
                <div className="text-xs text-dream-foreground/60 mb-1">Contract Address</div>
                <div className="text-sm font-medium">{formatAddress(token.mint)}</div>
              </div>
              
              <div className="bg-dream-foreground/10 p-3 rounded-lg">
                <div className="text-xs text-dream-foreground/60 mb-1">Initial Market Cap</div>
                <div className="text-sm font-medium">
                  {token.marketCapSol ? `${token.marketCapSol.toLocaleString()} SOL` : 'Unknown'}
                </div>
              </div>
              
              <Button 
                className="w-full bg-dream-accent1/20 hover:bg-dream-accent1/30 text-dream-accent1"
                onClick={() => console.log('Simulate trading for:', token.mint)}
              >
                Start Trading
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TradingSimulator;
