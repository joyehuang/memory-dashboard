import type { EChartsOption } from 'echarts'
import { baseOption, categoryAxis, valueAxis, HUE, INK, stackItemStyle, barRadiusTop, barRadiusRight, fmtCb } from './theme'
import { compactAxis, compactNum, fullNum, money, moneyAxis, pct, shortDate, duration } from './format'
import type { RangeSlice, ModelRow, BotRow } from './derive'
import type { PiTotals } from './types'

type TipParam = { name: string; seriesName: string; value: number; marker: string; dataIndex: number }

function tooltipRows(params: TipParam[], fmt: (v: number) => string, totalLabel?: string): string {
  const rows = params
    .filter((p) => p.value !== 0 || params.every((q) => q.value === 0))
    .map((p) => `<div class="tt-row">${p.marker}<span class="tt-k">${p.seriesName}</span><span class="tt-v">${fmt(p.value)}</span></div>`)
    .join('')
  const total = totalLabel
    ? `<div class="tt-row tt-total"><span class="tt-k">${totalLabel}</span><span class="tt-v">${fmt(
        params.reduce((a, p) => a + p.value, 0),
      )}</span></div>`
    : ''
  return `<div class="tt-title">${params[0].name}</div>${rows}${total}`
}

/* ---------- pi 每日 ---------- */

export function dailyTokensOption(s: RangeSlice): EChartsOption {
  const x = s.dates.map(shortDate)
  const hasCacheWrite = s.daily.some((d) => d.cacheWrite > 0)
  const defs: { name: string; key: 'cacheRead' | 'input' | 'output' | 'reasoning' | 'cacheWrite'; color: string }[] = [
    { name: '缓存读取', key: 'cacheRead', color: HUE.cache },
    { name: '输入', key: 'input', color: HUE.input },
    { name: '输出', key: 'output', color: HUE.output },
    { name: '推理', key: 'reasoning', color: HUE.reasoning },
    ...(hasCacheWrite ? [{ name: '缓存写入', key: 'cacheWrite' as const, color: HUE.cacheWrite }] : []),
  ]
  return {
    ...baseOption({ points: x.length }),
    tooltip: {
      ...(baseOption({ points: x.length }).tooltip as object),
      formatter: (p: unknown) => tooltipRows(p as TipParam[], fullNum, '合计'),
    },
    xAxis: categoryAxis(x),
    yAxis: valueAxis(compactAxis),
    series: defs.map((d, i) => ({
      name: d.name,
      type: 'bar' as const,
      stack: 'tok',
      barMaxWidth: 26,
      itemStyle: {
        color: d.color,
        ...stackItemStyle,
        borderRadius: i === defs.length - 1 ? barRadiusTop : 0,
      },
      data: s.daily.map((row) => row[d.key]),
    })),
  }
}

/**
 * cacheRead is ~99% of every bar, so the billed-at-full-price tokens are a sliver
 * in the stacked chart above. They get their own scale here.
 */
export function dailyLiveTokensOption(s: RangeSlice): EChartsOption {
  const x = s.dates.map(shortDate)
  const defs: { name: string; key: 'input' | 'output' | 'reasoning'; color: string }[] = [
    { name: '输入', key: 'input', color: HUE.input },
    { name: '输出', key: 'output', color: HUE.output },
    { name: '推理', key: 'reasoning', color: HUE.reasoning },
  ]
  return {
    ...baseOption({ points: x.length }),
    tooltip: {
      ...(baseOption({ points: x.length }).tooltip as object),
      formatter: (p: unknown) => tooltipRows(p as TipParam[], fullNum, '合计'),
    },
    xAxis: categoryAxis(x),
    yAxis: valueAxis(compactAxis),
    series: defs.map((d, i) => ({
      name: d.name,
      type: 'bar' as const,
      stack: 'live',
      barMaxWidth: 26,
      itemStyle: {
        color: d.color,
        ...stackItemStyle,
        borderRadius: i === defs.length - 1 ? barRadiusTop : 0,
      },
      data: s.daily.map((row) => row[d.key]),
    })),
  }
}

export function dailyCacheRateOption(s: RangeSlice): EChartsOption {
  const x = s.dates.map(shortDate)
  const last = s.daily.length - 1
  return {
    ...baseOption({ points: x.length, legend: false }),
    tooltip: {
      ...(baseOption({ points: x.length }).tooltip as object),
      axisPointer: { type: 'line', lineStyle: { color: INK.axis } },
      formatter: (p: unknown) => tooltipRows(p as TipParam[], (v) => pct(v)),
    },
    xAxis: { ...categoryAxis(x), boundaryGap: false },
    yAxis: { ...valueAxis((v) => v + '%'), max: 100, min: 0 },
    series: [
      {
        name: '缓存命中率',
        type: 'line',
        smooth: 0.25,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 2, color: HUE.cache },
        itemStyle: { color: HUE.cache, borderColor: INK.surface, borderWidth: 2 },
        areaStyle: { color: 'rgba(57,135,229,0.10)' },
        // Direct-label the endpoint only; the axis and tooltip carry the rest.
        label: {
          show: true,
          position: 'top',
          color: INK.primary,
          fontSize: 11,
          formatter: fmtCb<{ dataIndex: number; value: number }>((p) => (p.dataIndex === last ? pct(p.value) : '')),
        },
        data: s.daily.map((d) => d.cacheRate),
      },
    ],
  }
}

export function dailyCostOption(s: RangeSlice): EChartsOption {
  const x = s.dates.map(shortDate)
  const defs: { name: string; key: 'costCache' | 'costIn' | 'costOut'; color: string }[] = [
    { name: '缓存读取', key: 'costCache', color: HUE.cache },
    { name: '输入', key: 'costIn', color: HUE.input },
    { name: '输出', key: 'costOut', color: HUE.output },
  ]
  return {
    ...baseOption({ points: x.length }),
    tooltip: {
      ...(baseOption({ points: x.length }).tooltip as object),
      formatter: (p: unknown) => tooltipRows(p as TipParam[], money, '合计'),
    },
    xAxis: categoryAxis(x),
    yAxis: valueAxis(moneyAxis(Math.max(...s.daily.map((d) => d.cost), 0))),
    series: defs.map((d, i) => ({
      name: d.name,
      type: 'bar' as const,
      stack: 'cost',
      barMaxWidth: 26,
      itemStyle: {
        color: d.color,
        ...stackItemStyle,
        borderRadius: i === defs.length - 1 ? barRadiusTop : 0,
      },
      data: s.daily.map((row) => row[d.key]),
    })),
  }
}

export function dailyTurnsOption(s: RangeSlice): EChartsOption {
  const x = s.dates.map(shortDate)
  return {
    ...baseOption({ points: x.length, legend: false }),
    tooltip: {
      ...(baseOption({ points: x.length }).tooltip as object),
      formatter: (p: unknown) => tooltipRows(p as TipParam[], (v) => fullNum(v) + ' 轮'),
    },
    xAxis: categoryAxis(x),
    yAxis: valueAxis(compactAxis),
    series: [
      {
        name: '对话轮次',
        type: 'bar',
        barMaxWidth: 26,
        itemStyle: { color: HUE.turns, borderRadius: barRadiusTop },
        data: s.daily.map((d) => d.turns),
      },
    ],
  }
}

/* ---------- 成本构成 ---------- */

export function costBreakdownOption(pi: Pick<PiTotals, 'costIn' | 'costOut' | 'costCache'>): EChartsOption {
  const data = [
    { name: '缓存读取', value: pi.costCache, itemStyle: { color: HUE.cache } },
    { name: '输入', value: pi.costIn, itemStyle: { color: HUE.input } },
    { name: '输出', value: pi.costOut, itemStyle: { color: HUE.output } },
  ]
  return {
    ...baseOption({ points: 3, zoom: false }),
    tooltip: {
      ...(baseOption({ points: 3 }).tooltip as object),
      trigger: 'item',
      formatter: (p: unknown) => {
        const q = p as { name: string; value: number; percent: number; marker: string }
        return `<div class="tt-row">${q.marker}<span class="tt-k">${q.name}</span><span class="tt-v">${money(
          q.value,
        )} · ${q.percent.toFixed(1)}%</span></div>`
      },
    },
    legend: { bottom: 0, left: 'center', icon: 'roundRect', itemWidth: 10, itemHeight: 10, textStyle: { color: INK.secondary, fontSize: 11 } },
    series: [
      {
        name: '成本构成',
        type: 'pie',
        radius: ['52%', '76%'],
        center: ['50%', '46%'],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: INK.surface, borderWidth: 2 },
        // Outer labels get clipped in a quarter-width card; legend + tooltip + table carry it.
        label: { show: false },
        labelLine: { show: false },
        data,
      },
    ],
  }
}

/* ---------- 模型 ---------- */

function horizontalBar(
  rows: { name: string; value: number }[],
  color: string,
  fmt: (v: number) => string,
): EChartsOption {
  // Bars read top-down by magnitude, so reverse for ECharts' bottom-up y-axis.
  const ordered = [...rows].reverse()
  return {
    ...baseOption({ points: rows.length, legend: false, zoom: false, gridLeft: 8 }),
    grid: { top: 8, left: 8, right: 68, bottom: 8, containLabel: true },
    tooltip: {
      ...(baseOption({ points: rows.length }).tooltip as object),
      trigger: 'item',
      formatter: (p: unknown) => {
        const q = p as { name: string; value: number; marker: string }
        return `<div class="tt-row">${q.marker}<span class="tt-k">${q.name}</span><span class="tt-v">${fmt(q.value)}</span></div>`
      },
    },
    xAxis: { ...valueAxis(), show: false },
    yAxis: {
      type: 'category',
      data: ordered.map((r) => r.name),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: INK.secondary, fontSize: 11 },
    },
    series: [
      {
        type: 'bar',
        barMaxWidth: 18,
        itemStyle: { color, borderRadius: barRadiusRight },
        label: {
          show: true,
          position: 'right' as const,
          color: INK.primary,
          fontSize: 11,
          formatter: fmtCb<{ value: number }>((p) => fmt(p.value)),
        },
        data: ordered.map((r) => r.value),
      },
    ],
  }
}

export function modelTokensOption(rows: ModelRow[]): EChartsOption {
  return horizontalBar(rows.map((r) => ({ name: r.name, value: r.tokens })), HUE.cache, compactNum)
}

export function modelCostOption(rows: ModelRow[]): EChartsOption {
  const sorted = [...rows].sort((a, b) => b.cost - a.cost)
  return horizontalBar(sorted.map((r) => ({ name: r.name, value: r.cost })), HUE.cost, money)
}

export function modelCacheRateOption(rows: ModelRow[]): EChartsOption {
  const active = rows.filter((r) => r.calls > 0 && r.tokens > 0).sort((a, b) => b.cacheRate - a.cacheRate)
  const opt = horizontalBar(active.map((r) => ({ name: r.name, value: r.cacheRate })), HUE.cache, (v) => pct(v))
  return { ...opt, xAxis: { ...(opt.xAxis as object), max: 100 } }
}

/* ---------- herdr ---------- */

export function herdrCallsOption(s: RangeSlice): EChartsOption {
  const x = s.herdrDates.map(shortDate)
  return {
    ...baseOption({ points: x.length, legend: false }),
    tooltip: {
      ...(baseOption({ points: x.length }).tooltip as object),
      formatter: (p: unknown) => tooltipRows(p as TipParam[], (v) => fullNum(v) + ' 次'),
    },
    xAxis: categoryAxis(x),
    yAxis: valueAxis(compactAxis),
    series: [
      {
        name: '调用次数',
        type: 'bar',
        barMaxWidth: 26,
        itemStyle: { color: HUE.cache, borderRadius: barRadiusTop },
        data: s.herdrDaily.map((h) => h.calls),
      },
    ],
  }
}

export function herdrCostOption(s: RangeSlice): EChartsOption {
  const x = s.herdrDates.map(shortDate)
  return {
    ...baseOption({ points: x.length, legend: false }),
    tooltip: {
      ...(baseOption({ points: x.length }).tooltip as object),
      formatter: (p: unknown) => tooltipRows(p as TipParam[], money),
    },
    xAxis: categoryAxis(x),
    yAxis: valueAxis(moneyAxis(Math.max(...s.herdrDaily.map((h) => h.cost), 0))),
    series: [
      {
        name: '成本',
        type: 'bar',
        barMaxWidth: 26,
        itemStyle: { color: HUE.cost, borderRadius: barRadiusTop },
        data: s.herdrDaily.map((h) => h.cost),
      },
    ],
  }
}

export function herdrDurationOption(s: RangeSlice): EChartsOption {
  const x = s.herdrDates.map(shortDate)
  return {
    ...baseOption({ points: x.length, legend: false }),
    tooltip: {
      ...(baseOption({ points: x.length }).tooltip as object),
      formatter: (p: unknown) => tooltipRows(p as TipParam[], duration),
    },
    xAxis: categoryAxis(x),
    yAxis: valueAxis((v) => v + 's'),
    series: [
      {
        name: '平均时长',
        type: 'bar',
        barMaxWidth: 26,
        itemStyle: { color: HUE.reasoning, borderRadius: barRadiusTop },
        data: s.herdrDaily.map((h) => (h.calls > 0 ? +(h.duration_ms / h.calls / 1000).toFixed(1) : 0)),
      },
    ],
  }
}

export function herdrBotsOption(rows: BotRow[]): EChartsOption {
  return horizontalBar(rows.map((r) => ({ name: r.name, value: r.calls })), HUE.cache, (v) => fullNum(v) + ' 次')
}

/* ---------- mem0 ---------- */

export function mem0Option(s: RangeSlice): EChartsOption {
  const x = s.mem0Dates.map(shortDate)
  return {
    ...baseOption({ points: x.length, legend: false }),
    tooltip: {
      ...(baseOption({ points: x.length }).tooltip as object),
      formatter: (p: unknown) => tooltipRows(p as TipParam[], (v) => fullNum(v) + ' 条'),
    },
    xAxis: categoryAxis(x),
    yAxis: valueAxis(compactAxis),
    series: [
      {
        name: '写入条数',
        type: 'bar',
        barMaxWidth: 26,
        itemStyle: { color: HUE.output, borderRadius: barRadiusTop },
        data: s.mem0Counts,
      },
    ],
  }
}
