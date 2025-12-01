import React from 'react';
import { formatMoney } from '../utils/formatting';
import { Currency } from '../types';
import { motion } from 'framer-motion';
import { TrendUp, TrendDown, Coins, Wallet } from '@phosphor-icons/react';

const MotionDiv = motion.div as any;

interface StatsCardsProps {
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
  currency: Currency;
}

const Card = ({ title, value, subValue, colorClass, icon: Icon, delay }: any) => (
  <MotionDiv 
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay }}
    className="glass-panel p-4 rounded-xl relative overflow-hidden group"
  >
    <div className={`absolute top-0 left-0 w-1 h-full ${colorClass}`}></div>
    <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity transform rotate-12">
      <Icon size={80} />
    </div>
    <div className="relative z-10">
      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-white font-mono tracking-tight">{value}</h3>
      {subValue && <p className={`text-sm font-medium mt-1 ${colorClass.replace('bg-', 'text-')}`}>{subValue}</p>}
    </div>
  </MotionDiv>
);

const StatsCards: React.FC<StatsCardsProps> = ({ revenue, cost, profit, margin, currency }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card 
        title="Est. Contract Value"
        value={formatMoney(revenue, currency)}
        colorClass="bg-brand"
        icon={Wallet}
        delay={0}
      />
      <Card 
        title="Total Cost"
        value={formatMoney(cost, currency)}
        colorClass="bg-red-500"
        icon={TrendDown}
        delay={0.1}
      />
      <Card 
        title="Gross Profit"
        value={formatMoney(profit, currency)}
        colorClass="bg-emerald-500"
        icon={Coins}
        delay={0.2}
      />
      <Card 
        title="Margin"
        value={margin.toFixed(1) + '%'}
        subValue={margin > 15 ? 'Healthy' : 'Low Margin'}
        colorClass="bg-blue-500"
        icon={TrendUp}
        delay={0.3}
      />
    </div>
  );
};

export default StatsCards;