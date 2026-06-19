"use client"
import { useGamificationStore } from "@/stores/gamification.store"
import { Zap } from "lucide-react"
export function XpToastContainer() {
  const toasts = useGamificationStore((s) => s.toasts)
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="flex items-center gap-2 bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full shadow-lg font-semibold text-sm animate-in slide-in-from-top-2">
          <Zap className="h-4 w-4" /><span>+{t.amount} XP</span>
        </div>
      ))}
    </div>
  )
}
