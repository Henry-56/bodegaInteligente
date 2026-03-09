import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("Auth: Authorize attempt", credentials?.email);
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { warehouses: { take: 1 } },
        });

        if (!user) {
          console.log("Auth: User not found", credentials.email);
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );
        console.log("Auth: Password comparison", {
          email: credentials.email,
          isValid,
        });

        if (!isValid) return null;

        const userToReturn = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          warehouseId: user.warehouses[0]?.id ?? null,
        };
        console.log("Auth: Authorize success", userToReturn);
        return userToReturn;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        console.log("Auth: JWT callback - user present", user);
        token.userId = user.id;
        token.role = (user as any).role;
        token.warehouseId = (user as any).warehouseId;
      }
      return token;
    },
    async session({ session, token }) {
      console.log("Auth: Session callback", { tokenPresent: !!token });
      if (session.user) {
        (session.user as any).userId = token.userId;
        (session.user as any).role = token.role;
        (session.user as any).warehouseId = token.warehouseId;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-dev-only",
};

// Type augmentation for NextAuth
declare module "next-auth" {
  interface Session {
    user: {
      userId: string;
      email: string;
      name: string;
      role: "OWNER" | "STAFF";
      warehouseId: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    role: "OWNER" | "STAFF";
    warehouseId: string | null;
  }
}
