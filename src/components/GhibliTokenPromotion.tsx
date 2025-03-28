
import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, Sparkles, ExternalLink, Coins } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { fetchDexScreenerData } from '@/services/dexScreenerService';
import { toast } from 'sonner';

interface GhibliTokenPromotionProps {
  tokenAddress: string;
}

const GhibliTokenPromotion: React.FC<GhibliTokenPromotionProps> = ({ tokenAddress }) => {
  const [tokenData, setTokenData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hovering, setHovering] = useState<'moon' | 'dust' | null>(null);
  const { placeBet } = usePXBPoints();

  useEffect(() => {
    const fetchTokenData = async () => {
      try {
        setLoading(true);
        const data = await fetchDexScreenerData(tokenAddress);
        if (data) {
          setTokenData(data);
        } else {
          console.error("No data found for token:", tokenAddress);
        }
      } catch (error) {
        console.error('Error fetching token data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTokenData();
  }, [tokenAddress]);

  const handleBet = async (prediction: 'moon' | 'die') => {
    try {
      if (!tokenData) return;
      
      const result = await placeBet({
        tokenId: tokenAddress,
        prediction: prediction,
        amount: 25,
        targetPercentage: prediction === 'moon' ? 10 : 5,
        expirationHours: 24
      });
      
      if (result.success) {
        toast.success(`Successfully placed ${prediction === 'moon' ? 'MOON' : 'DUST'} bet!`);
      } else {
        toast.error(result.message || 'Failed to place bet');
      }
    } catch (error) {
      console.error('Error placing bet:', error);
      toast.error('Something went wrong. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-4 mb-16 animate-pulse">
        <div className="h-40 bg-gray-800/50 rounded-xl"></div>
      </div>
    );
  }

  if (!tokenData) {
    return null;
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-2 mb-16 z-20 relative">
      <motion.div 
        className="relative overflow-hidden rounded-xl glass-panel border border-white/10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/30 via-blue-900/20 to-teal-900/30">
          <motion.div 
            className="absolute inset-0 opacity-40"
            animate={{ 
              background: [
                'radial-gradient(circle at 20% 30%, rgba(121, 40, 202, 0.3), transparent 70%)',
                'radial-gradient(circle at 80% 70%, rgba(34, 211, 238, 0.3), transparent 70%)',
                'radial-gradient(circle at 50% 50%, rgba(76, 29, 149, 0.3), transparent 70%)',
                'radial-gradient(circle at 20% 30%, rgba(121, 40, 202, 0.3), transparent 70%)',
              ]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          />
          <div className="absolute inset-0 backdrop-blur-sm"></div>
        </div>
        
        <div className="relative p-6 flex flex-col md:flex-row items-center gap-6">
          {/* Token Info */}
          <div className="flex-1 flex flex-col items-center md:items-start">
            <div className="flex items-center gap-3 mb-2">
              <Avatar className="w-12 h-12 border-2 border-white/20 shadow-glow">
                <AvatarImage 
                  src={tokenData.baseToken?.imageUrl || `https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${tokenAddress}/logo.png`} 
                  alt={tokenData.baseToken?.name || "Token"} 
                />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500">
                  {tokenData.baseToken?.symbol?.charAt(0).toUpperCase() || "G"}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400 flex items-center gap-2">
                  {tokenData.baseToken?.name || "Ghiblification"} 
                  <Link to={`/token/${tokenAddress}`}>
                    <ExternalLink className="w-4 h-4 text-white/60 hover:text-white/90 transition-colors" />
                  </Link>
                </h2>
                <div className="text-sm text-white/70 flex items-center gap-2">
                  <span>{tokenData.baseToken?.symbol || "GHIBLI"}</span>
                  <span className="text-xs text-white/50">{tokenAddress.substring(0, 4)}...{tokenAddress.substring(tokenAddress.length - 4)}</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 w-full my-3">
              <div className="p-3 rounded-lg bg-white/5 backdrop-blur-md">
                <div className="text-xs text-white/60">Price</div>
                <div className="text-lg font-bold flex items-center gap-2">
                  ${parseFloat(tokenData.priceUsd || '0').toFixed(6)}
                  <span className={`text-xs px-2 py-0.5 rounded ${tokenData.priceChange?.h24 >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {tokenData.priceChange?.h24 >= 0 ? '+' : ''}{tokenData.priceChange?.h24?.toFixed(2)}%
                  </span>
                </div>
              </div>
              
              <div className="p-3 rounded-lg bg-white/5 backdrop-blur-md">
                <div className="text-xs text-white/60">24h Volume</div>
                <div className="text-lg font-bold">${tokenData.volume?.h24?.toLocaleString() || '0'}</div>
              </div>
            </div>
          </div>
          
          {/* Prediction Section */}
          <div className="flex-1">
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-amber-500 inline-flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-yellow-400" /> Will it MOON or DUST?
              </h3>
              <p className="text-sm text-white/70 mt-1">Place your prediction with PXB Points!</p>
            </div>
            
            <div className="flex gap-4 justify-center">
              <motion.div
                className="relative"
                whileHover={{ scale: 1.05 }}
                onHoverStart={() => setHovering('moon')}
                onHoverEnd={() => setHovering(null)}
              >
                <Button 
                  className="bg-gradient-to-br from-green-500 to-emerald-700 hover:from-green-400 hover:to-emerald-600 text-white px-6 py-6 rounded-xl h-auto border border-green-400/20"
                  onClick={() => handleBet('moon')}
                >
                  <div className="flex flex-col items-center">
                    <ArrowUp className="w-10 h-10 mb-2" />
                    <span className="text-lg font-bold">MOON</span>
                    <span className="text-xs mt-1">+10% in 24h</span>
                  </div>
                </Button>
                <motion.div 
                  className="absolute -inset-1 rounded-xl bg-green-400/20 z-[-1]"
                  animate={{ 
                    opacity: hovering === 'moon' ? 1 : 0,
                  }}
                  transition={{ duration: 0.3 }}
                />
              </motion.div>
              
              <motion.div
                className="relative"
                whileHover={{ scale: 1.05 }}
                onHoverStart={() => setHovering('dust')}
                onHoverEnd={() => setHovering(null)}
              >
                <Button 
                  className="bg-gradient-to-br from-red-500 to-rose-700 hover:from-red-400 hover:to-rose-600 text-white px-6 py-6 rounded-xl h-auto border border-red-400/20"
                  onClick={() => handleBet('die')}
                >
                  <div className="flex flex-col items-center">
                    <ArrowDown className="w-10 h-10 mb-2" />
                    <span className="text-lg font-bold">DUST</span>
                    <span className="text-xs mt-1">-5% in 24h</span>
                  </div>
                </Button>
                <motion.div 
                  className="absolute -inset-1 rounded-xl bg-red-400/20 z-[-1]"
                  animate={{ 
                    opacity: hovering === 'dust' ? 1 : 0,
                  }}
                  transition={{ duration: 0.3 }}
                />
              </motion.div>
            </div>
            
            <div className="text-center mt-3 text-xs text-white/60 flex justify-center items-center gap-1">
              <Coins className="w-3 h-3" /> Costs 25 PXB Points
            </div>
          </div>
          
          {/* Ghibli-inspired floating elements */}
          <motion.div 
            className="absolute top-0 right-0 w-24 h-24 opacity-20"
            animate={{ 
              y: [0, -10, 0],
              rotate: [0, 5, 0]
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <img src="https://i.imgur.com/8OUkBFS.png" alt="Totoro silhouette" className="w-full h-full object-contain" />
          </motion.div>
          
          <motion.div 
            className="absolute bottom-2 left-10 w-10 h-10 opacity-10"
            animate={{ 
              y: [0, 5, 0],
              x: [0, 5, 0]
            }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          >
            <img src="https://i.imgur.com/lUF3g6W.png" alt="Dust sprite" className="w-full h-full object-contain" />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default GhibliTokenPromotion;
