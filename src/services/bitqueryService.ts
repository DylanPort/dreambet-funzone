import { supabase } from "@/integrations/supabase/client";

// Define types for the Bitquery response
export interface BitqueryToken {
  token_mint: string;
  token_name: string;
  token_symbol: string;
  last_trade_price: number;
  current_market_cap: number;
  volume_24h: number;
  Trade: {
    Buy: {
      Price: number;
      PriceInUSD: number;
      Currency: {
        Name: string;
        Symbol: string;
        MintAddress: string;
        Decimals: number;
        Fungible: boolean;
        Uri: string;
      }
    }
  }
}

export interface BitqueryResponse {
  data: {
    Solana: {
      DEXTrades: BitqueryToken[]
    }
  }
}

// Query to get top tokens by market cap
const topTokensByMarketCapQuery = `
{
  Solana {
    DEXTrades(
      limitBy: { by: Trade_Buy_Currency_MintAddress, count: 1 }
      limit: { count: 10 }
      orderBy: { descending: Trade_Buy_Price }
      where: {
        Trade: {
          Dex: { ProtocolName: { is: "pump" } }
          Buy: {
            Currency: {
              MintAddress: { notIn: ["11111111111111111111111111111111"] }
            }
          }
          PriceAsymmetry: { le: 0.1 }
          Sell: { AmountInUSD: { gt: "10" } }
        }
        Transaction: { Result: { Success: true } }
        Block: { Time: { since: "2023-02-21T05:05:00Z" } }
      }
    ) {
      Trade {
        Buy {
          Price(maximum: Block_Time)
          PriceInUSD(maximum: Block_Time)
          Currency {
            Name
            Symbol
            MintAddress
            Decimals
            Fungible
            Uri
          }
        }
      }
    }
  }
}
`;

// Query to get all tokens that crossed 10k market cap
const tokensAbove10kMarketCapQuery = `
{
  Solana {
    DEXTrades(
      limitBy: {by: Trade_Buy_Currency_MintAddress, count: 1}
      limit: {count: 20}
      orderBy: {descending: Trade_Buy_Price}
      where: {
        Trade: {
          Dex: {ProtocolName: {is: "pump"}}, 
          Buy: {
            Currency: {MintAddress: {notIn: ["11111111111111111111111111111111"]}}, 
            PriceInUSD: {gt: 0.00001}
          }, 
          Sell: {AmountInUSD: {gt: "10"}}
        }, 
        Transaction: {Result: {Success: true}}, 
        Block: {Time: {since: "2023-02-21T05:05:00Z"}}
      }
    ) {
      Trade {
        Buy {
          Price(maximum: Block_Time)
          PriceInUSD(maximum: Block_Time)
          Currency {
            Name
            Symbol
            MintAddress
            Decimals
            Fungible
            Uri
          }
        }
      }
    }
  }
}
`;

// Query to get top tokens by trading volume
const topTokensByVolumeQuery = `
{
  Solana {
    DEXTrades(
      limitBy: {by: Trade_Buy_Currency_MintAddress, count: 1}
      limit: {count: 20}
      orderBy: {descending: Trade_Sell_Amount}
      where: {
        Trade: {
          Dex: {ProtocolName: {is: "pump"}}, 
          Buy: {
            Currency: {MintAddress: {notIn: ["11111111111111111111111111111111"]}}
          }, 
          PriceAsymmetry: {le: 0.1},
          Sell: {AmountInUSD: {gt: "10"}}
        }, 
        Transaction: {Result: {Success: true}}, 
        Block: {Time: {since: "2023-02-21T05:05:00Z"}}
      }
    ) {
      Trade {
        Buy {
          Price(maximum: Block_Time)
          PriceInUSD(maximum: Block_Time)
          Currency {
            Name
            Symbol
            MintAddress
            Decimals
            Fungible
            Uri
          }
        }
        Sell {
          Amount
          AmountInUSD
        }
      }
    }
  }
}
`;

// Query to get tokens above 15k market cap
const tokensAbove15kMarketCapQuery = `
{
  Solana {
    DEXTrades(
      limitBy: {by: Trade_Buy_Currency_MintAddress, count: 1}
      limit: {count: 20}
      orderBy: {descending: Trade_Buy_Price}
      where: {
        Trade: {
          Dex: {ProtocolName: {is: "pump"}}, 
          Buy: {
            Currency: {MintAddress: {notIn: ["11111111111111111111111111111111"]}}, 
            PriceInUSD: {gt: 0.000015}
          }, 
          Sell: {AmountInUSD: {gt: "10"}}
        }, 
        Transaction: {Result: {Success: true}}, 
        Block: {Time: {since: "2024-03-11T00:00:00Z"}}
      }
    ) {
      Trade {
        Buy {
          Price(maximum: Block_Time)
          PriceInUSD(maximum: Block_Time)
          Currency {
            Name
            Symbol
            MintAddress
            Decimals
            Fungible
            Uri
          }
        }
        Sell {
          Amount
          AmountInUSD
        }
      }
    }
  }
}
`;

// Function to fetch data from Bitquery
async function fetchBitqueryData(query: string): Promise<BitqueryResponse> {
  try {
    console.log("Calling bitquery edge function");
    
    const { data, error } = await supabase.functions.invoke("bitquery", {
      body: { query }
    });

    if (error) {
      console.error("Error calling bitquery function:", error);
      throw error;
    }

    return data as BitqueryResponse;
  } catch (error) {
    console.error("Error in fetchBitqueryData:", error);
    throw error;
  }
}

// Fetch top PumpFun tokens by market cap
export async function fetchTopTokensByMarketCap(): Promise<BitqueryToken[]> {
  try {
    const response = await fetchBitqueryData(topTokensByMarketCapQuery);
    return response.data.Solana.DEXTrades;
  } catch (error) {
    console.error("Error fetching top tokens by market cap:", error);
    return [];
  }
}

// Fetch tokens that crossed 10k market cap
export async function fetchTokensAbove10kMarketCap(): Promise<BitqueryToken[]> {
  try {
    const response = await fetchBitqueryData(tokensAbove10kMarketCapQuery);
    return response.data.Solana.DEXTrades;
  } catch (error) {
    console.error("Error fetching tokens above 10k market cap:", error);
    return [];
  }
}

// Fetch tokens that crossed 15k market cap
export async function fetchTokensAbove15kMarketCap(): Promise<BitqueryToken[]> {
  try {
    const response = await fetchBitqueryData(tokensAbove15kMarketCapQuery);
    return response.data.Solana.DEXTrades;
  } catch (error) {
    console.error("Error fetching tokens above 15k market cap:", error);
    return [];
  }
}

// Fetch top PumpFun tokens by trading volume
export async function fetchTopTokensByVolume(): Promise<BitqueryToken[]> {
  try {
    const response = await fetchBitqueryData(topTokensByVolumeQuery);
    return response.data.Solana.DEXTrades;
  } catch (error) {
    console.error("Error fetching top tokens by volume:", error);
    return [];
  }
}

// Fetch top tokens by volume from Supabase
export async function fetchTopTokensByVolumeFromSupabase() {
  try {
    console.log("Fetching top tokens by volume from Supabase");
    
    const { data, error } = await supabase
      .from('tokens')
      .select('*')
      .order('volume_24h', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error("Error fetching top tokens by volume from Supabase:", error);
      throw error;
    }
    
    console.log(`Fetched ${data?.length || 0} tokens from Supabase`);
    
    // Return empty array if no data to avoid null/undefined errors
    return data || [];
  } catch (error) {
    console.error("Error in fetchTopTokensByVolumeFromSupabase:", error);
    // Return empty array on error to avoid null/undefined errors
    return [];
  }
}

// Transform BitqueryToken to a format compatible with our TokenCard component
export function transformBitqueryTokenToCardData(token: BitqueryToken) {
  return {
    id: token.token_mint || token.Trade.Buy.Currency.MintAddress,
    name: token.token_name || token.Trade.Buy.Currency.Name || "Unknown Token",
    symbol: token.token_symbol || token.Trade.Buy.Currency.Symbol || "UNKNOWN",
    price: token.last_trade_price || token.Trade.Buy.Price,
    priceChange: 0,
    timeRemaining: 0,
    marketCap: token.current_market_cap,
    volume24h: token.volume_24h
  };
}

// Transform Supabase token data to TokenCard format
export function transformSupabaseTokenToCardData(token: any) {
  try {
    return {
      id: token.token_mint || token.token_name || "Unknown Token",
      name: token.token_name || "Unknown Token",
      symbol: token.token_symbol || "UNKNOWN",
      price: token.last_trade_price || 0,
      priceChange: 0,
      timeRemaining: 0,
      marketCap: token.current_market_cap || 0,
      liquidity: (token.current_market_cap || 0) * 0.1,
      volume24h: token.volume_24h || 0,
      age: token.last_updated_time 
        ? new Date(token.last_updated_time).toLocaleString() 
        : 'Recently updated'
    };
  } catch (error) {
    console.error("Error transforming Supabase token data:", error, token);
    return {
      id: token.token_mint || "unknown",
      name: "Error Token",
      symbol: "ERR",
      price: 0,
      priceChange: 0,
      timeRemaining: 0,
      marketCap: 0,
      liquidity: 0,
      volume24h: 0,
      age: 'Unknown'
    };
  }
}
