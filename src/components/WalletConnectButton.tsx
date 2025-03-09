
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
          <WalletMultiButton className="
            !bg-gradient-to-r !from-[#8B5CF6] !to-[#D946EF] 
            !border !border-white/20 !backdrop-blur-md 
            !p-2 !px-4 !rounded-xl !shadow-lg
            !transition-all !duration-300
            !text-white
            hover:!shadow-[0_0_15px_rgba(217,70,239,0.5)]
            hover:!scale-[1.02] 
            !relative !overflow-hidden
            before:!content-[''] before:!absolute before:!inset-0 before:!bg-white/10 before:!rounded-xl 
            before:!opacity-0 before:!transition-opacity before:!duration-300
            hover:before:!opacity-100
            after:!content-[''] after:!absolute after:!inset-[-10px] after:!bg-gradient-to-r 
            after:!from-[#8B5CF6]/0 after:!to-[#D946EF]/40 after:!blur-md after:!opacity-0 
            after:!transition-opacity after:!duration-300
            hover:after:!opacity-50
          " />
        </div>
      ) : connecting ? (
        <div className="flex items-center gap-2">
          <div className="animate-pulse text-[#0EA5E9] font-medium text-sm px-3 py-1 bg-[#0EA5E9]/10 rounded-full backdrop-blur-sm border border-[#0EA5E9]/30">
            <span className="inline-block w-2 h-2 bg-[#0EA5E9] rounded-full mr-2 animate-ping"></span>
            Connecting...
          </div>
          <WalletMultiButton className="
            !bg-gradient-to-r !from-[#8B5CF6] !to-[#D946EF] 
            !border !border-white/20 !backdrop-blur-md 
            !p-2 !px-4 !rounded-xl !shadow-lg
            !transition-all !duration-300
            !text-white
            hover:!shadow-[0_0_15px_rgba(217,70,239,0.5)]
            hover:!scale-[1.02] 
            !relative !overflow-hidden
            before:!content-[''] before:!absolute before:!inset-0 before:!bg-white/10 before:!rounded-xl 
            before:!opacity-0 before:!transition-opacity before:!duration-300
            hover:before:!opacity-100
            after:!content-[''] after:!absolute after:!inset-[-10px] after:!bg-gradient-to-r 
            after:!from-[#8B5CF6]/0 after:!to-[#D946EF]/40 after:!blur-md after:!opacity-0 
            after:!transition-opacity after:!duration-300
            hover:after:!opacity-50
          " />
        </div>
      ) : (
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#8B5CF6] to-[#D946EF] rounded-xl blur-md opacity-60 group-hover:opacity-100 transition-all duration-300 animate-pulse"></div>
          <WalletMultiButton className="
            !relative
            !bg-gradient-to-r !from-[#0EA5E9]/70 !to-[#1EAEDB]/70
            !border !border-white/20 !backdrop-blur-md 
            !p-2 !px-4 !rounded-xl 
            !transition-all !duration-300
            !text-white !font-medium
            group-hover:!from-[#8B5CF6] group-hover:!to-[#D946EF]
            !z-10
            !shadow-[0_0_20px_rgba(14,165,233,0.3)]
            group-hover:!shadow-[0_0_20px_rgba(217,70,239,0.5)]
          " />
        </div>
      )}
    </div>
  );
};

export default WalletConnectButton;
