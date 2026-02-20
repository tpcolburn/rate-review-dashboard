import { useState } from 'react';
import { useExcelData } from './hooks/useExcelData';
import { useFilteredData } from './hooks/useFilteredData';
import { useInsightsData } from './hooks/useInsightsData';
import { useFilterStore } from './store/useFilterStore';
import { FilterBar } from './components/FilterBar';
import { MetricToggles } from './components/MetricToggles';
import { EfficiencyChart } from './components/EfficiencyChart';
import { TimeBreakdownChart } from './components/TimeBreakdownChart';
import { DataTable } from './components/DataTable';
import { InsightsTable } from './components/InsightsTable';

type Tab = 'dashboard' | 'insights';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const { data, loading, error } = useExcelData();
  const { chartData, timeBreakdownData } = useFilteredData(data);
  const insightsData = useInsightsData(data);
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
      <header className="bg-slate-800 text-white px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Rate Review Dashboard</h1>
        <div className="flex rounded-md overflow-hidden text-sm">
          <button
            className={`px-4 py-1.5 font-medium transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-slate-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`px-4 py-1.5 font-medium transition-colors ${
              activeTab === 'insights'
                ? 'bg-slate-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
            onClick={() => setActiveTab('insights')}
          >
            Insights
          </button>
        </div>
      </header>

      {/* Filters (shared across tabs) */}
      <FilterBar data={data} />

      {activeTab === 'dashboard' && (
        <>
          {/* Metric Toggles (Dashboard only) */}
          <MetricToggles />

          {/* Charts */}
          <div className="px-4 py-4">
            <div className="bg-white p-4">
              <EfficiencyChart data={chartData} />
              <TimeBreakdownChart data={timeBreakdownData} hasMaterialFilter={hasMaterialFilter} />
            </div>
          </div>

          {/* Data Table */}
          <div className="px-4 pb-4">
            <DataTable data={chartData} />
          </div>
        </>
      )}

      {activeTab === 'insights' && (
        <InsightsTable data={insightsData} />
      )}
    </div>
  );
}

export default App;
