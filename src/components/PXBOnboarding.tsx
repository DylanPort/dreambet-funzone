import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { usePXBPoints } from '@/contexts/pxb/PXBPointsContext';
import { X, Settings } from 'lucide-react';
import TourVideoManager from './TourVideoManager';

const PXBOnboarding = () => {
  const { userProfile } = usePXBPoints();
  const [showTour, setShowTour] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

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
  };

  const tourStepTitle = (step: number) => {
    return tourSteps[step].title;
  };

  const tourStepDescription = (step: number) => {
    return tourSteps[step].description;
  };

  const [tourVideoModalOpen, setTourVideoModalOpen] = useState(false);

  const renderTourStep = (step: number) => {
    const stepIdForIndex = (index: number) => {
      const stepIds = ['welcome', 'points', 'betting', 'leaderboard'];
      return stepIds[index] || `step${index + 1}`;
    };
    
    return (
      <div className="flex flex-col space-y-6 p-4">
        <div className="rounded-lg overflow-hidden bg-gray-800 aspect-video w-full">
          <video
            src={`https://vjerwqqhcedemgfgfzbg.supabase.co/storage/v1/object/public/tour-videos/tour_${stepIdForIndex(step)}.mp4`}
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

  const stepIdForIndex = (index: number) => {
    const stepIds = ['welcome', 'points', 'betting', 'leaderboard'];
    return stepIds[index] || `step${index + 1}`;
  };

  return (
    <>
      {showTour && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
          <div className="bg-dream-background rounded-lg shadow-xl w-full max-w-md md:max-w-lg overflow-hidden">
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
