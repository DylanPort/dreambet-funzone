
import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SendHorizonal } from 'lucide-react';
import { Message, fetchMessages, sendMessage } from '@/services/communityService';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from "@/integrations/supabase/client";

interface MessageThreadProps {
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar?: string;
}

const MessageThread: React.FC<MessageThreadProps> = ({ 
  otherUserId, 
  otherUserName,
  otherUserAvatar
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const getMessages = async () => {
      setIsLoading(true);
      const fetchedMessages = await fetchMessages(otherUserId);
      setMessages(fetchedMessages);
      setIsLoading(false);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    
    getMessages();
    
    // Set up realtime subscription for new messages
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${otherUserId},recipient_id=eq.${currentUserId}`
        },
        (payload) => {
          // Add new message to the state
          const newMsg = payload.new as any;
          fetchMessages(otherUserId).then(updatedMessages => {
            setMessages(updatedMessages);
          });
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [otherUserId, currentUserId]);
  
  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    setIsSending(true);
    const sent = await sendMessage(otherUserId, newMessage);
    setIsSending(false);
    
    if (sent) {
      setNewMessage('');
      // Refresh messages
      const updatedMessages = await fetchMessages(otherUserId);
      setMessages(updatedMessages);
    }
  };
  
  const getInitials = (username: string) => {
    return username?.substring(0, 2).toUpperCase() || 'AN';
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400 my-8">
            <p>No messages yet</p>
            <p className="text-sm">Start a conversation!</p>
          </div>
        ) : (
          messages.map(message => {
            const isFromCurrentUser = message.sender_id === currentUserId;
            
            return (
              <div 
                key={message.id} 
                className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isFromCurrentUser && (
                  <Avatar className="h-8 w-8 mr-2 mt-1">
                    <AvatarImage src={otherUserAvatar || ''} />
                    <AvatarFallback className="bg-indigo-600">{getInitials(otherUserName)}</AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`max-w-[75%] ${isFromCurrentUser ? 'bg-indigo-600' : 'bg-[#2a2e42]'} px-3 py-2 rounded-lg`}>
                  <div className="text-white whitespace-pre-wrap break-words">{message.content}</div>
                  <div className="text-xs text-gray-300 mt-1">
                    {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSend} className="border-t border-indigo-900/30 p-4 bg-[#10121f]">
        <div className="flex space-x-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="bg-[#191c31] border-indigo-900/30 text-white"
          />
          <Button 
            type="submit" 
            disabled={!newMessage.trim() || isSending}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <SendHorizonal className="h-5 w-5" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default MessageThread;
