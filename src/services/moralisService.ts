
import { toast } from "sonner";

// Check for stored API key in localStorage
const getStoredMoralisApiKey = (): string => {
  return localStorage.getItem('moralis_api_key') || '';
};

/**
 * Fetch token metadata from Moralis API
 */
export const fetchTokenMetadataFromMoralis = async (tokenAddress: string): Promise<{
  image?: string;
  name?: string;
  symbol?: string;
} | null> => {
  try {
    // Get API key from localStorage
    const moralisApiKey = getStoredMoralisApiKey();
    
    // Check if API key exists
    if (!moralisApiKey) {
      console.error("Moralis API key not found");
      toast.error("Moralis API key is missing. Please set it in settings.");
      return null;
    }
    
    // Show loading toast
    const loadingToastId = toast.loading("Fetching token image...");
    
    // Format address correctly
    const formattedAddress = tokenAddress.trim();
    
    console.log(`Fetching token metadata from Moralis: ${formattedAddress}`);
    
    // Make the API request to Moralis
    const response = await fetch(`https://solana-gateway.moralis.io/token/mainnet/${formattedAddress}/metadata`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-API-Key': moralisApiKey
      },
    });
    
    // Clear loading toast
    toast.dismiss(loadingToastId);
    
    // Handle different response status codes
    if (!response.ok) {
      console.error(`Moralis API error: ${response.status} - ${response.statusText}`);
      toast.error("Failed to fetch token metadata");
      return null;
    }
    
    // Parse response
    const metadata = await response.json();
    
    // Check if URI exists
    if (!metadata.uri) {
      console.log("No metadata URI found");
      return null;
    }
    
    // Fetch off-chain metadata
    const metadataUri = metadata.uri.replace('ipfs://', 'https://ipfs.io/ipfs/');
    const metadataResponse = await fetch(metadataUri);
    
    if (!metadataResponse.ok) {
      console.error(`Failed to fetch off-chain metadata: ${metadataResponse.status}`);
      return null;
    }
    
    const fullMetadata = await metadataResponse.json();
    
    // Extract image URL and convert IPFS links
    let imageUrl = fullMetadata.image;
    if (imageUrl && imageUrl.startsWith('ipfs://')) {
      imageUrl = imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }
    
    console.log("Successfully fetched token image:", imageUrl);
    
    return {
      image: imageUrl,
      name: fullMetadata.name,
      symbol: fullMetadata.symbol
    };
  } catch (error) {
    console.error("Error fetching token metadata:", error);
    toast.error("Failed to fetch token image");
    return null;
  }
};

/**
 * Get cached image or fetch it
 */
export const getTokenImage = async (tokenAddress: string): Promise<string | null> => {
  try {
    // Try to get from cache first
    const cachedImage = localStorage.getItem(`token_image_${tokenAddress}`);
    if (cachedImage) {
      return cachedImage;
    }
    
    // If not in cache, fetch from Moralis
    const metadata = await fetchTokenMetadataFromMoralis(tokenAddress);
    if (metadata?.image) {
      // Cache the image URL
      localStorage.setItem(`token_image_${tokenAddress}`, metadata.image);
      return metadata.image;
    }
    
    return null;
  } catch (error) {
    console.error("Error getting token image:", error);
    return null;
  }
};

/**
 * Set Moralis API key
 */
export const setMoralisApiKey = (apiKey: string): void => {
  if (!apiKey) {
    toast.error("Please enter a valid API key");
    return;
  }
  
  localStorage.setItem('moralis_api_key', apiKey);
  toast.success("Moralis API key saved successfully");
};

/**
 * Check if Moralis API key is set
 */
export const hasMoralisApiKey = (): boolean => {
  const key = getStoredMoralisApiKey();
  return !!key;
};
