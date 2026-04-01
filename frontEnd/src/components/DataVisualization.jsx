import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  ScatterChart, Scatter, Legend,
} from 'recharts'
import { BarChart3, TrendingUp, PieChart as PieIcon, ScatterChart as ScatterIcon, Table, LayoutGrid, ArrowRightLeft } from 'lucide-react'
import {
  analyzeTableData, detectChartType, getAvailableChartTypes,
  transformForChart, CHART_COLORS, GRADIENT_PAIRS,
} from '../utils/chartUtils'

const CHART_ICONS = {
  bar: BarChart3,
  horizontal_bar: ArrowRightLeft,
  line: TrendingUp,
  area: TrendingUp,
  pie: PieIcon,
  scatter: ScatterIcon,
  histogram: BarChart3,
  table: Table,
}

const CHART_LABELS = {
  bar: 'Bar',
  horizontal_bar: 'H-Bar',
  line: 'Line',
  area: 'Area',
  pie: 'Donut',
  scatter: 'Scatter',
  histogram: 'Histogram',
  table: 'Table',
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="chart-tooltip-item">
          <span className="chart-tooltip-dot" style={{ background: p.color || CHART_COLORS[i] }} />
          <span className="chart-tooltip-name">{p.name || p.dataKey}</span>
          <span className="chart-tooltip-value">{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
        </div>
      ))}
    </div>
  )
}

function renderPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) {
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 1.4
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  if (percent < 0.05) return null
  return (
    <text x={x} y={y} fill="#b2bec3" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12} fontFamily="Inter, sans-serif">
      {name} ({(percent * 100).toFixed(0)}%)
    </text>
  )
}

function KpiCard({ tableData, analysis }) {
  const value = tableData.rows[0]?.[analysis.numericCols[0]?.index ?? 0]
  const label = analysis.numericCols[0]?.name || tableData.columns[0]
  return (
    <motion.div
      className="kpi-card"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div className="kpi-value">{Number(value).toLocaleString()}</div>
      <div className="kpi-label">{label}</div>
    </motion.div>
  )
}

function DataTable({ tableData }) {
  if (!tableData?.columns?.length || !tableData?.rows?.length) return null
  return (
    <div className="result-table-scroll">
      <table className="result-table">
        <thead>
          <tr>
            {tableData.columns.map((col, i) => (
              <th key={i}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tableData.rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
const AXIS_STYLE = {
  tick: { fill: '#7a7a85', fontSize: 12, fontFamily: 'Inter, sans-serif' },
  axisLine: { stroke: 'rgba(255,255,255,0.08)' },
  tickLine: { stroke: 'rgba(255,255,255,0.06)' },
}
const GRID_STYLE = { strokeDasharray: '3 6', stroke: 'rgba(255,255,255,0.06)' }


function BarChartView({ data, analysis }) {
  const valueKeys = analysis.numericCols.map(c => c.name)
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
        <defs>
          {valueKeys.map((_, i) => (
            <linearGradient key={i} id={`barGrad${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={GRADIENT_PAIRS[i % GRADIENT_PAIRS.length][0]} stopOpacity={0.9} />
              <stop offset="100%" stopColor={GRADIENT_PAIRS[i % GRADIENT_PAIRS.length][1]} stopOpacity={0.5} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid {...GRID_STYLE} />
        <XAxis dataKey="name" {...AXIS_STYLE} angle={data.length > 6 ? -35 : 0} textAnchor={data.length > 6 ? 'end' : 'middle'} height={data.length > 6 ? 70 : 40} />
        <YAxis {...AXIS_STYLE} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(108,92,231,0.08)' }} />
        {valueKeys.length > 1 && <Legend wrapperStyle={{ color: '#b2bec3', fontSize: 12 }} />}
        {valueKeys.map((key, i) => (
          <Bar key={key} dataKey={key} fill={`url(#barGrad${i})`} radius={[6, 6, 0, 0]} animationDuration={800} animationEasing="ease-out" />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

function HorizontalBarView({ data, analysis }) {
  const valueKeys = analysis.numericCols.map(c => c.name)
  return (
    <ResponsiveContainer width="100%" height={Math.max(320, data.length * 42)}>
      <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
        <defs>
          {valueKeys.map((_, i) => (
            <linearGradient key={i} id={`hBarGrad${i}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={GRADIENT_PAIRS[i % GRADIENT_PAIRS.length][0]} stopOpacity={0.9} />
              <stop offset="100%" stopColor={GRADIENT_PAIRS[i % GRADIENT_PAIRS.length][1]} stopOpacity={0.6} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid {...GRID_STYLE} horizontal={false} />
        <XAxis type="number" {...AXIS_STYLE} />
        <YAxis dataKey="name" type="category" {...AXIS_STYLE} width={120} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(108,92,231,0.08)' }} />
        {valueKeys.map((key, i) => (
          <Bar key={key} dataKey={key} fill={`url(#hBarGrad${i})`} radius={[0, 6, 6, 0]} animationDuration={800} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

function LineChartView({ data, analysis }) {
  const valueKeys = analysis.numericCols.map(c => c.name)
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
        <CartesianGrid {...GRID_STYLE} />
        <XAxis dataKey="name" {...AXIS_STYLE} />
        <YAxis {...AXIS_STYLE} />
        <Tooltip content={<CustomTooltip />} />
        {valueKeys.length > 1 && <Legend wrapperStyle={{ color: '#b2bec3', fontSize: 12 }} />}
        {valueKeys.map((key, i) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={CHART_COLORS[i % CHART_COLORS.length]}
            strokeWidth={2.5}
            dot={{ r: 4, fill: CHART_COLORS[i % CHART_COLORS.length], strokeWidth: 2, stroke: '#1a1a1a' }}
            activeDot={{ r: 6, strokeWidth: 0, fill: CHART_COLORS[i % CHART_COLORS.length] }}
            animationDuration={1200}
            animationEasing="ease-out"
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

function AreaChartView({ data, analysis }) {
  const valueKeys = analysis.numericCols.map(c => c.name)
  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
        <defs>
          {valueKeys.map((_, i) => (
            <linearGradient key={i} id={`areaGrad${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={GRADIENT_PAIRS[i % GRADIENT_PAIRS.length][0]} stopOpacity={0.4} />
              <stop offset="100%" stopColor={GRADIENT_PAIRS[i % GRADIENT_PAIRS.length][1]} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid {...GRID_STYLE} />
        <XAxis dataKey="name" {...AXIS_STYLE} />
        <YAxis {...AXIS_STYLE} />
        <Tooltip content={<CustomTooltip />} />
        {valueKeys.map((key, i) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stroke={CHART_COLORS[i % CHART_COLORS.length]}
            strokeWidth={2}
            fill={`url(#areaGrad${i})`}
            animationDuration={1200}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}

function PieChartView({ data }) {
  return (
    <ResponsiveContainer width="100%" height={340}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={65}
          outerRadius={110}
          paddingAngle={3}
          dataKey="value"
          labelLine={false}
          label={renderPieLabel}
          animationDuration={1000}
          animationEasing="ease-out"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="rgba(0,0,0,0.3)" strokeWidth={1} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  )
}

function ScatterChartView({ data, analysis }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <ScatterChart margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
        <CartesianGrid {...GRID_STYLE} />
        <XAxis type="number" dataKey="x" name={analysis.numericCols[0]?.name} {...AXIS_STYLE} />
        <YAxis type="number" dataKey="y" name={analysis.numericCols[1]?.name} {...AXIS_STYLE} />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const d = payload[0]?.payload
            return (
              <div className="chart-tooltip">
                <div className="chart-tooltip-item">
                  <span className="chart-tooltip-name">{d?.xLabel}:</span>
                  <span className="chart-tooltip-value">{d?.x?.toLocaleString()}</span>
                </div>
                <div className="chart-tooltip-item">
                  <span className="chart-tooltip-name">{d?.yLabel}:</span>
                  <span className="chart-tooltip-value">{d?.y?.toLocaleString()}</span>
                </div>
              </div>
            )
          }}
        />
        <Scatter data={data} fill="#6c5ce7" animationDuration={800}>
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} opacity={0.8} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  )
}

function HistogramView({ data }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
        <defs>
          <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6c5ce7" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#a29bfe" stopOpacity={0.4} />
          </linearGradient>
        </defs>
        <CartesianGrid {...GRID_STYLE} />
        <XAxis dataKey="name" {...AXIS_STYLE} angle={-35} textAnchor="end" height={70} />
        <YAxis {...AXIS_STYLE} label={{ value: 'Frequency', angle: -90, position: 'insideLeft', fill: '#7a7a85', fontSize: 12 }} />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const d = payload[0]?.payload
            return (
              <div className="chart-tooltip">
                <div className="chart-tooltip-label">{d?.range}</div>
                <div className="chart-tooltip-item">
                  <span className="chart-tooltip-dot" style={{ background: '#6c5ce7' }} />
                  <span className="chart-tooltip-name">Count</span>
                  <span className="chart-tooltip-value">{d?.count}</span>
                </div>
              </div>
            )
          }}
          cursor={{ fill: 'rgba(108,92,231,0.08)' }}
        />
        <Bar dataKey="count" fill="url(#histGrad)" radius={[4, 4, 0, 0]} animationDuration={800} />
      </BarChart>
    </ResponsiveContainer>
  )
}


function DataVisualization({ tableData }) {
  const analysis = useMemo(() => analyzeTableData(tableData), [tableData])
  const defaultType = useMemo(() => detectChartType(analysis), [analysis])
  const availableTypes = useMemo(() => getAvailableChartTypes(analysis), [analysis])
  const [activeType, setActiveType] = useState(null)

  const chartType = activeType || defaultType
  const chartData = useMemo(() => transformForChart(tableData, analysis, chartType), [tableData, analysis, chartType])

  if (!tableData?.columns?.length || !tableData?.rows?.length) return null

  if (chartType === 'kpi' && !activeType) {
    return <KpiCard tableData={tableData} analysis={analysis} />
  }

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return <BarChartView data={chartData} analysis={analysis} />
      case 'horizontal_bar':
        return <HorizontalBarView data={chartData} analysis={analysis} />
      case 'line':
        return <LineChartView data={chartData} analysis={analysis} />
      case 'area':
        return <AreaChartView data={chartData} analysis={analysis} />
      case 'pie':
        return <PieChartView data={chartData} analysis={analysis} />
      case 'scatter':
        return <ScatterChartView data={chartData} analysis={analysis} />
      case 'histogram':
        return <HistogramView data={chartData} />
      case 'kpi':
        return <KpiCard tableData={tableData} analysis={analysis} />
      case 'table':
      default:
        return <DataTable tableData={tableData} />
    }
  }

  return (
    <motion.div
      className="viz-wrapper"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="viz-header">
        <div className="viz-header-left">
          <LayoutGrid size={14} />
          <span className="viz-title">Visualization</span>
          <span className="viz-badge">{tableData.rows.length} record{tableData.rows.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="viz-switcher">
          {availableTypes.map(type => {
            const Icon = CHART_ICONS[type] || Table
            const isActive = chartType === type
            return (
              <motion.button
                key={type}
                className={`viz-switch-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveType(type)}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                title={CHART_LABELS[type]}
              >
                <Icon size={14} />
                <span className="viz-switch-label">{CHART_LABELS[type]}</span>
              </motion.button>
            )
          })}
        </div>
      </div>

      <div className="viz-body">
        <AnimatePresence mode="wait">
          <motion.div
            key={chartType}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.3 }}
          >
            {renderChart()}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export { DataTable }
export default DataVisualization
