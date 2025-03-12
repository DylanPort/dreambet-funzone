
import React, { useState, useEffect } from 'react';
import { fetchMigratingTokens } from '@/api/mockData';
import TokenCard from './TokenCard';

const MigratingTokenList = () => {
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchMigratingTokens();
        // Ensure data is an array before setting it
        setTokens(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching migrating tokens:', error);
        setTokens([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <p>Loading migrating tokens...</p>;
  }

  if (tokens.length === 0) {
    return <p>No migrating tokens found.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tokens.map((token, index) => (
        <TokenCard
          key={token.id || index}
          {...token}
          index={index}
        />
      ))}
    </div>
  );
};

export default MigratingTokenList;
