
import React from 'react';
import { Bet } from '@/types/bet';
import { Button } from '@/components/ui/button';

interface NewBetBannerProps {
  newActiveBet: Bet | null;
  token: any;
  setNewActiveBet: (bet: Bet | null) => void;
}

const NewBetBanner: React.FC<NewBetBannerProps> = ({ newActiveBet, token, setNewActiveBet }) => {
  if (!newActiveBet) return null;
  
  return (
    <div className="bg-gradient-to-r from-dream-accent1/20 to-dream-accent3/20 border border-dream-accent2/30 rounded-md p-3 mb-4 animate-pulse-slow">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-2 h-2 bg-dream-accent2 rounded-full mr-2 animate-pulse"></div>
          <span className="font-semibold text-[#28f900]">New Active Bet!</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setNewActiveBet(null)} 
          className="h-6 w-6 p-0"
        >
          ×
        </Button>
      </div>
    </div>
  );
};

export default NewBetBanner;
