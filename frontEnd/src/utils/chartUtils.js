export const CHART_COLORS = [
  '#6c5ce7',
  '#a29bfe',
  '#00cec9',
  '#fd79a8',
  '#fdcb6e',
  '#00b894',
  '#e17055',
  '#74b9ff',
  '#b2bec3',
  '#55efc4',
  '#ffeaa7',
  '#dfe6e9',
]

export const GRADIENT_PAIRS = [
  ['#6c5ce7', '#a29bfe'],
  ['#00cec9', '#81ecec'],
  ['#fd79a8', '#fab1a0'],
  ['#fdcb6e', '#ffeaa7'],
  ['#00b894', '#55efc4'],
  ['#e17055', '#fab1a0'],
  ['#74b9ff', '#a29bfe'],
  ['#636e72', '#b2bec3'],
]

function isNumericValue(val) {
  if (val === null || val === undefined || val === '') return false
  const str = String(val).trim()
  if (str === '') return false
  return !isNaN(Number(str))
}

function isDateValue(val) {
  if (val === null || val === undefined || val === '') return false
  const str = String(val).trim()
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}/,
    /^\d{1,2}\/\d{1,2}\/\d{2,4}/,
    /^\d{1,2}-\d{1,2}-\d{2,4}/,
    /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i,
  ]
  if (datePatterns.some(p => p.test(str))) {
    const d = new Date(str)
    return !isNaN(d.getTime())
  }
  return false
}

function isYearLike(rows, colIndex) {
  const values = rows.map(r => r[colIndex]).filter(v => v !== null && v !== undefined && v !== '')
  if (values.length < 2) return false
  const nums = values.map(v => Number(String(v).trim())).filter(v => !isNaN(v))
  if (nums.length / values.length < 0.8) return false
  return nums.every(v => Number.isInteger(v) && v >= 1900 && v <= 2100)
}

function analyzeColumn(rows, colIndex) {
  const values = rows.map(r => r[colIndex]).filter(v => v !== null && v !== undefined && v !== '')
  if (values.length === 0) return 'categorical'

  const numericCount = values.filter(isNumericValue).length
  const dateCount = values.filter(isDateValue).length
  const ratio = numericCount / values.length

  if (ratio > 0.8) {
    if (isYearLike(rows, colIndex)) return 'categorical'
    return 'numeric'
  }
  if (dateCount / values.length > 0.8) return 'date'
  return 'categorical'
}

export function analyzeTableData(tableData) {
  if (!tableData?.columns?.length || !tableData?.rows?.length) return null

  const columns = tableData.columns.map((name, index) => ({
    name,
    index,
    type: analyzeColumn(tableData.rows, index),
    uniqueCount: new Set(tableData.rows.map(r => r[index])).size,
    avgLabelLength: tableData.rows.reduce((sum, r) => sum + String(r[index] || '').length, 0) / tableData.rows.length,
  }))

  return {
    columns,
    rowCount: tableData.rows.length,
    numericCols: columns.filter(c => c.type === 'numeric'),
    categoricalCols: columns.filter(c => c.type === 'categorical'),
    dateCols: columns.filter(c => c.type === 'date'),
  }
}

export function detectChartType(analysis) {
  if (!analysis) return 'table'

  const { numericCols, categoricalCols, dateCols, rowCount } = analysis

  if (rowCount === 1 && numericCols.length === 1 && categoricalCols.length === 0) {
    return 'kpi'
  }

  if (dateCols.length >= 1 && numericCols.length >= 1) {
    return 'line'
  }

  if (numericCols.length >= 2 && categoricalCols.length === 0) {
    return 'scatter'
  }

  if (numericCols.length === 1 && categoricalCols.length === 0) {
    return 'histogram'
  }

  if (categoricalCols.length >= 1 && numericCols.length >= 1) {
    const catCol = categoricalCols[0]
    if (catCol.uniqueCount <= 8 && rowCount <= 8) {
      return 'pie'
    }
    if (catCol.avgLabelLength > 12) {
      return 'horizontal_bar'
    }
    return 'bar'
  }

  return 'table'
}

export function getAvailableChartTypes(analysis) {
  if (!analysis) return ['table']

  const types = ['table']
  const { numericCols, categoricalCols, dateCols } = analysis

  if (numericCols.length >= 1 && (categoricalCols.length >= 1 || dateCols.length >= 1)) {
    types.push('bar', 'horizontal_bar', 'line', 'area')
  }

  if (categoricalCols.length >= 1 && numericCols.length >= 1) {
    types.push('pie')
  }

  if (numericCols.length >= 2) {
    types.push('scatter')
  }

  if (numericCols.length >= 1) {
    types.push('histogram')
  }

  return [...new Set(types)]
}

export function transformForChart(tableData, analysis, chartType) {
  if (!tableData || !analysis) return []

  const { numericCols, categoricalCols, dateCols } = analysis

  if (chartType === 'histogram' && numericCols.length >= 1) {
    return generateHistogramBins(tableData, numericCols[0].index)
  }

  if (chartType === 'scatter' && numericCols.length >= 2) {
    return tableData.rows.map(row => ({
      x: Number(row[numericCols[0].index]) || 0,
      y: Number(row[numericCols[1].index]) || 0,
      xLabel: numericCols[0].name,
      yLabel: numericCols[1].name,
    }))
  }

  if (chartType === 'pie') {
    const catIdx = categoricalCols[0]?.index ?? 0
    const numIdx = numericCols[0]?.index ?? 1
    return tableData.rows.map((row, i) => ({
      name: String(row[catIdx] || `Item ${i + 1}`),
      value: Math.abs(Number(row[numIdx]) || 0),
    }))
  }

  const labelCol = (dateCols[0] || categoricalCols[0] || analysis.columns[0])
  const valueCols = numericCols.length > 0 ? numericCols : [analysis.columns[1] || analysis.columns[0]]

  return tableData.rows.map(row => {
    const entry = { name: String(row[labelCol.index] || '') }
    valueCols.forEach(col => {
      entry[col.name] = Number(row[col.index]) || 0
    })
    return entry
  })
}

function generateHistogramBins(tableData, colIndex, binCount = 10) {
  const values = tableData.rows
    .map(r => Number(r[colIndex]))
    .filter(v => !isNaN(v))

  if (values.length === 0) return []

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const binSize = range / binCount

  const bins = Array.from({ length: binCount }, (_, i) => ({
    name: `${(min + i * binSize).toFixed(1)}`,
    range: `${(min + i * binSize).toFixed(1)} – ${(min + (i + 1) * binSize).toFixed(1)}`,
    count: 0,
  }))

  values.forEach(v => {
    let idx = Math.floor((v - min) / binSize)
    if (idx >= binCount) idx = binCount - 1
    bins[idx].count++
  })

  return bins
}
