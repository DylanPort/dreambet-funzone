
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface User {
  id: string;
  username: string | null;
  avatar_url: string | null;
  wallet_address: string;
}

const UsersList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, avatar_url, wallet_address')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    
    // Set up real-time subscription for users
    const channel = supabase
      .channel('public:users')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'users' 
        }, 
        () => {
          fetchUsers();
        }
      )
      .subscribe();
    
    // Set interval for periodic refresh
    const interval = setInterval(() => {
      fetchUsers();
    }, 30000); // Refresh every 30 seconds
    
    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const getInitials = (username: string | null, wallet: string) => {
    if (username) return username.substring(0, 2).toUpperCase();
    return wallet.substring(0, 2).toUpperCase();
  };

  return (
    <Card className="glass-panel overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="w-5 h-5" />
          <span>Community Members</span>
          <span className="text-sm text-muted-foreground ml-auto">
            {users.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto px-6">
            {users.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No users found</p>
            ) : (
              <ul className="space-y-3">
                {users.map((user) => (
                  <li key={user.id} className="flex items-center gap-3 group">
                    <Avatar className="h-8 w-8 border-2 border-dream-background/20">
                      <AvatarImage 
                        src={user.avatar_url || undefined} 
                        alt={user.username || 'User'} 
                      />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600 text-xs">
                        {getInitials(user.username, user.wallet_address)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground group-hover:text-dream-foreground transition-colors truncate">
                      {user.username || `User-${user.id.substring(0, 4)}`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UsersList;
