
import { PublicKey } from '@solana/web3.js';

// Function to safely get wallet public key
export const getWalletPublicKey = (wallet: any): PublicKey => {
  if (!wallet) {
    throw new Error('Wallet not connected');
  }

  const publicKey = wallet.publicKey || wallet.adapter?.publicKey;
  if (!publicKey) {
    throw new Error('Wallet public key not found');
  }
  
  return publicKey;
};

// Check if we're in test/development mode to bypass actual chain interaction
export const isTestMode = () => {
  const rpcUrl = process.env.VITE_APP_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
  return process.env.NODE_ENV === 'development' || !rpcUrl.includes('mainnet');
};

// Get RPC URL from environment or use default
export const getRpcUrl = () => {
  return process.env.VITE_APP_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
};
