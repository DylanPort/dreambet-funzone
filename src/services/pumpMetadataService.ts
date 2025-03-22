
import { toast } from 'sonner';

interface PumpTokenMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  decimals: number;
  address: string;
  mint_authority: string;
  freeze_authority: string;
  current_supply: number;
  extensions: any[];
}

interface PumpApiResponse {
  success: boolean;
  message: string;
  result: PumpTokenMetadata;
}

// In-memory cache for token metadata
const metadataCache: Record<string, PumpTokenMetadata> = {};

/**
 * Fetches token metadata from the Pump API
 * @param tokenId The token mint address
 * @returns Token metadata or null if not found
 */
export const fetchTokenMetadata = async (tokenId: string): Promise<PumpTokenMetadata | null> => {
  // Check cache first
  if (metadataCache[tokenId]) {
    return metadataCache[tokenId];
  }
  
  try {
    const url = `https://pumpapi.fun/api/get_metadata/${tokenId}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Error fetching token metadata: ${response.status}`);
      return null;
    }
    
    const data = await response.json() as PumpApiResponse;
    
    if (data.success && data.result) {
      // Cache the result
      metadataCache[tokenId] = data.result;
      return data.result;
    } else {
      console.error('API returned unsuccessful response', data);
      return null;
    }
  } catch (error) {
    console.error('Error fetching token metadata:', error);
    return null;
  }
};

/**
 * Gets a token image URL, with fallback
 * @param tokenId The token mint address
 * @returns The image URL or null
 */
export const getTokenImageUrl = async (tokenId: string): Promise<string | null> => {
  try {
    const metadata = await fetchTokenMetadata(tokenId);
    return metadata?.image || null;
  } catch (error) {
    console.error('Error getting token image:', error);
    return null;
  }
};
