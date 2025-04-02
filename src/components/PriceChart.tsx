
import React, { useEffect, useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PriceChartProps {
  data?: {
    time: string;
    price: number;
  }[];
  color?: string;
  isLoading?: boolean;
  tokenMint?: string;
}

// Generate sample data if none is provided - memoized to prevent regeneration
const useSampleData = () => {
  return useMemo(() => {
    const data = [];
    let price = 1.0 + Math.random() * 0.5;
    
    for (let i = -30; i <= 0; i++) { // Reduced from 60 to 30 points for better performance
      // Create some random movement
      price = price + (Math.random() - 0.5) * 0.2;
      // Make sure price doesn't go below 0.1
      price = Math.max(0.1, price);
      
      const date = new Date();
      date.setMinutes(date.getMinutes() + i);
      
      data.push({
        time: date.toISOString(),
        price,
      });
    }
    
    return data;
  }, []);
};

const MemoizedTooltip = React.memo(({ active, payload, label }: any) => {
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

const PriceChart: React.FC<PriceChartProps> = React.memo(({ 
  data: propData, 
  color = "url(#colorGradient)", 
  isLoading = false,
  tokenMint 
}) => {
  const sampleData = useSampleData();
  const [data, setData] = useState(propData || sampleData);
  
  useEffect(() => {
    if (propData) {
      setData(propData);
    }
    
    // Here you could fetch price data using the tokenMint if provided
    if (tokenMint) {
      console.log(`Fetching price data for token: ${tokenMint}`);
      // Implement token price data fetching logic here
    }
  }, [propData, tokenMint]);
  
  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-10 h-10 border-4 border-dream-accent1 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  // Performance optimization: Only show a limited subset of points
  const optimizedData = data.length > 30 ? 
    data.filter((_, index) => index % Math.ceil(data.length / 30) === 0 || index === data.length - 1) : 
    data;
  
  return (
    <div className="w-full h-64 md:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={optimizedData}
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
            tickFormatter={formatTime} 
            stroke="rgba(255,255,255,0.5)"
            tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
            interval="preserveStartEnd"
            minTickGap={30}
          />
          <YAxis 
            tickFormatter={(value) => `$${parseFloat(value).toFixed(2)}`}
            stroke="rgba(255,255,255,0.5)"
            tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
            domain={['auto', 'auto']}
            width={50}
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
});

PriceChart.displayName = 'PriceChart';

export default PriceChart;
