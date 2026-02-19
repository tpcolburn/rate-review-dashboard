import { useExcelData } from './hooks/useExcelData';
import { useFilteredData } from './hooks/useFilteredData';
import { useFilterStore } from './store/useFilterStore';
import { FilterBar } from './components/FilterBar';
import { MetricToggles } from './components/MetricToggles';
import { EfficiencyChart } from './components/EfficiencyChart';
import { TimeBreakdownChart } from './components/TimeBreakdownChart';
import { DataTable } from './components/DataTable';

function App() {
  const { data, loading, error } = useExcelData();
  const { chartData, timeBreakdownData } = useFilteredData(data);
  const selectedMaterialTypes = useFilterStore((s) => s.selectedMaterialTypes);
  const selectedMaterials = useFilterStore((s) => s.selectedMaterials);

  const hasMaterialFilter = selectedMaterialTypes.length > 0 || selectedMaterials.length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-slate-300 border-t-slate-700 rounded-full animate-spin mb-3" />
          <p className="text-gray-500 text-sm">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 font-medium mb-2">Failed to load data</h2>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-slate-800 text-white px-4 py-3">
        <h1 className="text-lg font-semibold">Rate Review Dashboard</h1>
      </header>

      {/* Filters */}
      <FilterBar data={data} />

      {/* Metric Toggles */}
      <MetricToggles />

      {/* Efficiency Chart */}
      <div className="flex-1 px-4 py-4">
        <EfficiencyChart data={chartData} />
      </div>

      {/* Time Breakdown Chart */}
      <div className="px-4 pb-4">
        <TimeBreakdownChart data={timeBreakdownData} hasMaterialFilter={hasMaterialFilter} />
      </div>

      {/* Data Table */}
      <div className="px-4 pb-4">
        <DataTable data={chartData} />
      </div>
    </div>
  );
}

export default App;
