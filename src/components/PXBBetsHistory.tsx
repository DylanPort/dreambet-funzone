
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { formatTimeRemaining } from '@/utils/betUtils';
import { motion } from 'framer-motion';

const PXBBetsHistory = () => {
  const { bets, fetchUserBets } = usePXBPoints();
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadBets();
  }, []);

  const loadBets = async () => {
    setIsLoading(true);
    try {
      await fetchUserBets();
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredBets = bets.filter(bet => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'active') return bet.status === 'pending';
    return bet.status === 'won' || bet.status === 'lost';
  });

  return (
    <div className="glass-panel p-6 rounded-lg bg-gray-900/50 border border-gray-800">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Your Bets</h2>
          <p className="text-gray-400">History of your token bets</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadBets}
          disabled={isLoading}
          className="border-gray-700 text-gray-300"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="flex space-x-2 mb-6">
        <Button
          variant={activeFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveFilter('all')}
          className={activeFilter === 'all' ? 'bg-purple-600 hover:bg-purple-700' : 'border-gray-700 text-gray-300'}
        >
          All
        </Button>
        <Button
          variant={activeFilter === 'active' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveFilter('active')}
          className={activeFilter === 'active' ? 'bg-blue-600 hover:bg-blue-700' : 'border-gray-700 text-gray-300'}
        >
          Active
        </Button>
        <Button
          variant={activeFilter === 'completed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveFilter('completed')}
          className={activeFilter === 'completed' ? 'bg-green-600 hover:bg-green-700' : 'border-gray-700 text-gray-300'}
        >
          Completed
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-400">Loading bets...</p>
        </div>
      ) : filteredBets.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400">No bets found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-800">
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Token</th>
                <th className="py-3 px-4">Prediction</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredBets.map((bet) => (
                <motion.tr 
                  key={bet.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border-b border-gray-800 hover:bg-gray-800/30"
                >
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400">
                      PXB
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center">
                      <span className="font-medium">{bet.tokenSymbol}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    {bet.betType === 'up' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Up
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                        <TrendingDown className="w-3 h-3 mr-1" />
                        Down
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    {bet.betAmount} PXB
                  </td>
                  <td className="py-4 px-4">
                    {formatDate(bet.createdAt)}
                  </td>
                  <td className="py-4 px-4">
                    {bet.status === 'pending' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
                        Active
                      </span>
                    ) : bet.status === 'won' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                        Won
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                        Lost
                      </span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PXBBetsHistory;
