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
  Customized,
} from 'recharts';
import type { ChartDataPoint } from '../types/data';
import { useFilterStore } from '../store/useFilterStore';

interface EfficiencyChartProps {
  data: ChartDataPoint[];
}

const RATE_KEYS = new Set(['nominalRate', 'planRate', 'actualRate']);

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string; dataKey?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white border border-gray-200 rounded shadow-lg p-3 text-sm">
      <p className="font-medium text-gray-900 mb-1">{label}</p>
      {payload.map((entry) => {
        const isRate = RATE_KEYS.has(entry.dataKey ?? '');
        return (
          <p key={entry.name} style={{ color: entry.color }} className="leading-relaxed">
            {entry.name}:{' '}
            <span className="font-medium">
              {isRate ? entry.value?.toLocaleString() : `${entry.value?.toFixed(1)}%`}
            </span>
          </p>
        );
      })}
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

// Renders shaded areas between expected and actual efficiency lines.
// Green where actual >= expected, red where actual < expected.
function ShadedRegions(props: Record<string, unknown>) {
  const { formattedGraphicalItems } = props as {
    formattedGraphicalItems?: Array<{
      item: { props: { dataKey: string } };
      props: { points: Array<{ x: number; y: number }> };
    }>;
  };

  if (!formattedGraphicalItems) return null;

  const expectedItem = formattedGraphicalItems.find(
    (item) => item.item.props.dataKey === 'expectedEfficiency'
  );
  const actualItem = formattedGraphicalItems.find(
    (item) => item.item.props.dataKey === 'actualEfficiency'
  );

  if (!expectedItem || !actualItem) return null;

  const expectedPts = expectedItem.props.points;
  const actualPts = actualItem.props.points;

  if (!expectedPts?.length || !actualPts?.length) return null;
  const len = Math.min(expectedPts.length, actualPts.length);
  if (len < 2) return null;

  const greenPaths: string[] = [];
  const redPaths: string[] = [];

  for (let i = 0; i < len - 1; i++) {
    const ex1 = expectedPts[i].x, ey1 = expectedPts[i].y;
    const ex2 = expectedPts[i + 1].x, ey2 = expectedPts[i + 1].y;
    const ax1 = actualPts[i].x, ay1 = actualPts[i].y;
    const ax2 = actualPts[i + 1].x, ay2 = actualPts[i + 1].y;

    // In SVG, lower y = higher on screen. actual "above" expected means ay < ey.
    const diff1 = ey1 - ay1; // positive = actual above expected (green)
    const diff2 = ey2 - ay2;

    if (diff1 >= 0 && diff2 >= 0) {
      // Entire segment: actual >= expected → green
      greenPaths.push(
        `M${ax1},${ay1} L${ax2},${ay2} L${ex2},${ey2} L${ex1},${ey1} Z`
      );
    } else if (diff1 <= 0 && diff2 <= 0) {
      // Entire segment: actual < expected → red
      redPaths.push(
        `M${ax1},${ay1} L${ax2},${ay2} L${ex2},${ey2} L${ex1},${ey1} Z`
      );
    } else {
      // Lines cross — find intersection
      const t = diff1 / (diff1 - diff2);
      const cx = ex1 + t * (ex2 - ex1);
      const cy = ey1 + t * (ey2 - ey1);

      if (diff1 > 0) {
        // First half green, second half red
        greenPaths.push(
          `M${ax1},${ay1} L${cx},${cy} L${ex1},${ey1} Z`
        );
        redPaths.push(
          `M${cx},${cy} L${ax2},${ay2} L${ex2},${ey2} Z`
        );
      } else {
        // First half red, second half green
        redPaths.push(
          `M${ax1},${ay1} L${cx},${cy} L${ex1},${ey1} Z`
        );
        greenPaths.push(
          `M${cx},${cy} L${ax2},${ay2} L${ex2},${ey2} Z`
        );
      }
    }
  }

  return (
    <g>
      {greenPaths.map((d, i) => (
        <path key={`g${i}`} d={d} fill="#22c55e" fillOpacity={0.18} stroke="none" />
      ))}
      {redPaths.map((d, i) => (
        <path key={`r${i}`} d={d} fill="#ef4444" fillOpacity={0.18} stroke="none" />
      ))}
    </g>
  );
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

  const showEfficiency = visibleMetrics.efficiency;
  const showRightAxis = visibleMetrics.ai || visibleMetrics.ppa || visibleMetrics.app;
  const showRates = visibleMetrics.rates;

  return (
    <div>
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart syncId="dashboard" data={data} margin={{ top: 20, right: 20, bottom: 0, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="period"
            tick={false}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
            height={5}
          />
          <YAxis
            yAxisId="left"
            width={60}
            domain={[0, 'auto']}
            tick={showEfficiency ? { fontSize: 11, fill: '#6b7280' } : false}
            tickFormatter={(v: number) => `${v}%`}
            axisLine={showEfficiency}
            tickLine={showEfficiency}
          >
            {showEfficiency && (
              <Label
                value="Efficiency %"
                angle={-90}
                position="insideLeft"
                style={{ textAnchor: 'middle', fill: '#6b7280', fontSize: 12 }}
              />
            )}
          </YAxis>

          <YAxis
            yAxisId="right"
            orientation="right"
            width={60}
            domain={[0, 'auto']}
            tick={showRightAxis ? { fontSize: 11, fill: '#6b7280' } : false}
            tickFormatter={(v: number) => `${v}%`}
            axisLine={showRightAxis}
            tickLine={showRightAxis}
          >
            {showRightAxis && (
              <Label
                value="AI / PPA / APP %"
                angle={90}
                position="insideRight"
                style={{ textAnchor: 'middle', fill: '#6b7280', fontSize: 12 }}
              />
            )}
          </YAxis>

          <YAxis
            yAxisId="rates"
            orientation="right"
            width={60}
            domain={[0, 'auto']}
            tick={showRates ? { fontSize: 11, fill: '#6b7280' } : false}
            tickFormatter={(v: number) => v.toLocaleString()}
            axisLine={showRates}
            tickLine={showRates}
          >
            {showRates && (
              <Label
                value="Rate (units/hr)"
                angle={90}
                position="insideRight"
                style={{ textAnchor: 'middle', fill: '#6b7280', fontSize: 12 }}
              />
            )}
          </YAxis>

          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            height={36}
            wrapperStyle={{ fontSize: 12 }}
          />

          {showEfficiency && (
            <ReferenceLine yAxisId="left" y={100} stroke="#9ca3af" strokeDasharray="3 3" />
          )}

          {/* Shaded area between expected and actual */}
          {showEfficiency && <Customized component={ShadedRegions} />}

          {/* Expected Line Efficiency - dashed */}
          {showEfficiency && (
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
          )}

          {/* Actual Line Efficiency - solid */}
          {showEfficiency && (
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
          )}

          {/* AI - Asset Intensity */}
          {visibleMetrics.ai && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="ai"
              name="AI (Asset Intensity)"
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

          {/* APP - Adherence to Production Plan */}
          {visibleMetrics.app && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="app"
              name="APP (Adherence)"
              stroke="#7c3aed"
              strokeWidth={1.5}
              strokeDasharray="4 2"
              dot={false}
              connectNulls
            />
          )}

          {/* Production Rates */}
          {visibleMetrics.rates && (
            <>
              <Line
                yAxisId="rates"
                type="monotone"
                dataKey="nominalRate"
                name="Nominal Rate"
                stroke="#0ea5e9"
                strokeWidth={1.5}
                strokeDasharray="6 3"
                dot={false}
                connectNulls
              />
              <Line
                yAxisId="rates"
                type="monotone"
                dataKey="planRate"
                name="Plan Rate"
                stroke="#8b5cf6"
                strokeWidth={1.5}
                strokeDasharray="4 2"
                dot={false}
                connectNulls
              />
              <Line
                yAxisId="rates"
                type="monotone"
                dataKey="actualRate"
                name="Actual Rate"
                stroke="#f97316"
                strokeWidth={1.5}
                dot={false}
                connectNulls
              />
            </>
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
