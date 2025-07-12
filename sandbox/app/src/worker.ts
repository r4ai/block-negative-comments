import {
  pipeline,
  type TextGenerationPipeline,
} from "@huggingface/transformers"
import type { GenerateParameters, GenerateResult } from "./types"
import dedent from "dedent"

let generator: undefined | { name: string; pipeline: TextGenerationPipeline }

const postMessage = (data: GenerateResult) => {
  self.postMessage(data)
}

const initGenerator = async () => {
  if (!generator) {
    console.group("Initializing translation pipeline")
    postMessage({ status: "start-initialization" })
    // @ts-ignore
    const pipe = await pipeline(
      "text-generation",
      "onnx-community/Phi-3.5-mini-instruct-onnx-web",
      { device: "webgpu" },
    )
    generator = {
      name: "onnx-community/Phi-3.5-mini-instruct-onnx-web",
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

const handleMessage = async (data: GenerateParameters) => {
  switch (data.method) {
    case "load": {
      await initGenerator()
      return
    }

    case "generate": {
      const prompts = data.prompts.map((prompt) => ({
        role: prompt.role,
        content:
          prompt.role === "user"
            ? prompt.content.replaceAll("{{text}}", data.text)
            : prompt.content,
      }))

      const generator = await initGenerator()

      const generated = await generator.pipeline(prompts, {
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
      return postMessage({
        status: "generated",
        model: data.model,
        prompts: data.prompts,
        inputText: data.text,
        outputText: outputText ?? "",
        sentiment: output.sentiment,
        confidence: output.confidence,
      })
    }
  }
}

self.addEventListener("message", async (e) => {
  const data: GenerateParameters = e.data
  await handleMessage(data)
})
