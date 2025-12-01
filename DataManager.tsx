
import React, { useState } from 'react';
import { Position, Client } from '../types';
import { X, Plus, Trash, Suitcase, Buildings, DownloadSimple, Database } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div as any;

interface DataManagerProps {
  isOpen: boolean;
  onClose: () => void;
  positions: Position[];
  clients: Client[];
  setPositions: React.Dispatch<React.SetStateAction<Position[]>>;
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  onSaveExcel: () => void;
}

const DataManager: React.FC<DataManagerProps> = ({
  isOpen, onClose, positions, clients, setPositions, setClients, onSaveExcel
}) => {
  const [activeTab, setActiveTab] = useState<'positions' | 'clients'>('positions');
  
  // Temporary state for new entries
  const [newPos, setNewPos] = useState<Partial<Position>>({ name: '', baseSalary: 0, specificToolCost: 0 });
  const [newClient, setNewClient] = useState<Partial<Client>>({ name: '', address: '', attn: '' });

  const handleAddPosition = () => {
    if (!newPos.name || !newPos.baseSalary) return;
    setPositions(prev => [...prev, { 
      id: crypto.randomUUID(), 
      name: newPos.name!, 
      baseSalary: newPos.baseSalary!, 
      specificToolCost: newPos.specificToolCost || null 
    }].sort((a,b) => a.name.localeCompare(b.name)));
    setNewPos({ name: '', baseSalary: 0, specificToolCost: 0 });
  };

  const handleDeletePosition = (id: string) => {
    if(confirm('Are you sure you want to delete this position?')) {
      setPositions(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleAddClient = () => {
    if (!newClient.name) return;
    setClients(prev => [...prev, {
      id: Date.now(),
      name: newClient.name!,
      address: newClient.address || '',
      attn: newClient.attn || ''
    }]);
    setNewClient({ name: '', address: '', attn: '' });
  };

  const handleDeleteClient = (id: number) => {
    if(confirm('Delete this client?')) {
      setClients(prev => prev.filter(c => c.id !== id));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <MotionDiv 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          <MotionDiv 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-dark-card w-full max-w-5xl h-[85vh] rounded-2xl border border-white/10 flex flex-col shadow-2xl relative z-10 overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-dark-surface">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Database className="text-brand" /> Master Data Manager
                </h2>
                <p className="text-xs text-gray-500">Add or remove items from your local database</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={onSaveExcel}
                  className="bg-emerald-900/30 hover:bg-emerald-800/50 text-emerald-400 border border-emerald-800/50 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition"
                >
                  <DownloadSimple size={16} weight="bold" />
                  Save & Export Excel
                </button>
                <div className="w-px h-6 bg-white/10 mx-2"></div>
                <button onClick={onClose} className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition">
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10 bg-dark-surface/50">
              <button 
                onClick={() => setActiveTab('positions')}
                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-all relative ${activeTab === 'positions' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <Suitcase size={18} /> Positions Library
                {activeTab === 'positions' && <MotionDiv layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand" />}
              </button>
              <button 
                onClick={() => setActiveTab('clients')}
                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-all relative ${activeTab === 'clients' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <Buildings size={18} /> Client Database
                {activeTab === 'clients' && <MotionDiv layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand" />}
              </button>
            </div>

            {/* Content */}
            <div className="flex-grow overflow-hidden flex flex-col bg-[#0a0a0a]">
              {activeTab === 'positions' ? (
                <div className="flex flex-col h-full">
                  {/* Add Form */}
                  <div className="p-4 border-b border-white/10 bg-white/5 grid grid-cols-12 gap-3 items-end">
                     <div className="col-span-5">
                       <label className="text-[10px] uppercase text-gray-500 font-bold mb-1 block">Position Title</label>
                       <input 
                         type="text" value={newPos.name} onChange={e => setNewPos({...newPos, name: e.target.value})}
                         placeholder="e.g. Senior Mechanical Engineer"
                         className="w-full bg-black border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-brand outline-none"
                       />
                     </div>
                     <div className="col-span-3">
                       <label className="text-[10px] uppercase text-gray-500 font-bold mb-1 block">Base Salary</label>
                       <input 
                         type="number" value={newPos.baseSalary || ''} onChange={e => setNewPos({...newPos, baseSalary: parseFloat(e.target.value)})}
                         placeholder="0.00"
                         className="w-full bg-black border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-brand outline-none"
                       />
                     </div>
                     <div className="col-span-3">
                       <label className="text-[10px] uppercase text-gray-500 font-bold mb-1 block">Tool Cost (Optional)</label>
                       <input 
                         type="number" value={newPos.specificToolCost || ''} onChange={e => setNewPos({...newPos, specificToolCost: parseFloat(e.target.value)})}
                         placeholder="0.00"
                         className="w-full bg-black border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-brand outline-none"
                       />
                     </div>
                     <div className="col-span-1">
                       <button onClick={handleAddPosition} className="w-full bg-brand hover:bg-brand-light text-black p-2 rounded flex items-center justify-center transition">
                         <Plus weight="bold" />
                       </button>
                     </div>
                  </div>
                  
                  {/* List */}
                  <div className="flex-grow overflow-y-auto custom-scrollbar p-2">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead className="text-xs text-gray-500 uppercase sticky top-0 bg-[#0a0a0a] z-10">
                        <tr>
                          <th className="p-3 border-b border-white/10">Position Title</th>
                          <th className="p-3 border-b border-white/10 text-right">Base Salary</th>
                          <th className="p-3 border-b border-white/10 text-right">Tool Cost</th>
                          <th className="p-3 border-b border-white/10 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {positions.map(p => (
                          <tr key={p.id} className="group hover:bg-white/5">
                            <td className="p-3 text-white">{p.name}</td>
                            <td className="p-3 text-right text-gray-400 font-mono">{p.baseSalary.toLocaleString()}</td>
                            <td className="p-3 text-right text-gray-400 font-mono">{p.specificToolCost ? p.specificToolCost.toLocaleString() : '-'}</td>
                            <td className="p-3 text-right">
                              <button onClick={() => handleDeletePosition(p.id)} className="text-gray-600 hover:text-red-500 transition">
                                <Trash size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                   {/* Add Client Form */}
                   <div className="p-4 border-b border-white/10 bg-white/5 grid grid-cols-12 gap-3 items-end">
                     <div className="col-span-4">
                       <label className="text-[10px] uppercase text-gray-500 font-bold mb-1 block">Client Name</label>
                       <input 
                         type="text" value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})}
                         className="w-full bg-black border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-brand outline-none"
                       />
                     </div>
                     <div className="col-span-4">
                       <label className="text-[10px] uppercase text-gray-500 font-bold mb-1 block">Address</label>
                       <input 
                         type="text" value={newClient.address} onChange={e => setNewClient({...newClient, address: e.target.value})}
                         className="w-full bg-black border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-brand outline-none"
                       />
                     </div>
                     <div className="col-span-3">
                       <label className="text-[10px] uppercase text-gray-500 font-bold mb-1 block">Attention</label>
                       <input 
                         type="text" value={newClient.attn} onChange={e => setNewClient({...newClient, attn: e.target.value})}
                         className="w-full bg-black border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-brand outline-none"
                       />
                     </div>
                     <div className="col-span-1">
                       <button onClick={handleAddClient} className="w-full bg-brand hover:bg-brand-light text-black p-2 rounded flex items-center justify-center transition">
                         <Plus weight="bold" />
                       </button>
                     </div>
                  </div>

                  {/* Client List */}
                  <div className="flex-grow overflow-y-auto custom-scrollbar p-2">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead className="text-xs text-gray-500 uppercase sticky top-0 bg-[#0a0a0a] z-10">
                        <tr>
                          <th className="p-3 border-b border-white/10">Client Name</th>
                          <th className="p-3 border-b border-white/10">Address</th>
                          <th className="p-3 border-b border-white/10">Attention</th>
                          <th className="p-3 border-b border-white/10 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {clients.map(c => (
                          <tr key={c.id} className="group hover:bg-white/5">
                            <td className="p-3 text-white font-medium">{c.name}</td>
                            <td className="p-3 text-gray-400 truncate max-w-[200px]">{c.address}</td>
                            <td className="p-3 text-gray-400">{c.attn}</td>
                            <td className="p-3 text-right">
                              <button onClick={() => handleDeleteClient(c.id)} className="text-gray-600 hover:text-red-500 transition">
                                <Trash size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </MotionDiv>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DataManager;
