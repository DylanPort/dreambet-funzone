
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
        console.log("No wallet connected, clearing user profile");
        setUserProfile(null);
        setIsLoading(false);
        return;
      }

      const walletAddress = publicKey.toString();
      
      console.log("Fetching user profile for wallet:", walletAddress);
      
      // First check if the user exists in the database
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', walletAddress)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user profile:', error);
        toast.error('Failed to load user profile');
      } else if (userData) {
        // User exists, map to our UserProfile type
        const supabaseUser = userData as SupabaseUserProfile;
        console.log("User profile data from Supabase:", supabaseUser);
        
        setUserProfile({
          id: supabaseUser.id,
          username: supabaseUser.username || walletAddress.substring(0, 8),
          pxbPoints: supabaseUser.points || 0,
          createdAt: supabaseUser.created_at
        });
      } else {
        // User doesn't exist yet, create a new profile
        console.log('User not found in database, creating new profile');
        try {
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert([
              { 
                wallet_address: walletAddress,
                username: walletAddress.substring(0, 8),
                points: 100 // Start with 100 points
              }
            ])
            .select()
            .single();
            
          if (createError) {
            console.error('Error creating user profile:', createError);
            toast.error('Failed to create user profile');
          } else if (newUser) {
            console.log("Created new user profile:", newUser);
            setUserProfile({
              id: newUser.id,
              username: newUser.username || walletAddress.substring(0, 8),
              pxbPoints: newUser.points || 100,
              createdAt: newUser.created_at
            });
            toast.success('Welcome! New profile created with 100 PXB points');
          }
        } catch (createErr) {
          console.error('Unexpected error creating profile:', createErr);
          toast.error('Failed to create profile');
        }
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      toast.error('Failed to load user profile');
    } finally {
      setIsLoading(false);
    }
  }, [connected, publicKey]);

  return {
    userProfile,
    setUserProfile,
    isLoading,
    setIsLoading,
    fetchUserProfile
  };
};
