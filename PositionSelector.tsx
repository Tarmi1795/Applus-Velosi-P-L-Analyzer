
import React, { useState, useMemo } from 'react';
import { Position } from '../types';
import { formatMoney, formatNumber } from '../utils/formatting';
import { X, FunnelSimple, Check, Warning } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div as any;

interface PositionSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  positions: Position[];
  onAdd: (positions: { position: Position, qty: number }[]) => void;
  existingIds: string[]; // List of position IDs already in the matrix
}

const PositionSelector: React.FC<PositionSelectorProps> = ({ isOpen, onClose, positions, onAdd, existingIds }) => {
  const [search, setSearch] = useState('');
  const [selections, setSelections] = useState<Record<string, number>>({});

  const filteredPositions = useMemo(() => {
    return positions.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  }, [positions, search]);

  const toggleSelection = (id: string, isExisting: boolean) => {
    // Optional: Prevent selecting existing, or just allow duplicates? 
    // Requirement: "should be marked (so to avoid duplications)"
    // We will allow it but visually mark it.
    setSelections(prev => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = 1;
      return next;
    });
  };

  const updateQty = (id: string, qty: number) => {
    if (qty < 1) return;
    setSelections(prev => ({ ...prev, [id]: qty }));
  };

  const handleAdd = () => {
    const toAdd = Object.entries(selections).map(([id, qty]) => {
      const pos = positions.find(p => p.id === id)!;
      return { position: pos, qty };
    });
    onAdd(toAdd);
    setSelections({});
    onClose();
  };

  const selectionCount = Object.keys(selections).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <MotionDiv 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <MotionDiv 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-dark-card w-full max-w-4xl h-[80vh] rounded-2xl border border-white/10 flex flex-col shadow-2xl relative z-10 overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-dark-surface">
              <div>
                <h2 className="text-xl font-bold text-white">Position Directory</h2>
                <p className="text-xs text-gray-500">Select positions to add to your quotation</p>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition">
                <X size={24} />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-white/10 bg-dark-surface/50">
              <div className="relative">
                <FunnelSimple className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Search by job title..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:border-brand outline-none"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-grow overflow-y-auto p-2 custom-scrollbar">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="text-xs text-gray-500 uppercase sticky top-0 bg-dark-card z-10">
                  <tr>
                    <th className="p-3 w-12 text-center">#</th>
                    <th className="p-3">Position Title</th>
                    <th className="p-3 text-right">Base Rate</th>
                    <th className="p-3 text-right">Tool Cost</th>
                    <th className="p-3 text-right">Status</th>
                    <th className="p-3 text-center w-24">Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredPositions.map(p => {
                    const isSelected = !!selections[p.id];
                    const isExisting = existingIds.includes(p.id);
                    
                    return (
                      <tr 
                        key={p.id} 
                        className={`transition-colors cursor-pointer ${isSelected ? 'bg-brand/10' : 'hover:bg-white/5'} ${isExisting ? 'opacity-70 bg-white/5' : ''}`}
                        onClick={() => toggleSelection(p.id, isExisting)}
                      >
                        <td className="p-3 text-center">
                          <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors mx-auto ${isSelected ? 'bg-brand border-brand' : 'border-gray-600'}`}>
                            {isSelected && <Check size={12} className="text-black font-bold" />}
                          </div>
                        </td>
                        <td className={`p-3 font-medium ${isSelected ? 'text-brand' : 'text-white'}`}>{p.name}</td>
                        <td className="p-3 text-right text-gray-400 font-mono">{formatNumber(p.baseSalary)}</td>
                        <td className="p-3 text-right text-gray-400 font-mono">
                          {p.specificToolCost ? formatNumber(p.specificToolCost) : '-'}
                        </td>
                        <td className="p-3 text-right">
                           {isExisting && (
                             <span className="inline-flex items-center gap-1 text-[10px] text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
                               <Warning /> Added
                             </span>
                           )}
                        </td>
                        <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                          {isSelected && (
                            <input 
                              type="number" min="1"
                              value={selections[p.id]}
                              onChange={e => updateQty(p.id, parseInt(e.target.value))}
                              className="w-12 bg-black/40 border border-brand/50 rounded p-1 text-center text-white text-xs outline-none"
                            />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredPositions.length === 0 && (
                    <tr><td colSpan={6} className="p-8 text-center text-gray-500">No positions found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 bg-dark-surface flex justify-between items-center">
              <span className="text-sm text-gray-400">
                {selectionCount} position{selectionCount !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-3">
                <button onClick={onClose} className="px-5 py-2.5 text-sm text-gray-300 hover:text-white rounded-lg hover:bg-white/5 transition">
                  Cancel
                </button>
                <button 
                  onClick={handleAdd}
                  disabled={selectionCount === 0}
                  className="bg-brand hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-2.5 px-6 rounded-lg text-sm transition shadow-lg shadow-brand/20"
                >
                  Add Selected
                </button>
              </div>
            </div>
          </MotionDiv>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PositionSelector;
