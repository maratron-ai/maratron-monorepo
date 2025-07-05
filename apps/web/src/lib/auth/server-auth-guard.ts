import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * Server-side authentication guard for API routes and server components
 * Redirects to sign-in page if user is not authenticated
 */
export async function requireAuth(
  callbackUrl?: string,
  message?: string
): Promise<NonNullable<Awaited<ReturnType<typeof getServerSession>>>> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    const params = new URLSearchParams();
    
    if (callbackUrl) {
      params.set("callbackUrl", callbackUrl);
    }
    
    if (message) {
      params.set("message", message);
    }
    
    const queryString = params.toString();
    const redirectUrl = `/signin-required${queryString ? `?${queryString}` : ""}`;
    
    redirect(redirectUrl);
  }

  return session;
}

/**
 * Server-side authentication check without redirect
 * Returns session or null if not authenticated
 */
export async function getAuthSession() {
  try {
    const session = await getServerSession(authOptions);
    return session;
  } catch (error) {
    console.error("Error getting auth session:", error);
    return null;
  }
}

/**
 * Check if user is authenticated on the server
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getAuthSession();
  return !!session?.user;
}

/**
 * Get user ID from server session
 */
export async function getUserId(): Promise<string | null> {
  const session = await getAuthSession();
  return session?.user?.id || null;
}

/**
 * API route authentication guard
 * Use in API routes to ensure user is authenticated
 */
export async function apiRequireAuth() {
  const session = await getAuthSession();
  
  if (!session?.user) {
    throw new Error("Authentication required");
  }
  
  return session;
}