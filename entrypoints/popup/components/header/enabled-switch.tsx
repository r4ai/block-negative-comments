import { Switch } from "@heroui/switch"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export const EnabledSwitch = () => {
  const queryClient = useQueryClient()
  const enabled = useQuery({
    queryKey: [generalSettings.enabled.key],
    queryFn: generalSettings.enabled.getValue,
    refetchOnMount: true,
  })
  const enabledMutation = useMutation({
    mutationFn: (enabled: boolean) => generalSettings.enabled.setValue(enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [generalSettings.enabled.key] })
    },
  })

  return (
    <Switch
      size="md"
      disabled={enabled.isLoading}
      isSelected={enabled.data}
      onValueChange={(enabled) => {
        enabledMutation.mutate(enabled)
      }}
    >
      <span className="text-sm text-foreground-700">Enable Blocking</span>
    </Switch>
  )
}
