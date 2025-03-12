
import React from 'react';
import TokenCard from './TokenCard';

interface TokenListProps {
  tokens: any[];
  loading: boolean;
  transformFn?: (token: any, index?: number) => any;
  emptyMessage?: string;
}

const TokenList: React.FC<TokenListProps> = ({ 
  tokens, 
  loading, 
  transformFn, 
  emptyMessage = "No tokens found" 
}) => {
  if (loading) {
    return <p>Loading...</p>;
  }

  if (tokens.length === 0) {
    return <p>{emptyMessage}</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tokens.map((token, index) => (
        <TokenCard
          key={token.token_mint || token.id || index}
          {...(transformFn ? transformFn(token, index) : { ...token, index })}
        />
      ))}
    </div>
  );
};

export default TokenList;
