import { redirect } from "next/navigation";

/**
 * Redirects to the sign-in required page with optional callback URL and message
 * @param callbackUrl - The URL to redirect to after successful sign-in
 * @param message - Custom message to display on the sign-in page
 */
export function redirectToSignIn(callbackUrl?: string, message?: string): never {
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

/**
 * Client-side redirect to sign-in page
 * @param callbackUrl - The URL to redirect to after successful sign-in
 * @param message - Custom message to display on the sign-in page
 */
export function clientRedirectToSignIn(callbackUrl?: string, message?: string): void {
  const params = new URLSearchParams();
  
  if (callbackUrl) {
    params.set("callbackUrl", callbackUrl);
  }
  
  if (message) {
    params.set("message", message);
  }
  
  const queryString = params.toString();
  const redirectUrl = `/signin-required${queryString ? `?${queryString}` : ""}`;
  
  if (typeof window !== "undefined") {
    window.location.href = redirectUrl;
  }
}

/**
 * Hook to check authentication and redirect if needed
 * @param isAuthenticated - Whether the user is authenticated
 * @param callbackUrl - The URL to redirect to after successful sign-in
 * @param message - Custom message to display on the sign-in page
 */
export function useAuthRedirect(
  isAuthenticated: boolean,
  callbackUrl?: string,
  message?: string
): void {
  if (!isAuthenticated && typeof window !== "undefined") {
    clientRedirectToSignIn(callbackUrl || window.location.pathname, message);
  }
}