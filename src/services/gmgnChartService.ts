
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
    
    const response = await fetch(`${corsProxyUrl}${encodedApiUrl}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch GMGN chart data');
    }
    
    const data = await response.json();
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
