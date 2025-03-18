
import React, { useState } from 'react';
import { Copy, Check, ExternalLink, Users } from 'lucide-react';
import { toast } from 'sonner';
import usePumpPortal from '@/hooks/usePumpPortal';

interface TokenContractInfoProps {
  tokenId: string;
  className?: string;
  showExternalLink?: boolean;
}

const TokenContractInfo: React.FC<TokenContractInfoProps> = ({ 
  tokenId, 
  className = "text-xs text-dream-foreground/60", 
  showExternalLink = true 
}) => {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const pumpPortal = usePumpPortal();
  
  // Get token holder count from pumpPortal metrics
  const getHolderCount = (tokenId: string) => {
    if (!pumpPortal.tokenMetrics || !pumpPortal.tokenMetrics[tokenId]) {
      return null;
    }
    
    return pumpPortal.tokenMetrics[tokenId].holders || 0;
  };
  
  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    toast.success('Address copied to clipboard');
    setTimeout(() => setCopiedAddress(null), 2000);
  };
  
  // Fetch token metrics if not already fetched
  React.useEffect(() => {
    if (pumpPortal.isConnected && tokenId && 
        (!pumpPortal.tokenMetrics || !pumpPortal.tokenMetrics[tokenId])) {
      console.log(`TokenContractInfo: Fetching metrics for token ${tokenId}`);
      pumpPortal.fetchTokenMetrics(tokenId);
    }
  }, [pumpPortal.isConnected, tokenId, pumpPortal.tokenMetrics]);
  
  const holderCount = getHolderCount(tokenId);
  
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <span>Contract:</span>
      <span className="font-mono truncate max-w-[120px]" title={tokenId}>
        {tokenId.substring(0, 4)}...{tokenId.substring(tokenId.length - 4)}
      </span>
      <button 
        onClick={() => handleCopyAddress(tokenId)} 
        className="text-dream-accent2 hover:text-dream-accent2/80"
      >
        {copiedAddress === tokenId ? (
          <Check className="h-3 w-3" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </button>
      
      {holderCount !== null && (
        <div className="ml-2 flex items-center gap-1">
          <Users className="h-3 w-3" />
          <span>
            {holderCount.toLocaleString()} holders
          </span>
        </div>
      )}
      
      {showExternalLink && (
        <a 
          href={`https://dexscreener.com/solana/${tokenId}`} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="ml-1 text-dream-accent2 hover:text-dream-accent2/80"
        >
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
};

export default TokenContractInfo;
