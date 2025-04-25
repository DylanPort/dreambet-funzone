
import { 
  QueryClient as TanstackQueryClient
} from '@tanstack/react-query';

// Simple function for creating a query client with consistent settings
export const createQueryClient = () => {
  return new TanstackQueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60, // 1 minute
        refetchOnWindowFocus: true,
        refetchInterval: 5000, // Refetch every 5 seconds
        retry: 3,
      },
    },
  });
};

// Create default instance
export const queryClient = createQueryClient();

// Helper function to invalidate token data
export const invalidateTokenData = (tokenId: string) => {
  queryClient.invalidateQueries({ queryKey: ['token', tokenId] });
  queryClient.invalidateQueries({ queryKey: ['tokenMetrics', tokenId] });
  queryClient.invalidateQueries({ queryKey: ['tokenTradeHistory', tokenId] });
};

// Helper function to prefetch token data
export const prefetchTokenData = async (tokenId: string) => {
  try {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: ['token', tokenId],
        queryFn: async () => {
          // Implement token fetching logic here or import from services
          return null;
        }
      }),
      queryClient.prefetchQuery({
        queryKey: ['tokenMetrics', tokenId],
        queryFn: async () => {
          // Implement token metrics fetching logic here or import from services
          return null;
        }
      })
    ]);
  } catch (error) {
    console.error('Error prefetching token data:', error);
  }
};
