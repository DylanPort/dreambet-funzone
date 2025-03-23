import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const PXBBetsList = () => {
  // Sample data - replace with actual data from your API or context
  const bets = [
    {
      id: '1',
      tokenName: 'Solana',
      tokenSymbol: 'SOL',
      amount: '0.5',
      direction: 'up',
      timeLeft: '2h 15m',
      potentialWin: '1.2'
    },
    {
      id: '2',
      tokenName: 'Bonk',
      tokenSymbol: 'BONK',
      amount: '0.2',
      direction: 'down',
      timeLeft: '5h 30m',
      potentialWin: '0.6'
    },
    {
      id: '3',
      tokenName: 'Jupiter',
      tokenSymbol: 'JUP',
      amount: '0.3',
      direction: 'up',
      timeLeft: '1h 45m',
      potentialWin: '0.9'
    }
  ];

  return (
    <Card className="glass-panel border-dream-accent1/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5 text-dream-accent2" />
          Your Active PXB Bets
        </CardTitle>
      </CardHeader>
      <CardContent>
        {bets.length > 0 ? (
          <div className="space-y-3">
            {bets.map((bet) => (
              <div key={bet.id} className="flex items-center justify-between p-3 rounded-lg bg-dream-card/50 border border-white/5 hover:border-dream-accent3/30 transition-all">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-10 rounded-full ${bet.direction === 'up' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <div>
                    <div className="font-medium">{bet.tokenName} ({bet.tokenSymbol})</div>
                    <div className="text-sm text-gray-400">{bet.amount} SOL • {bet.direction === 'up' ? '↗️ Up' : '↘️ Down'}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">{bet.timeLeft} left</div>
                  <div className="text-sm font-medium">Potential: {bet.potentialWin} SOL</div>
                </div>
              </div>
            ))}
            
            <Link to="/betting/my-bets" className="block w-full">
              <Button variant="ghost" className="w-full mt-2 text-dream-accent3 hover:text-dream-accent3 hover:bg-dream-accent3/10">
                View All Bets
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-400 mb-4">You don't have any active bets</p>
            <Link to="/betting">
              <Button variant="outline" className="border-dream-accent2/30 hover:border-dream-accent2/50 hover:bg-dream-accent2/10">
                Place Your First Bet
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PXBBetsList;
