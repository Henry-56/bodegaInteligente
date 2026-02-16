import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/products/:path*",
    "/purchases/:path*",
    "/sales/:path*",
    "/chat/:path*",
    "/debtors/:path*",
    "/reports/:path*",
  ],
};
