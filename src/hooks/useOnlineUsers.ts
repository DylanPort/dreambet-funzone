
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from '@solana/wallet-adapter-react';

export interface OnlineUser {
  id: string;
  username: string | null;
  lastSeen: string;
  wallet_address?: string;
  avatar?: string;     // Added this property
  points?: number;     // Added this property
}

export function useOnlineUsers() {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { publicKey, connected } = useWallet();

  useEffect(() => {
    // Only subscribe to presence if the user is connected
    if (!connected || !publicKey) {
      setLoading(false);
      return;
    }

    const channel = supabase.channel('online-users')
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        
        // Transform presence state into online users array
        const users: OnlineUser[] = Object.values(presenceState)
          .flat()
          .map((presence: any) => ({
            id: presence.user_id,
            username: presence.username || presence.user_id.substring(0, 6) + '...',
            lastSeen: presence.online_at,
            wallet_address: presence.user_id,
            avatar: presence.avatar || null,  // Include avatar property
            points: presence.points || 0      // Include points property
          }));
        
        setOnlineUsers(users);
        setLoading(false);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && publicKey) {
          // Get user profile data if available to include avatar and points
          let userProfile = null;
          try {
            const { data } = await supabase
              .from('users')
              .select('points, username')
              .eq('wallet_address', publicKey.toString())
              .single();
            userProfile = data;
          } catch (error) {
            console.error('Error fetching user profile for presence:', error);
          }
          
          // Track the current user's presence
          await channel.track({
            user_id: publicKey.toString(),
            username: userProfile?.username || publicKey.toString().substring(0, 6) + '...',
            online_at: new Date().toISOString(),
            points: userProfile?.points || 0,
            presence_ref: publicKey.toString() // Required unique identifier
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [connected, publicKey]);

  return { onlineUsers, loading };
}
