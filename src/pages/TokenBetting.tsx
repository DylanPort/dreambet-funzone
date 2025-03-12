
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { fetchMigratingTokens, fetchBetsByToken } from '@/api/mockData';
import BetsList from '@/components/BetsList';
import CreateBetForm from '@/components/CreateBetForm';

const TokenBetting = () => {
  const { tokenId } = useParams<{ tokenId: string }>();
  const [token, setToken] = useState<any>(null);
  const [bets, setBets] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateBetForm, setShowCreateBetForm] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!tokenId) return;
        
        // Fetch token details
        const tokens = await fetchMigratingTokens();
        const tokenData = Array.isArray(tokens) ? tokens.find((t) => t.id === tokenId) : null;
        setToken(tokenData || null);
        
        // Fetch bets for this token
        const betsData = await fetchBetsByToken(tokenId);
        setBets(Array.isArray(betsData) ? betsData : []);
      } catch (error) {
        console.error('Error fetching token betting data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tokenId]);

  const handleBetCreated = () => {
    // Refresh the bets list
    if (tokenId) {
      fetchBetsByToken(tokenId)
        .then(betsData => {
          setBets(Array.isArray(betsData) ? betsData : []);
        })
        .catch(error => {
          console.error('Error refreshing bets:', error);
        });
    }
  };

  if (loading) {
    return <div>Loading token and bets...</div>;
  }

  if (!token) {
    return <div>Token not found.</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="bg-card rounded-lg shadow-lg p-6 mb-8">
        <h1 className="text-3xl font-bold mb-4">{token.name}</h1>
        <div className="flex items-center gap-4 mb-6">
          <div>
            <p className="text-muted-foreground">Symbol: {token.symbol}</p>
            <p className="text-muted-foreground">Market Cap: ${token.marketCap?.toLocaleString()}</p>
          </div>
          <Button 
            onClick={() => setShowCreateBetForm(!showCreateBetForm)}
            className="ml-auto"
          >
            {showCreateBetForm ? 'Cancel' : 'Create Bet'}
          </Button>
        </div>
        
        {showCreateBetForm && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Create New Bet</h2>
            <CreateBetForm 
              tokenId={tokenId || ''}
              tokenName={token.name || ''}
              tokenSymbol={token.symbol || ''}
              onBetCreated={handleBetCreated}
              onSuccess={() => setShowCreateBetForm(false)}
              token={token}
            />
          </div>
        )}
      </div>
      
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Active Bets</h2>
        <BetsList 
          title="Active Bets" 
          type="active" 
        />
      </div>
    </div>
  );
};

export default TokenBetting;
