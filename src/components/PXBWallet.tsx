import React, { useState, useEffect } from 'react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { UserProfile } from '@/types/pxb';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Send, CreditCard, QrCode, Coins, CheckCircle2, Clock, ArrowRight, ArrowUpDown, History, Lock } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import CountdownTimer from './CountdownTimer';

interface PXBWalletProps {
  userProfile: UserProfile | null;
}

interface TransactionHistory {
  id: string;
  userId: string;
  amount: number;
  action: 'transfer_sent' | 'transfer_received' | 'bet_won' | 'bet_lost' | 'mint';
  referenceId: string | null;
  createdAt: string;
}

const PXBWallet: React.FC<PXBWalletProps> = ({
  userProfile
}) => {
  const {
    mintPoints,
    sendPoints,
    generatePxbId
  } = usePXBPoints();
  const {
    publicKey
  } = useWallet();
  const [recipientId, setRecipientId] = useState('');
  const [sendAmount, setSendAmount] = useState<number>(0);
  const [userPxbId, setUserPxbId] = useState<string>('');
  const [showCopied, setShowCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [transactions, setTransactions] = useState<TransactionHistory[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [lastClaimTime, setLastClaimTime] = useState<Date | null>(null);
  const [claimCooldown, setClaimCooldown] = useState<number>(0);
  const [isCooldownActive, setIsCooldownActive] = useState<boolean>(false);
  const [cooldownEndTime, setCooldownEndTime] = useState<Date | null>(null);

  useEffect(() => {
    if (userProfile && generatePxbId) {
      setUserPxbId(userProfile.id);
      fetchTransactionHistory();
      fetchLastClaimTime();
    }
  }, [userProfile, generatePxbId]);

  useEffect(() => {
    let intervalId: number;
    
    if (isCooldownActive && lastClaimTime) {
      const cooldownEnd = new Date(lastClaimTime.getTime() + (6 * 60 * 60 * 1000));
      setCooldownEndTime(cooldownEnd);
      
      intervalId = window.setInterval(() => {
        const now = new Date();
        const timeSinceClaim = now.getTime() - lastClaimTime.getTime();
        const sixHoursInMs = 6 * 60 * 60 * 1000;
        const remainingTime = Math.max(0, sixHoursInMs - timeSinceClaim);
        
        if (remainingTime <= 0) {
          setIsCooldownActive(false);
          setClaimCooldown(0);
          setCooldownEndTime(null);
          clearInterval(intervalId);
        } else {
          setClaimCooldown(remainingTime);
        }
      }, 1000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [lastClaimTime, isCooldownActive]);

  const fetchLastClaimTime = async () => {
    if (!userProfile) return;
    
    try {
      const { data, error } = await supabase
        .from('points_history')
        .select('created_at')
        .eq('user_id', userProfile.id)
        .eq('action', 'mint')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) {
        console.error('Error fetching last claim time:', error);
        return;
      }
      
      if (data && data.length > 0) {
        const lastClaimDate = new Date(data[0].created_at);
        setLastClaimTime(lastClaimDate);
        
        const now = new Date();
        const timeSinceClaim = now.getTime() - lastClaimDate.getTime();
        const sixHoursInMs = 6 * 60 * 60 * 1000;
        
        if (timeSinceClaim < sixHoursInMs) {
          setIsCooldownActive(true);
          setClaimCooldown(sixHoursInMs - timeSinceClaim);
        }
      }
    } catch (error) {
      console.error('Error in fetchLastClaimTime:', error);
    }
  };

  const fetchTransactionHistory = async () => {
    if (!userProfile) return;
    setIsLoadingTransactions(true);
    try {
      const {
        data,
        error
      } = await supabase.from('points_history').select('*').eq('user_id', userProfile.id).order('created_at', {
        ascending: false
      }).limit(5);
      if (error) {
        console.error('Error fetching transaction history:', error);
        return;
      }
      const formattedTransactions: TransactionHistory[] = data.map(item => ({
        id: item.id,
        userId: item.user_id,
        amount: item.amount,
        action: item.action as 'transfer_sent' | 'transfer_received' | 'bet_won' | 'bet_lost' | 'mint',
        referenceId: item.reference_id,
        createdAt: item.created_at
      }));
      setTransactions(formattedTransactions);
    } catch (error) {
      console.error('Error fetching transaction history:', error);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

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
    setIsSending(true);
    try {
      const success = await sendPoints(recipientId, sendAmount);
      if (success) {
        setRecipientId('');
        setSendAmount(0);
        toast.success('Points sent successfully!');
      } else {
        toast.error('Failed to send points');
      }
    } catch (error) {
      console.error('Error sending points:', error);
      toast.error('An error occurred while sending points');
    } finally {
      setIsSending(false);
    }
  };

  const handleRequestMint = async () => {
    if (!mintPoints) return;
    
    try {
      await mintPoints(100);
      toast.success('You received 100 PXB Points!');
      
      const now = new Date();
      setLastClaimTime(now);
      setIsCooldownActive(true);
      setClaimCooldown(6 * 60 * 60 * 1000); // 6 hours in milliseconds
      
      const cooldownEnd = new Date(now.getTime() + (6 * 60 * 60 * 1000));
      setCooldownEndTime(cooldownEnd);
      
      fetchTransactionHistory();
    } catch (error) {
      console.error('Error in handleRequestMint:', error);
      toast.error('Failed to claim points');
    }
  };

  const formatCooldownTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatPXBId = (id: string) => {
    if (!id) return '';
    if (id.length <= 12) return id;
    return `${id.substring(0, 6)}...${id.substring(id.length - 6)}`;
  };

  const getActionLabel = (action: string): string => {
    switch (action) {
      case 'transfer_sent':
        return 'Sent';
      case 'transfer_received':
        return 'Received';
      case 'bet_won':
        return 'Won Bet';
      case 'bet_lost':
        return 'Lost Bet';
      case 'mint':
        return 'Minted';
      default:
        return 'Transaction';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'transfer_sent':
        return <ArrowUpDown className="w-4 h-4 text-orange-500" />;
      case 'transfer_received':
        return <ArrowRight className="w-4 h-4 text-green-500" />;
      case 'bet_won':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'bet_lost':
        return <Clock className="w-4 h-4 text-red-500" />;
      case 'mint':
        return <Coins className="w-4 h-4 text-purple-500" />;
      default:
        return <CreditCard className="w-4 h-4 text-gray-500" />;
    }
  };

  const getAmountColor = (action: string): string => {
    if (action === 'transfer_received' || action === 'bet_won' || action === 'mint') {
      return 'text-green-500';
    } else if (action === 'transfer_sent' || action === 'bet_lost') {
      return 'text-red-500';
    }
    return 'text-gray-500';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return <Card className="p-0 overflow-hidden bg-gradient-to-br from-[#1A1A2E] to-[#16213E] border-[#30475E]/30 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-sm">
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
          <span className="text-2xl font-bold text-white">{userProfile?.pxbPoints.toLocaleString()}</span>
          <p className="text-xs text-gray-400">PXB Points</p>
        </div>
      </div>

      <Tabs defaultValue="send" className="w-full">
        <TabsList className="w-full grid grid-cols-3 bg-black/20 rounded-none border-b border-white/5">
          <TabsTrigger value="send" className="data-[state=active]:bg-[#4B31DD]/10 data-[state=active]:text-white">
            <Send className="w-4 h-4 mr-2" />
            Send
          </TabsTrigger>
          <TabsTrigger value="receive" className="data-[state=active]:bg-[#4B31DD]/10 data-[state=active]:text-white">
            <QrCode className="w-4 h-4 mr-2" />
            Receive
          </TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-[#4B31DD]/10 data-[state=active]:text-white">
            <History className="w-4 h-4 mr-2" />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="p-6 pt-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipientId" className="text-sm text-gray-400">Recipient PXB ID</Label>
            <Input id="recipientId" placeholder="Enter recipient PXB ID" value={recipientId} onChange={e => setRecipientId(e.target.value)} className="bg-black/30 border-white/10 focus:border-[#4B31DD]/50 text-white" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm text-gray-400">Amount</Label>
            <div className="relative">
              <Input id="amount" type="number" placeholder="0" value={sendAmount || ''} onChange={e => setSendAmount(Number(e.target.value))} className="bg-black/30 border-white/10 focus:border-[#4B31DD]/50 text-white pr-16" />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm font-medium">
                PXB
              </div>
            </div>
            <p className="text-xs text-gray-500">Available: {userProfile.pxbPoints.toLocaleString()} PXB</p>
          </div>
          
          <Button onClick={handleSendPoints} disabled={isSending || !recipientId || sendAmount <= 0 || sendAmount > userProfile.pxbPoints} className="w-full bg-gradient-to-r from-[#4B31DD] to-[#1E93FF] hover:from-[#3A28B0] hover:to-[#1776CC] text-white border-none">
            {isSending ? <><Clock className="w-4 h-4 mr-2 animate-spin" /> Processing...</> : <><Send className="w-4 h-4 mr-2" /> Send PXB Points</>}
          </Button>

          <div className="pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRequestMint} 
              disabled={isCooldownActive} 
              className={`w-full border-dashed border-gray-600 bg-black/20 hover:bg-black/30 text-gray-400 ${isCooldownActive ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {isCooldownActive && cooldownEndTime ? (
                <div className="w-full flex items-center justify-center">
                  <Lock className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="mr-2">Locked:</span>
                  <CountdownTimer 
                    endTime={cooldownEndTime} 
                    onComplete={() => {
                      setIsCooldownActive(false);
                      setClaimCooldown(0);
                    }} 
                  />
                </div>
              ) : (
                <>
                  <Coins className="w-4 h-4 mr-2 text-gray-400" />
                  Request 100 Free PXB Points
                </>
              )}
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
              <div className="bg-black/30 border border-white/10 rounded-md py-2 px-4 flex items-center justify-between cursor-pointer" onClick={handleCopyId}>
                <span className="text-gray-300 font-mono">{formatPXBId(userPxbId)}</span>
                {showCopied ? <motion.div initial={{
                scale: 0.8,
                opacity: 0
              }} animate={{
                scale: 1,
                opacity: 1
              }} transition={{
                duration: 0.2
              }}>
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  </motion.div> : <Copy className="w-4 h-4 text-gray-400" />}
              </div>
            </div>
            
            <p className="text-xs text-gray-500 mt-3">
              Share this ID with others to receive PXB Points
            </p>
          </div>
          
        </TabsContent>

        <TabsContent value="activity" className="p-6 space-y-4">
          <h4 className="text-sm font-medium text-gray-400 mb-3">Transaction History</h4>
          
          {isLoadingTransactions ? <div className="flex justify-center py-4">
              <Clock className="w-5 h-5 text-gray-400 animate-spin" />
            </div> : transactions.length > 0 ? <div className="space-y-2">
              {transactions.map(transaction => <div key={transaction.id} className="flex items-center justify-between p-3 bg-black/20 rounded-md">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gray-800/80 flex items-center justify-center">
                      {getActionIcon(transaction.action)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {getActionLabel(transaction.action)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(transaction.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${getAmountColor(transaction.action)}`}>
                      {transaction.amount > 0 ? '+' : ''}{transaction.amount} PXB
                    </p>
                  </div>
                </div>)}
            </div> : <div className="text-center py-4">
              <p className="text-sm text-gray-500">No transaction history found</p>
            </div>}
          
          <div className="flex justify-center pt-4">
            <Button variant="outline" size="sm" onClick={fetchTransactionHistory} className="border-gray-600 bg-black/20 hover:bg-black/30 text-gray-400">
              <History className="w-4 h-4 mr-2" />
              Refresh History
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </Card>;
};

export default PXBWallet;
