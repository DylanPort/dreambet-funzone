
interface SolscanTokenResponse {
  success: boolean;
  data: {
    symbol: string;
    name: string;
    address: string;
    icon?: string;
  }
}

export const fetchTokenDataFromSolscan = async (tokenAddress: string): Promise<{
  symbol: string;
  name: string;
  address: string;
  icon?: string;
} | null> => {
  try {
    console.log(`Searching for token on Solscan: ${tokenAddress}`);
    
    if (!tokenAddress || tokenAddress.trim().length < 32) {
      console.error("Invalid token address format");
      return null;
    }
    
    const formattedAddress = tokenAddress.trim();
    
    const response = await fetch(`https://public-api.solscan.io/token/meta?tokenAddress=${formattedAddress}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
    });
    
    if (response.status === 404) {
      console.log(`Token not found on Solscan: ${formattedAddress}`);
      return null;
    }
    
    if (!response.ok) {
      console.error(`Solscan API error: ${response.status} - ${response.statusText}`);
      return null;
    }
    
    const data: SolscanTokenResponse = await response.json();
    
    if (!data.success || !data.data) {
      console.error("Invalid token data response:", data);
      return null;
    }
    
    console.log("Token found on Solscan:", data.data);
    
    // If the icon is not provided by Solscan, we can try to get it from alternative sources
    let icon = data.data.icon;
    
    // If no icon from Solscan, try a fallback
    if (!icon) {
      // Try Solflare token icons as fallback
      icon = `https://token-icons.solflare.com/solana/${formattedAddress}.png`;
      console.log(`Using fallback icon from Solflare: ${icon}`);
    }
    
    return {
      symbol: data.data.symbol,
      name: data.data.name,
      address: data.data.address,
      icon: icon
    };
  } catch (error) {
    console.error("Error fetching token data:", error);
    return null;
  }
};
