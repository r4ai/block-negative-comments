import { useEffect, useState } from "react"
import type { AnalysisResult } from "@/types"

const SENTIMENT_ANALYSIS_HISTORY_KEY = "sentiment-analysis-history"

export const useHistory = () => {
  const [history, setHistory] = useState<AnalysisResult[]>([])

  useEffect(() => {
    const savedHistory = localStorage.getItem(SENTIMENT_ANALYSIS_HISTORY_KEY)
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory))
      } catch (error) {
        console.warn("Failed to parse history from localStorage:", error)
      }
    }
  }, [])

  const saveHistory = (value: React.SetStateAction<AnalysisResult[]>) => {
    setHistory((prev) => {
      const newHistory = typeof value === "function" ? value(prev) : value
      console.log(newHistory)
      localStorage.setItem(
        SENTIMENT_ANALYSIS_HISTORY_KEY,
        JSON.stringify(newHistory),
      )
      return newHistory
    })
  }

  const clearHistory = () => {
    localStorage.removeItem(SENTIMENT_ANALYSIS_HISTORY_KEY)
    setHistory([])
  }

  return { history, setHistory, saveHistory, clearHistory }
}
