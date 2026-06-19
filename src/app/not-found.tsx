import Link from "next/link"
import { Button } from "@/components/ui/button"
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-200 mb-4">404</h1>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Page not found</h2>
        <p className="text-gray-500 text-sm mb-6">The page you're looking for doesn't exist.</p>
        <Link href="/dashboard"><Button>Go to Dashboard</Button></Link>
      </div>
    </div>
  )
}
