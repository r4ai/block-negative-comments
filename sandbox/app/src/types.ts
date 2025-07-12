type ModelBase = {
  value: string
  label: string
  task: "text-generation" | "text-classification"
  isLocal: boolean
}

export const MODELS = [
  {
    value: "onnx-community/Phi-3.5-mini-instruct-onnx-web",
    label: "Phi-3.5 Mini Instruct",
    task: "text-generation",
    isLocal: false,
  },
  {
    value: "tabularisai/multilingual-sentiment-analysis",
    label: "Multilingual Sentiment Analysis",
    task: "text-classification",
    isLocal: false,
  },
] as const satisfies ModelBase[]

export type Model = (typeof MODELS)[number]
export type ModelValue = Model["value"]

export type Prompts = [
  { role: "system"; content: string },
  { role: "user"; content: string },
]

export type AnalysisResult<M extends Model = Model> = {
  id: string
  timestamp: string
  model: M
  text: string
  prompts: M["task"] extends "text-generation"
    ? { system: string; user: string }
    : undefined
  output: M["value"] extends "tabularisai/multilingual-sentiment-analysis"
    ? {
        sentiment:
          | "very_negative"
          | "negative"
          | "neutral"
          | "positive"
          | "very_positive"
        score: number
      }
    : {
        text: string
        sentiment: "positive" | "negative" | "neutral"
        confidence: number
      }
}

export type GenerateParameters =
  | {
      method: "generate"
      model: Model
      prompts?: Prompts
      text: string
    }
  | {
      method: "load"
      model: Model
    }

export type GenerateResult<M extends Model = Model> =
  | { status: "start-initialization" }
  | { status: "progress"; progress: number }
  | { status: "end-initialization" }
  | { status: "generated"; result: AnalysisResult<M> }
