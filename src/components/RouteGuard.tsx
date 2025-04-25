
import React, { useEffect, useState } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { Lock, Info } from 'lucide-react';
import { toast } from 'sonner';

interface RouteGuardProps {
  children: React.ReactNode;
}

const RouteGuard: React.FC<RouteGuardProps> = ({ children }) => {
  const location = useLocation();
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    // Only allow the home route (/) 
    // You can add more allowed routes here if needed
    const allowedRoutes = ['/'];
    
    const pathIsAllowed = allowedRoutes.includes(location.pathname);
    setIsAllowed(pathIsAllowed);
    
    if (!pathIsAllowed && location.pathname !== '/') {
      toast.error(
        <div className="flex items-start">
          <Lock className="h-5 w-5 mr-2 flex-shrink-0 text-red-400" />
          <div>
            <p className="font-medium">Page access restricted</p>
            <p className="text-sm opacity-90">This page is currently locked during Phase 1</p>
          </div>
        </div>,
        {
          duration: 5000,
          position: 'top-center'
        }
      );
    }
  }, [location.pathname]);

  if (!isAllowed) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default RouteGuard;
