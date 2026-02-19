export interface EfficiencyRow {
  plantCode: string;
  plantName: string;
  workCenterCode: string;
  workCenterName: string;
  yearWeek: string; // "2025.02"
  materialType: string | null;
  materialDesc: string | null;
  targetHours: number;
  actualNPH: number;
  expectedNPH: number;
  nominalSpeed: number;
  goodProductionTime: number;
  unplannedStoppages: number;
  plannedStoppages: number;
  actProdQty: number;
}

export interface AttainmentRow {
  plantCode: string;
  plantName: string;
  workCenterCode: string | null;
  workCenterName: string | null;
  yearWeek: string;
  materialType: string | null;
  materialDesc: string | null;
  actProdQty: number;
  appPlanProdQty: number;
  appAbsPlanActual: number;
  msaPlanProdQty: number;
  msaAbsPlanActual: number;
}

export interface CapacityRow {
  plant: string;
  plantId: string;
  resName: string;
  ompTechnicalName: string | null;
  snapshotWeek: string | null;
  sapCalendarYearWeek: number | null;
  sumMaxCapacity: number;
  sumTotAvail: number;
  sumTotMaxLoad: number;
}

export interface ParsedData {
  efficiency: EfficiencyRow[];
  attainment: AttainmentRow[];
  capacity: CapacityRow[];
}

export interface ChartDataPoint {
  period: string;
  sortKey: string;
  expectedEfficiency: number | null;
  actualEfficiency: number | null;
  ai: number | null;
  ppa: number | null;
  app: number | null;
  nominalRate: number | null;
  planRate: number | null;
  actualRate: number | null;
  deviation: number | null;
  targetHours: number;
  actualNPH: number;
  expectedNPH: number;
  actProdQty: number;
  appPlanProdQty: number;
}

export interface TimeBreakdownDataPoint {
  period: string;
  sortKey: string;
  goodProductionTime: number;
  unplannedStoppages: number;
  plannedStoppages: number;
  idleTime: number;
  totalAvailableHours: number;
}

export interface FilterOptions {
  plants: { code: string; name: string }[];
  resources: { code: string; name: string }[];
  materialTypes: string[];
  materials: string[];
}

export type TimeScope = 'week' | 'month' | 'quarter';

export interface FilterState {
  selectedPlants: string[];
  selectedResources: string[];
  selectedMaterialTypes: string[];
  selectedMaterials: string[];
  timeScope: TimeScope;
  dateRange: [string, string]; // [start yearWeek, end yearWeek]
  visibleMetrics: {
    ai: boolean;
    ppa: boolean;
    app: boolean;
    rates: boolean;
  };
}
