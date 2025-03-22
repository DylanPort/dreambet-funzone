
import { supabase } from "@/integrations/supabase/client";

// Interface for bounty data
export interface Bounty {
  id: string;
  title: string;
  description: string;
  required_proof: string | null;
  pxb_reward: number;
  max_participants: number;
  project_url?: string;
  telegram_url?: string;
  twitter_url?: string;
  task_type: string;
  creator_id: string;
  status: string;
  budget: number;
  end_date: string;
  views: number;
}

// Check if a bounty has reached maximum participants
export const checkBountyParticipants = async (bountyId: string): Promise<{
  isFull: boolean;
  currentCount: number;
  maxParticipants: number;
}> => {
  try {
    // Get the bounty to check max participants
    const { data: bounty, error: bountyError } = await supabase
      .from('bounties')
      .select('max_participants')
      .eq('id', bountyId)
      .single();
    
    if (bountyError) throw bountyError;
    
    // Get current approved submissions count
    const { count, error: countError } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('bounty_id', bountyId)
      .eq('status', 'approved');
    
    if (countError) throw countError;
    
    const currentCount = count || 0;
    const maxParticipants = bounty.max_participants;
    
    return {
      isFull: currentCount >= maxParticipants,
      currentCount,
      maxParticipants
    };
  } catch (error) {
    console.error('Error checking bounty participants:', error);
    throw error;
  }
};

// Auto-submit and approve a bounty for a user
export const autoSubmitBounty = async (
  bountyId: string, 
  userId: string,
  actionUrl: string
): Promise<boolean> => {
  try {
    // Check if user has already submitted for this bounty
    const { count: existingCount, error: existingError } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('bounty_id', bountyId)
      .eq('submitter_id', userId);
    
    if (existingError) throw existingError;
    
    if (existingCount && existingCount > 0) {
      console.log('User has already submitted for this bounty');
      return false;
    }
    
    // Check participants limit
    const { isFull, maxParticipants } = await checkBountyParticipants(bountyId);
    
    if (isFull) {
      console.log('Bounty has reached maximum participants');
      return false;
    }
    
    // Get bounty information for reward calculation
    const { data: bounty, error: bountyError } = await supabase
      .from('bounties')
      .select('pxb_reward, max_participants')
      .eq('id', bountyId)
      .single();
    
    if (bountyError) throw bountyError;
    
    // Calculate individual reward (equal distribution)
    const individualReward = Math.floor(bounty.pxb_reward / bounty.max_participants);
    
    // Insert the submission with auto-approval
    const { data, error } = await supabase
      .from('submissions')
      .insert({
        bounty_id: bountyId,
        submitter_id: userId,
        description: "Automatically submitted after clicking link",
        proof_link: actionUrl,
        status: 'approved',
        pxb_earned: individualReward
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error auto-submitting bounty:', error);
    return false;
  }
};

// Check if a user has already submitted to a specific bounty
export const hasUserSubmitted = async (bountyId: string, userId: string): Promise<boolean> => {
  try {
    const { count, error } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('bounty_id', bountyId)
      .eq('submitter_id', userId);
    
    if (error) throw error;
    
    return (count || 0) > 0;
  } catch (error) {
    console.error('Error checking user submission:', error);
    return false;
  }
};
