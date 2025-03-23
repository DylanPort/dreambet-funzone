
import { toast } from 'sonner';

// Store the API key securely
const MORALIS_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjkzMWQxZGM3LTkxODgtNGM0MC04ZTUwLTg4YTE0NmRhNTI3MyIsIm9yZ0lkIjoiMzE0NjEzIiwidXNlcklkIjoiMzIzNDg0IiwidHlwZSI6IlBST0pFQ1QiLCJ0eXBlSWQiOiIzODM1ODhkYi1jOWNkLTQ4YTYtODllYS1hYTRhMTIwMzMwNWUiLCJpYXQiOjE3MzY2OTQyNjMsImV4cCI6NDg5MjQ1NDI2M30.Gq57k_Xb-nJZwpnqocoKEKev_1chmdlSwmPoavO_1SY";

// Image cache to avoid redundant API calls
const imageCache: Record<string, string> = {};

/**
 * Fetches the token metadata from Moralis API
 * @param tokenMint The token mint address
 * @returns Promise with the token metadata
 */
export const fetchTokenMetadata = async (tokenMint: string): Promise<any> => {
  try {
    if (!tokenMint) return null;
    
    // Check cache first
    if (imageCache[tokenMint]) {
      return { imageUrl: imageCache[tokenMint] };
    }
    
    const response = await fetch(`https://solana-gateway.moralis.io/token/mainnet/${tokenMint}/metadata`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-API-Key': MORALIS_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.uri) {
      try {
        // Convert IPFS URI to a gateway URL if needed
        const metadataUrl = data.uri.replace('ipfs://', 'https://ipfs.io/ipfs/');
        const metadataResponse = await fetch(metadataUrl);
        const metadata = await metadataResponse.json();
        
        if (metadata.image) {
          const imageUrl = metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/');
          
          // Cache the image URL
          imageCache[tokenMint] = imageUrl;
          
          return {
            ...data,
            imageUrl
          };
        }
      } catch (error) {
        console.error('Error fetching off-chain metadata:', error);
      }
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching token metadata for ${tokenMint}:`, error);
    return null;
  }
};

/**
 * Gets a cached image URL or fetches it if not available
 * @param tokenMint The token mint address
 * @returns Promise with the image URL or null
 */
export const getTokenImageUrl = async (tokenMint: string): Promise<string | null> => {
  try {
    // Check cache first
    if (imageCache[tokenMint]) {
      return imageCache[tokenMint];
    }
    
    const metadata = await fetchTokenMetadata(tokenMint);
    return metadata?.imageUrl || null;
  } catch (error) {
    console.error(`Error getting token image for ${tokenMint}:`, error);
    return null;
  }
};

// Function to handle fallback images
export const getTokenFallbackImage = (tokenSymbol: string): string => {
  // Return a default image based on the first letter of the token symbol
  const firstLetter = tokenSymbol ? tokenSymbol.charAt(0).toUpperCase() : 'T';
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#1A535C', '#FF9F1C', 
    '#E71D36', '#2EC4B6', '#FDFFFC', '#011627', '#F71735'
  ];
  
  // Use the character code as a seed for consistent color selection
  const colorIndex = firstLetter.charCodeAt(0) % colors.length;
  
  // Create a data URL for a colored circle with the first letter
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="${colors[colorIndex]}" />
      <text x="50" y="50" font-size="40" text-anchor="middle" alignment-baseline="central" fill="white" font-family="Arial, sans-serif" font-weight="bold">${firstLetter}</text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};
