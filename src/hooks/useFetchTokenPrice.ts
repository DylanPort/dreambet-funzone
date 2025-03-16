
import { useState } from 'react';

const useFetchTokenPrice = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getTokenPrice = async (tokenId: string) => {
    try {
      setIsLoading(true);
      // Mock implementation - in a real app, this would call an API
      const mockPrice = {
        price: 1.23 + Math.random() * 10,
        change_24h: (Math.random() * 20) - 10,
      };
      
      return mockPrice;
    } catch (err) {
      setError(err as Error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getTokenPrice,
    isLoading,
    error,
  };
};

export default useFetchTokenPrice;
