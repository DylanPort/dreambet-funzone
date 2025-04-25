
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

      <div className="space-y-4">
        {rawTokens.map((token, index) => (
          <Card 
            key={token.mint} 
            className="p-4 bg-dream-background/40 backdrop-blur-sm border border-dream-accent1/20 flex items-center space-x-4 hover:bg-dream-background/60 transition-colors"
          >
            <div className="flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-dream-accent2" />
            </div>
            
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-dream-foreground">
                    {token.symbol || 'Unknown'}
                  </h3>
                  <p className="text-sm text-dream-foreground/60">{token.name || 'Unknown Token'}</p>
                </div>
                
                <div className="text-right">
                  <div className="text-xs text-dream-foreground/60 mb-1">Contract Address</div>
                  <div className="text-sm font-medium">{formatAddress(token.mint)}</div>
                </div>
              </div>
              
              <div className="mt-3 flex justify-between items-center">
                <div>
                  <div className="text-xs text-dream-foreground/60 mb-1">Initial Market Cap</div>
                  <div className="text-sm font-medium">
                    {token.marketCapSol ? `${token.marketCapSol.toLocaleString()} SOL` : 'Unknown'}
                  </div>
                </div>
                
                <Button 
                  className="bg-dream-accent1/20 hover:bg-dream-accent1/30 text-dream-accent1"
                  onClick={() => console.log('Simulate trading for:', token.mint)}
                >
                  Start Trading
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TradingSimulator;
