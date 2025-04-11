
import React, { useEffect } from 'react';
import { usePXBPoints } from '@/contexts/pxb/PXBPointsContext';
import TradeGamePanel from './TradeGamePanel';

const PXBTradingGame = () => {
  const { userProfile } = usePXBPoints();

  return (
    <div className="w-full max-w-4xl mx-auto">
      <TradeGamePanel />
    </div>
  );
};

export default PXBTradingGame;
