import { useState, useMemo } from 'react';
import type { ChartDataPoint } from '../types/data';

interface DataTableProps {
  data: ChartDataPoint[];
}

type SortField = keyof ChartDataPoint;
type SortDir = 'asc' | 'desc';

const COLUMNS: { key: SortField; label: string; format?: (v: unknown) => string }[] = [
  { key: 'period', label: 'Period' },
  {
    key: 'expectedEfficiency',
    label: 'Expected Eff.',
    format: (v) => (v != null ? `${(v as number).toFixed(1)}%` : '—'),
  },
  {
    key: 'actualEfficiency',
    label: 'Actual Eff.',
    format: (v) => (v != null ? `${(v as number).toFixed(1)}%` : '—'),
  },
  {
    key: 'deviation',
    label: 'Deviation',
    format: (v) => {
      if (v == null) return '—';
      const n = v as number;
      return `${n >= 0 ? '+' : ''}${n.toFixed(1)} pp`;
    },
  },
  {
    key: 'ai',
    label: 'AI %',
    format: (v) => (v != null ? `${(v as number).toFixed(1)}%` : '—'),
  },
  {
    key: 'ppa',
    label: 'PPA %',
    format: (v) => (v != null ? `${(v as number).toFixed(1)}%` : '—'),
  },
  {
    key: 'targetHours',
    label: 'Target Hours',
    format: (v) => (v as number).toLocaleString(undefined, { maximumFractionDigits: 1 }),
  },
  {
    key: 'actualNPH',
    label: 'Actual NPH',
    format: (v) => (v as number).toLocaleString(undefined, { maximumFractionDigits: 1 }),
  },
  {
    key: 'expectedNPH',
    label: 'Expected NPH',
    format: (v) => (v as number).toLocaleString(undefined, { maximumFractionDigits: 1 }),
  },
  {
    key: 'actProdQty',
    label: 'Act. Prod Qty',
    format: (v) => (v as number).toLocaleString(),
  },
];

export function DataTable({ data }: DataTableProps) {
  const [sortField, setSortField] = useState<SortField>('sortKey');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      const av = a[sortField];
      const bv = b[sortField];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  if (data.length === 0) return null;

  return (
    <div className="bg-white border-t border-gray-200 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-700 text-white">
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
                className="px-3 py-2 text-left font-medium cursor-pointer hover:bg-slate-600 whitespace-nowrap select-none"
              >
                {col.label}
                {sortField === col.key && (
                  <span className="ml-1">{sortDir === 'asc' ? '▲' : '▼'}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr
              key={row.period}
              className={`border-b border-gray-100 ${
                i % 2 === 0 ? 'bg-white' : 'bg-gray-50'
              } hover:bg-blue-50`}
            >
              {COLUMNS.map((col) => {
                const val = row[col.key];
                const isDeviation = col.key === 'deviation' && val != null;
                return (
                  <td
                    key={col.key}
                    className={`px-3 py-1.5 whitespace-nowrap ${
                      isDeviation
                        ? (val as number) >= 0
                          ? 'text-green-600 font-medium'
                          : 'text-red-600 font-medium'
                        : 'text-gray-700'
                    }`}
                  >
                    {col.format ? col.format(val) : String(val ?? '—')}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
