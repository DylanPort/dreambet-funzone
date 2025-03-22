import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import PXBOnboarding from '@/components/PXBOnboarding';
import { Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'sonner';
import { ChevronRight } from 'lucide-react';

interface PXBOnboardingProps {
  onClose: () => void;
}

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
    setCurrentStep(0);
    const tourCompleted = localStorage.getItem('pxb-tour-completed');
    if (tourCompleted) {
      setCurrentStep(0);
    }
  }, []);
  
  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
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

  const steps = [{
    title: "Welcome, Explorer!",
    description: "You've stumbled upon a treasure chest of opportunity in the wild Trenches!",
    icon: <img src="/lovable-uploads/73262649-413c-4ed4-9248-1138e844ace7.png" className="w-8 h-8" alt="Welcome" />,
    highlight: null,
    action: null,
    image: "/lovable-uploads/73262649-413c-4ed4-9248-1138e844ace7.png"
  }, {
    title: "Mint Your Magic Points",
    description: "Grab some free points – your trusty in-game currency. No need to risk your own gold yet!",
    icon: <img src="/lovable-uploads/90de812c-ed2e-41af-bc5b-33f452833151.png" className="w-8 h-8" alt="Mint Points" />,
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
      </Dialog>,
    image: "/lovable-uploads/90de812c-ed2e-41af-bc5b-33f452833151.png"
  }, {
    title: "Bet Like a Boss",
    description: "Wager your points on any Solana chain token. Crank up the multiplier and watch your points soar!",
    icon: <img src="/lovable-uploads/0107f44c-b620-4ddc-8263-65650ed1ba7b.png" className="w-8 h-8" alt="Betting" />,
    highlight: "playground",
    action: <Link to="/betting">
        <Button variant="default" className="mt-4 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700" onClick={handleNextStep}>
          Go to Playground
        </Button>
      </Link>,
    image: "/lovable-uploads/0107f44c-b620-4ddc-8263-65650ed1ba7b.png"
  }, {
    title: "Climb the Trader's Throne",
    description: "Show off your betting skills and rise through the leaderboard ranks to reach legendary status!",
    icon: <img src="/lovable-uploads/6b0abde7-e707-444b-ae6c-40795243d6f7.png" className="w-8 h-8" alt="Leaderboard" />,
    highlight: "leaderboard",
    action: <Link to="/#leaderboard">
        <Button variant="default" className="mt-4 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700" onClick={handleNextStep}>
          View Leaderboard
        </Button>
      </Link>,
    image: "/lovable-uploads/6b0abde7-e707-444b-ae6c-40795243d6f7.png"
  }, {
    title: "Unlock Elite Powers",
    description: "Visit your profile and earn 2000 PXB points as a welcome bonus!",
    icon: <img src="/lovable-uploads/be886d35-fbcb-4675-926c-38691ad3e311.png" className="w-8 h-8" alt="Gift" />,
    highlight: "profile",
    action: <Button variant="default" className="mt-4 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700" onClick={handleClaimPoints} disabled={hasClaimedPoints}>
        {hasClaimedPoints ? "Points Claimed!" : "Claim 2000 PXB"}
      </Button>,
    image: "/lovable-uploads/be886d35-fbcb-4675-926c-38691ad3e311.png"
  }];

  return <div className={`flex justify-center items-center w-full my-4 md:my-12 mx-auto ${isMobile ? 'max-w-[300px]' : 'max-w-[600px]'}`}>
      <motion.div 
        className={`relative ${isMobile ? 'w-[300px] h-[400px]' : 'w-[400px] md:w-[600px] h-[300px] md:h-[400px]'} flex items-center justify-center rounded-2xl overflow-hidden`} 
        style={{
          perspective: '1000px',
          transformStyle: 'preserve-3d'
        }} 
        initial={{
          opacity: 0
        }} 
        animate={{
          opacity: 1
        }} 
        transition={{
          duration: 0.8
        }}
      >
        <motion.div className="absolute inset-0 w-full h-full" style={{
          transform: 'rotateX(10deg) rotateY(5deg)',
          transformStyle: 'preserve-3d'
        }}>
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/90 to-blue-950/90 
                        backdrop-blur-md rounded-2xl border border-indigo-500/30 shadow-[0_0_15px_rgba(79,70,229,0.3)]
                        overflow-hidden z-0">
            
            <div className="absolute inset-0 opacity-20">
              <div className="h-full w-full" style={{
              backgroundImage: 'linear-gradient(to right, #4f46e5 1px, transparent 1px), linear-gradient(to bottom, #4f46e5 1px, transparent 1px)',
              backgroundSize: '25px 25px',
              transform: 'perspective(500px) rotateX(10deg) translateZ(0px)'
            }}></div>
            </div>
            
            <motion.div className="absolute h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent" style={{
            top: '0%',
            left: 0
          }} animate={{
            top: ['0%', '100%', '0%']
          }} transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'linear'
          }} />
            
            {[...Array(10)].map((_, i) => <motion.div key={i} className="absolute rounded-full" style={{
            width: Math.random() * 80 + 30,
            height: Math.random() * 80 + 30,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: `radial-gradient(circle, rgba(79,70,229,0.3) 0%, rgba(79,70,229,0) 70%)`,
            filter: "blur(20px)",
            opacity: 0.5
          }} animate={{
            opacity: [0.2, 0.5, 0.2],
            scale: [1, 1.2, 1]
          }} transition={{
            duration: 4 + Math.random() * 4,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
            delay: i * 0.3
          }} />)}
          </div>
          
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentStep} 
              style={{
                transformStyle: 'preserve-3d',
                transform: 'translateZ(20px)'
              }} 
              initial={{
                opacity: 0,
                y: 20,
                rotateX: -5
              }} 
              animate={{
                opacity: 1,
                y: 0,
                rotateX: 0
              }} 
              exit={{
                opacity: 0,
                y: -20,
                rotateX: 5
              }} 
              transition={{
                duration: 0.5
              }} 
              className="relative z-10 text-center p-4 sm:p-6 w-full h-full flex flex-col justify-center bg-black/65"
            >
              <div className={`flex ${isMobile ? 'flex-col' : 'flex-col md:flex-row'} items-center justify-center gap-3 md:gap-6`}>
                <motion.div 
                  className={`w-full ${isMobile ? 'w-[120px]' : 'md:w-1/2'} flex justify-center items-center mb-2 md:mb-0`} 
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: 'translateZ(40px)'
                  }}
                >
                  <img 
                    src={steps[currentStep].image} 
                    alt={steps[currentStep].title} 
                    className={`${isMobile ? 'w-[100px]' : 'w-[120px] md:w-[200px]'} h-auto rounded-lg object-cover border border-indigo-400/30 shadow-[0_0_15px_rgba(79,70,229,0.2)]`} 
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: 'translateZ(10px) rotateY(-5deg)'
                    }} 
                  />
                </motion.div>
                
                <div className={`w-full ${isMobile ? 'mt-2' : 'md:w-1/2'} flex flex-col items-center md:items-start`}>
                  <div className="mb-2 md:mb-4 flex justify-center md:justify-start">
                    <motion.div 
                      className="p-2 rounded-full bg-indigo-900/50 border border-indigo-500/30 shadow-[0_0_10px_rgba(79,70,229,0.3)]" 
                      whileHover={{
                        scale: 1.1,
                        rotate: 5
                      }} 
                      style={{
                        transformStyle: 'preserve-3d',
                        transform: 'translateZ(30px)'
                      }}
                    >
                      {steps[currentStep].icon}
                    </motion.div>
                  </div>
                  
                  <motion.h2 
                    className={`${isMobile ? 'text-lg' : 'text-xl md:text-2xl'} font-bold mb-2 bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent`} 
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: 'translateZ(20px)'
                    }}
                  >
                    {steps[currentStep].title}
                  </motion.h2>
                  
                  <motion.p 
                    className={`text-indigo-200/80 ${isMobile ? 'text-xs' : 'text-xs md:text-sm'} mb-2 md:mb-4`} 
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: 'translateZ(15px)'
                    }}
                  >
                    {steps[currentStep].description}
                  </motion.p>
                  
                  <motion.div 
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: 'translateZ(25px)'
                    }}
                  >
                    {steps[currentStep].action}
                  </motion.div>
                </div>
              </div>
              
              <div className="mt-3 md:mt-6 flex justify-center space-x-2">
                {steps.map((_, index) => <motion.button key={index} className={`w-2 md:w-2.5 h-2 md:h-2.5 rounded-full transition-all ${currentStep === index ? 'bg-indigo-400 scale-125' : 'bg-gray-600 hover:bg-gray-500'}`} onClick={() => setCurrentStep(index)} aria-label={`Go to step ${index + 1}`} whileHover={{
                scale: 1.2
              }} style={{
                transformStyle: 'preserve-3d',
                transform: 'translateZ(20px)'
              }} />)}
              </div>
              
              <div className="absolute bottom-2 md:bottom-4 right-2 md:right-4 flex space-x-2">
                {currentStep > 0 && <Button variant="ghost" size="sm" className="text-xs md:text-sm text-white/70 hover:text-white hover:bg-indigo-600/30 z-10 px-2 py-1 md:px-4 md:py-2" onClick={handlePrevStep} style={{
                transformStyle: 'preserve-3d',
                transform: 'translateZ(20px)'
              }}>
                    Back
                  </Button>}
                
                {currentStep < steps.length - 1 ? (
                  <>
                    <Button variant="ghost" size="sm" className="text-xs md:text-sm text-white hover:bg-indigo-600/30 z-10 px-2 py-1 md:px-4 md:py-2" onClick={handleNextStep} style={{
                      transformStyle: 'preserve-3d',
                      transform: 'translateZ(20px)'
                    }}>
                      Skip
                    </Button>
                    
                    <Button variant="default" size="sm" className="text-xs md:text-sm bg-indigo-600 hover:bg-indigo-700 text-white z-10 px-2 py-1 md:px-4 md:py-2 flex items-center" onClick={handleNextStep} style={{
                      transformStyle: 'preserve-3d',
                      transform: 'translateZ(20px)'
                    }}>
                      Next <ChevronRight className="ml-1 h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                  </>
                ) : (
                  <Button variant="default" size="sm" className="text-xs md:text-sm bg-green-600 hover:bg-green-700 text-white z-10 px-2 py-1 md:px-4 md:py-2" onClick={handleNextStep} style={{
                    transformStyle: 'preserve-3d',
                    transform: 'translateZ(20px)'
                  }}>
                    Finish
                  </Button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
          
          <div className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden">
            <div className="absolute inset-0 rounded-2xl border border-indigo-400/20"></div>
            <div className="absolute inset-0 rounded-2xl border-2 border-indigo-400/10 blur-[1px]"></div>
            <div className="absolute -inset-[1px] rounded-2xl border border-indigo-300/10 blur-[2px]"></div>
            
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent"></div>
            
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>
          </div>
        </motion.div>
      </motion.div>
    </div>;
};
export default InteractiveTour;
