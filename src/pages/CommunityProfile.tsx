
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageSquare, User, UserPlus, UserMinus, Calendar } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserProfile, Post } from '@/types/community';
import OrbitingParticles from '@/components/OrbitingParticles';
import PostCard from '@/components/community/PostCard';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Footer from '@/components/Footer';
import { useProfile } from '@/hooks/useSupabaseHooks';

const CommunityProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { fetchUserProfile, followUser, unfollowUser, getUserPostsByUserId } = useProfile();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isUpdatingFollow, setIsUpdatingFollow] = useState(false);
  
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      if (user && userId === user.id) {
        setIsCurrentUser(true);
      } else {
        setIsCurrentUser(false);
      }
    };
    
    checkAuth();
  }, [userId]);
  
  const loadProfile = async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      
      const profileData = await fetchUserProfile(userId);
      if (profileData) {
        setProfile(profileData);
        setIsFollowing(profileData.is_following || false);
      }
      
      const postsData = await getUserPostsByUserId(userId);
      setPosts(postsData);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadProfile();
  }, [userId]);
  
  // Set up realtime subscription for new posts
  useEffect(() => {
    if (!userId) return;
    
    const channel = supabase
      .channel('user-posts-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'posts',
        filter: `user_id=eq.${userId}`
      }, () => {
        // Reload posts when this user creates a new one
        getUserPostsByUserId(userId).then(postsData => {
          setPosts(postsData);
        });
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
  
  const handleFollow = async () => {
    if (!userId || !isAuthenticated) return;
    
    setIsUpdatingFollow(true);
    
    try {
      if (isFollowing) {
        const success = await unfollowUser(userId);
        if (success) {
          setIsFollowing(false);
          if (profile) {
            setProfile({
              ...profile,
              followers_count: (profile.followers_count || 0) - 1,
              is_following: false
            });
          }
          toast.success('Unfollowed user');
        }
      } else {
        const success = await followUser(userId);
        if (success) {
          setIsFollowing(true);
          if (profile) {
            setProfile({
              ...profile,
              followers_count: (profile.followers_count || 0) + 1,
              is_following: true
            });
          }
          toast.success('Following user');
        }
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
    } finally {
      setIsUpdatingFollow(false);
    }
  };
  
  const handlePostDeleted = () => {
    loadProfile();
  };
  
  const handlePostLiked = (postId: string, isLiked: boolean) => {
    setPosts(prev => 
      prev.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              isLiked, 
              likes_count: isLiked ? post.likes_count + 1 : post.likes_count - 1 
            } 
          : post
      )
    );
  };
  
  const getInitials = (username?: string | null) => {
    return username ? username.substring(0, 2).toUpperCase() : 'AN';
  };
  
  const formatWalletAddress = (address?: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  const formatDate = (date?: string) => {
    if (!date) return '';
    return format(new Date(date), 'MMMM yyyy');
  };
  
  if (isLoading) {
    return (
      <>
        <OrbitingParticles />
        <Navbar />
        <main className="pt-24 min-h-screen overflow-hidden px-4 pb-16">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
          </div>
        </main>
      </>
    );
  }
  
  if (!profile) {
    return (
      <>
        <OrbitingParticles />
        <Navbar />
        <main className="pt-24 min-h-screen overflow-hidden px-4 pb-16">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <p className="text-xl text-gray-400 mb-4">User not found</p>
              <Button 
                variant="default"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <OrbitingParticles />
      <Navbar />
      
      <main className="pt-24 min-h-screen overflow-hidden px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <Link to="/community" className="inline-flex items-center text-gray-400 hover:text-white mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Community
          </Link>
          
          <div className="bg-[#10121f] rounded-lg border border-indigo-900/30 mb-6 p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatar_url || ''} alt={profile.username || ''} />
                <AvatarFallback className="bg-indigo-600 text-2xl">{getInitials(profile.username)}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl font-bold">
                  {profile.display_name || profile.username || 'Anonymous'}
                </h1>
                
                <p className="text-gray-400 mb-3">
                  {formatWalletAddress(profile.wallet_address)}
                </p>
                
                {profile.bio && (
                  <p className="text-gray-200 mb-4 whitespace-pre-wrap">{profile.bio}</p>
                )}
                
                <div className="flex flex-wrap gap-4 justify-center sm:justify-start mb-4">
                  <div className="text-center">
                    <p className="text-xl font-semibold">{posts.length}</p>
                    <p className="text-gray-400 text-sm">Posts</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-xl font-semibold">{profile.followers_count || 0}</p>
                    <p className="text-gray-400 text-sm">Followers</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-xl font-semibold">{profile.following_count || 0}</p>
                    <p className="text-gray-400 text-sm">Following</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-xl font-semibold">{profile.points?.toLocaleString() || '0'}</p>
                    <p className="text-gray-400 text-sm">Points</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                  {profile.created_at && (
                    <div className="text-gray-400 text-sm inline-flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Joined {formatDate(profile.created_at)}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                {!isCurrentUser && isAuthenticated && (
                  <Button
                    className={isFollowing ? 
                      "bg-gray-700 hover:bg-gray-600" : 
                      "bg-indigo-600 hover:bg-indigo-700"
                    }
                    onClick={handleFollow}
                    disabled={isUpdatingFollow}
                  >
                    {isFollowing ? (
                      <>
                        <UserMinus className="h-4 w-4 mr-1" />
                        Unfollow
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-1" />
                        Follow
                      </>
                    )}
                  </Button>
                )}
                
                {!isCurrentUser && isAuthenticated && (
                  <Button 
                    variant="outline"
                    onClick={() => window.location.href = `/community/messages/${userId}`}
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Message
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          <h2 className="text-xl font-semibold mb-4">Posts</h2>
          
          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="text-center py-8 bg-[#10121f] rounded-lg border border-indigo-900/30">
                <p className="text-gray-400">No posts yet</p>
                <p className="text-gray-500 text-sm mt-1">
                  {isCurrentUser ? 
                    'Create your first post to share with the community!' : 
                    'This user has not posted anything yet.'
                  }
                </p>
              </div>
            ) : (
              posts.map(post => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  onPostDeleted={handlePostDeleted}
                  onPostLiked={handlePostLiked}
                />
              ))
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </>
  );
};

export default CommunityProfile;
