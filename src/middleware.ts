import { jwtDecode } from "jwt-decode";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const protectedRoutes = ["/create-room", "/join-room", "/game", "/profile"];

// Routes that should be accessible only to non-authenticated users
const authRoutes = ["/login", "/signup"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the current route is a protected route
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  // Check if the current route is an auth route
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Get the token from cookies
  const token = request.cookies.get("accessToken")?.value;

  // Different handling for protected routes vs. auth routes
  if (isProtectedRoute) {
    // For protected routes, we need a valid token
    if (!token) {
      // No token, redirect to login
      const url = new URL("/login", request.url);
      url.searchParams.set("callbackUrl", encodeURI(pathname));
      return NextResponse.redirect(url);
    }

    try {
      // Verify token expiration
      const decodedToken = jwtDecode<{ exp: number }>(token);
      if (decodedToken.exp < Date.now() / 1000) {
        // Token expired, redirect to login
        const url = new URL("/login", request.url);
        return NextResponse.redirect(url);
      }
    } catch (error) {
      // Token is invalid, redirect to login
      const url = new URL("/login", request.url);
      return NextResponse.redirect(url);
    }
  } else if (isAuthRoute) {
    // For auth routes, redirect to home if valid token exists
    if (token) {
      try {
        const decodedToken = jwtDecode<{ exp: number }>(token);
        if (decodedToken.exp > Date.now() / 1000) {
          // Valid token on auth route, redirect to home
          return NextResponse.redirect(new URL("/", request.url));
        }
      } catch (error) {
        // Invalid token, do nothing and let them access the auth route
      }
    }
  }

  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all protected routes and auth routes
     */
    "/create-room/:path*",
    "/join-room/:path*",
    "/game/:path*",
    "/profile/:path*",
    "/login",
    "/signup",
  ],
};
