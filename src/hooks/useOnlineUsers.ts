
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

export interface OnlineUser {
  id: string;
  username?: string | null;
  lastSeen: string;
}

export const useOnlineUsers = () => {
  const [onlineUsers, setOnlineUsers] = useState<Record<string, OnlineUser>>({});
  
  useEffect(() => {
    // Create a channel for tracking user presence
    const channel = supabase.channel('online-users');
    
    // Handle presence events
    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const formattedState: Record<string, OnlineUser> = {};
        
        // Format the presence state
        Object.keys(newState).forEach(key => {
          const userPresence = newState[key][0];
          formattedState[key] = {
            id: userPresence.user_id,
            username: userPresence.username,
            lastSeen: userPresence.online_at
          };
        });
        
        setOnlineUsers(formattedState);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Nothing to track if not connected to a wallet
          const wallet = localStorage.getItem('walletAddress');
          if (!wallet) return;
          
          // Track the current user's presence
          await channel.track({
            user_id: wallet,
            username: localStorage.getItem('username') || null,
            online_at: new Date().toISOString()
          });
        }
      });
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  return {
    onlineUsers,
    onlineCount: Object.keys(onlineUsers).length
  };
};
