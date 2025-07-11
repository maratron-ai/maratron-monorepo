"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Button } from "@components/ui/button";
import Link from "next/link";

export default function AuthRedirectDemo() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [redirectTest, setRedirectTest] = useState<string>("");

  const testSignupRedirect = () => {
    setRedirectTest("Testing signup redirect...");
    router.push("/signup");
  };

  const testLoginRedirect = () => {
    setRedirectTest("Testing login redirect...");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <div className="container mx-auto px-6 py-8 max-w-2xl">
        
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            Auth Redirect Demo
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Testing automatic redirects for logged-in users trying to access signup/login pages
          </p>
        </div>

        {/* Current Auth Status */}
        <Card className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm mb-6">
          <CardHeader>
            <CardTitle className="text-xl text-zinc-900 dark:text-zinc-100">
              Current Authentication Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">Status:</span>
                <span className={`font-medium ${
                  status === "loading" ? "text-yellow-600 dark:text-yellow-400" :
                  status === "authenticated" ? "text-green-600 dark:text-green-400" :
                  "text-red-600 dark:text-red-400"
                }`}>
                  {status}
                </span>
              </div>
              
              {session?.user && (
                <>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">User ID:</span>
                    <span className="font-mono text-zinc-900 dark:text-zinc-100">
                      {session.user.id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Email:</span>
                    <span className="font-mono text-zinc-900 dark:text-zinc-100">
                      {session.user.email}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Name:</span>
                    <span className="font-mono text-zinc-900 dark:text-zinc-100">
                      {session.user.name}
                    </span>
                  </div>
                </>
              )}
              
              {!session?.user && status === "unauthenticated" && (
                <div className="text-center py-4">
                  <p className="text-zinc-600 dark:text-zinc-400">Not logged in</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Test Instructions */}
        <Card className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm mb-6">
          <CardHeader>
            <CardTitle className="text-xl text-zinc-900 dark:text-zinc-100">
              Redirect Test Instructions
            </CardTitle>
            <CardDescription className="text-zinc-600 dark:text-zinc-400">
              How to test the new redirect functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {session?.user ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                    <p className="text-green-700 dark:text-green-400 font-medium mb-2">
                      ✅ You are logged in!
                    </p>
                    <p className="text-green-600 dark:text-green-400 text-sm">
                      When you click the buttons below, you should be automatically redirected to your profile page instead of seeing the signup/login forms.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      onClick={testSignupRedirect}
                      className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200"
                    >
                      Test Signup Redirect
                    </Button>
                    
                    <Button
                      onClick={testLoginRedirect}
                      variant="outline"
                      className="border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      Test Login Redirect
                    </Button>
                  </div>
                  
                  {redirectTest && (
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                      <p className="text-blue-700 dark:text-blue-400">{redirectTest}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                    <p className="text-yellow-700 dark:text-yellow-400 font-medium mb-2">
                      ⚠️ You are not logged in
                    </p>
                    <p className="text-yellow-600 dark:text-yellow-400 text-sm">
                      To test the redirect functionality, please log in first. When logged in, visiting signup/login pages should redirect you to your profile.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button asChild>
                      <Link href="/login">
                        Go to Login
                      </Link>
                    </Button>
                    
                    <Button asChild variant="outline">
                      <Link href="/signup">
                        Go to Signup
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Expected Behavior */}
        <Card className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-zinc-900 dark:text-zinc-100">
              Expected Behavior
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <span className="text-green-600 dark:text-green-400 text-lg">✅</span>
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    Logged-in users visiting /signup
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    Should be automatically redirected to /profile
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-green-600 dark:text-green-400 text-lg">✅</span>
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    Logged-in users visiting /login
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    Should be automatically redirected to /profile
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-blue-600 dark:text-blue-400 text-lg">📝</span>
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    Non-logged-in users
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    Should see normal signup/login forms as expected
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}