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
import { Connection, PublicKey } from '@solana/web3.js';
import { useToast } from '@/hooks/use-toast';

// Import the CSS for the wallet adapter
import '@solana/wallet-adapter-react-ui/styles.css';

// Create a wrapper to monitor wallet connection
const WalletConnectionMonitor = ({ children }: { children: React.ReactNode }) => {
  const { connected, publicKey, wallet, connecting } = useWallet();
  const { toast } = useToast();
  const [connectionChecked, setConnectionChecked] = useState(false);

  useEffect(() => {
    // Connection status monitor
    console.log("Wallet connection status:", {
      connected,
      connecting,
      hasPublicKey: !!publicKey,
      hasWallet: !!wallet,
      hasWalletPublicKey: !!wallet?.adapter?.publicKey,
      connectionChecked
    });

    const verifyWalletConnection = async () => {
      if (connected && publicKey && wallet) {
        try {
          // Simple check if wallet adapter has the expected publicKey
          if (wallet.adapter.publicKey && wallet.adapter.publicKey.equals(publicKey)) {
            console.log("Wallet successfully verified - publicKey matches");
            
            // Only show toast when first connected
            if (!connectionChecked) {
              toast({
                title: "Wallet Connected",
                description: `Connected to ${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}`,
              });
              setConnectionChecked(true);
            }
          } else {
            console.warn("Public key mismatch between wallet adapter and connection");
            // The publicKeys don't match, try to recover
            if (connectionChecked) {
              setConnectionChecked(false);
            }
          }
        } catch (error) {
          console.error("Error verifying wallet connection:", error);
          if (connectionChecked) {
            setConnectionChecked(false);
          }
        }
      } else if (!connected && connectionChecked) {
        // Reset when wallet is disconnected
        setConnectionChecked(false);
      }
    };

    // Verify connection status after a short delay to allow wallet to fully connect
    const timeoutId = setTimeout(() => {
      verifyWalletConnection();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [connected, publicKey, wallet, connecting, connectionChecked, toast]);

  return <>{children}</>;
};

const SolanaWalletProvider = ({ children }: { children: React.ReactNode }) => {
  // Set the network to mainnet-beta instead of devnet
  const network = WalletAdapterNetwork.Mainnet;

  // Set custom RPC endpoint with configurable commitment level
  const endpoint = useMemo(() => {
    // Use Mainnet for production
    return "https://api.mainnet-beta.solana.com";
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
