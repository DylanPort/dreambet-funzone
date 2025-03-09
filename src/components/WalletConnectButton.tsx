
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
          const adapterConnected = wallet?.adapter?.connected;
          
          console.log("Wallet state:", {
            connected,
            publicKey: publicKey?.toString(),
            walletAdapter: wallet?.adapter?.name,
            adapterPublicKey: wallet?.adapter?.publicKey?.toString(),
            adapterConnected,
            effectivePublicKey: effectivePublicKey?.toString()
          });
          
          // Allow more time for wallet adapter to fully initialize
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Consider connected if we have any valid public key
          if (effectivePublicKey) {
            console.log("✅ Wallet FULLY CONNECTED with publicKey");
            setIsFullyConnected(true);
            
            // Create a more detailed wallet ready event
            window.dispatchEvent(new CustomEvent('walletReady', { 
              detail: { 
                publicKey: effectivePublicKey.toString(),
                adapter: wallet?.adapter?.name,
                adapterConnected,
                connected
              } 
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
        const adapterConnected = wallet?.adapter?.connected;
        
        if (effectivePublicKey) {
          console.log("✅ Secondary check: Wallet NOW fully connected");
          setIsFullyConnected(true);
          
          // Notify the application that wallet is ready with more details
          window.dispatchEvent(new CustomEvent('walletReady', { 
            detail: { 
              publicKey: effectivePublicKey.toString(),
              adapter: wallet?.adapter?.name,
              adapterConnected,
              connected
            } 
          }));
        }
      }, 3000);
      
      return () => clearTimeout(secondCheck);
    }
  }, [connected, publicKey, wallet, isFullyConnected]);

  // Extra frequent checks when wallet is connected but not fully ready
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (connected && !isFullyConnected && !verifying) {
      // Check more frequently in case we need to recover
      interval = setInterval(() => {
        console.log("Checking wallet connection status periodically...");
        const effectivePublicKey = publicKey || wallet?.adapter?.publicKey;
        const adapterConnected = wallet?.adapter?.connected;
        
        if (effectivePublicKey && adapterConnected) {
          console.log("✅ Periodic check: Wallet is now ready");
          setIsFullyConnected(true);
          
          // Notify application with detailed information
          window.dispatchEvent(new CustomEvent('walletReady', { 
            detail: { 
              publicKey: effectivePublicKey.toString(),
              adapter: wallet?.adapter?.name,
              adapterConnected: true,
              connected: true
            }
          }));
          
          if (interval) clearInterval(interval);
        }
      }, 2000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [connected, isFullyConnected, publicKey, wallet, verifying]);

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
      {connected ? (
        <div className="flex items-center gap-2">
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
