
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowUpIcon, MessageSquare, TrendingUp, Clock, RefreshCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import CreatePostForm from './CreatePostForm';
import PostCard from './PostCard';
import { toast } from 'sonner';

export type Post = {
  id: string;
  user_id: string;
  content: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  likes_count: number;
  comments_count: number;
  username?: string;
  avatar_url?: string;
};

type SortOption = 'latest' | 'trending' | 'top';

const CommunityFeed = () => {
  const { userProfile } = usePXBPoints();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [showCreatePost, setShowCreatePost] = useState(false);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('posts')
        .select(`
          *,
          users:user_id (username, avatar_url)
        `);

      // Apply sorting
      if (sortBy === 'latest') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'top') {
        query = query.order('likes_count', { ascending: false });
      } else if (sortBy === 'trending') {
        query = query.order('comments_count', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching posts:', error);
        toast.error('Failed to load community posts');
        return;
      }

      // Transform the data to match our Post type
      const transformedPosts = data.map(post => ({
        ...post,
        username: post.users?.username,
        avatar_url: post.users?.avatar_url,
      }));

      setPosts(transformedPosts);
    } catch (error) {
      console.error('Error in fetchPosts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();

    // Set up real-time subscription
    const postsChannel = supabase
      .channel('public:posts')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'posts' 
      }, payload => {
        console.log('Post change received:', payload);
        fetchPosts(); // Refresh the list when changes occur
      })
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
    };
  }, [sortBy]);

  const handleRefresh = () => {
    fetchPosts();
    toast.success('Feed refreshed');
  };

  return (
    <div className="space-y-4">
      <Card className="glass-panel">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle>Community Feed</CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleRefresh}
                className="text-dream-accent2"
              >
                <RefreshCcw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
              {userProfile && (
                <Button 
                  onClick={() => setShowCreatePost(!showCreatePost)}
                  variant="outline"
                  size="sm"
                  className="border-dream-accent1 text-dream-accent1 hover:bg-dream-accent1/10"
                >
                  {showCreatePost ? 'Cancel' : 'New Post'}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {showCreatePost && userProfile && (
            <div className="mb-6">
              <CreatePostForm 
                userId={userProfile.id} 
                onSuccess={() => {
                  setShowCreatePost(false);
                  fetchPosts();
                }} 
              />
            </div>
          )}

          <Tabs defaultValue="latest" className="w-full mb-6" onValueChange={(value) => setSortBy(value as SortOption)}>
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="latest" className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">Latest</span>
              </TabsTrigger>
              <TabsTrigger value="trending" className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Trending</span>
              </TabsTrigger>
              <TabsTrigger value="top" className="flex items-center gap-1">
                <ArrowUpIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Top</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="latest" className="mt-0">
              {loading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin h-8 w-8 border-2 border-dream-accent1 rounded-full border-t-transparent"></div>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-2" />
                  <p className="text-muted-foreground">No posts yet. Be the first to share something!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map(post => (
                    <PostCard key={post.id} post={post} onUpdate={fetchPosts} />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="trending" className="mt-0">
              {/* Content is the same, switching tabs changes the sortBy state and triggers a refetch */}
              {loading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin h-8 w-8 border-2 border-dream-accent1 rounded-full border-t-transparent"></div>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-2" />
                  <p className="text-muted-foreground">No trending posts yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map(post => (
                    <PostCard key={post.id} post={post} onUpdate={fetchPosts} />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="top" className="mt-0">
              {/* Content is the same, switching tabs changes the sortBy state and triggers a refetch */}
              {loading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin h-8 w-8 border-2 border-dream-accent1 rounded-full border-t-transparent"></div>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-2" />
                  <p className="text-muted-foreground">No top posts yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map(post => (
                    <PostCard key={post.id} post={post} onUpdate={fetchPosts} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommunityFeed;
