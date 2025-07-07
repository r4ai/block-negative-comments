import { defineExtensionMessaging } from "@webext-core/messaging"

export type AnalyzeSentimentResult = {
  sentiment: "positive" | "negative" | "neutral"
  confidence: number
}

export type BlockNegativeCommentsProtocol = {
  analyzeSentiment(data: { comment: string }): Promise<AnalyzeSentimentResult>
}

export const { sendMessage, onMessage } =
  defineExtensionMessaging<BlockNegativeCommentsProtocol>({ logger: console })
