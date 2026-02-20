import { useMemo } from 'react';
import type { ParsedData, ChartDataPoint, TimeBreakdownDataPoint } from '../types/data';
import { useFilterStore } from '../store/useFilterStore';
import { useFilteredRows } from './useFilteredRows';
import { buildChartData, buildTimeBreakdownData } from '../utils/dataTransforms';

interface FilteredDataResult {
  chartData: ChartDataPoint[];
  timeBreakdownData: TimeBreakdownDataPoint[];
}

export function useFilteredData(data: ParsedData | null): FilteredDataResult {
  const timeScope = useFilterStore((s) => s.timeScope);
  const { effRows, attRows, hasMaterialFilter } = useFilteredRows(data);

  return useMemo(() => {
    if (effRows.length === 0 && attRows.length === 0) return { chartData: [], timeBreakdownData: [] };

    return {
      chartData: buildChartData(effRows, attRows, timeScope),
      timeBreakdownData: buildTimeBreakdownData(effRows, timeScope, hasMaterialFilter),
    };
  }, [effRows, attRows, timeScope, hasMaterialFilter]);
}
