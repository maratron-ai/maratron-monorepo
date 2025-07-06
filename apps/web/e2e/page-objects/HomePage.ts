import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Home Dashboard Page
 * Following Playwright POM best practices
 * https://playwright.dev/docs/pom
 */
export class HomePage {
  readonly page: Page;
  
  // Main sections
  readonly welcomeHeading: Locator;
  readonly signInLink: Locator;
  readonly quickActionsSection: Locator;
  readonly recentRunsSection: Locator;
  readonly weeklyRunsSection: Locator;
  readonly trainingPlanSection: Locator;
  readonly shoesSection: Locator;
  
  // Quick action cards
  readonly addRunAction: Locator;
  readonly generatePlanAction: Locator;
  readonly addShoesAction: Locator;
  readonly editProfileAction: Locator;
  readonly viewAnalyticsAction: Locator;
  readonly uploadWorkoutAction: Locator;
  
  // Loading elements
  readonly skeletonElements: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Main sections
    this.welcomeHeading = page.getByRole('heading', { name: /Welcome/ });
    this.signInLink = page.getByRole('link', { name: 'sign in' });
    this.quickActionsSection = page.getByRole('heading', { name: 'Quick Actions' });
    this.recentRunsSection = page.getByRole('heading', { name: 'Recent Runs' });
    this.weeklyRunsSection = page.getByRole('heading', { name: /This Week.*Runs/ });
    this.trainingPlanSection = page.getByRole('heading', { name: 'Your Training Plan' });
    this.shoesSection = page.getByRole('heading', { name: 'Your Shoes' });
    
    // Quick action cards - using user-facing locators
    this.addRunAction = page.getByRole('link', { name: 'Add a Run' });
    this.generatePlanAction = page.getByRole('link', { name: 'Generate Training Plan' });
    this.addShoesAction = page.getByRole('link', { name: 'Add New Shoes' });
    this.editProfileAction = page.getByRole('link', { name: 'Edit Profile' });
    this.viewAnalyticsAction = page.getByRole('link', { name: 'View progress analytics' });
    this.uploadWorkoutAction = page.getByText('Upload workout file (coming soon)');
    
    // Loading elements
    this.skeletonElements = page.locator('.skeleton, [data-testid="skeleton"]');
  }

  /**
   * Navigate to home page
   */
  async goto(): Promise<void> {
    await this.page.goto('/home');
  }

  /**
   * Verify unauthenticated state
   */
  async verifyUnauthenticatedState(): Promise<void> {
    await expect(this.welcomeHeading).toContainText('Welcome to Maratron');
    await expect(this.page.getByText('Please sign in to access your dashboard')).toBeVisible();
    await expect(this.signInLink).toBeVisible();
  }

  /**
   * Verify authenticated dashboard state
   */
  async verifyAuthenticatedState(): Promise<void> {
    await expect(this.welcomeHeading).toContainText('Welcome back,');
    await expect(this.quickActionsSection).toBeVisible();
    await expect(this.recentRunsSection).toBeVisible();
    await expect(this.weeklyRunsSection).toBeVisible();
    await expect(this.trainingPlanSection).toBeVisible();
    await expect(this.shoesSection).toBeVisible();
  }

  /**
   * Get welcome message text (for username verification)
   */
  async getWelcomeText(): Promise<string | null> {
    return await this.welcomeHeading.textContent();
  }

  /**
   * Verify all quick actions are visible and clickable
   */
  async verifyQuickActions(): Promise<void> {
    const actions = [
      { locator: this.addRunAction, url: '/runs/new' },
      { locator: this.generatePlanAction, url: '/plan-generator' },
      { locator: this.addShoesAction, url: '/shoes/new' },
      { locator: this.editProfileAction, url: '/profile' },
      { locator: this.viewAnalyticsAction, url: '/analytics' }
    ];

    for (const action of actions) {
      await expect(action.locator).toBeVisible();
      await expect(action.locator).toHaveAttribute('href', action.url);
    }

    // Upload workout should be visible but not clickable
    await expect(this.uploadWorkoutAction).toBeVisible();
  }

  /**
   * Click a specific quick action
   */
  async clickQuickAction(action: 'addRun' | 'generatePlan' | 'addShoes' | 'editProfile' | 'viewAnalytics'): Promise<void> {
    const actionMap = {
      addRun: this.addRunAction,
      generatePlan: this.generatePlanAction,
      addShoes: this.addShoesAction,
      editProfile: this.editProfileAction,
      viewAnalytics: this.viewAnalyticsAction
    };

    await actionMap[action].click();
  }

  /**
   * Check if page is in loading state
   */
  async isLoading(): Promise<boolean> {
    const skeletonCount = await this.skeletonElements.count();
    return skeletonCount > 0;
  }

  /**
   * Wait for page to finish loading
   */
  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    // Wait for skeletons to disappear
    await expect(this.skeletonElements).toHaveCount(0, { timeout: 5000 });
  }

  /**
   * Verify responsive behavior on mobile
   */
  async verifyMobileLayout(): Promise<void> {
    await this.page.setViewportSize({ width: 375, height: 667 });
    await expect(this.quickActionsSection).toBeVisible();
    
    // On mobile, quick actions should be stacked (grid changes)
    const quickActionsContainer = this.page.locator('section').filter({ hasText: 'Quick Actions' });
    await expect(quickActionsContainer).toBeVisible();
  }

  /**
   * Verify accessibility standards
   */
  async verifyAccessibility(): Promise<void> {
    // Check for single H1
    const h1Elements = this.page.locator('h1');
    await expect(h1Elements).toHaveCount(1);
    
    // Check images have alt text
    const images = this.page.locator('img');
    const imageCount = await images.count();
    
    if (imageCount > 0) {
      for (let i = 0; i < imageCount; i++) {
        await expect(images.nth(i)).toHaveAttribute('alt');
      }
    }
  }
}