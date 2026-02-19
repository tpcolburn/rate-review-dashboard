import { useMemo } from 'react';
import type { ParsedData, ChartDataPoint } from '../types/data';
import { useFilterStore } from '../store/useFilterStore';
import { buildChartData } from '../utils/dataTransforms';
import { isInRange } from '../utils/timeUtils';

export function useFilteredData(data: ParsedData | null): ChartDataPoint[] {
  const { selectedPlant, selectedResource, selectedMaterial, timeScope, dateRange } =
    useFilterStore();

  return useMemo(() => {
    if (!data) return [];

    // Filter efficiency rows
    let effRows = data.efficiency;
    if (selectedPlant) {
      effRows = effRows.filter((r) => r.plantCode === selectedPlant);
    }
    if (selectedResource) {
      effRows = effRows.filter((r) => r.workCenterCode === selectedResource);
    }
    if (selectedMaterial) {
      effRows = effRows.filter((r) => r.materialDesc === selectedMaterial);
    }
    if (dateRange[0] && dateRange[1]) {
      effRows = effRows.filter((r) => isInRange(r.yearWeek, dateRange[0], dateRange[1]));
    }

    // Filter attainment rows
    let attRows = data.attainment;
    if (selectedPlant) {
      attRows = attRows.filter((r) => r.plantCode === selectedPlant);
    }
    if (selectedResource) {
      attRows = attRows.filter(
        (r) => r.workCenterCode === selectedResource || r.workCenterCode === null
      );
    }
    if (selectedMaterial) {
      attRows = attRows.filter((r) => r.materialDesc === selectedMaterial);
    }
    if (dateRange[0] && dateRange[1]) {
      attRows = attRows.filter((r) => isInRange(r.yearWeek, dateRange[0], dateRange[1]));
    }

    return buildChartData(effRows, attRows, timeScope);
  }, [data, selectedPlant, selectedResource, selectedMaterial, timeScope, dateRange]);
}
