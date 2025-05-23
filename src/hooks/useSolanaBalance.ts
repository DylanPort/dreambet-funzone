
import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';

export const useSolanaBalance = () => {
  const { connected, publicKey } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!connected || !publicKey) {
        setBalance(null);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        // Use a different RPC endpoint with better rate limits
        const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
        const lamports = await connection.getBalance(publicKey);
        const solBalance = lamports / LAMPORTS_PER_SOL;
        
        setBalance(solBalance);
      } catch (err) {
        console.error("Error fetching SOL balance:", err);
        setError("Failed to fetch balance");
        // Don't let the error prevent the UI from showing
        setBalance(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();

    // Reduce polling frequency to avoid rate limiting
    const intervalId = setInterval(fetchBalance, 60000); // Refresh every 60 seconds

    return () => clearInterval(intervalId);
  }, [connected, publicKey]);

  return { balance, isLoading, error };
};

export default useSolanaBalance;
