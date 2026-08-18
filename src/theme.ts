import type { EChartsOption } from 'echarts'

/**
 * Dark-mode categorical steps, validated as a set against the card surface
 * (#171a21): lightness band, chroma floor, adjacent CVD ΔE 8.4, normal-vision
 * ΔE 19.3, contrast ≥ 3:1. Slots are assigned by entity below and never cycled.
 */
export const SLOT = {
  blue: '#3987e5',
  orange: '#d95926',
  aqua: '#199e70',
  yellow: '#c98500',
  magenta: '#d55181',
  green: '#008300',
  violet: '#9085e9',
  red: '#e66767',
} as const

/** Colour follows the entity, so the same concept keeps its hue across every chart. */
export const HUE = {
  cache: SLOT.blue,      // cache reads / cache hit rate / token volume
  input: SLOT.orange,    // input tokens & input cost
  output: SLOT.aqua,     // output tokens & output cost / mem0 writes
  reasoning: SLOT.yellow, // reasoning tokens / durations
  cacheWrite: SLOT.magenta,
  turns: SLOT.violet,
  cost: SLOT.orange,
  errors: '#d03b3b',     // status: critical
} as const

export const INK = {
  surface: '#171a21',
  surfaceRaised: '#1e2430',
  page: '#0f1115',
  primary: '#e6e9ef',
  secondary: '#8b93a5',
  muted: '#6b7386',
  grid: 'rgba(255,255,255,0.06)',
  axis: '#3a4152',
  border: '#262b36',
} as const

const AXIS_LABEL = { color: INK.secondary, fontSize: 11 }

export function baseOption(opts: {
  /** Number of x categories — drives whether a zoom control is worth showing. */
  points: number
  legend?: boolean
  zoom?: boolean
  gridLeft?: number
}): EChartsOption {
  const zoom = opts.zoom !== false && opts.points > 6
  return {
    backgroundColor: 'transparent',
    animationDuration: 400,
    textStyle: { fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif', color: INK.primary },
    grid: {
      top: opts.legend === false ? 16 : 42,
      left: opts.gridLeft ?? 8,
      right: 12,
      bottom: zoom ? 54 : 28,
      containLabel: true,
    },
    legend: opts.legend === false ? undefined : {
      top: 4,
      left: 0,
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 14,
      icon: 'roundRect',
      textStyle: { color: INK.secondary, fontSize: 11 },
      inactiveColor: INK.muted,
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(255,255,255,0.04)' } },
      backgroundColor: INK.surfaceRaised,
      borderColor: INK.axis,
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: INK.primary, fontSize: 12 },
      extraCssText: 'border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.45);',
    },
    dataZoom: zoom
      ? [
          { type: 'inside', throttle: 40 },
          {
            type: 'slider',
            height: 18,
            bottom: 8,
            borderColor: 'transparent',
            backgroundColor: 'rgba(255,255,255,0.03)',
            fillerColor: 'rgba(57,135,229,0.16)',
            handleStyle: { color: INK.axis, borderColor: INK.secondary },
            moveHandleStyle: { color: INK.axis },
            dataBackground: { lineStyle: { color: INK.axis }, areaStyle: { color: 'rgba(255,255,255,0.05)' } },
            selectedDataBackground: { lineStyle: { color: HUE.cache }, areaStyle: { color: 'rgba(57,135,229,0.18)' } },
            textStyle: { color: INK.muted, fontSize: 10 },
            brushSelect: false,
          },
        ]
      : undefined,
  }
}

export function categoryAxis(data: string[]) {
  return {
    type: 'category' as const,
    data,
    axisLine: { lineStyle: { color: INK.axis } },
    axisTick: { show: false },
    axisLabel: { ...AXIS_LABEL, hideOverlap: true },
  }
}

export function valueAxis(formatter?: (v: number) => string) {
  return {
    type: 'value' as const,
    splitLine: { lineStyle: { color: INK.grid, type: 'solid' as const } },
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { ...AXIS_LABEL, formatter: formatter as unknown as string },
  }
}

/** A surface-coloured 2px inset reads as a gap between stacked segments, not a border. */
export const stackItemStyle = { borderColor: INK.surface, borderWidth: 2 }

/**
 * ECharts types label/axis formatters against a very wide param union. The
 * callbacks here only ever see one series shape, so narrow at the call site.
 */
export function fmtCb<T>(fn: (p: T) => string): string {
  return fn as unknown as string
}

export const barRadiusTop = [3, 3, 0, 0] as [number, number, number, number]
export const barRadiusRight = [0, 3, 3, 0] as [number, number, number, number]
