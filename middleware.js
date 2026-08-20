import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    // Middleware logic
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // ✅ Public routes (no auth needed)
        if (
          pathname.startsWith("/login") ||
          pathname.startsWith("/api/auth") ||
          pathname.startsWith("/backend/")
        ) {
          return true;
        }

        // ✅ Home page - allow if authenticated OR unauthenticated
        if (pathname === "/") {
          return true; // Allow everyone, but page will redirect unauthenticated to /login
        }

        // ✅ Admin routes require authentication
        if (pathname.startsWith("/admin")) {
          return !!token;
        }

        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp3|mp4|woff2?|ttf|otf)$).*)",
  ],
};