import {
  pipeline,
  type TextGenerationPipeline,
} from "@huggingface/transformers"
import dedent from "dedent"
import { type AnalyzeSentimentResult, onMessage } from "@/utils/messaging"

export default defineBackground(() => {
  let generator: TextGenerationPipeline | null = null

  const initPipeline = async () => {
    if (!generator) {
      console.group("Initializing text generation pipeline")
      // @ts-ignore
      generator = await pipeline(
        "text-generation",
        "onnx-community/Phi-3.5-mini-instruct-onnx-web",
        {
          device: "webgpu",
        },
      )
      console.log("Pipeline initialized:", generator)
      console.groupEnd()
    }
    return generator
  }

  const parseOutput = (output?: string): AnalyzeSentimentResult => {
    if (!output) {
      throw new Error("Output is empty or undefined")
    }

    const sentimentMatch = output.match(
      /"?sentiment"?\s*:\s*"?(positive|negative|neutral)"?/,
    )
    const confidenceMatch = output.match(
      /"?confidence"?\s*:\s*([0-9]*\.?[0-9]+)/,
    )

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

  onMessage("analyzeSentiment", async ({ data: { comment }, sender }) => {
    const generator = await initPipeline()
    const messages = [
      {
        role: "system",
        content: dedent`
              You are a helpful assistant that analyzes the sentiment of text.
              Especially, you detect negative comments about F1 drivers.
            `,
      },
      {
        role: "user",
        content: dedent`
              Analyze the sentiment of the input text and return the result in following format:
              
              sentiment:positive|negative|neutral
              confidence:0.0-1.0

              Input: ${comment}

              Output:
            `,
      },
    ]
    const result = await generator(messages, {
      max_new_tokens: 256,
      do_sample: false,
    })
    const outputText =
      "generated_text" in result[0] && Array.isArray(result[0].generated_text)
        ? result[0].generated_text.at(-1)?.content
        : undefined
    const output = parseOutput(outputText)
    console.group("Sentiment Analysis Result")
    console.log("Input:", comment)
    console.log("Output:", outputText)
    console.log("Parsed Result:", output)
    console.log("Sender:", sender)
    console.groupEnd()
    return output
  })
})
