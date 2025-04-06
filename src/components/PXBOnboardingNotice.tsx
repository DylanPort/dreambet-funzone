
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { UserPlusIcon, Wallet } from 'lucide-react';

const PXBOnboardingNotice = () => {
  return (
    <div className="max-w-md mx-auto p-6 rounded-lg bg-black/50 border border-dream-accent1/30 shadow-lg">
      <div className="text-center mb-6">
        <Wallet className="h-12 w-12 mx-auto text-dream-accent1 mb-2" />
        <h2 className="text-xl font-bold mb-2">Welcome to PXB Tokens</h2>
        <p className="text-dream-foreground/70">
          Connect your wallet to get started with token trading
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="p-4 bg-dream-foreground/5 rounded border border-dream-foreground/10">
          <h3 className="font-semibold mb-2 flex items-center">
            <UserPlusIcon className="w-4 h-4 mr-2 text-dream-accent1" />
            Get Started
          </h3>
          <p className="text-sm text-dream-foreground/70 mb-3">
            Connect your wallet to create a profile and start trading tokens with PXB points.
          </p>
          <Button asChild className="w-full">
            <Link to="/">Connect Wallet</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PXBOnboardingNotice;
