
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile, ReferralStats } from '@/types/pxb';
import { toast } from 'sonner';

export const useReferralSystem = (
  userProfile: UserProfile | null,
  fetchUserProfile: () => Promise<void>
) => {
  const [referralStats, setReferralStats] = useState<ReferralStats>({
    referrals_count: 0,
    pointsEarned: 0,
    pendingReferrals: 0
  });
  const [isLoadingReferrals, setIsLoadingReferrals] = useState<boolean>(false);
  const [isProcessingReferral, setIsProcessingReferral] = useState<boolean>(false);

  // Generate a referral link for the current user
  const generateReferralLink = useCallback(async (): Promise<string> => {
    if (!userProfile) {
      throw new Error('You must be logged in to generate a referral link');
    }

    try {
      // Check if user already has a referral code
      if (!userProfile.referralCode) {
        // User doesn't have a referral code yet, try to fetch the latest user data
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('referral_code')
          .eq('id', userProfile.id)
          .single();

        if (userError || !userData || !userData.referral_code) {
          // Still no referral code, we need to generate one
          // Call the function to generate a referral code
          const { data, error } = await supabase
            .rpc('generate_referral_code');

          if (error) {
            console.error('Error generating referral code:', error);
            throw new Error('Failed to generate referral code');
          }

          // Update the user with the new referral code
          if (data) {
            const { error: updateError } = await supabase
              .from('users')
              .update({ referral_code: data })
              .eq('id', userProfile.id);

            if (updateError) {
              console.error('Error updating user with referral code:', updateError);
              throw new Error('Failed to save referral code');
            }

            // Refresh user profile to get the new referral code
            await fetchUserProfile();

            // Return a link with the generated code
            return `${window.location.origin}?ref=${data}`;
          }
        } else if (userData && userData.referral_code) {
          // We found a referral code in the database
          return `${window.location.origin}?ref=${userData.referral_code}`;
        }
      } else {
        // User already has a referral code
        return `${window.location.origin}?ref=${userProfile.referralCode}`;
      }

      throw new Error('Failed to generate referral link');
    } catch (error) {
      console.error('Error in generateReferralLink:', error);
      throw error;
    }
  }, [userProfile, fetchUserProfile]);

  // Check if a referral code is valid and process it
  const checkAndProcessReferral = useCallback(async (referralCode: string): Promise<boolean> => {
    if (!userProfile) {
      console.error('User must be logged in to process referrals');
      return false;
    }

    // Don't process if the user is trying to refer themselves
    if (userProfile.referralCode === referralCode) {
      toast.error("You can't refer yourself!");
      return false;
    }

    setIsProcessingReferral(true);
    try {
      console.log(`Processing referral code: ${referralCode} for user ${userProfile.id}`);

      // Check if user was already referred
      const { data: existingReferral, error: referralError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referred_id', userProfile.id)
        .maybeSingle();

      if (referralError && referralError.code !== 'PGRST116') {
        console.error('Error checking existing referral:', referralError);
        toast.error('Error checking referral status');
        return false;
      }

      if (existingReferral) {
        console.log('User was already referred:', existingReferral);
        toast.info('You have already been referred by someone');
        return false;
      }

      // Check if the referral code exists
      const { data: referrerData, error: referrerError } = await supabase
        .from('users')
        .select('id')
        .eq('referral_code', referralCode)
        .single();

      if (referrerError || !referrerData) {
        console.error('Error finding referrer:', referrerError);
        toast.error('Invalid referral code');
        return false;
      }

      // Update the user with the referral code
      const { error: updateError } = await supabase
        .from('users')
        .update({ referred_by: referralCode })
        .eq('id', userProfile.id);

      if (updateError) {
        console.error('Error updating user with referral:', updateError);
        toast.error('Failed to apply referral code');
        return false;
      }

      // Process the referral reward
      const { data: rewardResult, error: rewardError } = await supabase
        .rpc('process_referral_reward', {
          referrer_id: referrerData.id,
          referred_id: userProfile.id
        });

      if (rewardError) {
        console.error('Error processing referral reward:', rewardError);
        toast.error('Failed to process referral reward');
        return false;
      }

      // If processing was successful
      if (rewardResult) {
        console.log('Referral processed successfully');
        toast.success('Referral applied successfully!');
        
        // Refresh user profile
        await fetchUserProfile();
        
        // Refresh referral stats
        await fetchReferralStats();
        
        return true;
      } else {
        console.log('Referral was not processed, likely already exists');
        toast.info('This referral has already been processed');
        return false;
      }
    } catch (error) {
      console.error('Error in checkAndProcessReferral:', error);
      toast.error('An error occurred while processing the referral');
      return false;
    } finally {
      setIsProcessingReferral(false);
    }
  }, [userProfile, fetchUserProfile]);

  // Fetch referral stats for the current user
  const fetchReferralStats = useCallback(async () => {
    if (!userProfile) return;

    setIsLoadingReferrals(true);
    try {
      // Get count of referrals
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select('*', { count: 'exact' })
        .eq('referrer_id', userProfile.id);

      if (referralsError) {
        console.error('Error fetching referrals:', referralsError);
        return;
      }

      // Calculate points earned from referrals
      let pointsEarned = 0;
      if (referralsData && referralsData.length > 0) {
        pointsEarned = referralsData.reduce((sum, referral) => sum + (referral.points_awarded || 0), 0);
      }

      // Get count of pending referrals
      const { count: pendingCount, error: pendingError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('referred_by', userProfile.referralCode || '')
        .not('id', 'in', (referralsData || []).map(r => r.referred_id).filter(Boolean));

      if (pendingError) {
        console.error('Error fetching pending referrals:', pendingError);
      }

      setReferralStats({
        referrals_count: referralsData?.length || 0,
        pointsEarned,
        pendingReferrals: pendingCount || 0
      });
    } catch (error) {
      console.error('Error in fetchReferralStats:', error);
    } finally {
      setIsLoadingReferrals(false);
    }
  }, [userProfile]);

  // Process all pending referrals for the user
  const processPendingReferrals = useCallback(async () => {
    if (!userProfile) {
      toast.error('You must be logged in to process referrals');
      return;
    }

    setIsProcessingReferral(true);
    try {
      console.log('Processing all pending referrals');
      
      // Call the database function to process all pending referrals
      // Use a custom SQL function since it's not available in the default RPC list
      const { data, error } = await supabase
        .from('users')
        .select('id, referred_by')
        .eq('referred_by', userProfile.referralCode || '')
        .not('id', 'in', 
          supabase.from('referrals').select('referred_id').eq('referrer_id', userProfile.id)
        );

      if (error) {
        console.error('Error finding pending referrals:', error);
        toast.error('Failed to find pending referrals');
        return;
      }
      
      // Process each pending referral manually
      let processedCount = 0;
      if (data && data.length > 0) {
        for (const user of data) {
          const { data: result, error: processError } = await supabase
            .rpc('process_referral_reward', {
              referrer_id: userProfile.id,
              referred_id: user.id
            });
            
          if (!processError && result) {
            processedCount++;
          }
        }
      }
      
      // Check the number of processed referrals
      if (processedCount > 0) {
        toast.success(`Successfully processed ${processedCount} pending referrals!`);
        
        // Refresh user profile to get updated points
        await fetchUserProfile();
        
        // Refresh referral stats
        await fetchReferralStats();
      } else {
        toast.info('No pending referrals to process');
      }
    } catch (error) {
      console.error('Error in processPendingReferrals:', error);
      toast.error('An error occurred while processing referrals');
    } finally {
      setIsProcessingReferral(false);
    }
  }, [userProfile, fetchUserProfile, fetchReferralStats]);

  return {
    generateReferralLink,
    checkAndProcessReferral,
    referralStats,
    fetchReferralStats,
    isLoadingReferrals,
    isProcessingReferral,
    processPendingReferrals
  };
};
