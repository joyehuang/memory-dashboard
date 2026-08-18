import { useState, type ReactNode } from 'react'
import type { EChartsOption } from 'echarts'
import { Chart } from './Chart'

interface Props {
  title: string
  hint?: string
  option: EChartsOption
  /** Every chart ships a table twin so no value is reachable by colour alone. */
  table: ReactNode
  height?: number
  hasData: boolean
  span?: 'full' | 'half'
}

export function ChartCard({ title, hint, option, table, height = 280, hasData, span = 'half' }: Props) {
  const [view, setView] = useState<'chart' | 'table'>('chart')

  return (
    <section className={`card card--${span}`}>
      <header className="card-head">
        <div>
          <h3>{title}</h3>
          {hint && <p className="hint">{hint}</p>}
        </div>
        <div className="seg" role="group" aria-label={`${title} 视图切换`}>
          <button
            className={view === 'chart' ? 'on' : ''}
            onClick={() => setView('chart')}
            aria-pressed={view === 'chart'}
          >
            图表
          </button>
          <button
            className={view === 'table' ? 'on' : ''}
            onClick={() => setView('table')}
            aria-pressed={view === 'table'}
          >
            表格
          </button>
        </div>
      </header>
      {!hasData ? (
        <p className="empty">此时间范围内没有数据</p>
      ) : view === 'chart' ? (
        <Chart option={option} height={height} />
      ) : (
        table
      )}
    </section>
  )
}
