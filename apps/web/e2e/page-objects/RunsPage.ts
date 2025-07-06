import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Runs Interface
 * Provides reusable methods and locators for runs functionality testing
 */
export class RunsPage {
  readonly page: Page;
  
  // Primary runs interface elements
  readonly runsHeading: Locator;
  readonly emptyStateMessage: Locator;
  readonly runsThisWeek: Locator;
  readonly signInButton: Locator;
  
  // Create run page elements
  readonly addRunHeading: Locator;
  readonly createRunHeading: Locator;
  
  // Navigation elements
  readonly createRunButton: Locator;
  
  constructor(page: Page) {
    this.page = page;
    
    // Primary interface elements
    this.runsHeading = page.getByRole('heading', { name: 'All Runs' });
    this.emptyStateMessage = page.getByText('No runs recorded yet.');
    this.runsThisWeek = page.getByText('This week');
    this.signInButton = page.getByRole('button', { name: 'Sign In' });
    
    // Create run page elements
    this.addRunHeading = page.getByRole('heading', { name: 'Add a Run' });
    this.createRunHeading = page.getByRole('heading', { name: 'Create a New Run' });
    
    // Navigation elements
    this.createRunButton = page.getByRole('link', { name: 'Add a Run' });
  }

  /**
   * Navigate to the runs page
   */
  async goto() {
    await this.page.goto('/runs');
  }

  /**
   * Navigate to the create run page
   */
  async gotoCreateRun() {
    await this.page.goto('/runs/new');
  }

  /**
   * Login using Jackson test account and navigate to runs
   * Throws error if authentication is not available for test skip
   */
  async loginAndNavigateToRuns() {
    await this.page.goto('/login');
    
    const jacksonButton = this.page.getByRole('button', { name: 'Jackson login' });
    if (await jacksonButton.isVisible()) {
      await jacksonButton.click();
      await this.page.waitForURL('**/home');
      await this.goto();
    } else {
      throw new Error('Jackson test login not available');
    }
  }

  /**
   * Check if runs page is loaded correctly
   */
  async waitForRunsPageLoaded() {
    await expect(this.runsHeading).toBeVisible();
  }

  /**
   * Check if create run page is loaded correctly
   */
  async waitForCreateRunPageLoaded() {
    await expect(this.addRunHeading).toBeVisible();
    await expect(this.createRunHeading).toBeVisible();
  }

  /**
   * Check if empty state is displayed
   */
  async isEmptyStateVisible(): Promise<boolean> {
    return await this.emptyStateMessage.isVisible();
  }

  /**
   * Check if runs exist (This week text visible)
   */
  async hasRunsData(): Promise<boolean> {
    return await this.runsThisWeek.isVisible();
  }

  /**
   * Check if sign in button is visible (unauthenticated state)
   */
  async isSignInButtonVisible(): Promise<boolean> {
    return await this.signInButton.isVisible();
  }

  /**
   * Verify either empty state or runs data is shown
   */
  async verifyRunsStateDisplayed() {
    const emptyStateOrRuns = this.emptyStateMessage.or(this.runsThisWeek);
    await expect(emptyStateOrRuns).toBeVisible();
  }

  /**
   * Navigate to create run page via button
   */
  async clickCreateRun() {
    await this.createRunButton.click();
  }

  /**
   * Verify the page handles unauthenticated state correctly
   */
  async verifyUnauthenticatedState() {
    await this.waitForRunsPageLoaded();
    await expect(this.emptyStateMessage).toBeVisible();
    await expect(this.signInButton).toBeVisible();
  }

  /**
   * Verify the page handles authenticated state correctly
   */
  async verifyAuthenticatedState() {
    await this.waitForRunsPageLoaded();
    await this.verifyRunsStateDisplayed();
  }

  /**
   * Check current URL contains runs
   */
  async isOnRunsPage(): Promise<boolean> {
    return this.page.url().includes('/runs');
  }

  /**
   * Check current URL contains runs/new
   */
  async isOnCreateRunPage(): Promise<boolean> {
    return this.page.url().includes('/runs/new');
  }
}