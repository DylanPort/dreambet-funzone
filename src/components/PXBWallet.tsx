import React, { useState, useEffect } from 'react';
import { usePXBPoints } from '@/contexts/pxb/PXBPointsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Coins, Send, Wallet, Copy, RefreshCw, QrCode, PlusCircle, ArrowRight, ArrowLeft, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const PXBWallet: React.FC = () => {
  const { 
    userProfile, 
    isLoading, 
    sendPoints, 
    generatePxbId, 
    mintPoints,
    cooldownEnds,
    checkCooldown,
    fetchUserProfile 
  } = usePXBPoints();
  
  const [showSend, setShowSend] = useState(false);
  const [recipientId, setRecipientId] = useState('');
  const [amount, setAmount] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [myPxbId, setMyPxbId] = useState('');
  const [isMinting, setIsMinting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    if (checkCooldown) {
      checkCooldown();
    }
  }, [checkCooldown]);

  useEffect(() => {
    if (!cooldownEnds) {
      setTimeRemaining('');
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      if (now >= cooldownEnds) {
        setTimeRemaining('');
        return;
      }

      const remainingMs = cooldownEnds - now;
      const hours = Math.floor(remainingMs / (60 * 60 * 1000));
      const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
      const seconds = Math.floor((remainingMs % (60 * 1000)) / 1000);

      setTimeRemaining(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [cooldownEnds]);

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
      const parts = recipientId.split('-');
      const actualUserId = parts.length >= 2 ? parts[1] : recipientId;
      
      const success = await sendPoints(actualUserId, amountNumber);
      if (success) {
        setRecipientId('');
        setAmount('');
        setShowSend(false);
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

  const handleRefresh = () => {
    fetchUserProfile();
    toast.info('Refreshing balance...');
  };

  const handleMintPoints = async () => {
    if (!mintPoints) return;
    
    setIsMinting(true);
    try {
      await mintPoints(500);
      toast.success('Successfully minted 500 PXB points!');
    } catch (error) {
      console.error('Error minting points:', error);
      toast.error('Failed to mint PXB points');
    } finally {
      setIsMinting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="glass-panel p-6 mb-6 animate-pulse">
        <div className="w-full h-12 bg-white/5 rounded-lg mb-4"></div>
        <div className="w-1/2 h-8 bg-white/5 rounded-lg"></div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="glass-panel p-6 mb-6">
        <p className="text-center text-dream-foreground/60">Connect your wallet to view your PXB balance</p>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 mb-6 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 z-0"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent opacity-60 animate-pulse"></div>
      
      <motion.div 
        className="relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Wallet className="w-6 h-6 mr-2 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">PXB Wallet</h2>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 text-dream-foreground/60 hover:text-dream-foreground hover:bg-dream-foreground/10"
            onClick={handleRefresh}
          >
            <RefreshCw className="w-4 h-4" />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
        
        {!showSend && !showReceive ? (
          <>
            <div className="flex flex-col items-center py-6 mb-6 bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-xl border border-white/10">
              <p className="text-sm text-dream-foreground/60 mb-1">Available Balance</p>
              <h3 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
                {userProfile.pxbPoints.toLocaleString()}
              </h3>
              <p className="text-dream-foreground/80 font-medium">PXB</p>
              
              {userProfile.pxbPoints < 100 && (
                <div className="mt-4">
                  {cooldownEnds && timeRemaining ? (
                    <div className="flex items-center bg-white/5 rounded-lg px-4 py-2 text-sm text-dream-foreground/70">
                      <Clock className="w-4 h-4 mr-2 text-indigo-300" />
                      <span>Claim again in {timeRemaining}</span>
                    </div>
                  ) : (
                    <Button 
                      onClick={handleMintPoints} 
                      disabled={isMinting || !!cooldownEnds}
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                    >
                      {isMinting ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          <span>Claiming...</span>
                        </>
                      ) : (
                        <>
                          <PlusCircle className="w-4 h-4 mr-2" />
                          <span>Claim 500 PXB</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Button 
                onClick={() => setShowSend(true)} 
                className="flex items-center justify-center py-6 px-4 bg-gradient-to-r from-purple-600/80 to-indigo-600/80 hover:from-purple-600 hover:to-indigo-600 rounded-xl border border-white/10 transition-all duration-200"
              >
                <Send className="w-5 h-5 mr-2" strokeWidth={1.5} />
                <span>Send PXB</span>
              </Button>
              
              <Button 
                onClick={() => {
                  setShowReceive(true);
                  handleGenerateId();
                }}
                className="flex items-center justify-center py-6 px-4 bg-gradient-to-r from-blue-600/80 to-indigo-600/80 hover:from-blue-600 hover:to-indigo-600 rounded-xl border border-white/10 transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5 mr-2" strokeWidth={1.5} />
                <span>Receive PXB</span>
              </Button>
            </div>
          </>
        ) : showSend ? (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-xl border border-white/10 p-4"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium flex items-center">
                <Send className="w-4 h-4 mr-2 text-indigo-400" strokeWidth={1.5} />
                Send PXB
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 text-dream-foreground/60 hover:text-dream-foreground"
                onClick={() => setShowSend(false)}
              >
                <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                <span className="sr-only">Back</span>
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-dream-foreground/60 mb-1 block">Recipient PXB ID</label>
                <Input
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  placeholder="Enter PXB ID (e.g., PXB-12345678-abc123)"
                  className="bg-white/5 border-white/10"
                />
              </div>
              
              <div>
                <label className="text-sm text-dream-foreground/60 mb-1 block">Amount</label>
                <Input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                  placeholder="Amount to send"
                  type="number"
                  min="1"
                  className="bg-white/5 border-white/10"
                />
              </div>
              
              <div className="flex justify-between items-center py-2 px-3 bg-white/5 rounded-lg">
                <span className="text-sm text-dream-foreground/60">Available</span>
                <span className="font-medium">{userProfile.pxbPoints.toLocaleString()} PXB</span>
              </div>
              
              <Button 
                onClick={handleSendPoints} 
                disabled={isSending || !recipientId || !amount}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                {isSending ? 
                  <div className="flex items-center">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span>Sending...</span>
                  </div> 
                  : 'Send PXB'}
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 rounded-xl border border-white/10 p-4"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium flex items-center">
                <ArrowLeft className="w-4 h-4 mr-2 text-indigo-400" strokeWidth={1.5} />
                Receive PXB
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 text-dream-foreground/60 hover:text-dream-foreground"
                onClick={() => setShowReceive(false)}
              >
                <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                <span className="sr-only">Back</span>
              </Button>
            </div>
            
            <div className="flex flex-col items-center justify-center p-4 bg-white/5 rounded-xl mb-4">
              <div className="w-32 h-32 flex items-center justify-center bg-gradient-to-r from-indigo-500/30 to-purple-500/30 rounded-lg mb-4">
                <QrCode className="w-16 h-16 text-white/80" strokeWidth={1} />
              </div>
              <p className="text-sm text-dream-foreground/60 mb-1">Your PXB ID</p>
              <div className="bg-white/10 rounded-lg p-2 flex justify-between items-center w-full mb-2">
                <code className="text-xs text-indigo-200 truncate max-w-[180px]">{myPxbId || 'Generating...'}</code>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0 text-dream-foreground/60 hover:text-dream-foreground"
                  onClick={() => copyToClipboard(myPxbId)}
                  disabled={!myPxbId}
                >
                  <Copy className="w-3 h-3" />
                  <span className="sr-only">Copy ID</span>
                </Button>
              </div>
              <p className="text-xs text-dream-foreground/60 text-center mt-2">
                Share this ID with others to receive PXB points
              </p>
            </div>
            
            <Button 
              onClick={handleGenerateId} 
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" strokeWidth={1.5} />
              Generate New ID
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default PXBWallet;
