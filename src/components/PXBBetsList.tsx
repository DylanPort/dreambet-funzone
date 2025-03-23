import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
const PXBBetsList = () => {
  // Sample data - replace with actual data from your API or context
  const bets = [{
    id: '1',
    tokenName: 'Solana',
    tokenSymbol: 'SOL',
    amount: '0.5',
    direction: 'up',
    timeLeft: '2h 15m',
    potentialWin: '1.2'
  }, {
    id: '2',
    tokenName: 'Bonk',
    tokenSymbol: 'BONK',
    amount: '0.2',
    direction: 'down',
    timeLeft: '5h 30m',
    potentialWin: '0.6'
  }, {
    id: '3',
    tokenName: 'Jupiter',
    tokenSymbol: 'JUP',
    amount: '0.3',
    direction: 'up',
    timeLeft: '1h 45m',
    potentialWin: '0.9'
  }];
  return <Card className="glass-panel border-dream-accent1/20">
      
      
    </Card>;
};
export default PXBBetsList;