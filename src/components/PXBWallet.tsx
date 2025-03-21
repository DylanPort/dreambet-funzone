import React, { useState, useEffect } from 'react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Copy, RefreshCw, QrCode, Clock, ArrowUpRight, ArrowDownLeft, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

// Define transaction types for activity
interface Transaction {
  id: string;
  amount: number;
  action: string;
  created_at: string;
  reference_id: string;
  reference_name?: string;
}

const PXBWallet: React.FC = () => {
  const { userProfile, isLoading, sendPoints, generatePxbId, fetchUserProfile } = usePXBPoints();
  const [activeTab, setActiveTab] = useState<'send' | 'receive' | 'activity' | 'claim'>('send');
  const [recipientId, setRecipientId] = useState('');
  const [amount, setAmount] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [myPxbId, setMyPxbId] = useState('');
  const [cooldownRemaining, setCooldownRemaining] = useState<number | null>(null);
  const [lastClaimTime, setLastClaimTime] = useState<number | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const COOLDOWN_TIME = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

  useEffect(() => {
    if (userProfile && generatePxbId) {
      const id = generatePxbId();
      setMyPxbId(id);
    }
  }, [userProfile, generatePxbId]);

  useEffect(() => {
    const storedLastClaimTime = localStorage.getItem('lastPxbClaim');
    if (storedLastClaimTime) {
      const lastTime = parseInt(storedLastClaimTime, 10);
      setLastClaimTime(lastTime);
      
      const updateCooldown = () => {
        const now = Date.now();
        const elapsed = now - lastTime;
        if (elapsed < COOLDOWN_TIME) {
          setCooldownRemaining(COOLDOWN_TIME - elapsed);
        } else {
          setCooldownRemaining(null);
        }
      };
      
      updateCooldown();
      const interval = setInterval(updateCooldown, 1000);
      return () => clearInterval(interval);
    }
  }, [lastClaimTime]);

  // Fetch transaction history when the activity tab is opened
  useEffect(() => {
    if (activeTab === 'activity' && userProfile) {
      fetchTransactionHistory();
    }
  }, [activeTab, userProfile]);

  const fetchTransactionHistory = async () => {
    if (!userProfile) return;
    
    setIsLoadingTransactions(true);
    try {
      // Fetch points history for the user
      const { data, error } = await supabase
        .from('points_history')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (error) {
        console.error('Error fetching transaction history:', error);
        toast.error('Failed to load transaction history');
        return;
      }
      
      setTransactions(data || []);
    } catch (error) {
      console.error('Unexpected error fetching transactions:', error);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const handleSendPoints = async () => {
    if (!sendPoints) return;
    
    if (!recipientId.trim()) {
      toast.error('Please enter a recipient PXB ID');
      return;
    }
    
    const amountNumber = parseFloat(amount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    setIsSending(true);
    try {
      // Extract the actual user ID from the PXB ID format (PXB-userID-timestamp)
      let actualUserId = recipientId;
      
      // Check if the input is in PXB-ID format and extract the userId portion
      if (recipientId.startsWith('PXB-')) {
        const parts = recipientId.split('-');
        if (parts.length >= 2) {
          // The full UUID might be spread across multiple parts if it contains hyphens
          // For simplicity, we'll take just the second part as the user identifier
          actualUserId = parts[1];
        }
      }
      
      console.log('Extracted user ID for sending:', actualUserId);
      
      const success = await sendPoints(actualUserId, amountNumber);
      if (success) {
        setRecipientId('');
        setAmount('');
        toast.success(`Successfully sent ${amountNumber} PXB points!`);
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleGenerateId = () => {
    if (!generatePxbId) return;
    
    const newId = generatePxbId();
    setMyPxbId(newId);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const formatCooldownTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleClaimPoints = async () => {
    if (!userProfile) return;
    
    setIsClaiming(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      // For this demo, we'll just set the last claim time
      const now = Date.now();
      localStorage.setItem('lastPxbClaim', now.toString());
      setLastClaimTime(now);
      setCooldownRemaining(COOLDOWN_TIME);
      
      toast.success('Successfully claimed 100 PXB points!');
      
      // In a real implementation, you would call an API to claim points
      // await mintPoints(100);
      fetchUserProfile();
    } finally {
      setIsClaiming(false);
    }
  };

  // Get a friendly description for a transaction
  const getTransactionDescription = (transaction: Transaction) => {
    switch (transaction.action) {
      case 'bet_placed':
        return 'Placed bet';
      case 'bet_won':
        return 'Won bet';
      case 'bet_lost':
        return 'Lost bet';
      case 'mint':
        return 'Claimed points';
      case 'transfer_sent':
        return 'Sent points';
      case 'transfer_received':
        return 'Received points';
      default:
        return transaction.action.replace(/_/g, ' ');
    }
  };

  // Format transaction time
  const formatTransactionTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  if (isLoading) {
    return (
      <div className="glass-panel p-6 mb-6 animate-pulse bg-gray-900/50 rounded-lg border border-gray-800">
        <div className="w-full h-12 bg-gray-800 rounded-lg mb-4"></div>
        <div className="w-1/2 h-8 bg-gray-800 rounded-lg"></div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="glass-panel p-6 mb-6 bg-gray-900/50 rounded-lg border border-gray-800">
        <p className="text-center text-gray-400">Connect your wallet to view your PXB balance</p>
      </div>
    );
  }

  return (
    <div className="glass-panel mb-6 overflow-hidden relative rounded-lg bg-[#1a2542] border border-indigo-900/50">
      {/* PXB Wallet Header */}
      <div className="p-6 flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-full bg-indigo-600/20 flex items-center justify-center mr-3">
            <img src="/lovable-uploads/be886d35-fbcb-4675-926c-38691ad3e311.png" alt="PXB Coin" className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold">PXB Wallet</h2>
            <p className="text-indigo-300/70 text-sm">Send and receive PXB points</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold">{userProfile.pxbPoints.toLocaleString()}</p>
          <p className="text-indigo-300/70 text-sm">PXB Points</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-indigo-900/50">
        <button
          className={`flex-1 py-3 font-medium flex items-center justify-center gap-2 ${
            activeTab === 'send' ? 'border-b-2 border-purple-500 text-white' : 'text-indigo-300/70 hover:text-white'
          }`}
          onClick={() => setActiveTab('send')}
        >
          <Send className="w-4 h-4" />
          Send
        </button>
        <button
          className={`flex-1 py-3 font-medium flex items-center justify-center gap-2 ${
            activeTab === 'receive' ? 'border-b-2 border-purple-500 text-white' : 'text-indigo-300/70 hover:text-white'
          }`}
          onClick={() => setActiveTab('receive')}
        >
          <QrCode className="w-4 h-4" />
          Receive
        </button>
        <button
          className={`flex-1 py-3 font-medium flex items-center justify-center gap-2 ${
            activeTab === 'claim' ? 'border-b-2 border-purple-500 text-white' : 'text-indigo-300/70 hover:text-white'
          }`}
          onClick={() => setActiveTab('claim')}
        >
          <Gift className="w-4 h-4" />
          Claim
        </button>
        <button
          className={`flex-1 py-3 font-medium flex items-center justify-center gap-2 ${
            activeTab === 'activity' ? 'border-b-2 border-purple-500 text-white' : 'text-indigo-300/70 hover:text-white'
          }`}
          onClick={() => setActiveTab('activity')}
        >
          <Clock className="w-4 h-4" />
          Activity
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'send' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="space-y-4">
              <div>
                <label className="text-sm text-indigo-300/70 mb-1 block">Recipient PXB ID</label>
                <Input
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  placeholder="Enter PXB ID (e.g., PXB-12345678-abc123)"
                  className="bg-indigo-900/20 border-indigo-900/50 text-white"
                />
              </div>
              
              <div>
                <label className="text-sm text-indigo-300/70 mb-1 block">Amount</label>
                <div className="relative">
                  <Input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                    placeholder="0"
                    type="number"
                    min="1"
                    className="bg-indigo-900/20 border-indigo-900/50 text-white pr-12"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-indigo-300/70">
                    PXB
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center py-2 px-3 bg-indigo-900/20 rounded-lg">
                <span className="text-sm text-indigo-300/70">Available</span>
                <span className="font-medium">{userProfile.pxbPoints.toLocaleString()} PXB</span>
              </div>
              
              <Button 
                onClick={handleSendPoints} 
                disabled={isSending || !recipientId || !amount}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                {isSending ? (
                  <div className="flex items-center">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span>Sending...</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Send className="w-4 h-4 mr-2" />
                    Send PXB Points
                  </div>
                )}
              </Button>
            </div>
          </motion.div>
        )}

        {activeTab === 'receive' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center"
          >
            <div className="w-40 h-40 bg-indigo-900/20 rounded-lg mb-4 flex items-center justify-center">
              <QrCode className="w-20 h-20 text-indigo-300/70" />
            </div>
            
            <p className="text-sm text-indigo-300/70 mb-2">Your PXB ID</p>
            <div className="w-full bg-indigo-900/20 rounded-lg p-3 flex justify-between items-center mb-6">
              <code className="text-sm text-indigo-200 font-mono">{myPxbId || 'Generating...'}</code>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-indigo-300/70 hover:text-white"
                onClick={() => copyToClipboard(myPxbId)}
                disabled={!myPxbId}
              >
                <Copy className="w-4 h-4" />
                <span className="sr-only">Copy ID</span>
              </Button>
            </div>
            
            <div className="text-center mb-6">
              <p className="text-sm text-indigo-300/70">
                Share your PXB ID with others to receive PXB points
              </p>
            </div>
            
            <Button 
              onClick={handleGenerateId} 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Generate New ID
            </Button>
          </motion.div>
        )}

        {activeTab === 'claim' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col items-center py-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <Gift className="w-10 h-10 text-green-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">Daily PXB Points</h3>
                <p className="text-indigo-300/70">
                  Claim free PXB points once every 6 hours
                </p>
              </div>
              
              {cooldownRemaining ? (
                <div className="text-center mb-6 p-6 bg-indigo-900/20 rounded-lg w-full max-w-md">
                  <p className="text-lg font-medium mb-4">Next claim available in</p>
                  <div className="flex items-center justify-center space-x-2">
                    <Clock className="w-5 h-5 text-indigo-300/70" />
                    <span className="text-2xl font-mono">{formatCooldownTime(cooldownRemaining)}</span>
                  </div>
                </div>
              ) : (
                <Button 
                  onClick={handleClaimPoints} 
                  disabled={isClaiming}
                  className="w-full max-w-md bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 mb-4"
                  size="lg"
                >
                  {isClaiming ? (
                    <div className="flex items-center">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      <span>Claiming...</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <img src="/lovable-uploads/be886d35-fbcb-4675-926c-38691ad3e311.png" alt="PXB Coin" className="w-5 h-5 mr-2" />
                      Claim 100 PXB Points
                    </div>
                  )}
                </Button>
              )}
              
              <div className="text-center text-indigo-300/70 text-sm mt-6 max-w-md">
                <p>Regularly claim your free PXB points to increase your betting power and climb the leaderboards!</p>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'activity' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Transaction History */}
            <div>
              <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
              
              {isLoadingTransactions ? (
                <div className="flex justify-center py-8">
                  <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : transactions.length > 0 ? (
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div 
                      key={tx.id} 
                      className="flex items-center justify-between p-3 bg-indigo-900/20 rounded-lg hover:bg-indigo-800/20 transition-colors"
                    >
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                          tx.amount >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {tx.amount >= 0 ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{getTransactionDescription(tx)}</p>
                          <p className="text-xs text-indigo-300/70">{formatTransactionTime(tx.created_at)}</p>
                        </div>
                      </div>
                      <div className={`font-medium ${tx.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {tx.amount >= 0 ? '+' : ''}{tx.amount} PXB
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-indigo-300/50">
                  <p>No recent transactions</p>
                </div>
              )}
              
              <Button 
                variant="outline" 
                className="w-full mt-4 border-indigo-900/50 text-indigo-300/70 hover:text-white hover:bg-indigo-900/30"
                onClick={fetchTransactionHistory}
                disabled={isLoadingTransactions}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Activity
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PXBWallet;
