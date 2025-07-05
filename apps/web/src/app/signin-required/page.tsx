"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@components/ui/button";
import { Card, CardContent } from "@components/ui/card";
import { LogIn, ArrowLeft, User } from "lucide-react";

export default function SignInRequiredPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/home";
  const customMessage = searchParams.get("message");

  const handleSignIn = () => {
    signIn(undefined, { callbackUrl });
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-md px-4">
        <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              {/* Icon */}
              <div className="flex justify-center">
                <div className="rounded-full bg-brand-from/10 p-4">
                  <User className="h-8 w-8 text-brand-from" />
                </div>
              </div>

              {/* Heading */}
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-foreground">
                  Sign In Required
                </h1>
                <p className="text-muted-foreground text-sm">
                  {customMessage || "You need to be signed in to access this page"}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleSignIn}
                  className="w-full bg-brand-from hover:bg-brand-from/90 text-white font-medium py-2.5 transition-colors"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>

                <Button
                  variant="outline"
                  onClick={handleGoBack}
                  className="w-full border-muted-foreground/20 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
              </div>

              {/* Additional Info */}
              <div className="pt-4 border-t border-muted-foreground/10">
                <p className="text-xs text-muted-foreground">
                  Don&apos;t have an account?{" "}
                  <button
                    onClick={() => router.push("/signup")}
                    className="text-brand-from hover:text-brand-from/80 underline transition-colors"
                  >
                    Sign up here
                  </button>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          You&apos;ll be redirected back to your destination after signing in
        </p>
      </div>
    </div>
  );
}