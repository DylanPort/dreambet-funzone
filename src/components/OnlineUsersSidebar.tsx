import React from 'react';
import { useOnlineUsers } from '@/hooks/useOnlineUsers';
import { Users, User, Signal } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
export interface OnlineUsersSidebarProps {
  className?: string;
}
const OnlineUsersSidebar = ({
  className
}: OnlineUsersSidebarProps) => {
  const {
    onlineUsers,
    loading
  } = useOnlineUsers();
  return;
};
export default OnlineUsersSidebar;