import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

const handler = NextAuth(authOptions)

// 이 부분이 중요합니다
export const GET = handler
export const POST = handler