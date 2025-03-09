
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
      if (connected && publicKey && wallet) {
        try {
          setVerifying(true);
          console.log("Verifying wallet connection in WalletConnectButton");
          console.log("Wallet state:", {
            connected,
            publicKey: publicKey?.toString(),
            walletAdapter: wallet?.adapter?.name,
            adapterPublicKey: wallet?.adapter?.publicKey?.toString()
          });
          
          // Allow more time for wallet adapter to fully initialize
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Stronger connection check
          if (wallet.adapter.publicKey && 
              wallet.adapter.publicKey.toString() === publicKey.toString() && 
              wallet.adapter.connected) {
            console.log("✅ Wallet FULLY CONNECTED with stringified publicKey match");
            setIsFullyConnected(true);
            
            // Notify the application that wallet is ready
            window.dispatchEvent(new CustomEvent('walletReady', { 
              detail: { publicKey: publicKey.toString() } 
            }));
          } else {
            console.warn("❌ Wallet connection issue: publicKey mismatch or adapter not connected");
            console.warn("Adapter publicKey:", wallet.adapter.publicKey?.toString());
            console.warn("Connected publicKey:", publicKey.toString());
            console.warn("Adapter connected:", wallet.adapter.connected);
            setIsFullyConnected(false);
          }
        } catch (error) {
          console.error("Error verifying wallet:", error);
          setIsFullyConnected(false);
        } finally {
          setVerifying(false);
        }
      } else {
        // Not all conditions met for a wallet connection
        console.log("Wallet not fully connected, missing required properties");
        setIsFullyConnected(false);
      }
    };
    
    // Add a longer delay to allow wallet adapter to fully initialize
    const timeoutId = setTimeout(() => {
      verifyConnection();
    }, 1200);

    return () => clearTimeout(timeoutId);
  }, [connected, publicKey, wallet]);

  // Extra check after some time to ensure wallet is ready
  useEffect(() => {
    if (connected && publicKey && wallet && !isFullyConnected) {
      const secondCheck = setTimeout(() => {
        console.log("Running secondary wallet verification check");
        if (wallet.adapter.publicKey && 
            wallet.adapter.publicKey.toString() === publicKey.toString() && 
            wallet.adapter.connected) {
          console.log("✅ Secondary check: Wallet NOW fully connected");
          setIsFullyConnected(true);
          
          // Notify the application that wallet is ready
          window.dispatchEvent(new CustomEvent('walletReady', { 
            detail: { publicKey: publicKey.toString() } 
          }));
        }
      }, 3000);
      
      return () => clearTimeout(secondCheck);
    }
  }, [connected, publicKey, wallet, isFullyConnected]);

  const handleForceReconnect = async () => {
    try {
      console.log("Force reconnecting wallet...");
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
