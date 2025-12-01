
import React, { useState, useEffect, useMemo } from 'react';
import { Currency, GlobalParams, Position, SelectedPosition, Client, User } from './types';
import { calculatePL } from './utils/calculationService';
import { processWorkbook, downloadBlankTemplate, exportMasterData, exportDetailedExcel } from './utils/excelService';
import { getSession, logout } from './services/authService';
import { saveProject } from './services/dbService';
import Sidebar from './components/Sidebar';
import MatrixTable from './components/MatrixTable';
import StatsCards from './components/StatsCards';
import PositionSelector from './components/PositionSelector';
import DataManager from './components/DataManager';
import Login from './components/Login';
import Charts from './components/Charts';
import { CloudArrowUp, Database, FileText, DownloadSimple, SignOut } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';
import { formatMoney } from './utils/formatting';

const MotionDiv = motion.div as any;

const App: React.FC = () => {
  // --- Auth State ---
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // --- App State ---
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currency, setCurrency] = useState<Currency>(Currency.USD);
  
  // DB Data
  const [positionsDB, setPositionsDB] = useState<Position[]>([]);
  const [clientsDB, setClientsDB] = useState<Client[]>([]);
  
  // User State
  const [selectedClient, setSelectedClient] = useState('');
  const [quoteRef, setQuoteRef] = useState(`AV-QT-${new Date().getFullYear()}-001`);
  const [selectedPositions, setSelectedPositions] = useState<SelectedPosition[]>([]);
  const [showCharts, setShowCharts] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDataManagerOpen, setIsDataManagerOpen] = useState(false);
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);
  const [clientWarning, setClientWarning] = useState(false);

  // Parameters
  const [params, setParams] = useState<GlobalParams>({
    duration: 24, margin: 15, workingDays: 30,
    leaveDays: 30, sickDays: 14, holidayDays: 10, eosbDays: 21,
    enableLeave: true, enableSick: true, enableHoliday: true, enableEOSB: true, enableInsurance: true,
    insuranceRate: 1.5,
    enableHRA: false, valHRA: 0, enableFood: false, valFood: 0, enableTrans: false, valTrans: 0, enableOthers: false, valOthers: 0,
    enableMob: true, valMob: 2500,
    // New Params Defaults
    enableCompanyOverheads: true, // Default On
    co_accommodation: 0, co_transport: 0, co_fuel: 0, co_medical: 0, co_airTicket: 0, co_visa: 0, co_ppe: 0, co_gatePass: 0,
    coordinationRate: 5, bankGuaranteeRate: 1, 
    enableSubCon: true, // Default On
    subcon_manpower: 0, subcon_equip: 0
  });

  // --- Init ---
  useEffect(() => {
    // Check Auth
    const session = getSession();
    if (session) {
      setUser(session);
    }
    setIsAuthLoading(false);

    // Load Default Data on Mount (Attempt to load a sample)
    fetch('/mnt/data/Costing Template - sample 2.xlsx')
      .then(res => {
        if(!res.ok) throw new Error('No default file');
        return res.arrayBuffer();
      })
      .then(async (buffer) => {
        const data = await processWorkbook(buffer);
        setPositionsDB(data.positions);
        setClientsDB(data.clients);
        setParams(prev => ({...prev, ...data.params}));
        // Note: We don't auto-select from default sample usually, but if needed:
        // handleAutoSelection(data.initialSelections, data.positions);
      })
      .catch(() => {
        // Ignore error, start with empty
      });
  }, []);

  // --- Calculations ---
  const result = useMemo(() => {
    return calculatePL(params, selectedPositions);
  }, [params, selectedPositions]);

  // --- Handlers ---
  const handleAutoSelection = (selections: { positionId: string, qty: number }[], positions: Position[]) => {
      if(selections.length > 0) {
        const mapped = selections.map(s => {
           const pos = positions.find(p => p.id === s.positionId);
           if(!pos) return null;
           return { ...pos, qty: s.qty, uniqueId: Date.now() + Math.random() };
        }).filter(Boolean) as SelectedPosition[];
        
        setSelectedPositions(prev => [...prev, ...mapped]);
      }
  };

  const handleLogout = async () => {
    await logout();
    localStorage.removeItem('app_session');
    setUser(null);
  };

  const handleSaveProject = async () => {
    setIsSaving(true);
    await saveProject({
      name: quoteRef,
      client: selectedClient,
      ref: quoteRef,
      params,
      positions: selectedPositions
    });
    setIsSaving(false);
    alert('Project saved to database successfully!');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      if (evt.target?.result) {
        setIsLoading(true);
        const data = await processWorkbook(evt.target.result as ArrayBuffer);
        setPositionsDB(data.positions);
        setClientsDB(data.clients);
        setParams(prev => ({...prev, ...data.params}));
        // Auto add positions if Qty column exists
        handleAutoSelection(data.initialSelections, data.positions);
        setIsLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
    // Close menu after upload
    setIsTemplateMenuOpen(false);
  };

  const triggerFileUpload = () => {
    document.getElementById('hiddenFile')?.click();
  };

  const addPositions = (newPositions: { position: Position, qty: number }[]) => {
    const mapped = newPositions.map(p => ({
      ...p.position,
      qty: p.qty,
      uniqueId: Date.now() + Math.random()
    }));
    setSelectedPositions(prev => [...prev, ...mapped]);
  };

  const updateQty = (id: number, qty: number) => {
    setSelectedPositions(prev => prev.map(p => p.uniqueId === id ? { ...p, qty } : p));
  };

  const removePosition = (id: number) => {
    setSelectedPositions(prev => prev.filter(p => p.uniqueId !== id));
  };

  const validateClient = (): boolean => {
    if (!selectedClient) {
      setClientWarning(true);
      return false;
    }
    setClientWarning(false);
    return true;
  };

  const handleExportExcel = () => {
    // Soft validation: warn but don't block (as per user requirement "If no client is selected, do not block the action")
    if (!selectedClient) setClientWarning(true);
    
    const clientName = clientsDB.find(c => c.id.toString() === selectedClient)?.name || "Client";
    exportDetailedExcel(result, quoteRef, clientName, params.duration);
  };

  const handleGenerateWord = () => {
    // Soft validation
    if (!selectedClient) setClientWarning(true);

    const client = clientsDB.find(c => c.id.toString() === selectedClient);
    const clientName = client ? client.name : "[Client Name]";
    const clientAddr = client ? client.address : "";
    const clientAttn = client ? client.attn : "";
    
    // Find monthly unit rate row
    const unitRateRow = result.rows.find(r => r.id === 'unitBill');
    
    let oneOffsHTML = '';
    const hasOneOffs = selectedPositions.some(p => p.specificToolCost) || params.enableMob;

    const tableRows = unitRateRow?.values.map((val, idx) => {
        const pos = selectedPositions[idx];
        const monthlyRate = val as number;
        // Total Monthly Cost for this position (Unit Rate * Qty)
        const lineTotal = monthlyRate * pos.qty; 

        return `
          <tr style="border-bottom:1px solid #ddd;">
            <td style="padding:10px 10px; border-bottom: 1px solid #eee;">${pos.name}</td>
            <td style="padding:10px 10px; text-align:center; border-bottom: 1px solid #eee;">${pos.qty}</td>
            <td style="padding:10px 10px; text-align:right; border-bottom: 1px solid #eee;">${formatMoney(monthlyRate, currency)}</td>
            <td style="padding:10px 10px; text-align:right; border-bottom: 1px solid #eee;">${formatMoney(lineTotal, currency)}</td>
          </tr>
        `;
    }).join('');

    if (hasOneOffs) {
       const oneOffRows = selectedPositions.map(p => {
          const tool = p.specificToolCost || 0;
          const mob = params.enableMob ? params.valMob : 0;
          const totalOneOff = tool + mob;
          if (totalOneOff === 0) return '';
          return `
            <tr>
              <td style="padding:8px 10px; color:#555;">${p.name} (Mobilization & Tools)</td>
              <td style="padding:8px 10px; text-align:center;">${p.qty}</td>
              <td style="padding:8px 10px; text-align:right;">${formatMoney(totalOneOff, currency)}</td>
              <td style="padding:8px 10px; text-align:right;">${formatMoney(totalOneOff * p.qty, currency)}</td>
            </tr>
          `;
       }).join('');
       
       if (oneOffRows) {
           oneOffsHTML = `
            <div style="margin-top: 30px; page-break-inside: avoid;">
                <h4 style="border-bottom: 1px solid #ccc; padding-bottom: 5px; color:#333; margin-bottom: 10px;">Mobilization & One-Off Charges</h4>
                <table style="width:100%; border-collapse: collapse; font-size:10pt;">
                    <thead>
                        <tr style="background-color:#f5f5f5; color:#555;">
                            <th style="padding:8px; text-align:left;">Description</th>
                            <th style="padding:8px; text-align:center;">Qty</th>
                            <th style="padding:8px; text-align:right;">Unit Rate</th>
                            <th style="padding:8px; text-align:right;">Total Amount</th>
                        </tr>
                    </thead>
                    <tbody>${oneOffRows}</tbody>
                </table>
            </div>
           `;
       }
    }

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
      <head>
        <meta charset="utf-8">
        <title>Proposal ${quoteRef}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #222; }
          .container { max-width: 800px; margin: 0 auto; padding: 20px; }
          .header-table { width: 100%; border-bottom: 2px solid #FF6600; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 24pt; font-weight: bold; color: #FF6600; font-family: sans-serif; }
          .logo-sup { font-size: 12pt; }
          .company-info { text-align: right; font-size: 9pt; color: #666; line-height: 1.3; }
          .title { text-align: center; font-size: 18pt; font-weight: bold; margin-bottom: 40px; margin-top: 20px; letter-spacing: 1px; text-transform: uppercase; color: #000; }
          .meta-table { width: 100%; margin-bottom: 40px; border-collapse: collapse; }
          .meta-table td { padding: 8px 5px; vertical-align: top; width: 50%; }
          .pricing-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .pricing-table th { background-color: #333; color: white; padding: 12px 10px; text-align: left; font-size: 10pt; font-weight: 600; text-transform: uppercase; }
          .pricing-table td { font-size: 10pt; }
          .footer { margin-top: 80px; padding-top: 30px; display: flex; justify-content: space-between; page-break-inside: avoid; }
          .sig-line { border-bottom: 1px solid #333; margin-top: 60px; margin-bottom: 10px; width: 250px; }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <table class="header-table">
            <tr>
              <td width="50%" valign="bottom">
                <span class="logo">Applus<sup class="logo-sup">+</sup> VELOSI</span>
              </td>
              <td width="50%" align="right" valign="bottom" class="company-info">
                 Street 2, Building 14, Industrial Area<br/>
                 Doha, Qatar<br/>
                 T: +974 4444 1234
              </td>
            </tr>
          </table>

          <div class="title">COMMERCIAL PROPOSAL</div>
          
          <!-- Metadata -->
          <table class="meta-table">
            <tr>
              <td>
                <strong>Date:</strong> ${new Date().toLocaleDateString()}<br/>
                <strong>Reference No:</strong> ${quoteRef}<br/>
                <strong>Validity:</strong> 30 Days
              </td>
              <td>
                <strong>Client:</strong> ${clientName}<br/>
                <strong>Address:</strong> ${clientAddr}<br/>
                <strong>Attention:</strong> ${clientAttn}
              </td>
            </tr>
          </table>

          <h3 style="margin-bottom: 15px; color: #333; border-bottom: 1px solid #eee; padding-bottom: 5px;">Schedule of Rates</h3>
          
          <table class="pricing-table">
              <thead>
                  <tr>
                      <th>Position Title</th>
                      <th style="text-align:center;">Qty</th>
                      <th style="text-align:right;">Unit Monthly Rate</th>
                      <th style="text-align:right;">Total Monthly Cost</th>
                  </tr>
              </thead>
              <tbody>
                  ${tableRows}
              </tbody>
          </table>

          <div style="font-size: 9pt; color: #666; margin-top: 15px; font-style: italic;">
            * Rates are based on a contract duration of ${params.duration} months.
          </div>

          ${oneOffsHTML}

          <!-- Footer -->
          <div class="footer">
             <table style="width:100%;">
               <tr>
                 <td width="50%">
                    <strong>For and on behalf of:<br/>Applus Velosi</strong>
                    <div class="sig-line"></div>
                    Authorized Signature
                 </td>
                 <td width="50%">
                    <strong>Accepted by:<br/>${clientName}</strong>
                    <div class="sig-line"></div>
                    Authorized Signature
                 </td>
               </tr>
             </table>
          </div>
        </div>
      </body>
      </html>`;
      
    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Proposal_${quoteRef}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMasterExport = () => {
    exportMasterData(positionsDB, clientsDB, params);
  };
  
  const existingIds = useMemo(() => selectedPositions.map(p => p.id), [selectedPositions]);
  const totalHeadcount = useMemo(() => selectedPositions.reduce((acc, p) => acc + p.qty, 0), [selectedPositions]);

  if (isAuthLoading) return null;
  if (!user) return <Login onLogin={setUser} />;

  return (
    <div className="flex flex-col h-screen bg-dark-bg text-gray-100 font-sans overflow-hidden selection:bg-brand selection:text-black">
      {/* Components */}
      <PositionSelector 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        positions={positionsDB} 
        onAdd={addPositions} 
        existingIds={existingIds}
      />

      <DataManager
        isOpen={isDataManagerOpen}
        onClose={() => setIsDataManagerOpen(false)}
        positions={positionsDB}
        clients={clientsDB}
        setPositions={setPositionsDB}
        setClients={setClientsDB}
        onSaveExcel={handleMasterExport}
      />

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
           <MotionDiv 
             initial={{ opacity: 1 }} 
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center p-4"
           >
              <div className="text-brand mb-4 animate-bounce">
                <FileText size={64} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Processing Data</h2>
              <p className="text-gray-500 text-sm">Importing your template...</p>
           </MotionDiv>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="h-16 border-b border-white/10 bg-dark-card/60 backdrop-blur-xl shrink-0 z-40 relative shadow-sm">
        <div className="max-w-[1920px] mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-1 select-none">
                <span className="text-2xl font-bold text-brand tracking-tighter">Applus<sup className="text-xs align-top border border-brand rounded-full px-[1px] ml-0.5 text-brand font-bold">+</sup></span>
                <span className="text-2xl font-light text-white tracking-widest uppercase ml-1">VELOSI</span>
            </div>
            {/* App Title */}
            <div className="hidden md:block h-8 w-px bg-white/10 mx-2"></div>
            <div className="hidden md:flex flex-col justify-center">
                <span className="text-xs font-bold text-white tracking-widest font-mono">QUOTATION GENERATOR</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">WITH P&L</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Currency Toggle */}
            <div className="flex bg-dark-surface border border-white/10 rounded-lg p-0.5">
              {Object.values(Currency).map(c => (
                <button 
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`px-3 py-1 text-xs font-medium rounded transition-all ${currency === c ? 'bg-brand text-black shadow' : 'text-gray-400 hover:text-white'}`}
                >
                  {c}
                </button>
              ))}
            </div>
            
            <div className="w-px h-6 bg-white/10 mx-1"></div>
            
             {/* Save to DB */}
            <button 
              onClick={handleSaveProject}
              disabled={isSaving}
              className="flex items-center gap-2 bg-blue-900/30 hover:bg-blue-800/50 text-blue-400 hover:text-white px-3 py-1.5 rounded-lg border border-blue-800/50 transition-all text-xs font-medium"
            >
              <CloudArrowUp size={16} />
              {isSaving ? 'Syncing...' : 'Save Project'}
            </button>

            {/* Master Data */}
            <button 
              onClick={() => setIsDataManagerOpen(true)}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 transition-all text-xs font-medium"
            >
              <Database size={16} className="text-brand" />
              Master DB
            </button>
            
            {/* Template Actions (Fixed Dropdown) */}
            <div className="relative">
               <button 
                 onClick={() => setIsTemplateMenuOpen(!isTemplateMenuOpen)}
                 className={`p-2 transition hover:bg-white/10 rounded-lg ${isTemplateMenuOpen ? 'bg-white/10 text-white' : 'text-gray-400'}`}
               >
                  <FileText size={20} />
               </button>
               
               {/* Click-away listener */}
               {isTemplateMenuOpen && (
                 <div className="fixed inset-0 z-40" onClick={() => setIsTemplateMenuOpen(false)}></div>
               )}

               <AnimatePresence>
                {isTemplateMenuOpen && (
                   <MotionDiv 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-dark-card border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                   >
                     <button 
                       onClick={() => { downloadBlankTemplate(); setIsTemplateMenuOpen(false); }} 
                       className="w-full text-left px-4 py-3 text-xs text-gray-300 hover:bg-white/5 hover:text-brand flex items-center gap-2"
                     >
                       <DownloadSimple size={16} /> Blank Template
                     </button>
                     <button 
                       onClick={() => { document.getElementById('hiddenFile')?.click(); }} 
                       className="w-full text-left px-4 py-3 text-xs text-gray-300 hover:bg-white/5 hover:text-brand flex items-center gap-2 border-t border-white/5"
                     >
                       <FileText size={16} /> Upload Data
                     </button>
                   </MotionDiv>
                 )}
               </AnimatePresence>
            </div>
            <input id="hiddenFile" type="file" className="hidden" accept=".xlsx" onChange={handleFileUpload} />

            <div className="w-px h-6 bg-white/10 mx-1"></div>

             {/* User Profile */}
             <div className="flex items-center gap-3 pl-2">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold text-white">{user.name}</span>
                  <span className="text-[10px] text-gray-500 uppercase">{user.role}</span>
                </div>
                <button onClick={handleLogout} className="text-gray-500 hover:text-red-500 transition">
                  <SignOut size={20} />
                </button>
             </div>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-grow flex flex-col lg:flex-row overflow-hidden max-w-[1920px] mx-auto w-full p-4 gap-4 relative z-10">
        
        <Sidebar 
          params={params}
          setParams={setParams}
          clients={clientsDB}
          selectedClient={selectedClient}
          setSelectedClient={(val) => { setSelectedClient(val); setClientWarning(false); }}
          quoteRef={quoteRef}
          setQuoteRef={setQuoteRef}
          toggleModal={() => setIsModalOpen(true)}
          showClientWarning={clientWarning}
        />

        <div className="flex-grow flex flex-col gap-4 min-w-0 h-full">
          {/* Stats */}
          <StatsCards 
            revenue={result.totalRevenue}
            cost={result.totalCost}
            profit={result.grossProfit}
            margin={result.marginPercent}
            currency={currency}
          />

          {/* Matrix */}
          <MatrixTable 
            result={result}
            positions={selectedPositions}
            currency={currency}
            updateQty={updateQty}
            removePosition={removePosition}
            toggleCharts={() => setShowCharts(!showCharts)}
            onExportExcel={handleExportExcel}
            onGenerateWord={handleGenerateWord}
            onUpload={triggerFileUpload}
            showClientWarning={clientWarning}
          />

          {/* Charts Collapse */}
          <AnimatePresence>
            {showCharts && (
              <MotionDiv 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden shrink-0"
              >
                <Charts result={result} currency={currency} headcount={totalHeadcount} />
              </MotionDiv>
            )}
          </AnimatePresence>
        </div>
      </main>
      
      {/* Credits Footer */}
      <footer className="h-6 border-t border-white/10 bg-[#020202] flex items-center justify-center shrink-0 z-40 select-none">
        <p className="text-[10px] text-gray-600 font-mono tracking-widest uppercase">
          &copy; 2025 Applus Velosi <span className="mx-2 text-gray-800">|</span> System Developed by <span className="text-brand font-bold hover:text-white transition-colors cursor-default">Gian Samonte</span>
        </p>
      </footer>
    </div>
  );
};

export default App;
