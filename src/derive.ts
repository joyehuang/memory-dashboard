import type { Dashboard, DailyEntry, HerdrDailyEntry, RangeKey } from './types'

const EMPTY_DAILY: DailyEntry = {
  input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0,
  tokens: 0, cost: 0, costIn: 0, costOut: 0, costCache: 0, turns: 0, cacheRate: 0,
}

export interface RangeSlice {
  /** Every date in the window that has pi activity, ascending. */
  dates: string[]
  daily: DailyEntry[]
  /** herdr / mem0 are sparser than pi, so they keep their own date axes. */
  herdrDates: string[]
  herdrDaily: HerdrDailyEntry[]
  mem0Dates: string[]
  mem0Counts: number[]
  recaps: Dashboard['recaps']
  pi: DailyEntry & { cacheSaving: number }
  herdr: { calls: number; cost: number; errors: number; durationMs: number; errorRate: number; avgDurationSec: number }
  mem0Writes: number
}

function sortedKeys(obj: Record<string, unknown>): string[] {
  return Object.keys(obj).sort()
}

/**
 * The window is defined by the last N *calendar* days present in `daily`, not by
 * today's clock — data.json is generated on the host machine and may lag.
 */
function windowStart(allDates: string[], range: RangeKey): string {
  if (range === 'all' || allDates.length === 0) return ''
  const n = range === '7' ? 7 : 30
  const last = allDates[allDates.length - 1]
  const end = new Date(last + 'T00:00:00Z')
  end.setUTCDate(end.getUTCDate() - (n - 1))
  return end.toISOString().slice(0, 10)
}

/**
 * What the cacheRead tokens would have cost at the plain input rate, minus what
 * they actually cost. Uses the window's own blended input price.
 */
export function cacheSaving(d: Pick<DailyEntry, 'cacheRead' | 'input' | 'costIn' | 'costCache'>): number {
  if (d.input <= 0 || d.costIn <= 0) return 0
  const pricePerToken = d.costIn / d.input
  return d.cacheRead * pricePerToken - d.costCache
}

export function sliceData(data: Dashboard, range: RangeKey): RangeSlice {
  const allDates = sortedKeys(data.daily)
  const from = windowStart(allDates, range)
  const inWindow = (d: string) => d >= from

  const dates = allDates.filter(inWindow)
  const daily = dates.map((d) => data.daily[d])

  const herdrDates = sortedKeys(data.herdrDaily).filter(inWindow)
  const herdrDaily = herdrDates.map((d) => data.herdrDaily[d])

  const mem0Dates = sortedKeys(data.mem0Ops).filter(inWindow)
  const mem0Counts = mem0Dates.map((d) => data.mem0Ops[d])

  const pi = daily.reduce<DailyEntry>((acc, d) => ({
    input: acc.input + d.input,
    output: acc.output + d.output,
    cacheRead: acc.cacheRead + d.cacheRead,
    cacheWrite: acc.cacheWrite + d.cacheWrite,
    reasoning: acc.reasoning + d.reasoning,
    tokens: acc.tokens + d.tokens,
    cost: acc.cost + d.cost,
    costIn: acc.costIn + d.costIn,
    costOut: acc.costOut + d.costOut,
    costCache: acc.costCache + d.costCache,
    turns: acc.turns + d.turns,
    cacheRate: 0,
  }), { ...EMPTY_DAILY })
  const cacheDenom = pi.input + pi.cacheRead
  pi.cacheRate = cacheDenom > 0 ? (pi.cacheRead / cacheDenom) * 100 : 0

  const herdr = herdrDaily.reduce(
    (acc, h) => ({
      calls: acc.calls + h.calls,
      cost: acc.cost + h.cost,
      errors: acc.errors + h.errors,
      durationMs: acc.durationMs + h.duration_ms,
    }),
    { calls: 0, cost: 0, errors: 0, durationMs: 0 },
  )

  return {
    dates,
    daily,
    herdrDates,
    herdrDaily,
    mem0Dates,
    mem0Counts,
    recaps: data.recaps.filter((r) => inWindow(r.date)),
    pi: { ...pi, cacheSaving: cacheSaving(pi) },
    herdr: {
      ...herdr,
      errorRate: herdr.calls > 0 ? (herdr.errors / herdr.calls) * 100 : 0,
      avgDurationSec: herdr.calls > 0 ? herdr.durationMs / herdr.calls / 1000 : 0,
    },
    mem0Writes: mem0Counts.reduce((a, b) => a + b, 0),
  }
}

export interface ModelRow {
  name: string
  tokens: number
  cost: number
  calls: number
  cacheRead: number
  input: number
  cacheRate: number
}

/** Models are only reported as all-time totals, so they never take the range filter. */
export function modelRows(data: Dashboard): ModelRow[] {
  return Object.entries(data.models)
    .map(([name, m]) => ({ name, ...m }))
    .sort((a, b) => b.tokens - a.tokens || b.calls - a.calls)
}

export interface BotRow {
  name: string
  calls: number
  cost: number
  errors: number
}

export function botRows(data: Dashboard): BotRow[] {
  return Object.entries(data.herdrBots)
    .map(([name, b]) => ({ name, ...b }))
    .sort((a, b) => b.calls - a.calls)
}
