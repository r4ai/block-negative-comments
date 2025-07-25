import { defineExtensionMessaging } from "@webext-core/messaging"
import type { PartiallyPartial } from "./utility-types"

export const MODELS = {
  "onnx-community/Phi-3.5-mini-instruct-onnx-web": {
    name: "onnx-community/Phi-3.5-mini-instruct-onnx-web",
    task: "text-generation",
  },
  "tabularisai/multilingual-sentiment-analysis": {
    name: "tabularisai/multilingual-sentiment-analysis",
    task: "text-classification",
  },
} as const

export type Models = typeof MODELS
export type Model = (typeof MODELS)[keyof typeof MODELS]

export type AnalyzeSentimentResult =
  | {
      modelName: (typeof MODELS)["onnx-community/Phi-3.5-mini-instruct-onnx-web"]["name"]
      sentiment: "positive" | "negative" | "neutral"
      confidence: number
    }
  | {
      modelName: (typeof MODELS)["tabularisai/multilingual-sentiment-analysis"]["name"]
      sentiment:
        | "very_negative"
        | "negative"
        | "neutral"
        | "positive"
        | "very_positive"
      score: number
    }

export type CommentHistoryItem = {
  id: number
  analyzedAt: string
  comment: string
  result: AnalyzeSentimentResult
}

export type BlockNegativeCommentsProtocol = {
  analyzeSentiment<M extends Model>(data: {
    comment: string
    model: M
  }): Promise<AnalyzeSentimentResult & { modelName: M["name"] }>
  addCommentToHistory(
    data: PartiallyPartial<CommentHistoryItem, "id">,
  ): Promise<void>
  getAllCommentsFromHistory(): Promise<CommentHistoryItem[]>
}

export const { sendMessage, onMessage } =
  defineExtensionMessaging<BlockNegativeCommentsProtocol>({ logger: console })
