
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
      setCurrentStep(4); // Skip to the end (now at index 4 since we removed the last step)
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

  // Define the steps of the tour - removed the last step
  const steps = [{
    title: "Welcome, Explorer!",
    description: "You've stumbled upon a treasure chest of opportunity in the wild Trenches!",
    icon: <Rocket className="w-8 h-8 text-purple-400" />,
    highlight: null,
    action: null,
    image: "/lovable-uploads/05f6e261-54bf-4bf4-ba9d-52794f1b3b3c.png"
  }, {
    title: "Mint Your Magic Points",
    description: "Grab some free points – your trusty in-game currency. No need to risk your own gold yet!",
    icon: <Coins className="w-8 h-8 text-yellow-400" />,
    highlight: "mint",
    image: "/lovable-uploads/ac099dc7-7eb5-45db-9d89-615f8619a093.png",
    action: <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="default" className="mt-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-[0_0_15px_rgba(251,146,60,0.5)] transition-all duration-300 hover:shadow-[0_0_20px_rgba(251,146,60,0.7)]">
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
    image: "/lovable-uploads/73262649-413c-4ed4-9248-1138e844ace7.png",
    action: <Link to="/betting">
        <Button variant="default" className="mt-4 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 shadow-[0_0_15px_rgba(139,92,246,0.5)] transition-all duration-300 hover:shadow-[0_0_20px_rgba(139,92,246,0.7)]">
          Go to Playground
        </Button>
      </Link>
  }, {
    title: "Climb the Trader's Throne",
    description: "Show off your betting skills and rise through the leaderboard ranks to reach legendary status!",
    icon: <Trophy className="w-8 h-8 text-amber-400" />,
    highlight: "leaderboard",
    image: "/lovable-uploads/c40baa88-ed47-4c9b-bbd9-d248df1c7863.png",
    action: <Link to="/#leaderboard">
        <Button variant="default" className="mt-4 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 shadow-[0_0_15px_rgba(251,191,36,0.5)] transition-all duration-300 hover:shadow-[0_0_20px_rgba(251,191,36,0.7)]">
          View Leaderboard
        </Button>
      </Link>
  }, {
    title: "Unlock Elite Powers",
    description: "Visit your profile and earn 2000 PXB points as a welcome bonus!",
    icon: <Gift className="w-8 h-8 text-pink-400" />,
    highlight: "profile",
    image: "/lovable-uploads/be6baddd-a67e-4583-b969-a471b47274e1.png",
    action: <Button variant="default" className="mt-4 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 shadow-[0_0_15px_rgba(244,114,182,0.5)] transition-all duration-300 hover:shadow-[0_0_20px_rgba(244,114,182,0.7)]" onClick={handleClaimPoints} disabled={hasClaimedPoints}>
        {hasClaimedPoints ? "Points Claimed!" : "Claim 2000 PXB"}
      </Button>
  }];

  // If on mobile, return null to match AnimatedLogo behavior
  if (isMobile) {
    return null;
  }
  return <div className="flex justify-center items-center w-full my-12 mx-auto">
      <motion.div className="relative w-[400px] md:w-[580px] h-[320px] md:h-[380px] flex items-center justify-center bg-gradient-to-r from-gray-900/90 to-indigo-950/90 rounded-2xl border border-indigo-500/30 backdrop-blur-sm overflow-hidden shadow-[0_0_30px_rgba(99,102,241,0.2)]" initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} transition={{
      duration: 0.8
    }}
    style={{
      perspective: "1000px",
      transformStyle: "preserve-3d"
    }}>
        {/* 3D rotated overlay for depth effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-indigo-500/5 backdrop-blur-[2px] transform rotate-x-10 rotate-y-5" style={{ transform: "rotateX(5deg) rotateY(3deg)" }}></div>

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

        {/* Holographic grid lines */}
        <div className="absolute inset-0 opacity-20">
          <div className="h-full w-full" style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.3) 0%, transparent 80%), linear-gradient(to right, #6366f1 1px, transparent 1px), linear-gradient(to bottom, #6366f1 1px, transparent 1px)',
          backgroundSize: '100%, 25px 25px, 25px 25px'
        }}></div>
        </div>

        {/* Glowing edges */}
        <div className="absolute inset-0 rounded-2xl pointer-events-none">
          <div className="absolute inset-0 rounded-2xl border border-indigo-500/30 animate-pulse-glow"></div>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/0 via-indigo-500/5 to-purple-500/10"></div>
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
            
            {steps[currentStep].image && (
              <motion.div 
                className="w-full max-w-[320px] mx-auto my-4 rounded-lg overflow-hidden shadow-lg transform" 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                style={{ 
                  boxShadow: "0 0 25px rgba(99, 102, 241, 0.4), 0 0 10px rgba(139, 92, 246, 0.3)",
                  transform: "perspective(1000px) rotateX(5deg) rotateY(-5deg)" 
                }}
              >
                <img 
                  src={steps[currentStep].image} 
                  alt={steps[currentStep].title} 
                  className="w-full h-auto object-cover rounded-lg border border-indigo-500/30"
                />
                <div className="absolute inset-0 bg-gradient-to-tl from-indigo-500/10 to-transparent rounded-lg"></div>
              </motion.div>
            )}
            
            {steps[currentStep].action}
            
            <div className="mt-4 flex justify-center space-x-2">
              {/* Tour navigation dots */}
              {steps.map((_, index) => <button key={index} className={`w-2.5 h-2.5 rounded-full transition-all ${currentStep === index ? 'bg-indigo-400 scale-125 shadow-[0_0_10px_rgba(129,140,248,0.8)]' : 'bg-gray-600 hover:bg-gray-500'}`} onClick={() => setCurrentStep(index)} aria-label={`Go to step ${index + 1}`} />)}
            </div>
            
            <div className="absolute bottom-4 right-4 flex space-x-2">
              {currentStep > 0 && <Button variant="ghost" size="sm" className="text-white/70 hover:text-white backdrop-blur-sm bg-white/5 hover:bg-white/10 border border-white/10" onClick={handlePrevStep}>
                  Back
                </Button>}
              
              {currentStep < steps.length - 1 && <Button variant="ghost" size="sm" className="text-white hover:bg-indigo-600/30 backdrop-blur-sm bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20" onClick={handleNextStep}>
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

        {/* Scan line effect */}
        <motion.div 
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{ opacity: 0.3 }}
        >
          <motion.div 
            className="absolute h-[2px] w-full bg-gradient-to-r from-transparent via-indigo-400 to-transparent"
            animate={{ 
              top: ["-10%", "110%"]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </motion.div>
      </motion.div>
    </div>;
};
export default InteractiveTour;
