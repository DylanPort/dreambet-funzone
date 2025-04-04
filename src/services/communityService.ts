
import { supabase } from "@/integrations/supabase/client";
import { Post, UserProfile } from "@/types/pxb";
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

// Function to fetch all posts
export const fetchAllPosts = async (): Promise<Post[]> => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id, content, image_url, created_at, updated_at, 
        likes_count, comments_count, user_id
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts');
      return [];
    }

    // Get user data for each post
    const posts = await Promise.all(
      data.map(async (post) => {
        const { data: userData } = await supabase
          .from('users')
          .select('username, avatar_url')
          .eq('id', post.user_id)
          .single();

        return {
          id: post.id,
          user_id: post.user_id,
          content: post.content,
          image_url: post.image_url,
          created_at: post.created_at,
          updated_at: post.updated_at,
          likes_count: post.likes_count || 0,
          comments_count: post.comments_count || 0,
          views_count: 0, // hardcoded to 0 since we're not tracking views
          username: userData?.username || `User_${post.user_id.substring(0, 8)}`,
          avatar_url: userData?.avatar_url || '/lovable-uploads/be6baddd-a67e-4583-b969-a471b47274e1.png'
        };
      })
    );

    return posts;
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
        image_url: imageUrl,
        likes_count: 0,
        comments_count: 0
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
      avatar_url: userData?.avatar_url || '/lovable-uploads/be6baddd-a67e-4583-b969-a471b47274e1.png',
      views_count: 0 // hardcoded to 0
    } as Post;
  } catch (error) {
    console.error('Unexpected error creating post:', error);
    toast.error('Failed to create post');
    return null;
  }
};
