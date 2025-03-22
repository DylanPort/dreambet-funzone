
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWallet } from '@solana/wallet-adapter-react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { useNavigate } from 'react-router-dom';
import { 
  Card, CardContent, CardDescription, CardFooter, 
  CardHeader, CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Coins } from 'lucide-react';

export function PXBCreateBountyForm() {
  const [taskType, setTaskType] = useState('website_visit');
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [pxbReward, setPxbReward] = useState(100);
  const [projectUrl, setProjectUrl] = useState('');
  const [telegramUrl, setTelegramUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const { connected } = useWallet();
  const { userProfile } = usePXBPoints();
  const navigate = useNavigate();

  const goToNextStep = () => {
    if (currentStep === 1) {
      if (!projectName) {
        toast.error('Project name is required');
        return;
      }
      if (pxbReward < 50) {
        toast.error('Minimum reward is 50 PXB points');
        return;
      }
    }
    setCurrentStep(currentStep + 1);
  };

  const goToPreviousStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Basic Information';
      case 2: return 'Task Details';
      case 3: return 'Review & Create';
      default: return '';
    }
  };

  const validateUrls = () => {
    // If task type is website_visit or multiple, project URL is required
    if ((taskType === 'website_visit' || taskType === 'multiple') && !projectUrl) {
      toast.error('Project URL is required');
      return false;
    }
    
    // If task type is telegram_join or multiple, telegram URL is required
    if ((taskType === 'telegram_join' || taskType === 'multiple') && !telegramUrl) {
      toast.error('Telegram URL is required');
      return false;
    }
    
    // If task type is twitter_follow or multiple, twitter URL is required
    if ((taskType === 'twitter_follow' || taskType === 'multiple') && !twitterUrl) {
      toast.error('Twitter URL is required');
      return false;
    }
    
    // Validate URLs format
    try {
      if (projectUrl) new URL(projectUrl);
      if (telegramUrl) new URL(telegramUrl);
      if (twitterUrl) new URL(twitterUrl);
    } catch (e) {
      toast.error('Please enter valid URLs');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connected || !userProfile) {
      toast.error('You must connect your wallet to create bounties');
      return;
    }
    
    if (!projectName) {
      toast.error('Project name is required');
      return;
    }
    
    if (pxbReward < 50) {
      toast.error('Minimum reward is 50 PXB points');
      return;
    }
    
    // Validate URLs based on task type
    if (!validateUrls()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase
        .from('bounties')
        .insert({
          project_name: projectName,
          project_description: projectDescription,
          task_type: taskType,
          pxb_reward: pxbReward,
          project_url: projectUrl || null,
          telegram_url: telegramUrl || null,
          twitter_url: twitterUrl || null,
          creator_id: userProfile.id,
          status: 'open',
          required_proof: 'screenshot'
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success('Bounty created successfully!');
      navigate(`/bounties/${data.id}`);
    } catch (error) {
      console.error('Error creating bounty:', error);
      toast.error('Failed to create bounty');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepOne = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="project-name">Project Name <span className="text-red-500">*</span></Label>
        <Input
          id="project-name"
          placeholder="Your project name"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="project-description">Project Description</Label>
        <Textarea
          id="project-description"
          placeholder="Brief description of your project..."
          value={projectDescription}
          onChange={(e) => setProjectDescription(e.target.value)}
          rows={3}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="pxb-reward">PXB Reward <span className="text-red-500">*</span></Label>
        <div className="flex items-center gap-2">
          <Input
            id="pxb-reward"
            type="number"
            min={50}
            step={10}
            value={pxbReward}
            onChange={(e) => setPxbReward(Number(e.target.value))}
            required
          />
          <span className="flex items-center gap-1">
            <Coins className="h-4 w-4 text-amber-500" />
            PXB
          </span>
        </div>
        <p className="text-xs text-gray-500">Minimum 50 PXB</p>
      </div>
    </div>
  );

  const renderStepTwo = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="task-type">Task Type <span className="text-red-500">*</span></Label>
        <Select
          value={taskType}
          onValueChange={(value) => setTaskType(value)}
        >
          <SelectTrigger id="task-type">
            <SelectValue placeholder="Select task type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="website_visit">Website Visit</SelectItem>
            <SelectItem value="telegram_join">Join Telegram</SelectItem>
            <SelectItem value="twitter_follow">Follow Twitter</SelectItem>
            <SelectItem value="multiple">Multiple Tasks</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {(taskType === 'website_visit' || taskType === 'multiple') && (
        <div className="space-y-2">
          <Label htmlFor="project-url">
            Project URL {(taskType === 'website_visit' || taskType === 'multiple') && <span className="text-red-500">*</span>}
          </Label>
          <Input
            id="project-url"
            type="url"
            placeholder="https://yourproject.com"
            value={projectUrl}
            onChange={(e) => setProjectUrl(e.target.value)}
            required={taskType === 'website_visit' || taskType === 'multiple'}
          />
        </div>
      )}
      
      {(taskType === 'telegram_join' || taskType === 'multiple') && (
        <div className="space-y-2">
          <Label htmlFor="telegram-url">
            Telegram URL {(taskType === 'telegram_join' || taskType === 'multiple') && <span className="text-red-500">*</span>}
          </Label>
          <Input
            id="telegram-url"
            type="url"
            placeholder="https://t.me/yourgroup"
            value={telegramUrl}
            onChange={(e) => setTelegramUrl(e.target.value)}
            required={taskType === 'telegram_join' || taskType === 'multiple'}
          />
        </div>
      )}
      
      {(taskType === 'twitter_follow' || taskType === 'multiple') && (
        <div className="space-y-2">
          <Label htmlFor="twitter-url">
            Twitter URL {(taskType === 'twitter_follow' || taskType === 'multiple') && <span className="text-red-500">*</span>}
          </Label>
          <Input
            id="twitter-url"
            type="url"
            placeholder="https://twitter.com/yourusername"
            value={twitterUrl}
            onChange={(e) => setTwitterUrl(e.target.value)}
            required={taskType === 'twitter_follow' || taskType === 'multiple'}
          />
        </div>
      )}
    </div>
  );

  const renderStepThree = () => (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
        <h3 className="font-medium mb-3">Bounty Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Project Name:</span>
            <span className="font-medium">{projectName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Task Type:</span>
            <span className="font-medium">
              {taskType === 'website_visit' ? 'Website Visit' : 
               taskType === 'telegram_join' ? 'Join Telegram' : 
               taskType === 'twitter_follow' ? 'Follow Twitter' : 'Multiple Tasks'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">PXB Reward:</span>
            <span className="font-medium">{pxbReward} PXB</span>
          </div>
          {projectUrl && (
            <div className="flex justify-between">
              <span className="text-gray-600">Project URL:</span>
              <span className="font-medium truncate max-w-[200px]">{projectUrl}</span>
            </div>
          )}
          {telegramUrl && (
            <div className="flex justify-between">
              <span className="text-gray-600">Telegram URL:</span>
              <span className="font-medium truncate max-w-[200px]">{telegramUrl}</span>
            </div>
          )}
          {twitterUrl && (
            <div className="flex justify-between">
              <span className="text-gray-600">Twitter URL:</span>
              <span className="font-medium truncate max-w-[200px]">{twitterUrl}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
        <p className="text-sm text-blue-700">
          By creating this bounty, you agree to reward users who complete the tasks and provide valid proof of completion.
        </p>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStepOne();
      case 2: return renderStepTwo();
      case 3: return renderStepThree();
      default: return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Create PXB Bounty</CardTitle>
          <CardDescription>
            Create a bounty to get users to visit your project website, join your Telegram, or follow your Twitter
          </CardDescription>
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Step {currentStep} of 3: {getStepTitle()}</span>
              <span>{Math.round((currentStep / 3) * 100)}%</span>
            </div>
            <Progress value={(currentStep / 3) * 100} />
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {renderCurrentStep()}
          </form>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          {currentStep > 1 ? (
            <Button type="button" variant="outline" onClick={goToPreviousStep} disabled={isSubmitting}>
              Back
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={() => navigate('/bounties')} disabled={isSubmitting}>
              Cancel
            </Button>
          )}
          
          {currentStep < 3 ? (
            <Button type="button" onClick={goToNextStep} disabled={isSubmitting}>
              Continue
            </Button>
          ) : (
            <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Bounty'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
