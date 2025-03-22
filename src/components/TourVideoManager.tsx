
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VideoUploader from './VideoUploader';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface TourVideoManagerProps {
  onClose?: () => void;
}

interface TourVideo {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
}

const defaultTourSteps = [
  { id: 'welcome', title: 'Welcome to PXB', description: 'Introduction to the PXB platform' },
  { id: 'points', title: 'Earning PXB Points', description: 'Learn how to earn and use PXB points' },
  { id: 'betting', title: 'Placing Bets', description: 'How to place bets with your PXB points' },
  { id: 'leaderboard', title: 'Leaderboard', description: 'Compete with others on the leaderboard' },
];

const TourVideoManager: React.FC<TourVideoManagerProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('welcome');
  const [videos, setVideos] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Fetch existing videos from Supabase
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setIsLoading(true);
        
        // List all files in the tourvideo bucket
        const { data: files, error } = await supabase.storage
          .from('tourvideo')
          .list();
        
        if (error) {
          throw error;
        }
        
        // Get public URLs for each video
        if (files && files.length > 0) {
          const videoMap: Record<string, string> = {};
          
          // Filter for videos that match our step IDs
          defaultTourSteps.forEach(step => {
            const matchingFile = files.find(file => file.name.startsWith(`tour_${step.id}_`));
            if (matchingFile) {
              const { data } = supabase.storage
                .from('tourvideo')
                .getPublicUrl(matchingFile.name);
              
              videoMap[step.id] = data.publicUrl;
            }
          });
          
          setVideos(videoMap);
        }
      } catch (error) {
        console.error('Error fetching videos:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchVideos();
  }, []);
  
  const handleUploadComplete = (stepId: string, url: string) => {
    setVideos(prev => ({
      ...prev,
      [stepId]: url
    }));
  };
  
  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6 flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-dream-accent1" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl bg-gradient-to-r from-dream-accent1 via-dream-accent2 to-dream-accent3 bg-clip-text text-transparent">
          Tour Video Manager
        </CardTitle>
        <CardDescription>
          Upload videos for each step of the interactive tour
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-6">
            {defaultTourSteps.map(step => (
              <TabsTrigger key={step.id} value={step.id}>
                {step.title}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {defaultTourSteps.map(step => (
            <TabsContent key={step.id} value={step.id} className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">{step.title}</h3>
                <p className="text-sm text-dream-foreground/70 mb-4">{step.description}</p>
                
                <VideoUploader 
                  onUploadComplete={(url) => handleUploadComplete(step.id, url)}
                  label={`Upload video for "${step.title}"`}
                  currentVideoUrl={videos[step.id]}
                />
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TourVideoManager;
