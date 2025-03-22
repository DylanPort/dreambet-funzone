import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Award, ArrowLeft, Globe, MessageSquare, Twitter, ExternalLink, Calendar, Clock, User, Check, X, AlertTriangle, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import PXBBountySubmissionForm from '@/components/PXBBountySubmissionForm';

type Bounty = {
  id: string;
  title: string;
  description: string;
  required_proof: string | null;
  project_name: string;
  project_url?: string;
  telegram_url?: string;
  twitter_url?: string;
  project_logo?: string;
  pxb_reward: number;
  created_at: string;
  end_date: string;
  status: 'open' | 'closed' | 'expired';
  views: number;
  creator_id: string;
  task_type: string;
  max_participants: number;
};

type Submission = {
  id: string;
  bounty_id: string;
  submitter_id: string;
  proof_link: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  pxb_earned?: number;
};

const PXBBountyDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userProfile } = usePXBPoints();
  const { connected } = useWallet();
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [userSubmission, setUserSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [formattedDate, setFormattedDate] = useState('');
  const [timeLeft, setTimeLeft] = useState('');
  const [activeTab, setActiveTab] = useState('details');
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    if (id) {
      fetchBounty(id);
      fetchSubmissions(id);
      
      const incrementViewCount = async () => {
        try {
          await supabase.rpc('increment_bounty_views', { bounty_id: id });
          console.log("View count incremented");
        } catch (error) {
          console.error("Error incrementing view count:", error);
        }
      };
      
      incrementViewCount();
    }
  }, [id, userProfile]);

  useEffect(() => {
    if (bounty) {
      const endDate = new Date(bounty.end_date);
      setFormattedDate(endDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }));
      
      const updateTimeLeft = () => {
        const now = new Date();
        const end = new Date(bounty.end_date);
        const diff = end.getTime() - now.getTime();
        
        if (diff <= 0) {
          setTimeLeft('Expired');
          return;
        }
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        if (days > 0) {
          setTimeLeft(`${days} day${days > 1 ? 's' : ''} ${hours} hour${hours > 1 ? 's' : ''}`);
        } else {
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeLeft(`${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes > 1 ? 's' : ''}`);
        }
      };
      
      updateTimeLeft();
      const interval = setInterval(updateTimeLeft, 60000);
      
      return () => clearInterval(interval);
    }
  }, [bounty]);

  const fetchBounty = async (bountyId: string) => {
    try {
      const { data, error } = await supabase
        .from('bounties')
        .select('*')
        .eq('id', bountyId)
        .single();
      
      if (error) {
        throw error;
      }
      
      const typedBounty: Bounty = {
        ...data,
        status: data.status as 'open' | 'closed' | 'expired'
      };
      
      setBounty(typedBounty);
      
      if (userProfile && data.creator_id === userProfile.id) {
        setIsCreator(true);
      } else {
        setIsCreator(false);
      }
    } catch (error) {
      console.error('Error fetching bounty:', error);
      toast.error('Failed to load bounty details');
      navigate('/bounties');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async (bountyId: string) => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('bounty_id', bountyId)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      const typedSubmissions: Submission[] = data?.map(sub => ({
        ...sub,
        status: sub.status as 'pending' | 'approved' | 'rejected'
      })) || [];
      
      setSubmissions(typedSubmissions);
      
      if (userProfile) {
        const userSub = typedSubmissions.find(sub => sub.submitter_id === userProfile.id) || null;
        setUserSubmission(userSub);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  const handleApproveSubmission = async (submissionId: string) => {
    if (!bounty || !userProfile || !isCreator) {
      toast.error('You are not authorized to approve submissions');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('submissions')
        .update({ status: 'approved' })
        .eq('id', submissionId)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      toast.success('Submission approved! PXB points awarded to the user.');
      
      fetchSubmissions(bounty.id);
    } catch (error) {
      console.error('Error approving submission:', error);
      toast.error('Failed to approve submission');
    }
  };

  const handleRejectSubmission = async (submissionId: string) => {
    if (!bounty || !userProfile || !isCreator) {
      toast.error('You are not authorized to reject submissions');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('submissions')
        .update({ status: 'rejected' })
        .eq('id', submissionId)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      toast.success('Submission rejected');
      
      fetchSubmissions(bounty.id);
    } catch (error) {
      console.error('Error rejecting submission:', error);
      toast.error('Failed to reject submission');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8 mt-10">
        <div className="animate-pulse">
          <div className="h-8 bg-dream-background/30 w-40 mb-4 rounded"></div>
          <div className="h-12 bg-dream-background/30 w-3/4 mb-6 rounded"></div>
          <div className="h-64 bg-dream-background/20 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!bounty) {
    return (
      <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8 mt-10 text-center">
        <h1 className="text-3xl font-bold text-dream-foreground mb-4">Bounty Not Found</h1>
        <p className="text-dream-foreground/70 mb-6">The bounty you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => navigate('/bounties')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Bounties
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8 mt-10">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => navigate('/bounties')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Bounties
      </Button>
      
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-2/3">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              {bounty?.status === 'open' ? (
                <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                  Active
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20">
                  {bounty?.status === 'expired' ? 'Expired' : 'Closed'}
                </Badge>
              )}
              
              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                {bounty?.task_type === 'website_visit' ? 'Visit Website' : 
                 bounty?.task_type === 'telegram_join' ? 'Join Telegram' :
                 bounty?.task_type === 'twitter_follow' ? 'Follow Twitter' : 'Multiple Tasks'}
              </Badge>
              
              <span className="text-dream-foreground/50 text-sm flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {bounty?.views} views
              </span>
            </div>
            
            <h1 className="text-3xl font-bold text-dream-foreground mb-3">{bounty?.title}</h1>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center">
                {bounty?.project_logo ? (
                  <img 
                    src={bounty.project_logo} 
                    alt={bounty.project_name} 
                    className="w-6 h-6 rounded-full object-cover mr-2"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-indigo-600/20 flex items-center justify-center mr-2">
                    <Globe className="h-3 w-3 text-indigo-400" />
                  </div>
                )}
                <span className="font-medium">{bounty?.project_name}</span>
              </div>
              
              <span className="text-dream-foreground/50">|</span>
              
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-dream-foreground/50" />
                <span className="text-sm text-dream-foreground/70">Expires: {formattedDate}</span>
              </div>
              
              <span className="text-dream-foreground/50">|</span>
              
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-dream-foreground/50" />
                <span className="text-sm text-dream-foreground/70">Time left: {timeLeft}</span>
              </div>
            </div>
          </div>
          
          <Tabs defaultValue="details" className="w-full" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-dream-background/50 mb-6">
              <TabsTrigger value="details">Bounty Details</TabsTrigger>
              {isCreator && <TabsTrigger value="submissions">Submissions {submissions.length > 0 && `(${submissions.length})`}</TabsTrigger>}
              {!isCreator && userProfile && !userSubmission && <TabsTrigger value="submit">Submit Proof</TabsTrigger>}
            </TabsList>
            
            <TabsContent value="details" className="mt-0">
              <Card className="border-dream-border bg-dream-card/30">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-400" />
                    Bounty Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-dream-foreground/80 whitespace-pre-line mb-6">
                    {bounty?.description}
                  </p>
                  
                  <h3 className="font-medium text-lg mb-3">Required Proof</h3>
                  <p className="text-dream-foreground/80 mb-6">
                    {bounty?.required_proof === 'screenshot' ? 
                      'Submit a screenshot showing you completed the task.' :
                     bounty?.required_proof === 'wallet_address' ?
                      'Provide your wallet address used to interact with the project.' :
                      'Share your social media handle/username that followed or joined.'
                    }
                  </p>
                  
                  <h3 className="font-medium text-lg mb-3">Project Links</h3>
                  <div className="space-y-3">
                    {bounty?.project_url && (
                      <a 
                        href={bounty.project_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <Globe className="h-4 w-4" />
                        <span>{bounty.project_url}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    
                    {bounty?.telegram_url && (
                      <a 
                        href={bounty.telegram_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span>Telegram Group</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    
                    {bounty?.twitter_url && (
                      <a 
                        href={bounty.twitter_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <Twitter className="h-4 w-4" />
                        <span>Twitter Profile</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {isCreator && (
              <TabsContent value="submissions" className="mt-0">
                <Card className="border-dream-border bg-dream-card/30">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-400" />
                      User Submissions
                    </CardTitle>
                    <CardDescription>
                      Review and approve submissions from users who completed your bounty.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {submissions.length === 0 ? (
                      <div className="text-center py-10 border border-dashed border-dream-border rounded-lg">
                        <Award className="h-12 w-12 mx-auto text-dream-foreground/30 mb-3" />
                        <h3 className="text-xl font-medium text-dream-foreground mb-2">No submissions yet</h3>
                        <p className="text-dream-foreground/70">
                          When users submit their proof of completion, they'll appear here.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {submissions.map((submission) => (
                          <div key={submission.id} className="border border-dream-border rounded-lg p-4 bg-dream-background/20">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <User className="h-4 w-4 text-dream-foreground/70" />
                                  <span className="font-medium">User #{submission.submitter_id.substring(0, 8)}</span>
                                </div>
                                <div className="text-xs text-dream-foreground/50">
                                  Submitted: {new Date(submission.created_at).toLocaleString()}
                                </div>
                              </div>
                              <div>
                                {submission.status === 'pending' ? (
                                  <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                                    Pending Review
                                  </Badge>
                                ) : submission.status === 'approved' ? (
                                  <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                                    Approved
                                  </Badge>
                                ) : (
                                  <Badge className="bg-red-500/10 text-red-400 border-red-500/20">
                                    Rejected
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="mb-3">
                              <h4 className="font-medium mb-1">Description:</h4>
                              <p className="text-dream-foreground/80">{submission.description}</p>
                            </div>
                            
                            <div className="mb-4">
                              <h4 className="font-medium mb-1">Proof:</h4>
                              <a 
                                href={submission.proof_link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm"
                              >
                                <ExternalLink className="h-3 w-3" />
                                {submission.proof_link}
                              </a>
                            </div>
                            
                            {submission.status === 'pending' && (
                              <div className="flex gap-3">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="border-green-500/20 text-green-400 hover:bg-green-500/10"
                                  onClick={() => handleApproveSubmission(submission.id)}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                                  onClick={() => handleRejectSubmission(submission.id)}
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
            
            {!isCreator && userProfile && !userSubmission && (
              <TabsContent value="submit" className="mt-0">
                <Card className="border-dream-border bg-dream-card/30">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-400" />
                      Submit Proof
                    </CardTitle>
                    <CardDescription>
                      Submit proof that you completed the bounty tasks to earn PXB points.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {bounty && (
                      <PXBBountySubmissionForm 
                        bounty={bounty} 
                        userProfile={userProfile}
                        onSubmissionComplete={() => {
                          fetchSubmissions(bounty.id);
                          setActiveTab('details');
                        }}
                      />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
        
        <div className="w-full md:w-1/3">
          <Card className="border-dream-border bg-dream-card/30 sticky top-24">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-400" />
                Bounty Reward
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center mb-6">
                <img 
                  src="/lovable-uploads/be886d35-fbcb-4675-926c-38691ad3e311.png" 
                  alt="PXB Coin" 
                  className="w-10 h-10 mr-3" 
                />
                <div className="text-3xl font-bold text-yellow-400">{bounty?.pxb_reward} PXB</div>
              </div>
              
              {userSubmission ? (
                <div className="space-y-4">
                  <div className={`p-3 rounded-lg border ${
                    userSubmission.status === 'pending' ? 'bg-yellow-500/10 border-yellow-500/20' : 
                    userSubmission.status === 'approved' ? 'bg-green-500/10 border-green-500/20' :
                    'bg-red-500/10 border-red-500/20'
                  }`}>
                    {userSubmission.status === 'pending' ? (
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-yellow-400" />
                        <div>
                          <div className="font-medium text-yellow-400">Submission Pending</div>
                          <div className="text-sm text-dream-foreground/70">Your submission is being reviewed.</div>
                        </div>
                      </div>
                    ) : userSubmission.status === 'approved' ? (
                      <div className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-400" />
                        <div>
                          <div className="font-medium text-green-400">Submission Approved</div>
                          <div className="text-sm text-dream-foreground/70">You earned {bounty?.pxb_reward} PXB points!</div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <X className="h-5 w-5 text-red-400" />
                        <div>
                          <div className="font-medium text-red-400">Submission Rejected</div>
                          <div className="text-sm text-dream-foreground/70">Your submission was not approved.</div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center">
                    <Link to="/bounties">
                      <Button variant="outline">View More Bounties</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  {!isCreator && bounty?.status === 'open' ? (
                    <div className="space-y-4">
                      <p className="text-dream-foreground/80">
                        Complete the tasks required in the bounty description and submit your proof to earn the reward.
                      </p>
                      
                      {!connected ? (
                        <Button className="w-full">Connect Wallet to Participate</Button>
                      ) : (
                        <Button 
                          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                          onClick={() => setActiveTab('submit')}
                        >
                          Complete & Submit
                        </Button>
                      )}
                    </div>
                  ) : isCreator ? (
                    <div className="space-y-4">
                      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <div className="flex items-center gap-2">
                          <Info className="h-5 w-5 text-blue-400" />
                          <div>
                            <div className="font-medium text-blue-400">You Created This Bounty</div>
                            <div className="text-sm text-dream-foreground/70">
                              {submissions.length === 0 
                                ? "You'll see submissions here when users complete your bounty."
                                : `You have ${submissions.length} submission${submissions.length > 1 ? 's' : ''} to review.`
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {submissions.length > 0 && (
                        <Button 
                          className="w-full"
                          onClick={() => setActiveTab('submissions')}
                        >
                          Review Submissions
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-red-400" />
                          <div>
                            <div className="font-medium text-red-400">Bounty {bounty?.status.charAt(0).toUpperCase() + bounty?.status.slice(1)}</div>
                            <div className="text-sm text-dream-foreground/70">
                              This bounty is no longer accepting submissions.
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <Link to="/bounties">
                          <Button variant="outline">View Active Bounties</Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PXBBountyDetailPage;
