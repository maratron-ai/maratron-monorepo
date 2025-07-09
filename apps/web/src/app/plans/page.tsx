"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Badge,
  Button,
  Skeleton
} from "@components/ui";
import {
  Calendar,
  Clock,
  Target,
  Activity,
  Plus,
  ArrowRight,
  TrendingUp
} from "lucide-react";

interface RunningPlan {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  startDate?: string;
  endDate?: string;
  goalRace?: string;
  planType?: string;
  weeksRemaining?: number;
  totalWeeks?: number;
  createdAt: string;
}

export default function PlansPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [plans, setPlans] = useState<RunningPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch('/api/training-plan');
        if (!response.ok) {
          throw new Error('Failed to fetch training plans');
        }
        const data = await response.json();
        setPlans(data.plans || []);
      } catch (error) {
        console.error("Failed to fetch training plans:", error);
        setPlans([]);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchPlans();
    } else {
      setLoading(false);
    }
  }, [session]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-64 mb-4" />
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    router.push("/login");
    return null;
  }

  const activePlan = plans.find(plan => plan.active);
  const completedPlans = plans.filter(plan => !plan.active);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Training Plans</h1>
            <p className="text-muted-foreground mt-1">
              Manage your running training plans and track your progress
            </p>
          </div>
          <Button asChild>
            <Link href="/plan-generator">
              <Plus className="w-4 h-4 mr-2" />
              Create New Plan
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-6">
            {[...Array(2)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : (
          <>
            {/* Active Plan */}
            {activePlan && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-600" />
                  Active Training Plan
                </h2>
                <Card className="border-l-4 border-green-500 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl">{activePlan.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {activePlan.description}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Active
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-2">
                          <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">
                            {activePlan.goalRace || "General Fitness"}
                          </div>
                          <div className="text-sm text-muted-foreground">Goal Race</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-orange-100 dark:bg-orange-900 rounded-full p-2">
                          <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">
                            {activePlan.weeksRemaining} weeks left
                          </div>
                          <div className="text-sm text-muted-foreground">
                            of {activePlan.totalWeeks} total
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-purple-100 dark:bg-purple-900 rounded-full p-2">
                          <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">
                            {Math.round(((activePlan.totalWeeks! - activePlan.weeksRemaining!) / activePlan.totalWeeks!) * 100)}%
                          </div>
                          <div className="text-sm text-muted-foreground">Complete</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button asChild>
                        <Link href={`/plans/${activePlan.id}`}>
                          View Plan Details
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href="/runs/new">Log Today's Run</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Create Plan CTA - if no active plan */}
            {!activePlan && (
              <Card className="border-dashed border-2 border-gray-300 dark:border-gray-700">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                    <Plus className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No Active Training Plan
                  </h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Create a personalized training plan to reach your running goals
                  </p>
                  <Button asChild>
                    <Link href="/plan-generator">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Plan
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Completed Plans */}
            {completedPlans.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  Previous Training Plans
                </h2>
                <div className="grid gap-4">
                  {completedPlans.map((plan) => (
                    <Card key={plan.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{plan.name}</CardTitle>
                            <CardDescription>{plan.description}</CardDescription>
                          </div>
                          <Badge variant="outline">Completed</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            {plan.startDate && plan.endDate && (
                              <>
                                {new Date(plan.startDate).toLocaleDateString()} - {new Date(plan.endDate).toLocaleDateString()}
                              </>
                            )}
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/plans/${plan.id}`}>
                              View Details
                              <ArrowRight className="w-4 h-4 ml-1" />
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}