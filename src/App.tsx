import { useEffect, useMemo, useState } from 'react'
import type { Dashboard, RangeKey } from './types'
import { sliceData, modelRows, botRows } from './derive'
import { compactNum, fullNum, money, pct, duration, bytesish, shortDate } from './format'
import { StatTile } from './components/StatTile'
import { ChartCard } from './components/ChartCard'
import { DataTable, type Column } from './components/DataTable'
import { Recaps } from './components/Recaps'
import { HUE } from './theme'
import {
  dailyTokensOption, dailyLiveTokensOption, dailyCacheRateOption, dailyCostOption, dailyTurnsOption,
  costBreakdownOption, modelTokensOption, modelCostOption, modelCacheRateOption,
  herdrCallsOption, herdrCostOption, herdrDurationOption, herdrBotsOption, mem0Option,
} from './charts'

const RANGES: { key: RangeKey; label: string }[] = [
  { key: '7', label: '近 7 天' },
  { key: '30', label: '近 30 天' },
  { key: 'all', label: '全部' },
]

export default function App() {
  const [data, setData] = useState<Dashboard | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [range, setRange] = useState<RangeKey>('all')

  useEffect(() => {
    fetch('/data.json', { cache: 'no-cache' })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<Dashboard>
      })
      .then(setData)
      .catch((e: Error) => setError(e.message))
  }, [])

  const slice = useMemo(() => (data ? sliceData(data, range) : null), [data, range])
  const models = useMemo(() => (data ? modelRows(data) : []), [data])
  const bots = useMemo(() => (data ? botRows(data) : []), [data])

  if (error) {
    return (
      <main className="wrap">
        <p className="empty">加载 data.json 失败：{error}</p>
      </main>
    )
  }
  if (!data || !slice) {
    return (
      <main className="wrap">
        <p className="empty">加载中…</p>
      </main>
    )
  }

  const { pi, herdr } = slice
  const rangeLabel = RANGES.find((r) => r.key === range)!.label
  const span = slice.dates.length > 0 ? `${slice.dates[0]} → ${slice.dates[slice.dates.length - 1]}` : '无数据'

  return (
    <main className="wrap">
      <header className="page-head">
        <div>
          <h1>Agent 记忆 &amp; 使用数据</h1>
          <p className="sub">
            生成于 {data.generatedAt} · 当前范围 {span} · {slice.dates.length} 天
          </p>
        </div>
        {/* One filter row above everything it scopes — never per-card. */}
        <div className="seg seg--lg" role="group" aria-label="时间范围">
          {RANGES.map((r) => (
            <button
              key={r.key}
              className={range === r.key ? 'on' : ''}
              onClick={() => setRange(r.key)}
              aria-pressed={range === r.key}
            >
              {r.label}
            </button>
          ))}
        </div>
      </header>

      {/* ---------- pi 总览 ---------- */}
      <h2 className="section-title">
        pi 用量 <span className="section-note">{rangeLabel}</span>
      </h2>
      <div className="tiles">
        <StatTile label="Token 总量" value={compactNum(pi.tokens)} sub={fullNum(pi.tokens)} accent={HUE.cache} />
        <StatTile label="成本" value={money(pi.cost)} sub={`${slice.dates.length} 天累计`} accent={HUE.cost} />
        <StatTile label="缓存命中率" value={pct(pi.cacheRate)} sub={`${compactNum(pi.cacheRead)} / ${compactNum(pi.cacheRead + pi.input)} tokens`} accent={HUE.cache} />
        <StatTile
          label="缓存节省"
          value={money(pi.cacheSaving)}
          sub="按输入单价计费的差额"
          accent={HUE.output}
          hero
        />
        <StatTile label="对话轮次" value={fullNum(pi.turns)} sub={`≈ ${(pi.turns / Math.max(1, slice.dates.length)).toFixed(0)} 轮/天`} accent={HUE.turns} />
        <StatTile label="会话数" value={fullNum(data.totals.pi.sessions)} sub="全部历史" />
      </div>

      {/* ---------- 记忆 ---------- */}
      <h2 className="section-title">记忆</h2>
      <div className="tiles">
        <StatTile label="mem0 条目" value={fullNum(data.totals.mem0.entries)} sub="全部历史" accent={HUE.output} />
        <StatTile label="mem0 写入" value={fullNum(slice.mem0Writes)} sub={rangeLabel} accent={HUE.output} />
        <StatTile label="memory.md 行数" value={fullNum(data.totals.memoryMd.lines)} sub="全部历史" />
        <StatTile label="memory.md 体积" value={bytesish(data.totals.memoryMd.chars)} sub={`${fullNum(data.totals.memoryMd.chars)} 字符`} />
      </div>

      {/* ---------- herdr ---------- */}
      <h2 className="section-title">
        herdr 活动 <span className="section-note">{rangeLabel}</span>
      </h2>
      <div className="tiles">
        <StatTile label="调用次数" value={fullNum(herdr.calls)} sub={`${slice.herdrDates.length} 个活跃日`} accent={HUE.cache} />
        <StatTile label="成本" value={money(herdr.cost)} accent={HUE.cost} />
        <StatTile label="错误率" value={pct(herdr.errorRate, 2)} sub={`${fullNum(herdr.errors)} 个错误`} accent={herdr.errors > 0 ? HUE.errors : undefined} />
        <StatTile label="平均时长" value={duration(herdr.avgDurationSec)} sub={`总计 ${duration(herdr.durationMs / 1000)}`} accent={HUE.reasoning} />
        <StatTile label="会话 / 团队运行" value={`${fullNum(data.totals.herdr.sessions)} / ${fullNum(data.totals.herdr.teamRuns)}`} sub={`活跃团队 ${data.totals.herdr.teamActive}`} />
      </div>

      {/* ---------- 每日趋势 ---------- */}
      <h2 className="section-title">每日趋势</h2>
      <div className="grid">
        <ChartCard
          title="每日 Token 用量"
          hint="按类型堆叠 · 可缩放"
          span="full"
          height={320}
          hasData={slice.dates.length > 0}
          option={dailyTokensOption(slice)}
          table={
            <DataTable
              rows={slice.dates.map((d, i) => ({ d, ...slice.daily[i] }))}
              columns={[
                { key: 'd', label: '日期', align: 'left', render: (r) => r.d },
                { key: 'cacheRead', label: '缓存读取', render: (r) => fullNum(r.cacheRead) },
                { key: 'input', label: '输入', render: (r) => fullNum(r.input) },
                { key: 'output', label: '输出', render: (r) => fullNum(r.output) },
                { key: 'reasoning', label: '推理', render: (r) => fullNum(r.reasoning) },
                { key: 'cacheWrite', label: '缓存写入', render: (r) => fullNum(r.cacheWrite) },
                { key: 'tokens', label: '合计', render: (r) => fullNum(r.tokens) },
              ] as Column<{ d: string } & (typeof slice.daily)[number]>[]}
            />
          }
        />

        <ChartCard
          title="每日非缓存 Token"
          hint="按完整单价计费的部分 —— 在上图里只有一条细边"
          span="full"
          hasData={slice.dates.length > 0}
          option={dailyLiveTokensOption(slice)}
          table={
            <DataTable
              rows={slice.dates.map((d, i) => ({ d, ...slice.daily[i] }))}
              columns={[
                { key: 'd', label: '日期', align: 'left', render: (r) => r.d },
                { key: 'input', label: '输入', render: (r) => fullNum(r.input) },
                { key: 'output', label: '输出', render: (r) => fullNum(r.output) },
                { key: 'reasoning', label: '推理', render: (r) => fullNum(r.reasoning) },
                { key: 'sum', label: '合计', render: (r) => fullNum(r.input + r.output + r.reasoning) },
              ] as Column<{ d: string } & (typeof slice.daily)[number]>[]}
            />
          }
        />

        <ChartCard
          title="每日缓存命中率"
          hint="cacheRead / (cacheRead + input)"
          hasData={slice.dates.length > 0}
          option={dailyCacheRateOption(slice)}
          table={
            <DataTable
              rows={slice.dates.map((d, i) => ({ d, rate: slice.daily[i].cacheRate }))}
              columns={[
                { key: 'd', label: '日期', align: 'left', render: (r) => r.d },
                { key: 'rate', label: '命中率', render: (r) => pct(r.rate) },
              ]}
            />
          }
        />

        <ChartCard
          title="每日成本"
          hint="按计费类型堆叠"
          hasData={slice.dates.length > 0}
          option={dailyCostOption(slice)}
          table={
            <DataTable
              rows={slice.dates.map((d, i) => ({ d, ...slice.daily[i] }))}
              columns={[
                { key: 'd', label: '日期', align: 'left', render: (r) => r.d },
                { key: 'costCache', label: '缓存读取', render: (r) => money(r.costCache) },
                { key: 'costIn', label: '输入', render: (r) => money(r.costIn) },
                { key: 'costOut', label: '输出', render: (r) => money(r.costOut) },
                { key: 'cost', label: '合计', render: (r) => money(r.cost) },
              ] as Column<{ d: string } & (typeof slice.daily)[number]>[]}
            />
          }
        />

        <ChartCard
          title="每日对话轮次"
          hasData={slice.dates.length > 0}
          option={dailyTurnsOption(slice)}
          table={
            <DataTable
              rows={slice.dates.map((d, i) => ({ d, turns: slice.daily[i].turns }))}
              columns={[
                { key: 'd', label: '日期', align: 'left', render: (r) => r.d },
                { key: 'turns', label: '轮次', render: (r) => fullNum(r.turns) },
              ]}
            />
          }
        />

        <ChartCard
          title="成本构成"
          hint={`${rangeLabel}合计 ${money(pi.cost)}`}
          hasData={pi.cost > 0}
          option={costBreakdownOption(pi)}
          table={
            <DataTable
              rows={[
                { k: '缓存读取', v: pi.costCache },
                { k: '输入', v: pi.costIn },
                { k: '输出', v: pi.costOut },
                { k: '合计', v: pi.cost },
              ]}
              columns={[
                { key: 'k', label: '类型', align: 'left', render: (r) => r.k },
                { key: 'v', label: '成本', render: (r) => money(r.v) },
                { key: 'p', label: '占比', render: (r) => pct(pi.cost > 0 ? (r.v / pi.cost) * 100 : 0) },
              ]}
            />
          }
        />
      </div>

      {/* ---------- 模型 ---------- */}
      <h2 className="section-title">
        模型分布 <span className="section-note">全部历史（数据源不按日拆分）</span>
      </h2>
      {/* Two columns: model names are long, so these bars need the width. */}
      <div className="grid grid--2">
        <ChartCard
          title="各模型 Token"
          hasData={models.length > 0}
          height={Math.max(200, models.length * 34 + 40)}
          option={modelTokensOption(models)}
          table={<ModelTable rows={models} />}
        />
        <ChartCard
          title="各模型成本"
          hasData={models.length > 0}
          height={Math.max(200, models.length * 34 + 40)}
          option={modelCostOption(models)}
          table={<ModelTable rows={models} />}
        />
        <ChartCard
          title="各模型缓存命中率"
          hint="仅统计有 token 记录的模型"
          span="full"
          hasData={models.some((m) => m.tokens > 0)}
          height={Math.max(180, models.filter((m) => m.tokens > 0).length * 34 + 40)}
          option={modelCacheRateOption(models)}
          table={<ModelTable rows={models} />}
        />
      </div>

      {/* ---------- herdr 图表 ---------- */}
      <h2 className="section-title">
        herdr 明细 <span className="section-note">{rangeLabel}</span>
      </h2>
      <div className="grid">
        <ChartCard
          title="每日调用次数"
          hasData={slice.herdrDates.length > 0}
          option={herdrCallsOption(slice)}
          table={<HerdrTable slice={slice} />}
        />
        <ChartCard
          title="每日成本"
          hasData={slice.herdrDates.length > 0}
          option={herdrCostOption(slice)}
          table={<HerdrTable slice={slice} />}
        />
        <ChartCard
          title="每日平均调用时长"
          hasData={slice.herdrDates.length > 0}
          option={herdrDurationOption(slice)}
          table={<HerdrTable slice={slice} />}
        />
        <ChartCard
          title="各 bot 调用量"
          hint="全部历史"
          hasData={bots.length > 0}
          height={Math.max(180, bots.length * 34 + 40)}
          option={herdrBotsOption(bots)}
          table={
            <DataTable
              rows={bots}
              columns={[
                { key: 'name', label: 'Bot', align: 'left', render: (r) => r.name },
                { key: 'calls', label: '调用', render: (r) => fullNum(r.calls) },
                { key: 'cost', label: '成本', render: (r) => money(r.cost) },
                { key: 'errors', label: '错误', render: (r) => fullNum(r.errors) },
              ]}
            />
          }
        />
      </div>

      {/* ---------- mem0 ---------- */}
      <h2 className="section-title">
        mem0 写入 <span className="section-note">{rangeLabel}</span>
      </h2>
      <div className="grid">
        {slice.mem0Dates.length > 1 ? (
          <ChartCard
            title="每日写入条数"
            span="full"
            hasData
            option={mem0Option(slice)}
            table={<Mem0Table dates={slice.mem0Dates} counts={slice.mem0Counts} />}
          />
        ) : (
          // A one-bar bar chart is not a chart — show the number instead.
          <section className="card card--full">
            <header className="card-head">
              <div>
                <h3>每日写入条数</h3>
                <p className="hint">当前范围内只有 {slice.mem0Dates.length} 个写入日，直接列出</p>
              </div>
            </header>
            <Mem0Table dates={slice.mem0Dates} counts={slice.mem0Counts} />
          </section>
        )}
      </div>

      {/* ---------- recaps ---------- */}
      <h2 className="section-title">
        Recap <span className="section-note">{slice.recaps.length} 条 · {rangeLabel}</span>
      </h2>
      <section className="card card--full">
        <Recaps items={slice.recaps} />
      </section>

      <footer className="page-foot">
        数据由 <code>~/bin/memory-dashboard-data.py</code> 生成 · 每日自动更新 · 部署于 Vercel
      </footer>
    </main>
  )
}

function ModelTable({ rows }: { rows: ReturnType<typeof modelRows> }) {
  return (
    <DataTable
      rows={rows}
      columns={[
        { key: 'name', label: '模型', align: 'left', render: (r) => r.name },
        { key: 'tokens', label: 'Token', render: (r) => fullNum(r.tokens) },
        { key: 'cost', label: '成本', render: (r) => money(r.cost) },
        { key: 'calls', label: '调用', render: (r) => fullNum(r.calls) },
        { key: 'cacheRead', label: '缓存读取', render: (r) => fullNum(r.cacheRead) },
        { key: 'input', label: '输入', render: (r) => fullNum(r.input) },
        { key: 'cacheRate', label: '命中率', render: (r) => (r.tokens > 0 ? pct(r.cacheRate) : '—') },
      ]}
    />
  )
}

function HerdrTable({ slice }: { slice: NonNullable<ReturnType<typeof sliceData>> }) {
  return (
    <DataTable
      rows={slice.herdrDates.map((d, i) => ({ d, ...slice.herdrDaily[i] }))}
      columns={[
        { key: 'd', label: '日期', align: 'left', render: (r) => r.d },
        { key: 'calls', label: '调用', render: (r) => fullNum(r.calls) },
        { key: 'cost', label: '成本', render: (r) => money(r.cost) },
        { key: 'errors', label: '错误', render: (r) => fullNum(r.errors) },
        { key: 'avg', label: '平均时长', render: (r) => duration(r.calls > 0 ? r.duration_ms / r.calls / 1000 : 0) },
      ]}
    />
  )
}

function Mem0Table({ dates, counts }: { dates: string[]; counts: number[] }) {
  return (
    <DataTable
      rows={dates.map((d, i) => ({ d, n: counts[i] }))}
      columns={[
        { key: 'd', label: '日期', align: 'left', render: (r) => `${r.d} (${shortDate(r.d)})` },
        { key: 'n', label: '写入条数', render: (r) => fullNum(r.n) },
      ]}
      empty="此时间范围内没有 mem0 写入"
    />
  )
}
