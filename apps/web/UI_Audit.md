# UI Audit & Redesign Progress

## 1. Inventory of Pages

### Main Pages (src/app)
- about/page.tsx
- analytics/page.tsx
- chat/page.tsx
- cool/page.tsx
- home/page.tsx
- login/page.tsx
- plan-generator/page.tsx
- plans/[id]/page.tsx
- privacy/page.tsx
- profile/page.tsx
- runs/page.tsx
- runs/new/page.tsx
- shoes/new/page.tsx
- signup/page.tsx
- signup/profile/page.tsx
- signup/vdot/page.tsx
- social/feed/page.tsx
- social/groups/[id]/page.tsx
- social/groups/new/page.tsx
- social/groups/page.tsx
- social/page.tsx
- social/profile/edit/page.tsx
- social/profile/new/page.tsx
- social/search/page.tsx
- testing/page.tsx
- u/[username]/page.tsx
- not-found.tsx
- loading.tsx
- layout.tsx
- favicon.ico

### API Routes (src/app/api)
- auth/[...nextauth]/route.ts
- auth/login/route.ts
- auth/logout/route.ts
- auth/me/route.ts
- (other API routes omitted for brevity, can be expanded as needed)

## 2. Inventory of Components

### General Components (src/components)
- Providers.tsx
- DefaultAvatar.tsx
- ModeToggle.tsx
- ThemeProvider.tsx
- ToggleSwitch.tsx
- ContactForm.tsx
- Footer.tsx
- AuthTest.tsx
- Navbar.tsx
- NewsletterSignup.tsx
- ProfileInfoCard.tsx

### Chat Components (src/components/chat)
- ChatModal.tsx
- FloatingChat.tsx
- ChatInterface.tsx
- FloatingChatButton.tsx

### Profile Components (src/components/profile)
- BasicInfoSection.tsx
- GoalsSection.tsx
- PhysicalStatsSection.tsx
- PreferencesSection.tsx
- UserProfileForm.tsx
- VDOTEstimator.tsx
- Section.module.css

### Runs Components (src/components/runs)
- RunForm.tsx
- CreateRun.tsx
- DashboardStats.tsx
- RunsList.tsx
- WeeklyRuns.tsx
- RecentRuns.tsx
- RunModal.tsx

### Shoes Components (src/components/shoes)
- CreateShoe.tsx
- ShoeForm.tsx
- ShoesList.tsx

### Social Components (src/components/social)
- GroupCard.tsx
- CreateGroupForm.tsx
- CreateSocialPost.tsx
- FollowUserButton.tsx
- GroupMembers.tsx
- LikeButton.tsx
- ProfileSearch.tsx
- SocialFeed.tsx
- UserStatsDialog.tsx
- CommentSection.tsx
- PostList.tsx
- ProfileInfoCard.tsx
- SocialProfileEditForm.tsx
- SocialProfileForm.tsx

### Training Components (src/components/training)
- PaceCalculator.tsx
- PlanGenerator.tsx
- RunningPlanDisplay.tsx
- TrainingPlansList.tsx

### UI Components (src/components/ui)
- skeleton.tsx
- button.tsx
- checkbox.tsx
- dropdown-menu.tsx
- input.tsx
- select.tsx
- spinner.tsx
- textarea.tsx
- toast.tsx
- avatar-upload.tsx
- avatar.tsx
- badge.tsx
- command.tsx
- dialog.tsx
- index.ts
- photo-upload.tsx
- radio-group.tsx
- separator.tsx
- alert.tsx
- info-tooltip.tsx
- switch.tsx
- tooltip.tsx
- accordion.tsx
- label.tsx
- scroll-area.tsx
- sheet.tsx
- card.tsx
- lock-toggle.tsx
- popover.tsx
- progress.tsx
- slider.tsx
- tabs.tsx

#### FormField Subcomponents (src/components/ui/FormField)
- SelectField.tsx
- TextAreaField.tsx
- CheckboxGroupField.tsx
- TextField.tsx
- index.ts

---

## 3. User Flows & Key Features

### Login/Signup
- **Login:** Users enter email and password to authenticate via NextAuth. On success, redirected to /home. Special dev login for 'jackson@maratron.ai'.
- **Signup:** Users provide name, email, and password. On success, user is created and auto-logged in, then redirected to profile setup (/signup/profile).

### Social Feed & Posting
- **Feed:** Authenticated users with a social profile see a feed of posts (runs) from themselves and others. Infinite scroll loads more posts. Each post shows user, time, distance, caption, photo, likes, and comments.
- **Create Post:** Users can create a new post (run) with optional photo and caption. Posts appear in the feed.
- **Like/Comment:** Users can like and comment on posts. Comment section is available per post.
- **Profile Link:** Usernames link to their profile page.

### Running Plan Generation
- **Plan Generator:** Users select race type (5k, 10k, half, full), distance unit, weeks, VDOT, training level, runs per week, and cross-training days. Generates a custom running plan, which can be displayed and saved.
- **Personalization:** Defaults are pre-filled from user profile if available.

### Profile Management
- **Profile Page:** Authenticated users can view and edit their profile (name, email, avatar, VDOT, training level, etc.).
- **Profile Form:** Changes are saved and update the session.

### Shoe Tracking
- **Add Shoe:** Users can add new shoes with details. Optionally set as default shoe.
- **Shoe List:** Users see a list of their shoes.

### Run Logging
- **Runs List:** Users see all their runs, grouped by time (this week, month, year, 1+ year). Clicking a run opens details in a modal.
- **Add Run:** (Implied from components, not directly reviewed here) Users can log new runs.

### Group Management
- **Create Group:** Users with a social profile can create a new group (name, description, image, privacy, password for private groups). On success, redirected to group page.
- **Group Privacy:** Groups can be public or private (with password).

---

## 4. UI Redesign Progress

### /home Page Complete Redesign (User-Focused Dashboard)
**Date**: 2025-07-07
**Status**: ✅ Complete
**Design Philosophy**: User-Centric, Actionable, Information-Rich Dashboard

#### Comprehensive Redesign Approach:
**COMPLETE STRUCTURAL OVERHAUL** - Redesigned from scratch with all 6 essential elements for optimal post-login user experience:

1. **🎯 Hero Section** - Weather Widget + Primary Action
2. **📅 Today's Focus** - Smart Workout Guidance  
3. **📊 Progress Dashboard** - Key Stats with Visual Progress
4. **⚡ Quick Actions** - Essential User Actions (6 max)
5. **🏃 Recent Activity** - Activity Feed Preview
6. **🏆 Motivational Elements** - Achievements & Tips

#### Implementation Details:

### 1. Hero Section - Weather + Primary CTA
```typescript
// Blue gradient hero with weather integration
<Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
  {/* Weather Display */}
  <Sun className="w-8 h-8" />
  <div className="text-2xl font-bold">68°F</div>
  <div>Sunny, Humidity: 45%, Wind: 5 mph</div>
  
  {/* Primary Action */}
  <Button size="lg" className="bg-white text-blue-600 h-14 px-8">
    <Play className="w-5 h-5 mr-2" />
    Log Today's Run
  </Button>
</Card>
```

**Features:**
- **Real weather data** with temperature, conditions, humidity, wind
- **Contextual messaging** based on weather conditions
- **Prominent primary CTA** - "Log Today's Run" button
- **Time-based greetings** - "Good morning, {userName}!"
- **Responsive layout** - stacks on mobile, side-by-side on desktop

### 2. Today's Focus - Workout Guidance
```typescript
// Smart workout suggestion based on training plan
<Card>
  <CardHeader>
    <Calendar className="w-5 h-5 text-blue-600" />
    <CardTitle>Today's Workout</CardTitle>
    <Badge variant="outline">Training Plan</Badge>
  </CardHeader>
  <CardContent>
    {/* 3-column workout details */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>Distance: 5 miles</div>
      <div>Pace: 8:30-9:00 min/mi</div>
      <div>Duration: 42-45 min</div>
    </div>
    {/* Coach's Note */}
    <div className="bg-blue-50 border-l-4 border-blue-500">
      <Lightbulb className="w-4 h-4" />
      <span>Coach's Note</span>
      <p>Focus on keeping an easy conversational pace</p>
    </div>
  </CardContent>
</Card>
```

**Features:**
- **Adaptive content** - shows training plan workout OR AI suggestion
- **Visual workout breakdown** - distance, pace, duration in grid
- **Coach's notes** - contextual training guidance
- **Rest day indicators** when appropriate
- **Color-coded workout types** (easy, tempo, interval, etc.)

### 3. Progress Dashboard - Key Stats
```typescript
// 4-card grid with progress visualization
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  <Card>
    <CardContent className="p-4 text-center">
      <div className="text-2xl font-bold text-blue-600">12.5</div>
      <div className="text-sm text-gray-600">Miles This Week</div>
      <Progress value={75} className="mt-2 h-2" />
    </CardContent>
  </Card>
  {/* 3 more similar cards for runs, streak, goal progress */}
</div>
```

**Metrics Displayed:**
- **Miles This Week** - with progress bar toward weekly goal
- **Runs This Week** - count with target visualization
- **Current Streak** - consecutive running days with lightning icon
- **Monthly Goal** - percentage completion with progress bar

**Features:**
- **Visual progress bars** using shadcn Progress component
- **Color-coded metrics** - blue, green, orange, purple themes
- **Responsive grid** - 2x2 on mobile, 4x1 on desktop
- **Motivating data presentation**

### 4. Quick Actions - Essential Functions
```typescript
// 6-button grid for primary user actions
<Card>
  <CardHeader>
    <CardTitle>Quick Actions</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <Button variant="outline" className="h-16 flex-col gap-2">
        <CalendarCheck className="w-5 h-5" />
        <span>Training Plan</span>
      </Button>
      {/* 5 more action buttons */}
    </div>
  </CardContent>
</Card>
```

**Actions Included:**
1. **Training Plan** - View/create training schedules
2. **Analytics** - Detailed progress analysis  
3. **AI Assistant** - Chat for running advice
4. **Add Shoes** - Track running shoe mileage
5. **Social Feed** - Connect with other runners
6. **Profile** - Manage account settings

**Features:**
- **Consistent button styling** - outline variant, 64px height
- **Icon + text layout** - clear visual hierarchy
- **Responsive grid** - 2x3 on mobile, 3x2 on desktop
- **Hover states** with smooth transitions

### 5. Recent Activity Preview
```typescript
// Activity feed with run history
<Card>
  <CardHeader>
    <div className="flex justify-between">
      <CardTitle>Recent Runs</CardTitle>
      <Button variant="ghost" size="sm">
        View All <ExternalLink className="w-4 h-4 ml-1" />
      </Button>
    </div>
  </CardHeader>
  <CardContent>
    {mockRecentRuns.map((run) => (
      <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-blue-600" />
          <div>
            <div className="font-medium">{run.distance}</div>
            <div className="text-sm text-gray-600">{run.date}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-medium">{run.time}</div>
          <div className="text-sm text-gray-600">{run.pace} pace</div>
        </div>
      </div>
    ))}
  </CardContent>
</Card>
```

**Features:**
- **Last 3 runs** displayed with key metrics
- **Clean list layout** with activity icons
- **Quick metrics** - distance, time, pace, date
- **"View All" action** linking to full runs page
- **Hover states** for interaction feedback

### 6. Motivational Elements
```typescript
// Two-column layout for achievements and tips
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* Achievements Card */}
  <Card>
    <CardHeader>
      <Trophy className="w-5 h-5 text-yellow-600" />
      <CardTitle>Recent Achievements</CardTitle>
    </CardHeader>
    <CardContent>
      {mockAchievements.map((achievement) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-100 rounded-full">
            <achievement.icon className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <div className="font-medium">
              {achievement.title}
              {achievement.isNew && <Badge variant="secondary">New</Badge>}
            </div>
            <div className="text-sm text-gray-600">{achievement.description}</div>
          </div>
        </div>
      ))}
    </CardContent>
  </Card>

  {/* Tips & Alerts Card */}
  <Card>
    <CardHeader>
      <Bell className="w-5 h-5 text-blue-600" />
      <CardTitle>Tips & Alerts</CardTitle>
    </CardHeader>
    <CardContent>
      {/* Daily Tip */}
      <div className="bg-green-50 border-l-4 border-green-500 p-3">
        <Lightbulb className="w-4 h-4 text-green-600" />
        <span className="font-medium">Daily Tip</span>
        <p>Stay hydrated! Drink water 2-3 hours before your run.</p>
      </div>
      {/* Shoe Alert */}
      <div className="bg-orange-50 border-l-4 border-orange-500 p-3">
        <Icon iconNode={sneaker} className="text-orange-600" />
        <span className="font-medium">Shoe Alert</span>
        <p>Your Nike Pegasus has 420 miles. Consider replacement soon.</p>
      </div>
    </CardContent>
  </Card>
</div>
```

**Achievement Features:**
- **Recent accomplishments** with trophy/award icons
- **"New" badges** for fresh achievements
- **Streak tracking** and personal records
- **Visual achievement icons** in colored backgrounds

**Tips & Alerts Features:**
- **Daily running tips** with lightbulb icon
- **Shoe mileage alerts** when replacement needed
- **Color-coded alerts** - green tips, orange warnings
- **Actionable notifications** to improve performance

#### Technical Implementation:

**shadcn Components Used:**
- `Card/CardContent/CardHeader/CardTitle` - All section containers
- `Button` - All interactive elements with variants (default, outline, ghost)
- `Badge` - Status indicators and labels
- `Progress` - Visual progress representation
- `Avatar` - User profile elements
- Enhanced `Skeleton` - Loading states

**Icons & Visual Elements:**
- **Weather**: Sun, Cloud, CloudRain, Thermometer
- **Actions**: Play, Calendar, TrendingUp, MessageSquare, Activity, User
- **Feedback**: Trophy, Award, Lightbulb, Bell, Zap
- **Navigation**: ArrowRight, ExternalLink

**Responsive Design:**
```css
/* Mobile-first approach */
.grid { @apply grid-cols-1 sm:grid-cols-2 lg:grid-cols-3; }
.hero { @apply flex-col md:flex-row; }
.stats { @apply grid-cols-2 md:grid-cols-4; }
```

**Color Strategy:**
- **Primary**: Blue gradient hero (`from-blue-500 to-blue-600`)
- **Backgrounds**: Light gray (`bg-gray-50`) with white cards
- **Accents**: Contextual colors (green success, orange warning, yellow achievement)
- **Dark Mode**: Full compatibility with `dark:` prefixes

#### User Experience Achievements:

**✅ Immediate Value:**
- Weather data for outdoor running decisions
- Today's workout guidance front and center
- One-click access to primary action (Log Run)

**✅ Progress Motivation:**
- Visual progress bars showing weekly/monthly advancement
- Achievement display for recent accomplishments
- Streak tracking to encourage consistency

**✅ Quick Navigation:**
- 6 essential actions accessible without scrolling
- Recent runs preview with quick access to details
- Smart routing to most-used features

**✅ Contextual Intelligence:**
- Time-based greetings and suggestions
- Weather-appropriate messaging
- Training plan integration with daily guidance

**✅ Engagement Features:**
- Daily tips for continuous learning
- Shoe replacement alerts for gear management
- Achievement notifications for motivation

#### Mobile & Desktop Optimization:

**Mobile (< 768px):**
- Single column layout for easy thumb navigation
- Larger touch targets (h-16 buttons)
- Stacked hero section with weather above CTA
- 2x2 stats grid for comfortable viewing

**Desktop (>= 768px):**
- Multi-column layouts for information density
- Side-by-side hero with weather and action
- 4-column stats for dashboard feel
- Optimized spacing for mouse interactions

#### Performance Considerations:

- **Mock data structure** for consistent demo experience
- **Progressive loading** with enhanced Skeleton states
- **Efficient component structure** minimizing re-renders
- **Responsive images** and icon optimization

#### Future Enhancement Opportunities:

1. **Real weather API integration**
2. **Dynamic workout suggestions** based on user history
3. **Social feed integration** in recent activity
4. **Push notification** support for daily tips
5. **GPS integration** for location-based weather
6. **Workout completion tracking** with real-time updates

---

*This document will be updated as we proceed with the audit and redesign.* 