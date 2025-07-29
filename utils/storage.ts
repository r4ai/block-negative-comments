import { storage } from "#imports"
import { MODELS, type Model } from "./messaging"

export const generalSettings = {
  enabled: storage.defineItem<boolean>("local:enabled", {
    fallback: true,
  }),
  selectedModel: storage.defineItem<Model>("local:selectedModel", {
    fallback: MODELS["tabularisai/multilingual-sentiment-analysis"],
  }),
} as const

export const modelSettings = {
  "tabularisai/multilingual-sentiment-analysis": storage.defineItem<{
    scoreThreshold: number
  }>("local:multilingual-sentiment-analysis", {
    fallback: {
      scoreThreshold: 0.1,
    },
  }),
  "onnx-community/Phi-3.5-mini-instruct-onnx-web": storage.defineItem<{
    confidenceThreshold: number
    systemPrompt: string
    userPrompt: string
  }>("local:phi-3.5-mini-instruct", {
    fallback: {
      confidenceThreshold: 0.5,
      systemPrompt:
        "You are a helpful assistant that analyzes the sentiment of text.\nEspecially, you detect negative comments about F1 drivers.",
      userPrompt:
        "Analyze the sentiment of the input text and return the result in following format:\n\nsentiment:positive|negative|neutral\nconfidence:0.0-1.0\n\nInput: {comment}\n\nOutput:",
    },
  }),
} as const satisfies Record<Model["name"], unknown>

export type ModelSettings = {
  [K in keyof typeof modelSettings]: (typeof modelSettings)[K]["fallback"]
}

export const developmentSettings = {
  logFilter: storage.defineItem<{
    debug: boolean
    info: boolean
    warn: boolean
    error: boolean
  }>("local:logLevel", {
    fallback: {
      debug: false,
      info: true,
      warn: true,
      error: true,
    },
  }),
  maxCommentHistory: storage.defineItem<number>("local:maxCommentHistory", {
    fallback: 100,
  }),
}
