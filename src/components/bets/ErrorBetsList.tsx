
import React from 'react';
import { RefreshCw } from 'lucide-react';

interface ErrorBetsListProps {
  onRefresh: () => void;
  errorMessage?: string;
}

const ErrorBetsList: React.FC<ErrorBetsListProps> = ({ 
  onRefresh,
  errorMessage = "There was an error fetching the open bets. Please try again later." 
}) => {
  return (
    <div className="glass-panel p-6 text-center">
      <p className="text-red-400 mb-2">Failed to load open bets</p>
      <p className="text-dream-foreground/60 text-sm">
        {errorMessage}
      </p>
      <button 
        onClick={onRefresh} 
        className="mt-4 px-4 py-2 bg-dream-accent1/20 border border-dream-accent1/30 text-dream-accent1 rounded-md flex items-center mx-auto"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Try Again
      </button>
    </div>
  );
};

export default ErrorBetsList;
