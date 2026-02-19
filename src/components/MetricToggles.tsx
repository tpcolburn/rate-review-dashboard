import { useFilterStore } from '../store/useFilterStore';

export function MetricToggles() {
  const { visibleMetrics, toggleMetric } = useFilterStore();

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-gray-50 border-b border-gray-200">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        Overlay:
      </span>
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input
          type="checkbox"
          checked={visibleMetrics.ai}
          onChange={() => toggleMetric('ai')}
          className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
        />
        <span className="text-sm font-medium text-gray-700">AI (Asset Intensity)</span>
      </label>
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input
          type="checkbox"
          checked={visibleMetrics.ppa}
          onChange={() => toggleMetric('ppa')}
          className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
        />
        <span className="text-sm font-medium text-gray-700">PPA (Planned Production Attainment)</span>
      </label>
    </div>
  );
}
