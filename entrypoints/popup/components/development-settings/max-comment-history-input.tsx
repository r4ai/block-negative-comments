import { NumberInput } from "@heroui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export const MaxCommentHistoryInput = () => {
  const queryClient = useQueryClient()
  const maxCommentHistory = useQuery({
    queryKey: [developmentSettings.maxCommentHistory.key],
    queryFn: developmentSettings.maxCommentHistory.getValue,
    refetchOnMount: true,
  })
  const maxCommentHistoryMutation = useMutation({
    mutationFn: (value: number) =>
      developmentSettings.maxCommentHistory.setValue(value),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [developmentSettings.maxCommentHistory.key],
      })
    },
  })

  return (
    <NumberInput
      label="Max Comment History"
      labelPlacement="outside"
      value={maxCommentHistory.data}
      onValueChange={(value) => {
        maxCommentHistoryMutation.mutate(value)
      }}
    />
  )
}
