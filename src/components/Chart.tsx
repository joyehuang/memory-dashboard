import { useEffect, useRef } from 'react'
import * as echarts from 'echarts/core'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
} from 'echarts/components'
import { LabelLayout } from 'echarts/features'
import { CanvasRenderer } from 'echarts/renderers'
import type { EChartsOption } from 'echarts'

// Register only what the dashboard draws — keeps the bundle a third of full echarts.
echarts.use([
  BarChart,
  LineChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  LabelLayout,
  CanvasRenderer,
])

interface Props {
  option: EChartsOption
  height: number
}

export function Chart({ option, height }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const instance = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!ref.current) return
    const chart = echarts.init(ref.current)
    instance.current = chart
    const ro = new ResizeObserver(() => chart.resize())
    ro.observe(ref.current)
    return () => {
      ro.disconnect()
      chart.dispose()
      instance.current = null
    }
  }, [])

  useEffect(() => {
    // notMerge so a range switch cannot leave stale series behind.
    instance.current?.setOption(option, true)
  }, [option])

  return <div className="chart" ref={ref} style={{ height }} />
}
