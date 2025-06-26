"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import RecentRuns from "@components/runs/RecentRuns";
import TrainingPlansList from "@components/training/TrainingPlansList";
import WeeklyRuns from "@components/runs/WeeklyRuns";
import ShoesList from "@components/shoes/ShoesList";
import DashboardStats from "@components/runs/DashboardStats";
import { Card, Skeleton } from "@components/ui";
import {
  PlusCircle,
  CalendarCheck,
  User,
  BarChart3,
} from "lucide-react";

import { Icon } from "lucide-react";
import { sneaker } from "@lucide/lab";

export default function HomePage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <main className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-40 w-full" />
      </main>
    );
  }

  if (!session?.user) {
    return (
      <main className="w-full px-4 sm:px-6 lg:px-8 min-h-screen flex flex-col items-center justify-center text-center space-y-6">
        <h1 className="text-4xl font-bold mb-4">Welcome to Maratron</h1>
        <p className="mb-6">
          Please{" "}
          <Link href="/login" className="underline text-primary">
            sign in
          </Link>{" "}
          to access your dashboard.
        </p>
      </main>
    );
  }

  const userName = session.user.name || session.user.email;

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 min-h-screen bg-background text-foreground space-y-10 pt-8 pb-20">
      <h1 className="text-3xl font-bold">Welcome back, {userName}!</h1>
      <div className="h-1 w-24 mb-6 bg-gradient-to-r from-brand-from to-brand-to rounded"></div>
      <DashboardStats />

      <section>
        <h2 className="text-2xl font-bold mb-4 border-b-2 border-primary inline-block pb-1">
          Quick Actions
        </h2>
        {/* Wrap grid in a max-width container */}
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/runs/new" style={{ textDecoration: "none" }}>
              <Card className="p-4 flex items-center gap-2 text-foreground hover:bg-primary hover:text-background transition-colors hover:border-muted-foreground">
                <PlusCircle className="w-5 h-5" />
                <span>Add a Run</span>
              </Card>
            </Link>
            <Link href="/plan-generator" style={{ textDecoration: "none" }}>
              <Card className="p-4 flex items-center gap-2 text-foreground hover:bg-primary hover:text-background transition-colors hover:border-muted-foreground">
                <CalendarCheck className="w-5 h-5" />
                <span>Generate Training Plan</span>
              </Card>
            </Link>
            <Link href="/shoes/new" style={{ textDecoration: "none" }}>
              <Card className="p-4 flex items-center gap-2 text-foreground hover:bg-primary hover:text-background transition-colors hover:border-muted-foreground">
                <Icon iconNode={sneaker} size={24} />
                <span>Add New Shoes</span>
              </Card>
            </Link>
            <Link href="/profile" style={{ textDecoration: "none" }}>
              <Card className="p-4 flex items-center gap-2 text-foreground hover:bg-primary hover:text-background transition-colors hover:border-muted-foreground">
                <User className="w-5 h-5" />
                <span>Edit Profile</span>
              </Card>
            </Link>
            <Link href="/analytics" style={{ textDecoration: "none" }}>
              <Card className="p-4 flex items-center gap-2 text-foreground hover:bg-primary hover:text-background transition-colors hover:border-muted-foreground">
                <User className="w-5 h-5" />
                <span>View progress analytics</span>
              </Card>
            </Link>
            <Card className="p-4 flex items-center gap-2 text-foreground">
              <BarChart3 className="w-5 h-5" />
              <span>Upload workout file (coming soon)</span>
            </Card>
          </div>
        </div>
      </section>
      <h2 className="text-2xl font-bold mb-4 border-b-2 border-primary inline-block pb-1">
        Recent Runs
      </h2>
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <section>
          <RecentRuns />
        </section>
      </div>

      <h2 className="text-2xl font-bold mb-4 border-b-2 border-primary inline-block pb-1">
        This Week&apos;s Runs
      </h2>
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <section>
          <WeeklyRuns />
        </section>
      </div>

      <h2 className="text-2xl font-bold mb-4 border-b-2 border-primary inline-block pb-1">
        Your Training Plan
      </h2>
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <section>
          <TrainingPlansList />
        </section>
      </div>

      <h2 className="text-2xl font-bold mb-4 border-b-2 border-primary inline-block pb-1">
        Your Shoes
      </h2>
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <section>
          <ShoesList />
        </section>
      </div>
    </main>
  );
}
