
import React, { useState, useEffect } from 'react';
import { Trophy, Zap, RefreshCw, Crown, Medal } from 'lucide-react';
import { getPointsLeaderboard } from '@/services/pointsService';
import { formatAddress } from '@/utils/betUtils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface LeaderboardUser {
  id: string;
  username: string;
  points: number;
}

const PointsLeaderboard = () => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeaderboard = async () => {
    try {
      setRefreshing(true);
      const data = await getPointsLeaderboard(10);
      setUsers(data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    // Refresh every 5 minutes
    const interval = setInterval(fetchLeaderboard, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    toast.info('Refreshing leaderboard...');
    fetchLeaderboard();
  };

  // Get appropriate medal for top 3 positions
  const getMedal = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="w-5 h-5 text-yellow-400" />;
      case 1:
        return <Medal className="w-5 h-5 text-gray-300" />;
      case 2:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 inline-flex items-center justify-center font-semibold">{index + 1}</span>;
    }
  };

  return (
    <div className="rounded-lg border border-white/10 bg-black/20 overflow-hidden">
      <div className="p-4 bg-black/30 border-b border-white/10">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Trophy className="w-5 h-5 mr-2 text-yellow-400" />
            <h2 className="text-xl font-bold">PXB Points Leaderboard</h2>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center justify-center p-1 rounded hover:bg-black/30 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin w-6 h-6 border-2 border-current border-t-transparent rounded-full"></div>
          </div>
        ) : users.length > 0 ? (
          <div className="space-y-2">
            <AnimatePresence>
              {users.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    index === 0 
                      ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30'
                      : 'bg-black/20 border border-white/5'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 flex items-center justify-center mr-3">
                      {getMedal(index)}
                    </div>
                    <div>
                      <span className="font-semibold">
                        {user.username || formatAddress(user.id)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center bg-black/30 px-3 py-1 rounded-full">
                    <Zap className="w-4 h-4 mr-1 text-yellow-400" />
                    <span className="font-semibold">{user.points} Points</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center p-8 text-gray-400">
            No users found. Be the first to start betting with PXB Points!
          </div>
        )}
      </div>
    </div>
  );
};

export default PointsLeaderboard;
