import type { EfficiencyRow, AttainmentRow, ChartDataPoint, TimeScope } from '../types/data';
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
      };
      buckets.set(period, bucket);
    }

    bucket.actProdQtyAtt += row.actProdQty;
    bucket.appPlanProdQty += row.appPlanProdQty;
  }

  // Convert to chart data points
  const points: ChartDataPoint[] = [];

  for (const [period, b] of buckets) {
    const expectedEff = b.targetHours > 0 ? (b.expectedNPH / b.targetHours) * 100 : null;
    const actualEff = b.targetHours > 0 ? (b.actualNPH / b.targetHours) * 100 : null;

    const aiDenom = b.goodProductionTime + b.unplannedStoppages + b.plannedStoppages;
    const ai = aiDenom > 0 ? (b.goodProductionTime / aiDenom) * 100 : null;

    const ppa = b.appPlanProdQty > 0 ? (b.actProdQtyAtt / b.appPlanProdQty) * 100 : null;

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

// Get unique values for filter dropdowns
export function getUniquePlants(rows: EfficiencyRow[]): { code: string; name: string }[] {
  const map = new Map<string, string>();
  for (const r of rows) {
    if (r.plantCode && !map.has(r.plantCode)) {
      map.set(r.plantCode, r.plantName);
    }
  }
  return Array.from(map, ([code, name]) => ({ code, name })).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

export function getUniqueResources(
  rows: EfficiencyRow[],
  plantCode: string | null
): { code: string; name: string }[] {
  const map = new Map<string, string>();
  for (const r of rows) {
    if (plantCode && r.plantCode !== plantCode) continue;
    if (r.workCenterCode && !map.has(r.workCenterCode)) {
      map.set(r.workCenterCode, r.workCenterName);
    }
  }
  return Array.from(map, ([code, name]) => ({ code, name })).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

export function getUniqueMaterials(
  rows: EfficiencyRow[],
  plantCode: string | null,
  resourceCode: string | null
): string[] {
  const set = new Set<string>();
  for (const r of rows) {
    if (plantCode && r.plantCode !== plantCode) continue;
    if (resourceCode && r.workCenterCode !== resourceCode) continue;
    if (r.materialDesc) set.add(r.materialDesc);
  }
  return Array.from(set).sort();
}
