import { ExportCommentHistoryButton } from "./export-comment-history-button"
import { LogFilterSwitch } from "./log-filter-switch"
import { MaxCommentHistoryInput } from "./max-comment-history-input"
import { OpenCommentHistoryButton } from "./open-comment-history-button"

export const DevelopmentSettings = () => {
  return (
    <div className="flex flex-col pb-2 gap-4">
      <LogFilterSwitch />
      <MaxCommentHistoryInput />
      <ExportCommentHistoryButton />
      <OpenCommentHistoryButton />
    </div>
  )
}
