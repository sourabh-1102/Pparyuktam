import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: { params: { prompt: "select_account" } }
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, account }) {
      // Only resolve the Supabase UUID on the FIRST sign-in (when account is present)
      // Subsequent token refreshes skip this to avoid repeated Admin API calls
      if (account && token.email) {
        try {
          const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
          const authUser = users.find((u) => u.email === token.email);
          // Store the Supabase UUID if the user already exists in auth.users
          // If they don't exist yet, the /api/profile/setup route will provision them
          token.supabaseId = authUser?.id ?? null;
        } catch (e) {
          console.error("JWT callback: failed to look up Supabase UUID", e);
          token.supabaseId = null;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session?.user) {
        // Use the Supabase UUID if resolved; fall back to token.sub (numeric Google ID)
        // The onboarding form detects the numeric ID and uses the /api/profile/setup route
        (session.user as any).id = (token.supabaseId as string) || token.sub;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
