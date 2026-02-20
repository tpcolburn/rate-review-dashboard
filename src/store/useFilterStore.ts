import { create } from 'zustand';
import type { TimeScope, FilterOptions } from '../types/data';

interface FilterStore {
  selectedPlants: string[];
  selectedResources: string[];
  selectedMaterialTypes: string[];
  selectedMaterials: string[];
  fertLinesOnly: boolean;
  timeScope: TimeScope;
  dateRange: [string, string];
  visibleMetrics: { efficiency: boolean; ai: boolean; ppa: boolean; app: boolean; rates: boolean };

  setPlants: (plants: string[]) => void;
  setResources: (resources: string[]) => void;
  setMaterialTypes: (types: string[]) => void;
  setMaterials: (materials: string[]) => void;
  setFertLinesOnly: (value: boolean) => void;
  setTimeScope: (scope: TimeScope) => void;
  setDateRange: (range: [string, string]) => void;
  toggleMetric: (metric: 'efficiency' | 'ai' | 'ppa' | 'app' | 'rates') => void;
  pruneInvalidSelections: (options: FilterOptions) => void;
}

export const useFilterStore = create<FilterStore>((set) => ({
  selectedPlants: [],
  selectedResources: [],
  selectedMaterialTypes: [],
  selectedMaterials: [],
  fertLinesOnly: false,
  timeScope: 'week',
  dateRange: ['', ''],
  visibleMetrics: { efficiency: true, ai: false, ppa: false, app: false, rates: false },

  setPlants: (plants) => set({ selectedPlants: plants }),
  setResources: (resources) => set({ selectedResources: resources }),
  setMaterialTypes: (types) => set({ selectedMaterialTypes: types }),
  setMaterials: (materials) => set({ selectedMaterials: materials }),
  setFertLinesOnly: (value) => set({ fertLinesOnly: value }),

  setTimeScope: (scope) => set({ timeScope: scope }),
  setDateRange: (range) => set({ dateRange: range }),

  toggleMetric: (metric) =>
    set((state) => ({
      visibleMetrics: {
        ...state.visibleMetrics,
        [metric]: !state.visibleMetrics[metric],
      },
    })),

  pruneInvalidSelections: (options) =>
    set((state) => {
      const validPlantCodes = new Set(options.plants.map((p) => p.code));
      const validResourceCodes = new Set(options.resources.map((r) => r.code));
      const validMaterialTypes = new Set(options.materialTypes);
      const validMaterials = new Set(options.materials);

      const prunedPlants = state.selectedPlants.filter((p) => validPlantCodes.has(p));
      const prunedResources = state.selectedResources.filter((r) => validResourceCodes.has(r));
      const prunedMaterialTypes = state.selectedMaterialTypes.filter((t) => validMaterialTypes.has(t));
      const prunedMaterials = state.selectedMaterials.filter((m) => validMaterials.has(m));

      // Only update if something actually changed
      if (
        prunedPlants.length === state.selectedPlants.length &&
        prunedResources.length === state.selectedResources.length &&
        prunedMaterialTypes.length === state.selectedMaterialTypes.length &&
        prunedMaterials.length === state.selectedMaterials.length
      ) {
        return state;
      }

      return {
        selectedPlants: prunedPlants,
        selectedResources: prunedResources,
        selectedMaterialTypes: prunedMaterialTypes,
        selectedMaterials: prunedMaterials,
      };
    }),
}));
