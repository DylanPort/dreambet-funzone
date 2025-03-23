
import { toast } from 'sonner';

// Cache for storing metadata to reduce API calls
const metadataCache: Record<string, any> = {};
const imageCache: Record<string, string> = {};

// Using a default API key as placeholder - the user should provide their own
// This is meant to be replaced with an actual API key
const MORALIS_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjYxNGVlMjhmLWQ5M2MtNDczNi1iMGEyLWVkODc2N2JlMDlkYiIsIm9yZ0lkIjoiMzY5OTkwIiwidXNlcklkIjoiMzgwMTg5IiwidHlwZUlkIjoiMDJjYWJjY2ItNzgwMC00Y2E5LTljZjEtY2Y0NDc1OTRiYWU2IiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3MTYwNTMxMjEsImV4cCI6NDg3MTgxMzEyMX0.qGrJrF_lNIE8wGOMibOuylXWiOa-L8TbQGC1QS9-ZIM";

/**
 * Fetches token metadata from Moralis API
 */
export const fetchTokenMetadata = async (tokenMint: string) => {
  if (!tokenMint) return null;
  
  // Check cache first
  if (metadataCache[tokenMint]) {
    return metadataCache[tokenMint];
  }
  
  try {
    const response = await fetch(`https://solana-gateway.moralis.io/token/mainnet/${tokenMint}/metadata`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'X-API-Key': MORALIS_API_KEY
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.status}`);
    }
    
    const metadata = await response.json();
    
    // Cache the result
    metadataCache[tokenMint] = metadata;
    
    return metadata;
  } catch (error) {
    console.error(`Error fetching token metadata for ${tokenMint}:`, error);
    return null;
  }
};

/**
 * Fetches off-chain metadata from IPFS
 */
export const fetchOffChainMetadata = async (uri: string) => {
  if (!uri) return null;
  
  try {
    // Convert IPFS URI to HTTP URL if needed
    const url = uri.startsWith('ipfs://') 
      ? `https://ipfs.io/ipfs/${uri.replace('ipfs://', '')}`
      : uri;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch off-chain metadata: ${response.status}`);
    }
    
    const metadata = await response.json();
    return metadata;
  } catch (error) {
    console.error(`Error fetching off-chain metadata from ${uri}:`, error);
    return null;
  }
};

/**
 * Gets a token image URL based on its mint address
 */
export const getTokenImageUrl = async (tokenMint: string) => {
  if (!tokenMint) return null;
  
  // Check image cache first
  if (imageCache[tokenMint]) {
    return imageCache[tokenMint];
  }
  
  try {
    // First, get the token metadata which contains the URI to off-chain data
    const metadata = await fetchTokenMetadata(tokenMint);
    if (!metadata || !metadata.uri) {
      return null;
    }
    
    // Then, fetch the off-chain metadata to get the image URL
    const offChainData = await fetchOffChainMetadata(metadata.uri);
    if (!offChainData || !offChainData.image) {
      return null;
    }
    
    // Convert IPFS image URL to HTTP URL if needed
    let imageUrl = offChainData.image;
    if (imageUrl.startsWith('ipfs://')) {
      imageUrl = `https://ipfs.io/ipfs/${imageUrl.replace('ipfs://', '')}`;
    }
    
    // Cache the image URL
    imageCache[tokenMint] = imageUrl;
    
    return imageUrl;
  } catch (error) {
    console.error(`Error getting token image URL for ${tokenMint}:`, error);
    return null;
  }
};

/**
 * Fetches the token image and returns it, with error handling and fallbacks
 */
export const fetchTokenImage = async (tokenMint: string, tokenSymbol?: string) => {
  if (!tokenMint) return null;
  
  try {
    const imageUrl = await getTokenImageUrl(tokenMint);
    if (imageUrl) {
      return imageUrl;
    }
    
    // If we couldn't get the image, return null and let the component use fallbacks
    return null;
  } catch (error) {
    console.error(`Error fetching token image for ${tokenMint}:`, error);
    return null;
  }
};
