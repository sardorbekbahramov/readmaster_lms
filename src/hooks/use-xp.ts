"use client"
import { useMutation } from "@tanstack/react-query"
import { useGamificationStore } from "@/stores/gamification.store"
export function useAwardXP() {
  const { addToast, showLevelUp } = useGamificationStore()
  return useMutation({
    mutationFn: ({ reason, enrollmentId, sourceId }: { reason: string; enrollmentId?: string; sourceId?: string }) =>
      fetch("/api/xp",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({reason,enrollmentId,sourceId})}).then((r)=>r.json()),
    onSuccess: (data) => {
      if (data.xpAwarded > 0) addToast(data.xpAwarded, "")
      if (data.leveledUp) showLevelUp(data.newLevel.level, data.newLevel.title)
    },
  })
}
