export function compactNum(n: number): string {
  if (!isFinite(n)) return '—'
  const abs = Math.abs(n)
  if (abs >= 1e9) return (n / 1e9).toFixed(2) + 'B'
  if (abs >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (abs >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return String(Math.round(n))
}

/** Axis ticks want "80M", not "80.00M". */
export function compactAxis(n: number): string {
  return compactNum(n)
    .replace(/\.0+([KMB])?$/, '$1')
    .replace(/(\.\d*[1-9])0+([KMB])?$/, '$1$2')
}

export function fullNum(n: number): string {
  return Math.round(n).toLocaleString('en-US')
}

/** Every tick on one axis gets the same number of decimals, chosen from its range. */
export function moneyAxis(max: number): (v: number) => string {
  const digits = max >= 10 ? 0 : max >= 1 ? 2 : 3
  return (v) => '$' + v.toFixed(digits)
}

/** Costs span 4 orders of magnitude here, so keep small values readable. */
export function money(n: number): string {
  if (!isFinite(n)) return '—'
  const abs = Math.abs(n)
  if (abs === 0) return '$0'
  if (abs >= 1000) return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 })
  if (abs >= 1) return '$' + n.toFixed(2)
  if (abs >= 0.01) return '$' + n.toFixed(3)
  return '$' + n.toFixed(5)
}

export function pct(n: number, digits = 1): string {
  if (!isFinite(n)) return '—'
  return n.toFixed(digits) + '%'
}

export function duration(sec: number): string {
  if (!isFinite(sec) || sec <= 0) return '—'
  if (sec < 60) return sec.toFixed(1) + 's'
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return `${m}m ${s}s`
}

export function bytesish(chars: number): string {
  if (chars >= 1024) return (chars / 1024).toFixed(1) + ' KB'
  return chars + ' B'
}

/** "2026-08-18" -> "08-18" */
export function shortDate(d: string): string {
  return d.length === 10 ? d.slice(5) : d
}
