
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import PostCard from './PostCard';
import { Loader2 } from 'lucide-react';
import { Post } from '@/types/pxb';

interface CommunityFeedProps {
  refreshTrigger?: number;
}

const CommunityFeed = ({ refreshTrigger = 0 }: CommunityFeedProps) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortingOption, setSortingOption] = useState<'recent' | 'popular'>('recent');

  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order(sortingOption === 'recent' ? 'created_at' : 'comments_count', { ascending: false });
      
      if (postsError) throw postsError;
      
      // For each post, fetch user information
      if (postsData) {
        const postsWithUserInfo = await Promise.all(
          postsData.map(async (post) => {
            try {
              const { data: userData, error: userError } = await supabase
                .from('users')
                .select('username, avatar_url')
                .eq('id', post.user_id)
                .single();
              
              if (userError) throw userError;
              
              return {
                ...post,
                username: userData?.username || 'Unknown User',
                avatar_url: userData?.avatar_url || null
              };
            } catch (error) {
              console.error(`Error fetching user data for post ${post.id}:`, error);
              return {
                ...post,
                username: 'Unknown User',
                avatar_url: null
              };
            }
          })
        );
        
        setPosts(postsWithUserInfo);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    
    // Set up real-time subscription for posts
    const channel = supabase
      .channel('community-posts-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'posts' 
        }, 
        () => {
          fetchPosts();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sortingOption, refreshTrigger]);

  const handleRefresh = () => {
    fetchPosts();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-dream-foreground">Community Feed</h2>
        
        <div className="flex items-center gap-4">
          <div className="flex rounded-lg overflow-hidden shadow-sm">
            <button
              onClick={() => setSortingOption('recent')}
              className={`px-3 py-1.5 text-sm ${
                sortingOption === 'recent'
                  ? 'bg-purple-600 text-white'
                  : 'bg-dream-background/70 text-muted-foreground hover:bg-dream-background/90'
              }`}
            >
              Recent
            </button>
            <button
              onClick={() => setSortingOption('popular')}
              className={`px-3 py-1.5 text-sm ${
                sortingOption === 'popular'
                  ? 'bg-purple-600 text-white'
                  : 'bg-dream-background/70 text-muted-foreground hover:bg-dream-background/90'
              }`}
            >
              Popular
            </button>
          </div>
          
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-full bg-dream-background/70 hover:bg-dream-background/90 text-muted-foreground hover:text-dream-foreground transition-colors"
            title="Refresh feed"
          >
            <Loader2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-60">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      ) : posts.length === 0 ? (
        <div className="glass-panel py-12 text-center">
          <p className="text-lg text-muted-foreground">No posts yet. Be the first to share something!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onInteraction={handleRefresh} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommunityFeed;
