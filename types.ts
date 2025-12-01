
export enum Currency {
  USD = 'USD',
  QAR = 'QAR',
  EUR = 'EUR'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  avatar?: string;
}

export interface SavedProject {
  id: string;
  name: string;
  lastModified: number;
  client: string;
  ref: string;
  params: GlobalParams;
  positions: SelectedPosition[];
}

export interface Position {
  id: string; // Unique ID for DB
  name: string;
  baseSalary: number;
  specificToolCost: number | null;
  defaultQty?: number; // For Excel import auto-selection
}

export interface Client {
  id: number;
  name: string;
  address: string;
  attn: string;
}

export interface InsuranceType {
  name: string;
  rate: number;
}

export interface SelectedPosition extends Position {
  uniqueId: number; // Unique ID for the UI list
  qty: number;
}

export interface GlobalParams {
  duration: number;
  margin: number;
  workingDays: number; // Replaces hardcoded 30
  
  // Benefits Days
  leaveDays: number;
  sickDays: number;
  holidayDays: number;
  eosbDays: number;
  
  // Flags
  enableLeave: boolean;
  enableSick: boolean;
  enableHoliday: boolean;
  enableEOSB: boolean;
  enableInsurance: boolean;
  
  // Values
  insuranceRate: number;
  
  // Allowances
  enableHRA: boolean; valHRA: number;
  enableFood: boolean; valFood: number;
  enableTrans: boolean; valTrans: number;
  enableOthers: boolean; valOthers: number; // NEW
  
  // One Off
  enableMob: boolean; valMob: number;

  // NEW: Company Overheads (Per Person Monthly)
  enableCompanyOverheads: boolean; // NEW Toggle
  co_accommodation: number;
  co_transport: number;
  co_fuel: number;
  co_medical: number;
  co_airTicket: number; // Annual, needs /12
  co_visa: number;
  co_ppe: number;
  co_gatePass: number;

  // NEW: Coordination & Financial
  coordinationRate: number; // Percentage
  bankGuaranteeRate: number; // Percentage

  // NEW: Sub-Con Costs (Global Monthly)
  enableSubCon: boolean; // NEW Toggle
  subcon_manpower: number;
  subcon_equip: number;
}

export interface CalculationResult {
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  marginPercent: number;
  stats: {
    salary: number;
    allow: number;
    benefits: number;
    companyOverheads: number;
    subConAlloc: number;
    coordination: number;
    financials: number; // BG difference
  };
  rows: MatrixRow[];
  detailedBreakdown: DetailedBreakdownRow[]; // For Excel Export
}

export interface DetailedBreakdownRow {
  position: string;
  qty: number;
  duration: number;
  workingDays: number;
  baseSalary: number;
  allowancesTotal: number;
  benefitsTotal: number;
  companyOverheadsTotal: number;
  subConAllocTotal: number;
  coordinationTotal: number;
  oneOffTotal: number;
  totalCost: number;
  targetMargin: number;
  bgRate: number;
  unitRate: number; // Billable Monthly
  revenue: number; // Total Contract Value
  profit: number;
}

export interface MatrixRow {
  id: string;
  label: string;
  type: 'input' | 'text' | 'money' | 'percent';
  values: (number | string)[]; // Matches index of selectedPositions
  total: number | string;
  isBold?: boolean;
  isHighlight?: boolean;
  isHeader?: boolean;
  className?: string;
}
