# Rate Review Dashboard — User Guide

## Getting Started

Open the dashboard in your browser. It automatically loads the Excel data file and displays the **Dashboard** tab.

Use the **Dashboard** / **Insights** tabs in the top-right header to switch views. All filters carry over between tabs.

---

## Filters (top bar, shared across both tabs)

| Filter | What it does |
|--------|-------------|
| **Plant** | Select one or more plants. Other dropdowns update to show only matching resources/materials. |
| **Resource** | Select one or more work centers (production lines). |
| **Material Type** | Filter by material category (e.g., FERT, HALB). |
| **FERT Lines Only** | Checkbox — restricts everything to resources that produce at least one FERT material. Dropdowns update immediately. |
| **Material** | Filter to specific materials by description. |
| **Range** | Pick a start and end ISO week to limit the time window. |

Filters are **cross-filtered**: selecting a plant automatically narrows the Resource, Material Type, and Material dropdowns to only show options that exist within that plant.

---

## Dashboard Tab

### Metric Toggles

Below the filters, toggle which overlays appear on the chart:

- **Efficiency** — Expected (dashed) vs. Actual (solid) efficiency lines with green/red shaded regions showing where actual is above or below expected. Deviation labels appear on data points.
- **AI** — Asset Intensity line (% of time in good production).
- **PPA** — Planned Production Attainment bars.
- **APP** — Adherence to Production Plan line.
- **Production Rates** — Nominal, Plan, and Actual rates in units/hr.

### Time Scope

Switch between **ISO Week**, **Nestle Month** (4-4-5 calendar), or **ISO Quarter** to change the aggregation period.

### Efficiency Chart

- Y-axes automatically scale to your data range — no wasted whitespace when values are close together.
- Hover over any point to see a tooltip with all visible metrics for that period.
- The 100% reference line is shown when Efficiency is toggled on.

### Time Breakdown Chart

Stacked bars showing how time is allocated each period:
- **Green** — Good Production Time
- **Red** — Unplanned Stoppages
- **Amber** — Planned Stoppages
- **Gray** — Idle Time (hidden when a material filter is active, since idle time cannot be attributed to individual materials)

### Data Table

A sortable table below the charts. Click any column header to sort ascending/descending. Shows period-level values for efficiency, deviation, AI, PPA, hours, and production quantities.

---

## Insights Tab

### Hierarchical Drill-Down

A tree table organized as **Plant → Resource → Material**:

1. Click a **Plant** row to expand and see its resources (production lines).
2. Click a **Resource** row to expand and see its materials.
3. Plants are sorted by plant code.

### Columns

| Column | Plant | Resource | Material |
|--------|:-----:|:--------:|:--------:|
| Expected Efficiency | Y | Y | Y |
| Actual Efficiency | Y | Y | Y |
| Eff. Diff. (pp) | Y | Y | Y |
| PPA | Y | Y | Y |
| APP | Y | Y | Y |
| Planned Qty | Y | Y | Y |
| Actual Qty | Y | Y | Y |
| AI | Y | Y | -- |
| Planned Stops % | Y | Y | -- |
| Machine Policy | Y | where mapped | -- |

- **Actual Efficiency** turns red when it is below Expected Efficiency.
- **Eff. Diff.** is color-coded: green when positive (outperforming), red when negative (underperforming).
- **Machine Policy** shows "--" where capacity data cannot be matched to the resource.

### Efficiency Difference Threshold Filter

Above the table, use the threshold inputs to find problem lines:

- **"Lower than ___ pp"** — Show resources where efficiency difference is below this value (e.g., enter `-5` to find lines running more than 5 pp below expected).
- **"Higher than ___ pp"** — Show resources where efficiency difference is above this value (e.g., enter `10` to find lines significantly outperforming).
- Use one or both. They combine with OR logic.
- When active, plants auto-expand and a summary shows how many resources matched across how many plants.
- Click **Clear** to reset.

### Typical Workflow

1. Set your date range and plant filters.
2. Check **FERT Lines Only** to focus on finished-goods production lines.
3. Switch to the **Insights** tab.
4. Enter a lower threshold (e.g., `-5`) to surface underperforming resources.
5. Expand a flagged resource to see which materials are dragging efficiency down.
6. Switch to the **Dashboard** tab with that resource selected to see the trend over time.

---

## Refreshing the Data

The dashboard loads its data from a single Excel file on startup. To update the data:

1. Export a fresh copy of the workbook from your source system.
2. Name it exactly **`Rate Review Dashboard Query.xlsx`**.
3. Place it in the `public/data/` folder inside the project directory, replacing the existing file:
   ```
   rate-review-dashboard/
   └── public/
       └── data/
           └── Rate Review Dashboard Query.xlsx   <-- replace this file
   ```
4. **If running the dev server** (`npm run dev`): simply refresh your browser (F5). The dashboard reloads the file on every page load.
5. **If running a production build**: rebuild with `npm run build`, then serve the `dist/` folder. The new data file must be copied into `dist/data/` (or rebuild so Vite copies it from `public/`).

There is no upload button or import step — the dashboard reads the file automatically on load.

---

## Source Data Format

The Excel workbook must contain exactly three sheets, named and structured as described below. Each sheet uses the same layout convention:

- **Row 1** — Title (ignored)
- **Row 2** — Blank (ignored)
- **Row 3** — Column headers (ignored, but columns must be in the correct order)
- **Row 4+** — Data rows

Rows missing a value in the first column are skipped. Rows missing a year-week value are skipped.

### Sheet 1: "Efficiency-AI"

| Column | Index | Field | Type | Description |
|--------|:-----:|-------|------|-------------|
| A | 0 | Plant Code | text | e.g. `DE05` |
| B | 1 | Plant Name | text | e.g. `Frankfurt Factory` |
| C | 2 | Work Center Code | text | e.g. `S05` |
| D | 3 | Work Center Name | text | e.g. `Packaging Line 5` |
| E | 4 | Year-Week | text | ISO format `YYYY.WW` (e.g. `2025.02`) |
| F | 5 | Material Type | text | e.g. `FERT`, `HALB`, or blank |
| G | 6 | Material Description | text | Free text, or blank |
| H | 7 | Target Hours | number | Standard production hours |
| I | 8 | _(format string)_ | -- | _Skipped_ |
| J | 9 | Actual NPH | number | Actual non-productive hours |
| K | 10 | _(format string)_ | -- | _Skipped_ |
| L | 11 | Expected NPH | number | Expected non-productive hours |
| M | 12 | _(format string)_ | -- | _Skipped_ |
| N | 13 | Nominal Speed | number | Units per hour at standard rate |
| O | 14 | _(format string)_ | -- | _Skipped_ |
| P | 15 | Good Production Time | number | Hours of good production |
| Q | 16 | _(format string)_ | -- | _Skipped_ |
| R | 17 | Unplanned Stoppages | number | Hours of unplanned stops |
| S | 18 | _(format string)_ | -- | _Skipped_ |
| T | 19 | Planned Stoppages | number | Hours of planned stops |
| U | 20 | _(format string)_ | -- | _Skipped_ |
| V | 21 | Actual Production Qty | number | Units produced |

**Note:** Even-indexed columns after index 7 (I, K, M, O, Q, S, U) contain format strings from the source system and are ignored by the parser. The dashboard reads data from odd-indexed columns (H, J, L, N, P, R, T, V).

### Sheet 2: "Attainment"

| Column | Index | Field | Type | Description |
|--------|:-----:|-------|------|-------------|
| A | 0 | Plant Code | text | Must match Efficiency-AI plant codes |
| B | 1 | Plant Name | text | |
| C | 2 | Work Center Code | text | May be blank (plant-level aggregates) |
| D | 3 | Work Center Name | text | May be blank |
| E | 4 | Year-Week | text | ISO format `YYYY.WW` |
| F | 5 | Material Type | text | |
| G | 6 | Material Description | text | |
| H | 7 | Actual Production Qty | number | Units produced |
| I | 8 | _(format string)_ | -- | _Skipped_ |
| J | 9 | APP Plan Production Qty | number | Planned qty for APP metric |
| K | 10 | _(format string)_ | -- | _Skipped_ |
| L | 11 | APP Abs Plan vs Actual | number | Absolute deviation from plan |
| M | 12 | _(format string)_ | -- | _Skipped_ |
| N | 13 | MSA Plan Production Qty | number | _(parsed but not displayed)_ |
| O | 14 | _(format string)_ | -- | _Skipped_ |
| P | 15 | MSA Abs Plan vs Actual | number | _(parsed but not displayed)_ |

### Sheet 3: "Capacity"

| Column | Index | Field | Type | Description |
|--------|:-----:|-------|------|-------------|
| A | 0 | Plant | text | Plant name |
| B | 1 | Plant ID | text | Must match `plantCode` from Efficiency-AI |
| C | 2 | Resource Name | text | e.g. `WS05_5004_008` — matched to work centers via substring |
| D | 3 | OMP Technical Name | text | Alternative name used for substring matching, or blank |
| E | 4 | Snapshot Week | text | _(parsed but not used for calculations)_ |
| F | 5 | SAP Calendar Year-Week | number | _(parsed but not used for calculations)_ |
| G | 6 | Sum Max Capacity | number | _(parsed but not used for calculations)_ |
| H | 7 | Sum Total Available | number | Total available hours for Machine Policy denominator |
| I | 8 | Sum Total Max Load | number | Total max load hours for Machine Policy numerator |

### Key Data Rules

- **Plant codes must match** between all three sheets (e.g. `DE05` in Efficiency-AI = `DE05` in Capacity's Plant ID column).
- **Year-Week format** must be `YYYY.WW` with leading zero for weeks 1-9 (e.g. `2025.02`, not `2025.2`).
- **Capacity-to-Resource matching** is done by substring: the dashboard checks if the Resource Name or OMP Technical Name *contains* the Work Center Code. For example, `WS05_5004_008` contains `S05`, so it maps to work center `S05`. Multiple capacity rows can map to one work center — their hours are summed.
- **Blank numeric cells** are treated as zero.
- **Blank text cells** (Material Type, Material Description, Work Center on Attainment) are allowed and treated as null.
