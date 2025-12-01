
import { GlobalParams, SelectedPosition, CalculationResult, MatrixRow, DetailedBreakdownRow } from '../types';

export const calculatePL = (
  params: GlobalParams, 
  positions: SelectedPosition[]
): CalculationResult => {
  let totalRevenue = 0;
  let totalCost = 0;
  
  const stats = { 
    salary: 0, 
    allow: 0, 
    benefits: 0, 
    companyOverheads: 0,
    subConAlloc: 0,
    coordination: 0,
    financials: 0 // Bank Guarantee delta
  };
  
  const detailedBreakdown: DetailedBreakdownRow[] = [];
  
  // 1. Calculate Total Headcount for Global Allocation
  const totalHeadcount = positions.reduce((acc, p) => acc + p.qty, 0);
  
  // 2. Global Costs Allocation (Per Person Per Month)
  const totalMonthlySubCon = params.enableSubCon 
    ? (params.subcon_manpower + params.subcon_equip) 
    : 0;
  const subConAllocPerPerson = totalHeadcount > 0 ? totalMonthlySubCon / totalHeadcount : 0;

  // 3. Dynamic Billable Months Calculation
  // Logic: Duration - (Duration / 12 * (LeaveDays / WorkingDays))
  const workingDays = params.workingDays || 30; // Prevent div by zero
  const yearlyLeaveRatio = params.leaveDays / workingDays;
  const nonBillableMonths = (params.duration / 12) * yearlyLeaveRatio;
  const billableMonths = Math.max(1, params.duration - nonBillableMonths); // Ensure at least 1 month billable

  const posCalculations = positions.map(pos => {
    const dailyRate = pos.baseSalary / workingDays;
    
    // --- Benefits (Monthly equivalent) ---
    const leaveCost = params.enableLeave ? dailyRate * (params.leaveDays / 12) : 0;
    const sickCost = params.enableSick ? dailyRate * (params.sickDays / 12) : 0;
    const holidayCost = params.enableHoliday ? dailyRate * (params.holidayDays / 12) : 0;
    const eosbCost = params.enableEOSB ? dailyRate * (params.eosbDays / 12) : 0;
    const insCost = params.enableInsurance ? pos.baseSalary * (params.insuranceRate / 100) : 0;
    
    // --- Allowances (Monthly) ---
    const hra = params.enableHRA ? params.valHRA : 0;
    const food = params.enableFood ? params.valFood : 0;
    const trans = params.enableTrans ? params.valTrans : 0;
    const others = params.enableOthers ? params.valOthers : 0;
    
    const monthlyAllowances = hra + food + trans + others;
    const monthlyBenefits = leaveCost + sickCost + holidayCost + eosbCost + insCost;

    // --- Coordination Cost ---
    const coordBase = pos.baseSalary + monthlyAllowances + leaveCost;
    const coordCost = coordBase * (params.coordinationRate / 100);

    // --- Company Overheads (Per Person Monthly) ---
    // If disabled, these are 0
    let compOverheads = 0;
    if (params.enableCompanyOverheads) {
      const airTicketMonthly = params.co_airTicket / 12;
      compOverheads = 
        params.co_accommodation + 
        params.co_transport + 
        params.co_fuel + 
        params.co_medical + 
        params.co_visa + 
        params.co_ppe + 
        params.co_gatePass + 
        airTicketMonthly;
    }

    // --- One Offs (Total per person) ---
    const toolCostUnit = pos.specificToolCost || 0;
    const lineToolCostTotal = toolCostUnit * pos.qty; // Requirement: Tool Cost x Qty

    const mobCost = params.enableMob ? params.valMob : 0;
    const totalOneOffPerPerson = toolCostUnit + mobCost;

    // --- Total Costs (Duration) ---
    const totalBase = pos.baseSalary * params.duration;
    const totalAllow = monthlyAllowances * params.duration;
    const totalBenefits = monthlyBenefits * params.duration;
    const totalCoord = coordCost * params.duration;
    const totalCompOverheads = compOverheads * params.duration;
    const totalSubConAlloc = subConAllocPerPerson * params.duration;
    
    // Operational Cost (Pre-Margin)
    const costPerPerson = 
      totalBase + 
      totalAllow + 
      totalBenefits + 
      totalCoord + 
      totalCompOverheads + 
      totalSubConAlloc + 
      totalOneOffPerPerson;

    // --- Revenue Calculation ---
    // 1. Apply Margin: Rev = Cost / (1 - Margin%)
    const marginDecimal = params.margin / 100;
    const targetRevenue = marginDecimal >= 1 ? 0 : costPerPerson / (1 - marginDecimal);

    // 2. Apply Bank Guarantee (Gross Up): Final = Target / (1 - BG%)
    const bgDecimal = params.bankGuaranteeRate / 100;
    const finalRevenue = bgDecimal >= 1 ? 0 : targetRevenue / (1 - bgDecimal);
    
    // Bank Guarantee Cost (Implicit)
    const bgCost = finalRevenue - targetRevenue;

    // --- Unit Rate ---
    // Distributed over Billable Months only
    const unitBillableMonthly = finalRevenue / billableMonths;

    // --- Unit Cost ---
    // Requirement: Add Unit Monthly Cost on Cost Matrix Preview
    // (Total Cost including BG / Billable Months)
    const unitCostMonthly = (costPerPerson + bgCost) / billableMonths;

    const lineTotalBillable = finalRevenue * pos.qty;
    // Note: lineTotalCost should include bgCost for proper P&L alignment in matrix view
    const lineTotalCostWithBG = (costPerPerson + bgCost) * pos.qty;
    const lineProfit = lineTotalBillable - lineTotalCostWithBG;

    const lineTotalCostOperational = costPerPerson * pos.qty;

    // Detailed Row for Excel
    detailedBreakdown.push({
      position: pos.name,
      qty: pos.qty,
      duration: params.duration,
      workingDays: params.workingDays,
      baseSalary: totalBase,
      allowancesTotal: totalAllow,
      benefitsTotal: totalBenefits,
      companyOverheadsTotal: totalCompOverheads,
      subConAllocTotal: totalSubConAlloc,
      coordinationTotal: totalCoord,
      oneOffTotal: totalOneOffPerPerson,
      totalCost: costPerPerson + bgCost, // BG cost is effectively a cost of sale
      targetMargin: params.margin,
      bgRate: params.bankGuaranteeRate,
      unitRate: unitBillableMonthly,
      revenue: finalRevenue,
      profit: lineProfit
    });

    // Aggregate Stats
    totalRevenue += lineTotalBillable;
    totalCost += lineTotalCostOperational + (bgCost * pos.qty);
    
    stats.salary += (totalBase * pos.qty);
    stats.allow += (totalAllow * pos.qty);
    stats.benefits += (totalBenefits * pos.qty);
    stats.companyOverheads += (totalCompOverheads * pos.qty);
    stats.subConAlloc += (totalSubConAlloc * pos.qty);
    stats.coordination += (totalCoord * pos.qty);
    stats.financials += (bgCost * pos.qty) + (totalOneOffPerPerson * pos.qty); 

    return {
      monthlyAllowances,
      leaveCost, sickCost, holidayCost, eosbCost, insCost,
      coordCost, compOverheads, subConAllocPerPerson,
      mobCost, // Separated mob cost
      lineToolCostTotal, // Separated tool cost total
      totalOneOffPerPerson, 
      unitBillable: unitBillableMonthly, 
      unitCostMonthly,
      lineTotalBillable,
      lineTotalCostWithBG, lineProfit,
      isSpecificTool: !!pos.specificToolCost
    };
  });

  const grossProfit = totalRevenue - totalCost;
  const marginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  // Construct Rows for UI
  const rows: MatrixRow[] = [];

  // Helper to push rows safely
  const addRow = (id: string, label: string, type: 'money' | 'text' | 'input', accessor: (idx: number) => any, totalAccessor?: () => any, isHighlight = false) => {
    rows.push({
      id, label, type,
      values: positions.map((_, idx) => accessor(idx)),
      total: totalAccessor ? totalAccessor() : '',
      isHighlight
    });
  };

  addRow('qty', 'Quantity', 'input', (i) => positions[i].qty, () => positions.reduce((acc, p) => acc + p.qty, 0), true);
  addRow('duration', `Billable Mos. (of ${params.duration})`, 'text', () => `${billableMonths.toFixed(1)}`, () => '');
  addRow('base', 'Base Salary', 'money', (i) => positions[i].baseSalary, () => '');
  
  // Allowances
  const hasAllow = params.enableHRA || params.enableFood || params.enableTrans || params.enableOthers;
  if(hasAllow) {
    addRow('allow', 'Total Allowances', 'money', (i) => posCalculations[i].monthlyAllowances, () => '');
  }
  
  // Benefits
  addRow('benefits', 'Statutory Benefits', 'money', (i) => {
    const pc = posCalculations[i];
    return pc.leaveCost + pc.sickCost + pc.holidayCost + pc.eosbCost + pc.insCost;
  }, () => '');

  // Co Cost
  if(params.coordinationRate > 0) {
    addRow('coord', `Coordination (${params.coordinationRate}%)`, 'money', (i) => posCalculations[i].coordCost, () => '');
  }

  // Company Overheads - CHECK TOGGLE
  if (params.enableCompanyOverheads) {
    addRow('compOver', 'Company Overheads', 'money', (i) => posCalculations[i].compOverheads, () => '');
  }

  // Subcon - CHECK TOGGLE
  if(params.enableSubCon) {
    addRow('subcon', 'Sub-Con Alloc.', 'money', (i) => posCalculations[i].subConAllocPerPerson, () => '');
  }
  
  // Requirement 1: Separate Tool Cost Line (Qty x Tool Cost)
  const hasTools = positions.some(p => p.specificToolCost);
  if (hasTools) {
     addRow('tools', 'Tool Cost (Total)', 'money', (i) => posCalculations[i].lineToolCostTotal, () => posCalculations.reduce((acc, c) => acc + c.lineToolCostTotal, 0));
  }

  // Mobilization (Separate line now)
  addRow('mob', 'Mobilization (One-Off)', 'money', (i) => posCalculations[i].mobCost, () => '');
  
  // Summary Rows
  rows.push({
    id: 'unitBill', label: 'UNIT MONTHLY RATE', type: 'money',
    values: posCalculations.map(c => c.unitBillable), total: '', isBold: true, isHighlight: true
  });

  // Requirement 2: Add Unit Monthly Cost
  rows.push({
    id: 'unitCost', label: 'UNIT MONTHLY COST', type: 'money',
    values: posCalculations.map(c => c.unitCostMonthly), total: '', isBold: false, isHighlight: false, className: 'text-gray-400 italic'
  });
  
  rows.push({
    id: 'lineTotal', label: 'TOTAL CONTRACT VALUE', type: 'money',
    values: posCalculations.map(c => c.lineTotalBillable), total: totalRevenue, isBold: true, isHighlight: true
  });

  // NEW ROWS REQUESTED
  rows.push({
    id: 'totalCost', label: 'TOTAL CONTRACT COST', type: 'money',
    values: posCalculations.map(c => c.lineTotalCostWithBG), total: totalCost, isBold: true, isHighlight: false, className: 'text-red-400'
  });

  rows.push({
    id: 'grossProfit', label: 'GROSS PROFIT', type: 'money',
    values: posCalculations.map(c => c.lineProfit), total: grossProfit, isBold: true, isHighlight: false, className: 'text-emerald-400'
  });

  return {
    totalRevenue,
    totalCost,
    grossProfit,
    marginPercent,
    stats,
    rows,
    detailedBreakdown
  };
};
