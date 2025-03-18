
import React from 'react';
import { Filter, Zap } from 'lucide-react';

const LoadingBetsList: React.FC = () => {
  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-display font-bold text-dream-foreground flex items-center gap-2">
          <img src="/lovable-uploads/74707f80-3a88-4b9c-82d2-5a590a3a32df.png" alt="Crown" className="h-6 w-6" />
          <span>ACTIVE BETS</span>
        </h2>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center text-sm bg-dream-background/50 backdrop-blur-sm px-3 py-1 rounded-full border border-dream-accent1/30">
            <Filter className="w-3.5 h-3.5 mr-1.5 text-dream-accent1" />
            <span className="font-medium">Filter</span>
          </div>
          
          <div className="flex items-center text-sm bg-dream-background/30 backdrop-blur-sm px-3 py-1 rounded-full border border-dream-accent2/20">
            <Zap className="w-4 h-4 text-dream-accent2" />
            <span>Loading...</span>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="glass-panel p-4 animate-pulse">
            <div className="h-5 w-32 bg-gray-700/50 rounded mb-2"></div>
            <div className="h-4 w-16 bg-gray-700/50 rounded mb-4"></div>
            <div className="h-8 bg-gray-700/50 rounded mb-2"></div>
            <div className="h-8 bg-gray-700/50 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadingBetsList;
