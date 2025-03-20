
import { toast } from "sonner";

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
 * Fetch token data from Solana Tracker API
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
    
    // Make request to Solana Tracker API
    // Note: In production, this API key should be kept secure on a backend server
    const API_KEY = "3f5cbb18-8d2f-4a87-ae09-8555c243c705";
    
    const response = await fetch(`https://data.solanatracker.io/search?query=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'x-api-key': API_KEY
      },
    });
    
    // Clear loading toast
    toast.dismiss(loadingToastId);
    
    // Handle different response status codes
    if (response.status === 404) {
      console.log(`Token not found on Solana Tracker: ${query}`);
      toast.error("Token not found. Please try a different name or symbol.");
      return null;
    }
    
    if (response.status === 401 || response.status === 403) {
      console.error("API key unauthorized or invalid");
      toast.error("API authorization error. Please check your API key.");
      return null;
    }
    
    if (!response.ok) {
      console.error(`Solana Tracker API error: ${response.status} - ${response.statusText}`);
      toast.error(`API error: ${response.status} - ${response.statusText}`);
      return null;
    }
    
    // Parse response
    const data: SolanaTrackerTokenResponse = await response.json();
    
    // Validate response data
    if (!data.results || data.results.length === 0) {
      console.error("No tokens found:", data);
      toast.error("No tokens found matching your search.");
      return null;
    }
    
    // Use the first token result
    const token = data.results[0];
    
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
