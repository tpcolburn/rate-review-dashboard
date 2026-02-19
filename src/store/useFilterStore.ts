import { create } from 'zustand';
import type { TimeScope } from '../types/data';

interface FilterStore {
  selectedPlant: string | null;
  selectedResource: string | null;
  selectedMaterial: string | null;
  timeScope: TimeScope;
  dateRange: [string, string]; // [start yearWeek, end yearWeek]
  visibleMetrics: { ai: boolean; ppa: boolean };

  setPlant: (plant: string | null) => void;
  setResource: (resource: string | null) => void;
  setMaterial: (material: string | null) => void;
  setTimeScope: (scope: TimeScope) => void;
  setDateRange: (range: [string, string]) => void;
  toggleMetric: (metric: 'ai' | 'ppa') => void;
}

export const useFilterStore = create<FilterStore>((set) => ({
  selectedPlant: null,
  selectedResource: null,
  selectedMaterial: null,
  timeScope: 'week',
  dateRange: ['', ''],
  visibleMetrics: { ai: false, ppa: false },

  setPlant: (plant) =>
    set({ selectedPlant: plant, selectedResource: null, selectedMaterial: null }),

  setResource: (resource) =>
    set({ selectedResource: resource, selectedMaterial: null }),

  setMaterial: (material) =>
    set({ selectedMaterial: material }),

  setTimeScope: (scope) =>
    set({ timeScope: scope }),

  setDateRange: (range) =>
    set({ dateRange: range }),

  toggleMetric: (metric) =>
    set((state) => ({
      visibleMetrics: {
        ...state.visibleMetrics,
        [metric]: !state.visibleMetrics[metric],
      },
    })),
}));
