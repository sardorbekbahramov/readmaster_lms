import { LucideIcon } from "lucide-react"
interface Props { icon:LucideIcon; title:string; description?:string; action?:React.ReactNode }
export function EmptyState({ icon:Icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon className="h-12 w-12 text-gray-200 mb-4"/>
      <h3 className="text-base font-semibold text-gray-600 mb-1">{title}</h3>
      {description&&<p className="text-sm text-gray-400 mb-4 max-w-xs">{description}</p>}
      {action}
    </div>
  )
}
