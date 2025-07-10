"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

interface SignupFlowContextType {
  isInSignupFlow: boolean;
  hasCompletedStep: (step: SignupStep) => boolean;
  completeStep: (step: SignupStep) => void;
  getNextStep: () => string | null;
  getCurrentStep: () => SignupStep | null;
  resetFlow: () => void;
  canAccessStep: (step: SignupStep) => boolean;
}

export type SignupStep = "register" | "profile" | "vdot" | "coach" | "complete";

const SIGNUP_FLOW_STEPS: SignupStep[] = ["register", "profile", "vdot", "coach", "complete"];

const STEP_PATHS: Record<SignupStep, string> = {
  register: "/signup",
  profile: "/signup/profile", 
  vdot: "/signup/vdot",
  coach: "/signup/coach",
  complete: "/home"
};

const SignupFlowContext = createContext<SignupFlowContextType | undefined>(undefined);

export function SignupFlowProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [completedSteps, setCompletedSteps] = useState<Set<SignupStep>>(new Set());
  const [isInSignupFlow, setIsInSignupFlow] = useState(false);

  // Initialize signup flow state from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const savedFlow = localStorage.getItem("signup_flow");
    const savedSteps = localStorage.getItem("signup_completed_steps");
    
    if (savedFlow === "true") {
      setIsInSignupFlow(true);
      if (savedSteps) {
        try {
          const steps = JSON.parse(savedSteps) as SignupStep[];
          setCompletedSteps(new Set(steps));
        } catch (error) {
          console.error("Error parsing saved signup steps:", error);
        }
      }
    }
  }, []);

  // Start signup flow when user registers
  useEffect(() => {
    if (status === "loading") return;
    
    // If user just signed up and is on a signup page, start the flow
    if (session?.user && pathname?.startsWith("/signup")) {
      if (!isInSignupFlow) {
        setIsInSignupFlow(true);
        localStorage.setItem("signup_flow", "true");
      }
    }
    
    // If user is authenticated and not in signup flow, they shouldn't be on signup pages
    if (session?.user && pathname?.startsWith("/signup") && !isInSignupFlow) {
      router.replace("/home");
    }
  }, [session, status, pathname, isInSignupFlow, router]);

  // Save flow state to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    if (isInSignupFlow) {
      localStorage.setItem("signup_flow", "true");
      localStorage.setItem("signup_completed_steps", JSON.stringify(Array.from(completedSteps)));
    } else {
      localStorage.removeItem("signup_flow");
      localStorage.removeItem("signup_completed_steps");
    }
  }, [isInSignupFlow, completedSteps]);

  const hasCompletedStep = (step: SignupStep): boolean => {
    return completedSteps.has(step);
  };

  const completeStep = (step: SignupStep) => {
    setCompletedSteps(prev => new Set([...prev, step]));
  };

  const getCurrentStep = (): SignupStep | null => {
    if (!pathname?.startsWith("/signup")) return null;
    
    const pathToStep = Object.entries(STEP_PATHS).find(([, path]) => path === pathname);
    return pathToStep ? pathToStep[0] as SignupStep : null;
  };

  const getNextStep = (): string | null => {
    const currentStep = getCurrentStep();
    if (!currentStep) return null;
    
    const currentIndex = SIGNUP_FLOW_STEPS.indexOf(currentStep);
    const nextStep = SIGNUP_FLOW_STEPS[currentIndex + 1];
    
    return nextStep ? STEP_PATHS[nextStep] : null;
  };

  const canAccessStep = (step: SignupStep): boolean => {
    if (!isInSignupFlow) return false;
    
    const stepIndex = SIGNUP_FLOW_STEPS.indexOf(step);
    if (stepIndex === -1) return false;
    
    // Can always access the first step
    if (stepIndex === 0) return true;
    
    // Can access a step if the previous step is completed
    const previousStep = SIGNUP_FLOW_STEPS[stepIndex - 1];
    return hasCompletedStep(previousStep);
  };

  const resetFlow = () => {
    setIsInSignupFlow(false);
    setCompletedSteps(new Set());
    if (typeof window !== "undefined") {
      localStorage.removeItem("signup_flow");
      localStorage.removeItem("signup_completed_steps");
    }
  };

  const contextValue: SignupFlowContextType = {
    isInSignupFlow,
    hasCompletedStep,
    completeStep,
    getNextStep,
    getCurrentStep,
    resetFlow,
    canAccessStep
  };

  return (
    <SignupFlowContext.Provider value={contextValue}>
      {children}
    </SignupFlowContext.Provider>
  );
}

export function useSignupFlow() {
  const context = useContext(SignupFlowContext);
  if (context === undefined) {
    throw new Error("useSignupFlow must be used within a SignupFlowProvider");
  }
  return context;
}