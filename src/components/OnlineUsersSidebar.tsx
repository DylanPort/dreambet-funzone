
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
  return <Card className={`bg-dream-background/20 border border-dream-foreground/10 p-4 ${className}`}>
      <div className="mb-4 flex items-center">
        
        <h3 className="text-lg font-display font-semibold">Online Users</h3>
      </div>
      
      {loading ? <div className="space-y-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div> : <>
          <div className="flex items-center justify-between mb-2 text-sm text-dream-foreground/70">
            <span className="flex items-center">
              <Signal className="w-4 h-4 mr-1 text-green-400" />
              {onlineUsers.length} online
            </span>
          </div>

          <div className="space-y-2 max-h-[calc(100vh-240px)] overflow-y-auto">
            {onlineUsers.length === 0 ? <div className="text-center py-6 text-dream-foreground/50">
                <User className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No users online</p>
              </div> : onlineUsers.map(user => (
                <Link 
                  key={user.id} 
                  to={`/profile/${user.id}`} 
                  className="flex items-center p-2 rounded-md bg-dream-background/30 hover:bg-dream-background/40 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-dream-accent1/20 to-dream-accent2/20 flex items-center justify-center mr-2 overflow-hidden">
                    <Avatar className="w-full h-full">
                      <AvatarImage src="/lovable-uploads/465e1d7b-8647-4ada-a42d-b52fc4e41841.png" alt="User avatar" className="w-full h-full object-cover" />
                      <AvatarFallback className="bg-transparent">
                        <User className="w-3.5 h-3.5 text-dream-foreground/70" />
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm truncate font-medium">{user.username}</p>
                  </div>
                  <div className="ml-auto">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  </div>
                </Link>
              ))}
          </div>
        </>}
    </Card>;
};
export default OnlineUsersSidebar;
