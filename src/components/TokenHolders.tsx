
import React from 'react';
import { Users } from 'lucide-react';

interface TokenHoldersProps {
  tokenId: string;
}

const TokenHolders: React.FC<TokenHoldersProps> = ({ tokenId }) => {
  return (
    <div className="min-h-[300px] flex flex-col items-center justify-center text-dream-foreground/60">
      <Users className="h-12 w-12 mb-4 opacity-30" />
      <p className="text-lg">Top holders data is not available yet</p>
      <p className="text-sm">Check back soon for holder analytics</p>
    </div>
  );
};

export default TokenHolders;
