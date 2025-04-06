
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile, ReferralStats } from '@/types/pxb';
import { v4 as uuidv4 } from 'uuid';

export const useReferralSystem = (
  userProfile: UserProfile | null,
  fetchUserProfile: () => Promise<void>
) => {
  const [referralStats, setReferralStats] = useState<ReferralStats>({
    totalReferrals: 0,
    pointsEarned: 0
  });
  const [isLoadingReferrals, setIsLoadingReferrals] = useState(false);

  const generateReferralLink = useCallback(async (): Promise<string> => {
    if (!userProfile) return '';

    try {
      // Check if user already has a referral code
      if (userProfile.referralCode) {
        return `${window.location.origin}/?ref=${userProfile.referralCode}`;
      }

      // Generate a new referral code
      const referralCode = `${userProfile.username?.substring(0, 4) || 'pxb'}-${uuidv4().substring(0, 6)}`.toLowerCase();

      // Update user with referral code
      const { error } = await supabase
        .from('users')
        .update({ referral_code: referralCode })
        .eq('id', userProfile.id);

      if (error) {
        console.error('Error generating referral code:', error);
        return '';
      }

      // Update local user profile
      await fetchUserProfile();

      return `${window.location.origin}/?ref=${referralCode}`;
    } catch (error) {
      console.error('Error in generateReferralLink:', error);
      return '';
    }
  }, [userProfile, fetchUserProfile]);

  const checkAndProcessReferral = useCallback(async (referralCode: string): Promise<boolean> => {
    if (!userProfile || !referralCode) return false;

    try {
      setIsLoadingReferrals(true);

      // Don't allow self-referrals
      if (userProfile.referralCode === referralCode) {
        console.log('Cannot refer yourself');
        return false;
      }

      // Check if this user was already referred
      const { data: existingReferrals, error: referralCheckError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referred_id', userProfile.id);

      if (referralCheckError) {
        console.error('Error checking referral status:', referralCheckError);
        return false;
      }

      if (existingReferrals && existingReferrals.length > 0) {
        console.log('User already referred');
        return false;
      }

      // Find the referrer with this code
      const { data: referrerData, error: referrerError } = await supabase
        .from('users')
        .select('id, points')
        .eq('referral_code', referralCode)
        .single();

      if (referrerError || !referrerData) {
        console.error('Referrer not found:', referrerError);
        return false;
      }

      // Create the referral record
      const { error: createReferralError } = await supabase
        .from('referrals')
        .insert({
          referrer_id: referrerData.id,
          referred_id: userProfile.id,
          status: 'completed',
          points_awarded: 5000 // Bonus points for referral
        });

      if (createReferralError) {
        console.error('Error creating referral:', createReferralError);
        return false;
      }

      // Add points to referrer
      const newReferrerPoints = (referrerData.points || 0) + 5000;
      const { error: updateReferrerError } = await supabase
        .from('users')
        .update({ points: newReferrerPoints })
        .eq('id', referrerData.id);

      if (updateReferrerError) {
        console.error('Error updating referrer points:', updateReferrerError);
        return false;
      }

      // Record points history for referrer
      await supabase.from('points_history').insert({
        user_id: referrerData.id,
        amount: 5000,
        action: 'referral_bonus',
        reference_id: userProfile.id
      });

      // Add points to referred user (the current user)
      const newUserPoints = userProfile.pxbPoints + 5000;
      const { error: updateUserError } = await supabase
        .from('users')
        .update({ points: newUserPoints, referred_by: referralCode })
        .eq('id', userProfile.id);

      if (updateUserError) {
        console.error('Error updating user points:', updateUserError);
        return false;
      }

      // Record points history for referred user
      await supabase.from('points_history').insert({
        user_id: userProfile.id,
        amount: 5000,
        action: 'referred_bonus',
        reference_id: referrerData.id
      });

      // Update user profile
      await fetchUserProfile();

      setReferralStats({
        totalReferrals: referralStats.totalReferrals,
        pointsEarned: referralStats.pointsEarned + 5000
      });

      return true;
    } catch (error) {
      console.error('Error processing referral:', error);
      return false;
    } finally {
      setIsLoadingReferrals(false);
    }
  }, [userProfile, fetchUserProfile, referralStats]);

  const fetchReferralStats = useCallback(async () => {
    if (!userProfile) return;

    try {
      setIsLoadingReferrals(true);

      // Count referrals made by this user
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', userProfile.id);

      if (referralsError) {
        console.error('Error fetching referrals:', referralsError);
        return;
      }

      // Calculate points earned from referrals
      const pointsEarned = referralsData?.reduce((total, ref) => total + (ref.points_awarded || 0), 0) || 0;

      setReferralStats({
        totalReferrals: referralsData?.length || 0,
        pointsEarned: pointsEarned
      });
    } catch (error) {
      console.error('Error in fetchReferralStats:', error);
    } finally {
      setIsLoadingReferrals(false);
    }
  }, [userProfile]);

  return {
    generateReferralLink,
    checkAndProcessReferral,
    referralStats,
    fetchReferralStats,
    isLoadingReferrals
  };
};
