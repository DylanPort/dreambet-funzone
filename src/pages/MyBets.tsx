import React, { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { ArrowLeft, Zap, Coins, Trophy, Users, Activity, Link as LinkIcon, Copy } from 'lucide-react';
import Navbar from '@/components/Navbar';
import OrbitingParticles from '@/components/OrbitingParticles';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { Button } from '@/components/ui/button';
import PXBPointsBalance from '@/components/PXBPointsBalance';
import TradeHistoryList from '@/components/TradeHistoryList';
import PXBSupplyProgress from '@/components/PXBSupplyProgress';
import PXBStakingPanel from '@/components/PXBStakingPanel';
import PXBUserStats from '@/components/PXBUserStats';
import BetReel from '@/components/BetReel';

const PXBSpace = () => {
  const {
    connected,
    publicKey
  } = useWallet();
  const {
    userProfile,
    isLoading,
    generateReferralLink,
    referralStats,
    fetchReferralStats,
    isLoadingReferrals,
    checkAndProcessReferral
  } = usePXBPoints();
  
  const [referralLink, setReferralLink] = React.useState('');
  const [isGeneratingLink, setIsGeneratingLink] = React.useState(false);
  const [searchParams] = useSearchParams();

  const handleGenerateReferralLink = async () => {
    if (!generateReferralLink) return;
    
    setIsGeneratingLink(true);
    try {
      const link = await generateReferralLink();
      setReferralLink(link);
    } catch (error) {
      console.error('Error generating referral link:', error);
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  useEffect(() => {
    if (connected && userProfile) {
      const referralCode = searchParams.get('ref');
      if (referralCode && checkAndProcessReferral) {
        checkAndProcessReferral(referralCode);
      }
    }
  }, [connected, userProfile, searchParams, checkAndProcessReferral]);

  useEffect(() => {
    if (connected && userProfile && fetchReferralStats) {
      fetchReferralStats();
    }
  }, [connected, userProfile, fetchReferralStats]);

  return <>
      <OrbitingParticles />
      <Navbar />
      
      <main className="pt-24 min-h-screen overflow-hidden px-4 pb-16">
        <div className="max-w-5xl mx-auto">
          <Link to="/betting" className="inline-flex items-center text-dream-foreground/70 hover:text-dream-foreground mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
          
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-display font-bold">PXB Space</h1>
          </div>
          
          <div className="glass-panel p-6 mb-6 overflow-hidden relative">
            <PXBSupplyProgress />
          </div>
          
          <div className="glass-panel p-6 mb-6 overflow-hidden relative">
            <PXBStakingPanel />
          </div>
          
          <div className="glass-panel p-6 mb-6 overflow-hidden relative">
            <PXBUserStats />
          </div>
          
          <BetReel />
          
          {!connected ? <div className="glass-panel p-8 text-center">
              <p className="text-xl text-dream-foreground/70 mb-4">Connect your wallet to access PXB Space</p>
              <p className="text-dream-foreground/50 mb-6">Mint PXB Points to start participating in the ecosystem</p>
            </div> : <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-4 space-y-6">
                <PXBPointsBalance />
                
                <div className="glass-panel p-6">
                  <h2 className="font-semibold text-lg mb-4 flex items-center">
                    <Activity className="mr-2 h-5 w-5 text-dream-accent2" />
                    PXB Stats
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-dream-foreground/5 rounded-md p-4 text-center">
                      <p className="text-sm text-dream-foreground/60 mb-1">Total Bets</p>
                      <p className="text-2xl font-display font-bold text-gradient">
                        {isLoading ? "..." : "0"}
                      </p>
                    </div>
                    <div className="bg-dream-foreground/5 rounded-md p-4 text-center">
                      <p className="text-sm text-dream-foreground/60 mb-1">Win Rate</p>
                      <p className="text-2xl font-display font-bold text-gradient">
                        {isLoading ? "..." : "0%"}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="glass-panel p-6">
                  <h2 className="font-semibold text-lg mb-4 flex items-center">
                    <Zap className="mr-2 h-5 w-5 text-dream-accent1" />
                    Quick Actions
                  </h2>
                  <div className="space-y-3">
                    <Button asChild className="w-full" variant="outline">
                      <Link to="/betting">
                        Place New Bet
                      </Link>
                    </Button>
                    
                    <Button asChild className="w-full" variant="outline">
                      <Link to="/profile">
                        View Your Bets
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="md:col-span-8 space-y-6">
                <TradeHistoryList />
                
                <div className="glass-panel p-6">
                  <h2 className="font-semibold text-lg mb-4 flex items-center">
                    <img src="/lovable-uploads/e1b33d2f-7fd6-471b-802e-f18d0c0b7155.png" alt="Referral" className="mr-2 h-6 w-6" />
                    <span className="text-dream-success font-bold">Referral Program</span>
                  </h2>
                  
                  <div className="space-y-4">
                    <p className="text-dream-foreground/70 text-sm">
                      Invite friends and earn 10,000 PXB points for each person who joins through your referral link!
                    </p>
                    
                    <div className="flex flex-col space-y-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-dream-foreground/70">Your Referral Link</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-dream-accent1 hover:text-dream-accent1/80 px-2"
                          onClick={handleGenerateReferralLink}
                          disabled={isGeneratingLink}
                        >
                          {isGeneratingLink ? 
                            <div className="flex items-center">
                              <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-1"></div>
                              <span>Generating...</span>
                            </div> : 
                            <div className="flex items-center">
                              <LinkIcon className="w-3 h-3 mr-1" />
                              {referralLink ? 'Refresh' : 'Generate'}
                            </div>
                          }
                        </Button>
                      </div>
                      
                      <div className="relative">
                        <input
                          type="text"
                          value={referralLink}
                          readOnly
                          placeholder="Generate your referral link"
                          className="w-full bg-dream-foreground/5 px-3 py-2 rounded-md text-sm text-dream-foreground"
                        />
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="absolute right-1 top-1/2 -translate-y-1/2"
                          onClick={() => copyToClipboard(referralLink)}
                          disabled={!referralLink}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                      <div className="bg-dream-foreground/5 rounded-md p-4 text-center">
                        <p className="text-sm text-dream-foreground/60 mb-1">Total Referrals</p>
                        <p className="text-2xl font-display font-bold text-gradient">
                          {isLoadingReferrals ? "..." : referralStats?.referrals_count || 0}
                        </p>
                      </div>
                      <div className="bg-dream-foreground/5 rounded-md p-4 text-center">
                        <p className="text-sm text-dream-foreground/60 mb-1">Points Earned</p>
                        <p className="text-2xl font-display font-bold text-gradient">
                          {isLoadingReferrals ? "..." : (referralStats?.pointsEarned || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <Button asChild className="w-full" variant="outline">
                        <Link to="/profile">
                          View All Referrals
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>}
        </div>
      </main>
    </>;
};
export default PXBSpace;
