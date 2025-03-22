import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useWallet } from '@solana/wallet-adapter-react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { 
  Card, CardContent, CardDescription, CardFooter, 
  CardHeader, CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ExternalLink, MessageCircle, ArrowLeft, Coins, 
  Calendar, CheckCircle2, Clock, User, Link, Send
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { PXBBountySubmitForm } from './PXBBountySubmitForm';
import { Skeleton } from '@/components/ui/skeleton';

interface Bounty {
  id: string;
  project_name: string;
  project_description: string;
  project_logo: string;
  task_type: string;
  pxb_reward: number;
  project_url: string;
  telegram_url: string;
  twitter_url: string;
  status: string;
  created_at: string;
  creator_id: string;
}

interface Submission {
  id: string;
  bounty_id: string;
  submitter_id: string;
  proof_link: string;
  description: string;
  status: string;
  created_at: string;
  pxb_earned?: number;
}

export function PXBBountyDetail() {
  const { id } = useParams<{ id: string }>();
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreator, setIsCreator] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const { connected, publicKey } = useWallet();
  const { userProfile } = usePXBPoints();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchBountyDetails();
    }
  }, [id, connected, userProfile]);

  const fetchBountyDetails = async () => {
    setIsLoading(true);
    if (!id) return;

    try {
      // Fetch bounty details
      const { data: bountyData, error: bountyError } = await supabase
        .from('bounties')
        .select('*')
        .eq('id', id)
        .single();

      if (bountyError) throw bountyError;
      
      setBounty(bountyData);
      
      // Check if current user is the creator
      if (userProfile && bountyData.creator_id === userProfile.id) {
        setIsCreator(true);
        
        // Fetch all submissions for this bounty if user is creator
        const { data: allSubmissions, error: submissionsError } = await supabase
          .from('submissions')
          .select('*')
          .eq('bounty_id', id)
          .order('created_at', { ascending: false });
          
        if (submissionsError) throw submissionsError;
        
        setSubmissions(allSubmissions || []);
      } 
      // Otherwise, check if the user has already submitted for this bounty
      else if (userProfile) {
        const { data: userSubmission, error: submissionError } = await supabase
          .from('submissions')
          .select('*')
          .eq('bounty_id', id)
          .eq('submitter_id', userProfile.id)
          .maybeSingle();
          
        if (submissionError && submissionError.code !== 'PGRST116') {
          throw submissionError;
        }
        
        if (userSubmission) {
          setSubmission(userSubmission);
        }
      }
    } catch (error) {
      console.error('Error fetching bounty details:', error);
      toast.error('Failed to load bounty details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveSubmission = async (submissionId: string) => {
    try {
      const { error } = await supabase
        .from('submissions')
        .update({ status: 'approved' })
        .eq('id', submissionId);
        
      if (error) throw error;
      
      toast.success('Submission approved and PXB points awarded!');
      
      // Refresh the submissions list
      fetchBountyDetails();
    } catch (error) {
      console.error('Error approving submission:', error);
      toast.error('Failed to approve submission');
    }
  };

  const handleRejectSubmission = async (submissionId: string) => {
    try {
      const { error } = await supabase
        .from('submissions')
        .update({ status: 'rejected' })
        .eq('id', submissionId);
        
      if (error) throw error;
      
      toast.success('Submission rejected');
      
      // Refresh the submissions list
      fetchBountyDetails();
    } catch (error) {
      console.error('Error rejecting submission:', error);
      toast.error('Failed to reject submission');
    }
  };

  const handleSubmissionCreated = (newSubmission: Submission) => {
    setSubmission(newSubmission);
    setShowSubmitForm(false);
    toast.success('Submission sent successfully!');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500">Rejected</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-amber-500">Pending</Badge>;
    }
  };

  const getTaskTypeLabel = (type: string) => {
    switch (type) {
      case 'website_visit': return 'Visit Website';
      case 'telegram_join': return 'Join Telegram';
      case 'twitter_follow': return 'Follow Twitter';
      case 'multiple': return 'Multiple Tasks';
      default: return type;
    }
  };

  const renderTaskButtons = () => {
    if (!bounty) return null;

    return (
      <div className="flex flex-col gap-3 mt-4">
        {bounty.project_url && (
          <Button className="w-full" variant="outline" onClick={() => window.open(bounty.project_url, '_blank')}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Visit Website
          </Button>
        )}
        {bounty.telegram_url && (
          <Button className="w-full" variant="outline" onClick={() => window.open(bounty.telegram_url, '_blank')}>
            <Send className="mr-2 h-4 w-4" />
            Join Telegram
          </Button>
        )}
        {bounty.twitter_url && (
          <Button className="w-full" variant="outline" onClick={() => window.open(bounty.twitter_url, '_blank')}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Follow Twitter
          </Button>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto p-4">
        <Skeleton className="h-8 w-40" />
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-64 mb-2" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-5 w-full mb-2" />
            <Skeleton className="h-5 w-full mb-2" />
            <Skeleton className="h-5 w-3/4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!bounty) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Button variant="outline" onClick={() => navigate('/bounties')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Bounties
        </Button>
        <Card className="mt-4 p-8 text-center">
          <p className="text-gray-500">Bounty not found or has been removed</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <Button variant="outline" onClick={() => navigate('/bounties')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Bounties
      </Button>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{bounty.project_name}</CardTitle>
              <CardDescription>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(bounty.created_at).toLocaleDateString()}</span>
                </div>
              </CardDescription>
            </div>
            <Badge className="bg-indigo-600">
              {getTaskTypeLabel(bounty.task_type)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-4">
            <Coins className="h-5 w-5 text-amber-500" />
            <span className="font-bold text-lg">{bounty.pxb_reward} PXB Points Reward</span>
          </div>

          <p className="text-gray-700 mb-4">
            {bounty.project_description || "Complete the required tasks to earn PXB points."}
          </p>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-4">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Required Tasks
            </h3>
            <ul className="space-y-2 text-sm">
              {bounty.project_url && (
                <li className="flex items-center gap-2">
                  <Link className="h-4 w-4 text-blue-500" />
                  Visit the project website
                </li>
              )}
              {bounty.telegram_url && (
                <li className="flex items-center gap-2">
                  <Send className="h-4 w-4 text-blue-500" />
                  Join the Telegram channel
                </li>
              )}
              {bounty.twitter_url && (
                <li className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-blue-500" />
                  Follow on Twitter
                </li>
              )}
            </ul>
          </div>

          {renderTaskButtons()}
        </CardContent>
        <CardFooter className="flex-col items-stretch">
          <Separator className="mb-4" />
          
          {isCreator ? (
            <div className="space-y-4">
              <h3 className="font-medium">Submissions ({submissions.length})</h3>
              {submissions.length === 0 ? (
                <p className="text-sm text-gray-500">No submissions yet.</p>
              ) : (
                <div className="space-y-3">
                  {submissions.map((sub) => (
                    <Card key={sub.id} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span className="text-sm font-medium">Submission {sub.id.substring(0, 8)}</span>
                        </div>
                        {getStatusBadge(sub.status)}
                      </div>
                      <p className="text-sm mb-2">{sub.description}</p>
                      <div className="mb-3">
                        <a 
                          href={sub.proof_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View Proof
                        </a>
                      </div>
                      {sub.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleApproveSubmission(sub.id)}
                          >
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleRejectSubmission(sub.id)}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                      {sub.status === 'approved' && sub.pxb_earned && (
                        <div className="flex items-center gap-2 text-green-600 text-sm">
                          <Coins className="h-4 w-4" />
                          <span>{sub.pxb_earned} PXB awarded</span>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              {!connected || !userProfile ? (
                <div className="text-center p-4">
                  <p className="mb-2">Connect your wallet to submit for this bounty</p>
                </div>
              ) : submission ? (
                <div className="space-y-3">
                  <h3 className="font-medium">Your Submission</h3>
                  <Card className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-medium">Submitted on {new Date(submission.created_at).toLocaleDateString()}</h4>
                      {getStatusBadge(submission.status)}
                    </div>
                    <p className="text-sm mb-2">{submission.description}</p>
                    {submission.status === 'approved' && submission.pxb_earned && (
                      <div className="flex items-center gap-2 text-green-600 text-sm mt-2">
                        <Coins className="h-4 w-4" />
                        <span>{submission.pxb_earned} PXB earned</span>
                      </div>
                    )}
                  </Card>
                </div>
              ) : showSubmitForm ? (
                <div className="space-y-3">
                  <h3 className="font-medium">Submit for Bounty</h3>
                  <PXBBountySubmitForm 
                    bountyId={bounty.id} 
                    onSubmitted={handleSubmissionCreated}
                    onCancel={() => setShowSubmitForm(false)}
                  />
                </div>
              ) : (
                <Button 
                  className="w-full" 
                  onClick={() => setShowSubmitForm(true)}
                  disabled={bounty.status !== 'open'}
                >
                  {bounty.status === 'open' ? 'Submit Proof' : 'Bounty Closed'}
                </Button>
              )}
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
