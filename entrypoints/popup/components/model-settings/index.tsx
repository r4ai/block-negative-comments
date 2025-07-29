import { useModel } from "../../hooks/use-model"
import { ConfidenceThresholdSlider } from "./confidence-threshold-slider"
import { ScoreThresholdSlider } from "./score-threshold-slider"
import { ModelSelect } from "./model-select"

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
        <ConfidenceThresholdSlider model={model.query.data} />
      )}
      {model.query.data?.name ===
        "tabularisai/multilingual-sentiment-analysis" && (
        <ScoreThresholdSlider model={model.query.data} />
      )}
    </div>
  )
}
