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

*This document will be updated as we proceed with the audit and redesign.* 