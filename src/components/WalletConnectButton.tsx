
import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';

const WalletConnectButton = () => {
  const { connected, publicKey, wallet, connecting } = useWallet();
  const [isFullyConnected, setIsFullyConnected] = useState(false);
  
  useEffect(() => {
    // Check if wallet is actually ready for transactions
    if (connected && publicKey && wallet && wallet.adapter.publicKey) {
      setIsFullyConnected(true);
    } else {
      setIsFullyConnected(false);
    }
  }, [connected, publicKey, wallet]);

  return (
    <div className="flex items-center">
      {connected && publicKey ? (
        <div className="flex items-center gap-2">
          <div className={`flex items-center text-sm ${isFullyConnected ? 'text-green-400' : 'text-yellow-400'}`}>
            {isFullyConnected ? (
              <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
            ) : (
              <span className="w-2 h-2 bg-yellow-400 rounded-full mr-1"></span>
            )}
            {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
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
