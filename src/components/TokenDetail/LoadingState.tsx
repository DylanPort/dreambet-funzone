
import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingState: React.FC = () => {
  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-dream-accent2" />
        <p className="text-lg text-dream-foreground/70">Loading token data...</p>
      </div>
    </div>
  );
};

export default LoadingState;
