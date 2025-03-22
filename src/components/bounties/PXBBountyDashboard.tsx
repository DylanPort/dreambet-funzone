
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PXBBountyList } from './PXBBountyList';
import { PXBCreateBountyForm } from './PXBCreateBountyForm';
import { Button } from '@/components/ui/button';
import { Plus, List } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useWallet } from '@solana/wallet-adapter-react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';

export function PXBBountyDashboard() {
  const [activeTab, setActiveTab] = useState('browse');
  const { connected } = useWallet();
  const { userProfile } = usePXBPoints();

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">PXB Bounties</h1>
          <p className="text-gray-500 mt-1">Complete tasks to earn PXB points or create bounties for your project</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'browse' ? 'default' : 'outline'}
            onClick={() => setActiveTab('browse')}
            className="flex items-center gap-2"
          >
            <List className="h-4 w-4" />
            Browse Bounties
          </Button>
          <Button
            variant={activeTab === 'create' ? 'default' : 'outline'}
            onClick={() => setActiveTab('create')}
            className="flex items-center gap-2"
            disabled={!connected}
          >
            <Plus className="h-4 w-4" />
            Create Bounty
          </Button>
        </div>
      </div>

      {!connected && (
        <Card className="bg-blue-50 border border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-blue-800">Connect Your Wallet</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-blue-700">
              You need to connect your wallet to create bounties or submit proofs for existing ones.
            </CardDescription>
          </CardContent>
        </Card>
      )}
      
      <div className="min-h-[70vh]">
        {activeTab === 'browse' ? (
          <PXBBountyList />
        ) : (
          <PXBCreateBountyForm />
        )}
      </div>
    </div>
  );
}
