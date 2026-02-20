# Rate Review Dashboard

Manufacturing performance dashboard for analyzing production efficiency, asset utilization, and plan attainment across plants, resources, and materials.

## Overview

The dashboard ingests an Excel workbook (`Rate Review Dashboard Query.xlsx`) containing three data sheets — Efficiency-AI, Attainment, and Capacity — and provides two views:

- **Dashboard tab** — Time-phased charts (weekly / Nestlé 4-4-5 month / quarterly) with efficiency trends, time breakdown, and a sortable data table
- **Insights tab** — Aggregate KPIs in an expandable Plant → Resource → Material hierarchy for identifying lines and materials needing attention

## Key Features

### Filtering & Cross-Filtering
- Multi-select filters for Plant, Resource, Material Type, and Material
- Cross-filtering: each dimension's options update based on other active selections
- Date range picker (start/end ISO week)
- FERT Lines Only toggle — restricts to production resources with at least one FERT material

### Dashboard Tab
- **Efficiency Chart** — Expected vs. actual efficiency with shaded deviation regions (green = outperforming, red = underperforming), optional overlays for AI, APP, PPA, and production rates (nominal/plan/actual)
- **Time Breakdown Chart** — Stacked bars showing Good Production Time, Unplanned Stoppages, Planned Stoppages, and Idle Time (idle excluded when material filter is active)
- **Data Table** — Sortable table with all period-level metrics
- Synchronized hover/cursor between charts
- Time scope toggle: Week / Month (Nestlé 4-4-5) / Quarter

### Insights Tab
- Hierarchical drill-down: Plant → Resource → Material
- Metrics at each level: Expected Efficiency, Actual Efficiency, Efficiency Difference, PPA, APP, Planned Qty, Actual Qty
- Plant/Resource levels additionally show: Asset Intensity (AI), Planned Stops %, Machine Policy
- Machine Policy derived from capacity data via substring-matching join (`capacity.resName` contains `efficiency.workCenterCode`)
- Color-coded efficiency difference (green positive, red negative) and actual efficiency (red when below expected)

## Metrics

| Metric | Formula |
|--------|---------|
| Expected Efficiency | `(Σ targetHours / Σ expectedNPH) × 100` |
| Actual Efficiency | `(Σ targetHours / Σ actualNPH) × 100` |
| Efficiency Difference | `Actual Efficiency - Expected Efficiency` (pp) |
| PPA (Planned Production Attainment) | `(Σ actProdQty / Σ appPlanProdQty) × 100` |
| APP (Adherence to Production Plan) | `(1 - Σ appAbsPlanActual / Σ appPlanProdQty) × 100` |
| Asset Intensity (AI) | `(Σ GPT / (Σ GPT + Σ UPS + Σ PS)) × 100` |
| Planned Stops % | `(Σ PS / (Σ GPT + Σ UPS + Σ PS)) × 100` |
| Machine Policy | `1 - (Σ sumTotMaxLoad / Σ sumTotAvail)` |
| Production Rates | Nominal, Plan, Actual (units/hr via nominal speed weighted by hours) |

## Tech Stack

- **React 19** + **TypeScript 5.9**
- **Vite 7** (build tooling)
- **Tailwind CSS 4** (styling)
- **Recharts 3** (charting)
- **Zustand 5** (state management)
- **SheetJS (xlsx)** (Excel parsing)

## Project Structure

```
src/
├── App.tsx                          Main app — tab navigation, layout
├── components/
│   ├── DataTable.tsx               Sortable period-level data table
│   ├── EfficiencyChart.tsx         Composed chart with efficiency + overlays
│   ├── TimeBreakdownChart.tsx      Stacked bar chart for time allocation
│   ├── FilterBar.tsx               Multi-select filters + date range + time scope
│   ├── InsightsTable.tsx           Expandable hierarchy table (Plant→Resource→Material)
│   ├── MetricToggles.tsx           Checkbox toggles for chart overlays
│   └── MultiSelect.tsx             Reusable multi-select dropdown
├── hooks/
│   ├── useExcelData.ts             Loads and parses Excel workbook
│   ├── useFilteredRows.ts          Shared filtering pipeline (used by both tabs)
│   ├── useFilteredData.ts          Filtered + aggregated chart data (Dashboard)
│   └── useInsightsData.ts          Hierarchical aggregation (Insights)
├── store/
│   └── useFilterStore.ts           Zustand store for filters + UI state
├── utils/
│   ├── excelParser.ts              XLSX sheet parsing logic
│   ├── dataTransforms.ts           Period aggregation, cross-filtering
│   └── timeUtils.ts                ISO week, Nestlé 4-4-5 calendar, period helpers
└── types/
    └── data.ts                     All TypeScript interfaces
```

## Getting Started

```bash
npm install
npm run dev
```

Place the Excel data file at `public/data/Rate Review Dashboard Query.xlsx`.

## Data Requirements

The Excel workbook must contain three sheets:

1. **Efficiency-AI** — Plant, work center, year-week, material, target hours, NPH, time components, production quantities
2. **Attainment** — Plant, work center, year-week, material, planned vs. actual production quantities
3. **Capacity** — Plant, resource name, available hours, max load (used for Machine Policy calculation)

Each sheet expects headers in row 3 with data starting from row 4.
