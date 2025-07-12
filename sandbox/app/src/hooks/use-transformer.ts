import { useEffect, useRef, useState } from "react"
import type {
  AnalysisResult,
  GenerateParameters,
  GenerateResult,
  Model,
  Prompts,
} from "@/types"
import TransformerWorker from "../worker?worker"
import { useHistory } from "./use-history"

export const useTransformer = () => {
  const worker = useRef<Worker | null>(null)

  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null,
  )
  const { history, clearHistory, saveHistory } = useHistory()

  const [isModelLoading, setIsModelLoading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const postMessage = (data: GenerateParameters) =>
    worker.current?.postMessage(data)

  const analyze = (model: Model, text: string, prompts?: Prompts) => {
    setIsAnalyzing(true)
    postMessage({
      method: "generate",
      model,
      prompts,
      text,
    })
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: This effect runs only once on mount
  useEffect(() => {
    worker.current ??= new TransformerWorker()

    const onMessageReceived = (e: MessageEvent) => {
      const data: GenerateResult = e.data
      switch (data.status) {
        case "start-initialization":
          setIsModelLoading(true)
          break
        case "end-initialization":
          setIsModelLoading(false)
          break
        case "generated": {
          setAnalysisResult(data.result)
          saveHistory((prev) => [data.result, ...prev])
          setIsAnalyzing(false)
          break
        }
        case "progress":
          console.log("Progress:", data.progress)
          break
        default:
          console.warn("Unknown message received:", data)
          break
      }
    }

    worker.current.addEventListener("message", onMessageReceived)

    return () =>
      worker.current?.removeEventListener("message", onMessageReceived)
  }, [])

  return {
    isModelLoading,
    isAnalyzing,
    analyze,
    analysisResult,
    setAnalysisResult,
    history,
    clearHistory,
  }
}
