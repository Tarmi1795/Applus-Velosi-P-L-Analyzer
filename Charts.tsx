
import React from 'react';
import { CalculationResult, Currency } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatMoney } from '../utils/formatting';
import { UsersThree, ChartDonut, Coins } from '@phosphor-icons/react';

interface ChartsProps {
  result: CalculationResult;
  currency: Currency;
  headcount: number;
}

const Charts: React.FC<ChartsProps> = ({ result, currency, headcount }) => {
  
  // Ratios
  const costRatio = result.totalRevenue > 0 ? (result.totalCost / result.totalRevenue) * 100 : 0;
  // Overhead includes Company Overheads + Subcon + Coordination + Financials
  const totalOverhead = result.stats.companyOverheads + result.stats.subConAlloc + result.stats.coordination + result.stats.financials;
  const overheadRatio = result.totalRevenue > 0 ? (totalOverhead / result.totalRevenue) * 100 : 0;
  
  // Requirement 3: Change to Avg Profit per personnel
  const profitPerPerson = headcount > 0 ? result.grossProfit / headcount : 0;

  const ratioData = [
    { name: 'Cost', value: costRatio, color: '#ef4444' },
    { name: 'Margin', value: 100 - costRatio, color: '#10b981' },
  ];

  const overheadData = [
    { name: 'Overheads', value: overheadRatio, color: '#f59e0b' },
    { name: 'Direct/Profit', value: 100 - overheadRatio, color: '#333' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 animate-fade-in-up mt-4">
      
      {/* 1. Headcount Big Number */}
      <div className="glass-panel rounded-xl p-5 border border-white/10 flex flex-col justify-center items-center relative overflow-hidden group">
         <div className="absolute top-0 left-0 w-full h-1 bg-brand"></div>
         <UsersThree size={64} className="text-brand mb-2 opacity-80 group-hover:scale-110 transition-transform" />
         <h3 className="text-4xl font-bold text-white font-mono">{headcount}</h3>
         <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Total Manpower</p>
      </div>

      {/* 2. Avg Profit per Person (Changed from Revenue) */}
      <div className="glass-panel rounded-xl p-5 border border-white/10 flex flex-col justify-center items-center relative">
         <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
         <Coins size={48} className="text-emerald-500 mb-3 opacity-80" />
         <h3 className="text-2xl font-bold text-white font-mono">{formatMoney(profitPerPerson, currency)}</h3>
         <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Avg. Profit per Personnel</p>
      </div>

      {/* 3. Cost to Revenue Ratio */}
      <div className="glass-panel rounded-xl p-4 border border-white/10 flex flex-col items-center">
         <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2">Cost / Revenue Ratio</h4>
         <div className="h-24 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={ratioData} cx="50%" cy="50%" innerRadius={35} outerRadius={45} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                  {ratioData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
               <span className="text-sm font-bold text-white">{costRatio.toFixed(0)}%</span>
            </div>
         </div>
      </div>

      {/* 4. Overhead Ratio */}
      <div className="glass-panel rounded-xl p-4 border border-white/10 flex flex-col items-center">
         <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2">Overhead Impact Ratio</h4>
         <div className="h-24 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={overheadData} cx="50%" cy="50%" innerRadius={35} outerRadius={45} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                  {overheadData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
             <div className="absolute inset-0 flex items-center justify-center">
               <span className="text-sm font-bold text-white">{overheadRatio.toFixed(0)}%</span>
            </div>
         </div>
      </div>

    </div>
  );
};

export default Charts;
