
import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { User, Search, MessageSquare, Bell, Users, Home } from 'lucide-react';
import PostCard from '@/components/community/PostCard';
import CreatePostForm from '@/components/community/CreatePostForm';
import UserSearch from '@/components/community/UserSearch';
import { fetchPosts, Post } from '@/services/communityService';
import { getUnreadMessageCount } from '@/services/communityService';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

const Community: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const loadPosts = async (refresh: boolean = false) => {
    if (refresh) {
      setIsLoading(true);
    } else {
      setLoadingMore(true);
    }
    
    const offset = refresh ? 0 : posts.length;
    const limit = 10;
    
    const newPosts = await fetchPosts(limit, offset);
    
    if (refresh) {
      setPosts(newPosts);
      setIsLoading(false);
    } else {
      setPosts(prev => [...prev, ...newPosts]);
      setLoadingMore(false);
    }
    
    setHasMore(newPosts.length === limit);
  };
  
  useEffect(() => {
    loadPosts(true);
    
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      if (user) {
        setCurrentUserId(user.id);
        // Load unread message count
        const count = await getUnreadMessageCount();
        setUnreadMessages(count);
      }
    };
    
    checkAuth();
    
    // Set up realtime subscription for posts
    const channel = supabase
      .channel('public:posts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts'
        },
        (payload) => {
          // Refresh posts when a new one is created
          loadPosts(true);
        }
      )
      .subscribe();
    
    // Set up realtime subscription for messages count
    const messageChannel = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: currentUserId ? `recipient_id=eq.${currentUserId}` : undefined
        },
        async () => {
          // Update unread message count
          const count = await getUnreadMessageCount();
          setUnreadMessages(count);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(messageChannel);
    };
  }, [currentUserId]);
  
  const handlePostDeleted = () => {
    loadPosts(true);
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
      <Navbar />
      <main className="min-h-screen bg-[#080b16] bg-gradient-to-b from-[#0a0e1c] to-[#070a14]">
        <div className="max-w-6xl mx-auto px-4 pt-24 pb-16">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar */}
            <div className="lg:w-1/4">
              <div className="bg-[#10121f] border border-indigo-900/30 rounded-lg p-4 mb-6 sticky top-24">
                <h2 className="text-xl font-bold text-white mb-4">Community</h2>
                
                <div className="space-y-2 mb-6">
                  <Link to="/community">
                    <Button variant="ghost" className="w-full justify-start">
                      <Home className="mr-2 h-5 w-5" /> Home
                    </Button>
                  </Link>
                  <Link to="/community/users">
                    <Button variant="ghost" className="w-full justify-start">
                      <Users className="mr-2 h-5 w-5" /> Discover Users
                    </Button>
                  </Link>
                  <Link to="/community/search">
                    <Button variant="ghost" className="w-full justify-start">
                      <Search className="mr-2 h-5 w-5" /> Search
                    </Button>
                  </Link>
                  
                  {isAuthenticated && (
                    <>
                      <Link to="/community/messages">
                        <Button variant="ghost" className="w-full justify-start relative">
                          <MessageSquare className="mr-2 h-5 w-5" /> Messages
                          {unreadMessages > 0 && (
                            <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                              {unreadMessages > 9 ? '9+' : unreadMessages}
                            </span>
                          )}
                        </Button>
                      </Link>
                      <Link to="/community/notifications">
                        <Button variant="ghost" className="w-full justify-start">
                          <Bell className="mr-2 h-5 w-5" /> Notifications
                        </Button>
                      </Link>
                      <Link to={`/community/profile/${currentUserId}`}>
                        <Button variant="ghost" className="w-full justify-start">
                          <User className="mr-2 h-5 w-5" /> My Profile
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
                
                <UserSearch className="mb-4" />
                
                {!isAuthenticated && (
                  <div className="mt-6 p-4 bg-indigo-900/20 rounded-lg text-center">
                    <p className="text-white mb-3">Sign in to participate in the community</p>
                    <Link to="/profile">
                      <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                        Connect Wallet
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
            
            {/* Main content */}
            <div className="lg:w-3/4">
              {isAuthenticated && (
                <CreatePostForm onPostCreated={() => loadPosts(true)} />
              )}
              
              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-10 bg-[#10121f] border border-indigo-900/30 rounded-lg">
                  <p className="text-xl text-white mb-2">No posts yet</p>
                  <p className="text-gray-400">Be the first to share something with the community!</p>
                </div>
              ) : (
                <div>
                  {posts.map(post => (
                    <PostCard 
                      key={post.id} 
                      post={post} 
                      onPostDeleted={handlePostDeleted}
                      onPostLiked={handlePostLiked}
                    />
                  ))}
                  
                  {hasMore && (
                    <div className="flex justify-center mt-6">
                      <Button
                        onClick={() => loadPosts()}
                        disabled={loadingMore}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        {loadingMore ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Loading...
                          </>
                        ) : (
                          'Load More'
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Community;
