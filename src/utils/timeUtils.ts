// Parse "2025.02" → { year: 2025, week: 2 }
export function parseYearWeek(yw: string): { year: number; week: number } | null {
  if (!yw || typeof yw !== 'string') return null;
  const parts = yw.split('.');
  if (parts.length !== 2) return null;
  const year = parseInt(parts[0], 10);
  const week = parseInt(parts[1], 10);
  if (isNaN(year) || isNaN(week)) return null;
  return { year, week };
}

// Format back to "2025.02"
export function formatYearWeek(year: number, week: number): string {
  return `${year}.${String(week).padStart(2, '0')}`;
}

// Sort key for year-week: "2025.02" → "202502"
export function yearWeekSortKey(yw: string): string {
  const parsed = parseYearWeek(yw);
  if (!parsed) return yw;
  return `${parsed.year}${String(parsed.week).padStart(2, '0')}`;
}

// Nestlé 4-4-5 calendar: map ISO week to Nestlé month (1-12)
const NESTLE_MONTH_RANGES: [number, number][] = [
  [1, 4],   // NM01
  [5, 8],   // NM02
  [9, 13],  // NM03
  [14, 17], // NM04
  [18, 21], // NM05
  [22, 26], // NM06
  [27, 30], // NM07
  [31, 34], // NM08
  [35, 39], // NM09
  [40, 43], // NM10
  [44, 47], // NM11
  [48, 52], // NM12
];

export function weekToNestleMonth(week: number): number {
  for (let i = 0; i < NESTLE_MONTH_RANGES.length; i++) {
    const [start, end] = NESTLE_MONTH_RANGES[i];
    if (week >= start && week <= end) return i + 1;
  }
  // Week 53 falls into month 12
  return 12;
}

export function weekToQuarter(week: number): number {
  if (week <= 13) return 1;
  if (week <= 26) return 2;
  if (week <= 39) return 3;
  return 4;
}

// Get period key for aggregation based on time scope
export function getPeriodKey(yearWeek: string, scope: 'week' | 'month' | 'quarter'): string | null {
  const parsed = parseYearWeek(yearWeek);
  if (!parsed) return null;

  switch (scope) {
    case 'week':
      return yearWeek;
    case 'month': {
      const nm = weekToNestleMonth(parsed.week);
      return `${parsed.year}.NM${String(nm).padStart(2, '0')}`;
    }
    case 'quarter': {
      const q = weekToQuarter(parsed.week);
      return `${parsed.year}.Q${q}`;
    }
  }
}

// Sort key for any period
export function periodSortKey(period: string): string {
  // Week: "2025.02" → "2025.02"
  // Month: "2025.NM01" → "2025.01"
  // Quarter: "2025.Q1" → "2025.Q1"
  if (period.includes('NM')) {
    return period.replace('NM', '');
  }
  return period;
}

// Display label for period
export function periodLabel(period: string): string {
  if (period.includes('NM')) {
    // "2025.NM01" → "NM01.2025"
    const [year, nm] = period.split('.');
    return `${nm}.${year}`;
  }
  if (period.includes('Q')) {
    // "2025.Q1" → "Q1.2025"
    const [year, q] = period.split('.');
    return `${q}.${year}`;
  }
  // Week: "2025.02" → "02.2025"
  const [year, week] = period.split('.');
  return `${week}.${year}`;
}

// Compare two year-week strings for sorting
export function compareYearWeek(a: string, b: string): number {
  return yearWeekSortKey(a).localeCompare(yearWeekSortKey(b));
}

// Get all unique year-weeks from data sorted
export function getYearWeekRange(yearWeeks: string[]): [string, string] {
  const sorted = [...new Set(yearWeeks)].sort(compareYearWeek);
  return [sorted[0] || '', sorted[sorted.length - 1] || ''];
}

// Check if yearWeek is within range [start, end] inclusive
export function isInRange(yearWeek: string, start: string, end: string): boolean {
  const sk = yearWeekSortKey(yearWeek);
  return sk >= yearWeekSortKey(start) && sk <= yearWeekSortKey(end);
}
