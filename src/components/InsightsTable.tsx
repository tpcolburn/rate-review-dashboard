import { useState, useCallback, useMemo } from 'react';
import type { InsightsPlantRow, InsightsResourceRow, InsightsMaterialRow } from '../types/data';

interface Props {
  data: InsightsPlantRow[];
}

interface ThresholdFilter {
  lowerThan: string; // raw input text — empty means inactive
  higherThan: string;
}

function fmt(value: number | null, suffix = '%'): string {
  if (value === null) return '—';
  return `${value.toFixed(1)}${suffix}`;
}

function fmtQty(value: number): string {
  return value.toLocaleString();
}

function DeviationCell({ value }: { value: number | null }) {
  if (value === null) return <td className="px-3 py-2 text-right tabular-nums">—</td>;
  const color = value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : '';
  const sign = value > 0 ? '+' : '';
  return (
    <td className={`px-3 py-2 text-right tabular-nums ${color}`}>
      {sign}{value.toFixed(1)} pp
    </td>
  );
}

function QtyCell({ value }: { value: number }) {
  return (
    <td className="px-3 py-2 text-right tabular-nums">{fmtQty(value)}</td>
  );
}

function EffCell({ expected, actual }: { expected: number | null; actual: number | null }) {
  const isBelow = expected !== null && actual !== null && actual < expected;
  return (
    <td className={`px-3 py-2 text-right tabular-nums ${isBelow ? 'text-red-600' : ''}`}>
      {fmt(actual)}
    </td>
  );
}

function MetricCell({ value, dash }: { value: number | null; dash?: boolean }) {
  return (
    <td className="px-3 py-2 text-right tabular-nums">
      {dash ? '—' : fmt(value)}
    </td>
  );
}

function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`w-4 h-4 inline-block mr-1 transition-transform ${expanded ? 'rotate-90' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

const HEADERS = [
  'Name',
  'Exp. Eff.',
  'Act. Eff.',
  'Eff. Diff.',
  'PPA',
  'APP',
  'Planned Qty',
  'Actual Qty',
  'AI',
  'Planned Stops',
  'Machine Policy',
];

function MaterialRow({ mat }: { mat: InsightsMaterialRow }) {
  return (
    <tr className="border-t border-gray-100 hover:bg-gray-50">
      <td className="px-3 py-1.5 pl-16 text-sm text-gray-600">
        <span className="text-gray-400 mr-2 text-xs">{mat.materialType}</span>
        {mat.materialDesc}
      </td>
      <MetricCell value={mat.expectedEfficiency} />
      <EffCell expected={mat.expectedEfficiency} actual={mat.actualEfficiency} />
      <DeviationCell value={mat.efficiencyDifference} />
      <MetricCell value={mat.ppa} />
      <MetricCell value={mat.app} />
      <QtyCell value={mat.plannedQty} />
      <QtyCell value={mat.actualQty} />
      <MetricCell value={null} dash />
      <MetricCell value={null} dash />
      <MetricCell value={null} dash />
    </tr>
  );
}

function ResourceRow({
  res,
  plantCode,
  expanded,
  onToggle,
}: {
  res: InsightsResourceRow;
  plantCode: string;
  expanded: boolean;
  onToggle: (key: string) => void;
}) {
  const key = `${plantCode}||${res.workCenterCode}`;
  return (
    <>
      <tr
        className="border-t border-gray-200 hover:bg-gray-50 cursor-pointer"
        onClick={() => onToggle(key)}
      >
        <td className="px-3 py-2 pl-8 text-sm font-medium">
          <Chevron expanded={expanded} />
          <span className="text-gray-500 mr-1">{res.workCenterCode}</span>
          {res.workCenterName}
        </td>
        <MetricCell value={res.expectedEfficiency} />
        <EffCell expected={res.expectedEfficiency} actual={res.actualEfficiency} />
        <DeviationCell value={res.efficiencyDifference} />
        <MetricCell value={res.ppa} />
        <MetricCell value={res.app} />
        <QtyCell value={res.plannedQty} />
        <QtyCell value={res.actualQty} />
        <MetricCell value={res.ai} />
        <MetricCell value={res.plannedStopsPct} />
        <MetricCell value={res.machinePolicy} />
      </tr>
      {expanded &&
        res.materials.map((mat) => (
          <MaterialRow key={mat.materialDesc} mat={mat} />
        ))}
    </>
  );
}

function PlantRow({
  plant,
  expanded,
  expandedResources,
  onTogglePlant,
  onToggleResource,
}: {
  plant: InsightsPlantRow;
  expanded: boolean;
  expandedResources: Set<string>;
  onTogglePlant: (key: string) => void;
  onToggleResource: (key: string) => void;
}) {
  return (
    <>
      <tr
        className="border-t border-gray-300 bg-gray-50 hover:bg-gray-100 cursor-pointer"
        onClick={() => onTogglePlant(plant.plantCode)}
      >
        <td className="px-3 py-2 text-sm font-semibold">
          <Chevron expanded={expanded} />
          <span className="text-gray-500 mr-1">{plant.plantCode}</span>
          {plant.plantName}
        </td>
        <MetricCell value={plant.expectedEfficiency} />
        <EffCell expected={plant.expectedEfficiency} actual={plant.actualEfficiency} />
        <DeviationCell value={plant.efficiencyDifference} />
        <MetricCell value={plant.ppa} />
        <MetricCell value={plant.app} />
        <QtyCell value={plant.plannedQty} />
        <QtyCell value={plant.actualQty} />
        <MetricCell value={plant.ai} />
        <MetricCell value={plant.plannedStopsPct} />
        <MetricCell value={plant.machinePolicy} />
      </tr>
      {expanded &&
        plant.resources.map((res) => (
          <ResourceRow
            key={res.workCenterCode}
            res={res}
            plantCode={plant.plantCode}
            expanded={expandedResources.has(`${plant.plantCode}||${res.workCenterCode}`)}
            onToggle={onToggleResource}
          />
        ))}
    </>
  );
}

function resourceMatchesThreshold(
  res: InsightsResourceRow,
  lowerVal: number | null,
  higherVal: number | null
): boolean {
  if (res.efficiencyDifference === null) return false;
  if (lowerVal !== null && res.efficiencyDifference < lowerVal) return true;
  if (higherVal !== null && res.efficiencyDifference > higherVal) return true;
  return false;
}

export function InsightsTable({ data }: Props) {
  const [expandedPlants, setExpandedPlants] = useState<Set<string>>(new Set());
  const [expandedResources, setExpandedResources] = useState<Set<string>>(new Set());
  const [threshold, setThreshold] = useState<ThresholdFilter>({ lowerThan: '', higherThan: '' });

  const lowerVal = threshold.lowerThan !== '' ? parseFloat(threshold.lowerThan) : null;
  const higherVal = threshold.higherThan !== '' ? parseFloat(threshold.higherThan) : null;
  const hasThreshold = (lowerVal !== null && !isNaN(lowerVal)) || (higherVal !== null && !isNaN(higherVal));
  const parsedLower = lowerVal !== null && !isNaN(lowerVal) ? lowerVal : null;
  const parsedHigher = higherVal !== null && !isNaN(higherVal) ? higherVal : null;

  const filteredData = useMemo(() => {
    if (!hasThreshold) return data;

    const result: InsightsPlantRow[] = [];
    for (const plant of data) {
      const matchingResources = plant.resources.filter((res) =>
        resourceMatchesThreshold(res, parsedLower, parsedHigher)
      );
      if (matchingResources.length > 0) {
        result.push({ ...plant, resources: matchingResources });
      }
    }
    return result;
  }, [data, hasThreshold, parsedLower, parsedHigher]);

  // When threshold is active, auto-expand all plants so matching resources are visible
  const effectiveExpandedPlants = useMemo(() => {
    if (!hasThreshold) return expandedPlants;
    return new Set(filteredData.map((p) => p.plantCode));
  }, [hasThreshold, filteredData, expandedPlants]);

  const togglePlant = useCallback((key: string) => {
    setExpandedPlants((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const toggleResource = useCallback((key: string) => {
    setExpandedResources((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const matchCount = hasThreshold
    ? filteredData.reduce((sum, p) => sum + p.resources.length, 0)
    : null;

  if (data.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-gray-400 text-sm">
        No data matches the current filters.
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      {/* Threshold filter bar */}
      <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 mb-3 flex items-center gap-4 flex-wrap">
        <span className="text-sm font-medium text-gray-700">Eff. Diff. Threshold:</span>
        <label className="flex items-center gap-1.5 text-sm text-gray-600">
          Lower than
          <input
            type="number"
            step="0.1"
            value={threshold.lowerThan}
            onChange={(e) => setThreshold((prev) => ({ ...prev, lowerThan: e.target.value }))}
            placeholder="e.g. -5"
            className="w-24 px-2 py-1 border border-gray-300 rounded text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
          <span className="text-gray-400">pp</span>
        </label>
        <span className="text-gray-400 text-xs">OR</span>
        <label className="flex items-center gap-1.5 text-sm text-gray-600">
          Higher than
          <input
            type="number"
            step="0.1"
            value={threshold.higherThan}
            onChange={(e) => setThreshold((prev) => ({ ...prev, higherThan: e.target.value }))}
            placeholder="e.g. 10"
            className="w-24 px-2 py-1 border border-gray-300 rounded text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
          <span className="text-gray-400">pp</span>
        </label>
        {hasThreshold && (
          <>
            <span className="text-xs text-gray-500">
              {matchCount} resource{matchCount !== 1 ? 's' : ''} in {filteredData.length} plant{filteredData.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => setThreshold({ lowerThan: '', higherThan: '' })}
              className="text-xs text-slate-500 hover:text-slate-700 underline"
            >
              Clear
            </button>
          </>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-700 text-white text-xs uppercase tracking-wider">
              {HEADERS.map((h) => (
                <th
                  key={h}
                  className={`px-3 py-2 ${h === 'Name' ? 'text-left' : 'text-right'} font-medium`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((plant) => (
              <PlantRow
                key={plant.plantCode}
                plant={plant}
                expanded={effectiveExpandedPlants.has(plant.plantCode)}
                expandedResources={expandedResources}
                onTogglePlant={togglePlant}
                onToggleResource={toggleResource}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
