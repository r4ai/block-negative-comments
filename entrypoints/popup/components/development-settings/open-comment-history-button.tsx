import { Button } from "@heroui/react"

export const OpenCommentHistoryButton = () => {
  const openCommentHistory = () => {
    browser.tabs.create({
      url: browser.runtime.getURL("/comment-history-viewer.html"),
    })
  }

  return <Button onPress={openCommentHistory}>Open Comment History</Button>
}
