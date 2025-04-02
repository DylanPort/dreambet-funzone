
import React, { useState, useEffect } from 'react';
import { Search, MessageSquare, ExternalLink, User, Clock, ArrowLeftRight, Bell } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { searchUsers, sendMessage, fetchUserMessages, markMessageAsRead, UserProfile, UserMessage } from '@/services/userService';
import { usePXBPoints } from '@/contexts/pxb/PXBPointsContext';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

const FindUser = () => {
  const navigate = useNavigate();
  const { userProfile } = usePXBPoints();
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const [userMessages, setUserMessages] = useState<UserMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState('search');

  // Fetch current user's messages
  useEffect(() => {
    if (userProfile) {
      fetchMessages();
    }
  }, [userProfile]);

  // Subscribe to real-time updates for new messages
  useEffect(() => {
    if (!userProfile) return;
    
    const channel = supabase
      .channel('public:user_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'user_messages',
        filter: `recipient_id=eq.${userProfile.id}`
      }, (payload) => {
        console.log('New message received:', payload);
        fetchMessages();
        toast.info("You have a new message", {
          description: "Check your messages tab to read it",
        });
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile]);

  const fetchMessages = async () => {
    if (!userProfile?.wallet_address) return;
    
    setLoadingMessages(true);
    try {
      const messages = await fetchUserMessages(userProfile.wallet_address);
      setUserMessages(messages);
      
      // Count unread messages
      const unread = messages.filter(msg => 
        msg.recipient_id === userProfile.id && !msg.read
      ).length;
      
      setUnreadCount(unread);
      
      // If we're on the messages tab, auto-switch to it when there are unread messages
      if (unread > 0 && activeTab !== 'messages') {
        toast.info(`You have ${unread} unread message${unread > 1 ? 's' : ''}`, {
          description: "Click here to view",
          action: {
            label: "View",
            onClick: () => setActiveTab("messages")
          }
        });
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery || searchQuery.length < 3) {
      toast.error("Please enter at least 3 characters to search");
      return;
    }

    setSearching(true);
    try {
      const results = await searchUsers(searchQuery);
      setSearchResults(results);
      if (results.length === 0) {
        toast.info("No users found matching your search");
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to search users");
    } finally {
      setSearching(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedUser) {
      toast.error("Please select a user to message");
      return;
    }

    if (!messageContent.trim()) {
      toast.error("Message cannot be empty");
      return;
    }

    if (!userProfile?.wallet_address) {
      toast.error("Please connect your wallet to send messages");
      return;
    }

    setSendingMessage(true);
    try {
      const sent = await sendMessage(userProfile.wallet_address, selectedUser.id, messageContent);
      if (sent) {
        setMessageContent('');
        toast.success(`Message sent to ${selectedUser.username || 'user'}`);
        
        // Refresh messages
        fetchMessages();
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      const success = await markMessageAsRead(messageId);
      if (success) {
        // Update the local state to mark the message as read
        setUserMessages(prevMessages =>
          prevMessages.map(msg =>
            msg.id === messageId ? { ...msg, read: true } : msg
          )
        );
        
        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  const handleUserSelect = (user: UserProfile) => {
    setSelectedUser(user);
  };

  const formatTimeAgo = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return 'recently';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 bg-gradient-to-b from-dream-background to-dream-background/80">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative max-w-5xl mx-auto"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-purple-500/5 rounded-xl blur-xl"></div>
          
          <Card className="border border-white/10 glass-panel bg-dream-background/30 backdrop-blur-lg shadow-xl rounded-xl overflow-hidden">
            <CardHeader className="pb-2 border-b border-white/5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <span className="bg-purple-500/20 p-2 rounded-lg">
                      <User className="h-5 w-5 text-purple-400" />
                    </span>
                    <span>Find Users</span>
                    {unreadCount > 0 && (
                      <Badge variant="default" className="bg-purple-600 text-white ml-2 animated-pulse">
                        {unreadCount} new
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-dream-foreground/60 mt-1">
                    Search for users and send them messages
                  </CardDescription>
                </div>
                
                <Tabs 
                  value={activeTab} 
                  onValueChange={setActiveTab} 
                  className="w-full md:w-auto"
                >
                  <TabsList className="grid w-full grid-cols-2 bg-dream-background/40 border border-white/10">
                    <TabsTrigger 
                      value="search" 
                      className="flex items-center gap-1.5 data-[state=active]:bg-purple-600/30"
                    >
                      <Search className="h-4 w-4" />
                      <span>Search</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="messages" 
                      className="flex items-center gap-1.5 data-[state=active]:bg-purple-600/30 relative"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>Messages</span>
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {unreadCount}
                        </span>
                      )}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            
            <CardContent className="p-4">
              <TabsContent value="search" className="mt-0 space-y-6">
                <div className="space-y-4">
                  <div className="relative">
                    <div className="glass-panel bg-dream-background/50 backdrop-blur-sm rounded-lg border border-white/10 flex items-center">
                      <Input
                        className="bg-transparent border-none shadow-none focus-visible:ring-0 pl-10"
                        placeholder="Enter wallet address or username (min 3 characters)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={handleKeyPress}
                      />
                      <Search className="absolute left-3 h-4 w-4 text-dream-foreground/40" />
                      <Button 
                        onClick={handleSearch}
                        disabled={searching || searchQuery.length < 3}
                        className="ml-2 mr-1 bg-purple-600 hover:bg-purple-700"
                        size="sm"
                      >
                        {searching ? 'Searching...' : 'Search'}
                      </Button>
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {searchResults.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4"
                      >
                        <h3 className="text-lg font-medium text-dream-foreground/80 flex items-center gap-2">
                          <Search className="h-4 w-4 text-purple-400" />
                          Search Results
                          <Badge variant="outline" className="ml-2 text-dream-foreground/60 border-white/10">
                            {searchResults.length} found
                          </Badge>
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {searchResults.map((user) => (
                            <motion.div
                              key={user.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <Card 
                                className={`cursor-pointer transition-all duration-200 hover:shadow-md border border-white/5 hover:border-purple-500/30 ${
                                  selectedUser?.id === user.id ? 'border-purple-500 bg-purple-900/10' : 'bg-dream-background/60'
                                }`}
                                onClick={() => handleUserSelect(user)}
                              >
                                <CardHeader className="pb-2">
                                  <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center">
                                        <User className="h-5 w-5 text-purple-300" />
                                      </div>
                                      <div>
                                        <CardTitle className="text-base">{user.username || 'Anonymous User'}</CardTitle>
                                        <CardDescription className="text-xs truncate max-w-[200px]">
                                          {user.wallet_address}
                                        </CardDescription>
                                      </div>
                                    </div>
                                    <Button 
                                      size="icon" 
                                      variant="ghost" 
                                      className="h-8 w-8 text-dream-foreground/60 hover:text-dream-foreground hover:bg-purple-500/10"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/profile/${user.id}`);
                                      }}
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </CardHeader>
                                <CardFooter className="pt-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="w-full border-white/10 bg-purple-500/5 hover:bg-purple-500/10 hover:border-purple-500/30"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUserSelect(user);
                                    }}
                                  >
                                    <MessageSquare className="mr-2 h-4 w-4 text-purple-400" />
                                    Message
                                  </Button>
                                </CardFooter>
                              </Card>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {selectedUser && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    >
                      <Card className="border border-purple-500/30 bg-dream-background/70 backdrop-blur-sm overflow-hidden">
                        <CardHeader className="pb-3 border-b border-white/5">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center">
                              <User className="h-4 w-4 text-purple-300" />
                            </div>
                            Message to {selectedUser.username || 'User'}
                          </CardTitle>
                          <CardDescription className="text-dream-foreground/60 text-xs">
                            Send a direct message to this user
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <Textarea
                            placeholder="Write your message here..."
                            value={messageContent}
                            onChange={(e) => setMessageContent(e.target.value)}
                            className="min-h-[120px] bg-dream-background/60 border-white/10 placeholder:text-dream-foreground/30 resize-none"
                          />
                        </CardContent>
                        <CardFooter className="flex justify-end border-t border-white/5 pt-3">
                          <Button 
                            onClick={handleSendMessage}
                            disabled={sendingMessage || !messageContent.trim() || !userProfile}
                            className="bg-purple-600 hover:bg-purple-700 text-white transition-all duration-200"
                          >
                            {sendingMessage ? 'Sending...' : 'Send Message'}
                            <MessageSquare className="ml-2 h-4 w-4" />
                          </Button>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="messages" className="mt-0 space-y-4">
                {!userProfile ? (
                  <Card className="border border-white/10 bg-dream-background/60">
                    <CardHeader>
                      <CardTitle className="text-lg">Connect Your Wallet</CardTitle>
                      <CardDescription className="text-dream-foreground/60">
                        Please connect your wallet to see your messages
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-center py-4">
                        <Button 
                          onClick={() => navigate('/profile')}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          Go to Profile
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : loadingMessages ? (
                  <div className="flex flex-col items-center justify-center p-8 text-dream-foreground/60">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Clock className="h-8 w-8 mb-2 text-purple-400" />
                    </motion.div>
                    <p>Loading messages...</p>
                  </div>
                ) : userMessages.length === 0 ? (
                  <Card className="border border-white/10 bg-dream-background/60">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-purple-400" />
                        No Messages
                      </CardTitle>
                      <CardDescription className="text-dream-foreground/60">
                        You don't have any messages yet. Search for users to start a conversation.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-center py-4">
                        <Button 
                          onClick={() => setActiveTab('search')}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          Find Users
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-dream-foreground/80 flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-purple-400" />
                          Your Messages
                          {unreadCount > 0 && (
                            <Badge className="ml-2 bg-purple-600 text-white">
                              {unreadCount} unread
                            </Badge>
                          )}
                        </h3>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs border-white/10 hover:bg-purple-500/10 hover:border-purple-500/30"
                          onClick={fetchMessages}
                        >
                          <ArrowLeftRight className="h-3 w-3 mr-1" />
                          Refresh
                        </Button>
                      </div>
                      
                      {/* Group messages by date */}
                      {userMessages.map((message, index) => {
                        const isReceived = message.recipient_id === userProfile.id;
                        const isFirstUnread = isReceived && !message.read && 
                          userMessages.slice(0, index).every(m => m.recipient_id !== userProfile.id || m.read);
                        
                        return (
                          <React.Fragment key={message.id}>
                            {isFirstUnread && (
                              <div className="flex items-center gap-2 my-3">
                                <Separator className="flex-grow bg-purple-500/30" />
                                <Badge className="bg-purple-500/20 text-purple-300 text-xs font-normal">
                                  New Messages
                                </Badge>
                                <Separator className="flex-grow bg-purple-500/30" />
                              </div>
                            )}
                            
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                              whileHover={{ scale: 1.01 }}
                            >
                              <Card 
                                key={message.id}
                                className={`transition-all duration-200 ${
                                  !message.read && isReceived 
                                    ? 'border-purple-500/30 bg-purple-900/10' 
                                    : 'border border-white/5 bg-dream-background/40'
                                }`}
                                onClick={() => {
                                  if (!message.read && isReceived) {
                                    handleMarkAsRead(message.id);
                                  }
                                }}
                              >
                                <CardHeader className="pb-2">
                                  <div className="flex justify-between items-start">
                                    <CardTitle className="text-base flex items-center gap-2">
                                      {isReceived ? (
                                        <>
                                          <span className="text-purple-400 text-sm">From:</span> 
                                          <span className="font-semibold">{message.sender_username || 'Unknown User'}</span>
                                        </>
                                      ) : (
                                        <>
                                          <span className="text-blue-400 text-sm">To:</span> 
                                          <span className="font-semibold">{message.sender_username || 'Unknown User'}</span>
                                        </>
                                      )}
                                      
                                      {!message.read && isReceived && (
                                        <span className="inline-block w-2 h-2 rounded-full bg-purple-500 animate-pulse ml-2"></span>
                                      )}
                                    </CardTitle>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-dream-foreground/40 flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {formatTimeAgo(message.created_at)}
                                      </span>
                                      {!message.read && isReceived && (
                                        <Badge variant="outline" className="text-xs bg-purple-500/20 text-purple-300 border-purple-500/30">
                                          New
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <p className="whitespace-pre-wrap text-sm bg-dream-background/30 p-3 rounded-md border border-white/5">
                                    {message.content}
                                  </p>
                                </CardContent>
                                <CardFooter className="pt-0 justify-end">
                                  {isReceived && (
                                    <Button 
                                      size="sm"
                                      variant="outline"
                                      className="ml-auto border-white/10 bg-purple-500/5 hover:bg-purple-500/10 hover:border-purple-500/30"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Switch to search tab to reply
                                        setActiveTab('search');
                                        // Set the selected user to reply to
                                        setSelectedUser({
                                          id: message.sender_id,
                                          username: message.sender_username || null,
                                          wallet_address: '',
                                          created_at: ''
                                        });
                                      }}
                                    >
                                      Reply <MessageSquare className="ml-2 h-4 w-4" />
                                    </Button>
                                  )}
                                </CardFooter>
                              </Card>
                            </motion.div>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default FindUser;
