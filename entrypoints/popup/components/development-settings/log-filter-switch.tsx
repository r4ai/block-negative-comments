import { Switch } from "@heroui/switch"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export const LogFilterSwitch = () => {
  const queryClient = useQueryClient()
  const logFilter = useQuery({
    queryKey: [developmentSettings.logFilter.key],
    queryFn: developmentSettings.logFilter.getValue,
    refetchOnMount: true,
  })
  const logFilterMutation = useMutation({
    mutationFn: (
      newFilter: Parameters<typeof developmentSettings.logFilter.setValue>[0],
    ) => developmentSettings.logFilter.setValue(newFilter),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [developmentSettings.logFilter.key],
      })
    },
  })
  const levels: (keyof typeof developmentSettings.logFilter.fallback)[] = [
    "debug",
    "info",
    "warn",
    "error",
  ]

  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm text-foreground">Log Filter</div>
      {logFilter.data ? (
        levels.map((level) => (
          <Switch
            key={level}
            disabled={logFilter.isLoading}
            isSelected={logFilter.data[level]}
            onValueChange={(enabled) => {
              logFilterMutation.mutate({
                ...logFilter.data,
                [level]: enabled,
              })
            }}
          >
            <span className="text-sm text-foreground-700">
              {level[0].toUpperCase() + level.slice(1)}
            </span>
          </Switch>
        ))
      ) : (
        <span className="text-sm text-foreground-500">Loading...</span>
      )}
    </div>
  )
}
