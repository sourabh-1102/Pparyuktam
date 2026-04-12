import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/student/:path*",
    "/company/:path*",
    "/create-team/:path*",
    "/join-team/:path*",
    "/projects/:path*",
  ],
};
