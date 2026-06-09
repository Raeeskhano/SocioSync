import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#192540] border border-[#40485d] p-3 rounded-lg shadow-xl">
        <p className="text-[#dee5ff] text-xs font-bold mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {entry.value >= 1000 ? (entry.value / 1000).toFixed(1) + 'k' : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const EngagementVelocityChart = ({ data }) => {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const chartData = data?.map(item => ({
    ...item,
    formattedDate: formatDate(item.date)
  })) || [];

  return (
    <div className="w-full h-full min-h-0">
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7F77DD" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#7F77DD" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorActions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF97B2" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#FF97B2" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1c253d" />
            <XAxis 
              dataKey="formattedDate" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#a3aac4', fontSize: 10, fontWeight: 500 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#a3aac4', fontSize: 10 }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#40485d', strokeWidth: 1 }} />
            <Area 
              type="monotone" 
              dataKey="reach" 
              name="Reach"
              stroke="#7F77DD" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorReach)" 
            />
            <Area 
              type="monotone" 
              dataKey="actions" 
              name="Actions"
              stroke="#FF97B2" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorActions)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full text-on-surface-variant italic text-sm">
          No activity data for this period.
        </div>
      )}
    </div>
  );
};

export default EngagementVelocityChart;
