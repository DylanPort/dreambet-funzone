
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/pxb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ExternalLink, Globe, MessageSquare, Twitter, Check } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Bounty {
  id: string;
  title: string;
  required_proof: string | null;
  task_type: string;
  project_url?: string;
  telegram_url?: string;
  twitter_url?: string;
  max_participants: number;
  pxb_reward: number;
}

interface PXBBountySubmissionFormProps {
  bounty: Bounty;
  userProfile: UserProfile;
  onSubmissionComplete: () => void;
}

const PXBBountySubmissionForm: React.FC<PXBBountySubmissionFormProps> = ({ 
  bounty, 
  userProfile,
  onSubmissionComplete
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    proofLink: ''
  });
  const [submissionCount, setSubmissionCount] = useState(0);
  const [autoSubmitted, setAutoSubmitted] = useState(false);

  useEffect(() => {
    // Check current number of submissions for this bounty
    const fetchSubmissionCount = async () => {
      const { count, error } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('bounty_id', bounty.id)
        .eq('status', 'approved');
      
      if (!error && count !== null) {
        setSubmissionCount(count);
      }
    };

    fetchSubmissionCount();
  }, [bounty.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLinkClick = async (url: string) => {
    // If no proof is required, automatically submit when user clicks on a link
    if (!bounty.required_proof && !autoSubmitted) {
      // Check if max participants has been reached
      if (submissionCount >= bounty.max_participants) {
        toast.error("This bounty has reached its maximum number of participants");
        return;
      }

      setLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('submissions')
          .insert({
            bounty_id: bounty.id,
            submitter_id: userProfile.id,
            description: "Automatically submitted after clicking link",
            proof_link: url,
            status: 'approved', // Auto-approve
            pxb_earned: Math.floor(bounty.pxb_reward / bounty.max_participants) // Divide points equally
          })
          .select()
          .single();
        
        if (error) {
          throw error;
        }
        
        // Set flag to prevent multiple auto-submissions
        setAutoSubmitted(true);
        
        toast.success('Congratulations! You earned PXB points for this bounty.');
        onSubmissionComplete();
      } catch (error) {
        console.error('Error auto-submitting:', error);
        toast.error('Failed to submit. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    // Open the URL in a new tab
    window.open(url, '_blank');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userProfile) {
      toast.error('You need to be signed in to submit proof');
      return;
    }
    
    // For manual submission, require both description and proof link
    if (bounty.required_proof && (!formData.description || !formData.proofLink)) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    // Check if max participants has been reached
    if (submissionCount >= bounty.max_participants) {
      toast.error("This bounty has reached its maximum number of participants");
      return;
    }
    
    setLoading(true);
    
    try {
      // Calculate individual reward (equal distribution)
      const individualReward = Math.floor(bounty.pxb_reward / bounty.max_participants);
      
      const { data, error } = await supabase
        .from('submissions')
        .insert({
          bounty_id: bounty.id,
          submitter_id: userProfile.id,
          description: formData.description,
          proof_link: formData.proofLink,
          status: 'pending',
          // Don't set pxb_earned yet, it will be set when approved
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      toast.success('Submission sent successfully! The bounty creator will review your proof.');
      onSubmissionComplete();
    } catch (error) {
      console.error('Error submitting proof:', error);
      toast.error('Failed to submit proof. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {bounty.required_proof ? (
        <Alert className="mb-6 bg-blue-950/20 border-blue-500/20">
          <AlertTitle className="text-blue-400">Submission Guidelines</AlertTitle>
          <AlertDescription className="text-dream-foreground/80">
            {bounty.required_proof === 'screenshot' ? (
              <>Upload a screenshot to an image hosting service like Imgur and paste the link below.</>
            ) : bounty.required_proof === 'wallet_address' ? (
              <>Provide your wallet address and details of your interaction with the project.</>
            ) : (
              <>Share your social media handle/username and details about your follow/join action.</>
            )}
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="mb-6 bg-green-950/20 border-green-500/20">
          <AlertTitle className="text-green-400">Easy Reward</AlertTitle>
          <AlertDescription className="text-dream-foreground/80">
            Simply click on the link below to earn your reward. No proof submission needed!
          </AlertDescription>
        </Alert>
      )}
      
      <div className="mb-6">
        <h3 className="font-medium mb-2">Task to Complete:</h3>
        <div className="space-y-2">
          {bounty.task_type === 'website_visit' && bounty.project_url && (
            <button 
              onClick={() => handleLinkClick(bounty.project_url as string)} 
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <Globe className="h-4 w-4" />
              <span>Visit the project website</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          )}
          
          {bounty.task_type === 'telegram_join' && bounty.telegram_url && (
            <button 
              onClick={() => handleLinkClick(bounty.telegram_url as string)} 
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Join the Telegram group</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          )}
          
          {bounty.task_type === 'twitter_follow' && bounty.twitter_url && (
            <button 
              onClick={() => handleLinkClick(bounty.twitter_url as string)} 
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <Twitter className="h-4 w-4" />
              <span>Follow on Twitter</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          )}
          
          {bounty.task_type === 'multiple' && (
            <div className="space-y-2">
              {bounty.project_url && (
                <button 
                  onClick={() => handleLinkClick(bounty.project_url as string)} 
                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Globe className="h-4 w-4" />
                  <span>Visit the project website</span>
                  <ExternalLink className="h-3 w-3" />
                </button>
              )}
              
              {bounty.telegram_url && (
                <button 
                  onClick={() => handleLinkClick(bounty.telegram_url as string)} 
                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Join the Telegram group</span>
                  <ExternalLink className="h-3 w-3" />
                </button>
              )}
              
              {bounty.twitter_url && (
                <button 
                  onClick={() => handleLinkClick(bounty.twitter_url as string)} 
                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Twitter className="h-4 w-4" />
                  <span>Follow on Twitter</span>
                  <ExternalLink className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      {bounty.required_proof && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="description">Describe how you completed the task <span className="text-red-500">*</span></Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="I visited the website and explored the features. I also joined the Telegram group with username @example..."
              className="bg-dream-background/70 min-h-[100px]"
              required
            />
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="proofLink">
              Proof Link <span className="text-red-500">*</span>
              <span className="text-dream-foreground/50 ml-1 text-xs">
                (Screenshot URL, social media profile, or wallet address)
              </span>
            </Label>
            <Input
              id="proofLink"
              name="proofLink"
              value={formData.proofLink}
              onChange={handleChange}
              placeholder="https://imgur.com/example or wallet address or @username"
              className="bg-dream-background/70"
              required
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={loading || autoSubmitted}
            className="w-full"
          >
            {loading ? 'Submitting...' : 'Submit Proof'}
          </Button>
        </form>
      )}
      
      {autoSubmitted && (
        <div className="mt-4 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-green-400">Reward Received!</h3>
              <p className="text-dream-foreground/80">
                You've earned {Math.floor(bounty.pxb_reward / bounty.max_participants)} PXB points for completing this bounty.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PXBBountySubmissionForm;
