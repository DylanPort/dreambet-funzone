
import React, { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SendHorizontal } from 'lucide-react';
import { Message, fetchMessages, sendMessage } from '@/services/communityService';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface MessageThreadProps {
  recipientId: string;
  recipientName?: string;
  recipientAvatar?: string;
}

const MessageThread: React.FC<MessageThreadProps> = ({ 
  recipientId, 
  recipientName,
  recipientAvatar
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
      const messagesData = await fetchMessages(recipientId);
      setMessages(messagesData);
      setIsLoading(false);
    };
    
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    
    if (recipientId) {
      getMessages();
      getCurrentUser();
    }
  }, [recipientId]);
  
  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  useEffect(() => {
    // Set up realtime subscription for new messages
    const channel = supabase
      .channel('messages-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `recipient_id=eq.${currentUserId}`
      }, async (payload) => {
        console.log('New message:', payload);
        // Refresh messages
        const messagesData = await fetchMessages(recipientId);
        setMessages(messagesData);
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, recipientId]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    setIsSending(true);
    const message = await sendMessage(recipientId, newMessage);
    setIsSending(false);
    
    if (message) {
      setMessages(prev => [...prev, message]);
      setNewMessage('');
    }
  };
  
  const getInitials = (username?: string | null) => {
    return username ? username.substring(0, 2).toUpperCase() : 'AN';
  };
  
  const formatMessageTime = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-[600px] max-h-[600px]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>No messages yet. Start a conversation!</p>
          </div>
        ) : (
          messages.map(message => {
            const isCurrentUser = message.sender_id === currentUserId;
            
            return (
              <div 
                key={message.id}
                className={`flex items-start ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isCurrentUser && (
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src={recipientAvatar || ''} />
                    <AvatarFallback className="bg-indigo-600">
                      {getInitials(recipientName)}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`max-w-[70%] ${isCurrentUser ? 'bg-indigo-600/70' : 'bg-gray-700/50'} rounded-lg px-3 py-2`}>
                  <div className="whitespace-pre-wrap break-words text-white text-sm">
                    {message.content}
                  </div>
                  <div className={`text-xs mt-1 ${isCurrentUser ? 'text-indigo-300/70' : 'text-gray-400'}`}>
                    {formatMessageTime(message.created_at)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t border-indigo-900/30 p-3">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <Textarea 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="min-h-[60px] max-h-[120px] bg-[#191c31] border-indigo-900/30 text-white resize-none"
          />
          <Button 
            type="submit" 
            className="bg-indigo-600 hover:bg-indigo-700 self-end"
            disabled={!newMessage.trim() || isSending}
          >
            <SendHorizontal className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default MessageThread;
