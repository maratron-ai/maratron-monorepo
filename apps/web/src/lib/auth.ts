// lib/auth.ts
import { NextAuthOptions, Session, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@lib/prisma";
import { verifyPassword } from "@lib/utils/passwordUtils";
import type { JWT } from "next-auth/jwt";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "your@email.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          // Validate that both email and password are provided
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          // Find user by email and include passwordHash
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            select: {
              id: true,
              name: true,
              email: true,
              passwordHash: true,
              age: true,
              gender: true,
              trainingLevel: true,
              VDOT: true,
              goals: true,
              avatarUrl: true,
              yearsRunning: true,
              weeklyMileage: true,
              height: true,
              weight: true,
              injuryHistory: true,
              preferredTrainingDays: true,
              preferredTrainingEnvironment: true,
              device: true,
              defaultDistanceUnit: true,
              defaultElevationUnit: true,
              createdAt: true,
              updatedAt: true,
            }
          });
          
          if (!user) {
            return null;
          }

          // Verify password using bcrypt
          const isPasswordValid = await verifyPassword(credentials.password, user.passwordHash);
          
          if (!isPasswordValid) {
            return null;
          }

          // Return user without password hash for security
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { passwordHash, ...userWithoutPassword } = user;
          return userWithoutPassword;
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
  ],
  session: { 
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      if (session.user && (token as JWT & { avatarUrl?: string }).avatarUrl) {
        const avatar = (
          token as JWT & { avatarUrl?: string }
        ).avatarUrl as string;
        session.user.avatarUrl = avatar;
      }
      return session;
    },
    async jwt({
        token,
        user,
        trigger,
        session,
      }: {
        token: JWT;
        user?: User;
        trigger?: string;
        session?: Session;
      }) {  
      
      if (user) {
        token.id = user.id;
        (token as JWT & { avatarUrl?: string }).avatarUrl = (
          user as User & { avatarUrl?: string }
        ).avatarUrl;
      }
      if (trigger === "update" && session?.user?.avatarUrl !== undefined) {
        (token as JWT & { avatarUrl?: string }).avatarUrl = session.user
          .avatarUrl as string | undefined;
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
  },
};