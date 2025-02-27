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
      image?: string | null; // 이미지 필드 추가
    };
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
            image: user.image || null, // 이미지 필드 추가
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
        token.image = user.image; // 이미지 필드 추가
      }

      // 세션이 업데이트될 때 토큰도 업데이트
      if (trigger === "update" && session) {
        token.name = session.user.name;
        // 이미지 업데이트 처리
        if (session.user.image !== undefined) {
          token.image = session.user.image;
        }
      }

      return token;
    },
    async session({ session, token, trigger }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.image as string | null; // 이미지 필드 추가
      }

      // 세션 업데이트 시 DB에서 최신 데이터 가져오기
      if (trigger === "update") {
        const updatedUser = await prisma.user.findUnique({
          where: { email: session.user.email },
          select: {
            id: true,
            email: true,
            name: true,
            image: true, // 이미지 필드 추가
          },
        });

        if (updatedUser) {
          session.user = {
            id: updatedUser.id.toString(),
            email: updatedUser.email,
            name: updatedUser.name,
            image: updatedUser.image, // 이미지 필드 추가
          };
        }
      }

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
