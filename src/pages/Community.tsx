
import React from 'react';
import { Toaster } from 'sonner';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import UsersList from '@/components/community/UsersList';
import CommunityFeed from '@/components/community/CommunityFeed';

const Community = () => {
  return (
    <div className="min-h-screen bg-dream-background text-dream-foreground">
      <Navbar />
      <Toaster position="top-right" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-gradient">$POINTS Community</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Users List Section */}
          <div className="lg:col-span-1">
            <UsersList />
          </div>
          
          {/* Community Feed Section */}
          <div className="lg:col-span-2">
            <CommunityFeed />
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Community;
