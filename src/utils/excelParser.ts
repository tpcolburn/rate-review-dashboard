import * as XLSX from 'xlsx';
import type { EfficiencyRow, AttainmentRow, CapacityRow, ParsedData } from '../types/data';

function num(val: unknown): number {
  if (val === null || val === undefined || val === '') return 0;
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

function str(val: unknown): string | null {
  if (val === null || val === undefined || val === '') return null;
  return String(val);
}

function parseEfficiencySheet(ws: XLSX.WorkSheet): EfficiencyRow[] {
  const raw = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 });
  // Row 0: title, Row 1: blank, Row 2: headers, Row 3+: data
  const rows: EfficiencyRow[] = [];

  for (let i = 3; i < raw.length; i++) {
    const r = raw[i] as unknown[];
    if (!r || !r[0]) continue;

    // Skip rows without yearWeek
    const yearWeek = str(r[4]);
    if (!yearWeek) continue;

    rows.push({
      plantCode: String(r[0]),
      plantName: String(r[1] || ''),
      workCenterCode: String(r[2] || ''),
      workCenterName: String(r[3] || ''),
      yearWeek,
      materialType: str(r[5]),
      materialDesc: str(r[6]),
      targetHours: num(r[7]),
      // Skip format string columns (indices 8, 10, 12, 14, 16, 18, 20, 22)
      actualNPH: num(r[9]),
      expectedNPH: num(r[11]),
      nominalSpeed: num(r[13]),
      goodProductionTime: num(r[15]),
      unplannedStoppages: num(r[17]),
      plannedStoppages: num(r[19]),
      actProdQty: num(r[21]),
    });
  }

  return rows;
}

function parseAttainmentSheet(ws: XLSX.WorkSheet): AttainmentRow[] {
  const raw = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 });
  const rows: AttainmentRow[] = [];

  for (let i = 3; i < raw.length; i++) {
    const r = raw[i] as unknown[];
    if (!r || !r[0]) continue;

    const yearWeek = str(r[4]);
    if (!yearWeek) continue;

    rows.push({
      plantCode: String(r[0]),
      plantName: String(r[1] || ''),
      workCenterCode: str(r[2]),
      workCenterName: str(r[3]),
      yearWeek,
      materialType: str(r[5]),
      materialDesc: str(r[6]),
      actProdQty: num(r[7]),
      // Skip format strings at 8, 10, 12, 14, 16
      appPlanProdQty: num(r[9]),
      appAbsPlanActual: num(r[11]),
      msaPlanProdQty: num(r[13]),
      msaAbsPlanActual: num(r[15]),
    });
  }

  return rows;
}

function parseCapacitySheet(ws: XLSX.WorkSheet): CapacityRow[] {
  const raw = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 });
  const rows: CapacityRow[] = [];

  for (let i = 3; i < raw.length; i++) {
    const r = raw[i] as unknown[];
    if (!r || !r[0]) continue;

    rows.push({
      plant: String(r[0]),
      plantId: String(r[1] || ''),
      resName: String(r[2] || ''),
      ompTechnicalName: str(r[3]),
      snapshotWeek: str(r[4]),
      sapCalendarYearWeek: r[5] != null ? Number(r[5]) : null,
      sumMaxCapacity: num(r[6]),
      sumTotAvail: num(r[7]),
      sumTotMaxLoad: num(r[8]),
    });
  }

  return rows;
}

export async function parseExcelFile(url: string): Promise<ParsedData> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const wb = XLSX.read(arrayBuffer, { type: 'array' });

  const efficiency = parseEfficiencySheet(wb.Sheets['Efficiency-AI']);
  const attainment = parseAttainmentSheet(wb.Sheets['Attainment']);
  const capacity = parseCapacitySheet(wb.Sheets['Capacity']);

  return { efficiency, attainment, capacity };
}
