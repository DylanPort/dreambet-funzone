
import React, { useEffect, useState, memo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';
import { fetchGMGNChartData } from '@/services/gmgnChartService';

interface PriceChartProps {
  tokenId?: string;
  data?: {
    time: string;
    price: number;
  }[];
  color?: string;
  isLoading?: boolean;
}

interface PurchaseMarker {
  time: string;
  price: number;
  amount: number;
}

const MemoizedTooltip = memo(({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const formatTime = (timeStr: string) => {
      const date = new Date(timeStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    
    const formatPrice = (price: number) => {
      return `$${price.toFixed(4)}`;
    };
    
    return (
      <div className="glass-panel p-3">
        <p className="font-medium text-sm">{formatTime(label)}</p>
        <p className="text-dream-accent1 text-sm font-semibold">
          {formatPrice(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
});

MemoizedTooltip.displayName = 'MemoizedTooltip';

const generateSampleData = () => {
  const data = [];
  let price = 1.0 + Math.random() * 0.5;
  
  for (let i = -30; i <= 0; i++) {
    price = price + (Math.random() - 0.5) * 0.2;
    price = Math.max(0.1, price);
    
    const date = new Date();
    date.setMinutes(date.getMinutes() + i);
    
    data.push({
      time: date.toISOString(),
      price,
    });
  }
  
  return data;
};

const PriceChart: React.FC<PriceChartProps> = ({ 
  tokenId,
  data: propData, 
  color = "url(#colorGradient)", 
  isLoading = false 
}) => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [purchaseMarkers, setPurchaseMarkers] = useState<PurchaseMarker[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (tokenId) {
        try {
          console.log(`Fetching chart data for token: ${tokenId}`);
          const gmgnData = await fetchGMGNChartData(tokenId);
          
          if (gmgnData && gmgnData.length > 0) {
            const formattedData = gmgnData.map(item => ({
              time: new Date(item.timestamp).toISOString(),
              price: item.close
            }));
            setChartData(formattedData);
          } else {
            console.log('No data received from GMGN, falling back to sample data');
            setChartData(propData || generateSampleData());
          }
        } catch (error) {
          console.error('Error fetching GMGN chart data:', error);
          setChartData(propData || generateSampleData());
        }
      } else {
        setChartData(propData || generateSampleData());
      }
    };

    fetchData();
  }, [tokenId, propData]);

  useEffect(() => {
    if (tokenId) {
      try {
        const storageKey = `purchase_markers_${tokenId}`;
        const storedMarkers = localStorage.getItem(storageKey);
        
        if (storedMarkers) {
          setPurchaseMarkers(JSON.parse(storedMarkers));
        }
      } catch (error) {
        console.error("Error loading purchase markers from localStorage:", error);
      }
    }
  }, [tokenId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-10 h-10 border-4 border-dream-accent1 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-white">No chart data available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-64 md:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 10,
          }}
        >
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF3DFC" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#7B61FF" stopOpacity={0.2}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey="time" 
            tickFormatter={(timeStr) => {
              const date = new Date(timeStr);
              return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }}
            stroke="rgba(255,255,255,0.5)"
            tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
          />
          <YAxis 
            tickFormatter={(value) => `$${parseFloat(value).toFixed(2)}`}
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
            activeDot={{ r: 8, fill: "#FF3DFC", strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default memo(PriceChart);
