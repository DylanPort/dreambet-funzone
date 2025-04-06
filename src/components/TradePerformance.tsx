
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TradePerformanceProps {
  userId?: string;
}

const TradePerformance: React.FC<TradePerformanceProps> = ({ userId }) => {
  // Sample data - in a real app, this would come from the database
  const data = [
    { date: '2023-01', value: 10000 },
    { date: '2023-02', value: 12000 },
    { date: '2023-03', value: 11500 },
    { date: '2023-04', value: 14000 },
    { date: '2023-05', value: 16500 },
    { date: '2023-06', value: 18000 },
  ];

  return (
    <Card className="w-full bg-black/60 border-dream-accent1/30">
      <CardHeader>
        <CardTitle>Trading Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f1628",
                  borderColor: "#333",
                  color: "white",
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default TradePerformance;
