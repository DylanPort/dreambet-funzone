
import React, { useState, useEffect } from 'react';
import { Search, MessageSquare, ExternalLink, User } from 'lucide-react';
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

const FindUser = () => {
  const navigate = useNavigate();
  const { walletAddress } = usePXBPoints();
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const [userMessages, setUserMessages] = useState<UserMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Fetch current user's messages
  useEffect(() => {
    if (walletAddress) {
      fetchMessages();
    }
  }, [walletAddress]);

  const fetchMessages = async () => {
    if (!walletAddress) return;
    
    setLoadingMessages(true);
    try {
      const messages = await fetchUserMessages(walletAddress);
      setUserMessages(messages);
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

    if (!walletAddress) {
      toast.error("Please connect your wallet to send messages");
      return;
    }

    setSendingMessage(true);
    try {
      const sent = await sendMessage(walletAddress, selectedUser.id, messageContent);
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
    <div className="container mx-auto px-4 pt-24 pb-12">
      <h1 className="text-3xl font-bold mb-6 text-center text-dream-foreground">Find Users</h1>
      
      <Tabs defaultValue="search" className="w-full max-w-4xl mx-auto">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="search">Search Users</TabsTrigger>
          <TabsTrigger value="messages">My Messages</TabsTrigger>
        </TabsList>
        
        <TabsContent value="search" className="space-y-6">
          <div className="flex gap-2">
            <Input
              className="flex-1"
              placeholder="Enter wallet address or username"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <Button 
              onClick={handleSearch}
              disabled={searching || searchQuery.length < 3}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {searching ? 'Searching...' : 'Search'}
              <Search className="ml-2 h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {searchResults.map((user) => (
              <Card 
                key={user.id} 
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedUser?.id === user.id ? 'border-purple-500 bg-purple-900/10' : 'bg-dream-background/60'
                }`}
                onClick={() => handleUserSelect(user)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{user.username || 'Anonymous User'}</CardTitle>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/profile/${user.id}`);
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription className="text-xs truncate">
                    {user.wallet_address}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="pt-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUserSelect(user);
                    }}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Message
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          
          {selectedUser && (
            <Card className="mt-6 border border-purple-500/50 bg-dream-background/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-purple-400" />
                  Message to {selectedUser.username || 'User'}
                </CardTitle>
                <CardDescription>
                  Send a direct message to this user
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Write your message here..."
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  className="min-h-[120px] bg-dream-background/60"
                />
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  onClick={handleSendMessage}
                  disabled={sendingMessage || !messageContent.trim() || !walletAddress}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {sendingMessage ? 'Sending...' : 'Send Message'}
                  <MessageSquare className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="messages">
          {!walletAddress ? (
            <Card className="bg-dream-background/60">
              <CardHeader>
                <CardTitle>Connect Your Wallet</CardTitle>
                <CardDescription>
                  Please connect your wallet to see your messages
                </CardDescription>
              </CardHeader>
            </Card>
          ) : loadingMessages ? (
            <div className="text-center py-8">
              <p>Loading messages...</p>
            </div>
          ) : userMessages.length === 0 ? (
            <Card className="bg-dream-background/60">
              <CardHeader>
                <CardTitle>No Messages</CardTitle>
                <CardDescription>
                  You don't have any messages yet
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="space-y-4">
              {userMessages.map((message) => {
                const isReceived = message.recipient_id === userMessages[0]?.recipient_id;
                
                return (
                  <Card 
                    key={message.id}
                    className={`transition-all duration-200 ${
                      !message.read && isReceived 
                        ? 'border-purple-500 bg-purple-900/20' 
                        : 'bg-dream-background/60'
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
                              <span className="text-purple-400">From:</span> 
                              {message.sender_username || 'Unknown User'}
                            </>
                          ) : (
                            <>
                              <span className="text-blue-400">To:</span> 
                              {message.sender_username || 'Unknown User'}
                            </>
                          )}
                          
                          {!message.read && isReceived && (
                            <span className="inline-block w-2 h-2 rounded-full bg-purple-500 animate-pulse ml-2"></span>
                          )}
                        </CardTitle>
                        <span className="text-xs text-gray-400">
                          {formatTimeAgo(message.created_at)}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                    </CardContent>
                    <CardFooter className="pt-0">
                      {isReceived && (
                        <Button 
                          size="sm"
                          variant="ghost"
                          className="ml-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Find the sender in search results or do a new search
                            setSearchQuery(message.sender_username || '');
                            setSelectedUser({
                              id: message.sender_id,
                              username: message.sender_username || null,
                              wallet_address: '',
                              created_at: ''
                            });
                            // Switch to search tab
                            const searchTab = document.querySelector('[data-value="search"]') as HTMLElement;
                            if (searchTab) searchTab.click();
                          }}
                        >
                          Reply <MessageSquare className="ml-2 h-4 w-4" />
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FindUser;
