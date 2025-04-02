
import React from 'react';

interface PriceChartProps {
  tokenMint?: string;
}

const PriceChart: React.FC<PriceChartProps> = ({ tokenMint }) => {
  return (
    <div className="h-64 flex items-center justify-center">
      <div className="text-dream-foreground/50">
        Price chart data for {tokenMint || 'token'} will appear here
      </div>
    </div>
  );
};

export default PriceChart;
