
import { useEffect, useState } from 'react';
import { supabase } from './supabase/client';

// Simple implementation to replace @supabase/auth-helpers-react's useUser hook
export const useUser = () => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Set loading true on initial hook call
    setIsLoading(true);
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, isLoading };
};

// Helper function to safely get a user ID that works for guest mode too
export const getUserId = (user: any): string => {
  return user?.id || 'guest-user';
};

// Helper to check if a user is authenticated
export const isAuthenticated = (user: any): boolean => {
  return !!user?.id;
};
