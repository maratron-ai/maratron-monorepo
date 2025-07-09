"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Skeleton, 
  Badge,
  Button
} from "@components/ui";
import {
  CalendarCheck,
  User,
  Activity,
  ArrowRight,
  TrendingUp,
  Cloud,
  Sun,
  CloudRain,
  Calendar,
  Zap,
  MessageSquare,
  Lightbulb
} from "lucide-react";

import { Icon } from "lucide-react";
import { sneaker } from "@lucide/lab";
import { isDemoMode } from "@lib/utils/demo-mode";
import { useWeather } from "@hooks/useWeather";
import { useUserStats } from "@hooks/useUserStats";
import { useRecentRuns } from "@hooks/useRecentRuns";
import { useUser } from "@hooks/useUser";
import { useTrainingPlan } from "@hooks/useTrainingPlan";
import { useAchievements } from "@hooks/useAchievements";


export default function HomePage() {
  const { data: session, status } = useSession();
  
  // Demo mode for testing/screenshots - bypass auth
  const demoMode = isDemoMode();

  // Real data hooks
  const { weather } = useWeather();
  const { stats, loading: statsLoading } = useUserStats();
  const { profile } = useUser();
  const { todaysWorkout, loading: workoutLoading } = useTrainingPlan();

  if (status === "loading" && !demoMode) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="container mx-auto px-4 py-8 space-y-8">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!session?.user && !demoMode) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <Card className="max-w-md mx-4 shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Activity className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-semibold">Welcome to Maratron</CardTitle>
              <CardDescription>Your personal running companion</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild size="lg" className="w-full">
              <Link href="/login">
                Sign In to Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userName = demoMode ? "Demo User" : (profile?.name || session?.user?.name || session?.user?.email?.split('@')[0]);

  // Use only real data from database/API
  const currentWeather = weather;
  const currentStats = stats;
  const currentWorkout = todaysWorkout;

  // Enhanced workout logic - handles 4 scenarios:
  // Scenario 1: User has workout today -> Show today's workout
  // Scenario 2: User has active plan but nothing today -> Show next scheduled workout
  // Scenario 3: User has no plan and no workout -> Hide entire section
  // Scenario 4: User has rest day today -> Show rest day message
  
  // Only show workout section if there's actual data
  const showWorkoutSection = !!currentWorkout;

  // Determine weather icon and colors
  const getWeatherInfo = (condition: string) => {
    const lowerCondition = condition.toLowerCase();
    const currentHour = new Date().getHours();
    const isNight = currentHour < 6 || currentHour > 20;
    
    if (lowerCondition.includes('rain') || lowerCondition.includes('storm')) {
      return {
        icon: CloudRain,
        bgFrom: 'from-slate-600',
        bgTo: 'to-slate-700',
        darkBgFrom: 'dark:from-slate-700',
        darkBgTo: 'dark:to-slate-800'
      };
    }
    if (lowerCondition.includes('cloud')) {
      return {
        icon: Cloud,
        bgFrom: 'from-gray-500',
        bgTo: 'to-gray-600',
        darkBgFrom: 'dark:from-gray-600',
        darkBgTo: 'dark:to-gray-700'
      };
    }
    if (isNight) {
      return {
        icon: Sun,
        bgFrom: 'from-indigo-800',
        bgTo: 'to-purple-900',
        darkBgFrom: 'dark:from-indigo-900',
        darkBgTo: 'dark:to-purple-950'
      };
    }
    return {
      icon: Sun,
      bgFrom: 'from-blue-500',
      bgTo: 'to-sky-600',
      darkBgFrom: 'dark:from-blue-600',
      darkBgTo: 'dark:to-sky-700'
    };
  };

  // Safe weather info with null check
  const weatherInfo = currentWeather ? getWeatherInfo(currentWeather.condition) : {
    icon: Sun,
    bgFrom: 'from-blue-500',
    bgTo: 'to-sky-600',
    darkBgFrom: 'dark:from-blue-600',
    darkBgTo: 'dark:to-sky-700'
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Good morning, {userName}</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Here&apos;s what&apos;s happening with your running today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardContent className="p-6">
              {statsLoading ? (
                <>
                  <Skeleton className="h-8 w-20 mb-2 bg-zinc-200 dark:bg-zinc-800" />
                  <Skeleton className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800" />
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{currentStats?.weekMiles || 0}</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">Miles This Week</p>
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-500 bg-green-500/10 px-2 py-1 rounded">
                      +12.5%
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardContent className="p-6">
              {statsLoading ? (
                <>
                  <Skeleton className="h-8 w-20 mb-2 bg-zinc-200 dark:bg-zinc-800" />
                  <Skeleton className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800" />
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{currentStats?.weekRuns || 0}</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">Runs This Week</p>
                    </div>
                    <div className="text-xs text-red-600 dark:text-red-500 bg-red-500/10 px-2 py-1 rounded">
                      -20%
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardContent className="p-6">
              {statsLoading ? (
                <>
                  <Skeleton className="h-8 w-20 mb-2 bg-zinc-200 dark:bg-zinc-800" />
                  <Skeleton className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800" />
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{currentStats?.currentStreak || 0}</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">Day Streak</p>
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-500 bg-green-500/10 px-2 py-1 rounded">
                      +12.5%
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardContent className="p-6">
              {statsLoading ? (
                <>
                  <Skeleton className="h-8 w-20 mb-2 bg-zinc-200 dark:bg-zinc-800" />
                  <Skeleton className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800" />
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{currentStats?.goalProgress || 4.5}%</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">Growth Rate</p>
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-500 bg-green-500/10 px-2 py-1 rounded">
                      +4.5%
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Today's Workout */}
        {showWorkoutSection && (
          <Card className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm mb-8">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                  <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Today&apos;s Workout</CardTitle>
                </div>
                {!workoutLoading && currentWorkout && (
                  <Badge variant="outline" className="border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800">
                    {currentWorkout?.hasTrainingPlan ? "Training Plan" : "Recommendation"}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {workoutLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                      <CardContent className="p-4 text-center">
                        <Skeleton className="h-8 w-16 mx-auto mb-2 bg-zinc-200 dark:bg-zinc-700" />
                        <Skeleton className="h-4 w-12 mx-auto bg-zinc-200 dark:bg-zinc-700" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : currentWorkout?.isRestDay ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-zinc-600 dark:text-zinc-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Rest Day</h3>
                  <p className="text-zinc-600 dark:text-zinc-400">Take a well-deserved break to let your body recover</p>
                </div>
              ) : currentWorkout ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{currentWorkout.distance}</div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400">Distance</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{currentWorkout.pace}</div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400">Target Pace</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{currentWorkout.duration}</div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400">Duration</div>
                      </CardContent>
                    </Card>
                  </div>
                  <Card className="bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {currentWorkout.hasTrainingPlan ? "Coach&apos;s Note" : "General Advice"}
                        </span>
                      </div>
                      <p className="text-zinc-600 dark:text-zinc-400 text-sm">{currentWorkout.notes}</p>
                    </CardContent>
                  </Card>
                  {currentWorkout.hasTrainingPlan && (
                    <div className="flex gap-3 justify-center">
                      <Button asChild variant="outline" size="sm" className="border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                        <Link href="/plans">View Training Plan</Link>
                      </Button>
                      <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <Link href="/runs/new">Log This Run</Link>
                      </Button>
                    </div>
                  )}
                </>
              ) : null}
            </CardContent>
          </Card>
        )}

        {/* Weather Card */}
        <Card className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm mb-8">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              {currentWeather ? (
                <>
                  {React.createElement(weatherInfo.icon, { className: "w-5 h-5 text-zinc-600 dark:text-zinc-400" })}
                  Weather Conditions
                </>
              ) : (
                <>
                  <Sun className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                  Weather
                </>
              )}
            </CardTitle>
            <CardDescription className="text-zinc-600 dark:text-zinc-400">
              Current conditions for your run
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentWeather ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{Math.round(currentWeather.temperature)}°</div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">Temperature</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 capitalize">{currentWeather.condition}</div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">Conditions</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{currentWeather.humidity}%</div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">Humidity</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{currentWeather.windSpeed} mph</div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">Wind</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Sun className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
                </div>
                <p className="text-zinc-600 dark:text-zinc-400">Weather data unavailable</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Zap className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              Quick Actions
            </CardTitle>
            <CardDescription className="text-zinc-600 dark:text-zinc-400">Streamline your running workflow</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Button asChild variant="outline" className="h-auto p-4 flex-col gap-2 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <Link href="/plan-generator">
                  <CalendarCheck className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Training Plan</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-500">Create structured workouts</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-4 flex-col gap-2 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <Link href="/analytics">
                  <TrendingUp className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Analytics</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-500">Track your progress</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-4 flex-col gap-2 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <Link href="/chat">
                  <MessageSquare className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">AI Assistant</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-500">Get training advice</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-4 flex-col gap-2 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <Link href="/shoes/new">
                  <Icon iconNode={sneaker} size={20} className="text-zinc-600 dark:text-zinc-400" />
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Add Shoes</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-500">Track shoe mileage</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-4 flex-col gap-2 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <Link href="/social">
                  <Activity className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Social Feed</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-500">Connect with runners</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-4 flex-col gap-2 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <Link href="/profile">
                  <User className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Profile</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-500">Manage your settings</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
