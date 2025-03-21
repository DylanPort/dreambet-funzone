
import React from 'react';
import { Button } from '@/components/ui/button';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { ArrowRight, CreditCard, Wallet, Gift } from 'lucide-react';
import { toast } from 'sonner';
import PXBPointsBalance from './PXBPointsBalance';

const PXBWallet = () => {
  const { userProfile, mintPoints, sendPoints } = usePXBPoints();

  const handleClaimDailyBonus = async () => {
    if (!userProfile) {
      toast.error("Please connect your wallet to claim bonus");
      return;
    }

    try {
      await mintPoints(100);
      toast.success("Claimed 100 PXB points!");
    } catch (error) {
      console.error("Error claiming bonus:", error);
      toast.error("Failed to claim bonus points");
    }
  };

  const handleFaucetClaim = async () => {
    if (!userProfile) {
      toast.error("Please connect your wallet to use faucet");
      return;
    }

    try {
      await mintPoints(500);
      toast.success("Claimed 500 PXB points from faucet!");
    } catch (error) {
      console.error("Error using faucet:", error);
      toast.error("Failed to claim points from faucet");
    }
  };

  return (
    <div className="glass-panel p-6 rounded-lg border border-green-800">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold">PXB Wallet</h2>
          <p className="text-green-400">Manage your PXB points and rewards</p>
        </div>
        
        <Button
          onClick={handleClaimDailyBonus}
          className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
        >
          <Gift className="w-4 h-4" />
          Claim Daily Bonus
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1">
          <PXBPointsBalance />
        </div>
        
        <div className="col-span-1 md:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg p-4 bg-green-900/20 border border-green-800/50">
              <div className="flex items-center mb-2">
                <CreditCard className="w-5 h-5 text-green-400 mr-2" />
                <h3 className="text-lg font-semibold">PXB Faucet</h3>
              </div>
              <p className="text-green-300/80 mb-4 text-sm">Claim free PXB tokens to start betting</p>
              <Button 
                variant="outline"
                onClick={handleFaucetClaim} 
                className="w-full bg-green-600 hover:bg-green-700 text-white border-0"
              >
                Claim 500 PXB <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <div className="rounded-lg p-4 bg-green-900/20 border border-green-800/50">
              <div className="flex items-center mb-2">
                <Wallet className="w-5 h-5 text-green-400 mr-2" />
                <h3 className="text-lg font-semibold">PXB Benefits</h3>
              </div>
              <p className="text-green-300/80 text-sm mb-4">Earn PXB by betting on tokens</p>
              <ul className="text-sm text-green-300/80 list-disc list-inside space-y-1">
                <li>Win 2x PXB on correct predictions</li>
                <li>Top leaderboard positions earn bonuses</li>
                <li>Create bets to earn passive PXB</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PXBWallet;
