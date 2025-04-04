
import { supabase } from "@/integrations/supabase/client";

export interface CommunityMessage {
  id: string;
  user_id: string;
  username: string | null;
  content: string;
  created_at: string;
}

export const fetchCommunityMessages = async (): Promise<CommunityMessage[]> => {
  try {
    const { data, error } = await supabase
      .from('community_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) {
      console.error('Error fetching community messages:', error);
      throw error;
    }
    
    return data as CommunityMessage[];
  } catch (error) {
    console.error('Error in fetchCommunityMessages:', error);
    throw error;
  }
};

export const postCommunityMessage = async (
  content: string,
  userId: string,
  username?: string
): Promise<CommunityMessage> => {
  try {
    const { data, error } = await supabase
      .from('community_messages')
      .insert({
        user_id: userId,
        username: username || null,
        content
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error posting community message:', error);
      throw error;
    }
    
    return data as CommunityMessage;
  } catch (error) {
    console.error('Error in postCommunityMessage:', error);
    throw error;
  }
};
