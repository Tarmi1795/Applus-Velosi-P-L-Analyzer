
import { read, utils, writeFile } from 'xlsx';
import { Position, Client, InsuranceType, GlobalParams, CalculationResult } from '../types';

export const processWorkbook = async (data: ArrayBuffer) => {
  const wb = read(data, { type: 'array' });
  const positions: Position[] = [];
  const clients: Client[] = [];
  const insurances: InsuranceType[] = [];
  const params: Partial<GlobalParams> = {};
  const mobCosts: any[] = [];
  
  // New: List of pre-selected positions found in the Excel (if Qty > 0)
  const initialSelections: { positionId: string, qty: number }[] = [];

  // 1. Parse Positions (Handle Blank Templates which might just have headers)
  const potentialSheets = ["Salary Ref (Base)", "Reference Salary (A)", "Salary Ref (Reliever)", "Positions"];
  potentialSheets.forEach(sheetName => {
    const ws = wb.Sheets[sheetName];
    if (!ws) return;
    
    const json = utils.sheet_to_json(ws, { header: 1 }) as any[][];
    
    // Find header row dynamically
    let hIdx = -1, nIdx = -1, sIdx = -1, tIdx = -1, qIdx = -1;
    
    for(let i=0; i<Math.min(20, json.length); i++) {
      const row = json[i].map(c => String(c).toLowerCase());
      if (row.some(c => c.includes('position') || c.includes('title'))) {
        hIdx = i;
        nIdx = row.findIndex(c => c.includes('position') || c.includes('title'));
        sIdx = row.findIndex(c => c.includes('basic') || c.includes('salary') || c.includes('rate'));
        tIdx = row.findIndex(c => c.includes('tools') || c.includes('ppe'));
        qIdx = row.findIndex(c => c.includes('qty') || c.includes('quantity'));
        break;
      }
    }

    if(hIdx > -1 && nIdx > -1 && sIdx > -1) {
      for(let i = hIdx + 1; i < json.length; i++) {
        const r = json[i];
        if(r[nIdx]) {
          const name = String(r[nIdx]).trim();
          const baseSalary = typeof r[sIdx] === 'number' ? r[sIdx] : parseFloat(r[sIdx]) || 0;
          const specificToolCost = tIdx > -1 ? (typeof r[tIdx] === 'number' ? r[tIdx] : parseFloat(r[tIdx]) || 0) : null;
          const qty = qIdx > -1 ? (typeof r[qIdx] === 'number' ? r[qIdx] : parseFloat(r[qIdx]) || 0) : 0;
          
          // Avoid duplicates
          let posId: string = crypto.randomUUID();
          const existing = positions.find(p => p.name === name);
          
          if (!existing) {
             positions.push({ 
              id: posId, 
              name, 
              baseSalary, 
              specificToolCost: specificToolCost || null 
            });
          } else {
            posId = existing.id;
          }

          // If Qty > 0, auto select
          if(qty > 0) {
            initialSelections.push({ positionId: posId, qty });
          }
        }
      }
    }
  });

  positions.sort((a,b) => a.name.localeCompare(b.name));

  // 2. Parse Clients
  const cSheet = wb.Sheets["Clients"];
  if (cSheet) {
    const cData = utils.sheet_to_json(cSheet) as any[];
    cData.forEach((r, i) => {
      clients.push({
        id: i,
        name: r["Client Name"] || "Unknown Client",
        address: r["Address"] || "",
        attn: r["Attention"] || ""
      });
    });
  }

  // 3. Parameters (Updated)
  const pSheet = wb.Sheets["Parameters"];
  if (pSheet) {
    const pData = utils.sheet_to_json(pSheet) as any[];
    pData.forEach(p => {
       const key = String(p["Parameter"]).toLowerCase();
       const val = parseFloat(p["Value"]) || 0;
       const enabled = String(p["Enabled"]).toLowerCase() === 'true' || p["Enabled"] === true;

       if(key.includes('leave') && !key.includes('sick')) { params.leaveDays = val; params.enableLeave = enabled; }
       if(key.includes('sick')) { params.sickDays = val; params.enableSick = enabled; }
       if(key.includes('holiday')) { params.holidayDays = val; params.enableHoliday = enabled; }
       if(key.includes('eosb')) { params.eosbDays = val; params.enableEOSB = enabled; }
       if(key.includes('margin')) params.margin = val;
       if(key.includes('working days')) params.workingDays = val;
       
       if(key.includes('insurance rate')) { params.insuranceRate = val; params.enableInsurance = enabled; }
       
       // Allowances
       if(key.includes('hra') || key.includes('accom') && !key.includes('company')) { params.valHRA = val; params.enableHRA = enabled; }
       if(key.includes('food')) { params.valFood = val; params.enableFood = enabled; }
       if(key.includes('transport') && !key.includes('fees')) { params.valTrans = val; params.enableTrans = enabled; }
       if(key.includes('others')) { params.valOthers = val; params.enableOthers = enabled; }
       
       // One Off
       if(key.includes('mob') || key.includes('demob')) { params.valMob = val; params.enableMob = enabled; }

       // Company Overheads
       // Note: enableCompanyOverheads isn't explicitly in old excel, default to true or infer
       if(key.includes('company_accommodation')) { params.co_accommodation = val; if(enabled) params.enableCompanyOverheads = true; }
       if(key.includes('transport_fees')) params.co_transport = val;
       if(key.includes('fuel')) params.co_fuel = val;
       if(key.includes('medical')) params.co_medical = val;
       if(key.includes('air_ticket')) params.co_airTicket = val;
       if(key.includes('visa')) params.co_visa = val;
       if(key.includes('ppe')) params.co_ppe = val;
       if(key.includes('gate_pass')) params.co_gatePass = val;
       
       // Financial
       if(key.includes('bank_guarantee')) params.bankGuaranteeRate = val;
       if(key.includes('coordination')) params.coordinationRate = val;

       // Subcon
       if(key.includes('third-party') || key.includes('subcon_manpower')) { params.subcon_manpower = val; if(enabled) params.enableSubCon = true; }
       if(key.includes('equipment') || key.includes('subcon_equip')) params.subcon_equip = val;
    });
  }

  return { positions, clients, insurances, params, mobCosts, initialSelections };
};

export const exportDetailedExcel = (
  result: CalculationResult,
  quoteRef: string,
  clientName: string,
  duration: number
) => {
  const wb = utils.book_new();

  const formatCurrency = (val: number) => val.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  const formatPercent = (val: number) => (val/100).toLocaleString('en-US', {style: 'percent', minimumFractionDigits: 1});

  const pnlData = [
    ["APPLUS VELOSI - PROJECT PROFIT & LOSS STATEMENT"],
    ["Reference:", quoteRef],
    ["Client:", clientName],
    ["Duration:", `${duration} Months`],
    ["Date:", new Date().toLocaleDateString()],
    [],
    ["DESCRIPTION", "AMOUNT", "% OF REV"],
    ["REVENUE", "", ""],
    ["Total Contract Value", result.totalRevenue, "100.0%"],
    [],
    ["DIRECT COSTS", "", ""],
    ["  Manpower Base Salaries", result.stats.salary, formatPercent((result.stats.salary/result.totalRevenue)*100)],
    ["  Monthly Allowances", result.stats.allow, formatPercent((result.stats.allow/result.totalRevenue)*100)],
    ["  Statutory Benefits", result.stats.benefits, formatPercent((result.stats.benefits/result.totalRevenue)*100)],
    ["  Company Overheads (Visa/Med/etc)", result.stats.companyOverheads, formatPercent((result.stats.companyOverheads/result.totalRevenue)*100)],
    ["  Coordination Costs", result.stats.coordination, formatPercent((result.stats.coordination/result.totalRevenue)*100)],
    ["  Sub-Contractor Allocations", result.stats.subConAlloc, formatPercent((result.stats.subConAlloc/result.totalRevenue)*100)],
    ["  One-Offs & Bank Guarantee Costs", result.stats.financials, formatPercent((result.stats.financials/result.totalRevenue)*100)],
    [],
    ["TOTAL PROJECT COST", result.totalCost, formatPercent((result.totalCost/result.totalRevenue)*100)],
    [],
    ["NET PROFIT", result.grossProfit, formatPercent(result.marginPercent)],
  ];

  const wsPnL = utils.aoa_to_sheet(pnlData);
  wsPnL['!cols'] = [{wch: 40}, {wch: 20}, {wch: 15}];
  utils.book_append_sheet(wb, wsPnL, "Project P&L Statement");


  // --- Sheet 2: Detailed Matrix ---
  const breakdownHeader = [
    "Position Title", "Qty", "Duration", "Working Days",
    "Base Salary", "Allowances", "Benefits", "Co. Overheads", "SubCon Alloc", "Coordination", "One-Offs",
    "Total Cost",
    "Target Margin %", "Bank Guarantee %", "Unit Monthly Rate", "Total Revenue", "Net Profit"
  ];

  const breakdownRows = result.detailedBreakdown.map(row => [
    row.position, row.qty, row.duration, row.workingDays,
    row.baseSalary, row.allowancesTotal, row.benefitsTotal, row.companyOverheadsTotal, row.subConAllocTotal, row.coordinationTotal, row.oneOffTotal,
    row.totalCost,
    row.targetMargin, row.bgRate,
    row.unitRate, row.revenue, row.profit
  ]);

  const totalRow = [
    "TOTALS", "", "", "",
    result.stats.salary, result.stats.allow, result.stats.benefits, result.stats.companyOverheads, result.stats.subConAlloc, result.stats.coordination, result.stats.financials,
    result.totalCost,
    "", "", "", result.totalRevenue, result.grossProfit
  ];

  const wsDetailed = utils.aoa_to_sheet([breakdownHeader, ...breakdownRows, [], totalRow]);
  wsDetailed['!cols'] = Array(17).fill({wch: 15});
  wsDetailed['!cols'][0] = {wch: 35}; 

  utils.book_append_sheet(wb, wsDetailed, "Detailed Matrix");
  writeFile(wb, `P&L_Analysis_${quoteRef}.xlsx`);
};

export const exportMasterData = (
  positions: Position[], 
  clients: Client[], 
  params: GlobalParams
) => {
    const wb = utils.book_new();

    // 1. Positions with Qty column
    const posData = [
        ["Position Title", "Basic Salary", "Tools Cost", "Qty"],
        ...positions.map(p => [p.name, p.baseSalary, p.specificToolCost || 0, 0])
    ];
    utils.book_append_sheet(wb, utils.aoa_to_sheet(posData), "Reference Salary (A)");

    // 2. Clients
    const clientData = [
        ["Client Name", "Address", "Attention"],
        ...clients.map(c => [c.name, c.address, c.attn])
    ];
    utils.book_append_sheet(wb, utils.aoa_to_sheet(clientData), "Clients");

    // 3. Parameters (Expanded)
    const paramData = [
        ["Parameter", "Value", "Enabled"],
        ["Duration", params.duration, true],
        ["Working Days", params.workingDays, true],
        ["Annual Leave Days", params.leaveDays, params.enableLeave],
        ["Sick Leave Days", params.sickDays, params.enableSick],
        ["Public Holidays", params.holidayDays, params.enableHoliday],
        ["EOSB Days", params.eosbDays, params.enableEOSB],
        ["Insurance Rate %", params.insuranceRate, params.enableInsurance],
        
        // Allowances
        ["HRA / Accom.", params.valHRA, params.enableHRA],
        ["Food Allow.", params.valFood, params.enableFood],
        ["Transport Allow.", params.valTrans, params.enableTrans],
        ["Others Allow.", params.valOthers, params.enableOthers],
        ["Mob/Demob Cost", params.valMob, params.enableMob],

        // Company Overheads
        ["company_accommodation", params.co_accommodation, params.enableCompanyOverheads],
        ["transport_fees", params.co_transport, params.enableCompanyOverheads],
        ["fuel_expense", params.co_fuel, params.enableCompanyOverheads],
        ["medical_insurance_per_month", params.co_medical, params.enableCompanyOverheads],
        ["air_ticket_per_annum", params.co_airTicket, params.enableCompanyOverheads],
        ["visa_cost", params.co_visa, params.enableCompanyOverheads],
        ["ppe", params.co_ppe, params.enableCompanyOverheads],
        ["gate_pass", params.co_gatePass, params.enableCompanyOverheads],
        
        // Financial & Subcon
        ["bank_guarantee_charges", params.bankGuaranteeRate, true],
        ["coordination_cost", params.coordinationRate, true],
        ["subcon_manpower", params.subcon_manpower, params.enableSubCon],
        ["subcon_equip", params.subcon_equip, params.enableSubCon],
        ["margin", params.margin, true]
    ];
    utils.book_append_sheet(wb, utils.aoa_to_sheet(paramData), "Parameters");

    writeFile(wb, "Applus_Master_Data_List.xlsx");
};

export const downloadBlankTemplate = () => {
    // Generate blank template using default/empty structures
    exportMasterData([], [], {
        duration: 24, margin: 15, workingDays: 30,
        leaveDays: 30, sickDays: 14, holidayDays: 10, eosbDays: 21,
        enableLeave: true, enableSick: true, enableHoliday: true, enableEOSB: true, enableInsurance: true, insuranceRate: 1.5,
        enableHRA: false, valHRA: 0, enableFood: false, valFood: 0, enableTrans: false, valTrans: 0, enableOthers: false, valOthers: 0,
        enableMob: true, valMob: 2500,
        enableCompanyOverheads: true, // Default
        co_accommodation: 0, co_transport: 0, co_fuel: 0, co_medical: 0, co_airTicket: 0, co_visa: 0, co_ppe: 0, co_gatePass: 0,
        coordinationRate: 0, bankGuaranteeRate: 0, 
        enableSubCon: true, // Default
        subcon_manpower: 0, subcon_equip: 0
    });
};
