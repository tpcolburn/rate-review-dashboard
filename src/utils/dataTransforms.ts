import type { EfficiencyRow, AttainmentRow, ChartDataPoint, TimeScope, FilterOptions, TimeBreakdownDataPoint } from '../types/data';
import { getPeriodKey, periodSortKey, periodLabel } from './timeUtils';

interface AggBucket {
  targetHours: number;
  actualNPH: number;
  expectedNPH: number;
  goodProductionTime: number;
  unplannedStoppages: number;
  plannedStoppages: number;
  actProdQtyEff: number;
  actProdQtyAtt: number;
  appPlanProdQty: number;
  appAbsPlanActual: number;
  nomTimesTarget: number;
  nomTimesExpected: number;
  nomTimesActual: number;
}

export function buildChartData(
  efficiency: EfficiencyRow[],
  attainment: AttainmentRow[],
  timeScope: TimeScope
): ChartDataPoint[] {
  // Aggregate efficiency data by period
  const buckets = new Map<string, AggBucket>();

  for (const row of efficiency) {
    const period = getPeriodKey(row.yearWeek, timeScope);
    if (!period) continue;

    let bucket = buckets.get(period);
    if (!bucket) {
      bucket = {
        targetHours: 0,
        actualNPH: 0,
        expectedNPH: 0,
        goodProductionTime: 0,
        unplannedStoppages: 0,
        plannedStoppages: 0,
        actProdQtyEff: 0,
        actProdQtyAtt: 0,
        appPlanProdQty: 0,
        appAbsPlanActual: 0,
        nomTimesTarget: 0,
        nomTimesExpected: 0,
        nomTimesActual: 0,
      };
      buckets.set(period, bucket);
    }

    bucket.targetHours += row.targetHours;
    bucket.actualNPH += row.actualNPH;
    bucket.expectedNPH += row.expectedNPH;
    bucket.goodProductionTime += row.goodProductionTime;
    bucket.unplannedStoppages += row.unplannedStoppages;
    bucket.plannedStoppages += row.plannedStoppages;
    bucket.actProdQtyEff += row.actProdQty;
    bucket.nomTimesTarget += row.nominalSpeed * row.targetHours;
    bucket.nomTimesExpected += row.nominalSpeed * row.expectedNPH;
    bucket.nomTimesActual += row.nominalSpeed * row.actualNPH;
  }

  // Merge attainment data
  for (const row of attainment) {
    const period = getPeriodKey(row.yearWeek, timeScope);
    if (!period) continue;

    let bucket = buckets.get(period);
    if (!bucket) {
      bucket = {
        targetHours: 0,
        actualNPH: 0,
        expectedNPH: 0,
        goodProductionTime: 0,
        unplannedStoppages: 0,
        plannedStoppages: 0,
        actProdQtyEff: 0,
        actProdQtyAtt: 0,
        appPlanProdQty: 0,
        appAbsPlanActual: 0,
        nomTimesTarget: 0,
        nomTimesExpected: 0,
        nomTimesActual: 0,
      };
      buckets.set(period, bucket);
    }

    bucket.actProdQtyAtt += row.actProdQty;
    bucket.appPlanProdQty += row.appPlanProdQty;
    bucket.appAbsPlanActual += row.appAbsPlanActual;
  }

  // Convert to chart data points
  const points: ChartDataPoint[] = [];

  for (const [period, b] of buckets) {
    const expectedEff = b.expectedNPH > 0 ? (b.targetHours / b.expectedNPH) * 100 : null;
    const actualEff = b.actualNPH > 0 ? (b.targetHours / b.actualNPH) * 100 : null;

    const aiDenom = b.goodProductionTime + b.unplannedStoppages + b.plannedStoppages;
    const ai = aiDenom > 0 ? (b.goodProductionTime / aiDenom) * 100 : null;

    const ppa = b.appPlanProdQty > 0 ? (b.actProdQtyAtt / b.appPlanProdQty) * 100 : null;

    const app = b.appPlanProdQty > 0 ? (1 - b.appAbsPlanActual / b.appPlanProdQty) * 100 : null;

    const nominalRate = b.targetHours > 0 ? b.nomTimesTarget / b.targetHours : null;
    const planRate = b.expectedNPH > 0 ? b.nomTimesTarget / b.expectedNPH : null;
    const actualRate = b.actualNPH > 0 ? b.nomTimesTarget / b.actualNPH : null;

    const deviation =
      expectedEff !== null && actualEff !== null
        ? Math.round((actualEff - expectedEff) * 10) / 10
        : null;

    points.push({
      period: periodLabel(period),
      sortKey: periodSortKey(period),
      expectedEfficiency: expectedEff !== null ? Math.round(expectedEff * 10) / 10 : null,
      actualEfficiency: actualEff !== null ? Math.round(actualEff * 10) / 10 : null,
      ai: ai !== null ? Math.round(ai * 10) / 10 : null,
      ppa: ppa !== null ? Math.round(ppa * 10) / 10 : null,
      app: app !== null ? Math.round(app * 10) / 10 : null,
      nominalRate: nominalRate !== null ? Math.round(nominalRate) : null,
      planRate: planRate !== null ? Math.round(planRate) : null,
      actualRate: actualRate !== null ? Math.round(actualRate) : null,
      deviation,
      targetHours: Math.round(b.targetHours * 100) / 100,
      actualNPH: Math.round(b.actualNPH * 100) / 100,
      expectedNPH: Math.round(b.expectedNPH * 100) / 100,
      actProdQty: Math.round(b.actProdQtyEff),
      appPlanProdQty: Math.round(b.appPlanProdQty),
    });
  }

  // Sort by period
  points.sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  return points;
}

// Cross-filtering: each dimension's options come from rows filtered by all OTHER active selections
export function getFilteredOptions(
  rows: EfficiencyRow[],
  selectedPlants: string[],
  selectedResources: string[],
  selectedMaterialTypes: string[],
  selectedMaterials: string[]
): FilterOptions {
  const hasPlants = selectedPlants.length > 0;
  const hasResources = selectedResources.length > 0;
  const hasMaterialTypes = selectedMaterialTypes.length > 0;
  const hasMaterials = selectedMaterials.length > 0;

  // Plant options: filter by resource + materialType + material (NOT plant)
  const plantMap = new Map<string, string>();
  for (const r of rows) {
    if (hasResources && !selectedResources.includes(r.workCenterCode)) continue;
    if (hasMaterialTypes && (!r.materialType || !selectedMaterialTypes.includes(r.materialType))) continue;
    if (hasMaterials && (!r.materialDesc || !selectedMaterials.includes(r.materialDesc))) continue;
    if (r.plantCode && !plantMap.has(r.plantCode)) {
      plantMap.set(r.plantCode, r.plantName);
    }
  }

  // Resource options: filter by plant + materialType + material (NOT resource)
  const resourceMap = new Map<string, string>();
  for (const r of rows) {
    if (hasPlants && !selectedPlants.includes(r.plantCode)) continue;
    if (hasMaterialTypes && (!r.materialType || !selectedMaterialTypes.includes(r.materialType))) continue;
    if (hasMaterials && (!r.materialDesc || !selectedMaterials.includes(r.materialDesc))) continue;
    if (r.workCenterCode && !resourceMap.has(r.workCenterCode)) {
      resourceMap.set(r.workCenterCode, r.workCenterName);
    }
  }

  // Material Type options: filter by plant + resource + material (NOT materialType)
  const materialTypeSet = new Set<string>();
  for (const r of rows) {
    if (hasPlants && !selectedPlants.includes(r.plantCode)) continue;
    if (hasResources && !selectedResources.includes(r.workCenterCode)) continue;
    if (hasMaterials && (!r.materialDesc || !selectedMaterials.includes(r.materialDesc))) continue;
    if (r.materialType) materialTypeSet.add(r.materialType);
  }

  // Material options: filter by plant + resource + materialType (NOT material)
  const materialSet = new Set<string>();
  for (const r of rows) {
    if (hasPlants && !selectedPlants.includes(r.plantCode)) continue;
    if (hasResources && !selectedResources.includes(r.workCenterCode)) continue;
    if (hasMaterialTypes && (!r.materialType || !selectedMaterialTypes.includes(r.materialType))) continue;
    if (r.materialDesc) materialSet.add(r.materialDesc);
  }

  return {
    plants: Array.from(plantMap, ([code, name]) => ({ code, name })).sort((a, b) =>
      a.code.localeCompare(b.code)
    ),
    resources: Array.from(resourceMap, ([code, name]) => ({ code, name })).sort((a, b) =>
      a.name.localeCompare(b.name)
    ),
    materialTypes: Array.from(materialTypeSet).sort(),
    materials: Array.from(materialSet).sort(),
  };
}

// Build time breakdown data: GPT + Unplanned + Planned + Idle per period
export function buildTimeBreakdownData(
  efficiency: EfficiencyRow[],
  timeScope: TimeScope,
  hasMaterialFilter: boolean
): TimeBreakdownDataPoint[] {
  // Step 1: Aggregate to (resource, week) level — sum across materials per resource-week
  const resourceWeekKey = (wc: string, yw: string) => `${wc}||${yw}`;
  const resourceWeekMap = new Map<string, { gpt: number; ups: number; ps: number }>();

  for (const row of efficiency) {
    const key = resourceWeekKey(row.workCenterCode, row.yearWeek);
    let bucket = resourceWeekMap.get(key);
    if (!bucket) {
      bucket = { gpt: 0, ups: 0, ps: 0 };
      resourceWeekMap.set(key, bucket);
    }
    bucket.gpt += row.goodProductionTime;
    bucket.ups += row.unplannedStoppages;
    bucket.ps += row.plannedStoppages;
  }

  // Step 2: Aggregate resource-weeks into period buckets
  const periodBuckets = new Map<string, { gpt: number; ups: number; ps: number; resourceWeekCount: number }>();

  for (const [key, val] of resourceWeekMap) {
    const yearWeek = key.split('||')[1];
    const period = getPeriodKey(yearWeek, timeScope);
    if (!period) continue;

    let bucket = periodBuckets.get(period);
    if (!bucket) {
      bucket = { gpt: 0, ups: 0, ps: 0, resourceWeekCount: 0 };
      periodBuckets.set(period, bucket);
    }
    bucket.gpt += val.gpt;
    bucket.ups += val.ups;
    bucket.ps += val.ps;
    bucket.resourceWeekCount += 1;
  }

  // Step 3: Convert to TimeBreakdownDataPoint[]
  const points: TimeBreakdownDataPoint[] = [];

  for (const [period, b] of periodBuckets) {
    const totalAvailable = 168 * b.resourceWeekCount;
    const idle = hasMaterialFilter ? 0 : Math.max(0, totalAvailable - b.gpt - b.ups - b.ps);

    points.push({
      period: periodLabel(period),
      sortKey: periodSortKey(period),
      goodProductionTime: Math.round(b.gpt * 100) / 100,
      unplannedStoppages: Math.round(b.ups * 100) / 100,
      plannedStoppages: Math.round(b.ps * 100) / 100,
      idleTime: Math.round(idle * 100) / 100,
      totalAvailableHours: Math.round(totalAvailable * 100) / 100,
    });
  }

  points.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  return points;
}
