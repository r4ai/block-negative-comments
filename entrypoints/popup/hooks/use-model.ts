import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export const useModel = () => {
  const queryClient = useQueryClient()
  const modelQueryKey = [generalSettings.selectedModel.key]
  const query = useQuery({
    queryKey: modelQueryKey,
    queryFn: generalSettings.selectedModel.getValue,
    refetchOnMount: true,
  })
  const mutation = useMutation({
    mutationFn: async (modelName: Model["name"]) => {
      const model = Object.values(MODELS).find((m) => m.name === modelName)
      if (!model) {
        throw new Error(`Model ${modelName} not found`)
      }
      await generalSettings.selectedModel.setValue(model)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: modelQueryKey,
      })
    },
  })

  return { query, mutation }
}
