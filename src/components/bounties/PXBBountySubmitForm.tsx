
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWallet } from '@solana/wallet-adapter-react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface PXBBountySubmitFormProps {
  bountyId: string;
  onSubmitted: (submission: any) => void;
  onCancel: () => void;
}

export function PXBBountySubmitForm({ bountyId, onSubmitted, onCancel }: PXBBountySubmitFormProps) {
  const [proofLink, setProofLink] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { connected } = useWallet();
  const { userProfile } = usePXBPoints();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connected || !userProfile) {
      toast.error('You must connect your wallet to submit for bounties');
      return;
    }
    
    if (!proofLink) {
      toast.error('Please provide a proof link');
      return;
    }
    
    // Validate URL
    try {
      new URL(proofLink);
    } catch (e) {
      toast.error('Please enter a valid URL for the proof link');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase
        .from('submissions')
        .insert({
          bounty_id: bountyId,
          submitter_id: userProfile.id,
          proof_link: proofLink,
          description: description || 'Task completed',
          status: 'pending'
        })
        .select()
        .single();
      
      if (error) throw error;
      
      onSubmitted(data);
    } catch (error) {
      console.error('Error submitting bounty:', error);
      toast.error('Failed to submit proof');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="proof-link">Proof Link <span className="text-red-500">*</span></Label>
        <Input
          id="proof-link"
          type="url"
          placeholder="https://example.com/screenshot"
          value={proofLink}
          onChange={(e) => setProofLink(e.target.value)}
          required
        />
        <p className="text-xs text-gray-500">
          Provide a link to a screenshot, tweet, or other proof that you completed the task
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Briefly describe how you completed the task..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>
      
      <div className="flex justify-end gap-2">
        <Button 
          type="button" 
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button 
          type="submit"
          disabled={isSubmitting || !proofLink}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Proof'}
        </Button>
      </div>
    </form>
  );
}
