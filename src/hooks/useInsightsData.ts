import { useMemo } from 'react';
import type {
  ParsedData,
  CapacityRow,
  InsightsPlantRow,
  InsightsResourceRow,
  InsightsMaterialRow,
} from '../types/data';
import { useFilteredRows } from './useFilteredRows';

interface EffAgg {
  targetHours: number;
  actualNPH: number;
  expectedNPH: number;
  goodProductionTime: number;
  unplannedStoppages: number;
  plannedStoppages: number;
}

interface AttAgg {
  actProdQty: number;
  appPlanProdQty: number;
  appAbsPlanActual: number;
}

function computeMetrics(eff: EffAgg, att: AttAgg) {
  const expectedEfficiency = eff.expectedNPH > 0 ? (eff.targetHours / eff.expectedNPH) * 100 : null;
  const actualEfficiency = eff.actualNPH > 0 ? (eff.targetHours / eff.actualNPH) * 100 : null;
  const efficiencyDifference =
    actualEfficiency !== null && expectedEfficiency !== null
      ? Math.round((actualEfficiency - expectedEfficiency) * 10) / 10
      : null;
  const ppa = att.appPlanProdQty > 0 ? (att.actProdQty / att.appPlanProdQty) * 100 : null;
  const app = att.appPlanProdQty > 0 ? (1 - att.appAbsPlanActual / att.appPlanProdQty) * 100 : null;

  return {
    expectedEfficiency: expectedEfficiency !== null ? Math.round(expectedEfficiency * 10) / 10 : null,
    actualEfficiency: actualEfficiency !== null ? Math.round(actualEfficiency * 10) / 10 : null,
    efficiencyDifference,
    ppa: ppa !== null ? Math.round(ppa * 10) / 10 : null,
    app: app !== null ? Math.round(app * 10) / 10 : null,
    plannedQty: Math.round(att.appPlanProdQty),
    actualQty: Math.round(att.actProdQty),
  };
}

function computeTimeMetrics(eff: EffAgg) {
  const denom = eff.goodProductionTime + eff.unplannedStoppages + eff.plannedStoppages;
  const ai = denom > 0 ? (eff.goodProductionTime / denom) * 100 : null;
  const plannedStopsPct = denom > 0 ? (eff.plannedStoppages / denom) * 100 : null;

  return {
    ai: ai !== null ? Math.round(ai * 10) / 10 : null,
    plannedStopsPct: plannedStopsPct !== null ? Math.round(plannedStopsPct * 10) / 10 : null,
  };
}

/**
 * Build a map of (plantId, workCenterCode) → { sumTotMaxLoad, sumTotAvail }
 * using substring matching: capacity resName/ompTechnicalName contains workCenterCode
 */
function buildCapacityMap(
  capacity: CapacityRow[],
  plantWorkCenters: Map<string, Set<string>> // plantId → set of workCenterCodes
): Map<string, { sumTotMaxLoad: number; sumTotAvail: number }> {
  const result = new Map<string, { sumTotMaxLoad: number; sumTotAvail: number }>();

  for (const cap of capacity) {
    const wcCodes = plantWorkCenters.get(cap.plantId);
    if (!wcCodes) continue;

    // Try to match this capacity row to a work center via substring
    for (const wc of wcCodes) {
      const resMatch = cap.resName && cap.resName.includes(wc);
      const techMatch = cap.ompTechnicalName && cap.ompTechnicalName.includes(wc);
      if (resMatch || techMatch) {
        const key = `${cap.plantId}||${wc}`;
        let bucket = result.get(key);
        if (!bucket) {
          bucket = { sumTotMaxLoad: 0, sumTotAvail: 0 };
          result.set(key, bucket);
        }
        bucket.sumTotMaxLoad += cap.sumTotMaxLoad;
        bucket.sumTotAvail += cap.sumTotAvail;
        break; // each capacity row maps to at most one work center
      }
    }
  }

  return result;
}

export function useInsightsData(data: ParsedData | null): InsightsPlantRow[] {
  const { effRows, attRows } = useFilteredRows(data);

  return useMemo(() => {
    if (!data || effRows.length === 0) return [];

    // --- Step 1: Group efficiency rows by plant → resource → material ---
    const plantEffMap = new Map<string, Map<string, Map<string, EffAgg>>>();
    const plantNames = new Map<string, string>();
    const resourceNames = new Map<string, string>();
    const materialTypes = new Map<string, string>(); // materialDesc → materialType

    for (const r of effRows) {
      plantNames.set(r.plantCode, r.plantName);
      resourceNames.set(r.workCenterCode, r.workCenterName);
      if (r.materialDesc && r.materialType) {
        materialTypes.set(r.materialDesc, r.materialType);
      }

      // Plant → Resource → Material
      if (!plantEffMap.has(r.plantCode)) plantEffMap.set(r.plantCode, new Map());
      const resMap = plantEffMap.get(r.plantCode)!;

      if (!resMap.has(r.workCenterCode)) resMap.set(r.workCenterCode, new Map());
      const matMap = resMap.get(r.workCenterCode)!;

      const matKey = r.materialDesc ?? '(unknown)';
      let agg = matMap.get(matKey);
      if (!agg) {
        agg = { targetHours: 0, actualNPH: 0, expectedNPH: 0, goodProductionTime: 0, unplannedStoppages: 0, plannedStoppages: 0 };
        matMap.set(matKey, agg);
      }
      agg.targetHours += r.targetHours;
      agg.actualNPH += r.actualNPH;
      agg.expectedNPH += r.expectedNPH;
      agg.goodProductionTime += r.goodProductionTime;
      agg.unplannedStoppages += r.unplannedStoppages;
      agg.plannedStoppages += r.plannedStoppages;
    }

    // --- Step 2: Group attainment rows by plant → resource → material ---
    const plantAttMap = new Map<string, Map<string, Map<string, AttAgg>>>();

    for (const r of attRows) {
      const plantCode = r.plantCode;
      const wcCode = r.workCenterCode ?? '__plant_only__';
      const matKey = r.materialDesc ?? '(unknown)';

      if (!plantAttMap.has(plantCode)) plantAttMap.set(plantCode, new Map());
      const resMap = plantAttMap.get(plantCode)!;

      if (!resMap.has(wcCode)) resMap.set(wcCode, new Map());
      const matMap = resMap.get(wcCode)!;

      let agg = matMap.get(matKey);
      if (!agg) {
        agg = { actProdQty: 0, appPlanProdQty: 0, appAbsPlanActual: 0 };
        matMap.set(matKey, agg);
      }
      agg.actProdQty += r.actProdQty;
      agg.appPlanProdQty += r.appPlanProdQty;
      agg.appAbsPlanActual += r.appAbsPlanActual;
    }

    // --- Step 3: Build capacity map ---
    // Collect plant → work center codes for substring matching
    const plantWorkCenters = new Map<string, Set<string>>();
    for (const [plantCode, resMap] of plantEffMap) {
      const wcSet = new Set(resMap.keys());
      // plantCode in efficiency === plantId in capacity
      plantWorkCenters.set(plantCode, wcSet);
    }
    const capacityMap = buildCapacityMap(data.capacity, plantWorkCenters);

    // Helper to sum attainment for a resource across all its materials
    function getAttAgg(plantCode: string, wcCode: string): AttAgg;
    function getAttAgg(plantCode: string, wcCode: string, matKey: string): AttAgg;
    function getAttAgg(plantCode: string, wcCode: string, matKey?: string): AttAgg {
      const empty: AttAgg = { actProdQty: 0, appPlanProdQty: 0, appAbsPlanActual: 0 };
      const resMap = plantAttMap.get(plantCode);
      if (!resMap) return empty;

      if (matKey !== undefined) {
        // Specific material
        const matMap = resMap.get(wcCode);
        return matMap?.get(matKey) ?? empty;
      }

      // Sum across all materials for this resource
      const matMap = resMap.get(wcCode);
      if (!matMap) return empty;

      const result: AttAgg = { actProdQty: 0, appPlanProdQty: 0, appAbsPlanActual: 0 };
      for (const att of matMap.values()) {
        result.actProdQty += att.actProdQty;
        result.appPlanProdQty += att.appPlanProdQty;
        result.appAbsPlanActual += att.appAbsPlanActual;
      }
      return result;
    }

    // --- Step 4: Build InsightsPlantRow[] ---
    const plants: InsightsPlantRow[] = [];

    for (const [plantCode, resMap] of plantEffMap) {
      const plantEff: EffAgg = { targetHours: 0, actualNPH: 0, expectedNPH: 0, goodProductionTime: 0, unplannedStoppages: 0, plannedStoppages: 0 };
      const plantAtt: AttAgg = { actProdQty: 0, appPlanProdQty: 0, appAbsPlanActual: 0 };
      let plantCapMaxLoad = 0;
      let plantCapAvail = 0;

      const resources: InsightsResourceRow[] = [];

      for (const [wcCode, matMap] of resMap) {
        const resEff: EffAgg = { targetHours: 0, actualNPH: 0, expectedNPH: 0, goodProductionTime: 0, unplannedStoppages: 0, plannedStoppages: 0 };
        const resAtt: AttAgg = { actProdQty: 0, appPlanProdQty: 0, appAbsPlanActual: 0 };

        const materials: InsightsMaterialRow[] = [];

        for (const [matKey, matEff] of matMap) {
          // Sum into resource
          resEff.targetHours += matEff.targetHours;
          resEff.actualNPH += matEff.actualNPH;
          resEff.expectedNPH += matEff.expectedNPH;
          resEff.goodProductionTime += matEff.goodProductionTime;
          resEff.unplannedStoppages += matEff.unplannedStoppages;
          resEff.plannedStoppages += matEff.plannedStoppages;

          const matAttAgg = getAttAgg(plantCode, wcCode, matKey);
          resAtt.actProdQty += matAttAgg.actProdQty;
          resAtt.appPlanProdQty += matAttAgg.appPlanProdQty;
          resAtt.appAbsPlanActual += matAttAgg.appAbsPlanActual;

          const matMetrics = computeMetrics(matEff, matAttAgg);

          materials.push({
            materialType: materialTypes.get(matKey) ?? '(unknown)',
            materialDesc: matKey,
            ...matMetrics,
          });
        }

        // Also include attainment rows with no work center (plant-level only), summed at resource level
        // These are captured at plant level below

        // Sum into plant
        plantEff.targetHours += resEff.targetHours;
        plantEff.actualNPH += resEff.actualNPH;
        plantEff.expectedNPH += resEff.expectedNPH;
        plantEff.goodProductionTime += resEff.goodProductionTime;
        plantEff.unplannedStoppages += resEff.unplannedStoppages;
        plantEff.plannedStoppages += resEff.plannedStoppages;
        plantAtt.actProdQty += resAtt.actProdQty;
        plantAtt.appPlanProdQty += resAtt.appPlanProdQty;
        plantAtt.appAbsPlanActual += resAtt.appAbsPlanActual;

        // Capacity for this resource
        const capKey = `${plantCode}||${wcCode}`;
        const cap = capacityMap.get(capKey);
        let machinePolicy: number | null = null;
        if (cap && cap.sumTotAvail > 0) {
          machinePolicy = Math.round((1 - cap.sumTotMaxLoad / cap.sumTotAvail) * 1000) / 10;
          plantCapMaxLoad += cap.sumTotMaxLoad;
          plantCapAvail += cap.sumTotAvail;
        }

        const resMetrics = computeMetrics(resEff, resAtt);
        const resTimeMetrics = computeTimeMetrics(resEff);

        materials.sort((a, b) => a.materialDesc.localeCompare(b.materialDesc));

        resources.push({
          workCenterCode: wcCode,
          workCenterName: resourceNames.get(wcCode) ?? wcCode,
          ...resMetrics,
          ...resTimeMetrics,
          machinePolicy,
          materials,
        });
      }

      // Plant-level attainment: also include plant-only attainment rows (workCenterCode === null)
      const plantOnlyAtt = getAttAgg(plantCode, '__plant_only__');
      plantAtt.actProdQty += plantOnlyAtt.actProdQty;
      plantAtt.appPlanProdQty += plantOnlyAtt.appPlanProdQty;
      plantAtt.appAbsPlanActual += plantOnlyAtt.appAbsPlanActual;

      const plantMetrics = computeMetrics(plantEff, plantAtt);
      const plantTimeMetrics = computeTimeMetrics(plantEff);
      const plantMachinePolicy = plantCapAvail > 0
        ? Math.round((1 - plantCapMaxLoad / plantCapAvail) * 1000) / 10
        : null;

      resources.sort((a, b) => a.workCenterName.localeCompare(b.workCenterName));

      plants.push({
        plantCode,
        plantName: plantNames.get(plantCode) ?? plantCode,
        ...plantMetrics,
        ...plantTimeMetrics,
        machinePolicy: plantMachinePolicy,
        resources,
      });
    }

    plants.sort((a, b) => a.plantCode.localeCompare(b.plantCode));

    return plants;
  }, [data, effRows, attRows]);
}
