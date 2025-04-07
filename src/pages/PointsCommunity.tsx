
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { UsersList } from '@/components/community/UsersList';
import { MessagesFeed } from '@/components/community/MessagesFeed';
import { CreatePostForm } from '@/components/community/CreatePostForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export interface User {
  id: string;
  username: string | null;
  wallet_address: string;
  points: number;
  avatar_url?: string;
  created_at: string;
}

const PointsCommunity = () => {
  const [activeTab, setActiveTab] = useState<string>("feed");

  const { data: users, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['communityUsers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('points', { ascending: false });
      
      if (error) throw error;
      return data as User[];
    },
    refetchInterval: 1000, // Update every second
  });

  if (usersError) {
    toast.error('Failed to fetch users data');
    console.error('Error fetching users:', usersError);
  }

  return (
    <div className="min-h-screen bg-dream-background flex flex-col">
      <Navbar />
      
      <main className="flex-grow container max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gradient animate-gradient-move">
            $POINTS Community
          </h1>
          <p className="text-dream-foreground/70 text-lg max-w-2xl mx-auto">
            Join the community, follow users, and participate in discussions to earn more $POINTS.
          </p>
        </div>
        
        <Tabs defaultValue="feed" onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="bg-white/5 border border-white/10">
              <TabsTrigger value="feed" className="data-[state=active]:bg-dream-accent1/20">
                Community Feed
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-dream-accent1/20">
                PXB Holders
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="feed" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <CreatePostForm />
                <Separator className="my-8 bg-white/10" />
                <MessagesFeed />
              </div>
              
              <div className="glass-panel p-4 h-fit">
                <h3 className="text-xl font-semibold mb-4 text-gradient">Top PXB Holders</h3>
                {users && <UsersList users={users.slice(0, 5)} simplified />}
                <button
                  onClick={() => setActiveTab("users")}
                  className="mt-4 w-full py-2 px-4 bg-dream-accent2/10 hover:bg-dream-accent2/20 border border-dream-accent2/30 rounded-md transition-all text-sm"
                >
                  See All Holders
                </button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="users">
            <div className="glass-panel p-6">
              <h2 className="text-2xl font-bold mb-6 text-gradient">All PXB Holders</h2>
              {usersLoading ? (
                <div className="flex justify-center p-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dream-accent1"></div>
                </div>
              ) : (
                <UsersList users={users || []} />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
};

export default PointsCommunity;
