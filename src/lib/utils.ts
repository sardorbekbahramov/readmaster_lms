import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}
export function formatRelativeTime(date: Date | string): string {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (diff < 60) return "just now"
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}
export function getWeekStart(date = new Date()): Date {
  const d = new Date(date)
  const day = d.getUTCDay()
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1)
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff))
}
export function calculateReadingTime(wordCount: number): number {
  return Math.ceil(wordCount / 200)
}
export function truncate(str: string, length: number): string {
  return str.length > length ? str.slice(0, length) + "..." : str
}
