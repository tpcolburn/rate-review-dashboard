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
