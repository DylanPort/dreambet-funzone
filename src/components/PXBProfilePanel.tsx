
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserProfile } from '@/types/pxb';
import { PublicKey } from '@solana/web3.js';
import truncateAddress from '@/utils/truncateAddress';

export interface PXBProfilePanelProps {
  userProfile: UserProfile;
  publicKey?: PublicKey | null;
  localPxbPoints?: number;
}

const PXBProfilePanel: React.FC<PXBProfilePanelProps> = ({ 
  userProfile, 
  publicKey, 
  localPxbPoints = 0 
}) => {
  return (
    <Card className="bg-dream-surface/10 border-dream-foreground/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-display">Profile Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-dream-surface/20 p-4 rounded-lg">
            <h3 className="text-sm text-dream-foreground/60 mb-1">Username</h3>
            <p className="text-lg font-semibold text-dream-foreground">
              {userProfile?.username || 'Anonymous User'}
            </p>
          </div>
          
          <div className="bg-dream-surface/20 p-4 rounded-lg">
            <h3 className="text-sm text-dream-foreground/60 mb-1">Wallet</h3>
            <p className="text-lg font-mono text-sm text-dream-foreground">
              {truncateAddress(publicKey?.toString() || '', 6)}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-dream-surface/20 p-4 rounded-lg">
            <h3 className="text-sm text-dream-foreground/60 mb-1">Points Balance</h3>
            <p className="text-lg font-semibold text-dream-accent2">
              {userProfile?.pxbPoints?.toLocaleString() || localPxbPoints.toLocaleString()} PXB
            </p>
          </div>
          
          <div className="bg-dream-surface/20 p-4 rounded-lg">
            <h3 className="text-sm text-dream-foreground/60 mb-1">Member Since</h3>
            <p className="text-lg font-semibold text-dream-foreground">
              {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PXBProfilePanel;
