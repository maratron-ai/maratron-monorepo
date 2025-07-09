"use client";

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
  Progress, 
  Button,
  Alert,
  AlertTitle,
  AlertDescription,
} from "@components/ui";
import {
  Play,
  Calendar,
  Zap,
  Trophy,
  Award,
  Bell,
  Sun,
  Cloud,
  CloudRain,
  Activity,
  TrendingUp,
  Target,
  Timer,
  MapPin,
  ExternalLink,
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

import { AppSidebar } from "@components/components/app-sidebar"
import { SiteHeader } from "@components/components/site-header"
import { SidebarInset, SidebarProvider } from "@components/components/ui/sidebar"

// Mock data for demo
const mockWeather = {
  temperature: 68,
  condition: "Sunny",
  icon: Sun,
  humidity: 45,
  windSpeed: 5
};

const mockStats = {
  weekMiles: 12.5,
  weekRuns: 3,
  currentStreak: 5,
  goalProgress: 68
};

const mockTodaysWorkout = {
  hasTrainingPlan: true,
  workoutType: "Easy Run",
  distance: "5 miles",
  pace: "8:30-9:00 min/mi",
  duration: "42-45 min",
  notes: "Focus on keeping an easy conversational pace",
  isRestDay: false
};

const mockRecentRuns = [
  { id: 1, date: "Yesterday", distance: "3.2 mi", time: "26:45", pace: "8:21" },
  { id: 2, date: "2 days ago", distance: "6.0 mi", time: "51:30", pace: "8:35" },
  { id: 3, date: "4 days ago", distance: "3.5 mi", time: "28:12", pace: "8:03" }
];

const mockAchievements = [
  { title: "5-Day Streak", description: "5 consecutive running days", icon: Trophy, isNew: true },
  { title: "Personal Best", description: "Fastest 5K this month", icon: Award, isNew: false }
];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  
  // Demo mode for testing/screenshots
  const demoMode = isDemoMode();

  // Real data hooks
  const { weather, loading: weatherLoading } = useWeather();
  const { stats, loading: statsLoading } = useUserStats();
  const { runs: recentRuns, loading: runsLoading } = useRecentRuns(3);
  const { profile } = useUser();
  const { todaysWorkout, loading: workoutLoading } = useTrainingPlan();
  const { achievements, alerts, loading: achievementsLoading } = useAchievements();

  const userName = demoMode ? "Demo User" : (profile?.name || session?.user?.name || session?.user?.email?.split('@')[0]);

  // Use real data when available, fallback to mock data
  const currentWeather = weather || mockWeather;
  const currentStats = stats || mockStats;
  const displayRuns = recentRuns.length > 0 ? recentRuns : mockRecentRuns;
  const currentWorkout = todaysWorkout || mockTodaysWorkout;
  const displayAchievements = achievements.length > 0 ? achievements : mockAchievements;
  const displayAlerts = alerts.length > 0 ? alerts : [
    {
      type: 'tip' as const,
      title: 'Daily Tip',
      message: 'Stay hydrated! Drink water 2-3 hours before your run for optimal performance.',
      color: 'green' as const
    }
  ];

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

  const weatherInfo = getWeatherInfo(currentWeather.condition);
  const WeatherIcon = weatherInfo.icon;

  if (status === "loading" && !demoMode) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col p-4">
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-4 p-4">
            
            {/* Welcome & Weather Section */}
            <Card className={`relative overflow-hidden bg-gradient-to-br ${weatherInfo.bgFrom} ${weatherInfo.bgTo} ${weatherInfo.darkBgFrom} ${weatherInfo.darkBgTo} text-white border-0`}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  
                  {/* Weather Info */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3">
                        {weatherLoading ? (
                          <Skeleton className="w-8 h-8 rounded-full bg-white/20" />
                        ) : (
                          <WeatherIcon className="w-8 h-8" />
                        )}
                        <div>
                          {weatherLoading ? (
                            <>
                              <Skeleton className="h-8 w-16 bg-white/20" />
                              <Skeleton className="h-4 w-20 bg-white/20 mt-1" />
                            </>
                          ) : (
                            <>
                              <div className="text-2xl font-bold">{currentWeather.temperature}°F</div>
                              <div className="text-blue-100">{currentWeather.condition}</div>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-blue-100 space-y-1">
                        {weatherLoading ? (
                          <>
                            <Skeleton className="h-4 w-24 bg-white/20" />
                            <Skeleton className="h-4 w-20 bg-white/20" />
                          </>
                        ) : (
                          <>
                            <div>Humidity: {currentWeather.humidity}%</div>
                            <div>Wind: {currentWeather.windSpeed} mph</div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h1 className="text-xl font-semibold">Good morning, {userName}!</h1>
                      <p className="text-blue-100">Perfect weather for a run today</p>
                    </div>
                  </div>

                  {/* Primary CTA */}
                  <div className="flex-shrink-0">
                    <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-gray-50 h-14 px-8 text-lg font-semibold shadow-lg">
                      <Link href="/runs/new">
                        <Play className="w-5 h-5 mr-2" />
                        Log Today's Run
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Today's Workout */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-lg">Today's Workout</CardTitle>
                  {workoutLoading ? (
                    <Skeleton className="h-6 w-20 ml-auto" />
                  ) : (
                    <Badge variant="outline" className="ml-auto">
                      {currentWorkout.hasTrainingPlan ? "Training Plan" : "Recommendation"}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {workoutLoading ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <Skeleton className="h-8 w-16 mx-auto" />
                          <Skeleton className="h-4 w-12 mx-auto mt-1" />
                        </div>
                      ))}
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  </>
                ) : currentWorkout.isRestDay ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-green-600 dark:text-green-400 mb-2">Rest Day</h3>
                    <p className="text-gray-600 dark:text-gray-400">Take a well-deserved break to let your body recover</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{currentWorkout.distance}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Distance</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{currentWorkout.pace}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Target Pace</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{currentWorkout.duration}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Duration</div>
                      </div>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-blue-900 dark:text-blue-100">
                          {currentWorkout.hasTrainingPlan ? "Coach's Note" : "General Advice"}
                        </span>
                      </div>
                      <p className="text-blue-800 dark:text-blue-200 text-sm">{currentWorkout.notes}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Weekly Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="hover:shadow-lg transition-shadow duration-200">
                <CardContent className="p-4 text-center">
                  {statsLoading ? (
                    <>
                      <Skeleton className="h-8 w-12 mx-auto" />
                      <Skeleton className="h-4 w-20 mx-auto mt-1" />
                      <Skeleton className="h-2 w-full mt-2" />
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-blue-600">{currentStats.weekMiles}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Miles This Week</div>
                      <Progress value={Math.min((currentStats.weekMiles / 20) * 100, 100)} className="mt-2 h-3" />
                    </>
                  )}
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow duration-200">
                <CardContent className="p-4 text-center">
                  {statsLoading ? (
                    <>
                      <Skeleton className="h-8 w-8 mx-auto" />
                      <Skeleton className="h-4 w-20 mx-auto mt-1" />
                      <Skeleton className="h-2 w-full mt-2" />
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-green-600">{currentStats.weekRuns}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Runs This Week</div>
                      <Progress value={Math.min((currentStats.weekRuns / 5) * 100, 100)} className="mt-2 h-3" />
                    </>
                  )}
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow duration-200">
                <CardContent className="p-4 text-center">
                  {statsLoading ? (
                    <>
                      <Skeleton className="h-8 w-8 mx-auto" />
                      <Skeleton className="h-4 w-16 mx-auto mt-1" />
                      <Skeleton className="h-4 w-4 mx-auto mt-2" />
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-orange-600">{currentStats.currentStreak}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Day Streak</div>
                      <div className="flex items-center justify-center mt-2">
                        <Zap className="w-4 h-4 text-orange-500" />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow duration-200">
                <CardContent className="p-4 text-center">
                  {statsLoading ? (
                    <>
                      <Skeleton className="h-8 w-12 mx-auto" />
                      <Skeleton className="h-4 w-20 mx-auto mt-1" />
                      <Skeleton className="h-2 w-full mt-2" />
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-purple-600">{currentStats.goalProgress}%</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Monthly Goal</div>
                      <Progress value={currentStats.goalProgress} className="mt-2 h-3" />
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Recent Runs */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Recent Runs</CardTitle>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/runs">
                        View All <ExternalLink className="w-4 h-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {runsLoading ? (
                      [...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Skeleton className="w-10 h-10 rounded-full" />
                            <div>
                              <Skeleton className="h-4 w-16" />
                              <Skeleton className="h-3 w-20 mt-1" />
                            </div>
                          </div>
                          <div className="text-right">
                            <Skeleton className="h-4 w-12" />
                            <Skeleton className="h-3 w-16 mt-1" />
                          </div>
                        </div>
                      ))
                    ) : displayRuns.length > 0 ? (
                      displayRuns.map((run) => (
                        <div key={run.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                              <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <div className="font-medium">{run.distance}</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">{run.date}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{run.time}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">{run.pace} pace</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No recent runs found</p>
                        <Button asChild variant="outline" size="sm" className="mt-2">
                          <Link href="/runs/new">Log your first run</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Achievements & Alerts */}
              <div className="space-y-4">
                {/* Achievements */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-yellow-600" />
                      <CardTitle className="text-lg">Recent Achievements</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {achievementsLoading ? (
                      [...Array(2)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <Skeleton className="w-10 h-10 rounded-full" />
                          <div className="flex-1">
                            <Skeleton className="h-4 w-24 mb-1" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                        </div>
                      ))
                    ) : displayAchievements.length > 0 ? (
                      displayAchievements.map((achievement, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                            <achievement.icon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium flex items-center gap-2">
                              {achievement.title}
                              {achievement.isNew && <Badge variant="secondary" className="text-xs">New</Badge>}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">{achievement.description}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                        <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Keep running to unlock achievements!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Tips & Alerts */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Bell className="w-5 h-5 text-blue-600" />
                      <CardTitle className="text-lg">Tips & Alerts</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {achievementsLoading ? (
                      [...Array(2)].map((_, i) => (
                        <div key={i} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <Skeleton className="h-4 w-20 mb-1" />
                          <Skeleton className="h-8 w-full" />
                        </div>
                      ))
                    ) : (
                      displayAlerts.map((alert, index) => {
                        const getAlertVariant = (color: string) => {
                          switch (color) {
                            case 'green':
                              return 'default';
                            case 'orange':
                              return 'destructive';
                            default:
                              return 'default';
                          }
                        };
                        
                        return (
                          <Alert key={index} variant={getAlertVariant(alert.color)} className="border-l-4 border-blue-500">
                            {alert.type === 'tip' ? (
                              <Lightbulb className="h-4 w-4" />
                            ) : alert.type === 'warning' ? (
                              <Bell className="h-4 w-4" />
                            ) : (
                              <Icon iconNode={sneaker} size={16} className="h-4 w-4" />
                            )}
                            <AlertTitle>{alert.title}</AlertTitle>
                            <AlertDescription>{alert.message}</AlertDescription>
                          </Alert>
                        );
                      })
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}