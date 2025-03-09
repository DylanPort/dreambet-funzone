
import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  endTime: Date;
  onComplete?: () => void;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ endTime, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState({
    minutes: 0,
    seconds: 0,
  });
  
  const [isComplete, setIsComplete] = useState(false);
  
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = endTime.getTime() - now.getTime();
      
      if (difference <= 0) {
        setIsComplete(true);
        if (onComplete) onComplete();
        return { minutes: 0, seconds: 0 };
      }
      
      const minutes = Math.floor(difference / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      return { minutes, seconds };
    };
    
    // Initial calculation
    setTimeLeft(calculateTimeLeft());
    
    // Update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    
    return () => clearInterval(timer);
  }, [endTime, onComplete]);
  
  // Format time with leading zeros
  const formatTime = (value: number) => {
    return value < 10 ? `0${value}` : value;
  };
  
  return (
    <div className={`flex items-center ${isComplete ? 'text-red-400' : 'text-dream-foreground'}`}>
      <Clock className="w-4 h-4 mr-2" />
      <div className="font-mono text-lg">
        {isComplete ? (
          <span>Time's up!</span>
        ) : (
          <span className="flex items-baseline">
            <span className="text-dream-accent1">{formatTime(timeLeft.minutes)}</span>
            <span className="mx-1">:</span>
            <span className="text-dream-accent2">{formatTime(timeLeft.seconds)}</span>
          </span>
        )}
      </div>
    </div>
  );
};

export default CountdownTimer;
