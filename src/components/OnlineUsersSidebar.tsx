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
  return <Card className={`bg-dream-background/30 border border-dream-foreground/10 rounded-lg p-4 ${className}`}>
      <div className="flex items-center mb-4">
        
        <h3 className="font-display font-bold text-lg">Online Users</h3>
        
        {!loading && onlineUsers && <div className="flex items-center ml-auto text-xs text-dream-foreground/60">
            <Signal className="w-3 h-3 mr-1 text-green-500" />
            <span>{onlineUsers.length} online</span>
          </div>}
      </div>
      
      {loading ? <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="flex items-center">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="ml-2 space-y-1">
                <Skeleton className="h-3 w-24" />
              </div>
            </div>)}
        </div> : <div className="space-y-3">
          {onlineUsers && onlineUsers.length > 0 ? onlineUsers.map(user => <Link key={user.id} to={`/profile/${user.id}`} className="flex items-center hover:text-dream-accent1 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-dream-accent1/30 to-dream-accent2/30 flex items-center justify-center overflow-hidden">
                  <Avatar className="w-full h-full">
                    <AvatarImage src="/lovable-uploads/ecc52c7d-725c-4ccd-bace-82d464afe6bd.png" alt="User avatar" className="w-full h-full object-cover" />
                    <AvatarFallback className="bg-transparent">
                      <User className="w-4 h-4 text-dream-foreground/70" />
                    </AvatarFallback>
                  </Avatar>
                </div>
                <span className="ml-2 text-sm font-medium">{user.username || user.wallet_address}</span>
                <div className="ml-auto flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                </div>
              </Link>) : <p className="text-dream-foreground/50 text-sm text-center py-3">No users online</p>}
        </div>}
    </Card>;
};
export default OnlineUsersSidebar;