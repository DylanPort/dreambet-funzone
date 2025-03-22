
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import WebsiteTour from './WebsiteTour';

const AnimatedLogo = () => {
  const isMobile = useIsMobile();
  
  // Return the enhanced WebsiteTour component for both mobile and desktop
  return <WebsiteTour />;
};

export default AnimatedLogo;
