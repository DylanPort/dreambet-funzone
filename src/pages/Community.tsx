
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Send, ThumbsUp, MessageCircle, RefreshCw } from 'lucide-react';
import Navbar from '@/components/Navbar';
import OrbitingParticles from '@/components/OrbitingParticles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCommunityMessages, CommunityMessage } from '@/hooks/useCommunityMessages';
import { usePXBPoints } from '@/contexts/PXBPointsContext';

const Community = () => {
  const { messages, loading, postMessage } = useCommunityMessages();
  const { userProfile } = usePXBPoints();
  const [newMessage, setNewMessage] = useState("");
  const [selectedTab, setSelectedTab] = useState("latest");

  const handleSubmitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    if (!userProfile) {
      alert("Please connect your wallet to post messages");
      return;
    }
    
    const success = await postMessage(newMessage);
    if (success) {
      setNewMessage("");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <OrbitingParticles />
      <Navbar />
      
      <main className="pt-24 min-h-screen overflow-hidden px-4 pb-16">
        <div className="max-w-5xl mx-auto">
          <Link to="/betting" className="inline-flex items-center text-dream-foreground/70 hover:text-dream-foreground mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
          
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-display font-bold">Community</h1>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card className="bg-black/60 border-dream-accent1/30">
                <CardContent className="pt-6">
                  <Tabs defaultValue="latest" value={selectedTab} onValueChange={setSelectedTab}>
                    <TabsList className="mb-4">
                      <TabsTrigger value="latest">Latest</TabsTrigger>
                      <TabsTrigger value="popular">Popular</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="latest">
                      {loading ? (
                        <div className="flex justify-center my-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-dream-accent1"></div>
                        </div>
                      ) : messages && messages.length > 0 ? (
                        <div className="space-y-4">
                          {messages.map((message) => (
                            <div key={message.id} className="p-4 rounded-lg bg-dream-foreground/5 border border-dream-foreground/10">
                              <div className="flex items-start">
                                <div className="flex-shrink-0 mr-3">
                                  <div className="w-10 h-10 rounded-full overflow-hidden bg-dream-accent1/20">
                                    {message.avatar_url ? (
                                      <img src={message.avatar_url} alt={message.username} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        {message.username.substring(0, 1).toUpperCase()}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex-1">
                                  <div className="flex justify-between mb-1">
                                    <div className="font-medium">{message.username}</div>
                                    <div className="text-xs text-dream-foreground/50">{formatDate(message.created_at)}</div>
                                  </div>
                                  
                                  <p className="text-sm text-dream-foreground/80 whitespace-pre-wrap break-words">{message.content}</p>
                                  
                                  <div className="flex mt-2 space-x-2">
                                    <button className="text-xs flex items-center text-dream-foreground/50 hover:text-dream-foreground/80">
                                      <ThumbsUp className="h-3 w-3 mr-1" />
                                      <span>Like</span>
                                    </button>
                                    
                                    <button className="text-xs flex items-center text-dream-foreground/50 hover:text-dream-foreground/80">
                                      <MessageCircle className="h-3 w-3 mr-1" />
                                      <span>Reply</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <p className="text-dream-foreground/60">No messages yet</p>
                          <p className="text-sm text-dream-foreground/40 mt-1">Be the first to start the conversation!</p>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="popular">
                      <div className="text-center py-12">
                        <p className="text-dream-foreground/60">Popular messages will appear here</p>
                        <p className="text-sm text-dream-foreground/40 mt-1">This feature is coming soon!</p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
              
              <Card className="bg-black/60 border-dream-accent1/30">
                <CardContent className="pt-6">
                  <form onSubmit={handleSubmitMessage} className="flex space-x-2">
                    <Input
                      placeholder="Write a message to the community..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="bg-dream-foreground/5 border-dream-foreground/10"
                      disabled={!userProfile}
                    />
                    <Button 
                      type="submit" 
                      disabled={!userProfile || !newMessage.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                  
                  {!userProfile && (
                    <p className="text-xs text-dream-foreground/40 mt-2">Connect your wallet to join the conversation</p>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-6">
              <Card className="bg-black/60 border-dream-accent1/30">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Community Stats</h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-dream-foreground/60">Total Messages</span>
                      <span className="font-medium">{messages ? messages.length : 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dream-foreground/60">Active Users</span>
                      <span className="font-medium">
                        {loading ? "..." : new Set(messages.map(m => m.user_id)).size}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-black/60 border-dream-accent1/30">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">Community Guidelines</h3>
                  </div>
                  
                  <ul className="space-y-2 text-sm text-dream-foreground/70">
                    <li>• Be respectful to other community members</li>
                    <li>• No spam or excessive self-promotion</li>
                    <li>• Share insights and helpful information</li>
                    <li>• Keep discussions on topic</li>
                    <li>• No financial advice or manipulation</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Community;
