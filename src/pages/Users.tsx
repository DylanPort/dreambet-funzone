
import React from 'react';
import Navbar from '@/components/Navbar';
import { Card } from '@/components/ui/card';
import { User, Users, Activity } from 'lucide-react';
import UsersList from '@/components/UsersList';
import { useAllUsers } from '@/hooks/useAllUsers';

const UsersPage = () => {
  const { users, totalUsers, onlineUsers, onlineCount, loading } = useAllUsers();
  
  return (
    <div className="min-h-screen bg-dream-background">
      <Navbar />
      
      <div className="max-w-7xl mx-auto pt-24 px-4 pb-20">
        <div className="flex flex-col space-y-8">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-display font-bold text-dream-foreground">Community Members</h1>
            <p className="text-dream-foreground/70 mt-2">See all members of the community and who's online</p>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="p-6 bg-dream-background/20 border border-dream-foreground/10">
              <div className="flex items-center">
                <div className="rounded-full p-3 bg-dream-accent1/10 mr-4">
                  <Users className="h-8 w-8 text-dream-accent1" />
                </div>
                <div>
                  <h3 className="text-dream-foreground/60 text-sm">Total Members</h3>
                  <p className="text-3xl font-bold text-dream-foreground">{totalUsers}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6 bg-dream-background/20 border border-dream-foreground/10">
              <div className="flex items-center">
                <div className="rounded-full p-3 bg-dream-accent2/10 mr-4">
                  <Activity className="h-8 w-8 text-dream-accent2" />
                </div>
                <div>
                  <h3 className="text-dream-foreground/60 text-sm">Online Members</h3>
                  <p className="text-3xl font-bold text-dream-foreground">{onlineCount}</p>
                </div>
              </div>
            </Card>
          </div>
          
          {/* Users List */}
          <Card className="bg-dream-background/20 border border-dream-foreground/10 p-6">
            <h2 className="text-xl font-display font-bold flex items-center mb-4">
              <User className="w-5 h-5 mr-2 text-dream-accent2" />
              Registered Members
            </h2>
            
            <UsersList 
              users={users} 
              onlineUsers={onlineUsers} 
              loading={loading}
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
