import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { usePXBPoints } from '@/contexts/pxb/PXBPointsContext';
import { X, Settings, Info, Gamepad, Clock, PartyPopper, Award, Trophy } from 'lucide-react';
import TourVideoManager from './TourVideoManager';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Link } from 'react-router-dom';
import CountdownTimer from './CountdownTimer';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { usePXBTotalSupply } from '@/hooks/usePXBTotalSupply';

interface PXBOnboardingProps {
  onClose?: () => void;
}

const PXBOnboarding: React.FC<PXBOnboardingProps> = ({
  onClose
}) => {
  const {
    userProfile,
    mintPoints,
    mintingPoints
  } = usePXBPoints();
  const {
    toast
  } = useToast();
  const [showTour, setShowTour] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [pointAmount, setPointAmount] = useState(20000);
  const [nextMintTime, setNextMintTime] = useState<Date | null>(null);
  const [showCountdown, setShowCountdown] = useState(false);
  const [tourVideos, setTourVideos] = useState<Record<string, string>>({});
  const [loadingVideos, setLoadingVideos] = useState(true);
  const promoEndDate = new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000);
  const tourSteps = [{
    id: 'welcome',
    title: 'Welcome to PXB',
    description: 'Introduction to the PXB platform'
  }, {
    id: 'points',
    title: 'Earning PXB Points',
    description: 'Learn how to earn and use PXB points'
  }, {
    id: 'betting',
    title: 'Placing Bets',
    description: 'How to place bets with your PXB points'
  }, {
    id: 'leaderboard',
    title: 'Leaderboard',
    description: 'Compete with others on the leaderboard'
  }];
  
  const { supplyData, isLoading: supplyLoading } = usePXBTotalSupply(1000);
  
  useEffect(() => {
    const fetchTourVideos = async () => {
      try {
        setLoadingVideos(true);
        const {
          data: files,
          error
        } = await supabase.storage.from('tourvideo').list();
        if (error) {
          throw error;
        }
        const videoMap: Record<string, string> = {};
        for (const step of tourSteps) {
          const matchingFiles = files?.filter(file => file.name.startsWith(`tour_${step.id}_`)) || [];
          if (matchingFiles.length > 0) {
            const mostRecentFile = matchingFiles.sort((a, b) => b.name.localeCompare(a.name))[0];
            const {
              data
            } = supabase.storage.from('tourvideo').getPublicUrl(mostRecentFile.name);
            videoMap[step.id] = `${data.publicUrl}?t=${Date.now()}`;
          } else {
            const fallbackVideoUrl = "https://vjerwqqhcedemgfgfzbg.supabase.co/storage/v1/object/sign/tourvideo/tour_fallback.mp4?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJ0b3VydmlkZW8vdG91cl9mYWxsYmFjay5tcDQiLCJpYXQiOjE3NDMwNTU2NTIsImV4cCI6MTc3NDU5MTY1Mn0.UZ4OZYx_PL3hUrTZDwgC4m2-YKIjzFCpQQZHGsQ5Kqs";
            videoMap[step.id] = fallbackVideoUrl;
          }
        }
        setTourVideos(videoMap);
      } catch (error) {
        console.error('Error fetching tour videos:', error);
      } finally {
        setLoadingVideos(false);
      }
    };
    fetchTourVideos();
  }, []);

  useEffect(() => {
    if (userProfile) {
      const savedNextMintTime = localStorage.getItem(`nextMintTime_${userProfile.id}`);
      if (savedNextMintTime) {
        const nextTime = new Date(savedNextMintTime);
        if (nextTime.getTime() > Date.now()) {
          setNextMintTime(nextTime);
          setShowCountdown(true);
        } else {
          localStorage.removeItem(`nextMintTime_${userProfile.id}`);
        }
      }
    }
  }, [userProfile]);

  useEffect(() => {
    const hasCompletedTour = localStorage.getItem('pxbTourCompleted');
    if (!hasCompletedTour) {
      setShowTour(true);
    }
  }, []);
  
  const completeTour = () => {
    localStorage.setItem('pxbTourCompleted', 'true');
    setShowTour(false);
    if (onClose) onClose();
  };
  
  const tourStepTitle = (step: number) => {
    return tourSteps[step].title;
  };
  
  const tourStepDescription = (step: number) => {
    return tourSteps[step].description;
  };
  
  const [tourVideoModalOpen, setTourVideoModalOpen] = useState(false);
  
  const handleMintPoints = async () => {
    try {
      await mintPoints(pointAmount);
      const now = new Date();
      const nextTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      setNextMintTime(nextTime);
      setShowCountdown(true);
      if (userProfile) {
        localStorage.setItem(`nextMintTime_${userProfile.id}`, nextTime.toISOString());
      }
      toast({
        title: "Points Minted!",
        description: `You've successfully minted ${pointAmount} PXB Points.`,
        variant: "default"
      });
    } catch (error) {
      console.error("Failed to mint points:", error);
      toast({
        title: "Minting Failed",
        description: "There was an error minting your points. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleCountdownComplete = () => {
    setShowCountdown(false);
    setNextMintTime(null);
    if (userProfile) {
      localStorage.removeItem(`nextMintTime_${userProfile.id}`);
    }
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  const isSupplyFullyMinted = supplyData.totalMinted >= 990000000;
  
  const renderPXBInfo = () => {
    return <div className="flex flex-col space-y-6 p-4">
        <div className="text-center py-4">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent mb-2">
            {userProfile ? 'Your PXB Points' : 'Mint PXB Points'}
          </h3>
          
          {userProfile ? <div className="my-6 text-center">
              <p className="text-sm text-white/70 mb-2">Current Balance:</p>
              <div className="text-4xl font-bold text-amber-400">{userProfile.pxbPoints}</div>
              <p className="text-sm text-white/50 mt-2">PXB Points</p>
            </div> : <p className="text-white/70 mt-2">Connect your wallet to manage PXB Points</p>}
          
          {userProfile && (
            <div className="mt-8 space-y-2">
              {isSupplyFullyMinted ? (
                <div className="p-4 rounded-md mb-4 bg-gradient-to-r from-purple-500/20 via-amber-500/20 to-pink-500/20 border border-amber-500/30 animate-pulse-subtle">
                  <div className="flex flex-col items-center gap-2">
                    <PartyPopper className="h-8 w-8 text-amber-400 animate-bounce" />
                    <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-amber-500 bg-clip-text text-transparent font-bold text-xl">
                      Congratulations! 🎉
                    </span>
                    <p className="text-white/90 text-center">
                      The PXB total supply of 1 billion has been fully minted!
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <Trophy className="h-4 w-4 text-amber-400" />
                      <span className="font-semibold text-amber-300">
                        {formatNumber(supplyData.usersWithPoints)} users participated
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Award className="h-4 w-4 text-green-400" />
                      <span className="font-semibold text-green-300">
                        {formatNumber(supplyData.totalMinted)} PXB minted in total
                      </span>
                    </div>
                    <div className="mt-4 text-center text-white/80">
                      <p>Don't worry! New opportunities to earn PXB are coming soon:</p>
                      <ul className="text-left mt-2 space-y-1">
                        <li className="flex items-center gap-1">
                          <span className="text-amber-400">•</span> Complete bounties and tasks
                        </li>
                        <li className="flex items-center gap-1">
                          <span className="text-amber-400">•</span> Trade tokens in the marketplace
                        </li>
                        <li className="flex items-center gap-1">
                          <span className="text-amber-400">•</span> Participate in community activities
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-md mb-4 bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="bg-amber-500/20 px-2 py-1 rounded text-amber-300 font-semibold">PROMO</span>
                      <span className="ml-2 text-white/80">Limited Time Offer!</span>
                    </div>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-white/50" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm">Get 20,000 PXB points daily for a limited time!</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              )}
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center justify-center mb-1">
                      {isSupplyFullyMinted ? (
                        <p className="text-sm text-white/70">
                          <span className="bg-pink-500/20 px-2 py-1 rounded text-pink-300 font-semibold">COMPLETED</span> Total Supply Fully Minted
                        </p>
                      ) : (
                        <p className="text-sm text-white/70">
                          <span className="bg-amber-500/20 px-2 py-1 rounded text-amber-300 font-semibold">PROMO</span> Daily Limit: 20000 PXB
                        </p>
                      )}
                      <Info className="w-4 h-4 ml-1 text-white/50" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isSupplyFullyMinted ? (
                      <p className="text-sm">The PXB supply of 1 billion tokens has been fully minted!</p>
                    ) : (
                      <p className="text-sm">Special promotion: You can mint up to 20000 PXB tokens every 24 hours</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {showCountdown && nextMintTime ? (
                <div className="p-3 rounded-md mb-2 bg-black/[0.53]">
                  <p className="text-xs text-amber-300 mb-2">Next mint available in:</p>
                  <CountdownTimer endTime={nextMintTime} onComplete={handleCountdownComplete} />
                </div>
              ) : (
                isSupplyFullyMinted ? (
                  <Button disabled className="w-full bg-gray-600/50 text-white/50 cursor-not-allowed">
                    Minting Completed
                  </Button>
                ) : (
                  <Button onClick={handleMintPoints} disabled={mintingPoints} className="w-full bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800">
                    {mintingPoints ? 'Minting...' : `Mint ${pointAmount} PXB Points`}
                  </Button>
                )
              )}
              
              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-sm text-white/70 mb-3">Ready to use your PXB Points?</p>
                <Button asChild className="w-full bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700">
                  <Link to="/betting" className="flex items-center justify-center">
                    <img src="/lovable-uploads/9152bc22-d941-4ac3-af5a-a48cfb9d7844.png" alt="PXB" className="h-6 mr-2" />
                    Go to Playground
                  </Link>
                </Button>
                <p className="text-xs text-white/50 mt-2">
                  Start your journey by placing bets on tokens in our PXB Playground!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>;
  };
  
  const renderTourStep = (step: number) => {
    const stepId = tourSteps[step].id;
    const videoUrl = tourVideos[stepId];
    const fallbackImage = `/lovable-uploads/05f6e261-54bf-4bf4-ba9d-52794f1b3b3c.png`;
    return <div className="flex flex-col space-y-6 p-4">
        <div className="rounded-lg overflow-hidden bg-gray-800 aspect-video w-full relative">
          {videoUrl && <video key={`${stepId}-${Date.now()}`} src={videoUrl} className="w-full h-full object-cover" controls autoPlay playsInline muted onError={e => {
          console.error(`Error loading video for step ${step}:`, e);
          const target = e.target as HTMLVideoElement;
          target.style.display = 'none';
          const fallback = target.parentElement?.querySelector('img');
          if (fallback) fallback.style.display = 'block';
        }} />}
          
          <img src={fallbackImage} alt={`Tour step ${step + 1}`} className={`w-full h-full object-cover ${videoUrl ? 'hidden' : 'block'}`} />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{tourStepTitle(step)}</h3>
          <p className="text-sm opacity-80">{tourStepDescription(step)}</p>
        </div>
        
        <div className="flex justify-between mt-4">
          {step > 0 && <Button variant="outline" onClick={() => setCurrentStep(step - 1)}>
              Previous
            </Button>}
          
          {step < tourSteps.length - 1 ? <Button onClick={() => setCurrentStep(step + 1)} className="ml-auto">
              Next
            </Button> : <Button onClick={completeTour} className="ml-auto bg-dream-accent1 hover:bg-dream-accent1/80">
              Complete Tour
            </Button>}
        </div>
      </div>;
  };
  
  return <>
      {showTour ? <div className="bg-dream-background rounded-lg shadow-xl overflow-hidden w-full">
          <div className="p-4 bg-gradient-to-r from-dream-accent1 to-dream-accent3 flex justify-between items-center">
            <h2 className="text-white font-bold">Interactive Tour</h2>
            <div className="flex space-x-2">
              {userProfile?.id === 'admin' && <Button variant="ghost" size="sm" className="h-8 text-white hover:bg-white/20" onClick={() => setTourVideoModalOpen(true)}>
                  <Settings className="h-4 w-4 mr-1" />
                  Manage Videos
                </Button>}
              <Button variant="ghost" size="sm" className="h-8 text-white hover:bg-white/20" onClick={completeTour}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {renderTourStep(currentStep)}
          
          <div className="px-4 pb-4 pt-0">
            <div className="flex justify-between items-center text-xs text-dream-foreground/60 mt-2">
              <span>Step {currentStep + 1} of {tourSteps.length}</span>
              <button onClick={completeTour} className="underline hover:text-dream-foreground/80 transition-colors">
                Skip Tour
              </button>
            </div>
            <Progress value={(currentStep + 1) / tourSteps.length * 100} className="h-1 mt-2" />
          </div>
        </div> : <div className="bg-dream-background/90 backdrop-blur-md rounded-lg shadow-xl overflow-hidden">
          {renderPXBInfo()}
        </div>}
      
      {tourVideoModalOpen && <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-3xl">
            <div className="flex justify-end mb-2">
              <Button variant="ghost" size="sm" className="h-8 text-white hover:bg-white/20" onClick={() => setTourVideoModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <TourVideoManager onClose={() => setTourVideoModalOpen(false)} />
          </div>
        </div>}
    </>;
};

export default PXBOnboarding;
