
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { Container } from '@/components/ui/container';
import PXBWallet from '@/components/PXBWallet';
import PXBBetsHistory from '@/components/PXBBetsHistory';
import PXBProfilePanel from '@/components/PXBProfilePanel';
import PXBStakingPanel from '@/components/PXBStakingPanel';
import { Shield, Users, Zap, ArrowRight, Sparkles } from 'lucide-react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Profile = () => {
  const [activeTab, setActiveTab] = useState("wallet");
  const { userProfile, isLoading } = usePXBPoints();
  
  if (isLoading) {
    return (
      <Layout>
        <Container className="py-16">
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        </Container>
      </Layout>
    );
  }
  
  if (!userProfile) {
    return (
      <Layout>
        <Container className="py-16">
          <motion.div 
            className="text-center max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-6 text-white">Connect Your Wallet</h1>
            <p className="text-indigo-300/70 mb-8">
              Connect your wallet to access your profile, view your PXB balance, and manage your bets.
            </p>
            <div className="bg-[#0f1628]/80 backdrop-blur-lg border border-indigo-900/30 rounded-xl p-8 md:p-12">
              <Shield className="h-16 w-16 mx-auto mb-6 text-indigo-400" />
              <h2 className="text-xl mb-4 text-white">Wallet Not Connected</h2>
              <p className="text-indigo-300/70 mb-6">
                Use the wallet button in the top navigation bar to connect your wallet and access your profile.
              </p>
              <div className="text-sm text-indigo-300/50">
                Your data is secure and you have full control over your assets.
              </div>
            </div>
          </motion.div>
        </Container>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <Container className="py-16">
        <motion.div
          className="space-y-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="glass-panel overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-400" />
                  Your Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PXBProfilePanel userProfile={userProfile} />
              </CardContent>
            </Card>
          </motion.div>
          
          <Tabs defaultValue="wallet" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-8">
              <TabsTrigger value="wallet" className="data-[state=active]:text-indigo-300">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <span className="hidden sm:inline">PXB Wallet</span>
                  <span className="sm:hidden">Wallet</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="bets" className="data-[state=active]:text-indigo-300">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <span className="hidden sm:inline">Betting History</span>
                  <span className="sm:hidden">History</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="staking" className="data-[state=active]:text-indigo-300">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline">Staking Rewards</span>
                  <span className="sm:hidden">Staking</span>
                </div>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="wallet" className="space-y-4 mt-2">
              {userProfile && <PXBWallet />}
            </TabsContent>
            
            <TabsContent value="bets" className="space-y-4 mt-2">
              <PXBBetsHistory />
            </TabsContent>
            
            <TabsContent value="staking" className="space-y-4 mt-2">
              <PXBStakingPanel />
            </TabsContent>
          </Tabs>
        </motion.div>
      </Container>
    </Layout>
  );
};

export default Profile;
