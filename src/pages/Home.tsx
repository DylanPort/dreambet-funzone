
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import Layout from '@/components/Layout';
import { Container } from '@/components/ui/container';
import HeroBanner from '@/components/HeroBanner';
import Roadmap from '@/components/Roadmap';
import TokenSupplyStats from '@/components/TokenSupplyStats';
import UserWalletSearch from '@/components/UserWalletSearch';
import SocialLinks from '@/components/SocialLinks';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const HomePage = () => {
  const navigate = useNavigate();
  const [lockedRouteDialog, setLockedRouteDialog] = useState(false);
  const [lockedRouteName, setLockedRouteName] = useState('');
  
  // Check if the user is trying to access a locked route
  useEffect(() => {
    const unlisten = navigate((location) => {
      const lockedRoutes = ['/betting', '/token', '/community', '/profile'];
      
      // Check if the path matches any locked route
      const matchedRoute = lockedRoutes.find(route => 
        location.pathname.startsWith(route) && location.pathname !== '/'
      );
      
      if (matchedRoute) {
        // Prevent navigation and show dialog
        setLockedRouteName(matchedRoute.slice(1));
        setLockedRouteDialog(true);
        return false;
      }
      
      return true;
    });
    
    return unlisten;
  }, [navigate]);

  return (
    <Layout>
      <Container className="py-16">
        <motion.div 
          className="space-y-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <HeroBanner />
          <Roadmap />
          <TokenSupplyStats />
          <UserWalletSearch />
          <SocialLinks />
        </motion.div>
      </Container>
      
      {/* Locked Route Dialog */}
      <Dialog open={lockedRouteDialog} onOpenChange={setLockedRouteDialog}>
        <DialogContent className="bg-[#0f1628] border-indigo-900/30">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Lock className="h-5 w-5 text-amber-500" />
              Access Restricted
            </DialogTitle>
            <DialogDescription className="text-indigo-300/70">
              The {lockedRouteName} section is currently locked during this phase.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-white mb-4">
              We're focusing on the roadmap Phase 1 completion. This section will be unlocked in future phases.
            </p>
            <p className="text-indigo-300/70 text-sm mb-6">
              Please check our roadmap for more information about upcoming releases.
            </p>
          </div>
          <div className="flex justify-end">
            <Button 
              onClick={() => {
                setLockedRouteDialog(false);
                navigate('/');
              }}
            >
              Return to Homepage
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default HomePage;
