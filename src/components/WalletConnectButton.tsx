
import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';

const WalletConnectButton = () => {
  const { connected, publicKey } = useWallet();

  return (
    <div className="flex items-center">
      {connected && publicKey ? (
        <div className="flex items-center gap-2">
          <div className="text-sm text-dream-foreground/70">
            {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
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
