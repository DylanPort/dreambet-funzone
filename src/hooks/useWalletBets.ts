
import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { fetchUserBets } from '@/services/supabaseService';
import { Bet } from '@/types/bet';
import { toast } from 'sonner';

export const useWalletBets = () => {
  const [bets, setBets] = useState<Bet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { publicKey } = useWallet();

  const loadBets = async () => {
    if (!publicKey) return;
    
    setIsLoading(true);
    try {
      const walletAddress = publicKey.toString();
      const userBets = await fetchUserBets(walletAddress);
      setBets(userBets);
    } catch (error) {
      console.error("Error loading bets:", error);
      toast.error("Failed to load bets");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (publicKey) {
      loadBets();
    }
  }, [publicKey]);

  return { bets, isLoading, loadBets };
};
