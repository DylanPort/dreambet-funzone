
import { useState, useCallback } from 'react';
import { UserProfile, SupabaseUserProfile } from '@/types/pxb';
import { supabase } from '@/integrations/supabase/client';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'sonner';

export const useProfileData = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { connected, publicKey } = useWallet();

  const fetchUserProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!connected || !publicKey) {
        setUserProfile(null);
        setIsLoading(false);
        return;
      }

      const walletAddress = publicKey.toString();
      
      console.log("Fetching user profile for wallet:", walletAddress);
      
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', walletAddress)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user profile:', error);
        toast.error('Failed to load user profile');
      } else if (userData) {
        const supabaseUser = userData as SupabaseUserProfile;
        console.log("User profile data from Supabase:", supabaseUser);
        
        setUserProfile({
          id: supabaseUser.id,
          username: supabaseUser.username || walletAddress.substring(0, 8),
          pxbPoints: supabaseUser.points || 0,
          createdAt: supabaseUser.created_at,
          wallet_address: walletAddress
        });
      } else {
        console.log('User not found in database yet, creating profile...');
        
        // Create a new user profile if it doesn't exist
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            wallet_address: walletAddress,
            username: `user_${walletAddress.substring(0, 6)}`,
            points: 100 // Start with 100 points
          })
          .select()
          .single();
          
        if (createError) {
          console.error('Error creating user profile:', createError);
          toast.error('Failed to create user profile');
          setUserProfile(null);
        } else if (newUser) {
          console.log('Created new user profile:', newUser);
          
          // Record the initial points in history
          await supabase
            .from('points_history')
            .insert({
              user_id: newUser.id,
              amount: 100,
              action: 'initial_grant',
              reference_id: 'system'
            });
          
          setUserProfile({
            id: newUser.id,
            username: newUser.username || walletAddress.substring(0, 8),
            pxbPoints: newUser.points || 100,
            createdAt: newUser.created_at,
            wallet_address: walletAddress
          });
          
          toast.success('Created new profile with 100 PXB points!');
        }
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      toast.error('Failed to load user profile');
    } finally {
      setIsLoading(false);
    }
  }, [connected, publicKey]);

  // New function to look up a user by different identifiers
  const lookupUser = useCallback(async (identifier: string) => {
    try {
      let query;
      
      // Check if it's a UUID
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier)) {
        query = supabase
          .from('users')
          .select('id, username, points, created_at, wallet_address')
          .eq('id', identifier);
      } 
      // Check if it's a PXB ID format
      else if (identifier.startsWith('PXB-')) {
        const parts = identifier.split('-');
        if (parts.length >= 2) {
          const id = parts[1];
          query = supabase
            .from('users')
            .select('id, username, points, created_at, wallet_address')
            .like('id', `${id}%`);
        } else {
          return { user: null, error: 'Invalid PXB ID format' };
        }
      }
      // Try username lookup
      else {
        query = supabase
          .from('users')
          .select('id, username, points, created_at, wallet_address')
          .eq('username', identifier);
      }
      
      if (!query) {
        return { user: null, error: 'Invalid identifier format' };
      }
      
      const { data, error } = await query.maybeSingle();
      
      if (error) {
        console.error('Error looking up user:', error);
        return { user: null, error: error.message };
      }
      
      if (!data) {
        // If not found by previous methods, try wallet address
        const { data: walletData, error: walletError } = await supabase
          .from('users')
          .select('id, username, points, created_at, wallet_address')
          .eq('wallet_address', identifier)
          .maybeSingle();
          
        if (walletError) {
          console.error('Error looking up user by wallet:', walletError);
          return { user: null, error: walletError.message };
        }
        
        if (!walletData) {
          return { user: null, error: 'User not found' };
        }
        
        return { 
          user: {
            id: walletData.id,
            username: walletData.username,
            pxbPoints: walletData.points || 0,
            createdAt: walletData.created_at,
            wallet_address: walletData.wallet_address
          }, 
          error: null 
        };
      }
      
      return { 
        user: {
          id: data.id,
          username: data.username,
          pxbPoints: data.points || 0,
          createdAt: data.created_at,
          wallet_address: data.wallet_address
        }, 
        error: null 
      };
    } catch (err) {
      console.error('Unexpected error in lookupUser:', err);
      return { user: null, error: 'Unexpected error looking up user' };
    }
  }, []);

  return {
    userProfile,
    setUserProfile,
    isLoading,
    setIsLoading,
    fetchUserProfile,
    lookupUser
  };
};
