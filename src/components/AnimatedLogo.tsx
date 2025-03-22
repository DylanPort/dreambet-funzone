import React from 'react';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import WebsiteTour from './WebsiteTour';

const AnimatedLogo = () => {
  const isMobile = useIsMobile();
  
  // On mobile, return the WebsiteTour component directly
  if (isMobile) {
    return <WebsiteTour />;
  }
  
  // Otherwise also return the WebsiteTour component to replace the logo
  return <WebsiteTour />;
};

export default AnimatedLogo;
