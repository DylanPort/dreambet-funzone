
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

  return (
    <Card className={`p-4 bg-black/40 backdrop-blur-md border-dream-accent1/20 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium flex items-center">
          <Users className="h-4 w-4 mr-2 text-dream-accent1" />
          <span>Online Users</span>
        </h3>
        <div className="flex items-center text-xs text-dream-foreground/60">
          <Signal className="h-3 w-3 mr-1 text-green-400" />
          <span>{loading ? "..." : onlineUsers.length}</span>
        </div>
      </div>
      
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-2 w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2 max-h-[240px] overflow-y-auto">
          {onlineUsers.length === 0 ? (
            <div className="text-center py-2 text-xs text-dream-foreground/50">
              No users currently online
            </div>
          ) : (
            onlineUsers.map((user) => (
              <Link 
                to={`/profile/${user.id}`} 
                key={user.id}
                className="flex items-center p-2 rounded-md hover:bg-dream-foreground/5 transition-colors"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="bg-dream-accent2/20 text-dream-accent2">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="ml-2">
                  <div className="text-sm font-medium">{user.username}</div>
                  <div className="text-xs text-dream-foreground/60">{user.points} PXB</div>
                </div>
                <div className="ml-auto">
                  <div className="h-2 w-2 rounded-full bg-green-400"></div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </Card>
  );
};

export default OnlineUsersSidebar;
