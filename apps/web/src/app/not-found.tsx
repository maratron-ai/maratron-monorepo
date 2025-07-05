"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@components/ui/button";
import { Card, CardContent } from "@components/ui/card";
import { Home, ArrowLeft, Search, AlertCircle } from "lucide-react";

export default function NotFound() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);
  const [showCountdown, setShowCountdown] = useState(true);

  useEffect(() => {
    if (!showCountdown) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.push("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [router, showCountdown]);

  const handleStopCountdown = () => {
    setShowCountdown(false);
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
      <div className="w-full max-w-lg px-4">
        <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              {/* Icon and Error Code */}
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="rounded-full bg-destructive/10 p-4">
                    <AlertCircle className="h-12 w-12 text-destructive" />
                  </div>
                </div>
                <div className="text-6xl font-bold text-muted-foreground/50">
                  404
                </div>
              </div>

              {/* Heading and Description */}
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-foreground">
                  Page Not Found
                </h1>
                <p className="text-muted-foreground">
                  Sorry, we couldn&apos;t find the page you&apos;re looking for. The page might have been moved, deleted, or you may have mistyped the URL.
                </p>
              </div>

              {/* Countdown */}
              {showCountdown && (
                <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Redirecting to home page in{" "}
                    <span className="font-bold text-foreground">{countdown}</span>{" "}
                    seconds
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStopCountdown}
                    className="text-xs bg-background border-foreground/40 text-foreground hover:bg-foreground hover:text-white font-medium"
                  >
                    Cancel redirect
                  </Button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  onClick={handleGoBack}
                  variant="outline"
                  className="w-full border-foreground/30 bg-background hover:bg-foreground hover:text-background text-foreground font-medium transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>

                <Button asChild className="w-full bg-brand-from hover:bg-brand-from/90 text-white font-medium shadow-sm">
                  <Link href="/">
                    <Home className="h-4 w-4 mr-2" />
                    Home Page
                  </Link>
                </Button>
              </div>

              {/* Additional Navigation */}
              <div className="pt-4 border-t border-muted-foreground/10">
                <p className="text-sm text-muted-foreground mb-3">
                  Or try one of these pages:
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button variant="outline" size="sm" asChild className="bg-background border-foreground/30 hover:bg-foreground hover:text-white">
                    <Link href="/runs" className="text-xs text-foreground font-medium hover:text-white">
                      My Runs
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild className="bg-background border-foreground/30 hover:bg-foreground hover:text-white">
                    <Link href="/analytics" className="text-xs text-foreground font-medium hover:text-white">
                      Analytics
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild className="bg-background border-foreground/30 hover:bg-foreground hover:text-white">
                    <Link href="/social" className="text-xs text-foreground font-medium hover:text-white">
                      Social
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild className="bg-background border-foreground/30 hover:bg-foreground hover:text-white">
                    <Link href="/plan-generator" className="text-xs text-foreground font-medium hover:text-white">
                      <Search className="h-3 w-3 mr-1" />
                      Plans
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help Text */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          If you believe this is an error, please contact support or try refreshing the page
        </p>
      </div>
    </div>
  );
}
