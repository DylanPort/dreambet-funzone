
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Info } from 'lucide-react';
import { toast } from 'sonner';

interface RouteGuardProps {
  children: React.ReactNode;
}

const RouteGuard: React.FC<RouteGuardProps> = ({ children }) => {
  return <>{children}</>;
};

export default RouteGuard;
