import { Accordion, AccordionItem } from "@heroui/react"
import { useModel } from "../../hooks/use-model"
import { ConfidenceThresholdSlider } from "./confidence-threshold-slider"
import { ModelSelect } from "./model-select"
import { ScoreThresholdSlider } from "./score-threshold-slider"
import { SystemPromptTextarea } from "./system-prompt-textarea"
import { UserPromptTextarea } from "./user-prompt-textarea"

export const ModelSettings = () => {
  const model = useModel()

  return (
    <div className="flex flex-col pb-2 gap-4">
      <ModelSelect
        modelName={model.query.data?.name}
        onChange={(value) => model.mutation.mutate(value)}
      />
      {model.query.data?.name ===
        "onnx-community/Phi-3.5-mini-instruct-onnx-web" && (
        <>
          <ConfidenceThresholdSlider model={model.query.data} />
          <Accordion className="px-0">
            <AccordionItem
              key="advanced"
              title="Advanced Settings"
              subtitle="Configure system and user prompts"
            >
              <div className="flex flex-col gap-4">
                <SystemPromptTextarea model={model.query.data} />
                <UserPromptTextarea model={model.query.data} />
              </div>
            </AccordionItem>
          </Accordion>
        </>
      )}
      {model.query.data?.name ===
        "tabularisai/multilingual-sentiment-analysis" && (
        <ScoreThresholdSlider model={model.query.data} />
      )}
    </div>
  )
}
