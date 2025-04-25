
import React, { useEffect, useState, memo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchGMGNChartData } from '@/services/gmgnChartService';

interface PriceChartProps {
  tokenId?: string;
  data?: { time: string; price: number; }[];
  color?: string;
  isLoading?: boolean;
}

const MemoizedTooltip = memo(({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const formatTime = (timestamp: number) => {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    
    return (
      <div className="bg-[#0A1018] border border-[#1a2e44] p-3 rounded-lg">
        <p className="text-gray-400">{formatTime(label)}</p>
        <p className="text-[#00E6FD] font-semibold">
          ${Number(payload[0].value).toFixed(8)}
        </p>
      </div>
    );
  }
  return null;
});

MemoizedTooltip.displayName = 'MemoizedTooltip';

const PriceChart: React.FC<PriceChartProps> = ({ 
  tokenId,
  color = "url(#colorGradient)",
  isLoading = false 
}) => {
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (tokenId) {
        try {
          console.log('Fetching GMGN chart data for token:', tokenId);
          const gmgnData = await fetchGMGNChartData(tokenId);
          
          if (gmgnData && gmgnData.length > 0) {
            console.log('Received GMGN data points:', gmgnData.length);
            const formattedData = gmgnData.map(item => ({
              time: item.timestamp,
              price: item.close
            }));
            setChartData(formattedData);
          }
        } catch (error) {
          console.error('Error fetching GMGN chart data:', error);
          setChartData([]);
        }
      }
    };

    fetchData();
  }, [tokenId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-10 h-10 border-4 border-[#00E6FD] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-400">No chart data available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-64 md:h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
        >
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00E6FD" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#00E6FD" stopOpacity={0.2}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey="time"
            tickFormatter={(timestamp) => {
              const date = new Date(timestamp);
              return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }}
            stroke="rgba(255,255,255,0.5)"
            tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
          />
          <YAxis 
            tickFormatter={(value) => `$${parseFloat(value).toFixed(8)}`}
            stroke="rgba(255,255,255,0.5)"
            tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
            domain={['auto', 'auto']}
          />
          <Tooltip content={<MemoizedTooltip />} />
          <Line
            type="monotone"
            dataKey="price"
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 8, fill: "#00E6FD", strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default memo(PriceChart);
