
import React from 'react';
import { UserProfile } from '@/types/pxb';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

interface UserListProps {
  users: UserProfile[];
  loading: boolean;
}

const UserList: React.FC<UserListProps> = ({ users, loading }) => {
  if (loading) {
    return (
      <div className="space-y-4 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-110px)]">
      <div className="space-y-4 p-4">
        {users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No users found
          </div>
        ) : (
          users.map((user) => (
            <div 
              key={user.id} 
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
            >
              <Avatar className="h-10 w-10 border border-dream-accent1/30">
                <AvatarImage src={user.avatar_url || '/lovable-uploads/be6baddd-a67e-4583-b969-a471b47274e1.png'} alt={user.username} />
                <AvatarFallback className="bg-dream-accent1/20 text-dream-accent1">
                  {user.username?.substring(0, 2).toUpperCase() || 'UN'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-medium text-sm">{user.username}</span>
                <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                  {user.walletAddress?.substring(0, 8)}...{user.walletAddress?.substring(user.walletAddress.length - 4)}
                </span>
              </div>
              <div className="ml-auto glass-panel py-1 px-2 flex items-center gap-1 text-yellow-400/70">
                <div className="w-4 h-4 flex items-center justify-center">
                  <img 
                    src="/lovable-uploads/be886d35-fbcb-4675-926c-38691ad3e311.png" 
                    alt="PXB" 
                    className="w-5 h-5 filter drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]" 
                  />
                </div>
                <span className="text-xs">{user.pxbPoints || 0}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
};

export default UserList;
