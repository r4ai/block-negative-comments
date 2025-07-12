import {
  env,
  pipeline,
  TextClassificationPipeline,
  TextGenerationPipeline,
} from "@huggingface/transformers"
import dedent from "dedent"
import type {
  GenerateParameters,
  GenerateResult,
  Model,
  Prompts,
} from "./types"

type Pipeline = TextGenerationPipeline | TextClassificationPipeline

let generator:
  | undefined
  | {
      name: string
      pipeline: Pipeline
    }

const postMessage = <M extends Model>(data: GenerateResult<M>) => {
  self.postMessage(data)
}

const initGenerator = async (model: Model) => {
  if (!generator) {
    console.group("Initializing translation pipeline")
    postMessage({ status: "start-initialization" })

    env.localModelPath = "/models/"
    if (model.value === "tabularisai/multilingual-sentiment-analysis") {
      env.allowRemoteModels = false
      env.allowLocalModels = true
    } else {
      env.allowRemoteModels = true
      env.allowLocalModels = false
    }

    const pipe = await pipeline(model.task, model.value, { device: "webgpu" })
    generator = {
      name: model.value,
      pipeline: pipe,
    }
    console.log("Pipeline initialized:", generator)
    console.groupEnd()
  }

  postMessage({ status: "end-initialization" })
  return generator
}

const parseOutput = (output?: string) => {
  if (!output) {
    throw new Error("Output is empty or undefined")
  }

  const sentimentMatch = output.match(
    /"?sentiment"?\s*:\s*"?(positive|negative|neutral)"?/,
  )
  const confidenceMatch = output.match(/"?confidence"?\s*:\s*([0-9]*\.?[0-9]+)/)

  if (!sentimentMatch || !confidenceMatch) {
    throw new Error(
      dedent`
          Output format is incorrect. Expected format:
          sentiment:positive|negative|neutral
          confidence:0.0-1.0

          Example:
          sentiment:positive
          confidence:0.95
        `,
    )
  }

  const sentiment = sentimentMatch[1] as "positive" | "negative" | "neutral"
  const confidence = parseFloat(confidenceMatch[1])

  if (Number.isNaN(confidence) || confidence < 0 || confidence > 1) {
    throw new Error(
      dedent`
          Confidence value is invalid. Expected a number between 0.0 and 1.0.
          Received: ${confidence}

          Expected format:
          sentiment:positive|negative|neutral
          confidence:0.0-1.0
        `,
    )
  }

  return {
    sentiment,
    confidence,
  }
}

const generate = async (model: Model, inputText: string, prompts?: Prompts) => {
  const generator = await initGenerator(model)

  switch (model.value) {
    case "onnx-community/Phi-3.5-mini-instruct-onnx-web": {
      if (!prompts) {
        throw new Error("Prompts are required for text generation")
      }
      if (!(generator.pipeline instanceof TextGenerationPipeline)) {
        throw new Error("Invalid generator type")
      }
      const replacedPrompts = prompts.map((prompt) => ({
        role: prompt.role,
        content:
          prompt.role === "user"
            ? prompt.content.replaceAll("{{text}}", inputText)
            : prompt.content,
      }))
      const generated = await generator.pipeline(replacedPrompts, {
        max_new_tokens: 256,
        do_sample: false,
      })
      console.log("Generated output:", generated)
      const outputText =
        "generated_text" in generated[0] &&
        Array.isArray(generated[0].generated_text)
          ? generated[0].generated_text.at(-1)?.content
          : undefined
      const output = parseOutput(outputText)
      return postMessage<typeof model>({
        status: "generated",
        result: {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          model,
          text: inputText,
          prompts: {
            system: replacedPrompts[0].content,
            user: replacedPrompts[1].content,
          },
          output: {
            text: outputText ?? "",
            sentiment: output.sentiment,
            confidence: output.confidence,
          },
        },
      })
    }

    case "tabularisai/multilingual-sentiment-analysis": {
      if (!(generator.pipeline instanceof TextClassificationPipeline)) {
        throw new Error(`Invalid generator type: ${generator.pipeline}`)
      }
      const generated = await generator.pipeline(inputText)
      const result = Array.isArray(generated) ? generated[0] : generated
      if (!result || !("label" in result) || !("score" in result)) {
        throw new Error("Invalid classification result format")
      }
      const parseLabel = (label: string) => {
        const transformedLabel = label.replaceAll(" ", "_").toLowerCase()
        switch (transformedLabel) {
          case "very_negative":
          case "negative":
          case "neutral":
          case "positive":
          case "very_positive":
            return transformedLabel
          default:
            throw new Error(
              `Unknown sentiment label: ${transformedLabel}. Expected one of: very_negative, negative, neutral, positive, very_positive`,
            )
        }
      }
      return postMessage<typeof model>({
        status: "generated",
        result: {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          model,
          text: inputText,
          prompts: undefined,
          output: {
            sentiment: parseLabel(result.label),
            score: result.score,
          },
        },
      })
    }
  }
}

const handleMessage = async (data: GenerateParameters) => {
  switch (data.method) {
    case "load": {
      await initGenerator(data.model)
      return
    }

    case "generate": {
      await generate(data.model, data.text, data.prompts)
      return
    }
  }
}

self.addEventListener("message", async (e) => {
  const data: GenerateParameters = e.data
  await handleMessage(data)
})
