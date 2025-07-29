import { Textarea } from "@heroui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { Models } from "@/utils/messaging"
import { modelSettings } from "@/utils/storage"

type SystemPromptTextareaProps = {
  model: Models["onnx-community/Phi-3.5-mini-instruct-onnx-web"]
}

export const SystemPromptTextarea = ({ model }: SystemPromptTextareaProps) => {
  const queryClient = useQueryClient()
  const promptQueryKey = [modelSettings[model.name].key, "systemPrompt"]
  const prompt = useQuery({
    queryKey: promptQueryKey,
    queryFn: () =>
      modelSettings[model.name].getValue().then((data) => data.systemPrompt),
    refetchOnMount: true,
  })
  const promptMutation = useMutation({
    mutationFn: async (value: string) => {
      const currentSettings = await modelSettings[model.name].getValue()
      return modelSettings[model.name].setValue({
        ...currentSettings,
        systemPrompt: value,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: promptQueryKey,
      })
    },
  })

  return (
    <Textarea
      label="System Prompt"
      placeholder="Enter the system prompt for the AI model..."
      value={prompt.data ?? ""}
      isDisabled={prompt.isLoading}
      minRows={3}
      maxRows={8}
      onValueChange={(value) => promptMutation.mutate(value)}
      description="This prompt defines how the AI model should behave when analyzing sentiment."
    />
  )
}
