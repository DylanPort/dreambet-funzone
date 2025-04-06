
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
        
        // Set permanent user profile from database
        setUserProfile({
          id: supabaseUser.id,
          username: supabaseUser.username || walletAddress.substring(0, 8),
          pxbPoints: supabaseUser.points || 0,
          createdAt: supabaseUser.created_at,
          walletAddress: walletAddress,
          isTemporary: false // Explicitly set to false for database profiles
        });
      } else {
        console.log('User not found in database, will create new profile');
        
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
              // Fall back to temporary profile with a non-UUID id format
              setUserProfile({
                id: `temp-${walletAddress.substring(0, 8)}`,
                username: walletAddress.substring(0, 8),
                pxbPoints: 0,
                createdAt: new Date().toISOString(),
                walletAddress: walletAddress,
                isTemporary: true // Add flag to identify temporary profiles
              });
            } else if (newUser) {
              console.log('New user created:', newUser);
              // Set the new user profile
              setUserProfile({
                id: newUser.id,
                username: newUser.username || walletAddress.substring(0, 8),
                pxbPoints: newUser.points || 0,
                createdAt: newUser.created_at,
                walletAddress: walletAddress,
                isTemporary: false
              });
            }
          } catch (createError) {
            console.error('Error creating user profile:', createError);
            // Fall back to temporary profile with a non-UUID id format
            setUserProfile({
              id: `temp-${walletAddress.substring(0, 8)}`,
              username: walletAddress.substring(0, 8),
              pxbPoints: 0,
              createdAt: new Date().toISOString(),
              walletAddress: walletAddress,
              isTemporary: true // Add flag to identify temporary profiles
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

  const addPointsToUser = useCallback(async (amount: number) => {
    if (!userProfile || !amount) return;
    
    try {
      setIsLoading(true);
      
      // For temporary users, just update the state
      if (userProfile.isTemporary) {
        setUserProfile(prev => {
          if (!prev) return null;
          return {
            ...prev,
            pxbPoints: prev.pxbPoints + amount
          };
        });
        return;
      }
      
      // For database users, update points in Supabase
      const { error } = await supabase
        .from('users')
        .update({ points: userProfile.pxbPoints + amount })
        .eq('id', userProfile.id);
        
      if (error) {
        console.error('Error adding points to user:', error);
        throw new Error('Failed to add points');
      }
      
      // Update local state
      setUserProfile(prev => {
        if (!prev) return null;
        return {
          ...prev,
          pxbPoints: prev.pxbPoints + amount
        };
      });
      
      // Record in points history
      await supabase.from('points_history').insert({
        user_id: userProfile.id,
        amount: amount,
        action: 'reward',
        reference_id: `reward_${Date.now()}`
      });
      
    } catch (error) {
      console.error('Error in addPointsToUser:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [userProfile]);

  return {
    userProfile, 
    setUserProfile, 
    isLoading, 
    setIsLoading, 
    fetchUserProfile,
    addPointsToUser
  };
};
