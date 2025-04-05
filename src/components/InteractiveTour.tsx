import React, { useState, useEffect, useRef } from 'react';
import { motion, HTMLMotionProps, AnimationProps } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import PXBOnboarding from '@/components/PXBOnboarding';
import { Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'sonner';
import { ChevronRight, Upload, Loader2, Cpu, Zap, BookOpen } from 'lucide-react';
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
  const [videoSources, setVideoSources] = useState<string[]>(Array(5).fill(''));
  const [videoLoadErrors, setVideoLoadErrors] = useState<boolean[]>(Array(5).fill(false));
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

  const mainVideoUrl = "https://vjerwqqhcedemgfgfzbg.supabase.co/storage/v1/object/public/tourvideo/Untitled%20video%20-%20Made%20with%20Clipchamp%20(7)%20(online-video-cutter.com).mp4";
  const fallbackVideoUrl = "https://vjerwqqhcedemgfgfzbg.supabase.co/storage/v1/object/public/tourvideo/tour_fallback.mp4";
  
  useEffect(() => {
    setCurrentStep(0);
    const tourCompleted = localStorage.getItem('pxb-tour-completed');
    if (tourCompleted) {
      setCurrentStep(0);
    }
    
    const fetchVideos = async () => {
      try {
        const newVideoSources = Array(5).fill(mainVideoUrl);
        setVideoSources(newVideoSources);
        
        const { data: files, error } = await supabase.storage
          .from('tourvideo')
          .list();
          
        if (!error && files) {
          for (let i = 0; i < 5; i++) {
            const stepPrefix = `tour_step_${i + 1}_`;
            const matchingFiles = files.filter(f => f.name.startsWith(stepPrefix));
            
            if (matchingFiles.length > 0) {
              const latestFile = matchingFiles.sort((a, b) => 
                b.name.localeCompare(a.name)
              )[0];
              
              const { data } = supabase.storage
                .from('tourvideo')
                .getPublicUrl(latestFile.name);
                
              newVideoSources[i] = `${data.publicUrl}?t=${Date.now()}`;
            }
          }
          
          setVideoSources(newVideoSources);
        }
      } catch (err) {
        console.error("Error fetching tour videos:", err);
      }
    };
    
    fetchVideos();
  }, []);

  const playVideoIfVisible = (index: number) => {
    if (index === currentStep && videoRefs.current[index] && !videoLoadErrors[index]) {
      const videoElement = videoRefs.current[index];
      if (videoElement) {
        const playPromise = videoElement.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.warn('Error playing video:', error);
            const newErrors = [...videoLoadErrors];
            newErrors[index] = true;
            setVideoLoadErrors(newErrors);
          });
        }
      }
    }
  };

  useEffect(() => {
    const newErrors = [...videoLoadErrors];
    newErrors[currentStep] = false;
    setVideoLoadErrors(newErrors);
    
    setTimeout(() => {
      playVideoIfVisible(currentStep);
    }, 100);
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
      const fileName = `tour_step_${currentStep + 1}_${Date.now()}.${file.name.split('.').pop()}`;
      const {
        data,
        error
      } = await supabase.storage.from('tourvideo').upload(fileName, file, {
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
      } = supabase.storage.from('tourvideo').getPublicUrl(fileName);
      
      const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;
      
      const newVideoSources = [...videoSources];
      newVideoSources[currentStep] = cacheBustedUrl;
      setVideoSources(newVideoSources);
      
      const newErrors = [...videoLoadErrors];
      newErrors[currentStep] = false;
      setVideoLoadErrors(newErrors);
      
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

  const placeholderImages = [
    "/lovable-uploads/73262649-413c-4ed4-9248-1138e844ace7.png",
    "/lovable-uploads/90de812c-ed2e-41af-bc5b-33f452833151.png", 
    "/lovable-uploads/0107f44c-b620-4ddc-8263-65650ed1ba7b.png", 
    "/lovable-uploads/6b0abde7-e707-444b-ae6c-40795243d6f7.png",
    "/lovable-uploads/be886d35-fbcb-4675-926c-38691ad3e311.png"
  ];
  
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
    const placeholderImage = placeholderImages[index];
    const videoClassName = size === 'small' 
      ? "w-[100px] h-auto rounded-lg object-cover border border-indigo-400/30 shadow-[0_0_15px_rgba(79,70,229,0.2)]" 
      : "w-[200px] h-auto rounded-lg object-cover border border-indigo-400/30 shadow-[0_0_15px_rgba(79,70,229,0.2)]";
    
    const placeholderClassName = size === 'small' 
      ? "w-[100px] h-[100px] flex items-center justify-center rounded-lg border border-indigo-400/30 shadow-[0_0_15px_rgba(79,70,229,0.2)] bg-indigo-900/30" 
      : "w-[200px] h-[150px] flex items-center justify-center rounded-lg border border-indigo-400/30 shadow-[0_0_15px_rgba(79,70,229,0.2)] bg-indigo-900/30";
    
    const imageClassName = size === 'small'
      ? "w-[100px] h-[100px] object-cover rounded-lg border border-indigo-400/30 shadow-[0_0_15px_rgba(79,70,229,0.2)]"
      : "w-[200px] h-[150px] object-cover rounded-lg border border-indigo-400/30 shadow-[0_0_15px_rgba(79,70,229,0.2)]";
    
    const uploadIconSize = size === 'small' ? "w-8 h-8" : "w-12 h-12";

    if (videoLoadErrors[index] || !videoUrl) {
      return (
        <div className="relative">
          <video 
            src="https://vjerwqqhcedemgfgfzbg.supabase.co/storage/v1/object/sign/tourvideo/Untitled%20video%20-%20Made%20with%20Clipchamp%20(7)%20(online-video-cutter.com).mp4?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJ0b3VydmlkZW8vVW50aXRsZWQgdmlkZW8gLSBNYWRlIHdpdGggQ2xpcGNoYW1wICg3KSAob25saW5lLXZpZGVvLWN1dHRlci5jb20pLm1wNCIsImlhdCI6MTc0MjcyNTgxOSwiZXhwIjoxNzc0MjYxODE5fQ.ghAwVrE-1mXQiHgZ579j6cjDtXGno-mo9LSWwhTLYhk"
            className={imageClassName}
            autoPlay
            loop
            muted
            playsInline
            style={{
              transformStyle: 'preserve-3d',
              transform: 'translateZ(10px) rotateY(-5deg)'
            }}
            onError={(e) => {
              console.error("Error loading fallback video:", e);
              const target = e.target as HTMLVideoElement;
              target.style.display = 'none';
              // Find parent and add fallback image
              if (target.parentElement) {
                const fallbackImg = document.createElement('img');
                fallbackImg.src = placeholderImage;
                fallbackImg.className = imageClassName;
                fallbackImg.style.transformStyle = 'preserve-3d';
                fallbackImg.style.transform = 'translateZ(10px) rotateY(-5deg)';
                target.parentElement.appendChild(fallbackImg);
              }
            }}
          />
          {userProfile?.id === 'admin' && (
            <button 
              onClick={triggerFileInput} 
              className="absolute -bottom-2 -right-2 p-1 bg-indigo-900/80 rounded-full hover:bg-indigo-800/90 transition-colors"
            >
              <Upload className="h-4 w-4 text-indigo-200" />
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="relative">
        <video 
          ref={el => videoRefs.current[index] = el} 
          src={videoUrl} 
          className={videoClassName} 
          style={{
            transformStyle: 'preserve-3d',
            transform: 'translateZ(10px) rotateY(-5deg)'
          }} 
          autoPlay 
          loop 
          muted 
          playsInline 
          onError={e => {
            console.error(`Error loading video for step ${index + 1}:`, e);
            const newErrors = [...videoLoadErrors];
            newErrors[index] = true;
            setVideoLoadErrors(newErrors);
          }} 
        />
        {userProfile?.id === 'admin' && (
          <button 
            onClick={triggerFileInput} 
            className="absolute -bottom-2 -right-2 p-1 bg-indigo-900/80 rounded-full hover:bg-indigo-800/90 transition-colors"
          >
            <Upload className="h-4 w-4 text-indigo-200" />
          </button>
        )}
      </div>
    );
  };

  const renderSocialButtons = () => {
    return (
      <motion.div 
        className="absolute bottom-8 left-8 flex space-x-3 z-20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.3 }}
      >
        <a 
          href="https://x.com/PumpXBounty" 
          target="_blank" 
          rel="noopener noreferrer"
          className="relative group"
        >
          <div className="absolute inset-0 bg-[#000000]/20 rounded-full blur-md 
              group-hover:bg-[#000000]/40 transition-all duration-300"></div>
          <Button 
            size="sm" 
            variant="ghost" 
            className="bg-[#111]/50 border border-[#000000]/30 
                      hover:bg-[#000000]/20 hover:border-[#000000]/50 
                      text-white rounded-full h-9 w-9 p-0 flex items-center justify-center"
          >
            <img 
              src="/lovable-uploads/5bd9e4de-2164-4b82-9ff6-6d123e221c1c.png" 
              alt="X (formerly Twitter)" 
              className="h-4 w-4" 
            />
          </Button>
        </a>
        
        <a 
          href="https://t.me/pumpxbounty" 
          target="_blank" 
          rel="noopener noreferrer"
          className="relative group"
        >
          <div className="absolute inset-0 bg-[#0088cc]/20 rounded-full blur-md 
              group-hover:bg-[#0088cc]/40 transition-all duration-300"></div>
          <Button 
            size="sm" 
            variant="ghost" 
            className="bg-[#111]/50 border border-[#0088cc]/30 
                      hover:bg-[#0088cc]/20 hover:border-[#0088cc]/50 
                      text-white rounded-full h-9 w-9 p-0 flex items-center justify-center"
          >
            <img 
              src="/lovable-uploads/453531e5-a1ba-4b7f-8283-33c16f62306b.png" 
              alt="Telegram" 
              className="h-4 w-4" 
            />
          </Button>
        </a>
        
        <a 
          href="https://pumpxbounty.gitbook.io/pumpxbounty" 
          target="_blank" 
          rel="noopener noreferrer"
          className="relative group"
        >
          <div className="absolute inset-0 bg-[#00A672]/20 rounded-full blur-md 
              group-hover:bg-[#00A672]/40 transition-all duration-300"></div>
          <Button 
            size="sm" 
            variant="ghost" 
            className="bg-[#111]/50 border border-[#00A672]/30 
                      hover:bg-[#00A672]/20 hover:border-[#00A672]/50 
                      text-white rounded-full h-9 w-9 p-0 flex items-center justify-center"
          >
            <BookOpen className="h-4 w-4 text-[#00A672]" />
          </Button>
        </a>
      </motion.div>
    );
  };

  return (
    <div className={`flex justify-center items-center w-full my-4 md:my-8 mx-auto ${isMobile ? 'max-w-[300px]' : 'max-w-[600px]'}`}>
      {fileInput}
      <motion.div 
        className={`relative ${isMobile ? 'w-[300px] h-[350px]' : 'w-[400px] md:w-[600px] h-[250px] md:h-[330px]'} flex items-center justify-center rounded-2xl overflow-hidden`} 
        style={{ perspective: '1000px' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div 
          className="absolute inset-0 w-full h-full [transform-style:preserve-3d]" 
          style={{ 
            transform: isHovering ? 'rotateX(0deg) rotateY(0deg)' : 'rotateX(10deg) rotateY(5deg)',
            transition: 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }} 
          onMouseEnter={() => setIsHovering(true)} 
          onMouseLeave={() => setIsHovering(false)}
        >
          <div 
            className="absolute inset-0 bg-gradient-to-r from-[#06050b]/95 to-[#0c0a15]/95 
                    backdrop-blur-md rounded-2xl border border-indigo-500/20 shadow-[0_0_15px_rgba(79,70,229,0.2)]
                    overflow-hidden z-0" 
            style={{
              boxShadow: isHovering ? '0 0 25px rgba(125, 97, 229, 0.5)' : '0 0 15px rgba(79, 70, 229, 0.2)',
              borderColor: isHovering ? 'rgba(125, 97, 229, 0.4)' : 'rgba(79, 70, 229, 0.2)',
              transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}
          >
            <motion.div 
              className="absolute h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"
              animate={{ top: ['0%', '100%'] }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{ 
                top: 0,
                left: 0
              }}
            />
            
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-400/40 rounded-tl-lg"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-indigo-400/40 rounded-tr-lg"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-indigo-400/40 rounded-bl-lg"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-400/40 rounded-br-lg"></div>
            
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-[#33C3F0]"
                animate={{
                  opacity: [0.2, 0.4, 0.2],
                  scale: [1, 1.2, 1]
                }}
                transition={{
                  duration: 4 + Math.random() * 4,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                  delay: i * 0.3
                }}
                style={{
                  width: `${Math.random() * 8 + 2}px`,
                  height: `${Math.random() * 8 + 2}px`,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  filter: "blur(20px)",
                  opacity: 0.4,
                  zIndex: Math.random() > 0.5 ? 1 : -1
                }}
              />
            ))}
          </div>
          
          <motion.div className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden">
            <div className="absolute inset-0 rounded-2xl border border-indigo-400/10"></div>
            <div className="absolute inset-0 rounded-2xl border-2 border-indigo-400/5 blur-[1px]"></div>
            <div className="absolute -inset-[1px] rounded-2xl border border-indigo-300/5 blur-[2px]"></div>
            
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent"></div>
            
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/10 to-transparent"></div>
            
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-cyan-400/40"></div>
            <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-indigo-400/40"></div>
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-indigo-400/40"></div>
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-cyan-400/40"></div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default InteractiveTour;
