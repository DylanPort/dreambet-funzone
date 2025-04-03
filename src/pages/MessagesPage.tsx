
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import MessageThread from '@/components/community/MessageThread';
import UserSearch from '@/components/community/UserSearch';
import { fetchConversations, fetchUserProfile } from '@/services/communityService';
import { supabase } from '@/integrations/supabase/client';

interface Conversation {
  conversation_user_id: string;
  conversation_username: string | null;
  conversation_avatar_url: string | null;
  conversation_display_name: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

const MessagesPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showNewMessageForm, setShowNewMessageForm] = useState(false);
  
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/community');
        return;
      }
      
      setCurrentUser(user);
    };
    
    checkAuth();
    
    const loadConversations = async () => {
      setIsLoading(true);
      const convs = await fetchConversations();
      setConversations(convs);
      setIsLoading(false);
    };
    
    loadConversations();
    
    // Set up realtime subscription for new messages
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        () => {
          // Refresh conversations when new messages arrive
          loadConversations();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate]);
  
  useEffect(() => {
    if (userId && currentUser) {
      loadSelectedUser();
    }
  }, [userId, currentUser]);
  
  const loadSelectedUser = async () => {
    if (!userId) return;
    
    const userProfile = await fetchUserProfile(userId);
    if (userProfile) {
      setSelectedUser(userProfile);
    }
  };
  
  const getInitials = (username: string) => {
    return username?.substring(0, 2).toUpperCase() || 'AN';
  };
  
  const handleSelectUser = (selectedUserId: string) => {
    navigate(`/community/messages/${selectedUserId}`);
    setShowNewMessageForm(false);
  };
  
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#080b16] bg-gradient-to-b from-[#0a0e1c] to-[#070a14]">
        <div className="max-w-6xl mx-auto px-4 pt-24 pb-16">
          <div className="mb-6">
            <Link to="/community">
              <Button variant="ghost" className="text-gray-400">
                <ArrowLeft className="mr-2 h-5 w-5" /> Back to Community
              </Button>
            </Link>
          </div>
          
          <div className="bg-[#10121f] rounded-lg border border-indigo-900/30 min-h-[70vh]">
            <div className="h-full flex flex-col md:flex-row">
              {/* Sidebar for conversations */}
              <div className="w-full md:w-1/3 border-r border-indigo-900/30">
                <div className="p-3 border-b border-indigo-900/30 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-white">Messages</h2>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-indigo-400"
                    onClick={() => setShowNewMessageForm(!showNewMessageForm)}
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
                
                {showNewMessageForm && (
                  <div className="p-3 border-b border-indigo-900/30 bg-[#191c31]">
                    <UserSearch onSelect={handleSelectUser} />
                  </div>
                )}
                
                <div className="overflow-y-auto h-[calc(70vh-60px)]">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-32">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="p-4 text-center text-gray-400">
                      <p>No conversations yet</p>
                      <Button 
                        className="mt-2 bg-indigo-600 hover:bg-indigo-700"
                        onClick={() => setShowNewMessageForm(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Start a Conversation
                      </Button>
                    </div>
                  ) : (
                    <div>
                      {conversations.map(conv => (
                        <Link 
                          key={conv.conversation_user_id} 
                          to={`/community/messages/${conv.conversation_user_id}`}
                        >
                          <div className={`p-3 flex items-center hover:bg-[#191c31] cursor-pointer ${
                            userId === conv.conversation_user_id ? 'bg-[#191c31]' : ''
                          }`}>
                            <div className="relative">
                              <Avatar className="h-12 w-12 mr-3">
                                <AvatarImage src={conv.conversation_avatar_url || ''} alt={conv.conversation_username || ''} />
                                <AvatarFallback className="bg-indigo-600">{getInitials(conv.conversation_username || '')}</AvatarFallback>
                              </Avatar>
                              {conv.unread_count > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                  {conv.unread_count > 9 ? '9+' : conv.unread_count}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between">
                                <p className="font-medium text-white truncate">
                                  {conv.conversation_display_name || conv.conversation_username || 'Anonymous'}
                                </p>
                                <p className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                  {formatDistanceToNow(new Date(conv.last_message_time), { addSuffix: true })}
                                </p>
                              </div>
                              <p className="text-sm text-gray-400 truncate">{conv.last_message}</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Message thread display */}
              <div className="w-full md:w-2/3 flex flex-col">
                {selectedUser ? (
                  <>
                    <div className="p-3 border-b border-indigo-900/30 flex items-center">
                      <Link to={`/community/profile/${selectedUser.id}`}>
                        <Avatar className="h-9 w-9 mr-3">
                          <AvatarImage src={selectedUser.avatar_url || ''} alt={selectedUser.username || ''} />
                          <AvatarFallback className="bg-indigo-600">{getInitials(selectedUser.username || '')}</AvatarFallback>
                        </Avatar>
                      </Link>
                      <Link to={`/community/profile/${selectedUser.id}`} className="font-medium text-white hover:text-indigo-400 transition">
                        {selectedUser.display_name || selectedUser.username || 'Anonymous'}
                      </Link>
                    </div>
                    
                    <div className="flex-1">
                      <MessageThread 
                        otherUserId={selectedUser.id} 
                        otherUserName={selectedUser.display_name || selectedUser.username || 'Anonymous'}
                        otherUserAvatar={selectedUser.avatar_url}
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-400">
                    <div className="mb-4 p-4 rounded-full bg-indigo-900/20">
                      <MessageThread className="h-16 w-16" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Your Messages</h3>
                    <p className="mb-4">Select a conversation or start a new one</p>
                    <Button 
                      className="bg-indigo-600 hover:bg-indigo-700"
                      onClick={() => setShowNewMessageForm(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      New Message
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default MessagesPage;
