
import { useState, useCallback } from 'react';
import { ReferralStats, UserProfile } from '@/types/pxb';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

export const useReferralSystem = (
  userProfile: UserProfile | null,
  fetchUserProfile: () => Promise<void>
) => {
  const [referralStats, setReferralStats] = useState<ReferralStats>({
    totalReferrals: 0,
    activeReferrals: 0,
    pointsEarned: 0
  });
  const [isLoadingReferrals, setIsLoadingReferrals] = useState(false);

  const fetchReferralStats = useCallback(async () => {
    if (!userProfile) return;

    setIsLoadingReferrals(true);
    try {
      // Get total referrals count
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select('id, points_awarded, status')
        .eq('referrer_id', userProfile.id);

      if (referralsError) {
        console.error('Error fetching referrals:', referralsError);
        return;
      }

      if (referralsData) {
        const activeReferrals = referralsData.filter(ref => ref.status === 'completed').length;
        const totalPoints = referralsData.reduce((sum, ref) => sum + (ref.points_awarded || 0), 0);

        setReferralStats({
          totalReferrals: referralsData.length,
          activeReferrals,
          pointsEarned: totalPoints
        });
      }
    } catch (error) {
      console.error('Error in fetchReferralStats:', error);
    } finally {
      setIsLoadingReferrals(false);
    }
  }, [userProfile]);

  const generateReferralLink = useCallback(async (): Promise<string> => {
    if (!userProfile) {
      toast.error('Please connect your wallet first');
      return '';
    }

    try {
      // Check if user already has a referral code
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('referral_code')
        .eq('id', userProfile.id)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        console.error('Error checking referral code:', userError);
        toast.error('Failed to generate referral link');
        return '';
      }

      let referralCode = userData?.referral_code;

      if (!referralCode) {
        // Generate a new referral code
        referralCode = `${userProfile.id.substring(0, 6)}-${uuidv4().substring(0, 6)}`.toLowerCase();

        // Save the referral code to the user's profile
        const { error: updateError } = await supabase
          .from('users')
          .update({ referral_code: referralCode })
          .eq('id', userProfile.id);

        if (updateError) {
          console.error('Error saving referral code:', updateError);
          toast.error('Failed to save referral code');
          return '';
        }
      }

      // Construct the full referral link (adjust the base URL as needed)
      const referralLink = `${window.location.origin}?ref=${referralCode}`;
      return referralLink;
    } catch (error) {
      console.error('Error generating referral link:', error);
      toast.error('Failed to generate referral link');
      return '';
    }
  }, [userProfile]);

  const checkAndProcessReferral = useCallback(async (referralCode: string): Promise<boolean> => {
    if (!userProfile) {
      toast.error('Please connect your wallet first');
      return false;
    }

    try {
      // Check if the referral code exists and belongs to another user
      const { data: referrerData, error: referrerError } = await supabase
        .from('users')
        .select('id, username')
        .eq('referral_code', referralCode)
        .neq('id', userProfile.id)
        .single();

      if (referrerError || !referrerData) {
        console.error('Invalid referral code or error:', referrerError);
        toast.error('Invalid referral code');
        return false;
      }

      // Check if the user has already been referred
      const { data: existingReferral, error: existingError } = await supabase
        .from('referrals')
        .select('id')
        .eq('referred_id', userProfile.id)
        .single();

      if (existingReferral) {
        toast.error('You have already used a referral code');
        return false;
      }

      // Create a new referral record
      const referralPoints = 10000;
      const { error: createReferralError } = await supabase
        .from('referrals')
        .insert({
          referrer_id: referrerData.id,
          referred_id: userProfile.id,
          points_awarded: referralPoints,
          status: 'completed'
        });

      if (createReferralError) {
        console.error('Error creating referral:', createReferralError);
        toast.error('Failed to process referral');
        return false;
      }

      // Update the referred_by field for the user
      const { error: updateUserError } = await supabase
        .from('users')
        .update({ referred_by: referrerData.id })
        .eq('id', userProfile.id);

      if (updateUserError) {
        console.error('Error updating user referred_by:', updateUserError);
      }

      // Award points to the referrer
      const { data: referrerProfile, error: referrerProfileError } = await supabase
        .from('users')
        .select('points')
        .eq('id', referrerData.id)
        .single();

      if (!referrerProfileError && referrerProfile) {
        const newPoints = (referrerProfile.points || 0) + referralPoints;
        await supabase
          .from('users')
          .update({ points: newPoints })
          .eq('id', referrerData.id);

        // Record the points transaction
        await supabase
          .from('points_history')
          .insert({
            user_id: referrerData.id,
            amount: referralPoints,
            action: 'referral_bonus',
            reference_id: userProfile.id
          });
      }

      // Refresh user profile to get updated points
      await fetchUserProfile();

      toast.success(`Referral successful! ${referrerData.username || 'User'} received ${referralPoints} PXB!`);
      return true;
    } catch (error) {
      console.error('Error processing referral:', error);
      toast.error('Failed to process referral');
      return false;
    }
  }, [userProfile, fetchUserProfile]);

  return {
    generateReferralLink,
    checkAndProcessReferral,
    referralStats,
    fetchReferralStats,
    isLoadingReferrals
  };
};
