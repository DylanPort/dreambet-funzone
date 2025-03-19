
import React, { useState, useEffect } from 'react';
import { fetchOpenBets } from '@/services/supabaseService';
import { Bet } from '@/types/bet';
import BetCard from './BetCard';
import { useWallet } from '@solana/wallet-adapter-react';

const MigratingTokenList: React.FC = () => {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const { connected, publicKey } = useWallet();

  useEffect(() => {
    const loadBets = async () => {
      setLoading(true);
      try {
        const openBets = await fetchOpenBets();
        setBets(openBets);
      } catch (error) {
        console.error("Error loading open bets:", error);
      } finally {
        setLoading(false);
      }
    };

    loadBets();
  }, []);

  if (loading) {
    return <div className="text-center py-4">Loading open bets...</div>;
  }

  if (!bets || bets.length === 0) {
    return <div className="text-center py-4">No open bets available.</div>;
  }

  return (
    <div className="space-y-4">
      {bets.map((bet) => {
        if (bet.prediction === 'dust') {
          // Skip rendering "dust" bets
          return null;
        }

        return (
          <BetCard
            key={bet.id}
            bet={bet}
            connected={connected}
            publicKeyString={publicKey ? publicKey.toString() : null}
            onAcceptBet={() => {
              // Handle accept bet logic here
            }}
          />
        );
      })}
    </div>
  );
};

export default MigratingTokenList;
