import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Debug: Print environment variables related to NextAuth
console.log("=== NEXTAUTH INIT DEBUG ===");
console.log("NEXTAUTH_URL (Raw):", process.env.NEXTAUTH_URL);
console.log("VERCEL_URL (Raw):", process.env.VERCEL_URL);
console.log("NODE_ENV:", process.env.NODE_ENV);

// Compute the exact base URL NextAuth will use
const computedUrl = process.env.NEXTAUTH_URL 
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:8080");

console.log("COMPUTED BASE URL:", computedUrl);
console.log("EXPECTED GOOGLE REDIRECT URI:", `${computedUrl}/api/auth/callback/google`);
console.log("===========================");

export const authOptions: NextAuthOptions = {
  // Use secure cookies in production automatically based on the URL
  useSecureCookies: process.env.NODE_ENV === "production",
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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
  logger: {
    error(code, metadata) {
      console.error(`[NextAuth Error] ${code}:`, metadata);
    },
    warn(code) {
      console.warn(`[NextAuth Warning] ${code}`);
    },
    debug(code, metadata) {
      console.log(`[NextAuth Debug] ${code}:`, metadata);
    },
  },
  debug: true, // Enable debug mode for verbose NextAuth logs
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
