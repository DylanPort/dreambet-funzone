
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Globe, MessageSquare, Twitter, Calendar, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/pxb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface PXBCreateBountyFormProps {
  userProfile: UserProfile | null;
}

const PXBCreateBountyForm: React.FC<PXBCreateBountyFormProps> = ({ userProfile }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requiredProof: 'screenshot',
    projectName: '',
    projectUrl: '',
    telegramUrl: '',
    twitterUrl: '',
    projectLogo: '',
    pxbReward: 100,
    durationDays: 7,
    taskType: 'website_visit'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePxbRewardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setFormData(prev => ({ ...prev, pxbReward: value }));
    }
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setFormData(prev => ({ ...prev, durationDays: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userProfile) {
      toast.error('You need to be signed in to create a bounty');
      return;
    }
    
    // Validate form
    if (!formData.title || !formData.description || !formData.projectName) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    
    try {
      // Calculate end date (current date + duration in days)
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + formData.durationDays);
      
      const { data, error } = await supabase
        .from('bounties')
        .insert({
          title: formData.title,
          description: formData.description,
          required_proof: formData.requiredProof,
          project_name: formData.projectName,
          project_url: formData.projectUrl || null,
          telegram_url: formData.telegramUrl || null,
          twitter_url: formData.twitterUrl || null,
          project_logo: formData.projectLogo || null,
          pxb_reward: formData.pxbReward,
          creator_id: userProfile.id,
          budget: formData.pxbReward, // Initial budget equals the reward
          end_date: endDate.toISOString(),
          task_type: formData.taskType,
          views: 0, // Initialize with zero views
          status: 'open'
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      toast.success('Bounty created successfully!');
      navigate(`/bounties/${data.id}`);
    } catch (error) {
      console.error('Error creating bounty:', error);
      toast.error('Failed to create bounty. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6 md:col-span-2">
          <h2 className="text-xl font-semibold text-dream-foreground flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-400" />
            Bounty Details
          </h2>
          
          <div className="space-y-3">
            <Label htmlFor="title">Bounty Title <span className="text-red-500">*</span></Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Visit our website and explore features"
              className="bg-dream-background/70"
              required
            />
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe what users need to do to earn the bounty reward..."
              className="bg-dream-background/70 min-h-[100px]"
              required
            />
          </div>
        </div>
        
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-dream-foreground flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-400" />
            Project Information
          </h2>
          
          <div className="space-y-3">
            <Label htmlFor="projectName">Project Name <span className="text-red-500">*</span></Label>
            <Input
              id="projectName"
              name="projectName"
              value={formData.projectName}
              onChange={handleChange}
              placeholder="Your project name"
              className="bg-dream-background/70"
              required
            />
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="projectUrl">Website URL</Label>
            <Input
              id="projectUrl"
              name="projectUrl"
              value={formData.projectUrl}
              onChange={handleChange}
              placeholder="https://yourproject.com"
              className="bg-dream-background/70"
            />
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="telegramUrl">Telegram URL</Label>
            <Input
              id="telegramUrl"
              name="telegramUrl"
              value={formData.telegramUrl}
              onChange={handleChange}
              placeholder="https://t.me/yourproject"
              className="bg-dream-background/70"
            />
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="twitterUrl">Twitter URL</Label>
            <Input
              id="twitterUrl"
              name="twitterUrl"
              value={formData.twitterUrl}
              onChange={handleChange}
              placeholder="https://twitter.com/yourproject"
              className="bg-dream-background/70"
            />
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="projectLogo">Project Logo URL (optional)</Label>
            <Input
              id="projectLogo"
              name="projectLogo"
              value={formData.projectLogo}
              onChange={handleChange}
              placeholder="https://example.com/logo.png"
              className="bg-dream-background/70"
            />
          </div>
        </div>
        
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-dream-foreground flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-400" />
            Bounty Settings
          </h2>
          
          <div className="space-y-3">
            <Label htmlFor="taskType">Task Type</Label>
            <Select
              defaultValue={formData.taskType}
              onValueChange={(value) => handleSelectChange('taskType', value)}
            >
              <SelectTrigger className="w-full bg-dream-background/70">
                <SelectValue placeholder="Select task type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="website_visit">Visit Website</SelectItem>
                <SelectItem value="telegram_join">Join Telegram</SelectItem>
                <SelectItem value="twitter_follow">Follow Twitter</SelectItem>
                <SelectItem value="multiple">Multiple Tasks</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="requiredProof">Required Proof</Label>
            <Select
              defaultValue={formData.requiredProof}
              onValueChange={(value) => handleSelectChange('requiredProof', value)}
            >
              <SelectTrigger className="w-full bg-dream-background/70">
                <SelectValue placeholder="Select proof type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="screenshot">Screenshot</SelectItem>
                <SelectItem value="wallet_address">Wallet Address</SelectItem>
                <SelectItem value="social_handle">Social Media Handle</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="pxbReward">PXB Points Reward</Label>
            <div className="flex items-center">
              <img 
                src="/lovable-uploads/be886d35-fbcb-4675-926c-38691ad3e311.png" 
                alt="PXB Coin" 
                className="w-6 h-6 mr-2" 
              />
              <Input
                id="pxbReward"
                name="pxbReward"
                type="number"
                min="1"
                value={formData.pxbReward}
                onChange={handlePxbRewardChange}
                className="bg-dream-background/70"
              />
            </div>
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="durationDays">Duration (Days)</Label>
            <div className="flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-dream-foreground/50" />
              <Input
                id="durationDays"
                name="durationDays"
                type="number"
                min="1"
                max="30"
                value={formData.durationDays}
                onChange={handleDurationChange}
                className="bg-dream-background/70"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-10 flex justify-end">
        <Button 
          type="submit" 
          disabled={loading}
          className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 px-8"
        >
          {loading ? (
            <>Creating...</>
          ) : (
            <>
              <Award className="h-4 w-4" />
              Create Bounty
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default PXBCreateBountyForm;
