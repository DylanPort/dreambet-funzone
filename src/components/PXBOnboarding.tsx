
import React, { useState } from 'react';
import { Coins } from 'lucide-react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const PXBOnboarding: React.FC = () => {
  const { mintPoints, isLoading } = usePXBPoints();
  const [username, setUsername] = useState('');

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    await mintPoints(username);
  };

  return (
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
  );
};

export default PXBOnboarding;
