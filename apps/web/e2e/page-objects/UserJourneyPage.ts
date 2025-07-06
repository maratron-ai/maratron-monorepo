import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for User Journey Testing
 * Provides reusable methods and locators for end-to-end user journey testing
 */
export class UserJourneyPage {
  readonly page: Page;
  
  // Landing page elements
  readonly heroHeading: Locator;
  readonly startNowButton: Locator;
  readonly watchDemoButton: Locator;
  
  // Authentication elements
  readonly jacksonLoginButton: Locator;
  readonly signInButton: Locator;
  
  // Navigation elements
  readonly runsHeading: Locator;
  readonly chatHeading: Locator;
  readonly homePageIndicator: Locator;
  
  // Chat elements
  readonly chatMessageInput: Locator;
  readonly chatSendButton: Locator;
  
  // Mobile detection
  readonly isMobile: boolean;
  
  constructor(page: Page) {
    this.page = page;
    
    // Landing page elements
    this.heroHeading = page.getByText('Your Personal Marathon Coach, Reimagined');
    this.startNowButton = page.getByRole('link', { name: /start now/i }).first();
    this.watchDemoButton = page.getByRole('link', { name: /watch demo/i });
    
    // Authentication elements
    this.jacksonLoginButton = page.getByRole('button', { name: 'Jackson login' });
    this.signInButton = page.getByRole('button', { name: 'Sign In' });
    
    // Navigation elements
    this.runsHeading = page.getByRole('heading', { name: 'All Runs' });
    this.chatHeading = page.getByRole('heading', { name: /Maratron AI Assistant/i });
    this.homePageIndicator = page.getByText(/Welcome back,|Quick Actions/);
    
    // Chat elements
    this.chatMessageInput = page.getByPlaceholder(/Ask about your running/i);
    this.chatSendButton = page.getByRole('button', { type: 'submit' });
    
    // Mobile detection based on viewport
    this.isMobile = false; // Will be set by setMobileViewport
  }

  /**
   * Navigate to the landing page
   */
  async gotoLandingPage() {
    await this.page.goto('/');
  }

  /**
   * Navigate to the login page
   */
  async gotoLoginPage() {
    await this.page.goto('/login');
  }

  /**
   * Navigate to a specific page
   */
  async gotoPage(path: string) {
    await this.page.goto(path);
  }

  /**
   * Set mobile viewport for testing
   */
  async setMobileViewport() {
    await this.page.setViewportSize({ width: 375, height: 667 });
    // Note: isMobile would be set to true here
  }

  /**
   * Verify landing page loads correctly
   */
  async verifyLandingPageLoaded() {
    await expect(this.heroHeading).toBeVisible();
  }

  /**
   * Verify start now button exists and has correct href
   */
  async verifyStartNowButton() {
    await expect(this.startNowButton).toBeVisible();
    await expect(this.startNowButton).toHaveAttribute('href', '/signup');
  }

  /**
   * Attempt authentication with Jackson test account
   * Throws error if authentication fails, allowing test to skip gracefully
   */
  async attemptAuthentication(): Promise<boolean> {
    await this.gotoLoginPage();
    
    if (await this.jacksonLoginButton.isVisible()) {
      await this.jacksonLoginButton.click();
      await this.page.waitForURL('**/home');
      return true;
    } else {
      throw new Error('Jackson test login not available');
    }
  }

  /**
   * Navigate to runs page and verify
   */
  async navigateToRuns() {
    await this.gotoPage('/runs');
    await expect(this.runsHeading).toBeVisible();
  }

  /**
   * Navigate to chat page and verify
   */
  async navigateToChat() {
    await this.gotoPage('/chat');
    await expect(this.chatHeading).toBeVisible();
  }

  /**
   * Send a chat message
   */
  async sendChatMessage(message: string) {
    await this.chatMessageInput.fill(message);
    await this.chatSendButton.click();
    
    // Verify message appears in chat
    await expect(this.page.getByText(message)).toBeVisible();
  }

  /**
   * Navigate to home page and verify
   */
  async navigateToHome() {
    await this.gotoPage('/home');
    // Don't assert here - let tests check what they expect
  }

  /**
   * Test rapid navigation between pages
   */
  async testRapidNavigation() {
    await this.navigateToRuns();
    await this.navigateToChat();
    await this.navigateToHome();
    await this.navigateToRuns();
    
    // Verify final navigation worked
    await expect(this.runsHeading).toBeVisible();
  }

  /**
   * Test 404 error handling
   */
  async test404Handling() {
    await this.gotoPage('/nonexistent-page');
    // Don't assert - let tests check what they expect for 404
  }

  /**
   * Test invalid deep route handling
   */
  async testInvalidDeepRoute() {
    await this.gotoPage('/invalid/deeply/nested/route');
    // Don't assert - let tests check what they expect
  }

  /**
   * Test mobile chat interface
   */
  async testMobileChatInterface() {
    await this.navigateToChat();
    await expect(this.chatMessageInput).toBeVisible();
    
    // Send message on mobile
    const mobileMessage = 'What should I know about running on mobile?';
    await this.sendChatMessage(mobileMessage);
  }

  /**
   * Verify authentication worked by checking home page
   */
  async verifyAuthenticationSuccess() {
    expect(this.page.url()).toContain('/home');
  }

  /**
   * Check if user is currently on a specific page
   */
  async isOnPage(path: string): Promise<boolean> {
    return this.page.url().includes(path);
  }

  /**
   * Get current page URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Wait for navigation to complete
   */
  async waitForNavigation() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Take a screenshot for debugging
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({ 
      path: `test-results/user-journey-${name}.png`,
      fullPage: true 
    });
  }
}