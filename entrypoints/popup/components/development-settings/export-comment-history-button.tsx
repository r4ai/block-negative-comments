import { Button } from "@heroui/react"

export const ExportCommentHistoryButton = () => {
  const exportCommentHistory = async () => {
    const comments = await sendMessage("getAllCommentsFromHistory")
    const jsonData = JSON.stringify({ comments }, null, 2)
    const blob = new Blob([jsonData], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    await browser.downloads.download({
      url,
      filename: "comment-history.json",
      saveAs: true,
    })
    setTimeout(() => URL.revokeObjectURL(url), 60_000) // Clean up the URL after download
  }

  return <Button onPress={exportCommentHistory}>Export Comment History</Button>
}
