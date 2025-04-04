
import { supabase } from "@/integrations/supabase/client";
import { Post, Comment, PostLike, CommentLike, UserProfile } from "@/types/pxb";
import { toast } from "sonner";

// Function to fetch all users
export const fetchAllUsers = async (): Promise<UserProfile[]> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, wallet_address, avatar_url, points, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
      return [];
    }

    return data.map(user => ({
      id: user.id,
      username: user.username || `User_${user.id.substring(0, 8)}`,
      walletAddress: user.wallet_address,
      avatar_url: user.avatar_url || '/lovable-uploads/be6baddd-a67e-4583-b969-a471b47274e1.png',
      pxbPoints: user.points,
      createdAt: user.created_at
    }));
  } catch (error) {
    console.error('Unexpected error fetching users:', error);
    toast.error('Failed to load users');
    return [];
  }
};

// Function to fetch all posts with user info
export const fetchAllPosts = async (): Promise<Post[]> => {
  try {
    // First, check if views_count column exists
    const { data: columnsInfo, error: columnsError } = await supabase
      .from('posts')
      .select('*')
      .limit(1);
    
    if (columnsError) {
      console.error('Error checking posts table columns:', columnsError);
    }
    
    // Determine if views_count exists
    const hasViewsCount = columnsInfo && columnsInfo.length > 0 && 'views_count' in columnsInfo[0];
    
    // Select appropriate columns based on what exists
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id, content, image_url, created_at, updated_at, 
        likes_count, comments_count, user_id, 
        users(username, avatar_url)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts');
      return [];
    }

    return data.map(post => ({
      id: post.id,
      user_id: post.user_id,
      content: post.content,
      image_url: post.image_url,
      created_at: post.created_at,
      updated_at: post.updated_at,
      likes_count: post.likes_count,
      comments_count: post.comments_count,
      views_count: hasViewsCount ? (post as any).views_count || 0 : 0,
      username: post.users?.username || `User_${post.user_id.substring(0, 8)}`,
      avatar_url: post.users?.avatar_url || '/lovable-uploads/be6baddd-a67e-4583-b969-a471b47274e1.png'
    }));
  } catch (error) {
    console.error('Unexpected error fetching posts:', error);
    toast.error('Failed to load posts');
    return [];
  }
};

// Function to create a new post
export const createPost = async (content: string, userId: string, imageUrl?: string): Promise<Post | null> => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        content,
        image_url: imageUrl
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
      return null;
    }

    const { data: userData } = await supabase
      .from('users')
      .select('username, avatar_url')
      .eq('id', userId)
      .single();

    return {
      ...data,
      username: userData?.username || `User_${userId.substring(0, 8)}`,
      avatar_url: userData?.avatar_url || '/lovable-uploads/be6baddd-a67e-4583-b969-a471b47274e1.png'
    } as Post;
  } catch (error) {
    console.error('Unexpected error creating post:', error);
    toast.error('Failed to create post');
    return null;
  }
};

// Function to fetch comments for a post
export const fetchComments = async (postId: string): Promise<Comment[]> => {
  try {
    // Use the comments table instead of post_comments
    const { data, error } = await supabase
      .from('post_comments')
      .select(`
        id, post_id, user_id, parent_id, content, created_at, likes_count,
        users(username, avatar_url)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
      return [];
    }

    // Organize comments into a tree structure
    const commentMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    // First, create all comment objects
    data.forEach(comment => {
      const formattedComment: Comment = {
        id: comment.id,
        post_id: comment.post_id,
        user_id: comment.user_id,
        parent_id: comment.parent_id,
        content: comment.content,
        created_at: comment.created_at,
        likes_count: comment.likes_count,
        username: comment.users?.username || `User_${comment.user_id.substring(0, 8)}`,
        avatar_url: comment.users?.avatar_url || '/lovable-uploads/be6baddd-a67e-4583-b969-a471b47274e1.png',
        replies: []
      };
      commentMap.set(comment.id, formattedComment);
    });

    // Then, organize into parent-child relationships
    data.forEach(comment => {
      const formattedComment = commentMap.get(comment.id);
      if (!formattedComment) return;

      if (comment.parent_id) {
        const parentComment = commentMap.get(comment.parent_id);
        if (parentComment) {
          if (!parentComment.replies) {
            parentComment.replies = [];
          }
          parentComment.replies.push(formattedComment);
        }
      } else {
        rootComments.push(formattedComment);
      }
    });

    return rootComments;
  } catch (error) {
    console.error('Unexpected error fetching comments:', error);
    toast.error('Failed to load comments');
    return [];
  }
};

// Function to create a comment
export const createComment = async (
  postId: string, 
  userId: string, 
  content: string, 
  parentId?: string
): Promise<Comment | null> => {
  try {
    const { data, error } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        user_id: userId,
        content,
        parent_id: parentId
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      toast.error('Failed to create comment');
      return null;
    }

    // Update the comments count directly
    const { error: updateError } = await supabase
      .from('posts')
      .update({ 
        comments_count: supabase.rpc('increment', { value: 1 }) 
      })
      .eq('id', postId);
      
    if (updateError) {
      console.error('Error updating post comments count:', updateError);
    }

    const { data: userData } = await supabase
      .from('users')
      .select('username, avatar_url')
      .eq('id', userId)
      .single();

    return {
      ...data,
      username: userData?.username || `User_${userId.substring(0, 8)}`,
      avatar_url: userData?.avatar_url || '/lovable-uploads/be6baddd-a67e-4583-b969-a471b47274e1.png',
      replies: []
    } as Comment;
  } catch (error) {
    console.error('Unexpected error creating comment:', error);
    toast.error('Failed to create comment');
    return null;
  }
};

// Function to like a post
export const likePost = async (postId: string, userId: string): Promise<boolean> => {
  try {
    // Check if user already liked the post
    const { data: existingLike } = await supabase
      .from('post_likes')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingLike) {
      // Unlike: Delete the like
      const { error: deleteError } = await supabase
        .from('post_likes')
        .delete()
        .eq('id', existingLike.id);

      if (deleteError) {
        console.error('Error removing like:', deleteError);
        toast.error('Failed to unlike post');
        return false;
      }

      // Update the post's likes_count
      const { error: updateError } = await supabase
        .from('posts')
        .update({ 
          likes_count: supabase.rpc('decrement', { value: 1 }) 
        })
        .eq('id', postId);

      if (updateError) {
        console.error('Error updating post like count:', updateError);
      }

      return false; // Return false to indicate post is now unliked
    } else {
      // Like: Create a new like
      const { error: insertError } = await supabase
        .from('post_likes')
        .insert({
          post_id: postId,
          user_id: userId
        });

      if (insertError) {
        console.error('Error adding like:', insertError);
        toast.error('Failed to like post');
        return false;
      }

      // Update the post's likes_count
      const { error: updateError } = await supabase
        .from('posts')
        .update({ 
          likes_count: supabase.rpc('increment', { value: 1 }) 
        })
        .eq('id', postId);

      if (updateError) {
        console.error('Error updating post like count:', updateError);
      }

      return true; // Return true to indicate post is now liked
    }
  } catch (error) {
    console.error('Unexpected error liking post:', error);
    toast.error('Failed to like post');
    return false;
  }
};

// Function to like a comment
export const likeComment = async (commentId: string, userId: string): Promise<boolean> => {
  try {
    // Check if user already liked the comment
    const { data: existingLike } = await supabase
      .from('comment_likes')
      .select('*')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingLike) {
      // Unlike: Delete the like
      const { error: deleteError } = await supabase
        .from('comment_likes')
        .delete()
        .eq('id', existingLike.id);

      if (deleteError) {
        console.error('Error removing comment like:', deleteError);
        toast.error('Failed to unlike comment');
        return false;
      }

      // Update the comment's likes_count
      const { error: updateError } = await supabase
        .from('post_comments')
        .update({ 
          likes_count: supabase.rpc('decrement', { value: 1 }) 
        })
        .eq('id', commentId);

      if (updateError) {
        console.error('Error updating comment like count:', updateError);
      }

      return false; // Return false to indicate comment is now unliked
    } else {
      // Like: Create a new like
      const { error: insertError } = await supabase
        .from('comment_likes')
        .insert({
          comment_id: commentId,
          user_id: userId
        });

      if (insertError) {
        console.error('Error adding comment like:', insertError);
        toast.error('Failed to like comment');
        return false;
      }

      // Update the comment's likes_count
      const { error: updateError } = await supabase
        .from('post_comments')
        .update({ 
          likes_count: supabase.rpc('increment', { value: 1 }) 
        })
        .eq('id', commentId);

      if (updateError) {
        console.error('Error updating comment like count:', updateError);
      }

      return true; // Return true to indicate comment is now liked
    }
  } catch (error) {
    console.error('Unexpected error liking comment:', error);
    toast.error('Failed to like comment');
    return false;
  }
};

// Function to check if user liked a post
export const checkPostLiked = async (postId: string, userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('post_likes')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error checking if post is liked:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Unexpected error checking post like:', error);
    return false;
  }
};

// Function to check if user liked a comment
export const checkCommentLiked = async (commentId: string, userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('comment_likes')
      .select('*')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error checking if comment is liked:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Unexpected error checking comment like:', error);
    return false;
  }
};

// Function to increment the views count of a post
export const incrementPostViews = async (postId: string): Promise<void> => {
  try {
    // Check if views_count exists
    const { data: columnsInfo, error: columnsError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .limit(1)
      .single();
    
    if (columnsError) {
      console.error('Error checking post columns:', columnsError);
      return;
    }
    
    // Only update views_count if the column exists
    if ('views_count' in columnsInfo) {
      const { error } = await supabase
        .from('posts')
        .update({ 
          views_count: supabase.rpc('increment', { value: 1 }) 
        })
        .eq('id', postId);
        
      if (error) {
        console.error('Error incrementing post views:', error);
      }
    } else {
      console.log('views_count column does not exist, skipping view increment');
    }
  } catch (error) {
    console.error('Error incrementing post views:', error);
  }
};
