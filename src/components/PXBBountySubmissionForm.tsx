
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/pxb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ExternalLink } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Bounty {
  id: string;
  title: string;
  required_proof: string;
  task_type: string;
  project_url?: string;
  telegram_url?: string;
  twitter_url?: string;
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userProfile) {
      toast.error('You need to be signed in to submit proof');
      return;
    }
    
    // Validate form
    if (!formData.description || !formData.proofLink) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('submissions')
        .insert({
          bounty_id: bounty.id,
          submitter_id: userProfile.id,
          description: formData.description,
          proof_link: formData.proofLink,
          status: 'pending'
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
      
      <div className="mb-6">
        <h3 className="font-medium mb-2">Task to Complete:</h3>
        <div className="space-y-2">
          {bounty.task_type === 'website_visit' && bounty.project_url && (
            <a 
              href={bounty.project_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <span>Visit the project website</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
          
          {bounty.task_type === 'telegram_join' && bounty.telegram_url && (
            <a 
              href={bounty.telegram_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <span>Join the Telegram group</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
          
          {bounty.task_type === 'twitter_follow' && bounty.twitter_url && (
            <a 
              href={bounty.twitter_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <span>Follow on Twitter</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
          
          {bounty.task_type === 'multiple' && (
            <div className="space-y-2">
              {bounty.project_url && (
                <a 
                  href={bounty.project_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <span>Visit the project website</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              
              {bounty.telegram_url && (
                <a 
                  href={bounty.telegram_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <span>Join the Telegram group</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              
              {bounty.twitter_url && (
                <a 
                  href={bounty.twitter_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <span>Follow on Twitter</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
      
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
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Submitting...' : 'Submit Proof'}
        </Button>
      </form>
    </div>
  );
};

export default PXBBountySubmissionForm;
