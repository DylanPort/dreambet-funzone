
import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Copy, Check, ExternalLink, Share2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import truncateAddress from '@/utils/truncateAddress';

export const PXBWallet = () => {
  const { publicKey } = useWallet();
  const [copied, setCopied] = useState(false);
  const [referralLink, setReferralLink] = useState('');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);
  
  const { 
    userProfile, 
    generateReferralLink, 
    checkAndProcessReferral,
    referralStats,
    fetchReferralStats,
    isLoadingReferrals,
    processPendingReferrals,
    isProcessingReferral
  } = usePXBPoints();

  useEffect(() => {
    if (userProfile && fetchReferralStats) {
      fetchReferralStats();
    }
  }, [userProfile, fetchReferralStats]);

  const copyAddress = () => {
    if (!publicKey) return;
    
    navigator.clipboard.writeText(publicKey.toString());
    setCopied(true);
    toast.success('Address copied to clipboard');
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleGenerateReferralLink = async () => {
    if (!generateReferralLink) return;
    
    setIsGeneratingLink(true);
    try {
      const link = await generateReferralLink();
      setReferralLink(link);
      toast.success('Referral link generated successfully');
    } catch (error) {
      console.error('Error generating referral link:', error);
      toast.error('Failed to generate referral link');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const copyReferralLink = () => {
    if (!referralLink) return;
    
    navigator.clipboard.writeText(referralLink);
    toast.success('Referral link copied to clipboard');
  };

  const handleReferralCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!referralCode || !checkAndProcessReferral) {
      toast.error('Please enter a valid referral code');
      return;
    }
    
    setIsSubmittingCode(true);
    try {
      const success = await checkAndProcessReferral(referralCode);
      if (success) {
        toast.success('Referral code applied successfully!');
        setReferralCode('');
      }
    } catch (error) {
      console.error('Error applying referral code:', error);
      toast.error('Failed to apply referral code');
    } finally {
      setIsSubmittingCode(false);
    }
  };

  const handleProcessPendingReferrals = async () => {
    if (!processPendingReferrals) return;
    
    try {
      await processPendingReferrals();
    } catch (error) {
      console.error('Error processing pending referrals:', error);
      toast.error('Failed to process pending referrals');
    }
  };

  if (!publicKey) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-indigo-900/30 backdrop-blur-lg bg-[#010608]">
      <div className="p-6 border-b border-indigo-900/30">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Your Wallet</h2>
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" onClick={copyAddress}>
              {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              Copy Address
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(`https://solscan.io/account/${publicKey.toString()}`, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View on Solscan
            </Button>
          </div>
        </div>
      </div>
      
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Wallet Address</h3>
          <div className="flex items-center space-x-2">
            <div className="bg-indigo-900/20 p-3 rounded-lg flex-grow">
              <span className="text-indigo-300">{truncateAddress(publicKey.toString(), 12)}</span>
            </div>
            <Button size="icon" variant="outline" onClick={copyAddress}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Referral Program</h3>
          
          <div className="space-y-4">
            {/* Referral Link Generator */}
            <div>
              <div className="flex items-center mb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateReferralLink}
                  disabled={isGeneratingLink}
                  className="w-full justify-between"
                >
                  {isGeneratingLink ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <span>Generate Referral Link</span>
                      <Share2 className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
              
              {referralLink && (
                <div className="flex items-center mt-2">
                  <Input
                    value={referralLink}
                    readOnly
                    className="text-xs bg-indigo-900/20 border-indigo-900/30"
                  />
                  <Button size="icon" variant="outline" className="ml-2" onClick={copyReferralLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            
            {/* Referral Code Input */}
            <form onSubmit={handleReferralCodeSubmit} className="mt-4">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Enter referral code"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  className="bg-indigo-900/20 border-indigo-900/30"
                />
                <Button 
                  type="submit" 
                  variant="outline"
                  disabled={isSubmittingCode || !referralCode}
                >
                  {isSubmittingCode ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Apply'
                  )}
                </Button>
              </div>
            </form>
            
            {/* Referral Stats */}
            {!isLoadingReferrals && (
              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="bg-indigo-900/20 p-3 rounded-lg text-center">
                  <p className="text-indigo-300/70 text-xs mb-1">Your Referrals</p>
                  <p className="text-xl font-bold text-white">{referralStats?.referrals_count || 0}</p>
                </div>
                <div className="bg-indigo-900/20 p-3 rounded-lg text-center">
                  <p className="text-indigo-300/70 text-xs mb-1">Points Earned</p>
                  <p className="text-xl font-bold text-white">{referralStats?.pointsEarned?.toLocaleString() || 0}</p>
                </div>
              </div>
            )}
            
            {/* Pending Referrals */}
            {referralStats?.pendingReferrals > 0 && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleProcessPendingReferrals}
                  disabled={isProcessingReferral}
                  className="w-full"
                >
                  {isProcessingReferral ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Process ${referralStats.pendingReferrals} Pending Referrals`
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
