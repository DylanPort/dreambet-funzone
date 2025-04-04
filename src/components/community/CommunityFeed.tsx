
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import CreatePostForm from './CreatePostForm';
import PostCard from './PostCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  likes_count: number;
  comments_count: number;
  username?: string;
  avatar_url?: string;
}

const CommunityFeed = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [feedType, setFeedType] = useState<'latest' | 'popular'>('latest');

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          setUserId(data.user.id);
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };

    fetchCurrentUser();
    fetchPosts();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('public:posts')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'posts' 
      }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [feedType]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('posts')
        .select(`
          *,
          users (username, avatar_url)
        `);
      
      if (feedType === 'latest') {
        query = query.order('created_at', { ascending: false });
      } else {
        query = query.order('likes_count', { ascending: false });
      }
      
      const { data, error } = await query.limit(20);
      
      if (error) throw error;
      
      if (data) {
        // Transform data to flatten user info
        const transformedPosts = data.map(post => ({
          ...post,
          username: post.users?.username || 'Unknown User',
          avatar_url: post.users?.avatar_url
        }));
        
        setPosts(transformedPosts);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handlePostSuccess = () => {
    fetchPosts();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-dream-foreground">Community Feed</h2>
      
      {userId && (
        <CreatePostForm userId={userId} onSuccess={handlePostSuccess} />
      )}
      
      <Tabs defaultValue="latest" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-black/20 text-dream-muted">
          <TabsTrigger 
            value="latest" 
            onClick={() => setFeedType('latest')}
            className="data-[state=active]:bg-dream-accent1 data-[state=active]:text-white"
          >
            Latest
          </TabsTrigger>
          <TabsTrigger 
            value="popular" 
            onClick={() => setFeedType('popular')}
            className="data-[state=active]:bg-dream-accent1 data-[state=active]:text-white"
          >
            Popular
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="latest" className="mt-6">
          {loading ? (
            <div className="text-center py-10">
              <div className="animate-spin h-10 w-10 border-4 border-dream-accent1 rounded-full border-t-transparent mx-auto"></div>
              <p className="mt-4 text-dream-muted">Loading posts...</p>
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-6">
              {posts.map(post => (
                <PostCard
                  key={post.id}
                  id={post.id}
                  userId={post.user_id}
                  username={post.username || 'Unknown User'}
                  avatarUrl={post.avatar_url}
                  content={post.content}
                  imageUrl={post.image_url || undefined}
                  createdAt={post.created_at}
                  likesCount={post.likes_count}
                  commentsCount={post.comments_count}
                  onLikeUpdate={fetchPosts}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-dream-muted">No posts yet. Be the first to post!</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="popular" className="mt-6">
          {loading ? (
            <div className="text-center py-10">
              <div className="animate-spin h-10 w-10 border-4 border-dream-accent1 rounded-full border-t-transparent mx-auto"></div>
              <p className="mt-4 text-dream-muted">Loading popular posts...</p>
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-6">
              {posts.map(post => (
                <PostCard
                  key={post.id}
                  id={post.id}
                  userId={post.user_id}
                  username={post.username || 'Unknown User'}
                  avatarUrl={post.avatar_url}
                  content={post.content}
                  imageUrl={post.image_url || undefined}
                  createdAt={post.created_at}
                  likesCount={post.likes_count}
                  commentsCount={post.comments_count}
                  onLikeUpdate={fetchPosts}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-dream-muted">No posts yet. Be the first to post!</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CommunityFeed;
