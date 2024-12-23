import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { User as MyUser } from "@/lib/types"; // Your custom User type

// Extend the next-auth User type
declare module "next-auth" {
  interface User {
    id: string; // Add the id field to the User object
    email: string;
    name?: string | null;
    image?: string | null;
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
            id: user.id.toString(), // Ensure this matches your database structure
            email: user.email,
            name: user.name,
          };
        }

        return null; // 인증 실패
      },
    }),
  ],
  session: {
    strategy: "jwt", // 세션 전략 설정
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id; // You can safely access user.id now
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      console.log("token", token);
      if (token) {
        session.user = session.user || {};

        session.user.email = token.email;
        session.user.name = token.name;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login", // 로그인 페이지 설정
  },
};

export default NextAuth(authOptions);
