
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface UserProfile {
  id: string;
  username: string | null;
  wallet_address: string;
  created_at: string;
}

export interface UserBet {
  id: string;
  tokenName: string;
  tokenSymbol: string;
  amount: number;
  prediction: 'moon' | 'die';
  result: 'win' | 'loss' | 'pending';
  date: string;
  profit: number;
  isActive?: boolean;
  expiresAt?: number;
}

export interface UserStats {
  totalBets: number;
  winRate: number;
  totalProfit: number;
  balance: number;
}

export interface UserMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  read: boolean;
  sender_username?: string | null;
}

// Fetch the user's profile data by wallet address
export const fetchUserProfile = async (walletAddress?: string): Promise<UserProfile | null> => {
  try {
    if (!walletAddress) {
      console.error("Wallet address is required to fetch profile");
      return null;
    }
    
    // Fetch the user's profile data from the users table using wallet address
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();
    
    if (error) {
      console.error("Error fetching user profile:", error);
      
      // If user doesn't exist, create a new profile
      if (error.code === 'PGRST116') {
        const newProfile = await createUserProfile(walletAddress);
        return newProfile;
      }
      
      return null;
    }
    
    return data as UserProfile;
  } catch (error) {
    console.error("Unexpected error in fetchUserProfile:", error);
    return null;
  }
};

// Create a new user profile if it doesn't exist
const createUserProfile = async (walletAddress: string): Promise<UserProfile | null> => {
  try {
    // Generate a unique ID for the user
    const id = crypto.randomUUID();
    
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: id,
        wallet_address: walletAddress,
        username: `User_${walletAddress.substring(0, 8)}`
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error creating user profile:", error);
      return null;
    }
    
    return data as UserProfile;
  } catch (error) {
    console.error("Unexpected error in createUserProfile:", error);
    return null;
  }
};

// Fetch the user's betting history by wallet address
export const fetchUserBettingHistory = async (walletAddress?: string): Promise<UserBet[]> => {
  try {
    if (!walletAddress) {
      console.error("Wallet address is required to fetch betting history");
      return [];
    }
    
    // Fetch bets created by this wallet address
    const { data, error } = await supabase
      .from('bets')
      .select(`
        bet_id,
        token_mint,
        tokens (token_name, token_symbol),
        prediction_bettor1,
        sol_amount,
        status,
        created_at
      `)
      .eq('creator', walletAddress)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching user bets:", error);
      return [];
    }
    
    // Transform to match our frontend UserBet type
    return data.map(bet => {
      // Determine result based on status
      let result: 'win' | 'loss' | 'pending' = 'pending';
      let profit = 0;
      
      if (bet.status === 'won') {
        result = 'win';
        profit = bet.sol_amount * 0.95; // 95% profit
      } else if (bet.status === 'lost') {
        result = 'loss';
        profit = -bet.sol_amount;
      }
      
      // Map prediction values from database to our frontend format
      let prediction: 'moon' | 'die';
      if (bet.prediction_bettor1 === 'up' || bet.prediction_bettor1 === 'migrate') {
        prediction = 'moon';
      } else {
        prediction = 'die';
      }
      
      return {
        id: bet.bet_id,
        tokenName: bet.tokens?.token_name || 'Unknown Token',
        tokenSymbol: bet.tokens?.token_symbol || 'UNKNOWN',
        amount: bet.sol_amount,
        prediction: prediction,
        result: result,
        date: bet.created_at,
        profit: profit,
      };
    });
  } catch (error) {
    console.error("Unexpected error in fetchUserBettingHistory:", error);
    return [];
  }
};

// Calculate user stats from betting history
export const calculateUserStats = (bets: UserBet[]): UserStats => {
  const totalBets = bets.length;
  
  const wins = bets.filter(bet => bet.result === 'win').length;
  const winRate = totalBets > 0 ? Math.round((wins / totalBets) * 100) : 0;
  
  const totalProfit = bets.reduce((sum, bet) => sum + bet.profit, 0);
  
  // For this implementation, we'll set the balance to be total profit + 2500 (starting balance)
  const balance = totalProfit + 2500;
  
  return {
    totalBets,
    winRate,
    totalProfit,
    balance
  };
};

// Update the user's username
export const updateUsername = async (walletAddress: string, username: string): Promise<boolean> => {
  try {
    if (!walletAddress) {
      console.error("Wallet address is required to update username");
      toast.error("You need to connect your wallet to update your profile");
      return false;
    }
    
    // First check if the user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();
    
    if (fetchError) {
      console.error("Error fetching user profile:", fetchError);
      if (fetchError.code === 'PGRST116') {
        // User doesn't exist, create a new profile with this username
        toast.error("No profile found for this wallet address");
        return false;
      }
      toast.error("Error fetching user profile");
      return false;
    }
    
    // Update the username in the users table
    const { error } = await supabase
      .from('users')
      .update({ username })
      .eq('wallet_address', walletAddress);
    
    if (error) {
      console.error("Error updating username:", error);
      toast.error("Failed to update username");
      return false;
    }
    
    console.log("Username updated successfully for wallet:", walletAddress);
    return true;
  } catch (error) {
    console.error("Unexpected error in updateUsername:", error);
    toast.error("An unexpected error occurred");
    return false;
  }
};

// Search users by wallet address or username
export const searchUsers = async (searchQuery: string): Promise<UserProfile[]> => {
  try {
    if (!searchQuery || searchQuery.trim().length < 3) {
      return [];
    }
    
    const query = searchQuery.trim().toLowerCase();
    
    // First try exact match on wallet address
    if (query.length >= 30) {
      const { data: exactMatch, error: exactError } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', query)
        .limit(1);
      
      if (!exactError && exactMatch && exactMatch.length > 0) {
        return exactMatch as UserProfile[];
      }
    }
    
    // Then try partial match on username and wallet_address
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`username.ilike.%${query}%,wallet_address.ilike.%${query}%`)
      .limit(20);
    
    if (error) {
      console.error("Error searching users:", error);
      toast.error("Failed to search users");
      return [];
    }
    
    return data as UserProfile[];
  } catch (error) {
    console.error("Unexpected error in searchUsers:", error);
    toast.error("An unexpected error occurred while searching users");
    return [];
  }
};

// Send a message to another user
export const sendMessage = async (
  senderWalletAddress: string,
  recipientId: string,
  content: string
): Promise<UserMessage | null> => {
  try {
    if (!senderWalletAddress || !recipientId || !content.trim()) {
      toast.error("Sender, recipient, and message content are required");
      return null;
    }
    
    // Get the sender's user ID
    const { data: senderData, error: senderError } = await supabase
      .from('users')
      .select('id, username')
      .eq('wallet_address', senderWalletAddress)
      .single();
    
    if (senderError) {
      console.error("Error fetching sender ID:", senderError);
      toast.error("Failed to send message: Sender profile not found");
      return null;
    }
    
    // Check if recipient exists
    const { data: recipientData, error: recipientError } = await supabase
      .from('users')
      .select('id')
      .eq('id', recipientId)
      .single();
    
    if (recipientError || !recipientData) {
      console.error("Error fetching recipient:", recipientError);
      toast.error("Failed to send message: Recipient not found");
      return null;
    }
    
    // Insert the message
    const { data: messageData, error: messageError } = await supabase
      .from('user_messages')
      .insert({
        sender_id: senderData.id,
        recipient_id: recipientId,
        content: content.trim(),
        read: false
      })
      .select()
      .single();
    
    if (messageError) {
      console.error("Error sending message:", messageError);
      toast.error("Failed to send message");
      return null;
    }
    
    toast.success("Message sent successfully");
    
    return {
      id: messageData.id,
      sender_id: messageData.sender_id,
      recipient_id: messageData.recipient_id,
      content: messageData.content,
      created_at: messageData.created_at,
      read: messageData.read,
      sender_username: senderData.username
    } as UserMessage;
    
  } catch (error) {
    console.error("Unexpected error in sendMessage:", error);
    toast.error("An unexpected error occurred while sending message");
    return null;
  }
};

// Fetch messages for the current user (both sent and received)
export const fetchUserMessages = async (walletAddress: string): Promise<UserMessage[]> => {
  try {
    if (!walletAddress) {
      console.error("Wallet address is required to fetch messages");
      return [];
    }
    
    // Get the user's ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single();
    
    if (userError) {
      console.error("Error fetching user ID:", userError);
      return [];
    }
    
    const userId = userData.id;
    
    // Fetch messages where user is either sender or recipient
    const { data, error } = await supabase
      .from('user_messages')
      .select(`
        *,
        sender:sender_id(username),
        recipient:recipient_id(username)
      `)
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching user messages:", error);
      return [];
    }
    
    // Format the messages
    return data.map(msg => ({
      id: msg.id,
      sender_id: msg.sender_id,
      recipient_id: msg.recipient_id,
      content: msg.content,
      created_at: msg.created_at,
      read: msg.read,
      sender_username: msg.sender?.username
    })) as UserMessage[];
    
  } catch (error) {
    console.error("Unexpected error in fetchUserMessages:", error);
    return [];
  }
};

// Mark a message as read
export const markMessageAsRead = async (messageId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_messages')
      .update({ read: true })
      .eq('id', messageId);
    
    if (error) {
      console.error("Error marking message as read:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Unexpected error in markMessageAsRead:", error);
    return false;
  }
};
