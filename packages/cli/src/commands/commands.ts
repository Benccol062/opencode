import { Argument, Flag, GlobalFlag } from "effect/unstable/cli"
import { Schema } from "effect"
import { Spec } from "../framework/spec"
import { Updater } from "../services/updater"

export const PrintLogs = GlobalFlag.setting("print-logs")({
  flag: Flag.boolean("print-logs").pipe(
    Flag.withDescription("Print logs to stderr (server logs require --standalone)"),
    Flag.withDefault(false),
  ),
})

declare const OPENCODE_CLI_NAME: string | undefined

const ServerParams = {
  standalone: Flag.boolean("standalone").pipe(
    Flag.withDescription("使用私有 server 而不是后台 service"),
    Flag.withDefault(false),
  ),
  server: Flag.string("server").pipe(
    Flag.withDescription("连接到 server URL 而不是后台 service"),
    Flag.optional,
  ),
}

const PermissionParams = {
  auto: Flag.boolean("auto").pipe(
    Flag.withDescription("Auto-approve permissions that are not explicitly denied"),
    Flag.withDefault(false),
  ),
  yolo: Flag.boolean("yolo").pipe(Flag.withDefault(false), Flag.withHidden),
  dangerouslySkipPermissions: Flag.boolean("dangerously-skip-permissions").pipe(
    Flag.withDefault(false),
    Flag.withHidden,
  ),
}

const Root = Spec.make(typeof OPENCODE_CLI_NAME === "string" ? OPENCODE_CLI_NAME : "opencode", {
  description: "OpenCode 命令行界面",
  params: {
    ...ServerParams,
    ...PermissionParams,
    directory: Argument.string("directory").pipe(
      Argument.withDescription("启动 OpenCode 的目录"),
      Argument.optional,
    ),
    continue: Flag.boolean("continue").pipe(
      Flag.withAlias("c"),
      Flag.withDescription("继续上一个会话"),
      Flag.withDefault(false),
    ),
    session: Flag.string("session").pipe(
      Flag.withAlias("s"),
      Flag.withDescription("要继续的会话 Session ID"),
      Flag.optional,
    ),
    prompt: Flag.string("prompt").pipe(Flag.withDescription("要使用的提示词"), Flag.optional),
  },
  commands: [
    Spec.make("upgrade", {
      description: "将 OpenCode 升级到最新版本或指定版本",
      aliases: ["update"],
      params: {
        target: Argument.string("target").pipe(
          Argument.withDescription("要升级到的版本(可带或不带前导 v)"),
          Argument.optional,
        ),
        method: Flag.choice("method", Updater.methods).pipe(
          Flag.withAlias("m"),
          Flag.withDescription("要使用的安装方式"),
          Flag.optional,
        ),
      },
    }),
    Spec.make("uninstall", {
      description: "卸载 OpenCode 并删除所有相关文件",
      params: {
        keepConfig: Flag.boolean("keep-config").pipe(
          Flag.withAlias("c"),
          Flag.withDescription("保留配置文件"),
          Flag.withDefault(false),
        ),
        keepData: Flag.boolean("keep-data").pipe(
          Flag.withAlias("d"),
          Flag.withDescription("保留会话数据和快照"),
          Flag.withDefault(false),
        ),
        dryRun: Flag.boolean("dry-run").pipe(
          Flag.withDescription("仅显示将被删除的内容而不实际删除"),
          Flag.withDefault(false),
        ),
        force: Flag.boolean("force").pipe(
          Flag.withAlias("f"),
          Flag.withDescription("Skip confirmation prompts"),
          Flag.withDefault(false),
        ),
      },
    }),
    Spec.make("acp", { description: "启动 Agent Client Protocol 服务端" }),
    Spec.make("api", {
      description: "向正在运行的 server 发起请求",
      params: {
        ...ServerParams,
        request: Argument.string("operation | method path").pipe(
          Argument.withDescription("OpenAPI 操作 ID，或 HTTP 方法加路径"),
          Argument.variadic({ min: 1, max: 2 }),
        ),
        data: Flag.string("data").pipe(Flag.withAlias("d"), Flag.withDescription("请求体"), Flag.optional),
        header: Flag.string("header").pipe(
          Flag.withAlias("H"),
          Flag.withDescription("Request header in name:value form"),
          Flag.atMost(100),
        ),
        param: Flag.keyValuePair("param").pipe(Flag.withDescription("OpenAPI 路径或查询参数"), Flag.optional),
      },
    }),
    Spec.make("debug", {
      description: "调试与故障排查工具",
      commands: [
        Spec.make("agents", { description: "列出所有 agent" }),
        Spec.make("config", { description: "列出配置来源" }),
        Spec.make("paths", {
          description: "显示全局路径(data、config、cache、state)",
          params: {
            name: Argument.choice("name", [
              "db",
              "home",
              "data",
              "config",
              "cache",
              "state",
              "tmp",
              "bin",
              "log",
              "repos",
            ]).pipe(
              Argument.withDescription("Print only one path: db, home, data, config, cache, state, tmp, bin, log, repos"),
              Argument.optional,
            ),
          },
        }),
      ],
    }),
    Spec.make("auth", {
      description: "管理 AI provider 与凭证",
      commands: [
        Spec.make("list", {
          description: "列出 provider 与凭证",
          params: {
            ...ServerParams,
            format: Flag.choice("format", ["default", "json"]).pipe(
              Flag.withDescription("输出格式"),
              Flag.withDefault("default"),
            ),
          },
        }),
        Spec.make("login", {
          description: "log in to a provider",
          params: {
            ...ServerParams,
            target: Argument.string("target").pipe(
              Argument.withDescription("Integration ID, name, or well-known provider URL"),
              Argument.optional,
            ),
            method: Flag.string("method").pipe(Flag.withDescription("认证方式 ID"), Flag.optional),
            answer: Flag.string("answer").pipe(
              Flag.withDescription("provider 表单答案(key=value；多个字段请重复填写)"),
              Flag.atMost(100),
            ),
          },
        }),
        Spec.make("logout", {
          description: "登出已保存的账号",
          params: {
            ...ServerParams,
            target: Argument.string("target").pipe(
              Argument.withDescription("集成 ID 或名称"),
              Argument.optional,
            ),
            credential: Argument.string("credential").pipe(
              Argument.withDescription("凭证 ID 或标签(省略时打开账号选择器)"),
              Argument.optional,
            ),
          },
        }),
        Spec.make("switch", {
          description: "切换某集成的当前账号",
          params: {
            ...ServerParams,
            target: Argument.string("target").pipe(
              Argument.withDescription("集成 ID 或名称"),
              Argument.optional,
            ),
            credential: Argument.string("credential").pipe(
              Argument.withDescription("凭证 ID 或标签(省略时打开账号选择器)"),
              Argument.optional,
            ),
          },
        }),
      ],
    }),
    Spec.make("mcp", {
      description: "管理 MCP(Model Context Protocol)服务端",
      commands: [
        Spec.make("list", { description: "列出已配置的 MCP 服务端及其状态" }),
        Spec.make("add", {
          description: "向配置中添加 MCP 服务端",
          params: {
            name: Argument.string("name").pipe(Argument.withDescription("MCP 服务端的名称")),
            command: Argument.string("command").pipe(
              Argument.withDescription("Command and arguments for a local server, passed after --"),
              Argument.variadic({ min: 0 }),
            ),
            url: Flag.string("url").pipe(Flag.withDescription("远程 MCP 服务端的 URL"), Flag.optional),
            header: Flag.keyValuePair("header").pipe(
              Flag.withDescription("远程服务端的 HTTP 头，形如 name=value"),
              Flag.optional,
            ),
            env: Flag.keyValuePair("env").pipe(
              Flag.withDescription("本地服务端的环境变量，形如 name=value"),
              Flag.optional,
            ),
            global: Flag.boolean("global").pipe(
              Flag.withDescription("写入全局配置而非项目配置"),
              Flag.withDefault(false),
            ),
          },
        }),
        Spec.make("auth", {
          description: "Authenticate with an OAuth-capable remote MCP server",
          params: { name: Argument.string("name").pipe(Argument.withDescription("MCP 服务端的名称")) },
        }),
        Spec.make("logout", {
          description: "删除某 MCP 服务端已存储的 OAuth 凭证",
          params: { name: Argument.string("name").pipe(Argument.withDescription("MCP 服务端的名称")) },
        }),
      ],
    }),
    Spec.make("plugin", {
      description: "管理插件",
      commands: [
        Spec.make("list", {
          description: "列出插件",
          params: {
            builtin: Flag.boolean("builtin").pipe(
              Flag.withDescription("Include built-in server plugins"),
              Flag.withDefault(false),
            ),
          },
        }),
        Spec.make("add", {
          description: "安装插件并添加到全局配置",
          params: {
            package: Argument.string("package").pipe(Argument.withDescription("npm registry 或 Git 包说明符")),
          },
        }),
        Spec.make("check", {
          description: "检查包插件更新",
          params: {
            target: Argument.string("target").pipe(
              Argument.withDescription("已配置的包目标"),
              Argument.optional,
            ),
          },
        }),
        Spec.make("update", {
          description: "更新包插件",
          params: {
            target: Argument.string("target").pipe(
              Argument.withDescription("已配置的包目标；省略则更新所有过时插件"),
              Argument.optional,
            ),
          },
        }),
        Spec.make("remove", {
          description: "从全局配置中移除插件",
          params: {
            package: Argument.string("package").pipe(Argument.withDescription("已配置的包说明符")),
          },
        }),
      ],
    }),
    Spec.make("models", {
      description: "列出所有可用模型",
      params: ServerParams,
    }),
    Spec.make("stats", {
      description: "显示可分享的使用统计",
      params: {
        ...ServerParams,
        days: Flag.integer("days").pipe(
          Flag.withSchema(Schema.Int.check(Schema.isGreaterThanOrEqualTo(0))),
          Flag.withDescription("显示最近 N 天；0 表示今天"),
          Flag.optional,
        ),
        year: Flag.integer("year").pipe(
          Flag.withSchema(Schema.Int.check(Schema.isBetween({ minimum: 1970, maximum: 9_999 }))),
          Flag.withDescription("显示一个自然年"),
          Flag.optional,
        ),
        all: Flag.boolean("all").pipe(Flag.withDescription("显示累计统计"), Flag.withDefault(false)),
        project: Flag.string("project").pipe(
          Flag.withDescription('Filter by project ID, or use "." for the current project'),
          Flag.optional,
        ),
        models: Flag.boolean("models").pipe(Flag.withDescription("显示模型用量"), Flag.withDefault(false)),
        tools: Flag.boolean("tools").pipe(Flag.withDescription("显示工具可靠性"), Flag.withDefault(false)),
        cost: Flag.boolean("cost").pipe(Flag.withDescription("显示费用与 token 明细"), Flag.withDefault(false)),
        full: Flag.boolean("full").pipe(Flag.withDescription("显示所有明细部分"), Flag.withDefault(false)),
        limit: Flag.integer("limit").pipe(
          Flag.withSchema(Schema.Int.check(Schema.isGreaterThanOrEqualTo(1))),
          Flag.withDescription("明细部分的行数"),
          Flag.withDefault(5),
        ),
        json: Flag.boolean("json").pipe(Flag.withDescription("以 JSON 输出统计信息"), Flag.withDefault(false)),
      },
    }),
    Spec.make("mini", {
      description: "启动极简交互界面",
      params: {
        ...ServerParams,
        continue: Flag.boolean("continue").pipe(
          Flag.withAlias("c"),
          Flag.withDescription("继续上一个会话"),
          Flag.withDefault(false),
        ),
        session: Flag.string("session").pipe(
          Flag.withAlias("s"),
          Flag.withDescription("要继续的会话 Session ID"),
          Flag.optional,
        ),
        fork: Flag.boolean("fork").pipe(
          Flag.withDescription("继续时复刻会话"),
          Flag.withDefault(false),
        ),
        replay: Flag.boolean("replay").pipe(
          Flag.withDescription("Restore session history on resume and resize (disable with --no-replay)"),
          Flag.optional,
        ),
        replayLimit: Flag.integer("replay-limit").pipe(
          Flag.withDescription("Limit replay to the newest N messages (default: 200)"),
          Flag.optional,
        ),
        model: Flag.string("model").pipe(
          Flag.withAlias("m"),
          Flag.withDescription("Model to use in the format provider/model"),
          Flag.optional,
        ),
        agent: Flag.string("agent").pipe(Flag.withDescription("要使用的 agent"), Flag.optional),
        prompt: Flag.string("prompt").pipe(Flag.withDescription("要使用的提示词"), Flag.optional),
        demo: Flag.boolean("demo").pipe(Flag.withDefault(false), Flag.withHidden),
      },
    }),
    Spec.make("run", {
      description: "使用一条消息运行 OpenCode",
      params: {
        ...ServerParams,
        message: Argument.string("message").pipe(
          Argument.withDescription("要发送的消息"),
          Argument.variadic({ min: 0 }),
        ),
        continue: Flag.boolean("continue").pipe(
          Flag.withAlias("c"),
          Flag.withDescription("继续上一个会话"),
          Flag.withDefault(false),
        ),
        session: Flag.string("session").pipe(
          Flag.withAlias("s"),
          Flag.withDescription("要继续的会话 Session ID"),
          Flag.optional,
        ),
        fork: Flag.boolean("fork").pipe(
          Flag.withDescription("继续前复刻会话"),
          Flag.withDefault(false),
        ),
        model: Flag.string("model").pipe(
          Flag.withAlias("m"),
          Flag.withDescription("Model to use in the format provider/model#variant"),
          Flag.optional,
        ),
        agent: Flag.string("agent").pipe(Flag.withDescription("要使用的 agent"), Flag.optional),
        format: Flag.choice("format", ["default", "json"]).pipe(
          Flag.withDescription("输出格式"),
          Flag.withDefault("default"),
        ),
        file: Flag.string("file").pipe(
          Flag.withAlias("f"),
          Flag.withDescription("要附加到消息的文件"),
          Flag.atMost(100),
        ),
        title: Flag.string("title").pipe(Flag.withDescription("会话标题"), Flag.optional),
        thinking: Flag.boolean("thinking").pipe(Flag.withDescription("显示思考块"), Flag.withDefault(false)),
        ...PermissionParams,
      },
    }),
    Spec.make("session", {
      description: "管理会话",
      commands: [
        Spec.make("list", {
          description: "List top-level sessions in the current project, newest first",
          params: {
            ...ServerParams,
            maxCount: Flag.integer("max-count").pipe(
              Flag.withAlias("n"),
              Flag.withSchema(Schema.Int.check(Schema.isGreaterThanOrEqualTo(1))),
              Flag.withDescription("Limit to N most recent sessions (default: 100)"),
              Flag.optional,
            ),
            format: Flag.choice("format", ["table", "json"]).pipe(
              Flag.withDescription("输出格式"),
              Flag.withDefault("table"),
            ),
          },
        }),
        Spec.make("delete", {
          description: "删除会话及其子会话",
          params: {
            ...ServerParams,
            sessionID: Argument.string("sessionID").pipe(Argument.withDescription("要删除的会话 Session ID")),
          },
        }),
        Spec.make("export", {
          description: "以 JSON 导出会话数据",
          params: {
            ...ServerParams,
            session: Argument.string("session").pipe(
              Argument.withDescription("要导出的会话 Session ID"),
              Argument.optional,
            ),
            sanitize: Flag.boolean("sanitize").pipe(
              Flag.withDescription("脱敏转录与文件中的敏感数据"),
              Flag.withDefault(false),
            ),
          },
        }),
        Spec.make("import", {
          description: "从 JSON 文件或 URL 导入会话数据",
          params: {
            ...ServerParams,
            file: Argument.string("file").pipe(Argument.withDescription("要导入的 JSON 文件或 URL")),
            directory: Flag.string("directory").pipe(
              Flag.withDescription("导入会话的目标目录"),
              Flag.optional,
            ),
          },
        }),
      ],
    }),
    Spec.make("service", {
      description: "管理后台 server",
      commands: [
        Spec.make("start", { description: "启动后台 server" }),
        Spec.make("restart", { description: "重启后台 server" }),
        Spec.make("status", { description: "显示后台 server 状态" }),
        Spec.make("stop", { description: "停止后台 server" }),
        Spec.make("get", {
          description: "获取 service 配置",
          params: {
            key: Argument.string("key").pipe(Argument.withDescription("service 设置项或 env"), Argument.optional),
            name: Argument.string("name").pipe(
              Argument.withDescription("环境变量名"),
              Argument.optional,
            ),
          },
        }),
        Spec.make("set", {
          description: "设置 service 配置",
          params: {
            key: Argument.string("key").pipe(Argument.withDescription("service 设置项或 env")),
            value: Argument.string("value").pipe(
              Argument.withDescription("设置值或环境变量名"),
            ),
            nestedValue: Argument.string("env-value").pipe(
              Argument.withDescription("环境变量值"),
              Argument.optional,
            ),
          },
        }),
        Spec.make("unset", {
          description: "取消 service 配置",
          params: {
            key: Argument.string("key").pipe(Argument.withDescription("service 设置项或 env")),
            name: Argument.string("name").pipe(
              Argument.withDescription("环境变量名"),
              Argument.optional,
            ),
          },
        }),
      ],
    }),
    Spec.make("reload", {
      description: "重新加载配置",
      params: {
        ...ServerParams,
      },
    }),
    Spec.make("pair", {
      description: "显示 server 配对信息",
      params: {
        url: Flag.string("url").pipe(
          Flag.withDescription("在配对 QR 码中公布外部 HTTP(S) server URL"),
          Flag.mapTryCatch(
            (value) => {
              const url = new URL(value)
              if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash)
                throw new Error("无效的配对 URL")
              return url.href.replace(/\/+$/, "")
            },
            () => "应为不带凭证、查询参数或片段的 HTTP(S) server URL",
          ),
          Flag.optional,
        ),
      },
    }),
    Spec.make("serve", {
      description: "启动 v2 API 与 web server",
      params: {
        hostname: Flag.string("hostname").pipe(Flag.optional),
        port: Flag.integer("port").pipe(Flag.optional),
        cors: Flag.string("cors").pipe(
          Flag.withSchema(Schema.NonEmptyString),
          Flag.withDescription("额外允许的 CORS 来源(多个来源请重复填写)"),
          Flag.atLeast(0),
        ),
        service: Flag.boolean("service").pipe(Flag.withDefault(false)),
        stdio: Flag.boolean("stdio").pipe(Flag.withDefault(false)),
      },
    }),
  ],
})

export const Commands = Root
