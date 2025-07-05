"use client";

import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Spinner } from "@components/ui";
import { clientRedirectToSignIn } from "@lib/utils/auth-redirect";

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectMessage?: string;
  requireAuth?: boolean;
}

/**
 * Higher-order component that protects routes requiring authentication
 * Automatically redirects to sign-in page if user is not authenticated
 */
export function ProtectedRoute({
  children,
  fallback,
  redirectMessage = "You need to be signed in to access this page",
  requireAuth = true,
}: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  useEffect(() => {
    if (requireAuth && status === "unauthenticated") {
      clientRedirectToSignIn(pathname, redirectMessage);
    }
  }, [status, requireAuth, pathname, redirectMessage]);

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <Spinner className="h-8 w-8 mx-auto" />
            <p className="text-muted-foreground">Checking authentication...</p>
          </div>
        </div>
      )
    );
  }

  // If auth is required but user is not authenticated, show loading
  // (redirect will happen via useEffect)
  if (requireAuth && !session?.user) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <Spinner className="h-8 w-8 mx-auto" />
            <p className="text-muted-foreground">Redirecting to sign in...</p>
          </div>
        </div>
      )
    );
  }

  // If auth is not required or user is authenticated, render children
  return <>{children}</>;
}

/**
 * Hook for protecting individual components or sections
 */
export function useProtectedRoute(redirectMessage?: string) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const requireAuth = () => {
    if (status === "unauthenticated") {
      clientRedirectToSignIn(
        pathname,
        redirectMessage || "You need to be signed in to access this feature"
      );
    }
  };

  return {
    isAuthenticated: !!session?.user,
    isLoading: status === "loading",
    requireAuth,
    session,
  };
}