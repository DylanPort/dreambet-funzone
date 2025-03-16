import React from 'react';
import { usePumpPortal } from '@/hooks/usePumpPortal';
import { formatRawTrade } from '@/services/pumpPortalWebSocketService';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
const RecentTokenTrades: React.FC = () => {
  const {
    recentRawTrades
  } = usePumpPortal();
  if (!recentRawTrades || recentRawTrades.length === 0) {
    return null;
  }
  return;
};
export default RecentTokenTrades;