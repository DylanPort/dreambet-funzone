
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
    
    return {
      symbol: data.data.symbol,
      name: data.data.name,
      address: data.data.address,
      icon: data.data.icon
    };
  } catch (error) {
    console.error("Error fetching token data:", error);
    return null;
  }
};
