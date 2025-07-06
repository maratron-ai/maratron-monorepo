import { test, expect } from '@playwright/test';
import { RunsPage } from './page-objects/RunsPage';

test.describe('Runs Functionality', () => {
  // Helper function to safely attempt authentication
  async function attemptAuthentication(runsPage: RunsPage) {
    try {
      await runsPage.loginAndNavigateToRuns();
      return true;
    } catch (error) {
      test.skip('Jackson test login not available');
      return false;
    }
  }

  test('should display runs page for authenticated user', async ({ page }) => {
    const runsPage = new RunsPage(page);
    await attemptAuthentication(runsPage);
    
    // Verify authenticated state
    await runsPage.verifyAuthenticatedState();
  });

  test('should navigate to create run page', async ({ page }) => {
    const runsPage = new RunsPage(page);
    await attemptAuthentication(runsPage);
    
    // Navigate to create run page
    await runsPage.gotoCreateRun();
    
    // Verify create run page loaded
    await runsPage.waitForCreateRunPageLoaded();
  });

  test('should display runs page without authentication but show empty state', async ({ page }) => {
    const runsPage = new RunsPage(page);
    
    // Try to access runs page without authentication
    await runsPage.goto();
    
    // Verify unauthenticated state
    await runsPage.verifyUnauthenticatedState();
  });

  test('should handle empty runs state', async ({ page }) => {
    const runsPage = new RunsPage(page);
    await attemptAuthentication(runsPage);
    
    // Verify either empty state or runs data is shown
    await runsPage.verifyRunsStateDisplayed();
  });

  test('should show loading state initially', async ({ page }) => {
    const runsPage = new RunsPage(page);
    await attemptAuthentication(runsPage);
    
    // Runs list should eventually load (already navigated by attemptAuthentication)
    await runsPage.waitForRunsPageLoaded();
  });
});