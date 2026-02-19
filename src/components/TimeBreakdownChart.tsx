import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Label,
} from 'recharts';
import type { TimeBreakdownDataPoint } from '../types/data';

interface TimeBreakdownChartProps {
  data: TimeBreakdownDataPoint[];
  hasMaterialFilter: boolean;
}

const COLORS = {
  goodProductionTime: '#22c55e',
  unplannedStoppages: '#ef4444',
  plannedStoppages: '#f59e0b',
  idleTime: '#94a3b8',
};

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string; dataKey: string; payload: TimeBreakdownDataPoint }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const dataPoint = payload[0]?.payload;
  const total = dataPoint
    ? dataPoint.goodProductionTime + dataPoint.unplannedStoppages + dataPoint.plannedStoppages + dataPoint.idleTime
    : 0;

  const nameMap: Record<string, string> = {
    goodProductionTime: 'Good Production Time',
    unplannedStoppages: 'Unplanned Stoppages',
    plannedStoppages: 'Planned Stoppages',
    idleTime: 'Idle Time',
  };

  return (
    <div className="bg-white border border-gray-200 rounded shadow-lg p-3 text-sm">
      <p className="font-medium text-gray-900 mb-1">{label}</p>
      {dataPoint && (
        <p className="text-gray-500 text-xs mb-1">
          Total: {total.toFixed(1)}h (168h × {(dataPoint.totalAvailableHours / 168).toFixed(0)} resource-weeks)
        </p>
      )}
      {payload.map((entry) => {
        const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0.0';
        return (
          <p key={entry.dataKey} style={{ color: entry.color }} className="leading-relaxed">
            {nameMap[entry.dataKey] || entry.name}:{' '}
            <span className="font-medium">{entry.value.toFixed(1)}h</span>{' '}
            <span className="text-gray-400">({pct}%)</span>
          </p>
        );
      })}
    </div>
  );
}

export function TimeBreakdownChart({ data, hasMaterialFilter }: TimeBreakdownChartProps) {
  if (data.length === 0) {
    return null;
  }

  return (
    <div className="pt-2 border-t border-gray-100">
      <h3 className="text-sm font-medium text-gray-700 mb-1 px-1">Time Breakdown (Hours)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart syncId="dashboard" data={data} margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="period"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            interval={'preserveStartEnd'}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            yAxisId="left"
            width={60}
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickFormatter={(v: number) => `${v}h`}
          >
            <Label
              value="Hours"
              angle={-90}
              position="insideLeft"
              style={{ textAnchor: 'middle', fill: '#6b7280', fontSize: 12 }}
            />
          </YAxis>
          <YAxis
            yAxisId="right"
            orientation="right"
            width={60}
            tick={false}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            height={36}
            wrapperStyle={{ fontSize: 12 }}
          />

          <Bar
            yAxisId="left"
            dataKey="goodProductionTime"
            name="Good Production Time"
            stackId="time"
            fill={COLORS.goodProductionTime}
          />
          <Bar
            yAxisId="left"
            dataKey="unplannedStoppages"
            name="Unplanned Stoppages"
            stackId="time"
            fill={COLORS.unplannedStoppages}
          />
          <Bar
            yAxisId="left"
            dataKey="plannedStoppages"
            name="Planned Stoppages"
            stackId="time"
            fill={COLORS.plannedStoppages}
          />
          <Bar
            yAxisId="left"
            dataKey="idleTime"
            name="Idle Time"
            stackId="time"
            fill={COLORS.idleTime}
            hide={hasMaterialFilter}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
