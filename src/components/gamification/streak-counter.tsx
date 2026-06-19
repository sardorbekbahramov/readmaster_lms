"use client"
import { Flame, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
interface Props { currentStreak:number; shieldsAvailable:number; className?:string }
export function StreakCounter({ currentStreak, shieldsAvailable, className }: Props) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Flame className={cn("h-5 w-5", currentStreak===0?"text-gray-300":"text-orange-500")} />
      <span className={cn("font-bold text-sm", currentStreak===0?"text-gray-400":"text-orange-600")}>{currentStreak}</span>
      {shieldsAvailable>0 && <div className="flex items-center gap-0.5 text-blue-500"><Shield className="h-3.5 w-3.5" /><span className="text-xs font-medium">{shieldsAvailable}</span></div>}
    </div>
  )
}
