
import React from 'react';
import { CalculationResult, Currency, SelectedPosition } from '../types';
import { formatMoney } from '../utils/formatting';
import { Trash, ChartPieSlice, CloudArrowUp, Table, FileText, Warning } from '@phosphor-icons/react';
import { motion } from 'framer-motion';

const MotionTr = motion.tr as any;

interface MatrixTableProps {
  result: CalculationResult;
  positions: SelectedPosition[];
  currency: Currency;
  updateQty: (id: number, qty: number) => void;
  removePosition: (id: number) => void;
  toggleCharts: () => void;
  onExportExcel: () => void;
  onGenerateWord: () => void;
  onUpload: () => void;
  showClientWarning?: boolean;
}

const MatrixTable: React.FC<MatrixTableProps> = ({
  result, positions, currency, updateQty, removePosition, toggleCharts, onExportExcel, onGenerateWord, onUpload, showClientWarning
}) => {

  if (positions.length === 0) {
    return (
      <div className="flex-grow glass-panel rounded-xl flex flex-col items-center justify-center p-10 text-center border-2 border-dashed border-white/10 relative overflow-hidden group">
        <div className="absolute inset-0 bg-brand/5 animate-pulse"></div>
        <div className="bg-white/5 p-6 rounded-full mb-6 relative z-10 border border-white/10 group-hover:scale-110 transition-transform duration-500">
           <ChartPieSlice size={48} className="text-brand" />
        </div>
        <h3 className="text-xl font-bold text-white mb-3 font-mono tracking-tight">PROJECT MATRIX EMPTY</h3>
        <p className="text-gray-400 max-w-md text-sm font-mono mb-8 leading-relaxed">
          Select positions from the directory to start your quotation,<br/>or upload a new source data file to begin.
        </p>
        
        <button 
          onClick={onUpload}
          className="relative px-8 py-4 bg-brand hover:bg-brand-light text-black font-bold rounded-xl flex items-center gap-3 transition-all hover:scale-105 shadow-[0_0_20px_rgba(255,102,0,0.3)] hover:shadow-[0_0_30px_rgba(255,102,0,0.5)] z-20 group/btn overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
          <CloudArrowUp size={24} weight="bold" className="relative" />
          <span className="relative uppercase tracking-wider text-sm">Upload Source Data</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex-grow glass-panel rounded-xl flex flex-col overflow-hidden shadow-2xl border border-white/10">
      {/* Toolbar */}
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-dark-surface/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
           <div className="w-1 h-6 bg-brand rounded-full shadow-[0_0_10px_rgba(255,102,0,0.8)]"></div>
           <h3 className="font-bold text-white flex items-center gap-2 tracking-wide font-mono text-sm">
             COST_MATRIX
           </h3>
        </div>
        <div className="flex items-center gap-2">
          {showClientWarning && (
            <div className="flex items-center gap-1.5 text-red-500 mr-2 animate-pulse">
               <Warning size={18} weight="bold" />
               <span className="text-[10px] font-bold uppercase tracking-wider">Please select client</span>
            </div>
          )}
          <button 
            onClick={toggleCharts}
            className="bg-white/5 hover:bg-white/10 text-gray-300 p-2 rounded border border-white/10 transition-colors"
            title="Toggle Visuals"
          >
            <ChartPieSlice size={20} />
          </button>
          <button 
            onClick={onExportExcel}
            className="bg-emerald-900/20 hover:bg-emerald-900/40 text-emerald-400 border border-emerald-500/30 px-3 py-2 rounded transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]"
          >
            <Table size={18} weight="fill" /> Export P&L
          </button>
           <button 
            onClick={onGenerateWord}
            className="bg-blue-900/20 hover:bg-blue-900/40 text-blue-400 border border-blue-500/30 px-3 py-2 rounded transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider hover:shadow-[0_0_15px_rgba(59,130,246,0.2)]"
          >
            <FileText size={18} weight="fill" /> Proposal
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto flex-grow custom-scrollbar bg-[#050505]/80">
        <table className="w-full text-xs text-left border-collapse font-mono">
          <thead className="bg-dark-surface text-gray-500 uppercase font-semibold sticky top-0 z-20 shadow-lg backdrop-blur-sm">
            <tr>
              <th className="p-3 border-b border-white/10 min-w-[200px] sticky left-0 bg-[#0f0f0f] z-30 border-r border-white/10">Cost Component</th>
              {positions.map(p => (
                <th key={p.uniqueId} className="p-3 border-b border-white/10 min-w-[150px] text-right group hover:bg-white/5 transition-colors relative border-r border-white/5">
                   <div className="flex flex-col items-end gap-1">
                     <span className="text-brand font-bold truncate max-w-[140px]">{p.name}</span>
                     <button 
                       onClick={() => removePosition(p.uniqueId)}
                       className="text-[9px] text-red-500 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 uppercase tracking-wider"
                     >
                       <Trash size={10} /> X
                     </button>
                   </div>
                </th>
              ))}
              <th className="p-3 border-b border-white/10 min-w-[160px] text-right text-white bg-brand/10 border-l border-brand/20 shadow-[inset_0_0_20px_rgba(255,102,0,0.1)]">PROJECT TOTAL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-gray-400">
            {result.rows.map((row, rIdx) => (
              <MotionTr 
                key={row.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: rIdx * 0.01 }}
                className={`hover:bg-white/5 transition-colors ${row.isHighlight ? 'bg-white/5' : ''}`}
              >
                <td className={`p-3 border-b border-white/5 sticky left-0 bg-[#0a0a0a] z-10 border-r border-white/10 font-medium tracking-tight ${row.isBold ? 'text-white font-bold' : 'text-gray-500'}`}>
                  {row.label}
                </td>
                {row.values.map((val, vIdx) => (
                  <td key={`${row.id}-${vIdx}`} className={`p-2 border-b border-white/5 text-right border-r border-white/5 ${row.isHighlight ? 'text-brand font-bold' : ''} ${row.className || ''}`}>
                    {row.type === 'input' ? (
                      <input 
                        type="number" min="1"
                        value={val as number}
                        onChange={(e) => updateQty(positions[vIdx].uniqueId, parseFloat(e.target.value) || 0)}
                        className="w-16 bg-black border border-brand/30 rounded p-1 text-center text-brand text-xs focus:border-brand focus:shadow-[0_0_10px_rgba(255,102,0,0.3)] outline-none"
                      />
                    ) : row.type === 'money' ? (
                      <span className="tracking-tighter">{formatMoney(val as number, currency)}</span>
                    ) : (
                      val
                    )}
                  </td>
                ))}
                <td className={`p-3 border-b border-white/5 text-right font-bold text-white bg-brand/5 border-l border-brand/10 tracking-tighter ${row.className || ''}`}>
                   {row.type === 'money' && typeof row.total === 'number' ? formatMoney(row.total, currency) : row.total}
                </td>
              </MotionTr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MatrixTable;
