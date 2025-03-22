
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import PXBOnboarding from '@/components/PXBOnboarding';
import { Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'sonner';
import { ChevronRight, Upload, Loader2, Cpu, Zap } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';

interface PXBOnboardingProps {
  onClose: () => void;
}

const InteractiveTour = () => {
  const isMobile = useIsMobile();
  const [currentStep, setCurrentStep] = useState(0);
  const [hasClaimedPoints, setHasClaimedPoints] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [videoSources, setVideoSources] = useState<string[]>(["/lovable-uploads/73262649-413c-4ed4-9248-1138e844ace7.png", "/lovable-uploads/90de812c-ed2e-41af-bc5b-33f452833151.png", "/lovable-uploads/0107f44c-b620-4ddc-8263-65650ed1ba7b.png", "/lovable-uploads/6b0abde7-e707-444b-ae6c-40795243d6f7.png", "/lovable-uploads/be886d35-fbcb-4675-926c-38691ad3e311.png"]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([null, null, null, null, null]);
  const {
    userProfile,
    addPointsToUser
  } = usePXBPoints();
  const {
    connected
  } = useWallet();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const COOLDOWN_TIME = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
  const [cooldownRemaining, setCooldownRemaining] = useState<number | null>(null);
  const [lastClaimTime, setLastClaimTime] = useState<number | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    setCurrentStep(0);
    const tourCompleted = localStorage.getItem('pxb-tour-completed');
    if (tourCompleted) {
      setCurrentStep(0);
    }
    const mainVideoUrl = "https://vjerwqqhcedemgfgfzbg.supabase.co/storage/v1/object/sign/tourvideo/Untitled%20video%20-%20Made%20with%20Clipchamp%20(7)%20(online-video-cutter.com).mp4?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJ0b3VydmlkZW8vVW50aXRsZWQgdmlkZW8gLSBNYWRlIHdpdGggQ2xpcGNoYW1wICg3KSAob25saW5lLXZpZGVvLWN1dHRlci5jb20pLm1wNCIsImlhdCI6MTc0MjY2NTY1MiwiZXhwIjoxNzc0MjAxNjUyfQ.FOnoYScf0r244PUOjega7OzIC0KEEmB2O6l4T-_UY9E";
    const newVideoSources = [...videoSources];
    for (let i = 0; i < newVideoSources.length; i++) {
      newVideoSources[i] = mainVideoUrl;
    }
    setVideoSources(newVideoSources);
  }, []);

  const playVideoIfVisible = (index: number) => {
    if (index === currentStep && videoRefs.current[index]) {
      const videoElement = videoRefs.current[index];
      if (videoElement) {
        const playPromise = videoElement.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.warn('Error playing video:', error);
          });
        }
      }
    }
  };

  useEffect(() => {
    playVideoIfVisible(currentStep);
  }, [currentStep, videoSources]);

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

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      toast.error("Please upload a video file");
      return;
    }
    setIsUploading(true);
    try {
      const fileName = `step-${currentStep + 1}.${file.name.split('.').pop()}`;
      const {
        data,
        error
      } = await supabase.storage.from('tour-videos').upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });
      if (error) {
        throw error;
      }
      const {
        data: {
          publicUrl
        }
      } = supabase.storage.from('tour-videos').getPublicUrl(fileName);
      const newVideoSources = [...videoSources];
      newVideoSources[currentStep] = publicUrl;
      setVideoSources(newVideoSources);
      toast.success(`Video uploaded for Step ${currentStep + 1}`);
      setTimeout(() => {
        playVideoIfVisible(currentStep);
      }, 500);
    } catch (error) {
      console.error('Error uploading video:', error);
      toast.error("Failed to upload video. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const steps = [{
    title: "Welcome, Explorer!",
    description: "You've stumbled upon a treasure chest of opportunity in the wild Trenches!",
    icon: <img src="/lovable-uploads/73262649-413c-4ed4-9248-1138e844ace7.png" className="w-8 h-8" alt="Welcome" />,
    highlight: null,
    action: null,
    image: videoSources[0]
  }, {
    title: "Mint Your Magic Points",
    description: "Grab some free points – your trusty in-game currency. You can only mint once per wallet!",
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
    image: videoSources[1]
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
    image: videoSources[2]
  }, {
    title: "Climb the Trader's Throne",
    description: "Show off your betting skills and rise through the leaderboard ranks to reach legendary status!",
    icon: <img src="/lovable-uploads/6b0abde7-e707-444b-ae6c-40795243d6f7.png" className="w-8 h-8" alt="Leaderboard" />,
    highlight: "leaderboard",
    action: <Button variant="default" className="mt-4 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700" onClick={() => {
      handleNextStep();
      const leaderboardSection = document.getElementById('leaderboard');
      if (leaderboardSection) {
        leaderboardSection.scrollIntoView({
          behavior: 'smooth'
        });
      }
    }}>
      View Leaderboard
    </Button>,
    image: videoSources[3]
  }, {
    title: "Unlock Elite Powers",
    description: "Visit your profile and earn PXB points as a welcome bonus!",
    icon: <img src="/lovable-uploads/be886d35-fbcb-4675-926c-38691ad3e311.png" className="w-8 h-8" alt="Gift" />,
    highlight: "profile",
    action: <Link to="/profile">
        <Button variant="default" className="mt-4 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700" onClick={handleNextStep}>
          Go to Profile
        </Button>
      </Link>,
    image: videoSources[4]
  }];

  const fileInput = <Input ref={fileInputRef} type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />;

  const renderVideo = (index: number, size: 'small' | 'large') => {
    const videoUrl = videoSources[index];
    const videoClassName = size === 'small' ? "w-[100px] h-auto rounded-lg object-cover border border-indigo-400/30 shadow-[0_0_15px_rgba(79,70,229,0.2)]" : "w-[200px] h-auto rounded-lg object-cover border border-indigo-400/30 shadow-[0_0_15px_rgba(79,70,229,0.2)]";
    const placeholderClassName = size === 'small' ? "w-[100px] h-[100px] flex items-center justify-center rounded-lg border border-indigo-400/30 shadow-[0_0_15px_rgba(79,70,229,0.2)] bg-indigo-900/30" : "w-[200px] h-[150px] flex items-center justify-center rounded-lg border border-indigo-400/30 shadow-[0_0_15px_rgba(79,70,229,0.2)] bg-indigo-900/30";
    const uploadIconSize = size === 'small' ? "w-8 h-8" : "w-12 h-12";
    if (videoUrl) {
      return <video ref={el => videoRefs.current[index] = el} src={videoUrl} className={videoClassName} style={{
        transformStyle: 'preserve-3d',
        transform: 'translateZ(10px) rotateY(-5deg)'
      }} autoPlay loop muted playsInline onError={e => {
        console.error(`Error loading video for step ${index + 1}:`, e);
        const target = e.target as HTMLVideoElement;
        if (videoUrl && !videoUrl.includes('?')) {
          target.src = `${videoUrl}?t=${Date.now()}`;
        } else if (videoUrl && videoUrl.includes('?')) {
          target.src = `${videoUrl}&t=${Date.now()}`;
        }
      }} />;
    } else {
      return <div className={placeholderClassName}>
          <Upload className={`${uploadIconSize} text-indigo-400/50`} />
        </div>;
    }
  };

  return <div className={`flex justify-center items-center w-full my-4 md:my-8 mx-auto ${isMobile ? 'max-w-[300px]' : 'max-w-[600px]'}`}>
      {fileInput}
      <motion.div className={`relative ${isMobile ? 'w-[300px] h-[350px]' : 'w-[400px] md:w-[600px] h-[250px] md:h-[330px]'} flex items-center justify-center rounded-2xl overflow-hidden`} style={{
      perspective: '1000px',
      transformStyle: 'preserve-3d'
    }} initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} transition={{
      duration: 0.8
    }}>
        <motion.div className="absolute inset-0 w-full h-full" style={{
        transform: isHovering ? 'rotateX(0deg) rotateY(0deg)' : 'rotateX(10deg) rotateY(5deg)',
        transformStyle: 'preserve-3d',
        transition: 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
      }} onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/90 to-blue-950/90 
                        backdrop-blur-md rounded-2xl border border-indigo-500/30 shadow-[0_0_15px_rgba(79,70,229,0.3)]
                        overflow-hidden z-0" style={{
          boxShadow: isHovering ? '0 0 25px rgba(125, 97, 255, 0.7)' : '0 0 15px rgba(79, 70, 229, 0.3)',
          borderColor: isHovering ? 'rgba(125, 97, 255, 0.5)' : 'rgba(79, 70, 229, 0.3)',
          transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}>
            
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
            top: ['0%', '100%']
          }} transition={{
            duration: 10,
            repeat: Infinity,
            ease: "linear"
          }} />
            
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-400/50 rounded-tl-lg"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-indigo-400/50 rounded-tr-lg"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-indigo-400/50 rounded-bl-lg"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-400/50 rounded-br-lg"></div>
            
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
          
          <div className="absolute top-3 left-3 z-20">
            <motion.div 
              className="h-4 w-4 rounded-full bg-cyan-400/70"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <div className="absolute top-3 right-3 z-20">
            <motion.div 
              className="flex items-center justify-center h-6 w-6 rounded-full bg-indigo-900/70 border border-indigo-500/50"
              animate={{ borderColor: ['rgba(99, 102, 241, 0.3)', 'rgba(99, 102, 241, 0.7)', 'rgba(99, 102, 241, 0.3)'] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Cpu className="h-3 w-3 text-indigo-300" />
            </motion.div>
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
                rotateX: -5,
                filter: 'blur(10px)'
              }} 
              animate={{
                opacity: 1,
                y: 0,
                rotateX: 0,
                filter: 'blur(0px)'
              }} 
              exit={{
                opacity: 0,
                y: -20,
                rotateX: 5,
                filter: 'blur(10px)'
              }} 
              transition={{
                duration: 0.4,
                ease: [0.19, 1, 0.22, 1]
              }} 
              className="relative z-10 text-center p-4 sm:p-6 w-full h-full flex flex-col justify-center bg-black/85">
              {isMobile ? <ScrollArea className="h-full pr-2">
                  <div className="flex flex-col items-center justify-start py-2">
                    <div className="w-full w-[120px] flex justify-center items-center mb-4 relative">
                      {renderVideo(currentStep, 'small')}
                      
                      <motion.div 
                        className="absolute -bottom-1 -right-1 h-3 w-3 bg-cyan-400 rounded-full"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    </div>
                    
                    <div className="w-full mt-2 flex flex-col items-center">
                      
                      
                      <motion.h2 className="text-lg font-bold mb-2 bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent" style={{
                    transformStyle: 'preserve-3d',
                    transform: 'translateZ(20px)'
                  }}>
                        {steps[currentStep].title}
                      </motion.h2>
                      
                      <motion.p className="text-indigo-200/80 text-xs mb-2" style={{
                    transformStyle: 'preserve-3d',
                    transform: 'translateZ(15px)'
                  }}>
                        {steps[currentStep].description}
                      </motion.p>
                      
                      <motion.div style={{
                    transformStyle: 'preserve-3d',
                    transform: 'translateZ(25px)'
                  }}>
                        {steps[currentStep].action}
                      </motion.div>
                    </div>
                  </div>
                </ScrollArea> : <div className="flex flex-row items-center justify-center gap-6">
                  <motion.div className="w-1/2 flex justify-center items-center mb-0 relative" style={{
                transformStyle: 'preserve-3d',
                transform: 'translateZ(40px)'
              }}>
                    {renderVideo(currentStep, 'large')}
                    <Button variant="outline" size="icon" className="absolute bottom-2 right-2 bg-indigo-900/80 hover:bg-indigo-800 z-10 rounded-full" onClick={triggerFileInput} disabled={isUploading}>
                      {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    </Button>
                    
                    <motion.div 
                      className="absolute -top-1 -left-1 h-2 w-8 bg-gradient-to-r from-cyan-400 to-transparent rounded-full"
                      animate={{ opacity: [0.3, 0.7, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <motion.div 
                      className="absolute -bottom-1 -right-1 h-8 w-2 bg-gradient-to-t from-indigo-400 to-transparent rounded-full"
                      animate={{ opacity: [0.3, 0.7, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                    />
                  </motion.div>
                  
                  <div className="w-1/2 flex flex-col items-start">
                    <div className="mb-4 flex items-center justify-start">
                      <motion.div 
                        className="mr-2 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-900 border border-indigo-500/50"
                        animate={{ borderColor: ['rgba(99, 102, 241, 0.3)', 'rgba(99, 102, 241, 0.7)', 'rgba(99, 102, 241, 0.3)'] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <Zap className="h-2.5 w-2.5 text-indigo-300" />
                      </motion.div>
                      <div className="h-[1px] w-12 bg-gradient-to-r from-indigo-500/80 to-transparent"></div>
                    </div>
                    
                    <motion.h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent" style={{
                  transformStyle: 'preserve-3d',
                  transform: 'translateZ(20px)'
                }}>
                      {steps[currentStep].title}
                    </motion.h2>
                    
                    <motion.p className="text-indigo-200/80 text-sm mb-4" style={{
                  transformStyle: 'preserve-3d',
                  transform: 'translateZ(15px)'
                }}>
                      {steps[currentStep].description}
                    </motion.p>
                    
                    <motion.div style={{
                  transformStyle: 'preserve-3d',
                  transform: 'translateZ(25px)'
                }}>
                      {steps[currentStep].action}
                    </motion.div>
                  </div>
                </div>}
              
              <div className="mt-3 md:mt-5 flex justify-center space-x-2">
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
                
                {currentStep < steps.length - 1 ? <Button variant="default" size="sm" className="text-xs md:text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white z-10 px-2 py-1 md:px-4 md:py-2 flex items-center" onClick={handleNextStep} style={{
                transformStyle: 'preserve-3d',
                transform: 'translateZ(20px)'
              }}>
                    Next <ChevronRight className="ml-1 h-3 w-3 md:h-4 md:w-4" />
                  </Button> : <Button variant="default" size="sm" className="text-xs md:text-sm bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white z-10 px-2 py-1 md:px-4 md:py-2" onClick={handleNextStep} style={{
                transformStyle: 'preserve-3d',
                transform: 'translateZ(20px)'
              }}>
                    Finish
                  </Button>}
              </div>
            </motion.div>
          </AnimatePresence>
          
          <div className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden">
            <div className="absolute inset-0 rounded-2xl border border-indigo-400/20"></div>
            <div className="absolute inset-0 rounded-2xl border-2 border-indigo-400/10 blur-[1px]"></div>
            <div className="absolute -inset-[1px] rounded-2xl border border-indigo-300/10 blur-[2px]"></div>
            
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent"></div>
            
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>
            
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-cyan-400/60"></div>
            <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-indigo-400/60"></div>
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-indigo-400/60"></div>
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-cyan-400/60"></div>
          </div>
        </motion.div>
      </motion.div>
    </div>;
};

export default InteractiveTour;
