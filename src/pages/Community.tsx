
import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { UserSearch } from '@/components/ui/user-search';
import OrbitingParticles from '@/components/OrbitingParticles';
import CreatePostForm from '@/components/community/CreatePostForm';
import PostCard from '@/components/community/PostCard';
import { useNavigate } from 'react-router-dom';
import { Users, MessageSquare, Activity } from 'lucide-react';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { Post } from '@/types/community';
import { usePosts } from '@/hooks/useSupabaseHooks';

const Community = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const { fetchPosts } = usePosts();
  
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    
    checkAuth();
  }, []);
  
  const loadPosts = async () => {
    setIsLoading(true);
    const postsData = await fetchPosts();
    setPosts(postsData);
    setIsLoading(false);
  };
  
  useEffect(() => {
    loadPosts();
  }, []);
  
  // Set up realtime subscription for new posts
  useEffect(() => {
    const channel = supabase
      .channel('public:posts')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'posts'
      }, () => {
        // Just reload all posts when a new one is created
        loadPosts();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  const handlePostDeleted = () => {
    loadPosts();
  };
  
  const handlePostLiked = (postId: string, isLiked: boolean) => {
    setPosts(prev => 
      prev.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              isLiked, 
              likes_count: isLiked ? post.likes_count + 1 : post.likes_count - 1 
            } 
          : post
      )
    );
  };

  return (
    <>
      <OrbitingParticles />
      <Navbar />
      
      <main className="pt-24 min-h-screen overflow-hidden px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-display font-bold mb-6">Community</h1>
          
          <div className="flex justify-between items-center mb-6">
            <div className="flex space-x-2">
              <Button 
                variant="ghost" 
                className="bg-indigo-900/20 hover:bg-indigo-900/30 border border-indigo-900/50"
                onClick={() => navigate('/community')}
              >
                <Activity className="h-4 w-4 mr-2" />
                Feed
              </Button>
              <Button
                variant="ghost"
                className="hover:bg-indigo-900/30 border border-indigo-900/50"
                onClick={() => navigate('/community/messages')}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Messages
              </Button>
            </div>
            
            <div className="w-56">
              <UserSearch 
                placeholder="Search users..." 
                onSelectUser={(user) => navigate(`/community/profile/${user.id}`)}
                buttonText="View"
              />
            </div>
          </div>
          
          {isAuthenticated ? (
            <CreatePostForm onPostCreated={loadPosts} />
          ) : (
            <div className="mb-6 p-4 bg-[#10121f] rounded-lg border border-indigo-900/30 text-center">
              <p className="text-gray-400 mb-2">Connect your wallet to share posts and interact with the community</p>
            </div>
          )}
          
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12 bg-[#10121f] rounded-lg border border-indigo-900/30">
                <p className="text-gray-400 mb-2">No posts yet</p>
                <p className="text-gray-500 text-sm mt-1">Be the first to share something with the community!</p>
              </div>
            ) : (
              posts.map(post => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  onPostDeleted={handlePostDeleted}
                  onPostLiked={handlePostLiked}
                />
              ))
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </>
  );
};

export default Community;
