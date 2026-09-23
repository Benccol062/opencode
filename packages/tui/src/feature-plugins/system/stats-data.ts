import type { SessionStatsInfo } from "@opencode/client"
import { TokenUsage } from "@opencode/schema/token-usage"

export function statsMetrics(stats: SessionStatsInfo) {
  return [
    {
      label: "令牌",
      value: TokenUsage.total(stats.tokens),
    },
    { label: "最长连续", value: stats.streak },
    { label: "活跃天数", value: stats.activeDays },
    { label: "会话数", value: stats.sessions },
  ]
}

export function statsNumber(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value)
}
