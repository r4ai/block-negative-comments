import { Slider } from "@heroui/slider"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { Models } from "@/utils/messaging"
import { modelSettings } from "@/utils/storage"

type ScoreThresholdSliderProps = {
  model: Models["tabularisai/multilingual-sentiment-analysis"]
}

export const ScoreThresholdSlider = ({ model }: ScoreThresholdSliderProps) => {
  const queryClient = useQueryClient()
  const thresholdQueryKey = [modelSettings[model.name].key, "scoreThreshold"]
  const threshold = useQuery({
    queryKey: thresholdQueryKey,
    queryFn: () =>
      modelSettings[model.name].getValue().then((data) => data.scoreThreshold),
    refetchOnMount: true,
  })
  const thresholdMutation = useMutation({
    mutationFn: async (value: number) => {
      const currentSettings = await modelSettings[model.name].getValue()
      return modelSettings[model.name].setValue({
        ...currentSettings,
        scoreThreshold: value,
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
      label="Score Threshold"
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
