import { cn } from "@/lib/utils"
export function Skeleton({ className }: { className?:string }) {
  return <div className={cn("animate-pulse rounded-md bg-gray-100", className)}/>
}
export function CardSkeleton() {
  return <div className="rounded-xl border bg-white p-4 space-y-3"><Skeleton className="h-4 w-2/3"/><Skeleton className="h-3 w-1/2"/><Skeleton className="h-8 w-full"/></div>
}
