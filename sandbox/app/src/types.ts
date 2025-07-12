export const MODELS = [
  {
    value: "bert-base-japanese",
    label: "BERT Base Japanese",
    type: "bert",
    isLocal: true,
  },
  {
    value: "onnx-community/Phi-3.5-mini-instruct-onnx-web",
    label: "Phi-3.5 Mini Instruct",
    type: "llm",
    isLocal: false,
  },
] as const

export type ModelName = (typeof MODELS)[number]["value"]

export type Prompts = [
  { role: "system"; content: string },
  { role: "user"; content: string },
]

export type GenerateParameters =
  | {
      method: "generate"
      model: ModelName
      prompts: Prompts
      text: string
    }
  | {
      method: "load"
    }

export type GenerateResult =
  | { status: "start-initialization" }
  | { status: "progress"; progress: number }
  | { status: "end-initialization" }
  | {
      status: "generated"
      model: ModelName
      prompts: Prompts
      inputText: string
      outputText: string
      sentiment: "positive" | "negative" | "neutral"
      confidence: number
    }
