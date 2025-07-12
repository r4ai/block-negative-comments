import { Download, History, Play, Trash2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  type GenerateParameters,
  type GenerateResult,
  type Prompts,
  MODELS,
  type ModelName,
} from "@/types"
import TransformerWorker from "../worker?worker"
import dedent from "dedent"

type AnalysisResult = {
  id: string
  timestamp: string
  model: ModelName
  inputText: string
  outputText: string
  result: {
    sentiment: (GenerateResult & { status: "generated" })["sentiment"]
    confidence: (GenerateResult & { status: "generated" })["confidence"]
  }
  systemPrompt?: string
  userPrompt?: string
}

const SENTIMENT_ANALYSIS_HISTORY_KEY = "sentiment-analysis-history"

const DEFAULT_SYSTEM_PROMPT = dedent`
              You are a helpful assistant that analyzes the sentiment of text.
              Especially, you detect negative comments about F1 drivers.
            `
const DEFAULT_USER_PROMPT = dedent`
              Analyze the sentiment of the input text and return the result in following format:

              sentiment:positive|negative|neutral
              confidence:0.0-1.0

              Input: {{text}}

              Output:
            `

const useHistory = () => {
  const [history, setHistory] = useState<AnalysisResult[]>([])

  useEffect(() => {
    const savedHistory = localStorage.getItem(SENTIMENT_ANALYSIS_HISTORY_KEY)
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory))
      } catch (error) {
        console.error("Failed to parse history from localStorage:", error)
      }
    }
  }, [])

  const saveHistory = (value: React.SetStateAction<AnalysisResult[]>) => {
    setHistory((prev) => {
      const newHistory = typeof value === "function" ? value(prev) : value
      localStorage.setItem(
        SENTIMENT_ANALYSIS_HISTORY_KEY,
        JSON.stringify(value),
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

const useTransformer = () => {
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

export const SentimentAnalysis = () => {
  const [selectedModel, setSelectedModel] =
    useState<ModelName>("bert-base-japanese")
  const [inputText, setInputText] = useState("")
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT)
  const [userPrompt, setUserPrompt] = useState(DEFAULT_USER_PROMPT)
  const {
    isModelLoading,
    isAnalyzing,
    analyze,
    analysisResult,
    setAnalysisResult,
    history,
    clearHistory,
  } = useTransformer()

  const selectedModelInfo = MODELS.find((m) => m.value === selectedModel)
  const isLLMModel = selectedModelInfo?.type === "llm"

  const performAnalysis = async () => {
    if (!inputText.trim()) return

    if (isLLMModel) {
      analyze(
        selectedModelInfo.value,
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        inputText,
      ) ?? "No result generated."
    } else {
      // TODO: Implement non-LLM model analysis
    }
  }

  // 履歴をJSONでダウンロード
  const downloadHistoryAsJSON = () => {
    const dataStr = JSON.stringify(history, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `sentiment-analysis-history-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // 履歴から結果を再表示
  const loadFromHistory = (item: AnalysisResult) => {
    setSelectedModel(item.model)
    setInputText(item.inputText)
    setAnalysisResult(item)
    if (item.systemPrompt) setSystemPrompt(item.systemPrompt)
    if (item.userPrompt) setUserPrompt(item.userPrompt)
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 左側: 分析設定と実行 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>感情分析</CardTitle>
              <CardDescription>
                テキストの感情を分析します。モデルを選択して分析を実行してください。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* モデル選択 */}
              <div className="space-y-2">
                <Label htmlFor="model">分析モデル</Label>
                <Select
                  value={selectedModel}
                  onValueChange={(value) => {
                    if (MODELS.some((m) => m.value === value)) {
                      setSelectedModel(value as ModelName)
                    } else {
                      console.warn(`Unknown model selected: ${value}`)
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="モデルを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isModelLoading && (
                  <div className="text-sm text-muted-foreground mt-2">
                    モデルをロード中...
                  </div>
                )}
              </div>

              {/* LLMモデル選択時のプロンプト設定 */}
              {isLLMModel && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium">プロンプト設定</h4>
                  <div className="space-y-2">
                    <Label htmlFor="system-prompt">システムプロンプト</Label>
                    <Textarea
                      id="system-prompt"
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      rows={3}
                      placeholder="システムプロンプトを入力..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-prompt">ユーザープロンプト</Label>
                    <Textarea
                      id="user-prompt"
                      value={userPrompt}
                      onChange={(e) => setUserPrompt(e.target.value)}
                      rows={3}
                      placeholder="ユーザープロンプトを入力... ({text}でテキストを参照)"
                    />
                  </div>
                </div>
              )}

              {/* テキスト入力 */}
              <div className="space-y-2">
                <Label htmlFor="input-text">分析対象テキスト</Label>
                <Textarea
                  id="input-text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  rows={4}
                  placeholder="感情分析を行いたいテキストを入力してください..."
                />
              </div>

              {/* 分析実行ボタン */}
              <Button
                onClick={performAnalysis}
                disabled={!inputText.trim() || isAnalyzing || isModelLoading}
                className="w-full"
              >
                <Play className="w-4 h-4 mr-2" />
                {isAnalyzing ? "分析中..." : "感情分析を実行"}
              </Button>
            </CardContent>
          </Card>

          {/* 分析結果 */}
          {analysisResult && (
            <Card>
              <CardHeader>
                <CardTitle>分析結果</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-muted rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm">
                    {JSON.stringify(analysisResult, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 右側: 履歴 */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  分析履歴
                </CardTitle>
                <CardDescription>
                  過去の分析結果 ({history.length}件)
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadHistoryAsJSON}
                  disabled={history.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  JSON出力
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearHistory}
                  disabled={history.length === 0}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  クリア
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    まだ分析履歴がありません。テキストを分析して履歴を作成してください。
                  </AlertDescription>
                </Alert>
              ) : (
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {history.map((item) => (
                      <Card
                        key={item.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <CardContent
                          className="p-4"
                          onClick={() => loadFromHistory(item)}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Badge variant="secondary">
                                {
                                  MODELS.find((m) => m.value === item.model)
                                    ?.label
                                }
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(item.timestamp).toLocaleString(
                                  "ja-JP",
                                )}
                              </span>
                            </div>
                            <div className="text-sm">
                              <strong>入力:</strong>
                              <p className="text-muted-foreground line-clamp-2 mt-1">
                                {item.outputText}
                              </p>
                            </div>
                            <Separator />
                            <div className="text-sm">
                              <strong>結果:</strong>
                              <p className="mt-1">
                                <span className="font-semibold">
                                  感情: {item.result.sentiment}
                                </span>
                                <br />
                                <span className="text-muted-foreground">
                                  信頼度: {item.result.confidence}
                                </span>
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
