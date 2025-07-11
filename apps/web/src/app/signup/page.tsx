"use client";

import { useState, FormEvent, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { createUser } from "@lib/api/user/user";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import { Label } from "@components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Alert, AlertDescription } from "@components/ui/alert";
import { useSignupFlow } from "@lib/contexts/SignupFlowContext";

interface UserRegistrationData {
  name: string;
  email: string;
  password: string;
}


export default function SignupPage() {
  const { data: session, status } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { completeStep } = useSignupFlow();

  // Redirect logged-in users to their profile
  useEffect(() => {
    if (status === "loading") return; // Still loading
    
    if (session?.user) {
      // User is already logged in, redirect to profile
      router.replace("/profile");
    }
  }, [session, status, router]);
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      const createUserRes = await createUser({ name, email, password } as UserRegistrationData);

      if (createUserRes?.status === 201 || createUserRes?.status === 200) {
        // Now sign in the new user
        const signInRes = await signIn("credentials", {
          redirect: false,
          email,
          password,
        });

        if (signInRes?.ok) {
          // Mark register step as complete
          completeStep("register");
          router.push("/signup/profile");
        } else {
          setError("Invalid email or password");
        }
      } else {
        setError("Failed to create user.");
      }
    } catch (err) {
      console.error(err);
      setError("Signup failed. Please try again.");
    }
  };

  // Show loading while checking authentication status
  if (status === "loading") {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-white dark:bg-zinc-950">
        <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    );
  }

  // Don't render signup form if user is already logged in
  if (session?.user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-white dark:bg-zinc-950">
      <div className="w-full max-w-sm">
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-zinc-900 dark:text-zinc-100">
              Create your account
            </CardTitle>
            <CardDescription className="text-zinc-600 dark:text-zinc-400">
              Enter your details below to create your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-6">
                {error && (
                  <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                    <AlertDescription className="text-red-600 dark:text-red-400">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-zinc-900 dark:text-zinc-100">
                    Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-zinc-900 dark:text-zinc-100">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="password" className="text-zinc-900 dark:text-zinc-100">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                
                <Button
                  type="submit"
                  className="w-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200"
                >
                  Create Account
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  onClick={() => {
                    // Mark register step as complete for Google signup
                    completeStep("register");
                    signIn("google", { callbackUrl: "/signup/profile" });
                  }}
                >
                  Sign up with Google
                </Button>
              </div>
              <div className="mt-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
                Already have an account?{" "}
                <a href="/login" className="text-zinc-900 dark:text-zinc-100 underline underline-offset-4 hover:no-underline">
                  Sign in
                </a>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
