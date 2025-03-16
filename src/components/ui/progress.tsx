
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
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-gradient-to-r from-dream-accent1 via-dream-accent2 to-dream-accent3 transition-all duration-300 shadow-[0_0_10px_rgba(138,75,255,0.7)] relative"
      style={{ 
        transform: `translateX(-${100 - (value || 0)}%)`,
      }}
    >
      {/* Inner glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-70 blur-sm"></div>
      
      {/* Highlights for 3D effect */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/30"></div>
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-black/20"></div>
    </ProgressPrimitive.Indicator>
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
