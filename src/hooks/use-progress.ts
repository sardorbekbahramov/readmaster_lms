"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
export function useNotifications() {
  return useQuery({ queryKey: ["notifications"], queryFn: () => fetch("/api/notifications").then((r) => r.json()), staleTime: 1000 * 30 })
}
export function useMarkRead() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (ids: string[]) => fetch("/api/notifications",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({ids})}).then((r)=>r.json()), onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }) })
}
