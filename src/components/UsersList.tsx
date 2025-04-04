
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserProfile } from '@/services/userService';
import { OnlineUser } from '@/hooks/useOnlineUsers';
import { User, Activity } from 'lucide-react';

interface UsersListProps {
  users: UserProfile[];
  onlineUsers: Record<string, OnlineUser>;
  loading: boolean;
}

const UsersList: React.FC<UsersListProps> = ({ users, onlineUsers, loading }) => {
  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };
  
  const truncateAddress = (address: string) => {
    return address ? `${address.slice(0, 4)}...${address.slice(-4)}` : '';
  };
  
  const isUserOnline = (userId: string): boolean => {
    // Check if the user's wallet address exists in onlineUsers
    return Object.values(onlineUsers).some(user => 
      user.id === userId || Object.keys(onlineUsers).includes(userId)
    );
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-dream-accent2 border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  return (
    <ScrollArea className="h-[70vh]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Wallet</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} className="hover:bg-dream-background/50 cursor-pointer">
              <TableCell>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-dream-accent1/30 to-dream-accent2/30 flex items-center justify-center">
                  <User className="w-4 h-4 text-dream-foreground/70" />
                </div>
              </TableCell>
              <TableCell className="font-medium">{user.username || 'Anonymous'}</TableCell>
              <TableCell>{truncateAddress(user.wallet_address)}</TableCell>
              <TableCell>{formatTimeAgo(user.created_at)}</TableCell>
              <TableCell>
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${isUserOnline(user.id) ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span>{isUserOnline(user.id) ? 'Online' : 'Offline'}</span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
};

export default UsersList;
