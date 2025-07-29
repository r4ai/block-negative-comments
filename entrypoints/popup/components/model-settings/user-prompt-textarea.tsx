import { Textarea } from "@heroui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { Models } from "@/utils/messaging"
import { modelSettings } from "@/utils/storage"

type UserPromptTextareaProps = {
  model: Models["onnx-community/Phi-3.5-mini-instruct-onnx-web"]
}

export const UserPromptTextarea = ({ model }: UserPromptTextareaProps) => {
  const queryClient = useQueryClient()
  const promptQueryKey = [modelSettings[model.name].key, "userPrompt"]
  const prompt = useQuery({
    queryKey: promptQueryKey,
    queryFn: () =>
      modelSettings[model.name].getValue().then((data) => data.userPrompt),
    refetchOnMount: true,
  })
  const promptMutation = useMutation({
    mutationFn: async (value: string) => {
      const currentSettings = await modelSettings[model.name].getValue()
      return modelSettings[model.name].setValue({
        ...currentSettings,
        userPrompt: value,
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
      label="User Prompt"
      placeholder="Enter the user prompt for the AI model..."
      value={prompt.data ?? ""}
      isDisabled={prompt.isLoading}
      minRows={4}
      maxRows={10}
      onValueChange={(value) => promptMutation.mutate(value)}
      description="Use {comment} placeholder for the input text. This defines the task format and instructions."
    />
  )
}
