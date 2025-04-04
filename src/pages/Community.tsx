
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCommunity } from '@/hooks/useCommunity';
import UserList from '@/components/community/UserList';
import PostInput from '@/components/community/PostInput';
import PostCard from '@/components/community/PostCard';
import { Loader2 } from 'lucide-react';

const Community: React.FC = () => {
  const { 
    users,
    posts,
    loadingUsers,
    loadingPosts,
    handleCreatePost
  } = useCommunity();

  return (
    <div className="min-h-screen flex flex-col bg-dream-background">
      <Navbar />
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 mt-16">
        <h1 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-dream-accent1 via-dream-accent2 to-dream-accent3 text-transparent bg-clip-text">Community</h1>
        
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Section - User List */}
          <div className="lg:w-1/3 rounded-lg border border-border bg-card/70 backdrop-blur-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-card/80">
              <h2 className="text-lg font-medium">Community Members</h2>
              <p className="text-sm text-muted-foreground">
                {loadingUsers ? 'Loading users...' : `${users.length} members online`}
              </p>
            </div>
            <UserList users={users} loading={loadingUsers} />
          </div>
          
          {/* Right Section - Message Thread */}
          <div className="lg:w-2/3 space-y-6">
            <PostInput onSubmit={handleCreatePost} />
            
            {loadingPosts ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-dream-accent1" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12 border border-border rounded-lg bg-card/70 backdrop-blur-sm">
                <h3 className="text-lg font-medium mb-2">No Posts Yet</h3>
                <p className="text-muted-foreground">Be the first to start a conversation!</p>
              </div>
            ) : (
              posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                />
              ))
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Community;
