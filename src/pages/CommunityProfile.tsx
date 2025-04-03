
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, MessageSquare, User, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import PostCard from '@/components/community/PostCard';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  fetchUserProfile, 
  fetchUserPosts, 
  followUser,
  UserProfile,
  Post
} from '@/services/communityService';

const CommunityProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPostsLoading, setIsPostsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  useEffect(() => {
    const loadData = async () => {
      if (!userId) return;
      
      setIsLoading(true);
      setIsPostsLoading(true);
      
      // Check auth status
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      
      if (user) {
        setIsCurrentUser(user.id === userId);
      }
      
      // Fetch user profile
      const userProfile = await fetchUserProfile(userId);
      
      if (userProfile) {
        setProfile(userProfile);
        setIsFollowing(userProfile.is_following || false);
      } else {
        toast.error('User not found');
      }
      
      setIsLoading(false);
      
      // Fetch user posts
      const userPosts = await fetchUserPosts(userId);
      setPosts(userPosts);
      setIsPostsLoading(false);
      setHasMore(userPosts.length === 10);
    };
    
    loadData();
  }, [userId]);
  
  const loadMorePosts = async () => {
    if (!userId) return;
    
    setLoadingMore(true);
    const offset = posts.length;
    const limit = 10;
    
    const newPosts = await fetchUserPosts(userId, limit, offset);
    
    setPosts(prev => [...prev, ...newPosts]);
    setLoadingMore(false);
    setHasMore(newPosts.length === limit);
  };
  
  const handleFollow = async () => {
    if (!userId) return;
    
    const result = await followUser(userId);
    if (result !== null) {
      setIsFollowing(result);
      
      // Update profile follower count
      if (profile) {
        setProfile({
          ...profile,
          followers_count: result 
            ? (profile.followers_count || 0) + 1 
            : Math.max(0, (profile.followers_count || 0) - 1),
          is_following: result
        });
      }
    }
  };
  
  const handlePostDeleted = () => {
    if (!userId) return;
    
    // Refresh posts
    fetchUserPosts(userId).then(userPosts => {
      setPosts(userPosts);
    });
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
  
  const getInitials = (username: string) => {
    return username?.substring(0, 2).toUpperCase() || 'AN';
  };
  
  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-[#080b16] bg-gradient-to-b from-[#0a0e1c] to-[#070a14]">
          <div className="max-w-4xl mx-auto px-4 pt-24 pb-16">
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
            </div>
          </div>
        </main>
      </>
    );
  }
  
  if (!profile) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-[#080b16] bg-gradient-to-b from-[#0a0e1c] to-[#070a14]">
          <div className="max-w-4xl mx-auto px-4 pt-24 pb-16">
            <div className="text-center py-10">
              <h1 className="text-2xl font-bold text-white mb-2">User Not Found</h1>
              <p className="text-gray-400 mb-4">The user profile you're looking for doesn't exist or has been removed.</p>
              <Link to="/community">
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  <ArrowLeft className="mr-2 h-5 w-5" /> Back to Community
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }
  
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#080b16] bg-gradient-to-b from-[#0a0e1c] to-[#070a14]">
        <div className="max-w-4xl mx-auto px-4 pt-24 pb-16">
          <div className="mb-6">
            <Link to="/community">
              <Button variant="ghost" className="text-gray-400">
                <ArrowLeft className="mr-2 h-5 w-5" /> Back to Community
              </Button>
            </Link>
          </div>
          
          <Card className="mb-6 bg-[#10121f] border-indigo-900/30">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-white">User Profile</h1>
                {isAuthenticated && !isCurrentUser && (
                  <div className="flex space-x-2">
                    <Button
                      variant={isFollowing ? "outline" : "default"}
                      onClick={handleFollow}
                      className={isFollowing ? "border-indigo-500 text-indigo-500" : "bg-indigo-600 hover:bg-indigo-700"}
                    >
                      <Users className="h-5 w-5 mr-2" />
                      {isFollowing ? 'Following' : 'Follow'}
                    </Button>
                    <Link to={`/community/messages/${userId}`}>
                      <Button variant="outline" className="border-indigo-500 text-indigo-500">
                        <MessageSquare className="h-5 w-5 mr-2" />
                        Message
                      </Button>
                    </Link>
                  </div>
                )}
                {isCurrentUser && (
                  <Link to="/community/profile/edit">
                    <Button className="bg-indigo-600 hover:bg-indigo-700">
                      <User className="h-5 w-5 mr-2" />
                      Edit Profile
                    </Button>
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent className="py-6">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <Avatar className="h-28 w-28">
                  <AvatarImage src={profile.avatar_url || ''} alt={profile.username || ''} />
                  <AvatarFallback className="bg-indigo-600 text-3xl">{getInitials(profile.username || '')}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl font-semibold text-white">
                    {profile.display_name || profile.username || 'Anonymous'}
                  </h2>
                  {profile.username && profile.username !== profile.display_name && (
                    <p className="text-gray-400">@{profile.username}</p>
                  )}
                  
                  <p className="text-sm text-gray-400 mt-1">
                    Member since {profile.createdAt ? formatDistanceToNow(new Date(profile.createdAt), { addSuffix: true }) : 'unknown'}
                  </p>
                  
                  <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-4">
                    <div className="text-center">
                      <p className="text-xl font-semibold text-white">{profile.points ? profile.points.toLocaleString() : 0}</p>
                      <p className="text-sm text-gray-400">PXB Points</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-semibold text-white">{profile.followers_count}</p>
                      <p className="text-sm text-gray-400">Followers</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-semibold text-white">{profile.following_count}</p>
                      <p className="text-sm text-gray-400">Following</p>
                    </div>
                  </div>
                  
                  {profile.bio && (
                    <div className="mt-4 bg-[#191c31] p-3 rounded-lg">
                      <p className="text-gray-200 whitespace-pre-wrap">{profile.bio}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="bg-[#10121f] rounded-lg border border-indigo-900/30 mb-6">
            <div className="p-4 border-b border-indigo-900/30">
              <h2 className="text-lg font-semibold text-white">Posts</h2>
            </div>
            
            <div className="p-4">
              {isPostsLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <p>No posts yet</p>
                </div>
              ) : (
                <div>
                  {posts.map(post => (
                    <PostCard 
                      key={post.id} 
                      post={post} 
                      onPostDeleted={handlePostDeleted}
                      onPostLiked={handlePostLiked}
                    />
                  ))}
                  
                  {hasMore && (
                    <div className="flex justify-center mt-6">
                      <Button
                        onClick={loadMorePosts}
                        disabled={loadingMore}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        {loadingMore ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Loading...
                          </>
                        ) : (
                          'Load More'
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default CommunityProfile;
