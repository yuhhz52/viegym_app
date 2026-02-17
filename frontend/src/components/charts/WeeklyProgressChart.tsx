import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface WeeklyProgressChartProps {
  data: { week: string; volume: number; workouts: number; duration: number }[];
}

export default function WeeklyProgressChart({ data }: WeeklyProgressChartProps) {
  // Normalize data to show all lines on same scale (0-100%)
  const normalizedData = data.map(item => {
    const maxVolume = Math.max(...data.map(d => d.volume), 1);
    const maxWorkouts = Math.max(...data.map(d => d.workouts), 1);
    const maxDuration = Math.max(...data.map(d => d.duration), 1);
    
    return {
      ...item,
      volumeNormalized: (item.volume / maxVolume) * 100,
      workoutsNormalized: (item.workouts / maxWorkouts) * 100,
      durationNormalized: (item.duration / maxDuration) * 100,
    };
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={normalizedData}
        margin={{ top: 10, right: 30, left: 20, bottom: 0 }}
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
          domain={[0, 100]}
          tickFormatter={(value) => `${value}%`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          }}
          formatter={(value: number, name: string, props: any) => {
            // Show actual values in tooltip
            if (name === 'Tổng Tạ') {
              return [`${props.payload.volume.toFixed(0)} kg`, name];
            } else if (name === 'Buổi Tập') {
              return [`${props.payload.workouts} buổi`, name];
            } else if (name === 'Thời Gian') {
              return [`${props.payload.duration.toFixed(0)} phút`, name];
            }
            return [value, name];
          }}
        />
        <Legend 
          wrapperStyle={{ paddingTop: '20px' }}
          formatter={(value) => {
            if (value === 'Tổng Tạ') return 'Tổng Tạ (kg)';
            if (value === 'Buổi Tập') return 'Buổi Tập';
            if (value === 'Thời Gian') return 'Thời Gian (phút)';
            return value;
          }}
        />
        <Line 
          type="monotone" 
          dataKey="volumeNormalized" 
          name="Tổng Tạ"
          stroke="#6366f1" 
          strokeWidth={3}
          dot={{ fill: '#6366f1', r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line 
          type="monotone" 
          dataKey="workoutsNormalized" 
          name="Buổi Tập"
          stroke="#10b981" 
          strokeWidth={3}
          dot={{ fill: '#10b981', r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line 
          type="monotone" 
          dataKey="durationNormalized" 
          name="Thời Gian"
          stroke="#a855f7" 
          strokeWidth={3}
          dot={{ fill: '#a855f7', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
