
import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-black/20 backdrop-blur-sm border border-white/10",
      className
    )}
    {...props}
  >
    {/* Dynamic background shimmer effect */}
    <div className="absolute inset-0 bg-gradient-to-r from-black/5 via-white/5 to-black/5 animate-gradient-move"></div>
    
    {/* Floating particles */}
    <div className="absolute inset-0 overflow-hidden">
      {Array.from({ length: 5 }).map((_, i) => (
        <div 
          key={i}
          className="absolute w-1 h-1 rounded-full bg-white/40 animate-float"
          style={{ 
            left: `${Math.random() * 100}%`, 
            top: `${Math.random() * 100}%`,
            animationDelay: `${i * 0.7}s`,
            opacity: 0.2 + Math.random() * 0.4
          }}
        />
      ))}
    </div>
    
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-gradient-to-r from-dream-accent1 via-dream-accent2 to-dream-accent3 transition-all duration-300 relative"
      style={{ 
        transform: `translateX(-${100 - (value || 0)}%)`,
      }}
    >
      {/* Dynamic pulsing glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-dream-accent1/60 via-dream-accent2/60 to-dream-accent3/60 blur-md animate-pulse-glow"></div>
      
      {/* Inner shimmering effect */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-white/30 via-transparent to-white/30 animate-shine" 
             style={{width: '150%', transform: 'skewX(-20deg)'}}></div>
      </div>
      
      {/* Inner glow effect with enhanced brightness */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/40 to-transparent opacity-70 blur-sm"></div>
      
      {/* Fluid wave effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-dream-accent1/20 via-dream-accent2/40 to-dream-accent3/20 animate-drift"></div>
      </div>
      
      {/* Edge highlight sparkles */}
      <div className="absolute right-0 top-0 bottom-0 w-2 flex flex-col justify-around">
        {Array.from({ length: 3 }).map((_, i) => (
          <div 
            key={i}
            className="w-1 h-1 rounded-full bg-white animate-pulse-glow"
            style={{ animationDelay: `${i * 0.3}s` }}
          />
        ))}
      </div>
      
      {/* 3D effect layers */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/50"></div>
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-black/30"></div>
    </ProgressPrimitive.Indicator>
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
