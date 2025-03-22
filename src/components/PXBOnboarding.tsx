
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { usePXBPoints } from '@/contexts/pxb/PXBPointsContext';
import { X, Settings } from 'lucide-react';
import TourVideoManager from './TourVideoManager';

interface PXBOnboardingProps {
  onClose?: () => void;
}

const PXBOnboarding: React.FC<PXBOnboardingProps> = ({ onClose }) => {
  const { userProfile, mintPoints, mintingPoints } = usePXBPoints();
  const [showTour, setShowTour] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [pointAmount, setPointAmount] = useState(100);

  const tourSteps = [
    { id: 'welcome', title: 'Welcome to PXB', description: 'Introduction to the PXB platform' },
    { id: 'points', title: 'Earning PXB Points', description: 'Learn how to earn and use PXB points' },
    { id: 'betting', title: 'Placing Bets', description: 'How to place bets with your PXB points' },
    { id: 'leaderboard', title: 'Leaderboard', description: 'Compete with others on the leaderboard' },
  ];

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
    } catch (error) {
      console.error("Failed to mint points:", error);
    }
  };

  const renderPXBInfo = () => {
    return (
      <div className="flex flex-col space-y-6 p-4">
        <div className="text-center py-4">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent mb-2">
            {userProfile ? 'Your PXB Points' : 'Mint PXB Points'}
          </h3>
          
          {userProfile ? (
            <div className="my-6 text-center">
              <p className="text-sm text-white/70 mb-2">Current Balance:</p>
              <div className="text-4xl font-bold text-amber-400">{userProfile.pxbPoints}</div>
              <p className="text-sm text-white/50 mt-2">PXB Points</p>
            </div>
          ) : (
            <p className="text-white/70 mt-2">Connect your wallet to manage PXB Points</p>
          )}
          
          {userProfile && (
            <div className="mt-8">
              <Button 
                onClick={handleMintPoints}
                disabled={mintingPoints}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800"
              >
                {mintingPoints ? 'Minting...' : `Mint ${pointAmount} PXB Points`}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTourStep = (step: number) => {
    const stepIdForIndex = (index: number) => {
      const stepIds = ['welcome', 'points', 'betting', 'leaderboard'];
      return stepIds[index] || `step${index + 1}`;
    };
    
    const videoUrl = "https://vjerwqqhcedemgfgfzbg.supabase.co/storage/v1/object/sign/tourvideo/Untitled%20video%20-%20Made%20with%20Clipchamp%20(7)%20(online-video-cutter.com).mp4?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJ0b3VydmlkZW8vVW50aXRsZWQgdmlkZW8gLSBNYWRlIHdpdGggQ2xpcGNoYW1wICg3KSAob25saW5lLXZpZGVvLWN1dHRlci5jb20pLm1wNCIsImlhdCI6MTc0MjY2NTY1MiwiZXhwIjoxNzc0MjAxNjUyfQ.FOnoYScf0r244PUOjega7OzIC0KEEmB2O6l4T-_UY9E";
    
    return (
      <div className="flex flex-col space-y-6 p-4">
        <div className="rounded-lg overflow-hidden bg-gray-800 aspect-video w-full">
          <video
            src={videoUrl}
            className="w-full h-full object-cover"
            controls
            autoPlay
            loop
            muted
            onError={(e) => {
              const target = e.target as HTMLVideoElement;
              target.style.display = 'none';
              const img = target.nextElementSibling as HTMLImageElement;
              if (img) img.style.display = 'block';
            }}
          />
          <img
            src="/lovable-uploads/05f6e261-54bf-4bf4-ba9d-52794f1b3b3c.png"
            alt={`Tour step ${step + 1}`}
            className="w-full h-full object-cover hidden"
          />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{tourStepTitle(step)}</h3>
          <p className="text-sm opacity-80">{tourStepDescription(step)}</p>
        </div>
        <div className="flex justify-between mt-4">
          {step > 0 && (
            <Button variant="outline" onClick={() => setCurrentStep(step - 1)}>
              Previous
            </Button>
          )}
          {step < tourSteps.length - 1 ? (
            <Button 
              onClick={() => setCurrentStep(step + 1)}
              className="ml-auto"
            >
              Next
            </Button>
          ) : (
            <Button 
              onClick={completeTour}
              className="ml-auto bg-dream-accent1 hover:bg-dream-accent1/80"
            >
              Complete Tour
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {showTour ? (
        <div className="bg-dream-background rounded-lg shadow-xl overflow-hidden w-full">
          <div className="p-4 bg-gradient-to-r from-dream-accent1 to-dream-accent3 flex justify-between items-center">
            <h2 className="text-white font-bold">Interactive Tour</h2>
            <div className="flex space-x-2">
              {userProfile?.id === 'admin' && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 text-white hover:bg-white/20"
                  onClick={() => setTourVideoModalOpen(true)}
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Manage Videos
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm"
                className="h-8 text-white hover:bg-white/20"
                onClick={completeTour}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {renderTourStep(currentStep)}
          
          <div className="px-4 pb-4 pt-0">
            <div className="flex justify-between items-center text-xs text-dream-foreground/60 mt-2">
              <span>Step {currentStep + 1} of {tourSteps.length}</span>
              <button 
                onClick={completeTour}
                className="underline hover:text-dream-foreground/80 transition-colors"
              >
                Skip Tour
              </button>
            </div>
            <Progress value={(currentStep + 1) / tourSteps.length * 100} className="h-1 mt-2" />
          </div>
        </div>
      ) : (
        <div className="bg-dream-background/90 backdrop-blur-md rounded-lg shadow-xl overflow-hidden">
          {renderPXBInfo()}
        </div>
      )}
      
      {tourVideoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-3xl">
            <div className="flex justify-end mb-2">
              <Button 
                variant="ghost" 
                size="sm"
                className="h-8 text-white hover:bg-white/20"
                onClick={() => setTourVideoModalOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <TourVideoManager onClose={() => setTourVideoModalOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
};

export default PXBOnboarding;
