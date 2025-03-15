
import React, { useState } from 'react';
import { Coins, PartyPopper } from 'lucide-react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion } from 'framer-motion';

const PXBOnboarding: React.FC = () => {
  const { mintPoints, isLoading } = usePXBPoints();
  const [username, setUsername] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    
    try {
      await mintPoints(username);
      setShowSuccess(true);
    } catch (error) {
      console.error('Error minting points:', error);
    }
  };

  return (
    <>
      <div className="glass-panel p-6 max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-dream-accent2/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Coins className="w-8 h-8 text-dream-accent2" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Get Started with PXB Points</h2>
          <p className="text-dream-foreground/70">
            Mint 500 PXB Points for free and start betting on tokens!
          </p>
        </div>
        
        <form onSubmit={handleMint} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm text-dream-foreground/70 mb-1">
              Choose a username
            </label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full bg-dream-foreground/5"
              required
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading || !username.trim()}
          >
            {isLoading ? 'Minting...' : 'Mint 500 PXB Points'}
          </Button>
        </form>
        
        <div className="mt-6 text-sm text-dream-foreground/50 text-center">
          By minting PXB Points, you can participate in the betting platform and grow your reputation.
        </div>
      </div>

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 border-none text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-white">
              Congratulations!
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col items-center py-6">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 260, 
                damping: 20,
                duration: 0.6 
              }}
              className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6"
            >
              <PartyPopper className="w-12 h-12 text-yellow-300" />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-center"
            >
              <h3 className="text-xl font-bold mb-2">You Just Minted</h3>
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Coins className="w-6 h-6 text-yellow-300" />
                <span className="text-3xl font-black text-white">500 PXB Points!</span>
              </div>
              <p className="text-white/80">Your points are now stored securely and ready to use!</p>
            </motion.div>
            
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 0.1 }}
            >
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-white"
                  initial={{
                    x: '50%',
                    y: '50%',
                    opacity: 1
                  }}
                  animate={{
                    x: `${Math.random() * 100}%`,
                    y: `${Math.random() * 100}%`,
                    opacity: 0
                  }}
                  transition={{
                    duration: 1.5,
                    delay: Math.random() * 0.5,
                    repeat: Infinity,
                    repeatDelay: Math.random() * 2
                  }}
                />
              ))}
            </motion.div>
            
            <Button
              onClick={() => setShowSuccess(false)}
              className="mt-6 bg-white text-purple-600 hover:bg-white/90 hover:text-purple-700 transition-all"
            >
              Start Betting Now!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PXBOnboarding;
