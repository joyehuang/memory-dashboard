export interface PiTotals {
  tokens: number
  cost: number
  turns: number
  sessions: number
  input: number
  output: number
  cacheRead: number
  reasoning: number
  costIn: number
  costOut: number
  costCache: number
  cacheRate: number
}

export interface HerdrTotals {
  calls: number
  cost: number
  errors: number
  sessions: number
  teamRuns: number
  teamActive: number
  avgDurationSec: number
  errorRate: number
}

export interface DailyEntry {
  input: number
  output: number
  cacheRead: number
  cacheWrite: number
  reasoning: number
  tokens: number
  cost: number
  costIn: number
  costOut: number
  costCache: number
  turns: number
  cacheRate: number
}

/** Claude Code sessions report no pricing, so this has no cost fields at all. */
export interface ClaudeTotals {
  tokens: number
  turns: number
  sessions: number
  input: number
  output: number
  cacheRead: number
  cacheWrite: number
  cacheRate: number
}

export interface ClaudeDailyEntry {
  input: number
  output: number
  cacheRead: number
  cacheWrite: number
  tokens: number
  turns: number
  cacheRate: number
}

export interface ModelEntry {
  tokens: number
  cost: number
  calls: number
  cacheRead: number
  input: number
  cacheRate: number
}

export type ClaudeModelEntry = Omit<ModelEntry, 'cost'>

export interface HerdrDailyEntry {
  calls: number
  cost: number
  errors: number
  duration_ms: number
}

export interface HerdrBotEntry {
  calls: number
  cost: number
  errors: number
}

export interface Recap {
  date: string
  text: string
}

export interface Dashboard {
  generatedAt: string
  totals: {
    pi: PiTotals
    claude: ClaudeTotals
    mem0: { entries: number }
    memoryMd: { lines: number; chars: number }
    herdr: HerdrTotals
  }
  daily: Record<string, DailyEntry>
  claudeDaily: Record<string, ClaudeDailyEntry>
  models: Record<string, ModelEntry>
  claudeModels: Record<string, ClaudeModelEntry>
  recaps: Recap[]
  mem0Ops: Record<string, number>
  herdrDaily: Record<string, HerdrDailyEntry>
  herdrBots: Record<string, HerdrBotEntry>
}

export type RangeKey = '7' | '30' | 'all'
