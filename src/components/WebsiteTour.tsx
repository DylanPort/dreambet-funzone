
import React, { useState, useEffect, useRef } from "react";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  Trophy, 
  Coins, 
  BarChart3, 
  Users, 
  Zap,
  PartyPopper,
  ChevronRight,
  CheckCircle2,
  Star,
  ArrowRight,
  LockOpen
} from "lucide-react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import useEmblaCarousel from "embla-carousel-react";

const WebsiteTour = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "center" });
  const [progress, setProgress] = useState(0);
  const [xp, setXp] = useState(0);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [unlockedSlides, setUnlockedSlides] = useState([0]);
  
  useEffect(() => {
    if (emblaApi) {
      emblaApi.on('select', () => {
        const currentSlide = emblaApi.selectedScrollSnap();
        setActiveSlide(currentSlide);
        setProgress(((currentSlide + 1) / features.length) * 100);
        
        // Add XP when advancing to a new slide
        if (!achievements.includes(`slide_${currentSlide}`)) {
          const newAchievements = [...achievements, `slide_${currentSlide}`];
          setAchievements(newAchievements);
          setXp(prev => prev + 25);
          
          // Unlock next slide
          if (!unlockedSlides.includes(currentSlide + 1) && currentSlide + 1 < features.length) {
            setUnlockedSlides(prev => [...prev, currentSlide + 1]);
          }
        }
      });
    }
  }, [emblaApi, achievements]);
  
  const features = [
    {
      title: "Welcome to PumpXBounty!",
      description: "Start your crypto adventure in the PXB ecosystem where you earn rewards by completing bounties, placing bets, and climbing the leaderboard.",
      image: "/lovable-uploads/24e94b9d-6b95-4cee-9dbc-c78f440e3f68.png",
      icon: <PartyPopper className="h-6 w-6 text-green-400" />,
      color: "from-purple-500 to-blue-500",
      achievement: "Welcome Explorer",
      tip: "Click through this tour to earn XP and unlock all features!"
    },
    {
      title: "PXB Points Playground",
      description: "Bet on token performance, predict price movements, and win big! PXB Points are your gateway to competing in the crypto prediction arena.",
      image: "/lovable-uploads/5fbe719e-2eae-4c8e-ade1-fb21115ea119.png",
      icon: <Coins className="h-6 w-6 text-yellow-400" />,
      color: "from-green-500 to-cyan-500",
      achievement: "Betting Maestro",
      tip: "Higher risk bets offer bigger rewards! Watch for tokens with high volatility."
    },
    {
      title: "Track Your Performance",
      description: "Monitor all your active and past bets in the PXB Space. Analyze your performance data and improve your prediction strategies.",
      image: "/lovable-uploads/575dd9fd-27d8-443c-8167-0af64089b9cc.png",
      icon: <BarChart3 className="h-6 w-6 text-blue-400" />,
      color: "from-blue-500 to-indigo-500",
      achievement: "Analytics Pro",
      tip: "Use the historical charts to find patterns in token behavior before placing bets."
    },
    {
      title: "Complete Bounties",
      description: "Tackle crypto quests and earn rewards! Bounties range from community engagement to trading challenges, with PXB Points as your prize.",
      image: "/lovable-uploads/96ff57ae-37d6-4216-9d6f-a6227e40f0dd.png",
      icon: <Zap className="h-6 w-6 text-yellow-300" />,
      color: "from-orange-500 to-pink-500",
      achievement: "Bounty Hunter",
      tip: "New bounties are posted daily - check back frequently for exclusive opportunities!"
    },
    {
      title: "Dominate the Leaderboard",
      description: "Compete against traders worldwide to climb the PXB rankings. Top performers earn exclusive rewards and community recognition.",
      image: "/lovable-uploads/442acdc8-611f-4c96-883e-d41b783890d2.png",
      icon: <Trophy className="h-6 w-6 text-amber-400" />,
      color: "from-purple-600 to-blue-400",
      achievement: "Leaderboard Legend", 
      tip: "Weekly resets give everyone a fresh chance to top the charts - plan your strategy!"
    }
  ];
  
  const handleCompleteJourney = () => {
    setXp(prev => prev + 100);
    setAchievements(prev => [...prev, "journey_complete"]);
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      <div className="text-center mb-6 animate-fade-in">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-green-300 to-yellow-300 bg-clip-text text-transparent">
          Your PumpXBounty Adventure
        </h2>
        <p className="text-white/70 mt-2">Complete the interactive tour to master the platform</p>
      </div>
      
      {/* Game UI Elements */}
      <div className="flex justify-between items-center mb-4 glass-panel rounded-lg p-3">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-400" />
          <span className="text-yellow-400 font-bold">{xp} XP</span>
        </div>
        
        <div className="flex-1 mx-4">
          <div className="flex justify-between text-xs mb-1">
            <span>Tour Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        <div className="text-xs text-white/70">
          <span className="font-bold text-green-400">{achievements.length}</span> achievements unlocked
        </div>
      </div>
      
      <Carousel
        ref={emblaRef}
        className="w-full"
        onSelect={(api) => {
          // The select handler is now managed in the useEffect hook
        }}
      >
        <CarouselContent>
          {features.map((feature, index) => (
            <CarouselItem key={index} className="md:basis-4/5 lg:basis-3/4">
              <div className="p-1">
                <motion.div 
                  className={`glass-panel h-full rounded-xl overflow-hidden flex flex-col ${!unlockedSlides.includes(index) && index !== 0 ? 'opacity-70' : ''}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className={`bg-gradient-to-r ${feature.color} p-4 flex items-center gap-3`}>
                    <div className="p-2 rounded-full bg-white/10">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-bold text-white">{feature.title}</h3>
                    
                    {achievements.includes(`slide_${index}`) && (
                      <CheckCircle2 className="h-5 w-5 text-green-300 ml-auto" />
                    )}
                  </div>
                  
                  <div className="relative p-4 flex-grow">
                    <div className="absolute -top-4 right-4 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-bold">
                      Stage {index + 1}/{features.length}
                    </div>
                    
                    {!unlockedSlides.includes(index) && index !== 0 ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-10">
                        <LockOpen className="h-10 w-10 text-yellow-400 mb-2" />
                        <p className="text-center text-white">Complete previous stages to unlock</p>
                      </div>
                    ) : null}
                    
                    <p className="text-white/80 mb-3 text-sm">{feature.description}</p>
                    
                    <div className="relative h-40 overflow-hidden rounded-lg border border-white/10 mb-3">
                      <img
                        src={feature.image}
                        alt={feature.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    </div>
                    
                    {/* Achievement & Tip */}
                    <div className="bg-black/30 rounded-lg p-3 mb-3 text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <Trophy className="h-4 w-4 text-yellow-400" />
                        <span className="font-medium text-yellow-200">Achievement: {feature.achievement}</span>
                      </div>
                      <p className="text-white/80 pl-6">Pro Tip: {feature.tip}</p>
                    </div>
                    
                    <Button 
                      className={`mt-auto w-full justify-center text-sm ${
                        index === features.length - 1 ? 'bg-green-600 hover:bg-green-700' : 'bg-white/10 hover:bg-white/20'
                      } text-white`}
                      onClick={index === features.length - 1 ? handleCompleteJourney : undefined}
                    >
                      {index === features.length - 1 ? "Complete Adventure & Earn 100 XP!" : "Continue"}
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </motion.div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        <div className="flex justify-center mt-4 gap-2">
          {features.map((_, index) => (
            <motion.div
              key={index}
              className={`h-2 rounded-full cursor-pointer ${activeSlide === index ? 'w-8 bg-green-400' : 'w-2 bg-white/20'} ${!unlockedSlides.includes(index) ? 'opacity-50' : ''}`}
              initial={{ scale: 1 }}
              animate={{ scale: activeSlide === index ? [1, 1.2, 1] : 1 }}
              transition={{ duration: 0.5 }}
              onClick={() => {
                if (unlockedSlides.includes(index)) {
                  emblaApi?.scrollTo(index);
                }
              }}
            />
          ))}
        </div>
        
        <div className="flex justify-center mt-4">
          <CarouselPrevious className="relative static mr-2 translate-y-0" />
          <CarouselNext className="relative static ml-2 translate-y-0" />
        </div>
        
        {/* Achievements unlocked notification */}
        {achievements.length > 0 && (
          <div className="mt-4 text-center text-xs text-white/70">
            <span className="text-green-400 font-medium">Achievements unlocked:</span> {achievements.filter(a => a !== "journey_complete").map(a => a.replace('slide_', 'Stage ')).join(', ')}
            {achievements.includes("journey_complete") && ", Master Explorer"}
          </div>
        )}
      </Carousel>
    </div>
  );
};

export default WebsiteTour;
