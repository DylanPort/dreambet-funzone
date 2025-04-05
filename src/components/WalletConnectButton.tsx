
import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const WalletConnectButton = () => {
  const { connected, publicKey, wallet, connecting, disconnect } = useWallet();
  const [isFullyConnected, setIsFullyConnected] = useState(false);
  const [verifying, setVerifying] = useState(false);
  
  // Store wallet info in localStorage when connected
  useEffect(() => {
    if (connected && publicKey) {
      const walletAddress = publicKey.toString();
      localStorage.setItem('wallet_auth_data', JSON.stringify({
        publicKey: walletAddress,
        timestamp: Date.now()
      }));
      
      console.log(`Wallet connected: ${walletAddress}`);
      
      // Check if user exists in the database, if not, create
      ensureUserExists(walletAddress).catch(console.error);
    } else if (!connected) {
      // Clear wallet information when disconnected
      localStorage.removeItem('wallet_auth_data');
    }
  }, [connected, publicKey]);

  // Ensure user exists in database
  const ensureUserExists = async (walletAddress: string) => {
    try {
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', walletAddress)
        .maybeSingle();
        
      if (checkError) {
        console.warn('Error checking user existence:', checkError);
        return;
      }
      
      if (!existingUser) {
        console.log('Creating new user account...');
        const { error: createError } = await supabase
          .from('users')
          .insert({
            wallet_address: walletAddress,
            username: `User_${walletAddress.substring(0, 8)}`,
            points: 5000 // Start with 5000 points
          });
          
        if (createError) {
          console.error('Error creating new user:', createError);
        } else {
          console.log('Created new user account with 5000 PXB');
          toast.success('Welcome! You received 5000 PXB to start trading');
        }
      }
    } catch (error) {
      console.error('Error in ensureUserExists:', error);
    }
  };

  // Verify wallet connection is complete
  useEffect(() => {
    const verifyConnection = async () => {
      if (connected && (publicKey || (wallet?.adapter?.publicKey))) {
        try {
          setVerifying(true);
          console.log("Verifying wallet connection...");
          
          const effectivePublicKey = publicKey || wallet?.adapter?.publicKey;
          
          if (effectivePublicKey) {
            console.log("✅ Wallet connected with public key:", effectivePublicKey.toString());
            setIsFullyConnected(true);
            
            window.dispatchEvent(new CustomEvent('walletReady', { 
              detail: { 
                publicKey: effectivePublicKey.toString(),
                adapter: wallet?.adapter?.name,
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
        setIsFullyConnected(false);
      }
    };
    
    const timeoutId = setTimeout(() => {
      verifyConnection();
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [connected, publicKey, wallet]);

  // Handle disconnection
  const handleDisconnect = async () => {
    try {
      console.log("Disconnecting wallet...");
      localStorage.removeItem('wallet_auth_data');
      
      if (disconnect) {
        await disconnect();
        toast.success("Wallet disconnected");
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
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#8B5CF6] to-[#D946EF] rounded-xl blur-md opacity-60 group-hover:opacity-100 transition-all duration-300"></div>
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
