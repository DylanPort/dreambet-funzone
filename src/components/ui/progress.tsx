
import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

interface ExtendedProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  indicatorClassName?: string;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ExtendedProgressProps
>(({
  className,
  value,
  indicatorClassName,
  ...props
}, ref) => (
  <ProgressPrimitive.Root 
    ref={ref} 
    className={cn("relative h-4 w-full overflow-hidden rounded-full bg-black/20 backdrop-blur-sm border border-white/10", className)} 
    {...props}
  >
    {/* Dynamic background shimmer effect */}
    <div className="absolute inset-0 bg-gradient-to-r from-black/5 via-white/5 to-black/5 animate-gradient-move"></div>
    
    {/* Floating particles - enhanced with more colors and green tones */}
    <div className="absolute inset-0 overflow-hidden bg-[#264f21]/60">
      {Array.from({length: 8}).map((_, i) => {
        // Array of vibrant colors for particles, emphasizing green hues
        const colors = [
          "bg-[#00ff9d]/40", // Green
          "bg-[#00ffe0]/40", // Cyan
          "bg-[#4dff6a]/40", // Light Green
          "bg-[#00ff62]/40", // Emerald
          "bg-[#47ff9e]/40", // Mint
          "bg-[#7bff86]/40", // Lime
          "bg-[#b9ff00]/40", // Yellow-Green
          "bg-[#00ffaa]/40"  // Teal
        ];
        
        return (
          <div 
            key={i} 
            className={`absolute w-1 h-1 rounded-full ${colors[i % colors.length]} animate-float`} 
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.7}s`,
              opacity: 0.2 + Math.random() * 0.5,
              width: i % 3 === 0 ? '1.5px' : '1px',
              height: i % 3 === 0 ? '1.5px' : '1px',
              filter: `blur(${i % 2 === 0 ? '0.5px' : '0px'})`,
              animationDuration: `${3 + Math.random() * 2}s`
            }} 
          />
        );
      })}
    </div>
    
    <ProgressPrimitive.Indicator 
      className={cn(
        "h-full w-full flex-1 bg-gradient-to-r from-green-500 via-emerald-400 to-teal-500 transition-all duration-300 relative", 
        indicatorClassName
      )} 
      style={{
        transform: `translateX(-${100 - (value || 0)}%)`
      }}
    >
      {/* Dynamic pulsing glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-green-500/60 via-emerald-400/60 to-teal-500/60 blur-md animate-pulse-glow"></div>
      
      {/* Inner shimmering effect - enhanced with faster animation */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 bg-gradient-to-r from-white/30 via-transparent to-white/30 animate-shine" 
          style={{
            width: '150%',
            transform: 'skewX(-20deg)'
          }}
        ></div>
      </div>
      
      {/* Inner glow effect with enhanced brightness */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/40 to-transparent opacity-70 blur-sm"></div>
      
      {/* Fluid wave effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-green-500/20 via-emerald-400/40 to-teal-500/20 animate-drift"></div>
      </div>
      
      {/* Fast-moving particles based on progress value */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({length: 12}).map((_, i) => {
          // Calculate position based on progress value to distribute particles across filled area
          const particlePosition = (value || 0) * (i / 12);
          return (
            <div 
              key={`fast-particle-${i}`} 
              className="absolute h-0.5 w-0.5 rounded-full bg-white animate-fast-particle" 
              style={{
                left: `${particlePosition}%`,
                top: `${Math.random() * 100}%`,
                opacity: 0.6 + Math.random() * 0.4,
                animationDuration: `${0.8 + Math.random() * 1.5}s`,
                animationDelay: `${i * 0.15}s`
              }} 
            />
          );
        })}
      </div>
      
      {/* Supply representation particles - more particles when more is minted */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({length: Math.max(3, Math.floor((value || 0) / 5))}).map((_, i) => {
          // Distribute particles based on minted percentage (value)
          const particlePosition = Math.random() * (value || 0);
          return (
            <div 
              key={`supply-particle-${i}`} 
              className="absolute h-1 w-1 rounded-full bg-white/70 animate-supply-particle" 
              style={{
                left: `${particlePosition}%`,
                top: `${Math.random() * 100}%`,
                animationDuration: `${0.5 + Math.random()}s`,
                animationDelay: `${i * 0.1}s`
              }} 
            />
          );
        })}
      </div>
      
      {/* Edge highlight sparkles */}
      <div className="absolute right-0 top-0 bottom-0 w-2 flex flex-col justify-around">
        {Array.from({length: 3}).map((_, i) => (
          <div 
            key={i} 
            className="w-1 h-1 rounded-full bg-white animate-pulse-glow" 
            style={{
              animationDelay: `${i * 0.3}s`
            }} 
          />
        ))}
      </div>
      
      {/* 3D effect layers */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/50"></div>
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-black/30"></div>
    </ProgressPrimitive.Indicator>
  </ProgressPrimitive.Root>
));

Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
