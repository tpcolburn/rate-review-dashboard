import { useMemo } from 'react';
import type { ParsedData, EfficiencyRow, AttainmentRow } from '../types/data';
import { useFilterStore } from '../store/useFilterStore';
import { isInRange } from '../utils/timeUtils';

interface FilteredRowsResult {
  effRows: EfficiencyRow[];
  attRows: AttainmentRow[];
  hasMaterialFilter: boolean;
}

export function useFilteredRows(data: ParsedData | null): FilteredRowsResult {
  const { selectedPlants, selectedResources, selectedMaterialTypes, selectedMaterials, fertLinesOnly, dateRange } =
    useFilterStore();

  return useMemo(() => {
    if (!data) return { effRows: [], attRows: [], hasMaterialFilter: false };

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

    // FERT lines only: keep only resources that have at least one FERT row
    if (fertLinesOnly) {
      const fertResources = new Set<string>();
      for (const r of effRows) {
        if (r.materialType?.startsWith('FERT')) fertResources.add(r.workCenterCode);
      }
      effRows = effRows.filter((r) => fertResources.has(r.workCenterCode));
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

    // FERT lines only: filter attainment to same set of FERT-producing resources
    if (fertLinesOnly) {
      const fertResources = new Set<string>();
      for (const r of effRows) {
        if (r.materialType?.startsWith('FERT')) fertResources.add(r.workCenterCode);
      }
      attRows = attRows.filter(
        (r) => r.workCenterCode === null || fertResources.has(r.workCenterCode)
      );
    }

    const hasMaterialFilter = hasMaterialTypes || hasMaterials;

    return { effRows, attRows, hasMaterialFilter };
  }, [data, selectedPlants, selectedResources, selectedMaterialTypes, selectedMaterials, fertLinesOnly, dateRange]);
}
