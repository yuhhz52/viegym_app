import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface TopExercisesChartProps {
  data: { name: string; volume: number; frequency: number }[];
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export default function TopExercisesChart({ data }: TopExercisesChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          type="number"
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
        />
        <YAxis 
          type="category"
          dataKey="name"
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
          width={90}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          }}
          formatter={(value: number, name: string) => {
            if (name === 'volume') {
              return [`${value.toFixed(0)} kg`, 'Volume'];
            }
            return [value, name];
          }}
        />
        <Bar dataKey="volume" name="Volume (kg)" radius={[0, 8, 8, 0]}>
          {data.map((_entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
