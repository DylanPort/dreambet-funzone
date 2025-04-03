
import { supabase } from '@/integrations/supabase/client';
import { Post, Comment, UserProfile, Conversation, Message } from '@/types/community';
import { toast } from 'sonner';

// Posts related hooks
export const usePosts = () => {
  const fetchPosts = async (): Promise<Post[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get posts with RPC call
      const { data, error } = await supabase.rpc('get_posts');
      
      if (error) throw error;
      
      if (!data) return [];
      
      // If user is logged in, check which posts they've liked
      let likedPostIds = new Set<string>();
      
      if (user) {
        const { data: likesData } = await supabase.rpc('get_user_post_likes', {
          user_id: user.id
        });
        
        if (likesData) {
          likedPostIds = new Set(likesData.map((like: any) => like.post_id));
        }
      }
      
      // Format posts data
      const posts: Post[] = data.map((post: any) => ({
        id: post.id,
        user_id: post.user_id,
        content: post.content,
        image_url: post.image_url,
        likes_count: post.likes_count,
        comments_count: post.comments_count,
        created_at: post.created_at,
        updated_at: post.updated_at,
        username: post.username,
        avatar_url: post.avatar_url,
        display_name: post.display_name,
        isLiked: likedPostIds.has(post.id)
      }));
      
      return posts;
    } catch (error) {
      console.error('Error fetching posts:', error);
      return [];
    }
  };

  const fetchPostById = async (postId: string): Promise<Post | null> => {
    try {
      // Get post with RPC call
      const { data, error } = await supabase.rpc('get_post_by_id', {
        post_id: postId
      });
      
      if (error) throw error;
      
      if (!data || data.length === 0) return null;
      
      const post = data[0];
      
      // Check if post is liked by current user
      const { data: { user } } = await supabase.auth.getUser();
      let isLiked = false;
      
      if (user) {
        const { data: likeData } = await supabase.rpc('is_post_liked_by_user', {
          p_post_id: postId,
          p_user_id: user.id
        });
        
        isLiked = likeData && likeData.length > 0;
      }
      
      return {
        id: post.id,
        user_id: post.user_id,
        content: post.content,
        image_url: post.image_url,
        likes_count: post.likes_count,
        comments_count: post.comments_count,
        created_at: post.created_at,
        updated_at: post.updated_at,
        username: post.username,
        avatar_url: post.avatar_url,
        display_name: post.display_name,
        isLiked
      };
    } catch (error) {
      console.error('Error fetching post:', error);
      return null;
    }
  };

  const createPost = async (content: string, imageUrl?: string | null): Promise<Post | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('You must be logged in to create a post');
        return null;
      }
      
      // Use simpler approach without RPC - direct table insert
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content,
          image_url: imageUrl || null
        })
        .select()
        .single();
      
      if (error) throw error;
      
      if (!data) return null;
      
      // Get user info
      const { data: userData } = await supabase
        .from('users')
        .select('username, avatar_url, display_name')
        .eq('id', user.id)
        .single();
      
      const post: Post = {
        ...data,
        username: userData?.username || null,
        avatar_url: userData?.avatar_url || null,
        display_name: userData?.display_name || null,
        isLiked: false
      };
      
      return post;
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
      return null;
    }
  };

  const likePost = async (postId: string): Promise<boolean | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('You must be logged in to like a post');
        return null;
      }
      
      // Call RPC function to toggle post like
      const { data, error } = await supabase.rpc('toggle_post_like', {
        p_post_id: postId,
        p_user_id: user.id
      });
      
      if (error) throw error;
      
      return data; // Returns true if liked, false if unliked
    } catch (error) {
      console.error('Error liking/unliking post:', error);
      toast.error('Failed to like/unlike post');
      return null;
    }
  };

  const deletePost = async (postId: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('You must be logged in to delete a post');
        return false;
      }
      
      // Delete post
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
      return false;
    }
  };

  return {
    fetchPosts,
    fetchPostById,
    createPost,
    likePost,
    deletePost
  };
};

// User profile related hooks
export const useProfile = () => {
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      // Get user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (userError) throw userError;
      
      if (!userData) return null;
      
      // Get followers count using RPC
      const { data: followersCountData } = await supabase.rpc('get_followers_count', {
        user_id: userId
      });
      
      // Get following count using RPC
      const { data: followingCountData } = await supabase.rpc('get_following_count', {
        user_id: userId
      });
      
      // Check if current user is following this user
      let isFollowing = false;
      if (currentUser && currentUser.id !== userId) {
        const { data: followingData } = await supabase.rpc('is_following', {
          follower_id: currentUser.id,
          following_id: userId
        });
        
        isFollowing = !!followingData;
      }
      
      // Get posts count
      const { count: postsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      const userProfile: UserProfile = {
        id: userData.id,
        username: userData.username,
        wallet_address: userData.wallet_address,
        bio: userData.bio || null,
        avatar_url: userData.avatar_url || null,
        display_name: userData.display_name || null,
        followers_count: followersCountData || 0,
        following_count: followingCountData || 0,
        posts_count: postsCount || 0,
        is_following: isFollowing,
        points: userData.points || 0,
        created_at: userData.created_at
      };
      
      return userProfile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  const followUser = async (userId: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('You must be logged in to follow users');
        return false;
      }
      
      if (user.id === userId) {
        toast.error('You cannot follow yourself');
        return false;
      }
      
      // Call RPC function to follow user
      const { data, error } = await supabase.rpc('follow_user', {
        p_follower_id: user.id,
        p_following_id: userId
      });
      
      if (error) throw error;
      
      return true;
    } catch (error: any) {
      console.error('Error following user:', error);
      
      if (error.code === '23505') { // Unique constraint error
        toast.error('You are already following this user');
      } else {
        toast.error('Failed to follow user');
      }
      
      return false;
    }
  };

  const unfollowUser = async (userId: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('You must be logged in to unfollow users');
        return false;
      }
      
      // Call RPC function to unfollow user
      const { error } = await supabase.rpc('unfollow_user', {
        p_follower_id: user.id,
        p_following_id: userId
      });
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      toast.error('Failed to unfollow user');
      return false;
    }
  };

  const getUserPostsByUserId = async (userId: string): Promise<Post[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get user posts with RPC
      const { data, error } = await supabase.rpc('get_user_posts', {
        p_user_id: userId
      });
      
      if (error) throw error;
      
      if (!data) return [];
      
      // If user is logged in, check which posts they've liked
      let likedPostIds = new Set<string>();
      
      if (user) {
        const { data: likesData } = await supabase.rpc('get_user_post_likes', {
          user_id: user.id
        });
        
        if (likesData) {
          likedPostIds = new Set(likesData.map((like: any) => like.post_id));
        }
      }
      
      // Format posts data
      const posts: Post[] = data.map((post: any) => ({
        id: post.id,
        user_id: post.user_id,
        content: post.content,
        image_url: post.image_url,
        likes_count: post.likes_count,
        comments_count: post.comments_count,
        created_at: post.created_at,
        updated_at: post.updated_at,
        username: post.username,
        avatar_url: post.avatar_url,
        display_name: post.display_name,
        isLiked: likedPostIds.has(post.id)
      }));
      
      return posts;
    } catch (error) {
      console.error('Error fetching user posts:', error);
      return [];
    }
  };

  return {
    fetchUserProfile,
    followUser,
    unfollowUser,
    getUserPostsByUserId
  };
};

// Comments related hooks
export const useComments = () => {
  // We'll implement these as needed
  return {};
};

// Messages related hooks
export const useMessages = () => {
  // We'll implement these as needed
  return {};
};
