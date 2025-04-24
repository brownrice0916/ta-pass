import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { User as MyUser } from "@/lib/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      membershipType?: string; // 멤버십 타입 필드 추가
    };
  }
  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    membershipType?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(
        credentials: Record<"email" | "password", string> | undefined
      ): Promise<MyUser | null> {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (user && bcrypt.compareSync(credentials.password, user.password)) {
          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            image: user.image || null,
            membershipType: user.membershipType || "free", // 멤버십 타입 추가
          };
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
        token.membershipType = user.membershipType; // 멤버십 타입 추가
      }

      // 세션이 업데이트될 때 토큰도 업데이트
      if (trigger === "update" && session) {
        token.name = session.user.name;
        // 이미지 업데이트 처리
        if (session.user.image !== undefined) {
          token.image = session.user.image;
        }
        // 멤버십 타입 업데이트 처리
        if (session.user.membershipType !== undefined) {
          token.membershipType = session.user.membershipType;
        }
      }

      return token;
    },
    async session({ session, token, trigger }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.image as string | null;
        session.user.membershipType =
          (token.membershipType as string) || "free"; // 멤버십 타입 추가
      }

      // 세션 업데이트 시 DB에서 최신 데이터 가져오기
      if (trigger === "update") {
        const updatedUser = await prisma.user.findUnique({
          where: { email: session.user.email },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            membershipType: true, // 멤버십 타입 선택
          },
        });

        if (updatedUser) {
          session.user = {
            id: updatedUser.id.toString(),
            email: updatedUser.email,
            name: updatedUser.name,
            image: updatedUser.image,
            membershipType: updatedUser.membershipType || "free", // 멤버십 타입 추가
          };
        }
      }

      console.log("Session updated:", session);
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  logger: {
    error: (code, metadata) => {
      console.error(code, metadata);
    },
    warn: (code) => {
      console.warn(code);
    },
    debug: (code, metadata) => {
      console.debug(code, metadata);
    },
  },
  debug: false,
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
