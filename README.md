# Rate Review Dashboard

Manufacturing performance dashboard for analyzing production efficiency, asset utilization, and plan attainment across plants, resources, and materials.

## Overview

The dashboard ingests an Excel workbook (`Rate Review Dashboard Query.xlsx`) containing three data sheets — Efficiency-AI, Attainment, and Capacity — and provides two views:

- **Dashboard tab** — Time-phased charts (weekly / Nestle 4-4-5 month / quarterly) with efficiency trends, time breakdown, and a sortable data table
- **Insights tab** — Aggregate KPIs in an expandable Plant → Resource → Material hierarchy for identifying lines and materials needing attention

## Key Features

### Filtering & Cross-Filtering
- Multi-select filters for Plant, Resource, Material Type, and Material
- Cross-filtering: each dimension's options update based on other active selections
- Date range picker (start/end ISO week)
- FERT Lines Only toggle — restricts all dropdowns and data to resources with at least one FERT material
- All filters are shared between Dashboard and Insights tabs

### Dashboard Tab
- **Efficiency Chart** — Expected vs. actual efficiency with shaded deviation regions (green = outperforming, red = underperforming), optional overlays for AI, APP, PPA, and production rates (nominal/plan/actual)
- **Auto-scaling Y-axes** — All chart axes automatically zoom to the data range with padding, making tight value clusters easy to read
- **Time Breakdown Chart** — Stacked bars showing Good Production Time, Unplanned Stoppages, Planned Stoppages, and Idle Time (idle excluded when material filter is active)
- **Data Table** — Sortable table with all period-level metrics
- Synchronized hover/cursor between charts
- Time scope toggle: Week / Month (Nestle 4-4-5) / Quarter

### Insights Tab
- Hierarchical drill-down: Plant → Resource → Material (sorted by plant code)
- Metrics at each level: Expected Efficiency, Actual Efficiency, Efficiency Difference, PPA, APP, Planned Qty, Actual Qty
- Plant/Resource levels additionally show: Asset Intensity (AI), Planned Stops %, Machine Policy
- **Efficiency Difference Threshold Filter** — filter resources where eff. diff. is below X pp OR above Y pp to quickly find problem or outperforming lines; matching plants auto-expand with a count summary
- Machine Policy derived from capacity data via substring-matching join (`capacity.resName` contains `efficiency.workCenterCode`)
- Color-coded efficiency difference (green positive, red negative) and actual efficiency (red when below expected)

## Metrics

| Metric | Formula |
|--------|---------|
| Expected Efficiency | `(Sum targetHours / Sum expectedNPH) x 100` |
| Actual Efficiency | `(Sum targetHours / Sum actualNPH) x 100` |
| Efficiency Difference | `Actual Efficiency - Expected Efficiency` (pp) |
| PPA (Planned Production Attainment) | `(Sum actProdQty / Sum appPlanProdQty) x 100` |
| APP (Adherence to Production Plan) | `(1 - Sum appAbsPlanActual / Sum appPlanProdQty) x 100` |
| Asset Intensity (AI) | `(Sum GPT / (Sum GPT + Sum UPS + Sum PS)) x 100` |
| Planned Stops % | `(Sum PS / (Sum GPT + Sum UPS + Sum PS)) x 100` |
| Machine Policy | `1 - (Sum sumTotMaxLoad / Sum sumTotAvail)` |
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
│   ├── InsightsTable.tsx           Expandable hierarchy table with threshold filter
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
│   └── timeUtils.ts                ISO week, Nestle 4-4-5 calendar, period helpers
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
