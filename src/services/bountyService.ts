
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

// Function to get a bounty by ID
export const getBountyById = async (bountyId: string): Promise<Bounty | null> => {
  try {
    const { data, error } = await supabase
      .from('bounties')
      .select('*')
      .eq('id', bountyId)
      .single();
    
    if (error) throw error;
    return data as Bounty;
  } catch (error) {
    console.error('Error fetching bounty:', error);
    return null;
  }
};

// Submit a bounty completion
export const submitBountyCompletion = async (
  bountyId: string,
  userId: string,
  description: string,
  proofLink: string
): Promise<boolean> => {
  try {
    // Check if user has already submitted for this bounty
    const hasSubmitted = await hasUserSubmitted(bountyId, userId);
    
    if (hasSubmitted) {
      return false;
    }
    
    // Check if bounty has reached max participants
    const { isFull } = await checkBountyParticipants(bountyId);
    
    if (isFull) {
      return false;
    }
    
    // Get bounty details
    const bounty = await getBountyById(bountyId);
    if (!bounty) return false;
    
    // Calculate individual reward
    const individualReward = Math.floor(bounty.pxb_reward / bounty.max_participants);
    
    // Submit the proof
    const { error } = await supabase
      .from('submissions')
      .insert({
        bounty_id: bountyId,
        submitter_id: userId,
        description: description,
        proof_link: proofLink,
        status: 'pending',
        pxb_earned: individualReward
      });
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error submitting bounty completion:', error);
    return false;
  }
};

// Function to track a bounty view
export const trackBountyView = async (bountyId: string): Promise<void> => {
  try {
    await supabase.rpc('increment_bounty_views', { bounty_id: bountyId });
  } catch (error) {
    console.error('Error tracking bounty view:', error);
  }
};

// Function to get submissions for a bounty
export const getBountySubmissions = async (bountyId: string) => {
  try {
    const { data, error } = await supabase
      .from('submissions')
      .select(`
        *,
        submitter:users(id, username)
      `)
      .eq('bounty_id', bountyId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching bounty submissions:', error);
    return [];
  }
};

// Function to approve a submission
export const approveSubmission = async (submissionId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('submissions')
      .update({ status: 'approved' })
      .eq('id', submissionId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error approving submission:', error);
    return false;
  }
};

// Function to reject a submission
export const rejectSubmission = async (submissionId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('submissions')
      .update({ status: 'rejected' })
      .eq('id', submissionId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error rejecting submission:', error);
    return false;
  }
};
