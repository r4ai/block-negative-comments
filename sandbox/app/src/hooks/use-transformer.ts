import { useEffect, useRef, useState } from "react"
import type {
  AnalysisResult,
  GenerateParameters,
  GenerateResult,
  ModelName,
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

  const analyze = (modelName: ModelName, prompts: Prompts, text: string) => {
    setIsAnalyzing(true)
    postMessage({
      method: "generate",
      model: modelName,
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
          console.log("Generated text:", data.outputText)
          const analysisResult: AnalysisResult = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            model: data.model,
            inputText: data.inputText,
            outputText: data.outputText,
            result: {
              sentiment: data.sentiment,
              confidence: data.confidence,
            },
            systemPrompt: data.prompts[0].content,
            userPrompt: data.prompts[1].content,
          }
          setAnalysisResult(analysisResult)
          saveHistory((prev) => [analysisResult, ...prev])
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
