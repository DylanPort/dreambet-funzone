import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { Zap, Trophy, Play, Gift, PartyPopper, Rocket, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import PXBOnboarding from '@/components/PXBOnboarding';
import { Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'sonner';

// Add Props type that includes onClose function
interface PXBOnboardingProps {
  onClose: () => void;
}

// We'll assume PXBOnboarding now accepts an onClose prop
// You'll need to update the PXBOnboarding component separately if needed

const InteractiveTour = () => {
  const isMobile = useIsMobile();
  const [currentStep, setCurrentStep] = useState(0);
  const [hasClaimedPoints, setHasClaimedPoints] = useState(false);
  const {
    userProfile,
    addPointsToUser
  } = usePXBPoints();
  const {
    connected
  } = useWallet();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  useEffect(() => {
    // Check local storage to see if user has already gone through the tour
    const tourCompleted = localStorage.getItem('pxb-tour-completed');
    if (tourCompleted) {
      setCurrentStep(5); // Skip to the end
    }
  }, []);
  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Mark tour as completed in local storage
      localStorage.setItem('pxb-tour-completed', 'true');
    }
  };
  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };
  const handleClaimPoints = async () => {
    if (!connected) {
      toast.error("Please connect your wallet first!");
      return;
    }
    if (hasClaimedPoints) {
      toast.info("You've already claimed your bonus points!");
      return;
    }
    try {
      await addPointsToUser(2000, "Welcome bonus");
      setHasClaimedPoints(true);
      toast.success("You've earned 2000 PXB points! Welcome aboard!");
    } catch (error) {
      console.error("Error claiming points:", error);
      toast.error("Failed to claim points. Please try again later.");
    }
  };

  // Define the steps of the tour
  const steps = [{
    title: "Welcome, Explorer!",
    description: "You've stumbled upon a treasure chest of opportunity in the wild Trenches!",
    icon: <Rocket className="w-8 h-8 text-purple-400" />,
    highlight: null,
    action: null
  }, {
    title: "Mint Your Magic Points",
    description: "Grab some free points – your trusty in-game currency. No need to risk your own gold yet!",
    icon: <Coins className="w-8 h-8 text-yellow-400" />,
    highlight: "mint",
    action: <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="default" className="mt-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700" onClick={() => setIsDialogOpen(true)}>
            Mint PXB Points
          </Button>
        </DialogTrigger>
        <DialogContent className="w-full max-w-md bg-transparent border-none shadow-none">
          <PXBOnboarding onClose={() => {
          setIsDialogOpen(false);
          handleNextStep();
        }} />
        </DialogContent>
      </Dialog>
  }, {
    title: "Bet Like a Boss",
    description: "Wager your points on any Solana chain token. Crank up the multiplier and watch your points soar!",
    icon: <Play className="w-8 h-8 text-green-400" />,
    highlight: "playground",
    action: <Link to="/betting">
        <Button variant="default" className="mt-4 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700" onClick={handleNextStep}>
          Go to Playground
        </Button>
      </Link>
  }, {
    title: "Climb the Trader's Throne",
    description: "Show off your betting skills and rise through the leaderboard ranks to reach legendary status!",
    icon: <Trophy className="w-8 h-8 text-amber-400" />,
    highlight: "leaderboard",
    action: <Link to="/#leaderboard">
        
      </Link>
  }, {
    title: "Unlock Elite Powers",
    description: "Visit your profile and earn 2000 PXB points as a welcome bonus!",
    icon: <Gift className="w-8 h-8 text-pink-400" />,
    highlight: "profile",
    action: <Button variant="default" className="mt-4 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700" onClick={handleClaimPoints} disabled={hasClaimedPoints}>
        {hasClaimedPoints ? "Points Claimed!" : "Claim 2000 PXB"}
      </Button>
  }, {
    title: "Ready, Player One?",
    description: "From zero to hero – gear up, place your bets, and conquer the trenches of Web3 trading!",
    icon: <PartyPopper className="w-8 h-8 text-indigo-400" />,
    highlight: null,
    action: <Button variant="default" className="mt-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700" onClick={handleNextStep}>
        Let's Go!
      </Button>
  }];

  // If on mobile, return null to match AnimatedLogo behavior
  if (isMobile) {
    return null;
  }
  return <div className="flex justify-center items-center w-full my-12 mx-auto">
      <motion.div className="relative w-[400px] md:w-[550px] h-[230px] md:h-[280px] flex items-center justify-center bg-gradient-to-r from-gray-900/80 to-indigo-950/80 rounded-2xl border border-indigo-500/20 backdrop-blur-sm overflow-hidden" initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} transition={{
      duration: 0.8
    }}>
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(15)].map((_, i) => <motion.div key={i} className="absolute rounded-full bg-indigo-500/20" style={{
          width: Math.random() * 80 + 20,
          height: Math.random() * 80 + 20,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          filter: "blur(20px)"
        }} animate={{
          x: [0, Math.random() * 40 - 20],
          y: [0, Math.random() * 40 - 20],
          opacity: [0.1, 0.3, 0.1]
        }} transition={{
          duration: 8 + Math.random() * 4,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }} />)}
        </div>

        {/* Animated grid lines */}
        <div className="absolute inset-0 opacity-20">
          <div className="h-full w-full" style={{
          backgroundImage: 'linear-gradient(to right, #6366f1 1px, transparent 1px), linear-gradient(to bottom, #6366f1 1px, transparent 1px)',
          backgroundSize: '25px 25px'
        }}></div>
        </div>

        {/* Tour content */}
        <AnimatePresence mode="wait">
          <motion.div key={currentStep} className="relative z-10 text-center p-8 w-full" initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} exit={{
          opacity: 0,
          y: -20
        }} transition={{
          duration: 0.5
        }}>
            <div className="mb-4 flex justify-center">
              {steps[currentStep].icon}
            </div>
            
            <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
              {steps[currentStep].title}
            </h2>
            
            <p className="text-indigo-200/80 text-sm mb-4">
              {steps[currentStep].description}
            </p>
            
            {steps[currentStep].action}
            
            <div className="mt-4 flex justify-center space-x-2">
              {/* Tour navigation dots */}
              {steps.map((_, index) => <button key={index} className={`w-2.5 h-2.5 rounded-full transition-all ${currentStep === index ? 'bg-indigo-400 scale-125' : 'bg-gray-600 hover:bg-gray-500'}`} onClick={() => setCurrentStep(index)} aria-label={`Go to step ${index + 1}`} />)}
            </div>
            
            <div className="absolute bottom-4 right-4 flex space-x-2">
              {currentStep > 0 && <Button variant="ghost" size="sm" className="text-white/70 hover:text-white" onClick={handlePrevStep}>
                  Back
                </Button>}
              
              {currentStep < steps.length - 1 && <Button variant="ghost" size="sm" className="text-white hover:bg-indigo-600/30" onClick={handleNextStep}>
                  Skip
                </Button>}
            </div>
          </motion.div>
        </AnimatePresence>
        
        {/* Floating connection lines */}
        {[...Array(7)].map((_, i) => <motion.div key={`line-${i}`} className="absolute w-[1px] h-[100px] bg-gradient-to-b from-indigo-500/0 via-indigo-500/50 to-indigo-500/0" style={{
        left: `${15 + i * 12}%`,
        top: '50%',
        transform: 'translateY(-50%)'
      }} animate={{
        height: [100, 120, 100],
        opacity: [0.3, 0.6, 0.3]
      }} transition={{
        duration: 3 + i,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut",
        delay: i * 0.2
      }} />)}
      </motion.div>
    </div>;
};
export default InteractiveTour;