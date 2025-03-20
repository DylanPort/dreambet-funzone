
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
    
    const response = await fetch(`https://public-api.solscan.io/token/meta?tokenAddress=${tokenAddress}`);
    
    // Clear loading toast
    toast.dismiss(loadingToastId);
    
    if (response.status === 404) {
      console.log(`Token not found on Solscan: ${tokenAddress}`);
      toast.error("Token not found on Solscan. Please verify the address is correct and the token exists.");
      return null;
    }
    
    if (!response.ok) {
      console.error(`Solscan API error: ${response.status} - ${response.statusText}`);
      toast.error(`Error: ${response.status} - ${response.statusText}`);
      return null;
    }
    
    const data: SolscanTokenResponse = await response.json();
    
    if (!data.success || !data.data) {
      console.error("Invalid token data response:", data);
      toast.error("Token data format is invalid");
      return null;
    }
    
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
