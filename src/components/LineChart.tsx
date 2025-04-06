
import React from 'react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DataPoint {
  time: string;
  value: number;
}

interface LineChartProps {
  data: DataPoint[];
  height?: number;
}

const LineChart: React.FC<LineChartProps> = ({ data, height = 200 }) => {
  // No data
  if (!data || data.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-dream-foreground/5 rounded" 
        style={{ height: `${height}px` }}
      >
        <p className="text-dream-foreground/60 text-sm">No chart data available</p>
      </div>
    );
  }

  // Format tooltip value
  const formatValue = (value: number) => {
    if (value < 0.001) return value.toFixed(8);
    if (value < 1) return value.toFixed(6);
    if (value < 100) return value.toFixed(4);
    return value.toFixed(2);
  };

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dream-background/90 border border-dream-accent1/30 p-2 rounded shadow text-xs">
          <p className="font-medium">{label}</p>
          <p className="text-dream-accent1">${formatValue(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <RechartsLineChart
          data={data}
          margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey="time" 
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
            tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
            axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
          />
          <YAxis 
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
            tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
            axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
            tickFormatter={(value) => '$' + formatValue(value)}
            width={50}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#38bdf8" 
            strokeWidth={2}
            dot={false} 
            activeDot={{ r: 4, stroke: '#38bdf8', strokeWidth: 1, fill: '#38bdf8' }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineChart;
