
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { fetchConversations, fetchUserProfile } from '@/services/communityService';
import { Conversation, UserProfile } from '@/types/community';
import OrbitingParticles from '@/components/OrbitingParticles';
import MessageThread from '@/components/community/MessageThread';
import { UserSearch } from '@/components/ui/user-search';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import Footer from '@/components/Footer';

const MessagesPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await supabase.auth.getUser();
        const isAuthed = !!userData.data.user;
        setIsAuthenticated(isAuthed);
        
        if (!isAuthed) {
          toast.error('You must be logged in to view messages');
          navigate('/community');
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setIsAuthenticated(false);
        navigate('/community');
      }
    };
    
    checkAuth();
  }, [navigate]);
  
  const loadConversations = async () => {
    try {
      setIsLoading(true);
      
      const conversationsData = await fetchConversations();
      setConversations(conversationsData);
      
      // If userId is provided, load that user's profile
      if (userId) {
        const profileData = await fetchUserProfile(userId);
        if (profileData) {
          setSelectedUser(profileData);
        }
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (isAuthenticated) {
      loadConversations();
    }
  }, [isAuthenticated, userId]);
  
  // Set up realtime subscription for new messages
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const checkUserAndSubscribe = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      
      const channel = supabase
        .channel('messages-changes')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${data.user.id}`
        }, () => {
          // Reload conversations when a new message is received
          loadConversations();
        })
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    };
    
    const unsubscribe = checkUserAndSubscribe();
    
    return () => {
      if (unsubscribe) {
        unsubscribe.then(cleanup => {
          if (cleanup) cleanup();
        });
      }
    };
  }, [isAuthenticated]);
  
  const selectConversation = async (conversation: Conversation) => {
    try {
      const profileData = await fetchUserProfile(conversation.conversation_user_id);
      if (profileData) {
        setSelectedUser(profileData);
        navigate(`/community/messages/${conversation.conversation_user_id}`);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      toast.error('Failed to load conversation');
    }
  };
  
  const handleUserSelect = (user: UserProfile) => {
    setSelectedUser(user);
    navigate(`/community/messages/${user.id}`);
  };
  
  const getInitials = (username?: string | null) => {
    return username ? username.substring(0, 2).toUpperCase() : 'AN';
  };
  
  if (!isAuthenticated) {
    return (
      <>
        <OrbitingParticles />
        <Navbar />
        <main className="pt-24 min-h-screen overflow-hidden px-4 pb-16">
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
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
        <div className="max-w-5xl mx-auto">
          <Link to="/community" className="inline-flex items-center text-gray-400 hover:text-white mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Community
          </Link>
          
          <h1 className="text-3xl font-bold mb-6">Messages</h1>
          
          <div className="bg-[#10121f] rounded-lg border border-indigo-900/30 mb-6">
            <div className="flex flex-col md:flex-row h-[700px] max-h-[700px]">
              {/* Conversations Sidebar */}
              <div className="w-full md:w-80 border-r border-indigo-900/30">
                <div className="p-3 border-b border-indigo-900/30">
                  <UserSearch 
                    placeholder="Find users to message..." 
                    onSelectUser={handleUserSelect}
                    buttonText="Message"
                    showButton={false}
                  />
                </div>
                
                <div className="overflow-y-auto h-[calc(700px-56px)]">
                  {isLoading ? (
                    <div className="flex justify-center py-6">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-gray-400">No conversations yet</p>
                      <p className="text-gray-500 text-sm mt-1">Search for users to start chatting</p>
                    </div>
                  ) : (
                    conversations.map(conversation => (
                      <div 
                        key={conversation.conversation_user_id}
                        className={`p-3 border-b border-indigo-900/20 hover:bg-indigo-900/20 cursor-pointer ${
                          selectedUser?.id === conversation.conversation_user_id ? 'bg-indigo-900/30' : ''
                        }`}
                        onClick={() => selectConversation(conversation)}
                      >
                        <div className="flex items-center">
                          <div className="relative">
                            <Avatar className="h-10 w-10 mr-3">
                              <AvatarImage src={conversation.conversation_avatar_url || ''} />
                              <AvatarFallback className="bg-indigo-600">{getInitials(conversation.conversation_username)}</AvatarFallback>
                            </Avatar>
                            {conversation.unread_count > 0 && (
                              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                {conversation.unread_count}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white truncate">
                              {conversation.conversation_display_name || conversation.conversation_username}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              {conversation.last_message}
                            </p>
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(conversation.last_message_time), { addSuffix: false })}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              {/* Message Thread */}
              <div className="flex-1">
                {selectedUser ? (
                  <div className="flex flex-col h-full">
                    <div className="p-3 border-b border-indigo-900/30 flex items-center">
                      <Link to={`/community/profile/${selectedUser.id}`}>
                        <Avatar className="h-8 w-8 mr-3">
                          <AvatarImage src={selectedUser.avatar_url || ''} />
                          <AvatarFallback className="bg-indigo-600">{getInitials(selectedUser.username)}</AvatarFallback>
                        </Avatar>
                      </Link>
                      <div>
                        <Link to={`/community/profile/${selectedUser.id}`} className="font-medium text-white hover:text-indigo-400 transition">
                          {selectedUser.display_name || selectedUser.username || 'Anonymous'}
                        </Link>
                      </div>
                    </div>
                    
                    <MessageThread 
                      recipientId={selectedUser.id} 
                      recipientName={selectedUser.username || ''} 
                      recipientAvatar={selectedUser.avatar_url || ''}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                      <p className="text-gray-400">Select a conversation or search for a user</p>
                      <p className="text-gray-500 text-sm mt-1">to start messaging</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </>
  );
};

export default MessagesPage;
