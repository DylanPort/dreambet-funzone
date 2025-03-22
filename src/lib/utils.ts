import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Add custom keyframes for the animations
const customKeyframes = {
  'fast-particle': {
    '0%': { transform: 'translateX(0) translateY(0)', opacity: '0.8' },
    '50%': { transform: 'translateX(30px) translateY(-2px)', opacity: '1' },
    '100%': { transform: 'translateX(100px) translateY(0)', opacity: '0' }
  },
  'supply-particle': {
    '0%': { transform: 'scale(0.8) translateY(0)', opacity: '0.6' },
    '50%': { transform: 'scale(1.2) translateY(-3px)', opacity: '1' },
    '100%': { transform: 'scale(0.8) translateY(0)', opacity: '0.6' }
  },
  'shine': {
    '0%': { transform: 'translateX(-100%) skewX(-20deg)' },
    '100%': { transform: 'translateX(100%) skewX(-20deg)' }
  },
  'pulse-slow': {
    '0%': { opacity: '0.6' },
    '50%': { opacity: '1' },
    '100%': { opacity: '0.6' }
  }
};

// Add custom animations that use the keyframes
const customAnimations = {
  'fast-particle': 'fast-particle 1s linear infinite',
  'supply-particle': 'supply-particle 0.8s ease-in-out infinite',
  'shine': 'shine 2s linear infinite',
  'pulse-slow': 'pulse-slow 2s ease-in-out infinite'
};

export { customKeyframes, customAnimations };

// Add confetti function
export const confetti = (options?: {
  particleCount?: number;
  spread?: number;
  startVelocity?: number;
  decay?: number;
  scalar?: number;
  ticks?: number;
  origin?: { x?: number; y?: number };
  colors?: string[];
  shapes?: string[];
  gravity?: number;
  drift?: number;
  random?: () => number;
}) => {
  // This is just a placeholder that manages the type signature
  // When we add the actual confetti library through a script tag,
  // this will just pass through to the global function
  
  if (typeof window !== 'undefined' && (window as any).confetti) {
    return (window as any).confetti(options);
  }
  return null;
};
