
import React, { useState } from "react";
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
  ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";

const WebsiteTour = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  
  const features = [
    {
      title: "Welcome to PumpXBounty!",
      description: "An exciting platform where you can earn rewards by participating in the crypto ecosystem.",
      image: "/lovable-uploads/24e94b9d-6b95-4cee-9dbc-c78f440e3f68.png",
      icon: <PartyPopper className="h-6 w-6 text-green-400" />,
      color: "from-purple-500 to-blue-500"
    },
    {
      title: "PXB Points Playground",
      description: "Bet on token performance, earn points, and climb the leaderboard.",
      image: "/lovable-uploads/5fbe719e-2eae-4c8e-ade1-fb21115ea119.png",
      icon: <Coins className="h-6 w-6 text-yellow-400" />,
      color: "from-green-500 to-cyan-500"
    },
    {
      title: "Track Your Bets",
      description: "Follow your active and past bets in the PXB Space.",
      image: "/lovable-uploads/575dd9fd-27d8-443c-8167-0af64089b9cc.png",
      icon: <BarChart3 className="h-6 w-6 text-blue-400" />,
      color: "from-blue-500 to-indigo-500"
    },
    {
      title: "Complete Bounties",
      description: "Earn rewards by completing tasks from the community.",
      image: "/lovable-uploads/96ff57ae-37d6-4216-9d6f-a6227e40f0dd.png",
      icon: <Zap className="h-6 w-6 text-yellow-300" />,
      color: "from-orange-500 to-pink-500"
    },
    {
      title: "Compete on the Leaderboard",
      description: "Rise through the ranks and showcase your trading prowess!",
      image: "/lovable-uploads/442acdc8-611f-4c96-883e-d41b783890d2.png",
      icon: <Trophy className="h-6 w-6 text-amber-400" />,
      color: "from-purple-600 to-blue-400"
    }
  ];
  
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-6 animate-fade-in">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-green-300 to-yellow-300 bg-clip-text text-transparent">
          How PumpXBounty Works
        </h2>
        <p className="text-white/70 mt-2">Navigate through our gamified tour to learn the features</p>
      </div>
      
      <Carousel
        className="w-full"
        opts={{
          loop: true,
          align: "center",
        }}
        onSelect={(api) => {
          const selectedIndex = api?.selectedScrollSnap();
          if (selectedIndex !== undefined) {
            setActiveSlide(selectedIndex);
          }
        }}
      >
        <CarouselContent>
          {features.map((feature, index) => (
            <CarouselItem key={index} className="md:basis-4/5 lg:basis-3/4">
              <div className="p-1">
                <motion.div 
                  className="glass-panel h-full rounded-xl overflow-hidden flex flex-col"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className={`bg-gradient-to-r ${feature.color} p-6 flex items-center gap-3`}>
                    <div className="p-2 rounded-full bg-white/10">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold text-white">{feature.title}</h3>
                  </div>
                  
                  <div className="relative p-6 flex-grow">
                    <div className="absolute -top-4 right-4 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-bold">
                      {index + 1}/{features.length}
                    </div>
                    
                    <p className="text-white/80 mb-4">{feature.description}</p>
                    
                    <div className="relative h-48 md:h-60 lg:h-72 overflow-hidden rounded-lg border border-white/10 mb-4">
                      <img
                        src={feature.image}
                        alt={feature.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    </div>
                    
                    <Button className="mt-auto bg-white/10 hover:bg-white/20 text-white">
                      {index === features.length - 1 ? "Get Started!" : "Learn More"}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </motion.div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        <div className="flex justify-center mt-6 gap-2">
          {features.map((_, index) => (
            <motion.div
              key={index}
              className={`h-2 rounded-full cursor-pointer ${activeSlide === index ? 'w-8 bg-green-400' : 'w-2 bg-white/20'}`}
              initial={{ scale: 1 }}
              animate={{ scale: activeSlide === index ? [1, 1.2, 1] : 1 }}
              transition={{ duration: 0.5 }}
              onClick={() => document.querySelector<HTMLElement>(`.embla__container > *:nth-child(${index + 1})`)?.scrollIntoView({ 
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center'
              })}
            />
          ))}
        </div>
        
        <div className="flex justify-center mt-4">
          <CarouselPrevious className="relative static mr-2 translate-y-0" />
          <CarouselNext className="relative static ml-2 translate-y-0" />
        </div>
      </Carousel>
    </div>
  );
};

export default WebsiteTour;
