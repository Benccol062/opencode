import { createMemo } from "solid-js"
import { useTuiPaths } from "../../context/runtime"
import { useTheme } from "../../context/theme"
import { Locale } from "../../util/locale"
import { abbreviateHome } from "../../util/path-format"
import { SessionQuestion } from "./permission"
import { usePromptMove } from "../../component/prompt/move"

export function SessionLocationMissing(props: { directory: string; projectID: string; sessionID: string }) {
  const move = usePromptMove({ projectID: () => props.projectID, sessionID: () => props.sessionID })
  return <SessionLocationUnavailable directory={props.directory} onMove={move.open} />
}

export function SessionLocationUnavailable(props: { directory: string; onMove: () => void }) {
  const paths = useTuiPaths()
  const theme = useTheme()
  const directory = createMemo(() => Locale.truncateMiddle(abbreviateHome(props.directory, paths.home), 72))

  return (
    <SessionQuestion
      id="session.location-missing"
      group="会话恢复"
      choicesLabel="恢复操作"
      instance={props.directory}
      title="会话位置不可用"
      body={
        <box paddingLeft={1} gap={1}>
          <text fg={theme.text.muted}>{directory()}</text>
          <text fg={theme.text.base}>Choose another directory to continue this session.</text>
        </box>
      }
      options={{ move: "选择目录" }}
      onSelect={props.onMove}
    />
  )
}
