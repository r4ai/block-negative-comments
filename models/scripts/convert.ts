import * as fs from "node:fs/promises"
import path from "node:path"
import { parseArgs } from "node:util"
import { $ } from "bun"

const convert = async (model: string) => {
  const modelsDir = path.resolve(import.meta.dirname, "..")
  const distDir = path.resolve(modelsDir, "dist")
  const rootDir = path.resolve(modelsDir, "..")
  const publicDir = path.join(rootDir, "public", "models")
  const sandboxAppPublicDir = path.join(
    rootDir,
    "sandbox",
    "app",
    "public",
    "models",
  )

  $.cwd(modelsDir)

  console.log("[INFO] Converting model:", model)
  switch (model) {
    case "timpal0l/mdeberta-v3-base-squad2":
      await $`uv run optimum-cli export onnx \
                --model ${model} \
                --task question-answering \
                ${path.join(distDir, "timpal01", "mdeberta-v3-base-squad2")}`
      break

    case "kit-nlp/bert-base-japanese-sentiment-irony":
      await $`uv run optimum-cli export onnx \
                --model ${model} \
                --task text-classification \
                ${path.join(distDir, "kit-nlp", "bert-base-japanese-sentiment-irony")}`
      break

    case "tabularisai/multilingual-sentiment-analysis": {
      const outputDir = path.join(
        distDir,
        "tabularisai",
        "multilingual-sentiment-analysis",
      )
      await $`uv run optimum-cli export onnx \
                --model ${model} \
                --task text-classification \
                ${outputDir}`
      await fs.mkdir(path.join(outputDir, "onnx"), { recursive: true })
      await fs.rename(
        path.join(outputDir, "model.onnx"),
        path.join(outputDir, "onnx", "model.onnx"),
      )

      const publicTargetDir = path.join(
        publicDir,
        "tabularisai",
        "multilingual-sentiment-analysis",
      )
      await fs.mkdir(publicTargetDir, { recursive: true })
      await fs.cp(outputDir, publicTargetDir, { recursive: true, force: true })

      const sandboxAppPublicTargetDir = path.join(
        sandboxAppPublicDir,
        "tabularisai",
        "multilingual-sentiment-analysis",
      )
      await fs.mkdir(sandboxAppPublicTargetDir, { recursive: true })
      await fs.cp(outputDir, sandboxAppPublicTargetDir, {
        recursive: true,
        force: true,
      })

      break
    }

    default:
      console.error(`Unknown model: ${model}`)
      process.exit(1)
  }
  console.log("[INFO] Model conversion completed:", model)
}

const main = async () => {
  const args = parseArgs({
    options: {
      model: {
        type: "string",
        short: "m",
        description: "Model to export",
      },
    },
  })
  if (!args.values.model) {
    console.error(
      "Model argument is required. Use --model or -m to specify the model.",
    )
    process.exit(1)
  }
  await convert(args.values.model)
}

try {
  await main()
} catch (error) {
  console.error("Error during conversion:", error)
  process.exit(1)
}
