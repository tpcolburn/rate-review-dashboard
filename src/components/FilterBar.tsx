import { useMemo, useEffect } from 'react';
import type { ParsedData, TimeScope } from '../types/data';
import { useFilterStore } from '../store/useFilterStore';
import {
  getUniquePlants,
  getUniqueResources,
  getUniqueMaterials,
} from '../utils/dataTransforms';
import { getYearWeekRange } from '../utils/timeUtils';

interface FilterBarProps {
  data: ParsedData;
}

export function FilterBar({ data }: FilterBarProps) {
  const {
    selectedPlant,
    selectedResource,
    selectedMaterial,
    timeScope,
    dateRange,
    setPlant,
    setResource,
    setMaterial,
    setTimeScope,
    setDateRange,
  } = useFilterStore();

  const plants = useMemo(() => getUniquePlants(data.efficiency), [data.efficiency]);
  const resources = useMemo(
    () => getUniqueResources(data.efficiency, selectedPlant),
    [data.efficiency, selectedPlant]
  );
  const materials = useMemo(
    () => getUniqueMaterials(data.efficiency, selectedPlant, selectedResource),
    [data.efficiency, selectedPlant, selectedResource]
  );

  // Get full date range from data
  const fullRange = useMemo(() => {
    const weeks = data.efficiency.map((r) => r.yearWeek);
    return getYearWeekRange(weeks);
  }, [data.efficiency]);

  // Initialize date range on first load
  useEffect(() => {
    if (!dateRange[0] && fullRange[0]) {
      setDateRange(fullRange);
    }
  }, [fullRange, dateRange, setDateRange]);

  // Get available weeks for the range selectors
  const availableWeeks = useMemo(() => {
    const set = new Set<string>();
    for (const r of data.efficiency) set.add(r.yearWeek);
    return Array.from(set).sort();
  }, [data.efficiency]);

  const timeScopes: { value: TimeScope; label: string }[] = [
    { value: 'quarter', label: 'ISO Quarter' },
    { value: 'month', label: 'Nestlé Month' },
    { value: 'week', label: 'ISO Week' },
  ];

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Plant */}
        <div className="flex items-center gap-1.5">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Plant
          </label>
          <select
            value={selectedPlant || ''}
            onChange={(e) => setPlant(e.target.value || null)}
            className="border border-gray-300 rounded px-2 py-1.5 text-sm bg-white min-w-[180px]"
          >
            <option value="">All Plants</option>
            {plants.map((p) => (
              <option key={p.code} value={p.code}>
                {p.code} - {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Resource */}
        <div className="flex items-center gap-1.5">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Resource
          </label>
          <select
            value={selectedResource || ''}
            onChange={(e) => setResource(e.target.value || null)}
            className="border border-gray-300 rounded px-2 py-1.5 text-sm bg-white min-w-[220px]"
          >
            <option value="">All Resources</option>
            {resources.map((r) => (
              <option key={r.code} value={r.code}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        {/* Material */}
        <div className="flex items-center gap-1.5">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Material
          </label>
          <select
            value={selectedMaterial || ''}
            onChange={(e) => setMaterial(e.target.value || null)}
            className="border border-gray-300 rounded px-2 py-1.5 text-sm bg-white min-w-[260px]"
          >
            <option value="">All Materials</option>
            {materials.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Time scope */}
        <div className="flex items-center gap-1.5 ml-auto">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Time scope:
          </label>
          <div className="flex border border-gray-300 rounded overflow-hidden">
            {timeScopes.map((ts) => (
              <button
                key={ts.value}
                onClick={() => setTimeScope(ts.value)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  timeScope === ts.value
                    ? 'bg-slate-700 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {ts.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Date range */}
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Range
        </label>
        <select
          value={dateRange[0]}
          onChange={(e) => setDateRange([e.target.value, dateRange[1]])}
          className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
        >
          {availableWeeks.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
        <span className="text-gray-400">—</span>
        <select
          value={dateRange[1]}
          onChange={(e) => setDateRange([dateRange[0], e.target.value])}
          className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
        >
          {availableWeeks.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
