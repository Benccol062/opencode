import { release } from "node:os"

export function describeOS() {
  const name =
    process.platform === "darwin"
      ? "macOS"
      : process.platform === "win32"
        ? "Windows"
        : process.platform === "linux"
          ? "Linux"
          : process.platform
  return `${name} ${release()} (${process.arch})`
}

export function describeTerminal() {
  const program = process.env.TERM_PROGRAM || process.env.TERM || "未知"
  const version = process.env.TERM_PROGRAM_VERSION ? ` ${process.env.TERM_PROGRAM_VERSION}` : ""
  const multiplexer = process.env.TMUX ? " （在 tmux 中）" : process.env.STY ? " in screen" : ""
  return `${program}${version}${multiplexer}`
}
