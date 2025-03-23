
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
              // Fall back to temporary profile with a non-UUID id format
              setUserProfile({
                id: `temp-${walletAddress.substring(0, 8)}`,
                username: walletAddress.substring(0, 8),
                pxbPoints: 0,
                createdAt: new Date().toISOString(),
                isTemporary: true // Add flag to identify temporary profiles
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
            // Fall back to temporary profile with a non-UUID id format
            setUserProfile({
              id: `temp-${walletAddress.substring(0, 8)}`,
              username: walletAddress.substring(0, 8),
              pxbPoints: 0,
              createdAt: new Date().toISOString(),
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

  // Add points to user profile
  const addPointsToUser = useCallback(async (amount: number, reason: string) => {
    if (!connected || !publicKey) {
      toast.error('Connect your wallet to earn points');
      return;
    }

    const walletAddress = publicKey.toString();
    console.log(`Adding ${amount} points to user ${walletAddress} for ${reason}`);

    try {
      // Skip points history check for temporary users
      if (userProfile && !userProfile.isTemporary) {
        // Get minting history for this wallet in the last 24 hours
        const now = new Date();
        const periodStart = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
        
        try {
          const { data: mintHistory, error: historyError } = await supabase
            .from('points_history')
            .select('amount')
            .eq('user_id', userProfile.id)
            .eq('action', 'mint')
            .gte('created_at', periodStart.toISOString());
          
          if (historyError) {
            console.error('Error fetching mint history:', historyError);
            // Continue anyway, assuming no previous mints
          } else if (mintHistory && mintHistory.length > 0) {
            // Calculate how much has been minted in the current period
            const mintedInPeriod = mintHistory.reduce((total, record) => total + record.amount, 0);
            const limit = 2000; // Daily mint limit
            
            if (mintedInPeriod + amount > limit) {
              const remaining = Math.max(0, limit - mintedInPeriod);
              toast.warning(`You can only mint ${remaining} more points today. Try again tomorrow.`);
              
              if (remaining <= 0) {
                return false;
              }
              
              // Adjust amount to remaining limit
              amount = remaining;
            }
          }
        } catch (historyErr) {
          console.error('Error processing mint history:', historyErr);
          // Continue anyway
        }
      }

      // First, get the current user profile to ensure it exists
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', walletAddress)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching user profile before adding points:', fetchError);
        throw new Error('Failed to update points');
      }

      if (!existingUser) {
        // Create user if it doesn't exist
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            wallet_address: walletAddress,
            username: walletAddress.substring(0, 8),
            points: amount // Set initial points
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating user when adding points:', createError);
          throw new Error('Failed to create user profile');
        }

        if (newUser) {
          setUserProfile({
            id: newUser.id,
            username: newUser.username || walletAddress.substring(0, 8),
            pxbPoints: newUser.points || amount,
            createdAt: newUser.created_at
          });
          
          // Record the transaction for the new user
          if (!newUser.id.startsWith('temp-')) {
            await supabase.from('points_history').insert({
              user_id: newUser.id,
              amount: amount,
              action: 'mint',
              reference_id: `mint_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
              reference_name: reason || 'Initial mint'
            });
          }
        }
      } else {
        // Update existing user points
        const newPointsTotal = (existingUser.points || 0) + amount;
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({ points: newPointsTotal })
          .eq('wallet_address', walletAddress)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating user points:', updateError);
          throw new Error('Failed to update points');
        }

        if (updatedUser) {
          setUserProfile(prev => {
            if (!prev) return {
              id: updatedUser.id,
              username: updatedUser.username || walletAddress.substring(0, 8),
              pxbPoints: updatedUser.points || 0,
              createdAt: updatedUser.created_at
            };
            
            return {
              ...prev,
              pxbPoints: updatedUser.points || 0
            };
          });
          
          // Record the transaction for the existing user
          if (existingUser.id && !existingUser.id.toString().startsWith('temp-')) {
            await supabase.from('points_history').insert({
              user_id: existingUser.id,
              amount: amount,
              action: 'mint',
              reference_id: `mint_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
              reference_name: reason || 'Points mint'
            });
          }
        }
      }

      toast.success(`Added ${amount} PXB points!`);
      return true;
    } catch (error) {
      console.error('Error in addPointsToUser:', error);
      toast.error('Failed to add points to your profile');
      return false;
    }
  }, [connected, publicKey, userProfile]);

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
    fetchUserProfile,
    addPointsToUser
  };
};
