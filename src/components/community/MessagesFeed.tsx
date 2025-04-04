
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Heart, Share } from 'lucide-react';
import { toast } from 'sonner';
import { PostComments } from './PostComments';

export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  user?: {
    username: string | null;
    wallet_address: string;
    avatar_url: string | null;
  };
  has_liked?: boolean;
}

export const MessagesFeed: React.FC = () => {
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  
  const { data: posts, isLoading, error, refetch } = useQuery({
    queryKey: ['communityPosts'],
    queryFn: async () => {
      const { data: authenticatedUser } = await supabase.auth.getSession();
      const userId = authenticatedUser.session?.user?.id;
      
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:users(
            username,
            wallet_address,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Cast data to the expected type to avoid TypeScript errors
      let postsWithLikeStatus = (data as unknown) as Post[];
      
      // If user is authenticated, check which posts they've liked
      if (userId) {
        const { data: likedPosts } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', userId);
        
        const likedPostIds = likedPosts?.map(like => like.post_id) || [];
        
        postsWithLikeStatus = postsWithLikeStatus.map(post => ({
          ...post,
          has_liked: likedPostIds.includes(post.id)
        }));
      }
      
      return postsWithLikeStatus;
    },
    // Increase refetch interval for better performance, we'll rely on real-time updates
    refetchInterval: 15000,
  });
  
  useEffect(() => {
    // Subscribe to realtime changes on posts table
    const postsChannel = supabase
      .channel('public:posts')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'posts'
      }, () => {
        console.log('Posts changed, refetching...');
        refetch();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(postsChannel);
    };
  }, [refetch]);
  
  const handleLikePost = async (postId: string, hasLiked: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('You need to be logged in to like posts');
        return;
      }
      
      const userId = session.user.id;
      
      if (hasLiked) {
        // Unlike the post
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);
          
        // Call the SQL function via RPC
        await supabase
          .rpc('decrement_post_likes', { post_id: postId });
      } else {
        // Like the post
        await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: userId });
          
        // Call the SQL function via RPC
        await supabase
          .rpc('increment_post_likes', { post_id: postId });
      }
      
      refetch();
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('Failed to like post');
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center p-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dream-accent1"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center text-red-400 p-6">
        Error loading posts. Please try again later.
      </div>
    );
  }
  
  if (!posts || posts.length === 0) {
    return (
      <div className="text-center p-10 border border-white/10 rounded-xl bg-white/5">
        <MessageSquare className="mx-auto h-12 w-12 text-white/40 mb-4" />
        <h3 className="text-xl font-medium mb-2">No posts yet</h3>
        <p className="text-white/60">Be the first to post in the community!</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {posts.map(post => (
        <div key={post.id} className="glass-panel p-5 animate-fade-in">
          <div className="flex items-start gap-4">
            <Avatar className="h-10 w-10 border border-dream-accent1/30">
              <AvatarImage src={post.user?.avatar_url || undefined} />
              <AvatarFallback className="bg-dream-accent3/20 text-dream-accent3">
                {post.user?.username ? post.user.username.substring(0, 2).toUpperCase() 
                  : post.user?.wallet_address.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="font-medium">
                  {post.user?.username || post.user?.wallet_address.slice(0, 6) + '...' + post.user?.wallet_address.slice(-4)}
                </div>
                <div className="text-sm text-white/40">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </div>
              </div>
              
              <div className="mt-2 text-white/90">{post.content}</div>
              
              {post.image_url && (
                <div className="mt-3 rounded-lg overflow-hidden">
                  <img src={post.image_url} alt="Post attachment" className="w-full h-auto object-cover" />
                </div>
              )}
              
              <div className="mt-4 flex items-center gap-6">
                <button 
                  onClick={() => post.has_liked !== undefined && handleLikePost(post.id, post.has_liked)}
                  className={`flex items-center gap-1.5 text-sm ${post.has_liked ? 'text-dream-accent2' : 'text-white/60 hover:text-white'}`}
                >
                  <Heart className={`h-4 w-4 ${post.has_liked ? 'fill-dream-accent2' : ''}`} />
                  <span>{post.likes_count}</span>
                </button>
                
                <button 
                  onClick={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)}
                  className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>{post.comments_count}</span>
                </button>
                
                <button className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white">
                  <Share className="h-4 w-4" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>
          
          {expandedPostId === post.id && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <PostComments postId={post.id} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
