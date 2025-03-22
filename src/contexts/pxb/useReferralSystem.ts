import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile, ReferralStats, Referral } from '@/types/pxb';
import { toast } from 'sonner';

export const useReferralSystem = (
  userProfile: UserProfile | null,
  fetchUserProfile: () => Promise<void>
) => {
  const [referralStats, setReferralStats] = useState<ReferralStats>({
    totalReferrals: 0,
    totalPointsEarned: 0,
    referrals: [],
    referralCode: null
  });
  const [isLoadingReferrals, setIsLoadingReferrals] = useState(false);

  // Generate a referral link based on user's referral code
  const generateReferralLink = useCallback(async (): Promise<string> => {
    if (!userProfile) return Promise.resolve('');
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('referral_code')
        .eq('id', userProfile.id)
        .single();
        
      if (error) {
        console.error('Error fetching referral code:', error);
        return Promise.resolve('');
      }
      
      if (data && data.referral_code) {
        // Use pumpxbounty.fun domain for referrals
        return `https://pumpxbounty.fun?ref=${data.referral_code}`;
      }
      
      return Promise.resolve('');
    } catch (error) {
      console.error('Error in generateReferralLink:', error);
      return Promise.resolve('');
    }
  }, [userProfile]);

  // Check if a referral code is valid and process the referral
  const checkAndProcessReferral = useCallback(async (referralCode: string) => {
    if (!userProfile) {
      toast.error('Please connect your wallet to use referral links');
      return;
    }

    try {
      // First, check if user has already been referred
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('referred_by')
        .eq('id', userProfile.id)
        .single();
      
      if (userError) {
        console.error('Error checking if user was already referred:', userError);
        return;
      }
      
      // If user has already been referred, don't process again
      if (userData && userData.referred_by) {
        console.log('User was already referred, not processing again');
        return;
      }
      
      // Find the referrer by the referral code
      const { data: referrerData, error: referrerError } = await supabase
        .from('users')
        .select('id, referral_code')
        .eq('referral_code', referralCode)
        .single();
      
      if (referrerError || !referrerData) {
        console.error('Invalid referral code or error finding referrer:', referrerError);
        return;
      }
      
      // Don't allow self-referrals
      if (referrerData.id === userProfile.id) {
        toast.error("You can't refer yourself");
        return;
      }
      
      // Update the user to mark them as referred
      const { error: updateError } = await supabase
        .from('users')
        .update({ referred_by: referralCode })
        .eq('id', userProfile.id);
      
      if (updateError) {
        console.error('Error updating user with referral:', updateError);
        return;
      }
      
      // Call the database function to process the referral reward
      const { data: processResult, error: processError } = await supabase
        .rpc('process_referral_reward', {
          referrer_id: referrerData.id,
          referred_id: userProfile.id
        });
      
      if (processError) {
        console.error('Error processing referral reward:', processError);
        return;
      }
      
      if (processResult) {
        toast.success('Referral successfully processed! Your friend will receive 10,000 PXB points.');
        fetchUserProfile(); // Refresh user data
      } else {
        console.log('Referral was not processed, possibly already processed');
      }
    } catch (error) {
      console.error('Error in checkAndProcessReferral:', error);
    }
  }, [userProfile, fetchUserProfile]);

  // Fetch referral stats for the current user
  const fetchReferralStats = useCallback(async () => {
    if (!userProfile) return;
    
    setIsLoadingReferrals(true);
    try {
      // Get user's referral code
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('referral_code')
        .eq('id', userProfile.id)
        .single();
      
      if (userError) {
        console.error('Error fetching user referral code:', userError);
        return;
      }
      
      // Get referrals made by this user
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select(`
          id,
          points_awarded,
          created_at,
          referred_id,
          users!referred_id(username)
        `)
        .eq('referrer_id', userProfile.id)
        .order('created_at', { ascending: false });
      
      if (referralsError) {
        console.error('Error fetching referrals:', referralsError);
        return;
      }
      
      // Transform the data
      const referrals = referralsData.map(referral => ({
        id: referral.id,
        referredUsername: referral.users.username || 'Unknown User',
        pointsAwarded: referral.points_awarded,
        createdAt: referral.created_at
      }));
      
      const totalPointsEarned = referrals.reduce((sum, r) => sum + r.pointsAwarded, 0);
      
      setReferralStats({
        totalReferrals: referrals.length,
        totalPointsEarned,
        referrals,
        referralCode: userData?.referral_code || null
      });
    } catch (error) {
      console.error('Error in fetchReferralStats:', error);
    } finally {
      setIsLoadingReferrals(false);
    }
  }, [userProfile]);

  // Fetch referral stats when the user profile changes
  useEffect(() => {
    if (userProfile) {
      fetchReferralStats();
    }
  }, [userProfile, fetchReferralStats]);

  return {
    generateReferralLink,
    checkAndProcessReferral,
    referralStats,
    fetchReferralStats,
    isLoadingReferrals
  };
};
