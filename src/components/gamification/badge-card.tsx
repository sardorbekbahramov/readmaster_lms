import { cn, formatDate } from "@/lib/utils"
interface Badge { id:string; name:string; description:string; category:string; xpReward:number }
interface Props { badge:Badge; earnedAt?:Date|null; size?:"sm"|"md"|"lg" }
const CAT: Record<string,string> = { unit:"border-teal-200 bg-teal-50 text-teal-700", skill:"border-purple-200 bg-purple-50 text-purple-700", consistency:"border-green-200 bg-green-50 text-green-700", effort:"border-orange-200 bg-orange-50 text-orange-700", challenge:"border-red-200 bg-red-50 text-red-700" }
const EMO: Record<string,string> = { unit:"🏆", skill:"⭐", consistency:"🔥", effort:"💪", challenge:"🔮" }
export function BadgeCard({ badge, earnedAt, size="md" }: Props) {
  const isEarned = !!earnedAt
  const style = CAT[badge.category] ?? "border-gray-200 bg-gray-50 text-gray-600"
  const emoji = EMO[badge.category] ?? "🏅"
  const pad = size==="sm"?"p-2 gap-1":size==="lg"?"p-5 gap-3":"p-4 gap-2"
  const ico = size==="sm"?"text-xl":size==="lg"?"text-4xl":"text-3xl"
  const txt = size==="sm"?"text-[10px]":size==="lg"?"text-sm":"text-xs"
  return (
    <div className={cn("relative flex flex-col items-center rounded-xl border text-center transition-all",pad,isEarned?style:"border-gray-100 bg-gray-50 opacity-40 grayscale")}>
      <div className={ico}>{isEarned?emoji:"🔒"}</div>
      <p className={cn("font-semibold leading-tight",txt)}>{badge.name}</p>
      {size!=="sm"&&<p className={cn("opacity-70 leading-tight",txt)}>{badge.description}</p>}
      {badge.xpReward>0&&isEarned&&<span className="text-[10px] font-bold text-yellow-600">+{badge.xpReward} XP</span>}
      {isEarned&&earnedAt&&size!=="sm"&&<span className="text-[9px] opacity-50">{formatDate(earnedAt)}</span>}
      {!isEarned&&<span className={cn("opacity-50",txt)}>Locked</span>}
    </div>
  )
}
