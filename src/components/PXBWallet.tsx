import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { usePXBPoints } from '@/contexts/pxb/PXBPointsContext';
import { formatAddress } from '@/utils/betUtils';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from "sonner";
import { Copy, CheckCircle, AlertTriangle, ArrowRight, ArrowLeft } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Referral } from '@/types/pxb';

const PXBWallet = () => {
  const { 
    userProfile, 
    sendPoints, 
    generatePxbId, 
    generateReferralLink, 
    checkAndProcessReferral,
    transferFeature,
    referralStats,
    fetchReferralStats
  } = usePXBPoints();
  const { publicKey, connected } = useWallet();
  const [recipientId, setRecipientId] = useState('');
  const [transferAmount, setTransferAmount] = useState(0);
  const [isTransferring, setIsTransferring] = useState(false);
  const [pxbId, setPxbId] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [isProcessingReferral, setIsProcessingReferral] = useState(false);
  const [isGeneratingId, setIsGeneratingId] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [showReferrals, setShowReferrals] = useState(false);
  const [showReferralStats, setShowReferralStats] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showGenerateId, setShowGenerateId] = useState(false);

  useEffect(() => {
    const fetchId = async () => {
      if (userProfile && !userProfile.isTemporary) {
        setPxbId(userProfile.id);
      }
    };
    fetchId();
  }, [userProfile]);

  useEffect(() => {
    if (connected) {
      fetchReferralStats && fetchReferralStats();
    }
  }, [connected, fetchReferralStats]);

  const handleGeneratePxbId = async () => {
    setIsGeneratingId(true);
    try {
      const newId = await generatePxbId();
      setPxbId(newId);
      toast.success("PXB ID generated successfully!");
    } catch (error) {
      console.error("Error generating PXB ID:", error);
      toast.error("Failed to generate PXB ID");
    } finally {
      setIsGeneratingId(false);
    }
  };

  // Function to properly handle async referral link generation
  const handleGenerateReferralLink = async () => {
    setIsGeneratingLink(true);
    try {
      const link = await generateReferralLink();
      setReferralLink(link);
      toast.success("Referral link generated successfully!");
    } catch (error) {
      console.error("Error generating referral link:", error);
      toast.error("Failed to generate referral link");
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleCheckAndProcessReferral = async () => {
    setIsProcessingReferral(true);
    try {
      if (referralCode) {
        const success = await checkAndProcessReferral(referralCode);
        if (success) {
          toast.success("Referral processed successfully!");
          fetchReferralStats && fetchReferralStats();
        } else {
          toast.error("Invalid referral code or already processed.");
        }
      } else {
        toast.error("Please enter a referral code.");
      }
    } catch (error) {
      console.error("Error processing referral:", error);
      toast.error("Failed to process referral");
    } finally {
      setIsProcessingReferral(false);
    }
  };

  const handleSendPoints = async () => {
    setIsTransferring(true);
    try {
      if (!recipientId || !transferAmount) {
        toast.error("Please enter recipient ID and amount.");
        return;
      }
      if (transferAmount <= 0) {
        toast.error("Amount must be greater than zero.");
        return;
      }
      if (!userProfile) {
        toast.error("Please connect your wallet.");
        return;
      }
      if (userProfile.pxbPoints < transferAmount) {
        toast.error("Insufficient PXB points.");
        return;
      }

      const success = await sendPoints(recipientId, transferAmount);
      if (success) {
        toast.success(`Successfully sent ${transferAmount} PXB points to ${recipientId}!`);
      } else {
        toast.error("Failed to send PXB points.");
      }
    } catch (error) {
      console.error("Error sending PXB points:", error);
      toast.error("Failed to send PXB points.");
    } finally {
      setIsTransferring(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Copied to clipboard");
    }).catch((err) => {
      console.error('Failed to copy: ', err);
      toast.error("Failed to copy to clipboard");
    });
  };

  return (
    <div className="space-y-6">
      {/* PXB ID Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center">
            <span className="mr-2">PXB ID</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">Your unique PXB identifier</div>
            <Button variant="secondary" size="sm" onClick={() => setShowGenerateId(!showGenerateId)}>
              {showGenerateId ? <ArrowLeft className="w-4 h-4 mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
              {showGenerateId ? "Hide" : "Show"}
            </Button>
          </div>
          {showGenerateId && (
            <div className="space-y-2">
              {pxbId ? (
                <div className="flex items-center justify-between p-2 rounded-md bg-gray-100 dark:bg-gray-800">
                  <div className="text-sm font-medium">{pxbId}</div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => copyToClipboard(pxbId)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Copy ID</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              ) : (
                <div className="text-sm text-gray-500">No PXB ID generated yet.</div>
              )}
              <Button 
                className="w-full" 
                onClick={handleGeneratePxbId} 
                disabled={isGeneratingId}
                size="sm"
              >
                {isGeneratingId ? "Generating..." : "Generate PXB ID"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Referral System Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center">
            <span className="mr-2">Referral System</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">Share your referral link to earn rewards</div>
            <div className="space-x-2">
              <Button variant="secondary" size="sm" onClick={() => setShowReferralStats(!showReferralStats)}>
                {showReferralStats ? <ArrowLeft className="w-4 h-4 mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                {showReferralStats ? "Hide Stats" : "Show Stats"}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setShowReferrals(!showReferrals)}>
                {showReferrals ? <ArrowLeft className="w-4 h-4 mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                {showReferrals ? "Hide Referrals" : "Show Referrals"}
              </Button>
            </div>
          </div>

          {showReferralStats && referralStats && (
            <div className="p-3 rounded-md bg-gray-100 dark:bg-gray-800 space-y-2">
              <div className="text-sm font-medium">Total Referrals: {referralStats.totalReferrals}</div>
              <div className="text-sm font-medium">Active Referrals: {referralStats.activeReferrals}</div>
              <div className="text-sm font-medium">Points Earned: {referralStats.pointsEarned}</div>
            </div>
          )}

          {showReferrals && referralStats && referralStats.referrals && referralStats.referrals.length > 0 ? (
            <div className="space-y-2">
              {referralStats.referrals.map((referral: Referral) => (
                <div key={referral.referee} className="p-2 rounded-md bg-gray-100 dark:bg-gray-800">
                  <div className="text-sm">Referred: {referral.referredUsername || formatAddress(referral.referee)}</div>
                  <div className="text-xs text-gray-500">Date: {new Date(referral.date || referral.createdAt || '').toLocaleDateString()}</div>
                  <div className="text-xs text-gray-500">Status: {referral.status}</div>
                  <div className="text-xs text-gray-500">Points Earned: {referral.pointsEarned}</div>
                </div>
              ))}
            </div>
          ) : showReferrals && referralStats ? (
            <div className="text-sm text-gray-500">No referrals yet.</div>
          ) : null}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="referralLink">Referral Link</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(referralLink)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Copy link</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="referralLink"
              type="text"
              value={referralLink}
              readOnly
              className="cursor-not-allowed"
            />
            <Button 
              className="w-full" 
              onClick={handleGenerateReferralLink} 
              disabled={isGeneratingLink}
              size="sm"
            >
              {isGeneratingLink ? "Generating..." : "Generate Referral Link"}
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="referralCode">Enter Referral Code</Label>
            <Input
              id="referralCode"
              type="text"
              placeholder="Referral Code"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
            />
            <Button 
              className="w-full" 
              onClick={handleCheckAndProcessReferral} 
              disabled={isProcessingReferral}
              size="sm"
            >
              {isProcessingReferral ? "Processing..." : "Apply Referral Code"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transfer Points Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center">
            <span className="mr-2">Transfer PXB Points</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {transferFeature && !transferFeature.enabled ? (
            <div className="text-red-500 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Transfer feature is currently disabled.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">Send PXB points to another user</div>
                <Button variant="secondary" size="sm" onClick={() => setShowTransfer(!showTransfer)}>
                  {showTransfer ? <ArrowLeft className="w-4 h-4 mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                  {showTransfer ? "Hide Transfer" : "Show Transfer"}
                </Button>
              </div>
              {showTransfer && (
                <div className="space-y-2">
                  <div className="space-y-2">
                    <Label htmlFor="recipientId">Recipient PXB ID</Label>
                    <Input
                      id="recipientId"
                      type="text"
                      placeholder="Recipient ID"
                      value={recipientId}
                      onChange={(e) => setRecipientId(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transferAmount">Amount to Transfer</Label>
                    <Input
                      id="transferAmount"
                      type="number"
                      placeholder="Amount"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(Number(e.target.value))}
                    />
                  </div>
                  <div className="text-sm text-gray-500">
                    A fee of {transferFeature ? transferFeature.fee : 0}% will be applied to each transfer.
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={handleSendPoints} 
                    disabled={isTransferring || !transferFeature || !transferFeature.enabled}
                    size="sm"
                  >
                    {isTransferring ? "Transferring..." : "Send PXB Points"}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PXBWallet;
