
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  username?: string;
  isLiked?: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
  username?: string;
  isLiked?: boolean;
}

export interface UserProfile {
  id: string;
  username: string | null;
  wallet_address: string;
  points: number | null;
  bio: string | null;
  avatar_url: string | null;
  display_name: string | null;
  followers_count?: number;
  following_count?: number;
  is_following?: boolean;
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_username?: string;
  recipient_username?: string;
}

// Posts functions
export const fetchPosts = async (limit = 20, offset = 0) => {
  try {
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        *,
        users (username, avatar_url, display_name)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Get current user to check if posts are liked
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Check which posts are liked by the current user
      const { data: likedPosts, error: likesError } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id);
        
      if (!likesError && likedPosts) {
        const likedPostIds = new Set(likedPosts.map(like => like.post_id));
        
        // Transform posts with additional information
        return posts?.map(post => ({
          ...post,
          username: post.users?.username || 'Anonymous',
          avatar_url: post.users?.avatar_url,
          display_name: post.users?.display_name,
          isLiked: likedPostIds.has(post.id)
        })) || [];
      }
    }
    
    // If user is not authenticated or there was an error with likes
    return posts?.map(post => ({
      ...post,
      username: post.users?.username || 'Anonymous',
      avatar_url: post.users?.avatar_url,
      display_name: post.users?.display_name,
      isLiked: false
    })) || [];
  } catch (error) {
    console.error('Error fetching posts:', error);
    toast.error('Failed to load posts');
    return [];
  }
};

export const fetchUserPosts = async (userId: string, limit = 20, offset = 0) => {
  try {
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        *,
        users (username, avatar_url, display_name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Get current user to check if posts are liked
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Check which posts are liked by the current user
      const { data: likedPosts, error: likesError } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id);
        
      if (!likesError && likedPosts) {
        const likedPostIds = new Set(likedPosts.map(like => like.post_id));
        
        return posts?.map(post => ({
          ...post,
          username: post.users?.username || 'Anonymous',
          avatar_url: post.users?.avatar_url,
          display_name: post.users?.display_name,
          isLiked: likedPostIds.has(post.id)
        })) || [];
      }
    }
    
    return posts?.map(post => ({
      ...post,
      username: post.users?.username || 'Anonymous',
      avatar_url: post.users?.avatar_url,
      display_name: post.users?.display_name,
      isLiked: false
    })) || [];
  } catch (error) {
    console.error('Error fetching user posts:', error);
    toast.error('Failed to load posts');
    return [];
  }
};

export const createPost = async (content: string, imageUrl?: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('You must be logged in to create a post');

    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        content,
        image_url: imageUrl,
      })
      .select()
      .single();

    if (error) throw error;
    
    toast.success('Post created successfully');
    return data;
  } catch (error) {
    console.error('Error creating post:', error);
    toast.error('Failed to create post');
    return null;
  }
};

export const deletePost = async (postId: string) => {
  try {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) throw error;
    
    toast.success('Post deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting post:', error);
    toast.error('Failed to delete post');
    return false;
  }
};

export const likePost = async (postId: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('You must be logged in to like a post');

    // Check if already liked
    const { data: existingLike, error: checkError } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existingLike) {
      // Unlike
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('id', existingLike.id);

      if (error) throw error;
      
      // Decrement likes count
      await supabase
        .rpc('decrement_post_likes', { post_id: postId });
      
      return false; // Not liked anymore
    } else {
      // Like
      const { error } = await supabase
        .from('post_likes')
        .insert({
          post_id: postId,
          user_id: user.id,
        });

      if (error) throw error;
      
      // Increment likes count
      await supabase
        .rpc('increment_post_likes', { post_id: postId });
      
      return true; // Now liked
    }
  } catch (error) {
    console.error('Error toggling post like:', error);
    toast.error('Failed to like/unlike post');
    return null;
  }
};

// Comments functions
export const fetchComments = async (postId: string, limit = 50, offset = 0) => {
  try {
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        *,
        users (username, avatar_url, display_name)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Get current user to check if comments are liked
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Check which comments are liked by the current user
      const { data: likedComments, error: likesError } = await supabase
        .from('comment_likes')
        .select('comment_id')
        .eq('user_id', user.id);
        
      if (!likesError && likedComments) {
        const likedCommentIds = new Set(likedComments.map(like => like.comment_id));
        
        return comments?.map(comment => ({
          ...comment,
          username: comment.users?.username || 'Anonymous',
          avatar_url: comment.users?.avatar_url,
          display_name: comment.users?.display_name,
          isLiked: likedCommentIds.has(comment.id)
        })) || [];
      }
    }
    
    return comments?.map(comment => ({
      ...comment,
      username: comment.users?.username || 'Anonymous',
      avatar_url: comment.users?.avatar_url,
      display_name: comment.users?.display_name,
      isLiked: false
    })) || [];
  } catch (error) {
    console.error('Error fetching comments:', error);
    toast.error('Failed to load comments');
    return [];
  }
};

export const createComment = async (postId: string, content: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('You must be logged in to comment');

    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content,
      })
      .select()
      .single();

    if (error) throw error;
    
    // Increment comment count on post
    await supabase
      .rpc('increment_post_comments', { post_id: postId });
    
    toast.success('Comment added');
    return data;
  } catch (error) {
    console.error('Error creating comment:', error);
    toast.error('Failed to add comment');
    return null;
  }
};

export const deleteComment = async (commentId: string, postId: string) => {
  try {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;
    
    // Decrement comment count on post
    await supabase
      .rpc('decrement_post_comments', { post_id: postId });
    
    toast.success('Comment deleted');
    return true;
  } catch (error) {
    console.error('Error deleting comment:', error);
    toast.error('Failed to delete comment');
    return false;
  }
};

export const likeComment = async (commentId: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('You must be logged in to like a comment');

    // Check if already liked
    const { data: existingLike, error: checkError } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existingLike) {
      // Unlike
      const { error } = await supabase
        .from('comment_likes')
        .delete()
        .eq('id', existingLike.id);

      if (error) throw error;
      
      // Decrement likes count
      await supabase
        .rpc('decrement_comment_likes', { comment_id: commentId });
      
      return false; // Not liked anymore
    } else {
      // Like
      const { error } = await supabase
        .from('comment_likes')
        .insert({
          comment_id: commentId,
          user_id: user.id,
        });

      if (error) throw error;
      
      // Increment likes count
      await supabase
        .rpc('increment_comment_likes', { comment_id: commentId });
      
      return true; // Now liked
    }
  } catch (error) {
    console.error('Error toggling comment like:', error);
    toast.error('Failed to like/unlike comment');
    return null;
  }
};

// User Profile functions
export const fetchUserProfile = async (userId: string) => {
  try {
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    // Get follower and following counts
    const { count: followersCount, error: followersError } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);

    const { count: followingCount, error: followingError } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId);

    if (followersError) console.error('Error fetching followers count:', followersError);
    if (followingError) console.error('Error fetching following count:', followingError);

    // Check if current user is following this profile
    const { data: { user } } = await supabase.auth.getUser();
    let isFollowing = false;
    
    if (user) {
      const { data: followRecord, error: followCheckError } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .maybeSingle();
        
      if (!followCheckError) {
        isFollowing = !!followRecord;
      }
    }

    return {
      ...profile,
      followers_count: followersCount || 0,
      following_count: followingCount || 0,
      is_following: isFollowing
    } as UserProfile;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    toast.error('Failed to load user profile');
    return null;
  }
};

export const followUser = async (userId: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('You must be logged in to follow users');
    if (user.id === userId) throw new Error('You cannot follow yourself');

    // Check if already following
    const { data: existingFollow, error: checkError } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', userId)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existingFollow) {
      // Unfollow
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('id', existingFollow.id);

      if (error) throw error;
      
      toast.success('Unfollowed user');
      return false; // Not following anymore
    } else {
      // Follow
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: userId,
        });

      if (error) throw error;
      
      toast.success('Following user');
      return true; // Now following
    }
  } catch (error) {
    console.error('Error toggling follow:', error);
    toast.error('Failed to follow/unfollow user');
    return null;
  }
};

export const updateUserProfile = async (
  bio?: string, 
  displayName?: string, 
  avatarUrl?: string
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('You must be logged in to update your profile');

    const updates: any = {};
    if (bio !== undefined) updates.bio = bio;
    if (displayName !== undefined) updates.display_name = displayName;
    if (avatarUrl !== undefined) updates.avatar_url = avatarUrl;

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    
    toast.success('Profile updated successfully');
    return data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    toast.error('Failed to update profile');
    return null;
  }
};

export const searchUsers = async (query: string, limit = 20) => {
  try {
    if (!query || query.length < 2) return [];
    
    const { data, error } = await supabase
      .from('users')
      .select('id, username, wallet_address, avatar_url, display_name')
      .or(`username.ilike.%${query}%,wallet_address.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(limit);

    if (error) throw error;
    
    return data as Pick<UserProfile, 'id' | 'username' | 'wallet_address' | 'avatar_url' | 'display_name'>[];
  } catch (error) {
    console.error('Error searching users:', error);
    toast.error('Failed to search users');
    return [];
  }
};

// Messages functions
export const fetchConversations = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('You must be logged in to view messages');

    // This query finds the latest message for each unique conversation
    const { data, error } = await supabase.rpc('get_conversations', {
      user_id: user.id
    });

    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching conversations:', error);
    toast.error('Failed to load conversations');
    return [];
  }
};

export const fetchMessages = async (otherUserId: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('You must be logged in to view messages');

    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id(username, avatar_url, display_name),
        recipient:recipient_id(username, avatar_url, display_name)
      `)
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    // Mark messages as read if they're from the other user
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', otherUserId)
      .eq('recipient_id', user.id)
      .eq('is_read', false);
    
    return data?.map(message => ({
      ...message,
      sender_username: message.sender?.username || 'Anonymous',
      recipient_username: message.recipient?.username || 'Anonymous',
    })) || [];
  } catch (error) {
    console.error('Error fetching messages:', error);
    toast.error('Failed to load messages');
    return [];
  }
};

export const sendMessage = async (recipientId: string, content: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('You must be logged in to send messages');

    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        recipient_id: recipientId,
        content,
      })
      .select()
      .single();

    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error sending message:', error);
    toast.error('Failed to send message');
    return null;
  }
};

export const markMessageAsRead = async (messageId: string) => {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', messageId);

    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error marking message as read:', error);
    return false;
  }
};

export const getUnreadMessageCount = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', user.id)
      .eq('is_read', false);

    if (error) throw error;
    
    return count || 0;
  } catch (error) {
    console.error('Error getting unread message count:', error);
    return 0;
  }
};
