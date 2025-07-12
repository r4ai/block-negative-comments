import dedent from "dedent"
import { Download, History, Play, Trash2 } from "lucide-react"
import { useState } from "react"
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
import { useTransformer } from "@/hooks/use-transformer"
import { type AnalysisResult, MODELS, type ModelName } from "@/types"

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
