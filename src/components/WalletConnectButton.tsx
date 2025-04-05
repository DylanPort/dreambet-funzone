
import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase, isAuthRateLimited, checkSupabaseTables } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const globalAuthState = {
  lastAttemptTime: 0,
  isAuthenticating: false,
  cooldownPeriod: 30000, // 30 seconds between auth attempts
  maxRetries: 3,
  retryCount: 0,
  authDisabled: false
};

const WalletConnectButton = () => {
  const { connected, publicKey, wallet, connecting, disconnect } = useWallet();
  const [isFullyConnected, setIsFullyConnected] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const { toast } = useToast();
  
  const authenticateWithSupabase = useCallback(async () => {
    const now = Date.now();
    if (globalAuthState.isAuthenticating || 
        globalAuthState.authDisabled || 
        (now - globalAuthState.lastAttemptTime < globalAuthState.cooldownPeriod && globalAuthState.retryCount > 0)) {
      return;
    }
    
    if (!connected || !publicKey) {
      return;
    }
    
    try {
      globalAuthState.isAuthenticating = true;
      globalAuthState.lastAttemptTime = now;
      
      const walletAddress = publicKey.toString();
      console.log(`Authenticating wallet ${walletAddress} with Supabase...`);
      
      // Store wallet information in localStorage for recovery
      localStorage.setItem('wallet_auth_data', JSON.stringify({
        publicKey: walletAddress,
        email: `${walletAddress}@solana.wallet`,
        password: walletAddress,
        timestamp: Date.now()
      }));
      
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (sessionData.session) {
        console.log('Already authenticated with Supabase');
        globalAuthState.retryCount = 0;
        setIsFullyConnected(true);
        return;
      }
      
      const rateLimited = await isAuthRateLimited();
      if (rateLimited) {
        console.log('Auth is currently rate-limited, proceeding without authentication');
        setIsFullyConnected(true);
        return;
      }
      
      const tablesExist = await checkSupabaseTables();
      if (!tablesExist) {
        console.log('Unable to connect to Supabase, proceeding without authentication');
        setIsFullyConnected(true);
        return;
      }
      
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: `${walletAddress}@solana.wallet`,
        password: walletAddress,
      });
      
      if (signInError) {
        console.log('Sign in failed:', signInError.message);
        
        if (signInError.message === 'Email logins are disabled') {
          console.log('Email authentication is disabled in Supabase, proceeding without login');
          globalAuthState.authDisabled = true;
          setIsFullyConnected(true);
          return;
        }
        
        if (signInError.message === 'Request rate limit reached' || signInError.status === 429) {
          globalAuthState.retryCount++;
          
          if (globalAuthState.retryCount >= globalAuthState.maxRetries) {
            console.log(`Max retries (${globalAuthState.maxRetries}) reached, proceeding without authentication`);
            setIsFullyConnected(true);
            return;
          }
          
          console.log(`Auth rate limited, retry attempt ${globalAuthState.retryCount}/${globalAuthState.maxRetries}`);
          setIsFullyConnected(true);
          return;
        }
        
        try {
          const { error: signUpError } = await supabase.auth.signUp({
            email: `${walletAddress}@solana.wallet`,
            password: walletAddress,
            options: {
              data: {
                wallet_address: walletAddress
              }
            }
          });
          
          if (signUpError) {
            if (signUpError.message === 'Signups not allowed for this instance') {
              console.log('Signups are disabled in Supabase, proceeding without account creation');
              globalAuthState.authDisabled = true;
              setIsFullyConnected(true);
              return;
            }
            
            console.error('Failed to authenticate with wallet:', signUpError);
            setIsFullyConnected(true);
          } else {
            console.log('Successfully created account for wallet', walletAddress);
            globalAuthState.retryCount = 0;
            setIsFullyConnected(true);
          }
        } catch (error) {
          console.error('Unexpected error during signup:', error);
          setIsFullyConnected(true);
        }
      } else {
        console.log('Successfully signed in with wallet', walletAddress);
        globalAuthState.retryCount = 0;
        setIsFullyConnected(true);
      }
    } catch (error) {
      console.error('Error in authenticateWithSupabase:', error);
      setIsFullyConnected(true);
    } finally {
      globalAuthState.isAuthenticating = false;
    }
  }, [connected, publicKey]);
  
  useEffect(() => {
    if (connected && publicKey && !isFullyConnected) {
      authenticateWithSupabase();
    }
  }, [connected, publicKey, authenticateWithSupabase, isFullyConnected]);
  
  useEffect(() => {
    const verifyConnection = async () => {
      if (connected && (publicKey || (wallet?.adapter?.publicKey))) {
        try {
          setVerifying(true);
          console.log("Verifying wallet connection in WalletConnectButton");
          
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
          
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          if (effectivePublicKey) {
            console.log("✅ Wallet FULLY CONNECTED with publicKey");
            setIsFullyConnected(true);
            
            window.dispatchEvent(new CustomEvent('walletReady', { 
              detail: { 
                publicKey: effectivePublicKey.toString(),
                adapter: wallet?.adapter?.name,
                adapterConnected,
                connected
              } 
            }));
            
            // Ensure we also attempt Supabase authentication
            authenticateWithSupabase();
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
        console.log("Wallet not fully connected, missing required properties");
        setIsFullyConnected(false);
      }
    };
    
    const timeoutId = setTimeout(() => {
      verifyConnection();
    }, 1200);

    return () => clearTimeout(timeoutId);
  }, [connected, publicKey, wallet, authenticateWithSupabase]);

  useEffect(() => {
    if (connected && !isFullyConnected) {
      const secondCheck = setTimeout(() => {
        console.log("Running secondary wallet verification check");
        const effectivePublicKey = publicKey || wallet?.adapter?.publicKey;
        const adapterConnected = wallet?.adapter?.connected;
        
        if (effectivePublicKey) {
          console.log("✅ Secondary check: Wallet NOW fully connected");
          setIsFullyConnected(true);
          
          window.dispatchEvent(new CustomEvent('walletReady', { 
            detail: { 
              publicKey: effectivePublicKey.toString(),
              adapter: wallet?.adapter?.name,
              adapterConnected,
              connected
            } 
          }));
          
          // Ensure we also attempt Supabase authentication here as well
          authenticateWithSupabase();
        }
      }, 3000);
      
      return () => clearTimeout(secondCheck);
    }
  }, [connected, publicKey, wallet, isFullyConnected, authenticateWithSupabase]);

  const handleForceReconnect = async () => {
    try {
      console.log("Force reconnecting wallet...");
      
      await supabase.auth.signOut();
      localStorage.removeItem('wallet_auth_data');
      
      if (disconnect) {
        await disconnect();
        toast({
          title: "Wallet disconnected",
          description: "Please reconnect your wallet",
        });
      }
      
      globalAuthState.retryCount = 0;
      globalAuthState.authDisabled = false;
      globalAuthState.lastAttemptTime = 0;
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
