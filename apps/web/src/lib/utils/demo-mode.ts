// Demo mode utility for Puppeteer testing
export const isDemoMode = () => {
  return process.env.NODE_ENV === 'development' && 
         typeof window !== 'undefined' && 
         window.location.search.includes('demo=true');
};

// Sample analytics data for demo mode
export const getDemoAnalyticsData = () => ({
  totalRuns: 42,
  totalDistance: 234.5,
  totalTime: 1856, // minutes
  averagePace: "7:55",
  longestRun: 13.1,
  weeklyAverage: 18.4,
  monthlyTrend: [
    { week: "Week 1", distance: 15.2, runs: 3, weekDate: "2024-01-01", weekStart: new Date('2024-01-01') },
    { week: "Week 2", distance: 18.7, runs: 4, weekDate: "2024-01-08", weekStart: new Date('2024-01-08') },
    { week: "Week 3", distance: 22.1, runs: 4, weekDate: "2024-01-15", weekStart: new Date('2024-01-15') },
    { week: "Week 4", distance: 19.3, runs: 3, weekDate: "2024-01-22", weekStart: new Date('2024-01-22') },
  ],
  paceProgression: [
    { month: "Jan", pace: "8:15", paceMinutes: 8.25, monthDate: "2024-01", weekStart: new Date('2024-01-01') },
    { month: "Feb", pace: "8:05", paceMinutes: 8.08, monthDate: "2024-02", weekStart: new Date('2024-02-01') },
    { month: "Mar", pace: "7:55", paceMinutes: 7.92, monthDate: "2024-03", weekStart: new Date('2024-03-01') },
  ],
  distanceDistribution: [
    { range: "1-3 miles", count: 15, percentage: 36 },
    { range: "3-6 miles", count: 18, percentage: 43 },
    { range: "6-10 miles", count: 7, percentage: 17 },
    { range: "10+ miles", count: 2, percentage: 5 },
  ],
  weeklyDistanceChart: [
    { week: "Week 1", distance: 15.2, runs: 3, weekStart: new Date('2024-01-01'), weekTimestamp: new Date('2024-01-01').getTime() },
    { week: "Week 2", distance: 18.7, runs: 4, weekStart: new Date('2024-01-08'), weekTimestamp: new Date('2024-01-08').getTime() },
    { week: "Week 3", distance: 22.1, runs: 4, weekStart: new Date('2024-01-15'), weekTimestamp: new Date('2024-01-15').getTime() },
    { week: "Week 4", distance: 19.3, runs: 3, weekStart: new Date('2024-01-22'), weekTimestamp: new Date('2024-01-22').getTime() },
  ],
  cumulativeDistance: [
    { month: "Jan", total: 65.4, weekStart: new Date('2024-01-01'), weekTimestamp: new Date('2024-01-01').getTime() },
    { month: "Feb", total: 134.8, weekStart: new Date('2024-02-01'), weekTimestamp: new Date('2024-02-01').getTime() },
    { month: "Mar", total: 234.5, weekStart: new Date('2024-03-01'), weekTimestamp: new Date('2024-03-01').getTime() },
  ],
});

// Sample user data for demo mode
export const getDemoUserData = () => ({
  id: "demo-user-123",
  name: "Demo Runner",
  email: "demo@maratron.com",
  age: 28,
  gender: "Male" as const,
  height: 175,
  weight: 70,
  trainingLevel: "intermediate" as const,
  VDOT: 45,
  weeklyMileageGoal: 30,
  raceGoals: "Sub-20 5K, Sub-1:30 Half Marathon",
  preferredUnits: "metric" as const,
  avatarUrl: null,
  selectedCoachId: null,
  selectedCoach: null,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-15"),
});

// Sample social profile data for demo mode
export const getDemoSocialProfile = () => ({
  id: "demo-social-123",
  userId: "demo-user-123",
  displayName: "Demo Runner",
  bio: "Passionate runner working towards my first marathon! Love sharing the journey with fellow runners.",
  location: "Demo City, DC",
  profilePhoto: null,
  isPublic: true,
  followersCount: 42,
  followingCount: 38,
  postsCount: 15,
  totalDistance: 234.5,
  totalRuns: 42,
  averagePace: "7:55",
  user: {
    id: "demo-user-123",
    name: "Demo Runner",
    email: "demo@maratron.com",
  },
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-15"),
});

// Sample run groups for demo mode
export const getDemoRunGroups = () => [
  {
    id: "demo-group-1",
    name: "Morning Runners Club",
    description: "Early birds who love sunrise runs",
    memberCount: 25,
    isMember: true,
    isPublic: true,
    location: "Demo City Park",
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "demo-group-2", 
    name: "Marathon Training Squad",
    description: "Training for upcoming marathons together",
    memberCount: 18,
    isMember: true,
    isPublic: true,
    location: "Demo Running Track",
    createdAt: new Date("2024-02-01"),
  },
];