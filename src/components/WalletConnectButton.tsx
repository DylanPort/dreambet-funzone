
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
      if (connected && (publicKey || (wallet?.adapter?.publicKey))) {
        try {
          setVerifying(true);
          console.log("Verifying wallet connection in WalletConnectButton");
          
          // Log current wallet state for debugging
          const effectivePublicKey = publicKey || wallet?.adapter?.publicKey;
          
          console.log("Wallet state:", {
            connected,
            publicKey: publicKey?.toString(),
            walletAdapter: wallet?.adapter?.name,
            adapterPublicKey: wallet?.adapter?.publicKey?.toString(),
            effectivePublicKey: effectivePublicKey?.toString()
          });
          
          // Allow more time for wallet adapter to fully initialize
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Consider connected if we have any valid public key
          if (effectivePublicKey) {
            console.log("✅ Wallet FULLY CONNECTED with publicKey");
            setIsFullyConnected(true);
            
            // Notify the application that wallet is ready
            window.dispatchEvent(new CustomEvent('walletReady', { 
              detail: { publicKey: effectivePublicKey.toString() } 
            }));
          } else {
            console.warn("❌ Wallet connection issue: missing public key");
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
    if (connected && !isFullyConnected) {
      const secondCheck = setTimeout(() => {
        console.log("Running secondary wallet verification check");
        const effectivePublicKey = publicKey || wallet?.adapter?.publicKey;
        
        if (effectivePublicKey) {
          console.log("✅ Secondary check: Wallet NOW fully connected");
          setIsFullyConnected(true);
          
          // Notify the application that wallet is ready
          window.dispatchEvent(new CustomEvent('walletReady', { 
            detail: { publicKey: effectivePublicKey.toString() } 
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

  // Get effective public key string for display
  const getDisplayAddress = () => {
    if (publicKey) {
      return publicKey.toString();
    } else if (wallet?.adapter?.publicKey) {
      return wallet.adapter.publicKey.toString();
    }
    return null;
  };

  const displayAddress = getDisplayAddress();

  return (
    <div className="flex items-center">
      {connected && displayAddress ? (
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
            {displayAddress.slice(0, 4)}...{displayAddress.slice(-4)}
            
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
