
import { supabase } from '@/integrations/supabase/client';

interface DexScreenerToken {
  name: string;
  symbol: string;
  address: string;
  chainId: string;
  priceUsd: number;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
  marketCap: number;
}

export async function fetchTrendingTokensFromApify(): Promise<DexScreenerToken[]> {
  try {
    // Get the API key from Supabase
    const { data: feature, error: configError } = await supabase
      .from('app_features')
      .select('config')
      .eq('feature_name', 'apify')
      .single();

    if (configError || !feature || !feature.config) {
      console.error('Error fetching Apify API key:', configError);
      return [];
    }

    const apiKey = (feature.config as { api_key: string }).api_key;
    if (!apiKey) {
      console.error('Apify API key not found in config');
      return [];
    }

    // Start the Apify task
    const startResponse = await fetch(
      'https://api.apify.com/v2/acts/crypto-scraper~dexscreener-tokens-scraper/runs',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          chain: 'solana',
          sortBy: 'volume',
          limit: 100,
        }),
      }
    );

    if (!startResponse.ok) {
      console.error('Error starting Apify task:', await startResponse.text());
      return [];
    }

    const runData = await startResponse.json();
    const runId = runData.data.id;

    // Poll for results every 2 seconds
    const maxAttempts = 30; // 1 minute max wait time
    let attempts = 0;

    while (attempts < maxAttempts) {
      const statusResponse = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        }
      );

      if (!statusResponse.ok) {
        console.error('Error checking run status:', await statusResponse.text());
        return [];
      }

      const status = await statusResponse.json();
      
      if (status.data.status === 'SUCCEEDED') {
        // Fetch the results
        const resultsResponse = await fetch(
          `https://api.apify.com/v2/actor-runs/${runId}/dataset/items`,
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
            },
          }
        );

        if (!resultsResponse.ok) {
          console.error('Error fetching results:', await resultsResponse.text());
          return [];
        }

        const tokens = await resultsResponse.json();
        return tokens.filter((token: any) => token.chainId === 'solana');
      }

      if (status.data.status === 'FAILED') {
        console.error('Apify run failed');
        return [];
      }

      // Wait 2 seconds before next check
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
    }

    console.error('Timeout waiting for Apify results');
    return [];
  } catch (error) {
    console.error('Error fetching trending tokens from Apify:', error);
    return [];
  }
}
