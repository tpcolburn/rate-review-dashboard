import { useMemo, useEffect } from 'react';
import type { ParsedData, TimeScope } from '../types/data';
import { useFilterStore } from '../store/useFilterStore';
import { getFilteredOptions } from '../utils/dataTransforms';
import { getYearWeekRange } from '../utils/timeUtils';
import { MultiSelect } from './MultiSelect';

interface FilterBarProps {
  data: ParsedData;
}

export function FilterBar({ data }: FilterBarProps) {
  const {
    selectedPlants,
    selectedResources,
    selectedMaterialTypes,
    selectedMaterials,
    fertLinesOnly,
    timeScope,
    dateRange,
    setPlants,
    setResources,
    setMaterialTypes,
    setMaterials,
    setFertLinesOnly,
    setTimeScope,
    setDateRange,
    pruneInvalidSelections,
  } = useFilterStore();

  // Cross-filtered options
  const options = useMemo(
    () => getFilteredOptions(data.efficiency, selectedPlants, selectedResources, selectedMaterialTypes, selectedMaterials),
    [data.efficiency, selectedPlants, selectedResources, selectedMaterialTypes, selectedMaterials]
  );

  // Prune stale selections after cross-filter recalc
  useEffect(() => {
    pruneInvalidSelections(options);
  }, [options, pruneInvalidSelections]);

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
        <MultiSelect
          label="Plant"
          options={options.plants.map((p) => ({ value: p.code, label: `${p.code} - ${p.name}` }))}
          selected={selectedPlants}
          onChange={setPlants}
          allLabel="All Plants"
          minWidth="180px"
        />

        {/* Resource */}
        <MultiSelect
          label="Resource"
          options={options.resources.map((r) => ({ value: r.code, label: r.name }))}
          selected={selectedResources}
          onChange={setResources}
          allLabel="All Resources"
          minWidth="220px"
        />

        {/* Material Type */}
        <MultiSelect
          label="Material Type"
          options={options.materialTypes.map((mt) => ({ value: mt, label: mt }))}
          selected={selectedMaterialTypes}
          onChange={setMaterialTypes}
          allLabel="All Types"
          minWidth="200px"
        />

        {/* FERT Lines Only */}
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={fertLinesOnly}
            onChange={(e) => setFertLinesOnly(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-slate-700 focus:ring-slate-500"
          />
          <span className="text-xs font-medium text-gray-600 whitespace-nowrap">
            FERT Lines Only
          </span>
        </label>

        {/* Material */}
        <MultiSelect
          label="Material"
          options={options.materials.map((m) => ({ value: m, label: m }))}
          selected={selectedMaterials}
          onChange={setMaterials}
          allLabel="All Materials"
          minWidth="260px"
        />

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
