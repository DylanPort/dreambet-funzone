import { supabase } from '@/integrations/supabase/client';
import { Post, Comment, UserProfile, Conversation, Message } from '@/types/community';
import { toast } from 'sonner';

// Export the types to fix import errors in components
export type { Post, Comment, UserProfile, Conversation, Message };

// Post functions
export const fetchPosts = async (): Promise<Post[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Fetch posts with user information
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select(`
        *,
        users:user_id (username, avatar_url, display_name)
      `)
      .order('created_at', { ascending: false })
      .limit(50);
      
    if (postsError) throw postsError;
    
    let posts: Post[] = [];
    
    if (postsData) {
      // Fetch like status if user is authenticated
      if (user) {
        const { data: likesData } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', user.id);
          
        const likedPostIds = new Set(likesData?.map(like => like.post_id) || []);
        
        posts = postsData.map((post: any) => ({
          id: post.id,
          user_id: post.user_id,
          content: post.content,
          image_url: post.image_url,
          likes_count: post.likes_count,
          comments_count: post.comments_count,
          created_at: post.created_at,
          updated_at: post.updated_at,
          username: post.users?.username,
          avatar_url: post.users?.avatar_url,
          display_name: post.users?.display_name,
          isLiked: likedPostIds.has(post.id)
        }));
      } else {
        posts = postsData.map((post: any) => ({
          id: post.id,
          user_id: post.user_id,
          content: post.content,
          image_url: post.image_url,
          likes_count: post.likes_count,
          comments_count: post.comments_count,
          created_at: post.created_at,
          updated_at: post.updated_at,
          username: post.users?.username,
          avatar_url: post.users?.avatar_url,
          display_name: post.users?.display_name,
          isLiked: false
        }));
      }
    }
    
    return posts;
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
};

export const fetchPostById = async (postId: string): Promise<Post | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Fetch post
    const { data: postData, error: postError } = await supabase
      .from('posts')
      .select(`
        *,
        users:user_id (username, avatar_url, display_name)
      `)
      .eq('id', postId)
      .single();
      
    if (postError) throw postError;
    
    if (!postData) return null;
    
    let isLiked = false;
    
    // Check if post is liked by current user
    if (user) {
      const { data: likeData } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();
        
      isLiked = !!likeData;
    }
    
    const post: Post = {
      id: postData.id,
      user_id: postData.user_id,
      content: postData.content,
      image_url: postData.image_url,
      likes_count: postData.likes_count,
      comments_count: postData.comments_count,
      created_at: postData.created_at,
      updated_at: postData.updated_at,
      username: postData.users?.username,
      avatar_url: postData.users?.avatar_url,
      display_name: postData.users?.display_name,
      isLiked
    };
    
    return post;
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
};

export const createPost = async (content: string, imageUrl?: string | null): Promise<Post | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error('You must be logged in to create a post');
      return null;
    }
    
    // Insert post
    const { data: postData, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        content,
        image_url: imageUrl || null,
        likes_count: 0,
        comments_count: 0
      })
      .select()
      .single();
      
    if (postError) throw postError;
    
    if (!postData) return null;
    
    // Get user info
    const { data: userData } = await supabase
      .from('users')
      .select('username, avatar_url, display_name')
      .eq('id', user.id)
      .single();
    
    const post: Post = {
      ...postData,
      username: userData?.username,
      avatar_url: userData?.avatar_url,
      display_name: userData?.display_name,
      isLiked: false
    };
    
    return post;
  } catch (error) {
    console.error('Error creating post:', error);
    toast.error('Failed to create post');
    return null;
  }
};

export const deletePost = async (postId: string): Promise<boolean> => {
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

export const likePost = async (postId: string): Promise<boolean | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error('You must be logged in to like a post');
      return null;
    }
    
    // Check if user already liked the post
    const { data: existingLike } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single();
    
    if (existingLike) {
      // Unlike: delete the like
      const { error: deleteError } = await supabase
        .from('post_likes')
        .delete()
        .eq('id', existingLike.id);
        
      if (deleteError) throw deleteError;
      
      // Decrement likes count manually
      const { data: postData } = await supabase
        .from('posts')
        .select('likes_count')
        .eq('id', postId)
        .single();
        
      if (postData) {
        await supabase
          .from('posts')
          .update({ likes_count: Math.max(0, postData.likes_count - 1) })
          .eq('id', postId);
      }
      
      return false;
    } else {
      // Like: insert a new like
      const { error: insertError } = await supabase
        .from('post_likes')
        .insert({
          post_id: postId,
          user_id: user.id
        });
        
      if (insertError) throw insertError;
      
      // Increment likes count manually
      const { data: postData } = await supabase
        .from('posts')
        .select('likes_count')
        .eq('id', postId)
        .single();
        
      if (postData) {
        await supabase
          .from('posts')
          .update({ likes_count: (postData.likes_count || 0) + 1 })
          .eq('id', postId);
      }
      
      return true;
    }
  } catch (error) {
    console.error('Error liking/unliking post:', error);
    toast.error('Failed to like/unlike post');
    return null;
  }
};

// Comment functions
export const fetchCommentsByPostId = async (postId: string): Promise<Comment[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Fetch comments
    const { data: commentsData, error: commentsError } = await supabase
      .from('comments')
      .select(`
        *,
        users:user_id (username, avatar_url, display_name)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
      
    if (commentsError) throw commentsError;
    
    let comments: Comment[] = [];
    
    if (commentsData) {
      // Fetch like status if user is authenticated
      if (user) {
        const { data: likesData } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .eq('user_id', user.id);
          
        const likedCommentIds = new Set(likesData?.map(like => like.comment_id) || []);
        
        comments = commentsData.map((comment: any) => ({
          id: comment.id,
          post_id: comment.post_id,
          user_id: comment.user_id,
          content: comment.content,
          likes_count: comment.likes_count,
          created_at: comment.created_at,
          updated_at: comment.updated_at,
          username: comment.users?.username,
          avatar_url: comment.users?.avatar_url,
          display_name: comment.users?.display_name,
          isLiked: likedCommentIds.has(comment.id)
        }));
      } else {
        comments = commentsData.map((comment: any) => ({
          id: comment.id,
          post_id: comment.post_id,
          user_id: comment.user_id,
          content: comment.content,
          likes_count: comment.likes_count,
          created_at: comment.created_at,
          updated_at: comment.updated_at,
          username: comment.users?.username,
          avatar_url: comment.users?.avatar_url,
          display_name: comment.users?.display_name,
          isLiked: false
        }));
      }
    }
    
    return comments;
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
};

export const createComment = async (postId: string, content: string): Promise<Comment | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error('You must be logged in to comment');
      return null;
    }
    
    // Insert comment
    const { data: commentData, error: commentError } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content,
        likes_count: 0
      })
      .select()
      .single();
      
    if (commentError) throw commentError;
    
    if (!commentData) return null;
    
    // Increment comment count manually
    const { data: postData } = await supabase
      .from('posts')
      .select('comments_count')
      .eq('id', postId)
      .single();
      
    if (postData) {
      await supabase
        .from('posts')
        .update({ comments_count: (postData.comments_count || 0) + 1 })
        .eq('id', postId);
    }
    
    // Get user info
    const { data: userData } = await supabase
      .from('users')
      .select('username, avatar_url, display_name')
      .eq('id', user.id)
      .single();
    
    const comment: Comment = {
      ...commentData,
      username: userData?.username,
      avatar_url: userData?.avatar_url,
      display_name: userData?.display_name,
      isLiked: false
    };
    
    return comment;
  } catch (error) {
    console.error('Error creating comment:', error);
    toast.error('Failed to create comment');
    return null;
  }
};

export const deleteComment = async (commentId: string, postId: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error('You must be logged in to delete a comment');
      return false;
    }
    
    // Delete comment
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', user.id);
      
    if (error) throw error;
    
    // Decrement comment count
    const { data: postData } = await supabase
      .from('posts')
      .select('comments_count')
      .eq('id', postId)
      .single();
      
    if (postData) {
      await supabase
        .from('posts')
        .update({ comments_count: Math.max(0, postData.comments_count - 1) })
        .eq('id', postId);
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting comment:', error);
    toast.error('Failed to delete comment');
    return false;
  }
};

export const likeComment = async (commentId: string): Promise<boolean | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error('You must be logged in to like a comment');
      return null;
    }
    
    // Check if user already liked the comment
    const { data: existingLike } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
      .single();
    
    if (existingLike) {
      // Unlike: delete the like
      const { error: deleteError } = await supabase
        .from('comment_likes')
        .delete()
        .eq('id', existingLike.id);
        
      if (deleteError) throw deleteError;
      
      // Decrement likes count
      const { data: commentData } = await supabase
        .from('comments')
        .select('likes_count')
        .eq('id', commentId)
        .single();
        
      if (commentData) {
        await supabase
          .from('comments')
          .update({ likes_count: Math.max(0, commentData.likes_count - 1) })
          .eq('id', commentId);
      }
      
      return false;
    } else {
      // Like: insert a new like
      const { error: insertError } = await supabase
        .from('comment_likes')
        .insert({
          comment_id: commentId,
          user_id: user.id
        });
        
      if (insertError) throw insertError;
      
      // Increment likes count
      const { data: commentData } = await supabase
        .from('comments')
        .select('likes_count')
        .eq('id', commentId)
        .single();
        
      if (commentData) {
        await supabase
          .from('comments')
          .update({ likes_count: (commentData.likes_count || 0) + 1 })
          .eq('id', commentId);
      }
      
      return true;
    }
  } catch (error) {
    console.error('Error liking/unliking comment:', error);
    toast.error('Failed to like/unlike comment');
    return null;
  }
};

// User Profile functions
export const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    // Fetch user profile
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (userError) throw userError;
    
    if (!userData) return null;
    
    // Get followers count
    const { count: followersCount, error: followersError } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);
      
    if (followersError) throw followersError;
    
    // Get following count
    const { count: followingCount, error: followingError } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId);
      
    if (followingError) throw followingError;
    
    // Check if current user is following this user
    let isFollowing = false;
    if (currentUser && currentUser.id !== userId) {
      const { data: followData } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentUser.id)
        .eq('following_id', userId)
        .single();
        
      isFollowing = !!followData;
    }
    
    // Cast userData to UserProfile with appropriate properties
    const userProfile: UserProfile = {
      id: userData.id,
      username: userData.username,
      wallet_address: userData.wallet_address,
      bio: userData.bio || null,
      avatar_url: userData.avatar_url || null,
      display_name: userData.display_name || null,
      points: userData.points || 0,
      followers_count: followersCount || 0,
      following_count: followingCount || 0,
      is_following: isFollowing,
      created_at: userData.created_at
    };
    
    return userProfile;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export const followUser = async (userId: string): Promise<boolean> => {
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
    
    // Insert follow
    const { error } = await supabase
      .from('follows')
      .insert({
        follower_id: user.id,
        following_id: userId
      });
      
    if (error) {
      if (error.code === '23505') { // Unique constraint error
        toast.error('You are already following this user');
      } else {
        throw error;
      }
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error following user:', error);
    toast.error('Failed to follow user');
    return false;
  }
};

export const unfollowUser = async (userId: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error('You must be logged in to unfollow users');
      return false;
    }
    
    // Delete follow
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', userId);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error unfollowing user:', error);
    toast.error('Failed to unfollow user');
    return false;
  }
};

export const searchUsers = async (query: string): Promise<UserProfile[]> => {
  try {
    if (!query || query.length < 2) return [];
    
    // Search users
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, username, avatar_url, display_name, wallet_address')
      .or(`username.ilike.%${query}%, wallet_address.ilike.%${query}%, display_name.ilike.%${query}%`)
      .limit(10);
      
    if (usersError) throw usersError;
    
    return usersData as UserProfile[];
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
};

// Message functions
export const fetchConversations = async (): Promise<Conversation[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error('You must be logged in to view conversations');
      return [];
    }
    
    // Use raw query for conversations until Types are updated
    const { data, error } = await supabase.rpc(
      'get_conversations',
      { user_id: user.id }
    );
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }
};

export const fetchMessages = async (otherUserId: string): Promise<Message[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error('You must be logged in to view messages');
      return [];
    }
    
    // Fetch messages between users
    const { data: messagesData, error: messagesError } = await supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id (username),
        recipient:recipient_id (username)
      `)
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`)
      .order('created_at', { ascending: true });
      
    if (messagesError) throw messagesError;
    
    // Mark messages as read
    if (messagesData && messagesData.length > 0) {
      const { error: updateError } = await supabase
        .from('messages')
        .update({
          is_read: true
        })
        .eq('recipient_id', user.id)
        .eq('sender_id', otherUserId);
        
      if (updateError) console.error('Error marking messages as read:', updateError);
    }
    
    const messages: Message[] = messagesData ? messagesData.map((msg: any) => ({
      id: msg.id,
      sender_id: msg.sender_id,
      recipient_id: msg.recipient_id,
      content: msg.content,
      is_read: msg.is_read,
      created_at: msg.created_at,
      sender_username: msg.sender?.username,
      recipient_username: msg.recipient?.username
    })) : [];
    
    return messages;
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
};

export const sendMessage = async (recipientId: string, content: string): Promise<Message | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error('You must be logged in to send messages');
      return null;
    }
    
    // Insert message
    const { data: messageData, error: messageError } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        recipient_id: recipientId,
        content,
        is_read: false
      })
      .select()
      .single();
      
    if (messageError) throw messageError;
    
    if (!messageData) return null;
    
    // Get user info
    const { data: userData } = await supabase
      .from('users')
      .select('username')
      .eq('id', user.id)
      .single();
      
    const { data: recipientData } = await supabase
      .from('users')
      .select('username')
      .eq('id', recipientId)
      .single();
    
    const message: Message = {
      ...messageData,
      sender_username: userData?.username || null,
      recipient_username: recipientData?.username || null
    };
    
    return message;
  } catch (error) {
    console.error('Error sending message:', error);
    toast.error('Failed to send message');
    return null;
  }
};

export const getUserPostsByUserId = async (userId: string): Promise<Post[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Fetch posts by user
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select(`
        *,
        users:user_id (username, avatar_url, display_name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (postsError) throw postsError;
    
    let posts: Post[] = [];
    
    if (postsData) {
      // Fetch like status if user is authenticated
      if (user) {
        const { data: likesData } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', user.id);
          
        const likedPostIds = new Set(likesData?.map(like => like.post_id) || []);
        
        posts = postsData.map((post: any) => ({
          id: post.id,
          user_id: post.user_id,
          content: post.content,
          image_url: post.image_url,
          likes_count: post.likes_count,
          comments_count: post.comments_count,
          created_at: post.created_at,
          updated_at: post.updated_at,
          username: post.users?.username,
          avatar_url: post.users?.avatar_url,
          display_name: post.users?.display_name,
          isLiked: likedPostIds.has(post.id)
        }));
      } else {
        posts = postsData.map((post: any) => ({
          id: post.id,
          user_id: post.user_id,
          content: post.content,
          image_url: post.image_url,
          likes_count: post.likes_count,
          comments_count: post.comments_count,
          created_at: post.created_at,
          updated_at: post.updated_at,
          username: post.users?.username,
          avatar_url: post.users?.avatar_url,
          display_name: post.users?.display_name,
          isLiked: false
        }));
      }
    }
    
    return posts;
  } catch (error) {
    console.error('Error fetching user posts:', error);
    return [];
  }
};
