
import { useState, useCallback, useEffect } from 'react';
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
          createdAt: supabaseUser.created_at
        });
      } else {
        console.log('User not found in database, will create temporary profile');
        
        // Create a new user in the database
        if (connected && publicKey) {
          try {
            console.log('Creating new user in database');
            const { data: newUser, error: createError } = await supabase
              .from('users')
              .insert({
                wallet_address: walletAddress,
                username: walletAddress.substring(0, 8),
                points: 0
              })
              .select()
              .single();
              
            if (createError) {
              console.warn('Could not create user profile:', createError);
              // Fall back to temporary profile
              setUserProfile({
                id: 'temporary-' + walletAddress.substring(0, 8),
                username: walletAddress.substring(0, 8),
                pxbPoints: 0,
                createdAt: new Date().toISOString()
              });
            } else if (newUser) {
              console.log('New user created:', newUser);
              // Set the new user profile
              setUserProfile({
                id: newUser.id,
                username: newUser.username || walletAddress.substring(0, 8),
                pxbPoints: newUser.points || 0,
                createdAt: newUser.created_at
              });
            }
          } catch (createError) {
            console.error('Error creating user profile:', createError);
            // Fall back to temporary profile
            setUserProfile({
              id: 'temporary-' + walletAddress.substring(0, 8),
              username: walletAddress.substring(0, 8),
              pxbPoints: 0,
              createdAt: new Date().toISOString()
            });
          }
        } else {
          setUserProfile(null);
        }
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      toast.error('Failed to load user profile');
    } finally {
      setIsLoading(false);
    }
  }, [connected, publicKey]);

  // Re-fetch when connection state changes
  useEffect(() => {
    if (connected && publicKey) {
      fetchUserProfile();
    } else {
      setUserProfile(null);
      setIsLoading(false);
    }
  }, [connected, publicKey, fetchUserProfile]);

  return {
    userProfile,
    setUserProfile,
    isLoading,
    setIsLoading,
    fetchUserProfile
  };
};
