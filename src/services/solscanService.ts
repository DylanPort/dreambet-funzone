
import { toast } from "sonner";

interface SolscanTokenResponse {
  success: boolean;
  data?: {
    symbol: string;
    name: string;
    decimals: number;
    address: string;
    icon?: string;
    totalSupply?: string;
  };
}

/**
 * Fetch token data from Solscan API
 */
export const fetchTokenDataFromSolscan = async (tokenAddress: string): Promise<{
  symbol: string;
  name: string;
  address: string;
  icon?: string;
} | null> => {
  try {
    // Show loading toast
    const loadingToastId = toast.loading("Searching for token...");
    
    // Validate the token address
    if (!tokenAddress || tokenAddress.trim().length < 32) {
      toast.dismiss(loadingToastId);
      toast.error("Invalid token address format");
      return null;
    }
    
    // Format address correctly - remove spaces and ensure it's trimmed
    const formattedAddress = tokenAddress.trim();
    
    console.log(`Searching for token on Solscan: ${formattedAddress}`);
    
    // Use fetch with proper error handling
    const response = await fetch(`https://public-api.solscan.io/token/meta?tokenAddress=${formattedAddress}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
    });
    
    // Clear loading toast
    toast.dismiss(loadingToastId);
    
    // Handle different response status codes
    if (response.status === 404) {
      console.log(`Token not found on Solscan: ${formattedAddress}`);
      toast.error("Token not found on Solscan. Please verify the address is correct.");
      return null;
    }
    
    if (!response.ok) {
      console.error(`Solscan API error: ${response.status} - ${response.statusText}`);
      toast.error(`Solscan API error: ${response.status} - ${response.statusText}`);
      return null;
    }
    
    // Parse response
    const data: SolscanTokenResponse = await response.json();
    
    // Validate response data
    if (!data.success || !data.data) {
      console.error("Invalid token data response:", data);
      toast.error("Token data format is invalid or token not found");
      return null;
    }
    
    // Success! Token found
    console.log("Token found on Solscan:", data.data);
    toast.success(`Found token: ${data.data.name} (${data.data.symbol})`);
    
    return {
      symbol: data.data.symbol,
      name: data.data.name,
      address: data.data.address,
      icon: data.data.icon
    };
  } catch (error) {
    console.error("Error fetching token data:", error);
    toast.error("Failed to fetch token data. Please try again later.");
    return null;
  }
};
