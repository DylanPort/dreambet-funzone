
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
    const response = await fetch(`https://public-api.solscan.io/token/meta?tokenAddress=${tokenAddress}`);
    
    if (!response.ok) {
      toast.error(`Error: ${response.status} - ${response.statusText}`);
      return null;
    }
    
    const data: SolscanTokenResponse = await response.json();
    
    if (!data.success || !data.data) {
      toast.error("Token not found on Solscan");
      return null;
    }
    
    return {
      symbol: data.data.symbol,
      name: data.data.name,
      address: data.data.address,
      icon: data.data.icon
    };
  } catch (error) {
    console.error("Error fetching token data:", error);
    toast.error("Failed to fetch token data");
    return null;
  }
};
