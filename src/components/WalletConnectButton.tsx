
import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const WalletConnectButton = () => {
  const { connected, publicKey, wallet, connecting, disconnect } = useWallet();
  const [isFullyConnected, setIsFullyConnected] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    // Check if wallet is actually ready for transactions
    const verifyConnection = async () => {
      if (connected && publicKey && wallet && wallet.adapter.publicKey) {
        try {
          setVerifying(true);
          
          // Check if the wallet adapter has a matching publicKey
          if (wallet.adapter.publicKey.equals(publicKey)) {
            console.log("Wallet verified with publicKey check");
            setIsFullyConnected(true);
          } else {
            setIsFullyConnected(false);
          }
        } catch (error) {
          console.error("Error verifying wallet connection:", error);
          setIsFullyConnected(false);
        } finally {
          setVerifying(false);
        }
      } else {
        setIsFullyConnected(false);
      }
    };
    
    verifyConnection();
  }, [connected, publicKey, wallet]);

  const handleForceReconnect = async () => {
    try {
      if (disconnect) {
        await disconnect();
        toast({
          title: "Wallet disconnected",
          description: "Please reconnect your wallet",
        });
      }
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
    }
  };

  return (
    <div className="flex items-center">
      {connected && publicKey ? (
        <div className="flex items-center gap-2">
          <div className={`flex items-center text-sm ${
            isFullyConnected ? 'text-green-400' : 
            verifying ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {isFullyConnected ? (
              <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
            ) : verifying ? (
              <span className="w-2 h-2 bg-yellow-400 rounded-full mr-1 animate-pulse"></span>
            ) : (
              <span className="w-2 h-2 bg-red-400 rounded-full mr-1"></span>
            )}
            {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
            
            {!isFullyConnected && !verifying && (
              <button 
                onClick={handleForceReconnect}
                className="ml-1 text-dream-accent2"
                title="Reconnect wallet"
              >
                <RefreshCw size={12} className="animate-spin-slow" />
              </button>
            )}
          </div>
          <WalletMultiButton className="!bg-dream-accent1 !hover:bg-dream-accent1/80" />
        </div>
      ) : connecting ? (
        <div className="flex items-center gap-2">
          <div className="animate-pulse text-yellow-400 text-sm">
            <span className="w-2 h-2 bg-yellow-400 rounded-full inline-block mr-1"></span>
            Connecting...
          </div>
          <WalletMultiButton className="!bg-dream-accent1 !hover:bg-dream-accent1/80" />
        </div>
      ) : (
        <WalletMultiButton className="!bg-dream-accent1 !hover:bg-dream-accent1/80" />
      )}
    </div>
  );
};

export default WalletConnectButton;
