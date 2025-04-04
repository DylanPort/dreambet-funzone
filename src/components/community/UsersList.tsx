
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Coins } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type User = {
  id: string;
  username: string;
  points: number;
  avatar_url?: string;
  created_at: string;
};

const UsersList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all users from the database
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, points, avatar_url, created_at')
        .order('points', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load community members');
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Error in fetchUsers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();

    // Set up real-time subscription
    const channel = supabase
      .channel('public:users')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'users' 
      }, payload => {
        console.log('User change received:', payload);
        fetchUsers(); // Refresh the list when changes occur
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Community Members</span>
          <span className="text-sm text-muted-foreground">{users.length} users</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-[70vh] overflow-y-auto">
        {loading ? (
          <div className="flex justify-center p-4">
            <div className="animate-spin h-6 w-6 border-2 border-dream-accent1 rounded-full border-t-transparent"></div>
          </div>
        ) : (
          <ul className="space-y-3">
            {users.map(user => (
              <li key={user.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-md transition-colors">
                <Avatar className="h-10 w-10 border border-dream-accent2/30">
                  <AvatarImage src={user.avatar_url || '/lovable-uploads/be6baddd-a67e-4583-b969-a471b47274e1.png'} alt={user.username || 'User'} />
                  <AvatarFallback className="bg-dream-accent3/20">{(user.username || 'User').substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{user.username || 'Anonymous User'}</p>
                  <p className="text-xs text-muted-foreground">Joined {new Date(user.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center text-yellow-400 whitespace-nowrap">
                  <Coins className="h-4 w-4 mr-1" />
                  <span>{user.points.toLocaleString()}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default UsersList;
