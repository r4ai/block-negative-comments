import {
  env,
  pipeline,
  TextClassificationPipeline,
  TextGenerationPipeline,
} from "@huggingface/transformers"
import dedent from "dedent"
import {
  type AnalyzeSentimentResult,
  type Model,
  type Models,
  onMessage,
} from "@/utils/messaging"

export default defineBackground(() => {
  let generator: TextGenerationPipeline | TextClassificationPipeline | null =
    null

  const initPipeline = async (model: Model) => {
    const isCorrectGenerator =
      generator &&
      ((model.task === "text-generation" &&
        generator instanceof TextGenerationPipeline) ||
        (model.task === "text-classification" &&
          generator instanceof TextClassificationPipeline))
    if (!isCorrectGenerator) {
      console.group("Initializing text generation pipeline")

      if (model.name === "tabularisai/multilingual-sentiment-analysis") {
        env.allowRemoteModels = false
        env.allowLocalModels = true
      } else {
        env.allowRemoteModels = true
        env.allowLocalModels = false
      }
      // @ts-ignore
      generator = await pipeline(model.task, model.name, {
        device: "webgpu",
      })

      console.log("Pipeline initialized:", generator)
      console.groupEnd()
    }
    return generator
  }

  const parseTextGenerationOutput = (
    model: Models["onnx-community/Phi-3.5-mini-instruct-onnx-web"],
    output?: string,
  ): AnalyzeSentimentResult => {
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
      modelName: model.name,
      sentiment,
      confidence,
    }
  }

  onMessage(
    "analyzeSentiment",
    async ({ data: { comment, model }, sender }) => {
      const generator = await initPipeline(model)

      if (model.name === "onnx-community/Phi-3.5-mini-instruct-onnx-web") {
        if (!(generator instanceof TextGenerationPipeline)) {
          throw new Error("Generator is not a TextGenerationPipeline")
        }
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
        const generated = await generator(messages, {
          max_new_tokens: 256,
          do_sample: false,
        })
        const outputText =
          "generated_text" in generated[0] &&
          Array.isArray(generated[0].generated_text)
            ? generated[0].generated_text.at(-1)?.content
            : undefined

        const output = parseTextGenerationOutput(model, outputText)

        console.group("Sentiment Analysis Result")
        console.log("Input:", comment)
        console.log("Output:", outputText)
        console.log("Parsed Result:", output)
        console.log("Sender:", sender)
        console.groupEnd()

        return output
      }

      if (model.name === "tabularisai/multilingual-sentiment-analysis") {
        if (!(generator instanceof TextClassificationPipeline)) {
          throw new Error("Generator is not a TextClassificationPipeline")
        }
        const generated = await generator(comment)
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
                `Unknown sentiment label: ${transformedLabel}. Expected one of: very_negative, negative, neutral, positive, very_positive.`,
              )
          }
        }
        const sentiment = parseLabel(result.label)
        const score = result.score
        console.group("Sentiment Analysis Result")
        console.log("Input:", comment)
        console.log("Output:", result)
        console.log("Parsed Result:", { sentiment, score })
        console.log("Sender:", sender)
        console.groupEnd()

        return {
          modelName: model.name,
          sentiment,
          score,
        }
      }

      throw new Error(`Unknown model: ${model}`)
    },
  )
})
