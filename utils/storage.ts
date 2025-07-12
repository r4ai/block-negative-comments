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
  }>("local:phi-3.5-mini-instruct", {
    fallback: {
      confidenceThreshold: 0.5,
    },
  }),
} as const satisfies Record<Model["name"], unknown>
