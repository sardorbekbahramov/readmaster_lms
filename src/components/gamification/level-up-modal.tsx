"use client"
import { useGamificationStore } from "@/stores/gamification.store"
import { Button } from "@/components/ui/button"
import { Trophy } from "lucide-react"
export function LevelUpModal() {
  const { levelUpModal, dismissLevelUp } = useGamificationStore()
  if (!levelUpModal?.show) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
        <div className="flex items-center justify-center mb-4">
          <div className="p-4 bg-yellow-100 rounded-full"><Trophy className="h-10 w-10 text-yellow-500" /></div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Level Up! 🎉</h2>
        <p className="text-4xl font-bold text-blue-600 mb-2">Level {levelUpModal.newLevel}</p>
        <p className="text-lg text-gray-600 mb-6">{levelUpModal.newTitle}</p>
        <Button onClick={dismissLevelUp} className="w-full">Continue →</Button>
      </div>
    </div>
  )
}
