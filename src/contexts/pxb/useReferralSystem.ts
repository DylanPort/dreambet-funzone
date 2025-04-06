
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile, ReferralStats } from '@/types/pxb';
import { toast } from 'sonner';

export const useReferralSystem = (
  userProfile: UserProfile | null
) => {
  const [referralStats, setReferralStats] = useState<ReferralStats>({
    totalReferrals: 0,
    pointsEarned: 0
  });
  const [isLoadingReferrals, setIsLoadingReferrals] = useState(false);

  /**
   * Generate a referral link for the current user
   */
  const generateReferralLink = useCallback(async (): Promise<string> => {
    if (!userProfile || !userProfile.id) {
      toast.error('You need to be logged in to generate a referral link');
      return '';
    }

    try {
      // Check if user already has a referral code
      if (userProfile.referralCode) {
        return `${window.location.origin}/?ref=${userProfile.referralCode}`;
      }

      // If not, fetch the latest user data to ensure we have the referral code
      const { data, error } = await supabase
        .from('users')
        .select('referral_code')
        .eq('id', userProfile.id)
        .single();

      if (error) {
        console.error('Error fetching referral code:', error);
        return '';
      }

      if (data && data.referral_code) {
        return `${window.location.origin}/?ref=${data.referral_code}`;
      }

      // If still no referral code, generate one
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = '';
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Update user with new referral code
      const { error: updateError } = await supabase
        .from('users')
        .update({ referral_code: code })
        .eq('id', userProfile.id);

      if (updateError) {
        console.error('Error updating referral code:', updateError);
        return '';
      }

      return `${window.location.origin}/?ref=${code}`;
    } catch (error) {
      console.error('Error generating referral link:', error);
      return '';
    }
  }, [userProfile]);

  /**
   * Check and process a referral if valid
   */
  const checkAndProcessReferral = useCallback(async (referralCode: string): Promise<boolean> => {
    if (!userProfile || !userProfile.id) {
      console.error('User must be logged in to process referrals');
      return false;
    }

    if (!referralCode) {
      console.error('No referral code provided');
      return false;
    }

    try {
      // Check if this is the user's own referral code
      if (userProfile.referralCode === referralCode) {
        console.log('Cannot use your own referral code');
        return false;
      }

      // Check if user was already referred
      if (userProfile.walletAddress) {
        const { data: existingUser, error: existingUserError } = await supabase
          .from('users')
          .select('referred_by')
          .eq('id', userProfile.id)
          .single();

        if (!existingUserError && existingUser && existingUser.referred_by) {
          console.log('User was already referred');
          return false;
        }
      }

      // Find the referrer
      const { data: referrer, error: referrerError } = await supabase
        .from('users')
        .select('id, username')
        .eq('referral_code', referralCode)
        .single();

      if (referrerError || !referrer) {
        console.error('Invalid referral code or referrer not found');
        return false;
      }

      // Update user with referral info
      const { error: updateError } = await supabase
        .from('users')
        .update({ referred_by: referralCode })
        .eq('id', userProfile.id);

      if (updateError) {
        console.error('Error updating user with referral:', updateError);
        return false;
      }

      // Call process_referral_reward function
      const { data: processResult, error: processError } = await supabase
        .rpc('process_referral_reward', {
          referrer_id: referrer.id, 
          referred_id: userProfile.id
        });

      if (processError) {
        console.error('Error processing referral reward:', processError);
        return false;
      }

      if (processResult) {
        toast.success(`You have been successfully referred by ${referrer.username}`);
        return true;
      } else {
        console.log('Referral was already processed or other issue occurred');
        return false;
      }
    } catch (error) {
      console.error('Error processing referral:', error);
      return false;
    }
  }, [userProfile]);

  /**
   * Fetch referral statistics for the current user
   */
  const fetchReferralStats = useCallback(async () => {
    if (!userProfile || !userProfile.id) {
      return;
    }

    setIsLoadingReferrals(true);
    try {
      // Get count of referrals
      const { count: referralsCount, error: countError } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .eq('referrer_id', userProfile.id);

      if (countError) {
        console.error('Error fetching referral count:', countError);
        return;
      }

      // Get sum of points earned from referrals
      const { data: pointsData, error: pointsError } = await supabase
        .from('referrals')
        .select('points_awarded')
        .eq('referrer_id', userProfile.id);

      if (pointsError) {
        console.error('Error fetching referral points:', pointsError);
        return;
      }

      const pointsEarned = pointsData.reduce((sum, item) => sum + (item.points_awarded || 0), 0);

      setReferralStats({
        totalReferrals: referralsCount || 0,
        pointsEarned: pointsEarned
      });
    } catch (error) {
      console.error('Error fetching referral stats:', error);
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
