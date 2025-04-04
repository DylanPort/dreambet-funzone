
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  fetchAllUsers, 
  fetchAllPosts, 
  createPost
} from '@/services/communityService';
import { UserProfile, Post } from '@/types/pxb';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { toast } from 'sonner';

export const useCommunity = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const { userProfile } = usePXBPoints();

  // Function to load all users
  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    const fetchedUsers = await fetchAllUsers();
    setUsers(fetchedUsers);
    setLoadingUsers(false);
  }, []);

  // Function to load all posts
  const loadPosts = useCallback(async () => {
    setLoadingPosts(true);
    const fetchedPosts = await fetchAllPosts();
    setPosts(fetchedPosts);
    setLoadingPosts(false);
  }, []);

  // Function to handle new post submission
  const handleCreatePost = useCallback(async (content: string, imageUrl?: string) => {
    if (!userProfile) {
      toast.error('You must be logged in to create a post');
      return;
    }

    if (!content.trim()) {
      toast.error('Post content cannot be empty');
      return;
    }

    const newPost = await createPost(content, userProfile.id, imageUrl);
    if (newPost) {
      setPosts(prevPosts => [newPost, ...prevPosts]);
      toast.success('Post created successfully');
      return true;
    }
    return false;
  }, [userProfile]);

  // Load initial data
  useEffect(() => {
    loadUsers();
    loadPosts();
  }, [loadUsers, loadPosts]);

  // Set up realtime subscriptions
  useEffect(() => {
    // Set up subscription for user changes
    const usersChannel = supabase
      .channel('public:users')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'users' }, 
        () => {
          loadUsers();
        }
      )
      .subscribe();

    // Set up subscription for post changes
    const postsChannel = supabase
      .channel('public:posts')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'posts' }, 
        () => {
          loadPosts();
        }
      )
      .subscribe();

    // Clean up subscriptions
    return () => {
      supabase.removeChannel(usersChannel);
      supabase.removeChannel(postsChannel);
    };
  }, [loadUsers, loadPosts]);

  return {
    users,
    posts,
    loadingUsers,
    loadingPosts,
    handleCreatePost
  };
};
