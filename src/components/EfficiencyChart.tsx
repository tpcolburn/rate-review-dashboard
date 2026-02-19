import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Label,
} from 'recharts';
import type { ChartDataPoint } from '../types/data';
import { useFilterStore } from '../store/useFilterStore';

interface EfficiencyChartProps {
  data: ChartDataPoint[];
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white border border-gray-200 rounded shadow-lg p-3 text-sm">
      <p className="font-medium text-gray-900 mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }} className="leading-relaxed">
          {entry.name}: <span className="font-medium">{entry.value?.toFixed(1)}%</span>
        </p>
      ))}
    </div>
  );
}

function makeDeviationLabel(chartData: ChartDataPoint[]) {
  return function DeviationLabel(props: {
    x?: number;
    y?: number;
    index?: number;
  }) {
    const { x, y, index } = props;
    if (x === undefined || y === undefined || index === undefined) return null;
    const deviation = chartData[index]?.deviation;
    if (deviation === null || deviation === undefined) return null;
    // Only show label if there are few enough points or deviation is significant
    if (chartData.length > 20 && Math.abs(deviation) < 5) return null;
    const isPositive = deviation >= 0;
    return (
      <text
        x={x}
        y={isPositive ? y - 10 : y + 16}
        textAnchor="middle"
        fill={isPositive ? '#16a34a' : '#dc2626'}
        fontSize={10}
        fontWeight={500}
      >
        {isPositive ? '+' : ''}
        {deviation.toFixed(1)}
      </text>
    );
  };
}

export function EfficiencyChart({ data }: EfficiencyChartProps) {
  const { visibleMetrics } = useFilterStore();
  const DeviationLabel = makeDeviationLabel(data);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-gray-400">
        No data available for the selected filters.
      </div>
    );
  }

  return (
    <div className="bg-white p-4">
      <ResponsiveContainer width="100%" height={420}>
        <ComposedChart data={data} margin={{ top: 20, right: 60, bottom: 20, left: 20 }}>
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
            domain={[0, 'auto']}
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickFormatter={(v: number) => `${v}%`}
          >
            <Label
              value="Efficiency %"
              angle={-90}
              position="insideLeft"
              style={{ textAnchor: 'middle', fill: '#6b7280', fontSize: 12 }}
            />
          </YAxis>

          {(visibleMetrics.ai || visibleMetrics.ppa) && (
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 'auto']}
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickFormatter={(v: number) => `${v}%`}
            >
              <Label
                value="AI / PPA %"
                angle={90}
                position="insideRight"
                style={{ textAnchor: 'middle', fill: '#6b7280', fontSize: 12 }}
              />
            </YAxis>
          )}

          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            height={36}
            wrapperStyle={{ fontSize: 12 }}
          />

          <ReferenceLine yAxisId="left" y={100} stroke="#9ca3af" strokeDasharray="3 3" />

          {/* Expected Line Efficiency - dashed */}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="expectedEfficiency"
            name="Expected Line Efficiency"
            stroke="#1e3a5f"
            strokeWidth={2}
            strokeDasharray="8 4"
            dot={false}
            connectNulls
          />

          {/* Actual Line Efficiency - solid */}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="actualEfficiency"
            name="Actual Line Efficiency"
            stroke="#2563eb"
            strokeWidth={2}
            dot={{ r: 3, fill: '#2563eb' }}
            connectNulls
            label={<DeviationLabel />}
          />

          {/* AI - Availability Index */}
          {visibleMetrics.ai && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="ai"
              name="AI (Availability Index)"
              stroke="#059669"
              strokeWidth={1.5}
              strokeDasharray="4 2"
              dot={false}
              connectNulls
            />
          )}

          {/* PPA - Planned Production Attainment */}
          {visibleMetrics.ppa && (
            <Bar
              yAxisId="right"
              dataKey="ppa"
              name="PPA (Plan Attainment)"
              fill="#f59e0b"
              fillOpacity={0.3}
              stroke="#f59e0b"
              strokeWidth={1}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
