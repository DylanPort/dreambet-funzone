
import React, { useState, useEffect } from 'react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { UserProfile } from '@/types/pxb';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Send, CreditCard, QrCode, Coins, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface PXBWalletProps {
  userProfile: UserProfile | null;
}

const PXBWallet: React.FC<PXBWalletProps> = ({ userProfile }) => {
  const { mintPoints, sendPoints, generatePxbId, isSendingPoints } = usePXBPoints();
  const { publicKey } = useWallet();
  const [recipientId, setRecipientId] = useState('');
  const [sendAmount, setSendAmount] = useState<number>(0);
  const [userPxbId, setUserPxbId] = useState<string>('');
  const [showCopied, setShowCopied] = useState(false);

  // Generate PXB ID for the current user on component mount
  useEffect(() => {
    if (userProfile && generatePxbId) {
      setUserPxbId(userProfile.id);
    }
  }, [userProfile, generatePxbId]);

  const handleCopyId = () => {
    if (userPxbId) {
      navigator.clipboard.writeText(userPxbId);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
      toast.success('PXB ID copied to clipboard');
    }
  };

  const handleSendPoints = async () => {
    if (!userProfile || !sendPoints) return;
    
    if (!recipientId.trim()) {
      toast.error('Please enter a recipient PXB ID');
      return;
    }
    
    if (sendAmount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }
    
    if (sendAmount > userProfile.pxbPoints) {
      toast.error(`Not enough PXB points. You need ${sendAmount} but only have ${userProfile.pxbPoints}.`);
      return;
    }
    
    const success = await sendPoints(recipientId, sendAmount);
    
    if (success) {
      setRecipientId('');
      setSendAmount(0);
    }
  };

  const handleRequestMint = async () => {
    if (mintPoints) {
      await mintPoints(100);
      toast.success('You received 100 PXB Points!');
    }
  };

  if (!userProfile) {
    return (
      <Card className="p-6 bg-black/20 border-dream-accent2/20 backdrop-blur-sm">
        <div className="text-center p-4">
          <p className="text-gray-400">Connect your wallet to access your PXB Wallet</p>
        </div>
      </Card>
    );
  }

  const formatPXBId = (id: string) => {
    if (!id) return '';
    if (id.length <= 12) return id;
    return `${id.substring(0, 6)}...${id.substring(id.length - 6)}`;
  };

  return (
    <Card className="p-0 overflow-hidden bg-gradient-to-br from-[#1A1A2E] to-[#16213E] border-[#30475E]/30 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-sm">
      <div className="bg-gradient-to-r from-[#4B31DD]/20 to-[#1E93FF]/20 p-4 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4B31DD] to-[#1E93FF] flex items-center justify-center">
            <Coins className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">PXB Wallet</h3>
            <p className="text-xs text-gray-400">Send and receive PXB points</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-white">{userProfile.pxbPoints.toLocaleString()}</span>
          <p className="text-xs text-gray-400">PXB Points</p>
        </div>
      </div>

      <Tabs defaultValue="send" className="w-full">
        <TabsList className="w-full grid grid-cols-2 bg-black/20 rounded-none border-b border-white/5">
          <TabsTrigger value="send" className="data-[state=active]:bg-[#4B31DD]/10 data-[state=active]:text-white">
            <Send className="w-4 h-4 mr-2" />
            Send
          </TabsTrigger>
          <TabsTrigger value="receive" className="data-[state=active]:bg-[#4B31DD]/10 data-[state=active]:text-white">
            <QrCode className="w-4 h-4 mr-2" />
            Receive
          </TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="p-6 pt-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipientId" className="text-sm text-gray-400">Recipient PXB ID</Label>
            <Input 
              id="recipientId" 
              placeholder="Enter recipient PXB ID" 
              value={recipientId} 
              onChange={(e) => setRecipientId(e.target.value)}
              className="bg-black/30 border-white/10 focus:border-[#4B31DD]/50 text-white"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm text-gray-400">Amount</Label>
            <div className="relative">
              <Input 
                id="amount" 
                type="number" 
                placeholder="0" 
                value={sendAmount || ''} 
                onChange={(e) => setSendAmount(Number(e.target.value))}
                className="bg-black/30 border-white/10 focus:border-[#4B31DD]/50 text-white pr-16"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm font-medium">
                PXB
              </div>
            </div>
            <p className="text-xs text-gray-500">Available: {userProfile.pxbPoints.toLocaleString()} PXB</p>
          </div>
          
          <Button 
            onClick={handleSendPoints} 
            disabled={isSendingPoints || !recipientId || sendAmount <= 0 || sendAmount > userProfile.pxbPoints}
            className="w-full bg-gradient-to-r from-[#4B31DD] to-[#1E93FF] hover:from-[#3A28B0] hover:to-[#1776CC] text-white border-none"
          >
            {isSendingPoints ? (
              <><Clock className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
            ) : (
              <><Send className="w-4 h-4 mr-2" /> Send PXB Points</>
            )}
          </Button>

          <div className="pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRequestMint}
              className="w-full border-dashed border-gray-600 bg-black/20 hover:bg-black/30 text-gray-400"
            >
              <Coins className="w-4 h-4 mr-2 text-gray-400" />
              Request 100 Free PXB Points
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="receive" className="p-6 space-y-6">
          <div className="text-center">
            <div className="bg-black/30 p-4 rounded-lg mb-4 mx-auto w-48 h-48 flex items-center justify-center">
              <QrCode className="w-32 h-32 text-[#4B31DD]/70" />
            </div>
            
            <p className="text-sm text-gray-400 mb-3">Your PXB ID</p>
            
            <div className="relative">
              <div 
                className="bg-black/30 border border-white/10 rounded-md py-2 px-4 flex items-center justify-between cursor-pointer"
                onClick={handleCopyId}
              >
                <span className="text-gray-300 font-mono">{formatPXBId(userPxbId)}</span>
                {showCopied ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  </motion.div>
                ) : (
                  <Copy className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </div>
            
            <p className="text-xs text-gray-500 mt-3">
              Share this ID with others to receive PXB Points
            </p>
          </div>
          
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-400">Recent Activity</h4>
            
            <div className="space-y-2">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-black/20 rounded-md">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full ${i % 2 === 0 ? 'bg-green-500/20' : 'bg-purple-500/20'} flex items-center justify-center`}>
                      {i % 2 === 0 ? (
                        <ArrowRight className="w-4 h-4 text-green-500" />
                      ) : (
                        <Coins className="w-4 h-4 text-purple-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {i % 2 === 0 ? 'Received' : 'Minted'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(Date.now() - i * 86400000).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${i % 2 === 0 ? 'text-green-500' : 'text-purple-500'}`}>
                      +{(i + 1) * 50} PXB
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default PXBWallet;
