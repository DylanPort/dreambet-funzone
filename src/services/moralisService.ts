
import { toast } from 'sonner';

// Cache for storing metadata to reduce API calls
const metadataCache: Record<string, any> = {};
const imageCache: Record<string, string> = {};

// Using a default API key as placeholder - the user should provide their own
// This is meant to be replaced with an actual API key
const MORALIS_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjYxNGVlMjhmLWQ5M2MtNDczNi1iMGEyLWVkODc2N2JlMDlkYiIsIm9yZ0lkIjoiMzY5OTkwIiwidXNlcklkIjoiMzgwMTg5IiwidHlwZUlkIjoiMDJjYWJjY2ItNzgwMC00Y2E5LTljZjEtY2Y0NDc1OTRiYWU2IiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3MTYwNTMxMjEsImV4cCI6NDg3MTgxMzEyMX0.qGrJrF_lNIE8wGOMibOuylXWiOa-L8TbQGC1QS9-ZIM";

/**
 * Checks if there's a token metadata API key issue
 */
const isApiKeyIssue = (status: number): boolean => {
  return status === 401 || status === 403;
};

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
      // Check if it's an API key issue and handle it gracefully
      if (isApiKeyIssue(response.status)) {
        console.error(`Moralis API key error: ${response.status}. Please check your API key.`);
        return null;
      }
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
 * Try to construct a generic image URL for a token
 */
const getGenericTokenImageUrl = (tokenMint: string): string | null => {
  try {
    // Try Jupiter image service first
    return `https://token-icons.solflare.com/solana/${tokenMint}.png`;
  } catch (error) {
    return null;
  }
};

/**
 * Try to get token image from DexScreener
 */
const getDexScreenerTokenImage = async (tokenMint: string): Promise<string | null> => {
  try {
    // DexScreener API endpoint that includes token info with logos
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenMint}`);
    
    if (!response.ok) {
      console.error(`DexScreener API error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    // Check if we have valid data with pairs and token information
    if (data && data.pairs && data.pairs.length > 0) {
      const baseToken = data.pairs[0].baseToken;
      if (baseToken && baseToken.logoURI) {
        return baseToken.logoURI;
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching DexScreener image for ${tokenMint}:`, error);
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
    // First, try to get from DexScreener (newest addition)
    const dexScreenerImage = await getDexScreenerTokenImage(tokenMint);
    if (dexScreenerImage) {
      imageCache[tokenMint] = dexScreenerImage;
      return dexScreenerImage;
    }
    
    // Then, try to get the generic token image URL as a fallback
    const genericImageUrl = getGenericTokenImageUrl(tokenMint);
    
    // Then, try to get the token metadata which contains the URI to off-chain data
    const metadata = await fetchTokenMetadata(tokenMint);
    if (!metadata || !metadata.uri) {
      // If Moralis metadata fetch failed, return the generic URL as fallback
      if (genericImageUrl) {
        imageCache[tokenMint] = genericImageUrl;
        return genericImageUrl;
      }
      return null;
    }
    
    // Then, fetch the off-chain metadata to get the image URL
    const offChainData = await fetchOffChainMetadata(metadata.uri);
    if (!offChainData || !offChainData.image) {
      // If off-chain metadata fetch failed, return the generic URL as fallback
      if (genericImageUrl) {
        imageCache[tokenMint] = genericImageUrl;
        return genericImageUrl;
      }
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
    
    // Try generic image URL as a fallback
    const genericImageUrl = getGenericTokenImageUrl(tokenMint);
    if (genericImageUrl) {
      imageCache[tokenMint] = genericImageUrl;
      return genericImageUrl;
    }
    
    return null;
  }
};

/**
 * Fetches the token image and returns it, with error handling and fallbacks
 */
export const fetchTokenImage = async (tokenMint: string, tokenSymbol?: string) => {
  if (!tokenMint) return null;
  
  try {
    // First try to get from DexScreener (highest priority)
    const dexScreenerImage = await getDexScreenerTokenImage(tokenMint);
    if (dexScreenerImage) {
      try {
        const response = await fetch(dexScreenerImage, { method: 'HEAD' });
        if (response.ok) {
          return dexScreenerImage;
        }
      } catch (e) {
        console.error(`DexScreener image URL exists but is not accessible:`, e);
      }
    }
    
    // Then try Moralis (with fallbacks built into getTokenImageUrl)
    const imageUrl = await getTokenImageUrl(tokenMint);
    if (imageUrl) {
      // Verify the image is accessible by sending a HEAD request
      try {
        const response = await fetch(imageUrl, { method: 'HEAD' });
        if (response.ok) {
          return imageUrl;
        }
      } catch (e) {
        console.error(`Image URL ${imageUrl} exists but is not accessible:`, e);
      }
    }
    
    // Try token directories as a fallback
    const solscanImage = `https://public-api.solscan.io/token/logo/${tokenMint}`;
    try {
      const response = await fetch(solscanImage, { method: 'HEAD' });
      if (response.ok) {
        return solscanImage;
      }
    } catch (e) {
      console.error("Solscan image not accessible:", e);
    }
    
    // If we still don't have an image, try Solflare token icons
    const solflareImage = `https://token-icons.solflare.com/solana/${tokenMint}.png`;
    try {
      const response = await fetch(solflareImage, { method: 'HEAD' });
      if (response.ok) {
        return solflareImage;
      }
    } catch (e) {
      console.error("Solflare image not accessible:", e);
    }
    
    // If all else fails, return null and let the component use fallbacks
    return null;
  } catch (error) {
    console.error(`Error fetching token image for ${tokenMint}:`, error);
    return null;
  }
};
