
import React, { useState } from 'react';
import { GlobalParams, Client } from '../types';
import { Gear, Buildings, UsersThree, ArrowDown, ArrowUp, Warning } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div as any;
const MotionButton = motion.button as any;

interface SidebarProps {
  params: GlobalParams;
  setParams: React.Dispatch<React.SetStateAction<GlobalParams>>;
  clients: Client[];
  selectedClient: string;
  setSelectedClient: (id: string) => void;
  quoteRef: string;
  setQuoteRef: (val: string) => void;
  toggleModal: () => void;
  showClientWarning?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  params, setParams, clients, selectedClient, setSelectedClient, quoteRef, setQuoteRef, toggleModal, showClientWarning
}) => {
  const [openSection, setOpenSection] = useState<string>('basic');

  const updateParam = (key: keyof GlobalParams, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? '' : section);
  };

  const SectionHeader = ({ title, id, toggleProp }: { title: string, id: string, toggleProp?: keyof GlobalParams }) => (
    <div className="flex items-center justify-between w-full py-2">
      <div className="flex items-center gap-2">
         {toggleProp && (
           <input 
             type="checkbox" 
             checked={params[toggleProp] as boolean} 
             onChange={(e) => updateParam(toggleProp, e.target.checked)}
             className="checkbox-input"
             onClick={(e) => e.stopPropagation()} 
           />
         )}
         <button 
          onClick={() => toggleSection(id)}
          className={`text-xs font-bold uppercase tracking-wider transition-colors text-left ${toggleProp && !params[toggleProp] ? 'text-gray-600' : 'text-gray-400 hover:text-white'}`}
         >
           {title}
         </button>
      </div>
      <button onClick={() => toggleSection(id)} className="text-gray-400 hover:text-white">
        {openSection === id ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
      </button>
    </div>
  );

  return (
    <aside className="w-full lg:w-80 flex flex-col gap-4 shrink-0 h-full overflow-y-auto pb-10 pr-1 custom-scrollbar">
      {/* Client Info */}
      <MotionDiv className="glass-panel rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
          <Buildings className="text-brand text-xl" />
          <h3 className="font-semibold text-sm text-white uppercase tracking-wider">Client Info</h3>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1 flex items-center gap-1">
              Client
              {showClientWarning && !selectedClient && <Warning className="text-red-500" size={14} weight="bold" />}
            </label>
            <select 
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className={`w-full bg-dark-surface border rounded px-3 py-2 text-xs text-white outline-none transition-all ${
                showClientWarning && !selectedClient 
                ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' 
                : 'border-dark-border focus:border-brand'
              }`}
            >
              <option value="">Select Client...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {showClientWarning && !selectedClient && (
               <p className="text-[10px] text-red-400 mt-1 font-bold animate-pulse">Please select client</p>
            )}
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Reference No.</label>
            <input 
              type="text" 
              value={quoteRef}
              onChange={(e) => setQuoteRef(e.target.value)}
              className="w-full bg-dark-surface border border-dark-border rounded px-3 py-2 text-xs text-white font-mono uppercase focus:border-brand outline-none"
            />
          </div>
        </div>
      </MotionDiv>

      {/* Parameters Accordion */}
      <MotionDiv className="glass-panel rounded-xl p-4 space-y-1">
        <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
          <Gear className="text-brand text-xl" />
          <h3 className="font-semibold text-sm text-white uppercase tracking-wider">Parameters</h3>
        </div>

        {/* 1. Basic & Benefits */}
        <div className="border-b border-white/5 pb-2">
           <SectionHeader title="Basic & Benefits" id="basic" />
           <AnimatePresence>
             {openSection === 'basic' && (
               <MotionDiv 
                 initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                 className="overflow-hidden space-y-3 pt-2"
               >
                 <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase font-bold mb-1">Contract Duration (Years)</label>
                      <input 
                        type="number" step="0.1" min="0.1"
                        value={(params.duration / 12).toFixed(1)} 
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) updateParam('duration', val * 12);
                        }} 
                        className="input-field" 
                      />
                      <div className="text-[10px] text-gray-400 mt-1 truncate">
                        (Equiv. {params.duration.toFixed(1)} Months)
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase font-bold mb-1">Working Days</label>
                      <input type="number" min="1" value={params.workingDays} onChange={(e) => updateParam('workingDays', parseFloat(e.target.value))} className="input-field" />
                      <div className="text-[10px] text-transparent mt-1 select-none" aria-hidden="true">Spacer</div>
                    </div>
                 </div>

                 <div className="space-y-2">
                    {[
                      { label: 'Annual Leave', check: 'enableLeave', val: 'leaveDays' },
                      { label: 'Sick Leave', check: 'enableSick', val: 'sickDays' },
                      { label: 'Public Holidays', check: 'enableHoliday', val: 'holidayDays' },
                      { label: 'EOSB', check: 'enableEOSB', val: 'eosbDays' },
                    ].map((item: any) => (
                      <div key={item.val} className="flex items-center justify-between">
                        <label className="checkbox-label">
                          <input type="checkbox" checked={params[item.check as keyof GlobalParams] as boolean} onChange={(e) => updateParam(item.check, e.target.checked)} className="checkbox-input" />
                          {item.label}
                        </label>
                        <input type="number" disabled={!params[item.check as keyof GlobalParams]} value={params[item.val as keyof GlobalParams] as number} onChange={(e) => updateParam(item.val, parseFloat(e.target.value))} className="input-small" />
                      </div>
                    ))}
                    <div className="pt-1 flex items-center justify-between">
                        <label className="checkbox-label">
                          <input type="checkbox" checked={params.enableInsurance} onChange={(e) => updateParam('enableInsurance', e.target.checked)} className="checkbox-input" />
                          Insurance Rate %
                        </label>
                        <input type="number" disabled={!params.enableInsurance} value={params.insuranceRate} onChange={(e) => updateParam('insuranceRate', parseFloat(e.target.value))} className="input-small" placeholder="0.0" />
                    </div>
                 </div>
               </MotionDiv>
             )}
           </AnimatePresence>
        </div>

        {/* 2. Allowances */}
        <div className="border-b border-white/5 pb-2">
           <SectionHeader title="Monthly Allowances" id="allow" />
           <AnimatePresence>
             {openSection === 'allow' && (
                <MotionDiv initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-2 pt-2">
                  {[
                    { label: 'HRA / Accom.', check: 'enableHRA', val: 'valHRA' },
                    { label: 'Food Allow.', check: 'enableFood', val: 'valFood' },
                    { label: 'Transport', check: 'enableTrans', val: 'valTrans' },
                    { label: 'Others', check: 'enableOthers', val: 'valOthers' },
                  ].map((item: any) => (
                    <div key={item.val} className="flex items-center justify-between">
                      <label className="checkbox-label">
                        <input type="checkbox" checked={params[item.check as keyof GlobalParams] as boolean} onChange={(e) => updateParam(item.check, e.target.checked)} className="checkbox-input" />
                        {item.label}
                      </label>
                      <input type="number" disabled={!params[item.check as keyof GlobalParams]} value={params[item.val as keyof GlobalParams] as number} onChange={(e) => updateParam(item.val, parseFloat(e.target.value))} className="input-small" />
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-2">
                     <label className="checkbox-label">
                       <input type="checkbox" checked={params.enableMob} onChange={(e) => updateParam('enableMob', e.target.checked)} className="checkbox-input" />
                       Mob/Demob (One-Off)
                     </label>
                     <input type="number" disabled={!params.enableMob} value={params.valMob} onChange={(e) => updateParam('valMob', parseFloat(e.target.value))} className="input-small" />
                  </div>
                </MotionDiv>
             )}
           </AnimatePresence>
        </div>

        {/* 3. Company Overheads (Per Person) */}
        <div className="border-b border-white/5 pb-2">
           <SectionHeader title="Company Oveheads" id="comp" toggleProp="enableCompanyOverheads" />
           <AnimatePresence>
             {openSection === 'comp' && params.enableCompanyOverheads && (
                <MotionDiv initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden grid grid-cols-2 gap-2 pt-2">
                  {[
                     { l: 'Accomm.', k: 'co_accommodation' },
                     { l: 'Transport', k: 'co_transport' },
                     { l: 'Fuel', k: 'co_fuel' },
                     { l: 'Medical', k: 'co_medical' },
                     { l: 'Visa Cost', k: 'co_visa' },
                     { l: 'PPE', k: 'co_ppe' },
                     { l: 'Gate Pass', k: 'co_gatePass' },
                     { l: 'Air Ticket (Yr)', k: 'co_airTicket' },
                  ].map((item) => (
                    <div key={item.k}>
                      <label className="text-[9px] text-gray-500 uppercase font-bold block mb-1 truncate" title={item.l}>{item.l}</label>
                      <input type="number" value={params[item.k as keyof GlobalParams] as number} onChange={(e) => updateParam(item.k as keyof GlobalParams, parseFloat(e.target.value))} className="input-field" />
                    </div>
                  ))}
                </MotionDiv>
             )}
           </AnimatePresence>
        </div>

        {/* 4. Sub-Con (Global) */}
        <div className="border-b border-white/5 pb-2">
           <SectionHeader title="Sub-Con Alloc" id="subcon" toggleProp="enableSubCon" />
           <AnimatePresence>
             {openSection === 'subcon' && params.enableSubCon && (
                <MotionDiv initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden grid grid-cols-2 gap-2 pt-2">
                   <div>
                      <label className="text-[9px] text-gray-500 uppercase font-bold block mb-1">Manpower (Total/Mo)</label>
                      <input type="number" value={params.subcon_manpower} onChange={(e) => updateParam('subcon_manpower', parseFloat(e.target.value))} className="input-field" />
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-500 uppercase font-bold block mb-1">Equipment (Total/Mo)</label>
                      <input type="number" value={params.subcon_equip} onChange={(e) => updateParam('subcon_equip', parseFloat(e.target.value))} className="input-field" />
                    </div>
                </MotionDiv>
             )}
           </AnimatePresence>
        </div>

        {/* 5. Coordination & Financial */}
        <div>
           <SectionHeader title="Financial & Profit" id="fin" />
           <AnimatePresence>
             {openSection === 'fin' && (
                <MotionDiv initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-3 pt-2">
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 flex justify-between">
                         Coordination Cost %
                         <span className="text-brand">{params.coordinationRate}%</span>
                      </label>
                      <input type="range" min="0" max="50" step="0.5" value={params.coordinationRate} onChange={(e) => updateParam('coordinationRate', parseFloat(e.target.value))} className="w-full accent-brand" />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 flex justify-between">
                         Target Margin %
                         <span className="text-brand">{params.margin}%</span>
                      </label>
                      <input type="range" min="0" max="80" step="0.5" value={params.margin} onChange={(e) => updateParam('margin', parseFloat(e.target.value))} className="w-full accent-brand" />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 flex justify-between">
                         Bank Guarantee %
                         <span className="text-brand">{params.bankGuaranteeRate}%</span>
                      </label>
                      <input type="range" min="0" max="20" step="0.1" value={params.bankGuaranteeRate} onChange={(e) => updateParam('bankGuaranteeRate', parseFloat(e.target.value))} className="w-full accent-brand" />
                    </div>
                </MotionDiv>
             )}
           </AnimatePresence>
        </div>
      </MotionDiv>

      <style>{`
        .input-field {
          width: 100%;
          background-color: #121212;
          border: 1px solid #1F1F1F;
          border-radius: 6px;
          padding: 6px 8px;
          font-size: 11px;
          color: white;
          outline: none;
        }
        .input-field:focus { border-color: #FF6600; }
        .input-small {
          width: 60px;
          background-color: #121212;
          border: 1px solid #1F1F1F;
          border-radius: 4px;
          padding: 4px 6px;
          font-size: 11px;
          text-align: right;
          color: white;
          outline: none;
        }
        .input-small:disabled { opacity: 0.3; }
        .input-small:focus { border-color: #FF6600; }
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          color: #D1D5DB;
          cursor: pointer;
          user-select: none;
        }
        .checkbox-input {
          accent-color: #FF6600;
          background: #121212;
          cursor: pointer;
        }
      `}</style>

      <MotionButton
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        onClick={toggleModal}
        className="w-full bg-brand hover:bg-brand-light text-black font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-brand/20 flex items-center justify-center gap-2"
      >
        <UsersThree size={20} weight="bold" />
        Browse Position Directory
      </MotionButton>
    </aside>
  );
};

export default Sidebar;
