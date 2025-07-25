import { Slider } from "@heroui/slider"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { Models } from "@/utils/messaging"

type ConfidenceThresholdSliderProps = {
  model: Models["onnx-community/Phi-3.5-mini-instruct-onnx-web"]
}

export const ConfidenceThresholdSlider = ({
  model,
}: ConfidenceThresholdSliderProps) => {
  const queryClient = useQueryClient()
  const thresholdQueryKey = [
    modelSettings[model.name].key,
    "confidenceThreshold",
  ]
  const threshold = useQuery({
    queryKey: thresholdQueryKey,
    queryFn: () =>
      modelSettings[model.name]
        .getValue()
        .then((data) => data.confidenceThreshold),
    refetchOnMount: true,
  })
  const thresholdMutation = useMutation({
    mutationFn: async (value: number) => {
      const currentSettings = await modelSettings[model.name].getValue()
      return modelSettings[model.name].setValue({
        ...currentSettings,
        confidenceThreshold: value,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: thresholdQueryKey,
      })
    },
  })

  return (
    <Slider
      label="Confidence Threshold"
      value={threshold.data}
      isDisabled={threshold.isLoading}
      minValue={0}
      maxValue={1}
      step={0.01}
      onChange={(value) =>
        thresholdMutation.mutate(Array.isArray(value) ? value[0] : value)
      }
    />
  )
}
