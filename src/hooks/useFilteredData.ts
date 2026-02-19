import { useMemo } from 'react';
import type { ParsedData, ChartDataPoint, TimeBreakdownDataPoint } from '../types/data';
import { useFilterStore } from '../store/useFilterStore';
import { buildChartData, buildTimeBreakdownData } from '../utils/dataTransforms';
import { isInRange } from '../utils/timeUtils';

interface FilteredDataResult {
  chartData: ChartDataPoint[];
  timeBreakdownData: TimeBreakdownDataPoint[];
}

export function useFilteredData(data: ParsedData | null): FilteredDataResult {
  const { selectedPlants, selectedResources, selectedMaterialTypes, selectedMaterials, timeScope, dateRange } =
    useFilterStore();

  return useMemo(() => {
    if (!data) return { chartData: [], timeBreakdownData: [] };

    const hasPlants = selectedPlants.length > 0;
    const hasResources = selectedResources.length > 0;
    const hasMaterialTypes = selectedMaterialTypes.length > 0;
    const hasMaterials = selectedMaterials.length > 0;
    const hasDateRange = dateRange[0] !== '' && dateRange[1] !== '';

    // Filter efficiency rows
    let effRows = data.efficiency;
    if (hasPlants) {
      effRows = effRows.filter((r) => selectedPlants.includes(r.plantCode));
    }
    if (hasResources) {
      effRows = effRows.filter((r) => selectedResources.includes(r.workCenterCode));
    }
    if (hasMaterialTypes) {
      effRows = effRows.filter((r) => r.materialType !== null && selectedMaterialTypes.includes(r.materialType));
    }
    if (hasMaterials) {
      effRows = effRows.filter((r) => r.materialDesc !== null && selectedMaterials.includes(r.materialDesc));
    }
    if (hasDateRange) {
      effRows = effRows.filter((r) => isInRange(r.yearWeek, dateRange[0], dateRange[1]));
    }

    // Filter attainment rows
    let attRows = data.attainment;
    if (hasPlants) {
      attRows = attRows.filter((r) => selectedPlants.includes(r.plantCode));
    }
    if (hasResources) {
      attRows = attRows.filter(
        (r) => r.workCenterCode === null || selectedResources.includes(r.workCenterCode)
      );
    }
    if (hasMaterialTypes) {
      attRows = attRows.filter((r) => r.materialType !== null && selectedMaterialTypes.includes(r.materialType));
    }
    if (hasMaterials) {
      attRows = attRows.filter((r) => r.materialDesc !== null && selectedMaterials.includes(r.materialDesc));
    }
    if (hasDateRange) {
      attRows = attRows.filter((r) => isInRange(r.yearWeek, dateRange[0], dateRange[1]));
    }

    const hasMaterialFilter = hasMaterialTypes || hasMaterials;

    return {
      chartData: buildChartData(effRows, attRows, timeScope),
      timeBreakdownData: buildTimeBreakdownData(effRows, timeScope, hasMaterialFilter),
    };
  }, [data, selectedPlants, selectedResources, selectedMaterialTypes, selectedMaterials, timeScope, dateRange]);
}
