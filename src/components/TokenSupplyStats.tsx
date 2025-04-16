
import React from 'react';
import { motion } from 'framer-motion';
import { Coins, Users, DollarSign, PercentCircle, BarChart4 } from 'lucide-react';
import { usePXBAnalytics } from '@/hooks/usePXBAnalytics';
import { Progress } from '@/components/ui/progress';

const TokenSupplyStats = () => {
  const { analytics, isLoading } = usePXBAnalytics();
  
  const stats = [
    {
      title: "Total Supply Minted",
      value: isLoading ? "Loading..." : `${(analytics.totalMinted).toLocaleString()}`,
      icon: <Coins className="h-6 w-6 text-yellow-400" />,
      change: "+100%",
      description: "100% of total supply has been minted"
    },
    {
      title: "Active Users",
      value: isLoading ? "Loading..." : `${analytics.usersWithPoints.toLocaleString()}`,
      icon: <Users className="h-6 w-6 text-indigo-400" />,
      change: "+12.5%",
      description: "Users who have minted PXB"
    },
    {
      title: "Average Per User",
      value: isLoading ? "Loading..." : `${analytics.averagePerUser.toLocaleString()}`,
      icon: <PercentCircle className="h-6 w-6 text-green-400" />,
      change: "+3.2%",
      description: "Average PXB per holder"
    },
    {
      title: "Distribution",
      value: "View Details",
      icon: <BarChart4 className="h-6 w-6 text-purple-400" />,
      change: "",
      description: "Click to see distribution stats"
    }
  ];
  
  // Calculate the percentage of total supply minted
  const supplyPercentage = 100; // 100% as per requirement

  return (
    <div className="my-16">
      <motion.h2 
        className="text-3xl md:text-4xl font-bold text-center mb-8
          bg-gradient-to-r from-white via-yellow-300 to-yellow-500 bg-clip-text text-transparent
          flex justify-center items-center gap-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <DollarSign className="h-8 w-8 text-yellow-500" />
        PXB Supply Stats
      </motion.h2>
      
      <motion.div
        className="relative w-full h-8 bg-gray-900/50 rounded-full overflow-hidden mb-10 border border-indigo-900/30"
        initial={{ width: 0 }}
        animate={{ width: "100%" }}
        transition={{ duration: 1, delay: 0.2 }}
      >
        <motion.div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-500 to-yellow-300 rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: `${supplyPercentage}%` }}
          transition={{ duration: 1.5, delay: 0.4 }}
        />
        <motion.div
          className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          {supplyPercentage}% Minted
        </motion.div>
      </motion.div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            className="rounded-xl border border-indigo-900/30 bg-[#0f1628]/80 backdrop-blur-lg p-6 transition-all hover:border-indigo-600/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-lg bg-indigo-900/30">
                {stat.icon}
              </div>
              {stat.change && (
                <span className="text-xs font-medium text-green-500 bg-green-900/20 px-2 py-1 rounded-full">
                  {stat.change}
                </span>
              )}
            </div>
            <h3 className="text-lg font-medium text-gray-200 mb-1">{stat.title}</h3>
            <p className="text-2xl font-bold text-white mb-2">{stat.value}</p>
            <p className="text-sm text-indigo-300/70">{stat.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default TokenSupplyStats;
