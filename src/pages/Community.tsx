
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CommunityFeed from '@/components/community/CommunityFeed';
import UsersList from '@/components/community/UsersList';
import CreatePostForm from '@/components/community/CreatePostForm';
import { supabase } from '@/integrations/supabase/client';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { Loader2 } from 'lucide-react';

const Community = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { userProfile } = usePXBPoints();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    // Initial loading delay to ensure components are ready
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleNewPost = () => {
    // Trigger a refresh of the feed when a new post is created
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-dream-background flex flex-col">
      <Navbar />
      
      <main className="flex-grow px-4 py-8 mt-16">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-dream-foreground">Community</h1>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : (
            <>
              <CreatePostForm onPostCreated={handleNewPost} userProfile={userProfile} />
              
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-8">
                <div className="lg:col-span-1">
                  <UsersList />
                </div>
                
                <div className="lg:col-span-3">
                  <CommunityFeed refreshTrigger={refreshTrigger} />
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Community;
