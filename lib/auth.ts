import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"
import { authConfig } from "./auth.config"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // --- HARDCODED BYPASS FOR VERCEL ---
        // This ensures the demo credentials always work even if the database connection fails on Vercel.
        if (credentials.email === "admin@company.com" && credentials.password === "Admin@123") {
          return { id: "103999ee-7e9e-40c9-a29e-7aa426b2b46b", email: "admin@company.com", name: "System Admin", role: "ADMIN" }
        }
        if (credentials.email === "manager@example.com" && credentials.password === "Manager@123") {
          return { id: "1c0fc4d2-0268-4105-98e2-caf92ff89b26", email: "manager@example.com", name: "Manager User", role: "MANAGER" }
        }
        if (credentials.email === "employee@example.com" && credentials.password === "Employee@123") {
          return { id: "5f5e3d87-599b-4635-8ccd-260a25f9ef52", email: "employee@example.com", name: "Employee User", role: "EMPLOYEE" }
        }
        // -----------------------------------

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
          })

          if (!user || !user.isActive) {
            return null
          }

          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          )

          if (!isValid) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      },
    }),
  ],
})
