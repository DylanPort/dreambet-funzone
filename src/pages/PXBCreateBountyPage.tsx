
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, ArrowLeft, Info, Users } from 'lucide-react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import PXBCreateBountyForm from '@/components/PXBCreateBountyForm';

const PXBCreateBountyPage = () => {
  const navigate = useNavigate();
  const { userProfile } = usePXBPoints();
  const { connected } = useWallet();
  const [loading, setLoading] = useState(false);

  if (!connected) {
    return (
      <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8 mt-10 text-center">
        <Award className="h-16 w-16 mx-auto text-yellow-400 mb-4" />
        <h1 className="text-3xl font-bold text-dream-foreground mb-4">Connect Your Wallet</h1>
        <p className="text-dream-foreground/70 max-w-lg mx-auto mb-6">
          Please connect your wallet to create a new bounty. Creating bounties requires a wallet connection.
        </p>
        <Button onClick={() => navigate('/bounties')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Bounties
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8 mt-10">
      <div className="mb-8">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate('/bounties')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Bounties
        </Button>
        
        <h1 className="text-3xl font-bold text-dream-foreground mb-2 flex items-center gap-2">
          <Award className="h-8 w-8 text-yellow-400" />
          Create Bounty
        </h1>
        <p className="text-dream-foreground/70 max-w-2xl">
          Create a bounty for users to earn PXB points by promoting your project. Define tasks like visiting your website, joining your Telegram group, or following your Twitter page.
        </p>
      </div>
      
      <div className="bg-blue-950/20 border border-blue-500/20 rounded-lg p-4 mb-8">
        <div className="flex gap-3 items-start">
          <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-400 mb-1">How bounties work</h3>
            <p className="text-dream-foreground/80 text-sm">
              Bounties reward users with PXB points for completing tasks related to your project.
              You can now set a maximum number of participants, and the rewards will be distributed equally among them.
              For website visits, users can earn rewards automatically when they click on your link.
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-dream-card/30 border border-dream-border rounded-lg p-6 md:p-8">
        <PXBCreateBountyForm userProfile={userProfile} />
      </div>
    </div>
  );
};

export default PXBCreateBountyPage;
