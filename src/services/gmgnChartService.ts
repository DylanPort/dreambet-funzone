
interface GMGNChartData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export const fetchGMGNChartData = async (tokenAddress: string): Promise<GMGNChartData[]> => {
  try {
    const corsProxyUrl = 'https://corsproxy.io/?';
    const apiUrl = `https://www.gmgn.cc/kline/sol/${tokenAddress}`;
    const encodedApiUrl = encodeURIComponent(apiUrl);
    
    console.log(`Fetching GMGN chart data from: ${apiUrl}`);
    
    const response = await fetch(`${corsProxyUrl}${encodedApiUrl}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch GMGN chart data: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.error('Invalid data format received:', data);
      return [];
    }
    
    console.log(`Received ${data.length} data points from GMGN`);
    
    return data.map((item: any[]) => ({
      timestamp: item[0],
      open: parseFloat(item[1]),
      high: parseFloat(item[2]),
      low: parseFloat(item[3]),
      close: parseFloat(item[4]),
      volume: parseFloat(item[5])
    }));
  } catch (error) {
    console.error('Error fetching GMGN chart data:', error);
    return [];
  }
};
