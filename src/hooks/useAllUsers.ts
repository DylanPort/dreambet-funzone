
import { useState, useEffect } from 'react';
import { fetchAllUsers, getTotalUsersCount, UserProfile } from '@/services/userService';
import { useOnlineUsers } from './useOnlineUsers';

export const useAllUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const { onlineUsers, onlineCount } = useOnlineUsers();
  
  const loadUsers = async () => {
    try {
      setLoading(true);
      const [fetchedUsers, count] = await Promise.all([
        fetchAllUsers(),
        getTotalUsersCount()
      ]);
      
      setUsers(fetchedUsers);
      setTotalUsers(count);
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadUsers();
    
    // Listen for real-time updates to the users table
    const usersChannel = supabase
      .channel('public:users')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'users' },
        () => {
          // Reload the users when there's a change
          loadUsers();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(usersChannel);
    };
  }, []);
  
  return {
    users,
    totalUsers,
    onlineUsers,
    onlineCount,
    loading,
    reload: loadUsers
  };
};
