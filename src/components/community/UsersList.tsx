
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from '@/pages/PointsCommunity';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

interface UsersListProps {
  users: User[];
  simplified?: boolean;
}

export const UsersList: React.FC<UsersListProps> = ({ users, simplified = false }) => {
  if (!users.length) {
    return <div className="text-center text-white/60 py-8">No users found</div>;
  }

  const renderAvatar = (user: User) => (
    <Avatar className="h-10 w-10 border border-dream-accent1/30">
      <AvatarImage src={user.avatar_url || undefined} />
      <AvatarFallback className="bg-dream-accent3/20 text-dream-accent3">
        {user.username ? user.username.substring(0, 2).toUpperCase() : user.wallet_address.substring(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );

  if (simplified) {
    return (
      <div className="space-y-3">
        {users.map((user) => (
          <Link 
            key={user.id}
            to={`/profile/${user.wallet_address}`}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            {renderAvatar(user)}
            <div>
              <div className="font-medium">
                {user.username || user.wallet_address.slice(0, 6) + '...' + user.wallet_address.slice(-4)}
              </div>
              <div className="text-sm text-dream-accent2">{user.points.toLocaleString()} PXB</div>
            </div>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-white/10">
            <th className="pb-3 px-4 font-medium text-white/70">Rank</th>
            <th className="pb-3 px-4 font-medium text-white/70">User</th>
            <th className="pb-3 px-4 font-medium text-white/70">PXB Points</th>
            <th className="pb-3 px-4 font-medium text-white/70">Wallet</th>
            <th className="pb-3 px-4 font-medium text-white/70">Joined</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user, index) => (
            <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
              <td className="py-4 px-4">{index + 1}</td>
              <td className="py-4 px-4">
                <Link to={`/profile/${user.wallet_address}`} className="flex items-center gap-3">
                  {renderAvatar(user)}
                  <span>{user.username || "Anonymous"}</span>
                </Link>
              </td>
              <td className="py-4 px-4 font-medium text-dream-accent2">
                {user.points.toLocaleString()}
              </td>
              <td className="py-4 px-4 text-white/60">
                {user.wallet_address.slice(0, 6) + '...' + user.wallet_address.slice(-4)}
              </td>
              <td className="py-4 px-4 text-white/60">
                {user.created_at ? formatDistanceToNow(new Date(user.created_at), { addSuffix: true }) : 'Unknown'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
