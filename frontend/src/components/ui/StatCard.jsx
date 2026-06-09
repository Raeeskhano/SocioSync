import React from 'react';
import Card from './Card';

const StatCard = ({ title, value, change, icon: Icon, trend, hideTrend = false, highlight = false }) => (
  <Card 
    level="high" 
    className={`flex flex-col justify-between p-3.5 h-[160px] transition-all ${
      highlight 
        ? 'bg-gradient-to-br from-primary to-[#612b8f] border-none' 
        : ''
    }`}
  >
    <div className="flex justify-between items-start">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${highlight ? 'bg-white/20' : 'bg-surface-variant'}`}>
        {Icon && <Icon className={`w-4 h-4 ${highlight ? 'text-white' : 'text-primary'}`} />}
      </div>
      {!hideTrend && change && (
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${highlight ? 'bg-white/20 text-white' : 'bg-[#1c253d] text-primary'}`}>
          {change}
        </span>
      )}
    </div>
    <div className="flex flex-col">
      <h3 className={`text-[11px] font-medium mb-0.5 ${highlight ? 'text-white/70' : 'text-on-surface-variant'}`}>{title}</h3>
      <div className="flex items-baseline gap-1">
        <span className={`text-xl font-display font-bold tracking-tight ${highlight ? 'text-white' : 'text-on-surface'}`}>{value}</span>
        {hideTrend && change && <span className={`text-[10px] ml-0.5 ${highlight ? 'text-white/60' : 'text-on-surface-variant'}`}>{change}</span>}
      </div>
    </div>
  </Card>
);

export default StatCard;
