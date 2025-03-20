
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface SolanaTrackerTokenResponse {
  results?: {
    name: string;
    symbol: string;
    mint: string;
    liquidity?: number;
    marketCap?: number;
    logo?: string;
  }[];
  error?: string;
}

/**
 * Fetch token data from Solana Tracker API through a secure edge function
 */
export const searchTokenFromSolanaTracker = async (query: string): Promise<{
  symbol: string;
  name: string;
  address: string;
  icon?: string;
  liquidity?: number;
  marketCap?: number;
} | null> => {
  try {
    // Show loading toast
    const loadingToastId = toast.loading("Searching for token...");
    
    // Validate the search query
    if (!query || query.trim().length === 0) {
      toast.dismiss(loadingToastId);
      toast.error("Please enter a token name or symbol");
      return null;
    }
    
    console.log(`Searching for token on Solana Tracker: ${query}`);
    
    // Call the edge function instead of directly calling the Solana Tracker API
    const { data, error } = await supabase.functions.invoke("solana-tracker", {
      body: { query: query.trim() }
    });
    
    // Clear loading toast
    toast.dismiss(loadingToastId);
    
    // Handle errors from the edge function
    if (error) {
      console.error("Edge function error:", error);
      toast.error("Failed to search for token. Please try again later.");
      return null;
    }
    
    // Handle error response from the edge function
    if (data.error) {
      console.error("Token search error:", data.error);
      
      if (data.error === "Token not found") {
        toast.error("Token not found. Please try a different name or symbol.");
      } else {
        toast.error(`Error: ${data.error}`);
      }
      
      return null;
    }
    
    // Process the response data
    const responseData = data as SolanaTrackerTokenResponse;
    
    // Validate response data
    if (!responseData.results || responseData.results.length === 0) {
      console.error("No tokens found:", responseData);
      toast.error("No tokens found matching your search.");
      return null;
    }
    
    // Use the first token result
    const token = responseData.results[0];
    
    // Success! Token found
    console.log("Token found on Solana Tracker:", token);
    toast.success(`Found token: ${token.name} (${token.symbol})`);
    
    return {
      symbol: token.symbol,
      name: token.name,
      address: token.mint,
      icon: token.logo,
      liquidity: token.liquidity,
      marketCap: token.marketCap
    };
  } catch (error) {
    console.error("Error fetching token data:", error);
    toast.error("Failed to fetch token data. Please try again later.");
    return null;
  }
};
