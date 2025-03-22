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
  LockOpen,
  HelpCircle,
  Gift
} from "lucide-react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import useEmblaCarousel from "embla-carousel-react";
import { usePXBPoints } from "@/contexts/pxb/PXBPointsContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const WebsiteTour = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: "center" });
  const [progress, setProgress] = useState(0);
  const [xp, setXp] = useState(0);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [unlockedSlides, setUnlockedSlides] = useState([0]);
  const [quizAnswers, setQuizAnswers] = useState<{[key: string]: boolean}>({});
  const [tourCompleted, setTourCompleted] = useState(false);
  const { userProfile, mintPoints } = usePXBPoints();
  const navigate = useNavigate();
  
  const quizQuestions = {
    1: {
      question: "What can you earn by completing activities in PumpXBounty?",
      options: [
        { id: "a", text: "PXB Points", correct: true },
        { id: "b", text: "Bitcoin", correct: false },
        { id: "c", text: "Vacation days", correct: false }
      ]
    },
    2: {
      question: "What can you do with PXB Points?",
      options: [
        { id: "a", text: "Buy groceries", correct: false },
        { id: "b", text: "Place bets on token performance", correct: true },
        { id: "c", text: "Convert to fiat currency", correct: false }
      ]
    },
    3: {
      question: "What helps you improve your prediction strategies?",
      options: [
        { id: "a", text: "Watching YouTube tutorials", correct: false },
        { id: "b", text: "Asking friends for advice", correct: false },
        { id: "c", text: "Analyzing your performance data", correct: true }
      ]
    },
    4: {
      question: "What are bounties in PXB?",
      options: [
        { id: "a", text: "Job applications", correct: false },
        { id: "b", text: "Crypto quests that earn rewards", correct: true },
        { id: "c", text: "NFT collections", correct: false }
      ]
    },
    5: {
      question: "What happens when you top the PXB leaderboard?",
      options: [
        { id: "a", text: "You earn exclusive rewards", correct: true },
        { id: "b", text: "You become CEO of the company", correct: false },
        { id: "c", text: "Nothing special", correct: false }
      ]
    }
  };
  
  useEffect(() => {
    if (emblaApi) {
      emblaApi.on('select', () => {
        const currentSlide = emblaApi.selectedScrollSnap();
        setActiveSlide(currentSlide);
        setProgress(((currentSlide + 1) / features.length) * 100);
        
        if (!achievements.includes(`slide_${currentSlide}`)) {
          const newAchievements = [...achievements, `slide_${currentSlide}`];
          setAchievements(newAchievements);
          setXp(prev => prev + 25);
          
          if (!unlockedSlides.includes(currentSlide + 1) && currentSlide + 1 < features.length) {
            setUnlockedSlides(prev => [...prev, currentSlide + 1]);
          }
        }
      });
    }
  }, [emblaApi, achievements]);
  
  const handleCompleteJourney = async () => {
    if (userProfile && mintPoints) {
      setXp(prev => prev + 100);
      setAchievements(prev => [...prev, "journey_complete"]);
      setTourCompleted(true);
      
      try {
        await mintPoints(10000);
        toast.success("🎉 Congratulations! You've earned 10,000 PXB Points for completing the tour!", {
          duration: 5000
        });
        
        setTimeout(() => {
          navigate('/betting');
        }, 3000);
      } catch (error) {
        console.error("Error awarding points:", error);
        toast.error("There was an issue awarding your points. Please try again later.");
      }
    } else {
      toast.info("Connect your wallet to earn 10,000 PXB Points!");
      setXp(prev => prev + 100);
      setAchievements(prev => [...prev, "journey_complete"]);
      setTourCompleted(true);
      
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
    }
  };
  
  const handleContinueNavigation = () => {
    if (tourCompleted) {
      navigate('/betting');
      return;
    }
    
    if (activeSlide === features.length - 1 || activeSlide === unlockedSlides[unlockedSlides.length - 1]) {
      if (!userProfile) {
        toast.info("Let's get your wallet set up to earn PXB Points!", { duration: 3000 });
        navigate('/profile');
      } else {
        if (unlockedSlides.includes(activeSlide + 1)) {
          emblaApi?.scrollNext();
        } else {
          if (activeSlide === 4) {
            toast.info("Answer the quiz correctly to unlock the final stage!");
          } else {
            toast.info("Complete the current stage to unlock the next one!");
          }
        }
      }
      return;
    }
    
    if (unlockedSlides.includes(activeSlide + 1)) {
      emblaApi?.scrollNext();
    } else {
      if (activeSlide === 4) {
        toast.info("Answer the quiz correctly to unlock the final stage!");
      } else {
        toast.info("Complete the current stage to unlock the next one!");
      }
    }
  };
  
  const handleQuizAnswer = (slideIndex: number, optionId: string, isCorrect: boolean) => {
    setQuizAnswers({...quizAnswers, [slideIndex]: isCorrect});
    
    if (isCorrect) {
      setXp(prev => prev + 15);
      toast.success("Correct answer! +15 XP", {
        duration: 2000
      });
      
      if (slideIndex === 4 && !unlockedSlides.includes(5)) {
        setUnlockedSlides(prev => [...prev, 5]);
      }
    } else {
      toast.error("Try again! Read the slide carefully for hints.", {
        duration: 2000
      });
    }
  };
  
  const features = [
    {
      title: "Welcome to PumpXBounty!",
      description: "PXB is a crypto ecosystem where you can earn rewards, join the community, and participate in the exciting world of crypto predictions.",
      details: "As a new user, you'll start with PXB Points that you can use throughout the platform. Think of these as your passport to all the exciting features and opportunities that await you!",
      image: "/lovable-uploads/24e94b9d-6b95-4cee-9dbc-c78f440e3f68.png",
      icon: <PartyPopper className="h-6 w-6 text-green-400" />,
      color: "from-purple-500 to-blue-500",
      achievement: "Welcome Explorer",
      tip: "Complete this interactive tour to earn 10,000 PXB Points to kickstart your journey!"
    },
    {
      title: "PXB Points Playground",
      description: "Your PXB Points are the currency of our ecosystem. Use them to place bets on which tokens will perform well or poorly.",
      details: "In the betting arena, you predict whether a token's price will go UP ↗️ or DOWN ↘️ within a specified timeframe. If your prediction is correct, you'll win more PXB Points based on your stake and the odds!",
      image: "/lovable-uploads/5fbe719e-2eae-4c8e-ade1-fb21115ea119.png",
      icon: <Coins className="h-6 w-6 text-yellow-400" />,
      color: "from-green-500 to-cyan-500",
      achievement: "Betting Maestro",
      tip: "Higher risk bets offer bigger rewards! Look for tokens with high volatility but promising fundamentals."
    },
    {
      title: "Track Your Performance",
      description: "Every prediction you make is tracked in your personal dashboard, allowing you to analyze your success rate.",
      details: "The Performance Tracker shows your active bets, win/loss ratio, total earnings, and provides insights on how to improve your strategy. Use the historical data to spot trends and make more informed decisions in the future.",
      image: "/lovable-uploads/575dd9fd-27d8-443c-8167-0af64089b9cc.png",
      icon: <BarChart3 className="h-6 w-6 text-blue-400" />,
      color: "from-blue-500 to-indigo-500",
      achievement: "Analytics Pro",
      tip: "The most successful predictors frequently review their past performance to refine their strategies."
    },
    {
      title: "Complete Bounties",
      description: "Bounties are special missions that reward you with PXB Points upon completion.",
      details: "From simple tasks like joining our Discord to more complex challenges like correctly predicting a series of token movements, bounties offer a fun way to earn points while learning about crypto. New bounties are released regularly, so check back often for fresh opportunities!",
      image: "/lovable-uploads/96ff57ae-37d6-4216-9d6f-a6227e40f0dd.png",
      icon: <Zap className="h-6 w-6 text-yellow-300" />,
      color: "from-orange-500 to-pink-500",
      achievement: "Bounty Hunter",
      tip: "Prioritize bounties with the highest points-to-effort ratio to maximize your earnings!"
    },
    {
      title: "Dominate the Leaderboard",
      description: "All your activities contribute to your ranking on the PXB Leaderboard.",
      details: "Top performers each week receive exclusive rewards, recognition, and sometimes special access to new features or events. The leaderboard resets weekly, giving everyone a fair chance to climb to the top regardless of when they joined.",
      image: "/lovable-uploads/442acdc8-611f-4c96-883e-d41b783890d2.png",
      icon: <Trophy className="h-6 w-6 text-amber-400" />,
      color: "from-purple-600 to-blue-400",
      achievement: "Leaderboard Legend", 
      tip: "Consistency is key to topping the leaderboard - participate daily for the best results!"
    },
    {
      title: "Congratulations!",
      description: "You've completed the PumpXBounty tour and earned yourself 10,000 PXB Points!",
      details: "Now you're ready to dive into the exciting world of crypto predictions and bounties. Use your newly earned points to place your first bets, complete bounties, and start climbing the leaderboard!",
      image: "/lovable-uploads/be886d35-fbcb-4675-926c-38691ad3e311.png",
      icon: <Gift className="h-6 w-6 text-green-400" />,
      color: "from-yellow-500 to-red-500",
      achievement: "PXB Master",
      tip: "Start with smaller bets to get a feel for the platform before risking larger amounts of points."
    }
  ];
  
  const renderQuiz = (slideIndex: number) => {
    if (slideIndex < 1 || slideIndex > 5) return null;
    
    const quiz = quizQuestions[slideIndex as keyof typeof quizQuestions];
    if (!quiz) return null;
    
    if (quizAnswers[slideIndex] === true) {
      return (
        <div className="mt-3 p-3 bg-green-500/20 rounded-lg border border-green-500/30">
          <div className="flex items-center">
            <CheckCircle2 className="h-5 w-5 text-green-400 mr-2" />
            <p className="text-green-300 text-sm font-medium">Correct! You've mastered this concept.</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="mt-3 p-3 bg-indigo-900/30 rounded-lg border border-indigo-600/30">
        <p className="text-white/90 text-sm font-medium mb-2">{quiz.question}</p>
        <div className="space-y-2">
          {quiz.options.map(option => (
            <button 
              key={option.id}
              className="w-full text-left p-2 text-xs rounded-md bg-white/10 hover:bg-white/20 transition-colors flex items-center"
              onClick={() => handleQuizAnswer(slideIndex, option.id, option.correct)}
            >
              <span className="w-5 h-5 rounded-full bg-indigo-800/50 flex items-center justify-center mr-2 text-xs">
                {option.id}
              </span>
              {option.text}
            </button>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      <div className="text-center mb-6 animate-fade-in">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-green-300 to-yellow-300 bg-clip-text text-transparent">
          Your PumpXBounty Adventure
        </h2>
        <p className="text-white/70 mt-2">Complete the interactive tour to master the platform and earn 10,000 PXB Points!</p>
      </div>
      
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
      
      {tourCompleted && (
        <motion.div 
          className="mb-6 p-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-center mb-3">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: 0 }}
                animate={{ y: [0, -15, 0] }}
                transition={{ 
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.1,
                  repeatType: "reverse"
                }}
              >
                <Sparkles className="h-6 w-6 text-yellow-300 mx-1" />
              </motion.div>
            ))}
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Congratulations! Tour Completed!</h3>
          <p className="text-white/80 mb-3">You've unlocked 10,000 PXB Points to start your journey!</p>
          <p className="text-xs text-white/60">Continue exploring the platform to discover more features and earn rewards.</p>
          
          <Button 
            onClick={() => navigate('/betting')}
            className="mt-3 bg-white text-purple-700 hover:bg-white/90"
          >
            Start Betting Now!
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </motion.div>
      )}
      
      <Carousel
        ref={emblaRef}
        className="w-full"
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
                        
                        {index === 5 && (
                          <p className="text-center text-yellow-300 mt-2 text-sm">Correctly answer the quiz in Stage 5 to unlock!</p>
                        )}
                      </div>
                    ) : null}
                    
                    <p className="text-white/80 mb-3 text-sm">{feature.description}</p>
                    
                    <div className="bg-black/30 rounded-lg p-3 mb-3 text-xs">
                      <p className="text-white/80">{feature.details}</p>
                    </div>
                    
                    <div className="relative h-40 overflow-hidden rounded-lg border border-white/10 mb-3">
                      <img
                        src={feature.image}
                        alt={feature.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    </div>
                    
                    {index > 0 && index < 6 && renderQuiz(index)}
                    
                    <div className="bg-black/30 rounded-lg p-3 mb-3 text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <Trophy className="h-4 w-4 text-yellow-400" />
                        <span className="font-medium text-yellow-200">Achievement: {feature.achievement}</span>
                      </div>
                      <p className="text-white/80 pl-6">Pro Tip: {feature.tip}</p>
                    </div>
                    
                    <div className="flex gap-2">
                      {index > 0 && (
                        <Button 
                          className="flex-1 bg-white/10 hover:bg-white/20 text-white"
                          onClick={() => emblaApi?.scrollPrev()}
                        >
                          Previous
                        </Button>
                      )}
                      
                      {index === features.length - 1 ? (
                        <Button 
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          onClick={handleCompleteJourney}
                          disabled={tourCompleted}
                        >
                          {tourCompleted ? "Completed!" : "Claim 10,000 PXB Points!"}
                          <Gift className="h-4 w-4 ml-1" />
                        </Button>
                      ) : (
                        <Button 
                          className="flex-1 bg-white/10 hover:bg-white/20 text-white"
                          onClick={handleContinueNavigation}
                        >
                          Continue
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      )}
                    </div>
                    
                    {index > 0 && index < features.length - 1 && (
                      <button 
                        className="absolute bottom-4 right-4 p-1 rounded-full bg-white/10 hover:bg-white/20"
                        onClick={() => toast.info(quizQuestions[index]?.options.find(o => o.correct)?.text || "Complete this stage to continue!")}
                      >
                        <HelpCircle className="h-4 w-4 text-white/70" />
                      </button>
                    )}
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
        
        {achievements.length > 0 && (
          <div className="mt-4 text-center text-xs text-white/70">
            <span className="text-green-400 font-medium">Achievements unlocked:</span> {achievements.filter(a => a !== "journey_complete").map(a => a.replace('slide_', 'Stage ')).join(', ')}
            {achievements.includes("journey_complete") && ", PXB Master"}
          </div>
        )}
        
        {tourCompleted && (
          <div className="mt-6 p-4 rounded-lg bg-indigo-900/20 border border-indigo-900/30">
            <h3 className="text-lg font-bold text-white mb-2">What's Next?</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <div className="mt-0.5 mr-2 p-1 rounded-full bg-green-500/20">
                  <Coins className="h-4 w-4 text-green-400" />
                </div>
                <p className="text-white/80 text-sm">Place your first bet using your new PXB Points</p>
              </li>
              <li className="flex items-start">
                <div className="mt-0.5 mr-2 p-1 rounded-full bg-blue-500/20">
                  <Zap className="h-4 w-4 text-blue-400" />
                </div>
                <p className="text-white/80 text-sm">Complete a bounty to earn more points and rewards</p>
              </li>
              <li className="flex items-start">
                <div className="mt-0.5 mr-2 p-1 rounded-full bg-purple-500/20">
                  <Trophy className="h-4 w-4 text-purple-400" />
                </div>
                <p className="text-white/80 text-sm">Check the leaderboard to see your current ranking</p>
              </li>
            </ul>
            
            <div className="mt-4 flex justify-center">
              <Button 
                onClick={() => navigate('/betting')}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                Start Betting Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Carousel>
    </div>
  );
};

export default WebsiteTour;
