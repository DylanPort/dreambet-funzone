
import React, { useMemo, useState, useEffect } from 'react';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { 
  PhantomWalletAdapter, 
  SolflareWalletAdapter, 
  TorusWalletAdapter,
  LedgerWalletAdapter,
  SolongWalletAdapter,
  CloverWalletAdapter, 
  Coin98WalletAdapter,
  CoinbaseWalletAdapter
} from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';
import { useToast } from '@/hooks/use-toast';

// Import the CSS for the wallet adapter
import '@solana/wallet-adapter-react-ui/styles.css';

// Create a wrapper to monitor wallet connection
const WalletConnectionMonitor = ({ children }: { children: React.ReactNode }) => {
  const { connected, publicKey, wallet, connecting } = useWallet();
  const { toast } = useToast();
  const [connectionChecked, setConnectionChecked] = useState(false);

  useEffect(() => {
    const verifyWalletConnection = async () => {
      if (connected && publicKey && wallet) {
        try {
          // Instead of sign message, just check if the publicKey matches
          if (wallet.adapter.publicKey && wallet.adapter.publicKey.equals(publicKey)) {
            console.log("Wallet successfully verified with publicKey check");
            if (!connectionChecked) {
              toast({
                title: "Wallet Connected",
                description: `Connected to ${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}`,
              });
              setConnectionChecked(true);
            }
          } else {
            console.warn("Wallet appears connected but publicKey doesn't match");
            if (connectionChecked) {
              setConnectionChecked(false);
            }
          }
        } catch (error) {
          console.error("Failed to verify wallet connection:", error);
          if (connectionChecked) {
            setConnectionChecked(false);
            toast({
              title: "Wallet Connection Issue",
              description: "Please disconnect and reconnect your wallet",
              variant: "destructive",
            });
          }
        }
      } else if (!connected && connectionChecked) {
        setConnectionChecked(false);
      }
    };

    verifyWalletConnection();
  }, [connected, publicKey, wallet, connecting, connectionChecked, toast]);

  return <>{children}</>;
};

const SolanaWalletProvider = ({ children }: { children: React.ReactNode }) => {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'
  const network = WalletAdapterNetwork.Devnet;

  // Set custom RPC endpoint with configurable commitment level
  const endpoint = useMemo(() => {
    // Always use Devnet for testing
    return "https://api.devnet.solana.com";
  }, []);

  console.log("Using Solana RPC endpoint:", endpoint);

  // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking --
  // Only the wallets you configure here will be compiled into your application
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
      new SolongWalletAdapter(),
      new CloverWalletAdapter(),
      new Coin98WalletAdapter(),
      new CoinbaseWalletAdapter(),
      new LedgerWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint} config={{ commitment: 'confirmed' }}>
      <WalletProvider wallets={wallets} autoConnect={true}>
        <WalletModalProvider>
          <WalletConnectionMonitor>
            {children}
          </WalletConnectionMonitor>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default SolanaWalletProvider;
