import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { usePXBPoints } from '@/contexts/pxb/PXBPointsContext';
import { X, Settings, Info, Gamepad } from 'lucide-react';
import TourVideoManager from './TourVideoManager';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Link } from 'react-router-dom';
import CountdownTimer from './CountdownTimer';
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
  const [showTour, setShowTour] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [pointAmount, setPointAmount] = useState(2000);
  const [nextMintTime, setNextMintTime] = useState<Date | null>(null);
  const [showCountdown, setShowCountdown] = useState(false);
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

  // Load mint countdown state from localStorage on initial render
  useEffect(() => {
    if (userProfile) {
      const savedNextMintTime = localStorage.getItem(`nextMintTime_${userProfile.id}`);
      if (savedNextMintTime) {
        const nextTime = new Date(savedNextMintTime);
        // Only use saved time if it's in the future
        if (nextTime.getTime() > Date.now()) {
          setNextMintTime(nextTime);
          setShowCountdown(true);
        } else {
          // If the time has passed, clear the storage
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

      // Set next mint time to 24 hours from now
      const now = new Date();
      const nextTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Save to state and localStorage
      setNextMintTime(nextTime);
      setShowCountdown(true);
      if (userProfile) {
        localStorage.setItem(`nextMintTime_${userProfile.id}`, nextTime.toISOString());
      }
    } catch (error) {
      console.error("Failed to mint points:", error);
    }
  };

  // Reset countdown when timer completes
  const handleCountdownComplete = () => {
    setShowCountdown(false);
    setNextMintTime(null);
    if (userProfile) {
      localStorage.removeItem(`nextMintTime_${userProfile.id}`);
    }
  };
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
          
          {userProfile && <div className="mt-8 space-y-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center justify-center mb-1">
                      <p className="text-sm text-white/70">Daily Limit: 2000 PXB</p>
                      <Info className="w-4 h-4 ml-1 text-white/50" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">You can mint up to 2000 PXB tokens every 24 hours</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {showCountdown && nextMintTime ? <div className="p-3 rounded-md mb-2 bg-black/[0.53]">
                  <p className="text-xs text-amber-300 mb-2">Next mint available in:</p>
                  <CountdownTimer endTime={nextMintTime} onComplete={handleCountdownComplete} />
                </div> : <Button onClick={handleMintPoints} disabled={mintingPoints} className="w-full bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800">
                  {mintingPoints ? 'Minting...' : `Mint ${pointAmount} PXB Points`}
                </Button>}
              
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
            </div>}
        </div>
      </div>;
  };
  const renderTourStep = (step: number) => {
    const stepIdForIndex = (index: number) => {
      const stepIds = ['welcome', 'points', 'betting', 'leaderboard'];
      return stepIds[index] || `step${index + 1}`;
    };
    const videoUrl = "https://vjerwqqhcedemgfgfzbg.supabase.co/storage/v1/object/sign/tourvideo/Untitled%20video%20-%20Made%20with%20Clipchamp%20(7)%20(online-video-cutter.com).mp4?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJ0b3VydmlkZW8vVW50aXRsZWQgdmlkZW8gLSBNYWRlIHdpdGggQ2xpcGNoYW1wICg3KSAob25saW5lLXZpZGVvLWN1dHRlci5jb20pLm1wNCIsImlhdCI6MTc0MjY2NTY1MiwiZXhwIjoxNzc0MjAxNjUyfQ.FOnoYScf0r244PUOjega7OzIC0KEEmB2O6l4T-_UY9E";
    return <div className="flex flex-col space-y-6 p-4">
        <div className="rounded-lg overflow-hidden bg-gray-800 aspect-video w-full">
          <video src={videoUrl} className="w-full h-full object-cover" controls autoPlay loop muted onError={e => {
          const target = e.target as HTMLVideoElement;
          target.style.display = 'none';
          const img = target.nextElementSibling as HTMLImageElement;
          if (img) img.style.display = 'block';
        }} />
          <img src="/lovable-uploads/05f6e261-54bf-4bf4-ba9d-52794f1b3b3c.png" alt={`Tour step ${step + 1}`} className="w-full h-full object-cover hidden" />
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