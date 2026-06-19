import { auth } from "@/lib/auth/config"
import { NextResponse } from "next/server"
const ROUTES: Record<string, string[]> = {
  "/dashboard": ["student"],
  "/teacher":   ["teacher","admin"],
  "/admin":     ["admin"],
}
export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth
  for (const [route, roles] of Object.entries(ROUTES)) {
    if (pathname.startsWith(route)) {
      if (!session?.user) {
        const url = new URL("/login", req.url)
        url.searchParams.set("callbackUrl", pathname)
        return NextResponse.redirect(url)
      }
      if (!roles.includes(session.user.role as string)) {
        return NextResponse.redirect(new URL("/unauthorized", req.url))
      }
    }
  }
  if (session?.user && ["/login","/register"].includes(pathname)) {
    const role = session.user.role as string
    return NextResponse.redirect(new URL(role==="admin"?"/admin":role==="teacher"?"/teacher":"/dashboard", req.url))
  }
  return NextResponse.next()
})
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"] }
