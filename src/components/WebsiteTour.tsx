import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import PXBOnboarding from '@/components/PXBOnboarding';
import { toast } from 'sonner';
import { ArrowRight, Gift, Play, Trophy, Sparkles, Wallet, PartyPopper } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const REWARD_AMOUNT = 2000;

type TourStep = {
  title: string;
  description: string;
  icon: React.ReactNode;
  buttonText: string;
  image: string;
  reward: boolean;
  action?: () => void;
};

const WebsiteTour = () => {
  const isMobile = useIsMobile();
  const [currentStep, setCurrentStep] = useState(0);
  const [canProgress, setCanProgress] = useState(true);
  const [showMintDialog, setShowMintDialog] = useState(false);
  const [tourCompleted, setTourCompleted] = useState(false);
  const [earnedRewards, setEarnedRewards] = useState<{ [key: number]: boolean }>({});
  const { mintPoints, userProfile } = usePXBPoints();
  const navigate = useNavigate();

  const handleReward = async (stepIndex: number) => {
    if (earnedRewards[stepIndex]) return;

    try {
      await mintPoints(REWARD_AMOUNT);
      toast.success(`You earned ${REWARD_AMOUNT} PXB Points!`);
      setEarnedRewards(prev => ({ ...prev, [stepIndex]: true }));
    } catch (error) {
      toast.error("Couldn't award PXB Points. Please try again.");
    }
  };

  const navigateToBetting = () => {
    if (userProfile) {
      navigate('/betting');
    } else {
      navigate('/profile');
    }
  };

  const tourSteps: TourStep[] = [
    {
      title: "Welcome Explorer!",
      description: "You've just stumbled upon a treasure chest of opportunity in the wild Trenches. This ain't your grandpa's betting app – it's a gamified quest to learn, earn, and conquer!",
      icon: <Play className="w-8 h-8 text-blue-400" />,
      buttonText: "Start Adventure",
      image: "/lovable-uploads/ac099dc7-7eb5-45db-9d89-615f8619a093.png",
      reward: true
    },
    {
      title: "Mint Your Magic Points",
      description: "Grab some free PXB points – your trusty in-game currency. No need to risk your own funds just yet!",
      icon: <Gift className="w-8 h-8 text-green-400" />,
      buttonText: "Mint PXB Points",
      image: "/lovable-uploads/90de812c-ed2e-41af-bc5b-33f452833151.png",
      reward: true,
      action: () => setShowMintDialog(true)
    },
    {
      title: "Bet Like a Boss",
      description: "Wager your points on any token you fancy. Feeling lucky? Crank up the multiplier and watch your points soar – or crash spectacularly!",
      icon: <Sparkles className="w-8 h-8 text-purple-400" />,
      buttonText: "Enter Playground",
      image: "/lovable-uploads/7f8a29b9-8cfb-42ce-ab80-9c9a0f5e42a4.png",
      reward: true,
      action: () => navigate('/betting')
    },
    {
      title: "Climb the Trader's Throne",
      description: "Show off your betting skills and rise through the leaderboard ranks. The better you trade, the closer you get to legendary status.",
      icon: <Trophy className="w-8 h-8 text-yellow-400" />,
      buttonText: "View PXB Space",
      image: "/lovable-uploads/be886d35-fbcb-4675-926c-38691ad3e311.png",
      reward: true,
      action: () => navigate('/betting/my-bets')
    },
    {
      title: "Unlock Elite Powers",
      description: "Hit the big leagues and unlock subscription plans. Let other players copy your wallet moves or offer Web3 services to rake in even more points.",
      icon: <Wallet className="w-8 h-8 text-indigo-400" />,
      buttonText: "Your Profile",
      image: "/lovable-uploads/be6baddd-a67e-4583-b969-a471b47274e1.png",
      reward: true,
      action: () => navigate('/profile')
    },
    {
      title: "Ready to Conquer!",
      description: "This is your shot to go from zero to hero – especially if your wallet's been gathering dust. Place your bets and conquer the trenches of Web3 trading! Ready, player one?",
      icon: <PartyPopper className="w-8 h-8 text-pink-400" />,
      buttonText: "Start Betting Now!",
      image: "/lovable-uploads/996f7a3a-2e7a-4c12-bcd7-8af762f1087a.png",
      reward: false,
      action: navigateToBetting
    }
  ];

  const handleNext = (stepIndex: number) => {
    if (!canProgress) return;
    
    if (tourSteps[stepIndex].reward) {
      handleReward(stepIndex);
    }
    
    if (tourSteps[stepIndex].action) {
      tourSteps[stepIndex].action();
    }
    
    const nextStep = stepIndex + 1;
    
    if (nextStep < tourSteps.length) {
      setCurrentStep(nextStep);
    } else {
      setTourCompleted(true);
      handleReward(stepIndex);
    }
  };

  if (isMobile) {
    return null;
  }

  if (tourCompleted) {
    return (
      <div className="flex flex-col justify-center items-center w-full my-12 mx-auto">
        <motion.div
          className="glass-panel p-8 max-w-md text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <PartyPopper className="w-16 h-16 mx-auto mb-4 text-green-400" />
          <h2 className="text-2xl font-bold mb-2">Tour Completed!</h2>
          <p className="mb-4">You've earned {Object.keys(earnedRewards).length * REWARD_AMOUNT} PXB Points!</p>
          
          <Button 
            onClick={navigateToBetting}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
          >
            Start Betting Now
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center w-full my-12 mx-auto">
      <motion.div
        className="relative w-[400px] md:w-[550px] h-[420px] md:h-[480px] overflow-hidden glass-panel"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <Carousel className="h-full">
          <CarouselContent className="h-full">
            {tourSteps.map((step, index) => (
              <CarouselItem key={index} className="h-full">
                <div className="flex flex-col h-full p-6">
                  <div className="mb-4 flex items-center">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mr-4">
                      {step.icon}
                    </div>
                    <h3 className="text-xl font-bold text-gradient-active">
                      {step.title}
                    </h3>
                  </div>
                  
                  <div className="relative flex-grow mb-4 overflow-hidden rounded-lg">
                    <img 
                      src={step.image} 
                      alt={step.title} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  </div>
                  
                  <p className="mb-6 text-white/80">
                    {step.description}
                  </p>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center">
                      <span className="text-xs text-white/60">
                        Step {index + 1} of {tourSteps.length}
                      </span>
                      
                      {earnedRewards[index] && (
                        <span className="ml-2 text-xs text-green-400 flex items-center">
                          <Gift className="w-3 h-3 mr-1" />
                          +{REWARD_AMOUNT} PXB
                        </span>
                      )}
                    </div>
                    
                    <Button
                      onClick={() => {
                        setCurrentStep(index);
                        handleNext(index);
                      }}
                      className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                    >
                      {step.buttonText}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
          {tourSteps.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentStep 
                  ? 'bg-white w-4' 
                  : 'bg-white/30'
              }`}
              onClick={() => setCurrentStep(index)}
            />
          ))}
        </div>
      </motion.div>
      
      <Dialog open={showMintDialog} onOpenChange={setShowMintDialog}>
        <DialogContent className="w-full max-w-md bg-transparent border-none shadow-none">
          <PXBOnboarding />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WebsiteTour;
