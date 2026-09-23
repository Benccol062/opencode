import type { TuiPluginApi } from "@opencode-ai/plugin/tui"
import { createMemo, For, type Accessor } from "solid-js"
import { DEFAULT_THEMES, useTheme } from "../../context/theme"
import { useCommandShortcut } from "../../keymap"

const themeCount = Object.keys(DEFAULT_THEMES).length

type TipPart = { text: string; highlight: boolean }
type TipShortcut = Accessor<string>
type Shortcuts = {
  agentCycle: TipShortcut
  childFirst: TipShortcut
  childNext: TipShortcut
  childPrevious: TipShortcut
  commandList: TipShortcut
  editorOpen: TipShortcut
  helpShow: TipShortcut
  inputClear: TipShortcut
  inputNewline: TipShortcut
  inputPaste: TipShortcut
  inputUndo: TipShortcut
  leader: TipShortcut
  messagesCopy: TipShortcut
  messagesFirst: TipShortcut
  messagesLast: TipShortcut
  messagesPageDown: TipShortcut
  messagesPageUp: TipShortcut
  messagesToggleConceal: TipShortcut
  modelCycleRecent: TipShortcut
  modelList: TipShortcut
  sessionExport: TipShortcut
  sessionInterrupt: TipShortcut
  sessionList: TipShortcut
  sessionNew: TipShortcut
  sessionParent: TipShortcut
  sessionPinToggle: TipShortcut
  sessionQuickSwitch1: TipShortcut
  sessionQuickSwitch9: TipShortcut
  sessionSidebarToggle: TipShortcut
  sessionTimeline: TipShortcut
  statusView: TipShortcut
  terminalSuspend: TipShortcut
  themeList: TipShortcut
}
type Tip = string | ((shortcuts: Shortcuts) => string | undefined)

function parse(tip: string): TipPart[] {
  const parts: TipPart[] = []
  const regex = /\{highlight\}(.*?)\{\/highlight\}/g
  const found = Array.from(tip.matchAll(regex))
  const state = found.reduce(
    (acc, match) => {
      const start = match.index ?? 0
      if (start > acc.index) {
        acc.parts.push({ text: tip.slice(acc.index, start), highlight: false })
      }
      acc.parts.push({ text: match[1], highlight: true })
      acc.index = start + match[0].length
      return acc
    },
    { parts, index: 0 },
  )

  if (state.index < tip.length) {
    parts.push({ text: tip.slice(state.index), highlight: false })
  }

  return parts
}

const NO_MODELS_TIP = "运行 {highlight}/connect{/highlight} 添加 AI 提供方并开始编码"
const NO_MODELS_PARTS = parse(NO_MODELS_TIP)

function shortcutText(value: string) {
  return `{highlight}${value}{/highlight}`
}

function commandText(command: string, shortcut: string) {
  if (!shortcut) return shortcutText(command)
  return `${shortcutText(command)} or ${shortcutText(shortcut)}`
}

function press(shortcut: string, text: string) {
  if (!shortcut) return undefined
  return `Press ${shortcutText(shortcut)} ${text}`
}

function configShortcut(api: TuiPluginApi, command: string): TipShortcut {
  return () =>
    api.tuiConfig.keybinds
      .get(command)
      .map((binding) => api.keys.formatSequence(Array.from(api.keymap.parseKeySequence(binding.key))))
      .filter(Boolean)
      .join(", ")
}

export function Tips(props: { api: TuiPluginApi; connected?: boolean }) {
  const theme = useTheme().theme
  const tipOffset = Math.random()
  const shortcuts: Shortcuts = {
    agentCycle: useCommandShortcut("agent.cycle"),
    childFirst: configShortcut(props.api, "session.child.first"),
    childNext: configShortcut(props.api, "session.child.next"),
    childPrevious: configShortcut(props.api, "session.child.previous"),
    commandList: useCommandShortcut("command.palette.show"),
    editorOpen: useCommandShortcut("prompt.editor"),
    helpShow: useCommandShortcut("help.show"),
    inputClear: useCommandShortcut("prompt.clear"),
    inputNewline: useCommandShortcut("input.newline"),
    inputPaste: useCommandShortcut("prompt.paste"),
    inputUndo: useCommandShortcut("input.undo"),
    leader: configShortcut(props.api, "leader"),
    messagesCopy: configShortcut(props.api, "messages.copy"),
    messagesFirst: configShortcut(props.api, "session.first"),
    messagesLast: configShortcut(props.api, "session.last"),
    messagesPageDown: configShortcut(props.api, "session.page.down"),
    messagesPageUp: configShortcut(props.api, "session.page.up"),
    messagesToggleConceal: configShortcut(props.api, "session.toggle.conceal"),
    modelCycleRecent: useCommandShortcut("model.cycle_recent"),
    modelList: useCommandShortcut("model.list"),
    sessionExport: configShortcut(props.api, "session.export"),
    sessionInterrupt: configShortcut(props.api, "session.interrupt"),
    sessionList: useCommandShortcut("session.list"),
    sessionNew: useCommandShortcut("session.new"),
    sessionParent: configShortcut(props.api, "session.parent"),
    sessionPinToggle: configShortcut(props.api, "session.pin.toggle"),
    sessionQuickSwitch1: useCommandShortcut("session.quick_switch.1"),
    sessionQuickSwitch9: useCommandShortcut("session.quick_switch.9"),
    sessionSidebarToggle: configShortcut(props.api, "session.sidebar.toggle"),
    sessionTimeline: configShortcut(props.api, "session.timeline"),
    statusView: useCommandShortcut("opencode.status"),
    terminalSuspend: useCommandShortcut("terminal.suspend"),
    themeList: useCommandShortcut("theme.switch"),
  }
  const tip = createMemo(() => {
    if (props.connected === false) return NO_MODELS_TIP
    const tips = [...TIPS, process.platform !== "win32" ? TERMINAL_SUSPEND_TIP : INPUT_UNDO_TIP].flatMap((item) => {
      const value = typeof item === "string" ? item : item(shortcuts)
      return value ? [value] : []
    })
    return tips[Math.floor(tipOffset * tips.length)] ?? NO_MODELS_TIP
  }, NO_MODELS_TIP)
  // Solid can expose a memo's initial value while a pure computation is pending.
  const parts = createMemo(() => {
    const value = tip()
    if (typeof value === "string") return parse(value)
    return NO_MODELS_PARTS
  }, NO_MODELS_PARTS)

  return (
    <box flexDirection="row" maxWidth="100%">
      <text flexShrink={0} style={{ fg: theme.warning }}>
        ● 提示{" "}
      </text>
      <text flexShrink={1} wrapMode="word">
        <For each={parts()}>
          {(part) => <span style={{ fg: part.highlight ? theme.text : theme.textMuted }}>{part.text}</span>}
        </For>
      </text>
    </box>
  )
}

const TIPS: Tip[] = [
  "输入 {highlight}@{\/highlight} 后接文件名，可模糊搜索并附加文件",
  "以 {highlight}!{/highlight} 开头发送消息即可运行 shell 命令（例如 {highlight}!ls -la{/highlight}）",
  (shortcuts) => press(shortcuts.agentCycle(), "以在 Build 和 Plan 智能体之间切换"),
  "使用 {highlight}/undo{/highlight} 撤销上一条消息及文件更改",
  "使用 {highlight}/redo{/highlight} 恢复之前撤销的消息及文件更改",
  "运行 {highlight}/share{/highlight} 创建公开的 opencode.ai 链接",
  "将图片或 PDF 拖放到终端中作为上下文",
  (shortcuts) => press(shortcuts.inputPaste(), "以从剪贴板向提示词中粘贴图片"),
  (shortcuts) => `Use ${commandText("/editor", shortcuts.editorOpen())} to compose messages in your external editor`,
  "运行 {highlight}/init{/highlight} 基于代码库自动生成项目规则",
  (shortcuts) => `Use ${commandText("/models", shortcuts.modelList())} to switch between available AI models`,
  (shortcuts) => `Use ${commandText("/themes", shortcuts.themeList())} to switch between ${themeCount} built-in themes`,
  (shortcuts) => `Use ${commandText("/new", shortcuts.sessionNew())} to start a fresh conversation session`,
  (shortcuts) => `Use ${commandText("/sessions", shortcuts.sessionList())} to list, pin, and continue sessions`,
  (shortcuts) => press(shortcuts.sessionPinToggle(), "在会话列表中将某个会话置顶"),
  (shortcuts) =>
    shortcuts.sessionQuickSwitch1() && shortcuts.sessionQuickSwitch9()
      ? `Use ${shortcutText(shortcuts.sessionQuickSwitch1())} through ${shortcutText(shortcuts.sessionQuickSwitch9())} to switch pinned sessions`
      : undefined,
  "运行 {highlight}/compact{/highlight} 在接近上下文上限时总结长会话",
  (shortcuts) => `Use ${commandText("/export", shortcuts.sessionExport())} to save the conversation as Markdown`,
  (shortcuts) => press(shortcuts.messagesCopy(), "以将助手的上一条消息复制到剪贴板"),
  (shortcuts) => press(shortcuts.commandList(), "以查看所有可用操作和命令"),
  "运行 {highlight}/connect{/highlight} 为 75+ 个受支持的 LLM 提供方添加 API 密钥",
  (shortcuts) => `The leader key is ${shortcutText(shortcuts.leader())}; combine with other keys for quick actions`,
  (shortcuts) => press(shortcuts.modelCycleRecent(), "以在最近使用的模型之间快速切换"),
  (shortcuts) => press(shortcuts.sessionSidebarToggle(), "在会话中显示或隐藏侧边栏面板"),
  (shortcuts) =>
    shortcuts.messagesPageUp() && shortcuts.messagesPageDown()
      ? `Use ${shortcutText(shortcuts.messagesPageUp())}/${shortcutText(shortcuts.messagesPageDown())} to navigate through conversation history`
      : undefined,
  (shortcuts) => press(shortcuts.messagesFirst(), "以跳转到会话开头"),
  (shortcuts) => press(shortcuts.messagesLast(), "以跳转到最新消息"),
  (shortcuts) => press(shortcuts.inputNewline(), "以在提示词中换行"),
  (shortcuts) => press(shortcuts.inputClear(), "在输入时清空输入框"),
  (shortcuts) => press(shortcuts.sessionInterrupt(), "以中途停止 AI 回复"),
  "切换到 {highlight}Plan{/highlight} 智能体，仅获取建议而不做更改",
  "在提示词中使用 {highlight}@agent-name{/highlight} 调用专用子智能体",
  (shortcuts) => {
    const items = [
      shortcuts.sessionParent(),
      shortcuts.childFirst(),
      shortcuts.childPrevious(),
      shortcuts.childNext(),
    ].filter(Boolean)
    if (!items.length) return undefined
    return `Use ${items.map(shortcutText).join(" / ")} for parent/child sessions`
  },
  "创建 {highlight}opencode.json{/highlight} 配置服务端设置，{highlight}tui.json{/highlight} 配置 TUI",
  "将 TUI 设置放在 {highlight}~/.config/opencode/tui.json{/highlight} 中作为全局配置",
  "在配置中添加 {highlight}$schema{/highlight} 以在编辑器中获得自动补全",
  "在配置中设置 {highlight}model{/highlight} 以指定默认模型",
  "通过 {highlight}keybinds{/highlight} 小节覆盖 {highlight}tui.json{/highlight} 中的任意快捷键",
  "将任意快捷键设为 {highlight}none{/highlight} 可完全禁用它",
  "在 {highlight}mcp{/highlight} 配置小节中配置本地或远程 MCP 服务",
  "向 {highlight}.opencode/commands/{/highlight} 添加 {highlight}.md{/highlight} 文件以复用提示词",
  "在自定义命令中使用 {highlight}$ARGUMENTS{/highlight}、{highlight}$1{/highlight}、{highlight}$2{/highlight} 实现动态输入",
  "使用反引号注入 shell 命令输出（例如 {highlight}`git status`{/highlight}）",
  "向 {highlight}.opencode/agents/{/highlight} 添加 {highlight}.md{/highlight} 文件以创建专用 AI 角色",
  "为 {highlight}edit{/highlight}、{highlight}bash{/highlight} 和 {highlight}webfetch{/highlight} 工具配置按智能体区分的权限",
  '使用 {highlight}"git *": "allow"{/highlight} 之类的模式实现细粒度 bash 权限',
  '设置 {highlight}"rm -rf *": "deny"{/highlight} 以拦截破坏性命令',
  '配置 {highlight}"git push": "ask"{/highlight} 以在推送前要求确认',
  '设置 {highlight}"formatter": true{/highlight} 以启用内置格式化工具',
  '设置 {highlight}"formatter": false{/highlight} 以禁用继承的格式化工具',
  "在配置中按文件扩展名定义自定义格式化命令",
  '设置 {highlight}"lsp": true{/highlight} 以启用内置 LSP 代码分析',
  "在 {highlight}.opencode/tools/{/highlight} 中创建 {highlight}.ts{/highlight} 文件以定义新的 LLM 工具",
  "工具定义可调用 Python、Go 等语言编写的脚本",
  "向 {highlight}.opencode/plugins/{/highlight} 添加 {highlight}.ts{/highlight} 文件以注册事件钩子",
  "使用插件在会话完成时发送 OS 通知",
  "创建插件以阻止 OpenCode 读取敏感文件",
  "使用 {highlight}opencode run{/highlight} 进行非交互式脚本调用",
  "使用 {highlight}opencode --continue{/highlight} 恢复上一个会话",
  "使用 {highlight}opencode run -f file.ts{/highlight} 通过 CLI 附加文件",
  "使用 {highlight}--format json{/highlight} 在脚本中输出机器可读结果",
  "运行 {highlight}opencode serve{/highlight} 以无头 API 方式访问 OpenCode",
  "使用 {highlight}opencode run --attach{/highlight} 连接到正在运行的服务",
  "运行 {highlight}opencode upgrade{/highlight} 更新到最新版本",
  "运行 {highlight}opencode auth list{/highlight} 查看所有已配置的提供方",
  "运行 {highlight}opencode agent create{/highlight} 进入智能体创建向导",
  "在 GitHub issue/PR 中使用 {highlight}/opencode{/highlight} 触发 AI 操作",
  "运行 {highlight}opencode github install{/highlight} 设置 GitHub 工作流",
  "在 issue 下评论 {highlight}/opencode fix this{/highlight} 可自动创建 PR",
  "在 PR 代码行评论 {highlight}/oc{/highlight} 可进行针对性代码评审",
  'Use {highlight}"theme": "system"{/highlight} to match your terminal\'s colors',
  "在 {highlight}.opencode/themes/{/highlight} 目录中创建 JSON 主题文件",
  "主题支持两种模式下的深色/浅色变体",
  "在自定义主题 JSON 中使用 0-255 数字 xterm 色号",
  "使用 {highlight}{env:VAR_NAME}{/highlight} 在配置中引用环境变量",
  "使用 {highlight}{file:path}{/highlight} 将文件内容引入配置值",
  "在配置中使用 {highlight}instructions{/highlight} 加载额外的规则文件",
  "将智能体 {highlight}temperature{/highlight} 设为 0.0（专注）到 1.0（发散）",
  "配置 {highlight}steps{/highlight} 以限制每次请求的智能体迭代次数",
  '设置 {highlight}"tools": {"bash": false}{/highlight} 以禁用特定工具',
  '设置 {highlight}"mcp_*": false{/highlight} 以禁用某个 MCP 服务的全部工具',
  "按智能体配置覆盖全局工具设置",
  '设置 {highlight}"share": "auto"{/highlight} 以自动分享所有会话',
  '设置 {highlight}"share": "disabled"{/highlight} 以禁止分享任何会话',
  "运行 {highlight}/unshare{/highlight} 以取消会话的公开访问",
  "{highlight}doom_loop{/highlight} 权限可防止无限工具调用循环",
  "{highlight}external_directory{/highlight} 权限可保护项目之外的文件",
  "运行 {highlight}opencode debug config{/highlight} 排查配置问题",
  "使用 {highlight}--print-logs{/highlight} 参数在 stderr 中查看详细日志",
  (shortcuts) => `Use ${commandText("/timeline", shortcuts.sessionTimeline())} to jump to specific messages`,
  (shortcuts) => press(shortcuts.messagesToggleConceal(), "以切换消息中代码块的可见性"),
  (shortcuts) => `Use ${commandText("/status", shortcuts.statusView())} to see system status info`,
  "在 {highlight}tui.json{/highlight} 中启用 {highlight}scroll_acceleration{/highlight} 以获得平滑滚动",
  (shortcuts) =>
    shortcuts.commandList()
      ? `Toggle username display in chat via the command palette (${shortcutText(shortcuts.commandList())})`
      : "Toggle username display in chat via the command palette",
  "在容器中运行 {highlight}docker run -it --rm ghcr.io/anomalyco/opencode{/highlight}",
  "将 {highlight}/connect{/highlight} 与 OpenCode Zen 配合使用，获取精选测试模型",
  "将项目的 {highlight}AGENTS.md{/highlight} 文件提交到 Git 以便团队共享",
  "使用 {highlight}/review{/highlight} 评审未提交的更改、分支或 PR",
  (shortcuts) => `Use ${commandText("/help", shortcuts.helpShow())} to show the help dialog`,
  "使用 {highlight}/rename{/highlight} 重命名当前会话",
]

const INPUT_UNDO_TIP: Tip = (shortcuts) => press(shortcuts.inputUndo(), "以撤销提示词中的更改")
const TERMINAL_SUSPEND_TIP: Tip = (shortcuts) =>
  press(shortcuts.terminalSuspend(), "以挂起终端并返回 shell")
