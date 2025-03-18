
import React from 'react';

interface EmptyBetsListProps {
  message?: string;
  subMessage?: string;
}

const EmptyBetsList: React.FC<EmptyBetsListProps> = ({ 
  message = "No open bets available", 
  subMessage = "Be the first to create a bet on a token migration!" 
}) => {
  return (
    <div className="glass-panel p-6 text-center">
      <p className="text-dream-foreground/80 mb-2">{message}</p>
      <p className="text-dream-foreground/60 text-sm">
        {subMessage}
      </p>
    </div>
  );
};

export default EmptyBetsList;
