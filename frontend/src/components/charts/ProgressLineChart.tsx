import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ProgressLineChartProps {
  data: { week: string; volume: number; workouts: number; duration: number }[];
  dataKey: 'volume' | 'workouts' | 'duration';
}

export default function ProgressLineChart({ data, dataKey }: ProgressLineChartProps) {
  const getLabel = () => {
    switch (dataKey) {
      case 'volume':
        return 'Volume (kg)';
      case 'workouts':
        return 'Buổi tập';
      case 'duration':
        return 'Thời gian (phút)';
    }
  };

  const getColor = () => {
    switch (dataKey) {
      case 'volume':
        return '#6366f1'; // indigo
      case 'workouts':
        return '#10b981'; // green
      case 'duration':
        return '#a855f7'; // purple
    }
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="week" 
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
        />
        <YAxis 
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey={dataKey}
          name={getLabel()}
          stroke={getColor()}
          strokeWidth={3}
          dot={{ fill: getColor(), r: 5 }}
          activeDot={{ r: 7 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
