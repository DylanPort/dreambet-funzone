
import { QueryClient, QueryCache } from '@tanstack/react-query';
import { toast } from 'sonner';

export const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
    queryCache: new QueryCache({
      onError: (error, query) => {
        if (query.meta?.skipToast) return;
        
        console.error('Query error:', error);
        
        // Show toast for query errors
        toast.error('Network or API error', {
          description: 'Please try again or contact support if the issue persists.',
        });
      },
    }),
  });
};
