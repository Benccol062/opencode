import path from "node:path"

export function databasePath(data: string) {
  // 汉化版：与官方版共享会话数据库（基线同为 v2.0.14，schema 一致）。
  // 可用 OPENCODE_DB 环境变量覆盖。
  const filename = process.env.OPENCODE_DB ?? "opencode.db"
  return filename === ":memory:" ? filename : path.resolve(data, filename)
}
