
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  fetchAllUsers, 
  fetchAllPosts, 
  createPost, 
  fetchComments, 
  createComment, 
  likePost, 
  likeComment,
  incrementPostViews
} from '@/services/communityService';
import { UserProfile, Post, Comment } from '@/types/pxb';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { toast } from 'sonner';

export const useCommunity = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<string, Comment[]>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
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

  // Function to load comments for a post
  const loadComments = useCallback(async (postId: string) => {
    setLoadingComments(prev => ({ ...prev, [postId]: true }));
    const comments = await fetchComments(postId);
    setCommentsMap(prev => ({ ...prev, [postId]: comments }));
    setLoadingComments(prev => ({ ...prev, [postId]: false }));
    // Increment view count when a post is expanded
    await incrementPostViews(postId);
    // Update the post's view count in the UI
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { ...post, views_count: post.views_count + 1 } 
          : post
      )
    );
  }, []);

  // Function to handle comment submission
  const handleCreateComment = useCallback(async (postId: string, content: string, parentId?: string) => {
    if (!userProfile) {
      toast.error('You must be logged in to create a comment');
      return;
    }

    if (!content.trim()) {
      toast.error('Comment content cannot be empty');
      return;
    }

    const newComment = await createComment(postId, userProfile.id, content, parentId);
    if (newComment) {
      if (parentId) {
        // Add reply to the parent comment
        setCommentsMap(prev => {
          const postComments = [...(prev[postId] || [])];
          
          // Recursive function to add reply to the correct parent
          const addReplyToParent = (comments: Comment[]): boolean => {
            for (let i = 0; i < comments.length; i++) {
              if (comments[i].id === parentId) {
                if (!comments[i].replies) {
                  comments[i].replies = [];
                }
                comments[i].replies.push(newComment);
                return true;
              }
              if (comments[i].replies && addReplyToParent(comments[i].replies)) {
                return true;
              }
            }
            return false;
          };
          
          addReplyToParent(postComments);
          return { ...prev, [postId]: postComments };
        });
      } else {
        // Add new root comment
        setCommentsMap(prev => ({
          ...prev,
          [postId]: [...(prev[postId] || []), newComment]
        }));
      }
      
      // Update the post's comment count
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { ...post, comments_count: post.comments_count + 1 } 
            : post
        )
      );
      
      toast.success('Comment added successfully');
      return true;
    }
    return false;
  }, [userProfile]);

  // Function to toggle post like
  const handleTogglePostLike = useCallback(async (postId: string) => {
    if (!userProfile) {
      toast.error('You must be logged in to like a post');
      return;
    }

    const liked = await likePost(postId, userProfile.id);
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              likes_count: liked 
                ? post.likes_count + 1 
                : Math.max(0, post.likes_count - 1) 
            } 
          : post
      )
    );
    return liked;
  }, [userProfile]);

  // Function to toggle comment like
  const handleToggleCommentLike = useCallback(async (postId: string, commentId: string) => {
    if (!userProfile) {
      toast.error('You must be logged in to like a comment');
      return;
    }

    const liked = await likeComment(commentId, userProfile.id);
    
    setCommentsMap(prev => {
      const postComments = [...(prev[postId] || [])];
      
      // Recursive function to update the correct comment
      const updateCommentLike = (comments: Comment[]): boolean => {
        for (let i = 0; i < comments.length; i++) {
          if (comments[i].id === commentId) {
            comments[i].likes_count = liked 
              ? comments[i].likes_count + 1 
              : Math.max(0, comments[i].likes_count - 1);
            return true;
          }
          if (comments[i].replies && updateCommentLike(comments[i].replies)) {
            return true;
          }
        }
        return false;
      };
      
      updateCommentLike(postComments);
      return { ...prev, [postId]: postComments };
    });
    
    return liked;
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

    // Set up subscription for comment changes
    const commentsChannel = supabase
      .channel('public:post_comments')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'post_comments' }, 
        (payload) => {
          if (payload.new && typeof payload.new === 'object' && 'post_id' in payload.new) {
            loadComments(payload.new.post_id as string);
          }
        }
      )
      .subscribe();

    // Clean up subscriptions
    return () => {
      supabase.removeChannel(usersChannel);
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(commentsChannel);
    };
  }, [loadUsers, loadPosts, loadComments]);

  return {
    users,
    posts,
    loadingUsers,
    loadingPosts,
    expandedPostId,
    setExpandedPostId,
    commentsMap,
    loadingComments,
    handleCreatePost,
    loadComments,
    handleCreateComment,
    handleTogglePostLike,
    handleToggleCommentLike
  };
};
